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

console.log("powerPlaceStyleContract: all assertions passed");
