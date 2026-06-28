# SAFE.md — reiki-yggdrasil

Last verified date: 2026-06-28

This file is a compact repo-level safety map for `/safe` sweeps. It lists environment variable names only and must never contain real values.

## Project boundary

- Project name: reiki-yggdrasil
- Canonical repo: `andylitvinov-design/reiki-yggdrasil`
- Current live URL: https://reiki-yggdrasil.vercel.app
- Related/staging URL: https://2mentalica.vercel.app
- Target production URL: https://mentalica.vercel.app
- Hosting: Vercel, Vite/React, output `dist`
- Project memory: `ai-projects-brain/projects/reiki-yggdrasil/PROJECT.md`
- Routing rule: app-code work for profile, masters, admin, Power Place, master cabinet, publications, templates, services, clients, or Reiki UI belongs in this repo.

## Main public and private surface

| Surface | Path / endpoint | Access | Main risk | Notes |
| --- | --- | --- | --- | --- |
| Home / learning UI | `/` | public | frontend regression | Preserve RU default and existing home page. |
| Profile / cabinet | `/profile` | Supabase session expected | profile data boundary | Check logged-out and signed-in states. |
| Masters catalog | `/masters` | public | empty/search/layout state | Check mobile cards and no-results state. |
| Admin moderation | `/profile/admin` | admin role/email expected | role boundary | Client env must not be the only control. |
| Media/materials/uploads | profile/material routes | session expected | file and storage boundary | Check validation and placeholders. |

## Environment variable names

| Env name | Browser-safe? | Purpose | Notes |
| --- | --- | --- | --- |
| `VITE_SUPABASE_URL` | yes | Supabase public URL | intentionally public |
| `VITE_SUPABASE_ANON_KEY` | yes | Supabase anon access | relies on RLS |
| `VITE_ADMIN_EMAIL` | visible if used client-side | admin UI hint | must not be the only protection |

## Auth / data checks

- Auth provider: Supabase Auth.
- Roles to verify: anonymous, authenticated user/master, admin.
- RLS and policies: inspect `supabase/migrations/*`; live state still needs verification.
- Service-role credentials: must not appear in browser code or committed files.
- Storage buckets and file validation: needs verification.
- Direct database/API access boundaries: needs verification.

## Frontend UX smoke checks

```text
- Open `/`, `/profile`, `/masters`, `/profile/admin` directly.
- Check desktop and mobile widths.
- Refresh after data loads and use browser back/forward.
- Check logged-out profile/admin states.
- Check admin access boundaries with safe test accounts when available.
- Submit profile/admin forms once and twice quickly; confirm disabled or idempotent behavior.
- Search masters with no results.
- Check upload validation where upload UI exists.
- Confirm no blank screen, raw internal error, broken layout, or debug JSON in the UI.
```

## Headers / browser baseline

- CSP or CSP plan: needs verification.
- X-Content-Type-Options: needs verification.
- Referrer-Policy: needs verification.
- Permissions-Policy: needs verification.
- Frame protection: needs verification.
- CORS policy: Supabase/browser boundary needs verification.
- HSTS status: needs live verification before claiming.

## Verification commands

```bash
npm ci
npm run build
npm run check
npm run smoke:live
npm run deploy:verify
```

## Observability / rollback / backup

- Logs: Vercel logs and browser console; dedicated client error logging needs verification.
- Health check: live home plus `npm run smoke:live` / `npm run deploy:verify`.
- Rollback: Vercel previous deployment or revert main commit; exact last-good deploy needs verification.
- Backup/export: GitHub history plus Supabase backup/export needs verification.

## Last `/safe` result

- Date: 2026-06-28
- Routes selected: Vite/React SPA with Supabase, frontend UX, auth/admin, uploads/storage, headers, rollback/observability.
- Critical/high findings: none proven in this pass.
- Fix applied: repo-level safety map added.
- Checks run: project memory, `AGENTS.md`, and package scripts review.
- Checks not run: dependency install, build/check, live smoke, authenticated Supabase flows, browser visual check.
- Live verified: needs verification.
- Next action: run build/check and safe browser smoke before merge/deploy.
