# /audit-fin

`/audit-fin` is sufficient by itself.

The user must not need to add extra wording such as “check the formulas”, “study the code”, “find where numbers are calculated”, “create an issue”, “write technical instructions”, “check all source layers”, “list hypotheses”, “choose the most likely cause”, or “return a delivery prompt”.

When the user invokes `/audit-fin`, that invocation means full safe numeric/calculation audit delegation for this repository:

```txt
understand numeric target -> inspect project rules -> inspect code deeply -> trace data flow -> run source-layer matrix -> compare expected vs actual -> list problems -> generate focused hypotheses from failing layers -> evaluate hypotheses -> choose most likely fixes -> create/update GitHub issue -> return short /delivery prompt with issue link
```

## Source of truth

Follow all source-of-truth docs in order:

1. `.claude/commands/audit-fin.md`
2. `docs/audit-fin-loop.md` — full numeric/calculation audit protocol, mandatory source-layer matrix, hypothesis analysis, GitHub issue format, final response format
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
7. Run the mandatory source-layer matrix before hypotheses. Evaluate all layers: visual/displayed value, raw data availability, input parsing, state/selection, formula/business logic, calculation helpers, persistence/hydration, formatting/rounding, rendering/component binding, chart/gauge, async/loading/race, auth/environment, test fixture/proof.
8. Assign each source layer a status: `PASS`, `ISSUE`, `NOT VERIFIED`, or `NOT APPLICABLE`, and problem level: `NONE`, `LOW`, `MEDIUM`, `HIGH`, or `BLOCKER`.
9. Compare expected vs actual. Mark each item as `MATCH`, `MISMATCH`, `MISSING`, `DUPLICATE`, `STALE`, `NOT VERIFIED`, or `NOT APPLICABLE`.
10. Produce a clear problem list: confirmed problems first, then suspected problems, then not-verified risks, each tied to a source layer.
11. Generate focused hypotheses only from source layers marked `ISSUE`, `HIGH`, `BLOCKER`, or important `NOT VERIFIED`. Do not generate a huge generic list.
12. Evaluate hypotheses against evidence. For each hypothesis, state source layer, supporting evidence, contradicting evidence, confidence, and how to verify it.
13. Choose the most likely root cause or root-cause set. Do not choose a hypothesis only because it sounds plausible; it must be supported by code/data/screenshot evidence. If evidence is insufficient, state `MOST LIKELY: NOT VERIFIED` and the exact proof needed.
14. Compare solution options. For each option, assess source layer fixed, correctness, risk, scope, data safety, regression risk, and verification effort.
15. Select the recommended solution path and explain why other options were rejected or deferred.
16. Evaluate mandatory numeric audit dimensions from `docs/audit-fin-loop.md`.
17. Create or update a GitHub issue with the full numeric audit report and technical implementation instructions.
18. Return only a short response: audit-fin status, issue link, and concise `/delivery` prompt pointing to that issue.

## Financial/numeric analysis standard

Treat numeric mistakes as high-trust failures. The audit must be financially and technically precise.

For every important number, check:

- source field;
- data availability;
- data type and parsing;
- state selection;
- formula;
- unit/currency/percent basis;
- date/time period;
- aggregation level;
- rounding stage;
- display formatting;
- storage field;
- reload/hydration behavior;
- rendering binding;
- chart/table/card consistency.

Never silently accept a number if the formula or source data is unclear. Mark it `NOT VERIFIED` and create a verification step.

If raw data is insufficient, do not keep chasing display-only fixes. State that the source layer is data availability or data proof, and make the solution path include data requirements.

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
- source-layer matrix;
- expected vs actual table;
- problem list;
- hypothesis list;
- hypothesis evaluation;
- selected most likely root cause;
- solution options;
- recommended solution path;
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
Ключевые требования: следовать source-layer matrix, выбранной причине и recommended solution path из issue.
```

## Required behavior

Do not say “numbers are correct” unless the numeric contract was actually checked.

Do not say “verified” unless there is evidence.

Do not invent values from an unclear screenshot. Use `VISUAL UNCLEAR` or `NOT VERIFIED`.

Do not invent code evidence. Use `NOT VERIFIED` for unknowns.

Do not skip the source-layer matrix. `/audit-fin` must assess problem status across all source layers before hypotheses.

Do not skip the hypothesis phase. `/audit-fin` must list focused hypotheses from failing/unverified source layers, evaluate them, and choose the most likely one before writing the implementation prompt.

Do not generate a huge unfocused hypothesis list. Prefer fewer, evidence-backed hypotheses tied to source layers.

Do not write code during `/audit-fin` unless the user explicitly asks to continue to `/delivery`.
