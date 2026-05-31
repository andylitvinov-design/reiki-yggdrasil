# Reiki Yggdrasil — STATE

Last updated: 2026-05-29

## Current verified repo state

- repo: `andylitvinov-design/reiki-yggdrasil`
- default branch: `main`
- live URL from project memory: `https://reiki-yggdrasil.vercel.app`
- hosting from repo config: Vercel / Vite build
- build command: `npm run build`
- output directory: `dist`
- framework: `vite`

## 2026-05-31 — Profile bootstrap user-state fix

- Branch: `codex/fix-profile-bootstrap-user-state`, based on fresh `origin/main` commit `7c44be6`.
- Scope: targeted `/profile` bootstrap/auth state only; no homepage, `/masters`, `/profile/admin`, Supabase schema, OAuth provider settings, env, or Vercel rewrite changes.
- `loadProfileCabinetBootstrap` now:
  - normalizes direct user, `{ user }`, and `{ data: { user } }` auth response shapes;
  - keeps the direct `id` path as the primary success path;
  - uses JWT `sub` / `user_id` fallback when `getCurrentUser` times out, hits non-401/403 network-style failure, or resolves without a usable `id`;
  - refuses fallback for real 401/403 auth failures.
- `/profile?debugAuth=1` now reports safe bootstrap pipeline fields:
  - `bootstrap step`
  - `bootstrap error safe message`
  - `currentUser id present after bootstrap`
  - `cancelled before apply`
  - `react bootstrap checkpoint`
  - `getCurrentUser response id present`
- `ProfilePage.jsx` now marks the pipeline before/after `loadProfileCabinetBootstrap`, after return, around `setUser`, after `setAuthStatus("ready")`, and on cleanup/cancel.
- Cabinet shell remains gated by `user && authStatus === "ready"`.
- Optional data loads for materials, client/goal photos, power places, and tradition assets remain separate effects after the shell user/profile bootstrap and do not block cabinet opening.

Verification:

- Passed `node test/profileBootstrapClient.test.mjs`.
- Passed `npm run check` (including debug contract/manifest, profile tests, validators, and build).
- Passed `npm run build`.
- Not verified locally/live: real Google OAuth session on `https://mentalica.vercel.app/profile?debugAuth=1`, because live auth requires browser/account interaction after merge/deploy.

## 2026-05-31 — PR #131 profile loading recovery

- Branch: `codex-fix-profile-loading-regression`, rebased onto `origin/main` after PR #130 added `docs/PROFILE_SERVICES_ROADMAP.md`.
- Scope: minimal `/profile` loading safety only; no services/shop integration, no homepage changes, no Vercel rewrite changes.
- Added request abort timeouts in `src/lib/supabaseClient.js` and `src/lib/powerPlaceClient.js` with safe Russian timeout messages.
- Malformed stored profile sessions are now cleared through the existing session helper instead of being left in localStorage.
- Added React-level `/profile` loading fallback in `src/pages/ProfilePage.jsx`:
  - after a long initial load, the UI offers `Войти заново`;
  - the action clears only the stored profile session through the existing session helper and returns to login state;
  - raw errors, tokens, env values, and request URLs are not displayed.
- Kept `public/profile-loading-recovery.js` as a temporary DOM-level fallback guard while the React fallback is verified.
- Removed the unsafe React Fiber hook-index state dispatch path from `public/profile-power-place-visual-export.js`; normal save/update remains the supported path, and save-as-new remains temporarily disabled until it is owned by React.

Verification:

