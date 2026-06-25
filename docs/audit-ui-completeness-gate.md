# /audit-ui — Completeness Gate

Status: mandatory completion gate for `/audit-ui`.

`/audit-ui` must not finish like a normal `/audit`. It is incomplete unless it includes concept exploration, visual direction, and design decision support.

## Required before concepts-ready status

A valid `/audit-ui` response or issue must include all of these:

1. Current UI diagnosis.
2. Confirmed / likely / not verified issues.
3. 5-7 improvement ideas.
4. Top 3 concepts.
5. Visual sketch/mockup direction for each of the 3 concepts.
6. Scored comparison table for the 3 concepts.
7. Recommended concept.
8. Explanation why this concept wins over the other two.
9. GitHub issue URL or full issue body.
10. Clear user choice prompt: Concept A / Concept B / Concept C.
11. Future `/delivery` prompt, but no automatic implementation.

If any item is missing, return:

```txt
STATUS: AUDIT_UI_INCOMPLETE
Missing blocks:
- ...
```

Then complete the missing blocks before finalizing.

## Required status

A complete first-stage `/audit-ui` report should use:

```txt
STATUS: AUDIT_UI_CONCEPTS_READY
```

Use `STATUS: AUDIT_UI_COMPLETE` only after the user has chosen a concept and the final implementation handoff is prepared.

## Visual output rule

Prefer actual visual outputs for the 3 concepts when image generation, Figma, Canva, or drawing tools are available:

```txt
Concept A image
Concept B image
Concept C image
```

If visual generation is unavailable, provide structured wireframes for all 3 concepts.

Do not skip visual/sketch output.

## Chat output minimum

Even when a GitHub issue is created, chat must still show:

```txt
STATUS: AUDIT_UI_CONCEPTS_READY

3 best concepts:
1. Concept A — <one-line summary>
2. Concept B — <one-line summary>
3. Concept C — <one-line summary>

Recommended: Concept X
Why: <short reason>

Visual concepts:
A: image attached / wireframe described
B: image attached / wireframe described
C: image attached / wireframe described

GitHub issue:
<full URL>

Choose one:
- Concept A
- Concept B
- Concept C

Future prompt:
/delivery
Task:
Implement the selected concept from <issue URL>.
```

Do not only say “Concept 1 recommended”. The user must be able to choose Concept 1, 2, or 3 from the chat response.

## Issue output minimum

The issue must include:

- 5-7 ideas;
- 3 concepts;
- visual/sketch/mockup directions or image references;
- scoring table;
- recommended concept;
- selected concept: `PENDING_USER_CHOICE`;
- implementation prompt for recommended concept and note how to switch to Concept B/C.

If the issue only contains one recommended option, it is not a valid `/audit-ui` issue.

## Wireframe fallback

If visual sketch generation is unavailable, provide structured wireframes:

```txt
Concept A
[Header]
[Main action]
[Secondary area]
[Next step]
```

Do this for all 3 concepts.
