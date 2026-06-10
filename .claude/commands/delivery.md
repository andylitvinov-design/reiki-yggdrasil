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

Required final status:

- STATUS: SUCCESS — task implemented, PR merged (or direct-to-main confirmed), deployed, and verified live.
- STATUS: BLOCKED — exact external blocker, evidence, and required user action.

Do not stop after code, PR, checks, merge, or deploy.

Autonomous Permission Scope — allowed without asking during /delivery:

- Read any project file.
- Edit files inside the repository (source, docs, scripts, tests, CSS, config) related to the task.
- Run: npm install / npm ci / npm run build / npm run check / npm test / npm run lint / npm run typecheck.
- Run: git status / git diff / git add / git commit / git push.
- Run: gh pr create / gh pr view / gh pr checks / gh run list / gh run view.
- Create or update PR; push fixes to the same branch; wait for CI; read logs; fix failed checks; re-push.
- Read deployment status; check live URL.

Require explicit user approval before:

- Changing or reading secret/env values.
- Touching billing, payment, or subscription settings.
- Writing to production database.
- Destructive commands: rm -rf, git reset --hard, git clean -fd, force push.
- Deleting many files.
- Changing auth, OAuth, or security rules.
- Changing deployment provider settings.
- Merging to main — unless the invocation includes "full delivery to live", "merge if green", or "deliver to production".
- Production deploy if this project does not auto-deploy from main.

Full-autonomy trigger: if the task includes "full delivery to live", "merge if green", or "deliver to production", the agent may merge after checks pass and verify live without asking again. If branch protection, required review, missing permission, env/secrets, or destructive action is needed, return STATUS: BLOCKED with the exact blocker.

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
