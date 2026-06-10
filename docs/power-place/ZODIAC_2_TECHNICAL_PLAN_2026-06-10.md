# Zodiac 2 — code-level implementation plan

Date: 2026-06-10
Project: Reiki Yggdrasil
Repo: `andylitvinov-design/reiki-yggdrasil`
Status: technical planning document, docs-only.
Target implementation branch: `main`.

## 1. Final product meaning

User correction:

- This is not `Циферблат`.
- This is not DAO.
- Correct feature name: `Зодиак 1 / Зодиак 2`.

Required behavior:

- `Зодиак 1` = current Zodiac constructor layout: center photo + outer Zodiac mini-mandalas.
- `Зодиак 2` = same Zodiac constructor, but with an additional inner ring of mini-mandalas between the center photo and the outer Zodiac mini-mandalas.

Implementation boundary:

- Keep `constructor_type === "zodiac"`.
- Do not create a new constructor type.
- Do not implement this through `__dao_style`.
- Do not create a Supabase migration.
- Do not change routes, env, Vercel config, homepage, public masters page, or admin routes.

## 2. Best implementation strategy

Best technical solution:

1. Keep the existing Zodiac constructor and persistence model.
2. Add a new Zodiac variant value under existing `zodiac_variant`.
3. Generate additional inner-ring slots only for that variant.
4. Render those inner slots inside the existing `.zodiacMandalaSheet`.
5. Add scoped CSS for `.zodiac-2-format` and `.zodiacInnerPosition*`.
6. Keep the existing outer Zodiac slots untouched for backward compatibility.

Recommended new variant value:

```js
"zodiac-2-12"
```

Reason:

- It is explicit.
- It does not overload existing `plus-8` / `plus-12` behavior.
- It lets old saved compositions continue to load exactly as before.
- It lets tests distinguish the new product format from old experimental `plus-*` variants.

Safe UX label:

```js
{ value: "classic-12", label: "Зодиак 1", visibleCount: 12 }
{ value: "zodiac-2-12", label: "Зодиак 2", visibleCount: 12 }
```

For MVP, implement full 12-position Zodiac only:

- `Зодиак 1` = `classic-12`.
- `Зодиак 2` = `zodiac-2-12`.

Do not expand to `2 / 4 / 6 / 8` until product design confirms how those should look.

## 3. Exact code findings

### 3.1 Main file

Primary file:

```text
src/pages/profile-lite/ProfileLitePowerPlaceModuleBase.jsx
```

This file contains:

- constructor type list;
- Zodiac variant list;
- slot building function;
- motion position function;
- Zodiac JSX render branch;
- picker / drag-drop / pan-zoom handlers for slots.

### 3.2 Zodiac constructor exists already

Current constructor list:

```jsx
const CONSTRUCTOR_TYPES = [
  { value: "zodiac", label: "Зодиак" },
  { value: "star", label: "Звезда" },
  { value: "chess", label: "Шахматы" },
  { value: "client", label: "Мандала" },
  { value: "altar", label: "Алтарь" },
  { value: "business", label: "Бизнес" },
  { value: "dao", label: "ДАО" }
];
```

Do not add `zodiac2` here. `Зодиак 2` is a variant of `zodiac`, not a new constructor.

### 3.3 Current Zodiac variants

Current code:

```jsx
const ZODIAC_VARIANTS = [
  { value: "classic-2", label: "2", visibleCount: 2 },
  { value: "classic-4", label: "4", visibleCount: 4 },
  { value: "classic-6", label: "6", visibleCount: 6 },
  { value: "classic-8", label: "8", visibleCount: 8 },
  { value: "plus-8", label: "8+", visibleCount: 8 },
  { value: "classic-12", label: "12", visibleCount: 12 },
  { value: "plus-12", label: "12+", visibleCount: 12 }
];
```

Recommended change:

```jsx
const ZODIAC_VARIANTS = [
  { value: "classic-12", label: "Зодиак 1", visibleCount: 12 },
  { value: "zodiac-2-12", label: "Зодиак 2", visibleCount: 12 }
];
```

Conservative alternative if old count variants must remain visible:

```jsx
const ZODIAC_VARIANTS = [
  { value: "classic-2", label: "2", visibleCount: 2 },
  { value: "classic-4", label: "4", visibleCount: 4 },
  { value: "classic-6", label: "6", visibleCount: 6 },
  { value: "classic-8", label: "8", visibleCount: 8 },
  { value: "plus-8", label: "8+", visibleCount: 8 },
  { value: "classic-12", label: "Зодиак 1", visibleCount: 12 },
  { value: "zodiac-2-12", label: "Зодиак 2", visibleCount: 12 }
];
```

