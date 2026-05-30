# Profile Cabinet and Services Roadmap

Last updated: 2026-05-30
Status: working roadmap / source of truth for the next implementation passes.

## 0. Executive order

This document is the execution scenario for the next Reiki Yggdrasil work. It exists so every Codex/Claude/agent session follows the same sequence instead of randomly merging old PRs or adding more hotfix layers.

### Non-negotiable order

1. **Stabilize `/profile` first.**
2. **Then cleanly decide which old PRs are safe to merge, close, or cherry-pick.**
3. **Then turn PR #127 from draft foundation into a working services/shop flow.**
4. **Then verify Supabase migrations/RLS and live production.**
5. **Then polish UX and update project memory.**

Do not integrate the services shop while `/profile` can still hang on `Загружаю кабинет...`.

## 1. Project invariants

### Repo and deployment

- Repo: `andylitvinov-design/reiki-yggdrasil`
- Current/legacy live URL: `https://reiki-yggdrasil.vercel.app`
- Target domain in docs: `https://mentalica.vercel.app`
- Framework: Vite + React
- Hosting: Vercel
- Build command: `npm run build`
- Output: `dist`

### Stable routes to protect

Always verify after every profile/services/UI change:

- `/`
- `/profile`
- `/masters`
- `/profile/admin`

### Env names only

