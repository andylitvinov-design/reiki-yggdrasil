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

## 0. Executive summary

This document consolidates the implementation program for the feature:

```text
saved mandala / Power Place composition
→ service draft
→ service editor
→ published service in shop
→ public service link for clients
→ public service profile
→ client order
→ master request queue
```

The critical missing clarity is storage and flow ownership:

- Saved mandalas live in `profile_cabinet_power_place_compositions`.
- Service drafts and published services live in the same table: `profile_cabinet_services`.
- The service status decides visibility:
  - `draft` = visible only to owner/master in cabinet;
  - `published` = visible publicly in shop and by public link;
  - `archived` = hidden from public, kept for history.
- Orders live in `profile_cabinet_service_orders`.
- Public service links are generated from the service row ID or slug.
- The link can be prepared after service draft save, but it must only be accessible to clients after publication.

Target product flow:

```text
/profile/mandalas
→ master saves/opens mandala
→ clicks В услуги / Опубликовать в услугах
→ app saves composition if needed
→ app creates or opens profile_cabinet_services draft
→ /profile/services opens service editor
→ master edits title/description/price/preview
→ master publishes service
→ UI shows public link: https://mentalica.vercel.app/services/<service_id-or-slug>
→ client opens link
→ client chooses format
→ client logs in if needed
→ client creates order
→ master sees order in /profile/orders
```

---

## 1. Non-negotiable project rules

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

## 2. Existing source inventory

### 2.1. Product roadmap

File:

```text
docs/PROFILE_SERVICES_ROADMAP.md
```

Important existing concept:

```text
saved mandala / template → master service → public service profile → authenticated order → master request queue → result delivery
```

Master scenario:

1. Master logs into `/profile`.
2. Master creates or selects a saved mandala / Power Place composition.
3. Master clicks `В услуги`.
4. Cabinet opens service editor.
5. Master edits title, description, preview, formats, price, publication status.
6. Master publishes service.
7. Master copies public service link.
8. Master sees incoming orders in `Заявки`.

Client scenario:

1. Client opens public services feed or direct service link.
2. Client opens service profile.
3. Client chooses format:
   - `signature` / `С подписью мастера`
   - `no_signature` / `Без подписи мастера`
   - `both` / `Две версии`
4. If not authenticated, CTA says `Войти через Google и оформить заказ`.
5. Selected `service_id` and format survive OAuth redirect.
6. After login, client lands in cabinet order draft with selected service and format prefilled.
7. Client submits order.
8. Master sees order in `Заявки`.

### 2.2. Profile Lite rebuild plan

File:

```text
docs/profile-lite-alternative-cabinet-plan.md
```

Relevant acceptance indicators:

- User can publish a saved mandala to Services.
- User can edit service description.
- User can copy service link if service routing exists.
- User can create/view orders from services if schema/client exists.
- `/profile-old` remains available for comparison.
- `/`, `/masters`, `/profile/admin` remain unchanged.

Current intended cabinet routes:

```text
/                     -> public home, unchanged
/profile              -> ProfileLitePage, overview tab
/profile-lite         -> ProfileLitePage, overview tab / fallback
/profile-old          -> old ProfilePage, reference/diagnostic
/profile/mandalas     -> ProfileLitePage, mandalas tab
/profile/services     -> ProfileLitePage, services tab
/profile/orders       -> ProfileLitePage, orders tab
/profile/chats        -> ProfileLitePage, chats tab
/profile/settings     -> ProfileLitePage, settings tab
/masters              -> MastersPage, unchanged
/profile/admin        -> AdminPage, unchanged
```

### 2.3. Old manual integration reference

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

### 2.4. Existing service client

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

Known limitations in current target checkout direction:

- `ORDER_STATUSES` currently do not include `draft`.
- Existing `createServiceOrder` creates order as `new`.
- Current order model does not clearly support:
  - `client_profile_id`
  - `order_format`
  - `goal_text`
  - `comment_text`
  - `attachment_refs`
- `listOwnServiceOrders(profileId)` means incoming master orders by `master_profile_id`, not client-side `Мои заказы`.

### 2.5. Existing Supabase migration

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

Existing RLS intent:

- public/anon reads published services only;
- owner manages own services;
- public/anon creates orders for published services;
- owner reads/updates own service orders.

Needs verification:

- Whether this migration is applied in live Supabase.
- Whether RLS matches the future authenticated checkout model.

### 2.6. Existing Profile Lite implementation

Files:

```text
src/pages/ProfileLitePage.jsx
src/pages/profile-lite/ProfileLitePowerPlaceModule.jsx
src/pages/profile-lite/ProfileLiteServicesModule.jsx
```

Confirmed current Lite direction:

- Profile Lite imports services/orders helpers.
- Profile Lite loads `listOwnServices`, `listOwnServiceOrders`, and chat threads after shell opens.
- Profile Lite has Services and Orders modules.
- `ProfileLitePowerPlaceModule` has button `В услуги` in mandala actions.
- `ProfileLiteServicesModule` has form `Опубликовать мандалу как услугу` with title, description, price, currency, image, save draft, publish.

Current gap:

```text
handleSendCompositionToServices()
```

currently fills `serviceForm` from `compositionDraft`, but it does not guarantee that the mandala is saved first. If `compositionDraft.id` is empty, the service can be prepared without a real `composition_id`.

---

## 3. Clear storage model

### 3.1. Saved mandalas / Power Place compositions

Storage:

```text
public.profile_cabinet_power_place_compositions
```

Purpose:

- stores the actual mandala / Power Place constructor state;
- owner-only object;
- not directly public;
- reusable source for creating services.

Core fields already used by the project:

```text
id
profile_id
title
constructor_type
geometry
zodiac_visible_count
altar_center_ratio
business_vertex_zone_count
star_variant
chess_variant
cover_ref
object_refs
central_photo_id
tradition_id
tradition_title
resource_comparison_mode
resource_without_mandala_comment
resource_with_mandala_comment
created_at
updated_at
```

Rule:

```text
A mandala becomes public only through a service row.
The composition itself remains private/owner-scoped unless public rendering is explicitly designed.
```

### 3.2. Service drafts and published services

Storage:

```text
public.profile_cabinet_services
```

One table stores all service states.

```text
status = draft      -> master-only draft in /profile/services
status = published  -> public service in shop and public link
status = archived   -> hidden from public, kept for history
```

Current fields are enough for basic draft/publish:

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

Recommended additional fields for a clearer public shop, if Codex confirms schema migration is safe:

```text
public_slug text unique null
short_description text not null default ''
category text not null default 'mandala'
delivery_modes jsonb not null default '["signature","no_signature","both"]'::jsonb
is_public_link_enabled boolean not null default false
published_at timestamptz null
archived_at timestamptz null
```

Minimum no-migration route strategy:

```text
/services/:serviceId
```

Uses the existing UUID `id`, so no `public_slug` is required for Phase 1/2.

Future prettier route strategy:

```text
/services/:public_slug
```

Requires `public_slug`.

### 3.3. Public links

Canonical public link format for MVP:

```text
https://mentalica.vercel.app/services/<service_id>
```

Legacy equivalent during migration:

```text
https://reiki-yggdrasil.vercel.app/services/<service_id>
```

Where the link is generated:

```text
frontend helper, not stored as full URL
```

Recommended helper:

```text
buildServicePublicUrl(service, origin = window.location.origin)
```

MVP implementation:

```text
origin + "/services/" + service.id
```

Do not store full production URL in Supabase. Store stable ID/slug only; build the URL from current `window.location.origin` so preview, production, and legacy domains work.

Visibility rule:

```text
service.status === "published"
→ public link is active and copyable

service.status === "draft"
→ service has an internal future link target, but UI should say:
  "Ссылка появится после публикации"
  or allow copying only as preview/admin if implemented safely

service.status === "archived"
→ public route returns not found / unavailable
```

UX rule from Andrey:

```text
When a saved mandala is added to the shop, a public link for clients must appear.
```

Precise implementation:

1. `В услуги` creates/opens service draft.
2. Draft has service ID immediately.
3. In Services tab show a link area:

```text
Публичная ссылка
Станет доступна после публикации.
```

4. After `Опубликовать`, show:

```text
Публичная ссылка для клиентов
https://mentalica.vercel.app/services/<service_id>
[Скопировать ссылку]
```

5. Copy action writes the URL to clipboard and shows:

```text
Ссылка скопирована. Её можно отправить клиенту.
```

### 3.4. Orders

Current storage:

```text
public.profile_cabinet_service_orders
```

Current order state:

```text
new → in_progress → sent → closed
```

Recommended final order state:

```text
draft → new → in_progress → sent → closed
```

Current order table is enough for a public lead-form MVP but not enough for final authenticated checkout.

Final checkout needs additional fields:

```text
client_profile_id uuid null references public.profile_cabinet_profiles(id)
order_format text not null default 'signature' check (order_format in ('signature','no_signature','both'))
goal_text text not null default ''
comment_text text not null default ''
attachment_refs jsonb not null default '[]'::jsonb
submitted_at timestamptz null
```

Order ownership:

```text
master_profile_id
→ the master who owns the service and sees the order in Заявки / Заявки на мои услуги

client_profile_id
→ the authenticated client who created the order and sees it in Мои заказы
```

Do not confuse:

```text
/profile/services
→ services created by the master

/profile/orders or /profile/incoming-orders
→ orders addressed to the master

/profile/my-orders
→ orders created by the current user as client
```

If only one `/profile/orders` tab exists in Phase 1, it should remain master incoming orders because current helper `listOwnServiceOrders(profileId)` is master-oriented.

---

## 4. Exact business flow

### 4.1. Master: create mandala

Route:

```text
/profile/mandalas
```

Data written:

```text
profile_cabinet_power_place_compositions
```

Actions:

```text
Сохранить место силы
В услуги / Опубликовать в услугах
Скачать PDF
Печать
```

If master clicks `В услуги` before saving:

```text
App must save composition first.
```

If save fails:

```text
Do not navigate to services.
Show inline error in Mandalas module.
```

### 4.2. Master: send mandala to services

Trigger:

```text
button: В услуги / Опубликовать в услугах
```

Function target:

```text
handleSendCompositionToServices()
```

Required algorithm:

```text
1. Validate profile.id and session.
2. Build composition payload from compositionDraft.
3. If compositionDraft.id exists:
   update profile_cabinet_power_place_compositions.
4. If compositionDraft.id is empty:
   create profile_cabinet_power_place_compositions.
5. Refresh listPowerPlaceCompositions(profile.id, session).
6. Get savedComposition.id.
7. Find existing service for this composition_id, if any.
8. If existing service exists:
   open it in Services editor.
9. If no service exists:
   prepare or create service draft:
     profile_id = profile.id
     composition_id = savedComposition.id
     title = savedComposition.title || "Мандала Места Силы"
     description = "Услуга подготовлена из сохранённой мандалы."
     image_url / image_bucket / image_path = stable preview only
     price_currency = "EUR"
     status = "draft"
10. Navigate to /profile/services.
11. Show notice:
    "Мандала сохранена и подготовлена как черновик услуги."
```

Important decision:

For clearer UX, Phase 1 should create the service draft row immediately, not only fill an unsaved form. This guarantees:

- the service has an `id`;
- the future public link can be shown immediately as inactive/unpublished;
- refresh does not lose the draft;
- later publication is just status update.

If Codex decides not to create the row immediately, it must explain why and preserve no-data-loss behavior.

### 4.3. Master: edit service draft

Route:

```text
/profile/services
```

Data read:

```text
listOwnServices(profile.id, session)
```

Data written:

```text
profile_cabinet_services
```

Draft location:

```text
profile_cabinet_services where profile_id = current profile id and status = 'draft'
```

Published services location:

```text
profile_cabinet_services where profile_id = current profile id and status = 'published'
```

Archived services location:

```text
profile_cabinet_services where profile_id = current profile id and status = 'archived'
```

Services tab sections:

```text
Черновики
Опубликованные
Архив
```

Minimum card fields:

```text
title
description preview
price/currency
status
composition_id indicator
public link status
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
Удалить / Архивировать later
```

Published actions:

```text
Сохранить изменения
Скопировать публичную ссылку
Снять с публикации / В архив later
```

### 4.4. Master: publish service

