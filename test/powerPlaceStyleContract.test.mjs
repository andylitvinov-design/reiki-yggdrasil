import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

import {
  innerFieldScaleValue,
  innerFieldWidthDesktop,
  innerFieldWidthMobile
} from "../src/lib/powerPlaceStyleContract.js";

const __dir = dirname(fileURLToPath(import.meta.url));
const cssSource = readFileSync(join(__dir, "../src/profileMandalaWorkspace.css"), "utf8");

// ─── innerFieldScaleValue ────────────────────────────────────────────────────

assert.equal(innerFieldScaleValue(undefined), 78, "default scale should be 78");
assert.equal(innerFieldScaleValue("bad"), 78, "non-numeric should return default 78");
assert.equal(innerFieldScaleValue(48), 48, "min clamp at 48");
assert.equal(innerFieldScaleValue(20), 48, "below min clamps to 48");
assert.equal(innerFieldScaleValue(96), 96, "max now 96");
assert.equal(innerFieldScaleValue(100), 96, "above 96 clamps to 96");
assert.equal(innerFieldScaleValue("92"), 92, "string value parsed correctly");

// ─── innerFieldWidthDesktop — no 440px cap ───────────────────────────────────

const desktopW96 = innerFieldWidthDesktop(96);
assert.ok(!desktopW96.includes("440px"), "desktop width must not contain 440px cap");
assert.ok(desktopW96.startsWith("calc("), "desktop width should be a calc()");
assert.ok(desktopW96.includes("clamp(34px"), "desktop width uses desktop panel padding clamp");

const desktopW78 = innerFieldWidthDesktop(78);
assert.ok(!desktopW78.includes("440px"), "default-scale desktop width must not contain 440px cap");

// ─── innerFieldWidthMobile ───────────────────────────────────────────────────

const mobileW96 = innerFieldWidthMobile(96);
assert.ok(!mobileW96.includes("440px"), "mobile width must not contain 440px cap");
assert.ok(mobileW96.includes("clamp(28px"), "mobile width uses mobile panel padding clamp");

// ─── Padding compensation math ───────────────────────────────────────────────
// At scale S, coeff = S/100*2. At S=96: coeff=1.9200. Verify the string is correct.

const w96 = innerFieldWidthDesktop(96);
assert.ok(w96.includes("96%"), "96% of content-box in the expression");
assert.ok(w96.includes("1.9200"), "coefficient 1.9200 (= 96/100*2) in the expression");

const w48 = innerFieldWidthDesktop(48);
assert.ok(w48.includes("48%"), "48% of content-box in the expression");
assert.ok(w48.includes("0.9600"), "coefficient 0.9600 (= 48/100*2) in the expression");

// ─── CSS: chess cover-none uses neutral background, not gold ─────────────────

const chessNoneBlock = (() => {
  const start = cssSource.indexOf(".power-place-chess.cover-none {");
  const end = cssSource.indexOf("}", start);
  return cssSource.slice(start, end + 1);
})();

assert.ok(chessNoneBlock.length > 0, "chess cover-none rule must exist");
assert.ok(!chessNoneBlock.includes("0.18"), "chess cover-none must not use the old transparent 0.18 value");

// Verify the cell neutralization rules exist
assert.ok(
  cssSource.includes(".power-place-chess.cover-none .power-place-chess__cell.is-dark"),
  "chess cover-none must override is-dark cell background"
);
assert.ok(
  cssSource.includes(".power-place-chess.cover-none .power-place-chess__cell.is-light"),
  "chess cover-none must override is-light cell background"
);

// ─── CSS: square border-radius override applied to all inner surfaces ─────────
// The dynamic style in ProfileLitePowerPlaceModule applies border-radius via
// CSS variables (centerShape→centerRadius). Verify the CSS file does not set
// !important border-radius 50% on inner surfaces without being overrideable.
// (Checking the per-format rules don't carry !important that would block override.)

const zodiacRule = (() => {
  const idx = cssSource.indexOf(".zodiacMandalaSheet {");
  const end = cssSource.indexOf("}", idx);
  return idx >= 0 ? cssSource.slice(idx, end + 1) : "";
})();
assert.ok(!zodiacRule.includes("border-radius: 50% !important"), "zodiacMandalaSheet border-radius must not be !important so dynamic override can win");

const starRule = (() => {
  const idx = cssSource.indexOf(".starMandalaSheet {");
  const end = cssSource.indexOf("}", idx);
  return idx >= 0 ? cssSource.slice(idx, end + 1) : "";
})();
assert.ok(!starRule.includes("border-radius: 50% !important"), "starMandalaSheet border-radius must not be !important");

// ─── CSS: has-custom-inner-cover wires background display ────────────────────

assert.ok(
  cssSource.includes(".profileLitePowerPlace .has-custom-inner-cover"),
  "has-custom-inner-cover class must be defined for user inner images"
);
assert.ok(
  cssSource.includes("background-size: cover") && cssSource.includes("background-repeat: no-repeat"),
  "has-custom-inner-cover must set cover sizing and repeat"
);

