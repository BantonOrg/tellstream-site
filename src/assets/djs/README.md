# TellStream DJ images

The PNG files in this folder are the **original presenter images**, copied byte-for-byte from the former Supabase `dj-logos` bucket.

Both the on-air DJ image and the **Meet the DJs** pop-up load portraits from this location on Cloudflare Pages: `/src/assets/djs/<filename>.png`.

## Add or replace a DJ image

In the GitHub repository, open `src/assets/djs`, choose **Add file → Upload files**, upload the original transparent PNG under its matching filename, and commit. Cloudflare Pages then publishes the hosted file.

The DJ gallery lists DJs from `master_schedule` using the **first two words** of their scheduled names and skips repeated filename identities. The filename mapping is in `dj-logo-filename-fix.js`. For a name without an existing alias, two lowercase words joined by an underscore form its filename (e.g. `New DJ` → `new_dj.png`).

If an image has not yet been uploaded, Meet the DJs shows initials rather than borrowing or altering somebody else's photograph. The on-air banner falls back to its text presentation.

## Missing images at migration

`dj_choice.png` and `milo.png` were not available at the time of migration and were not fabricated. The separately existing `milo_medina_int.png` was copied unchanged; do not assume the missing `milo.png` is the same presenter.

**Do not delete the old Supabase originals until the deployed hosted images are verified.**
