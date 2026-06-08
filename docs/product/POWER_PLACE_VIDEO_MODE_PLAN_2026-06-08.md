# Power Place Video Mode Plan — Фото / Видео для мандал

Дата: 2026-06-08
Проект: Reiki Yggdrasil
Repo: `andylitvinov-design/reiki-yggdrasil`
Target branch для реализации: `main`
Статус: docs-only plan for Codex implementation

## 1. Цель

Добавить в мастерскую мандал универсальный режим:

```text
Фото / Видео
```

`Фото` — текущий статический режим. Он должен остаться визуально и функционально неизменным.

`Видео` — новый анимационный режим поверх существующей мандалы. Он использует центральное фото, добавляет движущиеся копии фото, опциональный видео-фон и кнопку экспорта ролика.

Главный принцип: движение идёт по позициям мандалы как по часам. Если формат имеет 4 позиции — цикл состоит из 4 шагов. Если 12 — из 12 шагов. Анимация зациклена.

## 2. Инфраструктура проекта

- Framework: Vite + React.
- Hosting: Vercel.
- Build: `npm run build`.
- Output: `dist`.
- Current / legacy live URL: `https://reiki-yggdrasil.vercel.app`.
- Target production URL from repo docs: `https://mentalica.vercel.app`.
- Draft / owner QA site concept: `https://2mentalica.vercel.app` — needs verification.

Env names only:

```text
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
VITE_ADMIN_EMAIL
```

Do not expose, log, or commit env values.

## 3. Safety boundaries

Do not change:

- public homepage `/`;
- `/profile`, `/masters`, `/profile/admin` routes;
- Supabase auth/data flows;
- Supabase private media signed URL flow;
- Vercel rewrites;
- production branch or production deploy config;
- env names or values;
- RU-default UI;
- desktop three-column layout;
- mobile single-column fallback.

Do not rewrite the whole project. Use minimal safe additive changes.

## 4. Files to inspect first

Codex must read before implementation:

```text
AGENTS.md
README.md
STATE.md
LOG.md
docs/release-workflow.md
docs/deploy-fallback.md
package.json
vercel.json
src/main.jsx
src/App.jsx
src/index.css
src/lib/supabaseClient.js
src/pages/profile-lite/ProfileLitePowerPlaceModuleBase.jsx
src/profileMandalaWorkspace.css
```

If a file is missing, report `not found`.

Primary implementation files are expected to be:

```text
src/pages/profile-lite/ProfileLitePowerPlaceModuleBase.jsx
src/profileMandalaWorkspace.css
```

Potential tests:

```text
test/profileLiteCabinetContract.test.mjs
test/powerPlaceClient.test.mjs
test/powerPlaceStyleContract.test.mjs
test/profileMediaClient.test.mjs
```

## 5. Product UI

Add universal selector in mandala constructor controls:

```text
Режим
[Фото] [Видео]
```

When `Видео` is active, show settings:

```text
Количество
[Видео 1] [Видео 4]

Вектор
[По часовой] [Против часовой]

Тайминг
[1 сек] [2 сек] [3 сек]

Видео-фон
[Загрузить видео]

[Скачать видеоролик]
```

If there is no central image, show a clear hint:

```text
Сначала добавьте фото клиента / цели
```

## 6. Draft fields

Use additive fields only:

```js
motion_mode: "photo" | "video"
video_count: 1 | 4
video_direction: "clockwise" | "counterclockwise"
video_step_seconds: 1 | 2 | 3
video_background_ref: string
```

Defaults:

```js
motion_mode: "photo"
video_count: 1
video_direction: "clockwise"
video_step_seconds: 2
video_background_ref: ""
```

Before changing persistence:

1. Find current Power Place composition save/load payload.
2. Check whether additive JSON fields are preserved safely.
3. If yes, use the existing payload structure.
4. If no, make the smallest safe serialization/hydration fix.
5. Do not add a Supabase migration unless strictly required.
6. If migration is required, stop and report a separate migration plan.

## 7. Motion model

Implement helper similar to:

```js
getMotionPositionsForComposition(compositionDraft, slots)
```

It should return ordered positions:

```js
[
  { id: "position-1", x: 50, y: 10, label: "12 часов" },
  { id: "position-2", x: 90, y: 50, label: "3 часа" }
]
```

Coordinates can be percentages relative to the motion layer.

Direction:

```text
clockwise: position 1 -> position 2 -> position 3 -> repeat
counterclockwise: position 1 -> last position -> previous position -> repeat
```

