# AGENTS.md — Reiki Yggdrasil

## Project boundary

Canonical runnable app repo: `andylitvinov-design/reiki-yggdrasil`.

Do not use `andylitvinov-design/psitrends-work` for app-code tasks. `psitrends-work` is docs/ops only and may not contain `package.json`, app source, or build scripts.

Current 2mentalica draft/staging URL: `https://2mentalica.vercel.app`.
Target production URL: `https://mentalica.vercel.app`.
Current/legacy live URL until migration is verified: `https://reiki-yggdrasil.vercel.app`.
Framework: Vite + React.
Hosting: Vercel, `npm run build`, output `dist`.

## Routing safety rules

`https://2mentalica.vercel.app` is part of this Reiki Yggdrasil project. App-code, audit, delivery, and GitHub issue work for `2mentalica` `/profile`, `/masters`, `/profile/admin`, Power Place formats, master cabinet, publications, templates, services, clients, or Reiki UI must use this repo: `andylitvinov-design/reiki-yggdrasil`.

Do not route `https://2mentalica.vercel.app` tasks to `andylitvinov-design/report`. The `report` repo is a different PsiTherapy/client-report product with a different schema.

Before creating an audit or delivery issue from a URL, verify at least:

```txt
1. user-stated product and route;
2. live title/brand or screenshot brand;
3. repo-local AGENTS.md / README domain rules;
4. build markers or JS markers when public;
5. recent PRs/issues in the candidate repo for the requested feature area.
```

If those signals conflict, stop with `STATUS: ROUTING_CONFLICT_NEEDS_VERIFICATION` instead of implementing in a guessed repo.

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
2. `docs/global-agent-settings.md`
3. `docs/global-command-protocols.md`
4. `docs/global-project-adapters.md`
5. `docs/global-agent-skills.md`
6. `docs/codex-cloud-setup.md`
7. `docs/smoke-test-plan.md`
8. `README.md`
9. `STATE.md`
10. `LOG.md`
11. `docs/release-workflow.md`
12. `docs/deploy-fallback.md`
13. `.github/workflows/deploy-production.yml`
14. `docs/knowledge-base/REIKI_STEPS_KNOWLEDGE_BASE.md`
15. `src/data/reikiKnowledgeBase.js`
16. `src/main.jsx`
17. `src/index.css`
18. `package.json`
19. `vercel.json`
20. `src/lib/supabaseClient.js`

If a file is missing, report `not found`.

## Global agent settings adapter

This repo hosts the shared global agent settings layer for active projects.

Use these shared docs as the source of truth for `/audit`, `/audit-fin`, `/delivery`, `/delivery-big`, UI polish, design quality gates, deep technical issue writing, deep numeric implementation trace, project routing, and future active project adapters:

- `docs/global-agent-settings.md`
- `docs/global-command-protocols.md`
- `docs/global-project-adapters.md`
- `docs/global-agent-skills.md`

Keep runtime prompts short. Put durable behavior in the shared docs and GitHub issues, not in repeated chat prompts or one-off repo-local command blocks.

Reiki-specific local protocol details still live in:

- `docs/ry-agent-audit-modes.md`
- `docs/audit-loop.md`
- `docs/audit-deep-technical-issue-writing.md`
- `docs/audit-ui-polish-skill.md`
- `docs/audit-fin-loop.md`
- `docs/audit-fin-failed-repair.md`
- `docs/delivery-design-quality-gate.md`
- `docs/delivery-auth-boundary-standard.md`
- `docs/delivery-loop-program.md`
- `docs/delivery-loop-technical-details.md`
- `docs/delivery-loop-source-patterns-and-live-proof.md`
- `docs/global-delivery-big-protocol.md`

Local `.claude/commands/*` files must reference the shared global docs first, then this Reiki adapter and project-specific docs. Do not duplicate the full shared protocol in local command files.

`/delivery-big` is the large-task delivery mode. It inherits `/delivery` and
adds a Task Manifest, Scope Contract, Verification Matrix, Repair Loop, and
strict DONE gate. Claude uses `.claude/commands/delivery-big.md`; Codex uses
`.codex/commands/delivery-big.md` and `.codex/skills/delivery-big/SKILL.md`.

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

- The current draft/staging domain is `https://2mentalica.vercel.app`.
- The desired production domain is `https://mentalica.vercel.app`.
- Keep `https://reiki-yggdrasil.vercel.app` as legacy/current until the Vercel production alias and Supabase auth flow are verified.
- Do not remove old Supabase redirect URLs during the migration window.
- For Supabase Auth and Google OAuth, allow draft, target, and legacy redirects until live QA passes:
  - `https://2mentalica.vercel.app/profile`
  - `https://2mentalica.vercel.app/profile/admin`
  - `https://mentalica.vercel.app/profile`
  - `https://mentalica.vercel.app/profile/admin`
  - `https://reiki-yggdrasil.vercel.app/profile`
  - `https://reiki-yggdrasil.vercel.app/profile/admin`

## Agent memory router

Before `/delivery`, `/audit`, `/save`, `/memory`, `/memory-review`, `/learn-pass`, or `/upgrade`:

1. Read `agent-memory/active.md`.
2. Read `agent-memory/index.md`.
3. Identify task scope.
4. Read only relevant topic/component files.
5. Do not load archive unless resolving conflicts or running `/memory-review`.
6. Do not load candidates/metrics unless running `/learn-pass`, `/memory-review`, or `/upgrade`.
7. Do not load harness proposals/tests unless running `/upgrade`.

For `/save`, use `.codex/skills/save/SKILL.md` if present.
For `/memory`, use `.codex/skills/memory/SKILL.md` if present.
For `/memory-review`, use `.codex/skills/memory-review/SKILL.md` if present.
For `/learn-pass`, use `.codex/skills/learn-pass/SKILL.md` if present.
For `/upgrade`, use `.codex/skills/upgrade/SKILL.md` if present.

Do not load the whole instruction tree by default.
