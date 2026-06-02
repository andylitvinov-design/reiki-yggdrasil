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

This document consolidates everything currently known about the direction:

```text
saved mandala / Power Place composition
→ service draft
→ service editor
→ published service in shop
→ public service profile / link
→ client order
→ master request queue
```

The key user story is:

1. Master creates or opens a saved mandala in the cabinet.
2. Master clicks `В услуги` / `Опубликовать в услугах`.
3. The mandala is safely saved as a `profile_cabinet_power_place_compositions` row if needed.
4. A service draft is created or prepared with a real `composition_id`.
5. The Services tab opens with title, description, image/preview, price, status, and publication controls.
6. Master publishes the service.
7. Master can copy a public service link if the public route exists.
8. Client can open the service, choose format, log in with Google if needed, and create an order.

Current state:

- Data/client foundation exists.
- Supabase migration for services/orders exists.
- Old heavy `/profile-old` / `ProfilePage.jsx` integration exists as a manual patch reference.
- Profile Lite already has a Services module and a `В услуги` button.
- Profile Lite currently needs a safer mandala-to-service bridge that guarantees composition save before creating/filling service draft.
- Full public service profile `/services/:serviceId` and checkout flow are not yet confirmed as implemented.

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

Do not invent missing schema, routes, fields, or helper APIs.

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

Master scenario already defined there:

1. Master logs into `/profile`.
2. Master creates or selects a saved mandala / Power Place composition.
3. Master clicks `В услуги`.
4. Cabinet opens service editor.
5. Master edits title, description, preview, formats, price, publication status.
6. Master publishes service.
7. Master copies public service link.
8. Master sees incoming orders in `Заявки`.

Client scenario already defined there:

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

Relevant route contract:

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

This file is the most important old implementation reference. It contains the intended heavy-cabinet integration for:

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

This is the behavior Profile Lite should preserve, but implemented safely in Lite architecture.

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

This is the first implementation priority.

---

## 3. Target UX for this implementation pass

### 3.1. Master flow: mandala to service draft

Required behavior:

1. Master opens `/profile/mandalas`.
2. Master creates a mandala or opens a saved composition.
3. Master clicks `В услуги`.
4. If composition is not saved yet, the app saves it first.
5. If composition exists, the app updates it if needed or reuses the existing ID.
6. App fills service draft:
   - `profile_id`
   - `composition_id`
   - `title`
   - `description`
   - `image_url` / `image_bucket` / `image_path` where available
   - `price_currency`
   - `status: draft`
7. App navigates to `/profile/services`.
8. Services tab shows the prepared service draft.
9. Master edits title/description/price/preview.
10. Master saves draft.
11. Master publishes service.
12. Published service appears in own services list.

### 3.2. Service editor UX

Minimum fields:

```text
Название
Описание
Цена
Валюта
Изображение / preview
Статус
```

Minimum actions:

```text
Сохранить черновик
Опубликовать
Редактировать описание
Скопировать ссылку / needs verification if no public route exists
```

Important copy:

- Button from mandala module should be clear:
  - current acceptable: `В услуги`
  - preferred: `Опубликовать в услугах` if layout space allows
- After click:
  - `Мандала сохранена и подготовлена как черновик услуги.`
- If public link is not available:
  - `needs verification: публичная ссылка услуги ещё не подключена.`

### 3.3. Public service/shop UX — later or second pass

Target routes:

```text
/shop or existing public shop section
/services/:serviceId
```

Public service card:

```text
image / mandala preview
title
short description
price or Цена по запросу
master name if available
CTA: Подробнее
```

Public service profile:

```text
hero image
title
description
price
master info if available
format selector:
  signature      -> С подписью мастера
  no_signature   -> Без подписи мастера
  both           -> Две версии
CTA:
  Оформить заказ
  or Войти через Google и оформить заказ
```

This public route is not required for the first minimal safe bridge unless Codex confirms existing routing and low-risk implementation.

---

## 4. Implementation phases

### Phase 1 — Safe mandala-to-service bridge in Profile Lite

Goal:

```text
/profile/mandalas → В услуги → guaranteed saved composition → /profile/services draft
```

Files:

```text
src/pages/ProfileLitePage.jsx
src/pages/profile-lite/ProfileLitePowerPlaceModule.jsx
src/pages/profile-lite/ProfileLiteServicesModule.jsx
test/profileLiteCabinetContract.test.mjs
test/profileServicesClient.test.mjs
STATE.md
LOG.md
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
- build service form from saved composition;
- avoid saving `data:image` as permanent refs;
- prefer stable storage refs or external URLs;
- navigate to services route.

3. Add a visible service draft notice, for example:

```text
Мандала сохранена и подготовлена как черновик услуги.
```

4. Ensure Services form can save and publish the prepared draft.

5. Add/update tests.

Acceptance checklist:

```text
[ ] /profile/mandalas opens.
[ ] `В услуги` exists.
[ ] Clicking `В услуги` saves a new unsaved composition first.
[ ] Clicking `В услуги` keeps/updates existing composition if already saved.
[ ] serviceForm receives real composition_id.
[ ] /profile/services opens after click.
[ ] service title is prefilled from mandala title.
[ ] service description has a safe default.
[ ] preview does not persist data:image.
[ ] Save draft works or shows clear needs verification.
[ ] Publish works or shows clear needs verification.
[ ] Services failure does not close shell.
```

### Phase 2 — Services module completion

Goal:

```text
Profile Lite services tab becomes a practical service manager.
```

Requirements:

1. Own services list:
   - show title;
   - description;
   - price/currency;
   - status text;
   - linked composition if present.
2. Select existing service for editing.
3. Save updates to existing service, not only create new rows.
4. Publish existing draft.
5. Archive/unpublish only if supported and safe.
6. Add copy-link action if public route exists.
7. If public route does not exist, show `needs verification` instead of fake link.

Acceptance checklist:

```text
[ ] Services tab opens.
[ ] Services list loads.
[ ] Empty state is clear.
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

1. Confirm current public routing architecture.
2. Add `/services/:serviceId` only if it fits existing Vite SPA routing safely.
3. Add Vercel rewrite for `/services/:serviceId` if route is added.
4. Public route loads only published service.
5. Public route shows safe empty/not-found state.
6. Add format selector.
7. Add CTA based on auth state.

Acceptance checklist:

```text
[ ] Published service is visible publicly.
[ ] Draft service is not visible publicly.
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
```

Likely client additions:

```text
createDraftServiceOrder
submitServiceOrder
listClientServiceOrders
listMasterServiceOrders
```

Important security direction:

- Prefer authenticated client checkout for future flow.
- Avoid anonymous order creation for the final target checkout unless explicitly kept as public lead form.
- Separate client `Мои заказы` from master `Заявки на мои услуги`.

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

## 5. Data model notes

### Current service model is enough for Phase 1

Existing `profile_cabinet_services.composition_id` is enough to link a service to a saved mandala.

Phase 1 should avoid adding new schema unless required.

### Current order model is not enough for final checkout

For final client checkout, current order schema needs expansion because it does not separately store:

```text
client_profile_id
order_format
goal_text
comment_text
attachment_refs
status=draft
```

This belongs in Phase 4, not the first minimal bridge, unless Codex proves it can be added safely with tests and RLS.

---

## 6. Known risks

1. Live Supabase may not have `20260529090000_master_services_orders_mvp.sql` applied.
2. RLS may allow old anonymous insert, while final target wants authenticated checkout.
3. `handleSendCompositionToServices()` can currently create a service draft without a saved composition ID.
4. Public route `/services/:serviceId` is not confirmed in `vercel.json`.
5. Copy link can be misleading if route does not exist.
6. `data:image` previews must not be persisted as saved permanent image refs.
7. Old patch script is useful as reference but should not be blindly run on current main.
8. Old heavy `ProfilePage.jsx` should not be copied wholesale into Profile Lite.
9. Services/orders module errors must not break Profile Lite shell.
10. Any route changes must preserve `/`, `/profile`, `/profile-old`, `/masters`, `/profile/admin`.

---

