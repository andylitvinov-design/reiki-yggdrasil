# /audit-ui — Expert UI Review Frameworks

Status: shared expert-template layer for `/audit-ui`.

Use this before creating UI concepts or choosing a recommended design.

## Required expert lenses

### 1. Product clarity

Check:

- what is the page for;
- who is the main user;
- what is the one primary action;
- whether secondary actions are visually quieter;
- whether the screen explains itself without extra context.

### 2. Visual hierarchy

Check:

- one dominant headline or focal block;
- clear CTA priority;
- readable grouping;
- no competing chips/tabs/cards;
- important content is not visually equal to secondary content.

### 3. Layout and rhythm

Check:

- spacing consistency;
- card rhythm;
- vertical flow;
- first-screen composition;
- accidental cut of the next block;
- mobile safe area;
- desktop balance.

### 4. Information architecture

Check:

- navigation depth;
- duplicated menus;
- whether related actions are grouped;
- whether user understands where to go next;
- whether filters/tabs are too many or unclear.

### 5. Interaction design

Check:

- button states;
- clickable areas;
- feedback after action;
- empty/loading/error states;
- form clarity;
- save/continue/back flow.

### 6. Accessibility basics

Check:

- contrast;
- text size;
- tap targets;
- focus order;
- labels;
- reduced cognitive load.

### 7. Perceived quality

Check:

- does it feel finished or raw;
- does it feel calm/trustworthy;
- does it look like debug/admin UI when it should not;
- does visual language fit product tone.

### 8. Mobile-first review

Check:

- first screen completeness;
- CTA visibility;
- no cramped top area;
- no duplicated nav rows;
- no horizontal overflow;
- no fixed footer/header conflicts.

### 9. Implementation realism

For each concept, score:

```txt
impact: low / medium / high
effort: low / medium / high
risk: low / medium / high
```

Prefer concepts that improve the UI strongly without rewriting unrelated flows.

## Concept generation rule

Generate 5-7 ideas, then choose top 3 concepts using these lenses:

- clarity;
- beauty/perceived quality;
- mobile quality;
- implementation effort;
- regression risk;
- product fit.

## Concept comparison table

Every `/audit-ui` issue should include:

```md
| Concept | Core idea | Strength | Weakness | Effort | Risk | Score |
|---|---|---|---|---|---|---|
```

## Sketch direction rule

For each of top 3 concepts provide either:

- generated visual sketch/mockup, if tools are available;
- or structured wireframe description with sections, layout, hierarchy, CTA, and mobile behavior.
