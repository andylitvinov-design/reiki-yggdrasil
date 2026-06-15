# /delivery

`/delivery` is sufficient by itself.

The user must not need to add extra wording such as "I explicitly delegate merge" or "continue to live".

When the user invokes `/delivery`, that invocation means full safe delivery delegation for this repository:

```txt
implement -> checks -> PR -> PR health -> merge if safe/permitted -> deploy -> live verification
```

## Local Source of Truth

Follow all source-of-truth docs in order:

1. `.claude/commands/delivery.md`
2. `docs/delivery-loop-program.md` — full protocol, stop states, final report format
3. `docs/delivery-loop-technical-details.md` — scripts, commands, CI/CD checks, agent decision table
4. `docs/delivery-loop-source-patterns-and-live-proof.md` — embedded loop patterns and live proof contract
5. `AGENTS.md` — project adapter and command registry

These docs are the local source of truth. Do not browse or fetch external loop repos. If a local doc is missing, report `needs verification` and do not invent replacement rules.

Act as release owner for this project.

Input format:

Task:
$ARGUMENTS

Project adapter for this repo:
- Repository: andylitvinov-design/reiki-yggdrasil
- Default branch: main
- Target branch: main (features) / production (client releases)
- Package manager: npm
- Framework: Vite + React SPA
- Build: npm run build
- Check: npm run check
- CI: GitHub Actions
- Deployment: Vercel (auto-deploy from GitHub)
- Primary live URL: https://2mentalica.vercel.app  ← default SUCCESS target
- Secondary production URL: https://mentalica.vercel.app
- Legacy fallback URL: https://reiki-yggdrasil.vercel.app

SUCCESS requires live proof on the primary live URL (https://2mentalica.vercel.app) unless another target is explicitly requested by the user.

## FINAL RESULT VERIFICATION GATE

Implementation is not completion. Verification against the original request is
completion.

Before saying `STATUS: SUCCESS`, `done`, `fixed`, `implemented`, `ready`, or
`ready to merge`, extract the Original Request Contract from the user's task:

- explicit requirements;
- edge cases;
- small UI details;
- explicit exclusions and do-not-touch rules;
- required live/staging/mobile/desktop proof.

Verify every contract item:

| Requirement | Status | Evidence | Verification method |
|---|---|---|---|

Allowed statuses: `PASS`, `PARTIAL`, `FAIL`, `NOT VERIFIED`.

Do not use completion language if any required item is `PARTIAL`, `FAIL`, or
`NOT VERIFIED`. Say `Implemented but not verified.` or
`Cannot verify because ...` instead.

After implementation, reread the original task and compare it with the diff:
requirements covered, UI details covered, no unrelated files changed,
mobile/desktop layout preserved, existing behavior preserved, regression risks
identified, PR mergeable, and live/staging proof complete when applicable.

If the gate fails, repair and rerun it. After 2 failed gate repair attempts,
stop with `STATUS: BLOCKED` and report the remaining gap, why it was not fixed,
the next file/function to inspect, and any required user action.

Required final status:

- STATUS: SUCCESS — task implemented, PR merged (or direct-to-main confirmed), deployed, and verified live.
- STATUS: BLOCKED — exact external blocker, evidence, and required user action.

Do not stop after code, PR, checks, merge, or deploy.

## Built-In Delegation

The `/delivery` command itself is the user's delegation to proceed through the full safe release path.

That includes:

- create branch/worktree from `origin/main`;
- implement minimal safe patch;
- run relevant tests/checks;
- commit and push branch;
- create or update PR;
- check PR health and CI;
- fix until green and task-complete;
- merge if safe and permitted;
- verify deployment;
- verify live behavior on the primary live URL.

Do not ask the user to additionally confirm merge/deploy/live verification merely because `/delivery` was invoked.

## PR Checkpoint And Merge Policy

PR creation is an intermediate checkpoint, not the final result.

After PR creation, `/delivery` continues by default to PR health, the Spiral Validator-Critic review, merge, deploy, and live verification when the project adapter requires those steps.

Merge happens by default when all of these allow it:

- local checks and required CI pass;
- the PR is mergeable;
- branch policy allows merge;
- the Spiral Validator-Critic or final review verdict is `READY_FOR_MERGE` or `READY_WITH_NOTES`;
- project safety rules do not require an owner decision.

Stop before merge only when:

- the user explicitly requested PR-only, review-only, draft-only, or no-deploy mode;
- checks, CI, mergeability, or branch protection prevent merge;
- required human review is missing;
- project-specific safety rules require an owner decision.

Merge alone is not `STATUS: SUCCESS`; deployment and live proof still follow per the project adapter.

Ask or stop with `STATUS: BLOCKED` only when there is a real external blocker: missing permission, required human review, failed checks that cannot be fixed safely, project-specific safety risk, missing secret/env, deployment access missing, or unsafe/destructive action required.

## Spiral Validator-Critic Loop

The Spiral Validator-Critic Loop is an improvement loop, not a hard blocker.

Run it after implementation and local checks, before merge readiness is claimed:

```txt
implement -> critic review -> concrete improvement plan -> patch next loop -> critic review again
```

The critic must validate the Original Request Contract requirement by requirement and output concrete next actions. It may run up to 3 loops.

Allowed critic verdicts:

- `READY_FOR_MERGE` — all critic requirements are `PASS`.
- `READY_WITH_NOTES` — merge may proceed with documented, non-blocking notes or externally limited gaps.
- `IMPROVE` — another improvement loop is required.
- `IMPROVE_MINOR` — a small improvement loop is required.
- `SAFETY_STOP` — continuing is unsafe or externally blocked.
- `NEEDS_HUMAN_DECISION` — owner/product judgment is required.

Use `SAFETY_STOP` only for dangerous or externally impossible cases. Missing polish, weak evidence, or partial UI/API quality should normally become `IMPROVE`, `IMPROVE_MINOR`, or `READY_WITH_NOTES` with a concrete next action.

Record machine-readable critic output in optional top-level `.delivery/status.json` field `spiralValidatorCritic`. Do not put it inside `result_verification`.

## Cost-Control Rules

- Treat the stable docs (1-5 above) as cached/stable context. Do not duplicate the full protocol in dynamic prompts.
- Put current task / logs / diffs / PR status after the stable protocol context.
- Prefer diffs over full files. Do not scan the full repository unless necessary.
- Stop after 3 failed fix attempts on the same issue — return STATUS: BLOCKED.
- Never touch env vars, secrets, billing, production database, or auth-sensitive settings without explicit user approval.
- Use cheapest capable model/tooling for routine status checks; use stronger reasoning only for architecture, hard debug, or final delivery-risk review.
- Final report must include COST CONTROL section.

SUCCESS requires a completed live proof block:

```txt
LIVE PROOF:
- Live URL:
- Checked route/page:
- Final deployed commit:
- Expected live behavior:
- Actual live behavior:
- Evidence:
```

SUCCESS also requires a completed result verification block:

```txt
RESULT VERIFICATION:
| Requirement | Status | Evidence | Verification method |
|---|---|---|---|
```

BLOCKED requires:

```txt
- Where the loop stopped:
- What is complete:
- What is not complete:
- Exact blocker:
- Evidence:
- Required user action:
- Next prompt to run after unblocking:
```
