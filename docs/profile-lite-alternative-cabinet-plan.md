# Profile Lite Alternative Cabinet — Full Rebuild Plan

Last updated: 2026-06-01

Repo: `andylitvinov-design/reiki-yggdrasil`  
Live: `https://mentalica.vercel.app`  
Legacy: `https://reiki-yggdrasil.vercel.app`

## 0. Short Codex link

Use this document as the canonical plan for rebuilding the master cabinet on top of `ProfileLitePage`:

```text
docs/profile-lite-alternative-cabinet-plan.md
```

Recommended first implementation branch:

```text
codex/profile-lite-full-alternative-cabinet
```

## 1. Main goal

Create a new alternative full master cabinet on the basis of `ProfileLitePage`.

The new cabinet must eventually include all useful functions from the old heavy `ProfilePage`, but must be rebuilt as a lighter, modular, safer cabinet that opens reliably and never hangs the whole profile page because one secondary feature is slow or broken.

The old heavy cabinet remains available as a reference/diagnostic implementation until the new cabinet fully covers the previous functionality.

## 2. Key idea

Do not copy `ProfilePage.jsx` as one huge component.

Instead:

1. keep the stable auth/session/profile foundation from `ProfileLitePage`;
2. create a modular cabinet shell;
3. move every old function into a separate Lite module;
4. each module loads independently;
5. each module can fail independently with an inline notice;
6. the profile shell must stay open if user/session is valid.

## 3. Existing implementations

```text
src/pages/ProfilePage.jsx      # old heavy cabinet, source/reference
src/pages/ProfileLitePage.jsx  # current light diagnostic cabinet, new foundation
```

Before every task, verify actual routing in:

```text
src/main.jsx
vercel.json
```

Important routes to preserve/check:

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

## 4. Non-negotiable safety rules

### 4.1 Do not block shell render with secondary data

The new Lite shell must never depend on these loaders before rendering the cabinet:

```text
getOwnProfile
materials loader
media loader
Power Place loader
saved mandalas loader
services loader
orders loader
chats loader
admin/moderation loader
```

Only auth/session/user may participate in the early shell opening logic.

Once user/session is valid, render the cabinet shell immediately and load everything else inside modules.

### 4.2 Inline failures only

If a module fails:

```text
show inline warning inside that module
keep other modules usable
keep profile shell open
do not show global “Загружаю кабинет...”
do not reset session unless auth is explicitly 401/403/expired
```

### 4.3 Secret safety

Never display or commit:

```text
access_token
refresh_token
raw JWT
Supabase env values
request headers
private request body
service-role keys
private user data not needed for UI
```

Allowed env names only:

```text
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
VITE_ADMIN_EMAIL
```

### 4.4 UI/project safety

Preserve:

```text
RU-default interface
public home page /
/masters
/profile/admin
Vercel rewrites
Supabase auth/data flows
mobile layout below 980px
desktop usability
```

Do not rewrite the whole project when a small additive step is enough.

## 5. Target architecture

### 5.1 New page shell

`ProfileLitePage.jsx` should become a small orchestrator:

```text
ProfileLitePage
  ProfileLiteShell
    ProfileLiteHeader
    ProfileLiteNav
    ProfileLiteOverview
    ProfileLiteProfileModule
    ProfileLiteMaterialsModule
    ProfileLiteMediaModule
    ProfileLiteMandalasModule
    ProfileLiteServicesModule
    ProfileLiteOrdersModule
    ProfileLiteChatsModule
    ProfileLiteSettingsModule
    ProfileLiteDiagnosticsModule
```

Preferred structure can be either inside one file at first or extracted gradually into components. If extracting, use a safe folder:

```text
src/profile-lite/
  ProfileLiteShell.jsx
  ProfileLiteOverview.jsx
  ProfileLiteProfileModule.jsx
  ProfileLiteMaterialsModule.jsx
  ProfileLiteMediaModule.jsx
  ProfileLiteMandalasModule.jsx
  ProfileLiteServicesModule.jsx
  ProfileLiteOrdersModule.jsx
  ProfileLiteChatsModule.jsx
  ProfileLiteSettingsModule.jsx
  ProfileLiteDiagnosticsModule.jsx
```

If a folder extraction creates too much risk, keep the first version inside `ProfileLitePage.jsx` and extract later.

### 5.2 Internal tabs

The cabinet must have these tabs:

```text
Обзор
Профиль
Мои мандалы
Фото / Медиа
Материалы
Услуги
Заказы
Чаты
Настройки
Диагностика
```

Recommended tab ids:

```text
overview
profile
mandalas
media
materials
services
orders
chats
settings
diagnostics
```

