# Master Cabinet Platform Structure — Master Page, Services, Feed, Grimoire

Last updated: 2026-06-05  
Project: Reiki Yggdrasil / Mentalica  
Repo: `andylitvinov-design/reiki-yggdrasil`  
Status: technical product architecture / implementation blueprint  
Target branch for implementation work: `main` for normal feature work, never direct `production`

## 1. Core correction

The central product object is **not only the private `/profile` cabinet**.

The central product object is the **public Master Page**, similar to a Facebook page for a practitioner.

A master should have a public page where they can publish:

- short notes;
- articles;
- news;
- new mandalas;
- public settings/initiations;
- services;
- public-safe materials;
- announcements;
- practice results.

Then these published or drafted objects also enter the master's private workspace:

```text
public/draft master publication
↓
private master cabinet
↓
personal Grimoire
↓
sorting/classification
↓
workshop material / service / course material / public feed item
```

The public output of all masters becomes a news feed that other users can read.

This community news feed should also be visible from the public home page, not hidden only under a separate `/feed` route.

## 2. High-level product model

The product should evolve as one connected system:

```text
Master Page publishing
↓
Public master posts / mandalas / articles / services
↓
Community news feed on home page and/or /feed
↓
Private master cabinet backstage
↓
Personal Grimoire sorting and classification
↓
Workshop materials / services / courses
↓
Client orders and delivery
```

There are four different but connected surfaces:

```text
1. Public Master Page       = Facebook-like practitioner page
2. Home/community feed      = news feed from all masters
3. Private /profile cabinet = master backstage/editor
4. Grimoire                 = sorting/classification/workshop preparation
```

## 3. Source documents coordinated by this file

This document coordinates:

```text
docs/PROFILE_SERVICES_ROADMAP.md
docs/product/COMMUNITY_FEED_CONCEPT.md
docs/concepts/master-feed-grimoire.md
docs/product/MASTER_CABINET_PLATFORM_STRUCTURE.md
```

Related product ideas:

- service/shop flow;
- personal Grimoire;
- public community activity feed;
- master page publishing;
- workshop materials.

## 4. Correct naming model

Use these names consistently:

```text
Master Page             = public Facebook-like page of one master
Master Page Post        = public/draft/pending post created by master
Community Feed          = aggregate public feed from all masters
Home Feed Block         = feed block on main site home page
Profile Cabinet         = private authenticated master backstage
Grimoire                = private sorting/classification workspace
Workshop Material       = prepared material used inside master's workshop/course/service flow
Service Shop            = services and orderable offerings
Activity Event          = public-safe event row for feed aggregation
Source Item             = original private object: photo, mandala, composition, note, file
Public Projection       = curated safe public representation of private source item
```

Avoid using only “лента” without qualifier. Always clarify:

```text
публичная страница мастера
лента страницы мастера
общая лента новостей
личный кабинет мастера
личный Гримуарий
материалы мастерской
```

## 5. Product surfaces

### 5.1 Public Master Page

The Master Page should feel like a Facebook page for a practitioner, but calmer and more ritual/art/academy oriented.

It can contain:

```text
Master header
Master bio
Master services
Master posts
Master articles
Master mandalas
Master public materials
Master announcements
CTA to contact/order/follow later
```

Possible route patterns — needs repo verification:

```text
/masters/:profileId
/masters/:slug
/master/:slug
```

Do not invent route until `src/main.jsx`, `MastersPage.jsx`, and current profile/public profile structure are inspected.

### 5.2 Community Feed / Home Feed

All public-safe posts from all masters become a shared news feed.

This feed should exist in two possible places:

```text
/             → home page block: latest community news
/feed         → full feed page with filters/tabs
```

The home page feed block should be a curated/latest preview, not necessarily the full feed UI.

Home page block example:

```text
Новости мастеров
[Новая мандала]
[Статья мастера]
[Новая услуга]
[Практика / настройка]
Button: Смотреть всю ленту
```

