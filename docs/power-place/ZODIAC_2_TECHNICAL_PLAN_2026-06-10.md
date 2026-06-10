# Zodiac 2 — technical implementation plan

Date: 2026-06-10
Project: Reiki Yggdrasil
Repo: `andylitvinov-design/reiki-yggdrasil`
Scope: docs-only technical plan for implementing `Зодиак 1 / Зодиак 2` in Profile Lite / Power Place.

## 1. Corrected product interpretation

Final user correction:

> Not `Циферблат`; it is `Зодиак 1, 2`.

Therefore this task is about the existing Zodiac constructor, not DAO and not the regular client mandala.

Working meaning:

- `Зодиак 1` = current Zodiac format: center + outer zodiac mini-mandalas/positions.
- `Зодиак 2` = same as current Zodiac, but with an additional inner ring of mini-mandalas between the center and the outer zodiac ring.

Do not implement this as:

- DAO style;
- regular client mandala style;
- new public route;
- new Supabase table.

Implement it as an additive Zodiac layout variant in the existing Power Place constructor.

## 2. Confirmed code area

Primary implementation files:

- `src/pages/profile-lite/ProfileLitePowerPlaceModuleBase.jsx`
- `src/pages/profile-lite/ProfileLitePowerPlaceModule.jsx` only if normalization/hydration of the new variant value is needed there.
- `src/profileMandalaWorkspace.css`

Primary tests:

- `test/powerPlaceStyleContract.test.mjs`
- `test/profileLiteCabinetContract.test.mjs`
- `test/powerPlaceClient.test.mjs` if persistence normalization is changed.

Do not change:

- `/` public home page;
- `/profile`, `/profile/mandalas`, `/masters`, `/profile/admin` routing;
- Supabase auth/env flow;
- Vercel rewrites;
- production branch/deploy config.

## 3. Current code findings

### 3.1 Zodiac is an existing constructor type

`src/pages/profile-lite/ProfileLitePowerPlaceModuleBase.jsx` defines:

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

So `Зодиак 2` should stay under `constructor_type === "zodiac"`.

### 3.2 Existing Zodiac variants

Current variant model:

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

The UI currently shows this selector only for Zodiac:

```jsx
{compositionDraft.constructor_type === "zodiac" && (
  <div className="zodiacCountSelector" aria-label="Количество видимых позиций зодиака">
    <span>Позиции зодиака</span>
    {ZODIAC_VARIANTS.map((variant) => (
      <button
        className={(compositionDraft.zodiac_variant || `classic-${compositionDraft.zodiac_visible_count}`) === variant.value ? "active" : ""}
        key={variant.value}
        onClick={() => {
          onCompositionDraftChange("zodiac_variant", variant.value);
          onCompositionDraftChange("zodiac_visible_count", variant.visibleCount);
        }}
        type="button"
      >
        {variant.label}
      </button>
    ))}
  </div>
)}
```

### 3.3 Current Zodiac render branch

The current Zodiac branch renders:

```jsx
<div className={`zodiacMandalaSheet zodiac-${compositionDraft.zodiac_visible_count || 12} ${(compositionDraft.zodiac_variant || "").startsWith("plus") ? `zodiac-plus-${compositionDraft.zodiac_visible_count || 12}` : ""} ...`}>
  {renderCenterPhotoWithMode("zodiacCenterPhoto")}
  {renderPowerPlaceMotionLayer()}
  <div className="zodiacClockFace" aria-hidden="true">
    <span>ЗОДИАК</span>
  </div>
  {slots.filter((slot) => slot.id.startsWith("zodiac-") && !slot.id.startsWith("zodiac-plus")).map(...)}
</div>
{slots.filter((slot) => slot.id.startsWith("zodiac-plus")).map(...)}
```

So the code already has two concepts:

1. base Zodiac positions: `zodiac-*` slots;
2. plus positions: `zodiac-plus-*` slots.

`Зодиак 2` should reuse this existing pattern where possible, but must be semantically clearer than the old `plus-8 / plus-12` names if those are not the intended UX.

### 3.4 Existing Zodiac CSS

Current CSS has base Zodiac positioning:

```css
.zodiacMandalaSheet { ... }
.zodiacClockFace { ... }
.zodiacCenterPhoto { ... }
.zodiacPosition { ... }
.zodiacPositionImage { ... }
.zodiac-2 .aries { ... }
.zodiac-4 .aries { ... }
.zodiac-6 .aries { ... }
.zodiac-8 .aries { ... }
.zodiac-12 .aries { ... }
```

