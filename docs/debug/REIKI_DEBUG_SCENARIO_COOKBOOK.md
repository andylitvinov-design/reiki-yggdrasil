# Reiki Yggdrasil — Debug Scenario Cookbook

Status: v1.
Purpose: give the debugger agent concrete playbooks for frequent Reiki Yggdrasil failures.

Use this file after reading:

- `docs/debug/REIKI_DEBUGGER_PLAYBOOK.md`
- `docs/debug/REIKI_BUG_TAXONOMY.md`
- `docs/debug/REIKI_EVIDENCE_COLLECTION_PROTOCOL.md`
- `docs/debug/REIKI_CODEX_REPAIR_LOOP.md`

## Scenario 1 — “Codex says done, but I do not see it on live”

Primary class: `DEPLOY_MISMATCH` until disproven.

Evidence to collect:

- Codex branch/commit/PR.
- PR merged: yes/no.
- Latest `main` commit.
- Vercel status for latest commit.
- URL the user is checking.
- Whether the feature is behind auth/admin/seeded data.

Order of checks:

1. Confirm commit exists.
2. Confirm PR is merged or change is on `main`.
3. Confirm Vercel status is `success`.
4. Confirm live URL is the same domain the user checks.
5. Open the exact route.
6. Check whether the feature needs auth/data to appear.
7. Only then inspect UI code.

Codex prompt focus:

- Do not ask Codex to restyle UI.
- Ask Codex to verify deploy chain and route visibility first.

## Scenario 2 — Mobile layout broken under 390px

Primary class: `UI_LAYOUT_MOBILE`.

Evidence to collect:

- Route.
- Screenshot width.
- Which block overflows or appears in wrong order.
- Whether desktop is still correct.
- Changed CSS/components from last fix.

Likely files:

- `src/pages/ProfilePage.jsx`
- `src/index.css`
- `src/profileCabinet.css`
- `src/profileMandalaWorkspace.css`

Order of checks:

1. Verify mobile breakpoint under `980px`.
2. Find grid/flex/order/overflow rules.
3. Check whether desktop rules leak into mobile.
4. Scope the fix to component and breakpoint.
5. Recheck desktop 1366 and mobile 390.

Do not:

- rewrite desktop three-column layout;
- change Supabase/auth/data flows;
- move unrelated blocks.

## Scenario 3 — Desktop three-column layout collapsed

Primary class: `UI_LAYOUT_DESKTOP`.

Evidence to collect:

- Route.
- Desktop width: 1280 / 1366 / 1440 / 1710.
- Which column disappeared or moved.
- Last changed layout files.

Order of checks:

1. Confirm the expected left/center/right layout for the route.
2. Inspect changed CSS first.
3. Inspect render order only if CSS is not enough.
4. Preserve mobile fallback while fixing desktop.

Minimal fix:

- Narrow CSS grid/flex fix.
- Avoid global selectors that affect public home and profile workspace simultaneously.

## Scenario 4 — Photo/mandala disappears after reload

Primary class: `STORAGE_MEDIA`.

Evidence to collect:

- Image role: client/goal photo, tradition image, object slot, underlay, material thumbnail, export image.
- Source type: `storage://`, signed URL, external URL, `data:image`.
- Immediate preview works: yes/no.
- Reload works: yes/no.
- Auth state.
- Table/bucket involved.

Order of checks:

1. Confirm whether a durable `storage://profile-cabinet-media/...` ref was saved.
2. Confirm `data:image` was not persisted accidentally.
3. Confirm signed URL resolver runs on reload.
4. Confirm Storage migration/policy is expected and applied live.
5. Confirm public pages do not expose private refs.

Do not:

- make private bucket public;
- save signed URLs as durable data;
- expose raw storage refs in public DOM.

## Scenario 5 — Google OAuth returns to wrong place

Primary class: `AUTH` with possible `STATE_MANAGEMENT`.

Evidence to collect:

- Start route.
- Expected return route.
- Actual return route.
- Domain used: legacy, target, preview.
- Whether chosen state must survive OAuth: service id, format, active tab, etc.

