# Master Cabinet Platform Structure — Services, Feed, Grimoire

Last updated: 2026-06-05  
Project: Reiki Yggdrasil / Mentalica  
Repo: `andylitvinov-design/reiki-yggdrasil`  
Status: technical product architecture / implementation blueprint  
Target branch for implementation work: `main` for normal feature work, never direct `production`

## 1. Purpose

This document coordinates several already-written product concepts into one technical architecture:

1. `docs/PROFILE_SERVICES_ROADMAP.md` — service/shop flow.
2. `docs/product/COMMUNITY_FEED_CONCEPT.md` — public community activity feed at `/feed`.
3. `docs/concepts/master-feed-grimoire.md` — personal master feed and Grimoire workspace.

The goal is to prevent Codex/agents from implementing these ideas as separate unrelated modules.

The product should evolve as one connected system:

```text
private master creation
↓
personal master feed / cabinet
↓
Grimoire review and classification
↓
service/shop object OR public-safe publication
↓
public profile / public feed
↓
client order / request / delivery
```

## 2. Existing source documents

### 2.1 Services / shop roadmap

Source:

```text
docs/PROFILE_SERVICES_ROADMAP.md
```

Core flow:

```text
saved mandala / template
↓
master service
↓
public service profile
↓
authenticated order
↓
master request queue
↓
result delivery
```

Important existing rule:

- stabilize `/profile` first;
- only then turn service/shop foundation into a working flow;
- do not add payment processing yet unless explicitly requested.

### 2.2 Community feed concept

Source:

```text
docs/product/COMMUNITY_FEED_CONCEPT.md
```

Core idea:

```text
/feed = public-safe community activity stream
```

Public feed can show:

- master news posts;
- approved mandalas/materials;
- public-safe Power Place projections;
- public-safe photo albums;
- services created or updated by masters;
- practices, rituals, course notes and announcements;
- admin announcements and featured items.

Important boundary:

```text
private source item ≠ public object ≠ activity event
```

The public feed must not expose:

- private media;
- `storage://` refs;
- signed URLs;
- raw `object_refs`;
- client photos;
- private reports;
- private Power Place composition data.

### 2.3 Personal master feed and Grimoire

Source:

```text
docs/concepts/master-feed-grimoire.md
```

Core idea:

```text
/profile = personal Facebook-like master workspace
```

Master can quickly create/upload:

- mandalas;
- settings/initiations;
- materials;
- photos;
- notes;
- Grimoire records;
- services;
- results of practices.

Then the master can classify and deepen these objects in the Grimoire.

## 3. One unified product model

### 3.1 Private layer: raw creation

This is where master creates or uploads source material.

Examples:

- saved Power Place composition;
- uploaded photo;
- uploaded article/PDF;
- private note;
- private client material;
- draft mandala;
- draft setting;
- draft service.

Default visibility:

```text
private
```

Private layer must never be directly published to public feed.

### 3.2 Personal feed layer: master cabinet timeline

This is the master’s own Facebook-like cabinet inside `/profile`.

Purpose:

- show what master created, saved, uploaded, edited or wants to publish;
- give quick actions;
- keep work alive and visible;
- reduce hidden/forgotten materials.

The personal feed can show private items because it is inside authenticated `/profile`.

Possible tabs/filters:

```text
Все
Мандалы
Фото
Материалы
Настройки
Гримуар
Услуги
Черновики
Неразобранное
```

### 3.3 Grimoire layer: review and classification

The Grimoire is the meaning/structure layer.

It answers:

```text
What is this object?
How should it be classified?
Where can it be used?
Can it become a service, course material, public publication, or stay private?
```

In Grimoire, master can add:

- title;
- category;
- tags;
- comment;
- symbolism;
- practice instructions;
- link to mandala;
- link to service;
- link to course;
- visibility/status.

### 3.4 Service/shop layer

A service is not just a post.

It is a sellable/orderable master object.

Service flow:

```text
mandala/template/material
↓
service draft
↓
service editor
↓
published service
↓
public service profile/link
↓
client order
↓
master request queue
↓
delivery/result
```

A service can be created from:

- a saved mandala;
- a Power Place composition;
- a Grimoire record;
- a material/template;
- a standalone service editor.

### 3.5 Public profile layer

The public master profile should show selected public-safe objects:

- published services;
- approved/public mandalas;
- selected materials;
- selected settings/practices;
- master info;
- later: public albums and testimonials.

Public profile should not show raw private uploads or private Grimoire notes.

### 3.6 Community feed layer

The community feed at `/feed` is not the same as the personal master feed.

Difference:

```text
/profile feed = private/authenticated working timeline
/feed = public-safe community newspaper
```

Public feed should show only approved/public-safe activity events.

## 4. Recommended naming

To avoid confusion, use these names consistently:

```text
Personal master feed  = private cabinet feed inside /profile
Community feed        = public /feed page
Grimoire              = review/classification workspace
Service shop          = /profile/services + public service pages/order flow
Activity event        = public-safe feed event row
Source item           = original private object
Public projection     = curated public-safe representation of a private source item
```

Avoid calling all of them simply “лента”. Always specify:

- личная лента мастера;
- публичная лента сообщества;
- события ленты;
- гримуарный разбор.

## 5. Current repo/code boundaries to verify first

Before implementation, Codex must inspect real repo files and report found/not found:

```text
AGENTS.md
README.md
STATE.md
LOG.md
docs/release-workflow.md
docs/deploy-fallback.md
docs/PROFILE_SERVICES_ROADMAP.md
docs/product/COMMUNITY_FEED_CONCEPT.md
docs/concepts/master-feed-grimoire.md
docs/product/MASTER_CABINET_PLATFORM_STRUCTURE.md
package.json
vercel.json
src/main.jsx
src/App.jsx
src/index.css
src/profileCabinet.css
src/profileMandalaWorkspace.css
src/lib/supabaseClient.js
src/lib/profileMaterialsClient.js
src/lib/profileServicesClient.js
src/lib/profileMediaClient.js
src/lib/powerPlaceClient.js
src/pages/ProfilePage.jsx
src/pages/ProfileLitePage.jsx
src/pages/FeedPage.jsx
src/pages/MastersPage.jsx
src/pages/AdminPage.jsx
src/pages/profile-lite/*
supabase/migrations/*
```

Do not start from assumptions. Read actual code first.

## 6. Data architecture direction

### 6.1 Existing real tables from current concepts

Relevant existing tables documented in `COMMUNITY_FEED_CONCEPT.md`:

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

Existing `profile_cabinet_publications` represents materials:

```text
type: practice | mandala | artifact
status: draft | pending | approved | rejected
```

Existing `profile_cabinet_services` represents services:

```text
status: draft | published | archived
```

### 6.2 Public feed events

Public/community feed should use:

```text
profile_cabinet_activity_events
```

This table is for public-safe events, not raw private source objects.

Activity event examples:

```text
master_update
mandala_published
power_place_published
photo_album_published
service_created
service_updated
practice_published
artifact_published
admin_announcement
featured_item
```

### 6.3 Personal feed items

Do not add `master_feed_items` immediately unless existing tables cannot support the personal feed.

Safer MVP options:

Option A — personal feed as UI aggregation:

```text
/profile personal feed reads from existing private/user-owned tables:
- saved mandalas/compositions
- media/materials
- services
- publications
```

Option B — add a dedicated personal feed table later:

```text
profile_cabinet_personal_feed_items
```

Only add this if there is a proven need for a separate timeline table.

Important:

`master_feed_items` mentioned in `docs/concepts/master-feed-grimoire.md` is conceptual only, not approved as a migration name.

### 6.4 Grimoire records

Grimoire can begin as metadata on existing objects, or later use a dedicated table.

Possible future table:

```text
profile_cabinet_grimoire_records
```

Potential fields:

```text
id
profile_id
source_type
source_id
title
comment
symbolism
practice_notes
category
tags
status
visibility
linked_service_id
linked_course_id
created_at
updated_at
```

Do not create this table until existing material/service/publication tables are inspected.

## 7. Technical frontend architecture

### 7.1 Target component map

Recommended additive components, after checking current file structure:

```text
src/pages/profile-lite/MasterCabinetPlatform.jsx
src/pages/profile-lite/MasterFeedComposer.jsx
src/pages/profile-lite/MasterFeedList.jsx
src/pages/profile-lite/MasterFeedCard.jsx
src/pages/profile-lite/MasterFeedFilters.jsx
src/pages/profile-lite/MasterQuickUploader.jsx
src/pages/profile-lite/MasterUnsortedPanel.jsx
src/pages/profile-lite/GrimoireWorkspace.jsx
src/pages/profile-lite/GrimoireEditorDrawer.jsx
src/pages/profile-lite/ServiceDraftBridge.jsx
```

If the repo already has a better component structure, use existing folders/naming. Do not duplicate similar components.

### 7.2 Minimal integration point

The safest first implementation should not replace the whole cabinet.

Preferred integration:

```text
/Profile or ProfileLite page
↓
existing authenticated cabinet layout
↓
insert master feed block into current three-column structure
```

The feature should be gated by local component state, not by new route first.

Possible UI placement:

```text
left column  → MasterFeedFilters
center       → MasterFeedComposer + MasterFeedList
right column → MasterQuickUploader + MasterUnsortedPanel
```

### 7.3 Personal feed view model

Personal feed cards should use a normalized frontend-only shape, regardless of source table.

Recommended normalized item:

```js
{
  id: string,
  sourceType: "composition" | "media" | "publication" | "service" | "grimoire" | "note",
  sourceTable: string,
  sourceId: string,
  itemType: "mandala" | "photo" | "material" | "setting" | "grimoire" | "service" | "note",
  title: string,
  body: string,
  comment: string,
  previewUrl: string,
  previewKind: "safe-url" | "signed-url" | "fallback" | "none",
  category: string,
  tags: string[],
  status: "draft" | "private" | "pending" | "approved" | "published" | "archived" | "uncategorized",
  visibility: "private" | "workshop" | "service" | "profile_only" | "public_feed",
  createdAt: string,
  updatedAt: string,
  actions: string[]
}
```

Important:

- This shape is for UI only.
- It must not force new DB schema in Phase 1.
- It allows a single feed UI to render saved mandalas, media, services, and publications.

### 7.4 Personal feed source adapters

Add or extend a client file only after reading existing clients.

Recommended new file if needed:

```text
src/lib/profilePersonalFeedClient.js
```

Suggested functions:

```js
export async function listPersonalFeedItems({ profileId, session, limit = 50 } = {})
export async function normalizeCompositionToFeedItem(row)
export async function normalizePublicationToFeedItem(row)
export async function normalizeServiceToFeedItem(row)
export async function normalizeMediaToFeedItem(row)
export function filterPersonalFeedItems(items, filter)
export function getPersonalFeedActions(item)
```

Implementation direction:

- call existing clients where possible;
- avoid duplicating low-level Supabase REST code if existing helpers already exist;
- do not query public feed table for personal feed MVP;
- keep all private data inside authenticated `/profile`.

### 7.5 Composer actions

The composer should not immediately create all object types if backend is not ready.

MVP behavior:

```text
+ Мандала        → navigate/open existing mandala creator/module
+ Фото/материал → open existing media/material uploader
+ Настройка     → create local draft placeholder or disabled with TODO if no table exists
+ Запись        → open Grimoire draft drawer if implemented; otherwise TODO
+ Услуга        → open existing service editor or service draft flow
```

Do not create fake persistent records unless there is a real table and client method.

### 7.6 Feed card actions

Actions should be computed by item type and current status.

Recommended mapping:

```text
composition/mandala:
- Открыть
- Редактировать
- В услуги
- В Гримуарий
- Опубликовать в ленту later

media/material:
- Открыть
- Категоризировать
- В Гримуарий
- Сделать публикацией later

publication:
- Редактировать
- Отправить на модерацию
- В Гримуарий
- Создать событие ленты later

service:
- Редактировать услугу
- Скопировать ссылку
- Опубликовать обновление в ленту later
- Архивировать

grimoire:
- Редактировать
- Создать услугу
- Создать публикацию
- Привязать к мандале
```

