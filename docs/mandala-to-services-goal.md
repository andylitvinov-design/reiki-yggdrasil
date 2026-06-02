# /goal — Mandala Services Shop Quality Target

Last updated: 2026-06-02

Use this file as a compact `/goal` attachment for Codex prompts related to the mandala → services → shop → cart → order flow.

Repo: `andylitvinov-design/reiki-yggdrasil`

Target live: `https://mentalica.vercel.app`

Legacy live: `https://reiki-yggdrasil.vercel.app`

Primary program doc: `docs/mandala-to-services-implementation-program.md`

---

## 1. Goal

Build a clear, safe, RU-first flow where:

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

The feature must never confuse:

```text
private mandala
service template
public service
cart item
client order
master request
personal client result
```

---

## 2. Product success criteria

The full system is successful only when this path works end-to-end:

```text
[ ] Master creates a mandala.
[ ] Master saves the mandala.
[ ] Master transfers the mandala to services as a draft template.
[ ] Master publishes the service.
[ ] Public link appears only after publication.
[ ] Published service appears in the public shop.
[ ] Client opens the service page.
[ ] Client selects format: signature / no_signature / both.
[ ] Client adds one service to cart.
[ ] Client checks out and logs in with Google if needed.
[ ] Client lands in Кабинет Личный → Мои Заказы.
[ ] Client chooses one of up to 4 saved photos or uploads a new photo.
[ ] Client clicks Отправить заказ мастеру.
[ ] Order appears in Кабинет Мастера → Заявки.
[ ] Draft personal mandala is generated from template + client photo.
[ ] Master approves/sends or opens/edits/comments/sends.
[ ] Client sees final result card in Мои Заказы.
[ ] Client opens result.
[ ] Client downloads result.
```

---

## 3. Phase success criteria

### Phase 1 — Mandala to service template bridge

Scope:

```text
/profile/mandalas
/profile/services
```

Must pass:

```text
[ ] Three buttons exist: Сохранить мандалу / Перенести в услуги / Опубликовать как услугу.
[ ] Сохранить мандалу saves only the composition.
[ ] Перенести в услуги creates/opens draft service template.
[ ] Опубликовать как услугу creates/opens published service template.
[ ] Existing service with same composition_id is reused, not duplicated.
[ ] Draft service does not show active public link.
[ ] Published service shows active public link.
[ ] Default price is Бесплатно.
[ ] Services are grouped by Черновики / Опубликованные / Архив.
[ ] /profile-old remains available.
[ ] /, /profile, /masters, /profile/admin remain unchanged.
```

Do not implement in Phase 1 unless explicitly requested:

```text
cart
checkout
orders
personal cabinet
master requests
personal result generation
```

### Phase 2 — Services manager

Must pass:

```text
[ ] Services list loads for current master.
[ ] Drafts, published services, and archive are visually separate.
[ ] Service title/description/price/format can be edited.
[ ] Published service link can be copied.
[ ] Draft/archived service cannot be opened publicly.
```

### Phase 3 — Public shop + service page + one-service cart

Must pass:

```text
[ ] Existing shop page/section is found before creating a new route.
[ ] Public shop shows only published services.
[ ] /services/:serviceId opens published service.
[ ] Vercel rewrite exists if route is added.
[ ] Service page has format selector.
[ ] Cart supports one service item.
[ ] Cart can add/remove/clear/checkout one service.
```

### Phase 4 — Personal/Master cabinet order split

Must pass:

```text
[ ] Same auth profile can switch between Кабинет Личный and Кабинет Мастера.
[ ] Кабинет Личный has Мои Заказы.
[ ] Кабинет Мастера has Заявки.
[ ] Client can store up to 4 photos.
[ ] Client can choose existing photo for order.
[ ] If no photo, upload modal appears.
[ ] Client must explicitly click Отправить заказ мастеру.
[ ] Master sees only incoming orders for own services.
```

### Phase 5 — Personal result generation and delivery

Must pass:

```text
[ ] Service template composition is cloned, not overwritten.
[ ] Client photo is inserted into center of generated result.
[ ] Draft result composition is linked to order.
[ ] Master can open/edit result in constructor.
[ ] Master can add comment and send result.
[ ] Sent result appears in client Мои Заказы.
[ ] Client can open/download result.
```

