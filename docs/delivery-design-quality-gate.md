# /delivery — Design Quality Gate

Required for every `/delivery` task that changes or verifies UI, UX, mobile/desktop layout, screenshots, first screen, hero, landing, navigation, cards, forms, profile/cabinet pages, visual polish, or user-facing copy.

Shared source of truth:

```txt
docs/global-agent-settings.md
docs/global-command-protocols.md
docs/global-agent-skills.md
```

This file is the Reiki local design-gate adapter. Other active projects should reference the shared global docs and add only project-specific visual QA details.

## Core rule

Build/check/live proof is not enough for UI delivery.

Before `STATUS: SUCCESS`, the agent must prove that the delivered screen matches the user's visual request and feels like a finished product, not only a working set of components.

## Required UI polish pass

Run `UI POLISH / FEEL-BETTER PASS`.

External skill:

```txt
jakubkrehel/make-interfaces-feel-better
```

Install/use when supported:

```bash
npx skills add jakubkrehel/make-interfaces-feel-better
```

Reference:

```txt
https://jakub.kr/skills/make-interfaces-feel-better
```

If the skill is unavailable, use the fallback checklist from:

```txt
https://github.com/andylitvinov-design/reiki-yggdrasil/blob/main/docs/audit-ui-polish-skill.md
```

## Must check

- Original visual request matched.
- Mobile first screen is complete when requested.
- No accidental next-section cut.
- Primary CTA is clear.
- No duplicated/cluttered navigation.
- Visual hierarchy is calm.
- Text density is acceptable.
- Desktop is not regressed.
- No raw/debug-looking UI remains.

## Failure rule

If any required design item is `FAIL` or `NOT VERIFIED`, do not report `STATUS: SUCCESS`.

Run another improvement loop or report the exact blocker/auth limitation.

## Required final report block

```txt
DESIGN QUALITY GATE:
| Check | Status | Evidence | Fix if failed |
|---|---|---|---|

UI POLISH / FEEL-BETTER PASS:
| Check | Status | Evidence | Fix if failed |
|---|---|---|---|
```

Preferred evidence: mobile screenshot, desktop screenshot if relevant, checked route, viewport size, and comparison with original visual request.
