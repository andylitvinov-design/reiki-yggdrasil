# Power Place Symbol Library — technical implementation plan

Date: 2026-06-09  
Project: Reiki Yggdrasil / Profile Lite / Power Place constructor  
Target route: `/profile/mandalas`  
Target branch for implementation: `main`  
Test/staging site: `https://2mentalica.vercel.app`  
Production branches/domains: do not change in this task.

## 1. Goal

Add a new **Библиотека** module to the Power Place constructor. The module provides reusable symbolic images that can be inserted into Power Place key points / mini-mandala slots.

The library must support:

- shelves that match Power Place formats: `zodiac`, `star`, `chess`, `client`, `altar`, `business`, `dao`;
- automatic default shelf based on the currently selected Power Place format;
- manual shelf override by the master;
- desktop click and drag/drop into mini-mandala slots;
- mobile picker source section `Символы` with shelf selector;
- no Supabase schema change for the first safe iteration.

## 2. Current code map

### Main component

File: `src/pages/profile-lite/ProfileLitePowerPlaceModuleBase.jsx`

Current relevant structures:

- `CONSTRUCTOR_TYPES` defines Power Place formats:
  - `zodiac`
  - `star`
  - `chess`
  - `client`
  - `altar`
  - `business`
  - `dao`
- `slots = useMemo(() => buildSlotList(compositionDraft), [compositionDraft])` builds active mini-mandala targets.
- `selectedSlotId` stores the current target slot.
- `assignPowerPlaceSlotImage(slotKey, selectedRef, displayUrl, item)` is the central safe assignment helper.
- `chooseImage(item)` already selects an image for center / cover / object slot depending on `pickerMode` and `selectedSlotId`.
- `handleSavedImageDragStart(event, item)` and `getPowerPlaceSlotDropHandlers(slotKey)` already provide desktop drag/drop.
- Left source sidebar currently renders saved images in `.powerLibrarySidebar` and filters them through `filteredSavedImages`.
- Cover/background logic is handled through:
  - `coverLayerMode`
  - `openCoverPickerForLayer(layer)`
  - `handleCompositionCoverSelect`
  - `cover_ref.inner`
  - `cover_ref.outer`
  - `renderInMandalaCoverDropTargets()`

### Image picker

File: `src/pages/profile-lite/ProfileLiteImagePicker.jsx`

Current relevant structures:

- Existing tabs: `Новые`, `Клиенты`, `Материалы`, `Загрузить фото`.
- Upload destination supports `clients` and `materials`.
- Client upload already uses only:
  - `Название фото`
  - `Подкатегория`
- `CLIENT_PHOTO_SUBCATEGORIES` already contains:
  - `Все`
  - `Клиент 1`
  - `Клиент 2`
  - `Клиент 3`
  - `Больше клиентов / Pro mode /` as Pro-only.
- Close button is currently a small text `x`; mobile needs a clearer non-clipped close control.

### Parent state / data flow

File: `src/pages/ProfileLitePage.jsx`

Relevant flow:

- Loads `clientGoalPhotos`, `traditionAssets`, `materials`, `powerPlaceCompositions`.
- Passes media and callbacks to Power Place module.
- `handleLibraryClientPhotoUpload` handles picker upload into client photos or materials.
- `setCompositionObjectRef(slotId, value, displayUrl)` stores object refs and `object_ref_urls`.
- No new Supabase table is needed if the first symbol library is static/local.

### CSS

File: `src/profileMandalaWorkspace.css`

Needs targeted changes for:

- new module styles;
- compact symbol grid;
- smaller mobile picker thumbnails;
- improved sticky/visible close button;
- no horizontal overflow on mobile.

## 3. Architecture decision

Use a **static local symbol library** for Phase 1.

Reason:

- symbols are reusable product assets, not user-generated private media;
- the current `object_refs` model can already store a string `src` and optional `displaySrc`;
- the existing click/drag/drop assignment flow can be reused;
- no RLS/storage migration risk;
- no production data migration needed.

Create a new data file:

```text
src/data/powerPlaceSymbolLibrary.js
```

Suggested exports:

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

