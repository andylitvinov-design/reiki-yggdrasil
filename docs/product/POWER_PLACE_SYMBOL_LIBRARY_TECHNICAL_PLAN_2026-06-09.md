# Power Place Symbol Library — detailed technical implementation plan

Date: 2026-06-09  
Project: Reiki Yggdrasil / Profile Lite / Power Place constructor  
Target route: `/profile/mandalas`  
Target branch for implementation: `main`  
Test/staging site: `https://2mentalica.vercel.app`  
Production branches/domains: do not change in this task.

## 0. Source user request

Implement the requested Power Place UX changes:

1. Add a new module below the `Фон места силы` module: **Библиотека**.
2. This module contains key symbols that can be inserted as images into Power Place key points / mini-mandala slots.
3. The library has shelves that correspond to Power Place formats.
4. At the top of the module there is a dropdown for choosing the shelf.
5. The default active shelf is determined by the selected Power Place format.
6. Under the shelf selector there are mini photos/symbols that can be selected and dragged into target cells on desktop.
7. On mobile, improve the cell-click image picker. When a cell is clicked, a popup menu should show two-level source navigation:
   - `Клиенты`
     - `Все`
     - `Клиент 1`
     - `Клиент 2`
     - `Клиент 3`
   - `Материалы`
     - category dropdown, default `Новые`
   - `Символы`
     - shelf dropdown
   - `Загрузить своё`
8. Reduce the photos/thumbnails in the bottom upload/image picker menu by about 3x.
9. Make the close button at the top of the picker much clearer, because the current top of the menu is clipped/eaten on mobile.

## 1. Non-negotiable constraints

- Preserve public homepage `/`.
- Preserve routes:
  - `/`
  - `/profile`
  - `/profile/mandalas`
  - `/masters`
  - `/profile/admin`
- Preserve RU-default UI.
- Preserve existing Supabase auth/data/storage flows.
- Preserve Vercel rewrites and do not touch production domain settings.
- Preserve the accepted desktop three-column structure.
- Do not rewrite the whole module.
- Do not expose env values; use only env names.
- Do not add a Supabase migration unless a static/local implementation is proven impossible.
- Prefer static public SVG paths over `data:image`, because recent persistence logic strips unsafe data URLs.

## 2. Current code map

### 2.1. Main Power Place component

File: `src/pages/profile-lite/ProfileLitePowerPlaceModuleBase.jsx`

Known relevant code:

- `CONSTRUCTOR_TYPES` defines current Power Place formats:
  - `zodiac`
  - `star`
  - `chess`
  - `client`
  - `altar`
  - `business`
  - `dao`
- `slots = useMemo(() => buildSlotList(compositionDraft), [compositionDraft])` builds active mini-mandala cells.
- `selectedSlotId` stores the target slot selected by the user.
- `pickerMode` controls what the picker is selecting: center, cover, object, library.
- `assignPowerPlaceSlotImage(slotKey, selectedRef, displayUrl, item)` is the central safe function for putting a selected image into:
  - center image;
  - inner cover;
  - outer cover;
  - object/mini-mandala slot.
- `chooseImage(item)` routes picker choice into `assignPowerPlaceSlotImage`.
- `handleSavedImageDragStart(event, item)` creates the drag payload.
- `getPowerPlaceSlotDropHandlers(slotKey)` reads drag payload and calls `assignPowerPlaceSlotImage`.
- `renderSourceSlot`, `renderObjectImageButton`, and `renderCenterPhotoWithMode` expose drop targets.
- The left column currently uses `.powerLibrarySidebar` for saved images and filters.

Important: reuse these existing functions. Do not create a parallel slot assignment system.

### 2.2. Existing background / cover flow

File: `src/pages/profile-lite/ProfileLitePowerPlaceModuleBase.jsx`

Find exact placement by searching:

```text
coverLayerMode
openCoverPickerForLayer
cover_ref.inner
cover_ref.outer
renderInMandalaCoverDropTargets
Фон
Фон места силы
```

The new `Библиотека` module must be rendered directly below the existing `Фон места силы` / cover module in the same side/control stack.

If Codex cannot find a block literally named `Фон места силы`, report exact found cover/background block and place `Библиотека` below it.

### 2.3. Image picker

File: `src/pages/profile-lite/ProfileLiteImagePicker.jsx`

Current behavior:

- current tabs are `Новые`, `Клиенты`, `Материалы`, `Загрузить фото`;
- client upload already uses:
  - `Название фото`;
  - `Подкатегория`;
- no notes field is needed for client upload;
- `CLIENT_PHOTO_SUBCATEGORIES` already includes `Все`, `Клиент 1`, `Клиент 2`, `Клиент 3`, and Pro-only `Больше клиентов / Pro mode /`;
- close button is a small `x`, currently too weak for iPhone Safari.

