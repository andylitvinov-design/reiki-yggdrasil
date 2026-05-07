# Reiki Yggdrasil — step materials coverage

This file is generated/updated by:

```bash
npm run audit:reiki-materials
```

## Current inspected status

- Course structure source: `src/data/reikiKnowledgeBase.js`
- Settings source: `src/data/reikiStepSettings.js`
- Expected structure: 7 levels / 37 steps
- Explicit custom step copy currently exists for Level 1 drafts (`RY-L01-S01`...`RY-L01-S05`).
- Remaining steps use generated draft learner-facing copy unless an explicit `STEP_DRAFTS` entry is added.
- Final author verification is not proven until a step is explicitly marked as `content_verified`.

## What the audit checks

For every step ID, the audit records:

- level ID
- step number
- title
- content status
- whether content is explicit custom draft or generated draft
- whether explicit sourced settings exist
- settings count
- missing learner-facing fields
- readiness classification

## Readiness values

- `ready_for_public_learner_ui` — content is explicitly verified and sourced settings exist.
- `draft_public_copy_needs_author_review` — custom draft + settings exist, but author review is still required.
- `generated_draft_needs_author_content` — generated copy + settings exist; methodichka content must replace the generic draft.
- `not_ready_needs_content_or_settings` — missing content fields or sourced settings.

## Known risk

The UI can display all 37 steps because generated drafts fill learner-facing cards, but this is not the same as having final author methodichka material for every step.

Run `npm run audit:reiki-materials` after every content/settings update and commit the refreshed `docs/reiki-step-materials-coverage.json` and this markdown report.
