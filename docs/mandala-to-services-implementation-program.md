# Mandala to Services Implementation Program

Last updated: 2026-06-02

Status: implementation program / source-of-truth brief for the next Codex pass.

Repo: `andylitvinov-design/reiki-yggdrasil`

Target production URL: `https://mentalica.vercel.app`

Legacy URL: `https://reiki-yggdrasil.vercel.app`

Target branch for implementation work:

```text
codex/restore-mandala-to-services-flow
```

---

## 0. Product decision record — confirmed by Andrey

These product decisions are now canonical for this feature.

### 0.1. Public link timing

Decision: **1A**.

A public client link appears only after the service is published.

```text
Draft service:
  no active public client link
  UI text: Ссылка появится после публикации.

Published service:
  active public link appears
  UI text: Публичная ссылка для клиентов
  button: Скопировать ссылку
```

### 0.2. Three separate buttons in mandala workspace

In the mandala creation area there must be three separate actions:

```text
1. Сохранить мандалу
2. Перенести в услуги
3. Опубликовать как услугу
```

Meaning:

- `Сохранить мандалу` saves/updates the private master mandala composition only.
- `Перенести в услуги` saves the mandala if needed and creates/opens a service draft in `/profile/services`.
- `Опубликовать как услугу` saves the mandala if needed, creates/opens the service, publishes it immediately, and then shows the public client link.

### 0.3. Service is a reusable template

A mandala added to Services becomes a **service template**, not the final client result.

Master creates a template mandala:

```text
profile_cabinet_power_place_compositions
→ profile_cabinet_services.composition_id
```

Client orders this template.

For the client order, the system/master creates a **personal client mandala** based on the service template:

```text
service template mandala
→ insert client photo in the center
→ save as personal client mandala/result
→ keep inside master cabinet service/order workflow
```

The service template remains reusable. Each client order should create its own order result/personal mandala, not overwrite the template.

### 0.4. There are two service/shop surfaces

There are two different places:

```text
/profile/services
→ master cabinet tab for managing own services/templates/drafts/published services

/shop or existing site shop page/tab
→ public site shop where all published services are visible
```

The public shop page already exists on the site according to product context; Codex must verify the exact route/component before coding.

### 0.5. Publication is immediate

No moderation gate for this MVP.

When the master clicks `Опубликовать как услугу` or publishes from `/profile/services`, the service becomes public immediately if Supabase/RLS allows it.

### 0.6. Ordering goes through cart

Client ordering goes through the service cart flow, not a direct one-click order.

Target public flow:

```text
public shop / service page
→ add service to cart
→ cart keeps selected service/template and format/details
→ checkout/order flow
→ client order reaches master cabinet
```

If the existing cart has already been planned elsewhere, Codex must inspect and connect to it rather than inventing a second cart.

### 0.7. Client result appears in master cabinet

The order/result should be visible in the master cabinet.

Target master location:

```text
/profile/orders
or existing service-orders area in the master cabinet
```

The result is a personal client mandala created from the service template and client photo.

### 0.8. Pricing default

Default price is free unless the master fills other details.

Implementation rule:

```text
price_amount = null or 0
price_currency = EUR by default
public label = Бесплатно
```

If a price is entered, show the entered price/currency.

---

## 1. Executive summary

This document consolidates the implementation program for:

```text
master mandala
→ service template
→ published public shop service
→ public client link
→ cart
→ order
→ personal client mandala/result in master cabinet
```

Main storage model:

- Saved private mandalas live in `profile_cabinet_power_place_compositions`.
- Service drafts and published service templates live in `profile_cabinet_services`.
- Service visibility is controlled by `profile_cabinet_services.status`:
  - `draft` = visible only to owner/master in the cabinet;
  - `published` = visible publicly in the shop and by public link;
  - `archived` = hidden from public, kept for history.
- Client orders live in `profile_cabinet_service_orders`.
- Personal client mandala/result should be attached to the order, not overwrite the service template.

Target product flow:

```text
/profile/mandalas
→ master creates or opens mandala
→ Сохранить мандалу / Перенести в услуги / Опубликовать как услугу
→ app saves composition if needed
→ app creates or opens profile_cabinet_services service template
→ /profile/services opens service editor
→ master edits title/description/price/preview
→ master publishes service if not already published
→ public link appears only after publication
→ service appears in public shop
→ client adds service to cart
→ client checkout/order flow
→ order appears in master cabinet
→ master/client workflow creates personal mandala with client photo in center
```

