# Master Cabinet Platform Structure — Services, Feed, Grimoire

Last updated: 2026-06-05  
Project: Reiki Yggdrasil / Mentalica  
Repo: `andylitvinov-design/reiki-yggdrasil`  
Status: coordination document / product architecture  
Target branch for implementation work: `main` for normal feature work, never direct `production`

## 1. Purpose

This document coordinates several already-written product concepts into one architecture:

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

## 5. Data architecture direction

### 5.1 Existing real tables from current concepts

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

### 5.2 Public feed events

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

### 5.3 Personal feed items

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

### 5.4 Grimoire records

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

## 6. User flows across the whole system

### 6.1 Upload everything now, classify later

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

### 6.2 Mandala becomes service

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

### 6.3 Service becomes public feed event

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

### 6.4 Private Power Place becomes public projection

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

### 6.5 Grimoire record becomes course/service/public material

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

## 7. Implementation order

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

This implements the first part of `master-feed-grimoire.md`.

### Phase 2 — services/shop MVP

Goal:

- make `В услуги` from saved mandala/composition work;
- service editor;
- service publication status;
- public service link;
- order draft/auth redirect flow later;
- no payments yet.

This follows `PROFILE_SERVICES_ROADMAP.md`.

### Phase 3 — Grimoire workspace

Goal:

- review/classification interface;
- edit metadata;
- move objects from Неразобранное to categories;
- link item to mandala/service/course;
- keep private by default.

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

## 8. Current route map

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

## 9. Safety rules

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

## 10. Codex coordination prompt

```text
Repo: andylitvinov-design/reiki-yggdrasil
Target branch: main for normal feature work. Do not push directly to production.

Task:
Coordinate implementation work according to docs/product/MASTER_CABINET_PLATFORM_STRUCTURE.md.

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
- src/index.css
- src/profileCabinet.css
- src/lib/supabaseClient.js
- src/lib/profileMaterialsClient.js
- src/lib/profileServicesClient.js
- src/lib/profileMediaClient.js
- src/lib/powerPlaceClient.js
- src/pages/ProfileLitePage.jsx
- src/pages/FeedPage.jsx if present
- src/pages/AdminPage.jsx
- relevant Supabase migrations.

Product architecture:
- /profile personal master feed is private/authenticated working timeline.
- Grimoire is review/classification workspace.
- /profile/services is service/shop management.
- /feed is public-safe community feed.
- Public feed events are not raw private source objects.

Implementation order:
1. Stabilize /profile.
2. Add personal master feed UI in /profile.
3. Implement services/shop MVP from saved mandalas/compositions.
4. Add Grimoire classification workspace.
5. Add /feed public activity infrastructure.
6. Add moderation bridge.
7. Add social features only later.

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
- npm run test:feed if added

Manual QA:
- /
- /profile
- /profile/mandalas
- /profile/services
- /feed if present
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
- checks run
- manual QA
- what was not verified
- risks
- whether STATE.md / LOG.md need updates.
```

## 11. Open questions / needs verification

Before implementation, verify:

- whether `/feed` already works on current branch;
- whether `src/pages/FeedPage.jsx` is wired in `src/main.jsx`;
- whether migration `profile_cabinet_activity_events` is applied in live/test Supabase;
- whether `profile_cabinet_services` has enough fields for public service cards;
- whether service public pages exist or still need route design;
- whether `Мои услуги` is currently a real data-backed module or UI placeholder;
- whether Grimoire should be separate route, tab inside `/profile`, or drawer/modal workspace;
- whether public albums are required before first feed MVP;
- whether automatic feed event creation should remain disabled until moderation is stable.