Do not use label `12+` for the new product concept. The user asked for `Зодиак 1 / Зодиак 2`.

### 3.4 Existing slot builder

Current function:

```jsx
function buildSlotList(draft) {
  const type = draft.constructor_type || "zodiac";
  ...
  if (type === "zodiac") {
    const visibleCount = Number(draft.zodiac_visible_count) || 12;
    const variant = draft.zodiac_variant || (visibleCount === 8 ? "classic-8" : visibleCount === 12 ? "classic-12" : `classic-${visibleCount}`);
    const isPlusVariant = variant.startsWith("plus");
    const signSlots = ZODIAC_SIGNS.slice(0, isPlusVariant ? 8 : visibleCount).map((sign, index) => ({
      id: `zodiac-${index + 1}`,
      label: sign.label,
      className: sign.className,
      classPrefix: "classic"
    }));

    if (!isPlusVariant) return signSlots;
    if (visibleCount === 8) return signSlots;
    return [...signSlots, ...(ZODIAC_PLUS_SLOT_LAYOUT[visibleCount] || ZODIAC_PLUS_SLOT_LAYOUT[8])];
  }
  ...
}
```

Important compatibility fact:

- Current outer Zodiac slot ids are numeric: `zodiac-1`, `zodiac-2`, ..., not `zodiac-aries`.
- Do not rename existing outer slot ids.
- Saved object refs depend on these ids.

Problem in current `plus-*` model:

- `isPlusVariant = variant.startsWith("plus")`.
- For `plus-12`, `signSlots` uses only the first 8 signs because `isPlusVariant ? 8 : visibleCount`.
- Then it adds `ZODIAC_PLUS_SLOT_LAYOUT[12]`, which currently contains only 4 extra corner slots.
- So `plus-12` is not the requested `Зодиак 2` with a full 12 outer ring plus inner ring. It is a different 8+4 layout.

Therefore best implementation is a new explicit `zodiac-2-12` branch.

## 4. Concrete code changes

### 4.1 Add helper constants near `ZODIAC_PLUS_SLOT_LAYOUT`

Add after `ZODIAC_PLUS_SLOT_LAYOUT`:

```jsx
const ZODIAC_2_VARIANT = "zodiac-2-12";

const ZODIAC_2_INNER_SLOTS = Array.from({ length: 12 }, (_, index) => ({
  id: `zodiac-inner-${index + 1}`,
  className: `inner-${index + 1}`,
  label: `Внутренняя мандала ${index + 1}`,
  classPrefix: "inner"
}));

function isZodiac2Variant(value) {
  return String(value || "") === ZODIAC_2_VARIANT;
}
```

Reason:

- Gives Codex one stable source of truth.
- Avoids string duplication.
- Keeps new inner slot ids predictable.

### 4.2 Update `ZODIAC_VARIANTS`

Preferred MVP:

```jsx
const ZODIAC_VARIANTS = [
  { value: "classic-12", label: "Зодиак 1", visibleCount: 12 },
  { value: ZODIAC_2_VARIANT, label: "Зодиак 2", visibleCount: 12 }
];
```

If preserving old variants in UI is required, use this instead:

```jsx
const ZODIAC_VARIANTS = [
  { value: "classic-2", label: "2", visibleCount: 2 },
  { value: "classic-4", label: "4", visibleCount: 4 },
  { value: "classic-6", label: "6", visibleCount: 6 },
  { value: "classic-8", label: "8", visibleCount: 8 },
  { value: "plus-8", label: "8+", visibleCount: 8 },
  { value: "classic-12", label: "Зодиак 1", visibleCount: 12 },
  { value: ZODIAC_2_VARIANT, label: "Зодиак 2", visibleCount: 12 }
];
```

The cleaner UX is the first option.

### 4.3 Update `buildSlotList(draft)`

Replace the current Zodiac block with a branch that handles `zodiac-2-12` before `plus-*` logic.

Recommended implementation:

```jsx
if (type === "zodiac") {
  const visibleCount = Number(draft.zodiac_visible_count) || 12;
  const variant = draft.zodiac_variant || (visibleCount === 8 ? "classic-8" : visibleCount === 12 ? "classic-12" : `classic-${visibleCount}`);
  const zodiac2 = isZodiac2Variant(variant);
  const isPlusVariant = !zodiac2 && variant.startsWith("plus");
  const baseVisibleCount = zodiac2 ? 12 : visibleCount;

  const signSlots = ZODIAC_SIGNS.slice(0, isPlusVariant ? 8 : baseVisibleCount).map((sign, index) => ({
    id: `zodiac-${index + 1}`,
    label: sign.label,
    className: sign.className,
    classPrefix: "classic"
  }));

  if (zodiac2) return [...signSlots, ...ZODIAC_2_INNER_SLOTS];
  if (!isPlusVariant) return signSlots;
  if (visibleCount === 8) return signSlots;
  return [...signSlots, ...(ZODIAC_PLUS_SLOT_LAYOUT[visibleCount] || ZODIAC_PLUS_SLOT_LAYOUT[8])];
}
```

Why this is best:

- `Зодиак 2` keeps all 12 outer signs.
- Inner ring is additional, not a replacement for signs 9-12.
- Old `plus-*` logic remains available if existing saved compositions use it.
- Existing outer object refs `zodiac-1` ... `zodiac-12` stay compatible.

### 4.4 Add derived variables before render

Inside component, near existing `const slots = useMemo(...)` / derived render variables, add:

```jsx
const zodiacVariant = compositionDraft.zodiac_variant || `classic-${compositionDraft.zodiac_visible_count || 12}`;
const isZodiac2 = compositionDraft.constructor_type === "zodiac" && isZodiac2Variant(zodiacVariant);
```

If `zodiacVariant` already exists locally, reuse it instead of duplicating.

### 4.5 Update Zodiac selector text

Current selector label:

```jsx
<span>Позиции зодиака</span>
```

Recommended change:

```jsx
<span>Формат зодиака</span>
```

Keep existing click behavior:

```jsx
onClick={() => {
  onCompositionDraftChange("zodiac_variant", variant.value);
  onCompositionDraftChange("zodiac_visible_count", variant.visibleCount);
}}
```

For `Зодиак 2`, this will write:

```js
zodiac_variant = "zodiac-2-12"
zodiac_visible_count = 12
```

### 4.6 Update Zodiac sheet className

Current class fragment:

```jsx
<div className={`zodiacMandalaSheet zodiac-${compositionDraft.zodiac_visible_count || 12} ${(compositionDraft.zodiac_variant || "").startsWith("plus") ? `zodiac-plus-${compositionDraft.zodiac_visible_count || 12}` : ""} cover-${innerCover?.tone || "gold"} ${innerCoverClass}`.trim()} ...>
```

Recommended replacement:

```jsx
const zodiacPlusClass = !isZodiac2 && (compositionDraft.zodiac_variant || "").startsWith("plus")
  ? `zodiac-plus-${compositionDraft.zodiac_visible_count || 12}`
  : "";
const zodiac2Class = isZodiac2 ? "zodiac-2-format" : "";
```

Then:

```jsx
<div className={`zodiacMandalaSheet zodiac-${compositionDraft.zodiac_visible_count || 12} ${zodiacPlusClass} ${zodiac2Class} cover-${innerCover?.tone || "gold"} ${innerCoverClass}`.trim()} ...>
```

### 4.7 Add a shared render helper for Zodiac slot buttons

Current code duplicates a lot of button markup for `zodiacPosition` and `zodiacFieldPlusPosition`.

Add helper near `renderObjectImageButton`:

```jsx
const renderZodiacSlotButton = (slot, index, wrapperClassName, buttonClassName, ariaPrefix = "знак") => {
  const src = objectRefs[slot.id] || "";
  const displaySrc = objectRefUrls[src] || src;

  return (
    <div className={`${wrapperClassName} ${slot.className || ""}${src ? " hasImage" : ""}`} key={slot.id}>
      <button
        className={`${buttonClassName} slotImagePanZoomTarget${selectedSlotId === slot.id ? " selected" : ""}${dragOverSlotId === slot.id ? " power-place-slot--drag-over" : ""}`}
        onClick={() => {
          if (suppressSlotPickerClickRef.current[slot.id]) {
            suppressSlotPickerClickRef.current[slot.id] = false;
            return;
          }
          openObjectPicker(slot.id);
        }}
        style={src ? slotImageStyle(slot.id, displaySrc) : imageStyle(displaySrc)}
        type="button"
        title={slot.label}
        aria-label={`Выбрать ${ariaPrefix} ${slot.label}`}
        {...(src ? getSlotImagePanZoomHandlers(slot.id) : {})}
        {...getPowerPlaceSlotDropHandlers(slot.id)}
      >
        {!src && <span>{index + 1}</span>}
      </button>
      {wrapperClassName === "zodiacPosition" && <b>{slot.label}</b>}
    </div>
  );
};
```