Order of checks:

1. Confirm Supabase redirect URL contains the route/domain.
2. Confirm code uses `window.location.origin` or equivalent non-hardcoded origin.
3. Confirm pre-auth intent is persisted before redirect.
4. Confirm callback consumes the persisted intent once.
5. Confirm logout/reset does not wipe useful pre-auth order intent too early.

Do not:

- hardcode only `mentalica.vercel.app` or only `reiki-yggdrasil.vercel.app`;
- print real email/env values.

## Scenario 6 — Service order flow loses selected service/format

Primary class: `SERVICE_ORDER_FLOW` with possible `STATE_MANAGEMENT` and `AUTH`.

Evidence to collect:

- selected `service_id`;
- selected format: `signature`, `no_signature`, `both`;
- auth state before click;
- target route after auth;
- whether order form is prefilled;
- storage key/session key used for intent.

Order of checks:

1. Confirm service profile selection state.
2. Confirm CTA branch: authenticated vs unauthenticated.
3. Confirm unauthenticated path saves intent before OAuth.
4. Confirm OAuth return reads intent.
5. Confirm order creation page receives service/format.
6. Confirm submitted order payload uses expected schema/status.

Risks:

- duplicate orders;
- stale intent from old service;
- losing intent on session cleanup;
- confusing draft and submitted order states.

## Scenario 7 — Admin moderation empty or unsafe

Primary class: `ADMIN_MODERATION` with possible `SUPABASE_RLS`.

Evidence to collect:

- Auth state: unauthenticated / authenticated / admin.
- Whether admin membership exists.
- Env presence for `VITE_ADMIN_EMAIL` by name only.
- Table/status filter used.
- RLS policy expected.

Order of checks:

1. Confirm route fallback is safe for unauthenticated users.
2. Confirm non-admin cannot see moderation data.
3. Confirm admin lookup path.
4. Confirm status filters: draft/pending/approved/rejected.
5. Confirm live data exists.

Do not:

- expose private rows to public users;
- bypass admin checks in frontend only;
- loosen RLS broadly.

## Scenario 8 — Public material appears wrong or private ref leaks

Primary class: `DATA_CONTRACT` with possible `STORAGE_MEDIA`.

Evidence to collect:

- Route/section.
- Material status.
- Rendered fields.
- Whether any raw `storage://` text appears.
- Whether public cards use only approved-safe fields.

Order of checks:

1. Confirm public query filters `status=approved`.
2. Confirm safe selected fields.
3. Confirm no signed URL/private ref leaks in public card DOM.
4. Confirm fallback behavior when section has no matching material.

## Scenario 9 — Print/download missing images

Primary class: `PRINT_DOWNLOAD_EXPORT` with possible `STORAGE_MEDIA`.

Evidence to collect:

- Export mode: print, HTML fallback, image/PDF.
- Visible UI state.
- Persisted refs.
- Whether signed images are available.
- Whether export shows metadata/placeholder safely.

Order of checks:

1. Do not claim PNG/JPEG/PDF support if only HTML fallback exists.
2. Compare visible state and export payload.
3. Check private ref handling.
4. Add safe placeholder/metadata fallback if embedding is unsafe.

## Scenario 10 — Knowledge/content validation warnings

Primary class: `COURSE_CONTENT`.

Evidence to collect:

- Validation command.
- Step ID.
- File path.
- Whether content is missing or link is broken.

Likely files:

- `src/data/reikiKnowledgeBase.js`
- `docs/knowledge-base/REIKI_STEPS_KNOWLEDGE_BASE.md`
- `scripts/validate-knowledge-base.mjs`
- video/free-course validators

Order of checks:

1. Preserve stable `RY-Lxx-Sxx` IDs.
2. Mark unknown content `needs_content` or `needs verification`.
3. Do not invent sacred/course details.
4. Rerun relevant validator.

## Scenario report format

```text
Scenario:
Primary class:
Evidence level:
Confirmed:
Not verified:
Likely files:
First check:
Minimal safe fix:
Checks:
Risks:
```
