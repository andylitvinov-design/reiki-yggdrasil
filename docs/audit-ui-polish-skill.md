# /audit — UI Polish Skill Addendum

Shared source of truth:

```txt
docs/global-agent-settings.md
docs/global-command-protocols.md
docs/global-agent-skills.md
```

This file is the Reiki local fallback checklist for UI polish. Other active projects should reference the shared global docs and add only project-specific UI checks.

Status: optional addendum for `/audit`  
External skill: `jakubkrehel/make-interfaces-feel-better`  
Install command when supported by the local agent environment:

```bash
npx skills add jakubkrehel/make-interfaces-feel-better
```

Verified project-local install for Codex + Claude Code:

```bash
npx skills add jakubkrehel/make-interfaces-feel-better --skill make-interfaces-feel-better --agent codex claude-code -y
```

Expected local install result:

- `.agents/skills/make-interfaces-feel-better/` is available to Codex;
- `.claude/skills/make-interfaces-feel-better` points to that project skill for Claude Code;
- `skills-lock.json` pins the external source and hash.

Source URL:

```txt
https://jakub.kr/skills/make-interfaces-feel-better
```

## Purpose

Use this addendum to make audited interfaces feel better, not only technically correct.

This addendum does not replace the core `/audit` protocol. It is an extra UI polish layer that should run after the audit has already checked:

- UX clarity;
- mobile and desktop layout;
- interaction and clickability;
- saving/persistence/history;
- auth/privacy;
- code risks;
- regression risks.

## When to use

Use this addendum when the user asks for:

- UI review;
- screen audit;
- “what feels wrong?”;
- “make it more beautiful/friendly”;
- “less text / clearer / lighter”; 
- mobile UX polish;
- product feel improvement;
- interface mood and perception.

## If the external skill is installed

If the agent environment has `make-interfaces-feel-better` installed, load and apply it during `/audit`.

The audit issue should include a section:

```md
## UI polish / make-interfaces-feel-better pass
| Area | Finding | Improvement direction | Implementation note |
|---|---|---|---|
```

## If the external skill is not installed

Do not block the audit.

State in the GitHub issue:

```txt
External UI polish skill not verified/installed in this environment.
Install when supported: npx skills add jakubkrehel/make-interfaces-feel-better
```

Then run the local UI polish checklist below.

## Local UI polish checklist

Evaluate:

1. Visual hierarchy
   - Is the main action visually obvious?
   - Is the page structured around one clear goal?
   - Are secondary actions visually quieter?

2. Spacing and rhythm
   - Are cards too dense?
   - Are sections breathing enough?
   - Is mobile spacing compact but not cramped?

3. Text density
   - Can long paragraphs become labels, hints, bullets, or collapsed details?
   - Can helper text move below the primary action?
   - Is the Russian copy short and natural?

4. Motion and feedback
   - Are loading states clear?
   - Does the interface show success/failure gently?
   - Are transitions needed, or would they distract?

5. Perceived quality
   - Does the screen feel calm, modern, and trustworthy?
   - Are colors, borders, shadows, and typography consistent?
   - Are there raw/debug-looking elements visible to users?

6. Mobile feel
   - Are touch targets comfortable?
   - Are important controls above the fold?
   - Are bottom bars, sticky headers, and cards balanced?

7. Performance feel
   - Does the page avoid heavy visual noise?
   - Are slow/loading areas minimized or explained?
   - Are expensive UI elements lazy or conditional when possible?

## Required output in audit issue

When this addendum applies, add:

```md
## UI polish pass
- External skill used: YES / NO / NOT VERIFIED
- Install command if missing: `npx skills add jakubkrehel/make-interfaces-feel-better`

| Polish layer | Status | Finding | Recommended improvement |
|---|---|---|---|
| Visual hierarchy | PASS / ISSUE / NOT VERIFIED | | |
| Spacing/rhythm | PASS / ISSUE / NOT VERIFIED | | |
| Text density | PASS / ISSUE / NOT VERIFIED | | |
| Feedback/motion | PASS / ISSUE / NOT VERIFIED | | |
| Perceived quality | PASS / ISSUE / NOT VERIFIED | | |
| Mobile feel | PASS / ISSUE / NOT VERIFIED | | |
| Performance feel | PASS / ISSUE / NOT VERIFIED | | |
```

## Delivery handoff

Do not create vague “make it nicer” tasks.

Convert polish findings into concrete implementation instructions:

- which component/card/section;
- what to reduce/move/reorder;
- what text to shorten;
- what spacing/layout to change;
- what mobile breakpoint to verify;
- what should not be touched.

The copy-pasteable handoff prompt must still start with `/delivery`.