Never commit values. Only reference names:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_ADMIN_EMAIL`

### Safety rules

- Keep RU-default interface.
- Do not change public home page unless a task explicitly targets it.
- Do not break Supabase auth/data flow.
- Do not break Vercel SPA rewrites.
- Keep desktop three-column layout and mobile fallback.
- Do not expose secrets, env values, access tokens, service-role keys, or private user data.
- Do not rewrite `ProfilePage.jsx` wholesale when a small patch is enough.
- Do not add a second React/runtime app for services/orders.
- Do not apply draft services/order runtime directly to production without local tests and browser QA.

## 2. Product target scenario

The target product is not just a gallery. It is a full path:

**saved mandala / template → master service → public service profile → authenticated order → master request queue → result delivery**

### Master scenario

1. Master logs into `/profile`.
2. Master creates or selects a saved mandala / Power Place composition.
3. Master clicks `В услуги`.
4. Cabinet opens service editor.
5. Master edits:
   - service title;
   - description;
   - public image/template preview;
   - delivery formats;
   - price fields if enabled;
   - publication status.
6. Master publishes service.
7. Master can copy a public service link.
8. Master sees incoming orders in `Заявки`.
9. Master can open order details, view client request/photo/reference, and upload/attach final result if required.

### Client scenario

1. Client opens public services feed or a direct service link.
2. Client opens a service profile.
3. Client chooses one format:
   - `signature` / master signed or hand-finished version;
   - `no_signature` / automatic template version;
   - `both` / both versions.
4. If authenticated, CTA says `Оформить заказ`.
5. If not authenticated, CTA says `Войти через Google и оформить заказ`.
6. Selected `service_id` and format survive OAuth redirect.
7. After login, client lands in `/profile` order draft with selected service and format prefilled.
8. Client fills:
   - request / goal;
   - comment;
   - photo URL or uploaded refs if implemented;
   - optional references.
9. Client submits order.
10. Master sees order in `Заявки`.
11. Client can see own order status in `Мои заказы` when that tab is implemented.

### Delivery modes

Use clear product names in UI, but stable machine values in code.

Recommended mapping:

- `no_signature` — `Без подписи мастера` / automatic template result.
- `signature` — `С подписью мастера` / master-finished result.
- `both` — `Две версии`.

Do not add payment processing in this stage unless explicitly requested later.

## 3. Current known issues

### `/profile` loading issue

Confirmed bug/risk pattern:

- `src/lib/supabaseClient.js` uses fetch without timeout.
- `src/lib/powerPlaceClient.js` uses fetch without timeout.
- `ProfilePage.jsx` starts loading when Supabase env is configured, so a hanging auth/profile request can leave the user stuck on `Загружаю кабинет...`.
- `index.html` loads public runtime hotfix scripts after React.
- `public/profile-power-place-visual-export.js` uses React Fiber internals / hardcoded hook index in the existing save-as-new helper. This is unsafe and must be removed or guarded even if it is not the proven root cause.

### PR #127 status

PR #127 is **foundation only / draft**, not a working shop. It adds service/order files and a patch script, but it intentionally does not apply the UI patch to:

- `src/pages/ProfilePage.jsx`
- `src/main.jsx`

Therefore PR #127 does **not** unlock the working master service shop by itself.

## 4. Stage 1 — emergency `/profile` stabilization

### Goal

`/profile` must never hang forever. It must render one of:

- authenticated cabinet;
- login screen;
- visible recoverable error with `Войти заново`.

### Files to read first

- `AGENTS.md`
- `README.md`
- `STATE.md`
- `LOG.md`
- `package.json`
- `vercel.json`
- `index.html`
- `src/pages/ProfilePage.jsx`
- `src/lib/supabaseClient.js`
- `src/lib/powerPlaceClient.js`
- `src/lib/profileMaterialsClient.js`
- `public/profile-power-place-visual-export.js`
- `public/profile-background-zone-controls.js`
- `public/profile-category-unified-runtime.js`
- `public/profile-source-dropdowns-runtime.js`
- `public/profile-source-category-quicklist.js`

### Required changes

1. Add `AbortController` timeout to `request()` in `src/lib/supabaseClient.js`.
   - About 12 seconds.
   - Throw safe RU error on timeout.
   - No secrets, no env values, no raw token output.

2. Add `AbortController` timeout to `request()` in `src/lib/powerPlaceClient.js`.
   - Same behavior.

3. Add loading recovery in `src/pages/ProfilePage.jsx`.
   - Loading cannot remain true forever.
   - Expired/invalid auth clears stored session and renders login.
   - Timeout/network errors show a visible RU error.
   - Add `Войти заново` action.
   - `Войти заново` clears `reiki-yggdrasil-session` and returns to login state.

4. Audit `public/profile-power-place-visual-export.js`.
   - Remove React Fiber hook-index dispatch if possible.
   - Do not mutate React state through hardcoded hook index.
   - If save-as-new cannot be safely preserved, disable only that helper rather than risking `/profile`.
   - Do not let runtime enhancement do heavy DOM work during the initial loading screen.

5. Runtime isolation test.
   - Temporarily disable in local `index.html`:
     - `/profile-category-unified-runtime.js`
     - `/profile-power-place-visual-export.js`
     - `/profile-source-category-quicklist.js`
     - `/profile-background-zone-controls.js`
   - Verify `/profile`.
   - Re-enable one by one and identify any breaking script.

### Commands

```bash
npm run test:profile-media
npm run test:profile-materials
npm run test:profile-services
npm run test:power-place
npm run check
npm run build
```

### Manual QA

- `/profile` clean localStorage.
- `/profile` with expired `reiki-yggdrasil-session`.
- `/profile` with malformed session JSON.
- `/profile` with invalid token.
- Slow/blocked Supabase request shows fallback, not infinite loading.
- Authenticated `/profile` desktop 1280/1366.
- Authenticated `/profile` mobile 390.
- `/`, `/masters`, `/profile/admin` smoke.
- No console errors.

### Done definition

- `/profile` no longer hangs indefinitely.
- User has a visible recovery path.
- Tests/build pass.
- Production deployment commit is known.
- Live `/profile` is verified on the intended Vercel project.

## 5. Stage 2 — PR inventory and merge gates

Do not merge all open PRs blindly. Classify each PR with one of these outcomes:

- `merge now` — safe, current, low risk.
- `rebase and test` — useful but needs current `main` and checks.
- `cherry-pick only` — useful small pieces, but PR branch is stale.
- `close as superseded` — current `main` already contains or replaces it.
- `keep draft` — not ready.

### Safe candidates to review first

#### PR #128 — service shop implementation concept

- Status: open, mergeable.
- Runtime risk: low; docs only.
- Value: high. Supports this roadmap and PR #127.
- Suggested action: merge after quick read, unless it conflicts with this roadmap.

#### PR #13 — verified Reiki step video mappings

- Status: open, mergeable.
- Runtime risk: low; data only.
- Suggested action: re-run `npm run validate:videos`, `npm run validate:knowledge`, `npm run build`; merge if still valid.
- Do not invent unresolved video mappings.

#### PR #7 — global autonomous project rules

- Status: open, mergeable.
- Runtime risk: low; docs only.
- Suggested action: compare current `AGENTS.md`; merge only if it complements current repo-local rules and does not weaken them.

#### PR #81 — source panel visibility in all profile tabs

- Status: open, mergeable.
- Runtime risk: medium; profile UI.
- Suggested action: check whether changes are already in current `main` or live. Merge only after `/profile` is stable and visual QA passes.

### Keep draft / do not merge yet

#### PR #127 — template services/orders foundation

- Status: draft.
- Do not merge until Stage 3.
- First rebase on stable `main`, apply patch script, test, inspect diff, QA.

### Likely stale/conflicting

Handle by compare/cherry-pick/close:

- PR #118 — mobile mandala actions and cover print export. Likely overlaps with later export/runtime work.
- PR #46 — desktop left menu card readability.
- PR #36 / #34 / #31 — profile cabinet readiness docs likely superseded.
- PR #32 — right panel audio cards.
- PR #30 — old step-linked mandalas profile MVP likely superseded by current profile cabinet.
- PR #11 — psimaster free courses block.
- PR #8 — old course UI hierarchy/video block.
- PR #5 — Reiki step materials coverage audit.

### Review checklist for every stale PR

1. Is it already in `main`?
2. Is it still useful after current profile/power-place changes?
3. Does it touch `ProfilePage.jsx`, `main.jsx`, `index.html`, or public runtime scripts?
4. Does it add more hotfix scripts to `index.html`?
5. Does it change Supabase flow or migrations?
6. Can the useful part be cherry-picked as docs/data only?
7. Should the PR be closed with a clear note?

## 6. Stage 3 — integrate PR #127 services/shop flow

### Goal

Turn PR #127 from foundation/draft into working functionality.

### Required execution order

After Stage 1 is merged and live-verified:

```bash
git fetch origin
git checkout codex/template-services-orders-foundation
git rebase origin/main
npm run check:template-services-ui
npm run apply:template-services-ui
npm run test:profile-services
npm run test:mandala-template
npm run check
npm run build
```

Then inspect the diff before pushing.

### Expected changed/integrated files

- `src/pages/ProfilePage.jsx`
- `src/main.jsx`
- `src/lib/profileServicesClient.js`
- `src/lib/mandalaTemplateRenderer.js`
- `src/components/MasterTemplateServicesPanel.jsx`
- `src/components/PublicTemplateServicesPanel.jsx`
- `src/templateServices.css`
- `scripts/apply-template-services-ui.mjs`
- `supabase/migrations/20260530120000_template_services_delivery_modes.sql`

### Expected cabinet result

In authenticated `/profile` master cabinet:

- existing tabs remain stable;
- `Мои мандалы` remains usable;
- `Место силы` remains usable;
- new `Услуги` section/tab appears;
- new `Заявки` section/tab appears;
- saved mandala / Power Place has `В услуги` action;
- master can create a service from saved mandala/template;
- master can edit description and delivery options;
- master can publish/unpublish service;
- master can copy public service link if route/link is available.

### Expected public result

- Public service cards render in the intended shop/services location.
- Service profile has format selector.
- CTA changes by auth state.
- Selected service/format survives Google auth redirect.
- Authenticated user lands in order draft.

### Service order fields to verify

- `service_id`
- `order_format`
- `client_profile_id`
- `goal_text`
- `request_text` or equivalent request field
- `comment_text`
- `attachment_refs`
- `status` with `draft` / `submitted`
- result fields for automatic/master/final result where implemented.

### RLS and security requirements

- Public can read only published services.
- Anonymous users cannot create unsafe orders.
- Authenticated client can create/read own order.
- Master can read orders for own services.
- Frontend uses anon token only.
- No service-role key in frontend.

### Stage 3 done definition

- Patch script applied cleanly.
- Full tests/build pass.
- Browser QA passes.
- Supabase migration and RLS are verified in live/staging Supabase.
- PR #127 is marked ready for review only after the above.

## 7. Stage 4 — UX refinement after services work

Do this only after the basic services/order flow works.

### Master cabinet polish

Target tabs/sections:

- `Мои мандалы`
- `Место силы`
- `Услуги`
- `Заявки`
- `Чаты`
- `Профиль`

Saved mandala card actions:

- `Редактировать описание`
- `В услуги`
- `Скопировать ссылку`

Service card should show:

- title;
- image/template preview;
- delivery formats;
- price if available;
- status draft/published;
- copy public link.

### Client service profile polish

Show clearly:

- what client receives;
- three format choices;
- CTA depending on auth state;
- upload/photo/reference instructions;
- order status after submission.

### Order lifecycle

Use these statuses unless implementation already has a better equivalent:

- `draft`
- `submitted`
- `in_progress`
- `ready`
- `delivered`
- `cancelled`

## 8. Stage 5 — live verification and memory update

After every completed stage update:

- `STATE.md`
- `LOG.md`
- this roadmap if the sequence changes.

Each update must include:

- branch / PR;
- changed files;
- checks run;
- browser QA;
- live verification status;
- risks;
- what was not verified.

## 9. Ready-to-copy Codex prompts

### Prompt A — Stage 1 `/profile` stabilization

```text
Repo: https://github.com/andylitvinov-design/reiki-yggdrasil
Live: https://reiki-yggdrasil.vercel.app
Target branch: codex/fix-profile-loading-regression

