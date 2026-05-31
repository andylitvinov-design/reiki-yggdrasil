# Profile Auth / Cabinet Repair Plan

## Goal

Document the investigation and repair path for `/profile` after Google login on:

- production: `https://mentalica.vercel.app`
- legacy: `https://reiki-yggdrasil.vercel.app`

Original user symptom:

1. Open `https://mentalica.vercel.app/profile?resetProfileSession=1`.
2. Click `Войти через Google`.
3. Browser returns to `/profile`.
4. Cabinet does not open and remains on `Загружаю кабинет...`.

This document is the running repair memory for the cabinet/auth issue. Keep it updated after any future `/profile` auth, bootstrap, cabinet render, Supabase/RLS, or deploy fix.

## Final current status after PR #159

As of PR #159 / merge commit `4e498b50e64c484be87187718da5e6e5a963d51e`:

- The old `/profile` cabinet is no longer expected to be gated by optional secondary data.
- The cabinet shell gate is explicit:
  - `cabinetReady = Boolean(user && authStatus === "ready")`.
- Own profile loading is restored as secondary bootstrap data.
- Profile/material/media/Power Place failures should render sanitized inline cabinet warnings instead of blocking the shell.
- A finite React loading timeout recovery exists.
- Regression tests cover shell gate, secondary warnings, profile secondary load/failure, timeout, and token-safety cases.
- Production asset reported by Codex for the merged fix: `/assets/index-D6sppda2.js`.

Important: real Google OAuth login with a human browser account was still marked as not verified in the PR #159 report. It remains a required live QA step.

## Confirmed investigation chronology

### Earlier context before the detailed debug pass

Already completed before this document was first created:

- PR #138: profile bootstrap timeout/recovery.
- PR #139: recovery links made native.
- PR #140: broken session timeout resets session.
- PR #141: removed legacy `profile-loading-recovery.js` from `index.html`.
- PR #142: cabinet no longer waits for `getOwnProfile`.
- PR #143: tried forced OAuth token response, caused `bad_oauth_callback / OAuth state parameter missing`.
- PR #144: reverted the forced OAuth token response.
- PR #145: added manual Supabase PKCE callback handling in `src/lib/supabaseClient.js`.

### Diagnostic and repair pass on 2026-05-31

- PR #146: added safe `/profile?debugAuth=1` panel.
  - Showed that OAuth/PKCE/session could succeed.
  - Initial debug proved the problem was no longer simply Google OAuth.
- PR #147: added one-shot profile render recovery helper.
  - Later analysis showed this was only a temporary recovery shim and could also obscure timing/debug state.
- PR #149: attempted to unblock React loading after user load.
  - Added direct `setLoading(false)`/session dependency refinements.
  - Did not resolve the live issue.
- PR #150: introduced explicit `authStatus` render gate.
  - Replaced the old generic `loading` gate with auth state.
  - Still did not resolve live cabinet opening by itself.
- PR #151: preserved `debugAuth=1` through Google login and added React-level diagnostics.
  - Added visibility into `react authStatus`, `react user state`, `react user id present`, `react session state`, `react cabinet condition`, `react loadingTimedOut`.
- PR #152: made the debug panel sticky in the current tab.
  - If `/profile?debugAuth=1` was opened once, redirects back to `/profile` restore `debugAuth=1` via `sessionStorage` and `history.replaceState`.
- PR #153: allowed profile shell fallback from a valid session when `/auth/v1/user` stalls or times out.
  - Does not fallback for real 401/403.
  - Added JWT `sub` / `user_id` fallback.
- PR #154: main bootstrap user-state fix.
  - Normalized current-user responses from direct user, `{ user }`, and `{ data: { user } }` shapes.
  - Added bootstrap diagnostics and React apply checkpoints.
  - Added fallback for successful `getCurrentUser` responses without a usable direct top-level `id`.
  - Added tests for direct user, wrapped user, data-wrapped user, JWT fallback, timeout/network fallback, 401/403 refusal, and no-session behavior.
- PR #156: guarded `profile-auth-render-recovery.js` with React state.
  - Recovery helper now backs off when React has `hasUser`, `cabinetCondition`, or `authStatus === "ready"`.
  - Increased grace window after `/auth/v1/user` success.