### 7.7 UI state model

Recommended React state for the personal feed shell:

```js
const [activeFilter, setActiveFilter] = useState("all");
const [items, setItems] = useState([]);
const [loading, setLoading] = useState(false);
const [error, setError] = useState("");
const [selectedItem, setSelectedItem] = useState(null);
const [drawerMode, setDrawerMode] = useState(""); // grimoire | service | preview | publish
```

Avoid global state libraries. Keep MVP local to cabinet unless current repo already has a state pattern.

### 7.8 CSS scope

Use scoped class prefixes to avoid breaking existing cabinet design:

```text
masterPlatformShell
masterFeedComposer
masterFeedFilters
masterFeedList
masterFeedCard
masterFeedCardMedia
masterFeedCardBody
masterFeedActions
masterQuickUploader
masterUnsortedPanel
grimoireWorkspace
grimoireDrawer
serviceBridgePanel
```

Do not globally restyle buttons, cards, forms, or body typography.

## 8. Technical backend/API architecture

### 8.1 Keep current REST/fetch pattern

Current repo clients use direct fetch/REST patterns instead of Supabase JS SDK.

Do not introduce Supabase JS SDK just for this feature unless separately approved.

New clients should follow existing style:

```text
src/lib/supabaseClient.js
src/lib/profileMaterialsClient.js
src/lib/profileServicesClient.js
src/lib/profileMediaClient.js
src/lib/powerPlaceClient.js
```

### 8.2 Existing-data-first approach

Phase 1 should aggregate existing data.

Potential sources:

```text
profile_cabinet_power_place_compositions → personal mandala/feed cards
profile_cabinet_publications             → material/practice/artifact cards
profile_cabinet_services                 → service cards
profile_cabinet_client_goal_photos       → private media cards if safe and owner-only
profile_cabinet_tradition_assets         → owner/admin materials if safe and owner-only
```

Important:

- exact table names and fields must be verified in migrations/code;
- if a source is unclear, mark it `needs verification`;
- do not guess columns.

### 8.3 Future Grimoire table draft

Only after existing tables are checked, a future migration may add:

```sql
create table if not exists public.profile_cabinet_grimoire_records (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profile_cabinet_profiles(id) on delete cascade,
  owner_user_id uuid not null references auth.users(id) on delete cascade,

  source_type text not null default '',
  source_table text not null default '',
  source_id uuid null,

  title text not null default '',
  comment text not null default '',
  symbolism text not null default '',
  practice_notes text not null default '',
  category text not null default '',
  tags text[] not null default '{}',

  status text not null default 'draft',
  visibility text not null default 'private',

  linked_service_id uuid null references public.profile_cabinet_services(id) on delete set null,
  linked_publication_id uuid null references public.profile_cabinet_publications(id) on delete set null,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  check (status in ('draft', 'active', 'archived')),
  check (visibility in ('private', 'workshop', 'service_candidate', 'profile_only', 'public_candidate'))
);
```

RLS direction:

```text
owner can read/write own records
admin can read if needed for moderation/debug
anon cannot read grimoire records
```

### 8.4 Future personal feed table draft

Avoid this until needed. If later needed:

```sql
create table if not exists public.profile_cabinet_personal_feed_items (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profile_cabinet_profiles(id) on delete cascade,
  owner_user_id uuid not null references auth.users(id) on delete cascade,

  source_type text not null,
  source_table text not null default '',
  source_id uuid null,

  item_type text not null,
  title text not null default '',
  body text not null default '',
  preview_url text not null default '',
  category text not null default '',
  tags text[] not null default '{}',

  status text not null default 'draft',
  visibility text not null default 'private',
  pinned boolean not null default false,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  check (item_type in ('mandala','photo','material','setting','grimoire','service','note')),
  check (visibility in ('private','workshop','service','profile_only','public_feed'))
);
```

This is not Phase 1. Prefer aggregation first.

### 8.5 Public feed table

For `/feed`, use the already planned:

```text
profile_cabinet_activity_events
```

Important:

- this table is for public-safe activity rows;
- it should not store raw private source data;
- public read should only allow `status = approved` and `visibility = public_feed`.