## 7. Required checks

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
[ ] no raw token/env values in UI or logs
```

Live verification after merge/deploy:

```text
https://mentalica.vercel.app/profile/mandalas
https://mentalica.vercel.app/profile/services
https://mentalica.vercel.app/profile-old
https://mentalica.vercel.app/masters
https://mentalica.vercel.app/profile/admin
https://reiki-yggdrasil.vercel.app/profile/mandalas
https://reiki-yggdrasil.vercel.app/profile/services
```

---

## 8. Minimal Codex prompt for Phase 1

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
Восстановить и довести сценарий “сохранённая мандала → в услуги → публикация в магазин” на базе Profile Lite, используя старую реализацию из тяжёлого /profile-old как reference.

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

Контекст:
- В старом patch-script `scripts/apply-master-services-orders-mvp.mjs` есть правильный паттерн: `handlePowerPlaceToService` сначала сохраняет Power Place composition, затем создаёт service draft с `composition_id` и открывает services.
- В текущем Profile Lite уже есть кнопка `В услуги`, но `handleSendCompositionToServices()` не гарантирует сохранение composition перед переносом.
- Нужно сделать безопасный минимальный фикс именно для Profile Lite, не переписывая весь кабинет.

Конкретные файлы:
- src/pages/ProfileLitePage.jsx
- src/pages/profile-lite/ProfileLitePowerPlaceModule.jsx
- src/pages/profile-lite/ProfileLiteServicesModule.jsx
- src/lib/profileServicesClient.js
- test/profileLiteCabinetContract.test.mjs
- test/profileServicesClient.test.mjs
- STATE.md
- LOG.md

Что реализовать минимально:
1. В Profile Lite изменить flow кнопки `В услуги`:
   - если текущая мандала не сохранена или изменена, сначала сохранить/update composition через существующие `createPowerPlaceComposition` / `updatePowerPlaceComposition`;
   - после successful save получить реальный `composition_id`;
   - заполнить `serviceForm`:
     - profile_id
     - composition_id
     - title
     - description default: “Услуга подготовлена из сохранённой мандалы.”
     - image_url / image_bucket / image_path по доступному preview, не сохранять `data:image`
     - price_currency default EUR
   - перейти на `/profile/services`;
   - показать понятное сообщение: “Мандала сохранена и подготовлена как черновик услуги.”
2. В Services module добавить/проверить UX:
   - список услуг;
   - форма редактирования описания;
   - кнопка “Сохранить черновик”;
   - кнопка “Опубликовать”;
   - действие “Скопировать ссылку” только если public route/link реально существует;
   - если public link пока не реализован, показать safe placeholder `needs verification: публичная ссылка услуги ещё не подключена`.
3. Не добавлять payment processing.
4. Не добавлять новый второй runtime.
5. Не трогать OAuth, env values, service-role keys.
6. Не ломать `/profile-old`; он остаётся reference.
7. Не ломать `/`, `/profile`, `/masters`, `/profile/admin`, Vercel rewrites.
8. Сохранить RU-default interface.
9. Сохранить mobile usability и desktop layout.

Что проверить:
- `/profile/mandalas`:
  - открыть мандалы;
  - создать/загрузить сохранённую мандалу;
  - нажать `В услуги`;
  - проверить, что мандала сохраняется;
  - проверить, что открывается `/profile/services`;
  - проверить, что serviceForm заполнен и содержит `composition_id`.
- `/profile/services`:
  - список услуг открывается;
  - черновик услуги можно сохранить;
  - услугу можно опубликовать;
  - описание можно редактировать;
  - ошибка services не закрывает весь shell.
- `/profile-old`:
  - доступен как reference.
- `/`, `/masters`, `/profile/admin`:
  - smoke check.
- mobile 390px:
  - нет horizontal overflow.
- desktop 1280/1366:
  - layout не развалился.

Команды:
npm run test:profile-lite
npm run test:profile-services
npm run test:power-place
npm run test:profile-media
npm run test:profile-loading-recovery
npm run check
npm run build

Дополнительно:
- Проверить, применена ли миграция `20260529090000_master_services_orders_mvp.sql` в live Supabase. Если live недоступен — написать `not verified`.
- Не выводить env values. Только env names:
  - VITE_SUPABASE_URL
  - VITE_SUPABASE_ANON_KEY
  - VITE_ADMIN_EMAIL

Риски:
- `profile_cabinet_services` / `profile_cabinet_service_orders` могут отсутствовать в live Supabase.
- Public service profile `/services/:serviceId` может быть не реализован.
- Copy public link может быть `needs verification`, если route отсутствует.
- Сохранение preview image не должно сохранять временные `data:image`.
- Нельзя возвращать старый heavy `/profile` как основной путь без отдельного решения.

Формат отчёта:
1. Branch
2. Changed files
3. Что найдено в старой реализации
4. Что перенесено в Profile Lite
5. Что осталось needs verification
6. Checks run
7. Browser QA / routes checked
8. Supabase migration status
9. Risks
10. Нужно ли обновить STATE.md / LOG.md
```

---

## 9. Done definition

Phase 1 is done only when:

```text
[ ] New unsaved mandala can be sent to services and gets saved first.
[ ] Existing saved mandala can be sent to services and keeps real composition_id.
[ ] Service draft opens in /profile/services.
[ ] Service draft can be saved.
[ ] Service can be published if migration/RLS is applied.
[ ] Missing migration/RLS shows inline needs verification, not shell crash.
[ ] /profile-old remains available.
[ ] /, /profile, /masters, /profile/admin remain unchanged.
[ ] Tests/build pass.
[ ] STATE.md and LOG.md are updated.
```
