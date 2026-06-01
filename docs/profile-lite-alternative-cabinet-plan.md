# Profile Lite Alternative Cabinet — Exact Rebuild Specification

Last updated: 2026-06-01

Repo: `andylitvinov-design/reiki-yggdrasil`  
Production/live: `https://mentalica.vercel.app`  
Legacy: `https://reiki-yggdrasil.vercel.app`

## 0. Purpose of this document

This is the canonical implementation specification for rebuilding the master cabinet on top of `ProfileLitePage`.

Short link for Codex:

```text
docs/profile-lite-alternative-cabinet-plan.md
```

Target implementation branch:

```text
codex/profile-lite-full-alternative-cabinet
```

Main instruction:

```text
Recreate the old master cabinet functionality inside the new stable Profile Lite cabinet, but do not copy the old heavy ProfilePage.jsx as one monolithic component.
```

## 1. Final goal

Build a new alternative full master cabinet that looks and behaves like the old cabinet from the user's point of view, but uses the safer `ProfileLitePage` auth/session foundation.

The final user experience must preserve the old cabinet's useful functions:

```text
1. Google login / session recovery.
2. Master profile editing.
3. Master public preview.
4. Material publishing workspace.
5. Saved images / uploaded media workspace.
6. Client/goal photo workspace.
7. Mandala / Power Place constructor.
8. Saved mandala/composition loading and saving.
9. Mandala download/export/print fallback if available.
10. Publishing saved mandala into Services.
11. Services management.
12. Orders management.
13. Chats management.
14. Settings/session/account controls.
15. Safe diagnostics.
```

The old cabinet must remain available as `/profile-old` until the new Lite cabinet covers all previous functionality and live QA passes.

## 2. Current source of truth

The current project has two profile implementations:

```text
src/pages/ProfilePage.jsx      # old heavy cabinet, source/reference for behavior and UI
src/pages/ProfileLitePage.jsx  # current light diagnostic cabinet, foundation for the new full cabinet
```

`ProfilePage.jsx` is the reference for what the old cabinet did. `ProfileLitePage.jsx` is the foundation for how the new cabinet must open safely.

Before coding, Codex must inspect the actual current code, because routing and recovery work changed many times.

Must read first:

```text
AGENTS.md
README.md
STATE.md
LOG.md
docs/profile-lite-alternative-cabinet-plan.md
docs/profile-cabinet-recovery-summary-2026-06-01.md, if present
package.json
vercel.json
src/main.jsx
src/pages/ProfileLitePage.jsx
src/pages/ProfilePage.jsx
src/lib/profileLiteClient.js
src/lib/profileBootstrapClient.js
src/lib/supabaseClient.js
src/lib/profileMaterialsClient.js
src/lib/profileMediaClient.js
src/lib/powerPlaceClient.js
src/lib/profileServicesClient.js, if present
src/lib/masterChatClient.js, if present
all profile/power-place/services tests under test/
```

If a file is missing, report:

```text
not found
```

Do not invent APIs, schema fields, or table names.

## 3. Route contract

These routes must be checked before and after every implementation step:

```text
/                     -> public home, unchanged
/profile              -> final target: ProfileLitePage overview tab
/profile-lite         -> ProfileLitePage overview tab / fallback
/profile-old          -> old ProfilePage reference/diagnostic route
/profile/mandalas     -> final target: ProfileLitePage mandalas tab
/profile/services     -> final target: ProfileLitePage services tab
/profile/orders       -> final target: ProfileLitePage orders tab
/profile/chats        -> final target: ProfileLitePage chats tab
/profile/settings     -> final target: ProfileLitePage settings/profile tab
/masters              -> MastersPage, unchanged
/profile/admin        -> AdminPage, unchanged
```

Important:

1. Do not remove `/profile-old`.
2. Do not break `/masters`.
3. Do not break `/profile/admin`.
4. Do not break Vercel SPA rewrites.
5. If switching `/profile` to Lite is risky in the first PR, keep the new full cabinet behind `/profile-lite` first and perform the route switch in a final PR.

## 4. Main architectural rule

