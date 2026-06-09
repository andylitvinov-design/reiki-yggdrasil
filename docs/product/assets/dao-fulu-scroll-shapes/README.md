# DAO / fulu scroll shape references

Date: 2026-06-09  
Project: Reiki Yggdrasil / Profile Lite / Power Place constructor  
Scope: visual reference examples for DAO symbol-library styles.

These files are **reference contour examples only**. They are not ritual talismans, not operational formulas, and not copied sacred content. They intentionally avoid readable Chinese characters, deity names, invocations, seals with real text, and ritual instructions.

The goal is to document shape families that are closer to real Daoist talismanic support forms than decorative fantasy scrolls, so they can later be adapted into `public/symbols/power-place/dao/*.svg` or into the DAO shelf in `src/data/powerPlaceSymbolLibrary.js`.

## Files

- `dao-fu-paper-slip.svg` — long narrow rectangular fu paper slip shape.
- `dao-lu-register-document.svg` — longer register/document style with an empty seal-box area.
- `dao-lingpai-command-tablet.svg` — command-tablet-inspired ceremonial plaque outline.
- `dao-taofu-wood-charm.svg` — peach-wood charm / vertical plaque inspired outline.

## Shared motif

Each example includes three small check marks near the top. In the product concept, these are a visual placeholder for the user's requested **"3 чистых"** motif.

## Product notes

Recommended implementation direction:

- keep these as `draft` / `needs review` references until a final visual language is approved;
- if promoted to product assets, use durable public paths like `/symbols/power-place/dao/<name>.svg`;
- use `currentColor` SVG strokes so the UI theme can control color;
- do not use `data:image` for persisted symbol refs;
- do not add Supabase migrations for this static symbol phase;
- preserve RU-default UI and the existing Power Place slot assignment flow.

## Suggested future product IDs

```js
{
  id: "symbol-dao-fu-paper-slip-draft",
  shelf: "dao",
  label: "Фу-лист",
  meta: "Символ · ДАО · форма fulu · draft",
  kind: "symbol-library",
  src: "/symbols/power-place/dao/dao-fu-paper-slip.svg",
  displaySrc: "/symbols/power-place/dao/dao-fu-paper-slip.svg"
}
```

```js
{
  id: "symbol-dao-lu-register-document-draft",
  shelf: "dao",
  label: "Регистр",
  meta: "Символ · ДАО · форма lu · draft",
  kind: "symbol-library",
  src: "/symbols/power-place/dao/dao-lu-register-document.svg",
  displaySrc: "/symbols/power-place/dao/dao-lu-register-document.svg"
}
```

```js
{
  id: "symbol-dao-lingpai-command-tablet-draft",
  shelf: "dao",
  label: "Табличка",
  meta: "Символ · ДАО · форма lingpai · draft",
  kind: "symbol-library",
  src: "/symbols/power-place/dao/dao-lingpai-command-tablet.svg",
  displaySrc: "/symbols/power-place/dao/dao-lingpai-command-tablet.svg"
}
```

```js
{
  id: "symbol-dao-taofu-wood-charm-draft",
  shelf: "dao",
  label: "Таофу",
  meta: "Символ · ДАО · форма taofu · draft",
  kind: "symbol-library",
  src: "/symbols/power-place/dao/dao-taofu-wood-charm.svg",
  displaySrc: "/symbols/power-place/dao/dao-taofu-wood-charm.svg"
}
```

## Do not change

- public homepage `/`;
- `/profile`, `/profile/mandalas`, `/masters`, `/profile/admin`;
- Supabase auth/data/storage flows;
- Vercel rewrites and production domain settings;
- env values;
- desktop 3-column layout and mobile fallback.
