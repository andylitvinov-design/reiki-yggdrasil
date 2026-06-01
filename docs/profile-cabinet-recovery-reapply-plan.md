# Profile Cabinet Recovery Reapply Program

Last updated: 2026-05-31
Companion documents:
- `docs/profile-cabinet-recovery-plan.md`
- `docs/profile-cabinet-recovery-operator-checklist.md`

## 1. Purpose

This document defines how to safely restore newer commits, features, and fixes after a rollback or restore-from-known-good baseline.

It answers the question:

```text
If we roll back old /profile to a working point, how do we bring later work back without reintroducing the bug?
```

This is not a rollback plan. It is the controlled reapply plan after rollback.

## 2. Core principle

Never reapply the whole recent chain at once.

Reapply in waves. Each wave must have:

- a narrow purpose;
- changed-file list;
- checks;
- route QA;
- a decision: keep, patch, skip, or split.

If a wave reintroduces the cabinet failure, stop and bisect inside that wave.

## 3. Preconditions before reapply

Start reapply only after all are true:

```text
[ ] A known-good baseline is confirmed.
[ ] Old /profile opens after Google login on that baseline.
[ ] Current bad behavior is documented.
[ ] /profile-lite status is known.
[ ] A restore/reapply branch exists.
[ ] main is not force-pushed or reset.
[ ] safety tag exists for the current main and known-good baseline.
```

Example branches:

```bash
git checkout -b restore/profile-from-known-good <confirmed-good-sha>
```

Example tags:

```bash
git tag safety-current-main-before-reapply <current-main-sha>
git tag safety-known-good-profile <known-good-sha>
```

## 4. Reapply wave order

### Wave 0 — baseline lock

Goal: freeze and document the known-good state before adding anything.

Actions:

- run `npm ci`;
- run `npm run check`;
- run `npm run build`;
- verify `/`, `/profile`, `/masters`, `/profile/admin`;
- verify Google login on `/profile` if possible;
- capture `/profile?debugAuth=1` if available.

Exit criteria:

```text
Old /profile works and baseline evidence is recorded.
```

If this fails, the baseline is not known-good. Stop and choose another baseline.

### Wave 1 — docs, tests, and non-runtime metadata

Goal: bring back useful knowledge without changing production behavior.

Allowed:

- docs;
- tests that do not change app runtime;
- README/STATE/LOG entries;
- recovery plans;
- debug plans.

Forbidden:

- changes to `src/` runtime files;
- changes to `index.html` script tags;
- changes to migrations;
- changes to Vercel workflow.

Checks:

```bash
npm run check
npm run build
```

If this wave fails, split docs/tests and identify which file broke checks.

### Wave 2 — deployment safety infrastructure

Goal: bring back deploy support without changing app logic.

Allowed:

- `.github/workflows/deploy-production.yml`;
- scripts that only verify/debug deploy contracts;
- docs for Vercel fallback.

Forbidden:

- app runtime changes;
- Supabase/OAuth changes;
- route rewrites unrelated to fallback support.

Checks:

```bash
npm run check
npm run build
```

QA:

- workflow syntax visible in GitHub Actions;
- fallback workflow still requires `expected_sha`;
- no secrets committed.

### Wave 3 — `/profile-lite` diagnostic route

Goal: restore the independent auth/session/profile control route.

Allowed:

- `src/pages/ProfileLitePage.jsx`;
- `src/lib/profileLiteClient.js`;
- route wiring in `src/main.jsx`;
- `vercel.json` SPA rewrite if needed;
- profile-lite tests;
- small fallback link from old `/profile` to `/profile-lite`.

Forbidden:

- changing old `/profile` bootstrap/render logic in the same wave;
- changing OAuth provider settings;
- schema/migration changes.

Checks:

```bash
npm run test:profile-lite
npm run check
npm run build
```

QA:

```text
/profile-lite opens
/profile-lite Google login returns to /profile-lite
/profile-lite shows current user/profile statuses safely
/profile still behaves like baseline
```

If `/profile` breaks in this wave, inspect only shared imports, route wiring, `vercel.json`, and any fallback link inserted into `ProfilePage.jsx`.

### Wave 4 — Supabase/session/auth helpers

Goal: reapply only proven lower-layer fixes.

Allowed only with evidence:

- `src/lib/supabaseClient.js` request timeout fixes;
- safe session normalization;
- safe current-user response normalization;
- no-secret error sanitization;
- tests for these helpers.

Forbidden:

- forced OAuth token response hacks;
- broad redirect URL changes without live evidence;
- clearing stored session on generic timeout;
- mixing UI render-gate changes in the same wave.

Checks:

```bash
npm run test:profile-loading-recovery
npm run check
npm run build
```

QA:

- `/profile-lite` still works;
- old `/profile` still works;
- no raw token/session values in DOM.