The old heavy cabinet mixed auth, profile, materials, media, mandalas, services, orders, chats, and UI in one large component.

The new cabinet must not repeat that architecture.

New architecture:

```text
ProfileLitePage
  auth/session/bootstrap foundation
  stable shell
  independent module tabs
```

Recommended component structure:

```text
src/pages/ProfileLitePage.jsx
src/profile-lite/ProfileLiteShell.jsx
src/profile-lite/ProfileLiteNav.jsx
src/profile-lite/ProfileLiteOverview.jsx
src/profile-lite/ProfileLiteProfileModule.jsx
src/profile-lite/ProfileLiteMaterialsModule.jsx
src/profile-lite/ProfileLiteMediaModule.jsx
src/profile-lite/ProfileLiteMandalasModule.jsx
src/profile-lite/ProfileLiteServicesModule.jsx
src/profile-lite/ProfileLiteOrdersModule.jsx
src/profile-lite/ProfileLiteChatsModule.jsx
src/profile-lite/ProfileLiteSettingsModule.jsx
src/profile-lite/ProfileLiteDiagnosticsModule.jsx
```

If extraction is too risky, Codex may implement the first version inside `ProfileLitePage.jsx`, but the render blocks must still be clearly separated and named.

## 5. Critical auth/bootstrap rule

Only auth/session/user may be required for opening the shell.

The following must never block shell render:

```text
getOwnProfile
profile save
materials loader
media loader
Power Place / saved composition loader
client/goal photo loader
tradition assets loader
services loader
orders loader
chats loader
```

When `session` and `user?.id` are available, the cabinet shell must render.

Secondary data loads after shell render. Secondary failures must be shown inside their module only.

Forbidden regression:

```text
Valid session exists but the whole page stays on “Загружаю кабинет...” because materials/media/mandalas/services/orders/chats are loading.
```

## 6. Safe diagnostics rule

Diagnostics may show:

```text
supabase configured: yes/no
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
short user id
safe profile id / short id
```

Diagnostics must never show:

```text
access_token
refresh_token
raw JWT
full authorization headers
env values
request body
private uploaded file URLs if they are signed/private and not already displayed as UI images
service-role keys
```

Allowed env names only:

```text
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
VITE_ADMIN_EMAIL
```

## 7. Final UI structure

The new cabinet must have the same practical user areas as the old cabinet.

Required top/internal tabs:

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

The shell must include:

```text
1. Header/topbar with На главную and Мастера buttons.
2. Master/cabinet title.
3. Current user/profile status.
4. Tab navigation.
5. Inline global notice area for non-secret messages.
6. Active module content area.
7. Mobile-friendly single-column behavior.
```

The Overview tab must include quick cards to all modules and current account/profile status.

## 8. Exact old profile fields to restore

The old cabinet profile editor used these profile fields:

```text
display_name
bio
city
country
telegram
website
avatar_url
account_plan
status
```

The new Lite profile module must support these fields if they are present in `supabaseClient.js` / migrations / existing save helpers.

Profile UI must include:

```text
Имя мастера
Описание
Город
Страна
Telegram
Сайт
Аватар / фото URL
План кабинета
status badge
ID using formatCabinetId(profile.id), if available
Сохранить черновик
Отправить на модерацию
Выйти
Public preview card: Как это будет выглядеть
```

Account plan copy from old cabinet:

```text
Start: 7 мест силы и 10 фото клиентов.
Pro: 20 мест силы и 30 фото.
Биллинг: needs verification.
```

Do not create new profile schema fields unless verified.

## 9. Exact material workspace to restore

The old cabinet included a material publishing workspace.

The new Lite materials module must restore:

```text
list own materials
create own material
save draft
send/publish/request moderation if existing helper supports it
material title
material description
material type
step_id
step_title
setting_title
setting_index
status text
image_url / display_url / uploaded image if supported
file upload if supported by existing helpers
materials grid/list
filters/categories
```

Known material type/category sources to inspect and preserve:

```text
MATERIAL_TYPES
createEmptyMaterialForm
createOwnMaterial
listOwnMaterials
materialStatusText
normalizeMaterialForm
publicationTypeLabel
SOURCE_LIBRARY_CATEGORIES
MATERIAL_CATEGORY_TABS
reikiLevels
mysteryTraditions
leftMenuSections artifact items
CHANNELS_SUBCATEGORIES
```