---

## 2. Non-negotiable project rules

Before coding, Codex must read repo-local instructions and current state.

Required first-read files:

```text
AGENTS.md
README.md
STATE.md
LOG.md
package.json
vercel.json
docs/PROFILE_SERVICES_ROADMAP.md
docs/profile-lite-alternative-cabinet-plan.md
docs/master-services-orders-mvp.md
docs/mandala-to-services-implementation-program.md
scripts/apply-master-services-orders-mvp.mjs
src/main.jsx
src/pages/ProfileLitePage.jsx
src/pages/ProfilePage.jsx
src/pages/profile-lite/ProfileLitePowerPlaceModule.jsx
src/pages/profile-lite/ProfileLiteServicesModule.jsx
src/lib/profileServicesClient.js
src/lib/powerPlaceClient.js
supabase/migrations/20260529090000_master_services_orders_mvp.sql
```

If any file is missing, report:

```text
not found
```

Hard safety rules:

- Keep RU-default interface.
- Do not expose env values, tokens, raw JWTs, service-role keys, or private user data.
- Env names only:
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`
  - `VITE_ADMIN_EMAIL`
- Do not rewrite the whole cabinet.
- Do not add a second React/runtime app.
- Do not re-enable old runtime scripts that previously broke `/profile`.
- Do not break `/`, `/profile`, `/profile-old`, `/masters`, `/profile/admin`.
- Do not break Vercel rewrites or Supabase auth/data flows.
- Preserve Profile Lite shell resilience: module errors must not block the whole cabinet.
- Keep `/profile-old` as reference/diagnostic unless a separate explicit route switch task changes it.

---

## 3. Existing source inventory

### 3.1. Roadmap and planning docs

Primary docs:

```text
docs/PROFILE_SERVICES_ROADMAP.md
docs/profile-lite-alternative-cabinet-plan.md
docs/master-services-orders-mvp.md
docs/mandala-to-services-implementation-program.md
```

Important existing concept from roadmap:

```text
saved mandala / template → master service → public service profile → authenticated order → master request queue → result delivery
```

### 3.2. Old manual integration reference

File:

```text
scripts/apply-master-services-orders-mvp.mjs
```

This file contains the intended heavy-cabinet integration for:

- profile top tabs `Услуги` and `Заявки`;
- `В услуги` action under Power Place final actions;
- service draft/publish form;
- public service cards with `Заказать`;
- client order creation;
- order cards/detail workflow in the master cabinet.

Important old function pattern:

```text
saveCurrentPowerPlaceComposition()
→ handlePowerPlaceToService()
→ save current composition
→ fill serviceForm with profile_id, composition_id, title, image_url, price_currency
→ setActiveTopTab("services")
→ show service notice
```

Profile Lite should preserve this behavior, but implement it safely in Lite architecture.

### 3.3. Existing service client

File:

```text
src/lib/profileServicesClient.js
```

Confirmed existing API:

```text
SERVICES_TABLE = profile_cabinet_services
ORDERS_TABLE = profile_cabinet_service_orders
SERVICE_STATUSES = draft / published / archived
ORDER_STATUSES = new / in_progress / sent / closed
createEmptyServiceForm
serviceStatusText
orderStatusText
normalizeServiceForm
normalizeServiceRow
normalizeServiceOrder
listPublicServices
listOwnServices
createOwnService
updateOwnService
publishOwnService
createServiceOrder
listOwnServiceOrders
updateServiceOrder
```

Known limitations for the final target:

- `ORDER_STATUSES` currently do not include `draft`.
- Existing `createServiceOrder` creates order as `new`.
- Current order model does not clearly support:
  - `client_profile_id`
  - `order_format`
  - `goal_text`
  - `comment_text`
  - `attachment_refs`
  - `result_composition_id`
- `listOwnServiceOrders(profileId)` means incoming master orders by `master_profile_id`, not client-side `Мои заказы`.

### 3.4. Existing Supabase migration

File:

```text
supabase/migrations/20260529090000_master_services_orders_mvp.sql
```

Existing tables:

```text
profile_cabinet_services
profile_cabinet_service_orders
```

Existing service fields:

```text
id
profile_id
composition_id
title
description
image_url
image_bucket
image_path
price_amount
price_currency
status
created_at
updated_at
```

Existing order fields:

```text
id
service_id
master_profile_id
client_name
client_photo_url
client_photo_bucket
client_photo_path
request_text
master_comment
result_image_url
result_image_bucket
result_image_path
status
created_at
updated_at
```

Needs verification:

- Whether this migration is applied in live Supabase.
- Whether RLS matches the future cart/authenticated checkout model.
- Whether result personal mandala requires `result_composition_id` or a separate table.

---

## 4. Storage model

### 4.1. Saved master mandalas / Power Place compositions

Storage:

```text
public.profile_cabinet_power_place_compositions
```

Purpose:

- stores the master mandala constructor state;
- owner-only object;
- not directly public;
- reusable source for creating service templates.

Rule:

```text
A master mandala becomes public only through a service row.
The composition itself remains private/owner-scoped unless public rendering is explicitly designed.
```

### 4.2. Service templates

Storage:

```text
public.profile_cabinet_services
```

A service is a reusable template linked to a master mandala.

Core link:

```text
profile_cabinet_services.composition_id
→ profile_cabinet_power_place_compositions.id
```

One table stores all service states:

```text
status = draft      → master-only draft in /profile/services
status = published  → public service in shop and public link
status = archived   → hidden from public, kept for history
```

Required default values:

```text
price_amount = null or 0
price_currency = 'EUR'
public price label = Бесплатно
```

Recommended additional fields for clearer future implementation, if a migration is safe:

```text
public_slug text unique null
short_description text not null default ''
category text not null default 'mandala'
delivery_modes jsonb not null default '["signature","no_signature","both"]'::jsonb
published_at timestamptz null
archived_at timestamptz null
```

### 4.3. Public shop services

Storage:

```text
same table: profile_cabinet_services
filter: status = 'published'
```

Public shop query:

```text
select published services only
```

Drafts and archived services must not appear in the public shop.

### 4.4. Public links

Canonical MVP public link:

```text
https://mentalica.vercel.app/services/<service_id>
```

Build URL on frontend:

```text
window.location.origin + "/services/" + service.id
```

Do not store full production URL in Supabase.

Public link behavior:

```text
status = draft:
  no active public link
  UI: Ссылка появится после публикации.

