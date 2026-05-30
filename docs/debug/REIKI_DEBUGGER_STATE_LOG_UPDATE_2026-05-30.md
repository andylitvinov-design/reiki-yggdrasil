# Reiki Yggdrasil — Proposed STATE/LOG update for debugger infrastructure v1

Status: proposed update because `STATE.md` and `LOG.md` are long files and should be edited locally or by Codex with full-file context to avoid accidental truncation.
Date: 2026-05-30

## Proposed STATE.md entry

```md
## 2026-05-30 — Debugger-agent infrastructure v1

- Added additive debugger-agent infrastructure for Reiki Yggdrasil without changing product UI, routes, Supabase schema, or Vercel rewrites.
- New debugger docs:
  - `docs/debug/REIKI_DEBUGGER_PLAYBOOK.md`
  - `docs/debug/REIKI_BUG_TAXONOMY.md`
  - `docs/ui-contracts/REIKI_PROFILE_UI_CONTRACT.md`
  - `docs/supabase/REIKI_SUPABASE_CONTRACT.md`
  - `docs/media/REIKI_MEDIA_STORAGE_CONTRACT.md`
  - `docs/prompts/CODEX_REIKI_DEBUG_PROMPT_TEMPLATE.md`
- Added `src/lib/reikiDebugSnapshot.js` with a JSON-safe static contract snapshot for debugger use:
  - project/repo/framework/hosting;
  - current/legacy and target production URLs;
  - expected routes `/`, `/profile`, `/masters`, `/profile/admin`;
  - env presence booleans only for `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_ADMIN_EMAIL`;
  - UI/Supabase/media contract summaries;
  - bug taxonomy and audit checks.
- Added `scripts/verify-reiki-debug-contract.mjs`.
- Added `npm run verify:debug-contract` and wired it into `npm run check` before the existing test/build chain.

Needs verification:

- Run `npm run verify:debug-contract` locally.
- Run `npm run check` locally.
- Run `npm run build` locally.
- Confirm Vercel production deploy includes the latest commits.
- Browser QA still required for `/`, `/profile`, `/masters`, `/profile/admin` on desktop and mobile after deployment.
- Live Supabase/Auth/Storage behavior remains `needs verification`; the debug snapshot intentionally does not perform network calls or expose secrets.
```

## Proposed LOG.md entry

```md
## 2026-05-30 — Debugger-agent infrastructure v1

Mode: additive project-debugger upgrade for future Reiki Yggdrasil QA/Codex tasks.

Changed:

- Added `docs/debug/REIKI_DEBUGGER_PLAYBOOK.md`:
  - project boundaries;
  - context-first rules;
  - bug classification flow;
  - evidence collection;
  - Codex prompt standard;
  - post-fix verification and live/preview discipline.
- Added `docs/debug/REIKI_BUG_TAXONOMY.md` with these classes:
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
- Added UI, Supabase/Auth, and media/storage contracts:
  - `docs/ui-contracts/REIKI_PROFILE_UI_CONTRACT.md`
  - `docs/supabase/REIKI_SUPABASE_CONTRACT.md`
  - `docs/media/REIKI_MEDIA_STORAGE_CONTRACT.md`
- Added `src/lib/reikiDebugSnapshot.js`:
  - pure/static snapshot builder;
  - no Supabase/network calls;
  - reports env presence booleans only;
  - includes expected routes and contracts for future agent checks.
- Added `scripts/verify-reiki-debug-contract.mjs` and package script `verify:debug-contract`.
- Updated `npm run check` so it runs `verify:debug-contract` before existing tests/validators/build.
- Added `docs/prompts/CODEX_REIKI_DEBUG_PROMPT_TEMPLATE.md` for reusable Codex debugging tasks.

Checks:

- Static GitHub file-read verification confirmed new files exist on `main`.
- `npm run verify:debug-contract`: not run in this pass.
- `npm run check`: not run in this pass.
- `npm run build`: not run in this pass.

Notes:

- Product UI was not intentionally changed.
- Supabase schema/migrations were not changed.
- Vercel rewrites were not changed.
- Secrets/env values were not added; env debug output is presence-only by contract.

Needs verification:

- Local or Codex run of `npm run verify:debug-contract`, `npm run check`, and `npm run build`.
- Live deploy verification on `https://reiki-yggdrasil.vercel.app` and, when applicable, `https://mentalica.vercel.app`.
- Browser QA for `/`, `/profile`, `/masters`, `/profile/admin` desktop/mobile remains pending.
```

## Suggested local/Codex command

```bash
cd /path/to/reiki-yggdrasil
npm run verify:debug-contract
npm run check
npm run build
```
