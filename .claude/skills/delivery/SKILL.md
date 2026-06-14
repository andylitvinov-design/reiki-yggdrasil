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

## Final Result Verification Gate

Implementation is not completion. Verification against the original request is
completion.

Before any completion claim or `STATUS: SUCCESS`:

1. Reread the original user task.
2. Extract the Original Request Contract:
   - explicit requirements;
   - edge cases;
   - small UI details;
   - exclusions and do-not-touch rules;
   - required live/staging/mobile/desktop proof.
3. Compare the contract with the final diff and live proof.
4. Verify every requirement in this table:

| Requirement | Status | Evidence | Verification method |
|---|---|---|---|

Allowed statuses: `PASS`, `PARTIAL`, `FAIL`, `NOT VERIFIED`.

Only `PASS` allows completion. If any required item is `PARTIAL`, `FAIL`, or
`NOT VERIFIED`, do not say `done`, `fixed`, `implemented`, `ready`, or
`ready to merge`. Say `Implemented but not verified.` or
`Cannot verify because ...`.

If the gate fails, repair and rerun it. Stop after 2 failed gate repair attempts
and report what still fails, why it was not fixed, the next file/function to
inspect, and any required user action.

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
