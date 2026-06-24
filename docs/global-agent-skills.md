# Global Agent Skills

Status: shared skill and fallback policy for active project agents.

## Required Shared Behaviors

Agents must treat these as shared global behaviors across active projects:

- `/audit` - product, UX, UI, and technical audit with deep implementation-ready GitHub issue.
- `/audit-fin` - numeric/calculation/source-layer audit with first divergence proof.
- `/delivery` - implementation, checks, PR/merge/deploy/live proof when permitted by the project adapter.
- UI polish - use the external feel-better skill when available, otherwise use the fallback checklist.
- Design quality gate - mandatory for UI deliveries.
- Deep technical issue writing - mandatory before `/delivery` handoff from audits.
- Deep numeric implementation trace - mandatory for numeric/finance work.

## External Skill

Preferred UI polish skill:

```txt
jakubkrehel/make-interfaces-feel-better
```

Install/use when supported:

```bash
npx skills add jakubkrehel/make-interfaces-feel-better
```

Reference:

```txt
https://jakub.kr/skills/make-interfaces-feel-better
```

If unavailable:

1. Do not block the task only because the skill cannot be installed.
2. Run the project adapter's local fallback checklist.
3. Mark `external skill: NOT VERIFIED` or `external skill: UNAVAILABLE`.
4. Still include `UI POLISH / FEEL-BETTER PASS` in the final report for UI tasks.

## Skill Loading Order

For coding, debugging, implementation planning, and code review:

1. User instructions and repo-local `AGENTS.md`.
2. Relevant native agent skills.
3. Shared global docs from this layer.
4. Project adapter docs.

If a skill conflicts with explicit repo safety rules, follow the repo safety rule.

## Runtime Prompt Budget

Keep prompts short:

- command;
- task;
- issue URL or target URL;
- any explicit do-not-touch instructions.

Put durable behavior in docs and issues, not in every chat prompt.
