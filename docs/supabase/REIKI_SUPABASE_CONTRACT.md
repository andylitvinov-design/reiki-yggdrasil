# Reiki Yggdrasil — Supabase/Auth Contract

Status: v1.
Purpose: document the expected Supabase/Auth boundary for debugging without exposing secrets.

## Env names

Frontend env names known for this project:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_ADMIN_EMAIL`

Rules:

- Never commit env values.
- Never print service-role keys.
- Never put real admin email values into docs, debug output, logs, or frontend public text.
- Debug tools may report presence booleans only.

## OAuth/domain contract

The app should keep target and legacy redirect support during domain migration.

Target domain:

- `https://mentalica.vercel.app/profile`
- `https://mentalica.vercel.app/profile/admin`

Current/legacy live domain:

- `https://reiki-yggdrasil.vercel.app/profile`
- `https://reiki-yggdrasil.vercel.app/profile/admin`

Rules:

- Do not hardcode a single OAuth return domain if `window.location.origin` is the current contract.
- For preview deployments, add the relevant Vercel preview URL before testing OAuth on preview.
- Treat OAuth success/failure as `needs verification` unless tested with the live Supabase project and a real session.

## Expected auth/data flows

Known or expected flows:

- public read for public site content;
- Google auth for profile cabinet;
- authenticated profile/media/material save flows;
- admin-only moderation for `/profile/admin`;
- private Storage upload/display through authenticated anon-token session;
- service/order flow where unauthenticated intent may need to survive OAuth.

## Storage bucket

Known bucket name:

- `profile-cabinet-media`

Expected boundary:

- bucket is private;
- owner-only or participant/admin policies should protect private files;
- frontend stores durable refs such as `storage://profile-cabinet-media/...` internally;
- display should use signed URLs where private files must be shown;
- public pages must not expose private storage refs as visible text or usable URLs.

## RLS risk classes

When a Supabase operation fails, classify before fixing:

1. env missing or malformed;
2. user unauthenticated;
3. wrong auth redirect/session state;
4. RLS blocks read/write;
5. migration not applied live;
6. frontend payload uses wrong table/column/status;
7. public route is trying to read private data;
8. admin flow lacks admin membership/configuration.

## Debug evidence to collect

For any Supabase/Auth bug, collect:

- route;
- auth state: unauthenticated/authenticated/admin, without exposing identity;
- table/bucket/action involved;
- frontend client file;
- migration file expected to support it;
- whether failure happens in local, preview, or live;
- exact safe error message if available;
- what remains `needs verification`.

## Forbidden fixes

- Do not loosen RLS broadly to make the UI pass.
- Do not expose service role keys to frontend code.
- Do not store real env values or user identifiers in debug docs.
- Do not remove legacy redirect URLs until migration is verified.
- Do not assume a migration is applied live just because a file exists in repo.

## Completion standard

A Supabase/Auth fix is complete only when:

- code and migration assumptions are documented;
- automated tests/checks pass when available;
- live auth/storage behavior is verified, or explicitly marked `needs verification`;
- no secrets are leaked;
- public/private data boundary is preserved.
