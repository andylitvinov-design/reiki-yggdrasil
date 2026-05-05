# Reiki Steps Knowledge Base

## Purpose

This document describes how the Reiki Yggdrasil learning-step knowledge base is stored, validated, and safely expanded inside this GitHub repository.

The goal is to keep course structure and public learning content versioned in GitHub instead of leaving it only inside React component state.

## Current status

- status: `architecture_ready_content_partial`
- canonical data source: `src/data/reikiKnowledgeBase.js`
- UI consumer: `src/main.jsx`
- validator: `scripts/validate-knowledge-base.mjs`
- validation command: `npm run validate:knowledge`
- build command: `npm run build`

## Coverage

| Area | Status |
| --- | --- |
| Levels | 6 levels defined |
| Steps | 35 stable step records defined |
| Level 1 content | copied from current UI draft and marked `needs_review` |
| Levels 2-6 content | scaffolded and marked `needs_content` |
| Private initiations/master-only notes | not stored here |
| Supabase-backed content CMS | needs verification / not confirmed in current `main` |

## Level map

| Level | Name | Step count | Theme |
| --- | --- | ---: | --- |
| 1 | Корни | 5 | опора, вход в систему, базовая чувствительность |
| 2 | Ствол | 6 | устойчивость, вертикаль, накопление силы |
| 3 | Ветви | 6 | расширение, связь, передача энергии |
| 4 | Листья | 6 | тонкость восприятия, дыхание, обновление |
| 5 | Цветы | 6 | раскрытие, красота, дар системы |
| 6 | Плоды | 6 | интеграция, мастерство, результат пути |

## Stable IDs

Every step must keep a stable ID:

```text
RY-L01-S01
RY-L01-S02
RY-L02-S01
...
RY-L06-S06
```

Pattern:

```text
RY-L{two-digit-level}-S{two-digit-step}
```

Do not rename existing IDs after content, progress, links, comments, or future database rows start depending on them.

## Canonical data shape

Each level record should include:

```js
{
  id: 1,
  name: "Корни",
  count: 5,
  theme: "...",
  steps: []
}
```

Each step record should include:

```js
{
  id: "RY-L01-S01",
  levelId: 1,
  number: 1,
  title: "Основа",
  status: "draft_from_current_ui",
  intro: "...",
  meaning: "...",
  opens: ["..."],
  skills: ["..."],
  result: "...",
  contentStatus: "needs_review"
}
```

## Content statuses

| Status | Meaning |
| --- | --- |
| `draft_from_current_ui` | Existing public UI copy was moved into the knowledge base. Needs author review before being treated as final course text. |
| `needs_review` | Content exists but must be reviewed by the course author. |
| `needs_content` | Structural placeholder only. Do not present as final course material. |
| `verified` | Reserved for content explicitly reviewed and approved by the course author. |

## Safe editing workflow

1. Read `AGENTS.md`, `STATE.md`, `LOG.md`, this document, and `src/data/reikiKnowledgeBase.js` first.
2. Edit `src/data/reikiKnowledgeBase.js` only for canonical step content.
3. Use `needs_content` when author materials are missing.
4. Run:

```bash
npm run validate:knowledge
npm run build
```

5. Check the public UI:
   - `/`
   - desktop three-column layout
   - mobile layout below 980px
   - level/step switching
   - no console errors

6. Update `STATE.md` and `LOG.md` after meaningful changes.

## What must not be stored

Do not commit:

- secrets or env values
- Supabase keys
- private student data
- payment data
- private initiation formulas
- master-only ritual notes
- copyrighted long-form source materials without permission

## Open questions / needs verification

- Exact final names and content for all levels 2-6.
- Whether the 35-step structure is final or should change.
- Whether step content should later move to Supabase CMS or remain static in GitHub.
- Whether `/profile`, `/masters`, and `/profile/admin` are planned routes or from stale project memory.
- Whether the live Vercel deployment points to the current `main` branch and latest commit.

## Next content tasks

1. Review and approve the 5 Level 1 step drafts.
2. Provide author materials for Levels 2-6.
3. Add fields only when needed, for example: `practice`, `videoUrl`, `audioUrl`, `mandalaPrompt`, `teacherNotesPublic`, `recommendedDuration`, `homework`.
4. Keep private/master-only fields outside the public static data unless a proper access model exists.