### 2.4. Parent page / state

File: `src/pages/ProfileLitePage.jsx`

Relevant flow:

- loads `clientGoalPhotos`, `traditionAssets`, `materials`, `powerPlaceCompositions`;
- passes data and callbacks into `ProfileLitePowerPlaceModuleBase.jsx`;
- `handleLibraryClientPhotoUpload` handles upload destination `clients` and `materials`;
- `setCompositionObjectRef(slotId, value, displayUrl)` stores `object_refs` and `object_ref_urls`;
- `handleCompositionCoverSelect` stores cover refs and display refs;
- existing persistence should already save `object_refs` and `object_ref_urls` through Power Place composition save/update.

### 2.5. CSS

File: `src/profileMandalaWorkspace.css`

Add styles here only. Do not affect public master cards, course cards, service cards, or unrelated profile modules.

Target classes to introduce:

```text
.powerSymbolLibraryPanel
.powerSymbolLibraryHeader
.powerSymbolLibraryGrid
.powerSymbolLibraryItem
.powerSymbolLibraryThumb
.imagePickerSourceGroups
.imagePickerSourceButton
.imagePickerSecondLevel
.imagePickerTinyGrid
.profileLiteImagePickerCloseButton
```

## 3. Architecture decision

Use **static local symbol library** for Phase 1.

Reason:

- symbols are product/static assets, not user-generated private photos;
- existing object slot flow can store URL strings already;
- public static paths do not require Supabase signed URLs;
- avoids Storage/RLS/migration risk;
- can be replaced later by an admin-managed symbol library if needed.

### 3.1. Avoid `data:image` for persistent symbols

Recent app state says persistence strips `data:image`, `data:video`, Supabase signed URLs, and unknown nested refs. Therefore symbol items should use durable public paths:

```text
/symbols/power-place/<shelf>/<symbol>.svg
```

Preferred file locations:

```text
public/symbols/power-place/zodiac/aries.svg
public/symbols/power-place/star/star-top.svg
public/symbols/power-place/chess/chess-node.svg
public/symbols/power-place/client/client-node.svg
public/symbols/power-place/altar/altar-flame.svg
public/symbols/power-place/business/business-goal.svg
public/symbols/power-place/dao/dao-water.svg
```

If final symbol artwork does not exist, create neutral draft SVG placeholders. Do not invent sacred meanings. Label placeholder metadata as `draft` or `needs review`.

## 4. New data file

Create:

```text
src/data/powerPlaceSymbolLibrary.js
```

### 4.1. Required exports

```js
export const POWER_PLACE_SYMBOL_SHELF_ORDER = [
  "zodiac",
  "star",
  "chess",
  "client",
  "altar",
  "business",
  "dao"
];

export const POWER_PLACE_SYMBOL_SHELVES = [
  { value: "zodiac", label: "Зодиак", constructorType: "zodiac" },
  { value: "star", label: "Звезда", constructorType: "star" },
  { value: "chess", label: "Шахматы", constructorType: "chess" },
  { value: "client", label: "Мандала", constructorType: "client" },
  { value: "altar", label: "Алтарь", constructorType: "altar" },
  { value: "business", label: "Бизнес", constructorType: "business" },
  { value: "dao", label: "ДАО", constructorType: "dao" }
];
```

### 4.2. Symbol item contract

```js
{
  id: "symbol-zodiac-aries-draft",
  shelf: "zodiac",
  label: "Овен",
  meta: "Символ · Зодиак · draft",
  kind: "symbol-library",
  src: "/symbols/power-place/zodiac/aries.svg",
  displaySrc: "/symbols/power-place/zodiac/aries.svg"
}
```

Required fields:

- `id` — stable unique id;
- `shelf` — one of the shelf values;
- `label` — visible Russian label;
- `meta` — short status/category text;
- `kind: "symbol-library"` — must be stable for filtering/tests;
- `src` — persistent public path;
- `displaySrc` — preview path, usually same as `src`.

### 4.3. Helper functions

```js
export function symbolShelfForConstructorType(constructorType) {
  return POWER_PLACE_SYMBOL_SHELVES.find((shelf) => shelf.constructorType === constructorType)?.value || "zodiac";
}

export function normalizePowerPlaceSymbolShelf(value) {
  const shelf = String(value || "").trim();
  return POWER_PLACE_SYMBOL_SHELF_ORDER.includes(shelf) ? shelf : "zodiac";
}

export function listPowerPlaceSymbolsByShelf(shelfValue) {
  const shelf = normalizePowerPlaceSymbolShelf(shelfValue);
  return POWER_PLACE_SYMBOL_LIBRARY.filter((item) => item.shelf === shelf);
}

export function listPowerPlaceSymbolsForConstructorType(constructorType) {
  return listPowerPlaceSymbolsByShelf(symbolShelfForConstructorType(constructorType));
}
```

