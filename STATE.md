# Reiki Yggdrasil — STATE

Last updated: 2026-06-05

## 2026-06-05 — Public Master Page MVP

- Branch: `codex/public-master-page-mvp`, clean worktree from `origin/main` at `1157df6`.
- Scope: first visible public master detail page at `/masters/:id`; no production push/deploy and no Supabase migration.
- Changed:
  - added `/masters/:id` manual route and Vercel SPA rewrite while preserving `/masters` catalog;
  - added public-safe master page data client for approved profiles, approved publications, and published services;
  - added Facebook-like master page UI: cover, avatar, master identity, action buttons, tabs, central feed cards, and compact public-safe right rail;
  - catalog cards now include `Страница мастера` navigation;
  - home page preview was intentionally not added in this pass.
- Data boundary:
  - real rows come from `profile_cabinet_profiles`, `profile_cabinet_publications`, and `profile_cabinet_services`;
  - fallback/demo cards render only when Supabase is not configured or public rows are empty, and are labeled as examples;
  - public rendering strips `storage://`, `data:image`, Supabase signed object URLs, and `profile-cabinet-media` URLs.
- Verification status:
  - `npm install`, `npm run test:public-master`, `node test/profileLiteRoute.test.mjs`, `npm run test:profile-materials`, `npm run test:profile-services`, `npm run build`, `npm run check`, and `git diff --check` exited `0`;
  - `npm run check` retained existing `RY-L04-S04` / `RY-L04-S05` video placeholder warnings and the existing Vite large-chunk warning.
- Local browser QA:
  - dev server: `http://localhost:4362/`;
  - screenshots captured for `/masters/demo-master` at desktop `1280x920` and mobile `390x900`;
  - scripted Playwright QA checked `/`, `/masters`, `/masters/demo-master`, `/profile`, `/profile/services`, and `/profile/admin` at desktop and mobile;
  - horizontal overflow was `0`, console warnings/errors were `0`, master page cover/avatar/tabs/feed/right rail were present, and public DOM/HTML had no `storage://`, `profile-cabinet-media`, signed URL markers, bucket/path fields, `object_refs`, or bearer token markers.
- Not verified yet:
  - real Supabase approved-profile/publication/service rows;
  - Vercel preview, production/legacy live URLs, Google OAuth, and staging/client dashboard setup.
- Next integration step:
  - add a private Grimoire/workshop action that publishes explicit public-safe rows into `profile_cabinet_publications`, then aggregate approved rows into `/feed`.

## 2026-06-05 — Draft/clean release model verification

- Branch: `codex/release-model-verification-20260605`, based on `origin/main` at `1c90788403540b5479d05cf82d8bb1669d55dfd2`.
- Scope: documentation only; UI, routes, Supabase code/schema, Vercel rewrites, domains, env values, and deployments were not changed.
- Verified from git:
  - `origin/main` exists at `1c90788403540b5479d05cf82d8bb1669d55dfd2`;
  - remote `production` branch was not present in `git ls-remote --heads origin main production 'release/*'`;
  - no remote `release/*` branches were present in that same check;
  - `.github/workflows/deploy-production.yml` has workflow_dispatch input `ref` defaulting to `production`.
- Verification:
  - `npm install`, `npm run check`, and `git diff --check` exited `0`;
  - `npm run check` retained existing warnings for `RY-L04-S04` / `RY-L04-S05` video placeholders and the existing Vite large-chunk warning.
- Changed:
  - README Supabase migration filenames were aligned with actual `supabase/migrations/` files;
  - README now includes `2mentalica` OAuth redirects for staging OAuth QA;
  - release workflow now requires checking for `production`, choosing a verified stable SHA, and only then running an explicit production-branch creation command;
  - release workflow now describes PR-based release/back-merge commands instead of normal direct pushes to `production`;
  - Vercel and Supabase dashboard checklists were made more explicit for `2mentalica`, client live, staging env names, storage bucket, RLS, test user, and test admin setup.
- Not verified:
  - Vercel dashboard project `2mentalica`, `https://2mentalica.vercel.app`, `https://www.2mentalica.vercel.app`, client project production branch setting, GitHub branch protection, and staging Supabase dashboard state;
  - live `/`, `/profile`, `/masters`, `/profile/admin`, `/profile/mandalas`, auth, upload, save/update mandala, `Мои мандалы`, mobile, and desktop 3-column QA.
- Risk:
  - `scripts/apply-reiki-supabase-migrations.mjs` currently needs separate verification before using it for every migration, because the docs list includes `20260605120000_grimoire_publication_types.sql`.

## Current verified repo state

- repo: `andylitvinov-design/reiki-yggdrasil`
- default branch: `main`
- live URL from project memory: `https://reiki-yggdrasil.vercel.app`
- hosting from repo config: Vercel / Vite build
- build command: `npm run build`
- output directory: `dist`
- framework: `vite`

## 2026-06-05 — Community Activity Feed Phase 2-4 implementation

- Branch: `codex/community-feed-phase-2-4`, clean worktree from `origin/main` at PR #291 merge commit `4f85b477ac92739d2680cc3ea454aee532654f50`.
- Scope: make `/feed` usable/testable through explicit pending-event creation and admin moderation, without automatic event creation on every edit and without production release.
- Changed:
  - `/profile/admin` now loads pending activity events, shows the second moderation section `Публикации и события на модерации`, and can approve/reject pending feed events;
  - `/profile/admin` has an admin-only test event form for pending public-safe events;
  - feed client now builds safe public event payloads, maps material types `mandala` / `artifact` / `practice`, checks duplicates by `target_table` + `target_id` + `activity_type`, updates existing draft/pending events, and returns a friendly message for approved duplicates;
  - Grimoire materials expose explicit `Добавить в ленту` for mapped publication types only;
  - published services expose explicit `Добавить в ленту` and `Опубликовать обновление`;
  - saved Power Place compositions expose a public projection form and `Опубликовать в ленту`, sending only title/body/category/tags and not private composition data;
  - activity-event migration target constraint now allows `profile_cabinet_power_place_compositions` as a feed event target, without changing private table/storage RLS.
- Verification:
  - `npm run check`, `npm run build`, `npm run test:profile-lite`, `npm run test:profile-feed`, `npm run test:profile-services`, `npm run test:power-place`, `npm run test:profile-media`, `npm run test:profile-loading-recovery`, and `git diff --check` exited `0`;
  - `npm install` was attempted but failed with `ENOSPC`; validation used a temporary symlink to the existing main-checkout `node_modules`, then removed it;
  - retained existing `RY-L04-S04` / `RY-L04-S05` video placeholder warnings and Vite large-chunk warning.
- Local browser QA:
  - preview server: `http://localhost:4356/`;
  - Playwright MCP checked `/feed`, `/profile/admin`, `/profile`, `/profile/mandalas`, `/profile/services`, and `/masters`;
  - desktop `1280x920` and mobile `390x900` checks had horizontal overflow `0`;
  - browser console warnings/errors were `0`;
  - checked route text contained no `storage://`, `profile-cabinet-media`, `/storage/v1/object/sign`, `signedURL`, `object_refs`, or `Bearer`.
- Not verified:
  - real Supabase migration application;
  - real authenticated admin create/approve/reject event flow;
  - real material/service/saved-mandala pending event creation against Supabase;
  - approved event appearing in `/feed` with live data;
  - Vercel preview, production/legacy live URLs, Google OAuth, and real admin membership.
- Risks:
  - live feed writes depend on applying the updated activity-events migration and existing admin/profile RLS helpers;
  - local QA used the Supabase-not-configured state, so data mutations remain `needs verification` in staging/live.

## 2026-06-05 — Community Activity Feed Phase 1 infrastructure

- Branch: `codex/community-activity-feed-phase-1`, clean worktree from `origin/main` at `2192fc5`.
- Scope: Phase 1 `/feed` infrastructure only: activity events migration/RLS, direct REST client, public feed page, manual route, Vercel rewrite, scoped CSS, and focused tests. Automatic event creation, likes/reactions/comments/follows, `/masters` redesign, public access to private Power Place/media tables, and production release were not implemented.
- Changed:
  - added `profile_cabinet_activity_events` as a public-safe projection/event table;
  - public RLS reads only `status='approved'` and `visibility='public_feed'` rows, with approved-profile or admin-announcement support;
  - owner RLS can manage own editable `draft` / `pending` / `rejected` events only;
  - admin RLS can manage all events through the existing `profile_cabinet_is_admin()` helper;
  - private Power Place/media table policies were not loosened;
  - `/feed` renders RU filter tabs: `Все`, `Новости`, `Мандалы`, `Фото`, `Услуги`, `Практики`;
  - feed cards strip unsafe images and render fallback visuals for missing/unsafe `image_url`;
  - the frontend client selects only public event columns, excluding `image_bucket` and `image_path`.
- Safety:
  - public feed image acceptance is limited to normal `http(s)` URLs and rejects `storage://`, `data:image`, Supabase signed object URLs, and `profile-cabinet-media` paths;
  - no Supabase JS SDK was introduced;
  - no env values or storage refs were added to docs/UI.
- Verification status:
  - `npm install`, `npm run check`, `npm run build`, `npm run test:profile-lite`, `npm run test:power-place`, `npm run test:profile-media`, `npm run test:profile-loading-recovery`, `npm run test:profile-feed`, and `git diff --check` exited `0`;
  - `npm run check` retained existing `RY-L04-S04` / `RY-L04-S05` video placeholder warnings and the existing Vite large-chunk warning;
  - local preview `http://localhost:4350/` browser QA checked `/`, `/profile`, `/profile/mandalas`, `/profile/services`, `/feed`, `/masters`, and `/profile/admin` at desktop `1280x920` and mobile `390x900`;
  - all checked routes rendered with horizontal overflow `0`;
  - `/feed` DOM/text contained no `storage://`, `profile-cabinet-media`, `/storage/v1/object/sign`, `signedURL`, or `object_refs`;
  - Chrome console warnings/errors were `0`.
- Not verified yet:
  - real authenticated Supabase owner/admin event writes;
  - live migration application in Supabase;
  - real approved `public_feed` rows through live anon Supabase;
  - Vercel preview, production/legacy live rendering, Google OAuth, and real public event data.
- Risks:
  - live `/feed` will show the configured/empty/error state until the migration is applied and approved `public_feed` rows exist;
  - public visibility still depends on applying this migration after the existing admin helper migration.

## 2026-06-05 — Mandala services Phase 3-4 shop/cart/orders

- Branch: `codex/mandala-services-phase3-4-shop-cart-orders`, rebased onto `origin/main` at `4f85b477ac92739d2680cc3ea454aee532654f50`.
- Scope: Phase 3 and Phase 4 together. Phase 5 result generation, master edit/send result, final result download, payments, multi-item cart, email/Telegram, and production deploy were not implemented.
- Shop audit:
  - existing search found only the unrelated public materials mini keyword `МАГАЗИН` surface, not a real services shop route;
  - added a minimal `/shop` public route and `/services/:serviceId` detail route.
- Changed:
  - public shop lists only `profile_cabinet_services` rows with `status=published`;
  - service detail fetches by id with `status=published`;
  - public service page shows title, description, `Бесплатно` for null/0 price, safe public preview only, and format selector `signature` / `no_signature` / `both`;
  - one-service cart uses `reiki-yggdrasil-service-cart` and pending checkout uses `reiki-yggdrasil-pending-service-cart`;
  - cart item stores only `service_id`, `composition_id`, `master_profile_id`, `format`, `price_amount`, `price_currency`, and `created_at`;
  - `/profile/services` now shows active public link/copy button for published services only;
  - `/profile/orders` separates `Кабинет Личный / Мои Заказы / Мои Фото` from `Кабинет Мастера / Заявки`;
  - unauthenticated checkout preserves pending cart and sends users to Google login prompt on `/profile/orders`;
  - authenticated Profile Lite restores pending cart if fresh, creates an order draft after re-fetching the published service, and requires explicit `Отправить заказ мастеру`;
  - client photos are capped in the order UI at 4 with the required copy.
- Data/RLS:
  - added additive migration `supabase/migrations/20260605153000_service_orders_client_phase4.sql`;
  - migration adds `client_profile_id`, `template_composition_id`, `order_format`, `client_photo_id`, `draft` / `photo_required` statuses, indexes, authenticated client order RLS, and a trigger preventing post-draft order identity changes;
  - migration runner allowlist and README migration list were updated;
  - live migration application is not verified.