### 5.3 Private Profile Cabinet

`/profile` is the master backstage.

It is not the main public page. It is where the master:

- creates drafts;
- uploads source materials;
- manages saved mandalas;
- manages services;
- sees own posts and their statuses;
- opens Grimoire;
- sends items to public page/feed;
- turns items into workshop materials.

### 5.4 Personal Grimoire

The Grimoire is a private classification and meaning workspace.

It answers:

```text
What is this object?
What category does it belong to?
Is it private, public, service, course, workshop material, or archive?
How can this be used in the master's practice?
```

The Grimoire should receive:

- drafts;
- published master page posts;
- uploaded files/photos;
- mandalas;
- service drafts;
- articles;
- notes;
- public-safe copies/projections.

From Grimoire, an item can become:

```text
workshop material
service
public post
course material
private archive
```

### 5.5 Workshop Materials

Workshop materials are the prepared internal library for the master's work.

They can come from:

- sorted Grimoire records;
- public posts;
- private notes;
- mandalas;
- articles;
- settings;
- service templates.

Workshop materials are not automatically public.

## 6. Correct object flow

### 6.1 Master publishes a post

```text
Master opens /profile or public Master Page editor
↓
Creates note/article/mandala post/service announcement
↓
Post status = draft or pending
↓
Post appears in master's private cabinet list
↓
Post can be opened in Grimoire for classification
↓
If approved/public, it appears on public Master Page
↓
It also appears in Community Feed/Home Feed
```

### 6.2 Published post enters Grimoire

```text
Published master post
↓
Automatically visible in private cabinet as own item
↓
Master clicks В Гримуарий
↓
Adds category, tags, symbolism, practice notes
↓
Marks as workshop material / service candidate / course material / archive
```

### 6.3 Grimoire item becomes workshop material

```text
Grimoire record
↓
Master selects Добавить в мастерскую
↓
System creates/updates workshop material record
↓
Material appears in Workshop library
↓
Can be reused in services/courses/mandala constructor later
```

### 6.4 Mandala becomes post and service

```text
Master creates mandala
↓
Saves private composition
↓
Creates public-safe mandala post/projection
↓
Post appears on Master Page and community feed after approval/publication
↓
Same mandala can also become service draft
↓
Service appears in service shop when published
```

### 6.5 All masters create shared news feed

```text
Master A publishes article
Master B publishes mandala
Master C publishes service
Master D publishes practice note
↓
All approved/public-safe items create activity events
↓
Home page feed block shows latest items
↓
/feed shows full filtered community feed
```

## 7. Data architecture direction

### 7.1 Existing relevant tables to verify

From existing concepts, likely relevant tables:

```text
profile_cabinet_profiles
profile_cabinet_publications
profile_cabinet_services
profile_cabinet_service_orders
profile_cabinet_power_place_compositions
profile_cabinet_client_goal_photos
profile_cabinet_tradition_assets
profile_cabinet_admins
profile_cabinet_activity_events
```

Codex must verify actual migrations before using fields.

### 7.2 Public posts / publications

Existing `profile_cabinet_publications` is likely the closest table for Master Page posts.

It should be evaluated as the canonical object for:

```text
master notes
articles
public mandalas
artifacts
practices
settings/initiations
announcements
```

If current table only supports limited types, extend carefully later.

Possible publication types:

```text
note
article
mandala
practice
artifact
setting
announcement
photo_album
service_announcement
```

Possible statuses:

```text
draft
pending
approved
rejected
published
archived
```

Use current repo statuses if they already exist. Do not invent incompatible status values without migration plan.

### 7.3 Community feed events

The community feed should not query every table directly if avoidable.

Use:

```text
profile_cabinet_activity_events
```

Activity events are generated from public-safe objects:

```text
publication_created
publication_updated
article_published
mandala_published
setting_published
service_created
service_updated
photo_album_published
admin_announcement
featured_item
```

