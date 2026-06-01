# Reiki Yggdrasil — STATE

Last updated: 2026-06-02

## Current verified repo state

- repo: `andylitvinov-design/reiki-yggdrasil`
- default branch: `main`
- live URL from project memory: `https://reiki-yggdrasil.vercel.app`
- hosting from repo config: Vercel / Vite build
- build command: `npm run build`
- output directory: `dist`
- framework: `vite`

## 2026-06-02 — Profile Lite Power Place layout parity follow-up

- Branch: `codex/fix-profile-lite-power-place-layout-parity`, based on `origin/main` commit `d7cf7d7`.
- Scope: fix the live visual regression after PR #191 where `/profile/mandalas` had the old workspace content but not the old desktop layout.
- Fixed in Lite Power Place:
  - removed the Lite use of the old `.powerPlaceMode` two-column override that hid the center column and stretched the constructor into the right side;
  - restored a true `workspaceMainColumns` structure: left `powerLibrarySidebar`, center `workspaceCenterColumn`, right `workspaceRightColumn`;
  - restored left source controls: `Добавить мандалу`, `Группа`, `Категория`, quick source buttons, `Сохранённые изображения`, and saved-image list state;
  - moved background, layout, analysis, resource comparison, and object controls into the separate right rail;
  - kept constructor type controls and the mandala visual in the center;
  - constrained the Lite mandala visual to an old-reference-sized center panel instead of oversized/overflowing or collapsed sizing;
  - kept `Object refs JSON` inside advanced diagnostics only, not as the primary UX.
- Local rendered QA:
  - local dev server used layout-only fake Supabase env and fake hash session; no real tokens/env/JWT were used;
  - `/profile/mandalas` at 1280 showed `260px 640px 320px` columns, visible right rail, visible left source controls, center mandala panel `560px`, mandala `362px`, and horizontal overflow `0`;
  - `/profile/mandalas` at 390 stacked hero, tabs, center constructor/visual, left source controls, right settings controls, then save/download/print actions, with horizontal overflow `0`;
  - `/profile-old` still opened locally at 1280 with no Vite overlay, no console errors, and horizontal overflow `0`.
- Verification:
  - Passed `npm run test:profile-lite` after a red/green contract-test cycle.
  - Passed `npm run test:profile-media`.
  - Passed `npm run test:power-place`.
  - Passed `npm run test:profile-loading-recovery`.
  - Passed `npm run check` with existing `validate:videos` warnings for `RY-L04-S04` and `RY-L04-S05` and existing Vite chunk-size warning.
  - Passed standalone `npm run build` with existing Vite chunk-size warning.
- Not verified:
  - production deploy/live parity after merge;
  - real authenticated Google/Supabase/RLS media and composition save/load flows.

## 2026-06-01 — PR #191 production deploy status for Power Place parity

- PR: #191 `Restore Profile Lite Power Place visual parity`.
- Merge SHA: `42491aa3395470ac6013a28bc5e8292feb53507f`.
- Reported deployment result: Vercel Production deploy succeeded for the merge SHA.
- Fallback deploy: not used, correctly, because the normal production deployment succeeded.
- Scope already merged:
  - `/profile` and `/profile/mandalas` remain Profile Lite routes;
  - `/profile-old` remains the heavy reference route;
  - `/`, `/masters`, and `/profile/admin` remain unchanged;
  - Lite Power Place primary UX is visual `Мастерская мандал`, not JSON-first.
- Current verification status:
  - source/tests/build were verified before merge in PR #191;
  - production deployment is reported successful;
  - unauthenticated live route QA still needs to be run when network/browser access is available;
  - authenticated Google/Supabase/RLS QA is not verified by automation and must be manually verified by Andrey on live.
- Do not claim as verified yet:
  - Google login;
  - authenticated `/profile/mandalas` visual parity with `/profile-old`;
  - Storage/RLS media upload/display/delete;
  - saved composition save/load/update;
  - services/orders/chats live data behavior.
- Required next checks:
  - no-auth route QA on `https://mentalica.vercel.app/`, `/profile`, `/profile-lite`, `/profile-old`, `/profile/mandalas`, `/masters`, `/profile/admin`;
  - manual authenticated QA by Andrey with screenshots comparing `/profile/mandalas` and `/profile-old`.

## 2026-06-01 — Profile Lite Power Place parity restoration

