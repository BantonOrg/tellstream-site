# TellStream member photo gallery: archived originals

Original existing public photos were copied byte-for-byte from the public Supabase `member-photos` bucket, preserving member subfolders.

The profile gallery uses `member_photos` database records to decide which images are visible. For archived file paths in `manifest.json`, the browser displays the Cloudflare-hosted copy; for new or unarchived photos it displays the original Supabase URL.

**Important:** Visitor uploads, the nine-photo rotation, and delete operations still use the existing Supabase Storage and database workflow. A static GitHub/Cloudflare Pages folder cannot accept authenticated member uploads or immediately delete a user photo. Deleting a photo record from the website currently does **not** delete its archived GitHub copy. The site administrator must account for those archived originals and preserve deletion rights. Do not treat this as a completed dynamic-storage migration; a secure writable Cloudflare service with delete support is required before Supabase can be retired.

Do not delete original Supabase files as part of this staged migration.
