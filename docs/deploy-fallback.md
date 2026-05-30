# Deploy Fallback

This project uses GitHub Actions as a fallback production deploy path for Vercel.

## Why

If Vercel auto-deploy does not trigger or production remains stale after merge/push, agents must use this workflow before asking the user to run any local terminal deploy.

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

## When to use

Use fallback deploy when:

```text
1. The intended commit is already committed and pushed.
2. The intended production ref is known, normally main.
3. Production is stale after push/merge.
4. Vercel auto-deploy did not start, failed, or deployed the wrong commit.
5. The user says live does not show the completed changes.
6. Domain migration verification requires forcing the current main to production.
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
```

## Required GitHub Secrets

```text
VERCEL_TOKEN
VERCEL_ORG_ID
VERCEL_PROJECT_ID
```

These secrets must exist in the GitHub repository settings. Do not commit secrets to the repository and do not paste them into chat.

## Standard command

```bash
gh workflow run deploy-production.yml \
  --ref main \
  -f ref=main \
  -f expected_sha=<expected_commit_sha> \
  -f reason="fallback deploy after stale production"
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
2. Identify target ref, normally main.
3. Identify expected commit SHA.
4. Confirm changes are committed and pushed.
5. Check production URL and legacy URL if relevant.
6. If production is stale, trigger deploy-production.yml.
```

After fallback deploy:

```text
1. Re-check https://mentalica.vercel.app/.
2. Re-check https://reiki-yggdrasil.vercel.app/ during the migration window.
3. Verify required pages visually/functionally if the task touched UI/auth/profile/admin routes.
4. Report workflow result and live verification.
```

## Hard rules

```text
commit / push / merge first
fallback deploy second
production verification third
```

Never ask the user to run `vercel --prod` locally until this fallback workflow has been attempted and diagnosed.

Never run fallback deploy until the target commit is committed, pushed and identified.

Never claim production is updated without checking production after deploy.

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
```
