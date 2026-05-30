# Reiki Yggdrasil — Evidence Collection Protocol

Status: v1.
Purpose: prevent the debugger agent from guessing. Every bug report must separate confirmed facts, user-visible symptoms, likely causes, and unverified assumptions.

## 1. Evidence levels

Use these levels in every debug analysis:

### E0 — User report only

The user described a symptom, but no file, route, screenshot, console output, commit, or deployment evidence has been checked yet.

Use wording:

```text
Evidence level: E0 — user report only.
```

### E1 — Visual evidence

A screenshot, video, or live observation confirms the UI symptom.

Collect:

- route;
- viewport;
- auth state if visible;
- expected vs actual;
- visual region/component;
- whether the screenshot is live, preview, or local.

### E2 — Repo evidence

The relevant file/component/state/CSS was found in repo.

Collect:

- file path;
- component/function/state variable;
- CSS selector/class;
- migration/client function if data related;
- exact code pattern, or state `exact line not found`.

### E3 — Runtime evidence

Runtime behavior is confirmed by console output, local run, preview, live route, network response, or test failure.

Collect:

- command run;
- result;
- browser route;
- console/network error;
- deployment URL;
- commit SHA.

### E4 — Fixed and verified

The bug is fixed and verified in the relevant environment.

Requires:

- changed files known;
- checks run;
- route/viewport QA done where relevant;
- live/preview distinction documented;
- remaining risks marked.

## 2. Required bug report fields

Every Reiki debug report should include:

```text
Evidence level:
Bug class:
Affected route:
Affected viewport:
Auth state:
Live/preview/local:
Expected:
Actual:
Confirmed facts:
Likely cause:
Unverified assumptions:
Files checked:
Files likely to change:
Minimal safe fix:
Checks required:
Risks:
```

## 3. Symptom vs cause discipline

Do not treat symptoms as causes.

Examples:

| Symptom | Possible causes to distinguish |
| --- | --- |
| “I do not see it on live” | PR not merged, Vercel pending/failure, wrong domain, browser cache, feature hidden behind auth, route mismatch |
| “Photo disappeared” | temporary preview persisted, signed URL expired, Storage RLS, missing migration, wrong ref type, UI resolver guard |
| “Button moved” | CSS media query, component order, grid/flex override, desktop rule leaking into mobile |
| “Admin empty” | no data, RLS, wrong status filter, missing admin membership, env missing, wrong live project |
| “OAuth returns wrong page” | redirect URL missing, hardcoded origin, state not persisted, callback handler reset |

## 4. Route evidence checklist

For each affected route:

```text
Route:
URL checked:
Environment: local / preview / live / not checked
Commit SHA known: yes / no
HTTP status: ok / 404 / error / not checked
Console errors: yes / no / not checked
Visible symptom:
Relevant component:
Needs auth: yes / no
```

## 5. File evidence checklist

Before producing a Codex fix prompt, list at least one of:

- exact file path;
- exact component/function;
- exact CSS class/media query;
- exact client method;
- exact migration/table/bucket.

If none is found, write:

```text
Exact file/component not found yet — next step is repo search before coding.
```

## 6. Environment evidence checklist

For deploy/live issues:

- branch;
- PR number/status;
- latest commit SHA;
- Vercel status;
- preview URL;
- production URL;
- target vs legacy domain;
- whether the user is looking at the same URL.

## 7. Supabase evidence checklist

For auth/data/storage issues:

- frontend env presence by name only;
- route;
- table or bucket;
- read/write/upload/delete action;
- anon/auth/admin path;
- migration expected;
- RLS policy involved;
- safe error message;
- live session used: yes/no.

Never request or output env values, tokens, or private user identifiers.

## 8. Media evidence checklist

For image/mandala/export bugs:

- image role;
- source type: `storage://`, signed URL, external URL, `data:image`;
- immediate preview works: yes/no;
- reload works: yes/no;
- print/download works: yes/no;
- public page leak: yes/no/not checked;
- relevant resolver/export function.

## 9. Confidence labels

Use these labels:

- `confirmed` — directly verified.
- `likely` — supported by repo/runtime evidence but not fully verified.
- `possible` — hypothesis only.
- `needs verification` — cannot be safely confirmed with current access.

## 10. Completion rule

A debug answer is incomplete if it does not state:

- evidence level;
- what is confirmed;
- what is not verified;
- exact next check or minimal fix.