### 4.4. Minimum seed symbols

Add at least 2 draft symbols per shelf so the UI can be tested:

- `zodiac`: `Овен`, `Телец`;
- `star`: `Верхний луч`, `Нижний луч`;
- `chess`: `Узел`, `Переход`;
- `client`: `Источник`, `Цель`;
- `altar`: `Огонь`, `Чаша`;
- `business`: `Цель`, `Связи`;
- `dao`: `Вода`, `Дерево`.

All should be clearly draft/placeholder until final art is provided.

## 5. Task A — add module `Библиотека` below `Фон места силы`

### 5.1. Import data helpers

In `src/pages/profile-lite/ProfileLitePowerPlaceModuleBase.jsx`:

```js
import {
  POWER_PLACE_SYMBOL_SHELVES,
  listPowerPlaceSymbolsByShelf,
  symbolShelfForConstructorType
} from "../../data/powerPlaceSymbolLibrary.js";
```

### 5.2. Add state

Near other UI state:

```js
const [activeSymbolShelf, setActiveSymbolShelf] = useState(() => symbolShelfForConstructorType(compositionDraft.constructor_type));
const [symbolShelfTouched, setSymbolShelfTouched] = useState(false);
```

Add effect:

```js
useEffect(() => {
  if (symbolShelfTouched) return;
  setActiveSymbolShelf(symbolShelfForConstructorType(compositionDraft.constructor_type));
}, [compositionDraft.constructor_type, symbolShelfTouched]);
```

Rationale:

- default shelf follows constructor format;
- if master manually changes shelf, do not override immediately;
- if this manual override becomes confusing in QA, add a small button `По формату`, which sets `symbolShelfTouched(false)` and resets the shelf.

### 5.3. Add derived list

```js
const activeLibrarySymbols = useMemo(
  () => listPowerPlaceSymbolsByShelf(activeSymbolShelf),
  [activeSymbolShelf]
);
```

### 5.4. Add renderer

Add inside component, close to other renderer helpers:

```jsx
const renderSymbolLibraryModule = () => (
  <section className="powerSymbolLibraryPanel" aria-label="Библиотека символов">
    <div className="powerSymbolLibraryHeader">
      <div>
        <p className="cabinetEyebrow">Библиотека</p>
        <h3>Ключевые символы</h3>
        <small>{selectedSlot ? `Цель: ${selectedSlot.label}` : "Выберите ячейку или перетащите символ"}</small>
      </div>
      <label className="powerLibrarySelectLabel powerSymbolShelfSelectLabel">
        Полка
        <select
          value={activeSymbolShelf}
          onChange={(event) => {
            setSymbolShelfTouched(true);
            setActiveSymbolShelf(event.target.value);
          }}
        >
          {POWER_PLACE_SYMBOL_SHELVES.map((shelf) => (
            <option key={shelf.value} value={shelf.value}>{shelf.label}</option>
          ))}
        </select>
      </label>
    </div>

    <div className="powerSymbolLibraryGrid" data-power-symbol-library-grid="true">
      {activeLibrarySymbols.map((symbol) => (
        <button
          className="powerSymbolLibraryItem"
          key={symbol.id}
          type="button"
          draggable={Boolean(symbol.src)}
          onDragStart={(event) => handleSavedImageDragStart(event, symbol)}
          onClick={() => chooseImage(symbol)}
          title={symbol.label}
          aria-label={`Выбрать символ ${symbol.label}`}
        >
          <span
            className="powerSymbolLibraryThumb hasImage"
            style={imageStyle(symbol.displaySrc || symbol.src)}
            aria-hidden="true"
          />
          <b>{symbol.label}</b>
          <small>{symbol.meta}</small>
        </button>
      ))}
      {activeLibrarySymbols.length === 0 && (
        <p className="cabinetMuted">Для этой полки символы ещё готовятся.</p>
      )}
    </div>
  </section>
);
```

### 5.5. Place the renderer

Insert `{renderSymbolLibraryModule()}` directly after the existing background/cover module.

If the cover module is inside the left source sidebar, the resulting order should be:

```text
Источники силы / Фото
Фон места силы
Библиотека
```

If the cover module is in a right/control panel, keep the new module in the same panel directly below it.

### 5.6. Behavior on desktop

- Clicking a symbol should call `chooseImage(symbol)`.
- Dragging a symbol should use `handleSavedImageDragStart`.
- Dropping into center/object/cover targets should work through existing `getPowerPlaceSlotDropHandlers`.
- Do not add a new drag payload format.

## 6. Task B — shelves match Power Place formats

### 6.1. Default shelf mapping

Mapping must be exact:

