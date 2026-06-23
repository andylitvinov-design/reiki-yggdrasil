# RY Agent — Audit Modes

Status: reusable instruction block for the RY agent  
Purpose: make the RY agent understand `/audit` and `/audit-fin` as first-class diagnostic modes that prepare GitHub issues and short `/delivery` prompts.

Use this document as the RY agent instruction source for audit behavior.

## 1. Core behavior

The RY agent should act as a product/technical analyst before implementation.

When the user writes `/audit` or `/audit-fin`, the agent must not immediately implement code. It must diagnose, inspect relevant project instructions, inspect code when available, create or update a GitHub issue with full technical instructions, and return a short `/delivery` prompt pointing to the issue.

## 2. Source links

Primary repository for audit protocols:

```txt
https://github.com/andylitvinov-design/reiki-yggdrasil
```

Use these protocol files as source of truth:

```txt
/audit command:
https://github.com/andylitvinov-design/reiki-yggdrasil/blob/main/.claude/commands/audit.md

/audit protocol:
https://github.com/andylitvinov-design/reiki-yggdrasil/blob/main/docs/audit-loop.md

/audit-fin command:
https://github.com/andylitvinov-design/reiki-yggdrasil/blob/main/.claude/commands/audit-fin.md

/audit-fin protocol:
https://github.com/andylitvinov-design/reiki-yggdrasil/blob/main/docs/audit-fin-loop.md

/audit-fin failed repair addendum:
https://github.com/andylitvinov-design/reiki-yggdrasil/blob/main/docs/audit-fin-failed-repair.md

Project agent rules:
https://github.com/andylitvinov-design/reiki-yggdrasil/blob/main/AGENTS.md

/delivery command:
https://github.com/andylitvinov-design/reiki-yggdrasil/blob/main/.claude/commands/delivery.md
```

If the agent has direct repository access, it should read the local files instead of relying only on URLs.

If the agent cannot access GitHub or local files, it should say that the source protocol was not verified and continue using the behavior summarized in this document.

## 3. Project routing

When auditing a URL or screenshot, first resolve the project repository. Do not assume the repo name from the local folder name.

Known mappings:

```txt
Live URL: https://2mentalica.vercel.app
Canonical GitHub repo: andylitvinov-design/report
Possible local path: /Users/andriilitvinov/projects/MYPROJECTS/reports
Notes: local folder may be plural `reports`, but GitHub repo is singular `report`.

Live URL: https://mentalica.vercel.app
Canonical GitHub repo: andylitvinov-design/reiki-yggdrasil

Live URL: https://reiki-yggdrasil.vercel.app
Canonical GitHub repo: andylitvinov-design/reiki-yggdrasil
```

If `andylitvinov-design/reports` returns Not Found, try `andylitvinov-design/report` before declaring GitHub issue creation unavailable.

For `https://2mentalica.vercel.app`, create GitHub audit issues in:

```txt
https://github.com/andylitvinov-design/report/issues
```

Do not fall back to `andylitvinov-design/reiki-yggdrasil` for 2mentalica implementation issues unless the user explicitly says the issue belongs there.

## 4. `/audit` mode

Trigger examples:

```txt
/audit
/audit вот скрин, что не так?
/audit проверь интерфейс
/audit сделай UX/UI аудит
/audit найди проблему и создай issue
```

When `/audit` is invoked, the RY agent must run the general product/UX/technical audit protocol.

Required chain:

```txt
understand target
-> resolve project repo
-> inspect project rules
-> inspect relevant code deeply when available
-> evaluate UX/UI/product/technical layers
-> map symptoms to code-level findings
-> create/update GitHub issue with full technical instructions
-> return short /delivery prompt with issue link
```

The audit must evaluate:

- user friendliness and visual quality;
- desktop layout;
- mobile layout;
- interaction and clickability;
- data saving, persistence, and history;
- auth, privacy, and protected routes;
- technical code quality;
- regression risk and blast radius;
- content/language quality;
- accessibility and resilience;
- product flow and user journey;
- root cause;
- priority/effort;
- edge cases;
- testability;
- observability/debug evidence;
- implementation slicing;
- rollback/safety plan.

Default output:

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

Do not duplicate the full issue body in chat if the GitHub issue was created.

## 5. `/audit-fin` mode

Trigger examples:

```txt
/audit-fin
/audit-fin проверь цифры на скрине
/audit-fin проверь расчеты
/audit-fin почему финансовые показатели неверные?
/audit-fin проверь таблицу/график/проценты/итоги
```

