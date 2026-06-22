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
2. `docs/delivery-auth-boundary-standard.md` — auth-gated live verification, Google/Supabase/private cabinet boundary, `SUCCESS_WITH_AUTH_LIMITATION`
3. `docs/delivery-loop-program.md` — full protocol, stop states, final report format
4. `docs/delivery-loop-technical-details.md` — scripts, commands, CI/CD checks, agent decision table
5. `docs/delivery-loop-source-patterns-and-live-proof.md` — embedded loop patterns and live proof contract
6. `AGENTS.md` — project adapter and command registry

These docs are the local source of truth. Do not browse or fetch external loop repos. If a local doc is missing, report `needs verification` and do not invent replacement rules.

If older delivery docs conflict with `docs/delivery-auth-boundary-standard.md`, the auth-boundary standard wins for auth-gated live verification.

## Central Project Memory

Before implementation, load the central project memory when available:

1. `andylitvinov-design/ai-projects-brain/START-HERE-FOR-AGENTS.md`
2. `andylitvinov-design/ai-projects-brain/systems/delivery-auth-boundary-standard.md`
3. `projects/index.md` to resolve `project_key`
4. the relevant project capsule files, especially `PROJECT.md`, `STATE.md`, `CHECKS.md`, `CODEX_BRIEF.md`, `DECISIONS.md`, and `RISKS.md`

Do not duplicate long project-specific rules inside this command. Use central memory for durable project context and use these repo-local delivery docs for exact commands, checks, and release flow.

If central memory is unavailable, continue with the local source-of-truth docs and mark `central memory: NOT VERIFIED` in the final report.

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

For auth-gated cabinet behavior, authenticated post-login live proof may be replaced by safe public/login/protected-redirect/local-demo/code proof and final status `SUCCESS_WITH_AUTH_LIMITATION` per `docs/delivery-auth-boundary-standard.md`.

## Verification Environment Mode

Classify final verification as one of:

- `PUBLIC_LIVE` — public unauthenticated live behavior can be checked on the deployed site.
- `PREVIEW_DEPLOYMENT` — preview/staging deployment is the best available target.
- `LOCAL_AUTH_SIMULATION` — private/auth-only behavior must be checked locally with safe dev, fixture, or demo state.
- `AUTH_BOUNDARY` — public/login/deploy checks pass, but authenticated post-login production verification is blocked only by expected Google/Supabase/private auth.
- `OWNER_REQUIRED` — no safe local/preview proof can reproduce the requested behavior; owner verification is required.

If a feature is behind Google/Supabase/private cabinet/auth-only state, do not request or use real credentials and do not claim authenticated live proof unless actually verified.

Use local dev/fixture/demo/code proof when live auth is unavailable. If the only missing proof is expected auth, mark authenticated live proof as `SKIPPED_EXPECTED_AUTH_BOUNDARY` and finish with `STATUS: SUCCESS_WITH_AUTH_LIMITATION`, not `STATUS: BLOCKED`.

## Auth-Gated Live Verification Rule

Expected Google OAuth, Supabase auth, private cabinet login, account chooser, captcha, browser-not-secure screen, or owner-only session is not by itself a delivery failure.

Do not:

- ask for Google/Supabase/private credentials;
- ask for cookies, tokens, refresh tokens, or secrets;
- attempt to bypass OAuth or security controls;
- retry OAuth endlessly;
- mark delivery as `BLOCKED` only because production requires human login.

For auth-gated apps, delivery may finish as:

```txt
STATUS: SUCCESS_WITH_AUTH_LIMITATION
```

when all of the following are true:

- implementation is complete;
- build/checks pass;
- PR is merged or direct-to-main is confirmed;
- deployment is successful;
- public live route loads;
- login/auth entry point is visible;
- protected routes redirect to login/auth instead of crashing;
- post-login live verification is impossible only because of expected Google/Supabase/private auth boundary;
- local dev, fixture, mock, demo, or code-level verification covers the requested post-login behavior as much as safely possible.

Required wording:

```txt
AUTHENTICATED LIVE PROOF: SKIPPED_EXPECTED_AUTH_BOUNDARY
Reason: production post-login area is protected by Google/Supabase/private auth, and using real credentials/cookies/secrets is not allowed.
Safe proof completed: build, deployment, public route, login entry, protected-route redirect, and local/demo/code verification where available.
Final status: STATUS: SUCCESS_WITH_AUTH_LIMITATION
```

Use `STATUS: BLOCKED` only for a real app/build/runtime/deployment/security/data blocker, not for expected auth.

## FINAL RESULT VERIFICATION GATE

Implementation is not completion. Verification against the original request is completion.

Before saying `STATUS: SUCCESS`, `STATUS: SUCCESS_WITH_AUTH_LIMITATION`, `done`, `fixed`, `implemented`, `ready`, or `ready to merge`, extract the Original Request Contract from the user's task:

- explicit requirements;
- edge cases;
- small UI details;
- explicit exclusions and do-not-touch rules;
- required live/staging/mobile/desktop proof.

Verify every contract item:

| Requirement | Status | Evidence | Verification method |
|---|---|---|---|