- Branch: `codex/profile-lite-power-place-parity`, originally based on `5efbcea` and merged with current `origin/main` commit `1926d97` before PR review.
- Scope: replace the formal JSON-first Lite Power Place module with a visual mandala workshop modeled on `/profile-old`, while keeping `/profile-old` available as the heavy reference.
- Restored in Lite:
  - hero/section `Мастерская мандал`;
  - workspace switches `Место силы` / `Мои мандалы`;
  - saved composition selector `Загрузить сохранённое место силы`;
  - central `Фото клиента / цели` flow;
  - visual constructor area for `Зодиак`, `Звезда`, `Шахматы`, `Мандала`, `Алтарь`, `Бизнес`, `ДАО`;
  - zodiac variants `2/4/6/8/8+/12/12+`, star `closed/open`, chess `classic-14/classic-8/plus-8`, business `1/3` zones;
  - inner/outer background controls, `Без фона`, saved-image cover picker, custom cover upload;
  - object image picker from client photos, tradition assets, and materials, plus per-slot upload;
  - Storage-backed central/object/cover upload wiring through `uploadProfileMedia`;
  - client photo delete confirmation `Удалить фото из базы?`;
  - save/update through existing `createPowerPlaceComposition` / `updatePowerPlaceComposition`;
  - old HTML download fallback and print flow;
  - `Object refs JSON` moved to an advanced diagnostics details block instead of primary UX.
- Verification:
  - Passed `npm run test:profile-lite`.
  - Passed `npm run test:profile-media`.
  - Passed `npm run test:power-place`.
  - Passed `npm run test:profile-loading-recovery`.
  - Passed `npm run check` with existing video placeholder warnings for `RY-L04-S04` and `RY-L04-S05`.
  - Passed `npm run build` with existing Vite chunk-size warning.
- Not verified:
  - authenticated live Supabase media/composition save/load parity;
  - authenticated screenshot-level visual parity against `/profile-old`, because local preview has no Supabase env/session and the checked routes stop at the auth/env gate.

## 2026-06-01 — Profile Lite authenticated QA and gap-analysis after PR #188

- Branch: `codex/profile-lite-authenticated-qa`, based on `origin/main` merge commit `5efbcea` for PR #188.
- Scope: QA/gap-analysis of new `/profile` and `/profile-lite` Profile Lite cabinet against `/profile-old` reference, plus minimal schema-setup documentation guard.
- Route mapping verified by source/tests:
  - `/profile` and `/profile-lite` render `ProfileLitePage`;
  - `/profile-old` remains the heavy `ProfilePage` reference/diagnostic route;
  - `/profile/mandalas`, `/profile/services`, `/profile/orders`, `/profile/chats`, and `/profile/settings` render Profile Lite with the matching initial tab;
  - `/`, `/masters`, and `/profile/admin` remain routed separately.
- Authenticated flow coverage verified at client/contract level:
  - profile save/load uses `profile_cabinet_profiles` through existing session auth and safe payload normalization;
  - materials list/create/save uses `profile_cabinet_publications`, optional media upload, and storage-ref hydration;
  - media upload/display/delete covers client/goal photos and DB-row deletion; tradition media upload/display exists, but tradition delete remains a parity gap vs broader media expectations;
  - saved mandalas/compositions list/load/save/update uses `profile_cabinet_power_place_compositions`;
  - services/orders/chats clients and Lite modules are wired to their Supabase tables with inline `needs verification` failures instead of global auth failure.
- Gap fixed:
  - README setup list now includes `supabase/migrations/20260531090000_power_place_chess_format.sql`, because Profile Lite can save `constructor_type='chess'` and `chess_variant`.
- Parity gaps vs `/profile-old`:
  - Profile Lite Power Place constructor is a compact form/JSON editor, not the full visual old constructor with image picker, object placement, cover layers, uploads per slot, rich mandala preview, and category libraries.
  - Lite chats list/send existing conversations only; creating new conversations with approved masters remains `needs verification` in the UI.
  - Lite media has no tradition asset delete action.
  - Lite services can create/publish from form or selected composition, but no full service editing/archive UI is present.
- Needs verification:
  - real signed-in Supabase/RLS save/load/upload/delete flows on live production, because this QA environment has no `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_ADMIN_EMAIL`, `SUPABASE_ACCESS_TOKEN`, or `SUPABASE_PROJECT_REF`;
  - live schema state for `profile_cabinet_services`, `profile_cabinet_service_orders`, `profile_cabinet_chat_*`, storage bucket policies, and chess composition migration;
  - production/legacy visual route QA after this branch is merged/deployed.