### 5.3 Route-to-tab mapping

Final intended routing after migration:

```text
/profile              -> ProfileLitePage, tab overview
/profile-lite         -> ProfileLitePage, tab overview
/profile/mandalas     -> ProfileLitePage, tab mandalas
/profile/services     -> ProfileLitePage, tab services
/profile/orders       -> ProfileLitePage, tab orders
/profile/chats        -> ProfileLitePage, tab chats
/profile/settings     -> ProfileLitePage, tab settings
/profile-old          -> ProfilePage, old heavy diagnostic/reference
/profile/admin        -> AdminPage, unchanged
/masters              -> MastersPage, unchanged
/                     -> public home, unchanged
```

Do not switch all routes until module QA passes. It is acceptable to first build `ProfileLitePage` behind `/profile-lite` and then switch routes in a later PR.

## 6. State model

The Lite cabinet should keep global state minimal:

```text
session
user
profile
authStatus
profileStatus
authError
profileError
activeLiteTab
safeDiagnostics
```

Each module should own its own loading/error/data state:

```text
materialsStatus/materialsError/materials
mediaStatus/mediaError/mediaItems
mandalasStatus/mandalasError/mandalas
servicesStatus/servicesError/services
ordersStatus/ordersError/orders
chatsStatus/chatsError/conversations
```

Do not create one giant `loading` that controls the whole cabinet after auth is done.

## 7. Data clients to inspect and reuse

Before implementing module logic, inspect and reuse existing clients where possible:

```text
src/lib/supabaseClient.js
src/lib/profileLiteClient.js
src/lib/profileBootstrapClient.js
src/lib/profileMaterialsClient.js
src/lib/profileMediaClient.js
src/lib/profileServicesClient.js
src/lib/powerPlaceClient.js
```

If some file is missing, report `not found` and do not invent APIs.

## 8. Full module requirements

## 8.1 Overview module

Purpose:

Give the master a quick dashboard.

Must show:

```text
login state
email
short user id
profile status
master display name
quick links/cards to all modules
module health badges where safe
```

Quick cards:

```text
Профиль
Мои мандалы
Фото / Медиа
Материалы
Услуги
Заказы
Чаты
Настройки
```

Clicking a card should switch `activeLiteTab` without full page reload.

## 8.2 Profile module

Purpose:

Create/edit master profile.

Start with fields already supported by `ProfileLitePage`:

```text
display_name
bio
status
```

Then verify old profile fields before adding:

```text
avatar/photo
public visibility
master public id / RY id
contact fields
practice description
catalog publication status
account plan
limits
```

Do not add schema fields unless they exist in Supabase migrations/client code.

Save behavior:

```text
saveOwnProfile(payload, session)
show success inline
show error inline
keep shell open
```

## 8.3 Materials module

Purpose:

Move all master materials from old cabinet.

Required features:

```text
list own materials
create material
edit material
save draft
show status
filter by type/status if already supported
show image/display URL if already supported
publish/request moderation if already supported
```

Existing source to inspect:

```text
src/lib/profileMaterialsClient.js
src/pages/ProfilePage.jsx
test/profileMaterials.test.mjs
```

Safe fallback:

If materials cannot load, show:

```text
Материалы: needs verification.
```

Do not block other modules.

## 8.4 Media module

Purpose:

Move all profile media/photo storage into Lite.

Required features:

```text
list uploaded media
upload new media if existing helper supports it
delete media if existing helper supports it
show signed/private URLs safely
show old existing photos
show categories/filters if already supported
```

Must inspect old photo paths and patterns:

```text
clientGoalPhotos
traditionAssets
materials.image_url
materials.display_url
savedPowerImages
objectImageUrls
selectedCentralPhoto
reusableImages
profile-cabinet-media
storage://profile-cabinet-media/...
signed URL creation
category/filter logic
```

Do not assume missing photos are route-related. Verify loader timing, profile id hydration, storage ref format, signed URL creation, and filters.

## 8.5 Mandalas module

Purpose:

Move saved mandalas and Power Place compositions into Lite.

Required features:

```text
list saved mandalas/compositions
open saved mandala
edit title/description if supported
save composition
use central client/goal photo
use tradition/object images
support existing formats
export/download if existing fallback exists
publish mandala to services, later connected to Services module
```

Do this in two sub-steps:

### Step A — list/display saved mandalas

Show saved mandalas and old images first. No constructor yet.

### Step B — move constructor

Only after list/display works, move or extract Power Place constructor.

Do not import the whole old heavy component blindly.

## 8.6 Services module

Purpose:

Move service marketplace management into Lite.

Required features:

