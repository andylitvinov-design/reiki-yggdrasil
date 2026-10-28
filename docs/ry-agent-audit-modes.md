# RY Agent — Audit Modes

Status: reusable instruction block for the RY agent  
Purpose: make the RY agent understand `/audit`, `/audit-ui`, and `/audit-fin` as first-class diagnostic modes that prepare GitHub issues and short `/delivery` prompts.

Global source of truth:

```txt
docs/global-agent-settings.md
docs/global-command-protocols.md
docs/global-project-adapters.md
docs/global-agent-skills.md
```

This file is the Reiki-specific adapter. Do not copy the full protocol into other projects; make those projects reference the global docs and add only local routing/check/safety details.

## 1. Core behavior

The RY agent acts as a product/technical analyst before implementation.

When the user writes `/audit`, `/audit-ui`, or `/audit-fin`, the agent must not immediately implement code. It must diagnose, inspect relevant project instructions, inspect code when available, create or update a GitHub issue with full technical instructions, and return a short `/delivery` prompt pointing to the issue.

Critical handoff rule:

The implementation handoff prompt must begin with `/delivery`, not `/audit`, `/audit -> /delivery`, `/audit → /delivery`, or any other slash-prefixed audit text. If the agent wants to label the section, use plain text outside the prompt block, such as `Audit → Delivery handoff:`. The copy-pasteable prompt itself must start with `/delivery`.

## 2. Source links

Primary repository for Reiki/Mentalica audit protocols:

```txt
https://github.com/andylitvinov-design/reiki-yggdrasil
```

Use these protocol files as source of truth:

```txt
Global settings:
https://github.com/andylitvinov-design/reiki-yggdrasil/blob/main/docs/global-agent-settings.md

Global command protocols:
https://github.com/andylitvinov-design/reiki-yggdrasil/blob/main/docs/global-command-protocols.md

Global project adapters:
https://github.com/andylitvinov-design/reiki-yggdrasil/blob/main/docs/global-project-adapters.md

Global agent skills:
https://github.com/andylitvinov-design/reiki-yggdrasil/blob/main/docs/global-agent-skills.md

/audit command:
https://github.com/andylitvinov-design/reiki-yggdrasil/blob/main/.claude/commands/audit.md

/audit protocol:
https://github.com/andylitvinov-design/reiki-yggdrasil/blob/main/docs/audit-loop.md

/audit deep technical issue writing:
https://github.com/andylitvinov-design/reiki-yggdrasil/blob/main/docs/audit-deep-technical-issue-writing.md

/audit UI polish:
https://github.com/andylitvinov-design/reiki-yggdrasil/blob/main/docs/audit-ui-polish-skill.md

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

If the agent has direct repository access, it should read the local files instead of relying only on URLs. If a local source file is missing, report `needs verification`; do not invent replacement rules.

## 3. Project routing

When auditing a URL, screenshot, or user-reported live behavior, first resolve the project repository. Do not assume the repo name from a local folder name, an old issue, or a stale mapping.

Known current mappings:

```txt
Live URL: https://2mentalica.vercel.app
Canonical GitHub repo: andylitvinov-design/reiki-yggdrasil
GitHub issues: https://github.com/andylitvinov-design/reiki-yggdrasil/issues
Possible local path: /Users/andriilitvinov/projects/MYPROJECTS/reiki-yggdrasil
Notes: 2mentalica is the current Reiki Yggdrasil staging/draft site. Live title/brand is “Рейки Иггдрасиль”. Tasks for /profile, /masters, /profile/admin, Power Place formats, master cabinet, publications, templates, services, clients, or Reiki UI must go to this repo.

Live URL: https://mentalica.vercel.app
Canonical GitHub repo: andylitvinov-design/reiki-yggdrasil

Live URL: https://reiki-yggdrasil.vercel.app
Canonical GitHub repo: andylitvinov-design/reiki-yggdrasil

Live URL: https://psitherapy.vercel.app
Canonical GitHub repo: andylitvinov-design/report
Notes: PsiTherapy / client report / AI intake / Bach-DAO report cabinet project. Do not use this repo for Reiki Yggdrasil / 2mentalica profile work.

Live URL: https://ezohata-incoming-ledger.vercel.app
Canonical GitHub repo: andylitvinov-design/finance
```

### Hard correction rule for 2mentalica

Do not route `https://2mentalica.vercel.app` to `andylitvinov-design/report`. That was a stale/incorrect historical mapping.

For `https://2mentalica.vercel.app`, create GitHub audit and delivery issues in:

```txt
https://github.com/andylitvinov-design/reiki-yggdrasil/issues
```

Do not attach `2mentalica.vercel.app` to the `report` Vercel project unless the user explicitly says they are migrating that domain away from Reiki Yggdrasil.

### Routing verification gate

Before creating an issue or `/delivery` prompt for a URL, gather these signals:

```txt
1. User-stated product target and route.
2. Live title/brand or screenshot brand.
3. Repo-local AGENTS.md / README / STATE / LOG domain rules.
4. Current route behavior and public build markers if available.
5. Recent PRs/issues in the candidate repo related to the requested feature area.
```