Required category structure to preserve if existing code supports it:

```text
ДАО РИ
Мистерии
Каналы
Фон
Форма
Талисманы
Артефакты
Клиенты
```

For `Каналы`, preserve subcategories:

```text
Сефирот -> Большие арканы / Малые арканы / Сиферы
Руны -> Первый атт / Второй атт / Третий атт
Планеты -> Солнце / Луна / Меркурий / Венера / Марс / Юпитер / Сатурн
Деньги
Жизнь
```

For `Форма`, preserve:

```text
Защитные
Целебные
Бизнес
Другие
```

If any taxonomy is not actually present in code, mark as `needs verification` in the report and keep the UI safe.

## 10. Exact media/photo workspace to restore

The old cabinet used media for materials, client/goal photos, tradition assets, object images, covers, and saved mandala compositions.

The new Lite media module must inspect and restore supported flows from:

```text
src/lib/profileMediaClient.js
src/lib/powerPlaceClient.js
src/pages/ProfilePage.jsx
```

Must support or explicitly report `needs verification` for:

```text
uploadProfileMedia
validateProfileMediaFile
listClientGoalPhotos
createClientGoalPhoto
deleteClientGoalPhoto
listTraditionAssets
createTraditionAsset
private signed URL display
storage://profile-cabinet-media/... refs
legacy external image URLs
data:image previews only as temporary previews, not persisted payloads
```

Required UI behavior:

```text
1. Show saved client/goal photos.
2. Upload new client/goal photo.
3. Delete client/goal photo with confirm text: Удалить фото из базы?
4. Show saved reusable media/mandalas if they exist.
5. Open clicked photo in Мои мандалы with ability to add/edit description if old flow supports it.
6. Do not hide old photos because filters are active.
7. If a filter is selected, show only matching media; otherwise show latest media first.
```

Known old image/state names Codex must search in `ProfilePage.jsx`:

```text
clientGoalPhotos
traditionAssets
materials.image_url
materials.display_url
savedPowerImages
objectImageUrls
selectedCentralPhoto
selectedCentralPhotoId
selectedCentralImageRef
reusableImages
imagePickerContext
activeSourceCategory
activeSourceSubcategory
activeSourceThirdLevel
```

## 11. Exact mandala / Power Place constructor to restore

The new Lite mandalas module must eventually reproduce the old Power Place constructor user experience.

Known constructor types from old cabinet:

```text
zodiac    -> Зодиак
star      -> Звезда
chess     -> Шахматы
client    -> Мандала
altar     -> Алтарь
business  -> Бизнес
dao       -> ДАО
```

Important: old UI filtered out `client` from constructor type selector in one place. Codex must verify whether `client` should remain internal/default or visible.

Known variants/options to preserve:

```text
POWER_SOURCE_COUNTS: 2 / 4 / 6 / 8 / 12
STAR_VARIANTS: closed / open
CHESS_VARIANTS: classic-14 / classic-8 / plus-8
ZODIAC_VARIANTS: classic-2 / classic-4 / classic-6 / classic-8 / plus-8 / classic-12 / plus-12
BUSINESS_VERTEX_ZONE_COUNTS: 1 / 3
ALTAR_CENTER_RATIOS, if present
resource comparison modes, if present
```

Known visual/interaction features to preserve:

```text
central photo button: Фото клиента / цели
object slot picker
cover picker
inner/outer cover support
slot image upload
object image selection from source library
saved composition select: Загрузить сохранённое место силы
composition title
save new composition
update selected composition
print mandala
download/export HTML fallback
resource comparison comments: without mandala / with mandala
photo-only mode, if present
```

Known persistence fields to preserve if supported:

```text
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
```

Required migration order inside implementation:

```text
Step 1: show saved compositions list.
Step 2: load selected composition into Lite state.
Step 3: display central photo and object refs.
Step 4: restore image picker and source library.
Step 5: restore save/update composition.
Step 6: restore constructor layouts.
Step 7: restore download/print.
Step 8: connect publish-to-services action.
```