Allowed statuses: `PASS`, `PARTIAL`, `FAIL`, `NOT VERIFIED`, `SKIPPED_EXPECTED_AUTH_BOUNDARY`.

Do not use completion language if any required item is `PARTIAL`, `FAIL`, or `NOT VERIFIED`.

`SKIPPED_EXPECTED_AUTH_BOUNDARY` is allowed only for authenticated post-login production proof when the auth-boundary standard is satisfied. It permits `STATUS: SUCCESS_WITH_AUTH_LIMITATION` but not plain `STATUS: SUCCESS`.

After implementation, reread the original task and compare it with the diff: requirements covered, UI details covered, no unrelated files changed, mobile/desktop layout preserved, existing behavior preserved, regression risks identified, PR mergeable, and live/staging proof complete when applicable.

If the gate fails, repair and rerun it. After 2 failed gate repair attempts, stop with `STATUS: BLOCKED` and report the remaining gap, why it was not fixed, the next file/function to inspect, and any required user action.

Required final status:

- `STATUS: SUCCESS` — task implemented, PR merged (or direct-to-main confirmed), deployed, and verified live.
- `STATUS: SUCCESS_WITH_AUTH_LIMITATION` — task implemented, PR merged (or direct-to-main confirmed), deployed, public/login/protected-redirect checks passed, and only authenticated production proof is skipped due to expected auth boundary.
- `STATUS: BLOCKED` — exact external blocker, evidence, and required user action.

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
- verify live behavior on the primary live URL or auth-boundary-safe substitute for auth-gated areas.

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

Merge alone is not final success; deployment and live proof still follow per the project adapter.

Ask or stop with `STATUS: BLOCKED` only when there is a real external blocker: missing permission, required human review, failed checks that cannot be fixed safely, project-specific safety risk, missing secret/env, deployment access missing, unsafe/destructive action required, or auth-gated behavior with no safe public/local/demo/code proof.

## Spiral Validator-Critic Loop

The Spiral Validator-Critic Loop is an improvement loop, not a hard blocker.

Run it after implementation and local checks, before merge readiness is claimed:

```txt
implement -> critic review -> concrete improvement plan -> patch next loop -> critic review again
```

The critic must validate the Original Request Contract requirement by requirement and output concrete next actions. It may run up to 3 loops.

Allowed critic verdicts:

- `READY_FOR_MERGE` — all critic requirements are `PASS`.
- `READY_WITH_NOTES` — merge may proceed with documented, non-blocking notes or externally limited gaps, including expected auth-boundary limitations.
- `IMPROVE` — another improvement loop is required.
- `IMPROVE_MINOR` — a small improvement loop is required.
- `SAFETY_STOP` — continuing is unsafe or externally blocked.
- `NEEDS_HUMAN_DECISION` — owner/product judgment is required.

Use `SAFETY_STOP` only for dangerous or externally impossible cases. Missing polish, weak evidence, partial UI/API quality, or expected auth boundary should normally become `IMPROVE`, `IMPROVE_MINOR`, or `READY_WITH_NOTES` with a concrete next action.

Record machine-readable critic output in optional top-level `.delivery/status.json` field `spiralValidatorCritic`. Do not put it inside `result_verification`.

## Cost-Control Rules

- Treat the stable docs (1-6 above) as cached/stable context. Do not duplicate the full protocol in dynamic prompts.
- Put current task / logs / diffs / PR status after the stable protocol context.
- Prefer diffs over full files. Do not scan the full repository unless necessary.
- Stop after 3 failed fix attempts on the same issue — return STATUS: BLOCKED.
- Never touch env vars, secrets, billing, production database, auth-sensitive settings, credentials, cookies, or tokens without explicit user approval.
- Use cheapest capable model/tooling for routine status checks; use stronger reasoning only for architecture, hard debug, or final delivery-risk review.
- Final report must include COST CONTROL section.

SUCCESS or SUCCESS_WITH_AUTH_LIMITATION requires a completed live proof block:

```txt
LIVE PROOF:
- Live URL:
- Checked route/page:
- Final deployed commit:
- Expected live behavior:
- Actual live behavior:
- Evidence:
- Auth boundary: NONE / GOOGLE_OAUTH_EXPECTED / SUPABASE_AUTH_EXPECTED / PRIVATE_CABINET_EXPECTED / OWNER_SESSION_REQUIRED
- Authenticated live proof: VERIFIED / SKIPPED_EXPECTED_AUTH_BOUNDARY / OWNER_REQUIRED / NOT_APPLICABLE
- Auth boundary: NONE / GOOGLE_OAUTH_EXPECTED / SUPABASE_AUTH_EXPECTED / PRIVATE_CABINET_EXPECTED
- Authenticated live proof: VERIFIED / SKIPPED_EXPECTED_AUTH_BOUNDARY / NOT_APPLICABLE
```

SUCCESS also requires a completed verification environment line and result verification block:

```txt
VERIFICATION MODE: PUBLIC_LIVE / PREVIEW_DEPLOYMENT / LOCAL_AUTH_SIMULATION / AUTH_BOUNDARY / OWNER_REQUIRED

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
