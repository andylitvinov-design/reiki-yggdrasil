# Reiki Yggdrasil — LOG

## 2026-05-06 — Fill central step cards with draft learner content

Mode: implementation branch.

Changed on branch `codex/fill-reiki-draft-content`:

- Updated `src/data/reikiKnowledgeBase.js`.
- Added draft learner-facing content for all 37 central course cards.
- Central card fields now have content for every record:
  - `intro`
  - `meaning`
  - `opens`
  - `skills`
  - `result`
- Kept all stable IDs unchanged: `RY-L01-S01` through `RY-L07-S06`.
- Kept all level names, step names, counts, and labels aligned with the latest corrected structure.
- Marked all draft-filled records as `contentStatus: "needs_review"`.
- Kept methodichki verification explicit: original methodichki/source text was not found in repo search and still needs author review.
- Updated `docs/knowledge-base/REIKI_STEPS_KNOWLEDGE_BASE.md` with the new draft-content status and review policy.
- Updated `STATE.md` to reflect draft content coverage and remaining verification risks.

Findings:

- Current repo has canonical course data in `src/data/reikiKnowledgeBase.js`.
- The central UI in `src/main.jsx` already renders the `intro`, `meaning`, `opens`, `skills`, and `result` fields from the knowledge base.
- Full source methodichki are not present in the inspected repo state.
- Because source methodichki were not found, content is a safe draft scaffold based on the verified course structure, titles, and themes, not final verified methodichki text.

Verification:

- GitHub file inspection completed.
- Confirmed files changed through GitHub API commits.
- Local npm verification not completed in this assistant session:
  - `npm ci` not run
  - `npm run validate:knowledge` not run
  - `npm run build` not run
  - browser preview not run

Required checks before merge:

- `npm ci`
- `npm run validate:knowledge`
- `npm run build`
- local or Vercel preview check of `/`
- desktop three-column layout QA
- mobile layout below 980px QA
- click through all 7 levels / 37 records
- confirm no raw technical statuses are shown to learners
- confirm no console errors

Risks:

- Draft texts are not verified against author methodichki.
- Some later-course descriptions are intentionally generalized scaffold copy and should be replaced by exact methodichki content when available.
- Long Russian texts may need spacing/scroll QA in the central card.
- External `ai-projects-brain` memory still likely needs reconciliation with current repo state.

## 2026-05-05 — Align GitHub knowledge base with course screenshots and corrections

Mode: analysis + implementation branch.

Changed on branch `codex/reiki-knowledge-base`:

- Added repo-local agent rules in `AGENTS.md`.
- Added current project state in `STATE.md`.
- Added this log in `LOG.md`.
- Added canonical UI-readable knowledge base in `src/data/reikiKnowledgeBase.js`.
- Replaced the temporary `Корни/Ствол/Семена` placeholder structure with the user-provided course structure.
- Added structural records for all 7 levels / 37 records.
- Added exact level names and latest corrections:
  - Level 1: `Базовая программа Рейки Иггдрасиль` — 5 items.
  - Level 2: `Инструкторский курс` — 6 items.
  - Level 3: `Храмовая магия` — 5 items, with `Толтекская магия` and `Суфизм` as steps 4-5.
  - Level 4: `Восточная магия` — 5 items, with `Кундалини` and `Денежная магия` as steps 4-5.
  - Level 5: `Западноевропейская магия. Каббала и Таро` — 5 items.
  - Level 6: `Продвинутая магия рун` — 5 items.
  - Level 7: `Высшая магия` — 6 items, with `Славянская магия 1`, `Славянская магия 2`, and `Цивилизации` as steps 4-6.
- Added `stepLabel` support: Level 1 uses `Уровень`, Levels 2-7 use `Ступень`.
- Updated `src/main.jsx` to render course labels/titles from the knowledge base.
- Updated the left-menu group count text to use each level's `stepLabel`, so Level 1 does not display the generic `ступеней` wording.
- Added public placeholder handling so raw `needs_content` values are not shown to learners.
- Replaced learner-facing technical status strings with readable Russian text and added `public/favicon.svg` so preview does not log a favicon 404.
- Improved selected left-menu key contrast in `public/knowledge-ui.css` so long Russian titles stay readable after wrapping.
- Declared `"type": "module"` in `package.json` because existing Vite/PostCSS/Tailwind config files already use ESM syntax.
- Added status display for not-yet-authored records.
- Added small status styles in `src/index.css`.
- Added human-readable knowledge-base documentation in `docs/knowledge-base/REIKI_STEPS_KNOWLEDGE_BASE.md`.
- Added `scripts/validate-knowledge-base.mjs`.
- Added `npm run validate:knowledge` and `npm run check` scripts.
- Added `.github/workflows/ci.yml` to run install, knowledge validation, and build on PRs.

Findings:

- User screenshots and follow-up corrections define the actual accepted course structure: 7 levels / 37 records.
- Earlier 7-level placeholder structure was wrong and has been replaced.
- Current repo `main` is simpler than external project memory.
- Current repo `main` did not contain `AGENTS.md`, `STATE.md`, `LOG.md`, `src/App.jsx`, `src/pages/*`, `src/lib/supabaseClient.js`, or Supabase migrations during audit.
- External `ai-projects-brain` memory likely needs update/reconciliation.

Verification:

- GitHub file inspection completed.
- Confirmed `src/data/reikiKnowledgeBase.js` was updated with latest user-corrected 7-level structure.
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
