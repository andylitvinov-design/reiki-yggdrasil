# Power Place Video Mode — Codex implementation program

Дата: 2026-06-08
Проект: Reiki Yggdrasil
Repo: `andylitvinov-design/reiki-yggdrasil`
Target branch: `main`
Статус: техническая программа внедрения для одного Codex `/goal`

## 1. Цель

Добавить в мастерскую мандал универсальный режим `Фото / Видео`.

`Фото` — текущий статический режим, должен остаться визуально и функционально неизменным.

`Видео` — live-анимационный слой поверх текущей мандалы. Он использует центральное фото и добавляет движущиеся копии по позициям формата мандалы, как по часам.

Переключатели видео:

- Количество: `Видео 1` / `Видео 4`.
- Вектор: `По часовой` / `Против часовой`.
- Тайминг: `1 сек` / `2 сек` / `3 сек` задержки на каждой позиции.
- Видео-фон: показать как `needs implementation`, если не реализуется отдельная безопасная video-upload фаза.
- Скачать видеоролик: показать кнопку, но не фейковать экспорт; если экспорта нет, выводить `Экспорт видео: needs implementation`.

Главное правило: если формат имеет 4 позиции — 4 шага в цикле; если 12 — 12 шагов. Цикл зациклен.

## 2. Нельзя менять

Не менять public homepage `/`, `/profile`, `/profile/mandalas`, `/profile/services`, `/masters`, `/profile/admin`, Supabase auth/data flows, Vercel rewrites, env values, production branch/deploy config, RU-default UI, desktop three-column layout, mobile fallback, public master privacy filtering.

Env names only:

```text
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
VITE_ADMIN_EMAIL
```

## 3. Где зафиксированы форматы

### React

Файл:

```text
src/pages/profile-lite/ProfileLitePowerPlaceModuleBase.jsx
```

Форматы в `CONSTRUCTOR_TYPES`:

```text
zodiac, star, chess, client, altar, business, dao
```

Не добавлять `video` в `CONSTRUCTOR_TYPES`. Видео — это режим поверх текущего формата.

Константы форматов:

```text
GEOMETRIES
ZODIAC_VARIANTS
STAR_VARIANTS
STAR_POINTS
CHESS_VARIANTS
CHESS_SLOT_LAYOUTS
ZODIAC_SIGNS
ZODIAC_PLUS_SLOT_LAYOUT
BUSINESS_VERTICES
DAO_ELEMENTS
```

Функция слотов:

```text
buildSlotList(draft)
```

### State / save-load bridge

Файл:

```text
src/pages/ProfileLitePage.jsx
```

Точки изменения:

```text
EMPTY_COMPOSITION
compositionDraft state
handleCompositionDraftChange(field, value)
handleCompositionLoad(composition)
refreshSavedCompositions(saved)
handleCompositionSaveNew()
handleCompositionUpdateExisting()
saveCompositionForServiceAction()
handleUploadedCentralPhoto(file)
openPowerPlacePdfPrintView(title)
```

`openPowerPlacePdfPrintView` — только PDF/print. Не использовать для видеоэкспорта.

### Persistence

Файл:

```text
src/lib/powerPlaceClient.js
```

Точки изменения:

```text
normalizePowerPlaceComposition(composition)
cleanObjectRefs(value)
collectCompositionStorageRefs(row)
hydrateCompositionRowsWithSignedUrls(rows, signedUrls)
createPowerPlaceComposition(...)
updatePowerPlaceComposition(...)
```

Текущая таблица `profile_cabinet_power_place_compositions` имеет `object_refs jsonb`, но нет top-level video columns. Поэтому для первого внедрения хранить настройки в `object_refs.__motion_settings`, без миграции.

### Media / video background

Файл:

```text
src/lib/profileMediaClient.js
```

Текущий blocker: `PROFILE_MEDIA_ALLOWED_TYPES` не содержит `video/*`, лимит 5 MB, path kind `video-background` отсутствует. Поэтому видео-фон в этой задаче — честный `needs implementation`, если Codex не делает отдельную безопасную Phase 4.

## 4. Хранение настроек

Использовать только:

```js
const MOTION_SETTINGS_REF_KEY = "__motion_settings";
```

Shape внутри `object_refs`:

```js
{
  mode: "photo" | "video",
  count: 1 | 4,
  direction: "clockwise" | "counterclockwise",
  step_seconds: 1 | 2 | 3,
  video_background_ref: ""
}
```

Defaults:

```js
{ mode: "photo", count: 1, direction: "clockwise", step_seconds: 2, video_background_ref: "" }
```

## 5. Изменения по файлам

### `src/lib/powerPlaceClient.js`

Добавить constants:

```js
const MOTION_SETTINGS_REF_KEY = "__motion_settings";
const VALID_MOTION_MODES = ["photo", "video"];
const VALID_VIDEO_COUNTS = [1, 4];
const VALID_VIDEO_DIRECTIONS = ["clockwise", "counterclockwise"];
const VALID_VIDEO_STEP_SECONDS = [1, 2, 3];
```