- Passed `npm run test:profile-media`, `npm run test:profile-materials`, `npm run test:profile-services`, `npm run test:power-place`, `npm run check`, and `npm run build` after `npm install`.
- Browser QA on local Vite dev server covered `/`, `/profile`, `/masters`, `/profile/admin`, desktop 1366, and mobile 390 with no console warnings/errors and no horizontal overflow in the no-env state.
- Session QA covered clean storage, expired session clearing, malformed session clearing, and invalid-token/no-env non-hanging state.
- Runtime isolation disabled each profile helper script one by one in `index.html`; none was confirmed to break initial `/profile` load in the local no-env state.
- Not verified locally: authenticated profile load, Google OAuth, slow/blocked real Supabase request, and normal save/update against Supabase because `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, and `VITE_ADMIN_EMAIL` were unset in this shell.
- Production/live verification remains required after merge and deploy.

## 2026-05-29 — Public right-panel materials feed upgrade

## 2026-05-29 — Profile power sources UX (issue #72)

- Branch: `codex/issue-72-profile-power-sources-ux` (in progress)
- `/profile` defaults updated for Power Place focus first:
  - `activeTopTab` default `power-place`
  - `resourceComparisonMode` default `photo_mandala`
  - Reset/logout path keeps `activeTopTab = "power-place"` and `resourceComparisonMode = "photo_mandala"`
- Unified source panel and popup taxonomy for Power Place and Mandalas:
  - visible source block title unified to `Источники силы`
  - category set now includes `Клиенты` in shared source taxonomy
  - client/goal center selection flows through shared source/popup stack
- `POWER_SOURCE_COUNTS` increased to `[2, 4, 6, 8, 12, 18]` for ~1.5x capacity
  - geometry/visual sizing adjusted in `src/profileMandalaWorkspace.css` and related source layout sizing.
- Mystery label normalization:
  - all user-visible category label wording aligned to `Мистерии` (removed `Каналы Богов` from UI labels)
- Mobile behavior:
  - source column order adjusted to render workspace main area before source list under `980px`.

- Branch: `codex/public-right-materials-panel-upgrade` (in progress)
- Public home and left-navigation label updated:
  - `src/data/topSectionMenus.js`: home item `home-dao-ri` label changed to `Школа ДАО РИ`.
- Added a public materials helper:
  - `src/lib/profileMaterialsClient.js`: `listPublicMaterials({ limit })`
  - reads only `status=approved`
  - selects safe fields from `profile_cabinet_publications`
  - returns `[]` safely when Supabase is not configured
  - avoids signed URL creation for anonymous reads
  - joins profile display when supported by Supabase relation; otherwise degrades safely.
- Extended right rail in `src/main.jsx` to render approved materials for public sections:
  - DAO RI and all public top sections (including Mysteries, Mastery, Shop, home) show a contextual right panel.
  - Context priority is by current step (`step_id`/title/context), then token-based text matching across material metadata.
  - If no match exists for the active section, panel falls back to newest approved materials list with note `Новые материалы сайта`.
- Added minimal styles in `src/index.css` for public feed wrapper, panel states, cards, chips, and safe thumbnails/placeholders.
- `publicText` safety guard remains: audio/video playback was not introduced because schema has no explicit audio URL field in known fields.
- Private storage refs (e.g. `storage://...`) are not exposed in the public card DOM.

## 2026-05-28 — Mandala category popover UX reapply

- Branch: `codex/refine-profile-mandala-category-popovers` (SHA `1fed4773a6f6f0b2f8f2f2f7d7f2c2e7f8c2a3d1`), merged from clean worktree based on current `origin/main`.
- Reapplied mandala category popover UX onto the current repository state for `/profile`:
  - `mandalaAtelierGrid` now renders before category controls by layout ordering.
  - Category controls are split into compact disclosure blocks: `Дополнительные категории`, `Подкатегории`, and `DAO ступени` (DAO only when relevant).
  - Compact selection chips now show current category, subcategory, and DAO step in the category panel.
  - Desktop and mobile order is set so section header, form, category controls, then gallery ordering are explicit in layout.
  - Panels have max-height and overflow constraints to avoid vertical overflow.
- Existing behavior was intentionally preserved:
  - Save/upload/download flows
  - Supabase auth/session and media/power-place data flow
  - Storage refs + signed URL handling
  - `Фото клиентов / цели`, `Скачать`, `Название мандалы`, and picker modal behavior from PR #69
  - RU-first interface and Vercel rewrites
- Primary category labels were aligned to show `Мистерия / Каналы Богов` in the second tab.
- PR created: https://github.com/andylitvinov-design/reiki-yggdrasil/pull/70

Needs verification:

- Browser QA should confirm `/` `/profile` `/masters` `/profile/admin` desktop 1280/1366/1440/1710 and mobile 390 with no horizontal overflow and working disclosure toggles.
- Confirm PR #68 star format and PR #69 picker/download UX remain unchanged through runtime smoke tests.

## 2026-05-27 Power Place image picker and download UX

