# /audit-ui — UI Concept Audit Mode

Status: shared protocol for UI/UX design audit and concept selection.

Purpose: inspect screenshots, links, routes, or page descriptions and propose UI redesign directions before implementation.

`/audit-ui` is diagnostic and design-concept mode. It must not implement code by default.

## Input

Accept:

- screenshot or multiple screenshots;
- link or route;
- short description of UI problem;
- repo/project hint when available.

If input is partial, continue with available evidence and mark unknowns as `NOT VERIFIED`.

## Required chain

```txt
understand target
-> resolve project repo
-> inspect screenshot/link/route
-> inspect relevant UI code when available
-> diagnose current UI
-> run expert UI frameworks
-> run shared design skills and quality gates
-> list problems and opportunities
-> generate 5-7 improvement ideas
-> select top 3 UI concepts
-> create 3 visual artifacts or images
-> score concepts with decision rubric
-> compare the 3 concepts
-> choose recommended concept
-> run completeness gate
-> create/update GitHub issue
-> return concepts-ready report
-> wait for user concept choice or explicit /delivery
```

## Two-stage workflow

`/audit-ui` has two stages.

### Stage 1 — concept audit

Return:

```txt
STATUS: AUDIT_UI_CONCEPTS_READY
```

This means:

- 3 concepts are ready;
- visual artifacts/images or explicit visual-tool limitation are provided;
- issue is created or issue body is available;
- recommended concept is selected;
- implementation has not started.

### Stage 2 — selected concept handoff

Only after the user chooses a concept or explicitly invokes `/delivery`, prepare the final implementation handoff.

If the user writes `Concept B`, `second option`, `сделай второй`, or similar, use that concept as selected. Update/comment the GitHub issue if needed, then produce a `/delivery` prompt for that selected concept.

Do not auto-implement recommended concept only because it was recommended.

## Expert framework stack

Before proposing concepts, run:

```txt
docs/audit-ui-expert-frameworks.md
docs/audit-ui-decision-rubric.md
docs/audit-ui-completeness-gate.md
docs/audit-ui-visual-artifact-contract.md
```

Required lenses:

- product clarity;
- visual hierarchy;
- layout and rhythm;
- information architecture;
- interaction design;
- accessibility basics;
- perceived quality;
- mobile-first review;
- implementation realism.

## Design skill stack

Use:

- `jakubkrehel/make-interfaces-feel-better` when installed;
- `docs/audit-ui-expert-frameworks.md`;
- `docs/audit-ui-decision-rubric.md`;
- `docs/audit-ui-completeness-gate.md`;
- `docs/audit-ui-visual-artifact-contract.md`;
- fallback checklist from `docs/audit-ui-polish-skill.md` or equivalent;
- `docs/delivery-design-quality-gate.md`;
- visual hierarchy, spacing/rhythm, typography, density, contrast, CTA clarity;
- UX clarity, progressive disclosure, cognitive load, navigation clarity;
- mobile-first first-screen quality and desktop regression checks.

## Visual concept requirement

Follow:

```txt
docs/audit-ui-visual-artifact-contract.md
```

If image generation, drawing, Figma, Canva, or another visual tool is available, create 3 low/mid-fidelity visual mockups:

```txt
Concept A image
Concept B image
Concept C image
```

If running in Claude Code / Codex without image generation, create 3 visual artifact files instead of plain text only:

```txt
audit-ui-concept-a.svg
audit-ui-concept-b.svg
audit-ui-concept-c.svg
```

or one viewable HTML artifact:

```txt
audit-ui-concepts.html
```

If no visual tool or file write is available, say explicitly:

```txt
VISUAL_ARTIFACT_UNAVAILABLE
```

Then provide structured wireframes for all 3 concepts.

Do not silently replace images/artifacts with plain text wireframes.

## Completeness gate

Before finalizing, `/audit-ui` must pass:

```txt
docs/audit-ui-completeness-gate.md
```

It is incomplete unless it includes:

- 5-7 improvement ideas;
- 3 concepts;
- visual image/artifact or explicit `VISUAL_ARTIFACT_UNAVAILABLE` for all 3 concepts;
- scored comparison table;
- recommended concept;
- why this concept wins over the other two;
- GitHub issue full URL or issue body;
- short `/delivery` prompt for future use, but no automatic implementation.

If any required block is missing, return `STATUS: AUDIT_UI_INCOMPLETE`, list missing blocks, and complete them before finalizing.

## Diagnose current UI

Check:

- visual hierarchy;
- first screen composition;
- readability and text density;
- CTA clarity;
- navigation and duplicated controls;
- card/layout rhythm;
- mobile safe area and no accidental next-section cut;
- desktop layout quality;
- accessibility basics;
- trust/perceived quality;
- raw/debug-looking UI;
- consistency with product purpose.

## Output in GitHub issue

The issue must include:

- target screenshot/link/route;
- current UI diagnosis;
- expert framework review;
- UI anti-pattern checklist;
- confirmed problems;
- suspected problems;
- missed opportunities;
- 5-7 improvement ideas;
- top 3 concepts;
- image references, SVG/HTML artifact paths, or explicit `VISUAL_ARTIFACT_UNAVAILABLE` for all 3 concepts;
- scored comparison table from `docs/audit-ui-decision-rubric.md`;
- recommended concept;
- selected concept: `PENDING_USER_CHOICE` until user chooses;
- implementation direction for each concept;
- do-not-touch rules;
- mobile and desktop verification plan;
- design quality gate;
- ready-to-run `/delivery` prompt for recommended concept and note how to switch to Concept 2 or 3.

If the issue only contains one recommended option and not 3 concepts, it is not a valid `/audit-ui` issue.

## Chat output

When an issue is created, do not duplicate the full issue body in chat, but still include the concept summary and visual references.

Return:

```txt
STATUS: AUDIT_UI_CONCEPTS_READY | AUDIT_UI_PARTIAL | AUDIT_UI_BLOCKED | AUDIT_UI_COMPLETE_ISSUE_NOT_CREATED

3 best concepts:
1. Concept A — ...
2. Concept B — ...
3. Concept C — ...

Recommended: Concept X
Why: ...

Visual concepts:
A: image attached | artifact path | VISUAL_ARTIFACT_UNAVAILABLE
B: image attached | artifact path | VISUAL_ARTIFACT_UNAVAILABLE
C: image attached | artifact path | VISUAL_ARTIFACT_UNAVAILABLE

GitHub issue:
<full issue URL>

Choose one:
- Concept A
- Concept B
- Concept C

Future prompt after choice:
/delivery
Task:
Implement the selected UI concept from issue <issue URL>. Follow the design quality gate and do not touch unrelated flows.
```

Do not return only one concept. The user must be able to choose Concept 1, 2, or 3 from the chat response.

## Selection rule

Choose the recommended concept by scoring:

- clarity;
- visual quality;
- mobile first-screen quality;
- CTA/action clarity;
- information architecture;
- accessibility basics;
- implementation effort;
- regression risk;
- product fit;
- ability to preserve existing behavior.

The user may still choose Concept 2 or Concept 3. The report must make this easy.