Добавить `normalizeMotionSettings(value)`.

Изменить `cleanObjectRefs(value)`: обычные refs чистить как раньше, но `__motion_settings` сохранять как нормализованный object. Не разрешать другие произвольные nested objects.

В `normalizePowerPlaceComposition`: всегда добавлять `objectRefs[MOTION_SETTINGS_REF_KEY] = normalizeMotionSettings(sourceObjectRefs[MOTION_SETTINGS_REF_KEY])`.

Тестировать, что `data:image` и `data:video` не сохраняются.

### `src/pages/ProfileLitePage.jsx`

Добавить `MOTION_SETTINGS_REF_KEY` рядом с существующими ref keys.

Добавить local `normalizeMotionSettings(value)` и `withDefaultMotionSettings(composition)`.

Использовать `withDefaultMotionSettings(...)` в:

```text
handleCompositionLoad
refreshSavedCompositions
setCompositionDraft after save
setCompositionDraft after update if applicable
```

Расширить `handleCompositionDraftChange(field, value)`:

```text
motion_mode -> object_refs.__motion_settings.mode
video_count -> object_refs.__motion_settings.count
video_direction -> object_refs.__motion_settings.direction
video_step_seconds -> object_refs.__motion_settings.step_seconds
video_background_ref -> object_refs.__motion_settings.video_background_ref
```

Не ломать существующую обработку:

```text
PROFILE_LITE_REPORT_REF_KEY
field_layout
field_scale
__center_image_scale
slot_scale
```

### `src/pages/profile-lite/ProfileLitePowerPlaceModuleBase.jsx`

Добавить `MOTION_SETTINGS_REF_KEY`, `normalizeMotionSettings`, helpers позиций и state анимации.

Деривация после `objectRefs` / `centralImage`:

```js
const motionSettings = normalizeMotionSettings(objectRefs[MOTION_SETTINGS_REF_KEY]);
const motionMode = motionSettings.mode;
const videoCount = motionSettings.count;
const videoDirection = motionSettings.direction;
const videoStepSeconds = motionSettings.step_seconds;
const videoEnabled = motionMode === "video";
```

UI inside `constructorControls`:

- `Режим`: `Фото`, `Видео`.
- Если `Видео`: `Видео 1`, `Видео 4`, `По часовой`, `Против часовой`, `1 сек`, `2 сек`, `3 сек`.
- Если нет `centralImage`: `Сначала добавьте фото клиента / цели`.
- `Видео-фон: needs implementation`.
- `Скачать видеоролик`; click: `Экспорт видео: needs implementation`.

Добавить stable test markers:

```text
data-motion-mode-switch="true"
data-video-count="1|4"
data-video-direction="clockwise|counterclockwise"
data-video-step-seconds="1|2|3"
data-motion-layer="true"
data-motion-copy="1..4"
data-video-export-button="true"
```

## 6. Motion positions для всех форматов

Добавить helpers рядом с `buildSlotList`:

```js
clockPositions(count, radius = 38, startAngle = -90)
motionCopyOffsets(count, positionsLength)
getMotionPositionsForComposition(draft, slots, variant)
```

Форматы:

### client

`clockPositions(Number(draft.geometry) || 4, 38)`.

### zodiac

`clockPositions(Number(draft.zodiac_visible_count) || 12, 39)`. Для `plus-*` extra positions можно не анимировать отдельно в Phase 1; report limitation.

### star

```js
[
  { id: "star-top", x: 50, y: 13 },
  { id: "star-right", x: 82, y: 38 },
  { id: "star-lower-right", x: 70, y: 78 },
  { id: "star-lower-left", x: 30, y: 78 },
  { id: "star-left", x: 18, y: 38 }
]
```

### dao

`clockPositions(5, 36, -90)` unless CSS inspection gives exact visual mapping.

### business

```js
[
  { id: "business-goal", x: 50, y: 16 },
  { id: "business-structure", x: 78, y: 72 },
  { id: "business-function", x: 22, y: 72 }
]
```

### altar

7 visible points: top row 5 points + bottom supports 2 points. If visually unsafe, fallback `clockPositions(7)` and report.

### chess compact-5

```js
[
  { id: "compact-top", x: 50, y: 17 },
  { id: "compact-right", x: 76, y: 42 },
  { id: "compact-bottom-right", x: 65, y: 76 },
  { id: "compact-bottom-left", x: 35, y: 76 },
  { id: "compact-left", x: 24, y: 42 }
]
```

### chess plus-8

Use outer/inner square positions in clockwise order:

```text
outer-top-left, outer-top-right, inner-top-right, outer-bottom-right,
inner-bottom-right, outer-bottom-left, inner-bottom-left, inner-top-left
```

### chess classic-8

3x3 ring around center:

```text
r1c1, r1c2, r1c3, r2c3, r3c3, r3c2, r3c1, r2c1
```

### chess classic-14

5x3 perimeter around center. Use 14 non-center visual points; do not animate through center.

## 7. Animation logic

Use React interval, not CSS-only keyframes, because timing means “задержка на каждом блоке”.

