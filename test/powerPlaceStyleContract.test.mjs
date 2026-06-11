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
assert.equal(innerFieldScaleValue(96), 96, "96 passes through without clamping");
assert.equal(innerFieldScaleValue(100), 100, "100 now within new max 145");
assert.equal(innerFieldScaleValue(145), 145, "max now 145");
assert.equal(innerFieldScaleValue(200), 145, "above 145 clamps to 145");
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

// ─── Dynamic style: center photos preserve source proportions ────────────────

assert.ok(
  !moduleSource.includes("background-size: calc(100% * var(--power-center-image-scale, 1)) calc(100% * var(--power-center-image-scale, 1)) !important"),
  "center photos must not force both background-size axes because that stretches client images"
);

assert.ok(
  moduleSource.includes("background-size: calc(100% * var(--power-center-image-scale, 1)) auto !important"),
  "center photos must use proportional single-axis background-size"
);

assert.ok(
  moduleSource.includes("CENTER_FRAME_SCALE_REF_KEY = \"__center_frame_scale\""),
  "center frame scale must use a dedicated object_refs key"
);

assert.ok(
  moduleSource.includes("--power-center-frame-scale"),
  "dynamic style must expose a center frame scale CSS variable"
);

assert.ok(
  moduleSource.includes("width: calc(34% * var(--power-center-frame-scale, 1)) !important"),
  "center frame scale must resize the regular center window width, not only the photo background"
);

assert.ok(
  moduleSource.includes("aspect-ratio: 9 / 19.5 !important"),
  "vertical and rectangle outer fields should use the safe 9 / 19.5 ratio"
);

assert.ok(
  cssSource.includes("background-size: calc(100% * var(--power-center-image-scale, 1)) auto"),
  "photo scale should resize background image content proportionally with a single-axis size"
);

// ─── Motion mode CSS contract ────────────────────────────────────────────────

for (const selector of [
  ".powerPlaceMotionLayer",
  ".powerPlaceMotionPhoto",
  ".powerPlaceMotionPhoto--count-4",
  ".powerPlaceMotionControls",
  ".powerPlaceVideoControls",
  ".powerPlaceVideoHint"
]) {
  assert.ok(cssSource.includes(selector), `${selector} must be defined for Power Place video mode`);
}

const motionLayerBlock = (() => {
  const idx = cssSource.indexOf(".profileLitePowerPlace .powerPlaceMotionLayer {");
  const end = cssSource.indexOf("}", idx);
  return idx >= 0 ? cssSource.slice(idx, end + 1) : "";
})();

assert.ok(motionLayerBlock.includes("position: absolute"), "motion layer must be absolute inside the mandala sheet");
assert.ok(motionLayerBlock.includes("pointer-events: none"), "motion layer must not block center editing, drag/drop, slots, save, or print actions");
assert.ok(motionLayerBlock.includes("overflow: visible"), "motion layer must have overflow:visible so copies positioned near the boundary are not clipped");
assert.ok(cssSource.includes("@media (prefers-reduced-motion: reduce)") && cssSource.includes("transition: none"), "motion photos should disable transitions for reduced motion");
assert.ok(cssSource.includes("@media (max-width: 640px)") && cssSource.includes(".profileLitePowerPlace .powerPlaceMotionPhoto"), "motion photos should have mobile sizing rules");

// ─── Base module: inner surface JSX uses CSS variable for image covers ─────────

const baseSource = readFileSync(join(__dir, "../src/pages/profile-lite/ProfileLitePowerPlaceModuleBase.jsx"), "utf8");

// ─── Dynamic UI: old cover arrow overlay is removed ──────────────────────────

assert.ok(
  !moduleSource.includes("coverOffsetCornerGroup"),
  "old coverOffsetCornerGroup arrow overlay must be removed from the module"
);

assert.ok(
  !moduleSource.includes("shiftCoverOffset"),
  "shiftCoverOffset helper must be removed along with the arrow overlay"
);

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

// ─── Motion mode: zodiac geometry uses semantic radius constants ─────────────

assert.ok(
  baseSource.includes("ZODIAC_OUTER_SLOT_RADIUS"),
  "ZODIAC_OUTER_SLOT_RADIUS must be a named constant to document outer slot ring position"
);