- Rebase notes:
  - conflicts were resolved in `README.md` and `LOG.md`;
  - retained main's release-model, grimoire/media, cover/mandala controls, and Profile Lite fixes while preserving Phase 3/4 shop/cart/orders.
- Verification:
  - `npm install`, `npm run test:profile-services`, `npm run test:profile-lite`, `npm run test:profile-media`, `npm run test:power-place`, `npm run test:profile-loading-recovery`, `npm run build`, `npm run check`, and `git diff --check` exited `0`;
  - `npm run check` retained existing `RY-L04-S04` / `RY-L04-S05` video placeholder warnings and the existing Vite large-chunk warning.
- Local browser QA:
  - preview server: `http://localhost:4359/`;
  - Chrome DevTools MCP Browser was attempted but blocked by an existing `chrome-profile` lock, so QA used isolated headless Chrome/CDP;
  - checked `/`, `/shop`, `/services/test`, `/profile`, `/profile-old`, `/profile/mandalas`, `/profile/services`, `/profile/orders`, `/masters`, and `/profile/admin`;
  - viewports: `1280x920`, `1366x900`, and `390x900`;
  - all route/viewport combinations rendered with console errors `0` and horizontal overflow `0`.
- Not verified:
  - real Supabase public-service reads against live data, authenticated order draft/submit, photo upload, migration application, Vercel preview, production/legacy live rendering, and Google OAuth.
- Risks:
  - draft/archive distinction on public detail depends on RLS visibility; safe fallback does not expose details;
  - order draft/submit requires the new migration and RLS to be applied;
  - `/services/test` showed safe unavailable catalog text locally because Supabase env was not configured.

## 2026-06-05 — Mandala services Phase 2 manager

- Branch: `codex/mandala-services-phase2-manager`, clean worktree from `origin/main` at `c2cfb8e`.
- Scope: Phase 2 Services Manager only for `/profile/services`, shared service helpers, focused contracts, and docs. Public `/services/:serviceId`, Vercel rewrites, shop/cart/checkout/orders/result generation, auth/env changes, and destructive Supabase migrations were not implemented.
- Changed:
  - `/profile/services` is now a working services manager rather than a diagnostics-only list;
  - services remain grouped into `Черновики`, `Опубликованные`, and `Архив`;
  - service cards show title, description empty state, formatted price, status, `composition_id` state, and non-active public-link state;
  - selecting a service fills the right-side form for edit;
  - save draft updates an existing selected service by id, or creates a new draft when no id is selected;
  - safe status actions were added for `published`, `draft`, and `archived` with disabled loading state and visible success/error messages;
  - archived and draft services still do not expose an active public copy link;
  - MVP format labels were added: `С подписью мастера`, `Без подписи мастера`, `Две версии`.
- Formats persistence:
  - UI-ready placeholder only;
  - no migration was added and no new service table columns are assumed;
  - formats persistence is `needs verification`.
- Not verified yet:
  - real authenticated Supabase update/create/status-change against live data;
  - Vercel preview, production/legacy live rendering, Google OAuth, and public `/services/:serviceId`.
- Verification:
  - `npm install`, `npm run test:profile-lite`, `npm run test:profile-services`, `npm run test:power-place`, `npm run test:profile-media`, `npm run test:profile-loading-recovery`, `npm run check`, `npm run build`, and `git diff --check` exited `0`;
  - `npm run check` retained existing `RY-L04-S04` / `RY-L04-S05` video placeholder warnings and the existing Vite large-chunk warning.
- Local browser QA:
  - preview server: `http://localhost:4348/`;
  - headless Chrome/CDP checked `/`, `/profile`, `/profile-old`, `/profile/mandalas`, `/profile/services`, `/masters`, and `/profile/admin`;
  - viewports: desktop `1280x920`, desktop `1366x900`, and mobile `390x900`;
  - all route/viewport combinations rendered with console errors `0` and horizontal overflow `0`;
  - Chrome DevTools MCP Browser opening was attempted but blocked by an existing `chrome-profile` lock, so local CDP QA used a separate temporary Chrome user-data-dir.
- Risks:
  - selected service status changes depend on existing `profile_cabinet_services` RLS allowing owner PATCH;
  - format selection is local UI state until the table/schema decision is verified.

## 2026-06-05 — Mandala to services Phase 1 bridge

- Branch: `codex/mandala-services-phase1`, clean worktree from `origin/main` at `5a19379`.
- Scope: Phase 1 only for `/profile/mandalas`, `/profile/services`, `profile_cabinet_services` client helpers, and focused tests/docs. Cart, checkout, orders, public `/services/:serviceId`, public shop, client photo order flow, and personal result generation were not implemented.
- Changed:
  - Power Place actions are now `Сохранить мандалу`, `Перенести в услуги`, and `Опубликовать как услугу`, with PDF/print actions kept separate;
  - service actions save or update the composition first, then upsert the service by `profile_id + composition_id`;
  - transfer opens `/profile/services` and creates/reuses a draft service;
  - publish opens `/profile/services` and creates/reuses a published service;
  - service image payload for composition-derived services is kept empty to avoid persisting `data:image` or leaking private refs;
  - `/profile/services` groups services by `Черновики`, `Опубликованные`, and `Архив`;
  - default/free prices render as `Бесплатно`;
  - draft services show `Ссылка появится после публикации`;
  - published services show `needs verification: публичный маршрут ещё не реализован`, with no copy-link button until `/services/:serviceId` exists.
- Verification:
  - `npm run test:profile-lite`, `npm run test:profile-services`, `npm run test:power-place`, `npm run test:profile-media`, `npm run test:profile-loading-recovery`, `npm run check`, and `npm run build` exited `0`;
  - `npm run check` retained existing `RY-L04-S04` / `RY-L04-S05` video placeholder warnings and the existing Vite large-chunk warning.
- Local browser QA:
  - dev server: `http://localhost:4342/`;
  - HTTP smoke returned `200 OK` for `/`, `/profile`, `/profile-old`, `/profile/mandalas`, `/profile/services`, `/masters`, and `/profile/admin`;
  - headless Chrome CDP at 1280px confirmed all same routes render with console errors `0` and horizontal overflow `0`;
  - headless Chrome CDP at 390px confirmed `/profile/mandalas` and `/profile/services` render with console errors `0` and horizontal overflow `0`;
  - Playwright Browser MCP was attempted but unavailable in this session with `Transport closed`, so QA used local Chrome CDP.
- Not verified:
  - real authenticated Supabase save/update/upsert against live data;
  - Vercel preview, merge/deploy, production/legacy live rendering, Google OAuth, and public `/services/:serviceId` route.
- Risks:
  - Phase 1 published rows can become public through existing RLS once real Supabase data/env are configured, but the frontend deliberately does not expose a fake public copy link until the route exists;
  - service idempotency depends on existing `profile_cabinet_services` rows having stable `composition_id` values.

## 2026-06-05 — PR #272 workshop tabs rebased onto current Power Place controls

- Branch: `fix/profile-lite-mandala-cards-services-tab`, rebased onto `origin/main` at `29253fe`.
- Scope: `/profile/mandalas` Profile Lite React/CSS/client contract tests/docs only; Supabase schema, auth redirects, Vercel rewrites, public homepage, `/masters`, `/profile/admin`, and mandala save/update payloads were not changed.
- Preserved from current main:
  - Power Place constructor scale logic for `sourceSlotScale`, `fieldScale`, `centerFrameScale`, and `centerImageScale`;
  - CSS variables `--power-source-slot-scale`, `--power-place-chess-slot-scale`, `--power-field-scale`, `--power-center-image-scale`, and `--power-center-frame-scale`;
  - four constructor sliders: `Размер окон`, `Размер поля`, `Размер центра`, `Размер фоток`;
  - saved-count limit behavior through `saveNewDisabled`, `saveNewTitle`, `saveNewAriaLabel`, and the disabled `powerPlaceSaveButton`.
- Kept from PR #272:
  - visible Profile Lite top nav labels `mandalas` as `Мастерская`;
  - `Настройки` and `Диагностика` remain hidden from visible top nav while internal route helpers still resolve them;
  - internal workshop tabs are `Место силы`, `Мои мандалы`, and `Услуги`;
  - saved mandalas render as horizontal preview cards with add/linked service state;
  - internal `Услуги` lists only services linked by `service.composition_id`;
  - add-to-services creates a draft service using the existing `profile_cabinet_services.composition_id` path;
  - compact `Центр` / `Фон` layout icons stay on one row.
- Verification:
  - `npm install`, `npm run test:profile-lite`, `npm run test:power-place`, `npm run test:profile-services`, `npm run build`, `npm run check`, and `git diff --check` exited `0`;
  - `npm run check` retained existing `RY-L04-S04` / `RY-L04-S05` video placeholder warnings and the existing Vite large-chunk warning.
- Local browser QA:
  - dev server: `http://127.0.0.1:4337/profile/mandalas`;
  - mock Supabase server: `http://127.0.0.1:4339`;
  - fake public Supabase env/session and mocked Auth/REST/Storage responses only;
  - desktop 1200px-wide browser: top text showed `Мастерская` and no visible top `Настройки`; internal tabs were `Место силы`, `Мои мандалы`, `Услуги`; saved mandala rendered as a horizontal card with preview; add-to-services created a draft linked service and switched to internal `Услуги`; constructor controls rendered `Размер окон`, `Размер поля`, `Размер центра`, `Размер фоток`; `Размер окон` changed slot/chess scale variables, `Размер центра` changed center-frame scale, and `Размер фоток` changed center-image scale; horizontal overflow was `0`; compact `Центр` / `Фон` icons stayed on one row.
- Not verified:
  - real authenticated Supabase service creation against production data;
  - true mobile browser viewport QA, because the available MCP browser tool did not expose viewport resizing in this session;
  - Vercel preview, merge/deploy, production/legacy live rendering, and Google OAuth.

## 2026-06-05 — Power Place window-size slider restore

- Branch: `fix/power-place-window-size-slider`, based on fresh `origin/main` at `8062178`.
- Scope: Profile Lite Power Place React/CSS/client contracts only; public home page, route rewrites, Supabase env values, OAuth redirect logic, and print/PDF behavior were not changed.
- Root cause:
  - `slot_scale`, `object_refs.__slot_scale`, `sourceSlotScale`, and the CSS variables for mini-source slots already existed, but the visible constructor controls on `main` only rendered three sliders.
  - Saved rows that returned only `object_refs.__slot_scale` could be masked by the empty draft default `slot_scale: 1` during load/refresh.
- Changed:
  - restored the fourth constructor slider as `Размер окон` in the order `Размер окон` / `Размер поля` / `Размер центра` / `Размер фоток`;
  - bound `Размер окон` to `slot_scale` with range `0.7` to `1.18` and step `0.01`;
  - kept slot scale flowing through `object_refs.__slot_scale` and made saved-composition load/refresh restore the value when the top-level field is absent;
  - added the fourth slider to the shared desktop/mobile grid contract.
- Verification:
  - `node test/profileLiteCabinetContract.test.mjs` failed first on missing `Размер окон`, then failed on missing saved `slot_scale` restoration, then passed after the fixes;
  - `npm install` was attempted but failed with `ENOSPC`; removed only the generated partial worktree `node_modules` and symlinked to the existing canonical repo dependency install;
  - `npm run test:profile-lite`, `npm run test:power-place`, `npm run test:profile-media`, `npm run test:profile-loading-recovery`, `npm run build`, `npm run check`, and `git diff --check` exited `0`;
  - `npm run check` retained existing `RY-L04-S04` / `RY-L04-S05` video placeholder warnings and the existing Vite large-chunk warning.
- Local browser QA:
  - dev server: `http://localhost:4338/profile/mandalas`;
  - mock Supabase server: `http://127.0.0.1:5443`;
  - fake public Supabase env/session and mocked Auth/REST responses only;
  - desktop 1280x920: four sliders visible in order; `Размер окон` changed source slot size and `--power-source-slot-scale` / `--power-place-chess-slot-scale` without changing center frame, center image, or field variables; all seven constructors rendered scaled slots without horizontal overflow;
  - mobile 390x900: four sliders visible with grid `120px / 24px / 138px / 24px`, horizontal overflow `0`, and console errors `0`;
  - mocked save/reopen preserved `Размер окон` through the saved dropdown.