Then use it for:

- outer Zodiac slots;
- plus slots;
- new inner slots.

If Codex wants the smallest diff, it can avoid this helper and duplicate only the inner-ring map. But the helper is cleaner and reduces risk of missing drag/drop or pan/zoom props.

### 4.8 Render inner slots only for Zodiac 2

Inside the Zodiac branch, after `.zodiacClockFace` and before outer slot map, add:

```jsx
{isZodiac2 && slots
  .filter((slot) => slot.id.startsWith("zodiac-inner-"))
  .map((slot, index) => renderZodiacSlotButton(
    slot,
    index,
    "zodiacInnerPosition",
    "zodiacInnerPositionImage",
    "внутреннюю мандалу"
  ))}
```

Outer slots must filter out inner and plus slots:

```jsx
{slots
  .filter((slot) => slot.id.startsWith("zodiac-") && !slot.id.startsWith("zodiac-plus") && !slot.id.startsWith("zodiac-inner-"))
  .map((slot, index) => renderZodiacSlotButton(
    slot,
    index,
    "zodiacPosition",
    "zodiacPositionImage",
    "знак"
  ))}
```

Important:

- If Codex keeps the old inline outer map, update its filter to exclude `zodiac-inner-`.
- Otherwise inner slots will be incorrectly rendered as outer `zodiacPosition` as well.

### 4.9 Keep plus-slot render unchanged or helper-based

Existing plus slots are rendered outside `.zodiacMandalaSheet`:

```jsx
{slots.filter((slot) => slot.id.startsWith("zodiac-plus")).map(...)}
```

Leave this behavior unchanged for old `plus-*` variants.

Do not render `zodiac-inner-*` outside the sheet.

## 5. CSS implementation

Primary file:

```text
src/profileMandalaWorkspace.css
```

Add the new CSS near existing Zodiac styles, around `.zodiacMandalaSheet`, `.zodiacClockFace`, `.zodiacPosition`, and `.zodiac-12` rules.

### 5.1 Add scoped sheet class

```css
.zodiacMandalaSheet.zodiac-2-format {
  overflow: hidden;
}

.zodiacMandalaSheet.zodiac-2-format .zodiacClockFace {
  inset: 12%;
  opacity: 0.8;
}
```

### 5.2 Inner position base styles

```css
.zodiacInnerPosition {
  position: absolute;
  z-index: 7;
  display: grid;
  justify-items: center;
  gap: 2px;
  width: 13%;
  transform: translate(-50%, -50%);
}

.zodiacInnerPositionImage {
  width: min(48px, 100%);
  aspect-ratio: 1;
  transform: scale(var(--power-source-slot-scale));
  transform-origin: center;
  display: grid;
  place-items: center;
  overflow: hidden;
  border: 1px solid rgba(255, 213, 117, 0.74);
  border-radius: 50%;
  background:
    radial-gradient(circle at 45% 35%, #fff0bd, #a66f20 62%, #242b3c 100%);
  background-size: cover;
  background-position: center;
  color: #211407;
  cursor: pointer;
  font: inherit;
  font-size: 10px;
  font-weight: 900;
  padding: 0;
  box-shadow: 0 0 16px rgba(128, 114, 54, 0.22);
}

.zodiacInnerPosition.hasImage .zodiacInnerPositionImage span {
  display: none;
}
```

### 5.3 Inner ring coordinates

Use a smaller radius than the outer `zodiac-12` ring and larger than the center photo.

Outer ring currently uses positions around 7–93%.
Center photo width is around 31%.
Safe inner ring: about 27–73%.

