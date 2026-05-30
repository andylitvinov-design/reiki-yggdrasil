# Reiki Yggdrasil Debugger Documentation Index

Status: v1.
Purpose: make the debugger-agent infrastructure easy to discover for ChatGPT, Codex, and future maintainers.

## Start here

1. `REIKI_DEBUGGER_PLAYBOOK.md`
   - main operating protocol for the debugger agent;
   - context-first rules;
   - bug classification;
   - Codex prompt standard;
   - post-fix verification.

2. `REIKI_BUG_INTAKE_TEMPLATE.md`
   - first-pass bug intake form;
   - task types;
   - maximum one clarifying question before self-checks.

3. `REIKI_BUG_TAXONOMY.md`
   - canonical bug classes:
     - deploy mismatch;
     - routing;
     - auth;
     - Supabase RLS;
     - storage/media;
     - desktop/mobile layout;
     - state management;
     - data contract;
     - course content;
     - admin moderation;
     - service order flow;
     - print/download/export.

4. `REIKI_EVIDENCE_COLLECTION_PROTOCOL.md`
   - evidence levels E0-E4;
   - confirmed vs likely vs possible vs needs verification;
   - required bug report fields.

5. `REIKI_ROOT_CAUSE_MATRIX.md`
   - symptom-to-root-cause lookup;
   - verification order;
   - likely files/areas;
   - anti-patterns.

6. `REIKI_DEBUG_SCENARIO_COOKBOOK.md`
   - practical recipes for frequent failures:
     - Codex done but not visible on live;
     - mobile layout broken;
     - desktop layout collapsed;
     - image disappears after reload;
     - OAuth wrong return;
     - service order loses format;
     - admin moderation empty;
     - public private-ref leak;
     - print/download missing images;
     - content validator warnings.

7. `REIKI_CODEX_REPAIR_LOOP.md`
   - what to do after Codex says done;
   - not visible on live;
   - failed checks;
   - UI regression;
   - data/auth/storage regression.

8. `REIKI_LIVE_AUDIT_CHECKLIST.md`
   - production/preview audit tables;
   - deploy, route, layout, auth, Supabase, media, service order, and public safety checks.

9. `REIKI_DEBUGGER_VERIFICATION_RUNBOOK.md`
   - local verification commands;
   - Vercel status verification;
   - browser QA matrix;
   - completion rule.

10. `REIKI_DEBUGGER_QUALITY_RUBRIC.md`
    - answer quality scorecard;
    - mandatory self-checks;
    - red flags and preferred wording.

11. `REIKI_DEBUGGER_STATE_LOG_UPDATE_2026-05-30.md`
    - proposed STATE.md / LOG.md update text for the debugger infrastructure.

## Related docs outside this folder

- `docs/ui-contracts/REIKI_PROFILE_UI_CONTRACT.md`
- `docs/supabase/REIKI_SUPABASE_CONTRACT.md`
- `docs/media/REIKI_MEDIA_STORAGE_CONTRACT.md`
- `docs/prompts/CODEX_REIKI_DEBUG_PROMPT_TEMPLATE.md`

## Code contracts

- `src/lib/reikiDebugSnapshot.js`
  - static JSON-safe debug contract snapshot;
  - env presence booleans only;
  - UI/Supabase/media/intake/evidence/repair/quality contracts.

- `scripts/verify-reiki-debug-contract.mjs`
  - verifies the snapshot contract;
  - wired into `npm run check` through `npm run verify:debug-contract`.

## Recommended reading order for bug work

```text
1. AGENTS.md
2. README.md
3. STATE.md
4. LOG.md
5. docs/debug/README.md
6. docs/debug/REIKI_BUG_INTAKE_TEMPLATE.md
7. docs/debug/REIKI_BUG_TAXONOMY.md
8. docs/debug/REIKI_EVIDENCE_COLLECTION_PROTOCOL.md
9. docs/debug/REIKI_ROOT_CAUSE_MATRIX.md
10. relevant scenario/runbook/contract docs
11. relevant source files
```

## Recommended reading order for Codex fix prompts

```text
1. AGENTS.md
2. docs/debug/REIKI_DEBUGGER_PLAYBOOK.md
3. docs/debug/REIKI_BUG_TAXONOMY.md
4. docs/debug/REIKI_EVIDENCE_COLLECTION_PROTOCOL.md
5. docs/debug/REIKI_ROOT_CAUSE_MATRIX.md
6. docs/prompts/CODEX_REIKI_DEBUG_PROMPT_TEMPLATE.md
7. relevant UI/Supabase/media contract
8. relevant source files
```

## Completion rule

For any debug task, report:

- evidence level;
- bug class;
- changed files or no repo changes;
- checks run or not run;
- Vercel/live status;
- what was verified;
- what remains `needs verification`;
- risks;
- next action.
