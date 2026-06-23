# /audit

`/audit` is sufficient by itself.

The user must not need to add extra wording such as “study the code”, “create an issue”, “write technical instructions”, “check mobile”, “check save”, or “return a delivery prompt”.

When the user invokes `/audit`, that invocation means full safe audit delegation for this repository:

```txt
understand target -> inspect project rules -> inspect code deeply -> evaluate UX/UI/product/technical layers -> create/update GitHub issue -> return short /delivery prompt with issue link
```

## Source of truth

Follow all source-of-truth docs in order:

1. `.claude/commands/audit.md`
2. `docs/audit-loop.md` — full audit protocol, mandatory dimensions, GitHub issue format, final response format
3. `AGENTS.md` — project adapter and safety rules
4. `.claude/commands/delivery.md` — implementation handoff contract
5. `docs/delivery-auth-boundary-standard.md` — auth-gated cabinet verification boundary
6. `docs/delivery-loop-program.md` — delivery handoff context
7. `docs/delivery-loop-source-patterns-and-live-proof.md` — live proof context for final implementation

If a local source-of-truth doc is missing, report `needs verification` and do not invent replacement rules.

## Mode

`/audit` is diagnostic mode, not implementation mode.

Do not edit app code by default.  
Do not commit product fixes, push implementation changes, merge, deploy, or modify production data.

`/audit` may create or update GitHub issues because the issue is the audit output, not implementation.

Switch to implementation only if the user explicitly says:

```txt
continue to /delivery
implement these findings
apply this audit
```

## Input

```txt
Task:
$ARGUMENTS
```

If `$ARGUMENTS` is short, vague, or only contains a screenshot/URL, still run the audit using the available evidence. Mark unknowns as `NOT VERIFIED`; do not ask for clarification unless the target cannot be identified at all.

## Required audit chain

Run the full audit chain:

1. Identify the target page, route, screenshot, component, feature, or user flow.
2. Extract the audit contract from the user request.
3. Read the source-of-truth docs listed above.
4. Inspect likely route/component/style/data/state files deeply. Follow imports to shared components and helpers.
5. If a screenshot is provided, redesign the visible interface conceptually into a friendlier, simpler version.
6. Evaluate all mandatory audit dimensions from `docs/audit-loop.md`, including:
   - user friendliness and visual quality;
   - desktop layout;
   - mobile layout;
   - interaction and clickability;
   - data saving, persistence, and history;
   - auth, privacy, and protected routes;
   - technical code quality;
   - regression risk and blast radius;
   - content and language quality;
   - accessibility and resilience;
   - product flow and user journey;
   - root-cause analysis;
   - priority, severity, effort, and confidence;
   - edge cases and negative paths;
   - testability and verification design;
   - observability and debug evidence;
   - implementation slicing;
   - rollback and safety plan.
7. Map UI/product symptoms to specific code-level findings, hypotheses, and technical change directions.
8. Identify confirmed code problems separately from UX/product improvements.
9. Create or update a GitHub issue with the full audit report and technical implementation instructions.
10. Return only a short response: audit status, issue link, and concise `/delivery` prompt pointing to that issue.

## Auth-gated cabinet rule

For profile, cabinet, admin, results, intake, client, or private pages behind Google/Supabase auth:

- never ask for credentials, cookies, tokens, or secrets;
- never attempt to bypass auth;
- never claim authenticated production visual verification unless actually performed;
- use code-level proof, local/demo/fixture state, public route, login entry, protected redirect, and owner-provided screenshots as safe substitute evidence;
- use `STATUS: AUDIT_PARTIAL_AUTH_LIMITATION` when only authenticated production visual proof is unavailable.

## GitHub issue output

Every completed `/audit` should create or update a GitHub issue unless GitHub Issues are unavailable.

The GitHub issue must contain the full technical detail:

- audit status;
- user request;
- target;
- audit contract;
- user-friendly target interface;
- mandatory audit dimensions table;
- findings;
- root-cause map;
- priority scoring;
- deep code investigation;
- confirmed code problems;
- UX/product improvements;
- edge cases;
- technical implementation plan;
- do-not-touch rules;
- data/auth safety;
- regression risks;
- implementation slicing;
- rollback/safety plan;
- verification plan;
- acceptance criteria;
- ready-to-run `/delivery` prompt.

If an existing open issue clearly covers the same audit target and problem, update/comment on that issue instead of creating a duplicate.

If GitHub Issues are unavailable, output the full issue body in chat and use:

```txt
STATUS: AUDIT_COMPLETE_ISSUE_NOT_CREATED
```

## Chat output

Do not duplicate the full technical issue body in chat when a GitHub issue was created.

Return only:

```txt
STATUS: AUDIT_COMPLETE | AUDIT_PARTIAL_AUTH_LIMITATION | AUDIT_BLOCKED | AUDIT_COMPLETE_ISSUE_NOT_CREATED

GitHub issue:
<issue URL>

Короткий prompt для Codex/Claude:
/delivery
Task:
Исправить проблему по issue <issue URL>.
Ключевые требования: ...
```

## Required behavior

Do not say “everything is fine” unless the audit contract was actually checked.

Do not say “verified” unless there is evidence.

Do not invent code evidence. Use `NOT VERIFIED` for unknowns.

Do not write code during `/audit` unless the user explicitly asks to continue to `/delivery`.