Action:

```text
Опубликовать
```

Data update:

```text
profile_cabinet_services.status = 'published'
published_at = now() if field exists
is_public_link_enabled = true if field exists
```

MVP without extra fields:

```text
profile_cabinet_services.status = 'published'
```

After publish:

```text
1. reload own services list
2. selected service status becomes published
3. public link block becomes active
4. copy button appears
```

Public link block:

```text
Публичная ссылка для клиентов
https://mentalica.vercel.app/services/<service_id>
[Скопировать ссылку]
```

Copy implementation:

```text
navigator.clipboard.writeText(publicUrl)
```

Fallback:

```text
selectable input with URL
```

### 4.5. Client: open public service link

Route:

```text
/services/:serviceId
```

Vercel rewrite needed:

```json
{
  "source": "/services/:serviceId",
  "destination": "/"
}
```

Data read:

```text
listPublicServices or getPublicServiceById
```

Important: client must only see:

```text
profile_cabinet_services.status = 'published'
```

Draft and archived services must return:

```text
not found / Услуга недоступна
```

Public page content:

```text
image / preview
title
description
price
format selector
CTA
master display name if safe/available
```

Format selector:

```text
signature      -> С подписью мастера
no_signature   -> Без подписи мастера
both           -> Две версии
```

CTA:

```text
if authenticated:
  Оформить заказ
else:
  Войти через Google и оформить заказ
```

### 4.6. Client: selected service and format survive Google login

Before OAuth, save pending checkout:

```text
localStorage key: reiki-yggdrasil-pending-service-checkout
```

Value:

```json
{
  "service_id": "<service id>",
  "format": "signature | no_signature | both",
  "return_to": "/profile/orders?checkout=1",
  "created_at": "ISO timestamp"
}
```

Rules:

- Do not store private user data here.
- Expire after a safe time, for example 24 hours.
- Clear after order draft is created or user cancels checkout.

After Google login:

```text
/profile/orders?checkout=1
```

or future route:

```text
/profile/my-orders?checkout=1
```

The cabinet reads pending checkout, verifies service is still published, and creates/opens order draft.

### 4.7. Client: create order

Current MVP can create order as `new`, but final UX should create `draft` first.

Recommended final flow:

```text
1. createDraftServiceOrder()
2. user fills request/goal/comment/attachments
3. submitServiceOrder()
4. status changes draft -> new
```

Order data:

```text
service_id
master_profile_id
client_profile_id
order_format
request_text
goal_text
comment_text
client_photo_url / client_photo_bucket / client_photo_path
attachment_refs
status
```

Master sees submitted orders where:

```text
master_profile_id = current profile.id
status != 'draft'
```

Client sees own orders where:

```text
client_profile_id = current profile.id
```

---

## 5. Route map

### Existing protected routes

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

### Required public service routes

MVP:

```text
/services/:serviceId
```

Optional later:

```text
/shop
/services/:publicSlug
```

Vercel rewrite to add when route exists:

```json
{
  "source": "/services/:serviceId",
  "destination": "/"
}
```

If `/shop` is added:

```json
{
  "source": "/shop",
  "destination": "/"
}
```

Do not add fake copy-link if these routes are not implemented.

---

## 6. UI mechanics by screen

### 6.1. `/profile/mandalas`

Add/keep action:

```text
Опубликовать в услугах
```

Button can still be shorter as `В услуги` if layout requires.

Click result:

```text
Saving mandala...
Creating service draft...
Opening Services...
```

Visible success:

```text
Мандала сохранена и подготовлена как черновик услуги.
```

Visible failure examples:

```text
Не удалось сохранить мандалу. Проверьте подключение или Supabase RLS.
Не удалось создать черновик услуги. Проверьте миграцию profile_cabinet_services.
```

### 6.2. `/profile/services`

Recommended layout:

```text
Left/list:
  Черновики
  Опубликованные
  Архив

Center/editor:
  Название
  Описание
  Цена
  Валюта
  Preview
  Связанная мандала

Right/actions:
  Статус
  Сохранить черновик
  Опубликовать
  Публичная ссылка
  Скопировать ссылку
```

Draft public link area:

```text
Публичная ссылка
Ссылка появится после публикации.
```

Published public link area:

```text
Публичная ссылка для клиентов
https://mentalica.vercel.app/services/<service_id>
[Скопировать ссылку]
```

Archived public link area:

```text
Услуга в архиве. Публичная ссылка отключена.
```

### 6.3. `/services/:serviceId`

Public page states:

```text
loading
not found / unavailable
authorized client CTA
unauthorized client CTA
auth pending / redirecting
```

Public page must not expose:

```text
private object_refs if they contain private storage paths
raw bucket paths without signed/public rendering strategy
owner-only profile internals
access tokens
```

Preview image strategy:

- Use `image_url` if external/public.
- If `image_bucket/image_path` is private, do not expose raw path.
- For MVP, prefer storing a safe public/export preview URL in `image_url` or mark preview as needs verification.

---

## 7. Data access / RLS model

### 7.1. Services RLS

Master own services:

```text
authenticated user can select/insert/update/delete or archive rows where
profile_cabinet_profiles.id = profile_cabinet_services.profile_id
and profile_cabinet_profiles.user_id = auth.uid()
```

Public service read:

```text
anon/authenticated can read services where
status = 'published'
and owner profile is approved
```

Draft protection:

```text
anon cannot read draft
other users cannot read draft
```

### 7.2. Orders RLS — current vs final

Current MVP:

```text
anon/authenticated can insert orders for published services
master can read/update orders where master_profile_id belongs to them
```

Final checkout target:

```text
authenticated client creates draft/new order
client can read own orders by client_profile_id
master can read submitted incoming orders by master_profile_id
anon cannot create final orders
```

Migration likely needed for final checkout.

---

## 8. Implementation phases

### Phase 1 — Safe mandala-to-service bridge in Profile Lite

Goal:

```text
/profile/mandalas → В услуги → guaranteed saved composition → service draft row → /profile/services
```

Implementation requirements:

1. Refactor composition saving into a reusable helper, for example:

```text
saveCurrentCompositionDraft()
```

It must:

- require `profile.id` and session credential;
- build payload with `profile_id`;
- create or update composition;
- refresh `listPowerPlaceCompositions(profile.id, session)`;
- return the saved composition with a real `id`;
- keep inline errors in Mandalas module, not crash shell.

2. Update `handleSendCompositionToServices()`:

- call the reusable save helper first;
- use returned saved composition ID as `composition_id`;
- search existing own service with same `composition_id`;
- if exists, open existing service in editor;
- if not exists, create `profile_cabinet_services` row with `status='draft'`;
- avoid saving `data:image` as permanent refs;
- prefer stable storage refs or external URLs;
- navigate to `/profile/services`.

3. Add service draft notice:

```text
Мандала сохранена и подготовлена как черновик услуги.
```

4. Add public link block in Services tab:

- draft: link inactive / appears after publication;
- published: active URL + copy button;
- archived: disabled.

Acceptance checklist:

```text
[ ] /profile/mandalas opens.
[ ] `В услуги` or `Опубликовать в услугах` exists.
[ ] Clicking button saves a new unsaved composition first.
[ ] Clicking button keeps/updates existing composition if already saved.
[ ] Service draft row is created in profile_cabinet_services.
[ ] Service draft receives real composition_id.
[ ] /profile/services opens after click.
[ ] service title is prefilled from mandala title.
[ ] service description has a safe default.
[ ] preview does not persist data:image.
[ ] draft link area says link appears after publication.
[ ] Save draft works or shows clear needs verification.
[ ] Publish works or shows clear needs verification.
[ ] Published service shows public link.
[ ] Copy link copies URL or shows safe fallback.
[ ] Services failure does not close shell.
```

### Phase 2 — Services module completion

Goal:

```text
Profile Lite services tab becomes a practical service manager.
```

Requirements:

1. Own services list sections:
   - `Черновики`
   - `Опубликованные`
   - `Архив`
2. Select existing service for editing.
3. Save updates to existing service, not only create new rows.
4. Publish existing draft.
5. Archive/unpublish if supported and safe.
6. Add copy-link action for published services.
7. If public route does not exist, show `needs verification` instead of fake link.

