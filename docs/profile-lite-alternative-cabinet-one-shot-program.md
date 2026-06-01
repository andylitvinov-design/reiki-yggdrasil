# Profile Lite Alternative Cabinet — One-Shot Codex Program

Last updated: 2026-06-01

Repo: `andylitvinov-design/reiki-yggdrasil`  
Live: `https://mentalica.vercel.app`  
Legacy: `https://reiki-yggdrasil.vercel.app`

Main specification:

```text
docs/profile-lite-alternative-cabinet-plan.md
```

This document is the professional one-shot execution program for Codex. It turns the specification into a direct implementation prompt with scope, stages, quality gates, rollback rules, and acceptance criteria.

---

## 1. Executive objective

Create an alternative full master cabinet on top of `ProfileLitePage` that can replace the old heavy `ProfilePage` in daily work.

The new cabinet must be a functional copy of the old cabinet from the user's point of view:

```text
same sections
same profile fields
same materials workflow
same photo/media workflow
same mandala constructor workflow
same saved mandala/composition workflow
same service publishing direction
same order direction
same chat direction
same RU-first interface
```

But it must not copy the old implementation architecture:

```text
no monolithic ProfilePage clone
no global shell blocking on secondary modules
no secondary data in auth bootstrap
no secrets in diagnostics
no route breakage
```

The old cabinet remains available as `/profile-old` until parity is verified.

---

## 2. One-shot implementation strategy

Codex should treat this as one branch and one PR, but must implement in internal milestones.

Target branch:

```text
codex/profile-lite-full-alternative-cabinet
```

If the full rebuild is too large for one safe PR, Codex must stop at the nearest stable milestone and leave the rest as visible `needs verification` modules with exact TODOs.

Minimum acceptable one-shot result:

```text
1. Stable Profile Lite shell.
2. Full tab structure.
3. Full old profile editor fields.
4. Materials workspace restored as far as existing clients allow.
5. Media/photos visible, especially old saved photos.
6. Saved mandalas/compositions list/load/display.
7. Mandala constructor either restored or visible with exact blocked TODOs.
8. Services/orders/chats visible as safe modules, implemented where existing clients/schema allow.
9. /profile-old preserved.
10. STATE.md and LOG.md updated.
11. Tests/build run.
```

Best one-shot result:

```text
Everything above plus full mandala constructor, save/update/export, publish-to-services, order flow, and chat flow where existing clients/schema support it.
```

---

## 3. Required reading before coding

Codex must read and report inventory from:

```text
AGENTS.md
README.md
STATE.md
LOG.md
docs/profile-lite-alternative-cabinet-plan.md
docs/profile-lite-alternative-cabinet-one-shot-program.md
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

If missing:

```text
not found: <file>
```

Do not invent missing clients, schema, fields, or routes.

---

## 4. Required inventory before implementation

Before changing code, Codex must make an inventory from `ProfilePage.jsx` and related clients.

Inventory table required:

| Area | Must find | Output |
|---|---|---|
| Route map | current `src/main.jsx` mapping | exact current route map |
| Profile fields | old profile editor fields | list fields + save helper |
| Materials | fields, category sources, actions | list fields/actions/helpers |
| Media | uploads/photos/signed URLs/delete | list helpers/state names |
| Mandalas | constructor types, variants, slots | list types/variants/persistence fields |
| Services | client/schema/actions | found / not found |
| Orders | client/schema/actions | found / not found |
| Chats | client/schema/actions | found / not found |
| CSS | cabinet/mandala classes | list CSS files/classes |
| Tests | available scripts | list scripts from package.json |

Required old profile fields to verify:

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

Required constructor types to verify:

```text
zodiac
star
chess
client
altar
business
dao
```

Required material categories to verify:

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

---

## 5. Route and navigation target

Final target:

```text
/profile              -> ProfileLitePage overview tab
/profile-lite         -> ProfileLitePage overview tab
/profile-old          -> old ProfilePage reference
/profile/mandalas     -> ProfileLitePage mandalas tab
/profile/services     -> ProfileLitePage services tab
/profile/orders       -> ProfileLitePage orders tab
/profile/chats        -> ProfileLitePage chats tab
/profile/settings     -> ProfileLitePage settings tab
/profile/admin        -> AdminPage unchanged
/masters              -> MastersPage unchanged
/                     -> public home unchanged
```

Safe route switch rule:

```text
If module parity is not verified, keep /profile as current mapping and expose the new full cabinet at /profile-lite first. Switch /profile only after local QA and tests pass.
```

Never remove `/profile-old`.

---

## 6. Technical architecture to implement

Preferred component layout:

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

Allowed fallback:

```text
Keep modules as named render functions inside ProfileLitePage.jsx if extraction is too risky for one PR.
```

Required tabs:

```text
overview      -> Обзор
profile       -> Профиль
mandalas      -> Мои мандалы
media         -> Фото / Медиа
materials     -> Материалы
services      -> Услуги
orders        -> Заказы
chats         -> Чаты
settings      -> Настройки
diagnostics  -> Диагностика
```

---

## 7. Critical loading architecture

The shell may depend only on:

```text
Supabase env presence
stored/hash session
current user or safe session user id
expired/invalid auth detection
```

The shell must not depend on:

```text
own profile load
materials
media
client/goal photos
tradition assets
saved mandalas/compositions
services
orders
chats
```

Module error rule:

```text
A module failure shows an inline notice inside that module and does not change the global auth/shell state.
```

Explicit anti-regression test idea:

```text
Simulate valid session + materials/media failure -> shell still renders and module shows inline warning.
```

---

## 8. Module implementation requirements

## 8.1 Auth shell

Must implement:

```text
Google login
stored/hash session read
expired session state
reset session / sign out
safe no-env state
shell render after valid user/session
```

Success:

```text
/profile-lite never hangs on “Загружаю кабинет...” when valid session exists.
```

## 8.2 Overview

Must show:

```text
email
short user id
profile status
master display name
module quick cards
module status badges where safe
```

Quick cards must switch tabs without reload.

## 8.3 Profile

Must restore old fields:

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

Must restore UI:

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

Must show plan note:

```text
Start: 7 мест силы и 10 фото клиентов. Pro: 20 мест силы и 30 фото. Биллинг: needs verification.
```

If any field is unsupported by schema/client, show/report:

```text
needs verification: <field> unsupported by verified schema/client
```

## 8.4 Materials

Must restore:

```text
list own materials
create material
edit material if helper/schema exists
save draft
send to moderation/publish if helper/schema exists
type/status labels
step/setting fields
image_url/display_url support
file upload if helper exists
category filters
```

Required categories:

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

Required Channels substructure:

```text
Сефирот -> Большие арканы / Малые арканы / Сиферы
Руны -> Первый атт / Второй атт / Третий атт
Планеты -> Солнце / Луна / Меркурий / Венера / Марс / Юпитер / Сатурн
Деньги
Жизнь
```

Failure must be inline.

## 8.5 Media / photos

Must restore:

```text
old saved client/goal photos visible
latest media default view
upload client/goal photo if helper exists
delete photo if helper exists
confirm text: Удалить фото из базы?
storage:// refs displayed via signed URL
external image URLs displayed
data:image only temporary, not persisted
click photo -> open/set in Мои мандалы if old flow supports it
filters only after user selects them
```

Must inspect:

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

## 8.6 Mandalas / Power Place

Must restore as much as verified code supports:

```text
saved compositions list
load saved composition
composition title
constructor type selector
central photo button: Фото клиента / цели
object slot picker
cover picker
inner/outer cover if supported
slot image upload if supported
resource comparison comments if supported
save new composition
update selected composition
download/export HTML fallback if supported
print if supported
publish to services action after save
```

Constructor types:

```text
Зодиак / zodiac
Звезда / star
Шахматы / chess
Мандала / client
Алтарь / altar
Бизнес / business
ДАО / dao
```

Variants:

```text
Power sources: 2 / 4 / 6 / 8 / 12
Star: closed / open
Chess: classic-14 / classic-8 / plus-8
Zodiac: classic-2 / classic-4 / classic-6 / classic-8 / plus-8 / classic-12 / plus-12
Business zones: 1 / 3
```

Persistence fields:

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

## 8.7 Services

Must inspect existing clients/schema before implementing.

Must restore if supported:

```text
own service list
create/edit service
edit description
attach saved mandala/composition
publish/unpublish
copy public link
safe empty state
inline errors
```

Required mandala-to-service flow:

```text
Saved mandala -> Опубликовать в услугах -> service appears in Services -> Редактировать описание -> Скопировать ссылку
```

If route/link is not implemented:

```text
needs verification: public service route/link not found
```

## 8.8 Orders

Must restore if clients/schema support it:

```text
service profile order CTA
format selector:
  signature -> С подписью мастера
  no_signature -> Без подписи мастера
  both -> Две версии