- Not verified:
  - real authenticated Supabase save/update/reload against production data;
  - Vercel preview, merge/deploy, production/legacy live rendering, and Google OAuth.

## 2026-06-05 — Profile Lite Power Place desktop drag-and-drop

- Branch: `feature/profile-lite-power-place-drag-drop`, based on fresh `origin/main` at `25bed1b`.
- Scope: Profile Lite Power Place source cards, slot assignment handlers, drag-over styling, and focused contract coverage only; public home page, routes, Supabase env names/values, Vercel rewrites, and schema were not changed.
- Changed:
  - saved source cards now expose desktop `draggable` only when a durable/source ref exists;
  - drag payloads use `application/x-reiki-power-place-source` with compact fields: `id`, `title`, `name`, display `src`, durable `object_ref`, item `type`, and safe `photoId`;
  - center, regular layout slots, Zodiac/Star/DAO/chess/altar/business slots, and the active inner/outer cover preview accept drops;
  - dropped items reuse the same assignment helper used by picker/dropdown selection and continue writing `object_refs` / `object_ref_urls`;
  - added scoped `.power-place-slot--drag-over` styling.
- Verification:
  - `node test/profileLiteCabinetContract.test.mjs` failed first on the missing DnD contract, then passed after the fix;
  - `npm install`, `npm run test:profile-lite`, `npm run test:power-place`, `npm run test:profile-media`, `npm run test:profile-bootstrap`, `npm run build`, and `npm run check` exited `0`;
  - retained existing warnings: `RY-L04-S04` / `RY-L04-S05` video placeholders and Vite large-chunk warning.
- Local browser QA:
  - Browser plugin rendered the mocked `/profile/mandalas` page with no console warnings/errors, but its evaluation sandbox could not synthesize DnD events, so Playwright MCP was used for the interaction proof;
  - mocked dev server: `http://localhost:4338/profile/mandalas`;
  - mocked Supabase endpoint: `http://127.0.0.1:4339`;
  - desktop 1280x920: left source list showed one saved mandala and two saved photos, drop to center set the center background, drop to a Zodiac slot set only that slot and updated the fallback object select value;
  - mobile 390x900: constructor, left source list, saved mandala select, cover controls, and fallback object controls remained visible;
  - local route smoke passed for `/`, `/profile`, `/masters`, and `/profile/admin` with no console warnings/errors.
- Not verified:
  - real authenticated production Supabase save/reload hydration;
  - production/legacy live rendering, Vercel preview/deploy, and Google OAuth.

## 2026-06-05 — Power Place mobile save clickability

- Branch: `fix/power-place-save-button-clickability`, based on fresh `origin/main` at `5379004` after PR #264.
- Scope: Profile Lite Power Place action panel React/CSS/contracts only; Supabase schema/env, route config, public home page, print/PDF logic, and mandala geometry were not changed.
- Root cause:
  - Save was only disabled by the saved-count limit for unsaved drafts, but the disabled state had no scoped visual styling.
  - The saved-count hint rendered as a raw inline `span` inside the same flex row as the action buttons, so on mobile it could wrap/overflow in the clickable action area and visually interfere with Save.
  - Save delegated directly to `onSaveNew`, so there was no local guarded click path or immediate visible “save started” status.
- Changed:
  - added an explicit guarded Save click handler that calls `onSaveNew` only when Save is enabled;
  - added immediate `Сохраняем место силы...` status before the create request starts and routes missing-profile preflight into the visible composition notice;
  - moved the saved-count hint to `.powerPlaceActionsMeta` below the button row;
  - added scoped disabled styling, explicit action-card ordering, and pointer/layout rules so the hint cannot cover or intercept action buttons.
- Verification:
  - `node test/profileLiteCabinetContract.test.mjs` failed first on the missing explicit click wrapper, then passed after the fix;
  - `npm run build`, `npm run check`, `npm run test:profile-lite`, `npm run test:power-place`, and `git diff --check` exited `0`;
  - retained existing warnings: `RY-L04-S04` / `RY-L04-S05` video placeholders and Vite large-chunk warning.
- Not verified:
  - real mobile tap QA against authenticated production Supabase data;
  - Vercel preview rendering, production/legacy live rendering, and Google OAuth.

## 2026-06-05 — Power Place save flow and action order

- Branch: `fix/power-place-save-flow-and-action-order`, based on fresh `origin/main` at `c328798` after PR #262.
- Scope: Profile Lite Power Place save flow, mobile/source action-order contract, and focused tests/docs only; Supabase schema, env values, Vercel rewrites, PDF/print logic, outer arrows, central photo proportions, and public home page were not changed.
- Changed:
  - split create-time failure messages for the pre-insert saved-count check and the Supabase POST stage;
  - kept the optimistic saved composition visible if the post-create list refresh fails, with a visible RU status telling the user the list did not refresh;
  - preserved the server-returned-id guard before showing success;
  - added a DOM/CSS contract that keeps `Название мандалы` before the action buttons and prevents CSS reordering of the button group above the title.
- Verification:
  - `node test/profileLiteCabinetContract.test.mjs` failed first on the missing count-stage error, then passed after the fix;
  - `npm run test:power-place`, `npm run test:profile-lite`, `npm run test:profile-services`, `npm run build`, `npm run check`, and `git diff --check` exited `0`;
  - `npm run check` retained existing `RY-L04-S04` / `RY-L04-S05` video placeholder warnings and the existing Vite large-chunk warning.
- Not verified:
  - real authenticated Supabase save/update/reload in production data;
  - browser visual QA, because the Playwright MCP transport closed and Chrome DevTools MCP could not attach to its locked browser profile in this session;
  - Vercel preview, merge/deploy, production/legacy live rendering, and Google OAuth.

## 2026-06-04 — Profile Lite Power Place graphic layout final

- Branch: `codex/profile-lite-graphic-layout-final`, based on fresh `origin/main` merge commit `216dac3`.
- Scope: `/profile/mandalas` source-owned React/CSS/client/test/docs only; public home page, route inventory, Supabase env values, Vercel rewrites, public runtime patch files, and MutationObserver usage were not changed.
- Changed:
  - moved compact `Центр` / `Фон` layout controls above `Фон Места Силы`;
  - kept `Центр` and `Фон` as equal-height side-by-side cells and removed visible `Макет` wording from the Power Place UI source;
  - moved `Отчёт` below `Фон Места Силы`;
  - changed new empty report drafts to default to `Без отчёта` / `without_report` while preserving explicit or body-filled saved reports as `with_report`;
  - kept report body fields/actions hidden while `Без отчёта` is selected;
  - aligned `Размер фото`, `Размер поля`, and `Размер центра` with the shared `[label] [-] [range] [+]` grid on desktop and mobile;
  - moved the save/action card into the center column directly under the mandala print area.
- Verification:
  - `npm install` was attempted but failed with `ENOSPC` because the disk had about 124 MiB free;
  - removed only the generated partial worktree `node_modules` and symlinked to the existing canonical repo dependency install;
  - `npm run test:profile-lite`, `npm run test:power-place`, `npm run test:profile-media`, `npm run test:profile-loading-recovery`, `npm run build`, `npm run check`, and `git diff --check` exited `0`;
  - `npm run check` retained existing `RY-L04-S04` / `RY-L04-S05` video placeholder warnings and the existing Vite large-chunk warning.
- Local browser QA:
  - dev server: `http://localhost:4330/profile/mandalas`;
  - mock Supabase server: `http://127.0.0.1:4329`;
  - fake public Supabase env/session and mocked Auth/REST/Storage responses only;
  - desktop 1280x920: compact layout rendered above `Фон Места Силы`, `Фон Места Силы` rendered above `Отчёт`, `Центр` / `Фон` cells were equal-height, `Без отчёта` was active, report body fields were hidden, save/actions followed the mandala, slider grids matched 220px / 28px / 288px / 28px, duplicate slider counts were `1`, visible `Макет` count was `0`, horizontal overflow was `0`, and console errors were `0`;
  - mobile 390x900: compact layout visually rendered above `Фон Места Силы`, `Отчёт` rendered below it, `Центр` / `Фон` cells were equal-height, save/actions followed the mandala, slider grids matched 120px / 24px / 138px / 24px, horizontal overflow was `0`, and console errors were `0`.
- Not verified:
  - real authenticated Supabase save/update/reload, Vercel preview, merge/deploy, production/legacy live rendering, and Google OAuth.
- Risks:
  - Profile Lite still has layered static CSS, existing public CSS hotfixes, and injected scoped CSS; this pass aligned/overrode the affected source rules, but CSS ordering remains sensitive.

## 2026-06-04 — Profile Lite Power Place controls/save-update/mobile report

- Branch: `codex/profile-lite-power-place-controls-save-update`, based on fresh `origin/main` merge commit `19410c1`.
- Scope: `/profile/mandalas` React/CSS/client/test/docs only; public home page, route inventory, Supabase env values, Vercel rewrites, public runtime patch files, and MutationObserver usage were not changed.
- Changed:
  - constructor sliders are ordered `Размер фото` / `Размер поля` / `Размер центра`;
  - `Размер поля` persists through `field_scale` / `__inner_field_scale`;
  - center image scale persists through `__center_image_scale` and uses `--power-center-image-scale` across Мандала, Зодиак, Звезда, Алтарь, Бизнес, ДАО, and Шахматы;
  - save/update UX split into `Сохранить` and `Обновить`;
  - `Сохранить` always creates a new composition copy without id and uses `копия`, `копия 2`, etc. for duplicate titles;
  - `Обновить` PATCHes an opened saved composition and keeps the edited title;
  - saved mandala select is at the top of the `Магическая мандала` block with placeholder `Сохранённые мандалы`;
  - `Центр` and `Фон` layout cells are compact and side-by-side;
  - `Без отчёта` hides the report body/actions, leaving only the top report mode panel;
  - mobile CSS order keeps constructor, background, actions, report, then sources.
- Verification:
  - `npm install`, `npm run test:profile-lite`, `npm run test:power-place`, `npm run test:profile-media`, `npm run test:profile-loading-recovery`, `npm run build`, `npm run check`, and `git diff --check` exited `0`;
  - `npm run check` retained existing `RY-L04-S04` / `RY-L04-S05` video placeholder warnings and the existing Vite large-chunk warning.
- Local browser QA:
  - dev server: `http://127.0.0.1:4327/profile/mandalas`;
  - mocked public Supabase env/session and mocked Auth/REST/Storage responses only;
  - mobile 390x900 and desktop 1280x920: horizontal overflow `0`, control order passed, saved select visible, `Сохранить` / `Обновить` visible, `Без отчёта` hid report body, `Центр` and `Фон` stayed side-by-side, and console errors were `[]`;
  - constructors checked locally: Зодиак, Звезда, Шахматы, Мандала, Алтарь, Бизнес, ДАО;
  - center-scale variable propagated after control click to all checked constructors;
  - mocked save/update probe confirmed POST title `Тест копия` without id and PATCH to `composition-1` with edited title `Тест обновлён`.
- Not verified:
  - real authenticated Supabase save/update/reload against production data;
  - Vercel preview, merge, deploy, production/legacy live rendering, and Google OAuth.

## 2026-06-04 — Remaining Profile Lite Power Place polish after PR #233

- Branch: `codex/profile-lite-remaining-polish-after-233`, based on `origin/main` at PR #233 merge commit `35c17686c5f0631941c92b2346e9d7e3c4e1d576`.
- Scope: `/profile/mandalas` Profile Lite React/CSS/test/docs only; public runtime patch files, public home page, routes, Supabase env names, Vercel rewrites, and desktop three-column structure were not changed.
- PRs audited:
  - PR #227 cover picker/iPhone ratio/Zodiac 8+/upload UI notes;
  - PR #228-#231 custom cover and mobile patch follow-ups;
  - PR #232 rollback;
  - PR #233 safe React/CSS rebuild.
- Already present from PR #233:
  - mobile/source rail polish;
  - saved cover shortcut rendering;
  - custom inner/outer cover refs through `cover_ref.inner` / `cover_ref.outer`;
  - scoped custom cover rendering without public JS/CSS bridge files.
