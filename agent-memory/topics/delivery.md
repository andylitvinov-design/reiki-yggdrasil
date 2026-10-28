# delivery memory

## 2026-06-28 — Delivery must trigger learning/memory update for integration misses

Type: workflow_lesson  
Memory type: procedural  
Scope: delivery / learn-pass / authenticated UI verification  
Priority: high  
Status: active  

Evidence:
- `https://github.com/andylitvinov-design/reiki-yggdrasil/issues/482`
- The audit created an issue but did not immediately initiate project-memory update / learn-pass.

Lesson:
When `/audit-ui` or `/delivery` discovers a reusable integration miss, the agent must not only create/update the GitHub issue. It must also trigger a memory update path: `/save` for user-confirmed lessons or `/learn-pass` candidate/metrics for agent-detected lessons.

Apply when:
- Creating follow-up issues from audit findings.
- Detecting mismatch between technical implementation and real live UI.
- Closing or handing off delivery work.

Check:
- Final report includes `Applied memory` when old rules were used.
- Final report includes `Learning Pass` when a new reusable lesson was found.
- If the issue requires future memory update, the delivery prompt explicitly says to update `STATE.md`, `LOG.md`, and relevant `agent-memory` files.

Failure if ignored:
- The same type of integration failure may repeat because the lesson only exists in a GitHub issue, not in project memory.

Required prompt line for issue #482 delivery:
- After implementation, update `STATE.md` and `LOG.md` with the memory note: #480 backend worked, but real authenticated Profile Lite nav missed “Мои курсы”; future cabinet features must verify visible nav, not only deep links.