unauthorized CTA -> Войти через Google и оформить заказ
authorized CTA -> Оформить заказ
persist service_id + format before/after login
order form with request/goal/comment
attachments if supported
master incoming orders list
order status
```

If not fully supported, the tab must explain exactly what is missing.

## 8.9 Chats

Must restore if clients/schema support it:

```text
conversation list
open conversation
messages
send message
favorite chats if supported
linked order/service if supported
participant-only access
```

No anon access. No private messages in diagnostics.

## 8.10 Settings

Must include:

```text
refresh data
reset session / sign out
safe Supabase configured status
profile status
account plan/limits if supported
open diagnostics
```

## 8.11 Diagnostics

Allowed:

```text
Supabase configured yes/no
stored session yes/no
session expired yes/no
user state yes/no
user id present yes/no
profile state yes/no
authStatus/profileStatus
active route/tab
module statuses
short user/profile id
```

Forbidden:

```text
access_token
refresh_token
raw JWT
Authorization header
env values
private request body
private chat messages
private order attachment raw data
```

---

## 9. Professional quality gates

Codex must pass these gates before report.

## Gate 1 — Source inventory gate

```text
[ ] Actual current route map documented.
[ ] Old profile fields documented.
[ ] Old material fields/categories documented.
[ ] Old media/photo flows documented.
[ ] Old mandala constructor types/variants documented.
[ ] Old saved composition fields documented.
[ ] Services/orders/chats support documented or not found.
```

## Gate 2 — Shell reliability gate

```text
[ ] Shell opens with valid session.
[ ] Shell opens even if profile load fails.
[ ] Shell opens even if materials load fails.
[ ] Shell opens even if media load fails.
[ ] Shell opens even if mandalas load fails.
[ ] No global endless loading after valid session.
```

## Gate 3 — Functional parity gate

```text
[ ] Profile parity achieved or exact gaps reported.
[ ] Materials parity achieved or exact gaps reported.
[ ] Media parity achieved or exact gaps reported.
[ ] Saved mandalas parity achieved or exact gaps reported.
[ ] Constructor parity achieved or exact gaps reported.
[ ] Services/orders/chats implemented or exact missing clients/schema reported.
```

## Gate 4 — Safety gate

```text
[ ] No secrets in UI.
[ ] No raw tokens/JWT/env values in diagnostics.
[ ] /profile-old preserved.
[ ] / unchanged.
[ ] /masters unchanged.
[ ] /profile/admin unchanged.
[ ] Vercel rewrites preserved.
```

## Gate 5 — QA gate

```text
[ ] Tests run.
[ ] Build run.
[ ] Local route QA run.
[ ] Desktop QA run.
[ ] Mobile QA run.
[ ] Known unverified items listed.
```

---

## 10. Required tests and checks

Run:

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

If a script does not exist:

```text
not found: <script>
ran instead: <nearest available script>
```

Recommended additional test updates:

```text
1. profile-lite route renders all required tabs.
2. profile-lite shell renders when secondary material load fails.
3. diagnostics do not include access_token/refresh_token/raw JWT.
4. /profile-old route still maps to ProfilePage.
5. profile fields list includes old fields.
```

---

## 11. Manual QA matrix

Routes:

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

Viewports:

```text
desktop 1280px
mobile below 980px
```

Manual checks:

```text
[ ] No horizontal overflow.
[ ] No visible runtime error overlay.
[ ] No console errors from changed code.
[ ] RU labels visible.
[ ] Tabs clickable.
[ ] Module errors inline.
[ ] /profile-old still available for comparison.
```

---

## 12. Rollback and safety plan

If anything breaks:

```text
1. Do not remove /profile-old.
2. Keep /profile-lite as the experimental route.
3. Do not switch /profile to Lite until QA passes.
4. If route switch caused issue, revert only route mapping in src/main.jsx/vercel.json.
5. Keep module code isolated so failed module can be disabled by tab placeholder.
6. Never patch with DOM reload hacks.
```

Rollback-ready architecture:

```text
ProfileLite modules can be hidden or converted to safe placeholders without changing auth shell.
/profile-old remains old full reference.
```

---

## 13. Final one-shot prompt for Codex

Copy this entire prompt to Codex:

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

Main specs:
- docs/profile-lite-alternative-cabinet-plan.md
- docs/profile-lite-alternative-cabinet-one-shot-program.md

Задача:
Создай профессиональную альтернативную копию старого кабинета мастера на базе ProfileLitePage. Новый кабинет должен воспроизвести весь полезный пользовательский функционал старого heavy ProfilePage, но быть реализован как модульный Lite cabinet без старых зависаний. Старый кабинет оставить доступным на /profile-old как reference/diagnostic.

Сначала прочитай:
1. AGENTS.md
2. README.md
3. STATE.md
4. LOG.md
5. docs/profile-lite-alternative-cabinet-plan.md
6. docs/profile-lite-alternative-cabinet-one-shot-program.md
7. docs/profile-cabinet-recovery-summary-2026-06-01.md, если есть
8. package.json
9. vercel.json
10. src/main.jsx
11. src/pages/ProfileLitePage.jsx
12. src/pages/ProfilePage.jsx
13. src/lib/profileLiteClient.js
14. src/lib/profileBootstrapClient.js
15. src/lib/supabaseClient.js
16. src/lib/profileMaterialsClient.js
17. src/lib/profileMediaClient.js
18. src/lib/powerPlaceClient.js
19. src/lib/profileServicesClient.js, если есть
20. src/lib/masterChatClient.js, если есть
21. all related tests under test/

Перед кодом составь inventory:
- current route map;
- old profile fields;
- old material fields/categories/actions;
- old media/photo flows/helpers;
- old mandala constructor types/variants/persistence fields;
- services/orders/chats clients/schema or not found;
- CSS files/classes;
- available test scripts.

Архитектура:
- Не копируй ProfilePage.jsx как монолит.
- Создай модульный Lite cabinet на базе ProfileLitePage.
- Используй отдельные модули или named render blocks:
  - Auth shell
  - Overview
  - Profile
  - Materials
  - Media / photos
  - Mandalas / Power Place
  - Services
  - Orders
  - Chats
  - Settings
  - Diagnostics
- Shell должен открываться после valid session/user.
- getOwnProfile/materials/media/mandalas/services/orders/chats не должны блокировать shell render.
- Secondary module failures должны быть inline warnings inside module.
- Не показывай access_token, refresh_token, raw JWT, env values, headers, private payloads.

Функционал, который надо восстановить:

1. Auth shell:
- Google login;
- stored/hash session;
- expired session state;
- reset session/sign out;
- no-env safe state;
- shell opens without global hang.

2. Tabs:
- Обзор;
- Профиль;
- Мои мандалы;
- Фото / Медиа;
- Материалы;
- Услуги;
- Заказы;
- Чаты;
- Настройки;
- Диагностика.

3. Profile:
- display_name;
- bio;
- city;
- country;
- telegram;
- website;
- avatar_url;
- account_plan;
- status;
- Сохранить черновик;
- Отправить на модерацию;
- Выйти;
- preview card “Как это будет выглядеть”.

4. Materials:
- list/create/edit/save;
- status/type labels;
- image_url/display_url;
- upload if supported;
- categories: ДАО РИ, Мистерии, Каналы, Фон, Форма, Талисманы, Артефакты, Клиенты;
- Каналы: Сефирот/Руны/Планеты/Деньги/Жизнь with known sublevels;
- errors inline only.

5. Media/photos:
- show old client/goal photos;
- latest-first default;
- upload if supported;
- delete if supported with confirm “Удалить фото из базы?”;
- signed URL display for storage refs;
- external URL display;
- click photo -> opens/sets it in Мои мандалы if old flow supports it;
- do not persist data:image previews as permanent refs.

6. Mandalas / Power Place:
- saved compositions list/load/display;
- title;
- constructor type selector;
- central photo button “Фото клиента / цели”;
- object slots and picker;
- covers inner/outer if supported;
- save new composition;
- update selected composition;
- download/export/print if supported;
- publish to services action after save.

Constructor types/variants:
- Зодиак: classic-2/4/6/8/12, plus-8, plus-12;
- Звезда: closed/open;
- Шахматы: classic-14/classic-8/plus-8;
- Мандала/client if supported;
- Алтарь;
- Бизнес with 1/3 zones;
- ДАО if supported.

7. Services:
- implement from existing client/schema if found;
- saved mandala -> Опубликовать в услугах;
- service appears in Services;
- Редактировать описание;
- Скопировать ссылку if route/link exists;
- if missing, show needs verification with exact missing part.

8. Orders:
- implement from existing client/schema if found;
- service format selector: signature/no_signature/both;
- unauthorized CTA: Войти через Google и оформить заказ;
- authorized CTA: Оформить заказ;
- preserve service_id + format across login;
- order form: request, goal, comment, attachments if supported;
- master orders list if supported;
- if missing, show needs verification with exact missing part.

9. Chats:
- implement from existing client/schema if found;
- conversation list, messages, send message, favorite if supported;
- participant-only access;
- if missing, show needs verification with exact missing part.

10. Settings:
- refresh data;
- reset session/sign out;
- Supabase configured yes/no only;
- profile status;
- account plan/limits if supported;
- diagnostics link.

11. Diagnostics:
- safe statuses only;
- no tokens/env/JWT/private payloads.

Routes:
- keep /profile-old as old ProfilePage;
- preserve /, /masters, /profile/admin;
- final target route map from docs, but do not switch /profile to Lite until QA passes. If risky, keep full new cabinet on /profile-lite first and document route map.

Allowed files:
- src/pages/ProfileLitePage.jsx
- src/profile-lite/*
- src/lib/profileLiteClient.js
- src/lib/profileMaterialsClient.js only for non-breaking extension
- src/lib/profileMediaClient.js only for non-breaking extension
- src/lib/powerPlaceClient.js only for non-breaking extension
- src/lib/profileServicesClient.js if present/needed
- src/lib/masterChatClient.js if present/needed
- src/profileCabinet.css
- src/profileMandalaWorkspace.css only for additive/reused styles
- tests under test/
- STATE.md
- LOG.md

Do not change unless necessary:
- src/pages/ProfilePage.jsx
- src/lib/profileBootstrapClient.js
- src/lib/supabaseClient.js
- supabase/migrations/*
- vercel.json
- src/main.jsx

Hard no-go:
- Do not remove /profile-old.
- Do not expose secrets.
- Do not hardcode production domain in OAuth.
- Do not make secondary modules block shell.
- Do not break /, /masters, /profile/admin.
- Do not remove RU default.
- Do not use DOM reload hacks.

Run checks:
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

Update:
- STATE.md
- LOG.md

Report:
- Branch
- PR
- Changed files
- Inventory found
- Route map after change
- Implemented modules
- Needs verification modules
- Done/not done matrix
- Checks run
- Local QA
- Visual parity with /profile-old
- Data parity with /profile-old
- Not verified
- Risks
- Next step
```

