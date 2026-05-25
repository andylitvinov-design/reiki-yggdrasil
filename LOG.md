# Reiki Yggdrasil — LOG

## 2026-05-25 — Google OAuth button added to profile cabinet

Mode: minimal safe implementation branch from `origin/main`.

Changed:

- Added a Google OAuth start helper using the existing Supabase public auth endpoint and frontend env names only.
- Added `Войти через Google` to `/profile` before the existing email magic-link form.
- Kept magic-link login available as the fallback path.
- Added minimal cabinet-only styles for the Google login button and email fallback divider.
- Documented Google OAuth setup steps in `README.md`.

Needs verification:

- Supabase Google provider setup is still needs verification.
- Production OAuth login must be checked after Google provider credentials and Supabase redirect URLs are configured.

## 2026-05-25 — Artefacts section renamed to Workshop

Mode: direct small content update on `main`.

Context:

- User asked to use the existing Artefacts area as a workshop section.
- Short tab name should be `МАСТЕРСКАЯ`.
- Expanded heading should be `Специализация: создание артефактов`.

Changed:

- Updated `src/data/topSectionMenus.js`.
- Renamed top navigation label `АРТЕФАКТЫ` to `МАСТЕРСКАЯ`.
- Renamed the `artifact-creation` left menu title from `Школа Артефактов` to `Мастерская`.
- Added the first workshop card `Специализация: создание артефактов`.
- Added the 9-module workshop outline, format, and price text.
- Preserved existing `Талисманы и амулеты`, `Мандалы и печати`, and `Ритуальные предметы` cards.
- Restored `artifact-shop` and `support-services` menu data after a too-narrow intermediate replacement.

Verification:

- GitHub file inspection confirmed the final `src/data/topSectionMenus.js` content on `main`.
- Vercel commit status for `d309a1f35f67e597ad6596e82ac78d07b2ac0187` returned success.
- Live site opened at `https://reiki-yggdrasil.vercel.app`.

Not verified:

- Full browser visual QA/click-through in this assistant environment.
- Local `npm run build` was not run here.
- Supabase authenticated flows remain outside this content-only change.

Risks:

- Long Russian module lines may need mobile spacing QA in the central card.
- Production visual state depends on Vercel deploying the latest `main` commit.

## 2026-05-24 — Profile cabinet production follow-up

Mode: post-merge production follow-up branch.

Context:

- PR #26 was merged into `main` at `55e5fb6e5defdcd70c40594e085011c577716918`.
- PR #26 added `/profile`, `/masters`, `/profile/admin`, Supabase REST/auth helpers, Vercel SPA rewrites, and `supabase/migrations/20260524_profile_cabinet_mvp.sql`.

Changed on branch `codex/profile-cabinet-production-followup`:

- Added `supabase/migrations/20260524_profile_cabinet_rls_followup.sql`.
- Added a `security definer` admin helper for profile cabinet RLS.
- Replaced recursive admin policies with policies that call the helper.
- Replaced the admin self-read policy on `profile_cabinet_admins` with a direct own-row read policy.
- Allowed owners to update their own profile row as long as the resulting status is `draft`, `pending`, or `rejected`.
- Updated `/profile` so saving an already approved profile sends it back to moderation with a Russian confirmation message.
- Set the Vite asset base to `/` so direct refresh on `/profile`, `/masters`, and `/profile/admin` loads JS/CSS from root assets instead of nested route-relative paths.
- Added README setup steps for env names, migration order, auth redirect URLs, and admin row setup.
- Updated `STATE.md` to mark the profile cabinet as implemented in `main` while keeping live Supabase setup as needs verification.

Verified before patch:

- Remote `main` points at `55e5fb6e5defdcd70c40594e085011c577716918`.
- GitHub PR #26 is merged.
- Vercel status context for the merge commit is successful.
- Live routes returned HTTP 200:
  - `https://reiki-yggdrasil.vercel.app/`
  - `https://reiki-yggdrasil.vercel.app/profile`
  - `https://reiki-yggdrasil.vercel.app/masters`
  - `https://reiki-yggdrasil.vercel.app/profile/admin`
- Live production bundle contained profile cabinet strings and `profile_cabinet_profiles`.
- Live bundle did not expose a Supabase URL or anon-key-like JWT, so production env is not confirmed configured.

Findings:

- Vercel production deploy succeeded.
- GitHub Pages workflow failed at `actions/configure-pages` because Pages is not enabled/configured for GitHub Actions. This is not the production deploy path.
- Supabase live data flow still needs manual setup and verification.

Needs verification:

- Apply both profile cabinet migrations in Supabase.
- Configure Vercel env names: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_ADMIN_EMAIL`.
- Configure Supabase auth redirects for `/profile` and `/profile/admin`.
- Add the first admin row to `profile_cabinet_admins` after admin login.
- Verify authenticated owner save/submit, public approved read, and admin moderation against real Supabase.

Verification after patch:

- `npm ci` passed.
- `npm run validate:knowledge` passed.
- `npm run validate:videos` passed with existing placeholder warnings for `RY-L04-S04` and `RY-L04-S05`.
- `npm run validate:free-courses` passed.
- `npm run check` passed after the Vite base fix.
- `npm run build` passed.
- `npm run preview -- --port 4173` started successfully. An older local preview was already bound to `127.0.0.1:4173`, so the new preview was verified through its network URL.
- Local preview route checks passed for `/`, `/profile`, `/masters`, and `/profile/admin`.
- Local preview browser automation passed for direct route loads and the `Создать профиль`, `Каталог мастеров`, and `На главную` buttons with no console errors.
- Supabase CLI is installed, but local migration application was not run because Docker daemon is not running.

## 2026-05-15 — Top header buttons switch left menu

Mode: minimal safe implementation branch.

Changed on branch `codex/top-nav-switches-left-course-menu`:

- Replaced the static top header labels with five real buttons:
  - `ДАО РИ`
  - `ШКОЛА ВОЛШЕБНИКОВ`
  - `МИСТЕРИИ`
  - `УСЛУГИ`
  - `БЕСПЛАТНЫЕ КУРСЫ`
- Added `src/data/topSectionMenus.js` for the new top-section and left-menu data.
- Kept the existing `ДАО РИ` left menu behavior based on `reikiLevels`.
- Added safe placeholder left-menu cards for the wizard school, mysteries, and services sections.
- Ported useful PR #11 free-course data into `src/data/freeCourseLinks.js`.
- Added `scripts/validate-free-course-links.mjs` and `npm run validate:free-courses`.
- Updated `docs/knowledge-base/FREE_COURSES_LINKS.md` to reflect the corrected placement: top header button switches the left menu, not a right-panel tab.
- Updated `src/index.css` minimally for button-based top nav and black/gold left-menu cards.

Findings:

- Root cause: the top navigation was static markup and the left panel always rendered the Reiki levels.
- PR #11 implemented only a right-panel `Бесплатные видео` tab, so it did not satisfy the corrected requirement.
- Direct free-course URLs and embed URLs are still not verified and remain `null`.

Verification:

- `npm ci` passed.
- `npm run validate:knowledge` passed.
- `npm run validate:videos` passed with existing placeholder warnings for `RY-L04-S04` and `RY-L04-S05`.
- `npm run validate:free-courses` passed.
- `npm run check` passed.
- `npm run build` passed.
- `npm run preview -- --port 4173` started successfully.
- Manual QA on `/` passed for desktop and mobile section switching, stable center content, Reiki step selection, mobile nav scroll, left menu overflow, and console health.

Risks:

- Free-course titles are safe to show, but direct course/video URLs still require source verification.
- Non-Reiki sections are placeholders and should not be treated as final course content.
- `/profile`, `/masters`, and `/profile/admin` are not present on the target `main` branch and were not added.

## 2026-05-06 — Fill central step cards with draft learner content

Mode: implementation branch.

Changed on branch `codex/fill-reiki-draft-content-v2`:

- Updated `src/data/reikiKnowledgeBase.js`.
- Added draft learner-facing content for all 37 central course cards.
- Central card fields now have content for every record:
  - `intro`
  - `meaning`
  - `opens`
  - `skills`
  - `result`
- Kept all stable IDs unchanged: `RY-L01-S01` through `RY-L07-S06`.
- Kept level names, step names, counts, and labels aligned with the latest corrected structure.
- Marked all draft-filled records as `contentStatus: "needs_review"`.
- Kept methodichki verification explicit: original methodichki/source text was not found in repo search and still needs author review.
- Updated `docs/knowledge-base/REIKI_STEPS_KNOWLEDGE_BASE.md` with the new draft-content status and review policy.
- Updated `STATE.md` to reflect draft content coverage and remaining verification risks.

Findings:

- Current repo has canonical course data in `src/data/reikiKnowledgeBase.js`.
- The central UI in `src/main.jsx` already renders the `intro`, `meaning`, `opens`, `skills`, and `result` fields from the knowledge base.
- Full source methodichki are not present in the inspected repo state.
- Because source methodichki were not found, content is a safe draft scaffold based on the verified course structure, titles, and themes, not final verified methodichki text.

Verification:

- GitHub file inspection completed.
- Confirmed files changed through GitHub API commits.
- Local npm verification not completed in this assistant session:
  - `npm ci` not run
  - `npm run validate:knowledge` not run
  - `npm run build` not run
  - browser preview not run

Required checks before merge:

- `npm ci`
- `npm run validate:knowledge`
- `npm run build`
- local or Vercel preview check of `/`
- desktop three-column layout QA
- mobile layout below 980px QA
- click through all 7 levels / 37 records
- confirm no raw technical statuses are shown to learners
- confirm no console errors

Risks:

- Draft texts are not verified against author methodichki.
- Some later-course descriptions are intentionally generalized scaffold copy and should be replaced by exact methodichki content when available.
- Long Russian texts may need spacing/scroll QA in the central card.
- External `ai-projects-brain` memory still likely needs reconciliation with current repo state.

## 2026-05-05 — Align GitHub knowledge base with course screenshots and corrections

Mode: analysis + implementation branch.

Changed on branch `codex/reiki-knowledge-base`:

- Added repo-local agent rules in `AGENTS.md`.
- Added current project state in `STATE.md`.
- Added this log in `LOG.md`.
- Added canonical UI-readable knowledge base in `src/data/reikiKnowledgeBase.js`.
- Replaced the temporary `Корни/Ствол/Семена` placeholder structure with the user-provided course structure.
- Added structural records for all 7 levels / 37 records.
- Added exact level names and latest corrections:
  - Level 1: `Базовая программа Рейки Иггдрасиль` — 5 items.
  - Level 2: `Инструкторский курс` — 6 items.
  - Level 3: `Храмовая магия` — 5 items, with `Толтекская магия` and `Суфизм` as steps 4-5.
  - Level 4: `Восточная магия` — 5 items, with `Кундалини` and `Денежная магия` as steps 4-5.
  - Level 5: `Западноевропейская магия. Каббала и Таро` — 5 items.
  - Level 6: `Продвинутая магия рун` — 5 items.
  - Level 7: `Высшая магия` — 6 items, with `Славянская магия 1`, `Славянская магия 2`, and `Цивилизации` as steps 4-6.
- Added `stepLabel` support: Level 1 uses `Уровень`, Levels 2-7 use `Ступень`.
- Updated `src/main.jsx` to render course labels/titles from the knowledge base.
- Updated the left-menu group count text to use each level's `stepLabel`, so Level 1 does not display the generic `ступеней` wording.
- Added public placeholder handling so raw `needs_content` values are not shown to learners.
- Replaced learner-facing technical status strings with readable Russian text and added `public/favicon.svg` so preview does not log a favicon 404.
- Improved selected left-menu key contrast in `public/knowledge-ui.css` so long Russian titles stay readable after wrapping.
- Declared `"type": "module"` in `package.json` because existing Vite/PostCSS/Tailwind config files already use ESM syntax.
- Added status display for not-yet-authored records.
- Added small status styles in `src/index.css`.
- Added human-readable knowledge-base documentation in `docs/knowledge-base/REIKI_STEPS_KNOWLEDGE_BASE.md`.
- Added `scripts/validate-knowledge-base.mjs`.
- Added `npm run validate:knowledge` and `npm run check` scripts.
- Added `.github/workflows/ci.yml` to run install, knowledge validation, and build on PRs.

Findings:

- User screenshots and follow-up corrections define the actual accepted course structure: 7 levels / 37 records.
- Earlier 7-level placeholder structure was wrong and has been replaced.
- Current repo `main` is simpler than external project memory.
- Current repo `main` did not contain `AGENTS.md`, `STATE.md`, `LOG.md`, `src/App.jsx`, `src/pages/*`, `src/lib/supabaseClient.js`, or Supabase migrations during audit.
- External `ai-projects-brain` memory likely needs update/reconciliation.

Verification:

- GitHub file inspection completed.
- Confirmed `src/data/reikiKnowledgeBase.js` was updated with latest user-corrected 7-level structure.
- Local clone/npm verification not completed because the execution container could not resolve `github.com`.
- Required checks still to run in a networked/dev environment:
  - `npm ci`
  - `npm run validate:knowledge`
  - `npm run build`
  - local preview and responsive QA

Risks:

- Full lesson descriptions/practices/results are still not authored; only structure and titles are aligned.
- Long Russian titles may need mobile CSS/spacing QA.
- New all-level accordion behavior needs visual QA on desktop/mobile.
- CI workflow must be observed after GitHub Actions starts; current environment cannot prove the run result.
- Stale project memory may mislead future Codex tasks unless updated.
