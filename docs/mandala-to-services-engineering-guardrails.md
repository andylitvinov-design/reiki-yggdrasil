# Mandala Services Shop — Engineering Guardrails

Last updated: 2026-06-02

Status: anti-bug engineering guardrails / implementation safety layer.

Repo: `andylitvinov-design/reiki-yggdrasil`

Related docs:

```text
docs/mandala-to-services-implementation-program.md
docs/mandala-to-services-professional-spec.md
docs/mandala-to-services-goal.md
```

Use this file together with the professional spec when giving Codex a development task.

---

## 1. Purpose

This document exists to prevent common implementation bugs while building the mandala services/shop/cart/order flow.

The main bug risks are:

```text
- mixing service template and client result;
- making drafts public;
- duplicating services for the same mandala;
- overwriting template composition while generating a client result;
- leaking private photo/result refs;
- breaking /profile or /profile-old while improving Profile Lite;
- implementing too many phases in one PR;
- adding schema without matching client normalization/tests/RLS;
- showing fake public links before route exists;
- silently submitting orders without client confirmation;
- losing cart/order state during Google login;
- causing mobile horizontal overflow.
```

---

## 2. Implementation order guardrail

Always implement in this order unless the user explicitly overrides it:

```text
1. Read project docs and current code.
2. Identify current route/component/data ownership.
3. Add or adjust client normalization tests first when data shape changes.
4. Implement one phase only.
5. Run targeted tests.
6. Run full check/build.
7. Manually QA protected routes.
8. Update STATE.md and LOG.md.
9. Report exact verified / not verified.
```

Never start by editing a large JSX file blindly.

Before changing code, Codex must answer internally:

```text
Which phase is this?
Which files are in scope?
Which tables are touched?
Is a migration required?
Which protected routes must be smoke-tested?
What is explicitly out of scope?
```

---

## 3. Phase isolation guardrail

### Phase 1 only allows

```text
/profile/mandalas
/profile/services
profileServicesClient helpers if needed
service tests
profile-lite contract tests
```

Allowed behavior:

```text
Сохранить мандалу
Перенести в услуги
Опубликовать как услугу
services grouped by draft/published/archive
public link shown only after publication
```

Forbidden in Phase 1 unless explicitly requested:

```text
cart
checkout
orders schema expansion
personal cabinet
master requests
result generation
client photo picker
public shop route unless needed for safe public link verification
```

### Phase 2 only allows

```text
service manager polish
service update/edit/archive
formats UI
copy link polish
```

### Phase 3 only allows

```text
public shop
/services/:serviceId
one-service cart
pending cart localStorage
```

### Phase 4 only allows

```text
Кабинет Личный / Мои Заказы
Кабинет Мастера / Заявки
client photo picker/upload max 4
order submit to master
```

### Phase 5 only allows

```text
clone template composition
create personal result composition
master edit/send
client result open/download
```

If a PR touches multiple phases, the report must explain why and mark the regression risk as elevated.

---

## 4. Data identity guardrail

These IDs must never be confused:

```text
profile_id
→ owner of profile/cabinet row.

client_profile_id
→ current user acting as client.

master_profile_id
→ owner of the service receiving the order.

composition_id on service
→ reusable master template mandala.

template_composition_id on order
→ snapshot/reference to template used for this order.

draft_result_composition_id
→ generated personal mandala draft for this order.

final_result_composition_id
→ result visible to client after master sends.
```

Never use `service.composition_id` as the final result for a client order.

Never overwrite `service.composition_id` when generating a client result.

---

## 5. Service idempotency guardrail

When transferring or publishing a mandala as service:

```text
1. Save/update composition.
2. Get saved composition id.
3. Search existing service by:
   profile_id = current master profile id
   composition_id = saved composition id
   status in draft/published/archived
4. If found, update/open it.
5. If not found, create new service.
```

This prevents duplicate services from the same mandala.

Forbidden behavior:

```text
Every click on Перенести в услуги creates a new service row.
```

Allowed future behavior only with explicit UI:

```text
Создать копию услуги
```

---

## 6. Public visibility guardrail

Public visibility is controlled only by service status.

```text
draft      → private to master
published  → public shop + /services/:serviceId
archived   → not public
```

Public service query must filter:

```text
status = 'published'
```

Public service page must reject:

```text
draft
archived
unknown id
service owned by unapproved profile if approval is required by current RLS
```

UI rules:

```text
Draft service:
  show: Ссылка появится после публикации.
  no active copy link.

Published service:
  show: Публичная ссылка для клиентов.
  copy link allowed.

Archived service:
  show: Услуга в архиве. Публичная ссылка отключена.
```

Do not show fake links.

