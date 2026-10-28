# Codex Cloud operating guide — `reiki-yggdrasil`

This is the runnable app repository. Do not use `andylitvinov-design/psitrends-work` for app-code tasks.

## Repository boundary

```text
Real app repo: andylitvinov-design/reiki-yggdrasil
Docs/ops repo only: andylitvinov-design/psitrends-work
```

If a Codex task opens inside `/workspace/psitrends-work` while the task is about the app, stop immediately and report:

```text
Wrong workspace selected. psitrends-work is docs/ops only. Switch the Codex task to andylitvinov-design/reiki-yggdrasil.
```

Do not clone `reiki-yggdrasil` from inside a `psitrends-work` Cloud task. Codex Cloud workspaces are repo-bound, and outbound GitHub clone may fail through the environment proxy.

## Cloud vs local/desktop

Codex Cloud is appropriate for:

- code changes in this repo;
- documentation/setup changes;
- safe refactors;
- tests and contract checks;
- branch/PR preparation;
- `npm ci`, `npm run build`, and focused test scripts when disk space allows.

Desktop/local is required for:

- real Google/Supabase login;
- live authenticated account flows;
- iPhone/Safari keyboard behavior;
- visual UI confirmation;
- Vercel preview/live manual verification;
- browser cache/cookies/session issues;
- tasks requiring files that exist only on the user's machine.

## Install and verification

This repo has `package.json` and `package-lock.json`, so the preferred install command is:

```bash
npm ci
```

Minimum required verification:

```bash
npm run build
```

Broader verification when reasonable:

```bash
npm run check
npm run delivery:checks
npm run delivery:status
```

If install/build/check fails due to `ENOSPC`, missing disk space, proxy/network failure, missing workspace, or missing permissions, stop and report the exact blocker. Do not claim verification passed.

## Existing app scripts

Known scripts in `package.json` include:

```text
npm run dev
npm run build
npm run check
npm run delivery:checks
npm run delivery:status
npm run smoke:live
npm run deploy:verify
```

## Environment variables

Current checked-in Supabase client reads:

```text
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
VITE_ADMIN_EMAIL
```

Keep `.env.example` aligned with real code usage only. Never commit `.env`, `.env.local`, real keys, or production credentials.

## Required final report

Every Codex task must report:

1. Summary.
2. Files changed.
3. Install command result, if install was needed.
4. Build/check commands and exact results.
5. Manual checks still required.
6. Limitations or blockers.

## Wrong-repo prevention

Before app-code work, Codex must confirm:

```text
pwd
find /workspace -maxdepth 2 -type d -name .git -print
cat package.json | head
```

Expected workspace must be this repo, not `psitrends-work`.

If the workspace only contains `psitrends-work`, the correct action is to stop and ask the user to start a new Codex task with repo `andylitvinov-design/reiki-yggdrasil` selected in the UI.
