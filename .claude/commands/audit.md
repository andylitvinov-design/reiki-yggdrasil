# /audit

Use `docs/audit-loop.md`.

`/audit` means diagnostic mode, not implementation mode.

Do not edit app code by default.  
Do not commit product fixes, push implementation changes, merge, deploy, or modify production data.

The goal is to turn the user's screenshot, vague problem, URL, or suspected bug into:

1. a problem diagnosis;
2. a more user-friendly target interface;
3. deep code investigation when repository access is available;
4. confirmed code problems and implementation risks;
5. a GitHub issue containing the full technical instruction;
6. a short chat response with the issue link and a concise ready-to-run `/delivery` prompt.

Input:

```txt
Task:
$ARGUMENTS
```

Follow the audit protocol:

1. Identify target page, route, screenshot, component, or flow.
2. Extract the audit contract from the user request.
3. Use project rules from `AGENTS.md`, `.claude/commands/delivery.md`, `docs/audit-loop.md`, and delivery/auth-boundary docs.
4. If a screenshot is provided, redesign the visible interface conceptually into a friendlier, simpler version.
5. Inspect likely route/component/style/data/state files deeply. Follow imports to shared components and helpers. Do not invent code evidence.
6. Map UI symptoms to specific code-level findings, hypotheses, and technical change directions.
7. Mark unknowns as `NOT VERIFIED`.
8. For auth-gated cabinet pages, use auth-safe evidence and never ask for credentials/cookies/tokens/secrets.
9. Create or update a GitHub issue with the full audit report and technical implementation instructions.
10. Return only a short response: audit status, issue link, and concise `/delivery` prompt pointing to that issue.

Default final statuses:

```txt
STATUS: AUDIT_COMPLETE
STATUS: AUDIT_PARTIAL_AUTH_LIMITATION
STATUS: AUDIT_BLOCKED
STATUS: AUDIT_COMPLETE_ISSUE_NOT_CREATED
```

If GitHub Issues are unavailable, output the full issue body in chat and use `STATUS: AUDIT_COMPLETE_ISSUE_NOT_CREATED`.

If the user explicitly asks to implement after the audit, switch to `/delivery`.
