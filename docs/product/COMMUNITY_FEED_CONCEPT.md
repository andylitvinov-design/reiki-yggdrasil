# Community Activity Feed Concept — Reiki Yggdrasil / Mentalica

Last updated: 2026-06-05

## 1. Purpose

Reiki Yggdrasil / Mentalica should evolve from a personal learning/cabinet site into a living community of masters and students.

The main community mechanism should be a **news/activity feed**. It should show what is happening inside the community:

- masters publish updates;
- new mandalas are created and optionally published;
- new Power Place compositions appear;
- masters upload public-safe photos/albums;
- services are created or updated;
- practices, rituals, course notes, and announcements are published;
- master profiles are updated;
- admin/highlighted platform news appears when needed.

The product metaphor is not a direct Instagram clone. The goal is a ritual, educational, and community-based activity stream where mandalas, practices, services, photos, and master updates become visible as a shared field of work.

## 2. Product vision

The site should support four connected layers:

1. **Private cabinet** — user creates and stores personal mandalas, photos, reports, and Power Place compositions.
2. **Public profile** — master/student presents selected works, services, description, and contact/action links.
3. **Public portfolio / gallery** — selected public mandalas, public photos, public services, and practices.
4. **Community activity feed** — public and filtered stream of approved activity events from masters and users.

The feed should feel like a beautiful spiritual/artistic news space:

- visual cards with mandalas/photos/services;
- clear author identity;
- short meaning/description;
- type and category filters;
- tags and traditions;
- links to public master/service/item pages;
- mobile-first reading flow;
- desktop grid/list hybrid for discovery.

## 3. Existing project boundary

Canonical repo: `andylitvinov-design/reiki-yggdrasil`.

Target production URL: `https://mentalica.vercel.app`.

Current/legacy live URL until migration is verified: `https://reiki-yggdrasil.vercel.app`.

Framework/hosting: Vite + React on Vercel.

Current release concept:

- `main` → draft/test site for owner QA, expected Vercel project `2mentalica`, expected URL `https://2mentalica.vercel.app`;
- `production` → clean/client live site for stable client access;
- `release/*` → frozen release branches created from `main` after owner QA and merged into `production` after final checks.

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

## 4. Core product idea

The feed should not only show final publications. It should show **events**.

Examples:

```text
Мастер Андрей опубликовал новую мандалу
Мастер София загрузила 6 фото в альбом “Алтарь Рун”
Мастер Михаил обновил услугу “Мандала места силы”
В кабинете появилась новая практика по ДАО
Мастер добавил новый пост: “Как работать с мандалой защиты”
Администрация опубликовала новость курса
```

This means the product needs two connected concepts:

1. **Publication object** — the actual public item: mandala, service, photo album, practice, post.
2. **Activity event** — a feed record that announces what happened: created, published, updated, uploaded, featured.

Important:

A private cabinet action should not automatically become public. Only public-safe, user-approved, and moderation-approved events should appear in the public feed.

## 5. Core user roles

### 5.1 Visitor

A visitor can:

- open the public feed;
- filter the feed by type/category/master/tradition;
- view published mandalas/services/practices/photos;
- open public master profiles;
- discover public work without login.

A visitor cannot:

- see private drafts;
- see private saved compositions;
- see private storage refs or signed URLs;
- see private uploaded photos;
- create or publish content.

### 5.2 Authenticated user / student / master

An authenticated user can:

- create and save mandalas privately;
- create Power Place compositions;
- upload photos privately;
- choose which items become public;
- create public news/update posts;
- create public photo albums if supported;
- create a publication draft from a saved item;
- edit title, description, tags, category, and visibility;
- submit a publication/activity event for moderation;
- publish selected works as services if approved by the product flow;
- manage own drafts and published items.

### 5.3 Admin / moderator

An admin can:

- see pending publications and activity events;
- approve/reject/archive items;
- add moderation notes;
- feature selected events;
- protect public feed quality and privacy.

## 6. Feed as activity stream

The feed should be based on activity/event types.

Recommended activity types:

```text
master_update
mandala_created
mandala_published
power_place_created
power_place_published
photo_uploaded
photo_album_published
service_created
service_updated
practice_published
ritual_published
course_note_published
profile_updated
admin_announcement
featured_item
```

For MVP, the safest first set:

```text
master_update
mandala_published
power_place_published
photo_album_published
service_created
service_updated
practice_published
admin_announcement
```

Avoid public `mandala_created`, `power_place_created`, and `photo_uploaded` until privacy rules are very clear. These can exist as private/user-only feed events later, but should not be public by default.

## 7. Content object types

Recommended content object types:

```text
mandala
power_place
photo
photo_album
service
practice
ritual
course_note
master_post
admin_post
```

A feed event can point to one object:

```text
activity_event.target_type = 'mandala'
activity_event.target_id = '<mandala publication id>'
```

Or it can be standalone:

```text
activity_event.type = 'master_update'
activity_event.body = 'Сегодня я добавил новую практику...'
```

## 8. Feed filters

The feed needs filters so users can decide exactly what they want to see.

### 8.1 Top-level filters

Recommended top-level tabs:

```text
Все
Новости мастеров
Мандалы
Места силы
Фото
Услуги
Практики
Объявления
Избранное
```

MVP top-level tabs:

```text
Все
Новости
Мандалы
Фото
Услуги
Практики
```

### 8.2 Activity type filters

Advanced filter drawer:

```text
Тип события:
- Новые публикации
- Обновления мастеров
- Созданные мандалы
- Опубликованные мандалы
- Загруженные фото
- Фотоальбомы
- Новые услуги
- Обновления услуг
- Новые практики
- Объявления
```

Public MVP should include only public-safe events:

```text
Опубликованные мандалы
Опубликованные места силы
Публичные фотоальбомы
Новые услуги
Обновления услуг
Новости мастеров
Практики
Объявления
```

### 8.3 Category filters

Recommended categories:

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

These categories should be configurable later. MVP can use static arrays in frontend or enum-like text fields in DB.

### 8.4 Author/master filters

Users should be able to filter by:

```text
Все мастера
Мои подписки — future
Конкретный мастер
Администрация
```

URL examples:

```text
/feed?author=<profile_id>
/feed?type=service
/feed?category=dao
/feed?activity=photo_album_published
```

### 8.5 Visibility filters for logged-in user

For authenticated user’s own cabinet/feed management:

```text
Публичные
На модерации
Черновики
Отклонённые
Архив
```

These should not be visible to anonymous visitors.

## 9. Feed UX

Recommended route:

```text
/feed
```

Recommended navigation label:

```text
Лента
```

Recommended page structure:

```text
Header:
  Лента сообщества
  short subtitle

Filter bar:
  Все / Новости / Мандалы / Фото / Услуги / Практики

Secondary filters:
  Категория / Мастер / Период / Статус for own items

Feed body:
  cards list/grid

Right/desktop optional:
  Featured masters
  Popular categories
  New services
```

Mobile:

- sticky compact filter bar;
- one-column cards;
- filter drawer/modal for advanced filters;
- no horizontal overflow.

Desktop:

- 2-column or 3-column visual grid for media-heavy feed;
- optional list mode for news updates;
- compact right sidebar only if it does not interfere with existing accepted layouts.

## 10. Feed card types

### 10.1 Master update card

Used for text/news updates.

Content:

- author avatar/name;
- label: `Новость мастера`;
- title;
- text preview;
- optional image;
- tags;
- date;
- CTA: `Открыть`, `К мастеру`.

### 10.2 Mandala card

Used for published mandalas.

Content:

- mandala image or fallback;
- label: `Мандала`;
- title;
- author;
- short meaning/description;
- tradition/category tags;
- date;
- CTA: `Открыть`, `К мастеру`.

### 10.3 Power Place card

Used for published Power Place compositions.

Content:

- composition cover or fallback;
- label: `Место силы`;
- title;
- author;
- goal/intention preview if public-safe;
- category/tags;
- date;
- CTA: `Открыть`, `К мастеру`.

### 10.4 Photo album card

Used for public photo uploads/albums.

