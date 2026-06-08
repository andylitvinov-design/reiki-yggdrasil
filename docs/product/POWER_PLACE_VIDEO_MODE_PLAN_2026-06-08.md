# Power Place Video Mode — one-prompt implementation program

Дата: 2026-06-08
Проект: Reiki Yggdrasil
Repo: `andylitvinov-design/reiki-yggdrasil`
Target branch для реализации: `main`
Статус: technical implementation program for Codex

## 1. Цель апдейта

Нужно добавить в мастерскую мандал универсальный режим:

```text
Фото / Видео
```

`Фото` — текущий статический режим мандалы. Он должен остаться полностью совместимым и визуально неизменным.

`Видео` — новый live-анимационный режим поверх текущей мандалы. Он использует центральное фото и добавляет движущиеся копии фото по позициям мандалы, как по часам.

Настройки режима `Видео`:

1. Количество:
   - `Видео 1` — одна копия центрального фото рядом с центром, движется по позициям мандалы.
   - `Видео 4` — четыре копии центрального фото рядом с центром, движутся по позициям мандалы с равномерным смещением.
2. Вектор:
   - `По часовой`.
   - `Против часовой`.
3. Тайминг:
   - `1 сек`.
   - `2 сек`.
   - `3 сек`.
4. Видео-фон:
   - отдельная настройка, но в первом безопасном внедрении может быть `needs implementation`, потому что текущий media client не поддерживает video MIME.
5. Скачать видеоролик:
   - кнопка должна быть видимой.
   - в первом безопасном внедрении должна честно показывать `Экспорт видео: needs implementation`, если реальный WebM/MP4 export не реализован.

Главный принцип движения: если в формате 4 позиции — 4 переключения по кругу; если 12 — 12 переключений. Анимация зациклена.

## 2. Инфраструктурные ограничения проекта

- Framework: Vite + React.
- Hosting: Vercel.
- Build: `npm run build`.
- Output: `dist`.
- Current / legacy live URL: `https://reiki-yggdrasil.vercel.app`.
- Target production URL from repo docs: `https://mentalica.vercel.app`.
- Draft QA site concept: `https://2mentalica.vercel.app` — needs verification.

Env names only:

```text
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
VITE_ADMIN_EMAIL
```

Do not expose env values.

Do not change:

- public homepage `/`;
- `/profile`;
- `/profile/mandalas`;
- `/profile/services`;
- `/masters`;
- `/profile/admin`;
- Supabase auth flow;
- Vercel rewrites;
- production branch/deploy config;
- RU-default UI;
- desktop three-column layout;
- mobile fallback;
- public master privacy filtering.

## 3. Где в проекте зафиксированы форматы мандал

### 3.1 React component formats

File:

```text
src/pages/profile-lite/ProfileLitePowerPlaceModuleBase.jsx
```

Existing constructor formats are in `CONSTRUCTOR_TYPES`:

```text
zodiac
star
chess
client
altar
business
dao
```

Do not add a new constructor type called `video`. Video is a display/motion mode layered over the current constructor type.

Format-related constants in the same file:

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

The current slot factory is:

```text
buildSlotList(draft)
```

It already knows how to produce slot lists for:

```text
client
zodiac
star
chess
altar
business
dao
```

This function or a new helper next to it must be the base for video motion position mapping.

### 3.2 Draft state / page state

File:

```text
src/pages/ProfileLitePage.jsx
```

