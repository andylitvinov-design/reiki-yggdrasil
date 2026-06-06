# Vercel Safe Release Mapping Analysis — 2026-06-06

## Scope

Safe configuration analysis only. No UI, route, Vercel rewrite, Supabase schema, auth flow, domain, or env value changes were made.

Analysis branch:

```text
codex/vercel-safe-release-mapping
```

## Repo config verified

- Repo: `andylitvinov-design/reiki-yggdrasil`
- Framework: Vite + React
- Build command from `package.json`: `npm run build` -> `vite build`
- Vercel config: `vercel.json`
- Vercel build command: `npm run build`
- Vercel output directory: `dist`
- Vercel framework: `vite`
- No checked-in `.vercel/project.json` or other Vercel project binding exists in the repo.

Preserved SPA rewrites in `vercel.json`:

- `/`
- `/profile`
- `/masters`
- `/profile/admin`

The router for those paths is in `src/main.jsx`. `src/App.jsx` is not present in this repo state.

## Current Vercel project/domain mapping

Verified via Vercel CLI/API without printing env values.

### Test/staging candidate

- URL: `https://2mentalica.vercel.app`
- Vercel project: `2mentalica`
- Git repo: `andylitvinov-design/reiki-yggdrasil`
- Current production deployment ref: `main`
- Current production deployment SHA: `acdf72a9a3134fd9d269956c38ceaa3c308c6b46`
- Current role: valid test/preview candidate fed by `main`

### Client-facing production project

- URL: `https://mentalica.vercel.app`
- Legacy/current alias: `https://reiki-yggdrasil.vercel.app`
- Vercel project: `reiki-yggdrasil`
- Git repo: `andylitvinov-design/reiki-yggdrasil`
- Current promoted production deployment ref: `main`
- Current promoted production deployment SHA: `2a0115f34ffd5255223ad14332f749b9a6db5757`
- Current risk: client-facing aliases are still effectively fed by `main`, not `production`.

## Current GitHub branch state

Verified after `git fetch origin`.

- `origin/main`: `acdf72a9a3134fd9d269956c38ceaa3c308c6b46`
- `origin/production`: `2a0115f34ffd5255223ad14332f749b9a6db5757`
- `origin/production...origin/main`: `0` commits only on `production`, `19` commits only on `main`
- Merge-base: `2a0115f34ffd5255223ad14332f749b9a6db5757`
- Interpretation: `production` is an ancestor of `main`; no production-only commits were found.

GitHub branch protection via `gh api`:

- `main`: unprotected
- `production`: unprotected

Do not merge `main` into `production` automatically from this analysis. The 19 commits on `main` require owner QA/release approval.

## Env names verified

Required frontend env names in code:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_ADMIN_EMAIL`

Vercel env-name metadata:

- `reiki-yggdrasil` production: all three names are present.
- `reiki-yggdrasil` preview: no env names listed.
- `2mentalica` production: no env names listed.
- `2mentalica` preview: no env names listed.

No env values were printed or committed.

Staging/test Supabase for `2mentalica`: `needs configuration`; CLI evidence shows no Vercel env names for that project yet.

## Supabase redirect requirements

Code uses `window.location.origin` for auth redirects in `src/lib/supabaseClient.js`; no hardcoded domain was found in the redirect builder.

Supabase dashboard redirect URLs still need manual verification:

- `https://mentalica.vercel.app/profile`
- `https://mentalica.vercel.app/profile/admin`
- `https://reiki-yggdrasil.vercel.app/profile`
- `https://reiki-yggdrasil.vercel.app/profile/admin`
- `https://2mentalica.vercel.app/profile`
- `https://2mentalica.vercel.app/profile/admin`
- `https://www.2mentalica.vercel.app/profile` if that alias exists
- `https://www.2mentalica.vercel.app/profile/admin` if that alias exists

Do not remove legacy redirects until live OAuth QA passes.

## Recommended target mapping

- `2mentalica` project:
  - Production branch: `main`
  - Domain: `https://2mentalica.vercel.app`
  - Env: staging/test Supabase values under the three env names above