```js
zodiac -> zodiac
star -> star
chess -> chess
client -> client
altar -> altar
business -> business
dao -> dao
```

### 6.2. Format switch behavior

When user switches format using existing constructor type buttons:

```jsx
onCompositionDraftChange("constructor_type", type.value)
```

Expected behavior:

- if `symbolShelfTouched === false`, active library shelf follows the new format;
- if `symbolShelfTouched === true`, user-selected shelf remains;
- optional small reset button can be added:

```jsx
<button
  className="cabinetSecondary tinyButton"
  type="button"
  onClick={() => {
    setSymbolShelfTouched(false);
    setActiveSymbolShelf(symbolShelfForConstructorType(compositionDraft.constructor_type));
  }}
>
  По формату
</button>
```

Use the reset button only if the UI feels unclear.

## 7. Task C — desktop symbol drag/drop into mini-mandala cells

### 7.1. Do not change existing drop handlers

Existing cells already accept drop through:

```js
{...getPowerPlaceSlotDropHandlers(slot.id)}
```

and the center accepts:

```js
{...getPowerPlaceSlotDropHandlers("__center_image")}
```

Symbols must use the same drag payload as saved images.

### 7.2. Drag item shape

`handleSavedImageDragStart(event, symbol)` must receive an item like:

```js
{
  id: "symbol-dao-water-draft",
  label: "Вода",
  title: "Вода",
  meta: "Символ · ДАО · draft",
  kind: "symbol-library",
  src: "/symbols/power-place/dao/water.svg",
  displaySrc: "/symbols/power-place/dao/water.svg",
  shelf: "dao"
}
```

If `buildPowerPlaceDragPayload(item)` filters by `kind`, update it to allow `symbol-library`.

Search in `ProfileLitePowerPlaceModuleBase.jsx`:

```text
buildPowerPlaceDragPayload
POWER_PLACE_DRAG_PAYLOAD_TYPE
```

Expected patch if kind is restricted:

```js
const allowedKinds = new Set(["client-photo", "material", "tradition-asset", "saved-mandala", "symbol-library"]);
```

Do not allow arbitrary missing `src` payloads.

## 8. Task D — mobile popup source menu with two levels

### 8.1. Required UX

When user taps any mini-mandala cell on mobile, the picker should show:

```text
Клиенты | Материалы | Символы | Загрузить своё
```

Then below the active top-level source:

- for `Клиенты`: second-level buttons/select with `Все`, `Клиент 1`, `Клиент 2`, `Клиент 3`;
- for `Материалы`: category dropdown, default `Новые`;
- for `Символы`: shelf dropdown;
- for `Загрузить своё`: existing upload UI.

The same improved picker can be used on desktop too, but mobile clarity is the priority.

### 8.2. Props to add to `ProfileLiteImagePicker.jsx`

Add optional props with safe defaults:

```js
symbolShelves = [],
symbolImages = [],
defaultSymbolShelf = "zodiac",
materialCategoryOptions = []
```

Call site in `ProfileLitePowerPlaceModuleBase.jsx` should pass:

```jsx
symbolShelves={POWER_PLACE_SYMBOL_SHELVES}
symbolImages={POWER_PLACE_SYMBOL_LIBRARY}
defaultSymbolShelf={activeSymbolShelf}
```

If importing `POWER_PLACE_SYMBOL_LIBRARY` directly is undesirable, derive and pass a combined symbol list from the component.

### 8.3. Picker source state

Inside `ProfileLiteImagePicker.jsx`:

```js
const [activePickerSource, setActivePickerSource] = useState(mode === "library" ? "upload" : "clients");
const [pickerClientCategory, setPickerClientCategory] = useState("all");
const [pickerMaterialCategory, setPickerMaterialCategory] = useState("new");
const [pickerSymbolShelf, setPickerSymbolShelf] = useState(defaultSymbolShelf);
```

Add sync effect:

```js
useEffect(() => {
  setPickerSymbolShelf(defaultSymbolShelf || "zodiac");
}, [defaultSymbolShelf]);
```

Need to import `useEffect` at top if currently only `useMemo` and `useState` are imported.

### 8.4. Source buttons

Replace or supplement the current tab bar for object/center/cover modes:

```jsx
<div className="imagePickerSourceGroups" role="tablist" aria-label="Источник изображения">
  {[
    { id: "clients", label: "Клиенты" },
    { id: "materials", label: "Материалы" },
    { id: "symbols", label: "Символы" },
    { id: "upload", label: "Загрузить своё" }
  ].map((source) => (
    <button
      className={activePickerSource === source.id ? "active" : ""}
      key={source.id}
      type="button"
      role="tab"
      aria-selected={activePickerSource === source.id}
      onClick={() => setActivePickerSource(source.id)}
    >
      {source.label}
    </button>
  ))}
</div>
```

