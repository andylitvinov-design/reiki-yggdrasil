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

## 2026-06-02 — Profile Lite copied old cabinet layout structures

- Branch: `codex/copy-profile-old-layout-into-lite`, based on `origin/main` merge commit `dad752c`.
- Scope: copy the already-working `/profile-old` cabinet layout structures from `src/pages/ProfilePage.jsx` into Profile Lite modules while preserving the new stable Profile Lite auth shell, route-backed tabs, and `ProfileLiteImagePicker`.
- Old sections copied/reused:
  - `profileEditor` structure: `profileTabContent`, `profileForm`, `cabinetPreview`, old RU preview copy;
  - materials workspace: `workspaceMainColumns`, `mandalaModeSidebar`, `workspaceCenterColumn`, `mandalaGallery`, `mandalaCardsGrid`, `mandalaMaterialCard`, right-side material form;
  - services/orders/chats workspaces: old `mandalaModeSidebar` left rail plus `chatPlaceholderWorkspace` / `chatPlaceholderHeader` center surface, with live Lite forms/lists kept in `workspaceRightColumn`;
  - mandalas kept the old `workspaceMainColumns` / `powerLibrarySidebar` / `workspaceCenterColumn` / `workspaceRightColumn` / `powerPlaceConstructor` / `powerPlaceSettings` structure and received scoped fit/overflow hardening.
- Contract coverage:
  - `test/profileLiteCabinetContract.test.mjs` now asserts old non-mandala wrapper/class reuse, old material gallery classes, and old services/orders/chats placeholder surfaces.
- Local route-stubbed rendered QA with fake public Supabase env and fake local session only:
  - `/profile-old` desktop 1280: overflow `0`, old left/center/right structure present;
  - `/profile/mandalas` desktop 1280: columns `260px 640px 320px`, mandala panel `560px`, mandala `362px`, overflow `0`;
  - `/profile-old` mobile 390: single `358px` column, overflow `0`;
  - `/profile/mandalas` mobile 390: single `358px` column, mandala panel `324px`, mandala `218px`, overflow `0`;
  - `/profile?tab=materials`, `/profile/services`, `/profile/orders`, `/profile/chats` desktop 1280: old Lite legacy columns `260px 620px 340px`, left/center/right blocks present, overflow `0`;
  - chat empty-data placeholder path rendered 3 old-style mock messages with no console warnings/errors.
- Verification:
  - passed `npm run test:profile-lite` after an intentional RED failure for missing old `profileTabContent`;
  - passed `npm run test:profile-media`;
  - passed `npm run test:power-place`;
  - passed `npm run test:profile-loading-recovery`;
  - passed `npm run check` with existing `validate:videos` warnings for `RY-L04-S04` and `RY-L04-S05` plus existing Vite large-chunk warning;
  - passed standalone `npm run build` with existing Vite large-chunk warning.
- Not verified:
  - real authenticated production Supabase/RLS media upload/delete, saved composition save/load/update, service publishing, orders, and chat data behavior;
  - authenticated live `/profile-old` versus `/profile/mandalas` screenshot-level comparison with a real user session;
  - production deployment of this branch.

## 2026-06-02 — Profile Lite parity PR #196 merged, production deploy blocked

- PR: #196 `Polish Profile Lite mandala parity`.
- Merge commit: `bfb9000c99e298b6f276b46aebf24a8bc07c819d`, merged into `main` at `2026-06-02T00:08:01Z`.
- Main CI:
  - GitHub Actions `CI` run `26789917714` passed for merge SHA `bfb9000c99e298b6f276b46aebf24a8bc07c819d`.
  - GitHub Pages run `26789917711` failed, but production profile-cabinet hosting is Vercel.
- Vercel auto-deploy:
  - commit status for the merge SHA is `failure`;
  - reason: `Deployment rate limited — retry in 24 hours`;
  - target URL: `https://vercel.com/super10?upgradeToPro=build-rate-limit`.
- Fallback deploy:
  - workflow: `.github/workflows/deploy-production.yml`;
  - run: `26789944982`;
  - target ref: `main`;
  - expected SHA: `bfb9000c99e298b6f276b46aebf24a8bc07c819d`;
  - SHA verification and project check passed;
  - Vercel prebuilt deployment failed at `Deploy prebuilt to Vercel production`;
  - failure reason from logs: `Resource is limited - try again in 24 hours (more than 100, code: "api-deployments-free-per-day")`.
