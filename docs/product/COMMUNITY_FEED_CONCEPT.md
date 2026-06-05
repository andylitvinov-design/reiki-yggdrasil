# Community Feed Concept — Reiki Yggdrasil / Mentalica

Last updated: 2026-06-04

## 1. Purpose

Reiki Yggdrasil / Mentalica should evolve from a personal learning/cabinet site into a living community of masters and students.

Users should be able to:

- create personal mandalas and Power Place compositions in their cabinet;
- save them privately;
- choose which works become public;
- publish selected works into a community feed;
- present selected works as services;
- discover other masters, practices, mandalas, and public offerings.

The product metaphor is not a direct Instagram clone. The goal is a ritual, educational, and community-based feed where mandalas, practices, services, and master profiles become visible as a shared field of work.

## 2. Product vision

The site should support three connected layers:

1. **Private cabinet** — user creates and stores personal mandalas, photos, reports, and Power Place compositions.
2. **Public profile** — master/student presents selected works, services, description, and contact/action links.
3. **Community feed** — public stream of approved published mandalas, services, practices, and updates.

The feed should feel like a beautiful spiritual/artistic publication space:

- visual cards with mandalas;
- author identity;
- short meaning/description;
- tags and traditions;
- safe links to public master/service pages;
- mobile-first reading flow;
- desktop grid for discovery.

## 3. Existing project boundary

Canonical repo: `andylitvinov-design/reiki-yggdrasil`.

Target production URL: `https://mentalica.vercel.app`.

Current/legacy live URL until migration is verified: `https://reiki-yggdrasil.vercel.app`.

Framework/hosting: Vite + React on Vercel.

Existing routes that must not be broken:

- `/`
- `/profile`
- `/profile/mandalas`
- `/masters`
- `/profile/admin`

Important project rules:

