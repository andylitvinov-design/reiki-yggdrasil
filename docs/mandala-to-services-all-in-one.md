# Mandala Services Shop — All-In-One Implementation Brief

Last updated: 2026-06-02

Status: single canonical implementation brief for Codex. This file consolidates the product program, professional spec, engineering guardrails, and `/goal` quality target so agents do not need to resolve multiple docs.

Repo: `andylitvinov-design/reiki-yggdrasil`

Live: `https://mentalica.vercel.app`

Legacy: `https://reiki-yggdrasil.vercel.app`

---

## 1. Goal

Implement the full product program:

```text
master mandala
→ service template
→ published service in public shop
→ one-service cart
→ client order
→ personal client photo selection/upload
→ master request
→ personal client mandala result
→ result sent to client
→ client opens/downloads result
```

Implementation must be phased. Do not implement all phases in one PR.

---

## 2. Recovery-first rule

Codex must use this single file as the primary source of truth:

```text
docs/mandala-to-services-all-in-one.md
```

If older separate docs are missing locally, do not block implementation if this all-in-one file exists and is non-empty.

Older supporting docs may exist but are no longer required for Phase 1 planning:

```text
docs/mandala-to-services-implementation-program.md
docs/mandala-to-services-professional-spec.md
docs/mandala-to-services-engineering-guardrails.md
docs/mandala-to-services-goal.md
```

If this all-in-one file is missing or empty in a clean worktree, restore it from GitHub raw before implementation.

Raw URL:

```text
https://raw.githubusercontent.com/andylitvinov-design/reiki-yggdrasil/main/docs/mandala-to-services-all-in-one.md
```

---

## 3. Clean worktree rule

Do not work in an existing dirty checkout.

Do not touch old dirty/untracked file:

```text
profile-lite-report-mobile-390.png
```

Start from a clean worktree:

```bash
git fetch origin --prune
git worktree add ../reiki-yggdrasil-mandala-services origin/main
cd ../reiki-yggdrasil-mandala-services
git switch -c codex/mandala-services-phase1
```

Verify:

```bash
test -s docs/mandala-to-services-all-in-one.md
```

If missing, restore:

```bash
mkdir -p docs
curl -fsSL https://raw.githubusercontent.com/andylitvinov-design/reiki-yggdrasil/main/docs/mandala-to-services-all-in-one.md -o docs/mandala-to-services-all-in-one.md
test -s docs/mandala-to-services-all-in-one.md
```

If still missing or empty, stop and report. Do not implement from memory.

---

## 4. Files to read before code

Read:

```text
AGENTS.md
README.md
STATE.md
LOG.md
package.json
vercel.json
docs/mandala-to-services-all-in-one.md
scripts/apply-master-services-orders-mvp.mjs
src/pages/ProfileLitePage.jsx
src/pages/profile-lite/ProfileLitePowerPlaceModule.jsx
src/pages/profile-lite/ProfileLiteServicesModule.jsx
src/lib/profileServicesClient.js
src/lib/powerPlaceClient.js
src/lib/profileMediaClient.js
supabase/migrations/20260529090000_master_services_orders_mvp.sql
```

If a repo-local file is missing, report `not found`.

---

## 5. Product decisions

### 5.1. One profile, two cabinet modes

One Google/auth user has one `profile_cabinet_profiles.id`.

The same profile can act as client and master:

```text
client_profile_id → profile_cabinet_profiles.id
master_profile_id → profile_cabinet_profiles.id
```

Modes:

```text
Кабинет Личный
  → Мои Заказы
  → Мои Фото

Кабинет Мастера
  → Мандалы
  → Услуги
  → Заявки
```

### 5.2. Service is a reusable template

A service is a reusable mandala template, not the client result.

```text
master template composition
→ profile_cabinet_services.composition_id
→ client order
→ personal client result composition
```

Never overwrite the template composition when creating a client result.

### 5.3. Public link timing

Public link appears only after publication.

```text
draft → no active public link; show Ссылка появится после публикации.
published → active public link if route exists.
archived → no public link.
```

If `/services/:serviceId` route is not implemented, do not show fake copy link. Show dependency message instead.

### 5.4. Cart MVP

Cart MVP supports one service only.

```text
adding a new service replaces existing cart item
multi-item cart later
```

### 5.5. Client photos

Client can have up to 4 saved photos in personal cabinet.

Rules:

```text
- client can choose existing photo for order;
- client can upload a new photo if under limit;
- if 4 photos already exist, upload disabled;
- photo selected/uploaded in Кабинет Личный → Мои Заказы;
- do not require photo before cart checkout.
```

### 5.6. Default price

Default price is free:

```text
price_amount = null or 0
price_currency = EUR
label = Бесплатно
```

---

## 6. Data model

### 6.1. Mandalas/compositions

Table:

```text
profile_cabinet_power_place_compositions
```

Used for:

```text
master template mandalas
personal client draft/final result mandalas
```

Important rule:

```text
template composition must never be overwritten by result generation
```

### 6.2. Services

Table:

```text
profile_cabinet_services
```

Statuses:

```text
draft      → master-only draft
published  → public shop + public link
archived   → hidden from public
```

Core link:

```text
profile_cabinet_services.composition_id → template composition id
```

### 6.3. Orders

Table:

```text
profile_cabinet_service_orders
```

Final target fields:

```text
client_profile_id
master_profile_id
service_id
order_format
goal_text
comment_text
attachment_refs
template_composition_id
client_photo_bucket
client_photo_path
client_photo_url
draft_result_composition_id
auto_result_composition_id
master_result_composition_id
final_result_composition_id
master_comment
status
submitted_at
sent_at
```

MVP minimal later fields:

```text
client_profile_id
order_format
template_composition_id
draft_result_composition_id
final_result_composition_id
```

---

## 7. Status model

### Service statuses

```text
draft
published
archived
```

### Order statuses

Recommended later statuses:

```text
draft
photo_required
new
in_progress
ready_for_review
sent
closed
cancelled
```

Meaning:

```text
draft → not submitted to master
photo_required → client must select/upload photo
new → client sent order to master
in_progress → master started work
ready_for_review → draft personal mandala generated
sent → result sent to client
closed → completed
cancelled → cancelled later
```

---

## 8. Phase plan

### Phase 1 — Mandala to service template bridge

Scope:

```text
/profile/mandalas
/profile/services
```

Allowed files:

```text
src/pages/ProfileLitePage.jsx
src/pages/profile-lite/ProfileLitePowerPlaceModule.jsx
src/pages/profile-lite/ProfileLiteServicesModule.jsx
src/lib/profileServicesClient.js
test/profileLiteCabinetContract.test.mjs
test/profileServicesClient.test.mjs
STATE.md
LOG.md
```

Do:

```text
- add three mandala buttons;
- save composition;
- create/open draft service;
- publish service;
- group services by status;
- show publication/link state;
- free default price.
```

Do not do Phase 1:

```text
cart
checkout
orders
personal cabinet
master requests
result generation
src/servicesOrdersRuntime.jsx
Google auth changes
public shop routes unless explicitly needed
```

Phase 1 button behavior:

```text
Сохранить мандалу
→ create/update composition only.

Перенести в услуги
→ save/update composition
→ find service by profile_id + composition_id
→ if found, update/open
→ if not found, create service draft
→ status=draft
→ price=Бесплатно
→ open /profile/services.

Опубликовать как услугу
→ save/update composition
→ find/create service
→ status=published
→ price=Бесплатно
→ open /profile/services.
```

Services UI:

```text
Черновики
Опубликованные
Архив
```

Link behavior:

```text
draft: Ссылка появится после публикации.
published with route: copy public link.
published without route: Услуга опубликована. Публичная ссылка будет доступна после подключения маршрута /services/:serviceId.
archived: no public link.
```

### Phase 2 — Services manager

Do:

```text
edit title/description/price/formats
copy link only for working route
archive safely
format free price as Бесплатно
```

### Phase 3 — Public shop + service page + cart

Do:

```text
find existing shop first
connect published services
add /services/:serviceId if missing
add Vercel rewrite
one-service cart
pending cart survives login/refresh up to 24h
```

### Phase 4 — Personal/Master cabinet split

Do:

```text
Кабинет Личный / Мои Заказы / Мои Фото
Кабинет Мастера / Заявки
max 4 client photos
photo picker/upload
explicit Отправить заказ мастеру
RLS client/master access
```

### Phase 5 — Personal result generation

Do:

```text
clone template composition
insert client photo in center
save draft_result_composition_id
master open/edit/comment/send
client result card open/download
```

---

## 9. Engineering guardrails

### 9.1. No duplicate services

Do not use real Supabase upsert unless unique constraint exists on `(profile_id, composition_id)`.

Use find-or-create:

```text
find by profile_id + composition_id
if found → update/open existing
if not found → create
```

### 9.2. Public visibility

Public queries must use:

```text
status = published
```

Draft/archive must not be public.

### 9.3. Photo privacy

```text
no data:image persistence
no raw private storage path in public UI
signed URLs only for authenticated display
```

### 9.4. Result generation

When generating personal result:

```text
load service
load template composition
clone fields
set profile_id = master_profile_id
replace center with client photo
save new composition
link to order
never mutate template
```

### 9.5. Async UI

Every async action must have:

```text
loading
success
actionable error
no navigation on failure
```

---

## 10. RLS/access rules

```text
public can read only published services
public cannot read orders/photos/results
client can read own orders/photos/results
master can read own services and incoming orders
other masters cannot read private data
```

If RLS live cannot be verified, report:

```text
RLS live verification: not verified
```

---

## 11. Tests

Base checks:

```bash
npm run test:profile-lite
npm run test:profile-services
npm run test:power-place
npm run test:profile-media
npm run test:profile-loading-recovery
npm run check
npm run build
```

Add or update tests for relevant phase:

```text
three buttons exist
no duplicate service by composition
draft transfer creates draft
publish creates published
free price = Бесплатно
services grouped by status
draft/published link behavior
```

---

## 12. QA routes

Protected QA:

```text
/
/profile
/profile-old
/profile/mandalas
/profile/services
/masters
/profile/admin
```

Mobile:

```text
390px width
no horizontal overflow
```

If public route implemented:

```text
/services/<published_id> works
/services/<draft_id> not public
/services/<archived_id> not public
```

---

## 13. Stop signals

Stop immediately if:

```text
/profile or /profile-old breaks
/, /masters, /profile/admin breaks
Google auth changes outside scope
draft/archive becomes public
client sees чужой order/photo/result
master sees чужие requests
public sees private order/photo/result
template composition overwritten
data:image persisted
fake public copy link shown
Phase 1 touches cart/orders/result generation
```

---

## 14. Quality score

Merge-ready requires at least 4/5.

```text
5 = complete for declared phase, tested, safe.
4 = works with minor needs verification.
3 = partial, not production-ready.
2 = unreliable or weakly tested.
1 = mostly planning/broken.
0 = unsafe/breaks auth/routes/privacy.
```

---

## 15. Report format

Codex must report:

```text
worktree/branch
docs read
changed files
phase implemented
flow implemented
tables touched
routes touched
RLS/privacy assumptions
checks run
QA routes/viewports
quality score
stop signals checked
risks/not verified
STATE.md/LOG.md updates
next phase plan
```
