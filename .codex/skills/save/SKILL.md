# /save — Durable Agent Memory

Use this skill when the user wants to save an important lesson, correction, rule, product decision, workflow lesson, or durable preference from the current task into project memory.

Canonical brain specs:

```txt
ai-projects-brain/agent-skills/save.md
ai-projects-brain/agent-skills/save-runtime.md
```

## Trigger

```txt
/save
save this
занеси в память
запомни
память:
ошибка:
правило:
решение:
```

## Required behavior

1. Locate or create local `./agent-memory/`.
2. Read `agent-memory/active.md` and `agent-memory/index.md`.
3. Extract the durable lesson.
4. Classify it as mistake / rule / product decision / UX decision / user preference / workflow lesson / component note.
5. Assign memory type: procedural / semantic / episodic.
6. Upsert, do not append blindly.
7. Merge duplicates.
8. Mark superseded rules as `replaced`.
9. Ensure active memory has `Apply when`, `Check`, and `Failure if ignored`.
10. Report what was created / updated / merged / replaced.
