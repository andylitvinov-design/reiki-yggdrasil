# Reiki Yggdrasil — концепт реализации магазина услуг и заявок

Last updated: 2026-05-30

Status: plan / implementation concept

Target repo: `andylitvinov-design/reiki-yggdrasil`

Live URL: `https://reiki-yggdrasil.vercel.app`

Target implementation branch for future code work: `codex/service-shop-order-flow`

---

## 1. Цель

Собрать полноценный магазин услуг Reiki Yggdrasil, где пользователь может:

1. Найти услугу в публичной ленте / магазине.
2. Открыть профиль услуги.
3. Выбрать формат результата.
4. Авторизоваться через Google, если он ещё не вошёл.
5. После входа сразу попасть в кабинет на создание заказа с уже выбранной услугой и форматом.
6. Заполнить запрос, цель, комментарий, прикрепить фото/файлы/референсы.
7. Сначала сохранить заявку как `draft`.
8. После отправки перевести заявку в `new`.
9. Видеть в кабинете список своих заказов и статус каждого заказа.

Главный UX-принцип: пользователь не должен после Google authorization заново искать услугу или заново выбирать формат.

---

## 2. Найденная текущая структура repo

### 2.1. Подтверждённые project/repo docs

Перед реализацией Codex должен читать:

- `AGENTS.md`
- `README.md`
- `STATE.md`
- `LOG.md`
- `package.json`
- `vercel.json`
- `src/main.jsx`
- `src/pages/ProfilePage.jsx`
- `src/lib/supabaseClient.js`
- `src/lib/profileServicesClient.js`
- `test/profileServicesClient.test.mjs`
- Supabase migrations in `supabase/migrations/`

### 2.2. Уже существующая services/orders инфраструктура

В `package.json` уже есть:

- `apply:services-orders-mvp`
- `test:profile-services`
- `check`, который включает `test:profile-services` и `build`

В `src/lib/profileServicesClient.js` уже есть базовые сущности:

- services table: `profile_cabinet_services`
- orders table: `profile_cabinet_service_orders`
- `SERVICE_STATUSES = ["draft", "published", "archived"]`
- `ORDER_STATUSES = ["new", "in_progress", "sent", "closed"]`
- `listPublicServices`
- `listOwnServices`
- `createOwnService`
- `updateOwnService`
- `publishOwnService`
- `createServiceOrder`
- `listOwnServiceOrders`
- `updateServiceOrder`

В `supabase/migrations/20260529090000_master_services_orders_mvp.sql` уже есть таблицы:

- `profile_cabinet_services`
- `profile_cabinet_service_orders`

В `scripts/apply-master-services-orders-mvp.mjs` уже есть черновая логика:

- добавление вкладки `Услуги` в кабинет мастера;
- добавление вкладки `Заявки`;
- перенос `Место силы` в услугу через кнопку `В услуги`;
- публичный mini-shop `PublicServicesMiniShop`;
- создание заявки из публичного mini-shop.

### 2.3. Главные ограничения текущего MVP

Текущий MVP services/orders нужно доработать, потому что:

1. `createServiceOrder` сейчас создаёт заказ сразу со статусом `new`, без `draft`.
2. В order schema нет `client_profile_id`, поэтому невозможно надёжно показать пользователю именно его заказы.
3. В order schema нет `order_format`, поэтому выбор `signature/no_signature/both` негде хранить.
4. В order schema нет отдельных полей `goal_text`, `comment_text`, `attachment_refs`.
5. RLS currently allows `anon` insert для заказов. Для нового сценария заказ через кабинет должен создавать authenticated user после Google login.
6. `listOwnServiceOrders(profileId)` сейчас фактически означает входящие заявки мастеру по `master_profile_id`, а не “мои заказы как клиента”. Это нужно разделить.
7. Публичный mini-shop сейчас встроен как маленький блок и не имеет полноценного профиля услуги.
8. В `vercel.json` пока нет rewrites для `/services/:serviceId`.

---

## 3. Целевая продуктовая модель

### 3.1. Роли

#### Anonymous visitor

Может:

- смотреть ленту опубликованных услуг;
- открывать профиль услуги;
- выбирать формат;
- нажать `Войти через Google и оформить заказ`.

Не должен:

- создавать заказ напрямую как anonymous;
- загружать приватные файлы;
- видеть чужие заявки;
- видеть private storage refs.

#### Authenticated client

Может:

- выбрать услугу и формат;
- создать draft order;
- заполнить заявку;
- загрузить файлы/фото/референсы;
- отправить заявку;
- видеть список своих заказов;
- видеть статус каждого заказа;
- открыть результат, если мастер отправил ответ.

#### Master

Может:

- создать услугу из `Место силы`;
- сохранить услугу как `draft`;
- опубликовать услугу;
- видеть входящие заявки по своим услугам;
- менять статус заявки;
- добавить комментарий и результат.

#### Admin

На этом этапе admin moderation не расширяем, если это не требуется текущим кодом. В будущем можно добавить модерацию опубликованных услуг и жалоб.

---

## 4. Целевой UX

### 4.1. Публичная лента услуг

Лента услуг должна быть не просто формой заказа, а витриной.

Карточка услуги:

- изображение / превью мандалы;
- название;
- короткое описание;
- цена / `Цена по запросу`;
- мастер / автор, если есть;
- формат результата не выбирается прямо в карточке;
- CTA: `Подробнее`.

Клик открывает профиль услуги.

Рекомендуемый route:

```txt
/services/:serviceId
```

Допустимый fallback:

```txt
/?service=<service_id>
```

Но для нормальной архитектуры лучше реализовать именно `/services/:serviceId`.

### 4.2. Профиль услуги

Страница профиля услуги должна отвечать на вопросы:

- Что это за услуга?
- Что получит клиент?
- Чем отличаются форматы?
- Кто мастер?
- Как оформить заказ?

Структура:

1. Hero / карточка услуги:
   - изображение;
   - название;
   - цена;
   - статус доступности.
2. Описание:
   - что делает услуга;
   - кому подходит;
   - что клиент получит.
3. Блок `Выберите формат`:
   - `С подписью мастера`;
   - `Без подписи мастера`;
   - `Две версии`.
4. CTA появляется только после выбора формата:
   - authenticated: `Оформить заказ`;
   - anonymous: `Войти через Google и оформить заказ`.
5. Нижний блок:
   - срок выполнения / формат результата / что подготовить клиенту;
   - предупреждение, что файлы и фото загружаются уже в кабинете.

### 4.3. Форматы заказа

Canonical values:

```js
const SERVICE_ORDER_FORMATS = ["signature", "no_signature", "both"];
```

UI labels:

- `signature` → `С подписью мастера`
- `no_signature` → `Без подписи мастера`
- `both` → `Две версии`

Описание форматов:

#### signature — С подписью мастера

Клиент получает версию артефакта/мандалы/результата с авторской подписью мастера. Это подходит, когда важен контакт с мастером, подтверждение авторства и ритуальная связь результата с человеком, который его создал.

#### no_signature — Без подписи мастера

Клиент получает чистую версию без подписи. Это подходит для печати, личного использования, размещения в пространстве или дальнейшей работы с изображением.

#### both — Две версии

Клиент получает обе версии: с подписью мастера и без подписи. Это оптимальный формат, если нужна и авторская версия, и чистый рабочий файл.

---

## 5. Checkout state до/после Google authorization

### 5.1. Проблема

Google OAuth делает redirect. Если выбор услуги и формата хранить только в React state, он потеряется.

### 5.2. Решение

Перед запуском OAuth сохранить pending checkout в `localStorage`.

Storage key:

```txt
reiki_pending_service_order
```

Payload:

```json
{
  "service_id": "uuid",
  "format": "signature | no_signature | both",
  "return_to": "/profile?tab=orders&checkout=1",
  "created_at": "ISO timestamp"
}
```

Важно:

- не хранить token;
- не хранить персональные данные;
- не хранить env values;
- очищать payload после создания draft или явной отмены.

### 5.3. Auth redirect

Anonymous CTA:

1. validate selected format;
2. save pending checkout;
3. call Supabase Google OAuth;
4. redirectTo должен вести на:

```txt
/profile?tab=orders&checkout=1
```

### 5.4. Обработка после входа

На `/profile` после восстановления session:

1. прочитать URL params;
2. если `tab=orders&checkout=1`, открыть вкладку заказов;
3. прочитать `reiki_pending_service_order`;
4. проверить `service_id` и `format`;
5. загрузить service;
6. создать draft order или открыть существующий draft для этого service/user;
7. показать форму заявки;
8. очистить pending после успешного draft-create или после submit.

---

## 6. Целевая data model

### 6.1. Services

Existing table:

```sql
profile_cabinet_services
```

Текущие поля уже достаточны для первого этапа:

- `id`
- `profile_id`
- `composition_id`
- `title`
- `description`
- `image_url`
- `image_bucket`
- `image_path`
- `price_amount`
- `price_currency`
- `status`: `draft | published | archived`
- timestamps

В будущем можно добавить:

- `delivery_days`
- `format_notes`
- `includes`
- `category`
- `subcategory`
- `slug`
- `sort_order`

Но для безопасного первого этапа это необязательно.

### 6.2. Orders

Existing table:

```sql
profile_cabinet_service_orders
```

Нужно добавить fields:

```sql
client_profile_id uuid null references public.profile_cabinet_profiles(id) on delete set null,
order_format text not null default 'signature',
goal_text text not null default '',
comment_text text not null default '',
attachment_refs jsonb not null default '[]'::jsonb
```

Расширить status check:

```sql
status in ('draft', 'new', 'in_progress', 'sent', 'closed')
```

Рекомендуемые индексы:

```sql
create index if not exists profile_cabinet_service_orders_client_profile_id_idx
on public.profile_cabinet_service_orders(client_profile_id);

create index if not exists profile_cabinet_service_orders_order_format_idx
on public.profile_cabinet_service_orders(order_format);
```

### 6.3. Status semantics

Order lifecycle:

```txt
draft → new → in_progress → sent → closed
```

UI labels:

- `draft` → `Черновик`
- `new` → `Отправлена / новая`
- `in_progress` → `В работе`
- `sent` → `Результат отправлен`
- `closed` → `Закрыта`

`submitted` не вводить как отдельный DB status на первом этапе, чтобы не размножать статусы. В UI можно писать “отправлена”, а в DB хранить `new`.

---

## 7. RLS / безопасность

### 7.1. Public service read

Anonymous and authenticated users can read only:

- `profile_cabinet_services.status = 'published'`
- service master profile is approved.

Это уже близко к текущей migration.

### 7.2. Anonymous order insert

Текущую anonymous insert policy нужно убрать или заменить.

Новый принцип:

- anonymous user не создаёт order;
- anonymous user только выбирает service/format и идёт в Google auth;
- order создаётся authenticated user после входа в `/profile`.

### 7.3. Client order policies

Authenticated client can:

- create own draft order;
- read own orders by `client_profile_id`;
- update own draft order;
- submit own draft order by changing status to `new`.

Authenticated client cannot:

- менять `master_comment`;
- менять `result_image_url`;
- менять master-only fields;
- читать чужие orders.

### 7.4. Master order policies

Master can:

- read orders where `master_profile_id` belongs to their profile;
- update master response fields;
- move status `new → in_progress → sent → closed`.

Master should not silently rewrite client request fields after submit.

---

## 8. Attachments / files / photo references

### 8.1. MVP approach

Использовать существующий private bucket pattern:

```txt
profile-cabinet-media
```

Хранить в order:

```json
attachment_refs: [
  {
    "bucket": "profile-cabinet-media",
    "path": "<profile_id>/orders/<order_id>/<file>",
    "kind": "photo | reference | file",
    "name": "original filename",
    "mime_type": "image/png",
    "size": 12345
  }
]
```

Не хранить base64 в DB.

### 8.2. UI

В форме заявки:

- блок `Фото / файлы / референсы`;
- кнопка `Загрузить файл`;
- список прикреплённых файлов;
- возможность удалить файл из draft до отправки;
- после submit редактирование вложений лучше заблокировать на первом этапе.

