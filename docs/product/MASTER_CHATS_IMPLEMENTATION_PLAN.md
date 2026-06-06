# Master Chats Implementation Plan — кабинеты мастеров, услуги, продукты

Last updated: 2026-06-06  
Project: Reiki Yggdrasil / Mentalica  
Repo: `andylitvinov-design/reiki-yggdrasil`  
Live target: `https://mentalica.vercel.app`  
Legacy/current URL until migration verification: `https://reiki-yggdrasil.vercel.app`  
Normal target branch: `main`; do not push directly to `production`  
Status: product/technical plan + MVP branch notes  
Related draft PR: `#300` — `codex/master-chats-links-plan-mvp`  
Important recent merge: PR `#299` Public Master Page MVP is merged into `main`

## 1. Goal

Build chats between master cabinets so masters can communicate, collaborate, and quickly insert public-safe links to their services/products into a message.

The feature must connect three already emerging platform surfaces:

```text
Private master cabinet (/profile, /profile/chats)
↓
Public Master Page (/masters/:id)
↓
Service Shop (/shop, /services/:serviceId)
```

The first useful MVP should not try to become a full social network. It should solve one concrete workflow:

```text
Master A opens Chats
↓
chooses / creates conversation with Master B or client-facing thread later
↓
writes a message
↓
inserts link to own published service/product
↓
recipient receives a normal message containing a safe public URL
↓
recipient can open service page or master page
```

## 2. Product concept

### 2.1 What chat is in this platform

Chat is not only a generic messenger. It is a **commerce and collaboration layer** between:

- master profiles;
- public master pages;
- services;
- future products/artifacts;
- orders and client result delivery;
- grimoire/workshop materials.

A chat should eventually work like a small “business corridor” inside the master network:

```text
conversation
  messages
  shared links
  attached service cards
  attached product/artifact cards
  related orders
  related public master page
```

### 2.2 What the MVP should include

MVP should include only safe and additive items:

1. `/profile/chats` remains the private authenticated chat workspace.
2. Master can see existing conversations from `profile_cabinet_chat_*` tables.
3. Master can send a text message.
4. Master can insert a public link to own published service.
5. Service links use existing route `/services/:serviceId`.
6. The UI explicitly marks future products/artifacts as `needs verification` until there is a confirmed product table/route.

### 2.3 What the MVP should not include yet

Do not implement these in first merge unless explicitly approved:

- realtime subscriptions;
- file/image attachments inside chat;
- payments inside chat;
- unread counters and notifications;
- blocking/reporting;
- cross-master group chats;
- direct private media sharing;
- exposing `storage://`, signed URLs, bucket/path data, `object_refs`, or private composition JSON;
- product/artifact cards if their canonical table/route is not confirmed.

## 3. Current repo state after PR #299

### 3.1 Confirmed routes

`src/main.jsx` now routes:

```text
/                       public course home
/profile                private Profile Lite cabinet
/profile/mandalas       mandala workspace
/profile/services       services editor
/profile/orders         orders / client and master requests
/profile/chats          chats workspace
/profile/settings       settings
/profile/admin          admin moderation
/shop                   public service shop
/services/:serviceId    public service detail
/masters                public masters catalog
/masters/:id            public Master Page
/feed                   community feed
```

`vercel.json` also rewrites `/profile/chats`, `/shop`, `/services/:serviceId`, `/masters`, `/masters/:id`, `/feed`, and existing cabinet/admin routes to `/` for Vite SPA routing.

### 3.2 Public Master Page from PR #299

PR #299 added the first public Master Page MVP:

- route: `/masters/:id`;
- v1 identifier: `profile.id`;
- catalog route remains `/masters`;
- public page includes cover/header, avatar, action buttons, tabs, feed cards, and right rail;
- public data client: `src/lib/profilePublicMasterClient.js`;
- it reads approved profiles, approved publications, and published services;
- unsafe media refs are stripped before rendering.

This means chats should now link to two public surfaces:

```text
Master Page link: /masters/:profileId
Service link:     /services/:serviceId
```

### 3.3 Confirmed current chat files

Existing chat surface:

```text
src/pages/ProfileLitePage.jsx
src/pages/profile-lite/ProfileLiteChatsModule.jsx
src/lib/masterChatClient.js
vercel.json
```

Current chat client uses these table names:

```text
profile_cabinet_chat_conversations
profile_cabinet_chat_participants
profile_cabinet_chat_messages
profile_cabinet_chat_favorites
```

Current `ProfileLitePage.jsx` already imports:

```text
listOwnChatThreads
sendChatMessage
```

and loads chats together with business modules:

```text
listOwnServices(profile.id, session)
listClientServiceOrders(profile.id, session)
listOwnServiceOrders(profile.id, session)
listOwnChatThreads(profile.id, session)
```

The existing `ProfileLiteChatsModule.jsx` is mostly a display/send module. It does not yet give a robust master picker, conversation creation UI, link preview, product selector, or message metadata.

### 3.4 Confirmed service/shop files

Existing services/shop surface:

```text
src/lib/profileServicesClient.js
src/pages/profile-lite/ProfileLiteServicesModule.jsx
src/pages/PublicServicesPage.jsx
supabase/migrations/20260529090000_master_services_orders_mvp.sql
supabase/migrations/20260605153000_service_orders_client_phase4.sql
supabase/migrations/20260605184500_service_orders_result_delivery_phase5.sql
```

Confirmed service table:

```text
profile_cabinet_services
```

