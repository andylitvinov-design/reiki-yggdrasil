# Community Activity Feed Concept — Reiki Yggdrasil / Mentalica

Last updated: 2026-06-05

## 1. Purpose

Reiki Yggdrasil / Mentalica should evolve from a personal cabinet and learning site into a living community of masters and students.

The core community mechanism should be a **filtered news/activity feed**. It should show public-safe community updates:

- master news posts;
- approved mandalas/materials;
- published Power Place compositions;
- public-safe photo albums, not raw private uploads;
- services created or updated by masters;
- practices/course notes/ritual notes;
- admin announcements and featured items.

The product metaphor is not a direct Instagram clone. The goal is a ritual, educational, and community-based stream where public mandalas, services, practices, albums, and master updates become visible as a shared field of work.

## 2. Current code architecture summary

This concept is based on current repo analysis, not only on abstract product ideas.

### 2.1 Repo / deployment boundary

Canonical repo: `andylitvinov-design/reiki-yggdrasil`.

Framework/hosting:

- Vite + React;
- Vercel;
- build command: `npm run build`;
- output: `dist`.

Domains:

- target production: `https://mentalica.vercel.app`;
- current/legacy until migration is verified: `https://reiki-yggdrasil.vercel.app`;
- owner QA/test concept: `main` → `https://2mentalica.vercel.app` — needs verification in Vercel;
- client live concept: `production` branch.

Normal feature work should target `main`, not `production`.

### 2.2 Route architecture

Current routing is manual in `src/main.jsx`, through `RootRouter()` and pathname checks.

Existing important routes:

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

For `/feed`, implementation should:

- add `FeedPage.jsx` or equivalent;
- import it in `src/main.jsx`;
- add an `if (path === "/feed")` branch in `RootRouter()`;
- add a matching Vercel rewrite in `vercel.json`;
- preserve all existing routes.

### 2.3 Current Supabase client architecture

The app does not use the Supabase JS SDK in these modules. It uses direct `fetch` calls against Supabase REST/Auth/Storage.

Key client files:

```text
src/lib/supabaseClient.js
src/lib/profileMaterialsClient.js
src/lib/profileServicesClient.js
src/lib/profileMediaClient.js
src/lib/powerPlaceClient.js
src/lib/profileBootstrapClient.js
src/lib/profileLiteClient.js
```

Therefore the feed should also use a small dedicated REST client helper, for example:

```text
src/lib/profileActivityFeedClient.js
```

Do not introduce a second Supabase client pattern unless the project intentionally migrates all clients later.

### 2.4 Existing tables already relevant to feed

Current migrations already define several feed-related entities.

Existing profile table:

```text
profile_cabinet_profiles
```

Important fields:

```text
id
user_id
display_name
bio
city
country
telegram
website
avatar_url
status: draft | pending | approved | rejected
```

Existing material/publication table:

```text
profile_cabinet_publications
```

Important current fields:

```text
id
profile_id
type: practice | mandala | artifact
title
description
image_url
status: draft | pending | approved | rejected
step_id
step_title
setting_title
setting_index
created_at
updated_at
```

Existing services table:

```text
profile_cabinet_services
```

Important current fields:

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
status: draft | published | archived
created_at
updated_at
```

Existing Power Place compositions table:

```text
profile_cabinet_power_place_compositions
```

Important current fields:

```text
id
profile_id
title
constructor_type
geometry
cover_ref jsonb
object_refs jsonb
central_photo_id
tradition_id
tradition_title
created_at
updated_at
```

Existing private media tables:

```text
profile_cabinet_client_goal_photos
profile_cabinet_tradition_assets
```

These are owner/admin-managed and should not be exposed publicly by default.

### 2.5 Existing public/private policies

Current `profile_cabinet_publications` already allows public read of `status = 'approved'` only when the profile is also approved.

Current `profile_cabinet_services` already allows public read of `status = 'published'` only when the profile is approved.

Current `profile_cabinet_client_goal_photos`, `profile_cabinet_tradition_assets`, and `profile_cabinet_power_place_compositions` are owner/admin-managed, not public.

Therefore the feed should not directly query private media/composition tables for anonymous users.

### 2.6 Current media boundary

Current media bucket:

```text
profile-cabinet-media
```

Current frontend behavior:

- files upload through authenticated session;
- frontend stores durable refs like `storage://profile-cabinet-media/...` or bucket/path columns;
- private signed URLs are created only for display;
- local `data:image` previews are filtered from saved Power Place payloads;
- public pages must not expose private storage refs or temporary signed URLs.

