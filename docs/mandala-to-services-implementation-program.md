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

These decisions are canonical.

### 0.1. Public link timing

Public client link appears only after service publication.

```text
Draft service:
  no active public client link
  UI: Ссылка появится после публикации.

Published service:
  active public link appears
  UI: Публичная ссылка для клиентов
  button: Скопировать ссылку
```

### 0.2. Three separate mandala actions

In the mandala workspace there must be three separate buttons:

```text
1. Сохранить мандалу
2. Перенести в услуги
3. Опубликовать как услугу
```

Meaning:

- `Сохранить мандалу` saves/updates only the private master composition.
- `Перенести в услуги` saves the mandala if needed and creates/opens a service draft.
- `Опубликовать как услугу` saves the mandala if needed, creates/opens the service, publishes it immediately, and shows the public client link.

### 0.3. Service is a reusable template

A service is a reusable mandala template, not a final client result.

```text
master template composition
→ profile_cabinet_services.composition_id
→ client order
→ personal client result composition
```

Each client order creates its own personal result composition. Never overwrite the template composition.

### 0.4. One auth profile, two cabinet modes

One Google/auth user has one profile row. The same `profile_cabinet_profiles.id` is used for both roles:

```text
client_profile_id → profile_cabinet_profiles.id
master_profile_id → profile_cabinet_profiles.id
```

UI modes:

```text
Кабинет Личный
  → Мои Заказы
  → Мои Фото

Кабинет Мастера
  → Заявки
  → Услуги
  → Мандалы
```

Do not create separate user accounts for client and master roles.

### 0.5. Public shop and master services are different surfaces

```text
/profile/services
→ master cabinet tab for managing own services/templates/drafts/published services

/shop or existing Магазин page/tab
→ public site shop where all published services are visible
```

Codex must first find the existing shop page/section before creating a new `/shop` route.

### 0.6. Publication is immediate

No moderation gate for MVP. Publishing immediately makes service public if RLS/migration allows it.

### 0.7. Cart MVP is one-service cart

Decision: **cart MVP supports one service at a time**.

No multi-item cart in first pass.

```text
Add service to cart
→ cart has one item
→ replacing cart item is allowed
→ checkout one service order
```

Multi-item cart is later.

### 0.8. Ordering goes through cart and personal cabinet

Target public flow:

```text
public shop / service page
→ choose service and format
→ add to one-service cart
→ checkout
→ prompt Google authorization / personal cabinet confirmation
→ Кабинет Личный / Мои Заказы
→ choose/upload client photo
→ send order to master
→ order appears in Кабинет Мастера / Заявки
```

### 0.9. Client photos: max 4 photos in personal profile

Client can have up to **4 photos** in the personal cabinet profile.

Storage should reuse existing private media/storage flow where possible.

Rules:

```text
Кабинет Личный / Мои Фото:
  max 4 saved client photos
  user can upload a new photo if under limit
  user can choose any already uploaded photo when confirming an order
```

When confirming order:

```text
If client already has photos:
  show photo picker with saved photos
  allow selecting one photo for this order

If client has no photos:
  show modal/form:
  Загрузите своё фото, чтобы отправить заказ в работу Мастеру.
```

Do not require photo before cart checkout. Photo is selected/uploaded in `Кабинет Личный → Мои Заказы`.

### 0.10. Master order workflow

When order is ready for master:

1. Order appears in `Кабинет Мастера → Заявки`.
2. Draft personal mandala result is generated from service template.
3. Client selected/uploaded photo is inserted in the center.
4. Master either approves/sends automatic draft or edits/adds comments/sends.

### 0.11. Result delivery

Client sees final result in:

```text
Кабинет Личный → Мои Заказы
```

Result card must show:

```text
preview image
status
master comment if present
open result
download result
```

MVP download can use existing PDF/print flow. PNG/JPEG export is `needs verification` unless implemented.

### 0.12. Delivery modes

Formats:

```text
signature      → С подписью мастера
no_signature   → Без подписи мастера
both           → Две версии
```

Short MVP rule for `both`:

```text
Store order_format = both.
MVP may deliver one final result first.
Dual-result UI can be later.
```

Final target:

```text
both → automatic result + master-finished result
```

### 0.13. Pricing default

Default price is free.

```text
price_amount = null or 0
price_currency = EUR
public/cart label = Бесплатно
```

