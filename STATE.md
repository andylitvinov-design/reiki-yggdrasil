# Reiki Yggdrasil — STATE

Last updated: 2026-05-15

## Current verified repo state

- repo: `andylitvinov-design/reiki-yggdrasil`
- default branch: `main`
- live URL from project memory: `https://reiki-yggdrasil.vercel.app`
- hosting from repo config: Vercel / Vite build
- build command: `npm run build`
- output directory: `dist`
- framework: `vite`

## Current app structure

The current repo is a Vite/React public prototype with a GitHub-stored course knowledge base.

Confirmed files:

- `AGENTS.md`
- `README.md`
- `STATE.md`
- `LOG.md`
- `package.json`
- `vercel.json`
- `index.html`
- `src/main.jsx`
- `src/index.css`
- `src/data/reikiKnowledgeBase.js`
- `docs/knowledge-base/REIKI_STEPS_KNOWLEDGE_BASE.md`
- `scripts/validate-knowledge-base.mjs`
- `.github/workflows/ci.yml`
- `package-lock.json`

Not found / not confirmed in current `main` during prior audits:

- `src/App.jsx`
- `src/pages/ProfilePage.jsx`
- `src/pages/MastersPage.jsx`
- `src/pages/AdminPage.jsx`
- `src/lib/supabaseClient.js`
- `supabase/migrations/20260428_master_cabinet_mvp.sql`

## Knowledge base state

Canonical knowledge files:

- `src/data/reikiKnowledgeBase.js`
- `docs/knowledge-base/REIKI_STEPS_KNOWLEDGE_BASE.md`

Coverage:

- 7 levels
- 37 stable records
- Level/step titles follow the latest user corrections from 2026-05-05 and 2026-05-06
- Central learner-facing card fields now have draft content for all 37 records:
  - `intro`
  - `meaning`
  - `opens`
  - `skills`
  - `result`
- All draft-filled records are marked `contentStatus: "needs_review"`.
- Original methodichki/source text was not found in repo search and still needs verification.
- Full practices, settings, homework, media, and expected results still need author-approved expansion.

Canonical level map:

1. `Базовая программа Рейки Иггдрасиль` — 5 items, label `Уровень`
2. `Инструкторский курс` — 6 items, label `Ступень`
3. `Храмовая магия` — 5 items, label `Ступень`
4. `Восточная магия` — 5 items, label `Ступень`
5. `Западноевропейская магия. Каббала и Таро` — 5 items, label `Ступень`
6. `Продвинутая магия рун` — 5 items, label `Ступень`
7. `Высшая магия` — 6 items, label `Ступень`

Stable ID format:

```text
RY-L01-S01
RY-L07-S06
```

## Content status policy

- `needs_content`: record has structure but no usable learner-facing content.
- `needs_review`: draft content exists but has not been checked against author methodichki.
- `verified`: reserved only for content explicitly reviewed and approved by the course author.

Current central descriptions are a draft scaffold, not final verified methodichki text.

## Known mismatch with ai-projects-brain memory

The external project memory currently describes a larger Supabase-backed MVP with `/profile`, `/masters`, `/profile/admin`, and Supabase files. Those files/routes were not found in the current repo state during prior audits.

Conclusion: project memory likely contains stale or future/planned state and should be updated or split into:

- current verified repo state
- planned Supabase/profile/master/admin roadmap

## Env names

From project memory only; values are not stored and were not verified:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_ADMIN_EMAIL`

## Verification status

Verified by GitHub file inspection:

- repo exists and is accessible
- `vercel.json` points to Vite build output `dist`
- current UI is built from `src/main.jsx` and `src/index.css`
- canonical static knowledge data lives in `src/data/reikiKnowledgeBase.js`
- top header section data lives in `src/data/topSectionMenus.js`
- free-course title/link-status data lives in `src/data/freeCourseLinks.js`
- knowledge-base data defines 7 levels / 37 records
- central card fields are now populated for all records by draft content
- raw `needs_content` placeholders should no longer appear for central cards because all records now get `needs_review` draft content

## Current public navigation state

- The top header now has five buttons:
  - `ДАО РИ`
  - `ШКОЛА ВОЛШЕБНИКОВ`
  - `МИСТЕРИИ`
  - `УСЛУГИ`
  - `БЕСПЛАТНЫЕ КУРСЫ`
- These buttons switch the left menu only.
- `ДАО РИ` keeps the existing 7-level / 37-step Reiki menu and step-selection behavior.
- The center card and right practice panel remain tied to the selected Reiki step and do not change when non-Reiki top sections are selected.
- `БЕСПЛАТНЫЕ КУРСЫ` shows the PR #11 free-course titles as left-menu cards.
- Direct free-course URLs and embed URLs are not verified; records remain `courseUrl: null`, `embedUrl: null`, and `urlStatus: "needs verification"`.

Verified locally on 2026-05-15:

- `npm ci`
- `npm run validate:knowledge`
- `npm run validate:videos`
- `npm run validate:free-courses`
- `npm run check`
- `npm run build`
- `npm run preview -- --port 4173`
- `/` desktop top-button switching and Reiki step selection
- `/` mobile top-nav horizontal scrolling and left-menu overflow check
- browser console: no warnings or errors during manual QA

Not verified:

- Vercel live deployment behavior
- Supabase/auth/data flows; these routes/files are not present on the target `main` branch

## Risks

- Draft texts are not verified against original methodichki.
- Some descriptions are safe generalized scaffold copy based on titles/themes rather than exact course text.
- Long Russian descriptions may need visual QA in the central card on mobile screens.
- Supabase/profile/admin work should not be resumed until actual repo state is reconciled.

## Next actions

1. Run `npm ci`.
2. Run `npm run validate:knowledge`.
3. Run `npm run build`.
4. Preview `/` locally and check all 37 records across desktop/mobile.
5. Replace draft descriptions with exact methodichki text where available.
6. After author review, mark approved records `verified`.
7. Update `ai-projects-brain/projects/reiki-yggdrasil/*` to reflect actual repo state.