- Branch: `codex/refine-power-place-image-picker-download`, based on fresh `origin/main` commit `81bbda92aed1bfbfaad259b6329419ab135a3367`.
- `/profile` Power Place center zones now show the readable placeholder `Фото клиента / цели` and open the client/goal photo picker.
- Non-center Power Place object slots now open the same popup pattern for selecting saved images; the compact object editor remains available as a secondary control.
- Object picker category sources:
  - `ДАО РИ`: `src/data/reikiKnowledgeBase.js` via `reikiLevels`; saved material images are filtered by level steps when `step_id` is available.
  - `Каналы Богов`: `src/data/mysteryTraditions.js` via traditions/entities; saved tradition images are filtered by parent `tradition_id` because entity-level image mapping is not persisted.
  - `Талисманы`: `src/data/topSectionMenus.js` via `artifact-creation` labels containing `Талисман`; dedicated talisman taxonomy is `needs verification`, and only safely matched saved artifact images are shown.
  - `Артефакты`: `src/data/topSectionMenus.js` via `artifact-creation` items/groups; saved artifact/material images are shown.
- The resource comparison controls now sit in the right rail next to the visual area on desktop and stack on mobile.
- `Фото цели` mode hides surrounding mandala/object visuals without clearing state; `Цель + мандала` restores the full constructor visual.
- `Название места силы` was relabeled to `Название мандалы` and moved above the final action buttons while keeping the same `compositionTitle` / saved composition title field.
- Added `Скачать` between save/update and print. It downloads a dependency-free HTML representation of the visible Power Place metadata and image refs; full PNG/JPEG composition export remains `not verified` / out of scope for this pass.
- No database schema, Supabase env, Vercel routing, auth flow, or save/update/print persistence paths were changed.

Needs verification:

- Authenticated upload/save/reload still depends on live Supabase env, applied Storage migration, and a real profile session.
- Browser QA should verify `/profile`, `/masters`, `/profile/admin`, desktop widths 1280/1366/1440/1710, and mobile 390 for overflow/readability.

## 2026-05-27 Power Place Star format and left library

- Branch: `codex/add-star-power-place-format-and-left-library`, updated from main `origin/main`.
- `Место силы` includes constructor format `Звезда` and keeps both variants: `Закрытая` and `Открытая`.
- `Звезда` uses five object positions (`star-1` through `star-5`) with existing selector/upload/save/print flows and storage-backed object refs.
- Added/kept `supabase/migrations/20260527143000_power_place_star_format.sql` support for `constructor_type: star` and `star_variant` normalization.

Needs verification:

- Apply `20260527143000_power_place_star_format.sql` in live Supabase.
- Verify authenticated save/reload of `star_variant` and `constructor_type: star` against production data.

## 2026-05-27 profile mandala cabinet UX refinement

- Branch: `codex/refine-profile-mandala-cabinet-ux`, based on fresh `origin/main` commit `50e2373cfb0c1e87a58ad2b2cc5ed3967e13f194`.
- `/profile` top tabs remain `Мои мандалы`, `Место силы`, `Чаты`, and `Профиль`.
- Expired/invalid stored Supabase sessions are cleared before showing the login UI; real post-login/save errors still render.
- System notices now render inside the authenticated cabinet workspace under the personal cabinet hero.
- The separate `Настройка потока` panel was removed from `Мои мандалы`; step/settings selects remain inside the material form.
- Material category sources:
  - `ДАО РИ`: `src/data/reikiKnowledgeBase.js` via `reikiLevels` and steps.
  - `Каналы Богов`: `src/data/mysteryTraditions.js` via traditions/entities.
  - `Талисманы`: `src/data/topSectionMenus.js` via `artifact-creation` items/groups filtered by labels containing `Талисман`; dedicated talisman taxonomy is `needs verification`.
  - `Артефакты`: `src/data/topSectionMenus.js` via `artifact-creation` items/groups.
- Material images now use the existing private `profile-cabinet-media` Storage flow under `{profile_id}/materials/...` and persist `storage://...` refs in `profile_cabinet_publications.image_url`.
- No new migration was added; this relies on the existing `image_url` field and `20260527_profile_cabinet_media_storage.sql` bucket/policies.

Needs verification:

- Apply/confirm `20260527_profile_cabinet_media_storage.sql` in the live Supabase project before treating authenticated material image upload/reload as production-verified.
- Browser QA should verify `/profile`, `/masters`, and `/profile/admin` at desktop widths 1280/1366/1440/1710 and mobile 390 for overflow/readability.

## 2026-05-27 profile Power Place top tab

- Branch: `codex/move-power-place-to-top-tab`, based on fresh `origin/main` commit `499d8f58259f0b4e4e141ce8526f7011513de4d7`.
- `/profile` top tabs are now `Мои мандалы`, `Место силы`, `Чаты`, and `Профиль`.
- The old independent right-panel switch `Мои мандалы и материалы` / `Место силы` and its `activeRightPanel` state were removed.
- `Место силы` keeps the left management/browser column visible and opens the existing Power Place constructor in the main/right workspace; the `Мои мандалы и материалы` gallery only renders on `Мои мандалы`.
- Preserved PR #60 cover/background persistence, center photo picker modal, clickable center zones, compact object editor, Power Place save/update/print behavior, material save/list flow, and Supabase auth/data flow.
- Preserved the combined profile workspace direction from PR #61/#63: profile and chat content stay inside their top tabs, and the old top profile blocks do not return.

## 2026-05-27 profile layout restore

- Restore branch: `codex/restore-profile-layout-fix-live`, based on PR #60 merge commit `e6877fdbfb9e80022bd1001c6d886dcecde57d7c`.
- Previous Task 1 source found locally at branch `codex/fix-profile-cabinet-layout-panels`, worktree `/Users/andriilitvinov/.config/superpowers/worktrees/reiki-yggdrasil/profile-combined-cabinet-design`, HEAD `3e1dc36701c794131d02bd8ba58bcf3d6137d6f1`.
- The layout source was dirty worktree state, so the restore ports the missing layout manually instead of cherry-picking the branch tip.
- PR #60 Power Place cover persistence, cover restoration, center photo picker modal, and save/update/print behavior are preserved.

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
- `supabase/migrations/20260526_power_place_upgrade_6_zodiac_chat.sql`
- `supabase/migrations/20260527_profile_cabinet_media_storage.sql`
- `supabase/migrations/20260527143000_power_place_star_format.sql`
- `src/lib/profileMediaClient.js`
- `scripts/apply-reiki-supabase-migrations.mjs`

Supabase migration runner state:

- `npm run supabase:migrations:apply` applies the committed Power Place migrations plus `20260527_profile_cabinet_media_storage.sql` and `20260527143000_power_place_star_format.sql`.
- Credentials are read from the local wallet endpoint `http://127.0.0.1:${SECRET_VAULT_PORT || 8790}/api/secrets/read`.
- Required secret names are `SUPABASE_ACCESS_TOKEN` and `SUPABASE_PROJECT_REF`.
- Wallet-unavailable and missing-secret states fail before any Supabase CLI command runs.

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
- Supports cover selection from reusable profile/material image URLs, local safe custom cover image, and placeholder covers.
- Supports type selection between `Мандала клиенту` and `Алтарь`.
- `Мандала клиенту` supports geometry selection for 2, 4, 5, 6, 8, and 12 power-source objects around the center.
- The 12-position layout keeps the 8-position cross/intermediate structure and adds four outer corner `хранители пространства`.
- `Алтарь` supports five top image objects, a larger central top object with 1:1 / 1.5:1 / 2:1 / 3:1 proportions, a slightly lower center photo, and two lower support images.
- Active constructor object positions support local upload and selection from reusable profile/material image URLs.
- Adds a print action scoped to the mandala composition only.
- Branch `codex/power-place-persistence-plans` adds metadata persistence for saved compositions, profile-level Start/Pro limits, client/goal photo references, and selected mystery-tradition asset references.
- Power-place upgrade #5 adds `Бизнес-мандала` and `ДАО` constructor formats, resource comparison mode/comments, and additive persistence fields for those settings.
- Power-place upgrade #6 adds `Зодиак` with 2/4/6/8/12 visible clock positions, `zodiac_visible_count`, and `zodiac-*` image refs in the existing composition `object_refs`.
- Start allows 7 saved Power Place compositions and 10 client/goal photos.
- Pro allows 20 saved Power Place compositions and 30 client/goal photos.
- Central Power Place photos must come from the `Фото клиентов / целей` section.
- Altar object selectors use images saved under the selected tradition in `Мистерии`.
- Client/goal photos, tradition assets, Power Place slot images, and underlay covers upload to private Supabase Storage bucket `profile-cabinet-media`.
- Database rows store durable `image_bucket` / `image_path` metadata for client/goal and tradition images; saved Power Place object refs store `storage://profile-cabinet-media/...` refs.
- Private Storage images are displayed through short-lived signed URLs. Legacy external URL refs still load.
- Saved Power Place `cover_ref.src` now restores the selected cover/background across client, altar, business, zodiac, and DAO layouts.
- The central Power Place photo zone opens a compact `Выбрать фото клиента` modal that lists saved client/goal photos and can create/select a new one through the existing client-photo flow.
- The mobile `/profile` workspace now keeps authenticated cabinet content within viewport width, moves `Место силы` first on mobile, collapses `Мой профиль` by default, uses tabs `Мои мандалы` / `Чаты` / `Профиль`, removes `Команда 1–5`, and assigns Power Place slot images directly from visible diagram positions.
- The Power Place mode switch shows `Режим: START/PRO` and still uses the existing `account_plan` limits: Start 7/10 and Pro 20/30.

