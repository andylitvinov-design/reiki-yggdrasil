# Profile Cabinet Recovery Operator Checklist

Last updated: 2026-05-31
Companion document for: `docs/profile-cabinet-recovery-plan.md`
Scope: operating discipline for old `/profile` cabinet recovery.

## 1. Purpose

The main recovery plan explains what to test and how deep to roll back.

This checklist explains how to run the recovery professionally:

- who makes decisions;
- what evidence is required before moving deeper;
- when to stop;
- how to avoid repeated blind fixes;
- how to communicate status;
- how to close the incident after recovery.

## 2. Incident severity levels

### P0 — public site or auth outage

Use if `/` is down, OAuth is broken for both `/profile` and `/profile-lite`, Supabase env is missing, or production routes return Vercel-level 404.

Action: stop feature work, restore deploy/auth first, and do not debug old `/profile` UI until `/profile-lite` works again.

### P1 — old master cabinet blocked

Use if `/profile-lite` works, `/profile` does not open after Google login, and public routes still work.

Action: focus on old `ProfilePage.jsx` render/state/secondary data path, preserve `/profile-lite`, and do not change OAuth blindly.

### P2 — degraded cabinet data

Use if old `/profile` shell opens, but profile/materials/media/power-place data partially fail.

Action: keep shell open, show inline warnings, and fix data loaders/RLS separately.

### P3 — diagnostics/docs/deploy hygiene

Use if code is merged, live is stale, Vercel deployment limit is blocking, or only docs/checklists need cleanup.

Action: do not change runtime code; wait for deploy limit reset or upgrade Vercel; update docs only when useful.

## 3. Recovery roles

One person may hold multiple roles, but reports must make the role explicit.

### Incident owner

Decides whether to continue, pause, roll back, or deploy.

### Code agent

Reads repo-local instructions and prepares minimal PRs. Must report branch, changed files, hypothesis, checks run, and what was not verified.

### Verification operator

Runs live browser checks. Must verify current live asset, `/profile-lite`, `/profile?debugAuth=1`, Google login, console errors, and no token/env leaks.

### Deployment operator

Runs Vercel fallback workflow. Must record workflow run URL, target SHA, success/failure, deployment URL, production alias status, and Vercel limit status.

## 4. Required evidence before changing code

### If `/profile` is stuck loading

Record:

```text
URL:
live JS asset:
expected target SHA:
/profile-lite status:
stored session:
getCurrentUser status:
React user id present:
React authStatus:
React cabinet condition:
render state:
console errors:
```

### If `/profile-lite` fails

Record:

```text
Supabase configured:
stored session:
session expired:
current user:
own profile:
auth status:
profile status:
network error/status:
console errors:
```

### If deploy fails

Record:

```text
workflow run URL:
step name:
exit code:
Vercel error code:
VERCEL_TOKEN present/empty status only:
target SHA:
```

Never paste token values.

## 5. Stop-loss rules

Stop and reassess when any of these happen:

1. Two consecutive runtime PRs do not change the live symptom.
2. Vercel blocks deploy with `api-deployments-free-per-day`.
3. `/profile-lite` starts failing after a change meant only for old `/profile`.
4. A proposed fix touches OAuth, Supabase client, RLS, migrations, and render gates in one PR.
5. A PR changes more than 8 runtime files without a narrow root cause.
6. Live is stale and the agent continues debugging runtime code.

Required response:

- stop runtime changes;
- update the evidence table;
- choose the next rollback depth stage from the main plan;
- ask for a decision before deeper recovery.

## 6. Decision matrix

| Observation | Meaning | Allowed next action | Forbidden next action |
|---|---|---|---|
| `/profile-lite` works, `/profile` fails | Heavy UI/render problem | Patch `ProfilePage.jsx` gates/effects | OAuth rewrite |
| `/profile-lite` fails too | Auth/session/profile layer problem | Inspect Supabase/env/session/RLS | Old UI-only patch |
| Live asset is old | Deployment stale | Fix deploy/alias | Code rollback |
| Vercel limit active | No production deploy possible | Wait or upgrade | Re-run workflows repeatedly |
| `user.id` present, shell hidden | Render gate bug | Open shell from user id | Clear session |
| Shell opens, data missing | Secondary data issue | Inline warning + loader fix | Full-page loading |
| Console shows token/env | Security issue | Remove leaked output immediately | Continue debugging publicly |

## 7. Deploy budget discipline

Before a production fallback run:

```text
[ ] target SHA known
[ ] npm run check passed locally/CI
[ ] npm run build passed locally/CI
[ ] PR merged or exact ref chosen
[ ] no active Vercel daily limit
[ ] expected_sha filled in workflow
[ ] verification checklist ready
```

After a production fallback run:

```text
[ ] deployment URL recorded
[ ] production alias checked
[ ] live HTML asset checked
[ ] target route checked
[ ] fallback/legacy route checked
[ ] result added to PR/report
```

## 8. Branch naming rules

Use clear branch names:

```text
fix/profile-render-gate-<short-reason>
diagnose/profile-<short-reason>
restore/profile-<baseline-or-strategy>
revert/profile-<bad-sha-or-pr>
docs/profile-<doc-topic>
```

Do not reuse stale branches after `main` has moved. Create a fresh branch from current `main` unless explicitly testing an old checkpoint.

## 9. PR scope rules

Acceptable small runtime PR:

- 1–3 runtime files;
- clear root cause;
- one recovery depth stage;
- tests updated;
- no secrets;
- no schema unless required.

Requires extra review:

- changes to `supabaseClient.js`;
- changes to migrations/RLS;
- changes to OAuth redirect flow;
- changes to `index.html` recovery scripts;
- changes to Vercel workflow;
- removing `/profile-lite` or debug route.

Reject or split:

- OAuth + render gate + migrations in one PR;
- unrelated UI redesign during outage;
- force-push/reset instructions;
- PR that removes diagnostic evidence before recovery is complete.

## 10. Communication template

```text
Status:
Severity:
Current main SHA:
Current live SHA/asset:
Latest deployed URL:
Working routes:
Broken routes:
/profile-lite result:
/profile?debugAuth=1 result:
Current hypothesis:
Next action:
Rollback depth:
Blocked by:
What is not verified:
```

## 11. Post-recovery cleanup checklist

After old `/profile` is confirmed working live:

```text
[ ] Close duplicate/stale PRs.
[ ] Record final live SHA and asset.
[ ] Keep `/profile-lite` until at least one stable deploy cycle later.
[ ] Remove or disable obsolete DOM recovery scripts only if proven unnecessary.
[ ] Keep no-secret debug sanitization.
[ ] Update STATE.md and LOG.md with final root cause.
[ ] Add regression test for the final root cause.
[ ] Document whether Vercel plan/limits require operational change.
[ ] Create a short postmortem: timeline, cause, fixes, prevention.
```

## 12. Postmortem template

```text
Incident:
Date/time:
Severity:
Affected routes:
User-visible symptom:
First detected by:
Confirmed live deploy SHA:
Root cause:
Why existing tests missed it:
Fix:
Verification:
What slowed recovery:
What went well:
Preventive actions:
Follow-up PRs:
```

## 13. Professional operating rule

Every deeper recovery step must answer this question before it starts:

```text
What new evidence justifies moving deeper?
```

If there is no new evidence, do not move deeper. Collect evidence first.