status = published:
  active link appears
  UI: Публичная ссылка для клиентов
  action: Скопировать ссылку

status = archived:
  link disabled
  UI: Услуга в архиве. Публичная ссылка отключена.
```

### 4.5. Cart

Cart must hold selected service/template before order creation.

Minimum cart item:

```json
{
  "service_id": "<service id>",
  "composition_id": "<template composition id>",
  "master_profile_id": "<master profile id>",
  "format": "signature | no_signature | both",
  "price_amount": null,
  "price_currency": "EUR"
}
```

Default price label:

```text
Бесплатно
```

If an existing cart module/page already exists, use it. Do not create a duplicate cart without checking the existing site shop/cart implementation.

### 4.6. Orders

Current storage:

```text
public.profile_cabinet_service_orders
```

Final order should represent a client request for a service template.

Recommended additional fields:

```text
client_profile_id uuid null references public.profile_cabinet_profiles(id)
order_format text not null default 'signature' check (order_format in ('signature','no_signature','both'))
goal_text text not null default ''
comment_text text not null default ''
attachment_refs jsonb not null default '[]'::jsonb
result_composition_id uuid null references public.profile_cabinet_power_place_compositions(id)
submitted_at timestamptz null
```

`result_composition_id` is important for Andrey's confirmed logic:

```text
service template mandala
→ client photo inserted in center
→ saved as personal client mandala/result
→ linked to order via result_composition_id
```

If using the same `profile_cabinet_power_place_compositions` table for personal client mandalas, the result composition should be owned by the master profile and linked to the order. It must not overwrite the original service template composition.

---

## 5. Exact business flow

### 5.1. Master creates mandala

Route:

```text
/profile/mandalas
```

Data written:

```text
profile_cabinet_power_place_compositions
```

Required buttons:

```text
Сохранить мандалу
Перенести в услуги
Опубликовать как услугу
```

### 5.2. Button: Сохранить мандалу

Behavior:

```text
create/update profile_cabinet_power_place_compositions only
```

Does not create service.

Success message:

```text
Мандала сохранена.
```

### 5.3. Button: Перенести в услуги

Behavior:

```text
1. Save/update mandala composition if needed.
2. Get saved composition id.
3. Check if a service already exists with this composition_id for current master.
4. If yes: open existing service editor.
5. If no: create service draft in profile_cabinet_services.
6. status = 'draft'.
7. price default = free.
8. Navigate to /profile/services.
9. Show: Мандала перенесена в услуги как черновик.
```

Public link:

```text
not active yet
UI: Ссылка появится после публикации.
```

### 5.4. Button: Опубликовать как услугу

Behavior:

```text
1. Save/update mandala composition if needed.
2. Get saved composition id.
3. Check if service exists with this composition_id.
4. If service exists: update it.
5. If no service: create service row.
6. status = 'published'.
7. price default = free.
8. Navigate to /profile/services.
9. Show public link block.
10. Service appears in public shop.
```

Success message:

```text
Мандала опубликована как услуга. Ссылка для клиентов доступна.
```

### 5.5. Master services tab

Route:

```text
/profile/services
```

Data read:

```text
listOwnServices(profile.id, session)
```

Storage:

```text
profile_cabinet_services
```

Sections:

```text
Черновики        -> status = draft
Опубликованные   -> status = published
Архив            -> status = archived
```

Minimum service card fields:

```text
title
description preview
price/currency or Бесплатно
status
composition_id indicator
public link state
```

Editor fields:

```text
Название услуги
Описание услуги
Цена
Валюта
Изображение / preview
Связанная мандала / composition_id readonly
Статус
```

Draft actions:

```text
Сохранить черновик
Опубликовать
```

Published actions:

```text
Сохранить изменения
Скопировать публичную ссылку
Снять с публикации / В архив later
```

### 5.6. Public shop

Public site has a general shop page/tab for all services.

Codex must verify exact route/component before coding. Possible routes:

```text
/shop
existing Магазин page/tab
existing public section in main site
```

Public shop data:

```text
profile_cabinet_services where status = 'published'
```

Public shop card:

```text
preview
title
short description
Бесплатно or price
button: Подробнее / В корзину
```

### 5.7. Public service page

Recommended route:

```text
/services/:serviceId
```

Vercel rewrite required if route is implemented:

```json
{
  "source": "/services/:serviceId",
  "destination": "/"
}
```

Public page must only load:

```text
status = 'published'
```

Public page content:

```text
image / preview
title
description
price label: Бесплатно by default
format selector:
  signature      -> С подписью мастера
  no_signature   -> Без подписи мастера
  both           -> Две версии