Important fields:

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
status
created_at
updated_at
```

Confirmed public rule: public can read only `status='published'` services from approved profiles.

Confirmed public service routes:

```text
/shop
/services/:serviceId
```

### 3.5 Products/artifacts status

There is no confirmed dedicated `profile_cabinet_products` or `profile_cabinet_artifacts` commerce table in the checked source.

There are “materials/publications” and “artifact” material type concepts in:

```text
profile_cabinet_publications
ProfileLiteMaterialsModule
Grimoire/materials flow
```

But a sellable “product” model is still `needs verification`.

Therefore the chat MVP should say:

```text
Услуги: confirmed, insert public /services/:serviceId links.
Продукты/артефакты: needs verification until product table + public route are confirmed.
```

## 4. Proposed architecture

### 4.1 Data objects

#### Conversations

A conversation is a private container.

```sql
profile_cabinet_chat_conversations
- id uuid primary key
- created_by_profile_id uuid references profile_cabinet_profiles(id)
- created_at timestamptz
- updated_at timestamptz
```

#### Participants

Participants define who can read/send in a conversation.

```sql
profile_cabinet_chat_participants
- conversation_id uuid references profile_cabinet_chat_conversations(id)
- profile_id uuid references profile_cabinet_profiles(id)
- created_at timestamptz
- primary key (conversation_id, profile_id)
```

#### Messages

MVP message is plain text only.

```sql
profile_cabinet_chat_messages
- id uuid primary key
- conversation_id uuid references profile_cabinet_chat_conversations(id)
- sender_profile_id uuid references profile_cabinet_profiles(id)
- body text
- created_at timestamptz
```

#### Favorites

Favorites are per-owner pinned conversations.

```sql
profile_cabinet_chat_favorites
- owner_profile_id uuid references profile_cabinet_profiles(id)
- conversation_id uuid references profile_cabinet_chat_conversations(id)
- created_at timestamptz
- primary key (owner_profile_id, conversation_id)
```

### 4.2 Message links in MVP

Do **not** add complex message attachment schema in first step.

MVP link insertion should be plain text:

```text
Посмотри мою услугу: <service title>
Описание: <service description>
Формат/цена: <price>
https://mentalica.vercel.app/services/<serviceId>
```

Reason:

- minimal schema risk;
- no extra RLS complexity;
- messages still work if frontend preview fails;
- public service page already controls safe rendering;
- future attachment cards can parse/upgrade links later.

### 4.3 Future message attachments

Only after text-link MVP is stable, add `metadata jsonb` or a separate `profile_cabinet_chat_message_links` table.

Recommended future table:

```sql
profile_cabinet_chat_message_links
- id uuid primary key
- message_id uuid references profile_cabinet_chat_messages(id) on delete cascade
- link_type text check in ('master_page', 'service', 'product', 'publication', 'order')
- target_table text
- target_id uuid
- public_url text
- title text
- description text
- image_url text
- created_at timestamptz
```

But this should wait, because products/artifacts are not yet confirmed and service links can work as text.

## 5. RLS/security model

### 5.1 Core rule

A user can read a conversation only if their own profile is a participant.

```text
auth.uid()
→ profile_cabinet_profiles.user_id
→ profile_cabinet_chat_participants.profile_id
→ conversation_id
```

### 5.2 Insert conversation

A user can create a conversation only for their own profile as creator.

```text
created_by_profile_id must belong to auth.uid()
```

### 5.3 Insert participants

For MVP direct 1:1 conversation:

- creator can add self;
- creator can add another `approved` profile;
- cannot add arbitrary non-approved profile except self;
- no public/anon insertion.

### 5.4 Insert messages

A message can be inserted only when:

- sender profile belongs to current auth user;
- sender profile is a participant of this conversation;
- body is not empty.

### 5.5 Link safety

MVP sends only public URLs. It must never expose:

```text
storage://
profile-cabinet-media
/storage/v1/object/sign
signedURL
image_bucket
image_path
object_refs
object_ref_urls
Bearer
anon key values
private composition JSON
```

If link previews are added later, preview data must come from public-safe clients only:

```text
profilePublicMasterClient.js
PublicServicesPage / profileServicesClient public service fetch
```

Do not read private composition/media tables for chat preview.

## 6. Frontend architecture

### 6.1 Keep components small

Do not grow `ProfileLitePage.jsx` much further. It is already large and orchestrates many modules.

Recommended split:

```text
src/lib/masterChatClient.js          existing Supabase REST chat client
src/lib/masterChatLinks.js           pure helpers for public links/share text
src/pages/profile-lite/ProfileLiteChatsModule.jsx
src/pages/profile-lite/chats/ChatThreadList.jsx         future
src/pages/profile-lite/chats/ChatMessageList.jsx        future
src/pages/profile-lite/chats/ChatComposer.jsx           future
src/pages/profile-lite/chats/ChatSharePanel.jsx         future
```

The first MVP can keep UI in `ProfileLiteChatsModule.jsx`, but the next iteration should split it.

### 6.2 Current MVP helper

`src/lib/masterChatLinks.js` should stay pure and testable:

```text
isPublishedShareableService(service)
buildServicePublicPath(service)
buildServicePublicUrl(service, origin)
buildServiceShareText(service, origin)
listShareableServices(services)
```

This allows tests without Supabase/browser.

### 6.3 Chat module UX

The chat page should use the established three-column cabinet pattern:

```text
left:   conversations / filters / favorites
center: message stream
right:  composer + share panel
```

Right rail should include:

```text
Сообщение
[textarea]
[Отправить]

