# TellStream secure R2 media — deployment and checks

## Production Cloudflare configuration

The production Pages project `tellstream-site` must have the R2 binding:
- **Type:** R2 bucket
- **Name:** `MEDIA`
- **Bucket:** `tellstream-media`

This is already visible in the project dashboard.

In **Workers & Pages → tellstream-site → Settings → Variables and secrets**, add a runtime secret/variable named `SUPABASE_ANON_KEY` with the project's **publishable/anon API key** (the same public anon key already used by TellStream's Supabase JS client). **Do not use the service_role key.** The Function intentionally refuses writes while this variable is missing. `SUPABASE_URL` can optionally override the existing project URL.

Pages Functions in `functions/api/media/` are deployed automatically by the Cloudflare Pages Git integration. `MEDIA` is accessed only server-side from `context.env.MEDIA`. Visitors never receive R2 credentials.

## What works through the new endpoints

- `GET /api/media?kind=flyers`: public list of R2 flyers and hidden archived flyer names.
- `GET /api/media?kind=djs`: public R2 DJ filenames and deletion markers, shared by the on-air banner and Meet the DJs.
- `GET /api/media/file?key=...`: public image delivery for approved R2 image prefixes.
- `POST /api/media`: password-verified member photo, avatar, Station Admin flyer **or DJ PNG** upload.
- `DELETE /api/media`: password-verified owner-bound member photo deletion; Station Admin flyer or DJ image removal.

For **every write**, the server runs TellStream's existing `verify_user_passkey` RPC with the presented username/password. It then checks current `secured_profiles` authorization directly; privileges claimed by browser code are ignored. It never uses the Supabase service-role key. Images are checked for valid PNG/JPEG/WebP signatures and size limits. The live `tellstream.banton.org` host is the only one allowed to write, to prevent preview builds mutating production data.

Member photos continue to use `member_photos` records, and avatars use `secured_profiles.avatar_url`. The nine-photo limit is enforced on new uploads. The original static DJ portraits remain in `src/assets/djs/` as fallbacks, while new/replacement DJ PNGs reside under `djs/` in R2. **The original clickable presenter flyer remains unchanged.**

## Critical test sequence before public launch

1. Confirm the existing R2 `MEDIA` binding and `SUPABASE_ANON_KEY` in **Production**. Test `/api/media?kind=flyers` and `/api/media?kind=djs` load JSON responses, not 404/503.
2. As a real Station Admin, enter `/upload Squidly Bashment` and choose an original PNG file. Confirm the image appears in Meet the DJs once that DJ is scheduled, and in the on-air banner when that DJ is live. Confirm existing DJs still show their hosted original PNGs.
3. Upload one dated event flyer using `/uploadflyer 010127_test_event`, open it at full size, then delete it using `/deleteflyer 010127_test_event`. Confirm historical hosted flyers remain displayed.
4. As a verified VIP/DJ, use `/upload image`, then open your profile photo gallery. Confirm an unauthorized member cannot delete another person's photo, and test that DJ removal is restricted to Station Admins.
5. Save a new profile avatar; confirm the avatar URL points to `/api/media/file?key=...`, not Supabase Storage.
6. Confirm existing DJ images, the clickable DJ gallery flyer, games, chat and schedules still work.

### Not yet resolved: historical static copies and legacy authentication

**Existing member photographs in `src/assets/member-photos/` remain publicly reachable in the GitHub website even after a member deletes their database record.** The new API cannot remove GitHub files. These archives must be copied to R2 and then deleted from the source repository, with a verifiable cleanup path, before we can promise complete member-photo deletion.

Original archived `src/assets/flyers/` **and `src/assets/djs/`** images can be hidden in TellStream's interface by R2 deletion markers, but their direct GitHub/static URLs persist until the corresponding source files are removed.

The website currently stores chat passwords in browser localStorage and uses a custom Supabase password RPC, not Supabase Auth sessions. This replacement verifies credentials **server-side** before writes, but does **not** remedy every pre-existing credential, row-level security or rate-limiting concern. Review Supabase table policies and implement Cloudflare rate limiting before exposing frequent uploads publicly.

The user confirmed adding the `SUPABASE_ANON_KEY` production variable on 25 November 2026; the actual Cloudflare secret value is not readable from GitHub. Test deployment and production upload behaviour before considering the migration fully verified. No deleted Supabase Storage buckets are required by the new code.