```css
.zodiacInnerPosition.inner-1 { left: 50%; top: 24%; }
.zodiacInnerPosition.inner-2 { left: 63%; top: 27%; }
.zodiacInnerPosition.inner-3 { left: 73%; top: 37%; }
.zodiacInnerPosition.inner-4 { left: 76%; top: 50%; }
.zodiacInnerPosition.inner-5 { left: 73%; top: 63%; }
.zodiacInnerPosition.inner-6 { left: 63%; top: 73%; }
.zodiacInnerPosition.inner-7 { left: 50%; top: 76%; }
.zodiacInnerPosition.inner-8 { left: 37%; top: 73%; }
.zodiacInnerPosition.inner-9 { left: 27%; top: 63%; }
.zodiacInnerPosition.inner-10 { left: 24%; top: 50%; }
.zodiacInnerPosition.inner-11 { left: 27%; top: 37%; }
.zodiacInnerPosition.inner-12 { left: 37%; top: 27%; }
```

### 5.4 Optional outer-ring tightening for Zodiac 2

If visual QA shows crowding, slightly reduce outer slot image size only in Zodiac 2:

```css
.zodiacMandalaSheet.zodiac-2-format .zodiacPositionImage {
  width: min(60px, 100%);
}
```

Do not change global `.zodiacPositionImage` unless necessary.

### 5.5 Mobile CSS

Add inside existing `@media (max-width: 640px)` or near Zodiac mobile rules:

```css
@media (max-width: 640px) {
  .zodiacInnerPosition {
    width: 12%;
  }

  .zodiacInnerPositionImage {
    width: min(34px, 100%);
    font-size: 9px;
  }

  .zodiacMandalaSheet.zodiac-2-format .zodiacPositionImage {
    width: min(48px, 100%);
  }
}
```

## 6. Dynamic fit styles in wrapper

File:

```text
src/pages/profile-lite/ProfileLitePowerPlaceModule.jsx
```

This wrapper injects dynamic CSS for image display and print/PDF. It already includes `.zodiacPositionImage[style]` and related selectors.

Add new selectors where needed:

### 6.1 Background-size/pan-zoom selector

In `profileLiteFitFixStyles`, extend selector groups that include:

```css
.profileLitePowerPlace .zodiacPositionImage[style],
.profileLitePowerPlace .zodiacFieldPlusPositionImage[style],
```

Add:

```css
.profileLitePowerPlace .zodiacInnerPositionImage[style],
.powerPlacePdfOnlyArea .zodiacInnerPositionImage[style],
```

### 6.2 Pseudo cleanup selector

Where the CSS disables pseudo-elements for slot images, add:

```css
.profileLitePowerPlace .zodiacInnerPositionImage[style]::before,
.profileLitePowerPlace .zodiacInnerPositionImage[style]::after,
.powerPlacePdfOnlyArea .zodiacInnerPositionImage[style]::before,
.powerPlacePdfOnlyArea .zodiacInnerPositionImage[style]::after,
```

### 6.3 Parent transparency selector

Where the CSS has:

```css
.profileLitePowerPlace .zodiacPosition.hasImage,
.profileLitePowerPlace .zodiacFieldPlusPosition.hasImage,
```

Add:

```css
.profileLitePowerPlace .zodiacInnerPosition.hasImage,
.powerPlacePdfOnlyArea .zodiacInnerPosition.hasImage,
```

Reason:

- Without these additions, uploaded images may render but lose consistent pan/zoom, background sizing, or PDF styling.

## 7. Persistence behavior

No DB migration expected.

Existing save path stores object refs in JSON. New inner slots should persist naturally as scalar keys:

```json
{
  "zodiac-inner-1": "storage://profile-cabinet-media/...",
  "zodiac-inner-2": "storage://profile-cabinet-media/..."
}
```

Must verify in code:

- `cleanObjectRefs` accepts arbitrary scalar keys.
- save/update code does not whitelist slot ids.
- object ref URL hydration resolves display URLs for arbitrary refs.
- unsafe `data:image` is still stripped by existing persistence pipeline.

Do not add:

- Supabase column;
- migration;
- env variable;
- storage bucket;
- new table.

## 8. Motion/video behavior

Current motion code:

```jsx
function getMotionPositionsForComposition(draft, slots) {
  const type = draft?.constructor_type || "zodiac";
  ...
  if (type === "zodiac") return clockPositions(Number(draft.zodiac_visible_count) || 12, ZODIAC_VIDEO_COPY_SAFE_RADIUS);
  ...
}
```

This means motion copies for Zodiac currently follow a safe inner ring based on `zodiac_visible_count`, not slot ids.

Recommended behavior for MVP:

- Keep this function unchanged.
- For `Зодиак 2`, motion will still follow the existing safe Zodiac motion radius.
- Do not make video copies jump through all 24 outer+inner slots in the first implementation.