assert.ok(
  baseSource.includes("ZODIAC_CENTER_EDGE_RADIUS"),
  "ZODIAC_CENTER_EDGE_RADIUS must be a named constant to document center photo edge position"
);

const zodiacMotionRadiusMatch = baseSource.match(/const ZODIAC_MOTION_RADIUS\s*=\s*[^;]+;\s*/);
assert.ok(zodiacMotionRadiusMatch, "ZODIAC_MOTION_RADIUS must be defined");

assert.ok(
  baseSource.includes("ZODIAC_OUTER_SLOT_RADIUS") && baseSource.includes("ZODIAC_CENTER_EDGE_RADIUS"),
  "ZODIAC_MOTION_RADIUS must be derived from ZODIAC_OUTER_SLOT_RADIUS and ZODIAC_CENTER_EDGE_RADIUS"
);

// ─── Safe inner ring: ZODIAC_VIDEO_COPY_SAFE_RADIUS between center and outer ──

assert.ok(
  baseSource.includes("ZODIAC_VIDEO_COPY_SAFE_RADIUS"),
  "ZODIAC_VIDEO_COPY_SAFE_RADIUS must be a named constant for the safe inner ring"
);

{
  const safeRadiusMatch = baseSource.match(/const ZODIAC_VIDEO_COPY_SAFE_RADIUS\s*=\s*(\d+)/);
  assert.ok(safeRadiusMatch, "ZODIAC_VIDEO_COPY_SAFE_RADIUS must have a numeric literal value");

  const outerSlotRadiusMatch = baseSource.match(/const ZODIAC_OUTER_SLOT_RADIUS\s*=\s*(\d+)/);
  const centerEdgeRadiusMatch = baseSource.match(/const ZODIAC_CENTER_EDGE_RADIUS\s*=\s*(\d+)/);
  assert.ok(outerSlotRadiusMatch && centerEdgeRadiusMatch, "ZODIAC_OUTER_SLOT_RADIUS and ZODIAC_CENTER_EDGE_RADIUS must have numeric values");

  const safeRadius = Number(safeRadiusMatch[1]);
  const outerSlotRadius = Number(outerSlotRadiusMatch[1]);
  const centerEdgeRadius = Number(centerEdgeRadiusMatch[1]);

  assert.ok(
    safeRadius < outerSlotRadius,
    `ZODIAC_VIDEO_COPY_SAFE_RADIUS (${safeRadius}) must be less than ZODIAC_OUTER_SLOT_RADIUS (${outerSlotRadius}) so copies stay inside the outer ring`
  );

  assert.ok(
    safeRadius > centerEdgeRadius,
    `ZODIAC_VIDEO_COPY_SAFE_RADIUS (${safeRadius}) must be greater than ZODIAC_CENTER_EDGE_RADIUS (${centerEdgeRadius}) so copies clear the center photo`
  );
}

// ─── Motion photo count-4: copies must be full-sized circles ─────────────────

const motionCount4Block = (() => {
  const idx = cssSource.indexOf(".profileLitePowerPlace .powerPlaceMotionPhoto--count-4 {");
  const end = cssSource.indexOf("}", idx);
  return idx >= 0 ? cssSource.slice(idx, end + 1) : "";
})();

assert.ok(motionCount4Block.length > 0, "powerPlaceMotionPhoto--count-4 rule must exist");

