# Global Project Adapters

Status: shared routing and adapter registry for active projects.

## Routing Rules

Always resolve the canonical repo before creating issues, branches, PRs, or implementation instructions.

Do not rely on an old URL mapping alone when the target is a Vercel alias. First compare the user-visible product identity, live title/brand, route behavior, build markers, and recent repository activity. If those signals disagree, stop and report `ROUTING_CONFLICT_NEEDS_VERIFICATION` instead of creating an implementation issue in the wrong repo.

| Input URL / signal | Canonical repo | GitHub issues | Known local path | Notes |
| --- | --- | --- | --- | --- |
| `https://2mentalica.vercel.app` | `andylitvinov-design/reiki-yggdrasil` | `https://github.com/andylitvinov-design/reiki-yggdrasil/issues` | `/Users/andriilitvinov/projects/MYPROJECTS/reiki-yggdrasil` | Current 2mentalica staging/draft site for Reiki Yggdrasil. Live title/brand is `Рейки Иггдрасиль`; app work must target `/`, `/profile`, `/masters`, `/profile/admin` in this repo. Do not route this to `report`. |
| `https://mentalica.vercel.app` | `andylitvinov-design/reiki-yggdrasil` | `https://github.com/andylitvinov-design/reiki-yggdrasil/issues` | `/Users/andriilitvinov/projects/MYPROJECTS/reiki-yggdrasil` | Target Reiki/Mentalica production URL. |
| `https://reiki-yggdrasil.vercel.app` | `andylitvinov-design/reiki-yggdrasil` | `https://github.com/andylitvinov-design/reiki-yggdrasil/issues` | `/Users/andriilitvinov/projects/MYPROJECTS/reiki-yggdrasil` | Legacy/current live URL during migration. |
| `https://psitherapy.vercel.app` | `andylitvinov-design/report` | `https://github.com/andylitvinov-design/report/issues` | `/Users/andriilitvinov/projects/MYPROJECTS/reports` | PsiTherapy cabinet/report project. Local folder may be plural `reports`; GitHub repo is singular `report`. |
| `https://holistichealing.vercel.app` | `andylitvinov-design/report` | `https://github.com/andylitvinov-design/report/issues` | `/Users/andriilitvinov/projects/MYPROJECTS/reports` | Previous/alternate PsiTherapy/report alias. Verify before using as production proof. |
| `https://ezohata-incoming-ledger.vercel.app` | `andylitvinov-design/finance` | `https://github.com/andylitvinov-design/finance/issues` | `/Users/andriilitvinov/projects/MYPROJECTS/finance` | Finance numeric/source proof project. |

If the local path and canonical remote disagree, trust the canonical remote only after verifying `git remote -v`, repo-local `AGENTS.md`, and at least one live/build marker.

## URL Routing Verification Gate

Before opening an audit or delivery issue for a URL, collect these signals:

```txt
1. User-stated target product and route.
2. Live page title/brand or visible screenshot brand.
3. Current URL response markers, when public: build-info.json, index title, JS bundle markers, route rewrites.
4. Repo-local AGENTS.md / README domain mapping.
5. Recent PRs/issues in the candidate repo related to the requested feature area.
```

Evidence rules:

- If the live brand is `Рейки Иггдрасиль`, route to `andylitvinov-design/reiki-yggdrasil`.
- If the live/product context is PsiTherapy, client reports, AI intake, Bach/DAO report cabinet, or `psitherapy.vercel.app`, route to `andylitvinov-design/report`.
- If a stale document says `2mentalica` maps to `report`, treat it as outdated and prefer this file plus live brand evidence.
- If there is still a conflict, do not guess. Create a routing-audit issue only after marking `ROUTING_CONFLICT_NEEDS_VERIFICATION` and listing the conflicting signals.

## Adapter Requirements

Every active project should expose a thin local adapter:

```txt
AGENTS.md
.claude/commands/audit.md
.claude/commands/audit-fin.md
.claude/commands/delivery.md
.claude/commands/delivery-big.md
.codex/commands/delivery-big.md
.codex/skills/delivery-big/SKILL.md
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
test -f .claude/commands/delivery-big.md
test -f .codex/commands/delivery-big.md
test -f .codex/skills/delivery-big/SKILL.md
test -f .claude/commands/audit.md || true
test -f .claude/commands/audit-fin.md || true
rg -n "global-agent-settings|global-command-protocols|global-project-adapters|global-agent-skills" AGENTS.md .claude docs
```

If local command files are missing, create thin adapters. Do not copy long protocols into every repo.