Important existing code points:

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
handleCompositionObjectFileUpload(slotId, file)
handleCompositionCoverFileUpload(layer, file)
openPowerPlacePdfPrintView(title)
```

`openPowerPlacePdfPrintView` is only for PDF/print. Do not use it for video export.

### 3.3 Persistence client

File:

```text
src/lib/powerPlaceClient.js
```

Important existing code points:

```text
normalizePowerPlaceComposition(composition)
cleanObjectRefs(value)
collectCompositionStorageRefs(row)
hydrateCompositionRowsWithSignedUrls(rows, signedUrls)
createPowerPlaceComposition(...)
updatePowerPlaceComposition(...)
```

Important: `normalizePowerPlaceComposition` whitelists persisted fields. Unknown top-level fields will be dropped or can fail if sent to Supabase as unknown columns.

### 3.4 Supabase table / migrations

Relevant migrations show that `profile_cabinet_power_place_compositions` has top-level columns for current formats and settings, but no top-level video columns yet.

Known columns added across migrations include:

```text
constructor_type
geometry
altar_center_ratio
cover_ref
object_refs
central_photo_id
tradition_id
tradition_title
business_vertex_zone_count
resource_comparison_mode
resource_without_mandala_comment
resource_with_mandala_comment
zodiac_visible_count
star_variant
chess_variant
```

Constructor type constraints were expanded over time:

```text
client, altar
client, altar, business, dao
client, altar, business, dao, zodiac
client, altar, business, dao, zodiac, star
client, altar, business, dao, zodiac, star, chess
```

`chess_variant` supports:

```text
classic-14
classic-8
plus-8
compact-5
```

Technical decision for one-prompt implementation: do not add a migration for video fields in this pass. Store video settings in `object_refs.__motion_settings` and update `cleanObjectRefs` to preserve only this known object key safely.

### 3.5 Media client / video background blocker

File:

```text
src/lib/profileMediaClient.js
```

Current media validation allows images, audio, PDFs, TXT/MD/DOC/DOCX, but not video MIME types. Current limit is 5 MB and current validation messages are image-oriented.

Therefore real video background upload is Phase 4, not part of the first safe one-prompt implementation unless Codex explicitly extends media validation and tests it.

## 4. One-prompt implementation scope

This one Codex prompt should implement:

### Must implement now

1. `Фото / Видео` switch.
2. `Видео 1 / Видео 4` switch.
3. `По часовой / Против часовой` switch.
4. `1 сек / 2 сек / 3 сек` switch.
5. Live looped step animation by mandala positions.
6. Position mapping for all current formats, with safe fallback where exact mapping is risky.
7. Save/load of settings through `object_refs.__motion_settings`.
8. Honest `Видео-фон: needs implementation` control/message.
9. Honest `Скачать видеоролик` button/message: `Экспорт видео: needs implementation`.
10. Tests for persistence, UI labels and CSS selectors.

### Must not implement now unless fully safe

1. Real video upload.
2. Real WebM/MP4 export.
3. Supabase migration for top-level video columns.
4. New production deploy/release flow.

## 5. Data model for first implementation

Store settings inside `object_refs`:

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
{
  mode: "photo",
  count: 1,
  direction: "clockwise",
  step_seconds: 2,
  video_background_ref: ""
}
```

Do not add these as unknown top-level Supabase columns in this pass.

## 6. Required changes by file

### 6.1 `src/lib/powerPlaceClient.js`

Add constants near existing ref-key constants:

```js
const MOTION_SETTINGS_REF_KEY = "__motion_settings";
const VALID_MOTION_MODES = ["photo", "video"];
const VALID_VIDEO_COUNTS = [1, 4];
const VALID_VIDEO_DIRECTIONS = ["clockwise", "counterclockwise"];
const VALID_VIDEO_STEP_SECONDS = [1, 2, 3];
```

Add normalizer:

```js
function normalizeMotionSettings(value) {
  const source = value && typeof value === "object" && !Array.isArray(value) ? value : {};
  const mode = VALID_MOTION_MODES.includes(cleanText(source.mode)) ? cleanText(source.mode) : "photo";
  const count = VALID_VIDEO_COUNTS.includes(Number(source.count)) ? Number(source.count) : 1;
  const direction = VALID_VIDEO_DIRECTIONS.includes(cleanText(source.direction)) ? cleanText(source.direction) : "clockwise";
  const stepSeconds = VALID_VIDEO_STEP_SECONDS.includes(Number(source.step_seconds)) ? Number(source.step_seconds) : 2;
  return {
    mode,
    count,
    direction,
    step_seconds: stepSeconds,
    video_background_ref: cleanText(source.video_background_ref)
  };
}
```

Modify `cleanObjectRefs(value)` so it still cleans normal slot refs, but preserves exactly `__motion_settings` as an object:

```js
function cleanObjectRefs(value) {
  const source = cleanJsonObject(value);
  const refs = Object.fromEntries(
    Object.entries(source)
      .filter(([key]) => key !== MOTION_SETTINGS_REF_KEY)
      .map(([key, item]) => [cleanText(key), cleanText(item)])
      .filter(([key, item]) => key && isPersistableImageRef(item))
  );
  if (Object.hasOwn(source, MOTION_SETTINGS_REF_KEY)) {
    refs[MOTION_SETTINGS_REF_KEY] = normalizeMotionSettings(source[MOTION_SETTINGS_REF_KEY]);
  }
  return refs;
}
```

In `normalizePowerPlaceComposition`, after `const objectRefs = cleanObjectRefs(sourceObjectRefs);`, ensure defaults are always present:

```js
objectRefs[MOTION_SETTINGS_REF_KEY] = normalizeMotionSettings(sourceObjectRefs[MOTION_SETTINGS_REF_KEY]);
```

Do not add top-level columns to returned payload for motion settings in this first pass.

If video background is later implemented, update `collectCompositionStorageRefs(row)` to include:

```js
const motionSettings = cleanJsonObject(row?.object_refs?.[MOTION_SETTINGS_REF_KEY]);
if (isStorageRef(motionSettings.video_background_ref)) refs.push(motionSettings.video_background_ref);
```

But for first pass, video background remains `needs implementation`.

### 6.2 `src/pages/ProfileLitePage.jsx`

Add the same key constant near existing ref keys:

```js
const MOTION_SETTINGS_REF_KEY = "__motion_settings";
```

Do not add unknown top-level video columns to `EMPTY_COMPOSITION`. Instead, add default motion settings inside `object_refs` when needed.

Add helper near `normalizeProfileLiteReport`:

```js
function normalizeMotionSettings(value) {
  const source = value && typeof value === "object" && !Array.isArray(value) ? value : {};
  const mode = source.mode === "video" ? "video" : "photo";
  const count = Number(source.count) === 4 ? 4 : 1;
  const direction = source.direction === "counterclockwise" ? "counterclockwise" : "clockwise";
  const stepSeconds = [1, 2, 3].includes(Number(source.step_seconds)) ? Number(source.step_seconds) : 2;
  return { mode, count, direction, step_seconds: stepSeconds, video_background_ref: String(source.video_background_ref || "") };
}
```

Add helper:

```js
function withDefaultMotionSettings(composition) {
  const objectRefs = composition?.object_refs || {};
  return {
    ...composition,
    object_refs: {
      ...objectRefs,
      [MOTION_SETTINGS_REF_KEY]: normalizeMotionSettings(objectRefs[MOTION_SETTINGS_REF_KEY])
    }
  };
}
```

Use `withDefaultMotionSettings(...)` in:

- initial `EMPTY_COMPOSITION` usage if needed;
- `handleCompositionLoad(composition)`;
- `refreshSavedCompositions(saved)` when setting `compositionDraft`;
- after save in `handleCompositionSaveNew()`;
- after update where needed.

Extend `handleCompositionDraftChange(field, value)`:

If field starts with `motion_` or equals one of:

```text
motion_mode
video_count
video_direction
video_step_seconds
video_background_ref
```

then update `object_refs.__motion_settings` instead of top-level fields.

Mapping:

```text
motion_mode -> mode
video_count -> count
video_direction -> direction
video_step_seconds -> step_seconds
video_background_ref -> video_background_ref
```

Pseudo:

```js
if (["motion_mode", "video_count", "video_direction", "video_step_seconds", "video_background_ref"].includes(field)) {
  return {
    ...current,
    object_refs: {
      ...(current.object_refs || {}),
      [MOTION_SETTINGS_REF_KEY]: normalizeMotionSettings({
        ...((current.object_refs || {})[MOTION_SETTINGS_REF_KEY] || {}),
        [mappedField]: value
      })
    }
  };
}
```

Do not break existing special handling for report, field_layout, field_scale, center image scale, slot_scale.

### 6.3 `src/pages/profile-lite/ProfileLitePowerPlaceModuleBase.jsx`

Add constant:

```js
const MOTION_SETTINGS_REF_KEY = "__motion_settings";
```

Add local normalizer:

```js
function normalizeMotionSettings(value) { ...same shape... }
```

Derive after `objectRefs` and `centralImage`:

```js
const motionSettings = normalizeMotionSettings(objectRefs[MOTION_SETTINGS_REF_KEY]);
const motionMode = motionSettings.mode;
const videoCount = motionSettings.count;
const videoDirection = motionSettings.direction;
const videoStepSeconds = motionSettings.step_seconds;
const videoEnabled = motionMode === "video";
```

Add UI controls inside `constructorControls`, after constructor-specific format controls and before scale sliders:

```jsx
<div className="powerPlaceMotionControls" aria-label="Режим мандалы">
  <span>Режим</span>
  <button className={motionMode === "photo" ? "active" : ""} onClick={() => onCompositionDraftChange("motion_mode", "photo")} type="button">Фото</button>
  <button className={motionMode === "video" ? "active" : ""} onClick={() => onCompositionDraftChange("motion_mode", "video")} type="button">Видео</button>
</div>
```