Content:

- album cover;
- small count: `6 фото`;
- label: `Фотоальбом`;
- title;
- author;
- short description;
- category/tags;
- date;
- CTA: `Смотреть`, `К мастеру`.

Important:

Single raw photo uploads should not appear publicly by default. Prefer albums or explicitly public photos.

### 10.5 Service card

Used for service creation/update.

Content:

- cover image or fallback;
- label: `Услуга`;
- service title;
- author/master;
- short offer text;
- payment note if public-safe and supported;
- CTA: `Подробнее`, `К мастеру`, `Скопировать ссылку` later.

### 10.6 Practice card

Used for public practice/course note/ritual.

Content:

- label: `Практика`;
- title;
- author/admin;
- preview text;
- tradition/category;
- date;
- CTA: `Открыть`.

### 10.7 Admin announcement card

Used for platform/course announcements.

Content:

- label: `Объявление`;
- title;
- body preview;
- date;
- optional CTA.

## 11. Publication lifecycle

Recommended public flow:

```text
Create/edit private item
↓
Choose “Опубликовать” or “Добавить в ленту”
↓
Create public draft
↓
Choose event type/category/visibility
↓
Add public title, description, cover
↓
Submit for moderation
↓
Admin approves/rejects
↓
Activity event appears in /feed
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
followers_only_future
```

Important rule:

A saved mandala/composition/photo stays private by default. A public feed item should be a separate publication/event record that references or safely copies only public-safe fields.

## 12. Public/private model

The system should separate:

1. **Private source item** — saved composition/photo/report in user cabinet.
2. **Public publication** — curated public representation of the item.
3. **Activity event** — feed announcement that points to the public publication.

Example:

```text
Private saved composition:
  profile_power_place_compositions.id = abc
  private object_refs / storage refs / reports

Public publication:
  profile_publications.id = pub123
  source_type = power_place
  source_id = abc
  public title/description/fallback cover
  no private refs

Feed event:
  profile_activity_events.id = evt123
  activity_type = power_place_published
  target_type = publication
  target_id = pub123
  status = published
```

## 13. Data model proposal

Before implementation, inspect existing Supabase migrations and reuse current naming conventions if an equivalent publication table already exists.

### 13.1 Publications table

