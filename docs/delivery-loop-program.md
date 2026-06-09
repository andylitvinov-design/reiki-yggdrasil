# Delivery Loop Implementation Program

Status: proposed operating protocol  
Command name: `/delivery`  
Internal name: `PRODUCTION_DELIVERY_LOOP`  
Repository: `andylitvinov-design/reiki-yggdrasil`  
Production target: `https://mentalica.vercel.app`  
Legacy/live fallback target: `https://reiki-yggdrasil.vercel.app`

## 1. Purpose

The purpose of `/delivery` is to remove the user's need to manually verify each technical step after asking an agent to implement a task.

The agent should not stop at code changes, PR creation, green checks, merge, or Vercel deployment. The task is complete only when the requested change is verified on the live production site.

The target outcome is:

```txt
task -> implementation -> local checks -> PR -> PR verification -> merge -> Vercel production deployment -> live verification -> final report
```

## 2. Problem This Solves

The user currently has to manually check:

- whether the agent created a PR;
- whether the PR is mergeable;
- whether the PR actually matches the original task;
- whether missing requirements need additional work;
- whether the PR is ready to merge;
- whether merge succeeded;
- whether Vercel picked up the merged commit;
- whether deployment succeeded;
- whether the expected change is visible on live.

`/delivery` moves those checks into the agent's required workflow.

## 3. Source Patterns

`/delivery` is a composite loop inspired by common agent-loop patterns:

1. Build Until Green  
   Run production build, fix failures, and repeat until successful.

2. Ship PR Until Green  
   Create or update a PR, check CI, fix failures, and repeat until PR is green and mergeable.

3. CI Failure Watcher  
   Read failed CI logs, identify the root cause, fix, and push updates.

4. PR Babysitter  
   Keep the PR healthy: no conflicts, not stale, correct base branch, required checks green.

5. Deploy Verification  
   Check deployment status, inspect logs, fix deployment failures, and redeploy.

6. Live Verification  
   Open the live URL and confirm the requested behavior is actually working in production.

The custom addition for this repository is the end-to-end release responsibility: merge confirmation, Vercel commit verification, and live-site behavior verification.

## 4. Command Syntax

Use this command in agent prompts:

```txt
/delivery

Task:
[describe the concrete task]

Target:
Production live site.

Do not stop at code, PR, checks, merge, or deploy. Stop only with STATUS: SUCCESS or STATUS: BLOCKED.
```

Example:

```txt
/delivery

Task:
Fix the OpenAI key wallet so it clearly distinguishes invalid key, quota/billing issue, network error, and successful validation.

Target:
Production live site.
```

## 5. Required Agent Role

When `/delivery` is invoked, the agent must act as a release owner, not only as a coding assistant.

The agent owns the full delivery path:

```txt
understand -> implement -> verify -> PR -> CI -> merge -> deploy -> live check
```

The agent must never claim success based only on partial progress.

## 6. Global Rules

The agent must:

- read `AGENTS.md` first;
- respect the repository boundaries and existing architecture;
- avoid unrelated file changes;
- make the smallest safe change;
- avoid unnecessary dependencies;
- never expose secrets, API keys, tokens, or private env values;
- never log API keys or secrets;
- never disable tests/checks to force success;
- never change exit criteria to fake completion;
- compare the final result against the original user task;
- report exact status at the end.

## 7. Required Tools and Checks

Use the available tools in the environment. Common checks include:

```bash
git status
git diff
npm run build
npm run lint
npm run typecheck
npm test
gh pr view --json mergeable,state,statusCheckRollup,url
gh pr checks
gh run list
gh run view
```

Vercel checks may use Vercel CLI, Vercel dashboard/API access, GitHub deployment statuses, or direct live URL verification.

The agent must not pretend that a tool was used if the tool is unavailable.

## 8. Stop States

Every `/delivery` run must end in exactly one of two states.

### SUCCESS

Use `STATUS: SUCCESS` only when all of the following are true:

- the task is implemented;
- acceptance criteria are satisfied;
- local checks passed or unavailable checks are explicitly reported;
- PR exists;
- PR targets the correct base branch;
- PR has no conflicts;
- PR checks passed or absence of checks is explicitly reported;
- PR is mergeable;
- PR is merged;
- final commit is present on the target branch;
- Vercel production deployment succeeded for the final commit;
- live URL was checked;
- requested change is visible or working on live;
- no unrelated changes were introduced.

### BLOCKED

Use `STATUS: BLOCKED` only when a real external blocker prevents completion, such as:

- no permission to push;
- no permission to create PR;
- no permission to merge;
- required human review;
- branch protection restriction;
- no Vercel access;
- missing secret or environment variable;
- CI/Vercel requires manual action;
- task is unsafe or contradicts project architecture;
- unresolved external service outage.

If blocked, report exact evidence and the required user action.

## 9. Max Iterations

Default maximum: 12 total delivery passes.

A delivery pass means one full attempt through implementation, checks, PR/update, CI, merge/deploy/live verification as far as available.

If 12 passes are exhausted, stop with `STATUS: BLOCKED` and explain what remains.

## 10. Workflow Steps

### Step 1 — Understand the Task

Extract acceptance criteria from the user request.

Create a checklist:

- what must change;
- where it should appear;
- what user behavior should work;
- which error states must be handled;
- what must be verified on live.

If the task is ambiguous, make a reasonable assumption and continue unless it is unsafe.

### Step 2 — Inspect Project Context

Find relevant:

- pages;
- components;
- routes;
- API calls;
- utilities;
- state management;
- env variables;
- Vercel/GitHub configuration;
- existing tests.

Do not change unrelated files.

### Step 3 — Implement the Smallest Safe Change

Make the minimal implementation required to satisfy the acceptance criteria.

Avoid broad refactors unless the task requires them.

### Step 4 — Self-Check Against Original Task

Compare the implementation to the original request.

If any acceptance criterion is missing, fix before creating or updating the PR.

### Step 5 — Build Until Green

Run production build.

If build fails:

1. read the first meaningful error;
2. identify root cause;
3. fix it;
4. rerun build;
5. repeat until build succeeds or a real blocker is found.

### Step 6 — Local Quality Checks

Run available checks:

- lint;
- typecheck;
- tests;
- build;
- manual UI check if automated checks are absent.

If any check fails, fix and repeat.

### Step 7 — Create or Update PR

Create or update a branch and PR.

The PR description must include:

- summary;
- files changed;
- acceptance criteria coverage;
- test plan;
- known risks.

### Step 8 — Ship PR Until Green

Loop until PR is green and mergeable:

1. check PR status;
2. check CI/checks;
3. inspect failed logs;
4. fix root cause;
5. push update;
6. repeat.

Verify:

- PR exists;
- correct base branch;
- no conflicts;
- not stale;
- mergeable;
- checks green or clearly absent;
- no unrelated files changed;
- task coverage is complete.

### Step 9 — Merge Until Confirmed

If merge permissions are available:

1. merge the PR;
2. verify merge succeeded;
3. verify final commit is on the target branch;
4. verify target branch contains the intended change.

If merge is blocked by permissions, branch protection, required review, or failing checks, stop with `STATUS: BLOCKED`.

### Step 10 — Vercel Deployment Verification

After merge, check Vercel.

Verify:

- deployment triggered;
- deployment belongs to the final merged commit;
- deployment targets production/live environment;
- deployment build succeeded;
- no deployment/runtime errors are visible.

If deployment fails:

1. inspect logs;
2. identify root cause;
3. fix through proper git/PR flow;
4. repeat delivery loop from local checks.

If Vercel access is unavailable, stop with `STATUS: BLOCKED` and explain what access is missing.

### Step 11 — Live Verification

Open the live URL.

Verify the requested behavior directly.

Do not count deployment success as live verification.

Check:

- correct page or route;
- requested UI or logic;
- important error states;
- whether the change matches the original acceptance criteria.

If the live site does not reflect the change, investigate:

- wrong branch;
- wrong commit;
- wrong Vercel project;
- failed deployment;
- cache;
- wrong environment;
- wrong route;
- runtime error.

Fix and repeat if possible.

## 11. Anti-Gaming Rules

Never:

- disable tests to pass;
- remove checks to pass;
- bypass branch protection;
- claim success based on code only;
- claim success based on PR creation only;
- claim success based on merge only;
- claim success based on Vercel build only;
- say "should be live soon" as SUCCESS;
- claim live verification without checking live.

## 12. Final Report Format

Always end exactly with:

```txt
STATUS: SUCCESS or BLOCKED

LOOP:
- /delivery / PRODUCTION_DELIVERY_LOOP

TASK:
- Original request:
- Acceptance criteria:

TASK COVERAGE:
- [ ] Criterion 1
- [ ] Criterion 2
- [ ] Criterion 3

IMPLEMENTATION:
- Summary:
- Files changed:

CHECKS:
- Build:
- Lint:
- Typecheck:
- Tests:
- Manual check:

GITHUB:
- Branch:
- PR:
- PR checks:
- Mergeable:
- Merged:
- Final commit on target branch:

VERCEL:
- Deployment URL:
- Deployment status:
- Commit deployed:
- Live URL:

LIVE VERIFICATION:
- Checked route/page:
- Expected result:
- Actual result:

BLOCKERS:
- None, if SUCCESS.
- Exact blocker and required user action, if BLOCKED.

NEXT STEP:
- None, if SUCCESS.
- Required user action, if BLOCKED.
```

## 13. Related Commands

Recommended command family:

```txt
/goal        — clarify goal and break down the task
/supercool   — improve concept, UX, or quality of solution
/pr          — create a clean mergeable PR, but do not merge
/delivery    — implement, verify, merge, deploy, and live-check
/fix-deploy  — diagnose and fix Vercel/live deployment issues
/audit       — inspect whether task, PR, merge, deploy, and live state match
```

## 14. Minimal Prompt for Future Use

```txt
/delivery

Task:
[insert task]

Target:
Production live site.

Do not stop at code, PR, checks, merge, or deploy. Stop only with:

STATUS: SUCCESS — implemented, merged, deployed, and verified live.

or

STATUS: BLOCKED — exact blocker, evidence, and required user action.
```

## 15. Implementation Notes for This Repository

Project facts from `AGENTS.md`:

- canonical repo: `andylitvinov-design/reiki-yggdrasil`;
- target production URL: `https://mentalica.vercel.app`;
- current/legacy live URL until migration is verified: `https://reiki-yggdrasil.vercel.app`;
- framework: Vite + React;
- hosting: Vercel;
- build command: `npm run build`;
- output directory: `dist`.

Before invoking `/delivery`, the agent should read:

1. `AGENTS.md`
2. `README.md`
3. `STATE.md`
4. `LOG.md`
5. `docs/release-workflow.md`
6. `docs/deploy-fallback.md`

This keeps `/delivery` aligned with the existing project operating rules.