- Live route availability after deploy failure:
  - `https://mentalica.vercel.app/profile/mandalas` responds with no framework overlay and horizontal overflow `0`, but opens the Lite auth/debug gate without a real browser session;
  - `https://mentalica.vercel.app/profile-old` responds with no framework overlay and horizontal overflow `0`, but opens the heavy login gate without a real browser session;
  - `https://reiki-yggdrasil.vercel.app/profile/mandalas` responds with no framework overlay and horizontal overflow `0`, but opens the Lite auth/debug gate and showed an expired stored-session notice in the test browser.
- Live version check:
  - Production URL: `https://mentalica.vercel.app/`;
  - Legacy URL: `https://reiki-yggdrasil.vercel.app/`;
  - Status/version URL: none confirmed in this project;
  - Expected SHA: `bfb9000c99e298b6f276b46aebf24a8bc07c819d`;
  - Live SHA/build marker: unknown;
  - Match: unknown;
  - Evidence source: GitHub commit status and fallback workflow logs show Vercel deployment was rate-limited before production alias verification.
- Current deployment status:
  - code is merged to `main`;
  - production is not proven updated to PR #196;
  - retry production deploy after the Vercel daily deployment limit resets.

## 2026-06-02 — Profile Lite Power Place deep parity audit follow-up

- Branch: `codex/profile-lite-power-place-parity-deep-audit`, based on `origin/main` commit `6fbfdb9` after PR #194.
- Scope: post-PR #191/#192/#194 parity audit and targeted Lite `/profile/mandalas` fix against `/profile-old`, without changing auth/bootstrap, `/profile-old`, `/`, `/masters`, or `/profile/admin`.
- Design gaps found:
  - live production cannot currently show either workspace without an authenticated session: `https://mentalica.vercel.app/profile/mandalas` opens the Lite auth/debug gate and `https://mentalica.vercel.app/profile-old` opens the heavy login gate;
  - local authenticated rendered comparison showed the old reference hero starts directly below the heavy topbar, while Lite had tab/status chrome pushing the workspace down, especially on mobile where the tab rail consumed about 454px before the mandala hero;
  - Lite left source rail had only technical source types and missed the old taxonomy groups (`ДАО РИ`, `Мистерии`, `Каналы`, `Фон`, `Форма`, `Талисманы`, `Артефакты`, `Клиенты`);
  - `Добавить мандалу` switched to the saved-list tab instead of opening a selection/upload path, and there was no explicit working `Выбрать из базы` control in the left rail.
- Fixed:
  - added active-tab class hooks to `ProfileLiteShell` and mandalas-only compact shell styling, preserving route-backed tabs while making the mandala workspace appear much earlier;
  - changed mobile mandala tab navigation from ten stacked full-width buttons to a horizontal route-backed strip;
  - added the old source taxonomy groups to the left rail and kept source filters/saved-image cards compact;
  - made `Добавить мандалу` and `Выбрать из базы` open the image picker for the selected object slot or center image instead of switching to an unrelated saved-list view;
  - extended `test/profileLiteCabinetContract.test.mjs` to guard the base-selection label, old source taxonomy, and active-tab shell class hook.
- Local rendered QA with fake public Supabase env and fake JWT only:
  - `/profile/mandalas` desktop 1280: columns `260px 640px 320px`, no horizontal overflow, no framework overlay, no console warnings/errors; right rail and actions visible; mandala panel `560px`, mandala `362px`;
  - `/profile/mandalas` mobile 390: single `358px` column, no horizontal overflow, no framework overlay, no console warnings/errors; mobile tabs reduced from the earlier stacked rail to a `56px` horizontal rail; mandala hero appears in the first viewport and center constructor follows before the left/right rails;
  - `/profile-old` desktop 1280: reference route opens locally with the old workspace, no horizontal overflow, no framework overlay, no console warnings/errors;
  - central image picker opens from `Фото клиента / цели` with `Сохранённые фото` and `Загрузить новое фото`; signed URL placeholder is absent when there is no storage ref to display;
  - `Выбрать из базы` opens the image picker from the left rail and is not an inert button;
  - after 10 seconds, every Profile Lite tab clicked successfully with the expected route/query, active tab, no overlay, and horizontal overflow `0`;
  - guard routes `/`, `/masters`, and `/profile/admin` opened locally with no overlay or horizontal overflow; `/masters` and `/profile/admin` showed expected `Failed to fetch` from fake Supabase URL.
