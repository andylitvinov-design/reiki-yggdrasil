# /audit-ui — Visual Artifact Contract

Status: required visual output contract for `/audit-ui`.

Goal: make the 3 concepts visually reviewable, not only text descriptions.

## HARD GATE — three separate artifacts

For `/audit-ui`, the visual artifact requirement is satisfied only if there are **three separate standalone concept artifacts**:

- one standalone visual for Concept A;
- one standalone visual for Concept B;
- one standalone visual for Concept C.

A single combined comparison board, infographic, poster, collage, or screenshot that contains A/B/C together does **not** satisfy this requirement.
It may be added as an optional fourth overview artifact, but it cannot replace the three separate concept images/artifacts.

Before final answer, the agent must fill:

| Concept | Required standalone visual | Status | Reference |
|---|---|---|---|
| A | Concept A image/artifact only | PASS/FAIL | inline image / downloadable link / `VISUAL_ARTIFACT_UNAVAILABLE` with blocker |
| B | Concept B image/artifact only | PASS/FAIL | inline image / downloadable link / `VISUAL_ARTIFACT_UNAVAILABLE` with blocker |
| C | Concept C image/artifact only | PASS/FAIL | inline image / downloadable link / `VISUAL_ARTIFACT_UNAVAILABLE` with blocker |

If any row is not `PASS`, return `STATUS: AUDIT_UI_INCOMPLETE`, list the missing visual artifacts, and complete them before finalizing.

## Mandatory fallback order

Do **not** return `VISUAL_ARTIFACT_UNAVAILABLE` just because native image generation is unavailable.

Use this fallback order for every `/audit-ui`:

1. **Native image generation / drawing tool available**
   - Generate 3 separate concept images in the chat.
   - Place each image inline under its concept summary when the platform supports inline preview.

2. **No native image generation, but file output is available**
   - Create 3 separate downloadable PNG/SVG/HTML visual artifacts via Python/PIL, SVG, canvas, HTML, or another file-writing method.
   - Prefer PNG/SVG for mobile UI mockups.
   - Link each artifact directly in the final response.
   - If the chat UI renders sandbox/file images inline automatically, still provide the download link as proof.

3. **No visual or file artifact path exists**
   - Only then return `VISUAL_ARTIFACT_UNAVAILABLE`.
   - Explain the blocker.
   - Provide structured text wireframes for all 3 concepts.

Never mark visual artifacts unavailable when downloadable PNG/SVG/HTML mockups can be created.
Never use only text wireframes when file artifact creation is available.
Never count one combined board as three standalone concept artifacts.

## Environment rules

### ChatGPT with image generation

If image generation is available, generate 3 separate concept images in the chat:

```txt
Concept A image
Concept B image
Concept C image
```

Each image should be a low/mid-fidelity UI mockup, not a final polished screenshot.

The images must be standalone per concept. Do not combine A/B/C into one board as the only visual output.

### ChatGPT or other environments with Python/file artifact creation

If native image generation is unavailable but Python, SVG, HTML, canvas, or file output is available, create 3 visual artifact files instead of plain text only:

```txt
audit-ui-concept-a.png | audit-ui-concept-a.svg
audit-ui-concept-b.png | audit-ui-concept-b.svg
audit-ui-concept-c.png | audit-ui-concept-c.svg
```

or one HTML artifact with **three distinct viewable concept sections** and explicit anchors/paths for A, B, and C:

```txt
audit-ui-concepts.html#concept-a
audit-ui-concepts.html#concept-b
audit-ui-concepts.html#concept-c
```

The artifacts may be simple wireframe PNG/SVG/HTML mockups, but they must be viewable visually.

In the final chat response, prefer inline image placement when supported. If inline placement is not supported, provide direct downloadable links.

A combined comparison board can be included only as an optional overview, not as the required concept artifact.

### Claude Code / Codex without image generation

If no image generation tool is available, create 3 visual artifact files instead of plain text only whenever file writing is available:

```txt
audit-ui-concept-a.svg
audit-ui-concept-b.svg
audit-ui-concept-c.svg
```

or one HTML artifact with **three distinct viewable concept sections** and explicit anchors/paths for A, B, and C:

```txt
audit-ui-concepts.html#concept-a
audit-ui-concepts.html#concept-b
audit-ui-concepts.html#concept-c
```

The artifacts may be simple wireframe SVG/HTML mockups, but they must be viewable visually.

A combined comparison board can be included only as an optional overview, not as the required concept artifact.

### If no file write or visual tool is available

Return this only as a last resort:

```txt
VISUAL_ARTIFACT_UNAVAILABLE
```

Then provide structured text wireframes for all 3 concepts and explain the blocker.

## Minimum visual artifact content

Each visual concept must show:

- header/navigation structure;
- primary content block;
- primary CTA;
- secondary action area;
- mobile first-screen layout;
- key text hierarchy.

## GitHub issue requirement

The issue must include either:

- attached/generated images for A, B, and C separately;
- links/paths to downloadable PNG/SVG/HTML artifacts for A, B, and C separately;
- or `VISUAL_ARTIFACT_UNAVAILABLE` with the reason/blocker for each concept.

Required table:

| Concept | Visual artifact | Status |
|---|---|---|
| A | inline image / downloadable artifact link / VISUAL_ARTIFACT_UNAVAILABLE with blocker | PASS/FAIL |
| B | inline image / downloadable artifact link / VISUAL_ARTIFACT_UNAVAILABLE with blocker | PASS/FAIL |
| C | inline image / downloadable artifact link / VISUAL_ARTIFACT_UNAVAILABLE with blocker | PASS/FAIL |

If it contains only text wireframes without declaring visual artifact unavailability, the issue is incomplete.
If A/B/C are present only inside one combined board/poster, the issue is incomplete.
If `VISUAL_ARTIFACT_UNAVAILABLE` is used while file/artifact creation is available, the issue is incomplete.

## Chat output requirement

Chat must say:

```txt
Visual concepts:
A: <inline image attached | downloadable artifact link | VISUAL_ARTIFACT_UNAVAILABLE with blocker>
B: <inline image attached | downloadable artifact link | VISUAL_ARTIFACT_UNAVAILABLE with blocker>
C: <inline image attached | downloadable artifact link | VISUAL_ARTIFACT_UNAVAILABLE with blocker>
```

If a combined overview board is also provided, label it as optional and do not count it as A/B/C visual proof.