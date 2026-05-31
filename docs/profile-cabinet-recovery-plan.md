# Profile Cabinet Recovery Plan

Last updated: 2026-05-31  
Scope: Reiki Yggdrasil old `/profile` cabinet after Google OAuth.  
Live target: `https://mentalica.vercel.app`  
Legacy target: `https://reiki-yggdrasil.vercel.app`  
Current main target commit: `d9db454d34ad29f742b76e5325f14d84b81be1a3` (`fix: open profile cabinet from authenticated user id`).

## 1. Purpose

This is the canonical fallback plan if the old `/profile` cabinet still does not open after the production deploy of PR #162.

The goal is not to blindly roll back the last 3 days. The goal is to recover the cabinet safely, preserve useful diagnostics, and identify the first breaking change with evidence.

## 2. Current known state

### Confirmed

- `/profile-lite` worked on live and proved the Supabase/OAuth/session/current-user/profile layer can succeed independently of the old heavy cabinet UI.
- PR #162 is merged into `main` as `d9db454d34ad29f742b76e5325f14d84b81be1a3`.
- PR #162 changes the old `/profile` render gate so the cabinet shell opens as soon as React has `user?.id`, instead of requiring `user && authStatus === "ready"`.
- Production deploy of `d9db454d...` has not been verified because Vercel hit the Hobby/free daily deployment limit: `api-deployments-free-per-day`.

### Not confirmed yet

- Real live Google OAuth on old `/profile` after the deploy of `d9db454d...`.
- Whether `https://mentalica.vercel.app/profile?debugAuth=1` shows `user id present: yes` and opens the old cabinet shell on the deployed PR #162 build.

## 3. Non-negotiable safety rules

Do not force-push `main`.

Do not run `git reset --hard <old-sha>` and push it to `main`.

Do not delete `/profile-lite` during recovery. It is the control route for proving auth/session/current-user/profile independently of the old cabinet UI.

Do not remove Vercel fallback workflow or deploy recovery docs.

Do not expose or commit env values, access tokens, refresh tokens, Supabase anon key values, or service-role keys.

Do not make schema/migration changes as part of rollback unless a separate evidence-backed data-layer issue is proven.

All recovery work must happen through a branch and PR.

## 4. Immediate next step before any rollback

Wait for Vercel deployment limit reset, then run the production fallback workflow for the current main commit.

Workflow: `.github/workflows/deploy-production.yml`

Inputs:

```text
ref: main
expected_sha: d9db454d34ad29f742b76e5325f14d84b81be1a3
reason: deploy profile render gate fix PR 162 after Vercel limit reset
```

After deploy, verify:

```text
https://mentalica.vercel.app/
https://mentalica.vercel.app/profile?resetProfileSession=1
https://mentalica.vercel.app/profile?debugAuth=1
https://mentalica.vercel.app/profile-lite
https://mentalica.vercel.app/masters
https://mentalica.vercel.app/profile/admin
```

Main success criterion:

```text
After Google login, if React has user?.id, old /profile must render the cabinet shell and must not remain on full-page “Загружаю кабинет...”.
```

If this succeeds, stop. Do not run rollback.

## 5. If PR #162 still does not fix live `/profile`

Start a diagnostic recovery branch:

```bash
git checkout main
git pull
git checkout -b diagnose/profile-regression-recovery
```

Create a safety tag before experiments:

```bash
git tag safety-before-profile-recovery-d9db454 d9db454d34ad29f742b76e5325f14d84b81be1a3
git push origin safety-before-profile-recovery-d9db454
```

Then collect exact live evidence from `/profile?debugAuth=1`:

- has URL code
- has hash auth payload
- has stored session
- has PKCE verifier
- exchange status
- exchange error
- getCurrentUser status
- getCurrentUser error
- React authStatus
- React user state
- React user id present
- React session state
- React cabinet condition
- React loadingTimedOut
- render state

Do not proceed to rollback without recording these values in the PR description or recovery issue.