Do not import the whole `ProfilePage.jsx` render tree. Extract pure helpers/constants when safe.

## 12. Exact services module to restore

The old cabinet had services/orders MVP work. Some heavy tabs were smoke placeholders at points in recovery, so Codex must verify actual current service client and schema before implementation.

Files to inspect:

```text
src/lib/profileServicesClient.js, if present
scripts/apply-master-services-orders-mvp.mjs
supabase/migrations/*service* or *order*, if present
src/pages/ProfilePage.jsx
src/pages/MastersPage.jsx
```

The new Lite services module must support or report `needs verification` for:

```text
list own services
create service
edit service title
delete service if supported
edit service description
attach saved mandala/composition
publish saved mandala as service
publish/unpublish service
copy public service link
open service in its own editable section
status display
empty state
inline errors
```

Specific required user flow:

```text
1. User saves a mandala/composition.
2. Under the saved mandala there is a button: Опубликовать в услугах.
3. After click, a service draft is created or prepared from that mandala.
4. In Services tab, this service appears.
5. Under the service/mandala there are actions:
   - Редактировать описание
   - Скопировать ссылку
6. The copied link can be given to clients.
```

Do not invent public URL format. Use existing route/link conventions if present; otherwise mark `needs verification` and create a safe placeholder link only if app routing supports it.

## 13. Exact orders module to restore

The new Lite orders module must implement the order flow connected to services.

Client-side order scenario:

```text
1. In service feed, user chooses a service.
2. Service profile opens.
3. User chooses format:
   - signature: С подписью мастера
   - no_signature: Без подписи мастера
   - both: Две версии
4. If authorized, CTA: Оформить заказ.
5. If not authorized, CTA: Войти через Google и оформить заказ.
6. Selected service_id and format are stored safely before login.
7. After Google login, user lands in order creation form with service and format prefilled.
8. User fills request, goal, comment.
9. User may upload files/photos/references if supported.
10. User submits order.
```

Master-side order management must show:

```text
incoming orders
order status
service title
selected format
client request
client goal
client comment
attached files/references if supported
created/updated dates if available
safe status transitions if supported
```

Do not change OAuth provider setup blindly. Preserve existing redirect flow built from `window.location.origin`.

## 14. Exact chats module to restore

The new Lite chats module must be implemented after orders/services are stable, unless existing chat client is already simple and safe.

Files to inspect:

```text
src/lib/masterChatClient.js
src/pages/ProfilePage.jsx
supabase migrations for chat/conversations/messages
```

Required behavior:

```text
list conversations
open conversation
show messages
send message
favorite chats if supported
show linked order/service if supported
participant-only RLS
inline errors only
```

Security:

```text
no anon chat read
no anon chat write
only participants can read/send
no private chat body in diagnostics
```

## 15. Settings module

The Settings tab must include safe account actions:

```text
refresh cabinet data
reset session / sign out
show safe Supabase configured status
show profile status
show account plan/limits if supported
link/switch to diagnostics
```

Do not expose env values or tokens.

## 16. Implementation plan Codex must follow

Codex should implement this as a sequence inside one branch, committing logically if possible.

### Phase A — Inventory old cabinet

Before code changes, Codex must produce an internal inventory by reading `ProfilePage.jsx`:

```text
1. top tab ids and labels
2. profile fields
3. material fields and categories
4. media helper functions
5. mandala constructor constants and variants
6. saved composition functions
7. services functions/client/schema
8. orders functions/client/schema
9. chats functions/client/schema
10. CSS files/classes used by old workspace
```

If a function is not found, report `not found`.

### Phase B — Build full Lite shell

Implement shell/tabs/overview/profile/materials preview/diagnostics/settings placeholders first.

### Phase C — Move profile editor fully

Restore old profile fields and preview.

### Phase D — Move materials workspace

Restore material list/create/save/status/categories/upload if supported.

### Phase E — Move media workspace

Restore saved photos/media, upload/delete, signed URL display, and click-to-open-in-mandalas behavior.

### Phase F — Move saved mandalas first

