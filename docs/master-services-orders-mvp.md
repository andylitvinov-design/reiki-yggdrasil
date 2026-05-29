# Master services and orders MVP

Date: 2026-05-29
Branch: `chatgpt/add-master-services-and-orders-mvp`

## Scope

This PR adds the safe mergeable foundation for master services and client orders:

- Supabase data model for master services;
- Supabase data model for client service orders;
- frontend REST client for services/orders;
- normalization tests for services/orders;
- a manual idempotent UI patch script for the next integration pass.

## Data model

New migration:

- `supabase/migrations/20260529090000_master_services_orders_mvp.sql`

New tables:

- `profile_cabinet_services`
- `profile_cabinet_service_orders`

RLS summary:

- public/anon can read published services only;
- masters can manage their own services;
- public/anon can create orders only for published services;
- masters can read/update only orders addressed to their profile id.

## Frontend integration

New client module:

- `src/lib/profileServicesClient.js`

Manual UI patch script:

- `scripts/apply-master-services-orders-mvp.mjs`

The script contains the intended `/profile` and public UI integration for:

- profile cabinet top tabs `Услуги` and `Заявки`;
- `В услуги` action under the Power Place final actions;
- service draft/publish form;
- public service cards with `Заказать`;
- client order creation;
- order cards/detail workflow in the master cabinet.

Important: the UI patch script is not wired into `prebuild`, because automatic patching of the large JSX files failed CI/Vercel. It is kept as a manual reference/tool for the next Codex pass or for a local materialized patch.

## Tests

New test:

- `test/profileServicesClient.test.mjs`

`npm run check` now includes:

- `npm run test:profile-services`

## Merge state

- GitHub CI build: green on PR head after keeping the UI patch script manual.
- Vercel: green on PR head after keeping the UI patch script manual.
- PR is safe to merge as a data/client/test foundation.

## Needs verification / next pass

- Materialize the UI patch into `src/pages/ProfilePage.jsx` and `src/main.jsx`, or run/fix `scripts/apply-master-services-orders-mvp.mjs` locally and commit the resulting changes.
- Apply the new migration to live Supabase.
- Verify public unauthenticated photo upload; MVP should keep URL-only photo field until Storage/RLS is explicitly designed.
- Verify browser QA on `/`, `/profile`, `/masters`, `/profile/admin`.
- Verify desktop widths 1280/1366/1440/1710 and mobile 390 for no horizontal overflow.
- Verify authenticated Power Place save -> `В услуги` -> draft service creation after UI materialization.
- Verify `Разместить` makes service public after RLS migration is applied.
- Verify public `Заказать` creates an order and it appears in `Заявки` after UI materialization.
- Full PNG/JPEG rendered mandala export remains not verified; existing safe download fallback remains the supported path for now.