For `mode === "library"`, keep upload-only behavior if that is currently intentional.

### 8.5. Clients second level

Use existing client subcategory constants but do not show Pro-only as active for non-Pro.

```jsx
{activePickerSource === "clients" && (
  <div className="imagePickerSecondLevel" aria-label="Категория клиентов">
    {CLIENT_PHOTO_SUBCATEGORIES.filter((option) => !option.proOnly).map((option) => (
      <button
        className={pickerClientCategory === option.value ? "active" : ""}
        key={option.value}
        type="button"
        onClick={() => setPickerClientCategory(option.value)}
      >
        {option.label}
      </button>
    ))}
  </div>
)}
```

Filter logic:

```js
function matchesClientCategory(image, category) {
  if (category === "all") return true;
  const value = image.clientCategory || image.client_category || image.category || "";
  return value === category;
}
```

### 8.6. Materials category dropdown

Default category must be `Новые`.

Suggested options:

```js
const DEFAULT_MATERIAL_CATEGORY_OPTIONS = [
  { value: "new", label: "Новые" },
  { value: "all", label: "Все материалы" },
  { value: "mandala", label: "Мандалы" },
  { value: "artifact", label: "Артефакты" },
  { value: "practice", label: "Практики" },
  { value: "tradition-asset", label: "Символы традиций" }
];
```

Render:

```jsx
{activePickerSource === "materials" && (
  <label className="imagePickerSecondLevelSelect">
    Категория
    <select value={pickerMaterialCategory} onChange={(event) => setPickerMaterialCategory(event.target.value)}>
      {resolvedMaterialCategoryOptions.map((option) => (
        <option key={option.value} value={option.value}>{option.label}</option>
      ))}
    </select>
  </label>
)}
```

Filter logic:

```js
function matchesMaterialCategory(image, category) {
  if (category === "new") return true; // keep default broad until recency field is verified
  if (category === "all") return true;
  if (category === "tradition-asset") return image.kind === "tradition-asset";
  return image.kind === "material" && (image.type === category || image.materialType === category || String(image.meta || "").toLowerCase().includes(category));
}
```

If `created_at` or `updated_at` exists and reliable, Codex may sort `new` by newest first, but must not block the task on this.

### 8.7. Symbols shelf dropdown

```jsx
{activePickerSource === "symbols" && (
  <label className="imagePickerSecondLevelSelect">
    Полка
    <select value={pickerSymbolShelf} onChange={(event) => setPickerSymbolShelf(event.target.value)}>
      {symbolShelves.map((shelf) => (
        <option key={shelf.value} value={shelf.value}>{shelf.label}</option>
      ))}
    </select>
  </label>
)}
```

Visible symbol list:

```js
const visibleSymbolImages = symbolImages.filter((image) => image.shelf === pickerSymbolShelf);
```

### 8.8. Upload section

When `activePickerSource === "upload"`, render existing upload panel.

Do not change client upload fields beyond the user request:

- keep `Название фото`;
- keep `Подкатегория`;
- no `notes` field;
- Pro-only `Больше клиентов` remains disabled unless `accountPlan === "pro"`.

### 8.9. Unified visible images

Replace current `visibleImages` logic carefully.

Suggested approach:

```js
const validImages = useMemo(
  () => images.filter((image) => image?.id || image?.src || image?.displaySrc),
  [images]
);

const visibleImages = useMemo(() => {
  if (activePickerSource === "clients") {
    return validImages
      .filter((image) => image.kind === "client-photo")
      .filter((image) => matchesClientCategory(image, pickerClientCategory));
  }
  if (activePickerSource === "materials") {
    return validImages
      .filter((image) => image.kind === "material" || image.kind === "tradition-asset")
      .filter((image) => matchesMaterialCategory(image, pickerMaterialCategory));
  }
  if (activePickerSource === "symbols") {
    return symbolImages.filter((image) => image.shelf === pickerSymbolShelf);
  }
  return [];
}, [activePickerSource, validImages, pickerClientCategory, pickerMaterialCategory, pickerSymbolShelf, symbolImages]);
```

Keep old `activeTab` only if needed for backward compatibility. Avoid having two conflicting tab states visible at the same time.

## 9. Task E — reduce picker photos/thumbnails by about 3x

### 9.1. Scope

Only affect picker/modal grids:

- `.profileLiteImagePickerGrid`
- `.profileLiteImagePickerCard`
- `.profileLiteImagePickerSelect`
- `.clientPhotoPickerCard.profileLiteImagePickerCard`
- new `.imagePickerTinyGrid` if introduced.

Do not affect:

- public master cards;
- saved mandala cards;
- service cards;
- Power Place canvas slot sizes.

### 9.2. CSS target