## 9. Route architecture

### 9.1 Existing routes to protect

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

### 9.2 Planned/used route

```text
/feed
```

### 9.3 Grimoire route decision

Do not add a public route immediately.

MVP options:

Option A — tab inside `/profile`:

```text
/profile → tab: Гримуарий
```

Option B — nested route later:

```text
/profile/grimoire
```

Option C — drawer inside current feed:

```text
/profile → feed card → В Гримуарий → right/center drawer
```

Recommendation:

```text
Phase 1: drawer or tab inside /profile
Phase 3: consider /profile/grimoire if workflow becomes large
```

### 9.4 Public service routes

Needs verification.

Possible future route patterns:

```text
/service/:serviceId
/masters/:profileSlug/services/:serviceId
/profile/services/:serviceId/edit
```

Do not add these until existing routing and Vercel rewrites are inspected.

## 10. User flows across the whole system

### 10.1 Upload everything now, classify later

```text
Master opens /profile
↓
Uploads photos/articles/screens/files from phone
↓
Items appear in personal feed as Неразобранное
↓
Master opens Grimoire
↓
Adds title/category/comment/symbolism
↓
Marks item as private, workshop, service candidate, or public candidate
```

### 10.2 Mandala becomes service

```text
Master creates Power Place mandala
↓
Saves it in Мои мандалы
↓
It appears in personal feed
↓
Master clicks В услуги / Опубликовать в услугах
↓
Service draft opens
↓
Master edits title, description, format, preview, price if enabled
↓
Master publishes service
↓
Service appears in /profile/services and public service link
↓
Optional: create service_created event for /feed
```

### 10.3 Service becomes public feed event

```text
Master publishes service
↓
System or user explicitly creates activity event
↓
Event status = pending
↓
Admin approves
↓
/feed shows service_created under Услуги
```

Avoid automatic new event on every small service edit.

### 10.4 Private Power Place becomes public projection

```text
Master opens saved private composition
↓
Clicks Опубликовать в ленту
↓
Public projection form opens
↓
Master writes public title/description/category/tags
↓
System creates public-safe activity event
↓
Admin approves
↓
/feed shows fallback or public-safe cover
```

Never expose raw source composition data.

### 10.5 Grimoire record becomes course/service/public material

```text
Master opens Grimoire record
↓
Adds interpretation and category
↓
Chooses target:
- keep private
- add to workshop
- create service
- create public publication
- attach to course later
↓
System creates or updates the appropriate object
```

## 11. Implementation order

### Phase 0 — profile stability

Before adding new product layers:

- `/profile` must not hang forever;
- auth/session recovery must be stable;
- media/mandala loading must be stable;
- saved compositions must remain private and load correctly.

This matches `PROFILE_SERVICES_ROADMAP.md`.

### Phase 1 — personal master feed UI in /profile

Goal:

- composer in center;
- personal feed cards;
- left filters;
- right quick uploader;
- Неразобранное block;
- no public sharing yet;
- use existing data where safe.

Recommended code work:

```text
1. Identify actual /profile component.
2. Add small MasterFeed* components.
3. Build normalized feed view model from existing data.
4. Add filtering locally.
5. Wire card actions to existing flows only where available.
6. Keep unknown actions disabled or TODO-labelled, not fake-persistent.
```

This implements the first part of `master-feed-grimoire.md`.

### Phase 2 — services/shop MVP

Goal:

- make `В услуги` from saved mandala/composition work;
- service editor;
- service publication status;
- public service link;
- order draft/auth redirect flow later;
- no payments yet.

Recommended code work:

```text
1. Inspect profileServicesClient and existing services UI.
2. Add/create service draft from composition/publication if schema supports it.
3. Preserve service status values.
4. Add copy-link only if public route exists; otherwise mark needs route.
5. Do not add payment flow.
```

This follows `PROFILE_SERVICES_ROADMAP.md`.

### Phase 3 — Grimoire workspace

Goal:

- review/classification interface;
- edit metadata;
- move objects from Неразобранное to categories;
- link item to mandala/service/course;
- keep private by default.

