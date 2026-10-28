# Community Activity Feed Concept — Reiki Yggdrasil / Mentalica

Last updated: 2026-06-05

## 1. Executive summary

Reiki Yggdrasil / Mentalica should evolve from a personal cabinet and learning site into a living community of masters and students.

The key product mechanism is a **filtered community activity feed** at `/feed`.

The feed should show public-safe community updates:

- master news posts;
- approved mandalas/materials;
- public projections of Power Place compositions;
- public-safe photo albums, not raw private uploads;
- services created or updated by masters;
- practices, rituals, course notes, and announcements;
- admin announcements and featured items.

The feed should not be a noisy Instagram clone. It should feel like a calm ritual/art/community newspaper where users can discover:

- who is active;
- what masters are creating;
- which mandalas and services are available;
- which practices or traditions are being explored;
- what is new in the school/community.

## 2. Current repo/code architecture constraints

This concept is based on actual repo analysis.

### 2.1 Repo / deployment boundary

Canonical repo:

```text
andylitvinov-design/reiki-yggdrasil
```

Framework/hosting:

```text
Vite + React
Vercel
npm run build
output: dist
```

Domains/workflow:

```text
main       → owner QA/test site, expected https://2mentalica.vercel.app — needs verification
production → client live site
release/*  → frozen release branches after owner QA
```

Public/live URLs:

```text
https://mentalica.vercel.app
https://reiki-yggdrasil.vercel.app — legacy/current until migration is verified
```

Normal feature work targets `main`, not `production`.

### 2.2 Routing

Routing is manual in `src/main.jsx` inside `RootRouter()`.

Current important routes:

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

- add `src/pages/FeedPage.jsx`;
- import it in `src/main.jsx`;
- add a branch before the fallback `<App />`:

```jsx
if (path === "/feed") {
  return <FeedPage onNavigateHome={() => navigateTo("/")} onNavigateMasters={() => navigateTo("/masters")} onNavigateProfile={() => navigateTo("/profile")} />;
}
```

- add `/feed` to `vercel.json` rewrites;
- keep all existing rewrites unchanged.

### 2.3 Supabase client pattern

The current frontend uses direct `fetch` REST/Auth/Storage calls, not Supabase JS SDK, in files such as:

```text
src/lib/supabaseClient.js
src/lib/profileMaterialsClient.js
src/lib/profileServicesClient.js
src/lib/profileMediaClient.js
src/lib/powerPlaceClient.js
```

Feed implementation should follow the same style and add:

```text
src/lib/profileActivityFeedClient.js
```

Do not introduce Supabase JS SDK just for this task.

### 2.4 Existing tables relevant to feed

Current relevant tables:

```text
profile_cabinet_profiles
profile_cabinet_publications
profile_cabinet_services
profile_cabinet_service_orders
profile_cabinet_power_place_compositions
profile_cabinet_client_goal_photos
profile_cabinet_tradition_assets
profile_cabinet_admins
```

Existing `profile_cabinet_publications` already represents materials:

```text
type: practice | mandala | artifact
status: draft | pending | approved | rejected
```

Existing `profile_cabinet_services` already represents services:

```text
status: draft | published | archived
```

Existing `profile_cabinet_power_place_compositions` is private source data and must not be public.

Existing `profile_cabinet_client_goal_photos` and `profile_cabinet_tradition_assets` are private/owner/admin media rows and must not be public by default.

### 2.5 Media boundary

Current known bucket:

```text
profile-cabinet-media
```

Rules:

- bucket is private;
- frontend stores durable refs such as `storage://profile-cabinet-media/...` internally;
- signed URLs are temporary display-only URLs;
- public feed must not expose private storage refs, paths, signed URLs, raw `object_refs`, private reports, client photos, or private notes.

## 3. Product definition

The feed is a **public activity stream**, not a raw log of all private actions.

### 3.1 Good feed events

Examples:

```text
Мастер опубликовал новую мандалу
Мастер добавил новость
Мастер обновил услугу
Появилась новая практика
Опубликован публичный фотоальбом
Администрация добавила объявление
```

### 3.2 Bad feed events

These should not appear publicly by default:

```text
Пользователь загрузил фото клиента
Пользователь сохранил черновик композиции
Пользователь обновил object_refs
Пользователь получил signed URL
Пользователь добавил приватный отчёт
Пользователь создал черновик услуги
```

### 3.3 Three-layer model

The feed should separate:

1. **Private source item** — original private row, for example saved Power Place composition or uploaded photo.
2. **Public object** — curated, public-safe representation: material, service, public album, master post.
3. **Activity event** — feed record announcing the public object.

This avoids exposing private source data and keeps feed filtering simple.

## 4. Main user scenarios

### 4.1 Visitor reads the community feed

Scenario:

```text
Visitor opens /feed
↓
Sees feed header and tabs
↓
Selects “Мандалы” or “Услуги”
↓
Sees only approved public events
↓
Opens item or goes to master profile/catalog
```

Expected result:

- no login required;
- no private records exposed;
- empty state if there are no approved events;
- clear CTA to `/masters` and `/profile`.

### 4.2 Master publishes a material/mandala

Current code already supports material creation through `profile_cabinet_publications`.

Desired flow:

```text
Master creates material in cabinet
↓
Saves draft or sends to moderation
↓
Admin approves material
↓
System creates or approves feed event
↓
Material appears in /feed under Мандалы/Практики/Все
```

MVP can start with manual event creation/moderation instead of automatic event generation.

### 4.3 Master publishes a service

Current code already supports services in `profile_cabinet_services`.

Desired flow:

```text
Master creates/updates service
↓
Service status becomes published
↓
System creates feed event service_created or service_updated
↓
Event appears in /feed under Услуги
```

MVP can show service-related events only if explicitly created.

### 4.4 Master publishes Power Place composition

Power Place composition is private source data.

Desired flow:

```text
Master opens saved composition
↓
Clicks “Опубликовать в ленту”
↓
Frontend opens public projection form
↓
Master writes public title/description/category/tags
↓
System creates safe public projection/event
↓
Admin approves
↓
Feed shows a fallback or public-safe cover
```

Important:

The original `profile_cabinet_power_place_compositions` row remains private.

### 4.5 Master posts a news update

Desired future flow:

```text
Master opens “Мои новости”
↓
Writes title/body/category
↓
Submits to moderation
↓
Admin approves
↓
Event appears under Новости
```

This can be standalone `profile_cabinet_activity_events` without a target object.

### 4.6 Public photo album

Desired future flow:

```text
Master uploads private photos
↓
Selects specific photos for a public album
↓
Creates album title/description/category
↓
System stores only public-safe album representation
↓
Admin approves
↓
Feed shows photo album card
```

MVP should not publish raw uploaded photos.

## 5. Feed information architecture

### 5.1 Top navigation

Public page `/feed` should have:

```text
← На главную
Лента сообщества
Каталог мастеров
Мой кабинет
```

### 5.2 Main tabs

MVP tabs:

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
Все      → no tab filter
Новости  → master_update, admin_announcement, featured_item
Мандалы  → mandala_published, power_place_published, artifact_published
Фото     → photo_album_published
Услуги   → service_created, service_updated
Практики → practice_published
```

### 5.3 Advanced filters later

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
/feed?tab=services
/feed?type=service_created
/feed?category=dao
/feed?profile=<profile_id>
```

### 5.4 Categories

Suggested machine values:

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

Russian labels:

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

## 6. Feed card UX

### 6.1 Common card fields

Every feed card should have:

```text
event label
title
short body/description
author/master name if available
date
category/tags
image/fallback
CTA buttons
```

CTA examples:

```text
Открыть
К мастеру
Подробнее
Смотреть
```

### 6.2 Master update card

For:

```text
master_update
```

UI:

```text
[avatar/fallback]
Новость мастера
Title
Body preview
Master name
Date
Button: К мастеру
```

