# Power Place Zodiac / Early Formats Correction Program

Date: 2026-06-09
Project: Reiki Yggdrasil / Mentalica
Repo: `andylitvinov-design/reiki-yggdrasil`
Target branch for implementation: `main`
Target URL: `https://mentalica.vercel.app`
Legacy/current URL: `https://reiki-yggdrasil.vercel.app`

## Goal

Fix the Power Place (`/profile`) mandala constructor issues for early formats, especially `constructor_type === "zodiac"`, without rewriting the module or touching unrelated profile/Supabase/Vercel flows.

This document is an implementation brief for Codex. It records the exact code locations, suspected root causes, safe fix strategy, manual QA, commands, risks, and report format.

## User-visible issues

1. In the Zodiac constructor, the center photo visually looks off-center / too low in the mandala.
2. The inner field still shows a fill/background when the user selects inner cover `Без фона`.
3. In square field layout, early formats such as Zodiac still show a circular inner mandala/clock face inside the square field. The result looks like both a square and a circle at the same time.
4. Zodiac constellation/sign labels are visible inside the mandala and should be removed from the mandala canvas.
5. In-mandala background buttons are stacked together in the top-left corner. They must be separated:
   - top-left: `◎ Внутрь`
   - top-right: `▣ Снаружи`

## Hard constraints

Do not change:

- public home page `/`
- `/masters`
- `/profile/admin`
- Supabase auth/data flows
- Vercel rewrites
- env values or secrets
- production branch/settings
- RU-default interface
- accepted desktop three-column layout
- unrelated modules: materials, feed, services, masters, admin, auth

Use env names only if needed:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_ADMIN_EMAIL`

## Files to read before implementation

Read these first and report `not found` for any missing file:

1. `AGENTS.md`
2. `README.md`
3. `STATE.md`
4. `LOG.md`
5. `docs/release-workflow.md`
6. `docs/deploy-fallback.md`
7. `package.json`
8. `vercel.json`
9. `src/lib/supabaseClient.js`
10. `src/pages/profile-lite/ProfileLitePowerPlaceModuleBase.jsx`
11. `src/profileMandalaWorkspace.css`
12. `test/powerPlaceClient.test.mjs`
13. `test/powerPlaceStyleContract.test.mjs`

## Primary implementation files

Expected changed files:

- `src/pages/profile-lite/ProfileLitePowerPlaceModuleBase.jsx`
- `src/profileMandalaWorkspace.css`
- optional: `test/powerPlaceStyleContract.test.mjs`
- optional: `test/powerPlaceClient.test.mjs`

## Current code map

### Constructor and Zodiac data

In `src/pages/profile-lite/ProfileLitePowerPlaceModuleBase.jsx`:

- `CONSTRUCTOR_TYPES` includes `{ value: "zodiac", label: "Зодиак" }`.
- `ZODIAC_VARIANTS` includes:
  - `classic-2`
  - `classic-4`
  - `classic-6`
  - `classic-8`
  - `plus-8`
  - `classic-12`
  - `plus-12`
- `ZODIAC_SIGNS` includes sign labels such as `Овен`, `Телец`, `Близнецы`, etc.
- `ZODIAC_PLUS_SLOT_LAYOUT` defines plus slots.

### Field layout selector

In `src/pages/profile-lite/ProfileLitePowerPlaceModuleBase.jsx`:

```js
const FIELD_LAYOUTS = [
  { value: "vertical", label: "Вертикальное" },
  { value: "horizontal", label: "Горизонтальное" },
  { value: "rectangle", label: "Прямоугольник" },
  { value: "square", label: "Квадрат" }
];
```

`renderFieldLayoutSelector()` writes the selected value to `compositionDraft.field_layout`.

The selected value is added to wrappers:

```jsx
<div className={`powerPlacePrintArea field-layout-${compositionDraft.field_layout || "square"}`} ...>
  <div className={`powerMandalaPanel field-layout-${compositionDraft.field_layout || "square"} ...`} ...>
