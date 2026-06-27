# /memory — Read Active Agent Memory

Use this skill when the user asks to view current saved agent memory, active rules, or memory for a topic.

Canonical brain spec:

```txt
ai-projects-brain/agent-skills/memory.md
```

## Trigger

```txt
/memory
/memory <topic>
покажи память
что в памяти по теме
```

## Behavior

1. Locate `agent-memory/`.
2. Read `active.md` and `index.md`.
3. If topic is provided, read only relevant topic/component memory.
4. Do not load archive by default.
5. Return a short actionable summary.