Подтянуть ссылку
- Моя страница мастера (/masters/:profile.id)
- Опубликованные услуги (/services/:serviceId)
- Продукты/артефакты: needs verification
```

### 6.4 Master Page link insertion

Now that PR #299 added `/masters/:id`, add a button in chat share panel:

```text
Вставить ссылку на мою страницу мастера
```

Text example:

```text
Моя страница мастера:
https://mentalica.vercel.app/masters/<profile.id>
```

Use current origin in browser:

```js
window.location.origin
```

Do not hardcode production domain in frontend logic except as fallback in pure helpers/tests.

### 6.5 Service link insertion

Only list own published services:

```js
services.filter(service => service.status === 'published')
```

When clicked, append share text to the current draft.

Do not auto-send on insert. User must press `Отправить`.

### 6.6 Product/artifact link insertion

Wait until the repo confirms:

- table name;
- fields;
- public route;
- public-safe RLS;
- whether artifact is a publication, material, service, or separate product.

Possible future candidates:

```text
profile_cabinet_publications where type='artifact'
future profile_cabinet_products
future /products/:id
future /artifacts/:id
```

Until confirmed, show disabled/notice text:

```text
Продукты/артефакты: needs verification — нужна отдельная модель магазина продуктов.
```

## 7. Backend/migration plan

### 7.1 Add chat migration if not already present

Current code references `profile_cabinet_chat_*`, and migration runner checks their existence. But a dedicated chat migration was not found in the initial search.

Add one additive migration:

```text
supabase/migrations/20260606120000_master_chats_links_mvp.sql
```

It should create:

```text
profile_cabinet_chat_conversations
profile_cabinet_chat_participants
profile_cabinet_chat_messages
profile_cabinet_chat_favorites
```

and RLS policies described above.

### 7.2 Add migration to apply runner allowlist

Update:

```text
scripts/apply-reiki-supabase-migrations.mjs
```

Add:

```text
supabase/migrations/20260606120000_master_chats_links_mvp.sql
```

Also ensure `SCHEMA_CHECKS` and `schemaVerificationQuery()` include chat tables. Current script already contains checks for chat tables, so confirm the new migration is allowed.

### 7.3 README update

Update `README.md` Profile cabinet setup list with the chat migration after current service/order/feed/grimoire migrations.

Add a short section:

```text
Master chat setup:
- Apply master chats migration.
- Verify RLS with two approved test profiles.
- Verify /profile/chats loads threads and can send messages.
- Verify service link insertion uses public /services/:serviceId URL only.
```

## 8. Implementation phases

### Phase 1 — Safe link MVP

Scope:

- add `masterChatLinks.js` pure helper;
- add right-rail share panel in `ProfileLiteChatsModule.jsx`;
- insert own Master Page link;
- insert own published service links;
- keep message as text;
- no product table yet;
- no realtime;
- no private media.

Files:

```text
src/lib/masterChatLinks.js
src/pages/profile-lite/ProfileLiteChatsModule.jsx
test/masterChatLinks.test.mjs
```

Checks:

```bash
npm run test:profile-lite
npm run test:profile-services
npm run build
npm run check
git diff --check
```

### Phase 2 — DB/RLS stabilization

Scope:

- add or verify chat migration;
- add migration allowlist entry;
- update README;
- test with two approved profiles;
- verify conversation creation and message insert.

Files:

```text
supabase/migrations/20260606120000_master_chats_links_mvp.sql
scripts/apply-reiki-supabase-migrations.mjs
README.md
src/lib/masterChatClient.js
```

Checks:

```bash
npm run check
npm run supabase:migrations:apply  # only with configured secret vault, no env values printed
```

Live/staging QA:

```text
/profile/chats
/profile/services
/services/:serviceId
/masters/:id
```

### Phase 3 — Start conversations from public Master Page

Scope:

- add CTA on `/masters/:id`: `Написать мастеру`;
- authenticated users go to `/profile/chats?master=<profileId>`;
- if no auth, prompt login and preserve target;
- `ProfileLitePage` reads query and starts/opens conversation via `createConversationWithMaster`.

Files:

```text
src/pages/MasterPublicPage.jsx
src/pages/masters/MasterPageHeader.jsx
src/lib/masterChatClient.js
src/pages/ProfileLitePage.jsx
src/pages/profile-lite/ProfileLiteChatsModule.jsx
```

Risks:

- must not create duplicate conversations;
- must not allow self-chat;
- must not allow chat with non-approved profile except own existing private contexts.

### Phase 4 — Link previews/cards

Scope:

- render detected internal links as small cards inside chat messages;
- still store plain text;
- parse only same-origin `/masters/:id` and `/services/:serviceId`;
- fetch preview data only from public-safe endpoints or already loaded data.

Future files:

```text
src/lib/masterChatLinkPreview.js
src/pages/profile-lite/chats/ChatLinkPreviewCard.jsx
```

### Phase 5 — Products/artifacts

Start only after product model is confirmed.

Decisions needed:

```text
Is artifact a product?
Is product a service with different type?
Is product a publication with type='artifact'?
Does it need order/cart/payment?
What is the public route?
```

Possible future schema:

```text
profile_cabinet_products
/products/:productId
```

or reuse:

```text
profile_cabinet_services with service_type='artifact' / 'digital_product'
```

Do not guess before repo/product decision.

## 9. UX details

### 9.1 Empty chat state

If no conversations:

```text
Чаты пока не найдены.
Вы можете начать диалог со страницы мастера или после выбора мастера из списка.
```

Future action:

```text
[Найти мастера]
```

### 9.2 Share panel copy

Use RU-default:

```text
Подтянуть ссылку
Вставьте в сообщение публичную ссылку на опубликованную услугу.
Моя страница мастера
Опубликованные услуги
Продукты/артефакты: needs verification
```

### 9.3 Safe disabled states

- Send button disabled if no selected thread.
- Service link list empty if no published services.
- Product buttons disabled until product model exists.
- If Supabase not configured, show existing `needs verification` notice; do not crash cabinet.

## 10. Tests to add

### 10.1 Pure helper tests

Create:

```text
test/masterChatLinks.test.mjs
```

Test:

- `listShareableServices` returns only `status='published'` with id;
- `buildServicePublicPath` encodes ids;
- `buildServicePublicUrl` uses passed origin and strips trailing slash;
- `buildServiceShareText` includes title, description, price, URL;
- draft/non-id services return empty share text.

### 10.2 Route/contract tests

Update existing route tests if needed:

```text
test/profileLiteRoute.test.mjs
```

Confirm:

```text
/profile/chats -> initialTab chats
/masters/:id route exists
/services/:serviceId route remains intact
```

### 10.3 Security text scan

Add or extend UI scan to ensure chat page does not render private refs:

```text
storage://
profile-cabinet-media
/storage/v1/object/sign
signedURL
object_refs
Bearer
```

## 11. Acceptance criteria

MVP is done when:

- `/profile/chats` renders without console errors;
- existing threads still load if chat tables/RLS exist;
- user can send a normal message to selected thread;
- right rail shows own published services;
- clicking a service appends public share text to draft;
- share text contains `/services/:serviceId`, not private storage or composition data;
- `/services/:serviceId` still opens public service page;
- `/masters/:id` remains working from PR #299;
- mobile below 980px remains usable;
- desktop layout remains within accepted cabinet structure;
- `npm run check` passes with only known existing warnings;
- Supabase migration status is reported as verified or `needs verification`.

## 12. Risks

### 12.1 Current risks

- PR #300 was initially branched while PR #299 was being merged. It must be rebased or recreated from current `main` before merge.
- Chat client references chat tables, but the actual live Supabase schema application is `needs verification`.
- Migration runner allowlist must include any new migration before using automated apply.
- Real two-user chat QA requires at least two approved profiles in staging/live.
- Product/artifact commerce model is not confirmed.

### 12.2 What must not be changed

Do not break:

```text
/
/profile
/profile/mandalas
/profile/services
/profile/orders
/profile/chats
/masters
/masters/:id
/shop
/services/:serviceId
/profile/admin
/feed
```

Do not change:

```text
VITE_SUPABASE_URL values
VITE_SUPABASE_ANON_KEY values
VITE_ADMIN_EMAIL values
Vercel production domains
Supabase service-role keys
private storage policies for media
public home page layout unless explicitly requested
```

Do not expose:

```text
env values
private media refs
signed URLs
private mandala object refs
client photos
order private data
```

## 13. Codex implementation prompt

Use this prompt for the next coding pass:

```text
Repo: andylitvinov-design/reiki-yggdrasil
Target branch: create a fresh branch from current origin/main, e.g. codex/master-chats-links-mvp-rebased
Live target: https://mentalica.vercel.app
Legacy/current URL: https://reiki-yggdrasil.vercel.app