```

Important: `zodiacMandalaSheet` does not receive a field-layout class directly; it is controlled through parent selectors such as:

```css
.powerPlacePrintArea.field-layout-square .zodiacMandalaSheet
.powerMandalaPanel.field-layout-square .zodiacMandalaSheet
```

### Zodiac render branch

In `src/pages/profile-lite/ProfileLitePowerPlaceModuleBase.jsx`, find the branch:

```jsx
compositionDraft.constructor_type === "zodiac"
```

It renders:

```jsx
<div className={`zodiacMandalaSheet zodiac-${compositionDraft.zodiac_visible_count || 12} ${(compositionDraft.zodiac_variant || "").startsWith("plus") ? `zodiac-plus-${compositionDraft.zodiac_visible_count || 12}` : ""} cover-${innerCover?.tone || "gold"} ${innerCoverClass}`.trim()} style={innerCoverImageStyle(innerCover, coverDisplaySrc(innerCover))}>
  {renderCenterPhotoWithMode("zodiacCenterPhoto")}
  {renderPowerPlaceMotionLayer()}
  <div className="zodiacClockFace" aria-hidden="true">
    <span>ЗОДИАК</span>
  </div>
  ...zodiac positions...
</div>
```

Normal zodiac positions currently include visual labels:

```jsx
<b>{slot.label}</b>
```

Plus zodiac positions also include visual labels:

```jsx
<b>{slot.label}</b>
```

### In-mandala inner/outer cover buttons

In `ProfileLitePowerPlaceModuleBase.jsx`, find:

```jsx
const renderInMandalaCoverDropTargets = () => (
  <div className="powerMandalaCoverDropTargets">
    <button className={`powerMandalaCoverDropTarget powerMandalaCoverDropTarget--inner...`}>◎ Внутрь</button>
    <button className={`powerMandalaCoverDropTarget powerMandalaCoverDropTarget--outer...`}>▣ Снаружи</button>
  </div>
);
```

This function is called inside `.powerMandalaPanel` before `.powerPrintMeta`:

```jsx
{renderInMandalaCoverDropTargets()}
```

### Current relevant CSS

In `src/profileMandalaWorkspace.css`:

```css
.zodiacMandalaSheet {
  border-radius: 50%;
  background:
    repeating-conic-gradient(from -90deg, rgba(126, 78, 20, 0.16) 0 1deg, transparent 1deg 30deg),
    repeating-radial-gradient(circle, rgba(212, 151, 47, 0.16) 0 1px, transparent 2px 34px),
    radial-gradient(circle, #fffdf6 0 21%, #f4e2bd 22% 62%, rgba(90, 123, 88, 0.18) 63% 100%);
}

.zodiacClockFace {
  position: absolute;
  inset: 13%;
  z-index: 2;
  display: grid;
  place-items: end center;
  border-radius: 50%;
  border: 1px solid rgba(137, 85, 18, 0.28);
  color: rgba(89, 59, 19, 0.42);
  font-size: 14px;
  font-weight: 900;
  letter-spacing: 0.12em;
  padding-bottom: 13%;
}

.zodiacCenterPhoto {
  position: absolute;
  left: 50%;
  top: 50%;
  z-index: 5;
  width: 31%;
  aspect-ratio: 1;
  display: grid;
  place-items: center;
  transform: translate(-50%, -50%);
  border-radius: 50%;
}
```

Zodiac slot labels:

```css
.zodiacPosition b {
  max-width: 100%;
  color: #513512;
  font-size: 11px;
  line-height: 1.12;
  text-align: center;
  overflow-wrap: anywhere;
}
```

Current no-inner-cover rule:

```css
.powerMandala.cover-none,
.altarMandalaSheet.cover-none,
.businessMandalaSheet.cover-none,
.zodiacMandalaSheet.cover-none,
.daoMandalaSheet.cover-none,
.starMandalaSheet.cover-none {
  background: rgba(255, 255, 255, 0.18) !important;
  box-shadow: none !important;
}
```

Current cover target placement:

```css
.profileLitePowerPlace .powerMandalaCoverDropTargets {
  position: absolute;
  top: 8px;
  left: 8px;
  z-index: 10;
  display: flex;
  flex-direction: column;
  gap: 4px;
  pointer-events: none;
}
```

## Root causes

### Issue 1: Zodiac center photo looks off-center

`.zodiacCenterPhoto` is geometrically centered with `left: 50%`, `top: 50%`, and `transform: translate(-50%, -50%)`.

Do not apply a random offset first.

Likely visual causes:

- sign labels create extra visual weight below and around slots;
- `.zodiacClockFace` places `ЗОДИАК` at the bottom with `place-items: end center` and `padding-bottom: 13%`;
- square field layout conflicts with circular inner sheet and circular clock face;
- translucent no-fill overlay makes the geometry feel shifted;
- top `powerPrintMeta` and cover buttons may visually affect perception.

Fix other issues first, then re-measure center alignment.

### Issue 2: No fill still shows fill

`cover-none` uses `rgba(255, 255, 255, 0.18)` rather than `transparent`. This means no-fill still renders a visible field.

### Issue 3: Square layout still shows circle

`.zodiacMandalaSheet` always has `border-radius: 50%` and `.zodiacClockFace` always has `border-radius: 50%`. Parent square layout changes the outer panel, but not these inner shapes.

### Issue 4: Zodiac sign labels visible inside mandala

The labels are rendered directly in JSX as `<b>{slot.label}</b>` inside normal zodiac and plus zodiac branches.

### Issue 5: Inner/outer buttons stacked top-left

Both buttons live in one container positioned at top-left, with `flex-direction: column`.

## Required implementation strategy

### Step 1 — Separate inner/outer cover buttons

Preferred CSS-only fix if JSX can stay as-is:

```css
.profileLitePowerPlace .powerMandalaCoverDropTargets {
  position: absolute;
  top: 8px;
  left: 8px;
  right: 8px;
  z-index: 10;
  min-height: 30px;
  display: block;
  pointer-events: none;
}

.profileLitePowerPlace .powerMandalaCoverDropTarget {
  position: absolute;
  pointer-events: all;
}

.profileLitePowerPlace .powerMandalaCoverDropTarget--inner {
  top: 0;
  left: 0;
}

.profileLitePowerPlace .powerMandalaCoverDropTarget--outer {
  top: 0;
  right: 0;
}
```

Update existing `@media (max-width: 980px)` rules so both buttons remain separated and do not overlap the center photo.

If mobile width is too tight, shorten button text only on small screens via CSS or JSX, but preserve `aria-label`.

### Step 2 — Make inner `Без фона` truly no-fill

Split or override the grouped `cover-none` rule.

Minimum scoped fix for Zodiac:

```css
.zodiacMandalaSheet.cover-none {
  background: transparent !important;
  box-shadow: none !important;
}
```

Also check whether `.zodiacClockFace` border still reads as a filled circular field when inner cover is none. If yes, reduce or hide it only for `cover-none`:

```css
.zodiacMandalaSheet.cover-none .zodiacClockFace {
  border-color: transparent;
  color: transparent;
}
```

Do not break `cover-zodiac-map`, which explicitly restores the decorative map background.

### Step 3 — Square layout should not show circular inner field

Fix only Zodiac first.

Option A: square inner sheet with rounded corners:

```css
.powerPlacePrintArea.field-layout-square .zodiacMandalaSheet {
  border-radius: 24px;
}

.powerPlacePrintArea.field-layout-square .zodiacClockFace {
  border-radius: 18px;
}
```

If a circular guide is still visibly conflicting, use Option B:

```css
.powerPlacePrintArea.field-layout-square .zodiacClockFace {
  display: none;
}
```

Decision rule:

- If square layout should keep only the square field and photos, hide `.zodiacClockFace` in square layout.
- Keep `.zodiacClockFace` for non-square/classic Zodiac layouts.
- Do not hide `.zodiacClockFace` globally.

### Step 4 — Remove zodiac sign labels from the mandala

Preferred JSX fix:

In normal zodiac slots, remove:

```jsx
<b>{slot.label}</b>
```

In plus zodiac slots, remove:

```jsx
<b>{slot.label}</b>
```

Keep:

- `title={slot.label}`
- `aria-label={...slot.label...}`
- slot data labels in constants

Do not remove labels from selectors, data, non-zodiac constructors, or admin/data flows.

CSS fallback if JSX tests are hard to update:

```css
.zodiacMandalaSheet .zodiacPosition > b,
.zodiacFieldPlusPosition > b {
  display: none;
}
```

### Step 5 — Re-check center photo after visual fixes

Current center is geometrically centered. After steps 1-4, measure with browser devtools:

```js
const sheet = document.querySelector('.zodiacMandalaSheet')?.getBoundingClientRect();
const center = document.querySelector('.zodiacCenterPhoto')?.getBoundingClientRect();
console.log({
  sheet,
  center,
  dx: center.left + center.width / 2 - (sheet.left + sheet.width / 2),
  dy: center.top + center.height / 2 - (sheet.top + sheet.height / 2),
});
```

Only if `dy` is not close to 0, fix actual geometry. If `dy` is close to 0, do not move `.zodiacCenterPhoto`; the perceived problem was optical.

If a real geometry fix is required, prefer scoped CSS only for Zodiac:

```css
.zodiacCenterPhoto {
  top: 50%;
}
```

Do not use arbitrary `top: 48%` unless measured and justified in the report.

## Test additions

Add style contract tests if the existing test files make this stable.

Recommended assertions:

- CSS contains `.powerMandalaCoverDropTarget--inner` placement rule.
- CSS contains `.powerMandalaCoverDropTarget--outer` placement rule.
- CSS contains a scoped square Zodiac rule for `.powerPlacePrintArea.field-layout-square .zodiacMandalaSheet`.
- CSS contains a scoped no-fill rule for `.zodiacMandalaSheet.cover-none` with transparent or no visual fill.
- JSX no longer renders visible `<b>{slot.label}</b>` inside the Zodiac branch, or CSS hides these labels.

Do not overfit tests to exact colors or pixel values if not necessary.

## Required commands

Run:

```bash
npm install
npm run test:power-place
npm run test:profile-lite
npm run build
npm run check
```

Before committing:

```bash
git status --short
git diff --name-only
```

Only intended files should be changed.

## Manual QA checklist

Open local dev/preview and check `/profile` → Место силы → constructor `Зодиак`.

### Zodiac variants

Verify:

- `2`
- `4`
- `6`
- `8`
- `8+`
- `12`
- `12+`

### Field layouts

Verify:

- `vertical`
- `horizontal`
- `rectangle`
- `square`

### Inner cover

Verify:

- `Без фона`
- `Карта мандалы`
- image cover

### Outer cover

Verify:

- `Без фона`
- image cover

### Expected visual result

- No Zodiac sign/constellation labels visible inside the mandala canvas.
- `◎ Внутрь` is top-left.
- `▣ Снаружи` is top-right.
- `Без фона` for inner cover does not create a visible inner fill.
- Square field layout does not show a conflicting circular inner field/clock face.
- Zodiac center photo is visually centered after removing labels/circle conflicts.
- No console errors.

### Mobile

Check below:

- `980px`
- `640px`

Buttons must not overlap important mandala content or each other.

### Smoke check other constructors

Quickly verify:

- `Мандала` / client
- `Алтарь`
- `Бизнес`
- `DAO`
- `Шахматы`
- `Звезда`

Make sure no shared CSS selector broke these formats.

## Risks

- Broad CSS selectors can affect non-Zodiac constructors.
- Hiding `.zodiacClockFace` globally would remove desired circle/guide in classic Zodiac; scope square/no-fill behavior carefully.
- Removing JSX labels may break tests that expected visible text; update tests to use `aria-label`/`title` where appropriate.
- Changing `cover-none` globally can alter other constructors. Split grouped selectors if needed.
- Cover button separation can overlap with small mobile layouts; mobile QA is required.

## Report format after implementation

Report:

- changed files
- exact cause for each of the 5 issues
- exact selectors/components/functions changed
- checks run
- manual QA results: desktop/mobile
- what was verified
- what was not verified
- risks
- whether `STATE.md` / `LOG.md` need update
- preview/live verification status

## Minimal acceptance criteria

The task is complete when:

1. Zodiac labels are not visible inside the mandala canvas.
2. Inner `Без фона` produces no visible fill for Zodiac.
3. Square layout no longer shows a conflicting circular Zodiac field/clock face.
4. Inner/outer cover buttons are separated top-left/top-right.
5. Zodiac center photo is either measured as centered or a justified scoped geometry fix is applied.
6. `npm run test:power-place`, `npm run test:profile-lite`, `npm run build`, and `npm run check` pass or any failures are reported with exact cause.