### 8.3. Storage safety

- private signed URLs only for display;
- do not render raw `storage://...` refs in public DOM;
- no public access to private attachments.

---

## 9. Public routes and Vercel

### 9.1. New route

Add to router:

```txt
/services/:serviceId
```

Expected behavior:

- direct browser open works;
- refresh works;
- Vercel routes back to SPA.

### 9.2. `vercel.json`

Add rewrite:

```json
{
  "source": "/services/:serviceId",
  "destination": "/"
}
```

Do not remove existing rewrites:

- `/profile`
- `/masters`
- `/profile/admin`

---

## 10. Cabinet structure

### 10.1. Client cabinet

Add tab or section:

```txt
Мои заказы
```

It shows orders where current user is client.

Order list item:

- service title;
- format;
- status;
- date;
- small preview;
- action: `Открыть` / `Продолжить` for draft.

Order detail:

- selected service readonly card;
- selected format;
- request text;
- goal text;
- comment text;
- attachments;
- status;
- master result / comment if status is `sent` or `closed`.

### 10.2. Master cabinet

Rename or clarify current `Заявки` as:

```txt
Заявки на мои услуги
```

It shows orders where current user is master.

Important: do not mix this with `Мои заказы`.

### 10.3. Service management

Existing `Услуги` tab remains master-facing:

- create service from Power Place;
- edit title/description/image/price;
- save draft;
- publish;
- archive later.

---

## 11. Implementation phases

### Phase 1 — документация и архитектурное закрепление

- Add this document.
- Keep implementation scope clear.
- Use it as Codex source of truth before code changes.

### Phase 2 — data model and client functions

Files:

- `supabase/migrations/<new>_service_order_checkout_flow.sql`
- `src/lib/profileServicesClient.js`
- `test/profileServicesClient.test.mjs`

Tasks:

- add `client_profile_id`, `order_format`, `goal_text`, `comment_text`, `attachment_refs`;
- add status `draft` to order status check;
- remove/replace anonymous order insert policy;
- add client-side order functions;
- add pending checkout localStorage helpers;
- update tests.

### Phase 3 — service profile route

Files:

- `src/main.jsx`
- possible new `src/pages/ServicePage.jsx`
- `src/index.css`
- `vercel.json`

Tasks:

- add `/services/:serviceId` route;
- build service profile UI;
- add format selector;
- add auth-aware CTA;
- save pending checkout before OAuth;
- redirect to `/profile?tab=orders&checkout=1`.

### Phase 4 — profile order draft flow

Files:

- `src/pages/ProfilePage.jsx`
- `src/profileCabinet.css` or `src/profileMandalaWorkspace.css`
- `src/lib/profileServicesClient.js`

Tasks:

- add `Мои заказы` tab;
- separate client orders from master incoming orders;
- on profile load process pending checkout;
- create/open draft order;
- show form with selected service and format;
- save draft;
- submit draft → `new`.

### Phase 5 — attachments

Files:

- `src/lib/profileMediaClient.js`
- `src/lib/profileServicesClient.js`
- `src/pages/ProfilePage.jsx`
- Supabase Storage migration only if existing policies are insufficient.

Tasks:

- upload attachments to private bucket;
- store `attachment_refs`;
- display signed URLs in cabinet only;
- block public leaks.

### Phase 6 — QA and production readiness

Run:

```bash
npm run test:profile-services
npm run test:profile-media
npm run test:profile-materials
npm run build
npm run check
```

Manual QA:

- `/`
- `/services/<service_id>`
- `/profile`
- `/masters`
- `/profile/admin`
- desktop 1280 / 1366 / 1440 / 1710
- mobile 390
- unauthenticated Google checkout flow
- authenticated checkout flow
- draft save
- submit to `new`
- client order list
- master incoming order list
- no console errors
- no private storage refs in public DOM

---

## 12. Minimal safe fix boundaries

Do not:

- rewrite whole app;
- remove existing home page;
- break `/profile`, `/masters`, `/profile/admin`;
- collapse desktop three-column layout;
- change RU-default interface;
- expose env values;
- store service role keys in frontend;
- store private client files as public URLs;
- keep anonymous DB order creation for the new flow;
- mix client orders with master incoming requests.

Prefer:

- additive migration;
- additive client functions;
- additive route;
- small new page component if it reduces `src/main.jsx` complexity;
- tests before UI expansion;
- compatibility wrappers for existing functions.

---

## 13. Codex implementation prompt

```txt
Repo: andylitvinov-design/reiki-yggdrasil
Live URL: https://reiki-yggdrasil.vercel.app
Target branch: codex/service-shop-order-flow

Task: implement the service shop checkout flow described in docs/services-shop-implementation-concept.md.

First read:
- AGENTS.md
- README.md
- STATE.md
- LOG.md
- docs/services-shop-implementation-concept.md
- package.json
- vercel.json
- src/main.jsx
- src/pages/ProfilePage.jsx
- src/lib/supabaseClient.js
- src/lib/profileServicesClient.js
- src/lib/profileMediaClient.js
- test/profileServicesClient.test.mjs
- supabase/migrations/20260529090000_master_services_orders_mvp.sql

Use the current repo structure. Do not invent a parallel shop architecture.

Implement in minimal safe phases:
1. Update data/client layer for draft checkout:
   - add order formats signature/no_signature/both
   - add draft order status support
   - add client_profile_id/order_format/goal_text/comment_text/attachment_refs migration
   - add listClientServiceOrders separate from master incoming list
   - add createDraftServiceOrder/updateDraftServiceOrder/submitServiceOrder
   - add pending checkout localStorage helpers
2. Add public service profile route /services/:serviceId and Vercel rewrite.
3. Add service profile UI with format selector and auth-aware CTA.
4. Add /profile pending checkout handler so Google auth returns to a prefilled draft order form.
5. Add “Мои заказы” client list and keep “Заявки на мои услуги” separate for master incoming orders.
6. Add attachments only through private Storage refs; do not expose private refs publicly.

Do not change:
- existing home page except safe links into services
- RU default interface
- /profile, /masters, /profile/admin
- Supabase auth/session flows
- Vercel rewrites except additive /services/:serviceId
- accepted desktop 3-column public layout
- env names/values

Required checks:
- npm run test:profile-services
- npm run test:profile-media
- npm run test:profile-materials
- npm run build
- npm run check

Manual QA:
- /, /services/<service_id>, /profile, /masters, /profile/admin
- desktop 1280/1366/1440/1710
- mobile 390
- unauthenticated Google checkout preserves service_id and format
- authenticated checkout opens draft directly
- draft saves before submit
- submit changes status to new
- client sees own orders
- master sees incoming service orders separately
- no console errors
- no private storage refs in public DOM

Report:
- branch
- PR URL
- changed files
- migrations added/changed
- checks run
- manual QA done/not done
- risks
- what was not verified
- whether STATE.md/LOG.md need updates
```

---

## 14. Open questions / needs verification

- Whether live Supabase already has `20260529090000_master_services_orders_mvp.sql` applied.
- Whether `apply:services-orders-mvp` was already run against current source or only exists as a patch script.
- Exact current production state of the mini-shop on live URL.
- Whether service profile should be public under `/services/:id` or inside a shop category route later.
- Whether attachments need multi-file upload immediately or can start as single/private file MVP.
- Whether payment will be added later; this concept covers order request, not payment collection.

---

## 15. Definition of done

The shop/order flow is done when:

1. User can open a public service profile.
2. User can select `signature`, `no_signature`, or `both`.
3. Anonymous user CTA starts Google auth.
4. Selected service and format survive auth redirect.
5. User lands in `/profile?tab=orders&checkout=1`.
6. Draft order is created/opened with selected service and format.
7. User can fill request, goal, comment, attachments.
8. User can save draft.
9. User can submit draft and status becomes `new`.
10. User sees own order list and statuses.
11. Master sees incoming service orders separately.
12. Existing routes and layouts still work.
13. Required tests/build/check pass.
14. No secrets or private file refs are exposed.