- Implemented remaining safe pieces:
  - saved cover shortcuts now show 6 saved images and include a local `×` hide badge that does not delete the underlying photo;
  - removed the redundant direct `Своё изображение` upload label from the cover module, leaving React image picker/upload flow;
  - empty cover preview opens the React image picker;
  - Zodiac `8+` now renders only 8 round zodiac mini-mandalas and no extra square plus slots;
  - image picker material uploads now use the existing `profile_cabinet_publications` save flow with Storage refs;
  - mobile Power Place action buttons no longer stretch to the status-text line height.
- Intentionally skipped:
  - iPhone-like `9 / 19.5` ratio change, because previous PR #231 confirmed it collapsed inner constructor surfaces and this pass did not find a safe source-owned need to reapply it;
  - `Макет` center-shape/background-control reorder, because those center-shape controls are currently introduced by the existing rollback-baseline public layout script rather than the allowed React source files; expanding that public patch was out of scope.
- Verification:
  - `npm install`, `npm run test:profile-lite`, `npm run test:power-place`, `npm run test:profile-media`, `npm run test:profile-loading-recovery`, `npm run build`, `npm run check`, and `git diff --check` exited `0`;
  - `npm run check` retained existing `RY-L04-S04` / `RY-L04-S05` video placeholder warnings and the existing Vite large-chunk warning.
- Local browser QA:
  - dev server: `http://127.0.0.1:4319/profile/mandalas`;
  - viewport: 390x900;
  - mocked public Supabase env/session and mocked Auth/REST/Storage responses only;
  - horizontal overflow stayed `0`;
  - Zodiac, Mandala, Chess, Star, Altar, Business, and DAO rendered without horizontal overflow;
  - Zodiac `8+` measured 8 zodiac slots and 0 plus slots;
  - saved photo selection worked for center photo, `Фон внутри`, and `Фон снаружи` in mocked state;
  - image picker upload UI showed material group/type/step/subcategory dropdowns and no title/notes prompt;
  - action buttons measured 34-42px high on mobile.
- Live URL availability:
  - `https://mentalica.vercel.app/profile/mandalas` returned HTTP `200`;
  - `https://reiki-yggdrasil.vercel.app/profile/mandalas` returned HTTP `200`.
- Not verified:
  - real authenticated Supabase upload/save/reload against production data;
  - commit-level live version proof, because this project still has no status/build-info endpoint;
  - production rendering of this branch, because it is not merged/deployed yet.

## 2026-06-04 — Safe rebuild of Profile Lite Power Place polish

- Branch: `codex/rebuild-profile-lite-power-place-polish`, based on rollback baseline `ed9b166` (`Merge PR #232: Rollback Profile Lite cover polish regressions`).
- Scope: `/profile/mandalas` Profile Lite Power Place React/CSS only; public home page, Supabase env names, Vercel rewrites, route map, and public runtime patch hooks were not changed.
- Rebuilt:
  - scoped mobile button polish for Profile Lite tabs/actions/report/media/cover-picker controls;
  - slot-level mini-photo sizing for chess/source slots without changing mandala panel or inner sheet aspect ratios;
  - source rail/card readability on mobile;
  - React-owned cover picker shortcuts for saved images;
  - custom inner and outer photo cover selection through `cover_ref.inner` / `cover_ref.outer`, durable storage refs, and hydrated signed display URLs.
- Not restored:
  - reverted public runtime cover patch files;
  - new `MutationObserver` logic;
  - new global injected CSS or public JS bridges.
- Verification:
  - `npm install`, `npm run test:profile-lite`, `npm run test:power-place`, `npm run test:profile-media`, `npm run test:profile-loading-recovery`, `npm run build`, `npm run check`, and `git diff --check` exited `0`;
  - `npm run check` retained the existing `RY-L04-S04` / `RY-L04-S05` video placeholder warnings and existing Vite large-chunk warning;
  - local mocked browser QA at 390x900 on `http://127.0.0.1:4317/profile/mandalas` confirmed horizontal overflow `0`, non-collapsed Zodiac/Mandala/Star/Altar/Business/DAO, usable Chess, full-width source rail, visible saved cover shortcuts, custom inner and outer signed backgrounds, and save/reopen rendering through hydrated covers.
- Not verified:
  - real authenticated Supabase upload/save/reload in production data;
  - Vercel preview, merge, production deployment, and live target/legacy URL QA.

## 2026-06-03 — Emergency rollback for Profile Lite loading regression

- Branch: `codex/revert-issue213-loading-regression`, based on fresh `origin/main`.
- Reason: production loading regression reported after issue #213 rebase on Profile Lite / Power Place.
- Reverted commit: `21207d3b6707b044e9c7391e50bd981e5aceb78c` (`Rebase issue 213 power place UI`).
- Affected routes: `/profile`, `/profile/mandalas`.
- Restored:
  - pre-issue #213 Profile Lite Power Place tab/default-route behavior;
  - previous Power Place client normalization and profile route tests;
  - previous Profile Lite UI/CSS contract before the issue #213 rebase changes.
- Preserved:
  - later unrelated commits that remain on `origin/main` outside the Git-generated revert;
  - Supabase env names/values, auth redirects, Vercel rewrites, public home page, RU-default interface, and existing routes.
- To re-implement later:
  - split issue #213 Power Place UI work into smaller PRs with one behavior change per PR;
  - add route-level loading recovery coverage before changing `/profile` or `/profile/mandalas` bootstrap/default-tab logic;
  - perform authenticated local/preview QA before production merge.

## 2026-06-02 — Profile Lite chess center and cover hydration fix

- Branch: `codex/fix-profile-lite-chess-center-cover-hydration`, based on `origin/main`.
- Scope: Profile Lite `/profile/mandalas` Power Place chess layout and saved private-image hydration only; `/`, `/profile`, `/masters`, `/profile/admin`, auth/session flow, env values, migrations, and Vercel rewrites were not changed.
- Root causes:
  - absolute chess variants `plus-8` and `compact-5` inherited `.power-place-chess__center { height: 100%; }`, stretching the central image into a vertical strip;
  - composition hydration returned `object_ref_urls` keyed by slot id instead of durable storage ref, so saved private Storage images could not be resolved after reload;
  - hydration only signed legacy `cover_ref.src` and did not hydrate nested `cover_ref.inner.src` / `cover_ref.outer.src`.
- Changed:
  - added a scoped CSS override so `plus-8` and `compact-5` center photos remain square with `background-size: cover`;
  - changed composition hydration to collect only string Storage refs from `object_refs`, ignore non-string service objects, and return `object_ref_urls` as `storageRef -> signedUrl`;
  - hydrated legacy, inner, and outer cover layers with `display_src` without persisting signed URLs;
  - kept backward-compatible Profile Lite rendering fallbacks for older slot-id and `__center_image` URL maps;
  - added focused contract coverage for the hydration shape, nested covers, center square override, and fallback reads.
- Verification:
  - `npm install` completed with no vulnerabilities;
  - `npm run test:power-place`, `npm run test:profile-lite`, `npm run test:profile-bootstrap`, `npm run test:profile-media`, `npm run test:profile-materials`, `npm run test:profile-loading-recovery`, and `npm run test:profile-services` passed;
  - `npm run build` passed with the existing Vite large-chunk warning;
  - `npm run check` passed with existing `RY-L04-S04` / `RY-L04-S05` video placeholder warnings and the existing Vite large-chunk warning;
  - local mobile QA on `http://127.0.0.1:4174/profile/mandalas` at 390x900 with fake public Supabase env/session confirmed `15 фоток`, `9 фоток`, `9 фото+`, and `6 фоток` render without horizontal overflow; `9 фото+` and `6 фоток` centers measured 63px by 63px;
  - local cover UI QA confirmed `Фон внутри` applies `cover-mentalica` and `Фон снаружи` applies `outer-cover-forest`.
- Not verified:
  - real authenticated Supabase upload/save/reload and opening a saved production composition;
  - production/legacy live QA after merge/deploy.

## 2026-06-02 — Profile Lite Power Place print/PDF/save fix

- Branch: `codex/fix-profile-lite-print-pdf-save-power-place`, created from clean `codex/fix-power-place-mobile-layout-covers-scale`.
- Scope: `/profile/mandalas` Profile Lite Power Place actions only; public home page, `/profile-old`, `/profile`, `/masters`, `/profile/admin`, Vercel rewrites, auth redirects, and secrets were not changed.
- Root causes:
  - `handleDownloadComposition` exported a generated HTML document and downloaded `<title>.html`, so the action was not a PDF workflow and included site/export metadata instead of only the rendered mandala layout.
  - print CSS had global `print-color-adjust`, but several rendered mandala/background/image classes were not explicitly covered, leaving browser print preview more likely to omit colors/backgrounds unless background graphics were enabled.
  - Profile Lite allowed `compact-5` chess compositions in client normalization/UI while the Supabase `chess_variant` check allowed only `classic-14`, `classic-8`, and `plus-8`; this can reject live saves for the 6-photo chess format.
  - after save, Profile Lite updated local state from the mutation response only; it did not re-list compositions from Supabase, so the select/list could drift from the persisted table.
- Changed:
  - replaced the `.html` download path with an isolated `Скачать PDF / Печать в PDF` window that clones only `.powerPlacePrintArea`, sets a `<safe-title>.pdf` document title, loads current styles, and opens browser print/save-as-PDF;
  - renamed the action button to `Скачать PDF`;
  - added the RU hint: `Для цветной печати включите в окне печати: Background graphics / Фоновая графика.`;
  - expanded print color preservation for mandala panels, sheets, chess, source slots, center photo, covers, and background-image elements;
  - after successful create/update, reloads `listPowerPlaceCompositions(profile.id, session)` and uses that fresh list for the saved select/list;
  - added `supabase/migrations/20260602120000_power_place_chess_compact_variant.sql` to allow `compact-5`, plus README and migration-runner allowlist entries;
  - added contract coverage for no `.html` export, PDF/print view, print color classes, fresh post-save list reload, and compact chess migration.
- Verification:
  - `npm run test:profile-lite` failed first on the missing compact chess migration, then passed after the fix;
  - `npm run test:power-place` passed;
  - `npm run test:profile-media` passed;
  - `npm run test:profile-loading-recovery` passed;
  - `npm run check` passed with existing `RY-L04-S04` / `RY-L04-S05` video placeholder warnings and existing Vite large-chunk warning;
  - standalone `npm run build` passed with the existing Vite large-chunk warning;
  - `git diff --check` passed;
  - local Playwright QA passed on `http://127.0.0.1:4217/profile/mandalas` with fake public Supabase env, fake session, and mocked Auth/REST responses:
    - desktop 1280x920: required buttons were visible, mock compact save/list/load worked, PDF popup contained `.powerPlacePrintArea` only, and no app console errors were captured;
    - mobile 390x900: required buttons and Save as PDF / Background graphics hint were visible, horizontal overflow stayed `0`, and the saved list/empty-state path rendered.
- Not verified:
  - real authenticated Supabase save/reload on live;
  - applying the new Supabase migration to production;
  - production/legacy live QA after merge/deploy.
- Risk:
  - browser save-as-PDF still depends on the user's print dialog and browser support for background graphics; the UI now states the required Background graphics setting.
## 2026-06-02 — Profile Lite report module reapplied on current main

- Branch: `codex/reapply-profile-lite-report-module-current-main`, based on fresh `origin/main` merge commit `22e4808`.
- Scope: manual reapply of the useful PR #207 report-module idea only; no direct PR #207 merge.
- Preserved baseline:
  - PR #206 signed URL / Storage photo path;
  - PR #208 chess 15/9/9+/6, slot scale, cover inner/outer, mobile order;
  - PR #209 compact left photo filter and delete cross behavior;
  - `/profile-old`, `/profile`, `/masters`, `/profile/admin`, auth/data flows, and Vercel rewrites.
- Current implementation:
  - right rail now has a standalone `Отчёт` card directly after `Макет`;
  - report fields are `Анализ ситуации`, `Что даёт мандала`, `Что ещё поможет`, plus disabled Pro placeholder `О Мастере`;
  - report mode supports `С отчётом` / `Без отчёта`;
  - report actions are `Добавить отчёт` / `Обновить` and `Удалить отчёт`;
  - central report output appears under the mandala only after the report is added;
  - report payload persists through `object_refs.__profile_lite_report`, so no Supabase migration was added.
  - legacy public background enhancer scripts skip Profile Lite so `Макет`, report, and background stay as separate right-rail cards.
