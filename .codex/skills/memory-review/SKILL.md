# /memory-review — Maintain Agent Memory

Use this skill when the user asks to clean, compact, merge, or repair saved agent memory.

Canonical brain spec:

```txt
ai-projects-brain/agent-skills/memory-review.md
```

## Trigger

```txt
/memory-review
```

## Behavior

1. Locate `agent-memory/`.
2. Read `active.md` and `index.md`.
3. Read topic/component files only as needed.
4. Use archive only for conflict or replacement checks.
5. Merge duplicate rules.
6. Resolve conflicting active rules.
7. Move low-value items out of active memory.
8. Ensure active rules have `Apply when`, `Check`, and `Failure if ignored`.
9. Report what changed.
