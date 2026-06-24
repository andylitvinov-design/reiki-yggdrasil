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
-> create 3 sketch/mockup directions when possible
-> score concepts with decision rubric
-> compare the 3 concepts
-> choose recommended concept
-> create/update GitHub issue
-> return short report + /delivery prompt
```

## Expert framework stack

Before proposing concepts, run:

```txt
docs/audit-ui-expert-frameworks.md
docs/audit-ui-decision-rubric.md
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
- fallback checklist from `docs/audit-ui-polish-skill.md` or equivalent;
- `docs/delivery-design-quality-gate.md`;
- visual hierarchy, spacing/rhythm, typography, density, contrast, CTA clarity;
- UX clarity, progressive disclosure, cognitive load, navigation clarity;
- mobile-first first-screen quality and desktop regression checks.

If image generation or drawing tools are available and the user asked for sketches, produce 3 low/mid-fidelity visual concept sketches. If not available, provide structured ASCII/wireframe/layout descriptions for the 3 concepts.

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
- sketch/mockup notes for all 3 concepts;
- scored comparison table from `docs/audit-ui-decision-rubric.md`;
- recommended concept;
- implementation direction;
- do-not-touch rules;
- mobile and desktop verification plan;
- design quality gate;
- ready-to-run `/delivery` prompt.

## Chat output

When an issue is created, do not duplicate the full issue body in chat.

Return:

```txt
STATUS: AUDIT_UI_COMPLETE | AUDIT_UI_PARTIAL | AUDIT_UI_BLOCKED | AUDIT_UI_COMPLETE_ISSUE_NOT_CREATED

3 best concepts:
1. ...
2. ...
3. ...

Recommended: Concept X
Why: ...

Sketches:
- Sketch A: attached / described
- Sketch B: attached / described
- Sketch C: attached / described

GitHub issue:
<issue URL>

Prompt:
/delivery
Task:
Implement the recommended UI concept from issue <issue URL>. Keep Concept 2 and Concept 3 as fallback alternatives if the recommended concept proves risky. Follow the design quality gate and do not touch unrelated flows.
```

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
