#!/usr/bin/env python3
"""Rebuild hosted photo manifests after a GitHub asset add/delete."""
import json
import pathlib
ROOT = pathlib.Path("src/assets")
EXTENSIONS = {".png", ".jpg", ".jpeg", ".gif", ".webp", ".avif"}
for bucket in ("flyers", "member-photos"):
    folder = ROOT / bucket
    folder.mkdir(parents=True, exist_ok=True)
    entries = []
    for path in sorted(folder.rglob("*")):
        if path.is_file() and path.suffix.lower() in EXTENSIONS:
            relative = path.relative_to(folder).as_posix()
            entries.append({"path": relative, "bytes": path.stat().st_size})
    manifest_path = folder / "manifest.json"
    existing = json.loads(manifest_path.read_text()) if manifest_path.exists() else {}
    result = {
        "source": existing.get("source", "Hosted TellStream assets"),
        "copied": len(entries),
        "listed": len(entries),
        "files": entries,
        "incomplete": False,
        "skipped_count": 0,
        "failed_count": 0,
    }
    serialized = json.dumps(result, indent=2, ensure_ascii=False) + "\n"
    manifest_path.write_text(serialized, encoding="utf-8")
    print(bucket, len(entries), "hosted image(s)")