This is the most important feed privacy boundary.

## 3. Core product idea

The feed should show **public activity events**, not raw private cabinet actions.

Examples of public feed items:

```text
Мастер Андрей опубликовал новую мандалу
Мастер София добавила публичный фотоальбом “Алтарь Рун”
Мастер Михаил обновил услугу “Мандала места силы”
Опубликована новая практика по ДАО
Администрация опубликовала новость курса
```

Examples of private events that should not appear publicly by default:

```text
Пользователь загрузил фото клиента
Пользователь сохранил черновик мандалы
Пользователь обновил object_refs композиции
Пользователь получил signed URL
Пользователь добавил отчёт или личные заметки
```

The implementation should separate three layers:

1. **Private source item** — current private row, for example Power Place composition or uploaded photo.
2. **Public object** — approved material/service/public album/master update.
3. **Feed event** — public activity record that announces the object in `/feed`.

## 4. Recommended technical strategy

Do not replace current data model. Extend it.

### 4.1 Use existing `profile_cabinet_publications`

For existing material posts, continue using:

```text
profile_cabinet_publications
```

Current supported types:

```text
practice
mandala
artifact
```

Recommended extension later:

```text
master_update
photo_album
power_place
admin_post
```

But MVP can avoid expanding this table immediately if activity events can point to existing publication rows.

### 4.2 Use existing `profile_cabinet_services`

Services already have their own table and public status:

```text
status = published
```

A feed event should be created when a service becomes published or gets a meaningful public update.

### 4.3 Do not make `profile_cabinet_power_place_compositions` public

Saved Power Place compositions contain private layout/data refs:

```text
cover_ref
object_refs
central_photo_id
resource comparison comments
report data in object_refs
private storage refs
```

Do not expose this table to anon.

Instead, add a **public projection** when user chooses to publish:

Option A, lower risk:

- create a `profile_cabinet_publications` row with type `mandala` or future `power_place`;
- copy only safe title/description/public-safe cover/fallback data;
- store source reference fields via migration only if needed.

Option B, clearer long-term:

- add `source_type` and `source_id` to `profile_cabinet_publications`;
- store `source_type = 'power_place_composition'` and `source_id = composition.id`;
- still do not expose source object data publicly.

Recommended MVP: Option A or minimal source fields, but no public query to compositions table.

### 4.4 Add a dedicated activity table

Add a new table:

```text
profile_cabinet_activity_events
```

This table should power `/feed`.

Why this is needed:

- one feed can include materials, services, photo albums, master updates, admin announcements;
- event text can be normalized;
- filters are easier;
- feed can be public without exposing private source tables;
- updates can create new events without duplicating all object data.

## 5. Proposed activity event schema

Create a migration, for example:

```text
supabase/migrations/YYYYMMDD_profile_cabinet_activity_feed.sql
```

Possible table:

```sql
create table if not exists public.profile_cabinet_activity_events (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid null references public.profile_cabinet_profiles(id) on delete cascade,
  actor_user_id uuid null references auth.users(id) on delete set null,

  activity_type text not null,
  target_table text null,
  target_id uuid null,

  title text not null default '',
  body text not null default '',
  image_url text not null default '',
  image_bucket text null,
  image_path text null,

  category text not null default '',
  subcategory text not null default '',
  tags text[] not null default '{}',

  status text not null default 'draft',
  visibility text not null default 'private',
  is_featured boolean not null default false,

  event_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  check (activity_type in (
    'master_update',
    'mandala_published',
    'power_place_published',
    'photo_album_published',
    'service_created',
    'service_updated',
    'practice_published',
    'artifact_published',
    'admin_announcement',
    'featured_item'
  )),
  check (target_table in (
    'profile_cabinet_publications',
    'profile_cabinet_services',
    'profile_cabinet_photo_albums'
  ) or target_table is null),
  check (status in ('draft', 'pending', 'approved', 'rejected', 'archived')),
  check (visibility in ('private', 'profile_only', 'public_feed'))
);
```

