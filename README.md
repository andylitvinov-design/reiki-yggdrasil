# Reiki Yggdrasil Prototype

React/Vite prototype for the Reiki Yggdrasil piano-style learning platform.

## Local run

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## Domains

- Target production URL: `https://mentalica.vercel.app`
- Current/legacy URL until migration is fully verified: `https://reiki-yggdrasil.vercel.app`

The frontend OAuth redirect flow uses `window.location.origin`, so the app should work on the active Vercel domain after the domain alias and Supabase Auth redirects are configured. Keep both target and legacy redirect URLs during the migration window.

## Release workflow: черновой и чистовой сайт

The deployment concept is documented in `docs/release-workflow.md`.

Target model:

- `main` → черновой/test-сайт for owner QA, expected Vercel project `2mentalica`, expected URL `https://2mentalica.vercel.app`.
- `production` → чистовой/client live-сайт for stable client access.
- `release/*` → frozen release branches created from `main` after owner QA and merged into `production` only after final checks.

Normal work should target `main`. Client-facing releases should go through `release/*` and then `production`. Do not expose env values or change production domains during normal development.

## Profile cabinet setup

The profile cabinet MVP is routed at `/profile`, `/masters`, and `/profile/admin`.
It uses Supabase public REST/auth with frontend env names only:

```bash
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_ADMIN_EMAIL=
```

Do not put env values or service-role keys in the repository or frontend.

Supabase setup steps:

1. Apply `supabase/migrations/20260526063307_profile_cabinet_mvp.sql`.
2. Apply `supabase/migrations/20260526063321_profile_cabinet_rls_followup.sql`.
3. Apply `supabase/migrations/20260526064404_profile_cabinet_security_lints.sql`.
4. Apply `supabase/migrations/20260526121859_profile_cabinet_publication_step_fields.sql`.
5. Apply `supabase/migrations/20260527070251_20260526_power_place_persistence.sql`.
6. Apply `supabase/migrations/20260527070310_20260526_power_place_upgrade_5_business_dao.sql`.
7. Apply `supabase/migrations/20260527070353_20260526_power_place_upgrade_6_zodiac_chat.sql`.
8. Apply `supabase/migrations/20260527120000_profile_cabinet_media_storage.sql`.
9. Apply `supabase/migrations/20260527143000_power_place_star_format.sql`.
10. Apply `supabase/migrations/20260529090000_master_services_orders_mvp.sql`.
11. Apply `supabase/migrations/20260531090000_power_place_chess_format.sql`.
12. Apply `supabase/migrations/20260602120000_power_place_chess_compact_variant.sql`.
13. Apply `supabase/migrations/20260605120000_grimoire_publication_types.sql`.
14. Apply `supabase/migrations/20260605153000_service_orders_client_phase4.sql`.
15. Apply `supabase/migrations/20260605184500_service_orders_result_delivery_phase5.sql`.
16. Add these auth redirect URLs in Supabase for the target domain:
    - `https://mentalica.vercel.app/profile`
    - `https://mentalica.vercel.app/profile/admin`
17. Keep these legacy auth redirect URLs until the migration is fully verified:
    - `https://reiki-yggdrasil.vercel.app/profile`
    - `https://reiki-yggdrasil.vercel.app/profile/admin`
18. For the `2mentalica` staging project, add these auth redirect URLs if OAuth is tested there:
    - `https://2mentalica.vercel.app/profile`
    - `https://2mentalica.vercel.app/profile/admin`
19. Add the Vercel production or staging env vars named above, depending on the target Vercel project.
20. After the first admin login, insert that user's `user_id` and email into `profile_cabinet_admins`.

Use the production `VITE_ADMIN_EMAIL` value in the placeholder below. Do not commit or paste the real email into the repo:

```sql
insert into public.profile_cabinet_admins (user_id, email)
select id, email
from auth.users
where email = '<VITE_ADMIN_EMAIL value>'
on conflict (user_id) do update set email = excluded.email;
```

Google OAuth setup:

1. Enable the Google provider in Supabase Auth.
2. Configure Google OAuth credentials in the Supabase dashboard.
3. Add the Supabase callback URL from the Supabase dashboard to Google Cloud OAuth redirect URIs.
4. Add these target auth redirect URLs in Supabase:
   - `https://mentalica.vercel.app/profile`
   - `https://mentalica.vercel.app/profile/admin`
