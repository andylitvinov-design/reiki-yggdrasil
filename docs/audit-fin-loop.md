# /audit-fin — Numeric, Calculation, and Financial Logic Audit Protocol

Status: reusable diagnostic protocol  
Command: `/audit-fin`  
Purpose: audit screens, reports, dashboards, calculators, client summaries, result pages, financial tables, metrics, and any UI that contains numbers, scores, totals, dates, prices, percentages, balances, counts, or calculated indicators.

`/audit-fin` is diagnostic by default. It does not edit code, commit product fixes, push implementation changes, merge, deploy, modify production data, or change formulas unless the user explicitly asks to continue to `/delivery`.

`/audit-fin` is not a free-form hypothesis generator. It must first check all possible source layers of a numeric problem, score the state of each layer, and only then generate a small set of evidence-backed hypotheses and a recommended solution path.

## 1. What /audit-fin does

Use `/audit-fin` when the user provides a screenshot, URL, report, table, dashboard, client/result page, calculator output, or asks whether numbers are correct.

`/audit-fin` must produce:

1. a numeric correctness diagnosis;
2. a financial/business logic audit;
3. a source-layer audit across all possible origins of numeric problems;
4. a calculation and formula audit;
5. a code-level investigation of where numbers are computed, stored, transformed, rounded, formatted, and displayed;
6. identification of missing, duplicated, stale, or incorrect values;
7. a problem list;
8. a limited hypothesis list grounded in the source-layer evidence;
9. hypothesis evaluation and confidence scoring;
10. selection of the most likely root cause or root-cause set;
11. solution options and a recommended solution path;
12. a GitHub issue with full technical instructions;
13. a short chat response with the issue link and a concise `/delivery` prompt.

Short form:

```txt
screenshot / table / dashboard / report / complaint
-> extract numeric contract
-> inspect visible numbers
-> run source-layer audit across all levels
-> inspect formulas and code data flow
-> compare expected vs actual
-> list confirmed/suspected/not-verified problems
-> generate only evidence-backed hypotheses
-> evaluate hypotheses against source-layer evidence
-> choose likely root cause
-> compare solution options
-> create GitHub issue with full instructions
-> return short /delivery prompt linking to the issue
```

## 2. Anti-pattern this protocol prevents

Do not do this:

```txt
see wrong number -> guess many possible causes -> fix one hypothesis -> no effect -> guess again
```

This failed pattern creates many hypotheses but does not locate the real source layer. It often misclassifies data/source problems as display problems or misses that the dataset is incomplete.

Correct pattern:

```txt
see wrong number -> inspect every source layer -> score each layer -> identify where evidence first diverges -> generate hypotheses only around the failing layers -> choose recommended fix -> verify with deterministic expected values
```

## 3. Audit-fin is not delivery

By default, `/audit-fin` must not implement. It stops after creating or updating the GitHub issue and returning a short prompt.

Switch to implementation only if the user explicitly says:

```txt
continue to /delivery
implement these findings
apply this audit-fin
fix the calculations
```

## 4. Source of truth

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
   - fixture/demo data;
   - input parsing;
   - state updates;
   - formula helpers;
   - aggregation/reduction logic;
   - weighting logic;
   - threshold/category logic;
   - rounding and formatting;
   - storage/persistence;
   - loading/hydration;
   - UI rendering;
   - charts/gauges/tables;
   - export/print/PDF/report code if relevant.

5. Auth-safe verification limits  
   If a page is behind Google/Supabase/private cabinet auth, do not request credentials, cookies, tokens, or secrets. Use safe evidence: screenshot, code-level proof, local/demo/fixture state, public route, protected redirect, or owner-provided expected values.

## 5. Mandatory source-layer audit

Before generating hypotheses or recommending fixes, `/audit-fin` must evaluate every layer below.

For each layer, assign:

```txt
Layer status: PASS | ISSUE | NOT VERIFIED | NOT APPLICABLE
Problem level: NONE | LOW | MEDIUM | HIGH | BLOCKER
Evidence:
Gap:
Next verification:
```

### 5.1 Visual/displayed value layer

Check what is visible on the screenshot/page/report:

- which numbers are displayed;
- which expected numbers are missing;
- whether visible values are readable or `VISUAL UNCLEAR`;
- whether labels, units, dates, and periods match the values;
- whether the same metric appears with different values in different UI places.

### 5.2 Raw data availability layer

Check whether enough source data exists to calculate the requested values:

- all required fields are present;
- required client/session/date records exist;
- repeated/history records exist when comparison is expected;
- old data shape has required fields or migration fallback;
- absent values are distinguished from zero values;
- incomplete data is surfaced to the user instead of silently computed as zero.

If data is insufficient, the audit must not keep chasing display fixes. It must mark the source layer as `ISSUE` or `NOT VERIFIED` and include data requirements in the fix.

### 5.3 Input parsing and normalization layer

Check how raw values enter the app:

- strings converted to numbers correctly;
- empty strings/null/undefined handled safely;
- percentages parsed in correct basis;
- currency/decimal separators handled;
- date strings/time zones normalized;
- IDs for client/template/session/date are stable.

### 5.4 State and selection layer

Check whether the UI is using the intended state:

- selected client is correct;
- selected session/date is correct;
- selected test/form/template is correct;
- first-date and second-date states are not swapped;
- current vs baseline values are not mixed;
- stale state is not used after navigation/filter changes.

### 5.5 Formula and business logic layer

Check the actual formula rules:

- formula matches the product/financial rule;
- numerator and denominator are correct;
- weighting is correct;
- aggregation level is correct;
- thresholds/categories are correct;
- comparison and delta direction are correct;
- partial data rules are explicit.

### 5.6 Calculation helper/code layer

Check implementation details:

- helper functions receive expected arguments;
- helper functions return expected shape;
- reducers/maps/filters use correct fields;
- conditional branches do not skip cases;
- memoization/cache dependencies are complete;
- no duplicate calculation paths disagree.

### 5.7 Persistence and hydration layer

Check saved values and reloaded values:

- save handler stores all necessary numeric fields;
- localStorage/Supabase/API shape matches load code;
- derived values are either recalculated intentionally or stored intentionally;
- history/repeat entries preserve their own values;
- primary intake/results are not overwritten by repeat/history unless explicitly requested;
- old records remain readable.

### 5.8 Formatting and rounding layer

Check display transformations:

- rounding happens at the correct stage;
- precision is correct;
- percent values are not multiplied/divided twice;
- `NaN`, `Infinity`, `undefined`, and `null` cannot appear;
- negative and zero values display intentionally;
- localization is correct.

### 5.9 Rendering and component binding layer

Check whether the UI displays the right variable:

- card/table/chart reads the intended field;
- label points to the correct metric;
- props passed to children are correct;
- fallback values are safe;
- no placeholder/demo value leaks into real UI;
- no wrong metric reused by copy/paste.

### 5.10 Chart/gauge/indicator layer

Check visual numeric components:

- source number equals chart/gauge value;
- min/max/range is correct;
- thresholds/color bands are correct;
- first/second-date comparison is not swapped;
- missing data is not plotted as zero unless intended;
- chart value matches text value or difference is explained.

### 5.11 Async/loading/race layer

Check timing issues:

- loading state does not show stale old numbers;
- async fetch does not overwrite newer selected data;
- repeated submit does not duplicate values;
- refresh/back/forward does not show stale values;
- derived values update after data changes.

### 5.12 Auth/environment layer

Check environment boundaries:

- production auth does not hide required proof without being documented;
- public/login/protected redirect behaves safely;
- local/demo/fixture data is clearly separated from production;
- no credentials/tokens/secrets are required or requested.

### 5.13 Test fixture and proof layer

Check whether the problem can be proven:

- deterministic input exists;
- expected output table exists;
- manual recalculation is possible;
- unit/integration test target is identifiable;
- screenshot alone is not treated as complete proof if raw values are needed.

## 6. Mandatory numeric audit dimensions

After the source-layer audit, evaluate the target through these dimensions. Mark a layer `NOT APPLICABLE` only when it truly does not apply.

### 6.1 Visible numeric correctness

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

### 6.2 Financial/business logic correctness

Check the business meaning behind the numbers:

- each metric has a clear financial/product meaning;
- money, score, percentage, count, and ratio are not mixed;
- base period is correct;
- comparison period is correct;
- first/second date semantics are not swapped;
- baseline vs current value is clear;
- trend/delta is computed from the correct direction;
- user-facing interpretation does not overstate uncertain or partial data;
- summary number matches detailed calculation logic.

### 6.3 Formula and calculation correctness

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

### 6.4 Data source and data flow

Trace values from input to display:

- where the raw input comes from;
- where it is stored;
- how it is transformed;
- where derived metrics are saved;
- how it is loaded back;
- whether old data shape is still supported;
- whether client/template/session/date selection affects the value;
- whether localStorage/Supabase/API values can diverge.

### 6.5 Rounding, formatting, and localization

Check number display rules:

- rounding precision is correct;
- decimals are not lost too early;
- percent values are not double-multiplied or divided by 100 twice;
- currency formatting is correct;
- thousands/decimal separators are appropriate for UI language;
- negative values are displayed safely;
- `NaN`, `Infinity`, `undefined`, and `null` cannot appear in UI;
- small values and zero values are not hidden incorrectly.

### 6.6 Missing and inconsistent values

Check for omissions and mismatches:

- hidden sections with missing metrics;
- summary value not matching detail value;
- card value not matching chart/table value;
- first-date value not matching second-date value;
- displayed date not matching data date;
- selected client value not matching another client’s data;
- stale value after changing filters/tabs/client/date.

### 6.7 State, persistence, and history safety

Check saving and history behavior:

- submit/save handler stores all needed numeric fields;
- repeat/history entries preserve their own calculated values;
- primary intake/results data is not overwritten by repeat/history data unless explicitly requested;
- recalculation after edit is correct;
- old records remain readable;
- migration/backward compatibility is preserved;
- deleting/changing a client/template/session does not orphan values incorrectly.

### 6.8 UI interpretation and user trust

Check whether the user can understand the numbers:

- number labels are clear;
- metric meaning is obvious;
- units are visible;
- score ranges are explained briefly;
- trend/difference is not misleading;
- color/visual emphasis does not exaggerate or hide values;
- empty states explain missing data;
- warnings appear when calculation is incomplete.

### 6.9 Desktop/mobile display of numbers

Check responsive numeric UI:

- tables/cards do not overflow;
- columns remain readable;
- long labels wrap without breaking numbers;
- critical values are visible on mobile;
- charts/tables remain usable on 360–430px widths;
- sticky/fixed bars do not cover totals or buttons;
- date/metric comparison remains clear on mobile.

### 6.10 Charts, gauges, and visual indicators

When charts/gauges/speedometers are present, check:

- chart value equals source number;
- axis/min/max/range is correct;
- color bands match thresholds;
- labels and legends match the data;
- first/second-date comparison is not swapped;
- missing data is not plotted as zero unless intended;
- chart rounding matches text value or difference is explained.

### 6.11 Edge cases and negative paths

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

### 6.12 Regression and blast radius

Check what else can break:

- shared calculation helpers;
- shared score labels;
- shared UI cards/tables/charts;
- data model used by other profile/results pages;
- exports/PDF/print views;
- admin/client views;
- previous PRs touching the same formulas or data fields.

### 6.13 Testability and proof plan

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

## 7. Source-layer-first problem diagnosis

This is mandatory and must happen before hypothesis generation.

Output a source-layer matrix:

| Source layer | Layer status | Problem level | Evidence | Gap | Next verification |
|---|---|---|---|---|---|

Layer statuses:

- `PASS`
- `ISSUE`
- `NOT VERIFIED`
- `NOT APPLICABLE`

Problem levels:

- `NONE`
- `LOW`
- `MEDIUM`
- `HIGH`
- `BLOCKER`

Source layers must include at least:

1. Visual/displayed value.
2. Raw data availability.
3. Input parsing and normalization.
4. State and selection.
5. Formula and business logic.
6. Calculation helper/code.
7. Persistence and hydration.
8. Formatting and rounding.
9. Rendering and component binding.
10. Chart/gauge/indicator.
11. Async/loading/race.
12. Auth/environment.
13. Test fixture and proof.