A possible public publication table:

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
  subcategory text null,
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
source_type in ('mandala', 'power_place', 'photo_album', 'service', 'practice', 'master_post', 'admin_post')
visibility in ('private', 'profile_only', 'public_feed')
status in ('draft', 'pending', 'published', 'rejected', 'archived')
```

### 13.2 Activity events table

A possible activity table:

```sql
create table public.profile_activity_events (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references auth.users(id) on delete set null,
  publication_id uuid references public.profile_publications(id) on delete cascade,
  activity_type text not null,
  target_type text null,
  target_id uuid null,
  title text not null,
  body text null,
  image_ref text null,
  image_public_url text null,
  category text null,
  subcategory text null,
  tags text[] not null default '{}',
  status text not null default 'draft',
  visibility text not null default 'private',
  is_featured boolean not null default false,
  event_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

Suggested constraints:

```sql
activity_type in (
  'master_update',
  'mandala_published',
  'power_place_published',
  'photo_album_published',
  'service_created',
  'service_updated',
  'practice_published',
  'admin_announcement',
  'featured_item'
)
visibility in ('private', 'profile_only', 'public_feed')
status in ('draft', 'pending', 'published', 'rejected', 'archived')
```

### 13.3 Optional event settings

Later, user profile can have feed settings:

```text
auto_create_private_activity_events: boolean
default_publication_visibility: private/profile_only/public_feed
notify_followers_on_publish: boolean future
```

Do not add this in MVP unless needed.

## 14. RLS / privacy rules

The key safety rule:

Public users can read only approved public records. They must never read private drafts, private uploaded photos, private storage refs, or signed URLs.

Recommended RLS rules:

- authenticated users can create own drafts;
- authenticated users can read/update own drafts and pending publications/events;
- public/anon can read only `status = 'published'` and `visibility = 'public_feed'`;
- admin can read pending publications/events and approve/reject/archive;
- public feed should not expose private signed URLs, client photos, private reports, private user notes, or raw owner-only Storage paths.

Specific photo rule:

- `photo_uploaded` events are private by default;
- public feed can show only `photo_album_published` or explicitly public-safe photo publications;
- local `data:image` previews must never be saved into public records.

## 15. Storage and image safety

The current project uses private Storage refs and signed URLs for cabinet media.

Do not publish raw private media paths or signed URLs as permanent public content.

Safe options:

1. Use only public-safe cover assets.
2. Generate/store a public-safe cover copy if the product decides to support it later.
3. Create a `public_cover_ref` abstraction that resolves only safe images.
4. If no safe cover is available, show a designed fallback card.

Never expose:

- private client photos;
- private report content;
- owner-only storage refs;
- temporary signed URLs as stable public data;
- local `data:image` previews as public feed content.

## 16. Cabinet UX

### 16.1 In “Мои мандалы”

Each saved item can eventually show actions:

```text
Открыть
Редактировать
Опубликовать
Добавить в ленту
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
- category;
- tags;
- visibility;
- submit button: `Отправить на публикацию`.

### 16.2 In uploaded photos

Private uploaded photos should remain private by default.

Possible actions:

```text
Сделать обложкой
Добавить в публичный альбом
Опубликовать альбом
Скрыть из ленты
```

MVP should avoid single-photo public feed spam. Prefer album-level publication.

### 16.3 In “Новости мастера”

Add a simple future module:

```text
Мои новости
```

Fields:

- title;
- body;
- optional image;
- category;
- visibility;
- submit for moderation.

This is the clean way for masters to post updates not tied to a mandala/service.

## 17. Services layer

A publication can become a service.

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
Activity event appears: service_created or service_updated
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

## 18. Admin moderation UX

In `/profile/admin`, add a minimal section:

```text
Публикации и события на модерации
```

Each pending item should show:

- type/event label;
- title;
- author;
- target object type;
- cover/fallback;
- description/body preview;
- category/tags;
- created date;
- buttons:
  - `Одобрить`
  - `Отклонить`
  - `Архивировать` — optional.

MVP moderation can be simple. Do not redesign the whole admin page.

Admin should be able to approve:

- publication object;
- activity event;
- or both together if they are created as a pair.

## 19. Public master profile integration

The existing `/masters` catalog can later show:

- latest public activity;
- latest published mandalas;
- photo albums;
- service count;
- button `Публикации`;
- button `Услуги`.

MVP should not force a large `/masters` redesign.

Safe first integration:

- keep `/masters` intact;
- optionally add a small link to `/feed?author=<id>` later;
- add public profile pages only after `/feed` is stable.

## 20. Visual design direction

The feed should look like a refined ritual/art community, not a noisy social app.

Recommended style:

- soft mystic background;
- gold/cream accents;
- rounded cards;
- large mandala/photo area where needed;
- compact author row;
- elegant tags;
- clear event labels;
- calm readable typography;
- mobile one-column feed;
- desktop 2–3 column grid or mixed list/grid.

Avoid:

- oversized buttons;
- aggressive social counters;
- noisy Instagram-like clutter;
- publication of private technical/debug fields;
- automatic public exposure of every upload/save action.

## 21. Implementation phases

### Phase 1 — Activity Feed MVP

- Add `/feed` route.
- Add `profile_publications` table/migration if no equivalent exists.
- Add `profile_activity_events` table/migration if no equivalent exists.
- Add client helper for feed events/publications.
- Add public feed page.
- Add filters: `Все`, `Новости`, `Мандалы`, `Фото`, `Услуги`, `Практики`.
- Add `Опубликовать` draft action from saved mandalas/compositions only if safe source IDs exist.
- Add basic master update/admin announcement support if low risk.
- Add minimal admin moderation.

### Phase 2 — Public photos and albums

- Add public photo album model.
- Add action from uploaded photos: `Добавить в публичный альбом`.
- Add public-safe album covers.
- Add `Фото` feed filter.
- Keep raw private uploads hidden.

### Phase 3 — Public profile and services

- Add public master profile page or extend `/masters`.
- Add `Мои услуги` connection.
- Add public service pages and copyable links.
- Add stronger public-safe cover handling.

### Phase 4 — Community functions

- Favorites.
- Likes/reactions.
- Follows/subscriptions.
- Comments with moderation.
- Search and advanced filters.
- Recommendations by tradition/channel/goal.

## 22. Implementation risks

Main risks:

- leaking private Storage refs or signed URLs;
- accidentally publishing private saved compositions;
- exposing private uploaded photos;
- feed spam from every tiny private save/upload;
- breaking existing Power Place save/reload flow;
- breaking Supabase RLS;
- breaking auth redirects;
- breaking `/profile/mandalas` layout;
- overbuilding social features too early;
- confusing production, test, and legacy domains.

Mitigation:

- keep publication records separate from saved private items;
- keep activity events separate from publication objects;
- default all new publication/events to `draft` or `pending`;
- public feed reads only approved records;
- use designed fallback cards when image safety is unclear;
- make minimal additive changes;
- run existing tests and manual QA.

## 23. Suggested Codex task prompt

```text
Repo: andylitvinov-design/reiki-yggdrasil
Target branch: codex/community-activity-feed-mvp
Live URLs:
- test/owner QA target: https://2mentalica.vercel.app — needs verification from Vercel
- target production/client live: https://mentalica.vercel.app
- current/legacy: https://reiki-yggdrasil.vercel.app

Task:
Implement Phase 1 of the Community Activity Feed MVP based on docs/product/COMMUNITY_FEED_CONCEPT.md.

Before changing code, read:
- AGENTS.md
- README.md
- STATE.md
- LOG.md
- docs/release-workflow.md
- docs/product/COMMUNITY_FEED_CONCEPT.md
- package.json
- vercel.json
- src/main.jsx
- src/index.css
- current route/page files
- current profile/mandala/power-place client files
- current media upload client files
- current Supabase migrations

Rules:
- preserve /, /profile, /profile/mandalas, /masters, /profile/admin;
- preserve RU-default UI;
- preserve desktop three-column layout and mobile fallback;
- do not rewrite the whole app;
- do not expose secrets or env values;
- do not expose private Storage refs or signed URLs publicly;
- do not expose private uploaded photos;
- keep saved mandalas/photos private by default;
- create a separate publication layer for public records;
- create a separate activity-event layer for feed records;
- public feed must read only approved public events.

Minimum implementation:
1. Add /feed route.
2. Add public activity feed page with loading/empty/error states.
3. Add filter tabs:
   - Все
   - Новости
   - Мандалы
   - Фото
   - Услуги
   - Практики
4. Add Supabase migration for publication/activity records, aligned with existing schema conventions.
5. Add RLS so anon can read only status='published' and visibility='public_feed'.
6. Add feed/publication client helper.
7. Add a safe draft “Опубликовать” action from saved mandala/composition only if a stable saved source ID and public-safe payload are confirmed.
8. Add minimal master update/admin announcement support if low risk.
9. Add minimal admin pending-publication/event moderation only if it can be done without redesigning AdminPage.
10. Do not publish single raw photo uploads in MVP; only support photo album/public-safe photo event if current media model allows it safely.

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
- no horizontal overflow
- no console errors
- anonymous user can see only public approved feed events
- authenticated user cannot see other users' drafts/private uploads

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

## 24. Open questions / needs verification

Before implementation, verify:

- exact current route file for adding `/feed`;
- whether `profile_cabinet_publications` or similar table already exists and can be reused;
- whether saved mandalas and Power Place compositions share a stable source ID;
- whether uploaded photos have an album/group model or only raw private uploads;
- whether public-safe cover images already exist;
- how admin status is currently checked;
- whether `/masters` has a stable profile ID/public profile model;
- whether live production is currently `mentalica.vercel.app`, `2mentalica.vercel.app`, or legacy for user-facing QA;
- whether master updates should require moderation before public visibility;
- whether public photo albums are part of MVP or Phase 2.
