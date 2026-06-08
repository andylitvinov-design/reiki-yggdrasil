# Power Place Video Mode Plan — technical implementation

Дата: 2026-06-08
Проект: Reiki Yggdrasil
Repo: `andylitvinov-design/reiki-yggdrasil`
Target branch для реализации: `main`
Статус: docs-only technical plan for Codex

## 1. Цель

Добавить в мастерскую мандал универсальный режим `Фото / Видео`.

`Фото` — текущий статический режим. Он должен остаться визуально и функционально неизменным.

`Видео` — новый анимационный слой поверх текущей мандалы. Он использует центральное фото, добавляет 1 или 4 движущиеся копии фото, направление движения, тайминг, опциональный видео-фон и кнопку скачивания ролика.

Главный принцип: движение идёт по позициям мандалы как по часам. Если в формате 4 позиции — цикл из 4 шагов. Если 12 — из 12 шагов. Анимация зациклена.

## 2. Инфраструктура и ограничения

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

Do not change public homepage `/`, `/profile`, `/masters`, `/profile/admin`, Supabase auth flow, Vercel rewrites, production branch/deploy config, RU-default UI, desktop three-column layout, mobile fallback, or public master privacy filtering.

## 3. Files to inspect before code

Codex must read:

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
src/lib/powerPlaceClient.js
src/lib/profileMediaClient.js
src/pages/ProfileLitePage.jsx
src/pages/profile-lite/ProfileLitePowerPlaceModuleBase.jsx
src/profileMandalaWorkspace.css
```

If missing, report `not found`.

## 4. Current code map

### 4.1 `src/pages/ProfileLitePage.jsx`

This file owns the draft state, save/load bridge, upload handlers, and PDF print helper.

Use these exact areas:

- `EMPTY_COMPOSITION` — add default video fields here.
- `compositionDraft` state — current active composition draft.
- `handleCompositionDraftChange(field, value)` — route new UI fields through this dispatcher.
- `handleCompositionLoad(composition)` — hydrate saved composition with defaults.
- `refreshSavedCompositions(saved)` — make sure refreshed draft keeps video fields.
- `handleCompositionSaveNew()` — sends create payload to `createPowerPlaceComposition`.
- `handleCompositionUpdateExisting()` — sends update payload to `updatePowerPlaceComposition`.
- `saveCompositionForServiceAction()` — saves before service actions; video settings must not be lost.
- `handleUploadedCentralPhoto(file)` — central photo upload and `object_refs.__center_image` assignment.
- `handleCompositionObjectFileUpload(slotId, file)` — object slot upload.
- `handleCompositionCoverFileUpload(layer, file)` — current image cover upload.
- `openPowerPlacePdfPrintView(title)` — PDF/print only. Do not reuse this for video export.

### 4.2 `src/pages/profile-lite/ProfileLitePowerPlaceModuleBase.jsx`

This file renders the mandala constructor and should get the live animation UI.

Use these exact areas:

- `CONSTRUCTOR_TYPES` — do not add `video`; video is not a constructor type.
- `CHESS_VARIANTS`, `ZODIAC_VARIANTS`, `STAR_POINTS`, `DAO_ELEMENTS`, `BUSINESS_VERTICES` — use for motion position mapping.
- `buildSlotList(draft)` — reuse current slot logic for position mapping.
- derived values near `objectRefs`, `centralImageRef`, `centralDisplayCandidate`, `centralImage` — derive motion settings here.
- `renderCenterPhotoWithMode(className)` — keep as-is for editable center photo; motion overlay must not block it.
- `renderScaleControl(...)` — reuse UI pattern if useful.
- `constructorControls` block — add `Фото / Видео` and video settings here.
- render branches for `client`, `altar`, `business`, `zodiac`, `star`, `chess`, `dao` — insert motion layer inside each sheet/panel.

### 4.3 `src/lib/powerPlaceClient.js`

This file normalizes and persists Power Place compositions.

Critical points:

- `normalizePowerPlaceComposition(composition)` currently whitelists fields. New video fields will be dropped unless explicitly handled.
- `cleanObjectRefs(value)` currently preserves string refs only. Do not store arbitrary nested video settings in `object_refs` unless this function is updated carefully for one known key.
- `collectCompositionStorageRefs(row)` currently collects refs from `object_refs` and `cover_ref`. If `video_background_ref` is a storage ref, include it here.
- `hydrateCompositionRowsWithSignedUrls(rows, signedUrls)` currently returns `object_ref_urls` and hydrated `cover_ref`. If video background is signed, expose a display URL safely.
- `createPowerPlaceComposition(...)` and `updatePowerPlaceComposition(...)` both call `normalizePowerPlaceComposition`.

Technical conclusion: persistence must be explicitly implemented here; UI fields alone are not enough.

### 4.4 `src/lib/profileMediaClient.js`

This file validates and uploads private media.

Current technical blocker for video background:

- `PROFILE_MEDIA_ALLOWED_TYPES` currently allows images, audio, PDFs and docs, but not `video/*`.
- `PROFILE_MEDIA_MAX_BYTES` is 5 MB, probably too small for video.
- `validateProfileMediaFile(file)` error text is image-oriented.
- `buildProfileMediaPath(file, context)` has no `video-background` kind.
- `uploadProfileMedia(file, context, session)` always uses current validation.

Therefore Phase 1-3 should implement live animation without real video background upload. Phase 4 can safely extend this file.

### 4.5 `src/profileMandalaWorkspace.css`

Add all motion CSS here.

Relevant existing selectors:

```text
.powerMandalaPanel
.powerMandala
.powerCenterPhoto
.zodiacMandalaSheet
.starMandalaSheet
.daoMandalaSheet
.businessMandalaSheet
.altarMandalaSheet
.power-place-chess
.power-place-chess__board
.power-place-chess__center
.power-place-chess__slot
```

Add no-overflow mobile-safe CSS near existing Power Place/chess styles and mobile media queries.

## 5. Data model

Add defaults to `EMPTY_COMPOSITION` in `ProfileLitePage.jsx`:

```js
motion_mode: "photo",
video_count: 1,
video_direction: "clockwise",
video_step_seconds: 2,
video_background_ref: ""
```

Recommended validation constants in `powerPlaceClient.js`:

```js
const VALID_MOTION_MODES = ["photo", "video"];
const VALID_VIDEO_COUNTS = [1, 4];
const VALID_VIDEO_DIRECTIONS = ["clockwise", "counterclockwise"];
const VALID_VIDEO_STEP_SECONDS = [1, 2, 3];
```

Recommended normalizers:

```js
function normalizeMotionMode(value) {}
function normalizeVideoCount(value) {}
function normalizeVideoDirection(value) {}
function normalizeVideoStepSeconds(value) {}
function normalizeVideoBackgroundRef(value) {}
```

Persistence decision:

1. First inspect actual migrations/table columns for `profile_cabinet_power_place_compositions`.
2. If top-level columns exist or migration is explicitly approved, persist top-level fields.
3. If not, store motion settings in a controlled JSON object key, for example `object_refs.__motion_settings`, but only after changing `cleanObjectRefs` to preserve that exact object safely.
4. Do not send unknown columns to Supabase.
5. Do not add a migration silently.

## 6. UI implementation details

In `ProfileLitePowerPlaceModuleBase.jsx`, derive:

```js
const motionMode = compositionDraft.motion_mode === "video" ? "video" : "photo";
const videoCount = Number(compositionDraft.video_count) === 4 ? 4 : 1;
const videoDirection = compositionDraft.video_direction === "counterclockwise" ? "counterclockwise" : "clockwise";
const videoStepSeconds = [1, 2, 3].includes(Number(compositionDraft.video_step_seconds)) ? Number(compositionDraft.video_step_seconds) : 2;
const videoEnabled = motionMode === "video";
```

Add controls inside `constructorControls`, after constructor/format selectors and before scale sliders:

```jsx
<div className="powerPlaceMotionControls" aria-label="Режим мандалы">
  <span>Режим</span>
  <button className={motionMode === "photo" ? "active" : ""} onClick={() => onCompositionDraftChange("motion_mode", "photo")} type="button">Фото</button>
  <button className={motionMode === "video" ? "active" : ""} onClick={() => onCompositionDraftChange("motion_mode", "video")} type="button">Видео</button>
</div>
```

When video is active, show:

- `Видео 1` / `Видео 4`;
- `По часовой` / `Против часовой`;
- `1 сек` / `2 сек` / `3 сек`;
- hint `Сначала добавьте фото клиента / цели` if no central image;
- video background control as `needs implementation` unless Phase 4 is done;
- `Скачать видеоролик` button with honest `Экспорт видео: needs implementation` unless Phase 5 is real.

## 7. Motion helpers

Add pure helpers near `buildSlotList` or in a small extracted module if tests need import.

Recommended names:

```js
function clockPositions(count, radius = 38, startAngle = -90) {}
function getClientMotionPositions(draft) {}
function getZodiacMotionPositions(draft) {}
function getStarMotionPositions() {}
function getDaoMotionPositions() {}
function getBusinessMotionPositions(draft) {}
function getAltarMotionPositions() {}
function getChessMotionPositions(draft) {}
function getMotionPositionsForComposition(draft, slots, variant) {}
function motionCopyOffsets(count, positionsLength) {}
```

`clockPositions` returns percentage x/y coordinates:

```js
const angle = startAngle + (360 / count) * index;
return { x: 50 + radius * Math.cos(rad), y: 50 + radius * Math.sin(rad) };
```

Minimum mappings:

- `client`: `clockPositions(Number(draft.geometry) || 4)`.
- `zodiac`: `clockPositions(Number(draft.zodiac_visible_count) || 12)`.
- `star`: 5 points in visual star order.
- `dao`: 5 elements in visual clock-like order.
- `business`: 3 main triangle vertices first.
- `altar`: fallback `clockPositions(7)` unless exact visual mapping is safe.
- `chess compact-5`: map existing compact positions top/right/bottom-right/bottom-left/left.
- `chess plus-8`, `classic-8`, `classic-14`: map if safe, otherwise generic orbit and report.

## 8. Step animation logic

Recommended Phase 1-3 approach: React interval state, not complex CSS keyframes. It matches the requested “delay on each block”.

Add:

```js
const [motionStep, setMotionStep] = useState(0);

useEffect(() => {
  if (!videoEnabled) return undefined;
  const timer = window.setInterval(() => {
    setMotionStep((current) => current + 1);
  }, videoStepSeconds * 1000);
  return () => window.clearInterval(timer);
}, [videoEnabled, videoStepSeconds, videoDirection, videoCount, compositionDraft.constructor_type]);
```

Render positions:

```js
const directionFactor = videoDirection === "counterclockwise" ? -1 : 1;
const baseIndex = ((motionStep * directionFactor) % positions.length + positions.length) % positions.length;
const offsets = videoCount === 4 ? motionCopyOffsets(4, positions.length) : [0];
const position = positions[(baseIndex + offset) % positions.length];
```

Add renderer:

```js
const renderPowerPlaceMotionLayer = (variant = compositionDraft.constructor_type) => {
  if (!videoEnabled || !centralImage) return null;
  const positions = getMotionPositionsForComposition(compositionDraft, slots, variant);
  if (positions.length < 2) return null;
  return <div className="powerPlaceMotionLayer">...</div>;
};
```

The layer must be a sibling inside the mandala sheet, not inside the center photo button.

## 9. Where to insert the layer

Insert `{renderPowerPlaceMotionLayer("client")}` inside `.powerMandala` for client branch.

Insert corresponding layer inside:

```text
.altarMandalaSheet
.businessMandalaSheet
.zodiacMandalaSheet
.starMandalaSheet
.power-place-chess or .power-place-chess__board
daoMandalaSheet
```

For zodiac, the layer belongs inside `.zodiacMandalaSheet`, not outside the fragment with plus positions.

For chess, prefer inside `.power-place-chess__board` only if absolute coordinates align; otherwise inside `.power-place-chess` with its own relative layer.

## 10. CSS to add

In `src/profileMandalaWorkspace.css`:

```css
.powerPlaceMotionLayer {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 6;
  overflow: visible;
}

.powerPlaceMotionPhoto {
  position: absolute;
  width: clamp(42px, 14%, 72px);
  aspect-ratio: 1 / 1;
  border-radius: 999px;
  background-size: cover;
  background-position: center;
  transform: translate(-50%, -50%);
  transition: left 0.42s ease, top 0.42s ease;
}

.powerPlaceMotionPhoto--count-4 {
  width: clamp(34px, 11%, 58px);
}

.powerPlaceVideoBackground {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  pointer-events: none;
  z-index: 0;
}

@media (prefers-reduced-motion: reduce) {
  .powerPlaceMotionPhoto { transition: none; }
}
```

Ensure every sheet that receives `.powerPlaceMotionLayer` has `position: relative` and does not create horizontal overflow.

## 11. Video background Phase 4

Do not implement video background in Phase 1-3 unless media/storage is safely extended.

For Phase 4, update `profileMediaClient.js`:

- add explicit video MIME whitelist, e.g. `video/mp4`, `video/webm`, `video/quicktime`;
- add separate video max size decision;
- add `validateProfileVideoFile(file)`;
- add `kind === "video-background"` path such as `${profileId}/video-backgrounds/${uuid}-${safeFilename}`;
- add upload handler in `ProfileLitePage.jsx`, e.g. `handleCompositionVideoBackgroundUpload(file)`;
- store only `video_background_ref`, not `data:video`;
- add signing support in `powerPlaceClient.js` by including `video_background_ref` in `collectCompositionStorageRefs`.

If unsafe, leave UI as `needs implementation` and report blocker.

## 12. Download video Phase 5

Do not connect `Скачать видеоролик` to `openPowerPlacePdfPrintView`. That helper is PDF/print only.

Phase 1-3 behavior:

```text
Экспорт видео: needs implementation
```

Real export later requires:

- canvas compositor + MediaRecorder WebM; or
- frame sequence export; or
- server-side render; or
- MP4 library/server process.

Risks: private signed media can taint canvas, cross-origin media can block export, DOM-to-video is unreliable, MP4 can add heavy dependencies.

## 13. Tests

Update/add:

### `test/powerPlaceClient.test.mjs`

Test normalization/persistence of video fields or `object_refs.__motion_settings`:

- default motion fields;
- invalid mode/count/direction/timing fallback;
- valid settings survive normalization;
- no `data:image` or `data:video` is persisted.

### `test/profileLiteCabinetContract.test.mjs`

Assert UI labels exist:

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

Assert CSS selectors exist:

```text
.powerPlaceMotionLayer
.powerPlaceMotionPhoto
.powerPlaceVideoBackground
prefers-reduced-motion
```

## 14. Checks and QA

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

Manual QA routes:

```text
/
/profile
/profile/mandalas
/profile/services
/masters
/profile/admin
```

Manual QA in `/profile`:

1. Open mandala workshop.
2. Confirm default `Фото` mode is unchanged.
3. Add/select central photo.
4. Switch to `Видео`.
5. Test `Видео 1`.
6. Test `Видео 4`.
7. Test clockwise/counterclockwise.
8. Test timing 1/2/3.
9. Test client geometry 4 and 12.
10. Test zodiac 12.
11. Test chess compact-5.
12. Test dao.
13. Save and reload composition.
14. Confirm no mobile overflow.
15. Confirm center photo editing and drag/drop still work.
16. Confirm PDF/print still works or limitation is reported.
17. Confirm export button is honest.

## 15. Codex implementation rule

Implement Phase 1-3 first.

Do not implement Phase 4 video background or Phase 5 real export unless the media/storage/export risks are explicitly resolved in code and tests.

After real code implementation, update:

```text
STATE.md
LOG.md
```

Report:

- changed files;
- fields added;
- exact persistence choice: top-level columns or `object_refs.__motion_settings`;
- supported constructor formats;
- fallback constructor formats;
- video background status;
- export status;
- checks run with exit codes;
- risks;
- what was not verified.
