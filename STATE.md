# Reiki Yggdrasil — STATE

Last updated: 2026-05-26

## Current verified repo state

- repo: `andylitvinov-design/reiki-yggdrasil`
- default branch: `main`
- live URL from project memory: `https://reiki-yggdrasil.vercel.app`
- hosting from repo config: Vercel / Vite build
- build command: `npm run build`
- output directory: `dist`
- framework: `vite`

## Current app structure

The current repo is a Vite/React public prototype with a GitHub-stored course knowledge base and a profile cabinet MVP merged in PR #26.

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
- `src/lib/supabaseClient.js`
- `src/pages/ProfilePage.jsx`
- `src/pages/MastersPage.jsx`
- `src/pages/AdminPage.jsx`
- `src/profileCabinet.css`
- `supabase/migrations/20260524_profile_cabinet_mvp.sql`
- `supabase/migrations/20260524_profile_cabinet_rls_followup.sql`
- `supabase/migrations/20260526_profile_cabinet_publication_step_fields.sql`
- `supabase/migrations/20260526_profile_cabinet_security_lints.sql`
- `supabase/migrations/20260526_power_place_persistence.sql`
- `supabase/migrations/20260526_power_place_upgrade_5_business_dao.sql`

Still not part of the current app:

- `src/App.jsx`
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

## Historical memory note

Older audits noted that external project memory described `/profile`, `/masters`, `/profile/admin`, and Supabase files before those files existed on `main`.
PR #26 reconciled that mismatch by adding the profile cabinet MVP to `main`.

## Env names

Used by the profile cabinet MVP. Values are not stored in the repo:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_ADMIN_EMAIL`

## Profile cabinet MVP state

PR #26 added the routed master cabinet as a narrow MVP, not a broad marketplace:

- `/profile` lets a master sign in by magic link, save a profile draft, and submit it for moderation.
- `/profile` now also offers a Google OAuth login button before the email magic-link fallback.
- `/masters` lists approved public profiles.
- `/profile/admin` lets the configured admin email review pending profiles.
- `vercel.json` rewrites these SPA routes so direct refresh does not 404.
- Without Supabase env, all three routes render a Russian fallback instead of crashing.

Issue #41 adds the first profile materials MVP:

- `/profile` shows `Мандалы и материалы по Рейки Иггдрасиль` after an authenticated profile row exists.
- A master can create `mandala`, `artifact`, or `practice` records linked to a Reiki level/step and sourced setting.
- Materials save into `profile_cabinet_publications` as either `draft` or `pending`.
- The first version stores an image URL only. Supabase Storage upload is a follow-up requiring a bucket, storage policies, and live verification.

Power-place mandala constructor branches extend the authenticated `/profile` mandala workspace:

- Adds a compact `Места силы / Магическая мандала` constructor inside `/profile`.
- Branch `codex/power-place-mandala-builder` adds the requested `Цель места силы` textarea to the printable constructor; the field is local/printable only until persistence is designed.
- Supports cover selection from reusable profile/material image URLs, local safe custom cover image, and placeholder covers.
- Supports type selection between `Мандала клиенту` and `Алтарь`.
- `Мандала клиенту` supports geometry selection for 2, 4, 5, 6, 8, and 12 power-source objects around the center.
- The 12-position layout keeps the 8-position cross/intermediate structure and adds four outer corner `хранители пространства`.
- `Алтарь` supports five top image objects, a larger central top object with 1:1 / 1.5:1 / 2:1 / 3:1 proportions, a slightly lower center photo, and two lower support images.
- Active constructor object positions support local upload and selection from reusable profile/material image URLs.
- Adds a print action scoped to the mandala composition only.
- Branch `codex/power-place-persistence-plans` adds metadata persistence for saved compositions, profile-level Start/Pro limits, client/goal photo references, and selected mystery-tradition asset references.
- Power-place upgrade #5 adds `Бизнес-мандала` and `ДАО` constructor formats, resource comparison mode/comments, and additive persistence fields for those settings.
- Start allows 7 saved Power Place compositions and 10 client/goal photos.
- Pro allows 20 saved Power Place compositions and 30 client/goal photos.
- Central Power Place photos must come from the `Фото клиентов / целей` section.
- Altar object selectors use images saved under the selected tradition in `Мистерии`.
- File picker previews remain local; durable Supabase Storage upload remains needs verification.

Live data flow still depends on manual Supabase/Vercel setup:

- apply `supabase/migrations/20260524_profile_cabinet_mvp.sql`
- apply `supabase/migrations/20260524_profile_cabinet_rls_followup.sql`
- apply `supabase/migrations/20260526_profile_cabinet_publication_step_fields.sql`
- apply `supabase/migrations/20260526_profile_cabinet_security_lints.sql`
- apply `supabase/migrations/20260526_power_place_persistence.sql`
- apply `supabase/migrations/20260526_power_place_upgrade_5_business_dao.sql`
- set Vercel env names `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_ADMIN_EMAIL`
- add Supabase auth redirect URLs for `/profile` and `/profile/admin`
- enable and configure the Google provider in Supabase Auth before treating Google login as live
- after first admin login, add a row to `profile_cabinet_admins`

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

## Mystery traditions UI state

PR #40 added static mystery-tradition data in `src/data/mysteryTraditions.js`. The current implementation wires the first UI mode to the independent top-level `МИСТЕРИИ` section, parallel to `ДАО РИ`.

Current implemented trigger:

- `activeTopSection === "mysteries-school"`
- `selectedLeftItemId === "mysteries-greek"`

When `МИСТЕРИИ → Греческие мистерии` is selected:

- the left panel switches from the broad mystery list to Greek deity tabs;
- `← Все мистерии` returns to the broad mystery list;
- the center panel shows the selected deity archetype, description, articles, notes, and video placeholder;
- the right panel shows initiation, mandalas, and artefacts/shop placeholders for the selected deity.

The mystery traditions UI must not depend on `RY-L03-S03`, `selectedStepId`, `reikiLevels`, or the DAO RI level accordion.

All deity content remains `needs_review` / placeholder until author-approved materials are available.

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

- Supabase migration applied in the production Supabase project
- Vercel production env configured
- Supabase auth redirect URLs configured
- Supabase Google provider configured and verified
- first admin row exists in `profile_cabinet_admins`
- full authenticated owner/admin data flow against production Supabase

## Risks

- Draft texts are not verified against original methodichki.
- Some descriptions are safe generalized scaffold copy based on titles/themes rather than exact course text.
- Long Russian descriptions may need visual QA in the central card on mobile screens.
- Profile cabinet live data remains unavailable until Supabase setup is completed and verified.

## Next actions

1. Complete Supabase/Vercel profile cabinet setup.
2. Verify authenticated `/profile` owner save and submit flow.
3. Verify public approved profile read on `/masters`.
4. Verify `/profile/admin` moderation with a row in `profile_cabinet_admins`.
5. Replace draft descriptions with exact methodichki text where available.
6. After author review, mark approved course records `verified`.
