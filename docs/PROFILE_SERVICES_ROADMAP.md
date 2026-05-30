# Profile Cabinet and Services Roadmap

Last updated: 2026-05-30
Status: working roadmap / source of truth for the next implementation passes.

## Purpose

This document fixes the execution order for the Reiki Yggdrasil profile cabinet, master service shop, and order flow so we do not lose the plan across PRs, Codex sessions, or hotfixes.

Current priority:

1. Stabilize `/profile` first.
2. Then integrate the master services/shop foundation from PR #127.
3. Then verify Supabase migrations, RLS, routes, browser UX, and live deployment.
4. Only after that merge the service shop implementation.

Do not skip the stabilization phase. The services flow depends on `src/pages/ProfilePage.jsx`, so integrating it while `/profile` is unstable can break the master cabinet again.

## Current known state

### Repo and live

- Repo: `andylitvinov-design/reiki-yggdrasil`
- Current/legacy live URL: `https://reiki-yggdrasil.vercel.app`
- Target domain in docs: `https://mentalica.vercel.app`
- Framework: Vite + React
- Hosting: Vercel, `npm run build`, output `dist`

### Required stable routes

Always verify these after every profile/services change:

- `/`
- `/profile`
- `/masters`
- `/profile/admin`

### Required env names only

Never commit values. Only reference these names:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_ADMIN_EMAIL`

### Safety constraints

- Preserve RU-default interface.
- Preserve existing public home page unless a task explicitly targets it.
- Preserve Supabase auth/data flow.
- Preserve Vercel SPA rewrites.
- Preserve desktop three-column layout and mobile fallback.
- Do not expose secrets, env values, access tokens, or private user data.
- Do not rewrite `ProfilePage.jsx` wholesale when a small patch is enough.
- Do not apply draft services/order runtime directly to production without local tests and browser QA.

## Stage 0 — PR inventory cleanup

Before merging old work, classify open PRs.

### Safe candidates to review first

- PR #128 — docs-only service shop implementation concept.
  - Status: open, mergeable.
  - Runtime risk: low.
  - Usefulness: high as supporting documentation for the services/shop roadmap.

- PR #13 — verified Reiki step video mappings.
  - Status: open, mergeable.
  - Runtime risk: low if `npm run validate:videos`, `npm run validate:knowledge`, and `npm run build` still pass.
  - Content rule: do not invent unresolved video mappings.

- PR #7 — docs-only link to global autonomous project rules.
  - Status: open, mergeable.
  - Runtime risk: low.
  - Needs review because current `AGENTS.md` already has project-specific rules; avoid duplicating or weakening them.

- PR #81 — source panel visibility in all profile tabs.
  - Status: open, mergeable.
  - Risk: medium because it touches profile UI styles/visibility.
  - It says production was manually deployed; verify whether its changes are already in current `main` or should be merged/closed.

### Do not merge yet

- PR #127 — template services/orders foundation.
  - Status: draft.
  - It intentionally does not apply the UI patch to `ProfilePage.jsx` / `src/main.jsx` yet.
  - Keep as draft until Stage 2 is complete.

- PR #118 — mobile mandala actions and cover print export.
  - Status: open, mergeable false.
  - Likely overlaps with later merged runtime PDF/export fixes.
  - Do not merge until compared against current `public/profile-power-place-visual-export.js`.

### Likely stale/conflicting PRs

Review for closure or cherry-pick only:

- PR #46 — desktop left menu card readability.
- PR #36 / #34 / #31 — profile cabinet readiness docs.
- PR #32 — right panel audio cards.
- PR #30 — old step-linked mandalas profile MVP.
- PR #11 — psimaster free courses block.
- PR #8 — old course UI hierarchy/video block.
- PR #5 — Reiki step materials coverage audit.

For each stale PR, Codex should answer:

1. Is the functionality already present in `main`?
2. Is it still relevant?
3. Can it be safely cherry-picked as docs/data only?
4. Does it conflict with the current profile cabinet or public UI?
5. Should it be closed with a short explanation?

## Stage 1 — stabilize `/profile`

### Goal

`/profile` must never hang forever on `Загружаю кабинет...`.

### Confirmed problems / risks

- `src/lib/supabaseClient.js` currently uses `fetch` without `AbortController` timeout.
- `src/lib/powerPlaceClient.js` also uses `fetch` without timeout.
- `src/pages/ProfilePage.jsx` starts loading with `Boolean(supabaseEnv.isConfigured)`, so a hanging auth/profile request can leave the cabinet stuck.
- `index.html` loads several public runtime hotfix scripts after React.
- `public/profile-power-place-visual-export.js` uses React Fiber internals / hardcoded hook index in the existing save-as-new helper. This is unsafe and should be removed or guarded.

### Required fixes

1. Add timeout to `request()` in `src/lib/supabaseClient.js`.
   - Use `AbortController`.
   - Use about 12 seconds.
   - On timeout throw a safe Russian error.
   - Do not expose env values, URLs with secrets, or tokens.

2. Add timeout to `request()` in `src/lib/powerPlaceClient.js`.
   - Same rules.

3. Add safe fallback in `src/pages/ProfilePage.jsx`.
   - Loading cannot remain true forever.
   - Expired/invalid auth clears stored session and renders login.
   - Timeout/network errors show a visible RU error.
   - Add action: `Войти заново`.
   - `Войти заново` clears `reiki-yggdrasil-session` and returns to login state.

4. Audit `public/profile-power-place-visual-export.js`.
   - Remove React Fiber hook-index dispatch if possible.
   - Do not mutate React state through hardcoded hook index.
   - If save-as-new cannot be preserved safely, disable only that helper rather than risking `/profile`.
   - Ensure runtime enhancement does not run heavy logic during the initial loading screen.

5. Runtime isolation test.
   - Temporarily disable these in `index.html` locally:
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
- There is a visible recovery path.
- Tests/build pass.
- Live Vercel deployment is verified against the intended production commit.

## Stage 2 — update and integrate PR #127 safely

### Goal

Turn PR #127 from foundation/draft into a working master services/shop flow.

### Current PR #127 status

PR #127 prepares:

- `src/lib/profileServicesClient.js`
- Supabase migration `20260530120000_template_services_delivery_modes.sql`
- `src/lib/mandalaTemplateRenderer.js`
- `src/components/MasterTemplateServicesPanel.jsx`
- `src/components/PublicTemplateServicesPanel.jsx`
- `src/templateServices.css`
- `scripts/apply-template-services-ui.mjs`

But it does not apply the UI patch to:

- `src/pages/ProfilePage.jsx`
- `src/main.jsx`

So it is not yet a working shop in production.

### Required execution

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

### Expected cabinet result

In `/profile`, authenticated master should see:

- existing tabs remain stable;
- new section/tab `Услуги`;
- new section/tab `Заявки`;
- action under saved mandala / Power Place: `В услуги`;
- ability to create a service from a saved mandala/template;
- ability to edit description and delivery options;
- ability to publish/unpublish service.

### Expected public result

Public service flow:

1. User opens service feed/card.
2. User opens service profile.
3. User chooses format:
   - `signature` / master signed or finished version;
   - `no_signature` / automatic template version;
   - `both` / both versions.
4. If authenticated, CTA is `Оформить заказ`.
5. If not authenticated, CTA is `Войти через Google и оформить заказ`.
6. Selected `service_id` and `format` survive auth redirect.
7. After login, user lands in `/profile` order creation with selected service/format prefilled.
8. User fills request, goal, comment, and attaches photos/refs if supported.
9. Master sees the order in `Заявки`.

### Data and RLS requirements

Verify migration and RLS before treating this as production-ready:

- service delivery modes;
- template image fields;
- separate prices for delivery options;
- order format;
- client profile id;
- goal/request/comment fields;
- attachment refs;
- draft/submitted order status;
- master can read orders for own services;
- client can read own orders;
- anonymous users cannot create unsafe orders;
- no service-role key in frontend.

### Commands

```bash
npm run test:profile-services
npm run test:mandala-template
npm run test:profile-media
npm run test:profile-materials
npm run test:power-place
npm run check
npm run build
```

### Manual QA

- Master creates service from saved mandala.
- Master edits service description.
- Master publishes service.
- Public user sees service.
- Public user chooses each format.
- Google login preserves selected service/format.
- Client creates order.
- Master sees order.
- Master uploads final result if required.
- `/profile` mobile 390 remains usable.
- `/profile` desktop 1280/1366 preserves layout.
- `/`, `/masters`, `/profile/admin` smoke.

### Done definition

- PR #127 is rebased on stable `main`.
- Patch script applied cleanly.
- Browser QA passed.
- Supabase migration and RLS verified.
- PR is marked ready for review only after checks and QA.

## Stage 3 — service UX refinement

After the basic service flow works, improve UX.

### Master cabinet

- Clear separation:
  - `Мои мандалы`
  - `Место силы`
  - `Услуги`
  - `Заявки`
  - `Чаты`
  - `Профиль`
- Saved mandala card should have:
  - `Редактировать описание`
  - `В услуги`
  - `Скопировать ссылку`
- Service card should show:
  - title;
  - image/template preview;
  - delivery formats;
  - price if available;
  - status draft/published;
  - copy public link.

### Client flow

- Service profile page should clearly show:
  - what the client receives;
  - three format choices;
  - CTA depending on auth state;
  - upload/photo/reference instructions;
  - order status after submission.

### Order statuses

Use a clear order lifecycle:

- `draft`
- `submitted`
- `in_progress`
- `ready`
- `delivered`
- `cancelled`

Do not invent payment integration until explicitly scoped.

## Stage 4 — old PR cleanup

After Stage 1 and Stage 2:

1. Re-check open PR list.
2. Merge only PRs that are safe and still relevant.
3. Close stale/conflicting PRs with explanation.
4. Prefer cherry-picking small docs/data changes over merging old UI branches.

Suggested order:

1. Merge or close docs-only PRs (#128, #7, #34/#36 if still needed).
2. Review data-only PR #13.
3. Decide whether PR #81 is already included or still needed.
4. Close obsolete profile MVP PR #30 if current main already supersedes it.
5. Close or rewrite PR #118 if later export/runtime code supersedes it.
6. Review old UI PRs #8, #11, #32, #46 only after current live UI is stable.

## Stage 5 — project memory update

After each completed stage, update:

- `STATE.md`
- `LOG.md`
- optionally `docs/PROFILE_SERVICES_ROADMAP.md`

Each update should include:

- branch / PR;
- changed files;
- checks run;
- live verification status;
- risks;
- what was not verified.

## Codex prompt for Stage 1

```text
Repo: https://github.com/andylitvinov-design/reiki-yggdrasil
Live: https://reiki-yggdrasil.vercel.app
Target branch: codex/fix-profile-loading-regression

Fix /profile infinite loading. Read AGENTS.md, README.md, STATE.md, LOG.md, package.json, vercel.json, index.html, src/pages/ProfilePage.jsx, src/lib/supabaseClient.js, src/lib/powerPlaceClient.js, public/profile-power-place-visual-export.js, public/profile-background-zone-controls.js.

Implement minimal safe fix:
- AbortController timeout in supabaseClient request.
- AbortController timeout in powerPlaceClient request.
- ProfilePage loading fallback with Войти заново.
- Clear invalid/expired session safely.
- Remove or guard React Fiber hook-index state mutation in profile-power-place-visual-export.js.
- Do not rewrite ProfilePage wholesale.

Run tests/build and browser QA on /, /profile, /masters, /profile/admin. Report root cause confirmed vs suspected, changed files, checks, risks, live status.
```

## Codex prompt for Stage 2

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