If a lower upstream layer is `ISSUE` or `NOT VERIFIED`, do not prematurely conclude that the problem is in a downstream display/rendering layer. State the upstream uncertainty first.

## 8. Problem-hypothesis-solution loop

This is mandatory for `/audit-fin`, but it starts only after the source-layer matrix.

### 8.1 Problem list

Output a problem list before proposing fixes.

Separate:

- `CONFIRMED` — supported by code/data/screenshot evidence;
- `SUSPECTED` — plausible but not fully proven;
- `NOT VERIFIED RISK` — important risk that could not be checked safely.

Problem format:

```txt
Problem:
Type: CONFIRMED | SUSPECTED | NOT VERIFIED RISK
Evidence:
User impact:
Code/data location:
Severity:
Source layer:
```

### 8.2 Hypothesis generation rules

Do not generate dozens of generic hypotheses.

Generate hypotheses only from source layers marked `ISSUE`, `HIGH`, `BLOCKER`, or important `NOT VERIFIED`.

For each important discrepancy, generate usually 2–5 focused hypotheses, not a long uncontrolled list.

Common hypothesis categories:

- insufficient raw data;
- wrong formula;
- wrong source field;
- wrong denominator/numerator;
- wrong weighting;
- wrong aggregation level;
- stale state or cache;
- localStorage/Supabase divergence;
- old data shape/migration gap;
- wrong client/session/date selection;
- rounding too early;
- percent multiplied/divided incorrectly;
- display formatting bug;
- chart/gauge threshold mismatch;
- comparison dates swapped;
- UI label points to wrong metric;
- regression from shared helper/component.

### 8.3 Hypothesis evaluation

Evaluate each hypothesis before choosing a solution.

Use this table:

| Hypothesis | Source layer | Supporting evidence | Contradicting evidence | Confidence | Verification step | Decision |
|---|---|---|---|---|---|---|

Confidence values:

- `high`
- `medium`
- `low`

Decision values:

- `KEEP_AS_LIKELY`
- `REJECT`
- `DEFER_NOT_VERIFIED`

### 8.4 Most likely root cause selection

After evaluating hypotheses, choose the most likely root cause or root-cause set.

Rules:

- do not choose only one cause if evidence points to multiple interacting causes;
- do not choose a hypothesis without code/data/screenshot evidence;
- if evidence is insufficient, mark `MOST LIKELY: NOT VERIFIED` and write the exact verification needed;
- if data is insufficient, state that the primary issue is data availability, not display;
- if a fix depends on a business rule, mark it as `NEEDS_PRODUCT_RULE_CONFIRMATION` unless the rule is already clear in code/docs/user request.

### 8.5 Solution options

List possible solution approaches before recommending one.

Use this table:

| Option | What changes | Source layer fixed | Pros | Cons/Risks | Effort | Verification | Decision |
|---|---|---|---|---|---|---|---|

Decision values:

- `RECOMMENDED`
- `VALID_BUT_DEFER`
- `REJECT`

### 8.6 Recommended implementation path

Only after source-layer matrix, problem list, hypothesis evaluation, and solution comparison, write the implementation path.

It must include:

- which source layer is the primary fix target;
- what to fix first;
- what formula/data path to change;
- what display path to change;
- what persistence/history behavior to preserve;
- what tests/checks to add or run;
- what should not be touched.

## 9. Audit-fin loop

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

6. Run source-layer matrix  
   Evaluate every source layer before generating hypotheses.

7. Compare expected vs actual  
   Build a discrepancy table. Mark each item `MATCH`, `MISMATCH`, `MISSING`, `DUPLICATE`, `STALE`, `NOT VERIFIED`, or `NOT APPLICABLE`.

8. Produce problem list  
   List confirmed problems, suspected problems, and not-verified risks, each tied to a source layer.

9. Generate focused hypotheses  
   Generate hypotheses only around failing or unverified source layers.

10. Evaluate hypotheses  
   Compare supporting and contradicting evidence, confidence, and verification step.

11. Choose likely root cause  
   Select the most likely cause or state `NOT VERIFIED` with exact proof needed.

12. Compare solution options  
   Evaluate possible fixes and choose the recommended solution path.