Live data flow still depends on manual Supabase/Vercel setup:

- apply `supabase/migrations/20260524_profile_cabinet_mvp.sql`
- apply `supabase/migrations/20260524_profile_cabinet_rls_followup.sql`
- apply `supabase/migrations/20260526_profile_cabinet_publication_step_fields.sql`
- apply `supabase/migrations/20260526_profile_cabinet_security_lints.sql`
- apply `supabase/migrations/20260526_power_place_persistence.sql`
- apply `supabase/migrations/20260526_power_place_upgrade_5_business_dao.sql`
- apply `supabase/migrations/20260526_power_place_upgrade_6_zodiac_chat.sql`
- apply `supabase/migrations/20260527_profile_cabinet_media_storage.sql`
- set Vercel env names `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_ADMIN_EMAIL`
- add Supabase auth redirect URLs for `/profile` and `/profile/admin`
- enable and configure the Google provider in Supabase Auth before treating Google login as live
- after first admin login, add a row to `profile_cabinet_admins`

Master chat state:

- `/profile` has a `Чаты` tab for authenticated masters.
- Master cabinet IDs are displayed as `RY-<first 8 profile uuid chars>` and search matches display name, raw UUID, or formatted ID.
- Chat tables are private by RLS: no anon policies, only participants can read conversations/messages, only participants can send, and favorites are owner-only.
- Favorite chats are sorted before non-favorites in the cabinet UI.
- Live chat persistence remains needs verification until the upgrade #6 migration is applied in Supabase and tested with two authenticated master profiles.

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
- upgrade #6 chat RLS and two-master message flow against production Supabase

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

## 2026-05-28 — Реализация категории `Каналы` в материалах и Power Place

Внедрена категория материалов `Каналы` в `src/pages/ProfilePage.jsx` без изменений backend/миграций:

- Порядок первичных категорий в `MATERIAL_CATEGORY_TABS` подтверждён:
  - `ДАО РИ`
  - `Мистерия / Каналы Богов`
  - `Каналы`
  - `Талисманы`
  - `Артефакты`
- Для `Каналы` добавлены подкатегории:
  - `Сефирот` (`Большие арканы`, `Малые арканы`, `Сиферы`)
  - `Руны` (`Первый атт`, `Второй атт`, `Третий атт`)
  - `Планеты` (`Солнце`, `Луна`, `Меркурий`, `Венера`, `Марс`, `Юпитер`, `Сатурн`)
  - `Деньги`
  - `Жизнь`
- Добавлено третье состояние для материалов и picker:
  - `activeMaterialThirdLevel`
  - `isMaterialThirdLevelPanelOpen`
  - `activePickerThirdLevel`
  - инициализация/сброс при смене категорий и подкатегорий.
- `filteredMaterials` и `pickerImageOptions` расширены для `channels`:
  - фильтрация по подкатегории и третьему уровню с UI-only fallback сопоставлением по тексту/метаданным.
- В Power Place picker для `Каналы` добавлен отдельный пустой текст:
  - `Материалы для этого канала пока не добавлены.`