- preserve the public home page;
- preserve RU-default interface;
- preserve desktop three-column structure where already accepted;
- preserve mobile single-column fallback;
- do not break Supabase auth/data flows;
- do not expose secrets or env values;
- use only env names in docs/code:
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`
  - `VITE_ADMIN_EMAIL`

## 4. Core user roles

### 4.1 Visitor

A visitor can:

- open the public feed;
- view published mandalas/services/practices;
- open public master profiles;
- discover public work without login.

A visitor cannot:

- see private drafts;
- see private saved compositions;
- see private storage refs or signed URLs;
- create or publish content.

### 4.2 Authenticated user / student / master

An authenticated user can:

- create and save mandalas privately;
- create Power Place compositions;
- choose a saved item and create a publication draft;
- edit title, description, tags, and visibility;
- submit a publication for moderation;
- publish selected works as services if approved by the product flow;
- manage own drafts and published items.

### 4.3 Admin / moderator

An admin can:

- see pending publications;
- approve/reject/archive publications;
- add moderation notes;
- protect public feed quality and privacy.

## 5. MVP concept

The safest first version is not a full social network.

MVP should include:

1. New public route: `/feed`.
2. New publication data layer.
3. New action from saved mandalas/compositions: `Опубликовать`.
4. Draft/pending/published status flow.
5. Public feed cards for approved publications.
6. Minimal admin moderation.
7. Safe fallbacks when a public cover image cannot be resolved.

MVP should not include yet:

- likes;
- comments;
- direct messages;
- complex subscriptions;
- algorithmic recommendations;
- public access to private cabinet data;
- automatic publication of all saved mandalas.

## 6. Publication lifecycle

Recommended flow:

```text
Create mandala / Power Place composition
↓
Save privately in the cabinet
↓
Click “Опубликовать”
↓
Create publication draft
↓
Edit public title, description, tags, visibility
↓
Submit for moderation
↓
Admin approves/rejects
↓
Approved item appears in /feed
```

Recommended statuses:

```text
draft
pending
published
rejected
archived
```

Recommended visibility values:

```text
private
profile_only
public_feed
```

Important rule:

A saved mandala/composition stays private by default. A public feed item should be a separate publication record that references or safely copies only public-safe fields.

## 7. Content types

Initial publication types:

```text
mandala
power_place
service
practice
```

Possible future types:

```text
artifact
ritual
meditation
course_note
public_case
master_update
```

MVP should start with `mandala`, `power_place`, and optionally `service` if the current service module is stable enough.

## 8. Feed UX

Recommended route:

```text
/feed
```

Recommended navigation label:

```text
Лента
```

Recommended filter tabs:

```text
Все
Мандалы
Места силы
Услуги
Практики
Мастера
```

Each feed card should include:

- cover image or beautiful fallback;
- title;
- author display name;
- content type label;
- short description;
- tags/category;
- published date;
- CTA buttons:
  - `Открыть`
  - `К мастеру`
  - `Сохранить себе` — future, not required for MVP.

Empty state:

```text
Пока нет опубликованных мандал.
```

Loading state:

```text
Загружаем ленту...
```

Error state:

```text
Не удалось загрузить ленту. Попробуйте обновить страницу.
```

## 9. Cabinet UX

In `Мои мандалы` / saved compositions, each saved item can eventually show actions:

```text
Открыть
Редактировать
Опубликовать
Сделать услугой
Скопировать ссылку
Скрыть
```

For MVP, minimum safe actions:

```text
Открыть
Опубликовать
```

When user clicks `Опубликовать`, open a compact publication editor:

- public title;
- short description;
- type;
- tags;
- visibility;
- submit button: `Отправить на публикацию`.

## 10. Services layer

A publication can later become a service.

Possible flow:

```text
Saved mandala
↓
Publish as service
↓
Edit service description
↓
Set price/payment model if supported
↓
Show in “Мои услуги” and optionally in public feed
↓
Copy public link
```

Recommended service fields for later:

- service title;
- public description;
- cover image;
- price/payment note;
- duration/session format;
- CTA/contact link;
- status;
- public URL slug.

For MVP, do not require price/payment fields unless the current service model already supports them.

## 11. Data model proposal

Before implementation, inspect existing Supabase migrations and reuse current naming conventions if an equivalent publication table already exists.

A possible table:

```sql
create table public.profile_publications (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references auth.users(id) on delete cascade,
  source_type text not null,
  source_id uuid null,
  title text not null,
  description text null,
  cover_ref text null,
  cover_public_url text null,
  tags text[] not null default '{}',
  category text null,
  visibility text not null default 'private',
  status text not null default 'draft',
  moderation_note text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  published_at timestamptz null
);
```

Suggested constraints:

```sql
source_type in ('mandala', 'power_place', 'service', 'practice')
visibility in ('private', 'profile_only', 'public_feed')
status in ('draft', 'pending', 'published', 'rejected', 'archived')
```

## 12. RLS / privacy rules

The key safety rule:

Public users can read only approved public records. They must never read private drafts or private storage refs.

Recommended RLS rules:

- authenticated users can create their own drafts;
- authenticated users can read/update their own drafts and pending publications;
- public/anon can read only `status = 'published'` and `visibility = 'public_feed'`;
- admin can read pending publications and approve/reject/archive;
- public feed should not expose private signed URLs, client photos, private reports, or private user notes.

## 13. Storage and image safety

The current project uses private Storage refs and signed URLs for cabinet media.

Do not publish raw private media paths or signed URLs as permanent public content.

Safe options:

1. Use only public-safe cover assets.
2. Generate/store a public-safe cover copy if the product decides to support it later.
3. If no safe cover is available, show a designed fallback card.

Never expose:

- private client photos;
- private report content;
- owner-only storage refs;
- temporary signed URLs as stable public data;
- local `data:image` previews as public feed content.

## 14. Admin moderation UX

In `/profile/admin`, add a minimal section:

```text
Публикации на модерации
```

Each pending item should show:

- title;
- author;
- type;
- cover/fallback;
- description;
- created date;
- buttons:
  - `Одобрить`
  - `Отклонить`
  - `Архивировать` — optional.

MVP moderation can be simple. Do not redesign the whole admin page.

## 15. Public master profile integration

The existing `/masters` catalog can later show:

- latest published mandalas;
- service count;
- button `Публикации`;
- button `Услуги`.

MVP should not force a large `/masters` redesign.

Safe first integration:

- keep `/masters` intact;
- optionally add a small link to `/feed?master=<id>` later;
- add public profile pages only after `/feed` is stable.

## 16. Visual design direction

The feed should look like a refined ritual/art community, not a noisy social app.

Recommended style:

- soft mystic background;
- gold/cream accents;
- rounded cards;
- large mandala image area;
- compact author row;
- elegant tags;
- calm readable typography;
- mobile one-column feed;
- desktop 2–3 column grid.

Avoid:

- oversized buttons;
- aggressive social counters;
- noisy Instagram-like clutter;
- publication of private technical/debug fields.

## 17. Implementation phases

### Phase 1 — Feed MVP

- Add `/feed` route.
- Add publication table/migration.
- Add client helper for publications.
- Add public feed page.
- Add `Опубликовать` draft action from saved mandalas/compositions.
- Add minimal admin moderation.

### Phase 2 — Public profile and services

- Add public master profile page or extend `/masters`.
- Add `Мои услуги` connection.
- Add public service pages and copyable links.
- Add stronger public-safe cover handling.

### Phase 3 — Community functions

- Favorites.
- Likes/reactions.
- Follows/subscriptions.
- Comments with moderation.
- Search and filters.
- Recommendations by tradition/channel/goal.

## 18. Implementation risks

Main risks:

- leaking private Storage refs or signed URLs;
- accidentally publishing private saved compositions;
- breaking existing Power Place save/reload flow;
- breaking Supabase RLS;
- breaking auth redirects;
- breaking `/profile/mandalas` layout;
- overbuilding social features too early;
- confusing production and legacy domains.

Mitigation:

- keep publication records separate from saved private items;
- default all new publications to `draft` or `pending`;
- public feed reads only approved records;
- use designed fallback cards when image safety is unclear;
- make minimal additive changes;
- run existing tests and manual QA.

## 19. Suggested Codex task prompt

```text
Repo: andylitvinov-design/reiki-yggdrasil
Target branch: codex/community-feed-mvp
Live URLs:
- target production: https://mentalica.vercel.app
- current/legacy: https://reiki-yggdrasil.vercel.app

