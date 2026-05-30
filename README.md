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

1. Apply `supabase/migrations/20260524_profile_cabinet_mvp.sql`.
2. Apply `supabase/migrations/20260524_profile_cabinet_rls_followup.sql`.
3. Apply `supabase/migrations/20260526_profile_cabinet_publication_step_fields.sql`.
4. Apply `supabase/migrations/20260526_profile_cabinet_security_lints.sql`.
5. Apply `supabase/migrations/20260526_power_place_persistence.sql`.
6. Apply `supabase/migrations/20260526_power_place_upgrade_5_business_dao.sql`.
7. Apply `supabase/migrations/20260526_power_place_upgrade_6_zodiac_chat.sql`.
8. Apply `supabase/migrations/20260527_profile_cabinet_media_storage.sql`.
9. Apply `supabase/migrations/20260527143000_power_place_star_format.sql`.
10. Apply `supabase/migrations/20260531090000_power_place_chess_format.sql`.
11. Add these auth redirect URLs in Supabase for the target domain:
    - `https://mentalica.vercel.app/profile`
    - `https://mentalica.vercel.app/profile/admin`
12. Keep these legacy auth redirect URLs until the migration is fully verified:
    - `https://reiki-yggdrasil.vercel.app/profile`
    - `https://reiki-yggdrasil.vercel.app/profile/admin`
13. Add the Vercel production env vars named above.
14. After the first admin login, insert that user's `user_id` and email into `profile_cabinet_admins`.

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

- `20260526_power_place_persistence.sql` adds the profile `account_plan`, client/goal photo references, tradition image references, and saved Power Place compositions.
- `20260526_power_place_upgrade_5_business_dao.sql` extends saved compositions for `Бизнес-мандала`, `ДАО`, business vertex zone count, and resource comparison comments.
- `20260526_power_place_upgrade_6_zodiac_chat.sql` extends saved compositions for `Зодиак` with `zodiac_visible_count` and `zodiac-*` object refs in the existing `object_refs` JSON payload.
- `20260527_profile_cabinet_media_storage.sql` creates private bucket `profile-cabinet-media`, owner-only Storage policies, and durable media path columns for client/goal and tradition images.
- `20260527143000_power_place_star_format.sql` extends saved compositions for `Звезда` with `star_variant` values `closed` / `open` and `star-*` object refs in the existing `object_refs` JSON payload.
- `20260531090000_power_place_chess_format.sql` extends saved compositions for `Шахматы` with `chess_variant` values `classic-14` / `classic-8` / `plus-8` and `chess-top-*` / `chess-*` object refs in the existing `object_refs` JSON payload.
- Account limits are profile-level only: Start allows 7 saved compositions and 10 client/goal photos; Pro allows 20 saved compositions and 30 client/goal photos.
- Client/goal photos, tradition assets, Power Place slot images, and underlay covers upload through the authenticated user's anon-token session. The frontend stores bucket/path or `storage://profile-cabinet-media/...` refs and resolves private signed URLs only for display.
- Legacy external image URLs still load. Local `data:image` previews are filtered out of saved Power Place payloads.

Master chat setup:

- `20260526_power_place_upgrade_6_zodiac_chat.sql` also adds authenticated chat tables for conversations, participants, messages, and favorite chats.
- Chat RLS has no anon access: only authenticated conversation participants can read messages/conversation rows, only participants can send messages, and favorite chats are owner-only.
- The cabinet-visible master ID is derived from the existing profile UUID as `RY-<first 8 chars>`; no extra secret or service-role key is required.

Supabase migration runner:

- `npm run supabase:migrations:apply` runs `scripts/apply-reiki-supabase-migrations.mjs`.
- The runner reads only `SUPABASE_ACCESS_TOKEN` and `SUPABASE_PROJECT_REF` from the local wallet at `http://127.0.0.1:${SECRET_VAULT_PORT || 8790}/api/secrets/read`.
- The runner allowlists only the committed Power Place and media Storage migrations listed above and stops if the wallet is unavailable, secrets are missing, migration files are dirty, or `supabase db push --dry-run` reports unrelated pending migrations.
- The runner redacts token-shaped values and prints only secret presence, never secret values.

## Deploy

The repository includes:

- `vercel.json` for Vercel deployment
- `.github/workflows/deploy-pages.yml` for GitHub Pages deployment
