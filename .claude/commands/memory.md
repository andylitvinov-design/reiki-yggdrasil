# /memory — Read Active Agent Memory

Use this command when the user asks to view current saved memory or memory for a specific topic.

Canonical brain spec:

```txt
ai-projects-brain/agent-skills/memory.md
```

## Runtime

1. Locate `agent-memory/`.
2. Read `active.md` and `index.md`.
3. If a topic is provided, read only relevant topic/component memory.
4. Do not load archive by default.
5. Return a short actionable summary.