### 6.3 Mandala/material card

For:

```text
mandala_published
artifact_published
practice_published
```

Target can be `profile_cabinet_publications`.

UI:

```text
[image/fallback]
Мандала / Артефакт / Практика
Title
Description
Step/setting if present
Master name
Button: Открыть / К мастеру
```

### 6.4 Power Place card

For:

```text
power_place_published
```

UI:

```text
[fallback or public-safe cover]
Место силы
Title
Public description
Category/tags
Master name
Button: К мастеру
```

Forbidden in public card:

```text
object_refs
cover_ref raw json
central_photo_id private display
resource comments if private
report body
signed_url
storage://...
```

### 6.5 Service card

For:

```text
service_created
service_updated
```

Target can be `profile_cabinet_services`.

UI:

```text
[image/fallback]
Услуга
Title
Description
Price if public-safe
Master name
Button: Подробнее / К мастеру
```

### 6.6 Photo album card

For:

```text
photo_album_published
```

UI:

```text
[album cover/fallback]
Фотоальбом
Title
Description
Photo count later
Master name
Button: Смотреть
```

MVP may show only placeholder/fallback until public albums are implemented.

### 6.7 Admin announcement card

For:

```text
admin_announcement
featured_item
```

UI:

```text
Объявление
Title
Body preview
Date
Optional CTA
```

## 7. Data model: add activity events, do not replace current tables

### 7.1 Why add an events table

Current tables store different business objects:

- profiles;
- materials/publications;
- services;
- private compositions;
- private media.

The feed needs one unified stream with one filtering model. Therefore add:

```text
profile_cabinet_activity_events
```

### 7.2 Proposed table

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

### 7.3 Indexes

```sql
create index if not exists profile_cabinet_activity_events_feed_idx
  on public.profile_cabinet_activity_events (status, visibility, event_at desc);

create index if not exists profile_cabinet_activity_events_profile_idx
  on public.profile_cabinet_activity_events (profile_id, event_at desc);

create index if not exists profile_cabinet_activity_events_type_idx
  on public.profile_cabinet_activity_events (activity_type, event_at desc);

create index if not exists profile_cabinet_activity_events_category_idx
  on public.profile_cabinet_activity_events (category, event_at desc);

create index if not exists profile_cabinet_activity_events_target_idx
  on public.profile_cabinet_activity_events (target_table, target_id);
```

### 7.4 Trigger

Use existing `profile_cabinet_touch_updated_at()` if present:

```sql
drop trigger if exists profile_cabinet_activity_events_updated_at on public.profile_cabinet_activity_events;
create trigger profile_cabinet_activity_events_updated_at
before update on public.profile_cabinet_activity_events
for each row execute function public.profile_cabinet_touch_updated_at();
```

## 8. RLS matrix

### 8.1 Public read

Anon/authenticated can read only:

```text
status = approved
visibility = public_feed
profile approved OR profile_id is null
```

Admin announcements can use `profile_id = null`.

### 8.2 Owner read/write

Owner can:

- create own draft/pending events;
- read own draft/pending/rejected/approved events;
- update own draft/pending/rejected events;
- archive own event if allowed later.

Owner cannot:

- approve own event unless admin;
- create public event for another profile;
- create event pointing to another user's target object.

### 8.3 Admin

Admin can:

- read all events;
- approve/reject/archive;
- feature/unfeature;
- create admin announcements.

### 8.4 Forbidden RLS shortcut

Do not make these tables public for feed convenience:

```text
profile_cabinet_power_place_compositions
profile_cabinet_client_goal_photos
profile_cabinet_tradition_assets
storage.objects for profile-cabinet-media
```

## 9. Event creation and duplication rules

### 9.1 Manual first, automatic later

MVP should begin with manual or explicit event creation. Automatic event creation can be Phase 3.

Reason: automatic creation from every save/update can spam the feed.

### 9.2 Deduplication

When automatic creation is added, prevent duplicates.

Recommended rule:

```text
one active approved/pending event per target_table + target_id + activity_type
```

If service is updated many times, either:

- update the existing event body/date; or
- create a new event only when user clicks “Опубликовать обновление в ленту”.

### 9.3 Event timing

Use:

```text
event_at
```

for display ordering. This allows admin approval date or original publication date depending on product decision.

MVP recommendation:

- when admin approves: set `event_at = now()`;
- when just saving draft: keep original created date.

## 10. Public image strategy

### 10.1 MVP rule

Show image only when it is public-safe.

Safe:

```text
https://...
```

Unsafe:

```text
storage://profile-cabinet-media/...
signed URL from Supabase
private bucket path
local data:image
raw object_refs image refs
```

### 10.2 Fallback design

If image is unsafe or missing, show a beautiful fallback based on type:

```text
Мандала → golden mandala glyph / radial pattern
Место силы → circle/field symbol
Услуга → service card symbol
Фото → album placeholder
Практика → text/practice symbol
Новость → master/news symbol
```

### 10.3 Later public cover workflow

Future workflow:

```text
private upload
↓
user selects public cover
↓
system creates public-safe copy or stores public-safe URL
↓
admin approves
↓
feed uses public cover only
```

## 11. Frontend client design

Suggested file:

```text
src/lib/profileActivityFeedClient.js
```

### 11.1 Constants

```js
export const ACTIVITY_TYPES = [...];
export const ACTIVITY_STATUSES = ["draft", "pending", "approved", "rejected", "archived"];
export const ACTIVITY_VISIBILITIES = ["private", "profile_only", "public_feed"];
export const ACTIVITY_FEED_TABS = [
  { id: "all", label: "Все", types: [] },
  { id: "news", label: "Новости", types: ["master_update", "admin_announcement", "featured_item"] },
  { id: "mandalas", label: "Мандалы", types: ["mandala_published", "power_place_published", "artifact_published"] },
  { id: "photos", label: "Фото", types: ["photo_album_published"] },
  { id: "services", label: "Услуги", types: ["service_created", "service_updated"] },
  { id: "practices", label: "Практики", types: ["practice_published"] }
];
```

### 11.2 Public list helper

```js
export async function listPublicActivityEvents({ tab = "all", type = "", category = "", profileId = "", limit = 30 } = {})
```

Query must include:

```text
status=eq.approved
visibility=eq.public_feed
order=event_at.desc
limit=safeLimit
```

Optional filters:

```text
activity_type=in.(...)
category=eq.<category>
profile_id=eq.<profileId>
```

### 11.3 Owner/admin helpers

```js
export async function listOwnActivityEvents(profileId, session)
export async function createOwnActivityEvent(event, session)
export async function listPendingActivityEvents(session)
export async function updateActivityEventStatus(eventId, status, session)
```

### 11.4 Normalization

Normalize rows to safe frontend shape:

```js
{
  id,
  profileId,
  activityType,
  title,
  body,
  imageUrl,
  category,
  tags,
  status,
  visibility,
  isFeatured,
  eventAt,
  targetTable,
  targetId
}
```

Do not expose unsafe image refs in card rendering.

## 12. FeedPage component design

Suggested file:

```text
src/pages/FeedPage.jsx
```

### 12.1 State

```js
const [activeTab, setActiveTab] = useState("all");
const [events, setEvents] = useState([]);
const [loading, setLoading] = useState(Boolean(supabaseEnv.isConfigured));
const [error, setError] = useState("");
```

### 12.2 Behavior

- load events on mount and when tab changes;
- if Supabase not configured, show notice;
- if no rows, show empty state;
- if error, show safe error;
- do not require login.

### 12.3 CSS classes

Suggested classes:

```text
feedShell
feedTopbar
feedHero
feedTabs
feedTab
feedGrid
feedCard
feedCardMedia
feedCardBody
feedMeta
feedFallback
feedBadge
```