Recommended indexes:

```sql
create index if not exists profile_cabinet_activity_events_feed_idx
  on public.profile_cabinet_activity_events (status, visibility, event_at desc);

create index if not exists profile_cabinet_activity_events_profile_idx
  on public.profile_cabinet_activity_events (profile_id, event_at desc);

create index if not exists profile_cabinet_activity_events_type_idx
  on public.profile_cabinet_activity_events (activity_type, event_at desc);

create index if not exists profile_cabinet_activity_events_category_idx
  on public.profile_cabinet_activity_events (category, event_at desc);
```

Status names should align with current material/profile moderation model:

```text
draft
pending
approved
rejected
archived
```

Use `approved`, not `published`, for activity events if following current `profile_cabinet_publications` conventions.

## 6. RLS rules for activity events

Public read:

```sql
status = 'approved'
visibility = 'public_feed'
profile is approved or profile_id is null for admin announcements
```

Owner management:

- authenticated owner can create/read/update own draft/pending/rejected events;
- owner cannot approve own events unless they are admin.

Admin management:

- admin can read/update all events;
- admin can approve/reject/archive.

Important:

Do not loosen RLS on private media/composition tables to make the feed work.

## 7. Public image strategy

Current private Storage refs cannot be used directly in public feed cards.

### 7.1 MVP image behavior

MVP should support three safe image cases:

1. `image_url` is already a public HTTPS URL → show it.
2. image is private or storage ref → do not show it to public; show designed fallback.
3. service/material has no image → show designed fallback by type/category.

### 7.2 Later public media projection

Later, add a safe public cover workflow:

```text
private upload
↓
user chooses public cover
↓
system creates public-safe copy or stores approved public URL
↓
feed uses only public-safe copy/URL
```

Do not store temporary signed URLs in public activity records.

## 8. Feed filters

### 8.1 Main tabs

MVP top tabs:

```text
Все
Новости
Мандалы
Фото
Услуги
Практики
```

Mapping:

```text
Все → no activity_type filter
Новости → master_update, admin_announcement, featured_item
Мандалы → mandala_published, power_place_published, artifact_published
Фото → photo_album_published
Услуги → service_created, service_updated
Практики → practice_published
```

### 8.2 Advanced filters

Later filter drawer:

```text
Тип события
Категория
Мастер
Период
Только избранное — future
Мои подписки — future
```

URL query examples:

```text
/feed?tab=mandalas
/feed?type=service_created
/feed?category=dao
/feed?profile=<profile_id>
```

### 8.3 Categories

Initial category values can be plain text:

```text
reiki
runes
dao
sephirot
egyptian_mysteries
greek_mysteries
tarot
alchemy
tantra
business
love
protection
health
money
education
```

UI labels in Russian:

```text
Рейки
Руны
ДАО
Сефирот
Египетские мистерии
Греческие мистерии
Таро
Алхимия
Тантра
Бизнес
Любовь
Защита
Здоровье
Деньги
Обучение
```

## 9. Feed page UX

Route:

```text
/feed
```

Page title:

```text
Лента сообщества
```

Subtitle:

```text
Новые мандалы, услуги, практики и новости мастеров Reiki Yggdrasil.
```

Topbar buttons:

```text
← На главную
Каталог мастеров
Мой кабинет
```

States:

```text
Загружаем ленту...
Пока нет публикаций в этой категории.
Не удалось загрузить ленту. Попробуйте обновить страницу.
```

Desktop:

- 2–3 column grid for visual cards;
- optional compact sidebar later;
- do not affect existing public home layout.

Mobile:

- one-column cards;
- horizontal scroll filter chips or wrapped chips;
- no horizontal overflow;
- large tap targets but not oversized buttons.