If `videoEnabled`, render:

```jsx
<div className="powerPlaceVideoControls" aria-label="Настройки видео мандалы">
  <span>Количество</span>
  <button ...>Видео 1</button>
  <button ...>Видео 4</button>
  <span>Вектор</span>
  <button ...>По часовой</button>
  <button ...>Против часовой</button>
  <span>Тайминг</span>
  <button ...>1 сек</button>
  <button ...>2 сек</button>
  <button ...>3 сек</button>
  <button type="button" className="cabinetSecondary" disabled title="Видео-фон требует отдельной поддержки video upload">Видео-фон: needs implementation</button>
  <button type="button" className="cabinetSecondary" onClick={() => set local message or use composition message if prop exists}>Скачать видеоролик</button>
  {!centralImage && <small>Сначала добавьте фото клиента / цели</small>}
</div>
```

The `Скачать видеоролик` click must not fake export. It should show or alert:

```text
Экспорт видео: needs implementation
```

If there is no message setter prop, use `window.alert(...)` as MVP, or add a small local state in this component.

## 7. Motion position mapping for all formats

Add helpers near `buildSlotList`.

### 7.1 Generic clock positions

```js
function clockPositions(count, radius = 38, startAngle = -90) {
  const total = Math.max(2, Number(count) || 4);
  return Array.from({ length: total }, (_, index) => {
    const angle = startAngle + (360 / total) * index;
    const radians = angle * (Math.PI / 180);
    return {
      id: `clock-${total}-${index + 1}`,
      x: 50 + radius * Math.cos(radians),
      y: 50 + radius * Math.sin(radians),
      label: `${index + 1}`
    };
  });
}
```

### 7.2 `client`

Source:

```text
GEOMETRIES
compositionDraft.geometry
buildSlotList(draft) client branch
```

Implementation:

```js
function getClientMotionPositions(draft) {
  return clockPositions(Number(draft.geometry) || 4, 38);
}
```

### 7.3 `zodiac`

Source:

```text
ZODIAC_VARIANTS
ZODIAC_SIGNS
ZODIAC_PLUS_SLOT_LAYOUT
compositionDraft.zodiac_visible_count
compositionDraft.zodiac_variant
```

Implementation:

```js
function getZodiacMotionPositions(draft) {
  return clockPositions(Number(draft.zodiac_visible_count) || 12, 39);
}
```

For `plus` variants, first implementation may still use visible count around the main zodiac circle. Report plus-extra positions as not separately animated if not mapped.

### 7.4 `star`

Source:

```text
STAR_POINTS
```

Use visual star order:

```js
function getStarMotionPositions() {
  return [
    { id: "star-top", x: 50, y: 13, label: "Верхний луч" },
    { id: "star-right", x: 82, y: 38, label: "Правый луч" },
    { id: "star-lower-right", x: 70, y: 78, label: "Нижний правый луч" },
    { id: "star-lower-left", x: 30, y: 78, label: "Нижний левый луч" },
    { id: "star-left", x: 18, y: 38, label: "Левый луч" }
  ];
}
```

### 7.5 `dao`

Source:

```text
DAO_ELEMENTS
```

Use stable visual clock-like order. If current CSS positions differ, adjust after inspecting CSS.

First implementation fallback:

```js
function getDaoMotionPositions() {
  return clockPositions(5, 36, -90);
}
```

### 7.6 `business`

Source:

```text
BUSINESS_VERTICES
business_vertex_zone_count
```

Minimum safe version: animate around three main vertices, not all zones.

```js
function getBusinessMotionPositions() {
  return [
    { id: "business-goal", x: 50, y: 16, label: "Цель" },
    { id: "business-structure", x: 78, y: 72, label: "Структура" },
    { id: "business-function", x: 22, y: 72, label: "Функция" }
  ];
}
```

### 7.7 `altar`

Source:

```text
buildSlotList altar branch
altarTopRow
altarBottomSupports
```

Minimum safe version:

```js
function getAltarMotionPositions() {
  return [
    { id: "altar-top-1", x: 18, y: 18, label: "Верхний 1" },
    { id: "altar-top-2", x: 34, y: 14, label: "Верхний 2" },
    { id: "altar-top-3", x: 50, y: 12, label: "Верхний центр" },
    { id: "altar-top-4", x: 66, y: 14, label: "Верхний 4" },
    { id: "altar-top-5", x: 82, y: 18, label: "Верхний 5" },
    { id: "altar-support-2", x: 68, y: 82, label: "Нижняя опора 2" },
    { id: "altar-support-1", x: 32, y: 82, label: "Нижняя опора 1" }
  ];
}
```