Timing:

```text
cycle duration = positions_count * video_step_seconds
```

Examples:

```text
4 positions * 2 sec = 8 sec loop
12 positions * 2 sec = 24 sec loop
```

## 8. Video 1 behavior

`Видео 1` renders one decorative duplicate of the central photo.

Requirements:

- duplicate moves through mandala positions;
- central photo stays in place;
- direction follows `video_direction`;
- delay follows `video_step_seconds`;
- overlay uses `pointer-events: none`;
- central photo remains clickable, draggable, scalable, and editable.

## 9. Video 4 behavior

`Видео 4` renders four decorative duplicates of the central photo.

Requirements:

- four copies are distributed around the center;
- all copies move through the same ordered position list;
- copies are evenly offset.

Offset examples:

```text
12 positions: 0, 3, 6, 9
8 positions: 0, 2, 4, 6
4 positions: 0, 1, 2, 3
5 positions: balanced fallback, report exact behavior
```

## 10. Position mapping by constructor type

The video mode is not a new constructor type. It overlays all existing formats where safe.

Minimum supported mappings:

### client

Use `geometry` positions: `2 / 4 / 6 / 8 / 12`.

### zodiac

Use `zodiac_visible_count` or `zodiac_variant`: `2 / 4 / 6 / 8 / 12`.

### chess

Use non-center visible slots.

Minimum:

- `compact-5`: 5 visible slots around center;
- `plus-8`: 8 absolute slots if safe;
- `classic-8`: 8 cells around center if safe;
- `classic-14`: outer contour if safe, otherwise fallback and report.

### dao

Use 5 Usin elements in visual clock-like order.

### star

Use star points: top, right, lower-right, lower-left, left.

### business

Minimum safe version: use 3 main vertices.

### altar

Use visible altar positions if safe. Otherwise use generic circular orbit fallback and report.

If any format cannot safely provide clean positions, use generic circular fallback and report it.

## 11. CSS layer

Add dedicated CSS layer:

```css
.powerPlaceMotionLayer {}
.powerPlaceMotionPhoto {}
.powerPlaceMotionPhoto--copy-1 {}
.powerPlaceMotionPhoto--copy-2 {}
.powerPlaceMotionPhoto--copy-3 {}
.powerPlaceMotionPhoto--copy-4 {}
.powerPlaceVideoBackground {}
```

Requirements:

- absolute overlay inside mandala panel/sheet;
- above background, below controls;
- `pointer-events: none`;
- no horizontal overflow;
- mobile safe;
- print/PDF fallback documented.

Reduced motion:

```css
@media (prefers-reduced-motion: reduce) {
  /* disable or slow motion and keep stable preview */
}
```

## 12. Video background

Video background is a separate layer.

Requirements if implemented:

```html
<video muted loop playsInline autoplay />
```

- object-fit: cover;
- no interaction blocking;
- private media must remain private;
- do not save `data:video` in composition payload;
- do not expose storage refs in public surfaces.

Before implementation, inspect current media upload/storage flow. If current flow supports only images, leave video background as `needs implementation` and report blocker.

## 13. Export button

Add visible button:

```text
Скачать видеоролик
```

Do not fake export.

If real export is not implemented in this pass:

```text
Экспорт видео: needs implementation
```

Recommended phases:

- Phase 1: UI + live animation + honest export state.
- Phase 2: WebM export after canvas/CORS analysis.
- Phase 3: MP4 only after separate technical decision.

Known export risks:

- DOM-to-video is complex;
- private signed media can block canvas recording;
- cross-origin media can taint canvas;
- browser MP4 export may require heavy libraries or server processing.

## 14. Implementation phases

### Phase 0 — reconnaissance

- Check git state.
- Read mandatory files.
- Find Power Place save/load flow.
- Find media upload flow.
- Find print/PDF/download flow.
- Find relevant tests.
- Report risks before code.

### Phase 1 — UI and state

- Add `Фото / Видео` selector.
- Add video settings panel.
- Add default values.
- Hydrate old compositions safely.
- Test default `Фото` unchanged.

### Phase 2 — live animation

- Add motion positions helper.
- Add motion layer renderer.
- Implement `Видео 1`.
- Implement `Видео 4`.
- Implement direction.
- Implement timing.
- Implement loop.
- Add reduced-motion handling.

### Phase 3 — format mappings

Support at minimum:

```text
client geometry 4
client geometry 12
zodiac 12
chess compact-5
dao
```