Reason:

- The user asked for visual extra mini-mandalas, not new video behavior.
- Keeping motion unchanged reduces risk.

If visual QA shows conflict between motion copies and inner mini-mandalas, add one small conditional:

```jsx
if (type === "zodiac" && isZodiac2Variant(draft.zodiac_variant)) {
  return clockPositions(12, 20);
}
```

But only do this after checking visuals.

## 9. Tests to update

### 9.1 `test/profileLiteCabinetContract.test.mjs`

Add assertions:

- file contains `ZODIAC_2_VARIANT`;
- file contains `zodiac-2-12`;
- file contains label `Зодиак 2`;
- file contains `ZODIAC_2_INNER_SLOTS`;
- file contains `zodiac-inner-1` and `zodiac-inner-12`;
- outer filter excludes `zodiac-inner-` from normal outer `zodiacPosition` rendering;
- code does not add `zodiac2` to `CONSTRUCTOR_TYPES`;
- code does not use `__dao_style` for Zodiac 2.

Example test intent:

```js
assert(source.includes('const ZODIAC_2_VARIANT = "zodiac-2-12"'));
assert(source.includes('label: "Зодиак 2"'));
assert(source.includes('ZODIAC_2_INNER_SLOTS'));
assert(source.includes('zodiac-inner-${index + 1}'));
assert(source.includes('!slot.id.startsWith("zodiac-inner-")'));
assert(!source.includes('{ value: "zodiac2"'));
```

### 9.2 `test/powerPlaceStyleContract.test.mjs`

Add assertions that CSS contains:

- `.zodiacMandalaSheet.zodiac-2-format`;
- `.zodiacInnerPosition`;
- `.zodiacInnerPositionImage`;
- `.zodiacInnerPosition.inner-1`;
- `.zodiacInnerPosition.inner-12`;
- mobile rule for `.zodiacInnerPositionImage`.

Also check wrapper dynamic CSS if tests read `ProfileLitePowerPlaceModule.jsx`:

- `.zodiacInnerPositionImage[style]` appears in fit-fix selector groups.

### 9.3 `test/powerPlaceClient.test.mjs`

Only needed if save/hydration logic is changed.

Suggested checks if touched:

- composition with `zodiac_variant: "zodiac-2-12"` keeps the value;
- `object_refs["zodiac-inner-1"]` survives normalizer;
- `data:image` refs are still removed.

## 10. Browser QA

Must check:

- `/`
- `/profile`
- `/profile/mandalas`
- `/masters`
- `/profile/admin`

Inside `/profile/mandalas`:

1. Select `Зодиак`.
2. Select `Зодиак 1`.
3. Confirm it looks like the old full Zodiac.
4. Select `Зодиак 2`.
5. Confirm inner ring appears between center and outer ring.
6. Add image to one outer slot.
7. Add image to one inner slot.
8. Drag/drop image into one inner slot.
9. Check selected slot editor works for inner slot.
10. Check no horizontal overflow on desktop.
11. Check mobile width 390px.
12. Check console errors = 0.

If real Supabase is available:

- save composition;
- reload composition;
- verify `zodiac_variant` and inner slot images persist.

If real Supabase is not available, report:

```text
Real authenticated Supabase save/reload not verified.
```

## 11. Commands

```bash
npm install
npm run test:power-place
npm run test:profile-lite
npm run build
npm run check
git diff --check
```

## 12. File-by-file checklist for Codex

### `src/pages/profile-lite/ProfileLitePowerPlaceModuleBase.jsx`

Change:

- add `ZODIAC_2_VARIANT`;
- add `ZODIAC_2_INNER_SLOTS`;
- add `isZodiac2Variant`;
- update `ZODIAC_VARIANTS` labels/values;
- update `buildSlotList` Zodiac block;
- add `isZodiac2` derived value;
- update Zodiac sheet className;
- update outer Zodiac slot filter to exclude `zodiac-inner-`;
- render inner slots when `isZodiac2`;
- keep motion behavior unchanged unless visual QA requires a small adjustment.

### `src/profileMandalaWorkspace.css`

Change:

- add `.zodiacMandalaSheet.zodiac-2-format`;
- add `.zodiacInnerPosition`;
- add `.zodiacInnerPositionImage`;
- add `.zodiacInnerPosition.inner-1` through `.inner-12`;
- add mobile sizing;
- do not globally shrink existing Zodiac unless necessary.

