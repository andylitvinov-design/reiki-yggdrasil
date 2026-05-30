# Reiki Yggdrasil — Debugger Quality Rubric

Status: v1.
Purpose: define how the Reiki debugger agent should self-check the quality of its answer before sending a Codex prompt or final report.

## 1. Scorecard

Use this scorecard internally for every non-trivial debug answer.

| Area | 0 | 1 | 2 |
| --- | --- | --- | --- |
| Project context | repo/context not checked | repo known but state unclear | repo, live, routes, constraints stated |
| Bug classification | no class | broad class | primary + secondary class with reason |
| Evidence | only guesses | partial evidence | evidence level + confirmed/unknown split |
| Files | no files | broad area | concrete files/components/functions/selectors |
| Root cause | symptom repeated | possible cause | cause candidate + verification order |
| Safety | risks ignored | some constraints | do-not-change list and secret/data safety included |
| Codex prompt | vague | usable but broad | copy-ready, scoped, with checks/report format |
| Verification | not mentioned | generic tests | exact commands + route/viewport/live QA |
| Honesty | overclaims | partial caveats | clearly marks not run/not verified |

Target score:

- 16+ for Codex implementation prompts.
- 14+ for analysis-only answers.
- Anything below 12 must be revised before sending.

## 2. Mandatory self-check questions

Before finalizing a debug response, ask:

1. Did I identify the affected route/environment?
2. Did I distinguish live, preview, and local?
3. Did I classify the primary bug layer?
4. Did I say what is confirmed vs `needs verification`?
5. Did I name likely files/components?
6. Did I avoid broad rewrites?
7. Did I preserve RU-default, routes, desktop three-column, mobile fallback?
8. Did I preserve Supabase/Auth/Storage/data safety?
9. Did I specify exact checks?
10. Did I avoid claiming checks/live QA that were not run?

## 3. Common failure patterns

### Weak answer

```text
Нужно поправить CSS и проверить.
```

Why weak:

- no route;
- no viewport;
- no evidence level;
- no likely files;
- no do-not-change list;
- no deploy/live distinction.

### Strong answer

```text
Primary class: UI_LAYOUT_MOBILE.
Evidence level: E1 from screenshot, E2 after repo search needed.
Route: /profile, mobile 390.
Likely files: src/pages/ProfilePage.jsx, src/profileMandalaWorkspace.css.
First check: media query under 980px and grid/flex order for the Power Place action controls.
Do not change: desktop three-column layout, Supabase flows, RU labels.
Checks: npm run check, desktop 1366, mobile 390, live only after Vercel success.
```

## 4. Codex prompt quality gate

A Codex prompt is not acceptable unless it includes:

- repo;
- target branch;
- live URL;
- files to read first;
- likely files to change;
- bug class;
- evidence;
- expected behavior;
- actual behavior;
- minimal safe fix;
- do-not-change list;
- commands/checks;
- manual QA matrix;
- report format;
- risks and `needs verification` items.

## 5. Report quality gate

A final report is not acceptable unless it includes:

- changed files or explicit “no repo changes”;
- commit/PR if any;
- checks run or explicitly not run;
- Vercel/live status if relevant;
- what was verified;
- what was not verified;
- risks;
- next action.

## 6. Red flags

Stop and revise if the answer says or implies:

- “fixed on live” without Vercel/live check;
- “Supabase works” without a live configured session;
- “no secrets leaked” without checking changed files or scope;
- “mobile fixed” without viewport;
- “Codex done” without branch/PR/commit/checks;
- “probably CSS” for a live mismatch;
- “just make bucket public” for Storage bug;
- “rewrite ProfilePage” for a local layout fix.

## 7. Preferred wording

Use:

```text
confirmed
likely
possible
needs verification
not run
not verified
```

Avoid:

```text
obviously
definitely fixed
should be fine
probably deployed
works on live
```

unless verified.

## 8. Self-review output

For complex tasks, include a short self-review:

```text
Quality check:
- Evidence level stated: yes/no
- Primary class stated: yes/no
- Files named: yes/no
- Checks specified: yes/no
- Not verified items listed: yes/no
```