Add or adjust:

```css
.profileLiteImagePickerGrid,
.imagePickerTinyGrid {
  grid-template-columns: repeat(auto-fill, minmax(74px, 1fr));
  gap: 8px;
}

.profileLiteImagePickerCard,
.clientPhotoPickerCard.profileLiteImagePickerCard {
  min-width: 0;
}

.profileLiteImagePickerSelect {
  padding: 6px;
  gap: 4px;
}

.profileLiteImagePickerSelect > span,
.profileLiteImagePickerCard .hasImage,
.profileLiteImagePickerCard .needsSignedUrl {
  height: 56px;
  min-height: 56px;
  border-radius: 12px;
}

.profileLiteImagePickerSelect b {
  font-size: 0.72rem;
  line-height: 1.05;
}

.profileLiteImagePickerSelect small {
  font-size: 0.64rem;
  line-height: 1.05;
}
```

Codex must inspect existing CSS first and adapt selectors to avoid duplicate/conflicting declarations.

### 9.3. Mobile-specific fallback

```css
@media (max-width: 640px) {
  .profileLiteImagePickerGrid,
  .imagePickerTinyGrid {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }

  .profileLiteImagePickerSelect > span,
  .profileLiteImagePickerCard .hasImage,
  .profileLiteImagePickerCard .needsSignedUrl {
    height: 52px;
    min-height: 52px;
  }
}
```

## 10. Task F — make picker close button obvious and not clipped

### 10.1. JSX change

In `ProfileLiteImagePicker.jsx`, replace the current `x` close button with:

```jsx
<button
  className="profileLiteImagePickerCloseButton"
  type="button"
  onClick={onClose}
  disabled={isUploading}
  aria-label="Закрыть выбор изображения"
>
  ×
</button>
```

### 10.2. Safe-area CSS

Add:

```css
.clientPhotoPickerModal.profileLiteImagePicker {
  padding-top: max(16px, env(safe-area-inset-top));
  max-height: min(88vh, 760px);
  overflow: auto;
  overscroll-behavior: contain;
}

.clientPhotoPickerHeader {
  position: sticky;
  top: 0;
  z-index: 8;
  background: inherit;
  padding-top: 4px;
}

.profileLiteImagePickerCloseButton {
  width: 42px;
  height: 42px;
  min-width: 42px;
  border-radius: 999px;
  font-size: 30px;
  line-height: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
}
```

### 10.3. iPhone Safari check

Manual QA at `390x900`:

- picker top header visible;
- close button fully visible;
- close button tappable;
- modal content scrolls inside, not page behind;
- no horizontal overflow.

## 11. Task G — Pro mode behavior for more clients

Current requirement: Pro mode is not active without Pro subscription.

Implementation rule:

- `Больше клиентов / Pro mode /` must remain disabled unless `accountPlan === "pro"`.
- In mobile source filter, do not show Pro-only as active if non-Pro.
- In upload destination `clients`, current Pro-disabled option can remain visible with label `— доступно в Pro`.
- Do not implement subscription/payment logic in this task.

Recommended helper:

```js
const isProAccount = accountPlan === "pro";
const visibleClientFilterOptions = CLIENT_PHOTO_SUBCATEGORIES.filter((option) => !option.proOnly || isProAccount);
```

When selecting:

```js
if (option?.proOnly && !isProAccount) return;
```

## 12. Task H — ensure existing upload menu remains simplified

User previously requested client upload fields only:

- photo title;
- subcategory;
- no notes.

Current `handleUpload` already sends `notes: ""`.

Do not add visible notes field.

For `destination === "clients"`, keep:

```js
title: uploadTitle.trim() || file.name || ""
clientCategory: clientCategory || "all"
notes: ""
```

For materials, do not remove existing needed metadata unless a separate grimoire simplification task requests it.

## 13. Task I — tests

### 13.1. Add symbol library unit test

Create:

```text
test/powerPlaceSymbolLibrary.test.mjs
```

Test:

```js
import assert from "node:assert/strict";
import {
  POWER_PLACE_SYMBOL_LIBRARY,
  POWER_PLACE_SYMBOL_SHELVES,
  symbolShelfForConstructorType,
  listPowerPlaceSymbolsByShelf
} from "../src/data/powerPlaceSymbolLibrary.js";

const expectedShelves = ["zodiac", "star", "chess", "client", "altar", "business", "dao"];

for (const shelf of expectedShelves) {
  assert.ok(POWER_PLACE_SYMBOL_SHELVES.some((item) => item.value === shelf), `missing shelf ${shelf}`);
  assert.equal(symbolShelfForConstructorType(shelf), shelf);
  assert.ok(listPowerPlaceSymbolsByShelf(shelf).length >= 1, `missing symbols for ${shelf}`);
}

for (const symbol of POWER_PLACE_SYMBOL_LIBRARY) {
  assert.ok(symbol.id, "symbol id required");
  assert.ok(expectedShelves.includes(symbol.shelf), `invalid shelf ${symbol.shelf}`);
  assert.equal(symbol.kind, "symbol-library");
  assert.ok(symbol.label, "symbol label required");
  assert.ok(symbol.src?.startsWith("/symbols/power-place/"), `symbol src should be public path: ${symbol.src}`);
  assert.ok(symbol.displaySrc, "symbol displaySrc required");
}
```