- Verification:
  - passed `npm run test:profile-lite` after an intentional RED failure for missing `Выбрать из базы`;
  - passed `npm run test:profile-media`;
  - passed `npm run test:power-place`;
  - passed `npm run test:profile-loading-recovery`;
  - passed `npm run check` with existing video placeholder warnings for `RY-L04-S04` and `RY-L04-S05` plus existing Vite large-chunk warning;
  - passed standalone `npm run build` with the existing Vite large-chunk warning.
- Still needs authenticated production verification:
  - real Supabase/RLS media upload/delete, signed URL hydration, saved composition save/update/load, service publishing, and old `/profile-old` authenticated visual comparison with a real user session;
  - production/live verification after this branch is committed, merged, and deployed.

## 2026-06-02 — Profile Lite central image picker extraction

- Branch: `profile-lite-central-image-picker-fix`.
- Scope: `/profile/mandalas` Profile Lite Power Place central/object/cover image picker only.
- Changed:
  - added dedicated `ProfileLiteImagePicker` component for saved-image selection, upload, delete, signed-URL placeholders, and modal close timing;
  - wired the picker into the existing Profile Lite three-column Power Place layout without changing `/profile-old`, auth/bootstrap, Vercel rewrites, Supabase env, `/`, `/masters`, or `/profile/admin`;
  - replaced inert `Выбрать из базы` with active `Сохранённые фото`;
  - central-photo selection now updates `central_photo_id`, `object_refs.__center_image`, and `object_ref_urls` immediately when a card has a display URL;
  - central-photo upload now keeps `saved.display_url || saved.signed_url || uploaded.signedUrl` and `saved.image_ref || uploaded.ref`, adds the saved photo to `clientGoalPhotos`, and selects it as the mandala center;
  - raw `storage://` images without a display URL show `Нужна signed URL` placeholders instead of transparent cards;
  - deleting the active client photo clears the central photo ref and display URL mapping;
  - upload prerequisite failures now reject after setting the existing UI error state, so the modal does not close as a false success.
- Verification status:
  - passed `npm run test:profile-lite`;
  - passed `npm run test:profile-media`;
  - passed `npm run test:power-place`;
  - passed `npm run test:profile-loading-recovery`;
  - passed `npm run check` with existing video placeholder warnings for `RY-L04-S04` and `RY-L04-S05` and the existing Vite chunk-size warning;
  - passed `npm run build` with the existing Vite chunk-size warning;
  - authenticated Supabase upload/select/delete QA on live remains `needs manual verification by Andrey` until the deployed branch is checked with a real session.

## 2026-06-02 — Profile Lite route-backed tab navigation freeze fix

- Branch: `codex/fix-profile-lite-tabs-freeze`, based on `origin/main`.
- Scope: stabilize Profile Lite shell/tab navigation after PR #192/#193 without merging or reusing the central image picker PR #194.
- Root cause found:
  - Profile Lite top tabs were local-state-only `<button>` controls wired to `setActiveTab`;
  - direct subroutes existed for several modules, but the shell tab map had no URL contract and `/profile?tab=...` was not parsed;
  - if an active module render crashed after async profile/module data arrived, the module could take the shell subtree with it instead of failing inline.
- Changed:
  - `PROFILE_LITE_TABS` now owns stable `href` values;
  - shell tabs render route-backed anchors and intercept clicks for SPA `pushState` navigation;
  - `/profile?tab=profile|media|materials|diagnostics` and `/profile-lite?tab=...` resolve to the requested Lite tab after reload;
  - existing subroutes remain active for `/profile/mandalas`, `/profile/services`, `/profile/orders`, `/profile/chats`, and `/profile/settings`;
  - `ProfileLitePage` syncs `activeTab` from route/query changes and wraps the active module in an inline ErrorBoundary so shell tabs remain mounted if a module fails.