## 6. Recovery decision tree

### Case A — `/profile-lite` works, old `/profile` fails

This means OAuth/session/current-user/profile are healthy enough. Do not touch OAuth or Supabase settings.

Focus only on old `ProfilePage.jsx` render gates, state transitions, or secondary data loaders.

Expected fixes:

- render cabinet shell from `user?.id`;
- keep profile/materials/media/power-place failures non-blocking;
- show warnings inside the cabinet instead of blocking the whole shell;
- avoid full-page loading after an authenticated user exists.

### Case B — `/profile-lite` fails too

This means the issue is below the heavy old cabinet UI.

Inspect:

- Supabase env availability;
- OAuth redirect URLs;
- PKCE verifier storage;
- code exchange;
- localStorage session storage;
- `/auth/v1/user` request headers;
- RLS/profile read path.

Do not patch old `ProfilePage.jsx` render gates until `/profile-lite` works again.

### Case C — live deploy is stale

If live HTML still references an old JS asset after successful merge/build, the issue is deployment/alias, not code.

Check:

- Vercel deployment status for the target commit;
- production alias target;
- current live HTML asset name;
- fallback workflow output;
- Vercel daily deployment limit.

Do not debug old JavaScript against a stale deployment.

## 7. Commit checkpoints for regression testing

Use these checkpoints in order. Do not assume a commit is good unless it is tested.

### Checkpoint 0 — current intended fix

```text
d9db454d34ad29f742b76e5325f14d84b81be1a3
fix: open profile cabinet from authenticated user id
```

Purpose: final render-gate fix. Must be deployed and live-tested first.

### Checkpoint 1 — last late-chain Vercel-success commit

```text
4e498b50e64c484be87187718da5e6e5a963d51e
Fix profile cabinet render gate after auth (#159)
```

Purpose: known Vercel-success point in the late repair chain. If live currently behaves like this commit, it helps identify whether #162 is still pending deploy rather than ineffective code.

### Checkpoint 2 — old profile loading recovery

```text
3a877b8fbee2c74dd0546516c9b82bec2e9dff27
fix: recover old profile auth loading
```

Purpose: state after `/profile-lite` exists and before the latest render-gate fix.

### Checkpoint 3 — profile-lite diagnostic cabinet

```text
af5642d872d7ab2fef48e27cf4e1fc6840d750c9
feat: add profile lite diagnostic cabinet
```

Purpose: keep `/profile-lite` available while removing later old-profile fixes from the equation.

### Checkpoint 4 — bootstrap user-state repair

```text
5a9a8649664235558c21ecd18d5bb41b5c96f691
Merge pull request #154 — fix: unblock profile bootstrap user state
```

Purpose: pre-`/profile-lite`, but after some current-user bootstrap work.

### Checkpoint 5 — known-bad marker, not a restore target

```text
5f45c44d3e3ce2c0b0687fd8964e04c2059c4cb3
docs: add profile auth debug plan
```

This is a docs-only marker proving the problem already existed at that time. Do not treat it as known good.

### Earlier suspected zone

The debug plan says the issue already survived PR #138–#145. If checkpoints above all fail, search before PR #138.

Likely suspect classes:

- PR #142: old cabinet no longer waits for `getOwnProfile`;
- PR #145: manual Supabase PKCE callback handling in `src/lib/supabaseClient.js`;
- DOM-level recovery scripts inserted into `index.html` or `public/`;
- any patch that clears session on timeout instead of rendering a recoverable authenticated state.

## 8. Testing a checkpoint safely

Never move `main` to a checkpoint directly.

Create a test branch from the checkpoint:

```bash
git fetch origin
git checkout -b test/profile-checkpoint-<short-sha> <sha>
npm ci
npm run check
npm run build
```

If the checkpoint must be live-tested with Google OAuth, prefer a Vercel production fallback only when the checkpoint is intentionally selected as a candidate recovery. Otherwise use preview deployments and ensure the preview URL is added to Supabase redirect URLs before OAuth testing.

