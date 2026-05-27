# Reiki Yggdrasil — LOG

## 2026-05-27 — Move Power Place to `/profile` top tab

Mode: `/profile` navigation simplification on branch `codex/move-power-place-to-top-tab`.

Changed:

- Added `Место силы` as a top-level workspace tab between `Мои мандалы` and `Чаты`.
- Removed the independent right-panel switch `Мои мандалы и материалы` / `Место силы` and removed the now-unused `activeRightPanel` state path.
- Kept the left management/browser column visible for `Мои мандалы`, `Место силы`, `Чаты`, and `Профиль`.
- Scoped `Мои мандалы и материалы` gallery to the `Мои мандалы` tab only, so it is hidden when `Место силы` is active.
- Kept Power Place inside the main/right working area, not full-screen.
- Preserved PR #60 cover/background persistence, center photo picker modal, clickable center zones, compact object editor, Power Place save/update/print logic, material save/list logic, and Supabase auth/data flow.
- Preserved PR #61/#63 combined workspace behavior: profile and chat content remain inside their tabs, and old top profile blocks stay removed.

Needs verification:

- Authenticated production save/reload still requires live Supabase env, applied migrations, and a real profile session.
- Browser QA should verify `/profile` at desktop widths 1280/1366/1440/1710 and mobile 390 for overlap/readability.

## 2026-05-27 — Restore profile layout tabs onto PR #60 main

Mode: manual port from previous dirty Task 1 worktree onto `origin/main` after PR #60.

Changed:

- Found previous source branch `codex/fix-profile-cabinet-layout-panels` at `/Users/andriilitvinov/.config/superpowers/worktrees/reiki-yggdrasil/profile-combined-cabinet-design`, HEAD `3e1dc36701c794131d02bd8ba58bcf3d6137d6f1`.
- Restored independent `/profile` top tabs: `Мои мандалы`, `Чаты`, `Профиль`.
- Moved profile form and preview into the `Профиль` tab so old `Профиль мастера / Мой профиль` and `Как это будет выглядеть` blocks no longer sit above `Мастерская мандал`.
- Restored independent right-panel switch: `Мои мандалы и материалы` / `Место силы`.
- Kept compact contextual diagram-position editing and did not restore the bulky `Слоты диаграммы` editor.
- Preserved PR #60 cover persistence, cover restoration, clickable center zones, `Выбрать фото клиента` modal, and Power Place save/update/print flow.

Needs verification:

- Authenticated production save/reload still requires live Supabase env, applied migrations, and a real profile session.
- Browser QA should verify desktop widths 1280/1366/1440 and mobile 390 for overflow/readability.

## 2026-05-27 — Supabase Storage photo uploads for profile cabinet media

Mode: private Storage upload implementation on branch `codex/supabase-photo-storage-upload`.

Changed:

- Added private Supabase Storage bucket migration for `profile-cabinet-media`.
- Added owner-only Storage policies keyed by the first path segment `{profile_id}`.
- Added durable media columns for client/goal photos and tradition assets.
- Added `profileMediaClient.js` for image validation, safe filename/path generation, authenticated upload, and signed URL creation.
- Wired `/profile` client/goal, tradition, cover, and Power Place object-slot uploads to Storage.
- Kept central Power Place photos restricted to saved `Фото клиентов / целей`.
- Kept legacy external URL refs loading while filtering `data:image` out of persisted payloads.

Needs verification:

- Apply `20260527_profile_cabinet_media_storage.sql` in the live Supabase project.
- Verify authenticated upload/reload and cross-user Storage RLS denial against production Supabase.

## 2026-05-27 — Power Place cover persistence and center photo picker

Mode: scoped /profile Power Place persistence and UX fix on branch `codex/fix-power-place-image-persistence`.

Changed:

- Preserved selected Power Place cover sources in `cover_ref.src`, including custom image data URLs, so saved compositions can restore the mandala background.
- Applied the selected cover to all Power Place visual formats: client mandala, altar, business, zodiac, and DAO.
- Made central mandala photo zones clickable and opened a compact `Выбрать фото клиента` modal.
- Reused existing `clientGoalPhotos`, `createClientGoalPhoto`, `selectedCentralPhotoId`, and Start/Pro client-photo limits inside the modal.
- Kept non-center object positions on the compact contextual slot chooser and removed the large side slot editor from the rail.

Needs verification:

- Authenticated production save/reload still requires live Supabase env, applied migrations, and a real profile session.
- Supabase Storage upload remains needs verification; the modal persists URL/metadata through the existing client photo table.

## 2026-05-27 — Profile mobile Power Place workspace fix

Mode: UI-only `/profile` cabinet mobile and Power Place simplification branch.

Changed:

