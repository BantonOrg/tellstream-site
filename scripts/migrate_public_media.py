#!/usr/bin/env python3
"""Copy existing public Supabase flyer and member-photo images to hosted assets.

Non-destructive: never mutates Supabase and never modifies any application code.
It writes two manifests so readers can use hosted copies when available.
"""
import json
import os
import pathlib
import re
import sys
import time
import urllib.error
import urllib.parse
import urllib.request

BASE = "https://vegwferwmyuunwvfqpsf.supabase.co"
ROOT = pathlib.Path("src/assets")
HEADERS = {"User-Agent": "TellStream-existing-public-assets-migration/1.0"}
LIMIT = 100
MAX_ASSETS = 1500
MAX_BYTES = 20 * 1024 * 1024  # Cloudflare Pages limit is 25 MiB per asset
VALID_EXTS = {".jpg", ".jpeg", ".png", ".gif", ".webp", ".avif"}
SKIPS = {}
FAILS = {}

source = pathlib.Path("main.original.js").read_text(encoding="utf-8")
match = re.search(r'const SUPABASE_KEY = "([^"]+)"', source)
if not match:
    sys.exit("Supabase public anon key not found")
KEY = match.group(1)
API_HEADERS = {**HEADERS, "apikey": KEY, "Authorization": "Bearer " + KEY}

def request_json(url, data=None):
    req = urllib.request.Request(
        url, data=None if data is None else json.dumps(data).encode("utf-8"),
        headers={**API_HEADERS, **({"Content-Type": "application/json"} if data is not None else {})},
        method="POST" if data is not None else "GET"
    )
    with urllib.request.urlopen(req, timeout=35) as response:
        return json.load(response)

def safe_name(value):
    if not isinstance(value, str) or not value or len(value) > 512:
        return False
    if value.startswith("/") or "\\" in value or "\x00" in value:
        return False
    bits = value.split("/")
    return all(part not in ("", ".", "..") and not part.startswith(".") for part in bits)

def valid_image(data, ext):
    if ext == ".png":
        return data.startswith(b"\x89PNG\r\n\x1a\n")
    if ext in (".jpg", ".jpeg"):
        return data.startswith(b"\xff\xd8\xff")
    if ext == ".gif":
        return data.startswith((b"GIF87a", b"GIF89a"))
    if ext == ".webp":
        return data.startswith(b"RIFF") and data[8:12] == b"WEBP"
    if ext == ".avif":
        return data[4:8] == b"ftyp" and b"avif" in data[8:32]
    return False

def folder_listing(bucket):
    """List all folders, paginating each prefix."""
    found, prefixes = set(), [""]
    seen = set()
    while prefixes:
        prefix = prefixes.pop()
        if prefix in seen:
            continue
        seen.add(prefix)
        offset = 0
        while True:
            url = BASE + "/storage/v1/object/list/" + bucket
            batch = request_json(url, {"prefix": prefix, "limit": LIMIT, "offset": offset,
                                      "sortBy": {"column": "name", "order": "asc"}})
            if not isinstance(batch, list):
                raise RuntimeError("Unexpected list response for bucket " + bucket)
            for entry in batch:
                name = entry.get("name", "")
                full = prefix + name
                if not safe_name(full):
                    continue
                if entry.get("id") is None and entry.get("metadata") is None:
                    prefixes.append(full.rstrip("/") + "/")
                else:
                    found.add(full)
            if len(batch) < LIMIT:
                break
            offset += LIMIT
    return found

def member_table_filenames():
    found = set()
    offset = 0
    while True:
        url = BASE + "/rest/v1/member_photos?select=file_name&limit=" + str(LIMIT) + "&offset=" + str(offset)
        batch = request_json(url)
        for row in batch:
            path = row.get("file_name", "")
            if safe_name(path):
                found.add(path)
        if len(batch) < LIMIT:
            break
        offset += LIMIT
    return found

def download(bucket, filename):
    encoded = "/".join(urllib.parse.quote(segment, safe="") for segment in filename.split("/"))
    url = BASE + "/storage/v1/object/public/" + bucket + "/" + encoded
    request = urllib.request.Request(url, headers=API_HEADERS)
    with urllib.request.urlopen(request, timeout=50) as response:
        data = response.read(MAX_BYTES + 1)
    if len(data) > MAX_BYTES:
        raise ValueError("oversized image")
    ext = pathlib.PurePosixPath(filename).suffix.lower()
    if not valid_image(data, ext):
        raise ValueError("invalid image signature")
    return data

def copy_bucket(bucket, folder):
    files = set()
    listing_ok = False
    try:
        files.update(folder_listing(bucket))
        listing_ok = True
    except Exception as err:
        print("Storage listing unavailable:", bucket, repr(err))
    if bucket == "member-photos":
        try:
            files.update(member_table_filenames())
            print("Combined member-photo file listing and DB file references")
        except Exception as err:
            print("Member photos database listing unavailable:", repr(err))
    if not listing_ok and not files:
        raise RuntimeError("Cannot enumerate any files for " + bucket)
    if len(files) > MAX_ASSETS:
        raise RuntimeError("Too many assets in " + bucket + ": " + str(len(files)))
    output = ROOT / folder
    output.mkdir(parents=True, exist_ok=True)
    saved = []
    skipped = []
    failed = []
    for i, name in enumerate(sorted(files)):
        if not safe_name(name):
            skipped.append((name, "unsafe path"))
            continue
        if pathlib.PurePosixPath(name).suffix.lower() not in VALID_EXTS:
            skipped.append((name, "unsupported extension"))
            continue
        try:
            data = download(bucket, name)
            dest = output.joinpath(*name.split("/"))
            dest.parent.mkdir(parents=True, exist_ok=True)
            dest.write_bytes(data)
            saved.append({"path": name, "bytes": len(data)})
        except Exception as err:
            failed.append((name, str(err)[:100]))
        if (i + 1) % 30 == 0:
            print(bucket + ": processed", i + 1, "of", len(files))
    manifest = {
        "source": "public Supabase Storage " + bucket + " bucket",
        "copied": len(saved), "listed": len(files),
        "files": saved, "incomplete": bool(failed or skipped),
        "skipped_count": len(skipped), "failed_count": len(failed)
    }
    (output / "manifest.json").write_text(
        json.dumps(manifest, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print("BUCKET RESULT", bucket, "listed", len(files), "copied", len(saved),
          "skipped", len(skipped), "failed", len(failed), "list_available", listing_ok)
    for name, reason in skipped[:30]:
        print("SKIPPED", bucket, repr(name), reason)
    for name, reason in failed[:30]:
        print("FAILED", bucket, repr(name), reason)
    SKIPS[bucket] = skipped
    FAILS[bucket] = failed
    if files and not saved:
        raise RuntimeError("No public images copied for " + bucket)

copy_bucket("flyers", "flyers")
copy_bucket("member-photos", "member-photos")
if any(FAILS.values()):
    print("WARNING: Some files failed to copy. Check logs before switching image paths.")
print("Migration completed without altering Supabase originals.")
