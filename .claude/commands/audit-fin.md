# /audit-fin

`/audit-fin` is sufficient by itself.

The user must not need to add extra wording such as “check the formulas”, “study the code”, “find where numbers are calculated”, “create an issue”, “write technical instructions”, or “return a delivery prompt”.

When the user invokes `/audit-fin`, that invocation means full safe numeric/calculation audit delegation for this repository:

```txt
understand numeric target -> inspect project rules -> inspect code deeply -> trace data flow -> verify calculations/display/persistence -> create/update GitHub issue -> return short /delivery prompt with issue link
```

## Source of truth

Follow all source-of-truth docs in order:

1. `.claude/commands/audit-fin.md`
2. `docs/audit-fin-loop.md` — full numeric/calculation audit protocol, mandatory dimensions, GitHub issue format, final response format
3. `AGENTS.md` — project adapter and safety rules
4. `docs/audit-loop.md` — general UX/technical audit context
5. `.claude/commands/delivery.md` — implementation handoff contract
6. `docs/delivery-auth-boundary-standard.md` — auth-gated cabinet verification boundary
7. `docs/delivery-loop-program.md` — delivery handoff context

If a local source-of-truth doc is missing, report `needs verification` and do not invent replacement rules.

## Mode

`/audit-fin` is diagnostic mode, not implementation mode.

Do not edit app code by default.  
Do not commit product fixes, push implementation changes, merge, deploy, modify production data, or change formulas.

`/audit-fin` may create or update GitHub issues because the issue is the audit output, not implementation.

Switch to implementation only if the user explicitly says:

```txt
continue to /delivery
implement these findings
apply this audit-fin
fix the calculations
```

## Input

```txt
Task:
$ARGUMENTS
```

If `$ARGUMENTS` is short, vague, or only contains a screenshot/URL/table, still run the audit using the available evidence. Mark unknowns as `NOT VERIFIED` or `VISUAL UNCLEAR`; do not ask for clarification unless the numeric target cannot be identified at all.

## Required audit chain

Run the full audit-fin chain:

1. Identify the target page, route, screenshot, component, metric, table, report, calculator, score, or user flow.
2. Extract the numeric contract from the user request and code/docs: expected values, formulas, labels, thresholds, date periods, units, and display rules.
3. Extract visible numbers from screenshot/description/code/fixtures. Mark unclear screenshot values as `VISUAL UNCLEAR`.
4. Read the source-of-truth docs listed above.
5. Inspect code deeply. Find where numbers are computed, stored, loaded, transformed, rounded, formatted, and displayed. Follow imports to shared helpers/components.
6. Trace data flow: input -> state -> calculation -> derived value -> persistence -> hydration -> display.
7. Compare expected vs actual. Mark each item as `MATCH`, `MISMATCH`, `MISSING`, `DUPLICATE`, `STALE`, `NOT VERIFIED`, or `NOT APPLICABLE`.
8. Identify root causes: formula error, data mapping error, stale state, persistence bug, rounding/formatting error, display bug, missing data, regression, or unclear source rule.
9. Evaluate mandatory numeric audit dimensions from `docs/audit-fin-loop.md`, including:
   - visible numeric correctness;
   - formula and calculation correctness;
   - data source and data flow;
   - rounding, formatting, and localization;
   - missing and inconsistent values;
   - state, persistence, and history safety;
   - UI interpretation and user trust;
   - desktop/mobile display of numbers;
   - charts, gauges, and visual indicators;
   - edge cases and negative paths;
   - regression and blast radius;
   - testability and proof plan.
10. Create or update a GitHub issue with the full numeric audit report and technical implementation instructions.
11. Return only a short response: audit-fin status, issue link, and concise `/delivery` prompt pointing to that issue.

## Auth-gated cabinet rule

For profile, cabinet, admin, results, intake, client, or private pages behind Google/Supabase auth:

- never ask for credentials, cookies, tokens, or secrets;
- never attempt to bypass auth;
- never claim authenticated production numeric proof unless actually performed;
- use screenshot, code-level proof, local/demo/fixture state, public route, login entry, protected redirect, and owner-provided expected values as safe substitute evidence;
- use `STATUS: AUDIT_FIN_PARTIAL_AUTH_LIMITATION` when only authenticated production numeric proof is unavailable.

## GitHub issue output

Every completed `/audit-fin` should create or update a GitHub issue unless GitHub Issues are unavailable.

The GitHub issue must contain the full technical detail:

- audit-fin status;
- user request;
- target page/component/metric;
- numeric contract;
- visible numbers/displayed values;
- expected vs actual table;
- formula and calculation audit;
- data-flow trace;
- deep code investigation;
- confirmed numeric/code problems;
- root-cause map;
- priority scoring;
- technical implementation plan;
- do-not-touch rules;
- data/auth safety;
- regression risks;
- verification plan;
- acceptance criteria;
- ready-to-run `/delivery` prompt.

If an existing open issue clearly covers the same numeric target and problem, update/comment on that issue instead of creating a duplicate.

If GitHub Issues are unavailable, output the full issue body in chat and use:

```txt
STATUS: AUDIT_FIN_COMPLETE_ISSUE_NOT_CREATED
```

## Chat output

Do not duplicate the full technical issue body in chat when a GitHub issue was created.

Return only:

```txt
STATUS: AUDIT_FIN_COMPLETE | AUDIT_FIN_PARTIAL_AUTH_LIMITATION | AUDIT_FIN_BLOCKED | AUDIT_FIN_COMPLETE_ISSUE_NOT_CREATED

GitHub issue:
<issue URL>

Короткий prompt для Codex/Claude:
/delivery
Task:
Исправить числовые/расчетные ошибки по issue <issue URL>.
Ключевые требования: ...
```

## Required behavior

Do not say “numbers are correct” unless the numeric contract was actually checked.

Do not say “verified” unless there is evidence.

Do not invent values from an unclear screenshot. Use `VISUAL UNCLEAR` or `NOT VERIFIED`.

Do not invent code evidence. Use `NOT VERIFIED` for unknowns.

Do not write code during `/audit-fin` unless the user explicitly asks to continue to `/delivery`.