13. Score priority  
   Use severity, user impact, effort, and confidence.

14. Create or update a GitHub issue  
   Save the full numeric audit and technical instructions in GitHub Issues. If an existing open issue clearly covers the same numeric problem, update/comment on that issue instead of creating a duplicate.

15. Return a short chat response  
   Include only the audit status, GitHub issue link, and a concise `/delivery` prompt that points to the issue.

16. Stop  
   Do not implement unless user explicitly asks to continue.

## 10. GitHub issue requirements

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

## 11. Required GitHub issue body format

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

## Source-layer matrix
| Source layer | Layer status | Problem level | Evidence | Gap | Next verification |
|---|---|---|---|---|---|

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

## Problem list
| Type | Problem | Source layer | Evidence | User impact | Code/data location | Severity |
|---|---|---|---|---|---|---|

Type values:
- CONFIRMED
- SUSPECTED
- NOT VERIFIED RISK

## Hypothesis list
| Hypothesis | Source layer | Category | Evidence | Why plausible | Risk if true |
|---|---|---|---|---|---|

## Hypothesis evaluation
| Hypothesis | Source layer | Supporting evidence | Contradicting evidence | Confidence | Verification step | Decision |
|---|---|---|---|---|---|---|

Decision values:
- KEEP_AS_LIKELY
- REJECT
- DEFER_NOT_VERIFIED

## Most likely root cause
Describe the selected root cause or root-cause set. If evidence is insufficient, state `MOST LIKELY: NOT VERIFIED` and the exact verification required.

## Solution options
| Option | What changes | Source layer fixed | Pros | Cons/Risks | Effort | Verification | Decision |
|---|---|---|---|---|---|---|---|

Decision values:
- RECOMMENDED
- VALID_BUT_DEFER
- REJECT

## Recommended solution path
Explain the chosen solution path after source-layer audit, hypothesis evaluation, and solution comparison.

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
- [ ] Every expected numeric value is present or explicitly marked unavailable due to insufficient data.
- [ ] Source-layer matrix was completed before hypotheses.
- [ ] Formulas match the numeric contract.
- [ ] Displayed values match stored/calculated values.
- [ ] Rounding/formatting is correct.
- [ ] Save/load/history behavior preserves values correctly.
- [ ] Mobile and desktop displays are readable.
- [ ] Hypotheses were generated only from failing/unverified source layers.
- [ ] Recommended fix follows the most likely root cause.

## Ready-to-run /delivery prompt
```txt
/delivery

Task:
Implement the numeric/calculation fixes from this GitHub issue: <issue URL>

Requirements:
- Follow the recommended solution path selected after source-layer audit and hypothesis evaluation.
- Fix the confirmed numeric/code problems first.
- Preserve data/auth/history safety.
- Do not implement rejected hypotheses.

Files/components/functions to inspect first:
- ...

Do not touch:
- ...

Verification:
- ...
```
```

## 12. Chat output format

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
Ключевые требования: следовать source-layer matrix, выбранной гипотезе/причине и recommended solution path из issue.
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

## 13. Required behavior

Do not say “numbers are correct” unless the numeric contract was checked.

Do not say “verified” unless evidence exists.

Do not invent values from an unclear screenshot. Mark them `VISUAL UNCLEAR` or `NOT VERIFIED`.

Do not claim authenticated production cabinet numeric proof unless it actually was performed.

Do not block only because Google/Supabase auth prevents post-login production access. Use auth-safe audit-fin status instead.

Do not skip the source-layer matrix. `/audit-fin` must assess problem status across all source layers before hypotheses.

Do not skip the problem-hypothesis-solution loop. `/audit-fin` must list problems, generate focused hypotheses from failing/unverified layers, evaluate hypotheses, choose the most likely root cause, compare solution options, and only then write the implementation prompt.

Do not generate a huge unfocused hypothesis list. Prefer fewer, evidence-backed hypotheses tied to source layers.

Do not write code during `/audit-fin` unless the user explicitly asks to continue to `/delivery`.

Do not leave the full technical instruction only in chat when GitHub Issues are available. Save it as an issue and return a short prompt with the link.