const count4PercentMatch = motionCount4Block.match(/clamp\([^,]+,\s*([\d.]+)%/);
assert.ok(count4PercentMatch, "count-4 motion photo width must use a % clamp value");
assert.ok(
  Number(count4PercentMatch[1]) >= 11,
  `count-4 motion photo must be at least 11% wide to be visible as a full circle (got ${count4PercentMatch[1]}%)`
);

// ─── Gradient tones: CSS coverage ────────────────────────────────────────────

for (const tone of ["gradient-gold", "gradient-forest", "gradient-night", "gradient-fire", "gradient-water"]) {
  assert.ok(
    cssSource.includes(`cover-${tone}`),
    `CSS must define cover-${tone} rule for mandala inner surface gradient preset`
  );
  assert.ok(
    cssSource.includes(`.coverPreview.tone-${tone}`),
    `CSS must define .coverPreview.tone-${tone} rule for the cover preview chip`
  );
}

assert.ok(
  cssSource.includes("powerPlacePdfOnlyArea") && cssSource.includes("cover-gradient-gold"),
  "print area must include gradient-gold coverage for PDF export"
);

// ─── Top photoScaleControl removed; slot photo editor has Масштаб фото ────────

assert.ok(
  !baseSource.includes('className: "photoScaleControl"') && !baseSource.includes('className="photoScaleControl"'),
  "top photoScaleControl must no longer be rendered in constructor controls"
);

assert.ok(
  baseSource.includes("Масштаб фото"),
  "renderSlotPhotoEditor must include Масштаб фото zoom slider"
);

// ─── DAO style selector: __dao_style stored in object_refs ───────────────────

assert.ok(
  moduleSource.includes('DAO_STYLE_REF_KEY = "__dao_style"'),
  "DAO_STYLE_REF_KEY must be defined as __dao_style in the wrapper module"
);

assert.ok(
  moduleSource.includes("__dao_style: daoStyle"),
  "daoStyle must be passed through enhancedDraft as __dao_style"
);

assert.ok(
  moduleSource.includes("function daoStyleValue("),
  "daoStyleValue normalizer must be defined in the wrapper module"
);

assert.ok(
  moduleSource.includes('function daoStyleValue(') && moduleSource.includes('"talisman-2"') && moduleSource.includes('"talisman"') && moduleSource.includes('"talisman-1"') && moduleSource.includes('"style-1"'),
  "daoStyleValue must handle style-1, legacy talisman→talisman-1 mapping, talisman-1, and talisman-2 values"
);

assert.ok(
  moduleSource.includes('"talisman" || value === "talisman-1"') || (moduleSource.includes('"talisman"') && moduleSource.includes('"talisman-1"') && /talisman.*talisman-1|talisman-1.*talisman/.test(moduleSource)),
  "daoStyleValue must map legacy 'talisman' to 'talisman-1'"
);

// ─── DAO talisman: CSS and JSX contracts ─────────────────────────────────────

// Outer surface stays .daoMandalaSheet — field_scale, print/PDF and cover contracts inherited
assert.ok(
  cssSource.includes(".daoMandalaSheet.dao-talisman"),
  ".daoMandalaSheet.dao-talisman must override visual shape while keeping outer surface class"
);

assert.ok(
  cssSource.includes(".daoTalismanScroll"),
  ".daoTalismanScroll must be defined in CSS (nested inside .daoMandalaSheet)"
);

assert.ok(
  cssSource.includes(".daoTalismanRoof"),
  ".daoTalismanRoof must be defined in CSS for the talisman head/roof"
);

assert.ok(
  cssSource.includes(".daoTalismanSeal"),
  ".daoTalismanSeal must be defined in CSS for the bottom seal"
);

assert.ok(
  cssSource.includes(".daoTalismanSlot"),
  ".daoTalismanSlot must be defined in CSS for talisman element slots"
);

// JSX: talisman is rendered inside daoMandalaSheet (not as a standalone root)
assert.ok(
  baseSource.includes("dao-talisman"),
  "Base module must add dao-talisman class modifier to daoMandalaSheet"
);

assert.ok(
  baseSource.includes("daoTalismanScroll"),
  "Base module must render daoTalismanScroll nested inside daoMandalaSheet"
);

assert.ok(
  baseSource.includes("DAO_STYLE_VARIANTS"),
  "Base module must define DAO_STYLE_VARIANTS"
);

assert.ok(
  baseSource.includes('"style-1"') && baseSource.includes('"talisman-1"') && baseSource.includes('"talisman-2"'),
  "DAO_STYLE_VARIANTS must include style-1, talisman-1, and talisman-2 values"
);

assert.ok(
  baseSource.includes('"fu-paper-slip"') && baseSource.includes('"cloud-register"') &&
  baseSource.includes('"thunder-tablet"') && baseSource.includes('"taofu-charm"'),
  "DAO_STYLE_VARIANTS must include fu-paper-slip, cloud-register, thunder-tablet, taofu-charm"
);

assert.ok(
  baseSource.includes("DAO_FULU_STYLE_VALUES"),
  "Base module must define DAO_FULU_STYLE_VALUES constant for the 4 new fulu styles"
);

for (const cls of [
  ".daoFuluStyleFrame",
  ".daoFuluStyleHeader",
  ".daoFuluPureMarks",
  ".daoFuluBody",
  ".daoFuluCenterArea",
  ".daoFuluSlot",
  ".daoFuluSealBox",
  ".daoFuluCloudCorner",
  ".daoFuluFooter"
]) {
  assert.ok(cssSource.includes(cls), `CSS must define ${cls} for fulu style shared base`);
}

for (const style of ["fu-paper-slip", "cloud-register", "thunder-tablet", "taofu-charm"]) {
  assert.ok(
    cssSource.includes(`.daoMandalaSheet.dao-style-${style}`),
    `CSS must define .daoMandalaSheet.dao-style-${style}`
  );
}

assert.ok(
  cssSource.includes(".powerPlacePdfOnlyArea .daoMandalaSheet.dao-style-fu-paper-slip"),
  "print area must include fulu style print rules"
);

assert.ok(
  baseSource.includes("renderDaoFuluStyle"),
  "Base module must define renderDaoFuluStyle helper for fulu styles"
);

assert.ok(
  baseSource.includes("daoStyleSelector"),
  "Base module must render daoStyleSelector for DAO constructor type"
);

assert.ok(
  baseSource.includes("mandalaStyleSelector daoStyleSelector"),
  "DAO style selector must also carry mandalaStyleSelector class for shared pill button styling"
);

assert.ok(
  baseSource.includes("__dao_style") && baseSource.includes('"__dao_style"'),
  "Base module must use __dao_style to read/write the DAO style"
);

assert.ok(
  cssSource.includes(".daoTalismanPureMarks"),
  ".daoTalismanPureMarks must be defined in CSS for the three pure marks header"
);

assert.ok(
  cssSource.includes(".daoTalismanBody"),
  ".daoTalismanBody must be defined in CSS for the absolute-positioned slot area"
);

assert.ok(
  cssSource.includes(".daoTalismanCenterArea"),
  ".daoTalismanCenterArea must be defined in CSS for the talisman center photo positioning"
);

assert.ok(
  cssSource.includes(".daoTalismanSlot--water") && cssSource.includes(".daoTalismanSlot--fire"),
  "CSS must define absolute positions for individual talisman slot variants"
);

assert.ok(
  cssSource.includes(".powerPlacePdfOnlyArea .daoMandalaSheet.dao-talisman"),
  "print area must include talisman-specific print/PDF rules"
);

// Talisman 1 slot IDs: dao-${element.id} pattern (dao-water, dao-wood, etc.)
for (const elementId of ["water", "wood", "fire", "earth", "metal"]) {
  const slotIdPattern = new RegExp(`dao-\\$\\{element\\.id\\}|dao-${elementId}`);
  assert.ok(
    slotIdPattern.test(baseSource),
    `talisman-1 mode must keep dao-${elementId} slot id pattern`
  );
}

// Talisman 2 must use dao-talisman-2-${index + 1} nodes, not DAO_ELEMENTS.slice
assert.ok(
  baseSource.includes("dao-talisman-2-${index + 1}") || baseSource.includes("`dao-talisman-2-${index + 1}`"),
  "Talisman 2 must generate slot IDs as dao-talisman-2-${index + 1}"
);

assert.ok(
  !baseSource.match(/talisman-2[\s\S]{0,300}DAO_ELEMENTS\.slice/),
  "Talisman 2 must not use DAO_ELEMENTS.slice for node generation"
);

console.log("powerPlaceStyleContract: all assertions passed");

// ── Visibility settings CSS contract ─────────────────────────────────────────
assert.ok(cssSource.includes(".visibilitySettingsPanel"), "CSS must define .visibilitySettingsPanel");
assert.ok(cssSource.includes(".visibilityToggleRow"), "CSS must define .visibilityToggleRow");
assert.ok(cssSource.includes(".power-place-layer-hidden"), "CSS must define .power-place-layer-hidden modifier class");
assert.ok(cssSource.includes(".power-place-hide-slots"), "CSS must define .power-place-hide-slots rule");
assert.ok(cssSource.includes(".power-place-hide-outer-cover"), "CSS must define .power-place-hide-outer-cover rule");
assert.ok(cssSource.includes(".power-place-hide-inner-cover"), "CSS must define .power-place-hide-inner-cover rule");
assert.ok(cssSource.includes(".power-place-hide-center"), "CSS must define .power-place-hide-center rule");
