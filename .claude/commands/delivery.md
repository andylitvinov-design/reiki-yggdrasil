# /delivery

`/delivery` is full safe delivery delegation for the resolved project: implement, check, PR, merge when green/permitted, deploy, and verify the requested behavior on the target environment or documented auth-safe substitute.

## Source of truth

Read in order:

1. `docs/global-agent-settings.md`
2. `docs/global-command-protocols.md` - shared `/delivery`, UI polish, design quality gate, and final report requirements
3. `docs/global-project-adapters.md` - URL/repo routing and future project adapter rules
4. `docs/global-agent-skills.md` - shared skill/fallback behavior
5. `AGENTS.md` - Reiki project adapter and safety rules
6. `docs/delivery-auth-boundary-standard.md` - auth-gated live verification and `SUCCESS_WITH_AUTH_LIMITATION`
7. `docs/delivery-loop-program.md` - local full delivery loop
8. `docs/delivery-loop-technical-details.md` - local checks, scripts, CI/CD details
9. `docs/delivery-loop-source-patterns-and-live-proof.md` - local live proof contract
10. `docs/delivery-design-quality-gate.md` - local UI/design gate details

If a local source file is missing, report `needs verification`; do not invent replacement rules.

## Input

```txt
Task:
$ARGUMENTS
```

## Reiki project adapter

- Repository: `andylitvinov-design/reiki-yggdrasil`
- Default branch: `main`
- Target branch: `main` for normal feature work; `production` only for explicit client release tasks
- Package manager: `npm`
- Framework: Vite + React SPA
- Build: `npm run build`
- Check: `npm run check`
- CI: GitHub Actions
- Deployment: Vercel from GitHub
- Default delivery target: `https://2mentalica.vercel.app`
- Secondary production URL: `https://mentalica.vercel.app`
- Legacy URL during migration: `https://reiki-yggdrasil.vercel.app`

## Required behavior

Follow the shared `/delivery` chain and preserve all explicit do-not-touch rules. For UI tasks, the final report must include:

```txt
DESIGN QUALITY GATE
UI POLISH / FEEL-BETTER PASS
```

Never touch secrets, env values, billing, production data, auth/OAuth/security rules, or finance formulas unless the user explicitly requests that scope.

Final status must be one of:

```txt
STATUS: SUCCESS
STATUS: SUCCESS_WITH_AUTH_LIMITATION
STATUS: BLOCKED
```