Task:
Implement the safe MVP for master chats with public service/master-page link insertion, using docs/product/MASTER_CHATS_IMPLEMENTATION_PLAN.md as the source of truth. PR #299 Public Master Page MVP is already merged into main, so base all work on current origin/main, not the old PR #300 base.

Read first:
1. AGENTS.md
2. README.md
3. STATE.md
4. LOG.md
5. docs/product/MASTER_CABINET_PLATFORM_STRUCTURE.md
6. docs/product/MASTER_CHATS_IMPLEMENTATION_PLAN.md
7. src/main.jsx
8. vercel.json
9. src/pages/ProfileLitePage.jsx
10. src/pages/profile-lite/ProfileLiteChatsModule.jsx
11. src/lib/masterChatClient.js
12. src/lib/profilePublicMasterClient.js
13. src/lib/profileServicesClient.js
14. src/pages/MasterPublicPage.jsx
15. src/pages/PublicServicesPage.jsx
16. scripts/apply-reiki-supabase-migrations.mjs
17. package.json

Implement minimal safe changes:
- Add pure helper src/lib/masterChatLinks.js.
- Add/finish share panel in src/pages/profile-lite/ProfileLiteChatsModule.jsx.
- Insert current user's public Master Page link: /masters/:profile.id.
- Insert current user's published service links: /services/:serviceId.
- Keep messages plain text; do not add attachments or realtime.
- Add test/masterChatLinks.test.mjs.
- Add npm script if needed or include test in existing check only if stable.
- If chat tables migration is missing, add additive migration supabase/migrations/20260606120000_master_chats_links_mvp.sql.
- Add the new migration to scripts/apply-reiki-supabase-migrations.mjs allowlist.
- Update README Master chat setup section.
- Update STATE.md/LOG.md with concise implementation notes.

