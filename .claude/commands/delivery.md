# /delivery

Follow all three source-of-truth docs in order:

1. `docs/delivery-loop-program.md` — full protocol, stop states, final report format
2. `docs/delivery-loop-technical-details.md` — scripts, commands, CI/CD checks, agent decision table
3. `docs/delivery-loop-source-patterns-and-live-proof.md` — embedded loop patterns and live proof contract
4. `AGENTS.md` — project adapter and command registry

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

Cost-control rules:

- Treat the stable docs (1-4 above) as cached/stable context. Do not duplicate the full protocol in dynamic prompts.
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
