# Reiki Yggdrasil — Bug Intake Template

Status: v1.
Purpose: give the debugger agent a standard first-pass form before analysis or Codex prompting.

Use this template when the user reports a bug, design mismatch, live mismatch, auth issue, media issue, or service order issue.

## 1. Minimal intake

```text
Project: Reiki Yggdrasil
Task type: bug / design_mismatch / live_mismatch / auth_data_flow / media_storage / service_order / content / quality_audit
User symptom:
Affected URL/route:
Environment: live / preview / local / unknown
Device/viewport:
Auth state: unauthenticated / authenticated / admin / unknown
Expected behavior:
Actual behavior:
Evidence provided: text / screenshot / video / Codex report / PR / commit / none
Urgency/risk:
```

## 2. Agent first response rules

If the user gave enough evidence, do not ask broad questions. Start analysis.

Ask at most one clarifying question only when a required field is missing and cannot be inferred from repo/project context.

Prefer self-checks over questions:

- check repo context;
- check latest STATE/LOG;
- check changed files/commit when provided;
- check Vercel status when commit is known;
- classify the bug layer.

## 3. Required classification

Before Codex prompt, fill:

```text
Primary class:
Secondary class:
Evidence level: E0 / E1 / E2 / E3 / E4
Confidence: confirmed / likely / possible / needs verification
First check:
Likely files:
Do-not-change constraints:
```

## 4. Intake examples

### Example A — live mismatch

User: “Codex пишет готово, но я не вижу на live.”

```text
Task type: live_mismatch
Primary class: DEPLOY_MISMATCH
Evidence level: E0 unless commit/PR/live URL checked
First check: branch/PR/commit/Vercel/domain
Do not start with CSS.
```

### Example B — mobile layout

User: “На телефоне кнопка уехала вниз.”

```text
Task type: design_mismatch
Primary class: UI_LAYOUT_MOBILE
Evidence level: E1 if screenshot provided
First check: route + viewport + CSS media query
Likely files: ProfilePage.jsx, profileMandalaWorkspace.css, profileCabinet.css, index.css
```

### Example C — image disappeared

User: “Фото видно сразу, но после обновления пропадает.”

```text
Task type: media_storage
Primary class: STORAGE_MEDIA
Secondary class: SUPABASE_RLS or STATE_MANAGEMENT possible
First check: source type and persisted ref
Do not make bucket public.
```

### Example D — service order lost after login

User: “Выбрал услугу и формат, после Google входа всё сбросилось.”

```text
Task type: service_order
Primary class: SERVICE_ORDER_FLOW
Secondary class: AUTH + STATE_MANAGEMENT
First check: pre-auth intent persistence and callback restore
Do not create duplicate order as workaround.
```

## 5. Ready-to-analyze gate

The agent can proceed to Codex prompt only when these are known or explicitly marked `needs verification`:

- route;
- environment;
- expected/actual;
- evidence level;
- primary class;
- likely files or next repo search;
- do-not-change constraints;
- checks to run.

## 6. Output format after intake

```text
Краткое понимание:
- project:
- task:
- mode:

Классификация:
- primary class:
- secondary class:
- evidence level:
- confidence:

Подтверждено:
- ...

Needs verification:
- ...

Где искать:
- files/components:

Минимальный безопасный fix:
- ...

Codex prompt:
- ...
```