For each checkpoint, record:

```text
commit:
build result:
deploy URL:
/profile no-session state:
/profile Google login state:
/profile?debugAuth=1 values:
/profile-lite state, if present:
conclusion: good / bad / inconclusive
```

## 9. Preferred bisect strategy

Only start bisect after identifying one confirmed good and one confirmed bad commit.

Example:

```bash
git bisect start
git bisect bad d9db454d34ad29f742b76e5325f14d84b81be1a3
git bisect good <confirmed-good-sha>
```

At each step:

```bash
npm ci
npm run check
npm run build
```

Then, if local build is OK, run the smallest possible browser/OAuth verification. Mark as:

```bash
git bisect good
# or
git bisect bad
```

When bisect finds the first bad commit, inspect only the files touching:

- `src/pages/ProfilePage.jsx`
- `src/lib/supabaseClient.js`
- `src/lib/profileBootstrapClient.js`
- `src/main.jsx`
- `index.html`
- `public/profile-*recovery*.js`
- auth/profile tests
- Vercel/deploy config only if live is stale or route-level 404 appears.

## 10. Recovery options after finding first bad commit

### Option 1 — hunk-level fix, preferred

Patch only the exact broken condition or state transition.

Use this when the bad commit contains useful unrelated work.

### Option 2 — targeted revert commit

Use `git revert <bad-sha>` only if the entire bad commit is harmful and low-risk to revert.

Do not revert multiple commits just because they are recent.

### Option 3 — restore from known-good baseline and reapply features

Use only if the recent chain is too tangled to safely patch.

Procedure:

1. Create branch from confirmed good commit:

```bash
git checkout -b restore/profile-from-known-good <confirmed-good-sha>
```

2. Reapply changes in this order:

```text
1. non-profile docs/tests only;
2. Vercel fallback workflow if missing;
3. /profile-lite diagnostic route;
4. Supabase/session fixes only when independently proven;
5. old /profile render-gate fix;
6. old /profile secondary data loading warnings.
```

3. After each group:

```bash
npm run check
npm run build
```

4. Live-test `/profile` only on the smallest candidate set.

## 11. What to preserve if rollback is needed

Preserve if possible:

- `/profile-lite` route and tests;
- `docs/profile-auth-debug-plan.md` as historical evidence;
- this recovery plan;
- Vercel fallback workflow;
- no-secrets debug sanitization;
- tests preventing raw token/session rendering.

Potentially remove or disable only after evidence:

- DOM-level recovery scripts that patch `fetch` or reload `/profile`;
- duplicate debug scripts that conflict with React state;
- session-clearing timeout paths that treat slow current-user requests as expired sessions.

## 12. Production deploy discipline

Vercel free/Hobby daily limit can block production deploys. To avoid wasting deploy attempts:

- do not trigger production fallback repeatedly when Vercel reports `api-deployments-free-per-day`;
- batch fixes before deploy;
- run local `npm run check` and `npm run build` before every production attempt;
- record target SHA before running fallback;
- verify live JS asset changed after deploy.

Production fallback inputs must always include `expected_sha`.

## 13. Final report format for any recovery PR

Every recovery PR must report:

1. Branch.
2. Confirmed live symptom.
3. Current deployed commit and current `main` commit.
4. Whether live was stale or current.
5. Checkpoints tested.
6. Confirmed good commit.
7. Confirmed bad commit.
8. First bad commit, if bisect was used.
9. Exact broken file/condition.
10. Fix type: hunk patch / targeted revert / restore branch.
11. Changed files.
12. Checks run.
13. Live QA routes.
14. What was not verified.
15. Risks.

## 14. Short operating rule

Do not roll back because the last fix did not deploy. Deploy first, verify live, then decide.

Do not roll back all recent work because one route fails. Find the first bad commit or the exact broken gate.

Do not let secondary profile/material/media errors block an authenticated user from entering the old cabinet shell.