Add this test to `package.json` if a dedicated script is appropriate, or include it under `test:power-place`.

Preferred package script patch:

```json
"test:power-place": "node test/powerPlaceClient.test.mjs && node test/powerPlaceStyleContract.test.mjs && node test/printUtils.test.mjs && node test/powerPlaceSymbolLibrary.test.mjs"
```

### 13.2. Contract test update

Update `test/profileLiteCabinetContract.test.mjs` to assert source contains:

```text
Библиотека
Ключевые символы
powerSymbolLibraryPanel
symbolShelfForConstructorType
symbol-library
```

### 13.3. CSS contract update

Update `test/powerPlaceStyleContract.test.mjs` to assert CSS contains:

```text
.powerSymbolLibraryPanel
.powerSymbolLibraryGrid
.powerSymbolLibraryItem
.powerSymbolLibraryThumb
.profileLiteImagePickerCloseButton
.imagePickerSourceGroups
```

## 14. Task J — manual QA

### 14.1. Desktop QA

Route: `/profile/mandalas`  
Viewport: `1280x920`

Check:

- `Библиотека` appears directly below `Фон места силы` / cover module.
- Constructor format `Зодиак` selects shelf `Зодиак` by default.
- Switching to `Звезда`, `Шахматы`, `Мандала`, `Алтарь`, `Бизнес`, `ДАО` updates default shelf when shelf has not been manually changed.
- Manual shelf dropdown works.
- Click a symbol after selecting a slot: symbol appears in that mini-mandala cell.
- Drag symbol into a mini-mandala cell: symbol appears.
- Existing saved photo drag/drop still works.
- Existing center photo picker still works.
- Existing background/cover picker still works.
- Save new composition does not fail because of symbol refs.
- Reload/open saved composition preserves symbol refs if saved.

### 14.2. Mobile QA

Route: `/profile/mandalas`  
Viewport: `390x900`

Check:

- Tap mini-mandala cell opens picker.
- Picker header is not clipped.
- Large `×` close button visible and tappable.
- Source buttons visible:
  - `Клиенты`
  - `Материалы`
  - `Символы`
  - `Загрузить своё`
- `Клиенты` second level shows:
  - `Все`
  - `Клиент 1`
  - `Клиент 2`
  - `Клиент 3`
- Non-Pro users do not get active `Больше клиентов / Pro mode /`.
- `Материалы` has category dropdown defaulting to `Новые`.
- `Символы` has shelf dropdown defaulting to current constructor format.
- Picker thumbnails are about 3x smaller than current large cards.
- No horizontal overflow.

### 14.3. Route regression QA

Check all:

- `/`
- `/profile`
- `/profile/mandalas`
- `/masters`
- `/profile/admin`

Expected:

- route returns 200 locally;
- no React error overlay;
- no horizontal overflow on mobile;
- public homepage unchanged.

## 15. Implementation phases

### Phase 1 — static symbols and desktop module

Files:

```text
src/data/powerPlaceSymbolLibrary.js
public/symbols/power-place/**
src/pages/profile-lite/ProfileLitePowerPlaceModuleBase.jsx
src/profileMandalaWorkspace.css
test/powerPlaceSymbolLibrary.test.mjs
test/profileLiteCabinetContract.test.mjs
test/powerPlaceStyleContract.test.mjs
package.json if test script is updated
```

Deliverable:

- visible `Библиотека` module;
- shelf dropdown;
- default shelf follows constructor format;
- click/drag symbols to slots.

### Phase 2 — mobile picker source groups

Files:

```text
src/pages/profile-lite/ProfileLiteImagePicker.jsx
src/pages/profile-lite/ProfileLitePowerPlaceModuleBase.jsx
src/profileMandalaWorkspace.css
test/profileLiteCabinetContract.test.mjs
test/powerPlaceStyleContract.test.mjs
```

Deliverable:

- mobile picker sources:
  - `Клиенты`
  - `Материалы`
  - `Символы`
  - `Загрузить своё`;
- two-level controls;
- symbol shelf dropdown in picker.

### Phase 3 — picker visual polish

Files:

```text
src/pages/profile-lite/ProfileLiteImagePicker.jsx
src/profileMandalaWorkspace.css
```

