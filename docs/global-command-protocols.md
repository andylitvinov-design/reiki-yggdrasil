# Global Command Protocols

Status: shared behavior for `/audit`, `/audit-fin`, `/delivery`, UI polish, design quality gates, and deep technical issue writing.

## `/audit`

Purpose: run a product, UX, UI, and technical audit, then create or update a high-quality GitHub issue.

Required chain:

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

The issue must include:

- technical code trace;
- inspected files table;
- confirmed vs suspected findings;
- implementation map;
- do-not-touch rules;
- verification plan;
- ready-to-run `/delivery` prompt.

Evidence labels:

```txt
CODE VERIFIED
API VERIFIED
RUNTIME VERIFIED
DATA VERIFIED
LIKELY
NOT VERIFIED
```

Do not create vague issues. If code or runtime proof is unavailable, say exactly what is `NOT VERIFIED`.

## `/audit-fin`

Purpose: run a detailed numeric, calculation, and implementation audit. It is not just visible number checking.

Required trace:

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

Finance project source proof must also include, when available:

```txt
production source proof
-> /api/status
-> /api/audit-snapshot
-> /api/debug-ui-state
-> ledger/source rows
-> aggregation/table/chart rendering
```

The issue must include:

- numeric contract;
- visible values;
- numeric implementation trace;
- inspected files/functions/components/APIs;
- source-layer matrix;
- first divergence layer;
- confirmed vs likely/unverified findings;
- rejected hypotheses / do-not-repeat list when relevant;
- implementation map;
- protected areas not to touch;
- deterministic verification plan;
- ready-to-run `/delivery` prompt.

Rules:

- find the first layer where expected value becomes wrong actual value;
- do not blame formulas before checking data/source/state/parsing/aggregation/rendering;
- do not repeat rejected hypotheses after failed fixes;
- do not present guesses as facts;
- do not generate huge unfocused hypothesis lists.

## `/delivery`

Purpose: own the full safe path from issue/task to verified target environment.

Required chain:

```txt
understand task
-> resolve project adapter
-> implement minimal safe patch
-> run relevant checks
-> create/update PR as needed
-> verify PR health and CI
-> merge when green and permitted
-> verify deploy
-> prove requested behavior on target URL or documented auth-safe substitute
```

`/delivery` must preserve explicit exclusions from the task and the target repo adapter. For UI tasks, build/check/live proof is not enough.

Required final UI sections when UI is touched:

```txt
DESIGN QUALITY GATE
UI POLISH / FEEL-BETTER PASS
```

If a UI gate item is `FAIL` or `NOT VERIFIED`, continue an improvement loop or report the exact blocker/auth limitation. Do not claim success.

## UI Polish Skill

Preferred external skill:

```txt
jakubkrehel/make-interfaces-feel-better
```

Install/use when supported:

```bash
npx skills add jakubkrehel/make-interfaces-feel-better
```

Reference:

```txt
https://jakub.kr/skills/make-interfaces-feel-better
```

If unavailable, use the local fallback checklist named by the project adapter. The fallback must still check layout density, hierarchy, spacing, mobile first screen, navigation clarity, CTA clarity, copy quality, accessibility basics, and raw/debug-looking UI.

## Deep Technical Issue Writing

Every audit issue handed to `/delivery` must be implementation-ready.

Minimum issue structure:

```txt
Summary
User request
Target route/page/component
Evidence labels
Technical trace
Inspected files table
Confirmed findings
Suspected / not verified findings
Implementation map
Do-not-touch rules
Verification plan
Acceptance criteria
Ready-to-run /delivery prompt
```

If another agent cannot implement from the issue without rediscovering the route, components, state/data flow, styles, tests, and risks, the issue is not deep enough.

## Auth And Private Areas

For auth-gated flows, use safe evidence:

- code proof;
- local fixture/demo proof;
- public login entry;
- protected redirect behavior;
- owner-provided screenshot or expected value.

Never request credentials, cookies, tokens, secrets, or production data exports. Never claim authenticated production proof unless it was actually performed.
