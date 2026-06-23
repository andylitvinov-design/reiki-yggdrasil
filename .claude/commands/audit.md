# /audit

Use `docs/audit-loop.md`.

`/audit` means diagnostic mode, not implementation mode.

Do not edit code by default.  
Do not commit, push, merge, deploy, or modify production data.

The goal is to turn the user's screenshot, vague problem, URL, or suspected bug into:

1. a problem diagnosis;
2. a more user-friendly target interface;
3. code/component mapping when repository access is available;
4. a technical instruction for implementation;
5. a ready-to-run `/delivery` prompt.

Input:

```txt
Task:
$ARGUMENTS
```

Follow the audit protocol:

1. Identify target page, route, screenshot, component, or flow.
2. Extract the audit contract from the user request.
3. Use project rules from `AGENTS.md`, `.claude/commands/delivery.md`, and delivery/auth-boundary docs.
4. If a screenshot is provided, redesign the visible interface conceptually into a friendlier, simpler version.
5. If repository access is available, inspect likely route/component/style/data files and map UI symptoms to code.
6. Mark unknowns as `NOT VERIFIED`; do not invent evidence.
7. For auth-gated cabinet pages, use auth-safe evidence and never ask for credentials/cookies/tokens/secrets.
8. End with an audit report, technical instruction, and a ready-to-run `/delivery` prompt.

Default final statuses:

```txt
STATUS: AUDIT_COMPLETE
STATUS: AUDIT_PARTIAL_AUTH_LIMITATION
STATUS: AUDIT_BLOCKED
```

If the user explicitly asks to implement after the audit, switch to `/delivery`.
