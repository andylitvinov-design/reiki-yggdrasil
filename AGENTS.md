# AGENTS.md — Reiki Yggdrasil

## Project boundary

Canonical repo: `andylitvinov-design/reiki-yggdrasil`.
Target production URL: `https://mentalica.vercel.app`.
Current/legacy live URL until migration is verified: `https://reiki-yggdrasil.vercel.app`.
Framework: Vite + React.
Hosting: Vercel, `npm run build`, output `dist`.

## Context-first rules

Before changing this repo, read:

1. `AGENTS.md`
2. `README.md`
3. `STATE.md`
4. `LOG.md`
5. `docs/release-workflow.md`
6. `docs/deploy-fallback.md`
7. `.github/workflows/deploy-production.yml`
8. `docs/knowledge-base/REIKI_STEPS_KNOWLEDGE_BASE.md`
9. `src/data/reikiKnowledgeBase.js`
10. `src/main.jsx`
11. `src/index.css`
12. `package.json`
13. `vercel.json`
14. `src/lib/supabaseClient.js`

If a file is missing, report `not found`.

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

## Domain migration rules

- The desired production domain is `https://mentalica.vercel.app`.
- Keep `https://reiki-yggdrasil.vercel.app` as legacy/current until the Vercel production alias and Supabase auth flow are verified.
- Do not remove old Supabase redirect URLs during the migration window.
- For Supabase Auth and Google OAuth, allow both target and legacy redirects until live QA passes:
  - `https://mentalica.vercel.app/profile`
  - `https://mentalica.vercel.app/profile/admin`
  - `https://reiki-yggdrasil.vercel.app/profile`
  - `https://reiki-yggdrasil.vercel.app/profile/admin`
- The frontend currently builds OAuth redirect URLs from `window.location.origin`; do not replace this with a hardcoded domain.

## Draft / clean site release workflow

Target concept: keep one GitHub repo, but separate the owner test site from the client live site.

- Черновой/test site:
  - target branch: `main`;
  - target Vercel project: `2mentalica`;
  - expected URL: `https://2mentalica.vercel.app`;
  - desired URL `https://www.2mentalica.vercel.app` is `needs verification` in Vercel;
  - should use staging/test Supabase env values.
- Чистовой/client live site:
  - target branch: `production`;
  - existing client-facing Vercel project/domain must be preserved;
  - should use production Supabase env values.
- Release branches:
  - use `release/YYYY-MM-DD`, `release/vX.Y.Z`, or another explicit `release/*` branch;
  - release branches are created from `main` after owner QA on the test site;
  - merge `release/*` into `production` only after final QA.

Normal development flow:

```text
feature/* → main → 2mentalica test deploy → owner QA → release/* → production → client live deploy
```

Codex rules for this workflow:

- Normal feature work targets `main`, not `production`.
- Do not push directly to `production`.
- Do not open PRs to `production` unless the user explicitly asks for a release.
- Do not change production Vercel project settings or production domains during normal development.
- Do not change or expose production Supabase env values.
- Use env names only:
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`
  - `VITE_ADMIN_EMAIL`
- If a release-blocking fix is made in `release/*`, merge that fix back into `main` after release.

Implementation status:

- This is the target operating model.
- Vercel project `2mentalica`, the URL `https://2mentalica.vercel.app`, branch `production`, client-project production branch switch, and staging Supabase remain `needs verification` until checked in dashboards.
- Do not claim the model is active until those items are verified.

Full concept, migration phases, Vercel/Supabase checklists, QA checklist, and rollback: `docs/release-workflow.md`.

## GitHub Actions Deploy Fallback

This repo has a production fallback workflow:

```text
.github/workflows/deploy-production.yml
```

Release-workflow rule:

```text
main       = draft/test branch
production = clean/client live branch
```

Therefore fallback production deploy normally uses `production`, not `main`.

Use fallback deploy when Vercel auto-deploy does not trigger, production remains stale after push/merge, or the user reports that live does not show an approved release.

Do not ask Andrey to run a local terminal deploy until this fallback path has been attempted and diagnosed.

Before fallback deploy, always prove:

```text
Repo: andylitvinov-design/reiki-yggdrasil
Target ref: normally production
Expected SHA: known production commit SHA
Changes: committed and pushed/merged
Release approval: yes / needs verification
Production URL: https://mentalica.vercel.app/
Legacy URL: https://reiki-yggdrasil.vercel.app/
```

Default command after production-branch migration:

```bash
gh workflow run deploy-production.yml \
  --ref production \
  -f ref=production \
  -f expected_sha=<expected_production_commit_sha> \
  -f reason="fallback deploy after stale production release"
```

Temporary legacy command only before production-branch migration is implemented, or with explicit owner approval:

```bash
gh workflow run deploy-production.yml \
  --ref main \
  -f ref=main \
  -f expected_sha=<expected_main_commit_sha> \
  -f reason="temporary legacy fallback deploy from main"
```

Hard order:

```text
commit / push / merge first
fallback deploy second
production verification third
```

Never deploy uncommitted or unpushed changes. Never deploy an unknown ref. Never claim production is updated without checking production after deploy. Never deploy `main` to production unless explicitly approved or the production-branch migration is not implemented yet.

During the domain migration window, verify both:

```text
https://mentalica.vercel.app/
https://reiki-yggdrasil.vercel.app/
```

Full local protocol: `docs/deploy-fallback.md`.
Cross-project standard: `andylitvinov-design/active-projects-ops` docs.

## Data and env safety

The profile cabinet uses Supabase public REST/auth through `src/lib/supabaseClient.js` when these frontend env names are configured. Values must never be committed:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_ADMIN_EMAIL`

Rules:

- Use staging/test values for `2mentalica`.
- Use production values only for the client live project.
- Do not paste env values into chat, docs, logs, commits, or test fixtures.
- Do not use production data for destructive testing.
- If Supabase/profile/master/admin flows are changed, verify exact code, migrations, storage buckets, RLS policies, and OAuth redirect URLs first.

## Verification

Run:

```bash
npm install
npm run check
```

If UI changes are made, also run local preview and check:

- `/`
- desktop layout
- mobile layout below 980px
- no console errors
- no broken imports

For the domain migration, also verify on the target production URL after Vercel aliasing:

- `https://mentalica.vercel.app/`
- `https://mentalica.vercel.app/profile`
- `https://mentalica.vercel.app/masters`
- `https://mentalica.vercel.app/profile/admin`
- Google OAuth from `/profile` and `/profile/admin`

For the draft/clean release workflow, also verify before production release:

- `https://2mentalica.vercel.app/` if the test Vercel project exists;
- `/profile`, `/masters`, `/profile/admin`, and `/profile/mandalas` on the test site;
- owner QA approval before merging `release/*` into `production`.

A normal development task is complete when it is committed/merged to its target branch, checks are reported, and the relevant preview/test/live URL verification status is reported.
A client-facing release is complete only after `production` is updated and the client live URL is verified.

## Agent Command Registry

### /delivery

When the user invokes `/delivery`, follow all three source-of-truth docs in order:

1. `docs/delivery-loop-program.md` — full protocol, stop states, final report format
2. `docs/delivery-loop-technical-details.md` — scripts, commands, CI/CD checks, agent decision table
3. `docs/delivery-loop-source-patterns-and-live-proof.md` — embedded loop patterns and live proof contract (mandatory)

Act as a release owner, not only a coding assistant.

Do not stop after code changes, PR creation, green checks, merge, or deployment.

Stop only with:

- `STATUS: SUCCESS` — task implemented, PR/merge completed if required, deployed, and verified on live.
- `STATUS: BLOCKED` — real external blocker with exact evidence and required user action.

`SUCCESS` requires a completed live proof block (from doc 3):

```txt
LIVE PROOF:
- Live URL:
- Checked route/page:
- Final deployed commit:
- Expected live behavior:
- Actual live behavior:
- Evidence:
```

Project adapter for this repo:

- Repository: `andylitvinov-design/reiki-yggdrasil`
- Default branch: `main`
- Target branch (features): `main`
- Target branch (client releases): `production`
- Package manager: `npm`
- Framework: Vite + React SPA
- Build command: `npm run build`
- Check command: `npm run check`
- Lint: not available
- Typecheck: not available
- CI: GitHub Actions (`.github/workflows/ci.yml`)
- Deployment: Vercel (auto-deploy from GitHub)
- **Primary production/live URL: `https://2mentalica.vercel.app`** ← default `/delivery` target
- Secondary production URL: `https://mentalica.vercel.app`
- Legacy/fallback URL: `https://reiki-yggdrasil.vercel.app`

**Live target rule:** Unless the user explicitly specifies another target, `/delivery` SUCCESS requires LIVE PROOF on the primary production URL `https://2mentalica.vercel.app`. STATUS: SUCCESS after checking only secondary, legacy, preview, or fallback URLs is not valid unless the user explicitly selected that target.

**Cost-control rules:**

- `/delivery` includes cost-control by default.
- Do not reread or resend unchanged large context. Place stable project context (protocol docs, AGENTS.md, rules) first; place current task/diffs/logs after.
- Prefer diffs over full files. Read only relevant files first.
- Stop after **3 failed fix attempts** on the same issue — return `STATUS: BLOCKED` with the 3 attempts listed.
- Never touch env vars, secrets, billing, production database, or auth-sensitive settings without explicit user approval. Stop and describe the required action; do not proceed.
- Final report must include a `COST CONTROL` section.

### /pr

Create a clean, mergeable PR for the current branch. Do not merge.

Verify: correct base branch, no conflicts, build and check pass, PR description includes task and evidence.

### /fix-deploy

Diagnose and fix a deployment or live mismatch. See `docs/deploy-fallback.md`.

### /audit

Inspect whether the task, PR, merge, deployment, and live state match the original request. Return `STATUS: SUCCESS` or `STATUS: BLOCKED` with evidence.

---

## Report format

After work, report:

- changed files
- exact checks run
- what was verified
- what was not verified
- risks
- whether `STATE.md` / `LOG.md` need updates
- fallback workflow result if deploy fallback was used
- production/legacy live verification result