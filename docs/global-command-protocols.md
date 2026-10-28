# Global Command Protocols

Status: shared behavior for `/audit`, `/audit-ui`, `/audit-fin`, `/delivery`, `/delivery-big`, UI polish, design quality gates, and deep technical issue writing.

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

## `/audit-ui`

Purpose: run a design-focused UI/UX audit from screenshot, link, route, or page description. It proposes competing UI concepts before implementation.

Source protocol:

```txt
docs/audit-ui-mode.md
```

Required chain:

```txt
understand target
-> resolve project repo
-> inspect screenshot/link/route
-> inspect relevant UI code when available
-> diagnose current UI
-> run shared design skills and quality gates
-> list problems and opportunities
-> generate 5-7 improvement ideas
-> select top 3 UI concepts
-> create 3 sketch/mockup directions when possible
-> compare the 3 concepts
-> choose recommended concept
-> create/update GitHub issue
-> return short report + /delivery prompt
```

The chat report must include:

- 3 best concepts;
- recommended concept;
- why it was selected;
- sketch/mockup references or descriptions;
- issue link;
- short `/delivery` prompt.

The user may choose Concept 1, 2, or 3. `/audit-ui` must not implement code by default.

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

### Escalation to /delivery-big

If a `/delivery` prompt or issue has more than 3 independent requirements,
touches more than 2 system areas, or asks for an autonomous/overnight repair
loop, escalate internally to `/delivery-big` behavior and report:

```txt
Escalated to /delivery-big mode because: <reason>
```

This escalation does not weaken any `/delivery` rule.

## `/delivery-big`

Purpose: own large autonomous delivery without dropping requirements.

`/delivery-big` inherits `/delivery` and adds:

- Task Manifest with stable Task IDs and source tracking;
- Scope Contract with included/excluded Task IDs, non-goals, likely files, and risk gates;
- Phase Plan;
- Verification Matrix with evidence for every included Task ID;
- Repair Loop before final reporting;
- strict DONE gate: every included Task ID must be `PASS`.

Canonical details live in `docs/global-delivery-big-protocol.md`; local adapters
are `.claude/commands/delivery-big.md`, `.codex/commands/delivery-big.md`, and
`.codex/skills/delivery-big/SKILL.md`.

Audit/planner-style handoffs should recommend `/delivery-big` instead of
`/delivery` when the issue is large by the same threshold above.

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