Deliverable:

- thumbnails about 3x smaller;
- close button clear and not clipped;
- safe-area handling.

### Phase 4 — state/log update

Files:

```text
STATE.md
LOG.md
```

Add concise entries only after implementation is complete.

## 16. Commands

Before changes:

```bash
git status --short
git branch --show-current
git worktree list
git fetch origin
```

After changes:

```bash
npm run test:power-place
npm run test:profile-lite
npm run test:profile-media
npm run test:profile-materials
npm run build
npm run check
git diff --check
```

If browser QA is possible:

```bash
npm run dev -- --port 4390
```

## 17. Risks and mitigations

| Risk | Mitigation |
|---|---|
| `data:image` is stripped from persistence | Use public `/symbols/power-place/...svg` paths |
| New module breaks desktop layout | Add module in existing side/control stack; do not move center canvas |
| Picker source tabs conflict with old `activeTab` | Keep one visible source state; preserve upload behavior |
| Pro-only clients become selectable | Filter/disable Pro-only unless `accountPlan === "pro"` |
| Symbol content looks final though it is placeholder | Label `draft` / `needs review` |
| Existing saved photo drag/drop breaks | Reuse existing `handleSavedImageDragStart` and drop handlers |
| Mobile modal still clipped | Add safe-area padding and sticky header |
| Tests become too brittle | Assert stable class/function names, not exact layout text everywhere |

## 18. Non-goals

Do not implement now:

- Supabase symbol library table;
- admin symbol upload/editor;
- Pro paid symbol shelves;
- AI symbol generation;
- production release;
- changes to public homepage;
- changes to Supabase auth redirects;
- changes to Vercel project settings;
- final sacred meanings for symbols without author approval.

## 19. Final Codex prompt

```text
Repo: https://github.com/andylitvinov-design/reiki-yggdrasil
Target branch: main
Test site after merge: https://2mentalica.vercel.app
Route: /profile/mandalas

Implement the Power Place Symbol Library according to docs/product/POWER_PLACE_SYMBOL_LIBRARY_TECHNICAL_PLAN_2026-06-09.md.

First read AGENTS.md, README.md, STATE.md, LOG.md, package.json, vercel.json, src/pages/ProfileLitePage.jsx, src/pages/profile-lite/ProfileLitePowerPlaceModuleBase.jsx, src/pages/profile-lite/ProfileLiteImagePicker.jsx, src/profileMandalaWorkspace.css, and this technical plan. If a file is missing, report not found.

Do the work in safe phases:
1. Add static symbol library data in src/data/powerPlaceSymbolLibrary.js and public draft SVG assets under public/symbols/power-place/**. Use public paths, not data:image, because persistence may strip data URLs.
2. Add the Библиотека module directly below the existing Фон места силы / cover module. Include shelf dropdown and mini symbol grid. Default shelf must follow compositionDraft.constructor_type until user manually changes shelf.
3. Reuse existing chooseImage, assignPowerPlaceSlotImage, handleSavedImageDragStart, and getPowerPlaceSlotDropHandlers. Do not create a parallel drag/drop system.
4. Extend ProfileLiteImagePicker with source groups: Клиенты, Материалы, Символы, Загрузить своё. Add second-level client filters, material category dropdown defaulting to Новые, and symbol shelf dropdown.
5. Keep client upload simplified: Название фото + Подкатегория only; no notes field. Keep Больше клиентов / Pro mode / disabled for non-Pro users.
6. Reduce picker thumbnails by about 3x only inside the image picker/modal. Do not shrink canvas slots or public cards.
7. Replace the small x close button with a clear × close button and add safe-area/sticky header CSS so the top of the modal is not clipped on iPhone Safari.
8. Add/update tests for symbol library data, component contract, and CSS contract.
9. Update STATE.md and LOG.md after implementation.

Do not change production branch/domains, public homepage, Supabase env values, auth redirect logic, Vercel rewrites, or desktop three-column structure. Do not add Supabase migration unless you prove it is unavoidable.

Run:
npm run test:power-place
npm run test:profile-lite
npm run test:profile-media
npm run test:profile-materials
npm run build
npm run check
git diff --check

Manual QA:
- desktop /profile/mandalas at 1280x920;
- mobile /profile/mandalas at 390x900;
- route sweep /, /profile, /profile/mandalas, /masters, /profile/admin;
- verify no horizontal overflow;
- verify Библиотека below Фон места силы;
- verify shelf default follows constructor format;
- verify click/drag symbols into slots;
- verify existing saved photo/upload/cover/center flows still work;
- verify mobile picker source groups and close button.

Report: branch/base commit, changed files, implementation by phase, checks run with exit status, manual QA, risks, what was not verified, and STATE/LOG update summary.
```