// ─── Dynamic style: inner field uses absolute centering (no top/left bias) ────
// The dynamic CSS in ProfileLitePowerPlaceModule must use position:absolute +
// translate(-50%,-50%) so the inner surface expands symmetrically from center.

const moduleSource = readFileSync(join(__dir, "../src/pages/profile-lite/ProfileLitePowerPlaceModule.jsx"), "utf8");

assert.ok(
  moduleSource.includes("position: absolute !important") && moduleSource.includes("translate(-50%, -50%)"),
  "inner field must use position:absolute with translate(-50%,-50%) for symmetric centering"
);

assert.ok(
  !moduleSource.includes("justify-self: center !important"),
  "inner field must not use justify-self:center (causes left-bias when overflowing content-box)"
);

// ─── Dynamic style: inner image uses CSS variable so !important cover-none can be overridden ──

assert.ok(
  moduleSource.includes("--power-inner-cover-image"),
  "dynamic style must define --power-inner-cover-image CSS variable"
);

assert.ok(
  moduleSource.includes("background-image: var(--power-inner-cover-image, none) !important"),
  "dynamic style must apply CSS variable as background-image with !important to override cover-none"
);

assert.ok(
  moduleSource.includes(".powerPlacePdfOnlyArea .has-custom-inner-cover"),
  "print area must also receive has-custom-inner-cover CSS variable override"
);

// ─── Base module: inner surface JSX uses CSS variable for image covers ─────────

const baseSource = readFileSync(join(__dir, "../src/pages/profile-lite/ProfileLitePowerPlaceModuleBase.jsx"), "utf8");

assert.ok(
  baseSource.includes("innerCoverImageStyle"),
  "Base module must define innerCoverImageStyle helper for CSS variable approach"
);

assert.ok(
  baseSource.includes('"--power-inner-cover-image"'),
  "Base module innerCoverImageStyle must set --power-inner-cover-image CSS variable"
);

assert.ok(
  !baseSource.includes("style={imageStyle(coverDisplaySrc(innerCover))}"),
  "Base module must not use imageStyle() directly for inner surface elements (use innerCoverImageStyle instead)"
);

// ─── Chess cover-none is fully transparent (outer background shows through) ────

assert.ok(
  chessNoneBlock.includes("transparent"),
  "chess cover-none must be transparent so the outer panel background shows through"
);

assert.ok(
  !chessNoneBlock.includes("rgba(244, 241, 235"),
  "chess cover-none must not use the old warm neutral fill — must be transparent"
);

// chess cells should also be transparent in cover-none
assert.ok(
  cssSource.includes(".power-place-chess.cover-none .power-place-chess__board"),
  "chess cover-none must set the board itself to transparent"
);

// ─── Dynamic style: zodiacClockFace / daoUsinCore follow centerShape ──────────

assert.ok(
  moduleSource.includes(".zodiacClockFace") && moduleSource.includes("border-radius: ${centerRadius}"),
  "dynamic style must apply centerRadius to zodiacClockFace so square mode removes the clock-face circle"
);

assert.ok(
  moduleSource.includes(".daoUsinCore") && moduleSource.includes("border-radius: ${centerRadius}"),
  "dynamic style must apply centerRadius to daoUsinCore so square mode removes the DAO core circle"
);

// ─── Issue #244: vertical format and photo controls ─────────────────────────

assert.ok(
  moduleSource.includes('const CENTER_WINDOW_SCALE_REF_KEY = "__center_window_scale"'),
  "dynamic module must define __center_window_scale for backward-compatible center window sizing"
);

assert.ok(
  moduleSource.includes("--power-center-window-scale"),
  "dynamic module must expose --power-center-window-scale for center frame/window sizing"
);

assert.ok(
  baseSource.includes('label: "Размер центра"') && baseSource.includes('field: "__center_window_scale"'),
  "Размер центра must map to __center_window_scale, not image scale"
);

assert.ok(
  baseSource.includes('label: "Размер фоток"') && baseSource.includes('field: "__center_image_scale"'),
  "Размер фоток must map to __center_image_scale for image content scaling"
);

assert.ok(
  !moduleSource.includes('className="coverOffsetCornerGroup outer"'),
  "outer cover movement arrows must not be rendered"
);

assert.ok(
  !moduleSource.includes('shiftCoverOffset("outer"'),
  "UI must not call shiftCoverOffset for the outer layer"
);

assert.ok(
  !moduleSource.includes("calc(100% * var(--power-center-image-scale, 1)) calc(100% * var(--power-center-image-scale, 1))"),
  "center image background-size must not force two axes because vertical photos stretch"
);

assert.ok(
  moduleSource.includes("background-size: calc(100% * var(--power-center-image-scale, 1)) auto !important"),
  "center image background-size must scale proportionally"
);

assert.ok(
  moduleSource.includes("aspect-ratio: 9 / 19.5 !important"),
  "dynamic vertical/rectangle outer and inner surfaces must use 9 / 19.5"
);

assert.ok(
  cssSource.includes("aspect-ratio: 9 / 19.5 !important"),
  "static Profile Lite CSS must include 9 / 19.5 vertical/rectangle fallback"
);

console.log("powerPlaceStyleContract: all assertions passed");