Restore saved composition list/load/display before constructor editing.

### Phase G — Move mandala constructor

Restore constructor types, layouts, object slots, covers, central photo, save/update/download/print.

### Phase H — Move services

Restore services and publish saved mandala to services.

### Phase I — Move orders

Restore service order flow, including selected service/format surviving login.

### Phase J — Move chats

Restore chats only after services/orders are stable or clearly isolate as safe module.

### Phase K — Route switch

Only after QA, switch `/profile` and modular `/profile/*` routes to Lite.

## 17. Allowed files by phase

### Early shell/profile/materials phases

```text
src/pages/ProfileLitePage.jsx
src/profile-lite/*
src/lib/profileLiteClient.js
src/lib/profileMaterialsClient.js only if existing helper needs non-breaking extension
src/profileCabinet.css
src/profileMandalaWorkspace.css only for reused mandala classes, avoid destructive edits
test/profileLiteClient.test.mjs
test/profileLiteRoute.test.mjs
test/profileMaterials.test.mjs
STATE.md
LOG.md
```

### Media/mandala phases

```text
src/profile-lite/*
src/lib/profileMediaClient.js only if needed
src/lib/powerPlaceClient.js only if needed
test/profileMediaClient.test.mjs
test/powerPlaceClient.test.mjs
src/profileMandalaWorkspace.css
STATE.md
LOG.md
```

### Services/orders/chats phases

```text
src/profile-lite/*
src/lib/profileServicesClient.js, if present/needed
src/lib/masterChatClient.js, if present/needed
test/profileServicesClient.test.mjs
new tests only if needed
STATE.md
LOG.md
```

Read-only unless necessary:

```text
src/pages/ProfilePage.jsx
src/lib/profileBootstrapClient.js
src/lib/supabaseClient.js
supabase/migrations/*
vercel.json
src/main.jsx
```

## 18. Hard no-go list

Codex must not:

```text
1. Delete /profile-old.
2. Remove legacy redirect support.
3. Hardcode mentalica.vercel.app into OAuth logic.
4. Put getOwnProfile/materials/media/mandalas/services/orders/chats in auth critical path.
5. Show tokens or env values in UI/debug/report.
6. Replace the whole app router without need.
7. Break /, /masters, /profile/admin.
8. Make the whole shell wait for one module.
9. Persist data:image previews as saved permanent refs.
10. Change Supabase schema without verifying migrations and tests.
11. Change public home page.
12. Remove RU default text.
```

## 19. Required checks

Run after implementation:

```bash
npm run test:profile-lite
npm run test:profile-materials
npm run test:profile-media
npm run test:profile-services
npm run test:power-place
npm run test:profile-loading-recovery
npm run check
npm run build
```

If a script does not exist, report it as `not found` and run the nearest available test from `package.json`.

## 20. Required local QA

Using local dev or preview, verify:

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

Verify desktop and mobile:

```text
desktop around 1280px
mobile below 980px
no horizontal overflow
no visible Vite/runtime error overlay
no console errors from changed code
```

## 21. Completion criteria for the full alternative cabinet

The alternative cabinet is complete only when:

```text
1. Profile Lite opens reliably after Google login.
2. Valid session opens shell without global hang.
3. Profile save works with old profile fields.
4. Master preview works.
5. Materials list/create/edit/save works.
6. Material categories and filters work or unsupported items are marked needs verification.
7. Old photos/media are visible.
8. New upload works if supported.
9. Client/goal photo upload/delete works.
10. Saved mandalas/compositions are visible.
11. Saved composition can be loaded.
12. Mandala constructor works for supported constructor types.
13. Mandala save/update works.
14. Mandala download/print works if supported.
15. Saved mandala can be published to services.
16. Services can be edited and linked.
17. Service link can be copied.
18. Orders can be created from service profile.
19. Selected service/format survives login.
20. Master can view/manage orders.
21. Chats work for participants if implemented.
22. Settings/session controls work.
23. Diagnostics are safe.
24. /profile-old remains available.
25. /profile/admin unchanged.
26. /masters unchanged.
27. / unchanged.
28. No secrets in UI/logs/report.
29. No secondary module causes global loading.
30. Mobile below 980px is usable.
31. npm run check passes.
32. npm run build passes.
33. Live QA passes on mentalica.vercel.app after deploy.
```

