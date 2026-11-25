# TellStream event flyers and legacy profile avatars

Original public images were copied byte-for-byte from the former Supabase `flyers` bucket.

**Event flyers** belong in this folder. Use a six-digit `DDMMYY` prefix, such as `010127_welcome_to_tellstream.jpg`. GitHub's **Add file → Upload files** and file deletion are the management tools. Changes on `main` trigger a workflow that rebuilds `manifest.json` and Cloudflare Pages then republishes the site. Only dated files are shown as event flyers; user avatar files are deliberately excluded.

For existing `avatars_*.png` profile images, the site resolves their previously stored Supabase URLs to the hosted copy when present. New profile-avatar uploads currently still use Supabase until a secure live-upload replacement is deployed. They fall back to their original URL and are **not automatically copied** here.

Do not remove originals from Supabase until all relevant image displays and write paths have been verified.
