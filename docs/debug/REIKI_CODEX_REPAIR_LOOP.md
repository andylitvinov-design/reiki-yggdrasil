# Reiki Yggdrasil — Codex Repair Loop

Status: v1.
Purpose: define how the debugger agent should react when a Codex fix is incomplete, not visible on live, breaks checks, or creates a regression.

## 1. Repair loop states

### State A — Task prepared

A bug report and Codex prompt exist, but no implementation result has been received.

Required:

- bug class;
- affected route/viewport;
- likely files;
- minimal safe fix;
- checks to run.

### State B — Codex reported done

Codex says the task is complete.

Do not accept this at face value. Verify:

- branch;
- PR or commit;
- changed files;
- checks run;
- preview URL;
- live/deploy status;
- what was not verified.

### State C — Not visible on live

If the user says “I do not see it on live,” classify first as `DEPLOY_MISMATCH` until disproven.

Check in order:

1. Was the change committed?
2. Was a PR created?
3. Was PR merged to `main`?
4. Did Vercel build the merge commit?
5. Is Vercel status success?
6. Is the user viewing the correct domain?
7. Is the feature behind auth/role/state?
8. Is browser cache involved?

Only after these checks should UI/CSS be blamed.

### State D — Checks failed

If tests/build fail:

1. identify the first failing command;
2. identify the first concrete error;
3. map it to a bug class;
4. create a narrow repair prompt using the exact error;
5. rerun the failing command before broader checks.

Do not ask Codex to “fix all errors” without the first failing error.

### State E — UI regression

If a fix creates a visual regression:

1. identify affected route and viewport;
2. compare expected UI contract;
3. inspect changed files only first;
4. prefer revert/narrow patch over redesign;
5. rerun desktop/mobile matrix.

### State F — Data/Auth regression

If a fix creates data/auth/storage regression:

1. identify table/bucket/action;
2. identify anon/auth/admin path;
3. check whether migration was changed or only frontend changed;
4. avoid broad RLS loosening;
5. mark live session checks as `needs verification` if not tested.

## 2. Post-Codex acceptance checklist

A Codex result can be accepted only if the report contains:

```text
Branch:
Commit/PR:
Changed files:
Checks run:
Preview URL:
Live status:
Routes checked:
Desktop/mobile checked:
Supabase/Auth/Storage verified or needs verification:
Risks:
```

If any field is missing, ask for a repair/status pass, not another feature change.

## 3. Repair prompt template

```text
Repo: https://github.com/andylitvinov-design/reiki-yggdrasil
Branch/PR/commit to inspect: <value>
Bug class: <class>
Repair state: Not visible on live / checks failed / UI regression / auth-data regression

Context:
- Original task: <summary>
- Codex reported: <summary>
- Actual problem now: <symptom>

Evidence:
- Commit/PR: <value>
- Vercel status: <value>
- Failing command or route: <value>
- Exact error/screenshot notes: <value>

First inspect:
- changed files in the last fix
- docs/debug/REIKI_DEBUGGER_PLAYBOOK.md
- docs/debug/REIKI_BUG_TAXONOMY.md
- docs/debug/REIKI_EVIDENCE_COLLECTION_PROTOCOL.md
- relevant source files only

Task:
- Find the smallest reason the previous fix failed.
- Do not redesign or rewrite unrelated code.
- Prefer a narrow patch or rollback of the bad part.
- Preserve RU-default, routes, desktop three-column layout, mobile fallback, Supabase/Auth/Storage boundaries.

Run:
- npm run verify:debug-contract
- failing targeted command
- npm run check
- npm run build

Report:
- root cause
- changed files
- checks run
- what is now verified
- what remains needs verification
- live/preview status
```

## 4. Failed live visibility protocol

When a change is not visible on live, use this answer format:

```text
Primary classification: DEPLOY_MISMATCH until disproven.
Confirmed:
- <commit/PR/deploy facts>
Not confirmed:
- <live route/browser facts>
Next checks:
1. <check>
2. <check>
3. <check>
Only after these pass will I treat it as a UI/state bug.
```

## 5. Failed checks protocol

When a check fails, use:

```text
First failing command:
First error:
Likely file:
Bug class:
Minimal repair:
Do not touch:
Rerun order:
```

Rerun order:

1. failing targeted command;
2. `npm run verify:debug-contract` if debug contract touched;
3. `npm run check`;
4. `npm run build`.

## 6. Regression containment rules

- Patch changed files first before touching new areas.
- If a CSS fix caused layout regressions, scope it to route/component/viewport.
- If a state fix caused auth/persistence regressions, isolate state owner/reset path.
- If a data fix caused public leak risk, stop and restore private/public boundary first.
- If production differs from preview, treat deploy/domain/env as primary until disproven.

## 7. Escalation rules

Escalate from “fix prompt” to “analysis prompt” when:

- the bug spans more than two layers;
- live and preview conflict;
- Supabase/Auth/Storage live behavior is unknown;
- more than one repair attempt failed;
- the fix might require schema/RLS changes;
- user screenshots contradict Codex report.

## 8. Completion rule

The repair loop closes only when:

- root cause is stated;
- fix is committed;
- checks are run or marked not run with reason;
- route/viewport/live verification is documented;
- remaining uncertainty is explicitly listed.
