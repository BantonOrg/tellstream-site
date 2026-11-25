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
- `GET /api/media/file?key=...`: public image delivery for approved R2 image prefixes.
- `POST /api/media`: password-verified member photo, avatar or admin flyer upload.
- `DELETE /api/media`: password-verified owner-bound member photo deletion; station-admin-only flyer removal.

For **every write**, the server runs TellStream's existing `verify_user_passkey` RPC with the presented username/password. It then checks current `secured_profiles` authorization directly; privileges claimed by browser code are ignored. It never uses the Supabase service-role key. Images are checked for valid PNG/JPEG/WebP signatures and size limits. The live `tellstream.banton.org` host is the only one allowed to write, to prevent preview builds mutating production data.

Member photos continue to use `member_photos` records, and avatars use `secured_profiles.avatar_url`. The nine-photo limit is enforced on new uploads. The original static DJ portraits and clickable presenter flyer are unaffected.

## Critical test sequence before public launch

1. Make sure `SUPABASE_ANON_KEY` is configured in **Production**. Test `/api/media?kind=flyers` loads a JSON response, not a 404/503.
2. As a real Station Admin, upload one dated event flyer using `/uploadflyer 010127_test_event` and confirm the image appears and opens at full size.
3. Delete that test flyer with `/deleteflyer 010127_test_event` and check it disappears. Check that historical hosted flyers remain displayed.
4. As a verified VIP/DJ, use `/upload image`, then open your profile photo gallery. Confirm an unauthorized member cannot delete another person's photo.
5. Save a new profile avatar; confirm the avatar URL points to `/api/media/file?key=...`, not Supabase Storage.
6. Confirm existing DJ images, the clickable DJ gallery flyer, games, chat and schedules still work.

### Not yet resolved: historical static copies and legacy authentication

**Existing member photographs in `src/assets/member-photos/` remain publicly reachable in the GitHub website even after a member deletes their database record.** The new API cannot remove GitHub files. These archives must be copied to R2 and then deleted from the source repository, with a verifiable cleanup path, before we can promise complete member-photo deletion.

Other original archived `src/assets/flyers` images can be hidden by an R2 deletion marker, but the original direct static URLs persist until the GitHub assets are removed.

The website currently stores chat passwords in browser localStorage and uses a custom Supabase password RPC, not Supabase Auth sessions. This replacement verifies credentials **server-side** before writes, but does **not** remedy every pre-existing credential, row-level security or rate-limiting concern. Review Supabase table policies and implement Cloudflare rate limiting before exposing frequent uploads publicly.

Do not merge this feature branch into `main` until the production variable is configured and the behaviour above has been reviewed. No deleted Supabase Storage buckets are required by the new code.