The event row should point back to the source public object:

```text
target_table = profile_cabinet_publications | profile_cabinet_services | profile_cabinet_photo_albums
target_id = uuid
```

It must not point directly to private source tables in public output.

### 7.4 Grimoire records

Future table if existing metadata is not enough:

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

### 7.5 Workshop materials

Future table if needed:

```text
profile_cabinet_workshop_materials
```

Potential fields:

```text
id
profile_id
owner_user_id
source_type
source_table
source_id
title
description
content
category
tags
material_type
visibility
status
linked_service_id
linked_publication_id
linked_grimoire_record_id
created_at
updated_at
```

Material types:

```text
article
mandala
setting
practice
photo
template
note
ritual
course_piece
```

Visibility:

```text
private
workshop
service
course
profile_only
public_candidate
```

Do not add this until the Grimoire/workshop UI needs persistence.

## 8. Frontend architecture

### 8.1 Public Master Page components

Recommended component names after repo verification:

```text
src/pages/MasterPublicPage.jsx
src/pages/masters/MasterPageHeader.jsx
src/pages/masters/MasterPageFeed.jsx
src/pages/masters/MasterPagePostCard.jsx
src/pages/masters/MasterPageServices.jsx
src/pages/masters/MasterPageMandalas.jsx
src/pages/masters/MasterPageMaterials.jsx
```

If current `MastersPage.jsx` already contains profile cards only, do not rewrite it wholesale. Add a detail page or route only after routing check.

### 8.2 Home feed components

Recommended additive components:

```text
src/components/HomeCommunityFeed.jsx
src/components/HomeCommunityFeedCard.jsx
```

Or use existing home page component structure if present.

Home page should show only latest approved public events, for example 3–6 cards.

### 8.3 Private cabinet components

Recommended additive components:

```text
src/pages/profile-lite/MasterCabinetPlatform.jsx
src/pages/profile-lite/MasterPublishingComposer.jsx
src/pages/profile-lite/MasterOwnPublicationsList.jsx
src/pages/profile-lite/MasterFeedCard.jsx
src/pages/profile-lite/MasterQuickUploader.jsx
src/pages/profile-lite/MasterUnsortedPanel.jsx
src/pages/profile-lite/GrimoireWorkspace.jsx
src/pages/profile-lite/GrimoireEditorDrawer.jsx
src/pages/profile-lite/WorkshopMaterialsPanel.jsx
src/pages/profile-lite/ServiceDraftBridge.jsx
```

### 8.4 Frontend clients

Possible client files:

```text
src/lib/profilePublicationsClient.js
src/lib/profileActivityFeedClient.js
src/lib/profileGrimoireClient.js
src/lib/profileWorkshopMaterialsClient.js
src/lib/profilePersonalFeedClient.js
```

But first inspect existing clients:

```text
src/lib/profileMaterialsClient.js
src/lib/profileServicesClient.js
src/lib/profileMediaClient.js
src/lib/powerPlaceClient.js
src/lib/supabaseClient.js
```

Do not duplicate existing API helpers if current clients already cover publications/materials.

### 8.5 Public post view model

Public Master Page and Community Feed should render a safe normalized item:

```js
{
  id: string,
  profileId: string,
  authorName: string,
  authorAvatarUrl: string,
  type: "note" | "article" | "mandala" | "practice" | "setting" | "service" | "announcement",
  title: string,
  excerpt: string,
  body: string,
  imageUrl: string,
  imageKind: "public-safe" | "fallback",
  category: string,
  tags: string[],
  status: "approved" | "published",
  visibility: "profile_only" | "public_feed",
  publishedAt: string,
  targetUrl: string
}
```

No private fields in this shape.

### 8.6 Private Grimoire item view model

Private Grimoire can render richer data:

```js
{
  id: string,
  sourceType: "publication" | "composition" | "media" | "service" | "note",
  sourceTable: string,
  sourceId: string,
  title: string,
  content: string,
  comment: string,
  symbolism: string,
  practiceNotes: string,
  category: string,
  tags: string[],
  status: "draft" | "active" | "archived",
  visibility: "private" | "workshop" | "service_candidate" | "profile_only" | "public_candidate",
  linkedServiceId: string,
  linkedPublicationId: string,
  linkedWorkshopMaterialId: string
}
```

This is authenticated-only.

## 9. Publishing flow in code

### 9.1 Composer on Master Page / Cabinet

Composer should support:

```text
Заметка
Статья
Мандала
Настройка
Услуга
Материал
```

MVP behavior:

```text
Заметка/Статья → profile_cabinet_publications if table supports it
Мандала       → existing mandala/power-place flow, then public projection
Настройка     → publication type setting if supported, otherwise TODO
Услуга        → profile_cabinet_services
Материал      → existing materials/media flow, then Grimoire sorting
```

### 9.2 Publication status flow

Recommended flow:

```text
draft
↓
pending
↓
approved/published
↓
activity event created or approved
↓
Master Page + Community Feed + Home Feed
```

If admin moderation is not ready, use safe owner-only draft/published status only in staging/test until RLS is verified.

### 9.3 Home feed query

Home page feed should use only public-safe event query:

```text
status = approved
visibility = public_feed
order = event_at.desc
limit = 3..6
```

It should not query private tables.

### 9.4 Master page query

Master public page should use:

```text
profile_id = current public master profile
status in approved/published
visibility in profile_only/public_feed
```

It may show profile-only posts that are public on the master page but not necessarily in the global feed.

## 10. Public/private boundary rules

### 10.1 Public-safe image helper

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

### 10.2 Never expose publicly

Public Master Page, Home Feed, and `/feed` must not render:

```text
storage://...
signed URL
object_refs
private report text
client photo refs
private composition JSON
private Grimoire notes
raw private file paths
```

### 10.3 Private cabinet can display owner-only data

Inside authenticated `/profile`, it is acceptable to display owner-only private media using existing signed URL flow, if current code already does this.

But do not persist signed URLs into public rows.

## 11. Route architecture

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

Potential routes — needs verification:

```text
/feed
/masters/:id or /masters/:slug
/profile/grimoire later
/profile/workshop later
/service/:id later
```

Do not add routes without checking `src/main.jsx` and `vercel.json`.

## 12. Implementation phases

### Phase 0 — inspect and stabilize

- Read repo docs and code.
- Confirm current `/profile` implementation.
- Confirm services/publications/feed tables.
- Confirm current home page structure.
- Confirm whether `/feed` exists and works.
- Confirm whether Master detail page exists.

### Phase 1 — Master Page publishing concept in code

Goal:

- define public Master Page feed model;
- use existing `profile_cabinet_publications` if possible;
- add UI only where safe;
- do not expose private data.

Deliverables:

```text
Master Page post cards
public-safe post normalization
empty states
RU labels
no schema changes unless verified
```

### Phase 2 — Home feed block

Goal:

- show latest approved public events on `/`;
- keep home page design intact;
- add small feed preview block;
- link to full feed or masters catalog.

Deliverables:

```text
HomeCommunityFeed component
safe query through activity events
fallback if Supabase not configured
no private refs
```

### Phase 3 — Private cabinet backstage

Goal:

- master sees own posts/drafts/services/materials in `/profile`;
- can open item in Grimoire;
- can sort/category items;
- can send to workshop/service/publication.

### Phase 4 — Grimoire and Workshop Materials

Goal:

- classify objects;
- create workshop material records if needed;
- link materials to services/courses/mandalas.

### Phase 5 — Service bridge

Goal:

- mandala/post/grimoire item can become service draft;
- service can be published;
- public service card appears on Master Page;
- optional activity event appears in home/community feed.

### Phase 6 — Full community feed

Goal:

- full `/feed` page;
- filters by type/category/master;
- public-safe cards;
- moderation flow.

### Phase 7 — social layer later

Only later:

```text
likes
comments
follows
subscriptions
notifications
recommendations
```

## 13. Testing strategy

Run if available:

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

If script is missing, report `not found`.

Manual QA:

```text
/
/profile
/profile/mandalas
/profile/services
/feed if present
/masters
/profile/admin
mobile below 980px
no horizontal overflow
no console errors
no private refs in public DOM/text
```

## 14. Codex prompt — revise architecture implementation around Master Page

```text
Repo: andylitvinov-design/reiki-yggdrasil
Target branch: main for normal feature work. Do not push directly to production.

Task:
Implement the next planning/technical pass around the corrected architecture in docs/product/MASTER_CABINET_PLATFORM_STRUCTURE.md: the public Master Page is a Facebook-like publishing page for each master; the home/community feed aggregates public-safe posts from all masters; /profile and Grimoire are the private backstage for sorting and converting posts/materials into workshop materials and services.

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
- src/pages/ProfilePage.jsx
- src/pages/ProfileLitePage.jsx
- src/pages/MastersPage.jsx
- src/pages/FeedPage.jsx if present
- src/pages/AdminPage.jsx
- src/pages/profile-lite/*
- src/lib/supabaseClient.js
- src/lib/profileMaterialsClient.js
- src/lib/profileServicesClient.js
- src/lib/profileMediaClient.js
- src/lib/powerPlaceClient.js
- src/lib/profileActivityFeedClient.js if present
- relevant Supabase migrations.

Key product correction:
- Master Page = public Facebook-like page for one master.
- Master publishes notes/articles/mandalas/settings/services there.
- These public/draft objects also enter private /profile backstage and Grimoire.
- Grimoire sorts/classifies them and can turn them into workshop materials.
- All public-safe master publications become the community news feed.
- Home page should show a preview of this feed.

Implementation order:
1. Verify current routes/tables/components.
2. Identify whether Master detail page exists or only /masters catalog exists.
3. Identify whether profile_cabinet_publications can represent notes/articles/mandalas/settings.
4. Identify whether profile_cabinet_activity_events already exists and is wired.
5. Do not implement risky migrations until the current schema is known.
6. If implementing UI, prefer additive components and safe empty states.
7. Preserve current home page design; add feed preview only if scope explicitly asks.
8. Preserve /profile, /profile/mandalas, /profile/services, /masters, /profile/admin.

Rules:
- Do not expose private media, signed URLs, storage refs, object_refs, client photos, private reports or private Grimoire notes on public routes.
- Public Master Page, home feed and /feed must render public-safe projections only.
- Keep RU-default UI.
- Do not rewrite the whole project.
- Do not push to production.
- Do not publish env values or secrets.

Checks:
- npm install
- npm run check
- npm run build
- available profile/feed/services tests.

Report:
- files read
- what exists / what is not found
- proposed route model
- proposed table/model mapping
- files changed if any
- checks run
- risks
- what still needs verification
- whether STATE.md / LOG.md need updates.
```

## 15. Open questions / needs verification

Before implementation, verify:

- is there a real public detail page for each master, or only `/masters` catalog?
- should the Master Page URL be `/masters/:slug`, `/masters/:id`, or another route?
- can `profile_cabinet_publications` support notes/articles/settings, or only practice/mandala/artifact?
- does `profile_cabinet_activity_events` exist in live/test Supabase?
- is `/feed` currently wired in `src/main.jsx` and `vercel.json`?
- where should the home page feed preview be placed without breaking design?
- should public master posts require admin approval before appearing in home/community feed?
- should Master Page show `profile_only` posts that do not enter global feed?
- should Grimoire auto-import every public post, or only when master clicks `В Гримуарий`?
- does Workshop need a dedicated table now, or can it begin as categories/tags on Grimoire records?
