# Reiki Yggdrasil — LOG

## 2026-06-05 — Document draft/clean release workflow

- Branch: `main`.
- Scope: documentation and agent rules only; app code, routes, Supabase schema/env values, Vercel rewrites, public home page, and UI were not changed.
- Changed files:
  - `docs/release-workflow.md`
  - `AGENTS.md`
  - `README.md`
  - `LOG.md`
- Changed:
  - added the concept of two live versions: черновой/test site and чистовой/client live site;
  - documented target model `main → 2mentalica.vercel.app` and `production → client live`;
  - documented `release/*` branches for owner-approved releases from `main` into `production`;
  - added Vercel, Supabase, QA, rollback, and Codex safety rules;
  - linked the release workflow from README and added it to the required context-first reading list in `AGENTS.md`.
- Checks run:
  - GitHub file create/update API only.
- Not verified:
  - local `npm run build` / `npm run check`, because no app code was changed;
  - Vercel project `2mentalica`, `https://2mentalica.vercel.app`, `https://www.2mentalica.vercel.app`, branch `production`, production branch settings, and staging Supabase setup;
  - live deployment behavior.
- Risks:
  - `docs/release-workflow.md` describes the target operating model, but Vercel/GitHub/Supabase dashboard setup still needs manual implementation and verification.

## 2026-06-05 — Restore Power Place window-size slider

- Branch: `fix/power-place-window-size-slider`.
- Base: fresh `origin/main` at `8062178` (`Diagnose Power Place save stuck stage (#267)`).
- Changed files:
  - `src/pages/ProfileLitePage.jsx`
  - `src/pages/profile-lite/ProfileLitePowerPlaceModuleBase.jsx`
  - `src/profileMandalaWorkspace.css`
  - `test/profileLiteCabinetContract.test.mjs`
  - `test/powerPlaceClient.test.mjs`
  - `STATE.md`
  - `LOG.md`
- Root cause:
  - The technical mini-slot scale path already existed (`slot_scale`, `object_refs.__slot_scale`, `sourceSlotScale`, `--power-source-slot-scale`, `--power-place-chess-slot-scale`), but the visible constructor UI rendered only three size sliders.
  - Load/refresh could mask an object-ref-only saved slot scale with `EMPTY_COMPOSITION.slot_scale: 1`.
- Changed:
  - added the fourth slider `Размер окон` bound to `slot_scale`, min `0.7`, max `1.18`, step `0.01`;
  - ordered sliders as `Размер окон`, `Размер поля`, `Размер центра`, `Размер фоток`;
  - restored saved slot scale from `slot_scale`, `object_refs.__slot_scale`, or legacy `chess_slot_scale`;
  - included the fourth slider in the shared desktop/mobile CSS grid contracts.
- Checks run:
  - `node test/profileLiteCabinetContract.test.mjs` failed first on the missing `Размер окон`, then failed on missing `slotScaleFromComposition`, then passed;
  - `node test/powerPlaceClient.test.mjs`
  - `npm run test:profile-lite`
  - `npm run test:power-place`
  - `npm run test:profile-media`
  - `npm run test:profile-loading-recovery`
  - `npm run build`
  - `npm run check`
  - `git diff --check`
- Check notes:
  - `npm install` failed with `ENOSPC`; removed only the partial worktree `node_modules` and symlinked to the existing canonical repo dependency install for verification;
  - all final commands exited `0`;
  - retained warnings: `RY-L04-S04` / `RY-L04-S05` video placeholders and Vite large chunk warning.
- Local browser QA:
  - desktop and mobile checked on `http://localhost:4338/profile/mandalas` with fake public Supabase env/session and a local mock API;
  - confirmed four visible sliders, no 390px horizontal overflow, no console errors, all seven constructors using the shared slot-scale variables, and mocked save/reopen persistence.
- Not verified:
  - real authenticated Supabase save/update/reload;
  - Vercel preview, production/legacy live QA, and Google OAuth.

## 2026-06-05 — Fix Power Place mobile save clickability

- Branch: `fix/power-place-save-button-clickability`.
- Base: fresh `origin/main` at `5379004` (PR #264, `Fix Power Place save flow and action order`).
- Changed files:
  - `src/pages/ProfileLitePage.jsx`
  - `src/pages/profile-lite/ProfileLitePowerPlaceModuleBase.jsx`
  - `src/profileMandalaWorkspace.css`
  - `test/profileLiteCabinetContract.test.mjs`
  - `STATE.md`
  - `LOG.md`
- Root cause:
  - Save disabled only at the saved-count limit for unsaved drafts, but the disabled state lacked obvious scoped styling.
  - The saved-count text was a raw inline `span` in `.powerPlaceActions`, sharing the mobile flex row with buttons and able to overflow in the action area.
  - Save had no local guarded click wrapper or immediate visible save-start status.
- Changed:
  - added `handleSaveNewClick` to make enabled Save explicitly call `onSaveNew` and disabled Save return locally;
  - added immediate `Сохраняем место силы...` composition message before create and shows the missing-profile preflight message in the same visible action-area notice;
  - moved saved-count text to `.powerPlaceActionsMeta` below the action buttons;
  - added scoped disabled button styling, explicit action-card ordering, and pointer/layout safeguards for the actions meta block.
- Checks run:
  - `node test/profileLiteCabinetContract.test.mjs` failed first on the missing explicit click wrapper, then passed;
  - `npm install`
  - `npm run build`
  - `npm run check`
  - `npm run test:profile-lite`
  - `npm run test:power-place`
  - `git diff --check`
- Check notes:
  - all final commands exited `0`;
  - retained warnings: `RY-L04-S04` / `RY-L04-S05` video placeholders and Vite large-chunk warning.
- Not verified:
  - authenticated live Supabase save/reload;
  - Vercel preview, production/legacy live QA, and Google OAuth.

## 2026-06-05 — Fix Power Place save flow and action order
