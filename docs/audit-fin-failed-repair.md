# /audit-fin — Failed Repair and Repeated Fix Analysis

Status: reusable diagnostic addendum  
Command: `/audit-fin`  
Purpose: prevent repeated ineffective numeric/calculation fixes by forcing the agent to audit prior failed attempts before proposing another solution.

Use this addendum whenever the user says or implies:

- previous financial/numeric fixes did not work;
- the agent already tried multiple hypotheses;
- the issue keeps coming back;
- the visible number changed but the underlying problem remains;
- the suspected display fix did not solve the problem;
- data may be missing or incomplete;
- the agent is unsure whether the error is in data, formulas, persistence, or rendering.

## 1. Core rule

Before proposing a new fix, the agent must answer:

```txt
Why did the previous fix not solve the problem?
```

Do not create another implementation prompt until the failed-repair analysis is complete.

## 2. Failed repair source matrix

Create this matrix in the GitHub issue:

| Prior attempt / suspected fix | Target layer | What it assumed | What evidence supported it | What evidence contradicted it | Why it likely failed | Keep / reject / defer |
|---|---|---|---|---|---|---|

Target layer values:

- visual/display only;
- raw data availability;
- input parsing;
- state/selection;
- formula/business logic;
- calculation helper;
- persistence/hydration;
- formatting/rounding;
- rendering/component binding;
- chart/gauge/indicator;
- async/loading/race;
- auth/environment;
- test fixture/proof.

Decision values:

- `KEEP` — still likely and supported by evidence;
- `REJECT` — evidence shows this was not the root cause;
- `DEFER` — possible but not enough evidence yet.

## 3. Anti-repeat rules

The agent must not repeat a prior failed hypothesis unless it identifies new evidence that changes the conclusion.

Do not keep applying display/rendering fixes when:

- raw data availability is `ISSUE` or `NOT VERIFIED`;
- source records are missing;
- the formula cannot be proven with deterministic sample input;
- persistence/hydration may be loading stale values;
- the UI is correctly rendering the wrong upstream value.

If a display layer shows the wrong value but upstream data is wrong, the issue is upstream, not display.

## 4. Data sufficiency gate

Before fixing formulas or rendering, verify whether enough data exists.

Required checks:

- What exact raw fields are required?
- Are those fields present for the selected client/session/date?
- Are comparison records present when comparing first vs second date?
- Are missing values intentionally blank, or accidentally treated as zero?
- Are old records compatible with the new expected shape?
- Is there a deterministic fixture/sample that contains the required fields?

If data is insufficient, the recommended solution must include one of:

- collect/store the missing data;
- show an incomplete-data state;
- add migration/fallback for old data;
- prevent calculation until required inputs exist;
- expose a clear warning instead of showing misleading zeros or stale numbers.

## 5. Proof-first repair rule

For any recommended fix, the issue must include proof before implementation:

```txt
Given this sample input:
...
Expected output:
...
Current output:
...
Difference:
...
Source layer where the divergence first appears:
...
```

The selected fix must target the first layer where the value diverges from expectation.

## 6. Required issue sections

When this addendum applies, add these sections to the GitHub issue:

```md
## Failed repair analysis
| Prior attempt / suspected fix | Target layer | What it assumed | What evidence supported it | What evidence contradicted it | Why it likely failed | Keep / reject / defer |
|---|---|---|---|---|---|---|

## Data sufficiency gate
| Required data | Present? | Evidence | Missing/unclear | Required action |
|---|---|---|---|---|

## First divergence point
Explain where the value first becomes wrong:
raw data -> parsing -> state -> formula -> helper -> persistence -> hydration -> formatting -> rendering -> chart/table/card

## Do-not-repeat list
- Hypotheses/fixes that should not be repeated unless new evidence appears.

## Proof fixture
Given input:
Expected output:
Current output:
Verification command/path:
```

## 7. Delivery handoff rule

The final `/delivery` prompt must say:

```txt
Do not retry rejected hypotheses from the audit-fin issue.
Target the first divergence layer and verify with the proof fixture before changing display code.
```
