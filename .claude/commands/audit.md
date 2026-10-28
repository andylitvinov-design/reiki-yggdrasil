# /audit

`/audit` is a diagnostic command. It does not implement product fixes unless the user explicitly switches to `/delivery`.

## Source of truth

Read in order:

1. `docs/global-agent-settings.md`
2. `docs/global-command-protocols.md` - shared `/audit` contract, evidence labels, deep issue requirements, and short prompt rule
3. `docs/global-project-adapters.md` - URL/repo routing for Reiki, Report, Finance, and future active projects
4. `docs/global-agent-skills.md` - UI polish skill and fallback behavior
5. `AGENTS.md` - Reiki project adapter and safety rules
6. `docs/audit-loop.md` - Reiki local audit details
7. `docs/audit-deep-technical-issue-writing.md` - Reiki local code-trace issue gate
8. `docs/audit-ui-polish-skill.md` - Reiki local UI polish fallback
9. `.claude/commands/delivery.md` - handoff format

If a local source file is missing, report `needs verification`; do not invent replacement rules.

## Input

```txt
Task:
$ARGUMENTS
```

## Required behavior

Follow the shared `/audit` chain:

```txt
understand target
-> resolve project repo
-> inspect project rules
-> inspect relevant code deeply
-> trace route/component/state/data/style/test chain
-> evaluate UX/UI/product/technical layers
-> map symptoms to code-level findings
-> create/update GitHub issue
-> return short /delivery prompt
```

Create or update the issue in the resolved canonical repo. For auth-gated screens, use auth-safe evidence and do not request credentials, cookies, tokens, or secrets.

Final chat response must stay short: audit status, issue URL, and a copy-pasteable prompt that starts with `/delivery`.
