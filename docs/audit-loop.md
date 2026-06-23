# /audit — Screen-to-Friendly Technical Audit Protocol

Status: reusable diagnostic protocol  
Command: `/audit`  
Purpose: turn screenshots, vague UI complaints, and suspected bugs into a user-friendly redesign direction plus a technical implementation brief for `/delivery`.

`/audit` is diagnostic by default. It does not edit code, commit, push, merge, deploy, or change production state unless the user explicitly asks to continue to `/delivery`.

## 1. What /audit does

Use `/audit` when the user provides a screenshot, route, vague problem, broken feeling, confusing UI, regression concern, or product/UX question.

`/audit` must produce:

1. a problem diagnosis;
2. a more user-friendly target interface concept;
3. code-level investigation of likely related files/components when repository access is available;
4. a technical instruction for what should be changed in code;
5. a ready-to-run `/delivery` prompt.

Short form:

```txt
screenshot / complaint / URL
-> UX diagnosis
-> friendlier target design
-> code/component mapping
-> technical change plan
-> /delivery prompt
```

## 2. Audit is not delivery

By default, `/audit` must not implement. It stops after the audit report and technical instruction.

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
   If repository access is available, inspect likely components, routes, state/data files, and CSS before writing technical instructions. If code cannot be inspected, mark code findings as `NOT VERIFIED` and write the best external instruction separately.

5. Auth-safe verification limits  
   If a page is behind Google/Supabase/private cabinet auth, do not request credentials, cookies, tokens, or secrets. Use safe evidence: public route, login entry, protected redirect, local/demo/fixture state, or code-level proof.

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

### 4.3 Code Mapping Audit

Use whenever repository access is available.

Find:

- likely route/page file;
- likely component files;
- relevant CSS/module/Tailwind classes;
- state/data source if the UI is data-driven;
- shared components that may create regression risk;
- existing constraints from `AGENTS.md` and delivery docs.

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

For each suspected bug, output:

```txt
Symptom:
Likely cause:
Files to inspect:
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

5. Inspect code when possible  
   Search likely routes/components/styles/data. Do not invent code details.

6. Map symptoms to code  
   Connect each UI issue to likely files/functions/classes/state.

7. Propose minimal redesign  
   Prefer small targeted changes over full rewrites.

8. Write technical instructions  
   Include files, components, change direction, constraints, and verification.

9. Write ready-to-run `/delivery` prompt  
   The prompt must be complete enough for an implementation agent.

10. Stop  
   Do not implement unless user explicitly asks to continue.

## 6. Output format

Every audit must end with this structure.

### AUDIT STATUS

Use one:

```txt
STATUS: AUDIT_COMPLETE
STATUS: AUDIT_PARTIAL_AUTH_LIMITATION
STATUS: AUDIT_BLOCKED
```

### 1. Target

Page / route / screenshot / component / flow checked.

### 2. Audit Contract

What the user wanted evaluated.

### 3. User-Friendly Target

Describe the better interface in plain language.

Example:

```txt
The screen should feel like a short guided step: one clear title, one short explanation, visible primary action, optional details hidden below.
```

### 4. Findings

Use table:

| Priority | Problem | Why it matters | Evidence | Suggested fix |
|---|---|---|---|---|

Priority values:

- `CRITICAL`
- `IMPORTANT`
- `POLISH`
- `NOT VERIFIED`

### 5. Code Mapping

Use table:

| UI symptom | Code status | Likely file/component | What to inspect/change |
|---|---|---|---|

Code status values:

- `CODE VERIFIED`
- `LIKELY`
- `NOT VERIFIED`

### 6. Technical Instruction

Write implementation guidance:

```txt
Files to change:
- ...

Required changes:
- ...

Do not touch:
- ...

Verification:
- ...
```

### 7. Auth / Verification Limits

State what was checked and what could not be checked because of auth or missing visual evidence.

### 8. Ready-to-run /delivery prompt

Provide a complete prompt:

```txt
/delivery

Task:
[implementation task]

Context:
[audit summary]

Requirements:
- ...

Files/components to inspect first:
- ...

Do not touch:
- ...

Verification:
- ...
```

## 7. Required behavior

Do not say “everything is fine” unless the audit contract was checked.

Do not say “verified” unless evidence exists.

Do not claim authenticated production cabinet UI was visually verified unless it actually was.

Do not block only because Google/Supabase auth prevents post-login production access. Use auth-safe audit status instead.

Do not write code during `/audit` unless the user explicitly asks to continue to `/delivery`.

Prefer direct, practical recommendations over abstract UX theory.