button: В корзину / Оформить через корзину
```

### 5.8. Cart and checkout

Client flow:

```text
public shop or service page
→ choose service
→ choose format/details
→ add to cart
→ cart checkout
→ if needed, Google login
→ order is created/submitted
→ master sees order in cabinet
```

Cart must preserve:

```text
service_id
format
master_profile_id
composition_id
```

If client is not authenticated at checkout, save pending cart/checkout safely before Google OAuth.

Suggested localStorage key:

```text
reiki-yggdrasil-pending-service-cart
```

Do not store secrets or private data there.

### 5.9. Master receives order and creates personal mandala

Master cabinet:

```text
/profile/orders
```

Order points to:

```text
service_id
service.composition_id = template mandala
client photo / request / details
```

Personal result creation:

```text
1. Open order.
2. Load service template composition.
3. Insert client photo in center.
4. Save as new personal composition/result.
5. Link result to order via result_composition_id or equivalent.
6. Keep template unchanged.
```

This is the core distinction:

```text
service template composition ≠ personal client result composition
```

---

## 6. Route map

Protected/current routes:

```text
/
/profile
/profile-lite
/profile-old
/profile/mandalas
/profile/services
/profile/orders
/profile/chats
/profile/settings
/masters
/profile/admin
```

Public shop/service routes to verify or add:

```text
/shop or existing Магазин tab/page
/services/:serviceId
```

Do not show a fake public link if `/services/:serviceId` is not implemented.

---

## 7. Implementation phases

### Phase 1 — Profile Lite mandala-to-service template bridge

Goal:

```text
/profile/mandalas
→ three buttons
→ private save / draft transfer / immediate publish
→ /profile/services
```

Files:

```text
src/pages/ProfileLitePage.jsx
src/pages/profile-lite/ProfileLitePowerPlaceModule.jsx
src/pages/profile-lite/ProfileLiteServicesModule.jsx
src/lib/profileServicesClient.js
test/profileLiteCabinetContract.test.mjs
test/profileServicesClient.test.mjs
STATE.md
LOG.md
```

Requirements:

1. Add/ensure three separate buttons:

```text
Сохранить мандалу
Перенести в услуги
Опубликовать как услугу
```

2. Implement reusable helper:

```text
saveCurrentCompositionDraft()
```

3. Implement service creation helper flow:

```text
save composition
→ find existing service by composition_id
→ create/update service row
→ status draft or published depending action
→ navigate to /profile/services
```

4. Default service price:

```text
Бесплатно
```

5. Public link block:

- no link for draft;
- active link after publish only.

Acceptance checklist:

```text
[ ] /profile/mandalas opens.
[ ] Three buttons are visible.
[ ] Сохранить мандалу saves only composition.
[ ] Перенести в услуги creates/opens draft service.
[ ] Опубликовать как услугу creates/opens published service.
[ ] Unsaved mandala is saved before service creation.
[ ] service.composition_id is real.
[ ] Existing service with same composition_id is reused, not duplicated.
[ ] Draft service does not show active public link.
[ ] Published service shows active public link.
[ ] Default price label is Бесплатно.
[ ] Services failure does not close shell.
```

### Phase 2 — Services manager completion

Goal:

```text
/profile/services becomes real service template manager.
```

Requirements:

```text
[ ] Черновики section.
[ ] Опубликованные section.
[ ] Архив section.
[ ] Edit title.
[ ] Edit description.
[ ] Edit price/currency.
[ ] Save draft.
[ ] Publish.
[ ] Copy public link for published only.
[ ] Show linked mandala/template.
```

### Phase 3 — Public shop and service route

Goal:

```text
Published service templates appear in public shop and open by public link.
```

Requirements:

```text
[ ] Verify existing shop route/component.
[ ] Connect public shop to published services.
[ ] Add /services/:serviceId if missing.
[ ] Add Vercel rewrite if route added.
[ ] Draft services are not public.
[ ] Archived services are not public.
[ ] Public service page has add-to-cart action.
```

### Phase 4 — Cart and order flow

Goal:

```text
Client orders service template through cart.
```

Requirements:

```text
[ ] Cart stores service_id.
[ ] Cart stores format.
[ ] Cart stores master_profile_id.
[ ] Cart stores composition_id template reference.
[ ] Checkout creates service order.
[ ] If login is needed, pending cart survives Google OAuth.
[ ] Master sees order in cabinet.
```

### Phase 5 — Personal client mandala result

Goal:

```text
Order creates/receives personal mandala based on template + client photo.
```

Likely schema addition:

```text
profile_cabinet_service_orders.result_composition_id
```

Requirements:

```text
[ ] Open order in master cabinet.
[ ] Load service template composition.
[ ] Insert client photo in center.
[ ] Save as new personal composition.
[ ] Link result composition to order.
[ ] Template remains unchanged.
```

---

## 8. Required checks

Run after Phase 1 changes:

```bash
npm run test:profile-lite
npm run test:profile-services
npm run test:power-place
npm run test:profile-media
npm run test:profile-loading-recovery
npm run check
npm run build
```

Manual/browser QA:

```text
/profile/mandalas
/profile/services
/profile/orders
/profile-old
/profile
/masters
/profile/admin
/
```

Public QA if Phase 3 is implemented:

```text
/shop or existing Магазин route
/services/<published_service_id>
/services/<draft_service_id> should not be public
```

Viewport QA:

```text
desktop 1280x920
desktop 1366x900
mobile 390x900
```

---

## 9. Minimal Codex prompt for Phase 1

```text
Ты работаешь с проектом Reiki Yggdrasil.