## 2026-06-01 — Profile Lite full alternative cabinet

- Branch: `codex/profile-lite-full-alternative-cabinet`, based on fresh `origin/main` commit `7645c0c`.
- Scope: replace the daily `/profile` cabinet with a modular `ProfileLitePage` alternative while preserving old heavy `ProfilePage` at `/profile-old`.
- Route mapping change:
  - `/profile` renders `ProfileLitePage` overview;
  - `/profile-lite` renders the same Lite overview fallback;
  - `/profile-old` remains the heavy diagnostic/reference cabinet;
  - `/profile/mandalas`, `/profile/services`, `/profile/orders`, `/profile/chats`, and `/profile/settings` render Lite tabs;
  - `/`, `/masters`, `/profile/admin`, and Vercel rewrites remain unchanged.
- Architecture:
  - `ProfileLitePage.jsx` is the route container for auth/session/bootstrap and active-tab wiring;
  - focused modules live under `src/pages/profile-lite/`;
  - profile, materials, media/photos, saved mandalas, services, orders, and chats load independently after shell open;
  - secondary module failures render inline sanitized `needs verification` messages and do not return the shell to global loading.
- Implemented modules:
  - Overview, Профиль, Мои мандалы / Power Place foundation, Фото / Медиа, Материалы, Услуги, Заказы, Чаты, Настройки, Диагностика.
- Needs verification:
  - live Supabase table/RLS availability for services/orders/chats;
  - authenticated live media upload/delete and saved composition save/update;
  - visual/data parity against `/profile-old` after deploy.
- Verification so far:
  - Passed `npm run test:profile-lite`.
  - Passed `npm run test:profile-materials`.
  - Passed `npm run test:profile-media`.
  - Passed `npm run test:profile-services`.
  - Passed `npm run test:power-place`.
  - Passed `npm run test:profile-loading-recovery`.
  - Passed `npm run check` with existing video placeholder warnings for `RY-L04-S04` and `RY-L04-S05`.
  - Passed `npm run build`.
  - Local preview QA at `http://localhost:4178` covered `/`, `/profile`, `/profile-lite`, `/profile-old`, `/profile/mandalas`, `/profile/services`, `/profile/orders`, `/profile/chats`, `/profile/settings`, `/masters`, and `/profile/admin` at desktop 1280 and mobile 390 with HTTP 200, no console issues, no Vite overlay, and no horizontal overflow.
  - Authenticated Supabase module QA and production/legacy live QA remain pending.

## 2026-06-01 — JWT immediate shell-open for heavy ProfilePage

- Branch: `claude/festive-beaver-3ceaf9`.
- Root cause fixed: heavy `ProfilePage` hung on "Загружаю кабинет..." because the shell waited for remote `getCurrentUser` (even with a 1500ms race fallback). When `/auth/v1/user` endpoint hangs, the fallback did not reliably open the cabinet.
- Fix: `loadProfileCabinetBootstrap` now parses the JWT from `session.access_token` synchronously. If `sub`/`user_id` is present, the shell opens immediately (step: `session-shell-opened`, fallback user used: yes). `getCurrentUser` runs in background only via new `runBackgroundUserVerification` with 4s timeout.
- Background verification outcomes:
  - success: no visible change (cabinet already open);
  - timeout/network-fail: `setSecondaryDataNotice` with safe offline notice;
  - auth-error (401/403): `resetProfileSessionState("Сессия устарела. Войдите заново.")`.
- Non-JWT session path: unchanged — old `getCurrentUserWithFastFallback` race with 1500ms fallback still used for safety.
- Changed files: `src/lib/profileBootstrapClient.js`, `src/pages/ProfilePage.jsx`, `test/profileBootstrapClient.test.mjs`, `test/profilePageAuthBootstrap.test.mjs`.
- Live QA required after deploy: `/profile?debugAuth=1` must show `bootstrap step: session-shell-opened`, `fallback user used: yes`, `render state: user` within 1 sec. Also verify `/profile-old?debugAuth=1` and `/profile-lite`.

## 2026-06-01 — Heavy ProfilePage restored to `/profile` after PR #180

- Branch: `codex/restore-heavy-profile-after-recovery-script-removal`, based on fresh `origin/main` after PR #180.
- Scope: restore `/profile` to the heavy `ProfilePage` after PR #180 removed `profile-auth-render-recovery.js` from `index.html`.