No payment flow for free MVP.

### 0.14. Public service route

Use:

```text
/services/<service_id>
```

Add/verify Vercel rewrite:

```json
{
  "source": "/services/:serviceId",
  "destination": "/"
}
```

---

## 1. Intuitive product rules

This section exists to prevent technically correct but unintuitive implementation.

### 1.1. The user should always understand where they are

Every screen must clearly answer:

```text
Am I acting as a client or as a master?
Am I editing a private mandala, a service template, an order, or a client result?
Is this object private, draft, published, sent, or archived?
What is the next action?
```

Required labels:

```text
Кабинет Личный
Кабинет Мастера
Черновик услуги
Опубликовано
Ожидает фото
Заявка отправлена мастеру
В работе у мастера
Результат отправлен
```

### 1.2. Never hide the next step

Every major state must have one primary next action.

Examples:

```text
Saved mandala, not service yet:
  primary action: Перенести в услуги

Service draft:
  primary action: Опубликовать

Published service:
  primary action: Скопировать ссылку

Cart item:
  primary action: Оформить заказ

Client order without photo:
  primary action: Загрузить / выбрать фото

Client order with photo but not submitted:
  primary action: Отправить заказ мастеру

Master order with generated draft:
  primary action: Отправить клиенту or Открыть и редактировать

Sent client result:
  primary action: Открыть результат / Скачать
```

### 1.3. Do not make irreversible actions silent

Actions that change visibility or submit work must show confirmation or a clear result notice:

```text
Опубликовать как услугу
Отправить заказ мастеру
Отправить клиенту
Архивировать услугу
Удалить фото
```

MVP can use lightweight confirm dialogs for destructive actions.

### 1.4. Template and client result must feel different

UI must not confuse:

```text
Шаблон услуги
Персональная мандала клиента
```

Labels:

```text
Шаблон услуги
Мандала заказа
Персональный результат
```

Never call a generated order result just “услуга”.

### 1.5. Drafts must feel safe

Draft service and draft order states are private working states. UI should communicate:

```text
Черновик виден только вам.
Ссылка появится после публикации.
Заказ ещё не отправлен мастеру.
```

### 1.6. Published objects must be obvious

When service is published, show:

```text
Опубликовано в магазине
Публичная ссылка для клиентов
Скопировать ссылку
```

### 1.7. Missing data should produce useful empty states

Empty states:

```text
No mandalas:
  Сначала создайте и сохраните мандалу.

No services:
  Перенесите мандалу в услуги или создайте услугу из шаблона.

No public services:
  Опубликованные услуги появятся здесь после публикации мастерами.

No client photos:
  Загрузите фото, чтобы отправить заказ мастеру.

No client orders:
  Ваши заказы появятся здесь после оформления услуги в магазине.

No master orders:
  Заявки клиентов появятся здесь после оформления заказов.
```

### 1.8. Error messages must tell what to do

Bad:

```text
Request failed.
```

Good:

```text
Не удалось создать черновик услуги. Проверьте, применена ли миграция profile_cabinet_services.
```

```text
Не удалось загрузить фото. Попробуйте ещё раз или выберите уже загруженное фото.
```

```text
Не удалось открыть публичную ссылку: маршрут /services/:serviceId ещё не подключён.
```

### 1.9. Keep phases separate

Codex must not implement the entire system during Phase 1.

```text
Phase 1 = only mandala → service template bridge.
Phase 2 = services manager.
Phase 3 = public shop + service page + one-service cart.
Phase 4 = personal/master cabinet order split.
Phase 5 = personal result generation and delivery.
```

If later-phase code is touched, Codex must explain why and mark risks.

---

## 2. Storage model

### 2.1. Mandalas / compositions

Storage:

```text
profile_cabinet_power_place_compositions
```

Used for:

```text
master template mandalas
personal client draft/final result mandalas
```

Rule:

```text
template composition must never be overwritten by order result generation
```

### 2.2. Services

Storage:

```text
profile_cabinet_services
```

States:

```text
draft      → master-only draft
published  → public shop + public link
archived   → hidden from public
```

Core link:

```text
profile_cabinet_services.composition_id
→ template composition id
```

### 2.3. Orders

Storage:

```text
profile_cabinet_service_orders
```

Recommended fields for final flow:

```text
client_profile_id
master_profile_id
service_id
order_format
goal_text
comment_text
attachment_refs
template_composition_id
client_photo_bucket
client_photo_path
client_photo_url
draft_result_composition_id
auto_result_composition_id
master_result_composition_id
final_result_composition_id
master_comment
status
submitted_at
sent_at
```

MVP minimal additions:

```text
client_profile_id
order_format
template_composition_id
draft_result_composition_id
final_result_composition_id
```

### 2.4. Client photos

Storage should use existing media/profile storage if possible.

Target logical source:

```text
client personal profile photos
max 4 per profile
private storage refs only
```

Rules:

- no `data:image` persistence;
- no raw private storage paths in public UI;
- use signed URLs for authenticated display;
- client can choose an existing saved photo for order;
- selected photo ref is copied/linked to order fields.

---

## 3. Status model

### 3.1. Service statuses

```text
draft
published
archived
```

### 3.2. Order statuses

Recommended final statuses:

```text
draft
photo_required
new
in_progress
ready_for_review
sent
closed
cancelled
```

Meaning:

```text
draft
→ order exists after checkout/pending confirmation, not submitted to master yet.

photo_required
→ client must select/upload photo before master can work.

new
→ client confirmed order and photo is selected/uploaded.

in_progress
→ master opened/started work.

ready_for_review
→ draft personal mandala was generated and awaits master approval/editing.

sent
→ master sent final result to client.

closed
→ completed/archived done order.

cancelled
→ cancelled by client/master/admin if later implemented.
```

If migration is too much for one pass, Codex must document compromise and not pretend final status model is fully implemented.

---

## 4. Exact business flow

### 4.1. Master: save/transfer/publish mandala

Route:

```text
/profile/mandalas
```

Buttons:

```text
Сохранить мандалу
Перенести в услуги
Опубликовать как услугу
```

`Сохранить мандалу`:

```text
create/update composition only
```

`Перенести в услуги`:

```text
save/update composition
→ find service by composition_id
→ create service draft if missing
→ status = draft
→ open /profile/services
```

`Опубликовать как услугу`:

```text
save/update composition
→ find/create service
→ status = published
→ open /profile/services
→ show public link
```

### 4.2. Services manager

Route:

```text
/profile/services
```

Sections:

```text
Черновики
Опубликованные
Архив
```

Draft public link area:

```text
Ссылка появится после публикации.
```

Published public link:

```text
window.location.origin + '/services/' + service.id
```

### 4.3. Public shop and service page

Public shop shows:

```text
profile_cabinet_services where status = published
```

Service page:

```text
/services/:serviceId
```

Public service page must include:

```text
preview
title
description
price label, default Бесплатно
format selector
В корзину
```

### 4.4. One-service cart

Cart MVP:

```text
one service item only
```

Cart item:

```json
{
  "service_id": "...",
  "composition_id": "...",
  "master_profile_id": "...",
  "format": "signature | no_signature | both",
  "price_amount": null,
  "price_currency": "EUR"
}
```

Actions:

```text
Добавить в корзину
Открыть корзину
Удалить из корзины
Очистить корзину
Оформить заказ
```

### 4.5. Checkout and personal cabinet confirmation

Flow:

```text
checkout
→ if not authenticated: Google login
→ Кабинет Личный / Мои Заказы
→ order draft appears
→ client selects existing photo or uploads new photo
→ client confirms sending order to master
→ order status becomes new
→ master sees it in Заявки
```

Important decision:

After client selects/uploads photo, show explicit button:

```text
Отправить заказ мастеру
```

Do not silently submit without client confirmation.

### 4.6. Personal cabinet / My Orders

`Кабинет Личный → Мои Заказы` must show:

```text
own client orders
service title
selected format
status
selected client photo
photo upload/choose block if needed
master comment
result card if sent
open result
download result
```

### 4.7. Master cabinet / Requests

`Кабинет Мастера → Заявки` must show:

```text
incoming orders for own services
client name/profile if safe
service title
template mandala link
client selected photo
order format
status
draft generated result
open/edit result
approve/send
master comment
```

### 4.8. Personal result generation

Algorithm:

```text
1. Load service by order.service_id.
2. Load template composition by service.composition_id.
3. Clone template composition fields:
   constructor_type
   geometry
   variant fields
   object_refs
   cover_ref
   resource fields
4. Set profile_id = master_profile_id.
5. Set title = Заказ: <service title> / <client label>.
6. Replace center image with selected client photo ref.
7. Save new composition row.
8. Save new id to order.draft_result_composition_id.
9. Do not change original template composition.
```