## 10. Feed card types

### 10.1 Master update card

For `master_update`.

Fields:

- author name/avatar if profile exists;
- label: `Новость мастера`;
- title;
- body preview;
- optional public-safe image;
- category/tags;
- event date;
- CTA: `К мастеру`.

### 10.2 Mandala/material card

For `mandala_published`, `artifact_published`, `practice_published` when target is `profile_cabinet_publications`.

Fields:

- image/fallback;
- material type label;
- title;
- author;
- description;
- step/setting if present;
- category/tags;
- CTA: `Открыть`, `К мастеру`.

### 10.3 Power Place card

For `power_place_published`.

Fields:

- public-safe cover or fallback;
- label: `Место силы`;
- title;
- author;
- public description;
- category/tags;
- CTA: `Открыть`, `К мастеру`.

Do not render raw `object_refs`, report content, private cover refs, or signed URLs.

### 10.4 Photo album card

For `photo_album_published`.

MVP can be placeholder-only if photo album model does not exist yet.

Important:

- do not publish raw client/goal photo uploads;
- do not expose `profile_cabinet_client_goal_photos` publicly;
- photo albums should be a separate public-safe model in Phase 2.

### 10.5 Service card

For `service_created` / `service_updated` target `profile_cabinet_services`.

Fields:

- service title;
- author/master;
- description;
- price if present;
- public-safe image or fallback;
- CTA: `Подробнее`, `К мастеру`.

### 10.6 Admin announcement card

For `admin_announcement` with `profile_id = null` or admin profile if later added.

Fields:

- label: `Объявление`;
- title;
- body preview;
- date;
- CTA optional.

## 11. Cabinet integration

### 11.1 Materials module

Current materials already use:

```text
createOwnMaterial
listOwnMaterials
profile_cabinet_publications
```

Material statuses already exist:

```text
draft
pending
approved
rejected
```

Feed integration:

- when a material is approved by admin, optionally create/approve a matching activity event;
- or create a pending event when user submits material to moderation.

### 11.2 Services module

Current service statuses:

```text
draft
published
archived
```

Feed integration:

- when service status becomes `published`, create event `service_created` or `service_updated`;
- public feed should query event, not directly mix service list with materials unless using a view.

### 11.3 Power Place / saved mandalas

Current saved compositions are private.

Add later action in saved composition card:

```text
Опубликовать в ленту
```

This should open a public projection form:

```text
public title
public description
category
tags
cover behavior: fallback or public-safe cover only
submit for moderation
```

It should create:

- a public material/publication projection, or
- an activity event with target to a public projection row.

It should not make the original composition public.

### 11.4 Uploaded photos

Current photo categories:

- client/goal photos;
- tradition assets;
- material uploads;
- underlays;
- power-place slot uploads.

Do not publish any uploaded photo automatically.

Later add:

```text
Публичные альбомы
```

An album should explicitly contain public-safe selected images.

## 12. Admin moderation integration

Current admin page only moderates profiles through:

```text
listPendingProfiles
updateProfileStatus
```

Additive extension:

- add `listPendingActivityEvents` helper;
- add `updateActivityEventStatus` helper;
- add a second section in `AdminPage.jsx`:

```text
Публикации и события на модерации
```

Do not redesign the full admin page.

Admin should see:

- event type;
- title;
- author profile;
- target table/type;
- description/body preview;
- category/tags;
- created date;
- buttons:
  - `Одобрить`
  - `Отклонить`
  - `В архив` later.

## 13. Feed client helper

Suggested file:

```text
src/lib/profileActivityFeedClient.js
```

Suggested exports:

```js
export const ACTIVITY_FEED_TABS = [...];
export function activityTypeLabel(type) { ... }
export function activityTabToTypes(tab) { ... }
export async function listPublicActivityEvents({ tab, type, category, profileId, limit } = {}) { ... }
export async function listOwnActivityEvents(profileId, session) { ... }
export async function createOwnActivityEvent(event, session) { ... }
export async function listPendingActivityEvents(session) { ... }
export async function updateActivityEventStatus(eventId, status, session) { ... }
```

