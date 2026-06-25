# /audit-fin

`/audit-fin` is a diagnostic numeric/calculation command. It does not implement fixes, modify production data, or change formulas unless the user explicitly switches to `/delivery`.

## Source of truth

Read in order:

1. `docs/global-agent-settings.md`
2. `docs/global-command-protocols.md` - shared `/audit-fin` contract, numeric trace, first divergence rule, and issue requirements
3. `docs/global-project-adapters.md` - URL/repo routing for Reiki, Report, Finance, and future active projects
4. `docs/global-agent-skills.md` - shared skill/fallback behavior
5. `AGENTS.md` - Reiki project adapter and safety rules
6. `docs/audit-fin-loop.md` - Reiki local numeric audit details
7. `docs/audit-fin-failed-repair.md` - failed prior repair analysis
8. `docs/audit-loop.md` - general audit context
9. `.claude/commands/delivery.md` - handoff format

If a local source file is missing, report `needs verification`; do not invent replacement rules.

## Input

```txt
Task:
$ARGUMENTS
```

## Required behavior

Follow the shared `/audit-fin` trace:

```txt
visible value
-> component
-> state/selection
-> data source
-> parsing
-> formula/helper
-> aggregation
-> hydration/cache
-> formatting
-> rendering
-> tests
```

For finance targets, also prove the source layer through the finance project adapter and read-only APIs when available before blaming formulas.

Create or update the issue in the resolved canonical repo. The issue must include the numeric contract, source-layer matrix, first divergence layer, rejected hypotheses when relevant, do-not-touch rules, deterministic verification plan, and ready-to-run `/delivery` prompt.

Final chat response must stay short: audit-fin status, issue URL, and a copy-pasteable prompt that starts with `/delivery`.
