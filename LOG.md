# Reiki Yggdrasil — LOG

## 2026-05-31 — Canonical `/profile` cabinet recovery plan

- Branch: `docs/profile-cabinet-recovery-plan`.
- Added canonical recovery document: `docs/profile-cabinet-recovery-plan.md`.
- Purpose:
  - define a non-destructive fallback plan if old `/profile` still does not open after PR #162 deploy;
  - avoid blind rollback of recent commits;
  - preserve `/profile-lite` as the control route;
  - define checkpoint order, bisect rules, deploy discipline, and recovery PR report format.
- Key rule:
  - deploy and verify `d9db454d34ad29f742b76e5325f14d84b81be1a3` first;
  - only start rollback/bisect if the deployed PR #162 build still fails on live Google OAuth;
  - never force-push `main` or reset production blindly.

## 2026-05-31 — `/profile` shell gate uses authenticated user id

- Branch: `codex/fix-profile-render-gate-user-id`.
- Changed files:
  - `src/pages/ProfilePage.jsx`
  - `test/profilePageAuthBootstrap.test.mjs`
  - `STATE.md`
  - `LOG.md`
- Root cause found:
  - live diagnostics proved the stored session and current-user path can succeed, and React can have a user/session while `authStatus` remains `loading`;
  - the old `/profile` shell gate still required `user && authStatus === "ready"`, so the cabinet could stay blocked even after a valid authenticated user id existed.
- Fix:
  - derive `hasAuthenticatedUser` from `Boolean(user?.id)`;
  - render the cabinet shell from `shouldShowCabinet = hasAuthenticatedUser`;
  - guard loading, recovery, and login surfaces with `!hasAuthenticatedUser`;
  - publish React debug `cabinetCondition` from `shouldShowCabinet`.
- Checks run:
  - `node test/profilePageAuthBootstrap.test.mjs`
  - `node test/profileBootstrapClient.test.mjs`
  - `npm run test:profile-lite`
  - `npm run test:profile-loading-recovery`
  - `npm run check`
  - `npm run build`
- Not changed:
  - OAuth redirect/provider logic;
  - Supabase schema/migrations/env values;
  - Vercel rewrites;
  - `/`, `/masters`, `/profile/admin`.
- Not verified:
  - production Google OAuth and live cabinet shell after merge/deploy.

## 2026-05-31 — Old `/profile` authenticated render gate after auth

- Branch: `codex/fix-profile-cabinet-render-gate-after-auth`.
- Changed files:
  - `src/lib/profileBootstrapClient.js`
  - `src/pages/ProfilePage.jsx`
  - `test/profileBootstrapClient.test.mjs`
  - `test/profilePageAuthBootstrap.test.mjs`
  - `STATE.md`
  - `LOG.md`
- Root cause found:
  - `/profile-lite` proved the live Supabase auth/session/current-user/own-profile path;
  - old `/profile` after PR #158 still used a cabinet shell gate of applied `user` plus completed auth state, but bootstrap no longer loaded `getOwnProfile`;
  - the old cabinet could therefore be authenticated but profileless, leaving `profile.id` missing and secondary materials/media/power-place areas unable to hydrate, which made the main cabinet look blocked after login.
- Fix:
  - named the old cabinet render gate as `cabinetReady = Boolean(user && authStatus === "ready")`;
  - restored own-profile loading as secondary bootstrap data after current-user success;
  - profile load failure/timeout now returns a sanitized inline warning and still opens the shell;
  - materials/media/power-place/tradition load failures now show sanitized inline cabinet warnings instead of blocking the whole cabinet;
  - React loading now reaches the existing recoverable timeout state instead of relying only on DOM fallback.
- Not changed:
  - OAuth redirect logic;
  - Supabase client API;
  - schemas/migrations;
  - `/profile-lite`, `/masters`, `/profile/admin`, `/`.

## 2026-05-31 — Old `/profile` loading recovery from `/profile-lite` proof

- Branch: `codex/fix-old-profile-loading-from-profile-lite-proof`.
- Changed files:
  - `src/pages/ProfilePage.jsx`
  - `test/profilePageAuthBootstrap.test.mjs`
  - `package.json`
  - `STATE.md`
  - `LOG.md`
- Root cause found:
  - live `/profile-lite` proves OAuth, stored session, `getCurrentUser`, own profile, and RLS are healthy;
  - old `/profile` failure surface is the React bootstrap/apply path in `ProfilePage.jsx`, specifically whether successful current-user bootstrap becomes `user` state and whether bootstrap errors leave `authStatus="loading"`;
  - previous behavior treated a current-user timeout as a session reset path, which is too close to expired-session handling and does not match `/profile-lite`'s safe error-state behavior.
- Fix:
  - old `/profile` now handles `auth_load_timeout` by setting `authStatus="error"` and rendering a sanitized error instead of clearing stored session state;
  - added `test/profilePageAuthBootstrap.test.mjs` to guard session bootstrap, `getCurrentUser`, `setUser(currentUser)` before `setAuthStatus("ready")`, expired-session clearing, cabinet gate, and no raw token/session rendering.
- Not changed:
  - OAuth redirect logic;
  - Supabase client API;
  - schemas/migrations;
  - `/profile-lite`, `/masters`, `/profile/admin`, `/`.
