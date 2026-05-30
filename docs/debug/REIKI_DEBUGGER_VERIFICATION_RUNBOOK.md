# Reiki Yggdrasil — Debugger Verification Runbook

Status: v1.
Last updated: 2026-05-30.

Use this runbook after changes to debugger infrastructure, UI, Supabase/Auth, Storage/media, or Vercel routing.

## 1. Local verification

Run from a clean repo checkout:

```bash
git status --short
git branch --show-current
git fetch origin
npm install
npm run verify:debug-contract
npm run check
npm run build
```

Expected:

- `verify:debug-contract` passes.
- `check` runs the debug contract first, then existing profile/media/materials/services/power-place tests, validators, and build.
- Build completes without broken imports.

If any check fails:

1. classify the failure using `docs/debug/REIKI_BUG_TAXONOMY.md`;
2. identify the exact file/function/script;
3. make the smallest safe fix;
4. rerun the failing command and then `npm run check`.

## 2. Debug contract verification

Command:

```bash
npm run verify:debug-contract
```

This verifies:

- `src/lib/reikiDebugSnapshot.js` exports a valid snapshot builder;
- core routes are listed: `/`, `/profile`, `/masters`, `/profile/admin`;
- env reporting is presence-only;
- RU default and desktop three-column contract are preserved;
- media bucket contract points to `profile-cabinet-media`;
- bug taxonomy and audit checks exist.

This does not verify:

- live Supabase connectivity;
- real Google OAuth;
- RLS policies against production data;
- signed URL behavior with a real session;
- browser layout.

Those must remain `needs verification` until tested in live/preview.

## 3. Vercel status verification

After pushing/committing to `main`, check the latest commit status.

Expected status:

- `Vercel: success`

If status is `pending`:

- do not claim live completion;
- wait or inspect Vercel deployment;
- mark live verification as pending.

If status is `failure`:

- inspect build logs;
- classify as `DEPLOY_MISMATCH`, `ROUTING`, or build/import issue;
- do not debug UI until the deployment is fixed.

## 4. Production route QA

After Vercel success, verify current/legacy live URL:

- `https://reiki-yggdrasil.vercel.app/`
- `https://reiki-yggdrasil.vercel.app/profile`
- `https://reiki-yggdrasil.vercel.app/masters`
- `https://reiki-yggdrasil.vercel.app/profile/admin`

When target production domain is active, also verify:

- `https://mentalica.vercel.app/`
- `https://mentalica.vercel.app/profile`
- `https://mentalica.vercel.app/masters`
- `https://mentalica.vercel.app/profile/admin`

For each route record:

```text
Route:
Status: ok / broken / needs verification
Viewport checked: desktop / mobile / not checked
Auth state: public / unauthenticated fallback / authenticated / admin / not checked
Console errors: yes / no / not checked
Notes:
```

## 5. Browser layout QA matrix

For UI changes, check:

| Route | Desktop 1366 | Mobile 390 | Required notes |
| --- | --- | --- | --- |
| `/` | required | required | public home preserved |
| `/profile` | required | required | login/workspace state; no horizontal overflow |
| `/masters` | required | required | public-safe fields only |
| `/profile/admin` | required | required | safe unauth/non-admin state |

Also check desktop widths when layout-sensitive:

- 1280
- 1366
- 1440
- 1710

## 6. Supabase/Auth/Storage QA

Only mark these verified after a real configured session:

- Google login from `/profile`;
- Google login/admin behavior from `/profile/admin`;
- profile/media save and reload;
- private Storage upload and signed URL display;
- public pages do not expose `storage://profile-cabinet-media/...` refs;
- admin moderation reads only appropriate rows;
- service order intent survives OAuth if the order flow is being tested.

If no real session is used, report:

```text
Supabase/Auth/Storage: needs verification — no live authenticated session used.
```

## 7. Report template

```text
Summary:
Changed files:
Latest commit:
Vercel status:
Checks run:
- npm run verify:debug-contract: pass/fail/not run
- npm run check: pass/fail/not run
- npm run build: pass/fail/not run
Routes verified:
Desktop/mobile verified:
Supabase/Auth/Storage verified:
What was not verified:
Risks:
Next action:
```

## 8. Completion rule

A task is complete only when:

- code/docs are committed;
- automated checks are run or explicitly marked not run with reason;
- Vercel status is known;
- live route QA is complete or explicitly marked `needs verification`;
- any STATE/LOG update is applied or a proposed update file exists.
