# Legacy hosted flyer and avatar archive

These four original files were copied from the now-deleted Supabase `flyers` bucket and preserved byte-for-byte. The static website serves these historical copies.

**Current admin flyer uploads and deletions use authenticated Cloudflare R2** through `/api/media`, not GitHub or Supabase Storage. R2 flyers are listed alongside still-hosted archive pictures. R2 deletion markers hide archived flyers in the event listings, but the corresponding GitHub file remains accessible by its old URL until it is removed from the repository.

Historical avatar images here are retained as display fallbacks. New avatar changes go to R2.

Keep manifest data and source removal in sync if retiring this archive.