Task:
Implement Phase 1 of the Community Feed MVP based on docs/product/COMMUNITY_FEED_CONCEPT.md.

Before changing code, read:
- AGENTS.md
- README.md
- STATE.md
- LOG.md
- docs/product/COMMUNITY_FEED_CONCEPT.md
- package.json
- vercel.json
- src/main.jsx
- src/index.css
- current route/page files
- current profile/mandala/power-place client files
- current Supabase migrations

Rules:
- preserve /, /profile, /profile/mandalas, /masters, /profile/admin;
- preserve RU-default UI;
- preserve desktop three-column layout and mobile fallback;
- do not rewrite the whole app;
- do not expose secrets or env values;
- do not expose private Storage refs or signed URLs publicly;
- keep saved mandalas private by default;
- create a separate publication layer for public feed records.

Minimum implementation:
1. Add /feed route.
2. Add public feed page with loading/empty/error states.
3. Add Supabase migration for publication records, aligned with existing schema conventions.
4. Add RLS so anon can read only published public_feed records.
5. Add publication client helper.
6. Add minimal “Опубликовать” action from saved mandala/composition if a safe existing saved item source is identified.
7. Add minimal admin pending-publication moderation only if it can be done without redesigning AdminPage.

Checks:
- npm install
- npm run check
- npm run build
- npm run test:profile-lite
- npm run test:power-place
- npm run test:profile-media
- npm run test:profile-loading-recovery

Manual QA:
- /
- /profile
- /profile/mandalas
- /feed
- /masters
- /profile/admin
- mobile below 980px
- no console errors

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

- exact current route file for adding `/feed`;
- whether `profile_cabinet_publications` already exists and can be reused;
- whether saved mandalas and Power Place compositions share a stable source ID;
- whether public-safe cover images already exist;
- how admin status is currently checked;
- whether `/masters` has a stable profile ID/public profile model;
- whether live production is currently `mentalica.vercel.app` or still legacy for user-facing QA.