Recommended code work:

```text
1. Start as drawer/tab inside /profile.
2. Use existing object metadata first.
3. Add grimoire_records table only after schema review.
4. Keep anon read disabled.
```

### Phase 4 — community feed infrastructure

Goal:

- `profile_cabinet_activity_events` migration/RLS;
- `profileActivityFeedClient.js`;
- `/feed` route/page;
- public-safe filters/cards;
- no automatic events from private saves.

This follows `COMMUNITY_FEED_CONCEPT.md` Phase 1.

### Phase 5 — moderation and publication bridge

Goal:

- events can be pending/approved/rejected;
- admin can moderate feed events;
- services/materials can explicitly create feed events;
- no private data leakage.

### Phase 6 — social layer later

Only after public/private boundary is stable:

- comments;
- reactions;
- follows;
- recommendations;
- subscriptions;
- notifications.

## 12. Public/private boundary rules in code

### 12.1 Personal feed can show private refs, but only inside authenticated UI

Inside `/profile`, it is acceptable to use temporary signed display URLs if the existing media client already does this for owner-only display.

Rules:

- signed URLs are display-only;
- do not persist signed URLs as public feed image URLs;
- do not copy signed URLs into service public data;
- do not show private refs in public route DOM.

### 12.2 Public feed and public service pages need public-safe projection

Public routes must render only:

```text
plain public text
approved public service fields
approved public publication fields
public-safe HTTPS image URL
fallback image/symbol
```

Public routes must not render:

```text
storage://...
signed URL
object_refs
private report text
client photo refs
private composition JSON
private Grimoire notes
```

### 12.3 Helper to validate public image

Recommended utility:

```js
export function isPublicSafeImageUrl(value) {
  if (!value || typeof value !== "string") return false;
  if (!value.startsWith("https://")) return false;
  if (value.includes("/storage/v1/object/sign/")) return false;
  if (value.includes("token=")) return false;
  if (value.startsWith("storage://")) return false;
  if (value.startsWith("data:")) return false;
  return true;
}
```

Use fallback if unsafe.

## 13. Event and status mapping

### 13.1 Personal feed status mapping

Source table statuses can differ. Normalize them for UI only.

```text
composition saved        → private
publication draft        → draft
publication pending      → pending
publication approved     → approved
publication rejected     → draft/rejected display
service draft            → draft
service published        → published
service archived         → archived
media without category   → uncategorized
```

### 13.2 Public event mapping

```text
publication.type = mandala  → mandala_published
publication.type = artifact → artifact_published
publication.type = practice → practice_published
service first publish       → service_created
service explicit update     → service_updated
Power Place projection      → power_place_published
admin post                  → admin_announcement
```

### 13.3 Avoid feed spam

Do not create public events automatically for every save.

Preferred trigger:

```text
explicit user action: Опубликовать в ленту
or admin approval event
```

Duplicate rule later:

```text
one active pending/approved event per target_table + target_id + activity_type
```

## 14. Testing strategy

### 14.1 Automated checks

Run, if available:

```bash
npm install
npm run check
npm run build
npm run test:profile-lite
npm run test:power-place
npm run test:profile-media
npm run test:profile-loading-recovery
npm run test:profile-services
npm run test:feed
```

If a script is missing, report `not found`, do not invent success.

### 14.2 Suggested unit/contract tests

Possible tests to add:

```text
test/profilePersonalFeedClient.test.mjs
test/profileMasterFeedContract.test.mjs
test/grimoireRecordContract.test.mjs
test/publicImageSafety.test.mjs
```

Test cases:

```text
normalizes composition into feed item
normalizes service into feed item
filters by item type
does not mark signed URL as public safe
does not mark storage:// as public safe
service_created maps to feed services tab
private item never becomes public event without explicit action
```

### 14.3 Manual QA routes

```text
/
/profile
/profile/mandalas
/profile/services
/feed if present
/masters
/profile/admin
```

Manual QA cases:

```text
/profile still loads authenticated cabinet
/profile clean localStorage shows login/recovery, not infinite loading
personal feed shows empty state if no items
composer buttons do not break existing modules
left filters do not overflow
right uploader visible on desktop
mobile below 980px has no horizontal overflow
/service or public service link only if implemented
/feed does not show private refs
/admin profile moderation still works
```

## 15. Current route map

Protect existing routes:

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

Planned/used public feed route:

```text
/feed
```

Do not break Vercel SPA rewrites when adding routes.

## 16. Safety rules

Always preserve:

- public home page;
- RU-default interface;
- desktop three-column cabinet layout;
- mobile single-column fallback;
- Supabase auth/data flows;
- Vercel rewrites;
- private storage boundary;
- env names only, no env values.

Never expose publicly:

- private media bucket refs;
- signed URLs;
- `storage://...` values;
- raw `object_refs`;
- client photos;
- private Grimoire notes;
- private reports;
- private Power Place composition JSON.

## 17. Codex implementation prompt: Phase 1 technical MVP

```text
Repo: andylitvinov-design/reiki-yggdrasil
Target branch: main for normal feature work. Do not push directly to production.

Task:
Implement Phase 1 technical MVP from docs/product/MASTER_CABINET_PLATFORM_STRUCTURE.md: personal master feed UI inside /profile, using existing data where safe, without adding public feed automation or risky migrations.

Before changing code, read:
- AGENTS.md
- README.md
- STATE.md
- LOG.md
- docs/PROFILE_SERVICES_ROADMAP.md
- docs/product/COMMUNITY_FEED_CONCEPT.md
- docs/concepts/master-feed-grimoire.md
- docs/product/MASTER_CABINET_PLATFORM_STRUCTURE.md
- package.json
- vercel.json
- src/main.jsx
- src/App.jsx
- src/index.css
- src/profileCabinet.css
- src/profileMandalaWorkspace.css
- src/lib/supabaseClient.js
- src/lib/profileMaterialsClient.js
- src/lib/profileServicesClient.js
- src/lib/profileMediaClient.js
- src/lib/powerPlaceClient.js
- src/pages/ProfilePage.jsx
- src/pages/ProfileLitePage.jsx
- src/pages/profile-lite/*
- relevant Supabase migrations.

Product architecture:
- /profile personal master feed is private/authenticated working timeline.
- Grimoire is review/classification workspace.
- /profile/services is service/shop management.
- /feed is public-safe community feed, but do not implement /feed in this task unless already present and untouched.
- Public feed events are not raw private source objects.

Minimum implementation:
1. Identify actual current /profile cabinet component.
2. Add a small personal master feed UI without rewriting the whole cabinet.
3. Preserve desktop three-column layout:
   - left: filters
   - center: composer + feed cards
   - right: quick uploader + Неразобранное
4. Build normalized feed items from existing available data if possible.
5. If data is not available, show safe empty states/TODO states, not fake persisted records.
6. Composer buttons should open existing modules where possible:
   - + Мандала → existing mandala/power-place module
   - + Фото / материал → existing media/material uploader
   - + Услуга → existing services editor/list
   - + Настройка / + Запись в гримуар → safe placeholder or drawer only if no backend exists
7. Add helper/action mapping for feed cards.
8. Keep Grimoire as placeholder/drawer/tab unless schema already exists.
9. Do not add new Supabase migrations in Phase 1 unless absolutely necessary and separately justified.
10. Do not expose private refs on public routes.

Suggested files, adjust to actual repo:
- src/pages/profile-lite/MasterFeedComposer.jsx
- src/pages/profile-lite/MasterFeedList.jsx
- src/pages/profile-lite/MasterFeedCard.jsx
- src/pages/profile-lite/MasterFeedFilters.jsx
- src/pages/profile-lite/MasterQuickUploader.jsx
- src/pages/profile-lite/MasterUnsortedPanel.jsx
- src/lib/profilePersonalFeedClient.js if needed
- scoped CSS in src/profileCabinet.css or src/profileMandalaWorkspace.css, using masterFeed/masterPlatform prefixes.

Rules:
- Do not rewrite the whole project.
- Do not loosen RLS broadly.
- Do not introduce Supabase JS SDK unless separately approved.
- Do not expose secrets/env values.
- Do not expose private media, signed URLs, storage refs, object_refs, client photos, private reports or private Grimoire notes.
- Preserve /, /profile, /profile/mandalas, /profile/services, /masters, /profile/admin.
- Preserve RU-default UI.
- Preserve desktop three-column layout and mobile fallback.

Checks:
- npm install
- npm run check
- npm run build
- npm run test:profile-lite
- npm run test:power-place
- npm run test:profile-media
- npm run test:profile-loading-recovery if available
- npm run test:profile-services if available

Manual QA:
- /
- /profile
- /profile/mandalas
- /profile/services
- /masters
- /profile/admin
- mobile below 980px
- no horizontal overflow
- no console errors
- no private refs in public DOM/text.

Report:
- files read
- files changed
- which phase was touched
- exact checks run
- manual QA
- what was not verified
- risks
- whether STATE.md / LOG.md need updates.
```