Режим: АНАЛИЗ + минимальная реализация.

Repo:
andylitvinov-design/reiki-yggdrasil

Live / target:
https://mentalica.vercel.app

Legacy:
https://reiki-yggdrasil.vercel.app

Target branch:
codex/restore-mandala-to-services-flow

Задача:
Реализовать точную механику “мандала → услуга-шаблон → публикация → публичная ссылка” в Profile Lite.

Сначала прочитать:
1. AGENTS.md
2. README.md
3. STATE.md
4. LOG.md
5. package.json
6. vercel.json
7. docs/PROFILE_SERVICES_ROADMAP.md
8. docs/profile-lite-alternative-cabinet-plan.md
9. docs/master-services-orders-mvp.md
10. docs/mandala-to-services-implementation-program.md
11. scripts/apply-master-services-orders-mvp.mjs
12. src/pages/ProfileLitePage.jsx
13. src/pages/profile-lite/ProfileLitePowerPlaceModule.jsx
14. src/pages/profile-lite/ProfileLiteServicesModule.jsx
15. src/lib/profileServicesClient.js
16. src/lib/powerPlaceClient.js
17. supabase/migrations/20260529090000_master_services_orders_mvp.sql

Если файла нет — написать `not found`.

Продуктовые решения:
- В зоне создания мандалы должны быть 3 кнопки:
  1. Сохранить мандалу
  2. Перенести в услуги
  3. Опубликовать как услугу
