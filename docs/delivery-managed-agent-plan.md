# /delivery Managed Agent Upgrade Plan

Status: documented plan (not yet implemented)
Repository: `andylitvinov-design/reiki-yggdrasil`
Parent: `docs/delivery-loop-completion-program.md`

---

## Purpose

Local `/delivery` depends on:

- local Claude Code being open;
- local repo being up to date;
- local command discovery working;
- local credentials and CLI tools present;
- user starting the loop manually.

Managed Agent deployment can eventually provide:

- new session per run (no stale context);
- env vars through a managed vault / network boundary;
- GitHub and Vercel access via environment variables;
- no local Mac dependency;
- scheduled watchdog monitoring.

---

## Proposed Managed Agents

### 1. `delivery-on-demand`

Purpose: run `/delivery` for a specific user task without requiring local Claude Code.

Start message:

```txt
Follow docs/delivery-loop-program.md, docs/delivery-loop-technical-details.md,
docs/delivery-loop-source-patterns-and-live-proof.md, and AGENTS.md.
Run the /delivery protocol for the provided task in andylitvinov-design/reiki-yggdrasil.
Finish only with STATUS: SUCCESS or STATUS: BLOCKED.
SUCCESS requires live proof on https://2mentalica.vercel.app.
```

### 2. `delivery-watchdog`

Purpose: scheduled check for stuck PRs, failed CI, failed Vercel deployments,
or pending live verification.

Suggested schedule: every 1–2 hours during active development.

Start message:

```txt
Check open delivery PRs and recent Vercel deployments for andylitvinov-design/reiki-yggdrasil.
If a PR, deploy, or live verification is stuck, fix if safe or return STATUS: BLOCKED
with evidence and required user action.
Do not merge or push without confirmed PR health and task coverage.
```

### 3. `production-health-check`

Purpose: scheduled production health and critical flow verification.

Suggested schedule: morning and evening.

Start message:

```txt
Check production health for reiki-yggdrasil:
- https://2mentalica.vercel.app — primary
- https://mentalica.vercel.app — secondary
- https://reiki-yggdrasil.vercel.app — legacy fallback
Verify HTTP 200, page renders, no JS console errors on homepage.
Do not mutate production data. Report STATUS: SUCCESS or STATUS: BLOCKED.
```

---

## Required Environment Variables

Names only. Never commit values.

```txt
GITHUB_TOKEN          — GitHub API access for PR/checks/merge
VERCEL_TOKEN          — Vercel API access for deployment status
VERCEL_ORG_ID         — Vercel org (andylitvinov-design)
VERCEL_PROJECT_ID     — Vercel project ID for 2mentalica
LIVE_URL              — https://2mentalica.vercel.app
```

Optional:

```txt
SLACK_WEBHOOK_URL     — delivery status notifications
ANTHROPIC_API_KEY     — for standalone agent runs outside Claude Code
```

---

## Security Rules

- Secrets must be stored in the managed agent environment/vault, not in the repo.
- Agent may name missing env vars but must never print values.
- Agent must not write env vars, secrets, billing settings, or provider credentials
  without explicit user approval.
- Agent must restrict API calls to expected GitHub/Vercel/live domains.

---

## Implementation Status

- [ ] Managed agent environment provisioned.
- [ ] `GITHUB_TOKEN` set in agent vault.
- [ ] `VERCEL_TOKEN` set in agent vault.
- [ ] `delivery-on-demand` agent created and tested.
- [ ] `delivery-watchdog` agent created and scheduled.
- [ ] `production-health-check` agent created and scheduled.

---

## One-Line Rule

```txt
Managed agents do not change the /delivery protocol. They run the same loop
in a persistent, non-local environment so the user does not need a local Mac session.
```