Do not change:
- public homepage unless required by routing bug;
- RU-default interface;
- existing routes;
- Supabase env values;
- Vercel production domains;
- private storage/media RLS;
- existing service/order flows.

Security rules:
- Chat share panel may only generate public URLs.
- Do not expose storage://, profile-cabinet-media, signed URLs, bucket/path fields, object_refs, object_ref_urls, Bearer tokens, env values, client photos, or private composition JSON.
- Products/artifacts must remain needs verification unless a canonical product table and public route are confirmed in repo.

Checks:
- npm install if needed
- npm run test:profile-lite
- npm run test:profile-services
- npm run test:public-master
- node test/masterChatLinks.test.mjs
- npm run build
- npm run check
- git diff --check

Browser QA:
- /profile/chats desktop 1280x920 and mobile 390x900
- /profile/services
- /services/:serviceId with an existing/demo published service if possible
- /masters
- /masters/:id
- /profile/admin
- Check horizontal overflow = 0 and console errors = 0.
- DOM/text scan for forbidden private markers.

Report format:
- branch
- PR number
- changed files
- implementation summary
- checks run and exact results
- browser QA results
- Supabase migration status: applied / not applied / needs verification
- what was not verified
- risks
- whether STATE.md/LOG.md were updated
```

## 14. Current PR #300 notes

Draft PR #300 currently started the MVP but must be treated carefully because PR #299 was merged into `main` during the same work window.

Current PR #300 intent:

- `src/lib/masterChatLinks.js` — helper for published service links;
- `src/pages/profile-lite/ProfileLiteChatsModule.jsx` — right rail share panel;
- `supabase/migrations/20260606120000_master_chats_links_mvp.sql` — additive chat tables/RLS migration;
- this document.

Before merge, PR #300 must be rebased or recreated from current `main` and completed with tests, README, migration allowlist, checks, and browser QA.
