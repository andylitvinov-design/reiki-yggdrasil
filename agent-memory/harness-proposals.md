# Harness Proposals

Use this file only during `/upgrade`, `/learn-pass`, or `/memory-review`.

Harness proposals are not active rules until validated and promoted.

## 2026-06-29 — Align project memory with `/upgrade` router

Type: harness_proposal  
Scope: reiki-yggdrasil / agent-memory  
Status: validated_applied  
Risk: low  

Problem:
- `AGENTS.md` includes an `/upgrade` memory router, but local `agent-memory/active.md` and `agent-memory/index.md` were still on the older `/save` + `/learn-pass` + `/memory-review` lifecycle wording.

Minimal harness change:
- Add `/upgrade` to active memory lifecycle wording.
- Route harness proposal/regression files as maintenance-only context.
- Keep product code, auth, data, deploy, and payment behavior untouched.

Expected behavior change:
- `/upgrade` runs can find proposal/regression files without loading the whole memory tree.
- Normal `/delivery` and `/audit` work still loads only compact memory and relevant topics.

Regression risk:
- Very low: Markdown-only memory routing update.

Validation result:
- Passed by inspection: router remains lazy-loaded; no source/product files changed.