- Route/tab behavior:
  - Обзор -> `/profile`
  - Профиль -> `/profile?tab=profile`
  - Мои мандалы -> `/profile/mandalas`
  - Фото / Медиа -> `/profile?tab=media`
  - Материалы -> `/profile?tab=materials`
  - Услуги -> `/profile/services`
  - Заказы -> `/profile/orders`
  - Чаты -> `/profile/chats`
  - Настройки -> `/profile/settings`
  - Диагностика -> `/profile?tab=diagnostics`
- Verification status:
  - passed `npm run test:profile-lite` after RED contract failures for route-backed tabs/query mapping/ErrorBoundary;
  - passed `npm run test:profile-loading-recovery`;
  - passed `npm run check` with existing video placeholder warnings for `RY-L04-S04` and `RY-L04-S05`, plus existing Vite chunk-size warning;
  - passed standalone `npm run build` with the existing Vite chunk-size warning;
  - local dev QA with fake Supabase env and fake JWT fallback opened `/profile`, waited 10 seconds, clicked every tab, verified URL + active tab changes, kept 10 tabs mounted, found no `clientPhotoPickerBackdrop`, no Vite overlay, and horizontal overflow `0`;
  - direct local URLs opened the expected tabs for `/profile/mandalas`, `/profile/services`, `/profile/orders`, `/profile/chats`, and `/profile/settings`;
  - local guard routes `/profile-old`, `/`, `/masters`, and `/profile/admin` opened without Vite overlay and with horizontal overflow `0`; `/masters` and `/profile/admin` showed expected `Failed to fetch` with fake Supabase URL only;
  - merge/deploy and production/legacy live QA remain pending in this entry until completed.
- Not changed:
  - `/profile-old`, `/`, `/masters`, `/profile/admin`, Supabase env/auth, Vercel rewrites for existing routes, and Power Place UX depth.

## 2026-06-02 — Profile Lite Power Place layout parity follow-up

- Branch: `codex/fix-profile-lite-power-place-layout-parity`, based on `origin/main` commit `d7cf7d7`.
- PR: #192, merged into `main` as `70d0fa881bbc51adb0c42d4b456162086f473e05`.
- Production deploy:
  - Vercel Production deployment `4896832273` succeeded for SHA `70d0fa881bbc51adb0c42d4b456162086f473e05`.
  - Deployment URL: `https://reiki-yggdrasil-4xrwn9vz8-super10.vercel.app`.
  - Fallback workflow was not used because Vercel auto-deploy reported success for the merge SHA.
- Main CI:
  - GitHub Actions `CI` run `26785839679` passed for the merge SHA.
  - GitHub Pages run `26785839690` failed, but this repo's production path for the profile cabinet is Vercel.
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
- Live rendered QA after merge/deploy:
  - `https://mentalica.vercel.app/profile/mandalas` at 1280 showed `260px 640px 320px` columns, visible left rail, visible center constructor, visible right rail, mandala panel `560px`, mandala `362px`, horizontal overflow `0`, no Vite overlay, and no browser console warnings/errors.
  - `https://mentalica.vercel.app/profile/mandalas` at 390 showed a single `358px` column with visible left rail, center constructor, right rail, mandala panel `342px`, mandala `218px`, horizontal overflow `0`, no Vite overlay, and no browser console warnings/errors.
  - `https://reiki-yggdrasil.vercel.app/profile/mandalas` at 1280 matched the same `260px 640px 320px` columns and overflow `0`.
  - `https://mentalica.vercel.app/profile-old` opened to the heavy cabinet login gate with no Vite overlay and horizontal overflow `0`; authenticated old-workspace live comparison still requires a real signed-in session.
- Verification:
  - Passed `npm run test:profile-lite` after a red/green contract-test cycle.
  - Passed `npm run test:profile-media`.
  - Passed `npm run test:power-place`.
  - Passed `npm run test:profile-loading-recovery`.
  - Passed `npm run check` with existing `validate:videos` warnings for `RY-L04-S04` and `RY-L04-S05` and existing Vite chunk-size warning.
  - Passed standalone `npm run build` with existing Vite chunk-size warning.
- Not verified:
  - real authenticated Google/Supabase/RLS media and composition save/load flows.
  - authenticated `/profile-old` workspace comparison on live with a real user session.

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
