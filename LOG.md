# Reiki Yggdrasil — LOG

## 2026-06-01 — PR #191 production deploy status for Power Place parity

- PR: #191 `Restore Profile Lite Power Place visual parity`.
- Merge SHA: `42491aa3395470ac6013a28bc5e8292feb53507f`.
- GitHub PR state verified: merged into `main`.
- Reported deployment result: Vercel Production deploy succeeded for the merge SHA.
- Fallback deploy was not used because normal production deployment succeeded.
- Documentation update:
  - `STATE.md` and `LOG.md` now record the post-merge production deploy / QA status from GitHub API, not from a local push.
- Current QA status:
  - no-auth live route QA still needs to run when browser/network access is available;
  - authenticated Google/Supabase/RLS QA remains manual and must not be claimed by automation.
- Required no-auth live routes to check later:
  - `https://mentalica.vercel.app/`
  - `https://mentalica.vercel.app/profile`
  - `https://mentalica.vercel.app/profile-lite`
  - `https://mentalica.vercel.app/profile-old`
  - `https://mentalica.vercel.app/profile/mandalas`
  - `https://mentalica.vercel.app/masters`
  - `https://mentalica.vercel.app/profile/admin`
- Manual authenticated QA still required from Andrey:
  - Google login;
  - visual comparison of `/profile/mandalas` and `/profile-old`;
  - media upload/display/delete;
  - saved composition save/load/update;
  - Storage/RLS behavior;
  - services/orders/chats live data behavior.

## 2026-06-01 — Profile Lite Power Place parity restoration

- Branch: `codex/profile-lite-power-place-parity`.
- Changed files:
  - `src/pages/ProfileLitePage.jsx`
  - `src/pages/profile-lite/ProfileLitePowerPlaceModule.jsx`
  - `test/profileLiteCabinetContract.test.mjs`
  - `STATE.md`
  - `LOG.md`
- Result:
  - replaced the Lite `Object refs JSON` primary screen with a visual `Мастерская мандал` workspace;
  - restored `Место силы` / `Мои мандалы` switches, saved composition loading, central client/goal photo, format controls, background layers, object picker, save/update, HTML download fallback, and print;
  - kept `Object refs JSON` only in an advanced diagnostics block;
  - wired central/object/cover uploads to existing `uploadProfileMedia` paths and preserved saved composition persistence fields through `powerPlaceClient`;
  - added source-level contract coverage so Lite cannot silently regress back to JSON-first placeholder UX.
- Checks run:
  - `npm run test:profile-lite`
  - `npm run test:profile-media`
  - `npm run test:power-place`
  - `npm run test:profile-loading-recovery`
  - `npm run check`
  - `npm run build`
- Check notes:
  - `npm run check` passed with existing `validate:videos` warnings for `RY-L04-S04` and `RY-L04-S05`.
  - `npm run build` passed with the existing Vite chunk-size warning.
- Local QA note:
  - preview was started on `http://localhost:4180/`;
  - Playwright screenshots covered `/profile/mandalas` desktop 1280, `/profile/mandalas` mobile 390, and `/profile-old` desktop in the no-env state;
  - no console warnings/errors were reported for the checked no-env routes;
  - authenticated visual parity remains pending because local preview has no Supabase env/session and both Lite and `/profile-old` stop at the auth/env gate.
- Live QA:
  - PR #191 has since been merged and production deployment reported successful;
  - no-auth and authenticated live route QA remain explicitly pending until browser/network/manual checks are completed.

## 2026-06-01 — Profile Lite QA after PR #188

- Branch: `codex/profile-lite-authenticated-qa`.
- PR reference: #188, merge commit `5efbcea`, `Build modular Profile Lite alternative cabinet`.
- Changed files:
  - `README.md`
  - `STATE.md`
  - `LOG.md`
  - `test/profileLiteCabinetContract.test.mjs`
- QA focus:
  - compared new `/profile` and `/profile-lite` Lite cabinet wiring with `/profile-old` heavy reference route;
  - checked profile save/load, materials, media, saved Power Place compositions, services, orders, chats, and diagnostics safety at source/contract-test level;
  - confirmed no tokens/env/JWT are rendered by Profile Lite diagnostics tests.
- Bug/gap fixed:
  - added missing README setup entry for `supabase/migrations/20260531090000_power_place_chess_format.sql`;
  - added a Profile Lite contract assertion so the chess composition migration remains documented with the client that writes `chess_variant`.
- Authenticated live QA:
  - not completed in this environment because local env and Supabase project credentials are unset;
  - mark real RLS/storage flows as `needs verification` until tested with a signed-in production/preview session.
- Parity gaps recorded in `STATE.md`.

## 2026-06-01 — Profile Lite full alternative cabinet

- Branch: `codex/profile-lite-full-alternative-cabinet`.
- Changed files:
  - `src/main.jsx`
  - `src/pages/ProfileLitePage.jsx`
  - `src/pages/profile-lite/*`
  - `src/lib/profileLiteClient.js`
  - `src/profileCabinet.css`
  - `test/profileLiteClient.test.mjs`
  - `test/profileLiteRoute.test.mjs`
  - `test/profileLiteCabinetContract.test.mjs`
  - `package.json`
  - `docs/profile-lite-alternative-cabinet-plan.md`
  - `docs/profile-lite-alternative-cabinet-one-shot-program.md`
  - `STATE.md`
  - `LOG.md`
- Route result:
  - `/profile` and `/profile-lite` render the modular Lite cabinet overview;
  - `/profile-old` remains heavy `ProfilePage`;
  - `/profile/mandalas`, `/profile/services`, `/profile/orders`, `/profile/chats`, and `/profile/settings` route to Lite tab entrypoints;
  - `/`, `/masters`, `/profile/admin`, and `vercel.json` rewrites are unchanged.
- Implemented:
  - shell opens after valid session/user and does not wait for profile/materials/media/mandalas/services/orders/chats;
  - profile editor restores old fields and preview;
  - materials/media/saved mandalas/Power Place persistence foundation use existing clients;
  - services/orders/chats are visible modules using existing clients with inline `needs verification` fallbacks;
  - diagnostics show safe statuses only.
- Checks run so far:
  - `npm run test:profile-lite`
  - `npm run test:profile-materials`
  - `npm run test:profile-media`
  - `npm run test:profile-services`
  - `npm run test:power-place`
  - `npm run test:profile-loading-recovery`
  - `npm run check`
  - `npm run build`
- Local browser QA:
  - preview URL: `http://localhost:4178`;
  - desktop 1280 and mobile 390 covered `/`, `/profile`, `/profile-lite`, `/profile-old`, `/profile/mandalas`, `/profile/services`, `/profile/orders`, `/profile/chats`, `/profile/settings`, `/masters`, and `/profile/admin`;
  - all checked routes returned HTTP 200, no console errors/warnings, no Vite error overlay, and no horizontal overflow.
- Not verified yet:
  - authenticated live Supabase data parity with `/profile-old`;
  - production/legacy deployment verification.