- Initial checks:
  - `npm run test:profile-lite` passed;
  - `npm run test:profile-media` passed;
  - `npm run test:power-place` passed;
  - `npm run test:profile-loading-recovery` passed;
  - `npm run check` passed with existing video placeholder and Vite large-chunk warnings;
  - standalone `npm run build` passed with existing Vite large-chunk warning;
  - `git diff --check` passed.
- Rendered local QA:
  - `/profile/mandalas` verified with fake public Supabase env and mocked REST/Storage responses;
  - report output appears only after `Добавить отчёт` and disappears after `Удалить отчёт`;
  - Storage signed-photo path, compact left list, chess `9 фото+`, cover inner/outer controls, and mobile order were checked locally.
- Still to verify after merge/deploy:
  - real authenticated Supabase save/load with production data;
  - production/legacy live QA.
## 2026-06-02 — Profile Lite Power Place mobile layouts, covers, and global slot scale

- Branch: `codex/fix-power-place-mobile-layout-covers-scale`, based on PR #205 merge commit `a12240fd9a516c0eeb0d45783ba9c517c1253e30`.
- Scope: follow-up fix for `/profile/mandalas` only; no Supabase migrations, env values, auth/session bootstrap, `/profile-old`, `/`, `/masters`, `/profile/admin`, or Vercel rewrites were changed.
- Changed files:
  - `src/pages/ProfileLitePage.jsx`
  - `src/pages/profile-lite/ProfileLitePowerPlaceModule.jsx`
  - `src/lib/powerPlaceClient.js`
  - `src/profileMandalaWorkspace.css`
  - `test/profileLiteCabinetContract.test.mjs`
  - `test/powerPlaceClient.test.mjs`
  - `STATE.md`
  - `LOG.md`
- Root cause:
  - chess labels still counted only source slots, not the central client/goal photo;
  - `plus-8` slot class rendering prefixed only the first compound class, so coordinate classes like `outer-top-left` did not receive the CSS selector prefix;
  - compact chess placement was not a stable ring/pentagon and could visually collide;
  - `Размер фото` was gated to chess and persisted only as `chess_slot_scale`;
  - legacy single `cover_ref` was also used as an outer-cover fallback, so inner and outer layers were not cleanly separated in the preview path;
  - mobile source order kept actions/advanced before the settings rail because they lived inside the center column;
  - field layout classes existed but Profile Lite CSS forced much of the panel back toward square sizing.
- Fixed live screenshot issues:
  - chess UI labels now show `15 фоток`, `9 фоток`, `9 фото+`, `6 фоток`; technical values remain `classic-14`, `classic-8`, `plus-8`, `compact-5`;
  - `9 фото+` renders 8 source slots plus center, with 4 outer-square and 4 inner-square slots, prefixed coordinate classes, no clipping, and no overlap at desktop 1280 or mobile 390 after the size button check;
  - `6 фоток` renders 5 source slots plus center as a compact pentagon/ring with no clipping or overlap at desktop 1280 or mobile 390;
  - `Фон внутри` and `Фон снаружи` now read layer-specific active/preview state; old single cover refs remain an inner fallback while outer defaults to `no-cover`;
  - `Размер фото` is a shared `slot_scale` control for all constructor formats and still falls back to old `chess_slot_scale`;
  - shared scale is persisted backward-compatibly in `object_refs.__slot_scale`, avoiding a schema migration;
  - `Макет` now exposes field aspect/card hooks for square, vertical, horizontal, and rectangle layouts;
  - mobile order now places the settings rail immediately after the visual constructor, with actions, advanced JSON, and source rail below it.
- Verification:
  - `npm run test:profile-lite` passed;
  - `npm run test:power-place` passed;
  - `npm run test:profile-media` passed;
  - `npm run test:profile-loading-recovery` passed;
  - `npm run check` passed with existing `RY-L04-S04` / `RY-L04-S05` video placeholder warnings and the existing Vite large-chunk warning;
  - standalone `npm run build` passed with the existing Vite large-chunk warning;
  - `git diff --check` passed.
- Rendered QA with fake public Supabase env and fake JWT only:
  - desktop 1280: Profile Lite columns stayed `260px 620px 340px`; all constructor types clicked (`Зодиак`, `Звезда`, `Шахматы`, `Мандала`, `Алтарь`, `Бизнес`, `ДАО`); overflowX `0`; no console warnings/errors;
  - desktop chess: `15` had 14 source slots + center; `9` had 8 + center; `9+` had 8 + center, 4 outer and 4 inner; `6` had 5 pentagon slots + center;
  - desktop targeted recheck after `Размер фото` plus button: `9+` had overflowX `0`, clipped `0`, overlaps `0`, scale var `1.08`;
  - mobile 390: one `358px` column; `9+` had 8 + center, 4 outer and 4 inner, clipped `0`, overlaps `0`; `6` had 5 pentagon slots + center, clipped `0`, overlaps `0`; overflowX `0`; no console warnings/errors;
  - mobile order: visual print area ended before the settings rail; actions, advanced JSON, and source rail followed below;
  - cover check: inner class became `cover-mentalica`; outer panel class became `outer-cover-forest`.
- Not verified:
  - real Supabase session;
  - real saved composition reload from production data;
  - real upload/private signed URL flow;
  - production/legacy live QA after merge/deploy.

## 2026-06-02 — Profile Lite compact left photo filter

- Branch: `codex/refine-profile-lite-left-photo-filter`, based on fresh `origin/main` merge commit `169c854` after PR #206.
- Scope: compact the `/profile/mandalas` left rail without changing `/profile-old`, public routes, auth/bootstrap, Vercel rewrites, or Supabase signed Storage helpers.
- Changed:
  - removed the left-rail `Выбрать из базы` action;
  - kept `Добавить мандалу` as the single primary left action;
  - changed the left rail to compact filters for group/category/subcategory-step, including `Избранные`;
  - defaulted the left photo list to latest photos when no filter is selected;
  - changed the left photo list to compact 56px previews with title, meta label, and hover/focus delete control for client photos;
  - preserved `ProfileLiteImagePicker` for modal image picking and upload;
  - extended Lite delete cleanup so deleted client photos are removed from object refs as well as the center ref.
- Verification:
  - `npm run test:profile-lite` passed;
  - `npm run test:profile-media` passed;
  - `npm run test:power-place` passed;
  - `npm run test:profile-loading-recovery` passed;
  - `npm run check` passed with existing `RY-L04-S04` / `RY-L04-S05` video placeholder warnings and the existing Vite large-chunk warning;
  - standalone `npm run build` passed with the existing Vite large-chunk warning;
  - `git diff --check` passed.
- Not verified yet:
  - real authenticated Supabase Storage photos on live data;
  - real hover/delete flow against production RLS;
  - production/legacy live QA after merge/deploy.

## 2026-06-02 — Profile Lite chess layout variants and sizing fix

- Branch: `codex/fix-chess-layout-variants-size-mentalica`.
- Scope: finalize the Profile Lite `/profile/mandalas` `Шахматы` constructor sizing/variant fix without changing auth, Supabase envs, saved object refs, `/profile-old`, `/`, `/masters`, `/profile/admin`, or Vercel rewrites.
- Changed files:
  - `src/pages/ProfileLitePage.jsx`
  - `src/pages/profile-lite/ProfileLitePowerPlaceModule.jsx`
  - `src/profileMandalaWorkspace.css`
  - `test/profileLiteCabinetContract.test.mjs`
  - `STATE.md`
  - `LOG.md`
- Root cause:
  - the Lite chess slot source list always prepended `CHESS_TOP_SLOTS`, so 8-photo and compact layouts inherited extra top-row source slots;
  - chess card sizing was fixed in CSS and did not expose a persisted per-composition size control;
  - the Mentalica cover option was missing from the CSS-only fallback cover set;
  - square/rectangle field layout choices did not consistently adjust chess board/card proportions.
- Fixed behavior:
  - `classic-14` uses 14 source slots plus center;
  - `classic-8` uses 8 source slots plus center;
  - `plus-8` uses 8 source slots plus center, with 4 outer-square and 4 inner-square placements;
  - `compact-5` uses 5 source slots around center;
  - `CHESS_TOP_SLOTS` is preserved as a legacy definition but is not automatically added to 8 / 8+ / 5 source lists;
  - `chess_slot_scale` is stored on the composition draft and applied through `--power-place-chess-slot-scale`;
  - `cover-mentalica` works as a CSS-only fallback cover;
  - square, rectangle/vertical, and horizontal layouts adjust chess aspect/board sizing.
- Verification:
  - `npm run test:profile-lite` passed;
  - `npm run test:power-place` passed;
  - `npm run test:profile-media` passed;
  - `npm run test:profile-loading-recovery` passed;
  - `npm run check` passed with existing `RY-L04-S04` / `RY-L04-S05` video placeholder warnings and the existing Vite large-chunk warning;
  - standalone `npm run build` passed with the existing Vite large-chunk warning;
  - `git diff --check` passed.
- Local rendered QA:
  - dev server ran at `http://127.0.0.1:4217/profile/mandalas` with fake public Supabase env, a local fake JSON backend, and a fake JWT session; no real credentials were used;
  - desktop 1280: `plus-8` rendered 8 slots with 4 `outer-square` and 4 `inner-square`, `compact-5` rendered 5 compact slots, columns measured `260px 620px 340px`, horizontal overflow `0`, no Vite overlay;
  - mobile 390: columns collapsed to one `358px` track, `plus-8` rendered 8 slots with 4 outer/4 inner, `compact-5` rendered 5 compact slots, horizontal overflow `0`, no Vite overlay;
  - browser console showed only Vite/React dev informational messages, no captured app errors/warnings.
- Not verified until a real authenticated/live pass:
  - real Supabase session;
  - real saved composition reload;
  - real upload/private signed URLs;
  - production/live QA before deploy.

## 2026-06-02 — Profile Lite canonical shell tabs and outer cover fix

- Branch: `codex/profile-lite-cover-tabs-canonical-shell`, based on fresh `origin/main` commit `b05b0c5`.
- Scope: Profile Lite shell/module visual order and Power Place cover layer selection only.
- Root cause found:
  - PR #201 guard checked `cabinetTopbar` before `profileLiteTabs`, but the actual canonical visual requirement is module hero/header before tabs;
  - `ProfileLiteShell` rendered tabs/status before the active module, so `Мастерская мандал` could not appear before cabinet tabs;
  - cover option buttons used `${coverLayerMode}-${cover.id}`, remounting the list on inner/outer switches;
  - material-backed saved images did not include `signed_url` in `displaySrc`, unlike client/tradition media.
- Fixed:
  - moved tabs/status into `shellChrome` and lets modules place it under their canonical hero;
  - added `mandalaHero` + shell chrome placement to every Profile Lite tab module;
  - kept route-backed tabs and existing module business logic;
  - made cover option keys stable by cover id, active state layer-specific, and inner/outer save targets explicit;
  - added material signed URL fallback for cover/saved image options.
- Verification:
  - `npm run test:profile-lite` passed after intentional RED failure on old tabs-before-hero contract;
  - `npm run test:profile-media` passed;
  - `npm run test:power-place` passed;
  - `npm run test:profile-loading-recovery` passed;
  - `npm run check` passed after `npm install`, with existing `RY-L04-S04` / `RY-L04-S05` video placeholder warnings and existing Vite large-chunk warning;
  - `npm run build` passed with existing Vite large-chunk warning;
  - `git diff --check` passed.
- Local browser QA:
  - `/profile/mandalas` opened locally with fake public Supabase env, mock API, and fake local session;
  - DOM evidence confirmed topbar -> `mandalaHero` -> `profileLiteTabs`, route-backed tab hrefs intact, and horizontal overflow `0`;
  - DevTools route sweep timed out, so it is not counted as verified.
- Not verified:
  - real authenticated live Supabase upload/sign/select/delete;
  - `cover_ref.inner` / `cover_ref.outer` persistence after production reload with a real session;
  - production/legacy live QA after merge/deploy.

## 2026-06-02 — Profile Lite media upload signed URL hydration fix