### 4.9. Master edit and send

MVP edit flow:

```text
Заявка → Открыть мандалу заказа
→ opens ordinary mandala constructor with draft_result_composition_id
→ master edits/saves
→ returns to order
→ adds comment
→ Отправить клиенту
```

Send means:

```text
order.status = sent
order.final_result_composition_id = chosen/saved result composition
order.master_comment = comment
order.sent_at = now
client sees result in Мои Заказы
```

Not email/Telegram in MVP. External delivery later.

---

## 5. RLS / access rules

### 5.1. Profiles

One profile row can act as both client and master.

```text
profile_cabinet_profiles.id = client_profile_id
profile_cabinet_profiles.id = master_profile_id
```

### 5.2. Services

```text
owner/master can manage services where service.profile_id belongs to auth.uid()
public can read only status = published
public cannot read draft/archived
other users cannot read owner drafts
```

### 5.3. Orders

```text
client can read/update own order where client_profile_id belongs to auth.uid()
master can read/update incoming order where master_profile_id belongs to auth.uid()
public/anon cannot read orders
public/anon cannot read private photos/result refs
```

### 5.4. Photos/results

```text
client can access own uploaded photos
master can access selected order photo only for orders addressed to master
client can access final result only for own order after status = sent
public cannot access private order photos/results
```

---

## 6. Slippery cases / edge rules

### 6.1. Client has 4 photos already

If client already has 4 photos:

```text
disable new upload
show: Можно хранить до 4 фото. Удалите старое фото или выберите одно из существующих.
```

### 6.2. Client selects photo but does not send order

Order remains:

```text
draft or photo_required
```

Show button:

```text
Отправить заказ мастеру
```

### 6.3. Client changes photo after sending

MVP rule:

```text
After order.status = new or later, changing photo is disabled.
```

Later can add:

```text
Запросить замену фото
```

### 6.4. Master publishes service without description

Allowed, but show warning:

```text
Описание не заполнено. Услугу можно опубликовать, но лучше добавить описание.
```

### 6.5. Master deletes/archive service with active orders

MVP rule:

```text
Do not hard delete service with orders.
Archive only.
Existing orders keep service snapshot or linked service title.
```

### 6.6. Service template changed after orders exist

MVP rule:

```text
New orders use latest template.
Existing orders keep their generated draft_result_composition_id.
Do not regenerate old results automatically.
```

### 6.7. Both format

MVP short rule:

```text
order_format = both is stored.
One final result may be delivered first.
Dual-result display is later.
```

### 6.8. Free service

```text
price null/0 → Бесплатно
checkout button → Оформить заказ
no payment step
```

### 6.9. Public link without route

If `/services/:serviceId` is not implemented:

```text
Do not show fake copy link.
Show needs verification or implement route + rewrite in same tested PR.
```

### 6.10. Missing migrations/RLS

If services/orders migration is missing live:

```text
show inline needs verification
cabinet shell must stay open
```

### 6.11. PNG/JPEG export

```text
PDF/print may be used for MVP download.
PNG/JPEG export = needs verification unless implemented and tested.
```

### 6.12. Duplicate service from same mandala

MVP rule:

```text
If service already exists for composition_id, open/update existing service.
Do not create duplicate service unless a later explicit “Создать копию услуги” action is added.
```

### 6.13. User has no master profile details

If user acts as master but profile fields are incomplete:

```text
Allow draft service creation.
Before publication, warn: Заполните имя мастера / описание профиля, чтобы клиенты понимали, кто оказывает услугу.
```

Do not block publication unless RLS/profile approval requires it.

### 6.14. Public service opened after archive

Route must show:

```text
Услуга недоступна или снята с публикации.
```

Do not leak draft/archive details.

### 6.15. Checkout interrupted

If checkout is interrupted by login or refresh:

```text
Use pending cart/order localStorage key.
After successful login, restore cart/order draft.
If pending item is older than 24h, clear it and ask client to choose service again.
```

### 6.16. Client orders own service

MVP can allow it for testing, but UI should not special-case unless needed.

If blocked later, show:

```text
Вы не можете оформить заказ на собственную услугу.
```