There is already additional CSS for `zodiac-plus-8`:

```css
/* 2026-05-29 — Zodiac 8+ layout.
   8 = normal circular zodiac.
   8+ = two square orbits: large outer square + smaller inner square. */
.zodiacMandalaSheet.zodiac-plus-8 .zodiacPosition { ... }
...
/* Inner small square: 2 / 4 / 6 / 8 closer to center. */
.zodiacMandalaSheet.zodiac-plus-8 .taurus { ... }
```

This may partially overlap with the requested `Зодиак 2`, but it is not necessarily the same UX because the user said `Зодиак 1, 2`, not `8+ / 12+`.

Codex must inspect current visual behavior before deciding whether to rename/reuse `plus-*` or add a new explicit variant.

## 4. Product/UX recommendation

### 4.1 UI naming

Replace or supplement the current technical-looking Zodiac selector labels with clear format labels:

- `Зодиак 1` — existing classic zodiac ring.
- `Зодиак 2` — zodiac with added inner mini-mandala ring.

Keep existing count controls if needed, but do not confuse the user with only `8+ / 12+` when the product concept is now `Зодиак 1 / Зодиак 2`.

Recommended safe UI model:

1. First selector: `Формат зодиака`
   - `Зодиак 1`
   - `Зодиак 2`
2. Optional second selector: `Позиции`
   - `2`, `4`, `6`, `8`, `12`

However, minimal safe implementation can be:

- add `classic-12` label as `Зодиак 1`;
- add a new `zodiac-2-12` or `plus-12` label as `Зодиак 2`;
- keep existing values backward compatible.

### 4.2 Recommended data model

Do not add a new DB column.

Use existing fields:

- `constructor_type = "zodiac"`;
- `zodiac_visible_count` remains the outer visible count;
- `zodiac_variant` stores the concrete format.

Recommended new value:

```js
"zodiac-2-12"
```

or, if reusing current value is safer:

```js
"plus-12"
```

Decision rule:

- If `plus-12` already behaves as center + outer zodiac + extra inner mini-mandalas, then rename its UI label to `Зодиак 2` and preserve value `plus-12` for compatibility.
- If `plus-12` is absent/incomplete or not visually correct, add a new explicit value `zodiac-2-12` and keep old `plus-12` untouched.

For a first safe MVP, implement `Зодиак 2` for the main full 12-position zodiac first, then expand to 8/6/4 only if requested.

## 5. Slot model for Zodiac 2

### 5.1 Outer ring

Keep all existing base slots unchanged:

- `zodiac-aries`
- `zodiac-taurus`
- `zodiac-gemini`
- `zodiac-cancer`
- `zodiac-leo`
- `zodiac-virgo`
- `zodiac-libra`
- `zodiac-scorpio`
- `zodiac-sagittarius`
- `zodiac-capricorn`
- `zodiac-aquarius`
- `zodiac-pisces`

These are existing saved object ref ids and must not be changed.

### 5.2 Inner ring

Add new stable slot ids for inner mini-mandalas.

Recommended explicit inner ids:

- `zodiac-inner-1`
- `zodiac-inner-2`
- `zodiac-inner-3`
- `zodiac-inner-4`
- `zodiac-inner-5`
- `zodiac-inner-6`
- `zodiac-inner-7`
- `zodiac-inner-8`
- `zodiac-inner-9`
- `zodiac-inner-10`
- `zodiac-inner-11`
- `zodiac-inner-12`

Labels:

- `Внутренняя мандала 1`
- `Внутренняя мандала 2`
- etc.

Reason: the user described extra mini-mandalas near the center, not extra zodiac signs. Neutral numbered labels are safer than inventing symbolic meanings.

Alternative if the inner ring should correspond to zodiac signs:

- `zodiac-inner-aries`
- `zodiac-inner-taurus`
- etc.

But do not assume this unless explicitly confirmed.

## 6. Implementation steps

### Step 1 — inspect current slot building

Find where `slots` is built for `constructor_type === "zodiac"` in `ProfileLitePowerPlaceModuleBase.jsx`.

Search locally for:

- `ZODIAC_SIGNS`
- `ZODIAC_PLUS_SLOT_LAYOUT`
- `zodiac_visible_count`
- `zodiac_variant`
- `slots =`
- `useMemo(() =>` near slot generation.

Goal:

- confirm how `classic-*` slots are created;
- confirm how `plus-*` slots are created;
- identify whether `plus-12` already creates inner slots.