### `src/pages/profile-lite/ProfileLitePowerPlaceModule.jsx`

Change only dynamic CSS selector groups:

- add `.zodiacInnerPositionImage[style]`;
- add `.zodiacInnerPositionImage[style]::before/::after`;
- add `.zodiacInnerPosition.hasImage`.

### Tests

Change:

- `test/profileLiteCabinetContract.test.mjs` for code contract;
- `test/powerPlaceStyleContract.test.mjs` for CSS contract;
- `test/powerPlaceClient.test.mjs` only if persistence code changed.

## 13. Risks

- Current `plus-12` is not equivalent to requested `Зодиак 2`; do not blindly rename it.
- If inner slots are not excluded from the outer filter, they will render twice or incorrectly.
- If wrapper dynamic CSS is not updated, inner slot images may not match pan/zoom/PDF behavior.
- If mobile sizes are too large, inner ring will cover the center photo.
- If `ZODIAC_VARIANTS` is reduced to only two options, old 2/4/6/8 variants disappear from UI; decide whether this is acceptable before coding.

## 14. Recommended Codex prompt

```text
Repo: andylitvinov-design/reiki-yggdrasil
Target branch: main
Task: implement Zodiac 2 in Profile Lite / Power Place.

Read first:
- AGENTS.md
- README.md
- STATE.md
- LOG.md
- package.json
- vercel.json
- src/lib/supabaseClient.js
- src/pages/profile-lite/ProfileLitePowerPlaceModuleBase.jsx
- src/pages/profile-lite/ProfileLitePowerPlaceModule.jsx
- src/profileMandalaWorkspace.css
- test/profileLiteCabinetContract.test.mjs
- test/powerPlaceStyleContract.test.mjs

Important product correction:
- This is not DAO.
- This is not a regular clockface/client mandala.
- Keep constructor_type="zodiac".
- Зодиак 1 = current classic full Zodiac.
- Зодиак 2 = classic full Zodiac plus an additional inner ring of mini-mandalas between center and outer Zodiac ring.

Implement technically:
1. In ProfileLitePowerPlaceModuleBase.jsx add:
   - const ZODIAC_2_VARIANT = "zodiac-2-12";
   - const ZODIAC_2_INNER_SLOTS = Array.from({ length: 12 }, ... ids zodiac-inner-1..12);
   - function isZodiac2Variant(value).
2. Update ZODIAC_VARIANTS so UI has clear labels `Зодиак 1` and `Зодиак 2`. Prefer MVP with only classic-12 and zodiac-2-12 unless preserving old 2/4/6/8 variants is required.
3. Update buildSlotList(draft): when variant is zodiac-2-12, return 12 existing outer slots (`zodiac-1`..`zodiac-12`) plus `ZODIAC_2_INNER_SLOTS`.
4. Add derived `isZodiac2` and `zodiac-2-format` class to `.zodiacMandalaSheet`.
5. Render `zodiac-inner-*` slots inside `.zodiacMandalaSheet`, with picker, drag/drop, pan/zoom, selected state, and object ref persistence using existing handlers.
6. Update outer Zodiac filter to exclude `zodiac-inner-`.
7. Do not change current plus-* behavior unless necessary.
8. Keep motion/video unchanged unless visual QA shows overlap.
9. In profileMandalaWorkspace.css add scoped Zodiac 2 CSS for `.zodiacInnerPosition*` and mobile sizing.
10. In ProfileLitePowerPlaceModule.jsx add `.zodiacInnerPositionImage[style]` and `.zodiacInnerPosition.hasImage` to dynamic fit/PDF selector groups.
11. Add/update contract tests.

Do not change:
- homepage;
- routes;
- Vercel config;
- Supabase schema/env;
- production branch;
- DAO styles;
- saved outer Zodiac slot ids.

Run:
npm install
npm run test:power-place
npm run test:profile-lite
npm run build
npm run check
git diff --check

Browser QA:
- /, /profile, /profile/mandalas, /masters, /profile/admin
- desktop and mobile 390px
- verify Зодиак 1 unchanged
- verify Зодиак 2 inner ring visible
- verify inner slot image picker/drag-drop/pan-zoom
- no console errors
- no horizontal overflow

Report:
- changed files
- exact variant value used
- whether old 2/4/6/8 variants were preserved or hidden
- checks run
- browser QA result
- what was not verified
- risks
```
