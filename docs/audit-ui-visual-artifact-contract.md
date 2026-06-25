# /audit-ui — Visual Artifact Contract

Status: required visual output contract for `/audit-ui`.

Goal: make the 3 concepts visually reviewable, not only text descriptions.

## Environment rules

### ChatGPT with image generation

If image generation is available, generate 3 separate concept images in the chat:

```txt
Concept A image
Concept B image
Concept C image
```

Each image should be a low/mid-fidelity UI mockup, not a final polished screenshot.

### Claude Code / Codex without image generation

If no image generation tool is available, create 3 visual artifact files instead of plain text only:

```txt
audit-ui-concept-a.svg
audit-ui-concept-b.svg
audit-ui-concept-c.svg
```

or:

```txt
audit-ui-concepts.html
```

The artifacts may be simple wireframe SVG/HTML mockups, but they must be viewable visually.

### If no file write or visual tool is available

Return:

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

- attached/generated images;
- links/paths to SVG/HTML artifacts;
- or `VISUAL_ARTIFACT_UNAVAILABLE` with the reason.

If it contains only text wireframes without declaring visual artifact unavailability, the issue is incomplete.

## Chat output requirement

Chat must say:

```txt
Visual concepts:
A: <image attached | artifact path | VISUAL_ARTIFACT_UNAVAILABLE>
B: <image attached | artifact path | VISUAL_ARTIFACT_UNAVAILABLE>
C: <image attached | artifact path | VISUAL_ARTIFACT_UNAVAILABLE>
```
