# Deploy Fallback

This project uses GitHub Actions as a fallback production deploy path for Vercel.

## Why

If Vercel auto-deploy does not trigger or production remains stale after merge/push, agents must use this workflow before asking the user to run any local terminal deploy.

## Release-workflow alignment

This repo uses the draft/clean release model from `docs/release-workflow.md`.

Target meaning after the release workflow is implemented:

```text
main        = draft/test branch, deployed to 2mentalica
production  = clean/client live branch
release/*   = frozen release branches between main and production
```

Therefore the fallback production deploy must normally deploy `production`, not `main`.

Use `main` with this workflow only if the owner explicitly asks to bypass the release model or if the repo has not yet completed the production-branch migration.

Target production URL:

```text
https://mentalica.vercel.app/
```

Legacy/current URL during migration window:

```text
https://reiki-yggdrasil.vercel.app/
```

Workflow:

```text
.github/workflows/deploy-production.yml
```

## Live version self-check

Before and after fallback deploy, agents must check the current live version themselves.

Local protocol:

```text
docs/deploy-version-check.md
```

This project currently has no confirmed `/api/status`, `/version.json`, or `/build-info.json` endpoint exposing commit SHA. Agents must therefore distinguish:

```text
URL availability proof != commit-level live proof
```

Agents must check available production URLs and workflow deploy output themselves. Do not ask Andrey to check the current live version manually.

## When to use

Use fallback deploy when:

```text
1. The intended commit is already committed and pushed.
2. The intended production ref is known, normally production.
3. Production is stale after push/merge.
4. Vercel auto-deploy did not start, failed, or deployed the wrong commit.
5. The user says live does not show the completed release.
6. Domain migration verification requires forcing the current production ref to the production project.
```

## When not to use

Do not use fallback deploy when:

```text
1. Changes are uncommitted.
2. Changes are only local and not pushed.
3. The target ref/commit is unknown.
4. npm run check fails.
5. Production already serves the expected version.
6. There is a risk of deploying an old ref over a newer production build.
7. The ref is main and the change has not passed owner QA / release approval.
```

## Required GitHub Secrets

```text
VERCEL_TOKEN
VERCEL_ORG_ID
VERCEL_PROJECT_ID
```

These secrets must exist in the GitHub repository settings. Do not commit secrets to the repository and do not paste them into chat.

## Standard command

Default production fallback command after release workflow migration:

```bash
gh workflow run deploy-production.yml \
  --ref production \
  -f ref=production \
  -f expected_sha=<expected_production_commit_sha> \
  -f reason="fallback deploy after stale production release"
```

Temporary legacy command, only before the `production` branch / Vercel migration is implemented or with explicit owner approval:

```bash
gh workflow run deploy-production.yml \
  --ref main \
  -f ref=main \
  -f expected_sha=<expected_main_commit_sha> \
  -f reason="temporary legacy fallback deploy from main"
```

Then watch the run:

```bash
gh run list --workflow deploy-production.yml --limit 5
gh run watch <run-id>
```

## Agent protocol

Before fallback deploy:

```text
1. Identify repo.
2. Identify target ref, normally production.
3. Identify expected commit SHA.
4. Confirm changes are committed and pushed.
5. Confirm the release was approved if ref is production.
6. Check production URL and legacy URL if relevant.
7. Check workflow/deploy evidence and available live endpoints.
8. If production is stale, trigger deploy-production.yml.
```

After fallback deploy:

```text
1. Re-check https://mentalica.vercel.app/.
2. Re-check https://reiki-yggdrasil.vercel.app/ during the migration window.
3. Verify required pages visually/functionally if the task touched UI/auth/profile/admin routes.
4. Report workflow result and live verification.
5. If exact live commit cannot be proven, state that commit-level proof requires build-info/status metadata.
```

## Hard rules

```text
commit / push / merge first
fallback deploy second
production verification third
```

Never ask the user to run `vercel --prod` locally until this fallback workflow has been attempted and diagnosed.

Never ask the user to check the current live version manually.

Never run fallback deploy until the target commit is committed, pushed and identified.

Never claim production is updated without checking production after deploy.

Never deploy `main` to production unless explicitly approved or the production-branch migration is not implemented yet.

Never claim commit-level live verification for this project until a status/build-info endpoint exists.

## Minimal final report

```text
Repo:
Target ref:
Expected SHA:
Workflow:
Run status:
Production URL:
Legacy URL:
Live status:
Remaining issue:
```

Every deploy-related report must also include:

```text
Live version check:
- Production URL:
- Legacy URL:
- Status/version URL:
- Expected SHA:
- Live SHA/build marker:
- Match: yes/no/unknown
- Evidence source:
- If unknown, why:
```

## Source standard

Cross-project standard lives in:

```text
andylitvinov-design/active-projects-ops
```

Relevant docs:

```text
docs/github-actions-vercel-deploy-fallback-plan.md
docs/deploy-fallback-agent-autodeploy-protocol.md
docs/deploy-fallback-branch-propagation-policy.md
docs/deploy-version-check-protocol.md
```