```text
list own services
create service
edit service title/description
attach/publish saved mandala as a service
publish/unpublish service
copy public service link
show service status
safe empty state
```

Specific user requirement:

A saved mandala should have an action:

```text
Опубликовать в услугах
```

After publishing, under it should be:

```text
Редактировать описание
Скопировать ссылку
```

The service should open in the Services section and be editable there.

## 8.7 Orders module

Purpose:

Move service order creation and management into Lite.

Client order scenario:

```text
1. User opens service feed.
2. User opens service profile.
3. User selects format:
   - signature: С подписью мастера
   - no_signature: Без подписи мастера
   - both: Две версии
4. If authorized, CTA: Оформить заказ.
5. If not authorized, CTA: Войти через Google и оформить заказ.
6. Selected service_id and format survive Google login.
7. After login, user lands in order creation form with selected service and format prefilled.
8. User fills request, goal, comment.
9. User may upload files/photos/references if supported.
10. User submits order.
```

Master-side order module should show:

```text
incoming orders
order status
selected service
selected format
client request/goal/comment
attached files if supported
safe status transitions if supported
```

Do not change OAuth blindly. Preserve redirect logic built from `window.location.origin`.

## 8.8 Chats module

Purpose:

Move authenticated chats into Lite after orders are stable.

Required features:

```text
conversation list
message list
send message
favorite chats if supported
show linked order/service if supported
participant-only access
inline errors
```

Security:

```text
no anon chat access
only participants can read/send
no private data in diagnostics
```

## 8.9 Settings module

Purpose:

Safe account/profile actions.

Required features:

```text
refresh data
reset session / sign out
profile visibility if supported
account plan/limits if supported
safe env configured/not configured status
link to diagnostics
```

Do not expose env values.

## 8.10 Diagnostics module

Purpose:

Keep safe debug info for live QA.

Allowed diagnostics:

```text
Supabase configured: yes/no
stored session: yes/no
session expired: yes/no
user state: yes/no
user id present: yes/no
profile state: yes/no
authStatus
profileStatus
active route
active tab
module statuses
```

Forbidden diagnostics:

```text
raw tokens
raw JWT
refresh token
request headers
private payloads
env values
```

## 9. Implementation phases for Codex

### Phase 1 — Build shell and tabs

Implement:

```text
ProfileLite tab nav
overview/profile/materials/diagnostics moved into tabs
placeholders for media/mandalas/services/orders/chats/settings
no route switch yet unless explicitly safe
```

### Phase 2 — Extract small components/helpers

If `ProfileLitePage.jsx` becomes large, extract stable components into `src/profile-lite/`.

Do not extract during Phase 1 if it increases risk.

### Phase 3 — Materials CRUD

Move material create/edit/list workflows.

### Phase 4 — Media list/upload/display

Make old uploaded photos visible first.

### Phase 5 — Saved mandalas list/display

Show saved mandalas without constructor first.

### Phase 6 — Mandala constructor

Move constructor after media/saved mandalas are stable.

### Phase 7 — Services

Implement services and mandala-to-service publishing.

### Phase 8 — Orders

Implement service order flow and post-login order continuation.

### Phase 9 — Chats

Implement chats after orders.

### Phase 10 — Route switch

Switch modular profile routes to Lite after QA.

## 10. One-prompt Codex instruction

Use this when asking Codex to implement the alternative cabinet:

```text
Ты работаешь с проектом Reiki Yggdrasil.

Repo:
andylitvinov-design/reiki-yggdrasil

Live:
https://mentalica.vercel.app

Legacy:
https://reiki-yggdrasil.vercel.app

Target branch:
codex/profile-lite-full-alternative-cabinet

Main document:
docs/profile-lite-alternative-cabinet-plan.md

Задача:
По документу docs/profile-lite-alternative-cabinet-plan.md начать создание нового альтернативного полноценного кабинета мастера на базе ProfileLitePage. Новый кабинет должен постепенно заменить старый тяжёлый ProfilePage, но старый кабинет должен остаться доступен как /profile-old для сверки и диагностики.

Сначала прочитай:
1. AGENTS.md
2. README.md
3. STATE.md
4. LOG.md
5. docs/profile-lite-alternative-cabinet-plan.md
6. docs/profile-cabinet-recovery-summary-2026-06-01.md, если есть
7. package.json
8. vercel.json
9. src/main.jsx
10. src/pages/ProfileLitePage.jsx
11. src/pages/ProfilePage.jsx
12. src/lib/profileLiteClient.js
13. src/lib/supabaseClient.js
14. src/lib/profileMaterialsClient.js
15. src/lib/profileMediaClient.js
16. src/lib/profileServicesClient.js, если есть
17. src/lib/powerPlaceClient.js, если есть
18. existing tests for profile-lite, profile-materials, profile-media, profile-services, power-place, profile-loading-recovery

Если файла нет — напиши `not found`.

Главные правила:
- Не переписывай весь проект.
- Не копируй старый ProfilePage.jsx как монолит.
- Делай модульный Lite cabinet.
- Profile shell должен открываться быстро после user/session.
- Не ставь getOwnProfile/materials/media/mandalas/services/orders/chats в critical auth bootstrap path.
- Любая ошибка вторичного модуля должна быть inline warning, а не global loading/error.
- Не показывай access_token, refresh_token, raw JWT, env values, headers, private payloads.
- Не hardcode domain; сохранить redirect flow через window.location.origin/existing helpers.
- Не ломай /, /masters, /profile/admin, Vercel rewrites, RU-default.
- Не меняй Supabase schema/migrations без отдельной необходимости.

Первый безопасный scope:
1. Превратить ProfileLitePage в рабочий Lite shell с вкладками:
   - Обзор
   - Профиль
   - Мои мандалы
   - Фото / Медиа
   - Материалы
   - Услуги
   - Заказы
   - Чаты
   - Настройки
   - Диагностика
2. Перенести существующие блоки ProfileLitePage в соответствующие вкладки:
   - auth/profile summary -> Обзор
   - profile form -> Профиль
   - current materials preview -> Материалы
   - safe diagnostics -> Диагностика
3. Добавить безопасные placeholders для:
   - Мои мандалы
   - Фото / Медиа
   - Услуги
   - Заказы
   - Чаты
   - Настройки
4. Добавить quick cards on Overview for module navigation.
5. Tab switching must not reload the page.
6. Materials failure must not block the shell.
7. Keep /profile-old on old ProfilePage.
8. Do not move the full Power Place constructor in the first PR.
9. Update STATE.md and LOG.md.

Allowed files for first PR:
- src/pages/ProfileLitePage.jsx
- src/lib/profileLiteClient.js only if needed
- src/profileCabinet.css or existing cabinet CSS
- test/profileLiteClient.test.mjs
- test/profileLiteRoute.test.mjs
- STATE.md
- LOG.md

Read-only unless needed:
- src/pages/ProfilePage.jsx
- src/lib/profileBootstrapClient.js
- src/lib/supabaseClient.js
- src/lib/profileMaterialsClient.js
- src/lib/profileMediaClient.js
- src/lib/profileServicesClient.js
- src/lib/powerPlaceClient.js
- supabase/migrations/*
- vercel.json
- src/main.jsx

Checks:
- npm run test:profile-lite
- npm run test:profile-materials
- npm run test:profile-media
- npm run test:profile-services
- npm run test:power-place
- npm run test:profile-loading-recovery
- npm run check
- npm run build

Local preview QA:
- /
- /profile
- /profile-lite
- /profile-old
- /profile/mandalas
- /profile/services
- /profile/orders
- /profile/chats
- /profile/settings
- /masters
- /profile/admin

Report format:
- changed files
- route map after change
- checks run
- local preview QA
- what was verified
- what was not verified
- risks
- next recommended module PR
```

## 11. Completion criteria for the full migration

The alternative Lite cabinet can replace the old cabinet only when all are true:

```text
/profile-lite opens reliably after Google login
profile save works
materials list/create/edit works
old photos/media are visible
new upload works if supported
saved mandalas are visible
mandala constructor works or has safe equivalent
saved mandala can publish to services
services can be edited and linked
orders can be created from service profile
selected service/format survives login
master can view/manage orders
chats work for participants if implemented
/profile/admin unchanged
/masters unchanged
/ unchanged
no secrets in UI/logs
no global loading caused by secondary modules
mobile below 980px usable
npm run check passes
npm run build passes
live QA passes on mentalica.vercel.app
```

## 12. Risks

Main risks:

```text
old heavy ProfilePage has mixed auth/data/UI logic
old images may use multiple storage reference formats
signed URL resolution may be timing/profile-id dependent
services/orders schema may be partial or MVP-only
chat RLS must remain participant-only
route switch can accidentally reintroduce old /profile hanging
Vercel production may be stale if deploy limit/rate limit is hit
```

Mitigation:

```text
small PRs
module-by-module transfer
/profile-old kept as reference
inline module errors
tests after every step
live QA before route switch
```

## 13. Final summary

The new Profile Lite alternative cabinet must be rebuilt as a modular, reliable master workspace that contains all previous useful functions of the old heavy cabinet, but without inheriting the old global loading/auth bootstrap fragility.