Other formats can use safe mapping or fallback orbit.

### Phase 4 — video background

Implement only if current media infrastructure safely supports video. Otherwise leave `needs implementation` and report blocker.

### Phase 5 — export

Start with honest button state. Implement WebM only if safe without heavy risky changes. Do not claim MP4 unless actually implemented and verified.

## 15. Checks

Run:

```bash
npm run test:power-place
npm run test:profile-lite
npm run test:profile-media
npm run test:profile-services
npm run build
npm run check
git diff --check
```

## 16. Manual QA

Check desktop and mobile:

```text
/
/profile
/profile/mandalas
/profile/services
/masters
/profile/admin
```

In `/profile`:

1. Open mandala workshop.
2. Confirm default `Фото` mode is unchanged.
3. Add/select central photo.
4. Switch to `Видео`.
5. Test `Видео 1`.
6. Test clockwise and counterclockwise.
7. Test timing 1/2/3 seconds.
8. Test `Видео 4`.
9. Confirm loop.
10. Confirm central photo remains editable.
11. Confirm drag/drop still works.
12. Save composition.
13. Reload composition.
14. Confirm mobile has no horizontal overflow.
15. Check print/PDF behavior and report limitations.
16. Check video background if implemented.
17. Check export button behavior.

## 17. Definition of Done

Phase 1-3 ready when:

- `Фото / Видео` selector exists;
- `Фото` unchanged;
- `Видео 1` works;
- `Видео 4` works;
- direction works;
- timing works;
- loop works;
- at least five formats are supported or fallbacks are documented;
- old saved compositions still load;
- checks pass;
- no mobile overflow;
- no Supabase/auth/Vercel regressions.

Phase 4 ready when video background works safely with private media and limitations are documented.

Phase 5 ready when a real video file downloads and the exact format is reported. If not implemented, UI must honestly say `needs implementation`.

## 18. Codex prompt

```text
Repo: andylitvinov-design/reiki-yggdrasil
Target branch: main
Mode: minimal safe feature implementation
Feature: universal Photo / Video mode for all mandala formats

Read first: AGENTS.md, README.md, STATE.md, LOG.md, docs/release-workflow.md, docs/deploy-fallback.md, package.json, vercel.json, src/main.jsx, src/App.jsx, src/index.css, src/lib/supabaseClient.js, src/pages/profile-lite/ProfileLitePowerPlaceModuleBase.jsx, src/profileMandalaWorkspace.css. If missing, report `not found`.

Add a universal `Фото / Видео` selector to the Profile Lite Power Place / Mandala constructor. `Фото` must remain unchanged. `Видео` adds a motion layer using the central photo.

Video settings: `Видео 1` / `Видео 4`, `По часовой` / `Против часовой`, `1 сек` / `2 сек` / `3 сек`, optional video background, and `Скачать видеоролик`.

Movement must follow mandala positions like clock positions. If 4 positions, use 4 switching points. If 12, use 12 switching points. Loop forever.

Use additive fields only: `motion_mode`, `video_count`, `video_direction`, `video_step_seconds`, `video_background_ref`. Do not add migration unless strictly required; if required, report a migration plan first.

Implement helpers for position mapping and motion layer rendering. Support at minimum client geometry 4, client geometry 12, zodiac 12, chess compact-5, and dao. For other formats, use safe mapping or fallback and report.

Use CSS overlay with `pointer-events: none`, no horizontal overflow, mobile safety, and `prefers-reduced-motion` support.

Video background must respect private media flow. Do not save `data:video`. Do not expose private storage refs publicly. If unsafe, leave as `needs implementation`.

Export button must not fake success. If real export is not implemented, show `Экспорт видео: needs implementation`. If safe, implement WebM and report limitations. Do not claim MP4 unless verified.

Do not change public homepage, /masters public logic, /profile/admin, Supabase auth, Vercel rewrites, env values, production branch, RU-default UI, desktop/mobile layout.

Run: npm run test:power-place, npm run test:profile-lite, npm run test:profile-media, npm run test:profile-services, npm run build, npm run check, git diff --check.

Report: summary, changed files, fields added, supported formats, fallback formats, video background status, export status, checks with exit codes, manual QA, risks, not verified, STATE.md/LOG.md update recommendation.
```

## 19. Follow-up documentation rule

After real code implementation, update `STATE.md` and `LOG.md`. If architecture changes, update this plan or add an implementation report in `docs/product/`.