If signals disagree, stop with:

```txt
STATUS: ROUTING_CONFLICT_NEEDS_VERIFICATION
```

Then list the conflicting signals and do not create implementation issues in either repo until the target repo is resolved.

## 4. `/audit` mode

Trigger examples:

```txt
/audit
/audit вот скрин, что не так?
/audit проверь интерфейс
/audit сделай UX/UI аудит
/audit найди проблему и создай issue
```

When `/audit` is invoked, run the general product/UX/technical audit protocol.

Required chain:

```txt
understand target
-> resolve project repo with the routing verification gate
-> inspect project rules
-> inspect relevant code deeply when available
-> trace route/component/state/data/style/test chain
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

## 5. Deep technical issue writing gate

Before creating the issue or `/delivery` prompt, run the deep technical issue-writing gate.

The issue must be detailed enough that another agent can implement without rediscovering the whole codebase.

Required trace:

```txt
route/page -> layout shell -> visible component -> child component -> state/store -> data/API/persistence -> formatting/rendering -> styles/responsive rules -> tests/checks
```

For finance projects, use the finance trace:

```txt
route/page -> UI component -> state/selection -> read-only API proof -> data normalization -> formula/aggregation -> rendering -> styles -> tests
```

Every `/audit` issue must include:

- technical code trace;
- inspected files table;
- confirmed vs suspected findings;
- implementation map;
- do-not-touch rules;
- verification plan;
- ready-to-run `/delivery` prompt.

Use evidence labels:

```txt
CODE VERIFIED
API VERIFIED
RUNTIME VERIFIED
LIKELY
NOT VERIFIED
```

Do not present guesses as facts. If code access was unavailable, mark `PARTIAL_CODE_LIMITATION`.

## 6. `/audit-fin` mode

When `/audit-fin` is invoked, run the numeric/calculation/financial audit protocol.

Required chain:

```txt
understand numeric target
-> resolve project repo with the routing verification gate
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

Before generating hypotheses, check source layers. For finance, also prove production source-of-truth and read-only API evidence before blaming formulas.

If prior fixes failed, run failed-repair analysis:

```txt
Why did the previous fix not solve the problem?
Where does the value first diverge from expectation?
What should not be repeated?
Is the source data sufficient?
```

Do not repeat a prior failed hypothesis unless new evidence changes the conclusion.

## 7. GitHub issue behavior

When GitHub access is available, `/audit`, `/audit-ui`, and `/audit-fin` should create or update a GitHub issue in the resolved canonical repo.

Issue title formats:

```txt
[AUDIT] <area/page/feature>: <short problem summary>
[AUDIT-FIN] <area/page/metric>: <short numeric problem summary>
[AUDIT-UI] <area/page/feature>: <short UI problem summary>
```

If an existing open issue clearly covers the same target and problem, update/comment on that issue instead of creating a duplicate.

If GitHub Issues are unavailable, output the full issue body in chat and use:

```txt
STATUS: AUDIT_COMPLETE_ISSUE_NOT_CREATED
STATUS: AUDIT_FIN_COMPLETE_ISSUE_NOT_CREATED
```

## 8. Auth-safe behavior

For profile, cabinet, admin, results, intake, client, or private pages behind Google/Supabase auth:

- never ask for credentials, cookies, tokens, or secrets;
- never attempt to bypass auth;
- never claim authenticated production proof unless actually performed;
- use screenshot, code-level proof, local/demo/fixture state, public route, login entry, protected redirect, and owner-provided expected values as safe substitute evidence;
- use `STATUS: AUDIT_PARTIAL_AUTH_LIMITATION` or `STATUS: AUDIT_FIN_PARTIAL_AUTH_LIMITATION` when only authenticated production proof is unavailable.

## 9. Handoff to `/delivery`

The final chat response should always include a short implementation prompt.

The copy-pasteable prompt must start exactly with `/delivery` as the first non-empty line.

Do not start the prompt block with:

```txt
/audit -> /delivery handoff
/audit → /delivery handoff
/audit handoff
/audit-fin -> /delivery handoff
```

General audit handoff:

```txt
/delivery
Task:
Исправить проблему по issue <issue URL>.
Ключевые требования:
- follow the technical code trace;
- follow the implementation map;
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

## 10. Required behavior

Do not say “everything is fine” unless the audit contract was checked.
Do not say “numbers are correct” unless the numeric contract was checked.
Do not say “verified” unless there is evidence.
Do not invent values from an unclear screenshot. Use `VISUAL UNCLEAR` or `NOT VERIFIED`.
Do not invent code evidence. Use `NOT VERIFIED` for unknowns.
Do not generate a huge unfocused hypothesis list. Prefer fewer, evidence-backed hypotheses tied to source layers.
Do not create vague issues. Map symptom -> file/component/function -> likely cause -> change direction -> verification.
Do not write implementation code in audit mode unless the user explicitly asks to continue to `/delivery`.
Do not let stale routing docs override live product evidence or the current `docs/global-project-adapters.md` mapping.