Acceptance checklist:

```text
[ ] Services tab opens.
[ ] Services list loads.
[ ] Empty state is clear.
[ ] Drafts are visible separately.
[ ] Published services are visible separately.
[ ] Archived services are hidden or separate.
[ ] Service draft from mandala appears.
[ ] Existing service can be selected.
[ ] Title edit works.
[ ] Description edit works.
[ ] Save updates existing service.
[ ] Publish sets status published.
[ ] Status text is RU.
[ ] Copy link works or says needs verification.
```

### Phase 3 — Public shop/profile route

Goal:

```text
published services are visible and shareable publicly.
```

Files likely involved:

```text
src/main.jsx
src/index.css
src/lib/profileServicesClient.js
vercel.json
test/profileServicesClient.test.mjs
```

Requirements:

1. Add `getPublicServiceById(serviceId)` or equivalent.
2. Add `/services/:serviceId` route.
3. Add Vercel rewrite for `/services/:serviceId`.
4. Public route loads only `status='published'` service.
5. Public route shows safe empty/not-found state.
6. Add format selector.
7. Add CTA based on auth state.

Acceptance checklist:

```text
[ ] Published service is visible publicly.
[ ] Draft service is not visible publicly.
[ ] Archived service is not visible publicly.
[ ] /services/:serviceId refresh works on Vercel.
[ ] Service profile has format selector.
[ ] CTA text changes by auth state.
[ ] No secrets/private refs are exposed.
```

### Phase 4 — Authenticated checkout/order draft

Goal:

```text
client selects service+format before login → after Google login order draft is prefilled.
```

Likely schema additions:

```text
client_profile_id uuid null or not null depending final model
order_format text check in ('signature', 'no_signature', 'both')
goal_text text
comment_text text
attachment_refs jsonb default '[]'::jsonb
status allows draft
submitted_at timestamptz null
```

Likely client additions:

```text
createDraftServiceOrder
submitServiceOrder
listClientServiceOrders
listMasterServiceOrders
```

Acceptance checklist:

```text
[ ] selected service_id is saved before OAuth.
[ ] selected format is saved before OAuth.
[ ] Google login returns to profile/order draft.
[ ] order draft has selected service.
[ ] order draft has selected format.
[ ] request field exists.
[ ] goal field exists.
[ ] comment field exists.
[ ] attachments are supported or marked later phase.
[ ] submit changes status from draft to new.
[ ] master sees submitted order in incoming requests.
[ ] client sees own order in My orders if implemented.
```

---

## 9. Required checks

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

Viewport QA:

```text
desktop 1280x920
desktop 1366x900
mobile 390x900
```

Verify:

```text
[ ] no horizontal overflow
[ ] no console errors
[ ] shell opens even if services fail
[ ] services error is inline
[ ] mandala save and service draft path works
[ ] public link appears only after publish
[ ] copy public link works for published services
[ ] no raw token/env values in UI or logs
```

Live verification after merge/deploy:

```text
https://mentalica.vercel.app/profile/mandalas
https://mentalica.vercel.app/profile/services
https://mentalica.vercel.app/profile-old
https://mentalica.vercel.app/masters
https://mentalica.vercel.app/profile/admin
https://mentalica.vercel.app/services/<published_service_id>
https://reiki-yggdrasil.vercel.app/profile/mandalas
https://reiki-yggdrasil.vercel.app/profile/services
https://reiki-yggdrasil.vercel.app/services/<published_service_id>
```

---

## 10. Minimal Codex prompt for Phase 1

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
Восстановить и довести сценарий “сохранённая мандала → в услуги → публикация в магазин → публичная ссылка для клиентов” на базе Profile Lite, используя старую реализацию из тяжёлого /profile-old как reference.

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

Главное понимание:
- Черновики услуг и опубликованные услуги хранятся в одной таблице `profile_cabinet_services`.
- Отличие только в `status`:
  - `draft` — черновик мастера;
  - `published` — публичная услуга магазина;
  - `archived` — архив/скрыто.
- Сохранённая мандала хранится в `profile_cabinet_power_place_compositions`.
- Услуга связывается с мандалой через `profile_cabinet_services.composition_id`.
- Публичная ссылка строится из service id: `/services/<service_id>`.
- Ссылка появляется в UI после создания service draft, но активной для клиентов становится только после публикации.