- Branch: `codex/profile-lite-media-upload-signed-url-fix`, based on fresh `origin/main` commit `ef8c287`.
- Scope: targeted Profile Lite `/profile/mandalas` media upload/list/hydration/render path only.
- Root cause found:
  - upload and DB insert paths were present, but private Storage hydration swallowed signed URL failures with `catch(() => "")`;
  - storage rows with `image_bucket + image_path` became `storage://profile-cabinet-media/...` without a usable `display_url`, so the picker rendered blank placeholders;
  - Storage sign/upload URLs did not segment-encode object paths.
- Fixed:
  - added segment-safe Storage object path encoding for upload and signed URL requests;
  - moved media row hydration into `hydrateMediaRowsForDisplay`, preserving external `image_url` rows and keeping private signed URLs in `display_url` / `signed_url` only;
  - added safe `media_signing_status` / `media_signing_error` diagnostics when signing fails;
  - propagated signing diagnostics into the Profile Lite image picker with the explicit label `signed URL не создан — проверьте Storage/RLS`;
  - kept Power Place `object_refs` durable and did not persist temporary signed URLs as source refs.
- Verification:
  - `npm run test:profile-media` passed after intentional RED failure on missing encoding/hydration exports;
  - `npm run test:profile-lite` passed after intentional RED failure on missing picker diagnostic;
  - `npm run test:power-place` passed;
  - `npm run test:profile-loading-recovery` passed;
  - `npm run check` passed with existing video placeholder warnings for `RY-L04-S04` and `RY-L04-S05` plus existing Vite large-chunk warning;
  - standalone `npm run build` passed with existing Vite large-chunk warning;
  - `git diff --check` passed.
- Local rendered QA:
  - preview ran at `http://localhost:4193/profile/mandalas`;
  - desktop 1280 and mobile 390 auth-gate route checks had horizontal overflow `0`, no Vite overlay, and no console warnings/errors.
- Not verified:
  - real authenticated Supabase Storage upload/sign/select/delete flow;
  - real `/profile/mandalas` picker preview after upload and after reload;
  - saved composition reload with private images visible;
  - production/legacy live QA after merge/deploy.

## 2026-06-02 — Profile Lite follow-up layout/print parity fix

- Branch: `codex/profile-lite-followup-layout-print-parity`, based on fresh `origin/main` commit `abd47d2`.
- Scope: targeted Profile Lite regression/parity fix against `/profile-old` for Power Place layouts, tab shell order, right-rail proportions, save/actions placement, color print handling, and materials tab structure.
- Changed so far:
  - restored old zodiac plus slot class names for `8+` and `12+`;
  - restored old altar DOM/class structure: `altarTopRow`, `altarTopSource main`, `altarMandalaBase`, `altarBottomSupports`;
  - moved `Сохранить место силы` actions into the center workspace under the mandala constructor;
  - widened the Lite Power Place right rail to the old thicker `minmax(320px, 340px)` proportion while preserving mobile single-column fallback;
  - added print color preservation with `print-color-adjust: exact` and `-webkit-print-color-adjust: exact`;
  - restored the materials tab as old-style left/center/right composition with sources/saved images, central altar/work area, and right material creation.
- Contract coverage:
  - `test/profileLiteCabinetContract.test.mjs` now guards hero-before-tabs order, old zodiac plus/altar markers, right column width class structure, center save/action placement, materials old layout markers, and print color markers.
- Verification status:
  - passed `npm run test:profile-lite` after an intentional RED failure on missing old zodiac plus class names.
- Verification:
  - passed `npm run test:profile-lite` after an intentional RED failure on missing old zodiac plus class names;
  - passed `npm run test:profile-media`;
  - passed `npm run test:power-place`;
  - passed `npm run test:profile-loading-recovery`;
  - passed `npm run check` with existing `validate:videos` warnings for `RY-L04-S04` and `RY-L04-S05` plus existing Vite large-chunk warning;
  - passed standalone `npm run build` with the existing Vite large-chunk warning.
- Local rendered QA:
  - Browser plugin path was attempted on `http://localhost:4189` with fake public Supabase env values and fake JWT/hash only;
  - unauthenticated gate routes opened with horizontal overflow `0`, no console warnings/errors, and no app console errors beyond fake Supabase being unreachable;
  - authenticated workspace-level DOM QA could not be completed because the Browser wrapper in this context did not allow seeding/reading page storage or passing evaluate args, and the app stayed on the Lite auth gate.
- Still pending in this entry:
  - authenticated `/profile/mandalas` versus `/profile-old` rendered workspace comparison on desktop 1280+ and mobile 390;
  - real print preview/result from an authenticated workspace;
  - real Supabase save/load/upload/delete flows;
  - PR, merge, deploy, and production/legacy live QA.

## 2026-06-02 — Profile Lite remaining old-profile parity gaps

- Branch: `codex/profile-lite-old-profile-gap-fix`, based on fresh `origin/main` commit `e484b7a`.
- Scope: minimal Profile Lite parity patch against `/profile-old`, preserving `/profile-old`, route-backed Lite tabs, `ProfileLiteImagePicker`, auth/bootstrap, `/`, `/masters`, `/profile/admin`, Vercel rewrites, and RU-default UI.
- Gap list documented before patch in `docs/profile-lite-old-profile-gap-fix.md`:
  - broken mandala object placement/order by constructor format;
  - broken DAO RI category/subcategory hierarchy;
  - right Power Place rail not matching old design;
  - non-mandala Lite tabs still needing stricter old-cabinet parity coverage where old implementation exists.
- Old sections copied/reused in `src/pages/profile-lite/ProfileLitePowerPlaceModule.jsx`:
  - old zodiac sign placement definitions and plus slot IDs/classes;
  - old star point definitions and star sheet/ray class surface;
  - old chess top row plus board coordinate/class layouts;
  - old business three-vertex layout and DAO `water -> wood -> fire -> earth -> metal` element order;
  - old DAO RI source hierarchy from `reikiLevels`, including level/category select and step/third-level buttons;
  - old right rail shell classes: `powerCommandRail`, `mandalaFieldLayoutSwitch`, `coverSelector`, `coverLayerTabs`, `coverPreviewWrap`, `coverVariantList`, while keeping Lite picker/upload handlers.
- Contract coverage:
  - `test/profileLiteCabinetContract.test.mjs` now guards DAO RI hierarchy backing, old constructor placement definitions, old business/DAO order, and old right-rail shell classes.
- Local rendered QA with fake public Supabase env and fake JWT-shaped local session only:
  - `/profile-old` desktop 1280: rendered old authenticated mandala workspace, overflow `0`, no framework overlay, console warnings/errors `0`, workspace columns `260px 970px`;
  - `/profile/mandalas` desktop 1280: rendered Lite authenticated mandala workspace, overflow `0`, no framework overlay, console warnings/errors `0`, workspace columns `260px 640px 320px`, DAO RI hierarchy visible, right `powerCommandRail` visible;
  - `/profile-old` mobile 390: single `358px` column, overflow `0`, no framework overlay, console warnings/errors `0`;
  - `/profile/mandalas` mobile 390: single `358px` column, overflow `0`, no framework overlay, console warnings/errors `0`, DAO RI hierarchy and right rail still present in stacked layout;
  - all Lite constructor formats clicked and verified at desktop 1280: `Зодиак`, `Звезда`, `Шахматы`, `Мандала`, `Алтарь`, `Бизнес`, `ДАО`; each showed the expected old-format visual class, right rail present, overflow `0`, no framework overlay, console warnings/errors `0`;
  - non-mandala Lite tabs checked locally: profile reused `profileTabContent`; materials/services/orders/chats reused old left/center/right workspace columns `260px 620px 340px`; media/settings remained existing Lite-specific surfaces; all checked routes had overflow `0`, no framework overlay, console warnings/errors `0`.
- Verification:
  - passed `npm run test:profile-lite` after an intentional RED failure on missing DAO RI hierarchy guard;
  - passed `npm run test:profile-media`;
  - passed `npm run test:power-place`;
  - passed `npm run test:profile-loading-recovery`;
  - passed `npm run check` with existing `validate:videos` warnings for `RY-L04-S04` and `RY-L04-S05` plus existing Vite large-chunk warning;
  - passed standalone `npm run build` with existing Vite large-chunk warning.
- Not verified:
  - real authenticated production Supabase/RLS media upload/delete, saved composition save/load/update, service publishing, orders, and chat data behavior;
  - live production/legacy deploy of this branch;
  - real signed-in browser comparison against latest user screenshots.
- Deployment status: branch is local only at this entry; no PR, merge, or production deploy yet.

## 2026-06-02 — Profile Lite copied old cabinet layout structures

- Branch: `codex/copy-profile-old-layout-into-lite`, based on `origin/main` merge commit `dad752c`.
- Scope: copy the already-working `/profile-old` cabinet layout structures from `src/pages/ProfilePage.jsx` into Profile Lite modules while preserving the new stable Profile Lite auth shell, route-backed tabs, and `ProfileLiteImagePicker`.
- Old sections copied/reused:
  - `profileEditor` structure: `profileTabContent`, `profileForm`, `cabinetPreview`, old RU preview copy;
  - materials workspace: `workspaceMainColumns`, `mandalaModeSidebar`, `workspaceCenterColumn`, `mandalaGallery`, `mandalaCardsGrid`, `mandalaMaterialCard`, right-side material form;
  - services/orders/chats workspaces: old `mandalaModeSidebar` left rail plus `chatPlaceholderWorkspace` / `chatPlaceholderHeader` center surface, with live Lite forms/lists kept in `workspaceRightColumn`;
  - mandalas kept the old `workspaceMainColumns` / `powerLibrarySidebar` / `workspaceCenterColumn` / `workspaceRightColumn` / `powerPlaceConstructor` / `powerPlaceSettings` structure and received scoped fit/overflow hardening.
- Contract coverage:
  - `test/profileLiteCabinetContract.test.mjs` now asserts old non-mandala wrapper/class reuse, old material gallery classes, and old services/orders/chats placeholder surfaces.
- Local route-stubbed rendered QA with fake public Supabase env and fake local session only:
  - `/profile-old` desktop 1280: overflow `0`, old left/center/right structure present;
  - `/profile/mandalas` desktop 1280: columns `260px 640px 320px`, mandala panel `560px`, mandala `362px`, overflow `0`;
  - `/profile-old` mobile 390: single `358px` column, overflow `0`;
  - `/profile/mandalas` mobile 390: single `358px` column, mandala panel `324px`, mandala `218px`, overflow `0`;
  - `/profile?tab=materials`, `/profile/services`, `/profile/orders`, `/profile/chats` desktop 1280: old Lite legacy columns `260px 620px 340px`, left/center/right blocks present, overflow `0`;
  - chat empty-data placeholder path rendered 3 old-style mock messages with no console warnings/errors.
- Verification:
  - passed `npm run test:profile-lite` after an intentional RED failure for missing old `profileTabContent`;
  - passed `npm run test:profile-media`;
  - passed `npm run test:power-place`;
  - passed `npm run test:profile-loading-recovery`;
  - passed `npm run check` with existing `validate:videos` warnings for `RY-L04-S04` and `RY-L04-S05` plus existing Vite large-chunk warning;
  - passed standalone `npm run build` with existing Vite large-chunk warning.
- Not verified:
  - real authenticated production Supabase/RLS media upload/delete, saved composition save/load/update, service publishing, orders, and chat data behavior;
  - authenticated live `/profile-old` versus `/profile/mandalas` screenshot-level comparison with a real user session;
  - production deployment of this branch.

## 2026-06-02 — Profile Lite parity PR #196 merged, production deploy blocked

- PR: #196 `Polish Profile Lite mandala parity`.
- Merge commit: `bfb9000c99e298b6f276b46aebf24a8bc07c819d`, merged into `main` at `2026-06-02T00:08:01Z`.
- Main CI:
  - GitHub Actions `CI` run `26789917714` passed for merge SHA `bfb9000c99e298b6f276b46aebf24a8bc07c819d`.
  - GitHub Pages run `26789917711` failed, but production profile-cabinet hosting is Vercel.
- Vercel auto-deploy:
  - commit status for the merge SHA is `failure`;
  - reason: `Deployment rate limited — retry in 24 hours`;
  - target URL: `https://vercel.com/super10?upgradeToPro=build-rate-limit`.
