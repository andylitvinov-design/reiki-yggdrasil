# /save — Durable Agent Memory

Use this command when the user wants to save an important lesson, correction, rule, product decision, workflow lesson, or durable preference from the current task into project memory.

Canonical brain specs:

```txt
ai-projects-brain/agent-skills/save.md
ai-projects-brain/agent-skills/save-runtime.md
```

## Runtime protocol

1. Locate the current project root.
2. Locate or create `./agent-memory/`.
3. Read `agent-memory/active.md` and `agent-memory/index.md`.
4. Extract the durable lesson from the user's message.
5. Classify the lesson.
6. Assign memory type: procedural / semantic / episodic.
7. Upsert, do not append blindly.
8. Merge duplicates.
9. Replace contradictions.
10. Ensure active memory includes `Apply when`, `Check`, and `Failure if ignored`.
11. Report what was saved or why nothing was saved.