## 22. One-prompt instruction for Codex

Use this exact prompt when giving the task to Codex:

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

Main spec:
docs/profile-lite-alternative-cabinet-plan.md

Задача:
Реализуй новый альтернативный полноценный кабинет мастера на базе ProfileLitePage по спецификации docs/profile-lite-alternative-cabinet-plan.md. Новый кабинет должен повторить полезный функционал старого тяжелого ProfilePage с точки зрения пользователя, но быть собран как модульный Lite cabinet, который не зависает из-за secondary loaders.

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
13. src/lib/profileBootstrapClient.js
14. src/lib/supabaseClient.js
15. src/lib/profileMaterialsClient.js
16. src/lib/profileMediaClient.js
17. src/lib/powerPlaceClient.js
18. src/lib/profileServicesClient.js, если есть
19. src/lib/masterChatClient.js, если есть
20. all related tests under test/

Перед изменениями составь inventory старого кабинета из ProfilePage.jsx:
- вкладки и labels;
- profile fields;
- material fields/categories;
- media/photo flows;
- mandala constructor types/variants;
- saved composition fields;
- service/order/chat clients and schema references;
- CSS classes/files.

Реализация:
1. Не копируй ProfilePage.jsx монолитом.
2. Создай модульный Lite cabinet shell.
3. Shell должен открываться после valid session/user, не ожидая profile/materials/media/mandalas/services/orders/chats.
4. Добавь вкладки: Обзор, Профиль, Мои мандалы, Фото / Медиа, Материалы, Услуги, Заказы, Чаты, Настройки, Диагностика.
5. Восстанови старые profile fields: display_name, bio, city, country, telegram, website, avatar_url, account_plan, status, preview card.
6. Восстанови materials workspace: list/create/edit/save/status/categories/upload if supported.
7. Восстанови media workspace: client/goal photos, upload, delete with confirm “Удалить фото из базы?”, signed URL display, latest-first default, filters if supported.
8. Восстанови mandalas workspace: saved compositions list/load/display, constructor types/variants, central photo, object picker, covers, save/update, download/print if supported.
9. Восстанови publish saved mandala to services: Опубликовать в услугах, Редактировать описание, Скопировать ссылку.
10. Восстанови services/orders/chats where existing clients/schema support them. Unsupported pieces must show safe `needs verification`, not invented behavior.
11. Keep /profile-old as old ProfilePage reference.
12. Do not break /, /masters, /profile/admin, Vercel rewrites, RU-default.
13. Do not expose access_token, refresh_token, raw JWT, env values, headers, private payloads.
14. Update STATE.md and LOG.md.

If the full implementation is too large for one safe PR:
- implement shell + profile + materials + media/saved mandalas first;
- leave services/orders/chats as safe visible modules with exact next TODOs;
- report what remains.

Checks:
- npm run test:profile-lite
- npm run test:profile-materials
- npm run test:profile-media
- npm run test:profile-services
- npm run test:power-place
- npm run test:profile-loading-recovery
- npm run check
- npm run build

Local QA:
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
- desktop 1280px
- mobile below 980px
- no console errors
- no horizontal overflow

Report:
- changed files
- inventory found
- route map after change
- implemented modules
- modules left as needs verification
- checks run
- QA run
- risks
- what was not verified
- next PR if needed
```

## 23. Reporting template

Every Codex report must use this format:

```text
Branch:
PR:

Changed files:

Inventory found:
- tabs:
- profile fields:
- materials:
- media:
- mandalas:
- services:
- orders:
- chats:

Implemented:

Needs verification:

Route map after change:

Checks run:

Local QA:

Not verified:

Risks:

Next step:
```

## 24. Final summary

The new Profile Lite alternative cabinet must recreate the old cabinet's real user-facing functionality, but with a safer modular architecture: fast shell opening, independent modules, inline failures, safe diagnostics, no secrets, and `/profile-old` preserved as the old reference until the migration is complete.
