# Reiki Yggdrasil — STATE

Last updated: 2026-05-27

## Current verified repo state

- repo: `andylitvinov-design/reiki-yggdrasil`
- default branch: `main`
- live URL from project memory: `https://reiki-yggdrasil.vercel.app`
- hosting from repo config: Vercel / Vite build
- build command: `npm run build`
- output directory: `dist`
- framework: `vite`

## 2026-05-27 Power Place Star format and left library

- Branch: `codex/add-star-power-place-format-and-left-library`, based on fresh `origin/main` commit `1ee04779ac53e98b59bf38517ea885776527332d`.
- `/profile` → `Место силы` keeps the top-tab workflow and now includes constructor format `Звезда`.
- `Звезда` supports variants `Закрытая` (`star_variant: closed`) and `Открытая` (`star_variant: open`).
- Both star variants use five clickable object positions (`star-1` through `star-5`) with the existing object image selector, upload flow, Storage refs, save/update, and print path.
- The open star variant keeps five positions but visually extends the right ray and lower-left leg as continuation lines.
- The left `Место силы` block now works as a compact library/navigation panel with collapsible groups for `ДАО РИ`, `Каналы Богов`, `Талисманы`, `Артефакты`, `Подложка места силы`, and `Фото клиентов / целей`.
- Category sources are existing data only: `reikiLevels` / `stepOptions`, `mysteryTraditions`, `leftMenuSections["artifact-creation"]`, `leftMenuSections["artifact-shop"]`, saved `materials`, `coverVariants`, and `clientGoalPhotos`.
- The saved image list reuses `clientGoalPhotos`, `traditionAssets`, `materials`, and image-based `coverVariants`; clicking an item assigns it to the selected object slot, and client/goal photos also set the central photo.
- New migration: `supabase/migrations/20260527143000_power_place_star_format.sql` adds `star_variant`, includes `star` in the constructor type check, and constrains star variants to `closed` / `open`.

Needs verification:

- Apply `20260527143000_power_place_star_format.sql` in live Supabase before treating star save/reload as production verified.
- Authenticated production save/reload still requires live Supabase env, applied migrations, and a real profile session.
- Browser QA should verify `/profile` at desktop widths 1280/1366/1440/1710 and mobile 390 for overlap/readability.

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
- Power-place star upgrade adds `Звезда` with `Закрытая` / `Открытая` variants, `star_variant`, and `star-*` image refs in the existing composition `object_refs`.
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
- apply `supabase/migrations/20260527143000_power_place_star_format.sql`
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