- `reiki-yggdrasil` project:
  - Production branch: `production`
  - Domains: `https://mentalica.vercel.app`, `https://reiki-yggdrasil.vercel.app`
  - Env: production Supabase values under the three env names above
- GitHub:
  - Protect `production`
  - Prefer PR/release merge into `production`
  - Do not push directly to `production`

## Exact next manual steps

1. In GitHub, protect branch `production`:
   - Require a pull request before merging
   - Block direct pushes if available
   - Block force pushes
   - Require status checks if available
   - Require conversation resolution if available
2. In Vercel project `reiki-yggdrasil`, open Settings -> Git and set Production Branch to `production`.
3. In Vercel project `reiki-yggdrasil`, keep both domains assigned:
   - `mentalica.vercel.app`
   - `reiki-yggdrasil.vercel.app`
4. In Vercel project `2mentalica`, keep Production Branch as `main`.
5. In Vercel project `2mentalica`, add staging/test env values using only these names:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_ADMIN_EMAIL`
6. In Supabase, verify target, legacy, and `2mentalica` redirect URLs listed above.
7. Only after owner QA on `https://2mentalica.vercel.app`, create a `release/*` branch from the approved `main` SHA and open a PR into `production`.
8. After merge to `production`, verify both client-facing domains and use `.github/workflows/deploy-production.yml` only if Vercel auto-deploy is stale or wrong.

## Verification run

- `npm install`: exited `0`, 100 packages installed, 0 vulnerabilities reported.
- `npm run build`: exited `0`; retained existing Vite large-chunk warning.
- `npm run check`: exited `0`; retained existing Vite large-chunk warning and existing `RY-L04-S04` / `RY-L04-S05` video placeholder warnings.
- `npm test`: not available; no `test` script exists in `package.json`.

Live HTTP smoke:

- `https://2mentalica.vercel.app/`: `200`
- `https://2mentalica.vercel.app/profile`: `200`
- `https://2mentalica.vercel.app/masters`: `200`
- `https://2mentalica.vercel.app/profile/admin`: `200`
- `https://mentalica.vercel.app/`: `200`
- `https://mentalica.vercel.app/profile`: `200`
- `https://mentalica.vercel.app/masters`: `200`
- `https://mentalica.vercel.app/profile/admin`: `200`
- `https://reiki-yggdrasil.vercel.app/`: `200`
- `https://reiki-yggdrasil.vercel.app/profile`: `200`
- `https://reiki-yggdrasil.vercel.app/masters`: `200`
- `https://reiki-yggdrasil.vercel.app/profile/admin`: `200`

All smoke responses returned title `Рейки Иггдрасиль`.

## Not verified

- Actual Vercel dashboard branch setting after any manual change; no branch-setting mutation was performed.
- GitHub branch protection mutation; no protection rule was created.
- Supabase dashboard redirect URL list.
- `www.2mentalica.vercel.app` existence.
- Real Google OAuth login on target, legacy, or staging domains.
- Real staging Supabase data separation, migrations, RLS, admin membership, media bucket, and test users.
- Browser visual QA, desktop three-column layout, mobile layout, console errors, uploads, save/update mandala, and authenticated profile/admin flows.

## ai-projects-brain memory suggestion

For `ai-projects-brain`, add/update project memory:

```text
Reiki Yggdrasil / Mentalica release mapping verified 2026-06-06: 2mentalica Vercel project exists and production deploys from main at acdf72a; reiki-yggdrasil Vercel project serves mentalica.vercel.app and reiki-yggdrasil.vercel.app but is still promoted from main at 2a0115f, so the client-facing project must be switched to production before the release model is safe. GitHub production branch exists at 2a0115f, is an ancestor of main, has 0 unique commits vs main and 19 main-only commits; main and production are both unprotected. reiki-yggdrasil production env names VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, VITE_ADMIN_EMAIL are present; 2mentalica has no production/preview env names yet and needs staging Supabase configuration. Do not auto-merge main into production without owner QA/release approval.
```