---

## 4. Quality metrics

Rate each implementation 0–5.

```text
5 = complete for declared phase, tested, safe, no known blockers.
4 = works with minor non-blocking needs verification.
3 = partial implementation, main flow visible but not production-ready.
2 = code added but flow is unreliable or weakly tested.
1 = mostly planning or broken implementation.
0 = unsafe, breaks protected routes/data/auth, or leaks private data.
```

Minimum merge-ready score:

```text
4/5
```

Assess these dimensions:

```text
Product clarity: 0–5
Data correctness: 0–5
Privacy/RLS safety: 0–5
Route safety: 0–5
UI/UX clarity: 0–5
Mobile layout: 0–5
Test coverage: 0–5
Regression risk: 0–5
```

---

## 5. Stop signals

Stop and report instead of continuing if any stop signal appears.

### Critical stop signals

```text
[ ] /profile or /profile-old stops opening.
[ ] /, /masters, or /profile/admin breaks.
[ ] Google auth/session flow is modified outside explicit task scope.
[ ] Supabase env values, tokens, raw JWTs, or private storage paths are exposed.
[ ] Draft/archived service becomes public.
[ ] Client can see another client's order/photo/result.
[ ] Master can see another master's private orders/services.
[ ] Public user can read private order/photo/result rows.
[ ] Service template composition is overwritten by client result generation.
[ ] data:image is persisted as permanent saved ref.
[ ] Fake public copy link is shown for an unimplemented route.
[ ] Phase 1 starts implementing cart/orders/result generation without explicit approval.
```

### UX stop signals

```text
[ ] User cannot tell if they are in Кабинет Личный or Кабинет Мастера.
[ ] User cannot tell if object is draft/published/sent/archived.
[ ] There is no clear next action.
[ ] Error says only Request failed without useful recovery text.
[ ] Client photo upload has no 4-photo limit handling.
[ ] Master can send order without result.
[ ] Client sees draft master work before status = sent.
```

---

## 6. Expected user-facing labels

Use RU-first labels.

```text
Кабинет Личный
Кабинет Мастера
Мои Заказы
Мои Фото
Заявки
Услуги
Мандалы
Сохранить мандалу
Перенести в услуги
Опубликовать как услугу
Черновик услуги
Опубликовано в магазине
Ссылка появится после публикации
Публичная ссылка для клиентов
Скопировать ссылку
Добавить в корзину
Оформить заказ
Загрузите своё фото, чтобы отправить заказ в работу Мастеру.
Отправить заказ мастеру
Открыть мандалу заказа
Отправить клиенту
Открыть результат
Скачать результат
Бесплатно
```

---

## 7. Required checks

Run relevant checks for each phase.

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

Protected route smoke checks:

```text
/
/profile
/profile-old
/profile/mandalas
/profile/services
/masters
/profile/admin
```

If public service route is implemented:

```text
/shop or existing Магазин route
/services/<published_service_id>
/services/<draft_service_id> must not be public
```

If order flow is implemented:

```text
Кабинет Личный / Мои Заказы
Кабинет Мастера / Заявки
photo picker/upload up to 4 photos
result card open/download
```

Viewport checks:

```text
desktop 1280x920
desktop 1366x900
mobile 390x900
no horizontal overflow
```

---

## 8. Codex report format

Codex must report in this format:

```text
1. Branch
2. Changed files
3. Phase implemented
4. Files read first
5. Product flow implemented
6. Storage/tables touched
7. Routes touched
8. RLS/privacy assumptions
9. UI labels/states added
10. Checks run
11. Browser QA routes
12. Quality score 0–5
13. Stop signals checked
14. Risks / needs verification
15. What was not implemented
16. STATE.md / LOG.md updated or not
```

---

## 9. Compact prompt attachment

```text
/goal
Implement only the declared phase of the Reiki Yggdrasil mandala-services flow.
Preserve protected routes, RU-first UI, Supabase auth/data flows, private photos/results, and Profile Lite shell stability.
Do not leak secrets or private storage refs.
Do not make draft/archived services public.
Do not overwrite service template compositions with client results.
Do not mix phases unless explicitly requested.
Stop on any critical stop signal and report exact file/route/check.
A merge-ready result must score at least 4/5 and pass tests/build plus route QA.
```