export const POWER_PLACE_SYMBOL_LIBRARY = [
  {
    id: "symbol-zodiac-aries-draft",
    shelf: "zodiac",
    label: "Овен",
    meta: "Символ · Зодиак · draft",
    kind: "symbol-library",
    src: "data:image/svg+xml;utf8,...",
    displaySrc: "data:image/svg+xml;utf8,..."
  }
];

export function symbolShelfForConstructorType(constructorType) {
  return POWER_PLACE_SYMBOL_SHELVES.find((shelf) => shelf.constructorType === constructorType)?.value || "zodiac";
}

export function listPowerPlaceSymbolsByShelf(shelfValue) {
  return POWER_PLACE_SYMBOL_LIBRARY.filter((item) => item.shelf === shelfValue);
}
```

Important content rule:

- Do not invent sacred/course meanings.
- If real author-approved symbol images do not exist yet, use neutral draft SVG placeholders.
- Label placeholders as `draft` or `needs review`.
- Later phases can replace `src` with real local asset paths, for example `/symbols/power-place/zodiac/aries.svg`.

## 4. Data item contract

Every symbol item should be compatible with the current image item contract used by `chooseImage()` and drag/drop.

Required fields:

```js
{
  id: string,
  label: string,
  meta: string,
  kind: "symbol-library",
  src: string,
  displaySrc: string,
  shelf: string
}
```

`src` and `displaySrc` can be the same for static symbols.

Why this works:

- `assignPowerPlaceSlotImage` accepts `item.src` and `item.displaySrc`.
- `onCompositionObjectRefSelect(slotKey, ref, displaySrc)` persists the selected source into `object_refs` and `object_ref_urls`.
- Static symbols do not require signed URLs.

## 5. Component changes

### 5.1. Imports

In `ProfileLitePowerPlaceModuleBase.jsx`, import the new library helpers:

```js
import {
  POWER_PLACE_SYMBOL_SHELVES,
  listPowerPlaceSymbolsByShelf,
  symbolShelfForConstructorType
} from "../../data/powerPlaceSymbolLibrary.js";
```

### 5.2. State

Add local state near the other UI state:

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

This keeps the shelf synced with the selected format until the user manually chooses another shelf.

### 5.3. Derived symbols

```js
const activeLibrarySymbols = useMemo(
  () => listPowerPlaceSymbolsByShelf(activeSymbolShelf),
  [activeSymbolShelf]
);
```

### 5.4. Symbol selection

Use the existing `chooseImage(item)` and `handleSavedImageDragStart(event, item)`.

For click:

```jsx
<button type="button" onClick={() => chooseImage(symbol)}>
```

For desktop drag:

```jsx
draggable={Boolean(symbol.src)}
onDragStart={(event) => handleSavedImageDragStart(event, symbol)}
```

No new slot assignment function should be created unless absolutely necessary.

## 6. New `Библиотека` module placement

The user requested the module **below the module `Фон места силы`**.

Implementation instruction:

1. In `ProfileLitePowerPlaceModuleBase.jsx`, find the existing cover/background UI by searching:
   - `coverLayerMode`
   - `openCoverPickerForLayer`
   - `cover_ref.inner`
   - `cover_ref.outer`
   - `renderInMandalaCoverDropTargets`
   - visible Russian labels around background/cover.
2. Add `renderSymbolLibraryModule()` directly after that background module in the same side/controls stack.
3. Do not move the constructor center canvas.
4. Do not collapse desktop three-column layout.

Suggested JSX:

```jsx
const renderSymbolLibraryModule = () => (
  <section className="powerSymbolLibraryPanel" aria-label="Библиотека символов">
    <div className="powerSymbolLibraryHeader">
      <div>
        <p className="cabinetEyebrow">Библиотека</p>
        <h3>Ключевые символы</h3>
      </div>
      <label className="powerLibrarySelectLabel">
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
    <div className="powerSymbolLibraryGrid">
      {activeLibrarySymbols.map((symbol) => (
        <button
          className="powerSymbolLibraryItem"
          key={symbol.id}
          type="button"
          draggable={Boolean(symbol.src)}
          onDragStart={(event) => handleSavedImageDragStart(event, symbol)}
          onClick={() => chooseImage(symbol)}
          title={symbol.label}
        >
          <span className="powerSymbolLibraryThumb" style={imageStyle(symbol.displaySrc || symbol.src)} />
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

## 7. Mobile picker changes

The current picker uses top tabs. For mobile and object slot selection, the picker needs clearer source groups.

### 7.1. Props to add to `ProfileLiteImagePicker`

Suggested props:

```js
symbolShelves = [],
symbolImages = [],
defaultSymbolShelf = "zodiac",
materialCategoryOptions = []
```

Minimum safe props:

- `symbolShelves`
- `symbolImages`
- `defaultSymbolShelf`

### 7.2. Picker state

```js
const [activePickerSource, setActivePickerSource] = useState("clients");
const [pickerClientCategory, setPickerClientCategory] = useState("all");
const [pickerMaterialCategory, setPickerMaterialCategory] = useState("new");
const [pickerSymbolShelf, setPickerSymbolShelf] = useState(defaultSymbolShelf);
```

When the picker opens for object mode, default should be:

- source: `clients` or previous if retained;
- symbol shelf: current constructor shelf.

### 7.3. Required mobile source sections

In picker body, show a compact source selector:

```text
Клиенты | Материалы | Символы | Загрузить своё
```

Then second-level controls:

#### Клиенты

- `Все`
- `Клиент 1`
- `Клиент 2`
- `Клиент 3`

Filter images where `kind === "client-photo"` and `clientCategory` matches. If current item shape lacks `clientCategory`, Codex must verify exact field names from `powerPlaceClient.js` normalizers and use the available normalized field.

#### Материалы

- dropdown `Категория`
- default value: `new` / label `Новые`
- include existing material/tradition items.

#### Символы

- dropdown `Полка`
- default = `defaultSymbolShelf`
- grid = `symbolImages` filtered by shelf.

#### Загрузить своё

- reuse existing upload form and `handleUpload`.
- client upload remains title + subcategory only.
- do not reintroduce notes field.

### 7.4. Do not break desktop

The new source sections may be used for all viewports if styled well, but the minimum requirement is that mobile is clear and functional.

## 8. Reducing picker thumbnails

User request: reduce photo previews in the bottom/upload picker menu by about 3x.

Target only picker/modal thumbnails, not all cards.

Likely CSS targets:

```css
.profileLiteImagePickerGrid {
  grid-template-columns: repeat(auto-fill, minmax(72px, 1fr));
  gap: 8px;
}

.profileLiteImagePickerCard,
.clientPhotoPickerCard.profileLiteImagePickerCard {
  min-width: 0;
}

.profileLiteImagePickerSelect {
  padding: 6px;
}

.profileLiteImagePickerSelect > span,
.profileLiteImagePickerCard .hasImage,
.profileLiteImagePickerCard .needsSignedUrl {
  min-height: 56px;
  height: 56px;
  border-radius: 12px;
}

.profileLiteImagePickerSelect b {
  font-size: 0.72rem;
  line-height: 1.05;
}

.profileLiteImagePickerSelect small {
  font-size: 0.65rem;
}
```

Codex must verify actual existing CSS before applying exact selectors.

## 9. Close button / safe-area fix

Current picker close button is too small and the top of the modal can be clipped on iPhone Safari.

Add CSS similar to:

```css
.clientPhotoPickerModal.profileLiteImagePicker {
  padding-top: max(16px, env(safe-area-inset-top));
  max-height: min(88vh, 760px);
  overflow: auto;
}

.clientPhotoPickerHeader {
  position: sticky;
  top: 0;
  z-index: 5;
  background: inherit;
  padding-top: 4px;
}

.clientPhotoPickerHeader button[aria-label*="Закрыть"] {
  width: 40px;
  height: 40px;
  min-width: 40px;
  border-radius: 999px;
  font-size: 28px;
  line-height: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
```

In JSX, change button text from `x` to `×`:

```jsx
<button type="button" onClick={onClose} disabled={isUploading} aria-label="Закрыть выбор изображения">×</button>
```

## 10. Persistence model

No new DB field is required.

When a symbol is dropped/selected into a slot:

```js
object_refs[slotId] = symbol.src
object_ref_urls[symbol.src] = symbol.displaySrc
```

This matches existing saved photo/material behavior.

Important:

- Do not store `data:image` in Supabase if current persistence sanitizer strips it. Codex must verify `powerPlaceClient.js` stripping rules.
- If data URIs are stripped from persistence, use static asset URLs under `/symbols/...` instead of data URIs.
- Preferred durable Phase 1 path: commit SVG assets under `public/symbols/power-place/...` and use `/symbols/power-place/.../*.svg` as `src`.
- If no real symbol graphics are ready, create neutral placeholder SVGs but mark them draft.

## 11. Recommended safer asset approach

Because recent state says persistence strips `data:image`, the safest implementation is:

```text
public/symbols/power-place/zodiac/aries.svg
public/symbols/power-place/zodiac/taurus.svg
...
```

Then library items use:

```js
src: "/symbols/power-place/zodiac/aries.svg",
displaySrc: "/symbols/power-place/zodiac/aries.svg"
```

This avoids signed URL and data URI persistence problems.

If adding many SVGs is too large for one task, add 2–4 draft placeholders per shelf first and document that final author-approved symbols are `needs content`.

## 12. Suggested implementation phases

### Phase 1 — Static library and desktop module

Files:

- `src/data/powerPlaceSymbolLibrary.js`
- `src/pages/profile-lite/ProfileLitePowerPlaceModuleBase.jsx`
- `src/profileMandalaWorkspace.css`
- optional: `public/symbols/power-place/**`
- tests if needed.

Scope:

- add shelves;
- add `Библиотека` module;
- click/drag symbols into slots;
- default shelf follows constructor format.

Checks:

- `npm run test:power-place`
- `npm run test:profile-lite`
- `npm run build`

### Phase 2 — Mobile picker source groups

Files:

- `src/pages/profile-lite/ProfileLiteImagePicker.jsx`
- `src/pages/profile-lite/ProfileLitePowerPlaceModuleBase.jsx`
- `src/profileMandalaWorkspace.css`
- tests if needed.

Scope:

- add `Клиенты / Материалы / Символы / Загрузить своё` source selector;
- add client second-level categories;
- add material category dropdown with `Новые` default;
- add symbol shelf dropdown;
- pass symbol images from Power Place module into picker.

Checks:

- `npm run test:profile-media`
- `npm run test:profile-materials`
- `npm run test:profile-lite`
- `npm run build`

### Phase 3 — UX polish

Files:

- `src/profileMandalaWorkspace.css`
- maybe `ProfileLiteImagePicker.jsx`.

Scope:

- reduce picker thumbnails by about 3x;
- close button visible and not clipped;
- iPhone safe-area top padding;
- no horizontal overflow.

Checks:

- local browser QA at `390x900`;
- local browser QA at desktop `1280x920`.

## 13. Tests to update/add

Recommended tests:

### `test/profileLiteCabinetContract.test.mjs`

Add assertions that source contains:

- `powerPlaceSymbolLibrary`
- `POWER_PLACE_SYMBOL_SHELVES`
- `Библиотека`
- `Ключевые символы`
- `symbolShelfForConstructorType`
- `kind: "symbol-library"`

### `test/powerPlaceStyleContract.test.mjs`

Add assertions for CSS classes:

- `.powerSymbolLibraryPanel`
- `.powerSymbolLibraryGrid`
- `.powerSymbolLibraryItem`
- `.powerSymbolLibraryThumb`
- visible close button selector for picker.

### Optional new test

`test/powerPlaceSymbolLibrary.test.mjs`

Check:

- every shelf has at least one symbol or an explicit empty/draft status;
- every symbol has `id`, `shelf`, `label`, `kind`, `src`, `displaySrc`;
- `symbolShelfForConstructorType("star") === "star"`, etc.

## 14. Commands

Run before changes:

```bash
git status --short
git branch --show-current
git fetch origin
```

Run after implementation:

```bash
npm run test:power-place
npm run test:profile-lite
npm run test:profile-media
npm run test:profile-materials
npm run build
npm run check
git diff --check
```

If browser QA is available:

```bash
npm run dev -- --port 4390
```

Check routes:

- `/`
- `/profile`
- `/profile/mandalas`
- `/masters`
- `/profile/admin`

## 15. Manual QA checklist

Desktop `/profile/mandalas`:

- `Библиотека` appears below `Фон места силы`.
- Shelf defaults to selected format:
  - Зодиак -> Зодиак
  - Звезда -> Звезда
  - Шахматы -> Шахматы
  - Мандала -> Мандала
  - Алтарь -> Алтарь
  - Бизнес -> Бизнес
  - ДАО -> ДАО
- Manual shelf switch works.
- Clicking a symbol inserts it into selected mini-mandala slot.
- Dragging a symbol into a mini-mandala slot works.
- Existing saved photo drag/drop still works.
- Existing cover/center photo picker still works.
- Save/update still works with symbol refs.

Mobile `390x900`:

- Clicking a mini-mandala cell opens picker.
- Picker top is not clipped.
- Close button is visible and easy to tap.
- Picker has source sections:
  - Клиенты
  - Материалы
  - Символы
  - Загрузить своё
- Клиенты second-level categories work:
  - Все
  - Клиент 1
  - Клиент 2
  - Клиент 3
- Материалы category dropdown defaults to `Новые`.
- Символы shelf dropdown defaults to current format shelf.
- Thumbnails are about 3x smaller than current large cards.
- No horizontal overflow.

Regression routes:

- `/` renders.
- `/profile` renders.
- `/profile/mandalas` renders.
- `/masters` renders.
- `/profile/admin` renders.

## 16. Risks

- `data:image` persistence may be stripped by existing sanitizer. Prefer public static SVG paths.
- Adding the library into the wrong column can break the accepted desktop layout.
- Picker changes can break existing upload flows if `onUpload` contract changes.
- Symbol labels/content can imply final sacred knowledge; mark placeholders as draft/needs review.
- Mobile modal can still be clipped if safe-area padding is not applied to the right container.
- Drag/drop is desktop-only; mobile should rely on tap picker.

## 17. Non-goals

Do not implement in this task:

- Supabase symbol library table;
- admin symbol editor;
- paid Pro symbol shelves;
- AI symbol generation;
- production release;
- changes to public homepage;
- changes to Supabase auth redirects;
- changes to Vercel rewrites except if route tests prove an existing issue unrelated to this task.

## 18. Codex report format after implementation

Codex must report:

1. Branch and base commit.
2. Changed files.
3. What was implemented by phase.
4. Checks run and exact exit status.
5. Manual/browser QA results.
6. Risks remaining.
7. What was not verified.
8. Whether `STATE.md` and `LOG.md` were updated.

## 19. Ready-to-copy Codex prompt

```text
Repo: https://github.com/andylitvinov-design/reiki-yggdrasil
Target branch: main
Test site after merge: https://2mentalica.vercel.app
Route: /profile/mandalas

Implement the Power Place Symbol Library according to docs/product/POWER_PLACE_SYMBOL_LIBRARY_TECHNICAL_PLAN_2026-06-09.md.

First read AGENTS.md, README.md, STATE.md, LOG.md, package.json, vercel.json, src/pages/ProfileLitePage.jsx, src/pages/profile-lite/ProfileLitePowerPlaceModuleBase.jsx, src/pages/profile-lite/ProfileLiteImagePicker.jsx, and src/profileMandalaWorkspace.css. If a file is missing, report not found.

Do the work in small safe phases:
1. Add static symbol library data and safe public SVG/draft assets if needed.
2. Add the Библиотека module below Фон места силы in the Power Place controls.
3. Reuse existing chooseImage / assignPowerPlaceSlotImage / drag-drop flow.
4. Extend the mobile picker with Клиенты / Материалы / Символы / Загрузить своё source groups.
5. Reduce picker thumbnails by about 3x and make the close button visible/non-clipped on iPhone Safari.

Do not change production branch/domains, public homepage, Supabase env values, auth redirect logic, or the desktop three-column structure. Do not add a Supabase migration unless you prove it is unavoidable. Prefer static public SVG paths over data:image because persistence may strip data URIs.

Run:
npm run test:power-place
npm run test:profile-lite
npm run test:profile-media
npm run test:profile-materials
npm run build
npm run check
git diff --check

Manual QA: /, /profile, /profile/mandalas, /masters, /profile/admin; desktop 1280x920; mobile 390x900; verify no horizontal overflow, symbol shelf default follows constructor type, click/drag inserts symbols, and existing saved photo/upload flows still work.

Report changed files, checks run, manual QA, risks, and what was not verified. Update STATE.md/LOG.md if implementation changes product behavior.
```