```js
const [motionStep, setMotionStep] = useState(0);
useEffect(() => {
  if (!videoEnabled) return undefined;
  const timer = window.setInterval(() => setMotionStep((current) => current + 1), videoStepSeconds * 1000);
  return () => window.clearInterval(timer);
}, [videoEnabled, videoStepSeconds, videoDirection, videoCount, compositionDraft.constructor_type, compositionDraft.geometry, compositionDraft.zodiac_visible_count, compositionDraft.chess_variant]);
```

Position math:

```js
const directionFactor = videoDirection === "counterclockwise" ? -1 : 1;
const baseIndex = ((motionStep * directionFactor) % positions.length + positions.length) % positions.length;
const offsets = videoCount === 4 ? motionCopyOffsets(4, positions.length) : [0];
const position = positions[(baseIndex + offset) % positions.length];
```

Offset examples:

```text
12 -> 0,3,6,9
8 -> 0,2,4,6
5 -> 0,1,2,3
4 -> 0,1,2,3
```

## 8. Motion layer placement

Add `renderPowerPlaceMotionLayer(variant)` and insert into every branch:

```text
client -> inside .powerMandala
altar -> inside .altarMandalaSheet
business -> inside .businessMandalaSheet
zodiac -> inside .zodiacMandalaSheet
star -> inside .starMandalaSheet
chess -> inside .power-place-chess, before board, or inside board if coordinate alignment requires
 dao -> inside .daoMandalaSheet
```

Layer must be sibling to center photo, not inside center button.

## 9. CSS

File:

```text
src/profileMandalaWorkspace.css
```

Add:

```css
.profileLitePowerPlace .powerMandala,
.profileLitePowerPlace .altarMandalaSheet,
.profileLitePowerPlace .businessMandalaSheet,
.profileLitePowerPlace .zodiacMandalaSheet,
.profileLitePowerPlace .starMandalaSheet,
.profileLitePowerPlace .daoMandalaSheet,
.profileLitePowerPlace .power-place-chess { position: relative; }

.profileLitePowerPlace .powerPlaceMotionLayer { position:absolute; inset:0; pointer-events:none; z-index:6; overflow:visible; }
.profileLitePowerPlace .powerPlaceMotionPhoto { position:absolute; width:clamp(42px,14%,72px); aspect-ratio:1/1; border-radius:999px; background-size:cover; background-position:center; transform:translate(-50%,-50%); transition:left .42s ease, top .42s ease; box-shadow:0 10px 22px rgba(48,30,8,.22),0 0 0 2px rgba(255,229,157,.62); }
.profileLitePowerPlace .powerPlaceMotionPhoto--count-4 { width:clamp(34px,11%,58px); }
.profileLitePowerPlace .powerPlaceMotionControls,
.profileLitePowerPlace .powerPlaceVideoControls { display:flex; flex-wrap:wrap; align-items:center; gap:7px; }
@media (prefers-reduced-motion: reduce) { .profileLitePowerPlace .powerPlaceMotionPhoto { transition:none; } }
@media (max-width:640px) { .profileLitePowerPlace .powerPlaceMotionPhoto { width:clamp(30px,10vw,48px); } }
```

Add active button styling consistent with existing `.constructorControls` buttons if current CSS already covers it; otherwise add scoped styles.

## 10. Tests

Update/add:

```text
test/powerPlaceClient.test.mjs
test/profileLiteCabinetContract.test.mjs
test/powerPlaceStyleContract.test.mjs
```

Must test:

- `object_refs.__motion_settings` persists.
- invalid settings normalize to defaults.
- valid mode/count/direction/timing survive normalization.
- UI labels exist.
- data markers exist where feasible.
- CSS selectors exist.
- `data:image` and `data:video` are not persisted.

## 11. Acceptance criteria

Done only if:

- `Фото` default unchanged.
- `Видео` controls visible.
- `Видео 1` animates one copy.
- `Видео 4` animates four copies.
- direction changes order.
- timing changes delay.
- all formats have mapping or explicit fallback report.
- settings persist after save/reload via `object_refs.__motion_settings`.
- center photo editing/drag/drop still works.
- mobile has no horizontal overflow.
- video background/export do not fake completion.
- tests/build/check pass.

## 12. Required checks

```bash
npm run test:power-place
npm run test:profile-lite
npm run test:profile-media
npm run test:profile-services
npm run build
npm run check
git diff --check
```

Manual QA:

```text
/
/profile
/profile/mandalas
/profile/services
/masters
/profile/admin
```

In `/profile`, test: client 4/12, zodiac 12, star, dao, business, altar, chess compact-5/plus-8/classic-8/classic-14.

## 13. Rollback / safety

If animation breaks a format, keep `Фото` default working and disable only that format’s motion with fallback `clockPositions(...)` plus report. Do not revert unrelated features. Do not touch production deploy.

After code implementation, update:

```text
STATE.md
LOG.md
```

## 14. Codex goal prompt

Use the short prompt from the ChatGPT response and this document as the full source of truth.
