# Legacy member photo archive — requires cleanup

This directory contains a preserved public original photo previously stored in Supabase. New authenticated VIP/DJ uploads and deletions use Cloudflare R2, while the existing `member_photos` table remains the gallery index.

**Privacy limitation:** A member can delete their photo from the gallery, but that does not erase the older archived copy from GitHub/Cloudflare static hosting. To honour deletion requests, migrate archived pictures into R2, confirm they are accessible from R2, then remove the old source files and references from GitHub.

Do not mistake deletion from the member database for removal of the public image bytes. The required archival cleanup is tracked in `R2_MEDIA_SETUP.md`.