If `/profile-lite` fails here, stop. The lower layer was rebroken.

### Wave 5 — old `/profile` bootstrap and render-gate fixes

Goal: restore the minimal old cabinet auth/render fixes.

Allowed:

- `ProfilePage.jsx` gate fixes;
- `profileBootstrapClient.js` current-user normalization;
- loading/recovery state fixes;
- non-blocking authenticated shell logic;
- contract tests.

Core rule:

```text
If user?.id exists, the old /profile shell should open.
```

Forbidden:

- OAuth rewrite;
- migrations;
- large UI redesign;
- unrelated materials/mandala feature work.

Checks:

```bash
node test/profilePageAuthBootstrap.test.mjs
node test/profileBootstrapClient.test.mjs
npm run test:profile-loading-recovery
npm run check
npm run build
```

QA:

```text
/profile no session → login state
/profile Google login → shell opens
/profile?debugAuth=1 → cabinetCondition yes when user id exists
/profile-lite still works
```

If this wave breaks the cabinet, bisect inside this wave before moving on.

### Wave 6 — secondary data loaders and cabinet content

Goal: restore materials/media/profile/power-place loaders without blocking entry.

Allowed:

- materials loader fixes;
- profile data loader fixes;
- power-place optional data loaders;
- tradition/media loaders;
- inline warning behavior.

Core rule:

```text
Data failures must not return the user to full-page loading.
```

Checks:

```bash
npm run test:profile-media
npm run test:profile-materials
npm run test:profile-services
npm run test:power-place
npm run check
npm run build
```

QA:

- shell opens before secondary data completes;
- materials errors show inline warning;
- media errors show inline warning;
- no raw storage refs/token values exposed.

### Wave 7 — UI/UX improvements unrelated to auth

Goal: reapply visual and workflow improvements after the cabinet is stable.

Allowed:

- source menu refinements;
- mandala UI improvements;
- layout/styling;
- service/order UX;
- non-auth feature work.

Forbidden:

- hidden auth/session changes inside UI PR;
- changing old `/profile` gate conditions without new evidence.

Checks:

```bash
npm run check
npm run build
```

QA:

- desktop 1366/1440;
- mobile 390/500;
- `/`, `/profile`, `/profile-lite`, `/masters`, `/profile/admin`;
- no console errors;
- no horizontal overflow.

## 5. Reapply methods

### Method A — cherry-pick one commit

Use for small known-good commits.

```bash
git cherry-pick <sha>
```

If conflict occurs, stop and inspect. Do not auto-resolve blindly.

### Method B — cherry-pick no-commit, then split

Use for mixed commits.

```bash
git cherry-pick --no-commit <sha>
```

Then stage only safe hunks:

```bash
git add -p
```

### Method C — manual hunk reapply

Use when the original commit is too broad.

Copy only the exact needed code path and write a new test.

### Method D — skip and replace

Use when a previous commit implemented the right intent in a risky way.

Example:

```text
Skip DOM reload script; replace with React state test and explicit render gate.
```

## 6. Reapply decision table

| Candidate change | Reapply? | How |
|---|---|---|
| Docs/debug plan | Yes | Wave 1 |
| `/profile-lite` | Yes, usually | Wave 3 |
| Vercel fallback workflow | Yes | Wave 2 |
| No-secret debug sanitization | Yes | Wave 4/5 |
| DOM fetch/reload recovery script | Maybe | Only if proven necessary; prefer skip |
| Forced OAuth token response workaround | No | Skip unless new proof |
| Session-clearing timeout path | Usually no | Replace with recoverable error |
| `user.id` render gate | Yes | Wave 5 |
| Secondary data inline warnings | Yes | Wave 6 |
| UI layout changes | Later | Wave 7 |

## 7. Stop conditions during reapply

Stop immediately if:

```text
/profile-lite breaks
/profile shell stops opening
live deploy is stale
Vercel limit blocks deploy
raw token/env appears in DOM/console
more than one wave is mixed into one PR
```

After stop:

1. mark the last applied wave as suspect;
2. revert only that wave branch/commit;
3. record evidence;
4. split the wave into smaller commits.

## 8. Required PR format for reapply waves

Every reapply PR must include:

```text
Wave number:
Source commits/cherry-picks:
Files changed:
Why this wave is safe:
What was deliberately skipped:
Checks run:
Route QA:
/profile-lite result:
/profile result:
Risks:
Next wave recommendation:
```

## 9. Final completion criteria

The reapply program is complete only when:

```text
[ ] old /profile opens after Google login
[ ] /profile-lite works
[ ] /, /masters, /profile/admin work
[ ] Vercel production is on intended SHA
[ ] live JS asset matches intended build
[ ] no raw tokens/env values exposed
[ ] secondary data failures are non-blocking
[ ] docs/STATE/LOG/postmortem are updated
```