If visually wrong after QA, use `clockPositions(7)` and report fallback.

### 7.8 `chess`

Source:

```text
CHESS_VARIANTS
CHESS_SLOT_LAYOUTS
compositionDraft.chess_variant
```

Implement all current variants:

#### compact-5

Use existing compact pentagon visual order:

```js
function getChessCompact5MotionPositions() {
  return [
    { id: "compact-top", x: 50, y: 17 },
    { id: "compact-right", x: 76, y: 42 },
    { id: "compact-bottom-right", x: 65, y: 76 },
    { id: "compact-bottom-left", x: 35, y: 76 },
    { id: "compact-left", x: 24, y: 42 }
  ];
}
```

#### plus-8

Use existing outer/inner square positions in clockwise order:

```js
function getChessPlus8MotionPositions() {
  return [
    { id: "outer-top-left", x: 15, y: 15 },
    { id: "outer-top-right", x: 85, y: 15 },
    { id: "inner-top-right", x: 61, y: 39 },
    { id: "outer-bottom-right", x: 85, y: 85 },
    { id: "inner-bottom-right", x: 61, y: 61 },
    { id: "outer-bottom-left", x: 15, y: 85 },
    { id: "inner-bottom-left", x: 39, y: 61 },
    { id: "inner-top-left", x: 39, y: 39 }
  ];
}
```

#### classic-8

Use 3x3 ring around center:

```js
function getChessClassic8MotionPositions() {
  return [
    { id: "r1c1", x: 18, y: 18 },
    { id: "r1c2", x: 50, y: 18 },
    { id: "r1c3", x: 82, y: 18 },
    { id: "r2c3", x: 82, y: 50 },
    { id: "r3c3", x: 82, y: 82 },
    { id: "r3c2", x: 50, y: 82 },
    { id: "r3c1", x: 18, y: 82 },
    { id: "r2c1", x: 18, y: 50 }
  ];
}
```

#### classic-14

Use 5x3 visual perimeter around center. The center is row 3 col 2. Use a safe approximate perimeter:

```js
function getChessClassic14MotionPositions() {
  return [
    { id: "r1c1", x: 18, y: 10 },
    { id: "r1c2", x: 50, y: 10 },
    { id: "r1c3", x: 82, y: 10 },
    { id: "r2c3", x: 82, y: 30 },
    { id: "r3c3", x: 82, y: 50 },
    { id: "r4c3", x: 82, y: 70 },
    { id: "r5c3", x: 82, y: 90 },
    { id: "r5c2", x: 50, y: 90 },
    { id: "r5c1", x: 18, y: 90 },
    { id: "r4c1", x: 18, y: 70 },
    { id: "r3c1", x: 18, y: 50 },
    { id: "r2c1", x: 18, y: 30 },
    { id: "r2c2", x: 50, y: 30 },
    { id: "r4c2", x: 50, y: 70 }
  ];
}
```

This supports 14 moving positions around the central cell without treating center as orbit point.

### 7.9 Master dispatcher

```js
function getMotionPositionsForComposition(draft, slots, variant = draft.constructor_type) {
  if (variant === "client") return getClientMotionPositions(draft);
  if (variant === "zodiac") return getZodiacMotionPositions(draft);
  if (variant === "star") return getStarMotionPositions();
  if (variant === "dao") return getDaoMotionPositions();
  if (variant === "business") return getBusinessMotionPositions(draft);
  if (variant === "altar") return getAltarMotionPositions();
  if (variant === "chess") return getChessMotionPositions(draft);
  return clockPositions(Math.max(slots?.length || 4, 4));
}
```

## 8. Видео 1 / Видео 4 offset logic

Add:

```js
function motionCopyOffsets(count, positionsLength) {
  if (count !== 4) return [0];
  if (positionsLength <= 0) return [0, 0, 0, 0];
  return [0, 1, 2, 3].map((index) => Math.floor((positionsLength * index) / 4));
}
```

Examples:

```text
12 positions -> 0, 3, 6, 9
8 positions -> 0, 2, 4, 6
5 positions -> 0, 1, 2, 3
4 positions -> 0, 1, 2, 3
3 positions -> 0, 0/1/2 pattern by floor; report if visually crowded
```

## 9. Step animation logic

Use React interval state, not CSS-only keyframes, because the requirement is delay on every position.

In component:

```js
const [motionStep, setMotionStep] = useState(0);

useEffect(() => {
  if (!videoEnabled) return undefined;
  const timer = window.setInterval(() => {
    setMotionStep((current) => current + 1);
  }, videoStepSeconds * 1000);
  return () => window.clearInterval(timer);
}, [videoEnabled, videoStepSeconds, videoDirection, videoCount, compositionDraft.constructor_type, compositionDraft.geometry, compositionDraft.zodiac_visible_count, compositionDraft.chess_variant]);
```

Rendering math:

```js
const directionFactor = videoDirection === "counterclockwise" ? -1 : 1;
const baseIndex = ((motionStep * directionFactor) % positions.length + positions.length) % positions.length;
const offsets = videoCount === 4 ? motionCopyOffsets(4, positions.length) : [0];
const position = positions[(baseIndex + offset) % positions.length];
```

## 10. Motion layer renderer

Add inside `ProfileLitePowerPlaceModuleBase.jsx`:

```jsx
const renderPowerPlaceMotionLayer = (variant = compositionDraft.constructor_type) => {
  if (!videoEnabled || !centralImage) return null;
  const positions = getMotionPositionsForComposition(compositionDraft, slots, variant);
  if (positions.length < 2) return null;
  const directionFactor = videoDirection === "counterclockwise" ? -1 : 1;
  const baseIndex = ((motionStep * directionFactor) % positions.length + positions.length) % positions.length;
  const offsets = videoCount === 4 ? motionCopyOffsets(4, positions.length) : [0];

  return (
    <div className={`powerPlaceMotionLayer powerPlaceMotionLayer--${variant}`} aria-hidden="true">
      {offsets.map((offset, index) => {
        const position = positions[(baseIndex + offset) % positions.length];
        return (
          <span
            className={`powerPlaceMotionPhoto powerPlaceMotionPhoto--copy-${index + 1} powerPlaceMotionPhoto--count-${videoCount}`}
            key={`${variant}-${index}`}
            style={{ left: `${position.x}%`, top: `${position.y}%`, backgroundImage: `url(${centralImage})` }}
          />
        );
      })}
    </div>
  );
};
```

This layer must use `pointer-events: none` and must not be placed inside the center photo button.

## 11. Where to insert motion layer

Insert in every render branch:

### client branch

Inside:

```jsx
<div className={`powerMandala ...`}>
```

Add:

```jsx
{renderPowerPlaceMotionLayer("client")}
```

### altar branch

Inside:

```jsx
<div className={`altarMandalaSheet ...`}>
```

Add:

```jsx
{renderPowerPlaceMotionLayer("altar")}
```

### business branch

Inside:

```jsx
<div className={`businessMandalaSheet ...`}>
```

Add:

```jsx
{renderPowerPlaceMotionLayer("business")}
```

### zodiac branch

Inside `.zodiacMandalaSheet`, not outside the fragment:

```jsx
{renderPowerPlaceMotionLayer("zodiac")}
```

### star branch

Inside `.starMandalaSheet`:

```jsx
{renderPowerPlaceMotionLayer("star")}
```

### chess branch

Prefer inside `.power-place-chess`, before `.power-place-chess__board`, if overlay coordinates should span the whole chess card:

```jsx
<div className={`power-place-chess ...`}>
  {renderPowerPlaceMotionLayer("chess")}
  <div className="power-place-chess__board" ...>
```

If z-index or coordinates mismatch, move inside `.power-place-chess__board` and set board `position: relative`.

### dao branch

Inside `.daoMandalaSheet`:

```jsx
{renderPowerPlaceMotionLayer("dao")}
```

## 12. CSS to add

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
.profileLitePowerPlace .power-place-chess {
  position: relative;
}

.profileLitePowerPlace .powerPlaceMotionLayer {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 6;
  overflow: visible;
}

.profileLitePowerPlace .powerPlaceMotionPhoto {
  position: absolute;
  width: clamp(42px, 14%, 72px);
  aspect-ratio: 1 / 1;
  border-radius: 999px;
  background-size: cover;
  background-position: center;
  transform: translate(-50%, -50%);
  transition: left 0.42s ease, top 0.42s ease;
  box-shadow: 0 10px 22px rgba(48, 30, 8, 0.22), 0 0 0 2px rgba(255, 229, 157, 0.62);
}

.profileLitePowerPlace .powerPlaceMotionPhoto--count-4 {
  width: clamp(34px, 11%, 58px);
}

