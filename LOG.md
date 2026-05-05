# Reiki Yggdrasil — LOG

## 2026-05-05 — Align GitHub knowledge base with course screenshots

Mode: analysis + implementation branch.

Changed on branch `codex/reiki-knowledge-base`:

- Added repo-local agent rules in `AGENTS.md`.
- Added current project state in `STATE.md`.
- Added this log in `LOG.md`.
- Added canonical UI-readable knowledge base in `src/data/reikiKnowledgeBase.js`.
- Replaced the temporary `Корни/Ствол/Семена` placeholder structure with the user-provided screenshot structure.
- Added structural records for all 7 levels / 37 records.
- Added exact level names from screenshots:
  - `Базовая программа Рейки Иггдрасиль`
  - `Инструкторский курс`
  - `Храмовая терапия`
  - `Восточная магия`
  - `Западноевропейская магия. Каббала и Таро`
  - `Продвинутая магия рун`
  - `Высшая магия`
- Added exact record titles visible in screenshots.
- Added `stepLabel` support: Level 1 uses `Уровень`, Levels 2-7 use `Ступень`.
- Updated `src/main.jsx` to render course labels/titles from the knowledge base.
- Added public placeholder handling so raw `needs_content` values are not shown to learners.
- Added status display for not-yet-authored records.
- Added small status styles in `src/index.css`.
- Added human-readable knowledge-base documentation in `docs/knowledge-base/REIKI_STEPS_KNOWLEDGE_BASE.md`.
- Added `scripts/validate-knowledge-base.mjs`.
- Added `npm run validate:knowledge` and `npm run check` scripts.
- Added `.github/workflows/ci.yml` to run install, knowledge validation, and build on PRs.

Findings:

- User screenshots show the actual accepted course structure: 7 levels / 37 records.
- Earlier 7-level placeholder structure was wrong and has been replaced.
- Current repo `main` is simpler than external project memory.
- Current repo `main` did not contain `AGENTS.md`, `STATE.md`, `LOG.md`, `src/App.jsx`, `src/pages/*`, `src/lib/supabaseClient.js`, or Supabase migrations during audit.
- External `ai-projects-brain` memory likely needs update/reconciliation.

Verification:

- GitHub file inspection completed.
- Confirmed `src/data/reikiKnowledgeBase.js` was updated with screenshot-aligned 7-level structure.
- Local clone/npm verification not completed because the execution container could not resolve `github.com`.
- Required checks still to run in a networked/dev environment:
  - `npm ci`
  - `npm run validate:knowledge`
  - `npm run build`
  - local preview and responsive QA

Risks:

- Full lesson descriptions/practices/results are still not authored; only structure and titles are aligned.
- Long Russian titles may need mobile CSS/spacing QA.
- New all-level accordion behavior needs visual QA on desktop/mobile.
- CI workflow must be observed after GitHub Actions starts; current environment cannot prove the run result.
- Stale project memory may mislead future Codex tasks unless updated.