If `/services/:serviceId` route is missing:

```text
Either implement route + Vercel rewrite in the same phase where link is needed,
or show needs verification and no copy link.
```

---

## 7. Client photo guardrail

Client profile photo rules:

```text
max 4 photos per profile
private storage only
signed URL for authenticated display
no raw private path in public UI
no data:image persistence
```

Order confirmation photo rules:

```text
- Client can select one already uploaded photo.
- Client can upload a new photo only if under limit.
- If 4 photos already exist, upload disabled.
- If no photo selected, order cannot be sent to master.
- After order.status = new or later, selected photo is locked in MVP.
```

UI text at limit:

```text
Можно хранить до 4 фото. Удалите старое фото или выберите одно из существующих.
```

UI text if missing photo:

```text
Загрузите своё фото, чтобы отправить заказ в работу Мастеру.
```

---

## 8. Cart guardrail

MVP cart is one-service cart.

Allowed cart state:

```json
{
  "service_id": "uuid",
  "composition_id": "uuid",
  "master_profile_id": "uuid",
  "format": "signature | no_signature | both",
  "price_amount": null,
  "price_currency": "EUR",
  "created_at": "ISO timestamp"
}
```

Storage:

```text
localStorage key: reiki-yggdrasil-service-cart
pending checkout key: reiki-yggdrasil-pending-service-cart
```

Rules:

```text
- no secrets in localStorage;
- no private photo refs in public cart localStorage;
- pending cart expires after 24h;
- adding a new service replaces existing cart item in MVP;
- multi-item cart is later;
- checkout must re-fetch service before creating order;
- checkout must verify service is still published.
```

---

## 9. Order state machine guardrail

Recommended statuses:

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

Allowed transitions:

```text
draft → photo_required
photo_required → draft            if client selects photo but has not submitted yet
photo_required → new              after client clicks Отправить заказ мастеру
new → in_progress                 when master starts work
new → ready_for_review            if draft result auto-generated immediately
in_progress → ready_for_review    when draft result ready
ready_for_review → sent           when master sends result
sent → closed                     when completed/archived
any non-sent active → cancelled   if cancellation is later implemented
```

Forbidden transitions:

```text
draft → sent
photo_required → sent
new → sent without result
sent → draft
closed → in_progress
```

Send result requires:

```text
final_result_composition_id OR selected result composition exists
master confirmation
status becomes sent
sent_at set
client can now view result
```

---

## 10. Result generation guardrail

When generating personal client mandala:

```text
1. Load order.
2. Verify current user is master for order.master_profile_id.
3. Load service by order.service_id.
4. Load template composition by service.composition_id.
5. Clone template fields.
6. Set new composition.profile_id = master_profile_id.
7. Set title = Заказ: <service title> / <client label>.
8. Insert selected client photo into center.
9. Save as new composition.
10. Update order.draft_result_composition_id.
11. Do not mutate template composition.
```

Fields to clone carefully:

```text
constructor_type
geometry
zodiac_variant
zodiac_visible_count
star_variant
chess_variant
altar_center_ratio
business_vertex_zone_count
cover_ref
object_refs
resource comparison fields
tradition fields
```

Center photo update should only affect the new result composition.

---

## 11. UI state guardrail

Every async action must have visible state:

```text
idle
loading
success
error / needs verification
```

Required button behavior:

```text
- Disable primary action while loading.
- Show success message after completion.
- Show actionable error on failure.
- Do not navigate away on failure.
```

Examples:

```text
Перенести в услуги:
  loading: Сохраняю мандалу и создаю черновик услуги...
  success: Мандала перенесена в услуги как черновик.
  error: Не удалось создать черновик услуги. Проверьте миграцию profile_cabinet_services.

Опубликовать как услугу:
  loading: Публикую услугу...
  success: Мандала опубликована как услуга. Ссылка для клиентов доступна.
  error: Не удалось опубликовать услугу. Проверьте RLS и статус профиля.

Отправить заказ мастеру:
  loading: Отправляю заказ мастеру...
  success: Заявка отправлена мастеру.
  error: Не удалось отправить заказ. Проверьте фото и попробуйте снова.
```

---

## 12. Validation guardrail

### Service validation

Draft service can be minimal:

```text
title optional but recommended
description optional
price optional
composition_id required
profile_id required
```

Published service should require:

```text
profile_id
composition_id
title or fallback title
status = published
```

Warnings, not hard blockers:

```text
missing description
missing master profile display name
missing price because free is allowed
```

### Order validation

Order sent to master requires:

```text
client_profile_id
master_profile_id
service_id
order_format
selected client photo ref
explicit client confirmation
```

Master sending result requires:

```text
order belongs to master
result composition exists
status not already sent/closed/cancelled
```

---

## 13. Migration guardrail

For each migration:

```text
- Make additive changes only.
- Do not drop existing fields.
- Do not rename fields without compatibility layer.
- Add indexes for new foreign keys/status filters.
- Add RLS policies in same migration if new table/field changes access needs.
- Add client normalization support.
- Add tests for new fields/statuses.
- Update migration runner allowlist if required.
- Document live migration as not verified unless actually verified.
```

Recommended indexes:

```sql
create index if not exists profile_cabinet_services_profile_status_idx
on public.profile_cabinet_services(profile_id, status);

create index if not exists profile_cabinet_services_composition_profile_idx
on public.profile_cabinet_services(profile_id, composition_id);

create index if not exists profile_cabinet_service_orders_client_status_idx
on public.profile_cabinet_service_orders(client_profile_id, status);

create index if not exists profile_cabinet_service_orders_master_status_idx
on public.profile_cabinet_service_orders(master_profile_id, status);

create index if not exists profile_cabinet_service_orders_service_idx
on public.profile_cabinet_service_orders(service_id);
```

Do not add these blindly if columns do not exist yet.

---

## 14. RLS test guardrail

For every phase touching Supabase data, test or reason through:

```text
anon reads published services only
anon cannot read draft services
anon cannot read orders
client can read own orders
client cannot read other client orders
master can read incoming orders for own services
master cannot read other master orders
client can access own photos
master can access selected order photo for own incoming order
public cannot access private storage refs/results
```

If live RLS cannot be verified, report:

```text
RLS live verification: not verified
```

Do not claim privacy works live without verification.

---

## 15. Test implementation guardrail

Each feature should add a contract test before or with code.

Recommended test names:

```text
test:profile-services
  - normalize service draft/published/archive
  - format free price
  - prevent duplicate service from composition
  - public service URL uses provided origin
  - public list excludes non-published

test:profile-lite
  - three mandala buttons exist
  - transfer to services path is wired
  - publish as service path is wired
  - services grouped by status

test:power-place
  - clone composition for result does not mutate original
  - center photo ref is replaced only in clone

test:profile-media
  - client photo limit max 4
  - data:image rejected for persistence
```

When browser QA is possible, verify:

```text
no console errors
no horizontal overflow
button loading states
success/error notices
protected routes
```

---

## 16. Backward compatibility guardrail

Existing data must remain readable.

Rules:

```text
- Existing services without new fields must normalize safely.
- Existing orders without new fields must normalize safely.
- Missing price means Бесплатно.
- Missing delivery_modes means all three formats or default safe format.
- Missing result fields means no result yet.
- Existing composition object_refs must stay compatible.
```

No migration should require manually editing existing rows for the app to open.

---

## 17. Performance guardrail

Avoid loading all heavy data at once.

Rules:

```text
- Profile shell must render before secondary modules finish loading.
- Public shop should limit/paginate services if list grows.
- Orders list should not load full result compositions until order detail opens.
- Signed URLs should be generated only for visible photos/results.
- Large constructor/result data should be loaded on demand.
```

Profile Lite must not return to “Загружаю кабинет...” infinite loading because services/orders failed.

---

## 18. Mobile/layout guardrail

Every phase must preserve mobile usability.

Check:

```text
390px width
no horizontal overflow
buttons wrap cleanly
service cards readable
cart actions reachable
photo picker usable
order cards not clipped
```

Do not add fixed-width panels without mobile fallback.

---

## 19. Debug/observability guardrail

Safe diagnostics may show:

```text
auth status booleans
module status: idle/loading/success/error
counts: services/orders/photos
route name
has session: yes/no
migration/RLS needs verification messages
```

Diagnostics must never show:

```text
access token
refresh token
raw JWT
env values
private storage full paths in public context
client personal data in public context
```

---

## 20. PR review checklist

Before marking PR ready:

```text
[ ] Scope matches one phase.
[ ] Protected routes unchanged or smoke-tested.
[ ] No secrets/private refs exposed.
[ ] Draft/archived not public.
[ ] Template composition not overwritten.
[ ] data:image not persisted.
[ ] Tests added/updated.
[ ] npm run check passes.
[ ] Browser QA done or explicitly not verified.
[ ] STATE.md updated.
[ ] LOG.md updated.
[ ] Report includes risks and not verified.
```

---

## 21. Stop immediately if

```text
/profile or /profile-old breaks.
Google auth flow regresses.
A private order/photo/result becomes public.
A template composition is overwritten by generated result.
A migration would require destructive data changes.
A feature requires service-role key in frontend.
```

Stop, report the exact cause, changed files, and safest rollback.