Что реализовать минимально:
1. В Profile Lite изменить flow кнопки `В услуги` / `Опубликовать в услугах`:
   - если текущая мандала не сохранена или изменена, сначала сохранить/update composition;
   - получить реальный `composition_id`;
   - найти existing own service with same composition_id;
   - если есть — открыть его в Services editor;
   - если нет — создать service draft row в `profile_cabinet_services` со статусом `draft`;
   - заполнить service editor;
   - перейти на `/profile/services`;
   - показать: “Мандала сохранена и подготовлена как черновик услуги.”
2. В Services module сделать ясную механику хранения:
   - Черновики = `status='draft'`;
   - Опубликованные = `status='published'`;
   - Архив = `status='archived'`;
   - всё из `profile_cabinet_services`.
3. Добавить public link block:
   - draft: “Ссылка появится после публикации.”
   - published: show `window.location.origin + '/services/' + service.id` and button `Скопировать ссылку`.
   - archived: “Услуга в архиве. Публичная ссылка отключена.”
4. Если route `/services/:serviceId` ещё не реализован, либо:
   - добавить безопасную MVP route + Vercel rewrite;
   - либо показать `needs verification: публичный маршрут услуги ещё не подключен` и не показывать фейковую ссылку.
5. Не сохранять `data:image` как постоянный preview.
6. Не добавлять payment processing.
7. Не добавлять новый второй runtime.
8. Не трогать OAuth, env values, service-role keys.
9. Не ломать `/profile-old`, `/`, `/profile`, `/masters`, `/profile/admin`.
10. Сохранить RU-default interface.

Что проверить:
- `/profile/mandalas`:
  - создать/открыть мандалу;
  - нажать `В услуги`;
  - мандала сохраняется;
  - создаётся service draft row;
  - service draft имеет `composition_id`.
- `/profile/services`:
  - черновики видны отдельно;
  - опубликованные видны отдельно;
  - черновик можно сохранить;
  - черновик можно опубликовать;
  - после публикации появляется публичная ссылка;
  - `Скопировать ссылку` работает или показывает fallback.
- `/services/<published_service_id>` if route implemented:
  - published service opens;
  - draft service does not open publicly;
  - archived service does not open publicly;
  - refresh works on Vercel rewrite.
- `/profile-old`, `/`, `/masters`, `/profile/admin` smoke.
- mobile 390px: no horizontal overflow.
- desktop 1280/1366: layout stable.

Команды:
npm run test:profile-lite
npm run test:profile-services
npm run test:power-place
npm run test:profile-media
npm run test:profile-loading-recovery
npm run check
npm run build

Риски:
- Live Supabase may not have services/orders migration applied.
- Public service route may not exist yet.
- Copy link must not point to a fake/unimplemented route.
- Drafts must not be publicly readable.
- Private image storage refs must not leak.
- Existing heavy /profile-old must remain available.

Формат отчёта:
1. Branch
2. Changed files
3. Storage model implemented
4. Mandala → service draft flow
5. Public link behavior
6. What is published vs draft vs archived
7. Checks run
8. Browser QA / routes checked
9. Supabase migration status
10. Risks / not verified
```

---

## 11. Done definition

Phase 1 is done only when:

```text
[ ] New unsaved mandala can be sent to services and gets saved first.
[ ] Existing saved mandala can be sent to services and keeps real composition_id.
[ ] Service draft row is created in profile_cabinet_services.
[ ] Draft service stays private to owner/master.
[ ] Published service becomes public.
[ ] Service draft opens in /profile/services.
[ ] Service draft can be saved.
[ ] Service can be published if migration/RLS is applied.
[ ] Published service shows public client link.
[ ] Copy public link works or has safe fallback.
[ ] Draft and archived services are not public.
[ ] Missing migration/RLS shows inline needs verification, not shell crash.
[ ] /profile-old remains available.
[ ] /, /profile, /masters, /profile/admin remain unchanged.
[ ] Tests/build pass.
[ ] STATE.md and LOG.md are updated.
```