- Fallback deploy:
  - workflow: `.github/workflows/deploy-production.yml`;
  - run: `26789944982`;
  - target ref: `main`;
  - expected SHA: `bfb9000c99e298b6f276b46aebf24a8bc07c819d`;
  - SHA verification and project check passed;
  - Vercel prebuilt deployment failed at `Deploy prebuilt to Vercel production`;
  - failure reason from logs: `Resource is limited - try again in 24 hours (more than 100, code: "api-deployments-free-per-day")`.
- Live route availability after deploy failure:
  - `https://mentalica.vercel.app/profile/mandalas` responds with no framework overlay and horizontal overflow `0`, but opens the Lite auth/debug gate without a real browser session;
  - `https://mentalica.vercel.app/profile-old` responds with no framework overlay and horizontal overflow `0`, but opens the heavy login gate without a real browser session;
  - `https://reiki-yggdrasil.vercel.app/profile/mandalas` responds with no framework overlay and horizontal overflow `0`, but opens the Lite auth/debug gate and showed an expired stored-session notice in the test browser.
- Live version check:
  - Production URL: `https://mentalica.vercel.app/`;
  - Legacy URL: `https://reiki-yggdrasil.vercel.app/`;
  - Status/version URL: none confirmed in this project;
  - Expected SHA: `bfb9000c99e298b6f276b46aebf24a8bc07c819d`;
  - Live SHA/build marker: unknown;
  - Match: unknown;
  - Evidence source: GitHub commit status and fallback workflow logs show Vercel deployment was rate-limited before production alias verification.
- Current deployment status:
  - code is merged to `main`;
  - production is not proven updated to PR #196;
  - retry production deploy after the Vercel daily deployment limit resets.

## 2026-06-02 — Profile Lite Power Place deep parity audit follow-up

- Branch: `codex/profile-lite-power-place-parity-deep-audit`, based on `origin/main` commit `6fbfdb9` after PR #194.
- Scope: post-PR #191/#192/#194 parity audit and targeted Lite `/profile/mandalas` fix against `/profile-old`, without changing auth/bootstrap, `/profile-old`, `/`, `/masters`, or `/profile/admin`.
- Design gaps found:
  - live production cannot currently show either workspace without an authenticated session: `https://mentalica.vercel.app/profile/mandalas` opens the Lite auth/debug gate and `https://mentalica.vercel.app/profile-old` opens the heavy login gate;
  - local authenticated rendered comparison showed the old reference hero starts directly below the heavy topbar, while Lite had tab/status chrome pushing the workspace down, especially on mobile where the tab rail consumed about 454px before the mandala hero;
  - Lite left source rail had only technical source types and missed the old taxonomy groups (`ДАО РИ`, `Мистерии`, `Каналы`, `Фон`, `Форма`, `Талисманы`, `Артефакты`, `Клиенты`);
  - `Добавить мандалу` switched to the saved-list tab instead of opening a selection/upload path, and there was no explicit working `Выбрать из базы` control in the left rail.
- Fixed:
  - added active-tab class hooks to `ProfileLiteShell` and mandalas-only compact shell styling, preserving route-backed tabs while making the mandala workspace appear much earlier;
  - changed mobile mandala tab navigation from ten stacked full-width buttons to a horizontal route-backed strip;
  - added the old source taxonomy groups to the left rail and kept source filters/saved-image cards compact;
  - made `Добавить мандалу` and `Выбрать из базы` open the image picker for the selected object slot or center image instead of switching to an unrelated saved-list view;
  - extended `test/profileLiteCabinetContract.test.mjs` to guard the base-selection label, old source taxonomy, and active-tab shell class hook.
- Local rendered QA with fake public Supabase env and fake JWT only:
  - `/profile/mandalas` desktop 1280: columns `260px 640px 320px`, no horizontal overflow, no framework overlay, no console warnings/errors; right rail and actions visible; mandala panel `560px`, mandala `362px`;
  - `/profile/mandalas` mobile 390: single `358px` column, no horizontal overflow, no framework overlay, no console warnings/errors; mobile tabs reduced from the earlier stacked rail to a `56px` horizontal rail; mandala hero appears in the first viewport and center constructor follows before the left/right rails;
  - `/profile-old` desktop 1280: reference route opens locally with the old workspace, no horizontal overflow, no framework overlay, no console warnings/errors;
  - central image picker opens from `Фото клиента / цели` with `Сохранённые фото` and `Загрузить новое фото`; signed URL placeholder is absent when there is no storage ref to display;
  - `Выбрать из базы` opens the image picker from the left rail and is not an inert button;
  - after 10 seconds, every Profile Lite tab clicked successfully with the expected route/query, active tab, no overlay, and horizontal overflow `0`;
  - guard routes `/`, `/masters`, and `/profile/admin` opened locally with no overlay or horizontal overflow; `/masters` and `/profile/admin` showed expected `Failed to fetch` from fake Supabase URL.
- Verification:
  - passed `npm run test:profile-lite` after an intentional RED failure for missing `Выбрать из базы`;
  - passed `npm run test:profile-media`;
  - passed `npm run test:power-place`;
  - passed `npm run test:profile-loading-recovery`;
  - passed `npm run check` with existing video placeholder warnings for `RY-L04-S04` and `RY-L04-S05` plus existing Vite large-chunk warning;
  - passed standalone `npm run build` with the existing Vite large-chunk warning.
- Still needs authenticated production verification:
  - real Supabase/RLS media upload/delete, signed URL hydration, saved composition save/update/load, service publishing, and old `/profile-old` authenticated visual comparison with a real user session;
  - production/live verification after this branch is committed, merged, and deployed.

## 2026-06-02 — Profile Lite central image picker extraction

- Branch: `profile-lite-central-image-picker-fix`.
- Scope: `/profile/mandalas` Profile Lite Power Place central/object/cover image picker only.
- Changed:
  - added dedicated `ProfileLiteImagePicker` component for saved-image selection, upload, delete, signed-URL placeholders, and modal close timing;
  - wired the picker into the existing Profile Lite three-column Power Place layout without changing `/profile-old`, auth/bootstrap, Vercel rewrites, Supabase env, `/`, `/masters`, or `/profile/admin`;
  - replaced inert `Выбрать из базы` with active `Сохранённые фото`;
  - central-photo selection now updates `central_photo_id`, `object_refs.__center_image`, and `object_ref_urls` immediately when a card has a display URL;
  - central-photo upload now keeps `saved.display_url || saved.signed_url || uploaded.signedUrl` and `saved.image_ref || uploaded.ref`, adds the saved photo to `clientGoalPhotos`, and selects it as the mandala center;
  - raw `storage://` images without a display URL show `Нужна signed URL` placeholders instead of transparent cards;
  - deleting the active client photo clears the central photo ref and display URL mapping;
  - upload prerequisite failures now reject after setting the existing UI error state, so the modal does not close as a false success.
- Verification status:
  - passed `npm run test:profile-lite`;
  - passed `npm run test:profile-media`;
  - passed `npm run test:power-place`;
  - passed `npm run test:profile-loading-recovery`;
  - passed `npm run check` with existing video placeholder warnings for `RY-L04-S04` and `RY-L04-S05` and the existing Vite chunk-size warning;
  - passed `npm run build` with the existing Vite chunk-size warning;
  - authenticated Supabase upload/select/delete QA on live remains `needs manual verification by Andrey` until the deployed branch is checked with a real session.

## 2026-06-02 — Profile Lite route-backed tab navigation freeze fix

- Branch: `codex/fix-profile-lite-tabs-freeze`, based on `origin/main`.
- Scope: stabilize Profile Lite shell/tab navigation after PR #192/#193 without merging or reusing the central image picker PR #194.
- Root cause found:
  - Profile Lite top tabs were local-state-only `<button>` controls wired to `setActiveTab`;
  - direct subroutes existed for several modules, but the shell tab map had no URL contract and `/profile?tab=...` was not parsed;
  - if an active module render crashed after async profile/module data arrived, the module could take the shell subtree with it instead of failing inline.
- Changed:
  - `PROFILE_LITE_TABS` now owns stable `href` values;
  - shell tabs render route-backed anchors and intercept clicks for SPA `pushState` navigation;
  - `/profile?tab=profile|media|materials|diagnostics` and `/profile-lite?tab=...` resolve to the requested Lite tab after reload;
  - existing subroutes remain active for `/profile/mandalas`, `/profile/services`, `/profile/orders`, `/profile/chats`, and `/profile/settings`;
  - `ProfileLitePage` syncs `activeTab` from route/query changes and wraps the active module in an inline ErrorBoundary so shell tabs remain mounted if a module fails.
- Route/tab behavior:
  - Обзор -> `/profile`
  - Профиль -> `/profile?tab=profile`
  - Мои мандалы -> `/profile/mandalas`
  - Фото / Медиа -> `/profile?tab=media`
  - Материалы -> `/profile?tab=materials`
  - Услуги -> `/profile/services`
  - Заказы -> `/profile/orders`
  - Чаты -> `/profile/chats`
  - Настройки -> `/profile/settings`
  - Диагностика -> `/profile?tab=diagnostics`
- Verification status:
  - passed `npm run test:profile-lite` after RED contract failures for route-backed tabs/query mapping/ErrorBoundary;
  - passed `npm run test:profile-loading-recovery`;
  - passed `npm run check` with existing video placeholder warnings for `RY-L04-S04` and `RY-L04-S05`, plus existing Vite chunk-size warning;
  - passed standalone `npm run build` with the existing Vite chunk-size warning;
  - local dev QA with fake Supabase env and fake JWT fallback opened `/profile`, waited 10 seconds, clicked every tab, verified URL + active tab changes, kept 10 tabs mounted, found no `clientPhotoPickerBackdrop`, no Vite overlay, and horizontal overflow `0`;
  - direct local URLs opened the expected tabs for `/profile/mandalas`, `/profile/services`, `/profile/orders`, `/profile/chats`, and `/profile/settings`;
  - local guard routes `/profile-old`, `/`, `/masters`, and `/profile/admin` opened without Vite overlay and with horizontal overflow `0`; `/masters` and `/profile/admin` showed expected `Failed to fetch` with fake Supabase URL only;
  - merge/deploy and production/legacy live QA remain pending in this entry until completed.
- Not changed:
  - `/profile-old`, `/`, `/masters`, `/profile/admin`, Supabase env/auth, Vercel rewrites for existing routes, and Power Place UX depth.

## 2026-06-02 — Profile Lite Power Place layout parity follow-up

- Branch: `codex/fix-profile-lite-power-place-layout-parity`, based on `origin/main` commit `d7cf7d7`.
- PR: #192, merged into `main` as `70d0fa881bbc51adb0c42d4b456162086f473e05`.
- Production deploy:
  - Vercel Production deployment `4896832273` succeeded for SHA `70d0fa881bbc51adb0c42d4b456162086f473e05`.
  - Deployment URL: `https://reiki-yggdrasil-4xrwn9vz8-super10.vercel.app`.
  - Fallback workflow was not used because Vercel auto-deploy reported success for the merge SHA.
- Main CI:
  - GitHub Actions `CI` run `26785839679` passed for the merge SHA.
  - GitHub Pages run `26785839690` failed, but this repo's production path for the profile cabinet is Vercel.
- Scope: fix the live visual regression after PR #191 where `/profile/mandalas` had the old workspace content but not the old desktop layout.
- Fixed in Lite Power Place:
  - removed the Lite use of the old `.powerPlaceMode` two-column override that hid the center column and stretched the constructor into the right side;
  - restored a true `workspaceMainColumns` structure: left `powerLibrarySidebar`, center `workspaceCenterColumn`, right `workspaceRightColumn`;
  - restored left source controls: `Добавить мандалу`, `Группа`, `Категория`, quick source buttons, `Сохранённые изображения`, and saved-image list state;
  - moved background, layout, analysis, resource comparison, and object controls into the separate right rail;
  - kept constructor type controls and the mandala visual in the center;
  - constrained the Lite mandala visual to an old-reference-sized center panel instead of oversized/overflowing or collapsed sizing;
  - kept `Object refs JSON` inside advanced diagnostics only, not as the primary UX.
