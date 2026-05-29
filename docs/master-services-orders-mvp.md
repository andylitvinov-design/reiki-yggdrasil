# Master services and orders MVP

Date: 2026-05-29
Branch: `chatgpt/add-master-services-and-orders-mvp`

## Scope

Adds the first additive MVP for master services and client orders:

- profile cabinet top tabs `Услуги` and `Заявки`;
- `В услуги` action under the Power Place final actions;
- service draft/publish data flow;
- public service cards with `Заказать`;
- client order creation;
- order cards/detail workflow in the master cabinet.

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

The public and profile UI patches are applied by:

- `scripts/apply-master-services-orders-mvp.mjs`

The patch is wired into:

- `predev`
- `prebuild`
- `presupabase:migrations:apply`
- `check` through `build`

This keeps large JSX changes idempotent and avoids rewriting `src/pages/ProfilePage.jsx` and `src/main.jsx` by hand in a connector-limited environment.

## Tests

New test:

- `test/profileServicesClient.test.mjs`

`npm run check` now includes:

- `npm run test:profile-services`

## Needs verification

- Apply the new migration to live Supabase.
- Verify public unauthenticated photo upload; MVP supports URL-only photo field and does not fake Storage upload.
- Verify browser QA on `/`, `/profile`, `/masters`, `/profile/admin`.
- Verify desktop widths 1280/1366/1440/1710 and mobile 390 for no horizontal overflow.
- Verify authenticated Power Place save -> `В услуги` -> draft service creation.
- Verify `Разместить` makes service public after RLS migration is applied.
- Verify public `Заказать` creates an order and it appears in `Заявки`.
- Full PNG/JPEG rendered mandala export remains not verified; existing safe download fallback remains the supported path for now.