- Collapsed the master profile editor behind a compact `Мой профиль` card by default.
- Replaced workspace tabs with `Мои мандалы`, `Чаты`, and `Профиль`.
- Added mobile overflow containment and mobile ordering so `Место силы` appears first in authenticated cabinet content.
- Removed the confusing `Команда 1–5` command-slot UI.
- Replaced the old flow tuning label with `Режим: START/PRO` and wired the switch to existing `account_plan` limits.
- Made visible Power Place diagram slots clickable so images can be assigned directly from the diagram.

Needs verification:

- Authenticated production save/reload still depends on live Supabase migrations/env and Storage verification.

## 2026-05-26 — Wallet-backed Supabase migration runner

Mode: clean replacement branch for PR #57 with only runner/package/docs changes.

Changed:

- Added `scripts/apply-reiki-supabase-migrations.mjs`.
- Added `npm run supabase:migrations:apply`.
- Documented wallet-backed execution and safe-stop behavior.
- Kept existing committed migration files unchanged.

Needs verification:

- Apply the migrations against the live Supabase project after the local wallet contains valid `SUPABASE_ACCESS_TOKEN` and `SUPABASE_PROJECT_REF`.

## 2026-05-26 — Power-place upgrade #6: Zodiac and master chat

Mode: additive `/profile` constructor and authenticated chat enhancement on branch `codex/power-place-zodiac-master-chat`.

Changed:

- Added `Зодиак` Power Place constructor format with 2, 4, 6, 8, and 12 visible clock positions.
- Kept Zodiac center restricted to saved `Фото клиентов / целей`.
- Added Zodiac object selectors using the existing reusable image/reference controls and persisted refs as `zodiac-*` keys in `object_refs`.
- Extended Power Place composition normalization and tests for `constructor_type: "zodiac"` and `zodiac_visible_count`.
- Added `Чаты` tab in `/profile` with master search by name or cabinet ID, favorite chat pinning, selected messages, and message composer.
- Added a compact visible cabinet ID derived from the existing profile UUID.
- Added `src/lib/masterChatClient.js` for authenticated Supabase REST chat operations.
- Added `supabase/migrations/20260526_power_place_upgrade_6_zodiac_chat.sql` for Zodiac persistence, chat conversations, participants, messages, favorites, and strict participant/owner RLS.

Needs verification:

- Apply the new Supabase migration in the live project before treating Zodiac save/reload and chat persistence as production-verified.
- Verify two authenticated approved masters can create a conversation, exchange messages, and use favorites.
- Verify non-participant access is blocked by RLS in the live Supabase project.
- Supabase Storage upload remains needs verification; local `data:image` previews are still filtered from saved payloads.

## 2026-05-26 — Power-place upgrade #5: Business mandala and DAO

Mode: additive `/profile` constructor enhancement on branch `codex/power-place-upgrade-5-business-dao`.

Changed:

- Added `Бизнес-мандала` constructor format with an upward triangle, three labeled vertices, and a shared 1/3 zone count per vertex.
- Added `ДАО` constructor format with a central Usin circle and five selectable element image zones: `Вода`, `Дерево`, `Огонь`, `Земля`, `Металл`.
- Kept the central photo selector restricted to saved `Фото клиентов / целей`.
- Added resource comparison mode `Фото клиента` / `Фото + мандала` and comments for resource before/after mandala.
- Included selected format and resource comments in the print composition area.
- Extended Power Place composition normalization and tests for `client`, `altar`, `business`, and `dao` payloads.
- Added `supabase/migrations/20260526_power_place_upgrade_5_business_dao.sql` to relax constructor type checks and add business/resource fields.

Needs verification:

- Apply the new Supabase migration in the live project before treating production save/reload for the new fields as verified.
- Verify authenticated save/reload against production Supabase after migration.
- Supabase Storage upload remains needs verification; local `data:image` previews are still filtered from saved payloads.

## 2026-05-26 — Power-place persistence for plans, traditions, and client photos

Mode: additive `/profile` persistence implementation on branch `codex/power-place-persistence-plans`.

Changed:

- Added profile-level account plan support: `Start` and `Pro`.
- Added Supabase metadata tables for client/goal photos, tradition assets, and saved Power Place compositions.
- Added owner/admin RLS policies for the new Power Place tables.
- Added a dedicated Power Place client helper and unit test coverage for limits and payload normalization.
- Wired `/profile` to load and save client/goal photo references.
- Restricted Power Place central photo selection to saved `Фото клиентов / целей`.
- Added altar tradition selection from `src/data/mysteryTraditions.js`.
- Added tradition-linked image reference saving and altar object selection from the chosen tradition.
- Added saved composition create/update and reload controls for constructor type, geometry, altar ratio, cover reference, object references, central photo, and tradition.
- Kept file picker previews local and filtered `data:image` previews out of persisted composition references.