5. Keep these legacy auth redirect URLs until the migration is fully verified:
   - `https://reiki-yggdrasil.vercel.app/profile`
   - `https://reiki-yggdrasil.vercel.app/profile/admin`
6. For preview deployments, add the relevant Vercel preview URL if testing OAuth on preview.
7. For the `2mentalica` staging site, also add the `https://2mentalica.vercel.app/profile` and `https://2mentalica.vercel.app/profile/admin` redirect URLs before OAuth QA.

## Domain migration checklist

Before switching production traffic to `https://mentalica.vercel.app`:

1. Confirm the Vercel project is the same project connected to `andylitvinov-design/reiki-yggdrasil`.
2. Confirm `mentalica.vercel.app` is assigned to the intended Vercel project.
3. Confirm Vercel production env names are configured:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_ADMIN_EMAIL`
4. Confirm Supabase Auth Site URL and Redirect URLs include the target `/profile` and `/profile/admin` URLs.
5. Keep the old `reiki-yggdrasil.vercel.app` redirects during transition.
6. Verify:
   - `https://mentalica.vercel.app/`
   - `https://mentalica.vercel.app/profile`
   - `https://mentalica.vercel.app/masters`
   - `https://mentalica.vercel.app/profile/admin`
   - Google login from `/profile`
   - Google login/admin access from `/profile/admin`
   - no console errors
   - desktop three-column layout remains intact
   - mobile layout under 980px remains usable

Power Place persistence setup:

- `20260527070251_20260526_power_place_persistence.sql` adds the profile `account_plan`, client/goal photo references, tradition image references, and saved Power Place compositions.
- `20260527070310_20260526_power_place_upgrade_5_business_dao.sql` extends saved compositions for `Бизнес-мандала`, `ДАО`, business vertex zone count, and resource comparison comments.
- `20260527070353_20260526_power_place_upgrade_6_zodiac_chat.sql` extends saved compositions for `Зодиак` with `zodiac_visible_count` and `zodiac-*` object refs in the existing `object_refs` JSON payload.
- `20260527120000_profile_cabinet_media_storage.sql` creates private bucket `profile-cabinet-media`, owner-only Storage policies, and durable media path columns for client/goal and tradition images.
- `20260527143000_power_place_star_format.sql` extends saved compositions for `Звезда` with `star_variant` values `closed` / `open` and `star-*` object refs in the existing `object_refs` JSON payload.
- `20260531090000_power_place_chess_format.sql` extends saved compositions for `Шахматы` with `chess_variant` values `classic-14` / `classic-8` / `plus-8` and allows `constructor_type='chess'`.
- `20260602120000_power_place_chess_compact_variant.sql` allows the Profile Lite `compact-5` chess variant used by the 6-photo UI format.
- `20260605153000_service_orders_client_phase4.sql` extends service orders for authenticated client drafts, `photo_required`, order format, selected client photo, and client/master RLS.
- `20260605184500_service_orders_result_delivery_phase5.sql` extends service orders for draft/final result composition delivery, `ready_for_review`, `sent_at`, and final-result-only client composition reads.
- Account limits are profile-level only: Start allows 7 saved compositions and 10 client/goal photos; Pro allows 20 saved compositions and 30 client/goal photos.
- Client/goal photos, tradition assets, Power Place slot images, and underlay covers upload through the authenticated user's anon-token session. The frontend stores bucket/path or `storage://profile-cabinet-media/...` refs and resolves private signed URLs only for display.
- Legacy external image URLs still load. Local `data:image` previews are filtered out of saved Power Place payloads.

Master chat setup:

- Chat tables and all RLS policies are in `20260527070353_20260526_power_place_upgrade_6_zodiac_chat.sql` (conversations, participants, messages, favorites, RLS enabled, six policies using `profile_cabinet_owns_profile` and `profile_cabinet_is_chat_participant` helpers).
- `/profile/chats` shows the 3-column chat UI: left conversation list, center messages, right composer.
- The right column includes "Подтянуть ссылку": one-click insert of the master's public page link (`/masters/:profileId`) or any published service link (`/services/:serviceId`) into the draft. Links are plain text; no auto-send.
- `src/lib/masterChatLinks.js` is a pure helper for public URL/text generation; it never exposes storage refs, signed URLs, or private composition data.