CSS can be added to `src/profileCabinet.css` or `src/index.css`, but keep scope prefixed with `feed` to avoid affecting existing cabinet/Profile Lite layouts.

## 13. Admin integration

Current `AdminPage.jsx` moderates only profiles.

Additive extension:

- keep existing profile moderation intact;
- add second section after profile moderation:

```text
Публикации и события на модерации
```

Suggested helpers:

```js
listPendingActivityEvents(session)
updateActivityEventStatus(eventId, status, session)
```

Admin card should show:

```text
activity type label
title
body preview
author profile if present
category/tags
target_table/target_id for debugging but not too prominent
buttons: Одобрить / Отклонить
```

Do not expose env values or real admin email.

## 14. Integration with existing materials/services

### 14.1 Existing materials

`profile_cabinet_publications` currently supports:

```text
practice
mandala
artifact
```

Event mapping:

```text
publication.type = mandala  → mandala_published
publication.type = artifact → artifact_published
publication.type = practice → practice_published
```

Possible implementation options:

**Option A — manual events MVP**

Admin/user creates event separately. Lowest risk.

**Option B — event on approval**

When admin approves material, create matching activity event. Requires duplicate protection.

### 14.2 Existing services

`profile_cabinet_services.status = published` is already public-readable through RLS.

Event mapping:

```text
first publish → service_created
later explicit feed update → service_updated
```

Avoid creating a new event on every small edit automatically.

### 14.3 Power Place compositions

Saved compositions are private. Do not expose directly.

Recommended projection fields for public event:

```text
source composition id — internal only if needed
title
description
category
tags
fallback type
public-safe image only if available
```

## 15. Public photo albums phase

Do not solve public albums by making current media tables public.

Future tables:

```text
profile_cabinet_photo_albums
profile_cabinet_photo_album_items
```

Album table fields:

```text
id
profile_id
title
description
cover_image_url public-safe only
category
tags
status: draft | pending | approved | rejected | archived
visibility: private | profile_only | public_feed
created_at
updated_at
```

Items should reference public-safe images only or a safe public projection, not raw private client photo paths.

## 16. MVP / Phase boundaries

### Phase 1 — Feed infrastructure and page

Deliver:

- migration for `profile_cabinet_activity_events`;
- RLS;
- `profileActivityFeedClient.js`;
- `FeedPage.jsx`;
- `/feed` route;
- `/feed` Vercel rewrite;
- public filters;
- fallback cards;
- no automatic publication from private saves.

### Phase 2 — Admin moderation for feed events

Deliver:

- admin pending events list;
- approve/reject event actions;
- no redesign of full admin page.

### Phase 3 — Materials/services event creation

Deliver:

- create event when material is approved or submitted;
- create event when service is explicitly published to feed;
- duplicate prevention.

### Phase 4 — Power Place public projection

Deliver:

- `Опубликовать в ленту` for saved composition;
- public projection form;
- pending event;
- no raw `object_refs` exposure.

### Phase 5 — Public photo albums

Deliver:

- album model;
- album UI;
- photo feed cards;
- public-safe covers.

### Phase 6 — Social layer later

Only after stable public/private boundary:

- favorites;
- likes/reactions;
- follows;
- comments;
- recommendations.

## 17. Testing and QA strategy

### 17.1 Automated checks

Run:

```bash
npm install
npm run check
npm run build
npm run test:profile-lite
npm run test:power-place
npm run test:profile-media
npm run test:profile-loading-recovery
```

If feed client tests are added:

```bash
npm run test:feed
```

or include in existing test runner according to repo scripts.

### 17.2 Manual QA routes

```text
/
/profile
/profile/mandalas
/profile/services
/feed
/masters
/profile/admin
```

### 17.3 Manual QA cases

```text
/feed loads without login
/feed shows Supabase notice if env missing
/feed shows empty state if no approved events
/feed filters by tab
/feed does not show draft/pending/rejected events to anon
/feed does not expose storage:// refs
/feed does not expose signed URLs
/feed does not query private Power Place/media tables as anon
/profile still loads
/profile/mandalas still saves/loads existing compositions
/profile/services still loads
/masters still loads approved profiles
/profile/admin still moderates profiles
mobile below 980px has no horizontal overflow
```