.profileLitePowerPlace .powerPlaceMotionControls,
.profileLitePowerPlace .powerPlaceVideoControls {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 7px;
}

.profileLitePowerPlace .powerPlaceMotionControls button,
.profileLitePowerPlace .powerPlaceVideoControls button {
  border: 1px solid rgba(184, 121, 29, 0.28);
  border-radius: 999px;
  padding: 7px 11px;
  background: rgba(255, 255, 255, 0.68);
  color: #744c17;
  font-size: 12px;
  font-weight: 800;
}

.profileLitePowerPlace .powerPlaceMotionControls button.active,
.profileLitePowerPlace .powerPlaceVideoControls button.active {
  border-color: rgba(245, 198, 106, 0.72);
  background: linear-gradient(180deg, #2a1a09, #8c570d);
  color: #fff0cd;
}

.profileLitePowerPlace .powerPlaceVideoHint {
  flex-basis: 100%;
  color: #7a5a24;
  font-size: 12px;
}

@media (prefers-reduced-motion: reduce) {
  .profileLitePowerPlace .powerPlaceMotionPhoto {
    transition: none;
  }
}
```

Mobile: if motion photos overflow on 390px width, reduce width in existing `@media (max-width: 640px)`:

```css
.profileLitePowerPlace .powerPlaceMotionPhoto {
  width: clamp(30px, 10vw, 48px);
}
```

## 13. Video background implementation status

For one-prompt Phase 1-3:

- show disabled or informational `Видео-фон: needs implementation`.
- do not upload video yet.

Reason: `profileMediaClient.js` does not currently allow video MIME types and uses a 5 MB limit. Real video background requires Phase 4:

1. Add video MIME whitelist: `video/mp4`, `video/webm`, `video/quicktime`.
2. Add separate video max bytes.
3. Add `validateProfileVideoFile(file)`.
4. Add `kind === "video-background"` to `buildProfileMediaPath`.
5. Add `handleCompositionVideoBackgroundUpload(file)` in `ProfileLitePage.jsx`.
6. Store only storage ref, not `data:video`.
7. Add signing/hydration for `video_background_ref`.

## 14. Download video implementation status

For one-prompt Phase 1-3:

- show button `Скачать видеоролик`.
- click shows `Экспорт видео: needs implementation`.
- do not connect it to PDF.
- do not fake download.

Real export is Phase 5 and requires canvas/MediaRecorder/CORS analysis.

## 15. Tests to update

### `test/powerPlaceClient.test.mjs`

Add tests:

- `normalizePowerPlaceComposition` preserves `object_refs.__motion_settings`.
- invalid motion settings normalize to defaults.
- valid settings survive create/update payload normalization.
- `data:image` and `data:video` are not persisted.

### `test/profileLiteCabinetContract.test.mjs`

Assert labels exist:

```text
Фото
Видео
Видео 1
Видео 4
По часовой
Против часовой
1 сек
2 сек
3 сек
Скачать видеоролик
```

### `test/powerPlaceStyleContract.test.mjs`

Assert CSS exists:

```text
.powerPlaceMotionLayer
.powerPlaceMotionPhoto
.powerPlaceMotionControls
.powerPlaceVideoControls
prefers-reduced-motion
```

## 16. Required checks

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

Manual QA:

```text
/
/profile
/profile/mandalas
/profile/services
/masters
/profile/admin
```

Inside `/profile`:

1. Open mandala workshop.
2. Confirm default `Фото` is unchanged.
3. Add/select central photo.
4. Switch to `Видео`.
5. Test `Видео 1`.
6. Test `Видео 4`.
7. Test clockwise/counterclockwise.
8. Test timing 1/2/3.
9. Test client geometry 4 and 12.
10. Test zodiac 12.
11. Test star.
12. Test dao.
13. Test business.
14. Test altar.
15. Test chess compact-5, plus-8, classic-8, classic-14.
16. Save and reload composition.
17. Confirm motion settings persisted in `object_refs.__motion_settings`.
18. Confirm center photo editing and drag/drop still work.
19. Confirm no mobile horizontal overflow.
20. Confirm PDF/print still works.
21. Confirm export button is honest.

## 17. One-prompt Codex prompt

```text
Repo: andylitvinov-design/reiki-yggdrasil
Target branch: main
Mode: minimal safe implementation
Feature: universal Photo / Video mode for all Power Place mandala formats

Read first:
AGENTS.md, README.md, STATE.md, LOG.md, docs/release-workflow.md, docs/deploy-fallback.md, package.json, vercel.json, src/main.jsx, src/App.jsx, src/index.css, src/lib/supabaseClient.js, src/lib/powerPlaceClient.js, src/lib/profileMediaClient.js, src/pages/ProfileLitePage.jsx, src/pages/profile-lite/ProfileLitePowerPlaceModuleBase.jsx, src/profileMandalaWorkspace.css, relevant Supabase migrations for profile_cabinet_power_place_compositions.

Do not implement a new constructor_type. Video is a mode layered over existing formats: client, altar, business, dao, zodiac, star, chess.

Implement in one pass:
1. Add `Фото / Видео` switch in constructor controls.
2. In `Видео`, add switches: `Видео 1 / Видео 4`, `По часовой / Против часовой`, `1 сек / 2 сек / 3 сек`.
3. Store settings in `object_refs.__motion_settings`, not in new top-level Supabase columns.
4. Update `src/lib/powerPlaceClient.js` so `cleanObjectRefs` preserves exactly `__motion_settings` as a normalized object while still cleaning all normal image refs.
5. Update `normalizePowerPlaceComposition` to always normalize and persist `object_refs.__motion_settings`.
6. Update `src/pages/ProfileLitePage.jsx` so `handleCompositionDraftChange` maps `motion_mode`, `video_count`, `video_direction`, `video_step_seconds`, `video_background_ref` into `object_refs.__motion_settings`.
7. Update `handleCompositionLoad`, `refreshSavedCompositions`, save/update flows so saved compositions hydrate with default motion settings and do not lose settings.
8. In `ProfileLitePowerPlaceModuleBase.jsx`, derive motion settings from `objectRefs.__motion_settings`.
9. Add motion position helpers for all formats:
   - client: geometry positions.
   - zodiac: zodiac visible count positions.
   - star: 5 star points.
   - dao: 5 clock-like positions.
   - business: 3 main triangle vertices.
   - altar: 7 visible altar positions or safe fallback.
   - chess compact-5: compact pentagon positions.
   - chess plus-8: outer/inner square positions.
   - chess classic-8: 3x3 ring around center.
   - chess classic-14: 5x3 perimeter around center.
10. Use React interval step animation with `video_step_seconds`, not CSS-only keyframes.
11. `Видео 1` renders one duplicate central photo moving through positions.
12. `Видео 4` renders four duplicate central photos with even offsets.
13. Direction controls order: clockwise/counterclockwise.
14. Motion layer must use `pointer-events: none` and must not block center photo editing, drag/drop, object slots, save, print, services or feed actions.
15. Insert motion layer inside each render branch: client, altar, business, zodiac, star, chess, dao.
16. Add CSS in `src/profileMandalaWorkspace.css`: `.powerPlaceMotionLayer`, `.powerPlaceMotionPhoto`, `.powerPlaceMotionControls`, `.powerPlaceVideoControls`, reduced-motion support, mobile-safe sizing.
17. Add visible `Видео-фон: needs implementation` control/message. Do not upload video yet unless media validation/storage is safely extended and tested.
18. Add visible `Скачать видеоролик` button. Do not fake export. On click show `Экспорт видео: needs implementation` unless real WebM export is fully implemented and tested. Do not connect to PDF.
19. Add/update tests: `test/powerPlaceClient.test.mjs`, `test/profileLiteCabinetContract.test.mjs`, `test/powerPlaceStyleContract.test.mjs`.
20. Do not change public homepage, /masters public page, /profile/admin, Supabase auth, Vercel rewrites, env values, production branch, RU-default UI, desktop/mobile layout.

Run:
npm run test:power-place
npm run test:profile-lite
npm run test:profile-media
npm run test:profile-services
npm run build
npm run check
git diff --check

Manual QA:
/, /profile, /profile/mandalas, /profile/services, /masters, /profile/admin.
In /profile test all formats: client 4/12, zodiac 12, star, dao, business, altar, chess compact-5, plus-8, classic-8, classic-14. Save and reload. Confirm `object_refs.__motion_settings` persists. Confirm no mobile overflow. Confirm center photo editing and drag/drop still work. Confirm export/video background are honest needs implementation if not fully built.

Report:
changed files, implementation summary, exact persistence choice, supported formats, any fallback formats, video background status, export status, checks with exit codes, manual QA, risks, not verified, whether STATE.md/LOG.md were updated.
```

## 18. After implementation

After real code implementation, update:

```text
STATE.md
LOG.md
```

Also update this document if the final persistence or export architecture changes.