## 18. Codex implementation prompt: Phase 2 services bridge

```text
Repo: andylitvinov-design/reiki-yggdrasil
Target branch: main for normal feature work. Do not push directly to production.

Task:
Implement the safe service/shop bridge from saved mandalas/compositions/personal feed items into /profile/services, following docs/PROFILE_SERVICES_ROADMAP.md and docs/product/MASTER_CABINET_PLATFORM_STRUCTURE.md.

Before changing code, read all docs/files required by AGENTS.md plus:
- docs/PROFILE_SERVICES_ROADMAP.md
- docs/product/MASTER_CABINET_PLATFORM_STRUCTURE.md
- profile services client/component files
- power place composition client/component files
- relevant migrations for profile_cabinet_services and profile_cabinet_power_place_compositions.

Minimum implementation:
1. Verify existing profile_cabinet_services fields and client helpers.
2. Add or fix action В услуги from saved mandala/composition card.
3. Create service draft with safe source reference only if schema supports it.
4. Open service editor after draft creation.
5. Allow editing title/description/preview/status fields already supported.
6. Preserve status values: draft/published/archived unless repo schema says otherwise.
7. Do not add payment processing.
8. Do not expose private composition JSON in public service card.
9. If public service route does not exist, copy-link action must show needs route, not fake URL.

Checks and report as in Phase 1.
```

## 19. Codex implementation prompt: Phase 3 Grimoire technical design

```text
Repo: andylitvinov-design/reiki-yggdrasil
Target branch: main for normal feature work. Do not push directly to production.

Task:
Design and optionally implement first Grimoire workspace MVP inside /profile, following docs/product/MASTER_CABINET_PLATFORM_STRUCTURE.md.

Before code:
- inspect existing tables and clients for materials/publications/services/media/compositions;
- decide whether Grimoire can be metadata-first or needs profile_cabinet_grimoire_records;
- do not create migration unless necessary.

MVP:
1. Add Grimoire drawer/tab inside /profile.
2. Open selected feed item in Grimoire view.
3. Allow editing local/display metadata only if persistence exists.
4. Show fields:
   - title
   - category
   - tags
   - comment
   - symbolism
   - practice notes
   - linked service/publication if available
5. Keep all records private by default.
6. Add public_candidate only as intent, not public publication.
7. No anon read.

Checks and report as in Phase 1.
```

## 20. Open questions / needs verification

Before implementation, verify:

- whether `/feed` already works on current branch;
- whether `src/pages/FeedPage.jsx` is wired in `src/main.jsx`;
- whether migration `profile_cabinet_activity_events` is applied in live/test Supabase;
- whether `profile_cabinet_services` has enough fields for public service cards;
- whether service public pages exist or still need route design;
- whether `Мои услуги` is currently a real data-backed module or UI placeholder;
- whether Grimoire should be separate route, tab inside `/profile`, or drawer/modal workspace;
- whether public albums are required before first feed MVP;
- whether automatic feed event creation should remain disabled until moderation is stable;
- whether personal feed can aggregate enough existing data without a new table;
- whether current media/materials client can expose owner-only uploaded materials as normalized feed items;
- whether source references from compositions to services already exist or need a safe `source_type/source_id` pattern.
