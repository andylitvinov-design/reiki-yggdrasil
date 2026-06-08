# Power Place Video Mode — infrastructure-safe implementation contract

Дата: 2026-06-08
Проект: Reiki Yggdrasil
Repo: `andylitvinov-design/reiki-yggdrasil`
Target branch: `main`
Статус: технический контракт для одного Codex `/goal`

## 1. Цель

Добавить в мастерскую мандал универсальный режим `Фото / Видео`.

`Фото` — текущий статический режим, должен остаться визуально и функционально неизменным.

`Видео` — live-анимационный слой поверх текущего формата мандалы. Он использует центральное фото и добавляет движущиеся копии по позициям формата, как по часам.

Переключатели:

- `Фото / Видео`.
- `Видео 1 / Видео 4`.
- `По часовой / Против часовой`.
- `1 сек / 2 сек / 3 сек` задержки на каждой позиции.
- `Видео-фон: needs implementation`, если не реализована отдельная безопасная video-upload фаза.
- `Скачать видеоролик`, но без fake export: если экспорта нет, выводить `Экспорт видео: needs implementation`.

Правило движения: если формат имеет 4 позиции — 4 шага в цикле; если 12 — 12 шагов. Цикл зациклен.

## 2. Жёсткие границы

Не менять public homepage `/`, `/profile`, `/profile/mandalas`, `/profile/services`, `/masters`, `/profile/admin`, Supabase auth/data flows, Vercel rewrites, env values, production branch/deploy config, RU-default UI, desktop three-column layout, mobile fallback, public master privacy filtering.

Env names only:

```text
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
VITE_ADMIN_EMAIL
```

Не добавлять migration в первом проходе. Не добавлять `video` как `constructor_type`.

## 3. Где зафиксированы форматы

### React format registry

File:

```text
src/pages/profile-lite/ProfileLitePowerPlaceModuleBase.jsx
```

Форматы в `CONSTRUCTOR_TYPES`:

```text
zodiac, star, chess, client, altar, business, dao
```

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

Slot source:

```text
buildSlotList(draft)
```

### State / save-load bridge

File:

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

File:

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

`profile_cabinet_power_place_compositions` имеет `object_refs jsonb`, но нет top-level video columns. Поэтому настройки видео хранить в `object_refs.__motion_settings`.

### Media / video background blocker

File:

```text
src/lib/profileMediaClient.js
```

Текущий blocker: `PROFILE_MEDIA_ALLOWED_TYPES` не содержит `video/*`, лимит 5 MB, path kind `video-background` отсутствует. Поэтому видео-фон в этой задаче — только `needs implementation`, если Codex не делает отдельную безопасную Phase 4.

## 4. Хранение настроек

Использовать:

```js
const MOTION_SETTINGS_REF_KEY = "__motion_settings";
```

Shape:

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

Backward compatibility:

- old saved compositions without `__motion_settings` must load as `Фото`.
- new settings must persist through save, update, service conversion and reload.
- do not persist `data:image`, `data:video`, signed URLs or arbitrary nested objects.

## 5. Required implementation by file

### `src/lib/powerPlaceClient.js`

Add constants:

```js
const MOTION_SETTINGS_REF_KEY = "__motion_settings";
const VALID_MOTION_MODES = ["photo", "video"];
const VALID_VIDEO_COUNTS = [1, 4];
const VALID_VIDEO_DIRECTIONS = ["clockwise", "counterclockwise"];
const VALID_VIDEO_STEP_SECONDS = [1, 2, 3];
```

Add `normalizeMotionSettings(value)`.

Modify `cleanObjectRefs(value)`:

- normal slot refs continue current cleaning.
- preserve exactly `__motion_settings` as normalized object.
- reject/drop all other nested objects.

In `normalizePowerPlaceComposition`, always set:

```js
objectRefs[MOTION_SETTINGS_REF_KEY] = normalizeMotionSettings(sourceObjectRefs[MOTION_SETTINGS_REF_KEY]);
```

If video background later gets real storage refs, add it to `collectCompositionStorageRefs(row)` and signed URL hydration. Not in Phase 1-3.

### `src/pages/ProfileLitePage.jsx`

Add `MOTION_SETTINGS_REF_KEY` next to existing ref keys.

Add local `normalizeMotionSettings(value)` and `withDefaultMotionSettings(composition)`.

Use `withDefaultMotionSettings(...)` in:

```text
handleCompositionLoad
refreshSavedCompositions
setCompositionDraft after save
setCompositionDraft after update if applicable
saveCompositionForServiceAction path if it touches draft shape
```

Extend `handleCompositionDraftChange(field, value)` mapping:

```text
motion_mode -> object_refs.__motion_settings.mode
video_count -> object_refs.__motion_settings.count
video_direction -> object_refs.__motion_settings.direction
video_step_seconds -> object_refs.__motion_settings.step_seconds
video_background_ref -> object_refs.__motion_settings.video_background_ref
```

Do not break existing handling for report, field_layout, field_scale, `__center_image_scale`, `slot_scale`.

### `src/pages/profile-lite/ProfileLitePowerPlaceModuleBase.jsx`

Add `MOTION_SETTINGS_REF_KEY`, local `normalizeMotionSettings`, motion helpers and interval state.

Derive after `objectRefs` and `centralImage`:

```js
const motionSettings = normalizeMotionSettings(objectRefs[MOTION_SETTINGS_REF_KEY]);
const motionMode = motionSettings.mode;
const videoCount = motionSettings.count;
const videoDirection = motionSettings.direction;
const videoStepSeconds = motionSettings.step_seconds;
const videoEnabled = motionMode === "video";
```

Add UI inside `constructorControls`:

- `Режим`: `Фото`, `Видео`.
- If video: `Видео 1`, `Видео 4`, `По часовой`, `Против часовой`, `1 сек`, `2 сек`, `3 сек`.
- If no `centralImage`: `Сначала добавьте фото клиента / цели`.
- `Видео-фон: needs implementation`.
- `Скачать видеоролик`; click shows `Экспорт видео: needs implementation`.

Stable test markers:

```text
data-motion-mode-switch="true"
data-video-count="1|4"
data-video-direction="clockwise|counterclockwise"
data-video-step-seconds="1|2|3"
data-motion-layer="true"
data-motion-copy="1..4"
data-video-export-button="true"
```

## 6. Motion positions by format

Add helpers near `buildSlotList`:

```js
clockPositions(count, radius = 38, startAngle = -90)
motionCopyOffsets(count, positionsLength)
getMotionPositionsForComposition(draft, slots, variant)
```

Mappings:

- `client`: `clockPositions(Number(draft.geometry) || 4, 38)`.
- `zodiac`: `clockPositions(Number(draft.zodiac_visible_count) || 12, 39)`; plus-extra slots may remain unanimated in Phase 1 if reported.
- `star`: 5 points: top, right, lower-right, lower-left, left.
- `dao`: `clockPositions(5, 36, -90)` unless exact CSS mapping is safer.
- `business`: 3 points: goal top, structure lower-right, function lower-left.
- `altar`: 7 points: top row 5 + bottom supports 2; fallback `clockPositions(7)` if visual mapping is unsafe.
- `chess compact-5`: compact top/right/bottom-right/bottom-left/left.
- `chess plus-8`: outer/inner square clockwise order.
- `chess classic-8`: 3x3 ring around center.
- `chess classic-14`: 5x3 non-center perimeter; never animate through center.

If a mapping is visually unsafe, use fallback `clockPositions(...)`, keep feature working, and report exact fallback.

## 7. Animation algorithm

Use React interval, because timing means delay per position.

```js
const [motionStep, setMotionStep] = useState(0);
useEffect(() => {
  if (!videoEnabled) return undefined;
  const timer = window.setInterval(() => setMotionStep((current) => current + 1), videoStepSeconds * 1000);
  return () => window.clearInterval(timer);
}, [videoEnabled, videoStepSeconds, videoDirection, videoCount, compositionDraft.constructor_type, compositionDraft.geometry, compositionDraft.zodiac_visible_count, compositionDraft.chess_variant]);
```

Direction math:

```js
const directionFactor = videoDirection === "counterclockwise" ? -1 : 1;
const baseIndex = ((motionStep * directionFactor) % positions.length + positions.length) % positions.length;
const offsets = videoCount === 4 ? motionCopyOffsets(4, positions.length) : [0];
const position = positions[(baseIndex + offset) % positions.length];
```

Offsets:

```text
12 -> 0,3,6,9
8 -> 0,2,4,6
5 -> 0,1,2,3
4 -> 0,1,2,3
```

## 8. Motion layer placement

Create `renderPowerPlaceMotionLayer(variant)`.

Insert layer as sibling inside every format sheet, never inside the center photo button:

```text
client -> inside .powerMandala
altar -> inside .altarMandalaSheet
business -> inside .businessMandalaSheet
zodiac -> inside .zodiacMandalaSheet
star -> inside .starMandalaSheet
chess -> inside .power-place-chess before board, or inside board if coordinate alignment requires
dao -> inside .daoMandalaSheet
```

Layer must use `pointer-events: none` and must not block center editing, drag/drop, slots, save, services, feed or print actions.

## 9. CSS integration

File:

```text
src/profileMandalaWorkspace.css
```

Add scoped CSS only under `.profileLitePowerPlace`.

Required selectors:

```text
.powerPlaceMotionLayer
.powerPlaceMotionPhoto
.powerPlaceMotionPhoto--count-4
.powerPlaceMotionControls
.powerPlaceVideoControls
.powerPlaceVideoHint
```

Required behavior:

- parent sheets have `position: relative`.
- motion layer absolute, inset 0, z-index controlled, `pointer-events: none`.
- photos use responsive clamp sizes.
- mobile under 640px reduces photo size.
- `@media (prefers-reduced-motion: reduce)` disables transition.
- no horizontal overflow at 390px.

## 10. UI/UX integration details

Controls must visually match existing constructor controls:

- compact pills/buttons;
- active state consistent with existing `active` buttons;
- RU labels only;
- no extra English UI except existing `needs implementation` project wording.

If `Видео` is active but no center photo exists:

- show settings;
- do not render motion copies;
- show hint `Сначала добавьте фото клиента / цели`.

Switching back to `Фото`:

- hides motion layer;
- preserves video settings in draft;
- saved composition can later return to `Видео` with same settings.

Changing constructor type:

- keep `__motion_settings`;
- reset only visual mapping via new format positions;
- do not erase user’s video settings.

## 11. Export and video background honesty

Video background Phase 1-3:

- visible disabled/info control: `Видео-фон: needs implementation`.
- no fake upload.
- no `data:video` storage.

Export Phase 1-3:

- visible button `Скачать видеоролик`.
- click displays `Экспорт видео: needs implementation`.
- do not connect to PDF helper.
- do not download empty/fake files.

## 12. Tests

Update/add:

```text
test/powerPlaceClient.test.mjs
test/profileLiteCabinetContract.test.mjs
test/powerPlaceStyleContract.test.mjs
```

Must cover:

- `object_refs.__motion_settings` persists.
- invalid settings normalize to defaults.
- valid mode/count/direction/timing survive normalization.
- arbitrary nested objects are not preserved.
- `data:image` and `data:video` are not persisted.
- labels exist: `Фото`, `Видео`, `Видео 1`, `Видео 4`, `По часовой`, `Против часовой`, `1 сек`, `2 сек`, `3 сек`, `Скачать видеоролик`.
- data markers exist where feasible.
- CSS selectors exist.

## 13. Manual QA matrix

Routes:

```text
/
/profile
/profile/mandalas
/profile/services
/masters
/profile/admin
```

Formats in `/profile`:

```text
client geometry 4
client geometry 12
zodiac 12
star
dao
business
altar
chess compact-5
chess plus-8
chess classic-8
chess classic-14
```

Check each relevant format:

- default `Фото` unchanged.
- switch `Видео`.
- `Видео 1` works.
- `Видео 4` works.
- clockwise/counterclockwise works.
- 1/2/3 sec timing works.
- save/reload keeps settings.
- center photo editing and drag/drop still work.
- no mobile overflow.

## 14. Checks

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

## 15. Acceptance criteria

Done only if:

- `Фото` default unchanged.
- `Видео` controls visible and RU-first.
- `Видео 1` animates one copy.
- `Видео 4` animates four copies.
- direction reverses order.
- timing changes delay.
- all formats have mapping or explicit fallback report.
- settings persist via `object_refs.__motion_settings`.
- old compositions load without errors.
- center photo editing/drag/drop still works.
- no mobile overflow.
- video background/export are honest `needs implementation` if not fully built.
- tests/build/check pass.

## 16. Rollback / safety

If exact mapping breaks a format, do not disable whole feature. Use generic `clockPositions(...)` fallback for that format and report it.

If persistence breaks, revert only motion settings persistence and keep `Фото` mode stable.

Do not touch production deploy.

After implementation update:

```text
STATE.md
LOG.md
```

## 17. Codex source of truth

This document is the implementation source of truth for the short Codex `/goal` prompt.
