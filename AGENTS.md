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
5. `docs/knowledge-base/REIKI_STEPS_KNOWLEDGE_BASE.md`
6. `src/data/reikiKnowledgeBase.js`
7. `src/main.jsx`
8. `src/index.css`
9. `package.json`
10. `vercel.json`
11. `docs/deploy-fallback.md`

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
- For clean task branches, use `git switch -C <branch> origin/main` or an equivalent branch-from-remote command instead of `git checkout main && git pull`.
- If any setup command fails (`checkout`, `switch`, `pull`, `merge`, `rebase`, pattern replacement), stop the script immediately; do not continue into edits/checks/commit.
- In generated patch scripts, assert the intended old pattern exists exactly once when possible, and verify the resulting diff does not contain duplicated old/new code blocks.
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

## GitHub Actions Deploy Fallback

This repo has a production fallback workflow:

```text
.github/workflows/deploy-production.yml
```

Use it when Vercel auto-deploy does not trigger, production remains stale after push/merge, or the user reports that live does not show completed changes.

Do not ask Andrey to run a local terminal deploy until this fallback path has been attempted and diagnosed.

Before fallback deploy, always prove:

```text
Repo: andylitvinov-design/reiki-yggdrasil
Target ref: normally main
Expected SHA: known commit SHA
Changes: committed and pushed/merged
Production URL: https://mentalica.vercel.app/
Legacy URL: https://reiki-yggdrasil.vercel.app/
```

Default command:

```bash
gh workflow run deploy-production.yml \
  --ref main \
  -f ref=main \
  -f expected_sha=<expected_commit_sha> \
  -f reason="fallback deploy after stale production"
```

Hard order:

```text
commit / push / merge first
fallback deploy second
production verification third
```

Never deploy uncommitted or unpushed changes. Never deploy an unknown ref. Never claim production is updated without checking production after deploy.

During the domain migration window, verify both:

```text
https://mentalica.vercel.app/
https://reiki-yggdrasil.vercel.app/
```

Full local protocol: `docs/deploy-fallback.md`.
Cross-project standard: `andylitvinov-design/active-projects-ops` docs.

## Data and env safety

Current repo state has no confirmed Supabase implementation in `main`.
Known env names from project memory only, values must never be committed:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_ADMIN_EMAIL`

If Supabase/profile/master/admin flows are added or restored, verify exact code and migrations first.

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

A task is not complete until it is merged into main, deployed to production/live, and visually/functionally verified on the live URL.

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
