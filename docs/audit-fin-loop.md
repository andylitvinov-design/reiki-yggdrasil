# /audit-fin — Numeric, Calculation, and Financial Logic Audit Protocol

Status: reusable diagnostic protocol  
Command: `/audit-fin`  
Purpose: audit screens, reports, dashboards, calculators, client summaries, result pages, financial tables, metrics, and any UI that contains numbers, scores, totals, dates, prices, percentages, balances, counts, or calculated indicators.

`/audit-fin` is diagnostic by default. It does not edit code, commit product fixes, push implementation changes, merge, deploy, modify production data, or change formulas unless the user explicitly asks to continue to `/delivery`.

`/audit-fin` is similar to `/audit`, but it is specialized for numbers and calculations. The priority is correctness of values, formulas, display, persistence, and source data.

## 1. What /audit-fin does

Use `/audit-fin` when the user provides a screenshot, URL, report, table, dashboard, client/result page, calculator output, or asks whether numbers are correct.

`/audit-fin` must produce:

1. a numeric correctness diagnosis;
2. a calculation and formula audit;
3. a code-level investigation of where numbers are computed, stored, transformed, rounded, formatted, and displayed;
4. identification of missing, duplicated, stale, or incorrect values;
5. root-cause analysis for any numeric discrepancy;
6. a GitHub issue with full technical instructions;
7. a short chat response with the issue link and a concise `/delivery` prompt.

Short form:

```txt
screenshot / table / dashboard / report / complaint
-> extract expected numeric contract
-> inspect visible numbers
-> inspect code formulas and data flow
-> compare expected vs actual
-> find discrepancies and likely root causes
-> create GitHub issue with full technical instructions
-> return short /delivery prompt linking to the issue
```

## 2. Audit-fin is not delivery

By default, `/audit-fin` must not implement. It stops after creating or updating the GitHub issue and returning a short prompt.

Switch to implementation only if the user explicitly says:

```txt
continue to /delivery
implement these findings
apply this audit-fin
fix the calculations
```

## 3. Source of truth

Before judging numbers, use these sources in order:

1. User request  
   Screenshot, report, route, expected values, complaint, or business rule.

2. Project instructions  
   Read when available:
   - `AGENTS.md`
   - `.claude/commands/audit-fin.md`
   - `docs/audit-fin-loop.md`
   - `docs/audit-loop.md`
   - `.claude/commands/delivery.md`
   - `docs/delivery-auth-boundary-standard.md`
   - `docs/delivery-loop-program.md`

3. Numeric/business rules in code and docs  
   Search for known formulas, constants, thresholds, score labels, pricing rules, calculation helpers, data schemas, migrations, and tests.

4. Code evidence  
   Repository code is mandatory evidence when available. Inspect the full numeric pipeline:
   - source data;
   - input parsing;
   - state updates;
   - formula helpers;
   - aggregation/reduction logic;
   - rounding and formatting;
   - storage/persistence;
   - loading/hydration;
   - UI rendering;
   - export/print/PDF/report code if relevant.

5. Auth-safe verification limits  
   If a page is behind Google/Supabase/private cabinet auth, do not request credentials, cookies, tokens, or secrets. Use safe evidence: screenshot, code-level proof, local/demo/fixture state, public route, protected redirect, or owner-provided expected values.

## 4. Mandatory numeric audit dimensions

Every `/audit-fin` issue must evaluate the target through these layers. Mark a layer `NOT APPLICABLE` only when it truly does not apply.

### 4.1 Visible numeric correctness

Check the screen/report itself:

- all expected numbers are present;
- no required values are missing;
- no duplicate values appear where one value is expected;
- totals/subtotals match visible line items;
- percentages correspond to raw values;
- scores correspond to selected answers or source data;
- dates and periods are correct;
- labels match the value they describe;
- units/currency/percent symbols are correct;
- zero/empty/null values are shown intentionally and not as accidental blanks.

### 4.2 Formula and calculation correctness

Inspect how values are computed:

- formula matches the business rule;
- numerator/denominator are correct;
- weighting is correct;
- aggregation uses the right fields;
- averages, sums, counts, min/max, ratios, and percentages are correct;
- thresholds and category labels match formulas;
- conditional branches do not skip cases;
- repeated/intake/history calculations do not mix datasets incorrectly;
- no stale cached values are used after source changes.

### 4.3 Data source and data flow

Trace values from input to display:

- where the raw input comes from;
- where it is stored;
- how it is transformed;
- where derived metrics are saved;
- how it is loaded back;
- whether old data shape is still supported;
- whether client/template/session/date selection affects the value;
- whether localStorage/Supabase/API values can diverge.

### 4.4 Rounding, formatting, and localization

Check number display rules:

- rounding precision is correct;
- decimals are not lost too early;
- percent values are not double-multiplied or divided by 100 twice;
- currency formatting is correct;
- thousands/decimal separators are appropriate for UI language;
- negative values are displayed safely;
- `NaN`, `Infinity`, `undefined`, and `null` cannot appear in UI;
- small values and zero values are not hidden incorrectly.

### 4.5 Missing and inconsistent values

Check for omissions and mismatches:

- hidden sections with missing metrics;
- summary value not matching detail value;
- card value not matching chart/table value;
- first-date value not matching second-date value;
- displayed date not matching data date;
- selected client value not matching another client’s data;
- stale value after changing filters/tabs/client/date.

### 4.6 State, persistence, and history safety

Check saving and history behavior:

- submit/save handler stores all needed numeric fields;
- repeat/history entries preserve their own calculated values;
- primary intake/results data is not overwritten by repeat/history data unless explicitly requested;
- recalculation after edit is correct;
- old records remain readable;
- migration/backward compatibility is preserved;
- deleting/changing a client/template/session does not orphan values incorrectly.

### 4.7 UI interpretation and user trust

Check whether the user can understand the numbers:

- number labels are clear;
- metric meaning is obvious;
- units are visible;
- score ranges are explained briefly;
- trend/difference is not misleading;
- color/visual emphasis does not exaggerate or hide values;
- empty states explain missing data;
- warnings appear when calculation is incomplete.

### 4.8 Desktop/mobile display of numbers

Check responsive numeric UI:

- tables/cards do not overflow;
- columns remain readable;
- long labels wrap without breaking numbers;
- critical values are visible on mobile;
- charts/tables remain usable on 360–430px widths;
- sticky/fixed bars do not cover totals or buttons;
- date/metric comparison remains clear on mobile.

### 4.9 Charts, gauges, and visual indicators

When charts/gauges/speedometers are present, check:

- chart value equals source number;
- axis/min/max/range is correct;
- color bands match thresholds;
- labels and legends match the data;
- first/second-date comparison is not swapped;
- missing data is not plotted as zero unless intended;
- chart rounding matches text value or difference is explained.

### 4.10 Edge cases and negative paths

Check non-happy paths:

- no answers/no input;
- partial answers;
- all zero values;
- max values;
- negative values if possible;
- duplicate submissions;
- switching clients/dates/tabs;
- refreshing after calculation;
- browser back/forward;
- network/save failure;
- stale localStorage;
- missing Supabase session;
- old data shape without newly added fields.

### 4.11 Regression and blast radius

Check what else can break:

- shared calculation helpers;
- shared score labels;
- shared UI cards/tables/charts;
- data model used by other profile/results pages;
- exports/PDF/print views;
- admin/client views;
- previous PRs touching the same formulas or data fields.

### 4.12 Testability and proof plan

The audit must say exactly how the fix can be proven:

- deterministic sample input;
- expected output table;
- manual recalculation steps;
- unit test candidates;
- integration test path;
- browser route/page to open;
- mobile and desktop viewports;
- save/load/history verification;
- auth-safe substitute if post-login live proof is blocked.

## 5. Audit-fin loop

Run this loop:

1. Identify target  
   Page, route, screenshot, component, metric, table, report, score, calculator, or user flow.

2. Extract numeric contract  
   What values should exist, what formulas/rules should apply, and what the user expects to be correct.

3. Extract visible numbers  
   From screenshot/description/code/fixtures. Mark uncertain visual values as `VISUAL UNCLEAR`.

4. Inspect code deeply  
   Find where the numbers are computed, stored, loaded, formatted, and displayed. Follow imports and shared helpers.

5. Trace data flow  
   Input -> state -> calculation -> derived value -> persistence -> hydration -> display.

6. Compare expected vs actual  
   Build a discrepancy table. Mark each item `MATCH`, `MISMATCH`, `MISSING`, `DUPLICATE`, `STALE`, `NOT VERIFIED`, or `NOT APPLICABLE`.

7. Identify root cause  
   Separate formula errors, data mapping errors, stale state, formatting/rounding errors, display bugs, and missing data.

8. Score priority  
   Use severity, user impact, effort, and confidence.

9. Create or update a GitHub issue  
   Save the full numeric audit and technical instructions in GitHub Issues. If an existing open issue clearly covers the same numeric problem, update/comment on that issue instead of creating a duplicate.

10. Return a short chat response  
   Include only the audit status, GitHub issue link, and a concise `/delivery` prompt that points to the issue.

11. Stop  
   Do not implement unless user explicitly asks to continue.

## 6. GitHub issue requirements

Every completed `/audit-fin` should create or update a GitHub issue unless GitHub Issues are unavailable. If GitHub is unavailable, output the full issue body in chat and mark:

```txt
STATUS: AUDIT_FIN_COMPLETE_ISSUE_NOT_CREATED
```

Issue title format:

```txt
[AUDIT-FIN] <area/page/metric>: <short numeric problem summary>
```

Recommended labels when available:

```txt
audit-fin
calculation
bug
data-integrity
regression
auth-limited
```

Use only labels that exist or that the tool can safely create/apply. Do not fail the audit only because labels are missing.

## 7. Required GitHub issue body format

The GitHub issue must contain the full technical detail. Use this structure:

```md
# Audit-fin: <area/page/metric>

## Status
STATUS: AUDIT_FIN_COMPLETE | AUDIT_FIN_PARTIAL_AUTH_LIMITATION | AUDIT_FIN_BLOCKED | AUDIT_FIN_COMPLETE_ISSUE_NOT_CREATED

## User request
<original user request summary>

## Target
- Page/route/component:
- Metric/table/report/calculation:
- Screenshot or evidence:
- Auth status:

## Numeric contract
- Expected value/rule/formula 1
- Expected value/rule/formula 2
- Expected value/rule/formula 3

## Visible numbers / displayed values
| Label | Displayed value | Source evidence | Status |
|---|---:|---|---|

## Expected vs actual
| Metric | Expected | Actual | Status | Evidence | Notes |
|---|---:|---:|---|---|---|

Status values:
- MATCH
- MISMATCH
- MISSING
- DUPLICATE
- STALE
- NOT VERIFIED
- NOT APPLICABLE

## Formula and calculation audit
| Formula/metric | Code location | Rule found | Finding | Fix direction |
|---|---|---|---|---|

## Data-flow trace
```txt
input -> state -> calculation -> derived value -> persistence -> hydration -> display
```

## Deep code investigation
| Code status | File/component/function | What was inspected | Finding |
|---|---|---|---|

Code status values:
- CODE VERIFIED
- LIKELY
- NOT VERIFIED

## Confirmed numeric/code problems
List actual numeric, formula, data-mapping, persistence, rounding, formatting, or display problems found in code.

## Root-cause map
| Symptom | User impact | Code evidence | Likely root cause | Fix direction | Verification |
|---|---|---|---|---|---|

## Priority scoring
| Issue | Severity | User impact | Effort | Confidence | Recommended order |
|---|---|---|---|---|---|

Severity values:
- P0 blocker
- P1 major
- P2 medium
- P3 polish

## Technical implementation plan
### Files to change
- `path/to/file`

### Required changes
- Step-by-step implementation instructions.

### Do not touch
- Protected files/flows/data/auth behavior.

### Data/auth safety
- What must remain safe.

### Regression risks
- What could break.

### Verification plan
- Build/check commands.
- Deterministic sample input.
- Expected output table.
- Manual recalculation steps.
- Unit/integration test suggestions.
- Browser/local/preview/live checks.
- Mobile and desktop checks.
- Save/load/history checks.
- Auth-safe verification limits.

## Acceptance criteria
- [ ] Every expected numeric value is present.
- [ ] Formulas match the numeric contract.
- [ ] Displayed values match stored/calculated values.
- [ ] Rounding/formatting is correct.
- [ ] Save/load/history behavior preserves values correctly.
- [ ] Mobile and desktop displays are readable.

## Ready-to-run /delivery prompt
```txt
/delivery

Task:
Implement the numeric/calculation fixes from this GitHub issue: <issue URL>

Requirements:
- ...

Files/components/functions to inspect first:
- ...

Do not touch:
- ...

Verification:
- ...
```
```

## 8. Chat output format

The chat response after `/audit-fin` should be short. Do not duplicate all technical details if a GitHub issue was created.

Use this structure:

```txt
STATUS: AUDIT_FIN_COMPLETE

GitHub issue:
<issue URL>

Короткий prompt для Codex/Claude:
/delivery
Task:
Исправить числовые/расчетные ошибки по issue <issue URL>.
Ключевые требования: ...
```

For auth-limited audits:

```txt
STATUS: AUDIT_FIN_PARTIAL_AUTH_LIMITATION

GitHub issue:
<issue URL>

Ограничение: production post-login numeric proof недоступен из-за Google/Supabase auth. Проверка выполнена по коду/скрину/доступным безопасным данным.

Короткий prompt для Codex/Claude:
...
```

## 9. Required behavior

Do not say “numbers are correct” unless the numeric contract was checked.

Do not say “verified” unless evidence exists.

Do not invent values from an unclear screenshot. Mark them `VISUAL UNCLEAR` or `NOT VERIFIED`.

Do not claim authenticated production cabinet numeric proof unless it actually was performed.

Do not block only because Google/Supabase auth prevents post-login production access. Use auth-safe audit-fin status instead.

Do not write code during `/audit-fin` unless the user explicitly asks to continue to `/delivery`.

Do not leave the full technical instruction only in chat when GitHub Issues are available. Save it as an issue and return a short prompt with the link.