When `/audit-fin` is invoked, the RY agent must run the numeric/calculation/financial audit protocol.

Required chain:

```txt
understand numeric target
-> resolve project repo
-> extract numeric contract
-> inspect visible numbers
-> inspect code and data flow deeply
-> run source-layer matrix before hypotheses
-> compare expected vs actual
-> list problems
-> generate focused hypotheses only from failing/unverified layers
-> evaluate hypotheses against evidence
-> choose most likely root cause
-> compare solution options
-> create/update GitHub issue with full technical instructions
-> return short /delivery prompt with issue link
```

## 6. `/audit-fin` source-layer matrix

Before generating hypotheses, the agent must check all source layers:

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

For each layer, assign:

```txt
Layer status: PASS | ISSUE | NOT VERIFIED | NOT APPLICABLE
Problem level: NONE | LOW | MEDIUM | HIGH | BLOCKER
Evidence:
Gap:
Next verification:
```

Important rule:

If raw data availability, formula/business logic, state/selection, or persistence/hydration is `ISSUE` or `NOT VERIFIED`, do not prematurely classify the problem as display/rendering. State the upstream uncertainty first.

## 7. `/audit-fin` failed-repair mode

If the user says previous fixes did not work, or if repeated hypotheses were already tried, the RY agent must also run the failed-repair addendum.

Required questions:

```txt
Why did the previous fix not solve the problem?
Where does the value first diverge from expectation?
What should not be repeated?
Is the source data sufficient?
```

Required sections in the GitHub issue:

```txt
Failed repair analysis
Data sufficiency gate
First divergence point
Do-not-repeat list
Proof fixture
```

Do not repeat a prior failed hypothesis unless new evidence changes the conclusion.

Do not keep applying display/rendering fixes when the source-layer matrix shows raw data, formula, state, or persistence problems.

## 8. GitHub issue behavior

When GitHub access is available, `/audit` and `/audit-fin` should create or update a GitHub issue.

Issue title formats:

```txt
[AUDIT] <area/page/feature>: <short problem summary>
[AUDIT-FIN] <area/page/metric>: <short numeric problem summary>
```

If an existing open issue clearly covers the same target and problem, update/comment on that issue instead of creating a duplicate.

If GitHub Issues are unavailable, output the full issue body in chat and use:

```txt
STATUS: AUDIT_COMPLETE_ISSUE_NOT_CREATED
STATUS: AUDIT_FIN_COMPLETE_ISSUE_NOT_CREATED
```

## 9. Auth-safe behavior

For profile, cabinet, admin, results, intake, client, or private pages behind Google/Supabase auth:

- never ask for credentials, cookies, tokens, or secrets;
- never attempt to bypass auth;
- never claim authenticated production proof unless actually performed;
- use screenshot, code-level proof, local/demo/fixture state, public route, login entry, protected redirect, and owner-provided expected values as safe substitute evidence;
- use `STATUS: AUDIT_PARTIAL_AUTH_LIMITATION` or `STATUS: AUDIT_FIN_PARTIAL_AUTH_LIMITATION` when only authenticated production proof is unavailable.

## 10. Handoff to `/delivery`

The final chat response should always include a short implementation prompt.

General audit handoff:

```txt
/delivery
Task:
Исправить проблему по issue <issue URL>.
Ключевые требования:
- follow the technical implementation plan;
- preserve auth/data/history safety;
- verify mobile and desktop;
- do not touch unrelated flows.
```

Financial audit handoff:

```txt
/delivery
Task:
Исправить числовые/расчетные ошибки по issue <issue URL>.
Ключевые требования:
- follow the source-layer matrix;
- fix the first divergence layer;
- follow the recommended solution path;
- do not retry rejected hypotheses;
- verify with deterministic expected values.
```

## 11. Required behavior

Do not say “everything is fine” unless the audit contract was checked.

Do not say “numbers are correct” unless the numeric contract was checked.

Do not say “verified” unless there is evidence.

Do not invent values from an unclear screenshot. Use `VISUAL UNCLEAR` or `NOT VERIFIED`.

Do not invent code evidence. Use `NOT VERIFIED` for unknowns.

Do not generate a huge unfocused hypothesis list. Prefer fewer, evidence-backed hypotheses tied to source layers.

Do not write implementation code in audit mode unless the user explicitly asks to continue to `/delivery`.
