# Mandala Services Shop — Professional Implementation Spec

Last updated: 2026-06-02

Status: professional implementation spec / engineering companion to `docs/mandala-to-services-implementation-program.md`.

Repo: `andylitvinov-design/reiki-yggdrasil`

Target live: `https://mentalica.vercel.app`

Legacy live: `https://reiki-yggdrasil.vercel.app`

Related docs:

```text
docs/mandala-to-services-implementation-program.md
docs/mandala-to-services-goal.md
docs/PROFILE_SERVICES_ROADMAP.md
docs/profile-lite-alternative-cabinet-plan.md
docs/master-services-orders-mvp.md
```

---

## 1. Audit of current documentation

### 1.1. What is already strong

The current implementation program already defines:

```text
- Product decisions confirmed by Andrey.
- Mandala → service template → public shop → cart → order → result concept.
- Three mandala actions.
- Draft/published/archive service model.
- One-profile/two-cabinet model.
- One-service cart MVP.
- Client photo limit: max 4 photos.
- Master request workflow.
- Result delivery in client personal cabinet.
- Slippery cases and stop signals.
- Phase separation.
```

### 1.2. What was missing for professional implementation

The previous document was product-complete but not engineering-complete. Missing parts:

```text
1. Component ownership map.
2. Data contract per table.
3. API/client-function contract.
4. Route contract.
5. RLS access matrix.
6. Migration strategy by phase.
7. Test matrix by phase.
8. Rollout/rollback plan.
9. Definition of Ready / Definition of Done per ticket.
10. Implementation ticket breakdown.
11. QA scenarios with exact expected result.
12. Observability/debug requirements.
13. Backward compatibility rules.
14. Performance and mobile constraints.
15. Explicit out-of-scope list per phase.
```

This file adds those missing professional implementation details.

---

## 2. Architecture map

### 2.1. Existing application architecture

Current project is Vite + React with route-based rendering and Supabase REST/auth clients.

Protected routes that must stay safe:

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

Core files to inspect before coding:

```text
AGENTS.md
README.md
STATE.md
LOG.md
package.json
vercel.json
src/main.jsx
src/pages/ProfileLitePage.jsx
src/pages/ProfilePage.jsx
src/pages/profile-lite/ProfileLitePowerPlaceModule.jsx
src/pages/profile-lite/ProfileLiteServicesModule.jsx
src/pages/profile-lite/ProfileLiteOrdersModule.jsx
src/lib/profileServicesClient.js
src/lib/powerPlaceClient.js
src/lib/profileMediaClient.js
src/lib/supabaseClient.js
supabase/migrations/20260529090000_master_services_orders_mvp.sql
```

### 2.2. Target module ownership

```text
ProfileLitePage.jsx
→ owns auth/session shell, profile state, module routing, shared data loading.

ProfileLitePowerPlaceModule.jsx
→ owns mandala constructor UI and three mandala actions.

ProfileLiteServicesModule.jsx
→ owns master service template manager.

ProfileLiteOrdersModule.jsx
→ should become master requests module or be split/renamed when Personal/Master cabinet split is implemented.

New/verified public service component
→ owns /services/:serviceId public service page.

New/verified shop component
→ owns public published service list.

New cart module
→ owns one-service cart MVP.

profileServicesClient.js
→ owns service/order REST access and normalization.

powerPlaceClient.js
→ owns mandala composition persistence and loading.

profileMediaClient.js
→ owns client photo upload/private storage helpers.
```

---

## 3. Data contracts

### 3.1. `profile_cabinet_power_place_compositions`

Purpose:

```text
Stores both master template mandalas and generated personal client mandala results.
```

Current important fields:

```text
id
profile_id
title
constructor_type
geometry
zodiac_variant
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
created_at
updated_at
```

Target rules:

```text
- Master template composition is linked from profile_cabinet_services.composition_id.
- Client result composition is linked from service order result fields.
- Template composition must never be overwritten when generating client result.
- data:image must not be persisted.
- private storage refs must not be shown publicly.
```

Recommended later fields if needed:

```text
source_type text default 'master_template'
source_order_id uuid null
source_service_id uuid null
parent_composition_id uuid null
```

Do not add these fields in Phase 1 unless needed.

### 3.2. `profile_cabinet_services`

Purpose:

```text
Stores service templates created by masters from mandalas.
```

Existing MVP fields:

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

Status contract:

```text
draft      → visible only to owning master
published  → visible in public shop and /services/:serviceId
archived   → hidden from public, kept for history
```

Phase 1 must not require new fields. Phase 2/3 may add:

```text
short_description text not null default ''
category text not null default 'mandala'
delivery_modes jsonb not null default '["signature","no_signature","both"]'::jsonb
published_at timestamptz null
archived_at timestamptz null
```

Slug is optional later:

```text
public_slug text unique null
```

MVP route uses ID:

```text
/services/<service_id>
```

### 3.3. `profile_cabinet_service_orders`

Purpose:

```text
Stores client orders for service templates and master workflow results.
```

Existing MVP fields:

```text
id
service_id
master_profile_id
client_name
client_photo_url
client_photo_bucket
client_photo_path
request_text
master_comment
result_image_url
result_image_bucket
result_image_path
status
created_at
updated_at
```

Recommended Phase 4/5 fields:

```text
client_profile_id uuid null references public.profile_cabinet_profiles(id)
order_format text not null default 'signature'
goal_text text not null default ''
comment_text text not null default ''
attachment_refs jsonb not null default '[]'::jsonb
template_composition_id uuid null references public.profile_cabinet_power_place_compositions(id)
draft_result_composition_id uuid null references public.profile_cabinet_power_place_compositions(id)
auto_result_composition_id uuid null references public.profile_cabinet_power_place_compositions(id)
master_result_composition_id uuid null references public.profile_cabinet_power_place_compositions(id)
final_result_composition_id uuid null references public.profile_cabinet_power_place_compositions(id)
submitted_at timestamptz null
sent_at timestamptz null
```

MVP order statuses for final flow:

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

If not all statuses can be added in one migration, Codex must document the exact compromise.

### 3.4. Client photos

Logical model:

```text
One profile can store up to 4 personal client photos.
```

Preferred storage:

```text
private Supabase Storage bucket: profile-cabinet-media
existing client/goal photo table/helpers if compatible
```

Rules:

```text
- max 4 photos per profile for client personal photos;
- signed URLs for authenticated display;
- no public raw storage paths;
- selected photo ref is copied or linked to order;
- after order is submitted, selected photo cannot be changed in MVP.
```

---

## 4. API/client-function contracts

### 4.1. Existing functions to preserve

```text
listPublicServices
listOwnServices
createOwnService
updateOwnService
publishOwnService
createServiceOrder
listOwnServiceOrders
updateServiceOrder
```

### 4.2. Phase 1 additions or refinements

Recommended helpers:

```text
findOwnServiceByCompositionId(profileId, compositionId, session)
createOrUpdateServiceFromComposition({ profileId, composition, status, session })
buildServicePublicUrl(service, origin)
formatServicePrice(service)
```

Behavior:

```text
findOwnServiceByCompositionId
→ returns existing service template for same composition_id and profile_id.

createOrUpdateServiceFromComposition
→ prevents duplicate service templates for same composition.
→ creates draft or published depending requested status.
→ does not persist data:image preview.

buildServicePublicUrl
→ returns origin + '/services/' + service.id.
→ must not hardcode production domain.

formatServicePrice
→ null/0 = Бесплатно.
```

### 4.3. Phase 3 cart functions

Recommended helpers:

```text
getServiceCart()
setServiceCart(item)
clearServiceCart()
removeServiceCartItem()
createCheckoutDraftFromCart()
```

MVP cart constraints:

```text
one service item only
localStorage allowed for public cart state
no secrets/private data in localStorage
pending cart expires after 24 hours
```

### 4.4. Phase 4/5 order functions

Recommended helpers:

```text
listClientServiceOrders(profileId, session)
listMasterServiceOrders(profileId, session)
createClientOrderDraftFromCart(cart, profileId, session)
attachClientPhotoToOrder(orderId, photoRef, session)
submitClientOrderToMaster(orderId, session)
generateDraftResultComposition(orderId, session)
sendOrderResultToClient(orderId, resultCompositionId, comment, session)
```

---

## 5. Route contracts

### 5.1. Existing route safety

Do not break:

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

### 5.2. Public service route

Recommended route:

```text
/services/:serviceId
```

Vercel rewrite:

```json
{
  "source": "/services/:serviceId",
  "destination": "/"
}
```

Expected states:

```text
published service → render public page
unknown service → Услуга не найдена
service draft/archive → Услуга недоступна или снята с публикации
network/RLS error → safe error, no private details
```

### 5.3. Public shop route

Codex must first search for existing shop route/section using terms:

```text
shop
магазин
services
service
publicService
shopItems
Артефакты / магазин
```

If found:

```text
connect published services to existing shop surface
```

If not found:

```text
create /shop only in Phase 3, not Phase 1
```

---

## 6. RLS/access matrix

| Actor | Services draft | Services published | Orders as client | Orders as master | Client photos | Final result |
|---|---|---|---|---|---|---|
| Anonymous | no | read only | no | no | no | no |
| Auth client | no, unless owner | read | own only | no, unless also master | own only | own sent results only |
| Master owner | own only | own manage | own client orders if any | incoming for own services | selected order photos only | results for own orders |
| Other master | no | read public only | own only | own incoming only | no | no |
| Admin | later / needs explicit scope | later | later | later | later | later |

Hard privacy rules:

```text
- Public cannot read orders.
- Public cannot read private photos/results.
- Client cannot read other clients' orders.
- Master cannot read other masters' orders.
- Draft/archived services are not public.
```

---

## 7. Implementation tickets

### Ticket 1 — Phase 1 bridge: three mandala buttons

Files:

```text
ProfileLitePage.jsx
ProfileLitePowerPlaceModule.jsx
ProfileLiteServicesModule.jsx
profileServicesClient.js
test/profileLiteCabinetContract.test.mjs
test/profileServicesClient.test.mjs
```

Acceptance:

```text
[ ] three buttons exist;
[ ] save only saves composition;
[ ] transfer creates/opens draft service;
[ ] publish creates/opens published service;
[ ] duplicate service is prevented by composition_id;
[ ] published service shows public link;
[ ] draft service shows link-after-publication message.
```

### Ticket 2 — Services manager polish

Acceptance:

```text
[ ] services grouped by draft/published/archive;
[ ] service editor handles existing service updates;
[ ] price null/0 shows Бесплатно;
[ ] formats visible/ready;
[ ] archive safe behavior documented/implemented.
```

### Ticket 3 — Public service route

Acceptance:

```text
[ ] /services/:serviceId route added;
[ ] Vercel rewrite added;
[ ] published service renders;
[ ] draft/archive inaccessible;
[ ] no private refs exposed.
```

### Ticket 4 — Shop integration and one-service cart

Acceptance:

```text
[ ] existing shop found or /shop created;
[ ] published services listed;
[ ] one-service cart stores service + format;
[ ] checkout starts safely;
[ ] pending cart survives login/refresh up to 24h.
```

### Ticket 5 — Personal cabinet orders

Acceptance:

```text
[ ] Кабинет Личный mode exists;
[ ] Мои Заказы lists client orders;
[ ] photo picker supports up to 4 photos;
[ ] upload disabled at 4 photos;
[ ] explicit Отправить заказ мастеру action exists.
```

### Ticket 6 — Master requests and result generation

Acceptance:

```text
[ ] Кабинет Мастера / Заявки lists incoming orders;
[ ] result composition generated by cloning template;
[ ] client photo inserted in center;
[ ] template not overwritten;
[ ] master can open/edit/send result;
[ ] client sees sent result.
```

---

## 8. Test matrix

### 8.1. Automated checks

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

Add tests as features are implemented:

```text
service from composition prevents duplicates
published service URL builder uses current origin
public list excludes draft/archive
cart stores one item only
client photo limit = 4
order access client vs master
result generation clones template instead of overwriting
```

### 8.2. Manual QA routes

Protected smoke:

```text
/
/profile
/profile-old
/profile/mandalas
/profile/services
/masters
/profile/admin
```

Public service/shop:

```text
/shop or existing shop route
/services/<published_service_id>
/services/<draft_service_id> must not be public
/services/<archived_service_id> must not be public
```

Client/master flow:

```text
Кабинет Личный / Мои Заказы
Кабинет Личный / Мои Фото
Кабинет Мастера / Заявки
Кабинет Мастера / Услуги
```

Viewport QA:

```text
desktop 1280x920
desktop 1366x900
mobile 390x900
no horizontal overflow
```

---

## 9. Rollout and rollback

### 9.1. Rollout rules

```text
1. Implement one phase per PR unless explicitly approved.
2. Keep changes additive.
3. Do not remove /profile-old.
4. Verify preview/local before merge.
5. Verify production and legacy after deployment when production-facing.
```

### 9.2. Migration rollout

For new Supabase migrations:

```text
1. Add migration file.
2. Add tests/client normalization.
3. Add migration runner allowlist if required.
4. Document migration in README/STATE/LOG.
5. Verify live migration status before claiming live success.
```

### 9.3. Rollback strategy

If live breaks:

```text
- Revert UI route/module changes first.
- Keep migrations if already applied unless destructive.
- Disable public link/cart entry points before touching stored data.
- Preserve existing service/order rows.
- Do not delete user data as rollback.
```

---

## 10. Definition of Ready

A ticket is ready for Codex only when it has:

```text
[ ] phase number;
[ ] target branch;
[ ] files to inspect first;
[ ] exact routes affected;
[ ] data tables affected;
[ ] migrations needed or explicitly not needed;
[ ] tests to run;
[ ] out-of-scope list;
[ ] stop signals;
[ ] report format.
```

---

## 11. Definition of Done

A phase is done only when:

```text
[ ] declared flow works;
[ ] protected routes still work;
[ ] tests/build pass;
[ ] no console errors in checked routes;
[ ] mobile has no horizontal overflow;
[ ] no secret/private data exposure;
[ ] RLS/privacy assumptions documented;
[ ] STATE.md updated;
[ ] LOG.md updated;
[ ] risks and not verified items are reported.
```

---

## 12. Professional report template

Codex must report:

```text
1. Branch
2. PR URL if created
3. Phase implemented
4. Files read first
5. Changed files
6. Data model changes
7. Route changes
8. UI changes
9. RLS/privacy notes
10. Tests/checks run
11. Browser QA routes/viewports
12. Quality score 0–5
13. Stop signals checked
14. Risks
15. Needs verification
16. STATE.md / LOG.md updates
```

---

## 13. Professional implementation rule

When this professional spec conflicts with a quick implementation idea, prefer:

```text
safe + phased + tested + privacy-preserving
```

over:

```text
fast + broad + unverified
```
