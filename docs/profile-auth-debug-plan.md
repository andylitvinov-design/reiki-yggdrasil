# Profile Auth Debug Plan

## Goal

Debug why `/profile` still shows `Загружаю кабинет...` after Google login on:

- `https://mentalica.vercel.app`
- legacy: `https://reiki-yggdrasil.vercel.app`

The current user flow:

1. Open `https://mentalica.vercel.app/profile?resetProfileSession=1`.
2. Click `Войти через Google`.
3. Browser returns to `https://mentalica.vercel.app/profile`.
4. Cabinet does not open and remains on `Загружаю кабинет...`.

## Context

Already completed:

- PR #138: profile bootstrap timeout/recovery.
- PR #139: recovery links made native.
- PR #140: broken session timeout resets session.
- PR #141: removed legacy `profile-loading-recovery.js` from `index.html`.
- PR #142: cabinet no longer waits for `getOwnProfile`.
- PR #143: tried forced OAuth token response, caused `bad_oauth_callback / OAuth state parameter missing`.
- PR #144: reverted the forced OAuth token response.
- PR #145: added manual Supabase PKCE callback handling in `src/lib/supabaseClient.js`.

## Current suspected break point

One of these is still failing:

1. OAuth callback parameter is missing.
2. PKCE verifier is missing after redirect.
3. Supabase code exchange fails.
4. App session is not stored.
5. `getCurrentUser` fails or hangs.
6. React state remains `loading=true`, `user=null`.

## Read first

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
12. `test/profileBootstrapClient.test.mjs`

## Required next step

Do not make another blind OAuth fix.

Add a temporary safe diagnostic block visible only on:

`/profile?debugAuth=1`

The diagnostic should show only booleans/status/error messages, no secret values.

Show:

- current URL path
- URL has OAuth callback parameter: yes/no
- URL hash has session marker: yes/no
- stored app session: present/missing
- PKCE verifier: present/missing
- PKCE exchange status: idle/loading/success/error
- PKCE exchange error message/status
- current-user request status: idle/loading/success/error
- React state: loading, user present, loadingTimedOut, session present

Never show sensitive values, environment values, or private user details.

## Minimal fix strategy after diagnostics

- If OAuth callback parameter is missing: fix Supabase Site URL / Redirect URLs / provider settings.
- If verifier is missing: fix verifier storage, possibly use localStorage instead of sessionStorage.
- If exchange fails: fix `/auth/v1/token?grant_type=pkce` request shape.
- If exchange succeeds but app session is missing: fix session normalization/storage.
- If app session exists but current-user request fails: fix auth headers or session parsing.
- If current user exists but UI still shows loading: fix `ProfilePage.jsx` state transition.

## Constraints

Do not change:

- home page `/`
- `/masters`
- `/profile/admin`
- Supabase schema/migrations unless proven necessary
- env values/secrets
- RU-default interface
- desktop layout

Do not restore:

- `public/profile-loading-recovery.js`
- forced OAuth token-response workaround

## Checks

Run:

- `npm run check`
- `npm run build`

Local preview routes:

- `/`
- `/profile`
- `/masters`
- `/profile/admin`

After deploy verify:

- `https://mentalica.vercel.app/profile?resetProfileSession=1`
- `https://mentalica.vercel.app/profile?debugAuth=1`

Then run Google login and inspect the diagnostic block.

## Report format

Return:

1. Exact root cause.
2. Evidence from code/runtime.
3. Changed files.
4. Checks run.
5. PR URL.
6. Live verification result.
7. What remains unverified.
