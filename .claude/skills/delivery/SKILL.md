# Skill: /delivery — PRODUCTION_DELIVERY_LOOP

This skill does not define a separate protocol.
It points to the three source-of-truth docs that together define `/delivery` for this project.

Source-of-truth docs (read all three before starting):

1. `docs/delivery-loop-program.md` — full protocol, stop states, final report format
2. `docs/delivery-loop-technical-details.md` — scripts, commands, CI/CD checks, agent decision table
3. `docs/delivery-loop-source-patterns-and-live-proof.md` — embedded loop patterns and live proof contract

Project adapter: see `AGENTS.md` → Agent Command Registry → `/delivery`.

Default live target: `https://2mentalica.vercel.app` (primary production URL).
SUCCESS requires live proof on this URL unless another target is explicitly requested.
Secondary (`https://mentalica.vercel.app`) and legacy (`https://reiki-yggdrasil.vercel.app`) URLs cannot satisfy SUCCESS for production delivery by default.

---

## Execution Order

Run the embedded loops in this order (from doc 3, section 16):

1. Project Adapter
2. Acceptance Criteria Extraction
3. Task Coverage Audit — initial
4. Implementation
5. Build Until Green
6. Local Checks Until Clean
7. Ship PR Until Green
8. CI Failure Watcher (if CI fails)
9. PR Babysitter
10. Task Coverage Audit — pre-merge
11. Merge Until Confirmed
12. Deploy Verification Loop
13. Fix Deploy (if deployment/live fails)
14. Live Verification Loop
15. Task Coverage Audit — live
16. Final Evidence Report

---

## Stop States

### STATUS: SUCCESS

Allowed only when the task is implemented, merged if required, deployed to the target environment, and the requested behavior is verified live.

Must include completed live proof block:

```txt
LIVE PROOF:
- Live URL:
- Checked route/page:
- Final deployed commit:
- Expected live behavior:
- Actual live behavior:
- Evidence:
```

### STATUS: BLOCKED

Allowed only when a real external blocker prevents completion.

Must include:

```txt
- Where the loop stopped:
- What is complete:
- What is not complete:
- Exact blocker:
- Evidence:
- Required user action:
- Next prompt to run after unblocking:
```

---

## Rules

- Act as release owner, not only a coding assistant.
- Extract acceptance criteria from the original task before coding.
- Create a project adapter at the start of every run.
- Run: code → local checks → PR → PR health → task coverage audit → merge if permitted → deployment verification → live verification.
- Never claim SUCCESS from code, PR, CI, merge, or deployment alone.
- Never say "should be live soon" as a final answer.
- If evidence is missing, status is BLOCKED, not SUCCESS.
- Never disable tests, bypass branch protection, or hide failed checks.
- Never print secret values — report secret names only.

## Autonomous Permission Scope

During `/delivery`, act without asking for confirmation on:

- Reading any project file.
- Editing files in the repository (source, docs, scripts, tests, CSS, config) related to the task.
- Running: `npm install`, `npm ci`, `npm run build`, `npm run check`, `npm test`, `npm run lint`, `npm run typecheck`.
- Running: `git status`, `git diff`, `git add`, `git commit`, `git push`.
- Running: `gh pr create`, `gh pr view`, `gh pr checks`, `gh run list`, `gh run view`.
- Creating or updating a PR; pushing fixes to the same branch; waiting for CI; reading logs; fixing failed checks; re-pushing.
- Reading deployment status and live URL.

Stop and require explicit user approval before:

- Changing or reading secret/env values.
- Touching billing, payment, or subscription settings.
- Writing to production database.
- Running: `rm -rf`, `git reset --hard`, `git clean -fd`, force push.
- Deleting many files.
- Changing auth, OAuth, or security rules.
- Changing deployment provider settings.
- **Merging to `main`** — unless the task explicitly includes `"full delivery to live"`, `"merge if green"`, or `"deliver to production"`.
- Production deploy if this project does not auto-deploy from `main`.

**Full-autonomy trigger:** If the task includes `"full delivery to live"`, `"merge if green"`, or `"deliver to production"`, merge after checks pass and verify live without asking. If branch protection, required review, missing permission, env/secrets, or destructive action is needed, return `STATUS: BLOCKED` with the exact blocker.

---

## Cost-Control Rules

- Use the stable source-of-truth docs as cached/stable context. Place them first. Do not duplicate the full protocol in dynamic prompts each loop step.
- Put current task / logs / diffs / PR status after the stable protocol context.
- Prefer diffs over full files. Read only relevant files first. Do not scan the full repository unless necessary.
- Stop after **3 failed fix attempts** on the same issue — return `STATUS: BLOCKED` with the 3 attempts described.
- Never touch env vars, secrets, billing, production database, or auth-sensitive settings without explicit user approval. Stop and describe the required action.
- Use cheapest capable model/tooling for routine status checks, file listing, PR body edits, and repetitive summaries.
- Use stronger reasoning only for architecture gate, hard debugging, security-sensitive review, or final delivery-risk review.
- Final report must include:

```txt
COST CONTROL:
- Stable project context reused:
- Dynamic context separated:
- Diffs preferred over full files:
- Full repo scan avoided:
- Loop attempts used:
- Same-issue retry count:
- Expensive reasoning used for:
- Cost/token risk: low / medium / high
- What was avoided to save cost:
```