### 6.17. Master sends without result

Block sending if no result exists:

```text
Сначала создайте или выберите результат мандалы заказа.
```

### 6.18. Result visibility before sent

Client must not see draft master work until order status is `sent`, unless a preview/review state is explicitly added later.

---

## 7. Implementation phases

### Phase 1 — Mandala to service template bridge

Scope:

```text
/profile/mandalas
/profile/services
```

Do:

```text
three buttons
save composition
create/open draft service
publish service
show public link after publish
free default price
```

Do not do:

```text
cart
orders
personal cabinet
result generation
```

unless explicitly requested.

### Phase 2 — Services manager completion

```text
Черновики / Опубликованные / Архив
edit service fields
copy public link
formats
archive behavior
```

### Phase 3 — Public shop + service page + one-service cart

```text
find existing shop
connect published services
/services/:serviceId
one-service cart MVP
checkout start
```

### Phase 4 — Personal/Master cabinet order split

```text
Кабинет Личный / Мои Заказы
Кабинет Мастера / Заявки
photo picker/upload up to 4 photos
send order to master
RLS for client/master access
```

### Phase 5 — Personal result generation and delivery

```text
generate draft personal mandala
master open/edit/approve/send
client result card
open/download result
```

---

## 8. Final full-system Definition of Done

```text
[ ] Master creates mandala.
[ ] Master saves mandala.
[ ] Master transfers mandala to service draft.
[ ] Master publishes service.
[ ] Public link appears only after publication.
[ ] Service appears in public shop.
[ ] Client opens service page.
[ ] Client selects format.
[ ] Client adds one service to cart.
[ ] Client checks out and logs in with Google if needed.
[ ] Client lands in Кабинет Личный / Мои Заказы.
[ ] Client selects one of up to 4 saved photos or uploads a new photo.
[ ] Client clicks Отправить заказ мастеру.
[ ] Order appears in Кабинет Мастера / Заявки.
[ ] Draft personal mandala is generated from template + client photo.
[ ] Master opens/edits or approves result.
[ ] Master adds comment if needed.
[ ] Master sends result.
[ ] Client sees result card in Мои Заказы.
[ ] Client opens result.
[ ] Client downloads result.
[ ] Template mandala was not overwritten.
[ ] Draft/archived services are not public.
[ ] Client cannot see other clients' orders.
[ ] Master cannot see other masters' orders.
[ ] Public cannot see private photos/results.
```

---

## 9. Phase 1 Codex prompt

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

Сначала прочитать:
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
src/pages/ProfileLitePage.jsx
src/pages/profile-lite/ProfileLitePowerPlaceModule.jsx
src/pages/profile-lite/ProfileLiteServicesModule.jsx
src/lib/profileServicesClient.js
src/lib/powerPlaceClient.js
supabase/migrations/20260529090000_master_services_orders_mvp.sql

Если файла нет — написать not found.

Phase 1 задача:
Реализовать только безопасный bridge: мандала → услуга-шаблон.

Сделать:
1. В /profile/mandalas три кнопки:
   - Сохранить мандалу
   - Перенести в услуги
   - Опубликовать как услугу
2. Сохранить мандалу сохраняет только composition.
3. Перенести в услуги:
   - save/update composition
   - find service by composition_id
   - create draft service if missing
   - status=draft
   - price default Бесплатно
   - open /profile/services
4. Опубликовать как услугу:
   - save/update composition
   - find/create service
   - status=published
   - price default Бесплатно
   - open /profile/services
   - show public link only after publish
5. /profile/services groups services:
   - Черновики
   - Опубликованные
   - Архив
6. Published service link:
   - window.location.origin + '/services/' + service.id
7. Draft link text:
   - Ссылка появится после публикации.

Не делать в Phase 1:
- cart
- order checkout
- personal cabinet
- master requests
- result generation
unless explicitly asked.

Preserve:
/profile-old
/
/profile
/masters
/profile/admin
RU default
Supabase auth/data flows
Vercel rewrites

Checks:
npm run test:profile-lite
npm run test:profile-services
npm run test:power-place
npm run test:profile-media
npm run test:profile-loading-recovery
npm run check
npm run build

Report:
Branch
Changed files
Three-button behavior
Storage model
Draft/published/archive behavior
Public link behavior
Checks run
Routes verified
Risks / not verified
```