### Step 2 — define the `Зодиак 1 / Зодиак 2` variant mapping

Recommended target:

```jsx
const ZODIAC_FORMATS = [
  { value: "zodiac-1", label: "Зодиак 1" },
  { value: "zodiac-2", label: "Зодиак 2" }
];
```

But do not add another persistence key if unnecessary.

Safer persistence through existing `zodiac_variant`:

```jsx
const ZODIAC_VARIANTS = [
  { value: "classic-12", label: "Зодиак 1", visibleCount: 12, format: "zodiac-1" },
  { value: "zodiac-2-12", label: "Зодиак 2", visibleCount: 12, format: "zodiac-2" }
];
```

If keeping counts is required:

```jsx
const ZODIAC_VARIANTS = [
  { value: "classic-2", label: "2", visibleCount: 2, format: "zodiac-1" },
  { value: "classic-4", label: "4", visibleCount: 4, format: "zodiac-1" },
  { value: "classic-6", label: "6", visibleCount: 6, format: "zodiac-1" },
  { value: "classic-8", label: "8", visibleCount: 8, format: "zodiac-1" },
  { value: "classic-12", label: "Зодиак 1", visibleCount: 12, format: "zodiac-1" },
  { value: "zodiac-2-12", label: "Зодиак 2", visibleCount: 12, format: "zodiac-2" }
];
```

### Step 3 — generate inner slots for Zodiac 2

Add an array:

```jsx
const ZODIAC_INNER_SLOTS = Array.from({ length: 12 }, (_, index) => ({
  id: `zodiac-inner-${index + 1}`,
  className: `inner-${index + 1}`,
  label: `Внутренняя мандала ${index + 1}`
}));
```

When active variant is `zodiac-2-12`, include these inner slots in the same `slots` model so that:

- object picker works;
- drag/drop works;
- pan/zoom works;
- selected slot editor works;
- object_refs persistence works naturally.

### Step 4 — render inner slots inside `.zodiacMandalaSheet`

Current base zodiac positions render inside `.zodiacMandalaSheet`.

Add an inner slots map before or after base slots:

```jsx
{isZodiac2 && slots.filter((slot) => slot.id.startsWith("zodiac-inner-")).map((slot, index) => {
  const src = objectRefs[slot.id] || "";
  const displaySrc = objectRefUrls[src] || src;
  return (
    <div className={`zodiacInnerPosition ${slot.className}${src ? " hasImage" : ""}`} key={slot.id}>
      <button
        className={`zodiacInnerPositionImage slotImagePanZoomTarget${selectedSlotId === slot.id ? " selected" : ""}${dragOverSlotId === slot.id ? " power-place-slot--drag-over" : ""}`}
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
        aria-label={`Выбрать ${slot.label.toLowerCase()}`}
        {...(src ? getSlotImagePanZoomHandlers(slot.id) : {})}
        {...getPowerPlaceSlotDropHandlers(slot.id)}
      >
        {!src && <span>{index + 1}</span>}
      </button>
    </div>
  );
})}
```

Potential improvement: extract a shared Zodiac slot button renderer to avoid duplicating the base slot code.

### Step 5 — CSS for inner ring

Add scoped CSS, do not alter default `.zodiacPosition` globally.

Suggested base:

```css
.zodiacMandalaSheet.zodiac-2-format .zodiacClockFace {
  inset: 10%;
}

.zodiacInnerPosition {
  position: absolute;
  z-index: 7;
  display: grid;
  justify-items: center;
  width: 14%;
  transform: translate(-50%, -50%);
}

.zodiacInnerPositionImage {
  width: min(46px, 100%);
  aspect-ratio: 1;
  transform: scale(var(--power-source-slot-scale));
  transform-origin: center;
  display: grid;
  place-items: center;
  overflow: hidden;
  border: 1px solid rgba(255, 213, 117, 0.72);
  border-radius: 50%;
  background:
    radial-gradient(circle at 45% 35%, #fff0bd, #a66f20 62%, #242b3c 100%);
  background-size: cover;
  background-position: center;
  color: #211407;
  cursor: pointer;
  font: inherit;
  font-weight: 900;
  padding: 0;
}

.zodiacInnerPosition.hasImage .zodiacInnerPositionImage span {
  display: none;
}
```

Suggested 12-position inner ring coordinates:

```css
.zodiacInnerPosition.inner-1 { left: 50%; top: 23%; }
.zodiacInnerPosition.inner-2 { left: 63.5%; top: 26.5%; }
.zodiacInnerPosition.inner-3 { left: 73.5%; top: 36.5%; }
.zodiacInnerPosition.inner-4 { left: 77%; top: 50%; }
.zodiacInnerPosition.inner-5 { left: 73.5%; top: 63.5%; }
.zodiacInnerPosition.inner-6 { left: 63.5%; top: 73.5%; }
.zodiacInnerPosition.inner-7 { left: 50%; top: 77%; }
.zodiacInnerPosition.inner-8 { left: 36.5%; top: 73.5%; }
.zodiacInnerPosition.inner-9 { left: 26.5%; top: 63.5%; }
.zodiacInnerPosition.inner-10 { left: 23%; top: 50%; }
.zodiacInnerPosition.inner-11 { left: 26.5%; top: 36.5%; }
.zodiacInnerPosition.inner-12 { left: 36.5%; top: 26.5%; }
```

Mobile adjustment:

```css
@media (max-width: 640px) {
  .zodiacInnerPositionImage {
    width: min(34px, 100%);
  }

  .zodiacMandalaSheet.zodiac-2-format .zodiacPositionImage {
    width: min(48px, 100%);
  }
}
```

### Step 6 — class marker on sheet

Add class when Zodiac 2 is active:

```jsx
const isZodiac2 = compositionDraft.zodiac_variant === "zodiac-2-12" || compositionDraft.zodiac_variant === "plus-12";
```

Then:

```jsx
<div className={`zodiacMandalaSheet zodiac-${compositionDraft.zodiac_visible_count || 12} ${isZodiac2 ? "zodiac-2-format" : ""} ...`}
```

If `plus-12` is reused, keep compatibility class:

```jsx
${(compositionDraft.zodiac_variant || "").startsWith("plus") ? `zodiac-plus-${compositionDraft.zodiac_visible_count || 12}` : ""}
```

Do not remove existing `zodiac-plus-*` classes without a separate migration decision.

## 7. Persistence / data safety

Expected behavior:

- `zodiac_variant` stores the selected Zodiac variant.
- `zodiac_visible_count` remains 12 for `Зодиак 1` and `Зодиак 2` MVP.
- New inner slot images persist in existing `object_refs` JSON with keys `zodiac-inner-1` ... `zodiac-inner-12`.
- Display URLs resolve through existing `object_ref_urls` where available.
- No Supabase migration should be required.
- No env changes.
- No `data:image` should be saved in persistent payloads.

Codex must verify how `cleanObjectRefs`, save/update, and object ref URL hydration currently handle arbitrary slot ids. The expected result is that arbitrary scalar object refs are already supported.

## 8. Motion/video interaction

Current video mode uses:

```jsx
getMotionPositionsForComposition(compositionDraft, slots)
```

Before implementation, inspect that function.

Safe MVP rule:

- `Зодиак 1` motion behavior must stay unchanged.
- For `Зодиак 2`, do not let motion crash if inner slots are included.
- If motion positions automatically include inner slots and this looks visually too busy, filter motion positions to outer Zodiac slots only for the first implementation.
- Report clearly what was done.

Recommended first implementation:

- inner slots are static selectable mini-mandalas;
- video/motion copies continue to follow the existing outer Zodiac path only.

## 9. Tests to add/update

### 9.1 `test/profileLiteCabinetContract.test.mjs`

Add checks that:

- `Зодиак 1` label exists or existing classic value is preserved;
- `Зодиак 2` label exists;
- `zodiac-2-12` or selected final value exists in code;
- inner slot ids are stable: `zodiac-inner-1`, `zodiac-inner-12`;
- no DAO style keys are used for Zodiac 2.

### 9.2 `test/powerPlaceStyleContract.test.mjs`

Add CSS contract checks:

- `.zodiac-2-format` exists;
- `.zodiacInnerPosition` exists;
- `.zodiacInnerPositionImage` exists;
- mobile rule exists for `.zodiacInnerPositionImage`;
- print/PDF selectors still include Zodiac classes if needed.

### 9.3 `test/powerPlaceClient.test.mjs`

Only if persistence normalizers are touched:

- saved composition with `zodiac_variant: "zodiac-2-12"` keeps the value;
- object refs with `zodiac-inner-1` survive sanitize/clean logic;
- unsafe `data:image` still gets stripped.

## 10. Browser QA checklist

Run local dev or preview and test `/profile/mandalas`.

Desktop:

- select `Зодиак`;
- choose `Зодиак 1`; confirm it looks like current Zodiac and did not regress;
- choose `Зодиак 2`; confirm inner mini-mandalas appear between center and outer zodiac ring;
- assign images to at least one outer and one inner slot;
- pan/zoom inner slot image if slot pan/zoom is available;
- drag/drop image into inner slot;
- verify no console errors;
- verify horizontal overflow is 0.

Mobile 390px width:

- `Зодиак 2` remains usable;
- inner ring is visible but does not cover the center too aggressively;
- no horizontal overflow;
- controls remain tappable.

Routes to sweep:

- `/`
- `/profile`
- `/profile/mandalas`
- `/masters`
- `/profile/admin`

## 11. Commands

```bash
npm install
npm run test:power-place
npm run test:profile-lite
npm run build
npm run check
git diff --check
```

## 12. Risks

- Existing `plus-8` / `plus-12` may already represent a partial second-orbit concept. Codex must inspect before duplicating.
- Adding 12 inner slots can crowd the center on mobile; CSS needs careful sizing.
- If inner slots are added to the global `slots` array, video/motion behavior may include them unexpectedly.
- If `zodiac_variant` normalization exists outside the inspected file, it must be updated or the new value may reset after reload.
- Renaming existing labels may affect user familiarity; preserve values even if labels change.

## 13. Minimal safe implementation strategy

Recommended MVP:

1. Keep `constructor_type === "zodiac"`.
2. Preserve all existing `classic-*` and `plus-*` values unless local inspection proves they should be reused.
3. Add explicit UI label `Зодиак 2` for a full 12-position Zodiac variant.
4. Store the selected variant in existing `zodiac_variant`.
5. Add inner slot ids `zodiac-inner-1` ... `zodiac-inner-12`.
6. Render inner slots only when `Зодиак 2` is active.
7. Keep outer Zodiac slots and saved refs unchanged.
8. Keep motion behavior safe and report whether inner slots are excluded or included.
9. Add style/contract tests.
10. Do not change DB schema, env, routes, homepage, or deployment config.

## 14. Codex implementation prompt

Use this prompt for the implementation PR:

```text
Repo: andylitvinov-design/reiki-yggdrasil
Target branch: main
Task: implement `Зодиак 2` format in Profile Lite / Power Place.

First read: AGENTS.md, README.md, STATE.md, LOG.md, package.json, vercel.json, src/lib/supabaseClient.js, src/pages/profile-lite/ProfileLitePowerPlaceModuleBase.jsx, src/pages/profile-lite/ProfileLitePowerPlaceModule.jsx, src/profileMandalaWorkspace.css, test/powerPlaceStyleContract.test.mjs, test/profileLiteCabinetContract.test.mjs.

Important correction: this is NOT DAO and NOT regular clockface/client mandala. Implement under constructor_type="zodiac".

Product target:
- `Зодиак 1` = current Zodiac format.
- `Зодиак 2` = current Zodiac plus an additional inner ring of mini-mandalas between center and outer zodiac positions.

Implementation requirements:
- preserve existing Zodiac behavior and object ref ids;
- add inner slots with stable ids `zodiac-inner-1` ... `zodiac-inner-12`;
- support picker, drag/drop, selected slot editor, pan/zoom, save/reload through existing object_refs;
- no Supabase migration unless local code proves it is required;
- no env values, no production deploy, no route rewrite changes;
- keep RU default;
- keep desktop 3-column and mobile fallback.

Before coding, inspect whether existing `plus-8` / `plus-12` already implement the needed second-ring concept. If yes, reuse/rename safely instead of duplicating. If not, add a new explicit `zodiac-2-12` variant.

Files likely to change:
- src/pages/profile-lite/ProfileLitePowerPlaceModuleBase.jsx
- src/profileMandalaWorkspace.css
- test/powerPlaceStyleContract.test.mjs
- test/profileLiteCabinetContract.test.mjs
- maybe src/pages/profile-lite/ProfileLitePowerPlaceModule.jsx or test/powerPlaceClient.test.mjs if normalization/persistence requires it.

Checks:
npm install
npm run test:power-place
npm run test:profile-lite
npm run build
npm run check
git diff --check

Browser QA:
- /, /profile, /profile/mandalas, /masters, /profile/admin
- desktop and mobile 390px
- no console errors
- no horizontal overflow
- verify `Зодиак 1` unchanged
- verify `Зодиак 2` shows inner mini-mandala ring and slots accept images.

Report:
- changed files
- chosen variant value and why
- whether plus-8/plus-12 was reused or not
- checks run
- browser QA result
- what was not verified
- risks
```
