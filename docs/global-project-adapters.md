# Global Project Adapters

Status: shared routing and adapter registry for active projects.

## Routing Rules

Always resolve the canonical repo before creating issues, branches, PRs, or implementation instructions.

| Input URL / signal | Canonical repo | GitHub issues | Known local path | Notes |
| --- | --- | --- | --- | --- |
| `https://2mentalica.vercel.app` | `andylitvinov-design/report` | `https://github.com/andylitvinov-design/report/issues` | `/Users/andriilitvinov/projects/MYPROJECTS/reports` | Local folder may be plural `reports`; GitHub repo is singular `report`. |
| `https://psitherapy.vercel.app` | `andylitvinov-design/report` | `https://github.com/andylitvinov-design/report/issues` | `/Users/andriilitvinov/projects/MYPROJECTS/reports` | PsiTherapy cabinet/report project. |
| `https://mentalica.vercel.app` | `andylitvinov-design/reiki-yggdrasil` | `https://github.com/andylitvinov-design/reiki-yggdrasil/issues` | `/Users/andriilitvinov/projects/MYPROJECTS/reiki-yggdrasil` | Target Reiki/Mentalica production URL. |
| `https://reiki-yggdrasil.vercel.app` | `andylitvinov-design/reiki-yggdrasil` | `https://github.com/andylitvinov-design/reiki-yggdrasil/issues` | `/Users/andriilitvinov/projects/MYPROJECTS/reiki-yggdrasil` | Legacy/current live URL during migration. |
| `https://ezohata-incoming-ledger.vercel.app` | `andylitvinov-design/finance` | `https://github.com/andylitvinov-design/finance/issues` | `/Users/andriilitvinov/projects/MYPROJECTS/finance` | Finance numeric/source proof project. |

If the local path and canonical remote disagree, trust the canonical remote after verifying `git remote -v`.

## Adapter Requirements

Every active project should expose a thin local adapter:

```txt
AGENTS.md
.claude/commands/audit.md
.claude/commands/audit-fin.md
.claude/commands/delivery.md
```

When a command is not relevant to a project, the local command file may route to the shared docs and state the limitation instead of duplicating a full protocol.

The local adapter must define:

- canonical repo;
- local path, if known;
- branch/release policy;
- install/build/check commands;
- deployment provider and target URLs;
- auth/data/secrets safety rules;
- project-specific do-not-touch areas;
- links to shared global docs;
- links to project-specific docs.

## Future Active Projects

To add a project:

1. Add a row to the routing table.
2. Add a thin local `AGENTS.md` adapter in the project repo.
3. Add local `.claude/commands/*` files that reference `docs/global-command-protocols.md`.
4. Add project-specific checks and target URLs.
5. Avoid duplicating the full shared protocol in the project repo.

## Installation Checks

For each active repo, check:

```bash
git remote -v
test -f AGENTS.md
test -f .claude/commands/delivery.md
test -f .claude/commands/audit.md || true
test -f .claude/commands/audit-fin.md || true
rg -n "global-agent-settings|global-command-protocols|global-project-adapters|global-agent-skills" AGENTS.md .claude docs
```

If local command files are missing, create thin adapters. Do not copy long protocols into every repo.