Keep request style consistent with current clients:

- direct `fetch`;
- `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`;
- anon token for public request;
- session token for owner/admin request;
- no env values in output.

## 14. Possible Supabase view for feed

Because feed cards need author display name/avatar and target data, a read view may simplify frontend.

Possible later view:

```text
profile_cabinet_activity_feed_view
```

It can join:

```text
profile_cabinet_activity_events
profile_cabinet_profiles
profile_cabinet_publications
profile_cabinet_services
```

Public view must expose only public-safe fields:

```text
event_id
activity_type
event_title
event_body
event_at
category
subcategory
tags
is_featured
profile_id
display_name
avatar_url
target_table
target_id
target_title
target_description
target_type
public_image_url
```

Do not include:

```text
private storage refs
signed URLs
object_refs
cover_ref raw json
private reports
client photo paths
user_id
admin email
```

MVP can query `profile_cabinet_activity_events` directly and fetch minimal author fields, but a view is cleaner after schema stabilizes.

## 15. Implementation phases

### Phase 1 — Public activity feed skeleton

Goal: create `/feed` and public event infrastructure without touching private media behavior.

Tasks:

1. Add migration for `profile_cabinet_activity_events`.
2. Add RLS for public approved events and owner/admin management.
3. Add `profileActivityFeedClient.js`.
4. Add `FeedPage.jsx`.
5. Add `/feed` branch in `src/main.jsx`.
6. Add `/feed` rewrite in `vercel.json`.
7. Add filter chips:
   - `Все`
   - `Новости`
   - `Мандалы`
   - `Фото`
   - `Услуги`
   - `Практики`
8. Add fallback cards, loading, empty, error states.
9. Add tests for client filtering/status mapping if existing test style allows.

No automatic creation of feed events yet unless very low risk.

### Phase 2 — Admin moderation for feed events

Tasks:

1. Extend `AdminPage.jsx` with pending activity events section.
2. Add admin helper functions in `profileActivityFeedClient.js`.
3. Keep existing profile moderation intact.
4. Do not expose env values or real admin email.

### Phase 3 — Materials/services to feed

Tasks:

1. When material is submitted/approved, create corresponding event.
2. When service becomes `published`, create `service_created` or `service_updated` event.
3. Ensure duplicate events are controlled.
4. Add safe reports in admin.

### Phase 4 — Power Place public projection

Tasks:

1. Add `Опубликовать в ленту` for saved compositions.
2. Create a public projection row with safe fields only.
3. Create pending activity event.
4. Never expose private composition `object_refs` or private signed URLs.

### Phase 5 — Public photo albums

Tasks:

1. Create `profile_cabinet_photo_albums` and `profile_cabinet_photo_album_items` or similar.
2. Allow user to select public-safe photos.
3. Add album moderation/publication.
4. Add `Фото` feed cards.

## 16. Key implementation risks

Main risks:

- leaking private Storage refs or signed URLs;
- exposing `object_refs` from Power Place compositions;
- exposing client/goal photos publicly;
- breaking current Profile Lite save/load flow;
- breaking manual router in `src/main.jsx`;
- forgetting Vercel rewrite for `/feed`;
- creating a parallel table that duplicates existing `profile_cabinet_publications` unnecessarily;
- mixing `published` and `approved` status names incorrectly;
- weakening RLS to make public feed load.

Mitigation:

- public feed uses only `profile_cabinet_activity_events` with approved/public visibility;
- public projection objects are separate from private source objects;
- image fallback is allowed and preferred when image safety is unclear;
- no broad RLS loosening;
- additive routing only;
- keep existing `/profile/mandalas`, services, masters, admin flows intact.

## 17. Suggested Codex task prompt

