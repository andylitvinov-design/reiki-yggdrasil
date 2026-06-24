# /audit-ui — Completeness Gate

Status: mandatory completion gate for `/audit-ui`.

`/audit-ui` must not finish like a normal `/audit`. It is incomplete unless it includes concept exploration and design decision support.

## Required before completion

A valid `/audit-ui` response or issue must include all of these:

1. Current UI diagnosis.
2. Confirmed / likely / not verified issues.
3. 5-7 improvement ideas.
4. Top 3 concepts.
5. Sketch/mockup direction for each of the 3 concepts.
6. Scored comparison table for the 3 concepts.
7. Recommended concept.
8. Explanation why this concept wins over the other two.
9. GitHub issue URL or full issue body.
10. Short `/delivery` prompt.

If any item is missing, return:

```txt
STATUS: AUDIT_UI_INCOMPLETE
Missing blocks:
- ...
```

Then complete the missing blocks before finalizing.

## Chat output minimum

Even when a GitHub issue is created, chat must still show:

```txt
3 best concepts:
1. Concept A — <one-line summary>
2. Concept B — <one-line summary>
3. Concept C — <one-line summary>

Recommended: Concept X
Why: <short reason>

Sketch directions:
A: <layout idea>
B: <layout idea>
C: <layout idea>

GitHub issue:
<full URL>

Prompt:
/delivery
Task:
...
```

Do not only say “Concept 1 recommended”. The user must be able to choose Concept 1, 2, or 3 from the chat response.

## Issue output minimum

The issue must include:

- 5-7 ideas;
- 3 concepts;
- sketch/mockup directions;
- scoring table;
- recommended concept;
- implementation prompt.

If the issue only contains one recommended option, it is not a valid `/audit-ui` issue.

## Sketch fallback

If visual sketch generation is unavailable, provide structured wireframes:

```txt
Concept A
[Header]
[Main action]
[Secondary area]
[Next step]
```

Do this for all 3 concepts.