- PR #159: final cabinet render gate fix after auth.
  - Restored own-profile load as secondary bootstrap data.
  - Added named `cabinetReady` shell gate.
  - Ensured secondary profile/material/media/Power Place failures render inline warnings and do not block the shell.
  - Added finite loading timeout recovery and regression coverage.

## Runtime states observed during investigation

### State A — OAuth/session worked but React stayed loading

Observed diagnostic values:

```text
has stored session: true
exchange status: success
getCurrentUser status: success
react authStatus: loading
react user state: no
react user id present: no
react session state: yes
react cabinet condition: no
render state: loading
```

Meaning:

- OAuth callback, PKCE exchange, stored app session, and fetch-level `/auth/v1/user` were not the root blocker.
- The break was between fetch-level current-user success and React applying `user` / `authStatus="ready"`.

### State B — debug panel disappeared or became incomplete after login

Cause:

- The Google redirect returned to `/profile`, losing `?debugAuth=1`.

Fix:

- PR #151 preserved `debugAuth=1` through Google login.
- PR #152 made debug mode sticky in the current tab.

### State C — live page reported Supabase not configured

Observed screen:

```text
Кабинет мастера подготовлен, но Supabase ещё не подключён.
Нужно настроить env names в Vercel: VITE_SUPABASE_URL и VITE_SUPABASE_ANON_KEY.
```

Meaning:

- The currently served live deployment was built without required Vite env names, or a stale/wrong deployment was being served.
- This was an infrastructure/deploy/env issue, not an OAuth or React logic issue.

Required checks when this appears:

- Vercel project: `super10/reiki-yggdrasil`.
- Production environment variables:
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`
  - `VITE_ADMIN_EMAIL`
- Verify the live deployment commit/asset matches the intended merge commit.

### State D — session existed but current-user request was idle/loading

Observed forms:

```text
has stored session: true
react session state: yes
getCurrentUser status: idle OR loading
react authStatus: idle OR loading
react user state: no
render state: session OR loading
```

Meaning:

- If `authStatus=idle` and the Supabase-not-configured banner is visible, check env/deploy.
- If `authStatus=loading` and `/auth/v1/user` stalls, PR #153 fallback should now allow the shell to open from a valid JWT session unless the session is explicitly invalid.

## Confirmed root causes / code gaps found

1. **Forced OAuth token flow was wrong.**
   - PR #143 caused `bad_oauth_callback / OAuth state parameter missing`.
   - PR #144 reverted it.

2. **Manual PKCE callback was required and added.**
   - PR #145 introduced manual Supabase PKCE exchange.

3. **Debug state was initially not persistent enough.**
   - `debugAuth=1` was lost after Google login.
   - PR #151 / #152 fixed this.

4. **Fetch success did not prove React user state was applied.**
   - Needed React-level diagnostics, not just network-level diagnostics.
   - PR #151 added React diagnostics.

5. **`/auth/v1/user` response shape could be usable but not direct `currentUser.id`.**
   - PR #154 normalized direct, `{ user }`, and `{ data: { user } }` shapes.

6. **Fallback from a valid stored session was incomplete.**
   - Timeout/stall and success-without-id paths needed JWT `sub` / `user_id` fallback.
   - 401/403 must still refuse fallback.
   - PR #153 / #154 addressed these cases.

7. **Recovery helper could reload too early or hide timing.**
   - PR #156 made recovery aware of React debug state and extended grace time.

8. **Auth-ready did not guarantee useful cabinet readiness.**
   - Removing `getOwnProfile` from bootstrap made the shell technically reachable while secondary cabinet areas stayed profileless/blocked.
   - PR #159 restored own-profile as secondary bootstrap data and made failures inline warnings instead of blockers.

## Current remaining hypotheses / risks

These are not confirmed active bugs after PR #159, but remain the next things to check if live OAuth still fails:

1. **Production deployment/env mismatch**
   - Symptom: Supabase-not-configured banner, `getCurrentUser status: idle`, `react authStatus: idle`.
   - Check Vercel env names and production deployment commit/asset.

2. **Supabase RLS or missing migration after login**
   - Symptom: shell opens, but profile/material/media/Power Place sections show inline warnings.
   - Likely causes: RLS policies, storage bucket/policy, missing migrations, table permissions.
   - Shell should still open after PR #159.

3. **Google OAuth provider / redirect settings still wrong for one domain**
   - Symptom: callback error before session is stored, or no session after Google login.
   - Check both production and legacy redirect URLs:
     - `https://mentalica.vercel.app/profile`
     - `https://mentalica.vercel.app/profile/admin`
     - `https://reiki-yggdrasil.vercel.app/profile`
     - `https://reiki-yggdrasil.vercel.app/profile/admin`

