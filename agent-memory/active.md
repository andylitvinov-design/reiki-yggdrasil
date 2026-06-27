# Active Agent Memory

This file contains only high-value active rules that should be loaded before `/delivery`, `/audit`, and `/save`.

Hard cap:

```txt
30–50 active rules maximum
```

If this file grows beyond the cap, run `/memory-review`.

---

## Memory system rule

Type: rule  
Memory type: procedural  
Scope: global / agent-memory  
Priority: high  
Status: active  

User signal:
> Project uses the reusable `/save` learning loop.

Evidence:
- Linked brain spec: `ai-projects-brain/agent-skills/save.md`

Lesson:
Memory is not a raw log. Agents must save only reusable, scoped, checkable lessons. `/save` must behave as upsert, not append.

Apply when:
- Running `/save`
- Running `/delivery`
- Running `/audit`
- Updating agent-memory files

Check:
- New memory items include `Apply when`, `Check`, and `Failure if ignored`.
- Similar rules are merged instead of duplicated.

Failure if ignored:
- Agent memory may become a giant instruction dump that agents stop reading or applying.

Avoid:
- Raw chat dumps
- Duplicate rules
- Contradictory active rules
- One-time visual tweaks in active memory

Last applied:
- never

Related files/components:
- agent-memory/index.md
