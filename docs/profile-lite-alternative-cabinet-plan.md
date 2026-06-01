# Profile Lite Alternative Cabinet — Exact Rebuild + Acceptance Specification

Last updated: 2026-06-01

Repo: `andylitvinov-design/reiki-yggdrasil`  
Production/live: `https://mentalica.vercel.app`  
Legacy: `https://reiki-yggdrasil.vercel.app`

Short Codex link:

```text
docs/profile-lite-alternative-cabinet-plan.md
```

Target branch:

```text
codex/profile-lite-full-alternative-cabinet
```

## Table of contents

1. [Mission](#1-mission)
2. [Definition of success](#2-definition-of-success)
3. [Current source of truth](#3-current-source-of-truth)
4. [Route contract](#4-route-contract)
5. [Architecture contract](#5-architecture-contract)
6. [Target cabinet structure](#6-target-cabinet-structure)
7. [Module map](#7-module-map)
8. [Module 1 — Auth and shell](#8-module-1--auth-and-shell)
9. [Module 2 — Overview](#9-module-2--overview)
10. [Module 3 — Profile editor and preview](#10-module-3--profile-editor-and-preview)
11. [Module 4 — Materials](#11-module-4--materials)
12. [Module 5 — Media / photos](#12-module-5--media--photos)
13. [Module 6 — Mandalas / Power Place](#13-module-6--mandalas--power-place)
14. [Module 7 — Services](#14-module-7--services)
15. [Module 8 — Orders](#15-module-8--orders)
16. [Module 9 — Chats](#16-module-9--chats)
17. [Module 10 — Settings](#17-module-10--settings)
18. [Module 11 — Diagnostics](#18-module-11--diagnostics)
19. [Implementation phases](#19-implementation-phases)
20. [Global QA checklist](#20-global-qa-checklist)
21. [Visual parity checklist](#21-visual-parity-checklist)
22. [Data parity checklist](#22-data-parity-checklist)
23. [Done / not done matrix](#23-done--not-done-matrix)
24. [One-prompt Codex instruction](#24-one-prompt-codex-instruction)
25. [Codex report template](#25-codex-report-template)

---

## 1. Mission

Rebuild the master cabinet on top of `ProfileLitePage` so that it reproduces the old heavy cabinet's user-facing functionality, but avoids the old blocking architecture.

The new cabinet must feel like the previous cabinet for the user:

```text
same core sections
same profile fields
same material workflow
same photo/media workflow
same mandala constructor capabilities
same saved composition workflow
same service/order/chat direction
same Russian-first UI
```

But internally it must be safer:

```text
fast shell opening
module-by-module loading
inline module errors
safe diagnostics
no secret exposure
/profile-old kept as reference
```

The old heavy `ProfilePage.jsx` is the behavioral reference. The new `ProfileLitePage.jsx` is the auth/session foundation.

---

## 2. Definition of success

The goal is successful only when the new Lite cabinet can replace the old cabinet for daily use.

Minimum success indicators:

```text
1. User can open /profile-lite after Google login without hanging.
2. User sees a complete cabinet shell with all expected sections.
3. User can edit and save master profile with the same old fields.
4. User can see a master preview card.
5. User can list/create/edit/save materials.
6. User can see existing old uploaded photos/media.
7. User can upload and delete client/goal photos if existing helpers support it.
8. User can see saved mandalas/compositions.
9. User can open a saved mandala/composition.
10. User can use the mandala constructor formats that existed before.
11. User can save/update mandala compositions.
12. User can download/print/export a mandala if old fallback supports it.
13. User can publish a saved mandala to Services.
14. User can edit service description and copy service link if service routing exists.
15. User can create/view orders from services if order schema/client exists.
16. User can use chats if chat schema/client exists.
17. Secondary module errors do not close or block the shell.
18. Diagnostics remain safe and do not show secrets.
19. /profile-old remains available for comparison.
20. /, /masters, /profile/admin remain unchanged.
```

Hard failure indicators:

```text
1. Any valid logged-in user sees endless “Загружаю кабинет...”.
2. Materials/media/mandalas/services/orders/chats block the whole shell.
3. /profile-old is removed.
4. Tokens/env values/raw JWT appear in UI, logs, debug, or report.
5. /masters or /profile/admin breaks.
6. RU-default is lost.
7. Old photos disappear because a new filter hides them by default.
8. data:image previews are persisted as permanent saved refs.
```

---

## 3. Current source of truth

Must inspect before coding:

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
test/profileLiteClient.test.mjs
test/profileLiteRoute.test.mjs
test/profileMaterials.test.mjs
test/profileMediaClient.test.mjs
test/profileServicesClient.test.mjs
test/powerPlaceClient.test.mjs
test/profilePageAuthBootstrap.test.mjs
```

If a file is missing, Codex must report:

```text
not found
```

Do not invent missing APIs, fields, routes, or table names.

---

## 4. Route contract

Final intended route map:

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

Route acceptance checklist:

```text
[ ] / opens public home.
[ ] /profile opens Lite shell or remains intentionally unchanged until final route-switch PR.
[ ] /profile-lite opens Lite shell.
[ ] /profile-old opens old ProfilePage.
[ ] /profile/mandalas opens mandalas tab or old route remains intentionally unchanged until route-switch PR.
[ ] /profile/services opens services tab or old route remains intentionally unchanged until route-switch PR.
[ ] /profile/orders opens orders tab or old route remains intentionally unchanged until route-switch PR.
[ ] /profile/chats opens chats tab or old route remains intentionally unchanged until route-switch PR.
[ ] /profile/settings opens settings tab or old route remains intentionally unchanged until route-switch PR.
[ ] /masters opens MastersPage.
[ ] /profile/admin opens AdminPage.
[ ] Vercel rewrites support all routes.
[ ] Route map after change is documented in STATE.md and LOG.md.
```

---

## 5. Architecture contract

The new Lite cabinet must not copy `ProfilePage.jsx` as a giant monolith.

Preferred structure:

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

Acceptable first PR fallback:

```text
Keep render blocks inside ProfileLitePage.jsx, but separate them by named functions/sections.
```

Global state allowed:

```text
session
user
profile
authStatus
profileStatus
authError
profileError
activeLiteTab
safeDiagnostics/global safe notice
```

Per-module state required:

```text
materialsStatus/materialsError/materials
mediaStatus/mediaError/mediaItems/clientGoalPhotos/traditionAssets
mandalasStatus/mandalasError/compositions/currentComposition
servicesStatus/servicesError/services
ordersStatus/ordersError/orders
chatsStatus/chatsError/conversations/messages
```

Forbidden architecture:

```text
one giant global loading flag after auth is done
one failure path that hides the whole cabinet
one monolithic ProfilePage clone imported into Lite
secondary data inside critical auth bootstrap
```

---

## 6. Target cabinet structure

Required visible structure:

```text
Cabinet shell
  Topbar
    На главную
    Кабинет мастера / title
    Мастера
  Profile/session status line
  Main navigation tabs
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
  Active module content
  Inline notices
```

Required tab ids:

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

Cabinet structure acceptance checklist:

```text
[ ] Header exists.
[ ] Home button works.
[ ] Masters button works.
[ ] User/profile status is visible after login.
[ ] All required tabs are visible.
[ ] Clicking tabs does not reload page.
[ ] Active tab is visually clear.
[ ] Overview has quick cards.
[ ] Each module has a safe empty state.
[ ] Each module has an inline error state.
[ ] Mobile below 980px remains usable.
[ ] No horizontal overflow.
```

---

## 7. Module map

| Module | Target tab | Old source to inspect | Required status |
|---|---|---|---|
| Auth/shell | global | `ProfileLitePage.jsx`, `profileLiteClient.js`, `supabaseClient.js`, `profileBootstrapClient.js` | must work |
| Overview | `overview` | current `ProfileLitePage.jsx` summary | must work |
| Profile | `profile` | old `profileEditor` in `ProfilePage.jsx` | must match old fields |
| Materials | `materials` | `profileMaterialsClient.js`, old material workspace | must restore list/create/edit/save |
| Media/photos | `media` | `profileMediaClient.js`, `powerPlaceClient.js`, old photo workspace | must show old media/photos |
| Mandalas | `mandalas` | old Power Place constructor | must restore saved compositions and constructor |
| Services | `services` | `profileServicesClient.js`, services/order MVP scripts | must implement if clients/schema exist |
| Orders | `orders` | service order client/schema | must implement if clients/schema exist |
| Chats | `chats` | `masterChatClient.js`, chat migrations | must implement if clients/schema exist |
| Settings | `settings` | current Lite reset/refresh/session actions | must work |
| Diagnostics | `diagnostics` | current safe Lite diagnostics | must stay safe |

---

## 8. Module 1 — Auth and shell

### Required behavior

```text
1. Read session from URL hash or stored session.
2. Detect missing Supabase env and show safe message.
3. Detect expired session and offer reset/login.
4. Start Google login safely.
5. After valid user/session, render shell immediately.
6. Load profile and other modules after shell is open.
7. Reset session/sign out must clear local session and UI state.
```

### Must not do

```text
[ ] Do not wait for materials/media/mandalas/services/orders/chats before rendering shell.
[ ] Do not expose access_token/refresh_token/raw JWT.
[ ] Do not hardcode production domain in OAuth.
[ ] Do not clear a valid session because a secondary module failed.
```

### Acceptance checklist

```text
[ ] No-env state shows safe Supabase message.
[ ] No-session state shows Google login button.
[ ] Expired session shows safe reset/login state.
[ ] Stored valid session opens shell.
[ ] Google login returns to profile route and shell opens.
[ ] Shell remains open if profile load fails.
[ ] Shell remains open if materials load fails.
[ ] Shell remains open if media load fails.
[ ] Shell remains open if mandalas load fails.
[ ] Session reset works.
[ ] Debug shows only safe booleans/statuses.
```

---

## 9. Module 2 — Overview

### Required UI

```text
Current login state
Email
Short user id
Profile status
Master display name
Cabinet/module quick cards
Module health badges if safe
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

### Acceptance checklist

```text
[ ] Overview appears after login.
[ ] Email is visible if available.
[ ] Short user id is visible, full token is not visible.
[ ] Profile status is visible.
[ ] Quick card Профиль opens profile tab.
[ ] Quick card Мои мандалы opens mandalas tab.
[ ] Quick card Фото / Медиа opens media tab.
[ ] Quick card Материалы opens materials tab.
[ ] Quick card Услуги opens services tab.
[ ] Quick card Заказы opens orders tab.
[ ] Quick card Чаты opens chats tab.
[ ] Quick card Настройки opens settings tab.
[ ] No page reload on quick card click.
```

---

## 10. Module 3 — Profile editor and preview

### Old fields that must be restored

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

### Required UI labels

```text
Профиль мастера
Имя мастера
Описание
Город
Страна
Telegram
Сайт
Аватар / фото URL
План кабинета
Сохранить черновик
Отправить на модерацию
Выйти
Как это будет выглядеть
```

### Account plan copy

```text
Start: 7 мест силы и 10 фото клиентов.
Pro: 20 мест силы и 30 фото.
Биллинг: needs verification.
```

### Required behavior

```text
1. Load existing profile into form.
2. Save draft.
3. Send to moderation/pending if supported.
4. Show status badge.
5. Show safe success message.
6. Show inline error message.
7. Preview card updates from fields.
8. Cabinet ID shown using formatCabinetId(profile.id) if helper exists.
```

### Acceptance checklist

```text
[ ] Field display_name exists and saves.
[ ] Field bio exists and saves.
[ ] Field city exists and saves if schema supports it.
[ ] Field country exists and saves if schema supports it.
[ ] Field telegram exists and saves if schema supports it.
[ ] Field website exists and saves if schema supports it.
[ ] Field avatar_url exists and saves if schema supports it.
[ ] Field account_plan exists and saves if schema supports it.
[ ] Status badge is visible.
[ ] Save draft button works.
[ ] Send to moderation button works or shows needs verification if unsupported.
[ ] Preview card exists.
[ ] Preview reflects display name.
[ ] Preview reflects bio.
[ ] Preview reflects avatar_url if provided.
[ ] Save failure stays inline and shell remains open.
[ ] No secret/session data appears in profile UI.
```

### Parity indicator

Profile module is complete only if the user can edit the same profile information that existed in the old cabinet and see the same public-preview meaning.

---

## 11. Module 4 — Materials

### Old sources to preserve

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

### Required categories

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

### Required Channels structure

```text
Сефирот
  Большие арканы
  Малые арканы
  Сиферы
Руны
  Первый атт
  Второй атт
  Третий атт
Планеты
  Солнце
  Луна
  Меркурий
  Венера
  Марс
  Юпитер
  Сатурн
Деньги
Жизнь
```

### Required Form structure

```text
Защитные
Целебные
Бизнес
Другие
```

### Required material fields

```text
title
description
type
status
step_id
step_title
setting_title
setting_index
image_url / display_url if supported
material_category
material_subcategory
channelCategory
channelSubcategory
channelThirdLevel
```

### Required behavior

```text
1. Load own materials after shell opens.
2. Show latest materials.
3. Show empty state if none.
4. Create material.
5. Edit material if existing helper/schema supports it.
6. Save draft.
7. Send/publish/request moderation if existing code supports it.
8. Upload image/audio if existing code supports it.
9. Filter by category/subcategory.
10. Category filters must not hide all old media by default.
11. Errors stay inline.
```

### Acceptance checklist

```text
[ ] Materials tab opens.
[ ] Existing materials list appears.
[ ] Empty state appears if no materials.
[ ] Material card shows title.
[ ] Material card shows description.
[ ] Material card shows type label.
[ ] Material card shows status text.
[ ] Material image appears if image_url/display_url exists.
[ ] Create form exists.
[ ] Title input exists.
[ ] Description input exists.
[ ] Type selector exists.
[ ] Step selector exists for ДАО РИ if supported.
[ ] Setting selector exists if supported.
[ ] Category selector exists.
[ ] Subcategory selector exists.
[ ] Save draft works.
[ ] Publish/moderation action works or is marked needs verification.
[ ] Upload works if helper supports it.
[ ] ДАО РИ filter works.
[ ] Мистерии filter works.
[ ] Каналы filter works.
[ ] Фон filter works.
[ ] Форма filter works.
[ ] Талисманы filter works or marked needs verification.
[ ] Артефакты filter works or marked needs verification.
[ ] Клиенты filter works or marked needs verification.
[ ] Materials load failure does not close shell.
```

### Parity indicator

Materials module is complete only if the user can create and manage materials in the same practical way as in the old cabinet, including category placement.

---

## 12. Module 5 — Media / photos

### Old state/function names Codex must search

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
uploadProfileMedia
validateProfileMediaFile
listClientGoalPhotos
createClientGoalPhoto
deleteClientGoalPhoto
listTraditionAssets
createTraditionAsset
```

### Required UI

```text
Фото / Медиа tab
Saved client/goal photos section
Reusable images section
Latest images default view
Category/filter controls if supported
Upload photo button
Delete photo cross/button on hover if supported
Confirm text: Удалить фото из базы?
Inline upload/delete notices
```

### Required behavior

```text
1. Show old existing photos.
2. Show latest photos by default.
3. Upload new client/goal photo if helper supports it.
4. Delete photo with confirmation if helper supports it.
5. Resolve storage:// refs to signed display URLs.
6. Preserve external image URLs.
7. Use data:image only as temporary preview, not permanent saved ref.
8. Clicking photo can open it in Мои мандалы with description editing if old flow supports it.
9. Filters must not hide all media by default.
```

### Acceptance checklist

```text
[ ] Media tab opens.
[ ] Existing old photos appear.
[ ] Latest media appears by default without selecting filters.
[ ] Uploaded storage refs display as images.
[ ] External image URLs display as images.
[ ] Broken image refs show safe placeholder, not crash.
[ ] Upload button exists if upload helper exists.
[ ] Upload validates file type.
[ ] Upload success adds image to list.
[ ] Delete control appears if delete helper exists.
[ ] Delete asks: Удалить фото из базы?
[ ] Delete success removes image from UI.
[ ] Delete error stays inline.
[ ] Click photo opens/sets mandala draft if supported.
[ ] Active filters show only matching media.
[ ] Clearing filters returns latest media.
[ ] Media failure does not close shell.
```

### Parity indicator

Media module is complete only if old saved photos are visible and usable for mandalas.

---

## 13. Module 6 — Mandalas / Power Place

### Constructor types to restore

```text
zodiac    -> Зодиак
star      -> Звезда
chess     -> Шахматы
client    -> Мандала
altar     -> Алтарь
business  -> Бизнес
dao       -> ДАО
```

Codex must verify whether `client` should be visible or internal/default, because old code filtered it out in one selector.

### Variants/options to restore

```text
POWER_SOURCE_COUNTS: 2 / 4 / 6 / 8 / 12
STAR_VARIANTS: closed / open
CHESS_VARIANTS: classic-14 / classic-8 / plus-8
ZODIAC_VARIANTS: classic-2 / classic-4 / classic-6 / classic-8 / plus-8 / classic-12 / plus-12
BUSINESS_VERTEX_ZONE_COUNTS: 1 / 3
ALTAR_CENTER_RATIOS if present
resource comparison modes if present
```

### Persistence fields to preserve

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

### Required UI/behavior

```text
1. Мои мандалы tab opens.
2. Saved compositions list appears.
3. Saved composition can be loaded.
4. Composition title is editable.
5. Constructor type selector exists.
6. Central photo button says: Фото клиента / цели.
7. Object slots are clickable.
8. Object image picker works.
9. Cover picker works if supported.
10. Inner/outer cover support works if supported.
11. Slot image upload works if supported.
12. Resource comparison fields appear if supported.
13. Save new composition works.
14. Update selected composition works.
15. Download/export HTML fallback works if supported.
16. Print works if supported.
17. Publish to services action exists after save.
```

### Constructor parity checklist

```text
[ ] Зодиак format exists.
[ ] Зодиак 2 works.
[ ] Зодиак 4 works.
[ ] Зодиак 6 works.
[ ] Зодиак 8 works.
[ ] Зодиак 8+ works.
[ ] Зодиак 12 works.
[ ] Зодиак 12+ works.
[ ] Звезда format exists.
[ ] Звезда closed works.
[ ] Звезда open works.
[ ] Шахматы format exists.
[ ] Шахматы 14 фоток works.
[ ] Шахматы 8 фоток works.
[ ] Шахматы 8 фото+ works.
[ ] Алтарь format exists.
[ ] Бизнес format exists.
[ ] Бизнес 1 zone works.
[ ] Бизнес 3 zones works.
[ ] ДАО format exists or marked needs verification if old behavior is incomplete.
[ ] Мандала/client mode exists or is intentionally internal/default and documented.
```

### Saved composition checklist

```text
[ ] Saved compositions load after shell opens.
[ ] Load failure stays inline.
[ ] Saved composition dropdown/list exists.
[ ] Selecting saved composition restores constructor type.
[ ] Selecting saved composition restores title.
[ ] Selecting saved composition restores central photo.
[ ] Selecting saved composition restores object refs.
[ ] Selecting saved composition restores cover_ref.
[ ] Selecting saved composition restores resource comparison comments.
[ ] Save new composition works.
[ ] Update existing composition works.
[ ] Saved composition appears at top/list after save.
```

### Parity indicator

Mandalas module is complete only if the user can recreate and save the same practical mandala layouts that existed in the old cabinet.

---

## 14. Module 7 — Services

### Files to inspect

```text
src/lib/profileServicesClient.js, if present
scripts/apply-master-services-orders-mvp.mjs
supabase/migrations/*service*
supabase/migrations/*order*
src/pages/ProfilePage.jsx
src/pages/MastersPage.jsx
```

### Required UI/behavior

```text
1. Services tab opens.
2. Own services list appears if client/schema exists.
3. Empty state appears if no services.
4. Create service if supported.
5. Edit service title if supported.
6. Edit service description.
7. Attach saved mandala/composition.
8. Publish/unpublish if supported.
9. Copy public link if route exists.
10. Safe needs verification placeholder if public route/link is not implemented.
```

### Mandala-to-service flow

```text
1. User saves mandala/composition.
2. Button appears: Опубликовать в услугах.
3. Click creates/prepares service draft from mandala.
4. Services tab shows this service.
5. Service has actions:
   - Редактировать описание
   - Скопировать ссылку
6. Copied link can be given to client if public route exists.
```

### Acceptance checklist

```text
[ ] Services tab opens.
[ ] Services list loads or shows needs verification.
[ ] Service empty state is clear.
[ ] Saved mandala has Опубликовать в услугах.
[ ] Publishing creates service draft or safe service draft state.
[ ] Service appears in Services tab.
[ ] Редактировать описание exists.
[ ] Description save works or needs verification is shown.
[ ] Скопировать ссылку exists if route/link exists.
[ ] Copy link action works or reports needs verification.
[ ] Services failure does not close shell.
```

---

## 15. Module 8 — Orders

### Client order flow

```text
1. User opens service feed/profile.
2. User selects format:
   - signature: С подписью мастера
   - no_signature: Без подписи мастера
   - both: Две версии
3. If authorized, CTA: Оформить заказ.
4. If not authorized, CTA: Войти через Google и оформить заказ.
5. Selected service_id and format survive login.
6. After login, order form opens with service and format prefilled.
7. User fills request, goal, comment.
8. User can attach files/photos/references if supported.
9. User submits order.
```

### Master orders UI

```text
incoming orders
order status
service title
selected format
client request
client goal
client comment
attachments/references if supported
created/updated dates if available
safe status transitions if supported
```

### Acceptance checklist

```text
[ ] Orders tab opens.
[ ] Orders list loads or shows needs verification.
[ ] Service format selector has signature.
[ ] Service format selector has no_signature.
[ ] Service format selector has both.
[ ] Authorized CTA says Оформить заказ.
[ ] Unauthorized CTA says Войти через Google и оформить заказ.
[ ] service_id survives login.
[ ] format survives login.
[ ] Order form preselects service.
[ ] Order form preselects format.
[ ] Request field exists.
[ ] Goal field exists.
[ ] Comment field exists.
[ ] Attachments exist if supported.
[ ] Submit works or needs verification is shown.
[ ] Orders failure does not close shell.
```

---

## 16. Module 9 — Chats

### Files to inspect

```text
src/lib/masterChatClient.js
src/pages/ProfilePage.jsx
supabase/migrations/*chat*
supabase/migrations/*conversation*
supabase/migrations/*message*
```

### Required behavior

```text
conversation list
open conversation
show messages
send message
favorite chats if supported
show linked order/service if supported
participant-only RLS
inline errors
```

### Acceptance checklist

```text
[ ] Chats tab opens.
[ ] Conversation list loads or shows needs verification.
[ ] Empty state is clear.
[ ] Conversation opens if data exists.
[ ] Messages display if data exists.
[ ] Send message works if client/schema exists.
[ ] Favorite chat works if supported.
[ ] Linked order/service appears if supported.
[ ] Chat errors stay inline.
[ ] No anon chat access is introduced.
[ ] Diagnostics do not show private message bodies.
```

---

## 17. Module 10 — Settings

### Required UI

```text
refresh data
reset session / sign out
show safe Supabase configured status
show profile status
show account plan/limits if supported
open diagnostics
```

### Acceptance checklist

```text
[ ] Settings tab opens.
[ ] Refresh data button exists.
[ ] Refresh data reloads safe profile/module data.
[ ] Reset session/sign out exists.
[ ] Reset session clears local state.
[ ] Supabase configured status is shown as yes/no only.
[ ] Profile status is visible.
[ ] Account plan is visible if supported.
[ ] Limits are visible if supported.
[ ] Link/button to Diagnostics works.
[ ] No env values are shown.
```

---

## 18. Module 11 — Diagnostics

### Allowed diagnostics

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
materialsStatus
mediaStatus
mandalasStatus
servicesStatus
ordersStatus
chatsStatus
short user id
short profile id
```

### Forbidden diagnostics

```text
access_token
refresh_token
raw JWT
Authorization header
env values
private request body
private chat message bodies
private order attachments as raw data
```

### Acceptance checklist

```text
[ ] Diagnostics tab opens.
[ ] Shows active route.
[ ] Shows active tab.
[ ] Shows authStatus.
[ ] Shows profileStatus.
[ ] Shows module statuses.
[ ] Does not show access_token.
[ ] Does not show refresh_token.
[ ] Does not show raw JWT.
[ ] Does not show env values.
[ ] Does not show private payloads.
```

---

## 19. Implementation phases

Codex should implement in safe phases. If one PR becomes too large, stop after the nearest stable phase and report what remains.

### Phase A — Inventory

Before code changes, produce inventory from `ProfilePage.jsx`:

```text
tabs and labels
profile fields
material fields/categories
media/photo flows
mandala constructor types/variants
saved composition fields
service clients/schema
order clients/schema
chat clients/schema
CSS classes/files
```

### Phase B — Lite shell

```text
Build tabs, overview, settings, diagnostics.
Move current Lite profile/material blocks into tabs.
Add safe placeholders for modules not yet implemented.
```

### Phase C — Profile parity

```text
Restore all old profile fields and preview.
```

### Phase D — Materials parity

```text
Restore material list/create/edit/save/categories/upload if supported.
```

### Phase E — Media parity

```text
Restore old photos, upload/delete, signed URL display, click-to-mandala behavior.
```

### Phase F — Saved mandalas parity

```text
Restore saved composition list/load/display.
```

### Phase G — Constructor parity

```text
Restore constructor formats, object slots, covers, central photo, save/update/download/print.
```

### Phase H — Services parity

```text
Restore services and mandala-to-service publishing.
```

### Phase I — Orders parity

```text
Restore order flow and service_id/format persistence across login.
```

### Phase J — Chats parity

```text
Restore chats where supported.
```

### Phase K — Route switch

```text
Switch /profile and /profile/* routes to Lite after QA.
Keep /profile-old.
```

---

## 20. Global QA checklist

Run checks:

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

If a script does not exist, report `not found` and run nearest available script from `package.json`.

Manual route QA:

```text
[ ] / works.
[ ] /profile works or intentional old mapping is documented.
[ ] /profile-lite works.
[ ] /profile-old works.
[ ] /profile/mandalas works or intentional old mapping is documented.
[ ] /profile/services works or intentional old mapping is documented.
[ ] /profile/orders works or intentional old mapping is documented.
[ ] /profile/chats works or intentional old mapping is documented.
[ ] /profile/settings works or intentional old mapping is documented.
[ ] /masters works.
[ ] /profile/admin works.
[ ] Google login works on target route if env/live available.
[ ] No console errors from changed code.
[ ] Desktop 1280px usable.
[ ] Mobile below 980px usable.
[ ] No horizontal overflow.
```

---

## 21. Visual parity checklist

Use `/profile-old` as reference.

```text
[ ] New Lite cabinet has a comparable master-cabinet topbar.
[ ] New Lite cabinet has visible module navigation.
[ ] Profile form visually includes the same old fields.
[ ] Preview card exists.
[ ] Materials cards/grid/list are recognizable.
[ ] Media/photo grid is recognizable.
[ ] Mandala constructor area is recognizable.
[ ] Constructor format controls are visible.
[ ] Central photo control says Фото клиента / цели.
[ ] Saved composition selector/list is visible.
[ ] Services/orders/chats tabs are visible even if some data is needs verification.
[ ] Notices/errors are inline, not full-page blockers.
[ ] RU labels are preserved.
```

---

## 22. Data parity checklist

```text
[ ] Same user/session can open Lite.
[ ] Same profile id is used.
[ ] Same profile data is loaded.
[ ] Same materials are listed.
[ ] Same material image refs are displayed.
[ ] Same client/goal photos are listed.
[ ] Same storage refs resolve to display URLs.
[ ] Same saved power-place compositions are listed.
[ ] Same selected saved composition restores old fields.
[ ] Same object refs are used.
[ ] Same cover refs are used.
[ ] Same services are listed if schema/client exists.
[ ] Same orders are listed if schema/client exists.
[ ] Same chats are listed if schema/client exists.
```

If any item cannot be verified, Codex must mark exactly:

```text
needs verification: <item> because <reason>
```

---

## 23. Done / not done matrix

Codex must include this matrix in reports and update it honestly.

| Area | Done when | Status |
|---|---|---|
| Auth shell | valid session opens shell without secondary blockers | pending |
| Overview | all quick cards switch tabs | pending |
| Profile | all old fields save/load and preview works | pending |
| Materials | list/create/edit/save/category flow works | pending |
| Media | old photos visible, upload/delete works if supported | pending |
| Saved mandalas | compositions list/load/display works | pending |
| Constructor | old formats/variants save/update/export work | pending |
| Services | mandala can publish to services, description/link work | pending |
| Orders | service order flow works, format survives login | pending |
| Chats | participant conversations/messages work if supported | pending |
| Settings | refresh/reset/status/limits work safely | pending |
| Diagnostics | safe statuses only, no secrets | pending |
| Routes | final route map works, /profile-old preserved | pending |
| QA | tests/build/manual QA pass | pending |

Allowed statuses:

```text
done
partial
needs verification
blocked
not started
```

---

## 24. One-prompt Codex instruction

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
5. Восстанови old profile fields: display_name, bio, city, country, telegram, website, avatar_url, account_plan, status, preview card.
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

Report using the template from section 25.
```

---

## 25. Codex report template

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
- CSS/classes:

Implemented modules:

Module acceptance checklist:
- Auth shell:
- Overview:
- Profile:
- Materials:
- Media:
- Mandalas:
- Services:
- Orders:
- Chats:
- Settings:
- Diagnostics:

Done / not done matrix:
| Area | Status | Notes |
|---|---|---|
| Auth shell |  |  |
| Overview |  |  |
| Profile |  |  |
| Materials |  |  |
| Media |  |  |
| Saved mandalas |  |  |
| Constructor |  |  |
| Services |  |  |
| Orders |  |  |
| Chats |  |  |
| Settings |  |  |
| Diagnostics |  |  |
| Routes |  |  |
| QA |  |  |

Route map after change:

Checks run:

Local QA:

Visual parity with /profile-old:

Data parity with /profile-old:

Needs verification:

Not verified:

Risks:

Next step:
```

---

## Final summary

The new Profile Lite alternative cabinet is successful only when it gives the user the same practical cabinet capabilities as the old heavy profile, while improving reliability through a modular shell, independent loaders, inline errors, safe diagnostics, no secret exposure, and `/profile-old` preserved for comparison until full parity is verified.

---

## 26. Implementation inventory and route result — 2026-06-01

Branch: `codex/profile-lite-full-alternative-cabinet`.

Inventory confirmed before implementation:

- Route map before: `/profile` and modular profile routes rendered heavy `ProfilePage`; `/profile-lite` rendered diagnostic `ProfileLitePage`; `/profile-old` rendered heavy `ProfilePage`.
- Old tabs: `Место силы`, `Мои мандалы`, `Услуги`, `Заявки`, `Чаты`, `Профиль`.
- Profile fields: `display_name`, `bio`, `city`, `country`, `telegram`, `website`, `avatar_url`, `account_plan`, `status`, `user_id`.
- Materials: `profile_cabinet_publications` through `profileMaterialsClient`; types `mandala`, `artifact`, `practice`; statuses `draft`, `pending`, `approved`, `rejected`; categories `ДАО РИ`, `Мистерии`, `Каналы`, `Фон`, `Форма`, `Талисманы`, `Артефакты`, `Клиенты`.
- Media: `profile-cabinet-media`; upload kinds `client-goal`, `tradition`, `power-place`, `material`, `underlay`; signed URLs display only.
- Mandalas: `profile_cabinet_power_place_compositions`; constructor types `zodiac`, `star`, `chess`, `client`, `altar`, `business`, `dao`; persistence fields include `geometry`, `zodiac_visible_count`, `star_variant`, `chess_variant`, `altar_center_ratio`, `business_vertex_zone_count`, `cover_ref`, `object_refs`, `central_photo_id`, tradition/resource fields.
- Services/orders/chats: clients exist for `profile_cabinet_services`, `profile_cabinet_service_orders`, and `profile_cabinet_chat_*`; live schema/RLS still needs verification.
- CSS/tests: `src/profileCabinet.css`, `src/profileMandalaWorkspace.css`, `test/profileLiteRoute.test.mjs`, `test/profileLiteClient.test.mjs`, `test/profileLiteCabinetContract.test.mjs`, and existing profile client tests.

Route map after implementation:

```text
/                     -> public home, unchanged
/profile              -> ProfileLitePage, overview tab
/profile-lite         -> ProfileLitePage, overview tab
/profile-old          -> old ProfilePage reference/diagnostic
/profile/mandalas     -> ProfileLitePage, mandalas tab
/profile/services     -> ProfileLitePage, services tab
/profile/orders       -> ProfileLitePage, orders tab
/profile/chats        -> ProfileLitePage, chats tab
/profile/settings     -> ProfileLitePage, settings tab
/masters              -> MastersPage, unchanged
/profile/admin        -> AdminPage, unchanged
```

Implementation result:

- `ProfileLitePage.jsx` is now the container for auth/session bootstrap, active route tab, and module wiring.
- Focused modules live under `src/pages/profile-lite/`.
- The shell opens from a valid session/user via the proven bootstrap helper and does not wait for profile/materials/media/mandalas/services/orders/chats.
- Secondary modules load through isolated effects and report sanitized inline `needs verification` messages.
- `/profile-old` remains the heavy reference cabinet.
