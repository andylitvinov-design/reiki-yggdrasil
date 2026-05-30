# Mentalica domain migration runbook

Target production URL: `https://mentalica.vercel.app`

Current/legacy URL until migration is verified: `https://reiki-yggdrasil.vercel.app`

## Goal

Prepare the Reiki Yggdrasil Vercel/Supabase deployment so production can be served from `mentalica.vercel.app` without breaking the existing public site, profile cabinet, Google OAuth, Supabase data flows, or SPA route refreshes.

## Repo and hosting boundary

- Canonical repo: `andylitvinov-design/reiki-yggdrasil`
- Framework: Vite + React
- Hosting: Vercel
- Build command: `npm run build`
- Output directory: `dist`
- Routing config: `vercel.json`

## Code inspection result

The frontend auth redirect flow is origin-based, not hardcoded to the old domain:

- `src/lib/supabaseClient.js` builds magic-link redirects as `${window.location.origin}${safePath}`.
- `src/lib/supabaseClient.js` builds Google OAuth redirects with `new URL(safePath, window.location.origin).toString()`.

Therefore, no React/Supabase code change is required for the domain switch as long as Vercel and Supabase are configured correctly.

## Required Vercel checks

1. Confirm the Vercel project is connected to `andylitvinov-design/reiki-yggdrasil`.
2. Confirm production deployment uses the intended branch/commit.
3. Assign `mentalica.vercel.app` to the same Vercel project.
4. Keep `reiki-yggdrasil.vercel.app` available during the transition unless there is an explicit decision to remove it later.
5. Confirm production env names are present without exposing values:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_ADMIN_EMAIL`
6. Confirm `vercel.json` keeps SPA rewrites for:
   - `/profile`
   - `/masters`
   - `/profile/admin`

## Required Supabase Auth checks

Add target redirect URLs:

- `https://mentalica.vercel.app/profile`
- `https://mentalica.vercel.app/profile/admin`

Keep legacy redirect URLs during migration:

- `https://reiki-yggdrasil.vercel.app/profile`
- `https://reiki-yggdrasil.vercel.app/profile/admin`

For Google OAuth, keep the Supabase callback URL configured in Google Cloud OAuth redirect URIs. Do not put Google/Supabase secret values in this repo or in reports.

## Live QA checklist

After the target domain is assigned and deployed, verify:

- `https://mentalica.vercel.app/`
- `https://mentalica.vercel.app/profile`
- `https://mentalica.vercel.app/masters`
- `https://mentalica.vercel.app/profile/admin`
- direct refresh on `/profile`, `/masters`, `/profile/admin`
- Google login from `/profile`
- Google login/admin flow from `/profile/admin`
- profile data load/save with an authenticated test profile
- public approved profiles on `/masters`
- admin moderation page access for `VITE_ADMIN_EMAIL`
- no browser console errors
- desktop three-column layout preserved
- mobile layout below `980px` remains usable

## Risks

- `mentalica.vercel.app` may already be unavailable or assigned to another Vercel project.
- Supabase OAuth will fail if the target redirect URLs are missing.
- Removing the old redirect URLs too early can break users who still open the legacy domain.
- Vercel project mismatch can make the new domain point to an older or wrong deployment.
- Preview deployments are not production; do not treat preview verification as production verification.

## Rollback

If OAuth or production routing fails after the switch:

1. Keep or restore `reiki-yggdrasil.vercel.app` as the working live URL.
2. Re-add old Supabase redirect URLs if they were removed.
3. Check Vercel project alias assignment.
4. Check Vercel production env names.
5. Re-run live QA on both domains before removing any legacy configuration.
