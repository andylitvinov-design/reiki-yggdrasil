# Reiki Yggdrasil — STATE

Last updated: 2026-06-01

## Current verified repo state

- repo: `andylitvinov-design/reiki-yggdrasil`
- default branch: `main`
- live URL from project memory: `https://reiki-yggdrasil.vercel.app`
- target production URL from AGENTS.md: `https://mentalica.vercel.app`
- hosting from repo config: Vercel / Vite build
- build command: `npm run build`
- output directory: `dist`
- framework: `vite`

## 2026-06-01 — Emergency revert of PR #179 and `/profile` render recovery gate

- Branch: `codex/revert-heavy-profile-main-route`, based on fresh `origin/main` commit `3786fdd`.
- Scope: stabilize `/profile` after PR #179 and remove the hidden path-sensitive render recovery behavior from normal `/profile` loads.
- Root cause finding:
  - PR #179 only restored heavy `ProfilePage` on `/profile`;
  - `/profile-old` and `/profile` both used heavy `ProfilePage`, but only `/profile` was affected by `public/profile-auth-render-recovery.js`;
  - the render recovery script was exact-path scoped to `/profile` and could run `window.location.replace(...)` while the page still showed `Загружаю кабинет...`;
  - this made `/profile` and `/profile-old` non-equivalent even when they rendered the same React component.
- Change:
  - `/profile` routes back to `ProfileLitePage`;
  - `/profile-lite` remains `ProfileLitePage`;
  - `/profile-old` remains the heavy `ProfilePage`;
  - modular heavy routes under `/profile/mandalas`, `/profile/services`, `/profile/orders`, `/profile/chats`, and `/profile/settings` remain routed to `ProfilePage`;
  - `public/profile-auth-render-recovery.js` now requires explicit `?enableRenderRecovery=1` and does not auto-run on `/profile`.
- Test coverage:
  - added `test/profileAuthRenderRecovery.test.mjs`;
  - strengthened `test/profilePageAuthBootstrap.test.mjs` so the old unconditional exact-`/profile` recovery gate cannot return unnoticed.
- Not changed:
  - PR #178 normalizeProfile save fix;
  - PR #176 modular routes;
  - PR #177 recovery summary docs;
  - Supabase/OAuth/env/migrations;
  - Google OAuth redirect defaults.
- Live QA remains required after merge/deploy:
  - `https://mentalica.vercel.app/profile` must open the lite cabinet;
  - `https://mentalica.vercel.app/profile-old` must open the heavy cabinet;
  - `https://mentalica.vercel.app/profile?enableRenderRecovery=1&debugAuth=1` should be used only for explicit recovery diagnostics.
- Do not restore heavy `ProfilePage` to `/profile` again until this PR is merged/deployed and the live path-sensitive behavior is verified.

## 2026-06-01 — `/profile-old` heavy cabinet smoke QA hardening

- Branch: `codex/profile-old-heavy-cabinet-smoke-qa`, based on fresh `origin/main` commit `6e4dc59`.
- Scope: source-level smoke hardening for the old heavy `/profile-old` cabinet only; `/profile` stays mapped to `ProfileLitePage`, `/profile-old` stays mapped to `ProfilePage`.
- Inspected modules:
  - top tabs: `power-place`, `mandalas`, `services`, `orders`, `chats`, `profile`;
  - profile form;
  - materials list/form;
  - Power Place constructor, saved images, client/goal photos, tradition media, and media upload paths;
  - services/orders/chats source-level presence.
- Change:
  - added inline smoke-mode notices for `services` and `orders` tabs inside `ProfilePage.jsx`, because these tabs existed in the top nav but had no body inside the heavy component;
  - kept services/orders isolated from the auth/bootstrap path and full-page loading state;
  - strengthened `test/profilePageAuthBootstrap.test.mjs` so services/orders cannot silently regress to blank/blocking tabs and secondary module failures cannot force global loading.
- Verification:
  - Passed `npm run test:profile-lite`.
  - Passed `node test/profilePageAuthBootstrap.test.mjs`.
  - Passed `npm run test:profile-materials`.
  - Passed `npm run test:profile-media`.
  - Passed `npm run test:profile-services`.
  - Passed `npm run test:power-place`.
  - Passed `npm run check` with existing video placeholder warnings for `RY-L04-S04` and `RY-L04-S05`.
  - Passed `npm run build`.
  - Local preview QA on `http://localhost:4173` covered `/profile` and `/profile-old?debugAuth=1` at desktop 1280 and mobile 390 with no horizontal overflow and no visible Vite/runtime error overlay in the no-env state.
- Live `/profile-old?debugAuth=1` authenticated module QA remains required after merge/deploy.

## 2026-06-01 — Old `/profile` fast session fallback while `/auth/v1/user` stalls

- Branch: `codex/profile-fast-session-fallback`, based on fresh `origin/main` commit `8290430`.
- Scope: minimal old `/profile` auth-bootstrap recovery only; no OAuth provider/redirect logic, Supabase schema/migrations/env names, Vercel routing, `/`, `/masters`, `/profile/admin`, `/profile-lite`, or heavy cabinet UI changes.
- Root cause path:
  - PR #171 removed `getOwnProfile` from the critical bootstrap path;
  - live `/profile?debugAuth=1` then showed a stored session and successful exchange, but `getCurrentUser` remained `loading`;
  - `loadProfileCabinetBootstrap` still waited on the long current-user timeout before using the existing JWT fallback, so React could remain in `loading` while a valid stored session contained a usable user id.
- Change:
  - `loadProfileCabinetBootstrap` now starts `getCurrentUser(session)` and a short fallback race in parallel;
  - fallback timeout is `1500 ms`;
  - if `getCurrentUser` returns a direct/wrapped user id first, that user wins;
  - if `getCurrentUser` returns explicit 401/403 first, fallback remains disabled and the auth error is returned;
  - if `getCurrentUser` is still pending at fallback timeout and the stored JWT has `sub` or `user_id`, bootstrap returns the fallback user and emits `fallback-used`;
  - if the JWT is not parseable, the existing sanitized `auth_load_timeout` error path is preserved;
  - `profile-request-started` remains absent in recovery bootstrap.
- Verification:
  - Passed `node test/profileBootstrapClient.test.mjs`.
  - Passed `node test/profilePageAuthBootstrap.test.mjs`.
- Live QA remains required after PR merge/deploy on `https://mentalica.vercel.app/profile?debugAuth=1`.

## 2026-05-31 — `/profile` cabinet shell opens from authenticated user id