4. **Stale browser/sessionStorage/localStorage state**
   - Symptom: unexpected sticky debug, unexpected stale session, or old recovery guard.
   - Test with:
     - `/profile?resetProfileSession=1`
     - fresh incognito browser
     - direct `/profile?debugAuth=1`

5. **Heavy cabinet render/runtime error**
   - Symptom: `react user state: yes`, `react authStatus: ready`, `react cabinet condition: yes`, but visible DOM still not usable.
   - Check browser console and React runtime errors.

6. **Vercel build-rate-limit or stale production alias**
   - Symptom: GitHub main has the fix, but live source/assets do not show the expected fields or asset hash.
   - Check Vercel deployments and commit SHA before testing behavior.

## Required future verification checklist

### Version/deploy verification

Before testing behavior, verify the intended commit is deployed.

For PR #159, expected commit:

```text
4e498b50e64c484be87187718da5e6e5a963d51e
```

Codex reported production asset:

```text
/assets/index-D6sppda2.js
```

Verify:

- Vercel project `super10/reiki-yggdrasil` production deployment points to the intended commit.
- `https://mentalica.vercel.app/` serves the expected asset.
- Legacy `https://reiki-yggdrasil.vercel.app/` is not serving a contradictory stale build during migration checks.

### Live auth verification

Use a real browser/account:

1. Open `https://mentalica.vercel.app/profile?resetProfileSession=1`.
2. Then open `https://mentalica.vercel.app/profile?debugAuth=1`.
3. Click `Войти через Google`.
4. After callback, expected debug values:

```text
has stored session: true
exchange status: success OR idle after completed callback
getCurrentUser status: success OR fallback path reported safely
react authStatus: ready
react user state: yes
react user id present: yes
react session state: yes
react cabinet condition: yes
render state: user
```

5. Cabinet shell should open even if secondary warnings are shown.

### Cabinet functionality verification after shell opens

Check these flows on production and, during migration, legacy too:

- `/profile` opens shell after Google login.
- Profile form can save draft.
- Profile submit/moderation path is not broken.
- Materials list loads or shows sanitized inline warning.
- Media upload either works or shows clear inline warning.
- Power Place data loads or shows clear inline warning.
- No token/env/header/body/personal values appear in debug UI.
- Browser console has no persistent runtime errors.
- No horizontal overflow on desktop 1366 or mobile 390.

## Read first for future tasks

1. `AGENTS.md`
2. `README.md`
3. `STATE.md`
4. `LOG.md`
5. `package.json`
6. `vercel.json`
7. `index.html`
8. `src/main.jsx`
9. `src/pages/ProfilePage.jsx`
10. `src/lib/supabaseClient.js`
11. `src/lib/profileBootstrapClient.js`
12. `public/profile-auth-debug.js`
13. `public/profile-auth-render-recovery.js`
14. `test/profileBootstrapClient.test.mjs`
15. `test/profilePageAuthBootstrap.test.mjs`

## Constraints

Do not change without a proven need:

- home page `/`
- `/masters`
- `/profile/admin`
- Supabase schema/migrations
- env values/secrets
- RU-default interface
- desktop layout
- Vercel rewrites

Do not restore:

- legacy `public/profile-loading-recovery.js`
- forced OAuth `response_type=token` workaround

## Checks

Run after code changes:

- `npm run check`
- `npm run build`

Useful targeted checks:

- `npm run test:profile-lite`
- `npm run test:profile-loading-recovery`
- `npm run test:profile-media`
- `npm run test:profile-materials`
- `npm run test:profile-services`
- `npm run test:power-place`
- `node test/profileBootstrapClient.test.mjs`
- `node test/profilePageAuthBootstrap.test.mjs`

Local preview routes:

- `/`
- `/profile`
- `/profile-lite`
- `/masters`
- `/profile/admin`

## Report format

Return:

1. Exact root cause or current best hypothesis.
2. Evidence from code/runtime.
3. Changed files.
4. Checks run.
5. PR URL.
6. Live verification result.
7. What remains unverified.
8. Whether `STATE.md` / `LOG.md` need updates.