```text
Repo: andylitvinov-design/reiki-yggdrasil
Target branch: codex/community-activity-feed-code-aligned-mvp

Live/test context:
- normal feature work targets main, not production;
- expected owner QA/test site: https://2mentalica.vercel.app — needs verification;
- target production/client live: https://mentalica.vercel.app;
- current/legacy live: https://reiki-yggdrasil.vercel.app.

Task:
Implement Phase 1 of the code-aligned Community Activity Feed MVP based on docs/product/COMMUNITY_FEED_CONCEPT.md.

Before changing code, read:
- AGENTS.md
- README.md
- STATE.md
- LOG.md
- docs/release-workflow.md
- docs/supabase/REIKI_SUPABASE_CONTRACT.md
- docs/product/COMMUNITY_FEED_CONCEPT.md
- package.json
- vercel.json
- src/main.jsx
- src/index.css
- src/profileCabinet.css
- src/lib/supabaseClient.js
- src/lib/profileMaterialsClient.js
- src/lib/profileServicesClient.js
- src/lib/profileMediaClient.js
- src/lib/powerPlaceClient.js
- src/pages/ProfileLitePage.jsx
- src/pages/MastersPage.jsx
- src/pages/AdminPage.jsx
- current Supabase migrations for profile/publications/services/power-place/media.

Current architecture facts:
- routing is manual in src/main.jsx RootRouter;
- Supabase clients use direct fetch/REST, not Supabase JS SDK;
- profile_cabinet_publications already exists for practice/mandala/artifact with draft/pending/approved/rejected;
- profile_cabinet_services already exists for services with draft/published/archived;
- profile_cabinet_power_place_compositions is private and must not be publicly exposed;
- profile-cabinet-media is private and signed URLs are display-only.

Rules:
- preserve /, /profile, /profile/mandalas, /profile/services, /masters, /profile/admin;
- preserve RU-default UI;
- preserve public home page;
- preserve desktop/mobile layouts;
- do not rewrite the app/router;
- do not introduce Supabase JS SDK just for this task;
- do not expose secrets/env values;
- do not expose private Storage refs, signed URLs, object_refs, client photos, private reports;
- do not loosen RLS broadly;
- keep saved compositions/photos private by default.

Minimum implementation:
1. Add migration for profile_cabinet_activity_events.
2. Add RLS:
   - anon/authenticated can read only status='approved' and visibility='public_feed' events;
   - owner can manage own draft/pending/rejected events;
   - admin can manage all events.
3. Add src/lib/profileActivityFeedClient.js using direct fetch style.
4. Add src/pages/FeedPage.jsx.
5. Add /feed route in src/main.jsx.
6. Add /feed rewrite in vercel.json.
7. Add public feed states:
   - loading;
   - empty;
   - error;
   - configured/unconfigured Supabase notice.
8. Add filter tabs:
   - Все
   - Новости
   - Мандалы
   - Фото
   - Услуги
   - Практики
9. Cards must use public-safe image_url only. If image is a storage ref or missing, show fallback.
10. Do not wire automatic event creation from private saves in Phase 1 unless it is obviously safe.

Checks:
- npm install
- npm run check
- npm run build
- npm run test:profile-lite
- npm run test:power-place
- npm run test:profile-media
- npm run test:profile-loading-recovery
- add/run new feed client test if created.

Manual QA:
- /
- /profile
- /profile/mandalas
- /profile/services
- /feed
- /masters
- /profile/admin
- mobile below 980px
- no horizontal overflow
- no console errors
- anonymous user sees only approved public events
- authenticated user cannot see other users' drafts/private uploads.

Report:
- files read
- files changed
- migration added
- checks run
- manual QA
- what was not verified
- risks
- whether STATE.md / LOG.md need updates
```

## 18. Open questions / needs verification

Before implementation, verify:

- exact latest `main` route state before adding `/feed`;
- whether live/test Supabase has all existing migrations applied;
- whether `profile_cabinet_is_admin()` exists live and works for activity events;
- whether `profile_cabinet_publications.image_url` can safely contain public URLs only in public feed;
- whether service images with `image_bucket/image_path` should be hidden/fallback in public feed unless public-safe copy exists;
- whether master updates should use `profile_cabinet_publications` with type extension or only `profile_cabinet_activity_events` standalone rows;
- whether public photo albums are Phase 2 or required for MVP;
- whether `/feed` should be visible from the public home navigation immediately or only through direct route first.
