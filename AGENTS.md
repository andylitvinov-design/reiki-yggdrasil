# AGENTS.md — Reiki Yggdrasil

## Project boundary

Canonical runnable app repo: `andylitvinov-design/reiki-yggdrasil`.

Do not use `andylitvinov-design/psitrends-work` for app-code tasks. `psitrends-work` is docs/ops only and may not contain `package.json`, app source, or build scripts.

Target production URL: `https://mentalica.vercel.app`.
Current/legacy live URL until migration is verified: `https://reiki-yggdrasil.vercel.app`.
Framework: Vite + React.
Hosting: Vercel, `npm run build`, output `dist`.

## Wrong workspace stop rule

Before app-code work, confirm this is the selected workspace/repo.

If the task is running inside `/workspace/psitrends-work`, stop immediately and report:

```text
Wrong workspace selected. psitrends-work is docs/ops only. Start a new Codex task with repo andylitvinov-design/reiki-yggdrasil selected.
```

Do not try to clone `reiki-yggdrasil` from inside a `psitrends-work` Cloud task. Codex Cloud workspaces are repo-bound and outbound GitHub cloning may fail through the environment proxy.

## Cloud vs local/desktop

Cloud mode is appropriate for code, docs, tests, safe refactors, build checks, and PR preparation.

Desktop/local mode is required for:

- real Google/Supabase login;
- live authenticated account flows;
- visual UI confirmation;
- iPhone/Safari keyboard behavior;
- browser cache/cookies/session issues;
- Vercel preview/live manual verification;
- files or sessions that exist only on the user's machine.

Do not claim local/live/auth/mobile verification passed unless it was actually performed.

## Context-first rules

Before changing this repo, read:

1. `AGENTS.md`
2. `docs/codex-cloud-setup.md`
3. `docs/smoke-test-plan.md`
4. `README.md`
5. `STATE.md`
6. `LOG.md`
7. `docs/release-workflow.md`
8. `docs/deploy-fallback.md`
9. `.github/workflows/deploy-production.yml`
10. `docs/knowledge-base/REIKI_STEPS_KNOWLEDGE_BASE.md`
11. `src/data/reikiKnowledgeBase.js`
12. `src/main.jsx`
13. `src/index.css`
14. `package.json`
15. `vercel.json`
16. `src/lib/supabaseClient.js`

If a file is missing, report `not found`.

## Audit-first diagnostic mode

When the user asks for audit, UI review, UX simplification, problem analysis, regression check, screenshot review, or “what is wrong”, follow `docs/audit-loop.md` before implementation.

`/audit` is diagnostic by default. It should not edit app code, commit product fixes, push implementation changes, merge, or deploy unless the user explicitly asks to continue to `/delivery`.

For screenshots and UI complaints, audit must:

- diagnose what is wrong;
- propose a more user-friendly target interface;
- inspect likely route/component/style/data/state files deeply when repository access is available;
- follow imports to shared components and helpers;
- evaluate UX, desktop/mobile layout, clickability, saving/history, auth/privacy, code quality, regression risk, language quality, accessibility, product flow, root cause, priority/effort, edge cases, testability, observability, implementation slicing, and rollback safety;
- map UI symptoms to code-level findings, hypotheses, and technical change directions;
- identify confirmed code problems separately from UX/product improvements;
- create or update a GitHub issue with the full technical implementation instruction;
- return only a short chat response with audit status, issue link, and a concise `/delivery` prompt pointing to that issue.

For auth-gated cabinet screens, use auth-safe evidence. Never request credentials, cookies, tokens, or secrets, and never claim authenticated production visual verification unless actually performed.

If GitHub Issues are unavailable during audit, output the full issue body in chat and mark `STATUS: AUDIT_COMPLETE_ISSUE_NOT_CREATED`.

## Audit-fin numeric diagnostic mode

When the user asks for `/audit-fin`, numeric audit, finance audit, calculation audit, formula check, score check, dashboard/table/report check, or asks whether numbers/percentages/totals/metrics are correct, follow `docs/audit-fin-loop.md` before implementation.

`/audit-fin` is diagnostic by default. It should not edit app code, commit product fixes, push implementation changes, merge, deploy, modify production data, or change formulas unless the user explicitly asks to continue to `/delivery`.

For screenshots, reports, tables, dashboards, scores, results pages, calculators, and numeric complaints, audit-fin must:

- extract the numeric contract: expected values, formulas, labels, thresholds, date periods, units, and display rules;
- inspect visible numbers and mark unclear screenshot values as `VISUAL UNCLEAR`;
- inspect code deeply to find where numbers are computed, stored, loaded, transformed, rounded, formatted, and displayed;
- trace data flow from input to state, calculation, derived value, persistence, hydration, and display;
- compare expected vs actual values using `MATCH`, `MISMATCH`, `MISSING`, `DUPLICATE`, `STALE`, `NOT VERIFIED`, or `NOT APPLICABLE`;
- evaluate formula correctness, data source, rounding/formatting, missing/inconsistent values, persistence/history safety, charts/gauges, desktop/mobile display, edge cases, regression risk, and proof plan;
- identify confirmed numeric/code problems separately from unverified hypotheses;
- create or update a GitHub issue with the full numeric technical instruction;
- return only a short chat response with audit-fin status, issue link, and a concise `/delivery` prompt pointing to that issue.

For auth-gated cabinet screens, use auth-safe evidence. Never request credentials, cookies, tokens, or secrets, and never claim authenticated production numeric verification unless actually performed.

If GitHub Issues are unavailable during audit-fin, output the full issue body in chat and mark `STATUS: AUDIT_FIN_COMPLETE_ISSUE_NOT_CREATED`.

## Terminal prompt safety rules

When giving the user a terminal prompt for this repo:

- Treat the terminal as a fresh/zero-context window.
- Include `cd` into the expected repo path.
- Check the current git state before making changes:
  - `git status --short`
  - `git branch --show-current`
  - `git worktree list`
  - `git fetch origin`
- Do not assume `main` can be checked out; it may be locked by another worktree.
- Prefer resetting/branching from `origin/main` when a clean base is needed.
- Abort or stop if `MERGE_HEAD`, rebase, cherry-pick, unresolved conflicts, or unexpected dirty files are present.
- Before commit, print and verify:
  - `git status --short`
  - `git diff --name-only`
  - only the intended files are changed.
- If unintended files are changed, stop and ask before committing or pushing.
- Every terminal prompt must be complete and copy-pasteable, including branch creation/reset, checks, build/test commands, commit, and push.

## Verification

Preferred install:

```bash
npm ci
```

Minimum verification:

```bash
npm run build
```

Broader checks when reasonable:

```bash
npm run check
npm run delivery:checks
npm run delivery:status
```

If install/build/check fails due to `ENOSPC`, proxy/network, missing workspace, missing package files, or permission failure, stop and report the exact blocker. Do not fake verification.

## Knowledge-base rules

- Store reusable learning/course content in GitHub, not only inline inside React components.
- Canonical UI-readable knowledge records live in `src/data/reikiKnowledgeBase.js`.
- Human-readable architecture lives in `docs/knowledge-base/REIKI_STEPS_KNOWLEDGE_BASE.md`.
- Every Reiki step must have a stable ID in the form `RY-L01-S01`.
- Unknown content must be marked as `needs_content` or `needs verification`; do not invent sacred/course details.
- Preserve existing Russian-first copy unless explicitly asked to translate.
- Do not store secrets, API keys, student data, private initiations, or private master notes in this repo.

## UI safety rules

- Preserve the current public home page unless explicitly changing it.
- Preserve the desktop three-column structure: left levels, center stage, right practice panel.
- Preserve mobile single-column fallback.
- Keep RU default interface.
- Do not rewrite the whole project when a small additive change is enough.
- For mobile fixes, check fixed bottom bars, `100vh`, overflow containers, scroll locking, safe-area insets, and iOS keyboard behavior.

## Auth and data safety rules

- Do not weaken private-route protection.
- Do not expose private pages publicly.
- Do not replace production auth with a mock.
- Do not commit `.env`, `.env.local`, real secrets, or production credentials.
- Preserve saved data and add backward-compatible reads/migrations when data shape changes.
- Primary intake/results data must not be overwritten by repeat/history data unless explicitly requested.

## Domain migration rules

- The desired production domain is `https://mentalica.vercel.app`.
- Keep `https://reiki-yggdrasil.vercel.app` as legacy/current until the Vercel production alias and Supabase auth flow are verified.
- Do not remove old Supabase redirect URLs during the migration window.
- For Supabase Auth and Google OAuth, allow both target and legacy redirects until live QA passes:
  - `https://mentalica.vercel.app/profile`
  - `https://mentalica.vercel.app/profile/admin`
  - `https://reiki-yggdrasil.vercel.app/profile`
  - `https://reiki-yggdrasil.vercel.app/profile/admin`

## Final report format

Every task must end with:

1. Summary.
2. Files changed.
3. Verification commands and exact results.
4. Manual checks still required.
5. Limitations or blockers.
