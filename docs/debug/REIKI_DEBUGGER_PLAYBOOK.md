# Reiki Yggdrasil — Debugger Agent Playbook

Status: v1, additive debugging infrastructure.
Last updated: 2026-05-30.

## Purpose

This playbook upgrades the Reiki Yggdrasil agent from a screenshot-based helper into a structured debugger. The agent must classify bugs, collect evidence, protect accepted UI/data flows, and produce minimal safe Codex prompts.

## Project boundary

- Canonical repo: `andylitvinov-design/reiki-yggdrasil`
- Current/legacy live URL: `https://reiki-yggdrasil.vercel.app`
- Target production URL: `https://mentalica.vercel.app`
- Framework: Vite + React
- Hosting: Vercel, build command `npm run build`, output `dist`
- Core routes: `/`, `/profile`, `/masters`, `/profile/admin`

## Non-negotiable safety rules

- Preserve the public home page unless the task explicitly targets it.
- Preserve RU-default interface and Russian-first copy.
- Preserve the accepted desktop three-column structure.
- Preserve mobile fallback below `980px`.
- Do not rewrite the whole project when a small additive fix is enough.
- Do not expose env values, tokens, service-role keys, private student data, or private master notes.
- Treat Supabase credentials, seeded data, OAuth redirects, and live auth/profile flows as `needs verification` unless verified on the relevant deployment.
- Distinguish production/live from preview before claiming a bug is fixed.

## Required context read before debugging

Read repo-local context first:

1. `AGENTS.md`
2. `README.md`
3. `STATE.md`
4. `LOG.md`
5. `package.json`
6. `vercel.json`
7. `src/main.jsx`
8. `src/index.css`
9. `src/pages/ProfilePage.jsx` if present
10. `src/pages/MastersPage.jsx` if present
11. `src/pages/AdminPage.jsx` if present
12. `src/lib/supabaseClient.js` if present
13. relevant `src/lib/*Client.js` files
14. relevant `supabase/migrations/*` files

If a file is missing, report `not found`; do not invent it.

## Debugger operating mode

### Step 1 — Identify the task

Classify the request as one of:

- `bug`
- `design_mismatch`
- `live_mismatch`
- `auth_data_flow`
- `content_issue`
- `quality_audit`
- `feature_change`

Then name the affected route and viewport if known.

### Step 2 — Classify the bug layer

Use `docs/debug/REIKI_BUG_TAXONOMY.md` and choose a primary layer:

- `DEPLOY_MISMATCH`
- `ROUTING`
- `AUTH`
- `SUPABASE_RLS`
- `STORAGE_MEDIA`
- `UI_LAYOUT_DESKTOP`
- `UI_LAYOUT_MOBILE`
- `STATE_MANAGEMENT`
- `DATA_CONTRACT`
- `COURSE_CONTENT`
- `ADMIN_MODERATION`
- `SERVICE_ORDER_FLOW`
- `PRINT_DOWNLOAD_EXPORT`

A bug can have secondary layers, but the first action must match the primary layer.

### Step 3 — Collect evidence

Before proposing a fix, capture:

- route
- viewport
- actual behavior
- expected behavior
- deployment/live or preview URL
- branch/PR/commit if available
- likely files
- exact component/function/selectors if found
- what is confirmed
- what is `needs verification`

Never start from generic hypotheses when a concrete file or component can be checked.

### Step 4 — Plan a minimal safe fix

A good fix plan includes:

- target branch
- exact files/components
- minimal code or CSS scope
- forbidden changes
- automated checks
- manual route/viewport checks
- risk list
- STATE/LOG update need

### Step 5 — Codex prompt standard

Every Codex prompt must include:

- repo
- live URL and target domain if relevant
- target branch
- files to read first
- files likely to change
- affected route(s)
- exact expected behavior
- exact actual behavior/evidence
- minimal safe fix instruction
- do-not-change list
- commands/checks
- manual QA matrix
- report format

### Step 6 — Post-fix verification

After Codex reports a fix, verify:

- branch created from current `origin/main`
- changed files are intended
- no secrets were added
- automated checks passed
- relevant routes were checked
- desktop and mobile states were checked when UI changed
- PR exists or commit path is documented
- preview URL is checked when available
- live URL is checked after merge/deploy
- remaining items are clearly marked `needs verification`

## Evidence report template

```text
Project: reiki-yggdrasil
Mode: ANALYSIS / PLAN / IMPLEMENTATION
Bug class:
Route:
Viewport:
Expected:
Actual:
Evidence confirmed:
Needs verification:
Likely files:
Minimal fix:
Do not change:
Checks:
Risks:
STATE/LOG update:
```

## Live vs preview discipline

Do not claim production completion unless the relevant live URL was checked after merge/deploy. The current/legacy live URL and target production URL may differ during domain migration.

For domain migration tasks, check both when relevant:

- `https://reiki-yggdrasil.vercel.app/`
- `https://reiki-yggdrasil.vercel.app/profile`
- `https://reiki-yggdrasil.vercel.app/masters`
- `https://reiki-yggdrasil.vercel.app/profile/admin`
- `https://mentalica.vercel.app/`
- `https://mentalica.vercel.app/profile`
- `https://mentalica.vercel.app/masters`
- `https://mentalica.vercel.app/profile/admin`

## Debug snapshot

Use `src/lib/reikiDebugSnapshot.js` and `npm run verify:debug-contract` as a local contract smoke check. The snapshot is intentionally static/pure: it records expected project contracts and env-presence booleans only. It must not call Supabase or leak env values.
