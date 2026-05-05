# Reiki Yggdrasil — LOG

## 2026-05-05 — Build GitHub knowledge-base architecture for Reiki steps

Mode: analysis + implementation branch.

Changed on branch `codex/reiki-knowledge-base`:

- Added repo-local agent rules in `AGENTS.md`.
- Added current project state in `STATE.md`.
- Added this log in `LOG.md`.
- Added canonical UI-readable knowledge base in `src/data/reikiKnowledgeBase.js`.
- Moved Level 1 step content out of inline component constants into the knowledge data module.
- Added structural records for all 7 levels / 41 steps.
- Marked Level 1 content as `needs_review`.
- Marked Levels 2-7 as `needs_content`.
- Added Level 7 as placeholder `Семена`; exact canonical name/content need author verification.
- Updated `src/main.jsx` to consume knowledge-base data and allow opening all levels.
- Added public placeholder handling so raw `needs_content` values are not shown to learners.
- Added status display for not-yet-authored steps.
- Added small status styles in `src/index.css`.
- Added human-readable knowledge-base documentation in `docs/knowledge-base/REIKI_STEPS_KNOWLEDGE_BASE.md`.
- Added `scripts/validate-knowledge-base.mjs`.
- Added `npm run validate:knowledge` and `npm run check` scripts.
- Added `.github/workflows/ci.yml` to run install, knowledge validation, and build on PRs.

Findings:

- Current repo `main` is simpler than external project memory.
- Current repo `main` did not contain `AGENTS.md`, `STATE.md`, `LOG.md`, `src/App.jsx`, `src/pages/*`, `src/lib/supabaseClient.js`, or Supabase migrations during audit.
- External `ai-projects-brain` memory likely needs update/reconciliation.
- User clarified that the accepted course structure should be 7 levels, not 6.
- Exact previous/final names for all 7 levels were not found in accessible repo files; Level 7 is therefore stored as a safe placeholder requiring confirmation.
- Search found a separate Tao/Dao ступени document with stages like `Шторм` and `Ручей`, but it is not confirmed as the Reiki Yggdrasil level map and was not imported.

Verification:

- GitHub file inspection completed.
- Confirmed `src/data/reikiKnowledgeBase.js` now defines 7 levels and Level 7 placeholder.
- Local clone/npm verification not completed because the execution container could not resolve `github.com`.
- Required checks still to run in a networked/dev environment:
  - `npm install` or `npm ci`
  - `npm run validate:knowledge`
  - `npm run build`
  - local preview and responsive QA

Risks:

- Levels 2-7 are structure only, not final content.
- Level 7 placeholder name `Семена` may need replacement with the canonical author-approved name.
- New all-level accordion behavior needs visual QA on desktop/mobile.
- CI workflow must be observed after GitHub Actions starts; current environment cannot prove the run result.
- Stale project memory may mislead future Codex tasks unless updated.
