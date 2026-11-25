# TellStream DJ photographs — original hosted archive and R2 updates

The 18 PNGs in this folder are the unmodified original presenter photographs, copied from the former Supabase DJ logo bucket. They remain on Cloudflare Pages as **fallbacks**.

**New DJ photographs, replacements and admin removals are now managed by Cloudflare R2.** Station Admins use the TellStream chat:

- `/upload Squidly Bashment` — opens a PNG picker. TellStream uploads the image securely under `djs/squidly_bashment.png` in R2.
- `/delete Squidly Bashment` — removes the R2 image and hides any older image of the same filename from the on-air rotation and gallery.

No source-code, GitHub upload or website redeployment is needed for these commands after the R2 media API is deployed. The server verifies the admin's existing chat password and access level before writing to R2.

The gallery still obtains its roster from `master_schedule`: the **first two words** of each show/DJ define the portrait filename, through `dj-logo-filename-fix.js`. Repeated DJs are omitted. The DJ image lookup uses an R2 copy if present; otherwise it uses the original PNG in this folder. Missing portraits show initials in the gallery, not a borrowed face.

**Archived-image caveat:** A R2 deletion marker hides an older static image from the website interface, but the original PNG stays directly accessible at its old static GitHub/Cloudflare URL until explicitly removed from this folder.

These files are originals; no alterations or AI recreations should be made.
