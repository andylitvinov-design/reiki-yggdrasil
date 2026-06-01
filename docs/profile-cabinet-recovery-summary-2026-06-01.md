# Profile Cabinet Recovery Summary — 2026-06-01

This note records what worked, what failed, what was changed, and what made the old heavy profile cabinet usable again.

Repo: `andylitvinov-design/reiki-yggdrasil`  
Live: `https://mentalica.vercel.app`  
Legacy: `https://reiki-yggdrasil.vercel.app`

## 1. Current route state after recovery

Current intended production routing after PR #176:

```text
/profile              -> ProfileLitePage, safe lightweight cabinet entry
/profile-lite         -> ProfileLitePage, explicit fallback/control route
/profile-old          -> old heavy ProfilePage, full cabinet diagnostics/recovery route
/profile/mandalas     -> old heavy ProfilePage, initialTopTab="power-place"
/profile/services     -> old heavy ProfilePage, initialTopTab="services"
/profile/orders       -> old heavy ProfilePage, initialTopTab="orders"
/profile/chats        -> old heavy ProfilePage, initialTopTab="chats"
/profile/settings     -> old heavy ProfilePage, initialTopTab="profile"
/profile/admin        -> AdminPage, unchanged
/masters              -> MastersPage, unchanged
/                     -> public home, unchanged
```

Important: this did not create a new full profile cabinet from scratch. The working heavy cabinet is still the existing `src/pages/ProfilePage.jsx`; the lite cabinet is kept as a safe entry/fallback.

## 2. What worked before the incident

The lower auth/session layer was proven to work at different points:

- Google login could create a stored session.
- `/profile-lite` could read the stored session.
- `/profile-lite` could get the current user.
- `/profile-lite` could read the own profile.
- Supabase env names were present on production when the lite cabinet reported configured state.

This meant the issue was not primarily a blind OAuth/provider/redirect failure once `/profile-lite` worked.

## 3. What was not working

The old production `/profile` heavy cabinet could remain stuck on:

```text
Загружаю кабинет...
```

Observed debug states changed during the investigation:

### State A — blocked after current user, before own profile returned

```text
getCurrentUser response id present: yes
bootstrap step: profile-request-started
react authStatus: loading
react user state: no
react cabinet condition: no
render state: loading
```

Meaning: current user was already available, but React did not apply `user` because `loadProfileCabinetBootstrap()` had not returned yet. The old cabinet was waiting for `getOwnProfile()` in the critical bootstrap path.

### State B — blocked while current user request was still loading

```text
has stored session: true
exchange status: success
getCurrentUser status: loading
bootstrap step: user-request-started
fallback user used: no
react authStatus: loading
react user state: no
react cabinet condition: no
render state: loading
```

Meaning: after removing the own-profile blocker, the next blocker was `/auth/v1/user` taking too long before fallback from the stored session JWT was used.

## 4. Fixes that restored the heavy cabinet

### PR #171 — Recovery: unblock profile shell before own profile load

Branch: `codex/profile-cabinet-rollback-recovery`  
Merge commit: `829043016df789cd9a67078e5459b5cbc7eb083e`

What changed:

- Removed `getOwnProfile` from the critical auth bootstrap path in `src/lib/profileBootstrapClient.js`.
- After `currentUser.id` exists, bootstrap returns immediately with `currentProfile: null`.
- Added a safe notice that the cabinet is opened in a basic mode while profile/material data is recovered later.
- Added the debug step `profile-request-skipped-for-recovery`.
- Updated tests so `getOwnProfile` is not called during recovery bootstrap.

Why it mattered:

```text
Before: session -> getCurrentUser -> getOwnProfile -> setUser -> render shell
After:  session -> getCurrentUser -> setUser -> render shell; profile data later
```

This removed the first blocking layer.

### PR #172 — Fast JWT fallback for stalled current-user bootstrap

Branch: `codex/profile-fast-session-fallback`  
Merge commit: `118ea1adf742b272a347d968b6d0148afa7e5988`

What changed:

- Added a `1500 ms` fallback race around `getCurrentUser(session)`.
- If `/auth/v1/user` stalls and the stored session JWT contains `sub` or `user_id`, bootstrap returns a safe fallback user.
- Direct `getCurrentUser` success still wins.
- Explicit 401/403 still refuses fallback.
- No token, raw JWT, headers, request body, env value, or private user data is exposed.

Why it mattered:

```text
Before: stored session exists, but /auth/v1/user loading can keep old /profile stuck.
After:  stored session + parseable JWT user id can open the shell quickly if /auth/v1/user stalls.
```

This removed the second blocking layer.

### PR #173 — Roll back production `/profile` entrypoint to lite cabinet

Branch: `codex/profile-entrypoint-rollback-to-lite`  
Merge commit: `edba9eee4c16abcad613e192bf6f6023d73d5926`

What changed:

- `/profile` was temporarily routed to the existing safe `ProfileLitePage`.
- `/profile-lite` remained `ProfileLitePage`.
- The old heavy cabinet was preserved at `/profile-old`.
- Added the `/profile-old` SPA rewrite in `vercel.json`.

Why it mattered:

This stopped the hotfix loop from affecting the user-facing production entrypoint. The user could open `/profile` reliably while the old heavy cabinet was diagnosed safely at `/profile-old`.

### PR #174 — Route-aware diagnostics for `/profile-old`

Branch: `codex/profile-old-heavy-cabinet-diagnostics`  
Merge commit: `6e4dc59945acfc54cf0f51da19fc93eb77d94023`

