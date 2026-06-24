# /audit

`/audit` is sufficient by itself.

The user must not need to add extra wording such as “study the code”, “create an issue”, “write technical instructions”, “check mobile”, “check save”, “make interface feel better”, “trace the code”, “map files”, or “return a delivery prompt”.

When the user invokes `/audit`, that invocation means full safe audit delegation for this repository:

```txt
understand target -> inspect project rules -> inspect code deeply -> trace route/component/state/data/style/test chain -> evaluate UX/UI/product/technical layers -> run UI polish pass -> create/update GitHub issue -> return short /delivery prompt with issue link
```

## Source of truth

Follow all source-of-truth docs in order:

1. `.claude/commands/audit.md`
2. `docs/audit-loop.md` — full audit protocol, mandatory dimensions, GitHub issue format, final response format
3. `docs/audit-deep-technical-issue-writing.md` — required code-trace chain and high-quality technical issue format
4. `docs/audit-ui-polish-skill.md` — optional UI polish skill addendum, including `make-interfaces-feel-better` integration
5. `AGENTS.md` — project adapter and safety rules
6. `.claude/commands/delivery.md` — implementation handoff contract
7. `docs/delivery-auth-boundary-standard.md` — auth-gated cabinet verification boundary
8. `docs/delivery-loop-program.md` — delivery handoff context
9. `docs/delivery-loop-source-patterns-and-live-proof.md` — live proof context for final implementation

If a local source-of-truth doc is missing, report `needs verification` and do not invent replacement rules.

## Optional external UI skill

When available in the agent environment, use the external skill:

```bash
npx skills add jakubkrehel/make-interfaces-feel-better
```

Source:

```txt
https://jakub.kr/skills/make-interfaces-feel-better
```

If the skill is installed, load and apply it during `/audit`. If it is not installed or cannot be verified, do not block the audit; run the local UI polish checklist from `docs/audit-ui-polish-skill.md` and note the missing skill in the GitHub issue.

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
5. Build the required code-trace chain from `docs/audit-deep-technical-issue-writing.md`:
   `route/page -> layout shell -> visible component -> child component -> state/store -> data/API/persistence -> formatting/rendering -> styles/responsive rules -> tests/checks`.
6. For each inspected file, record why it matters, what it controls, evidence found, and risk if changed.
7. If a screenshot is provided, redesign the visible interface conceptually into a friendlier, simpler version.
8. Evaluate all mandatory audit dimensions from `docs/audit-loop.md`, including UX, desktop/mobile layout, clickability, saving/history, auth/privacy, code quality, regression risk, language quality, accessibility, product flow, root cause, priority/effort, edge cases, testability, observability, implementation slicing, and rollback safety.
9. Run the UI polish pass from `docs/audit-ui-polish-skill.md`, using `make-interfaces-feel-better` if installed.
10. Map UI/product symptoms to specific code-level findings, hypotheses, and technical change directions.
11. Identify `CODE VERIFIED`, `RUNTIME VERIFIED`, `LIKELY`, and `NOT VERIFIED` findings separately.
12. Create or update a GitHub issue with the full audit report and technical implementation instructions.
13. Return only a short response: audit status, issue link, and concise `/delivery` prompt pointing to that issue.

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
- technical code trace table;
- inspected files table;
- confirmed vs suspected findings;
- implementation map;
- mandatory audit dimensions table;
- UI polish pass;
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
Ключевые требования: follow the code-trace chain, implementation map, do-not-touch rules, and verification plan from the issue.
```

The copy-pasteable handoff prompt must start with `/delivery` as the first non-empty line.

Do not start the prompt block with `/audit -> /delivery handoff`, `/audit → /delivery handoff`, `/audit handoff`, or any other slash-prefixed audit label. If a label is useful, put it outside the prompt block as plain text only.

## Required behavior

Do not say “everything is fine” unless the audit contract was checked.

Do not say “verified” unless there is evidence.

Do not invent code evidence. Use `NOT VERIFIED` for unknowns.

Do not create vague issues. The issue must map symptom -> file/component/function -> likely cause -> change direction -> verification.

Do not write code during `/audit` unless the user explicitly asks to continue to `/delivery`.