Fix /profile infinite loading. Read AGENTS.md, README.md, STATE.md, LOG.md, package.json, vercel.json, index.html, docs/PROFILE_SERVICES_ROADMAP.md, src/pages/ProfilePage.jsx, src/lib/supabaseClient.js, src/lib/powerPlaceClient.js, public/profile-power-place-visual-export.js, public/profile-background-zone-controls.js.

Implement minimal safe fix:
- AbortController timeout in supabaseClient request.
- AbortController timeout in powerPlaceClient request.
- ProfilePage loading fallback with Войти заново.
- Clear invalid/expired session safely.
- Remove or guard React Fiber hook-index state mutation in profile-power-place-visual-export.js.
- Do not rewrite ProfilePage wholesale.

Run tests/build and browser QA on /, /profile, /masters, /profile/admin. Report root cause confirmed vs suspected, changed files, checks, risks, live status.
```

### Prompt B — Stage 2 PR cleanup

```text
Repo: https://github.com/andylitvinov-design/reiki-yggdrasil
Base: stable main after /profile loading fix

Audit all open PRs using docs/PROFILE_SERVICES_ROADMAP.md Stage 2. For each PR, classify: merge now, rebase and test, cherry-pick only, close as superseded, or keep draft. Do not merge UI/profile PRs without browser QA. Prefer docs/data PRs first. Report exact recommendation per PR and what changed in main already.
```

### Prompt C — Stage 3 service shop integration

```text
Repo: https://github.com/andylitvinov-design/reiki-yggdrasil
Base: stable main after /profile loading fix
Target branch: codex/integrate-template-services-ui

Turn PR #127 from draft foundation into a working services/shop flow. First read AGENTS.md, README.md, STATE.md, LOG.md, docs/PROFILE_SERVICES_ROADMAP.md, PR #127 files, src/pages/ProfilePage.jsx, src/main.jsx, src/lib/profileServicesClient.js, scripts/apply-template-services-ui.mjs.

Run:
npm run check:template-services-ui
npm run apply:template-services-ui
npm run test:profile-services
npm run test:mandala-template
npm run check
npm run build

Inspect diff before commit. Verify /profile, /, /masters, /profile/admin. Preserve RU-default, Supabase auth/data flow, Vercel rewrites, desktop 3-column layout. Report changed files, checks, browser QA, risks, what was not verified.
```
