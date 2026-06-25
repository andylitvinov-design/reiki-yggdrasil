# Skill: /delivery — LOW_CONFIRMATION_DELIVERY_LOOP

`/delivery` is sufficient by itself.

The command is full safe delivery delegation for this repository:

```txt
implement -> checks -> PR -> PR health -> merge when green/permitted -> deploy -> live verification
```

Do not ask the user for extra confirmation merely to:

- inspect repo files/docs;
- create a branch or worktree;
- edit intended files;
- run safe checks/builds/tests;
- create or update a PR;
- inspect PR health and CI;
- fix failed checks when safe;
- merge when green and permitted;
- trigger the repo deployment fallback;
- verify live behavior.

Ask or stop only for real blockers:

- missing permission;
- failed checks that cannot be fixed safely;
- required human review or branch protection;
- missing deployment secret/access;
- auth boundary with no safe public/local/code proof;
- requested change touches secrets, billing, auth provider settings, production data, finance formulas, or destructive operations.

## Source of truth

Read local files first:

1. `.claude/commands/delivery.md`
2. `AGENTS.md`
3. `docs/global-agent-settings.md`
4. `docs/global-command-protocols.md`
5. `docs/global-project-adapters.md`
6. `docs/global-agent-skills.md`
7. `docs/delivery-auth-boundary-standard.md`
8. `docs/delivery-loop-program.md`
9. `docs/delivery-loop-technical-details.md`
10. `docs/delivery-loop-source-patterns-and-live-proof.md`
11. `docs/delivery-design-quality-gate.md`

Do not repeatedly fetch external URLs during one delivery run unless local context is missing and the run truly needs the latest shared protocol.

## Project adapter

- Repository: `andylitvinov-design/reiki-yggdrasil`
- Default branch: `main`
- Target branch: `main` for normal feature work; `production` only for explicit client release tasks
- Package manager: `npm`
- Framework: Vite + React
- Build: `npm run build`
- Check: `npm run check`
- Primary live URL: `https://2mentalica.vercel.app`
- Secondary production URL: `https://mentalica.vercel.app`
- Legacy URL: `https://reiki-yggdrasil.vercel.app`

## Completion rule

Implementation is not completion.

Before final success, verify the Original Request Contract requirement by requirement. Use:

```txt
PASS
PARTIAL
FAIL
NOT VERIFIED
```

`STATUS: SUCCESS` requires all required items to pass or documented allowed auth limitation.

For UI tasks, final report must include:

```txt
DESIGN QUALITY GATE
UI POLISH / FEEL-BETTER PASS
```

## Final statuses

```txt
STATUS: SUCCESS
STATUS: SUCCESS_WITH_AUTH_LIMITATION
STATUS: BLOCKED
```

Do not stop at code, PR, CI, merge, deploy, or “should be live soon”.

Do not print secret values. Report secret names only.