---

## 14. Done / not done matrix for final report

Codex must fill this honestly:

| Area | Required result | Status | Notes |
|---|---|---|---|
| Auth shell | valid session opens Lite shell without secondary blockers |  |  |
| Overview | all quick cards/tabs work |  |  |
| Profile | all old fields save/load + preview |  |  |
| Materials | list/create/edit/save/categories/upload if supported |  |  |
| Media | old photos visible + upload/delete/signed URLs if supported |  |  |
| Saved mandalas | list/load/display saved compositions |  |  |
| Constructor | old formats/variants save/update/export |  |  |
| Services | mandala publish + description/link |  |  |
| Orders | format + service_id survives login + order form |  |  |
| Chats | conversations/messages if supported |  |  |
| Settings | refresh/reset/status/limits |  |  |
| Diagnostics | safe statuses only, no secrets |  |  |
| Routes | target route map or safe deferred map documented |  |  |
| QA | tests/build/manual QA |  |  |

Allowed statuses:

```text
done
partial
needs verification
blocked
not started
```

---

## 15. Final acceptance statement

The work is complete only when Codex can state:

```text
The new Profile Lite cabinet is functionally usable as an alternative copy of the old master cabinet. The old cabinet remains available at /profile-old. All implemented modules load independently and do not block the shell. All unsupported pieces are explicitly marked needs verification with exact missing clients/schema/routes. Tests and build were run, and route/mobile/desktop QA was performed.
```

