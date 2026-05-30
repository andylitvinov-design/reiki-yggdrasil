# Deploy Version Check

This document tells agents how to check the current live deployment version without asking the user.

## Project

```text
Repo: andylitvinov-design/reiki-yggdrasil
Platform: Vercel
Target production URL: https://mentalica.vercel.app/
Legacy/current URL during migration: https://reiki-yggdrasil.vercel.app/
```

## Rule

Agents must check the current live version themselves. Do not ask Andrey to open the site, inspect the deployed version, or run local terminal deploy/check commands when machine-readable checks are available.

## Current limitation

This project currently has no confirmed `/api/status`, `/version.json`, or `/build-info.json` endpoint exposing commit SHA.

Therefore agents must distinguish:

```text
URL availability proof != commit-level live proof
```

Agents may verify that production URLs respond, that required routes render, and that the GitHub Actions workflow deployed the expected checked-out SHA, but they must not claim commit-level live verification unless a build-info/status marker is added.

## Required checks

Before or after deploy, agents should check:

```text
1. GET https://mentalica.vercel.app/
2. GET https://reiki-yggdrasil.vercel.app/ during migration window
3. If task touched routes, check:
   - https://mentalica.vercel.app/profile
   - https://mentalica.vercel.app/masters
   - https://mentalica.vercel.app/profile/admin
4. Check GitHub Actions workflow summary/logs:
   - expected_sha
   - actual checked-out SHA
   - deploy result
5. If UI changed, inspect HTML/assets or use available browser/screenshot tools instead of asking the user.
```

## Expected SHA comparison

The workflow verifies:

```text
expected_sha == actual checked-out SHA
```

This proves the workflow deployed the intended checkout. It does not by itself prove that the public URL exposes that commit unless a live build-info marker exists.

## Recommended improvement

Add a generated static file:

```text
public/build-info.json
```

with:

```json
{
  "project": "reiki-yggdrasil",
  "repo": "andylitvinov-design/reiki-yggdrasil",
  "commitSha": "...",
  "commitRef": "main",
  "buildTime": "..."
}
```

Then agents can verify commit-level live version directly.

## If exact live commit cannot be proven

Report:

```text
Production URLs respond, but this project currently has no live status/build-info endpoint exposing commit SHA. I verified URL availability and workflow deploy output; commit-level live proof requires adding build-info metadata.
```

Do not ask the user to check manually.

## Final report block

Every production/deploy-related report must include:

```text
Live version check:
- Production URL: https://mentalica.vercel.app/
- Legacy URL: https://reiki-yggdrasil.vercel.app/
- Status/version URL: none currently
- Expected SHA:
- Live SHA/build marker: unavailable unless build-info is added
- Match: unknown at commit level / URL verified
- Evidence source: URL checks + GitHub Actions workflow summary
- If unknown, why: no live build-info/status endpoint
```

## Hard rules

```text
Never ask the user to check the current live version manually.
Never claim commit-level verification when only URL availability was checked.
Never claim production is current without checking production URLs or deploy workflow output.
Always distinguish URL responds vs commit SHA matches.
```

Cross-project source standard:

```text
andylitvinov-design/active-projects-ops/docs/deploy-version-check-protocol.md
```