What changed:

- Added safe route-aware debug fields to the old heavy `ProfilePage`:
  - `routeName`
  - `profileOld`
  - `renderGateOpen`
  - `reactBootstrapCheckpoint`
- Added checkpoints including:
  - `after-set-profile`
  - `first-cabinet-render-attempt`
- Did not change production `/profile` behavior.

Why it mattered:

After this, `/profile-old?debugAuth=1` showed that the old heavy cabinet reached:

```text
getCurrentUser status: success
bootstrap step: auth-ready-applied
react authStatus: ready
react user state: yes
react user id present: yes
react cabinet condition: yes
render state: user
```

That confirmed the heavy cabinet was no longer stuck in auth/bootstrap/render gate.

### PR #175 — Heavy cabinet smoke QA hardening

Branch: `codex/profile-old-heavy-cabinet-smoke-qa`  
Merge commit: `807daed013b021467e9596c15c02766c34aa6cc5`

What changed:

- Added inline smoke notices for `services` and `orders` tabs inside the old heavy cabinet.
- Strengthened source-level tests so services/orders tabs cannot silently regress to blank/blocking modules.
- Confirmed secondary failures should remain inline warnings and not force the cabinet into global loading.

Why it mattered:

Once `/profile-old` opened, some internal tabs needed safe visible placeholders instead of blank areas. This made the heavy cabinet more usable and safer for further recovery.

### PR #176 — Modular heavy cabinet routes

Branch: `codex/profile-modular-heavy-routes`  
Merge commit: `6ae468aee990a99f8b96ba4a9173213589627ae8`

What changed:

- Added modular routes that reuse the existing heavy `ProfilePage` with `initialTopTab`:
  - `/profile/mandalas`
  - `/profile/services`
  - `/profile/orders`
  - `/profile/chats`
  - `/profile/settings`
- Added rewrites for these routes in `vercel.json`.
- Kept `/profile` on `ProfileLitePage`.
- Kept `/profile-old` as the full heavy cabinet.

Why it mattered:

This allowed continuing to work with the existing heavy profile cabinet without creating a new duplicate profile system from scratch.

## 5. Why `/profile-old` started working again

The heavy cabinet started working after two critical blockers were removed:

1. `getOwnProfile` stopped blocking `setUser` and shell render.
2. A stalled `/auth/v1/user` could now fall back quickly to a safe user id from the stored session JWT.

After that, the debug output showed:

```text
bootstrap step: auth-ready-applied
react authStatus: ready
react user state: yes
react user id present: yes
react cabinet condition: yes
render state: user
```

This means the old `ProfilePage` could now pass auth, apply user state, open the render gate, and display the cabinet UI.

## 6. What should not be repeated

Do not repeat these approaches unless new evidence proves they are needed:

- Do not blindly edit Google OAuth settings while `/profile-lite` works.
- Do not put `getOwnProfile`, materials, media, Power Place, or service/order loads back into the critical auth bootstrap path.
- Do not make the cabinet shell depend on `user && authStatus === "ready"` if `user?.id` is already available.
- Do not add DOM reload hacks to force recovery.
- Do not expose access tokens, refresh tokens, raw JWT, env values, headers, request body, or private user data in debug UI.
- Do not route `/profile` back to the heavy cabinet until the remaining data issues are checked, especially old photos/images.

## 7. Remaining known issue

The old heavy cabinet now opens, but old photos/images may not appear where expected.

Likely places to inspect:

- `clientGoalPhotos`
- `traditionAssets`
- `materials.image_url` / `materials.display_url`
- `savedPowerImages`
- `objectImageUrls`
- `selectedCentralPhoto`
- `reusableImages`
- signed URL resolution in media/storage helpers
- category/filter logic that may hide older images

Important: missing photos are probably not caused simply by the route being `/profile-old`. If profile/user/session are correct, the path should not normally change Supabase data reads. More likely causes are loader timing, profile id hydration, storage ref format, signed URL creation, or filtering.

## 8. Recommended next step

Before restoring the heavy cabinet to `/profile`, fix/verify old photo visibility on `/profile-old`.

Recommended branch:

```text
codex/profile-old-restore-existing-photos
```

Goal:

```text
Find why old photos/images are not appearing in the existing heavy ProfilePage and fix only that data/display path.
```

After old photos are visible and the main tabs pass live QA, decide whether to:

1. Restore heavy `ProfilePage` to `/profile`, keeping `/profile-lite` as emergency fallback; or
2. Keep `/profile` as a lightweight dashboard and continue using modular routes for heavy functions.

## 9. Useful live QA URLs

```text
https://mentalica.vercel.app/profile
https://mentalica.vercel.app/profile-lite
https://mentalica.vercel.app/profile-old
https://mentalica.vercel.app/profile-old?debugAuth=1
https://mentalica.vercel.app/profile/mandalas
https://mentalica.vercel.app/profile/services
https://mentalica.vercel.app/profile/orders
https://mentalica.vercel.app/profile/chats
https://mentalica.vercel.app/profile/settings
https://mentalica.vercel.app/masters
https://mentalica.vercel.app/profile/admin
https://reiki-yggdrasil.vercel.app/profile
```

## 10. Summary in one sentence

The heavy profile cabinet was not rebuilt from scratch; it was recovered by unblocking auth bootstrap, adding a fast session fallback, moving production `/profile` temporarily to the lite cabinet, validating the old heavy cabinet at `/profile-old`, and then exposing the existing heavy cabinet through modular routes for continued recovery.