---

## 16. One-shot execution result — 2026-06-01

Implemented on branch `codex/profile-lite-full-alternative-cabinet`.

| Area | Status | Notes |
|---|---|---|
| Auth shell | done | Shell opens after valid session/user and keeps secondary loaders out of auth state. |
| Overview | done | Summary cards show module counts/statuses. |
| Profile | done | Old fields restored with draft/pending save and preview. |
| Materials | partial | List/create/upload path uses existing client; edit existing material remains future work. |
| Media | partial | Client/goal photos and tradition assets list/upload/delete where helpers support it. |
| Saved mandalas | done | Existing compositions list/load into Lite constructor draft. |
| Constructor | partial | Persistence foundation supports old fields/types/variants; heavy visual builder remains `/profile-old` reference. |
| Services | partial | List/create/publish through existing client; live table/RLS needs verification. |
| Orders | partial | List/update through existing client; live table/RLS needs verification. |
| Chats | partial | Existing thread list/send through existing client; new conversation creation needs live approved-profile/RLS verification. |
| Settings | done | Reset/status/reference links included. |
| Diagnostics | done | Safe boolean/status diagnostics only. |
| Routes | done | `/profile` and modular profile routes now render Lite; `/profile-old` remains heavy. |
| QA | partial | Local automated checks/build run; browser/live QA remains required. |