- `Перенести в услуги` создаёт черновик услуги.
- `Опубликовать как услугу` сразу публикует услугу.
- Услуга — это шаблон из мандалы.
- Под этот шаблон клиент обращается через магазин/корзину.
- В клиентском результате по центру вставляется фото клиента.
- Клиентский результат сохраняется как персональная мандала клиента в workflow услуг/заказов мастера.
- Черновики и опубликованные услуги хранятся в одной таблице `profile_cabinet_services` и отличаются `status`.
- Публичная ссылка появляется только после публикации.
- Магазин — общая вкладка/страница сайта, где видны все опубликованные услуги.
- Цена по умолчанию: Бесплатно.

Что реализовать в Phase 1:
1. Разделить кнопки в Profile Lite mandala workspace:
   - Сохранить мандалу
   - Перенести в услуги
   - Опубликовать как услугу
2. Сделать общий helper сохранения текущей composition.
3. Для `Перенести в услуги`:
   - save/update composition;
   - find existing service by composition_id;
   - if none, create `profile_cabinet_services` row with `status='draft'`;
   - price default free;
   - navigate to `/profile/services`.
4. Для `Опубликовать как услугу`:
   - save/update composition;
   - find or create service row;
   - set `status='published'`;
   - price default free;
   - navigate to `/profile/services`;
   - show active public link.
5. In `/profile/services`:
   - show sections: Черновики / Опубликованные / Архив;
   - show public link only for published services;
   - draft text: “Ссылка появится после публикации.”;
   - published link: `window.location.origin + '/services/' + service.id`;
   - copy link button for published only.
6. Do not implement cart/order/personal result in Phase 1 unless already safe and existing. Document as next phase.
7. Do not create fake route/link if `/services/:serviceId` is not implemented. Mark needs verification or implement safe route + Vercel rewrite if low-risk.
8. Do not persist `data:image` as permanent preview.
9. Preserve `/profile-old`, `/`, `/profile`, `/masters`, `/profile/admin`.

Checks:
npm run test:profile-lite
npm run test:profile-services
npm run test:power-place
npm run test:profile-media
npm run test:profile-loading-recovery
npm run check
npm run build

Report:
1. Branch
2. Changed files
3. Three-button behavior
4. Storage model implemented
5. Draft/published/archive behavior
6. Public link behavior
7. What remains for cart/order/personal client mandala
8. Checks run
9. Routes verified
10. Risks / not verified
```

---

## 10. Done definition for Phase 1

```text
[ ] Three mandala actions exist.
[ ] Save mandala only saves composition.
[ ] Transfer to services creates/opens draft service template.
[ ] Publish as service creates/opens published service template.
[ ] Service is linked to composition_id.
[ ] Same composition does not create duplicate service unless explicitly requested later.
[ ] Drafts are private.
[ ] Published services show public client link.
[ ] Public link appears only after publication.
[ ] Default price is Бесплатно.
[ ] /profile/services groups services by draft/published/archive.
[ ] Services errors stay inline.
[ ] /profile-old remains available.
[ ] /, /profile, /masters, /profile/admin remain unchanged.
[ ] Tests/build pass.
[ ] STATE.md and LOG.md are updated.
```
