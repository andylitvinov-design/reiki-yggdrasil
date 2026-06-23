# /audit — Screen-to-Friendly Technical Audit Protocol

Status: reusable diagnostic protocol  
Command: `/audit`  
Purpose: turn screenshots, vague UI complaints, suspected bugs, and regression concerns into a user-friendly redesign direction, deep code investigation, a GitHub issue with detailed technical instructions, and a short `/delivery` prompt that links to the issue.

`/audit` is diagnostic by default. It does not edit code, commit, push, merge, deploy, or change production state unless the user explicitly asks to continue to `/delivery`.

## 1. What /audit does

Use `/audit` when the user provides a screenshot, route, vague problem, broken feeling, confusing UI, regression concern, product/UX question, or asks “what is wrong”.

`/audit` must produce:

1. a problem diagnosis;
2. a more user-friendly target interface concept;
3. a detailed code investigation of related routes/components/styles/state/data;
4. identified code-level problems, risks, and likely root causes;
5. a maximally detailed technical implementation instruction saved as a GitHub issue;
6. a short chat response with the issue link and a concise `/delivery` prompt.

Short form:

```txt
screenshot / complaint / URL
-> UX diagnosis
-> friendlier target design
-> deep code investigation
-> code problem map
-> GitHub issue with full technical instructions
-> short /delivery prompt linking to the issue
```

## 2. Audit is not delivery

By default, `/audit` must not implement. It stops after creating or updating the GitHub issue and returning a short prompt.

Switch to implementation only if the user explicitly says:

```txt
continue to /delivery
implement these findings
apply this audit
```

## 3. Source of truth

Before judging or recommending changes, use these sources in order:

1. User request  
   The screenshot, route, concrete complaint, and stated product goal.

2. Project instructions  
   Read when available:
   - `AGENTS.md`
   - `.claude/commands/delivery.md`
   - `docs/delivery-auth-boundary-standard.md`
   - `docs/delivery-loop-program.md`
   - `docs/delivery-loop-source-patterns-and-live-proof.md`
   - `docs/audit-loop.md`

3. Product standard for this project  
   Default target experience:
   - minimal text;
   - quick intuitive cabinet;
   - clear next action;
   - understandable for a normal user without extra explanation;
   - mobile-first safety;
   - no hidden critical buttons;
   - no viewport overflow;
   - no distorted images/backgrounds;
   - no owner-only or therapist-only wording when the feature should be universal.

4. Code evidence  
   Repository code is mandatory evidence when available. Inspect likely routes, components, shared UI primitives, CSS/module/Tailwind classes, state/data files, persistence helpers, and related tests/scripts before writing the technical issue. If code cannot be inspected, mark code findings as `NOT VERIFIED` and create an issue that clearly separates evidence from hypotheses.

5. Auth-safe verification limits  
   If a page is behind Google/Supabase/private cabinet auth, do not request credentials, cookies, tokens, or secrets. Use safe evidence: public route, login entry, protected redirect, local/demo/fixture state, code-level proof, or owner-provided screenshots.

## 4. Audit modes

Select one or more modes based on the request.

### 4.1 UI Redesign Audit

Use for screenshots and visual complaints.

Check:

- What is visually confusing?
- What feels too heavy, verbose, or technical?
- Is the main action obvious?
- Are buttons visible and reachable?
- Does the screen have too many competing blocks?
- Does anything overflow or look cramped on mobile?
- Are menus/forms predictable?
- Are images/backgrounds distorted or disconnected from controls?

Output must include a proposed friendlier target interface.

### 4.2 UX Simplification Audit

Use when the user says the page has too much text, feels complicated, or should be easier.

Check:

- What text can be removed?
- What can become a short label?
- What can move into a secondary “details/help” area?
- What can become a button, step, or card?
- What wording is too narrow or too owner-specific?
- What should be the one obvious next step?

### 4.3 Deep Code Mapping Audit

Use whenever repository access is available. This is mandatory for project-code audits.

Find and inspect:

- route/page entry points;
- direct component files;
- shared child components;
- relevant CSS/module/Tailwind classes;
- layout wrappers and viewport containers;
- mobile-specific logic;
- state/data source if the UI is data-driven;
- persistence/localStorage/Supabase interactions if saving/history is involved;
- existing tests, checks, scripts, and debug tools;
- recent commits/PR context when regression is suspected;
- project constraints from `AGENTS.md` and delivery docs.

The audit must separate:

- `CODE VERIFIED` — inspected in code;
- `LIKELY` — inferred from filenames/search but not fully inspected;
- `NOT VERIFIED` — cannot confirm.

### 4.4 Bug Hypothesis Audit

Use when the screenshot suggests a technical bug.

Examples:

- button below viewport;
- menu collapsed when it should be expanded;
- photo squeezed into a line;
- background size slider not affecting the image;
- text overflowing card;
- mobile container using wrong height;
- fixed bottom bar covering content;
- state not saved or overwritten.

For each suspected bug, output in the GitHub issue:

```txt
Symptom:
Evidence:
Likely cause:
Files inspected:
Files still to inspect:
Technical fix direction:
Regression risk:
Verification:
```

### 4.5 Regression Audit

Use after recent PRs or when a change may have broken older behavior.

Check:

- What changed recently?
- What older flows share the same component/state/CSS?
- What must not be touched?
- What data persistence or auth risk exists?
- What mobile behavior could regress?

### 4.6 Auth-Safe Cabinet Audit

Use for profile, cabinet, admin, results, intake, client, or private pages.

Do not require production post-login live proof.

Instead check or request safe substitute evidence:

- public route loads;
- login entry is visible;
- protected route redirects safely;
- component can be inspected by code;
- local/demo/fixture state can show the UI;
- screenshot from owner can supplement what code cannot prove.

Use status `AUDIT_PARTIAL_AUTH_LIMITATION` when only authenticated production visual proof is unavailable.

## 5. Audit loop

Run this loop:

1. Identify target  
   Page, route, screenshot, component, or user flow.

2. Extract audit contract  
   What exactly the user wants checked and what “better” means.

3. Build target UX principle  
   Define the desired user-friendly version in one or two sentences.

4. Diagnose visible issues  
   Use screenshot/user description. Mark uncertain items as `NOT VERIFIED`.

5. Inspect code deeply  
   Search routes/components/styles/data/state. Open relevant files. Follow imports to child components and shared helpers. Do not invent code details.

6. Map symptoms to code  
   Connect each UI issue to specific files, functions, components, classes, state, and likely root causes.

7. Identify actual code problems  
   Separate confirmed code defects from UX improvement opportunities and unverified hypotheses.

8. Propose minimal redesign and implementation plan  
   Prefer small targeted changes over full rewrites.

9. Create or update a GitHub issue  
   Save the full technical instruction in GitHub Issues. If an existing open issue clearly covers the same audit target and problem, update/comment on that issue instead of creating a duplicate. Otherwise create a new issue.

10. Return a short chat response  
   Include only the audit status, GitHub issue link, and a concise `/delivery` prompt that points to the issue.

11. Stop  
   Do not implement unless user explicitly asks to continue.

## 6. GitHub issue requirements

Every completed `/audit` should create or update a GitHub issue unless the GitHub connector is unavailable. If GitHub is unavailable, output the full issue body in chat and mark:

```txt
STATUS: AUDIT_COMPLETE_ISSUE_NOT_CREATED
```

Issue title format:

```txt
[AUDIT] <area/page/feature>: <short problem summary>
```

Recommended labels when available:

```txt
audit
ux
ui
technical-debt
bug
regression
auth-limited
```

Use only labels that exist or that the tool can safely create/apply. Do not fail the audit only because labels are missing.

## 7. Required GitHub issue body format

The GitHub issue must contain the full technical detail. Use this structure:

```md
# Audit: <area/page/feature>

## Status
STATUS: AUDIT_COMPLETE | AUDIT_PARTIAL_AUTH_LIMITATION | AUDIT_BLOCKED | AUDIT_COMPLETE_ISSUE_NOT_CREATED

## User request
<original user request summary>

## Target
- Page/route/component:
- Screenshot or evidence:
- Auth status:

## Audit contract
- Requirement 1
- Requirement 2
- Requirement 3

## User-friendly target interface
Describe the target interface in plain language.

## Findings
| Priority | Problem | Why it matters | Evidence | Suggested fix |
|---|---|---|---|---|

## Deep code investigation
| Code status | File/component | What was inspected | Finding |
|---|---|---|---|

Code status values:
- CODE VERIFIED
- LIKELY
- NOT VERIFIED

## Confirmed code problems
List actual problems found in code, with file paths and details.

## UX/product improvements
List improvements that are product decisions rather than strict code bugs.

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
- Browser/local/preview/live checks.
- Mobile checks.
- Auth-safe verification limits.

## Acceptance criteria
- [ ] Criterion 1
- [ ] Criterion 2
- [ ] Criterion 3

## Ready-to-run /delivery prompt
```txt
/delivery

Task:
Implement the technical instructions from this GitHub issue: <issue URL>

Requirements:
- ...

Files/components to inspect first:
- ...

Do not touch:
- ...

Verification:
- ...
```
```

## 8. Chat output format

The chat response after `/audit` should be short. Do not duplicate all technical details if a GitHub issue was created.

Use this structure:

```txt
STATUS: AUDIT_COMPLETE

Создал GitHub issue с полной технической инструкцией:
<issue URL>

Короткий prompt для Codex/Claude:
/delivery
Task:
Исправить проблему по issue <issue URL>.
Ключевые требования: ...
```

For auth-limited audits:

```txt
STATUS: AUDIT_PARTIAL_AUTH_LIMITATION

Создал GitHub issue с полной технической инструкцией:
<issue URL>

Ограничение: production post-login visual proof недоступен из-за Google/Supabase auth. Техническая проверка выполнена по коду/доступным безопасным данным.

Короткий prompt для Codex/Claude:
...
```

## 9. Required behavior

Do not say “everything is fine” unless the audit contract was checked.

Do not say “verified” unless evidence exists.

Do not claim authenticated production cabinet UI was visually verified unless it actually was.

Do not block only because Google/Supabase auth prevents post-login production access. Use auth-safe audit status instead.

Do not write code during `/audit` unless the user explicitly asks to continue to `/delivery`.

Do not leave the full technical instruction only in chat when GitHub Issues are available. Save it as an issue and return a short prompt with the link.

Prefer direct, practical recommendations over abstract UX theory.