- Local rendered QA:
  - local dev server used layout-only fake Supabase env and fake hash session; no real tokens/env/JWT were used;
  - `/profile/mandalas` at 1280 showed `260px 640px 320px` columns, visible right rail, visible left source controls, center mandala panel `560px`, mandala `362px`, and horizontal overflow `0`;
  - `/profile/mandalas` at 390 stacked hero, tabs, center constructor/visual, left source controls, right settings controls, then save/download/print actions, with horizontal overflow `0`;
  - `/profile-old` still opened locally at 1280 with no Vite overlay, no console errors, and horizontal overflow `0`.
- Live rendered QA after merge/deploy:
  - `https://mentalica.vercel.app/profile/mandalas` at 1280 showed `260px 640px 320px` columns, visible left rail, visible center constructor, visible right rail, mandala panel `560px`, mandala `362px`, horizontal overflow `0`, no Vite overlay, and no browser console warnings/errors.
  - `https://mentalica.vercel.app/profile/mandalas` at 390 showed a single `358px` column with visible left rail, center constructor, right rail, mandala panel `342px`, mandala `218px`, horizontal overflow `0`, no Vite overlay, and no browser console warnings/errors.
  - `https://reiki-yggdrasil.vercel.app/profile/mandalas` at 1280 matched the same `260px 640px 320px` columns and overflow `0`.
  - `https://mentalica.vercel.app/profile-old` opened to the heavy cabinet login gate with no Vite overlay and horizontal overflow `0`; authenticated old-workspace live comparison still requires a real signed-in session.
- Verification:
  - Passed `npm run test:profile-lite` after a red/green contract-test cycle.
  - Passed `npm run test:profile-media`.
  - Passed `npm run test:power-place`.
  - Passed `npm run test:profile-loading-recovery`.
  - Passed `npm run check` with existing `validate:videos` warnings for `RY-L04-S04` and `RY-L04-S05` and existing Vite chunk-size warning.
  - Passed standalone `npm run build` with existing Vite chunk-size warning.
- Not verified:
  - real authenticated Google/Supabase/RLS media and composition save/load flows.
  - authenticated `/profile-old` workspace comparison on live with a real user session.

## 2026-06-01 — PR #191 production deploy status for Power Place parity

- PR: #191 `Restore Profile Lite Power Place visual parity`.
- Merge SHA: `42491aa3395470ac6013a28bc5e8292feb53507f`.
- Reported deployment result: Vercel Production deploy succeeded for the merge SHA.
- Fallback deploy: not used, correctly, because the normal production deployment succeeded.
- Scope already merged:
  - `/profile` and `/profile/mandalas` remain Profile Lite routes;
  - `/profile-old` remains the heavy reference route;
  - `/`, `/masters`, and `/profile/admin` remain unchanged;
  - Lite Power Place primary UX is visual `Мастерская мандал`, not JSON-first.
- Current verification status:
  - source/tests/build were verified before merge in PR #191;
  - production deployment is reported successful;
  - unauthenticated live route QA still needs to be run when network/browser access is available;
  - authenticated Google/Supabase/RLS QA is not verified by automation and must be manually verified by Andrey on live.
- Do not claim as verified yet:
  - Google login;
  - authenticated `/profile/mandalas` visual parity with `/profile-old`;
  - Storage/RLS media upload/display/delete;
  - saved composition save/load/update;
  - services/orders/chats live data behavior.
- Required next checks:
  - no-auth route QA on `https://mentalica.vercel.app/`, `/profile`, `/profile-lite`, `/profile-old`, `/profile/mandalas`, `/masters`, `/profile/admin`;
  - manual authenticated QA by Andrey with screenshots comparing `/profile/mandalas` and `/profile-old`.

## 2026-06-01 — Profile Lite Power Place parity restoration

- Branch: `codex/profile-lite-power-place-parity`, originally based on `5efbcea` and merged with current `origin/main` commit `1926d97` before PR review.
- Scope: replace the formal JSON-first Lite Power Place module with a visual mandala workshop modeled on `/profile-old`, while keeping `/profile-old` available as the heavy reference.
- Restored in Lite:
  - hero/section `Мастерская мандал`;
  - workspace switches `Место силы` / `Мои мандалы`;
  - saved composition selector `Загрузить сохранённое место силы`;
  - central `Фото клиента / цели` flow;
  - visual constructor area for `Зодиак`, `Звезда`, `Шахматы`, `Мандала`, `Алтарь`, `Бизнес`, `ДАО`;
  - zodiac variants `2/4/6/8/8+/12/12+`, star `closed/open`, chess `classic-14/classic-8/plus-8`, business `1/3` zones;
  - inner/outer background controls, `Без фона`, saved-image cover picker, custom cover upload;
  - object image picker from client photos, tradition assets, and materials, plus per-slot upload;
  - Storage-backed central/object/cover upload wiring through `uploadProfileMedia`;
  - client photo delete confirmation `Удалить фото из базы?`;
  - save/update through existing `createPowerPlaceComposition` / `updatePowerPlaceComposition`;
  - old HTML download fallback and print flow;
  - `Object refs JSON` moved to an advanced diagnostics details block instead of primary UX.
- Verification:
  - Passed `npm run test:profile-lite`.
  - Passed `npm run test:profile-media`.
  - Passed `npm run test:power-place`.
  - Passed `npm run test:profile-loading-recovery`.
  - Passed `npm run check` with existing video placeholder warnings for `RY-L04-S04` and `RY-L04-S05`.
  - Passed `npm run build` with existing Vite chunk-size warning.
- Not verified:
  - authenticated live Supabase media/composition save/load parity;
  - authenticated screenshot-level visual parity against `/profile-old`, because local preview has no Supabase env/session and the checked routes stop at the auth/env gate.

## 2026-06-01 — Profile Lite authenticated QA and gap-analysis after PR #188

- Branch: `codex/profile-lite-authenticated-qa`, based on `origin/main` merge commit `5efbcea` for PR #188.
- Scope: QA/gap-analysis of new `/profile` and `/profile-lite` Profile Lite cabinet against `/profile-old` reference, plus minimal schema-setup documentation guard.
- Route mapping verified by source/tests:
  - `/profile` and `/profile-lite` render `ProfileLitePage`;
  - `/profile-old` remains the heavy `ProfilePage` reference/diagnostic route;
  - `/profile/mandalas`, `/profile/services`, `/profile/orders`, `/profile/chats`, and `/profile/settings` render Profile Lite with the matching initial tab;
  - `/`, `/masters`, and `/profile/admin` remain routed separately.
- Authenticated flow coverage verified at client/contract level:
  - profile save/load uses `profile_cabinet_profiles` through existing session auth and safe payload normalization;
  - materials list/create/save uses `profile_cabinet_publications`, optional media upload, and storage-ref hydration;
  - media upload/display/delete covers client/goal photos and DB-row deletion; tradition media upload/display exists, but tradition delete remains a parity gap vs broader media expectations;
  - saved mandalas/compositions list/load/save/update uses `profile_cabinet_power_place_compositions`;
  - services/orders/chats clients and Lite modules are wired to their Supabase tables with inline `needs verification` failures instead of global auth failure.
- Gap fixed:
  - README setup list now includes `supabase/migrations/20260531090000_power_place_chess_format.sql`, because Profile Lite can save `constructor_type='chess'` and `chess_variant`.
- Parity gaps vs `/profile-old`:
  - Profile Lite Power Place constructor is a compact form/JSON editor, not the full visual old constructor with image picker, object placement, cover layers, uploads per slot, rich mandala preview, and category libraries.
  - Lite chats list/send existing conversations only; creating new conversations with approved masters remains `needs verification` in the UI.
  - Lite media has no tradition asset delete action.
  - Lite services can create/publish from form or selected composition, but no full service editing/archive UI is present.
- Needs verification:
  - real signed-in Supabase/RLS save/load/upload/delete flows on live production, because this QA environment has no `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_ADMIN_EMAIL`, `SUPABASE_ACCESS_TOKEN`, or `SUPABASE_PROJECT_REF`;
  - live schema state for `profile_cabinet_services`, `profile_cabinet_service_orders`, `profile_cabinet_chat_*`, storage bucket policies, and chess composition migration;
  - production/legacy visual route QA after this branch is merged/deployed.

## 2026-06-01 — Profile Lite full alternative cabinet

- Branch: `codex/profile-lite-full-alternative-cabinet`, based on fresh `origin/main` commit `7645c0c`.
- Scope: replace the daily `/profile` cabinet with a modular `ProfileLitePage` alternative while preserving old heavy `ProfilePage` at `/profile-old`.
- Route mapping change:
  - `/profile` renders `ProfileLitePage` overview;
  - `/profile-lite` renders the same Lite overview fallback;
  - `/profile-old` remains the heavy diagnostic/reference cabinet;
  - `/profile/mandalas`, `/profile/services`, `/profile/orders`, `/profile/chats`, and `/profile/settings` render Lite tabs;
  - `/`, `/masters`, `/profile/admin`, and Vercel rewrites remain unchanged.
- Architecture:
  - `ProfileLitePage.jsx` is the route container for auth/session/bootstrap and active-tab wiring;
  - focused modules live under `src/pages/profile-lite/`;
  - profile, materials, media/photos, saved mandalas, services, orders, and chats load independently after shell open;
  - secondary module failures render inline sanitized `needs verification` messages and do not return the shell to global loading.
- Implemented modules:
  - Overview, Профиль, Мои мандалы / Power Place foundation, Фото / Медиа, Материалы, Услуги, Заказы, Чаты, Настройки, Диагностика.
- Needs verification:
  - live Supabase table/RLS availability for services/orders/chats;
  - authenticated live media upload/delete and saved composition save/update;
  - visual/data parity against `/profile-old` after deploy.
- Verification so far:
  - Passed `npm run test:profile-lite`.
  - Passed `npm run test:profile-materials`.
  - Passed `npm run test:profile-media`.
  - Passed `npm run test:profile-services`.
  - Passed `npm run test:power-place`.
  - Passed `npm run test:profile-loading-recovery`.
  - Passed `npm run check` with existing video placeholder warnings for `RY-L04-S04` and `RY-L04-S05`.
  - Passed `npm run build`.
  - Local preview QA at `http://localhost:4178` covered `/`, `/profile`, `/profile-lite`, `/profile-old`, `/profile/mandalas`, `/profile/services`, `/profile/orders`, `/profile/chats`, `/profile/settings`, `/masters`, and `/profile/admin` at desktop 1280 and mobile 390 with HTTP 200, no console issues, no Vite overlay, and no horizontal overflow.
  - Authenticated Supabase module QA and production/legacy live QA remain pending.

## 2026-06-01 — JWT immediate shell-open for heavy ProfilePage

- Branch: `claude/festive-beaver-3ceaf9`.
- Root cause fixed: heavy `ProfilePage` hung on "Загружаю кабинет..." because the shell waited for remote `getCurrentUser` (even with a 1500ms race fallback). When `/auth/v1/user` endpoint hangs, the fallback did not reliably open the cabinet.
- Fix: `loadProfileCabinetBootstrap` now parses the JWT from `session.access_token` synchronously. If `sub`/`user_id` is present, the shell opens immediately (step: `session-shell-opened`, fallback user used: yes). `getCurrentUser` runs in background only via new `runBackgroundUserVerification` with 4s timeout.
- Background verification outcomes:
  - success: no visible change (cabinet already open);
  - timeout/network-fail: `setSecondaryDataNotice` with safe offline notice;
  - auth-error (401/403): `resetProfileSessionState("Сессия устарела. Войдите заново.")`.
- Non-JWT session path: unchanged — old `getCurrentUserWithFastFallback` race with 1500ms fallback still used for safety.
- Changed files: `src/lib/profileBootstrapClient.js`, `src/pages/ProfilePage.jsx`, `test/profileBootstrapClient.test.mjs`, `test/profilePageAuthBootstrap.test.mjs`.
- Live QA required after deploy: `/profile?debugAuth=1` must show `bootstrap step: session-shell-opened`, `fallback user used: yes`, `render state: user` within 1 sec. Also verify `/profile-old?debugAuth=1` and `/profile-lite`.

## 2026-06-01 — Heavy ProfilePage restored to `/profile` after PR #180

- Branch: `codex/restore-heavy-profile-after-recovery-script-removal`, based on fresh `origin/main` after PR #180.
- Scope: restore `/profile` to the heavy `ProfilePage` after PR #180 removed `profile-auth-render-recovery.js` from `index.html`.
