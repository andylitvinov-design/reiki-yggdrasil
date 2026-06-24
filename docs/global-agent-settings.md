# Global Agent Settings

Status: shared source of truth for active project agent behavior.

Canonical location:

```txt
andylitvinov-design/reiki-yggdrasil/docs/global-agent-settings.md
```

This document keeps runtime prompts short. Project `AGENTS.md` files and local command files should reference this shared layer instead of copying long protocols into every repo.

## Scope

Applies to active projects:

| Project | Canonical repo | Known local path | Primary URLs |
| --- | --- | --- | --- |
| Reiki Yggdrasil / Mentalica | `andylitvinov-design/reiki-yggdrasil` | `/Users/andriilitvinov/projects/MYPROJECTS/reiki-yggdrasil` | `https://mentalica.vercel.app`, `https://reiki-yggdrasil.vercel.app` |
| PsiTherapy / Report | `andylitvinov-design/report` | `/Users/andriilitvinov/projects/MYPROJECTS/reports` | `https://2mentalica.vercel.app`, `https://psitherapy.vercel.app` |
| EzoHata Finance | `andylitvinov-design/finance` | `/Users/andriilitvinov/projects/MYPROJECTS/finance` | `https://ezohata-incoming-ledger.vercel.app` |

Do not rely only on folder names. Resolve the canonical GitHub remote before creating issues, PRs, or project-specific fixes.

## Source Files

Read these shared files first for global behavior:

1. `docs/global-agent-settings.md` - this index and operating contract.
2. `docs/global-command-protocols.md` - `/audit`, `/audit-ui`, `/audit-fin`, `/delivery`, UI polish, design quality gate, and issue-writing contracts.
3. `docs/audit-ui-mode.md` - specialized UI/UX concept audit protocol.
4. `docs/global-project-adapters.md` - project routing, repo mapping, local path notes, and adapter requirements.
5. `docs/global-agent-skills.md` - shared skill requirements and fallback behavior.

Then read the target repo's local adapter:

1. `AGENTS.md`
2. `.claude/commands/*.md`, when present
3. Repo-specific docs named by the local adapter

Local adapters may add safety rules, commands, URLs, branch policy, or verification details. They should not redefine global protocols unless the global docs explicitly allow a project-specific override.

## Short Runtime Prompts

Preferred prompt shape:

```txt
/delivery
Task:
Resolve issue <issue URL>. Follow the shared global agent settings and the target repo adapter.
```

For audits:

```txt
/audit
Task:
Audit <URL/screenshot/problem>. Create or update the GitHub issue and return the short /delivery prompt.
```

For UI concept audits:

```txt
/audit-ui
Task:
Audit <screenshot/link/route>. Propose 5-7 ideas, select 3 concepts, create sketch/mockup directions, choose the recommended concept, create or update the GitHub issue, and return the short /delivery prompt.
```

For numeric audits:

```txt
/audit-fin
Task:
Audit <metric/table/report/problem>. Trace the first divergence layer and create or update the GitHub issue.
```

Do not paste the full protocol into chat unless the user explicitly asks for it or GitHub/docs are unavailable.

## Non-Negotiable Safety

Do not touch:

- secrets, env values, cookies, tokens, credentials, billing, or provider settings;
- production database data;
- auth/OAuth/security rules unless explicitly requested;
- finance formulas or accounting semantics during audit/docs work;
- app source when the task is agent settings, docs, or command routing only.

Use env variable names only. Never print real values.

## Global Final Report Minimum

Every implementation or delivery report must list:

- repos checked;
- files changed;
- exact checks run and results;
- what was verified;
- what was not verified;
- risks and limitations;
- issue/PR/deploy/live status, when applicable.