Needs verification:

- Apply `supabase/migrations/20260526_power_place_persistence.sql` in the live Supabase project.
- Verify authenticated owner save/reload against production Supabase.
- Verify real Supabase Storage buckets/policies before treating uploads as durable file storage.
- Billing is not implemented; `account_plan` is a profile-level field only.

## 2026-05-26 — Power-place update #4: 12-position client mandala and altar mode

Mode: additive `/profile` constructor enhancement on branch `codex/power-place-update-4-altar-12`.

Changed:

- Added constructor type selector: `Мандала клиенту` and `Алтарь`.
- Extended client mandala geometry options to 2, 4, 5, 6, 8, and 12.
- Added 12-position client layout with four large cross sources, four smaller intermediate sources, and four outer corner `хранители пространства`.
- Added local object-image placement controls for the active constructor positions, using reusable profile/material image URLs or local image uploads.
- Added altar layout with five top image squares, larger central top object, center photo placed lower, mandala base, and two bottom support objects.
- Added altar central-top proportion selector: 1:1, 1.5:1, 2:1, and 3:1.
- Kept print scoped to the selected constructor composition and hid edit-only object controls from print.
- Kept Supabase schema, storage, env names, routes, and rewrites unchanged.

Needs verification:

- Constructor persistence remains needs verification; selected type, layout, object images, cover, geometry, and altar proportions are local UI state only.
- Authenticated production save flow still depends on live Supabase/Vercel setup.

## 2026-05-26 — Power-place cover and geometry constructor

Mode: additive `/profile` mandala workspace enhancement.

Changed:

- Added a compact `Места силы / Магическая мандала` constructor to the authenticated profile mandala workspace.
- Added local-state cover selection from existing profile/material images, safe local custom image, and placeholder cover variants.
- Added geometry selection for 2, 4, 5, 6, and 8 power-source objects around the center image.
- Added five right-side command image slots and placed `Заставка места силы` under them.
- Added print CSS and a `Распечатать` action scoped to the mandala composition.
- Kept the feature UI-first without Supabase schema, storage, env, route, or rewrite changes.

Needs verification:

- Cover and geometry persistence remains needs verification.
- Authenticated production flow still depends on live Supabase/Vercel setup.

## 2026-05-26 — Greek mysteries moved to top-level Mysteries section

Mode: correction of PR #40 wiring.

Changed:

- Moved the Greek deity/channel tab mode from DAO RI step state to the top-level `МИСТЕРИИ` section.
- Set the trigger to `activeTopSection === "mysteries-school"` and `selectedLeftItemId === "mysteries-greek"`.
- Removed the mystery tradition dependency on `RY-L03-S03` and `selectedStepId`.
- Changed the deity-tab back button to `← Все мистерии`.
- Added a section overview state so returning from Greek tabs restores the broad mystery list.
- Kept DAO RI step navigation and right practice/settings panel on the existing Reiki data path.

Verification:

- `npm ci` passed.
- `npm run check` passed; existing video placeholder warnings remain for `RY-L04-S04` and `RY-L04-S05`.
- `npm run build` passed.
- `npm run preview -- --port 4173` started; port 4173 was already occupied, so Vite served the preview on `http://localhost:4174/`.
- Browser QA passed for `/`: `МИСТЕРИИ → Греческие мистерии`, Greek deity tabs, Дионис / Деметра / Афина switching, `← Все мистерии`, DAO RI return, mobile viewport at 390px, and console errors check.
- Route smoke checks passed for `/`, `/profile`, `/masters`, and `/profile/admin`.

## 2026-05-26 — Greek mystery tradition UI integration

Mode: continuation of PR #40 / `codex/mystery-tradition-detail-tabs`.

Changed:

- Wired `src/data/mysteryTraditions.js` into the DAO RI UI.
- Added a mystery-mode view for `RY-L03-S03` / `Греческая магия. Зодиак`.
- Replaced the left level list with Greek deity tabs while mystery mode is active.
- Added `← Все уровни` to return from deity tabs to the normal DAO RI level/step list.
- Added the central deity detail view with breadcrumb, title, archetype, description, articles, notes, and video placeholder.
- Added a right panel for initiation CTA, mandalas, and artefacts/shop placeholders.
- Kept all other DAO RI steps on the existing step card and practice/settings panel.

Verification:

- `npm install` passed.
- `npm run check` passed; existing video placeholder warnings remain for `RY-L04-S04` and `RY-L04-S05`.
- `npm run preview -- --port 4174` started successfully.
- Browser smoke QA passed for desktop DAO RI navigation into `Уровень 3 → Храмовая магия → Греческая магия. Зодиак`, deity tab switching, `← Все уровни`, normal step UI restoration, mobile layout at 390px width, and console errors check.

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