## 18. Key risks and mitigations

### 18.1 Risk: private media leak

Mitigation:

- feed cards show only public HTTPS image URLs;
- storage refs fall back to symbolic card;
- no signed URL persisted in event rows.

### 18.2 Risk: private Power Place data leak

Mitigation:

- feed never selects from `profile_cabinet_power_place_compositions` for public page;
- use public projection/event only;
- no `object_refs` in event rows.

### 18.3 Risk: feed spam

Mitigation:

- no automatic events in Phase 1;
- later explicit “Опубликовать в ленту” or admin approval;
- duplicate protection by `target_table + target_id + activity_type`.

### 18.4 Risk: status confusion

Current project uses:

```text
profiles/materials: approved
services: published
```

Mitigation:

- activity events use `approved` to align with moderation;
- service mapping converts `published` service into `approved` feed event.

### 18.5 Risk: route/rewrite missing

Mitigation:

- add both `src/main.jsx` route and `vercel.json` rewrite;
- verify `/feed` directly on test/live URL.

## 19. Suggested Codex task prompt

```text
Repo: andylitvinov-design/reiki-yggdrasil
Target branch: codex/community-activity-feed-phase-1

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
- relevant Supabase migrations for profiles/publications/services/power-place/media.

Current architecture facts:
- routing is manual in src/main.jsx RootRouter;
- Supabase clients use direct fetch/REST;
- profile_cabinet_publications already exists for practice/mandala/artifact with draft/pending/approved/rejected;
- profile_cabinet_services already exists for services with draft/published/archived;
- profile_cabinet_power_place_compositions is private and must not be publicly exposed;
- profile-cabinet-media is private and signed URLs are display-only.

Rules:
- preserve /, /profile, /profile/mandalas, /profile/services, /masters, /profile/admin;
- preserve RU-default UI;
- preserve public home page;
- preserve existing Profile Lite desktop/mobile layout;
- do not introduce Supabase JS SDK;
- do not expose env values;
- do not expose storage refs, signed URLs, object_refs, private photos, private reports;
- do not loosen RLS broadly;
- keep saved compositions/photos private by default.

Minimum implementation:
1. Add migration for profile_cabinet_activity_events.
2. Add RLS:
   - anon/authenticated can read only status='approved' and visibility='public_feed';
   - owner can manage own draft/pending/rejected events;
   - admin can manage all events.
3. Add src/lib/profileActivityFeedClient.js.
4. Add src/pages/FeedPage.jsx.
5. Add /feed route in src/main.jsx.
6. Add /feed rewrite in vercel.json.
7. Add filter tabs:
   - Все
   - Новости
   - Мандалы
   - Фото
   - Услуги
   - Практики
8. Add loading/empty/error/Supabase-not-configured states.
9. Cards must use only public-safe image_url. If missing/unsafe, show fallback.
10. Do not wire automatic event creation from private saves in Phase 1.

Checks:
- npm install
- npm run check
- npm run build
- npm run test:profile-lite
- npm run test:power-place
- npm run test:profile-media
- npm run test:profile-loading-recovery
- add/run feed client test if created.

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
- no storage:// refs or signed URLs visible in feed DOM/text.

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

## 20. Open questions / needs verification

Before implementation, verify:

- whether live/test Supabase has all existing migrations applied;
- whether `profile_cabinet_is_admin()` exists live and works for activity events;
- whether feed event target joins should be done in frontend or a public-safe SQL view;
- whether master updates should be standalone events or an extension of `profile_cabinet_publications`;
- whether public photo albums are Phase 2 or required immediately;
- whether `/feed` should be linked from the public home navigation immediately or stay direct-route first;
- whether service updates should create a new event or update an existing event;
- whether Power Place public projection should extend `profile_cabinet_publications` with `source_type/source_id`.
