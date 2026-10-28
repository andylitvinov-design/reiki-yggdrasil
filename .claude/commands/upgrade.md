# /upgrade — Safe Agent Harness Upgrade

Use this command to improve the agent system itself: prompts, command adapters, routing rules, memory schemas, validation gates, installer templates, or tool-use workflows.

Canonical brain specs:

```txt
agent-skills/upgrade.md
agent-skills/self-harness.md
```

## Runtime

1. Read relevant memory:
   - `agent-memory/active.md`
   - `agent-memory/index.md`
   - `agent-memory/candidates.md`
   - `agent-memory/metrics.md`
   - `agent-memory/harness-proposals.md`
   - `agent-memory/harness-regression-tests.md`
2. Mine recurring weaknesses.
3. Propose the smallest harness change.
4. Validate with a smoke test, replay, checklist, or user confirmation.
5. Apply only safe Markdown harness changes.
6. For high-risk/global changes, create an issue/PR handoff.
7. Report `Upgrade` with weakness, proposal, validation, changes, risk, and next check.

Do not change product code unless explicitly requested.
