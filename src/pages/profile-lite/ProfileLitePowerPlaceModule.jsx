import React, { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { placePowerMandalaTemplates } from "../../data/placePowerMandalaTemplates.js";
import { innerFieldWidthDesktop, innerFieldWidthMobile } from "../../lib/powerPlaceStyleContract.js"; // kept for backward compat; absolute centering uses % directly
import BaseProfileLitePowerPlaceModule from "./ProfileLitePowerPlaceModuleBase.jsx";
import "../../profileMandalaTemplatePilot.css";

const MANDALA_TEMPLATE_REF_KEY = "__mandala_template_id";
const INNER_COVER_OFFSET_X_REF_KEY = "__inner_cover_offset_x";
const INNER_COVER_OFFSET_Y_REF_KEY = "__inner_cover_offset_y";
const OUTER_COVER_OFFSET_X_REF_KEY = "__outer_cover_offset_x";
const OUTER_COVER_OFFSET_Y_REF_KEY = "__outer_cover_offset_y";
const INNER_FIELD_SCALE_REF_KEY = "__inner_field_scale";
const CENTER_IMAGE_SCALE_REF_KEY = "__center_image_scale";
const CENTER_SHAPE_REF_KEY = "__center_shape";

const CONSTRUCTOR_LABELS = {
  zodiac: "Зодиак",
  star: "Звезда",
  chess: "Шахматы",
  client: "Мандала",
  altar: "Алтарь",
  business: "Бизнес",
  dao: "ДАО"
};

function coverOffsetValue(value) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 50;
  return Math.min(80, Math.max(20, parsed));
}

function innerFieldScaleValue(value) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 78;
  return Math.min(96, Math.max(48, parsed));
}

function centerImageScaleValue(value) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 1;
  return Math.min(1.45, Math.max(0.65, parsed));
}

function centerShapeValue(value) {
  return value === "circle" ? "circle" : "square";
}

function profileLiteFitFixStyles(innerOffsetX, innerOffsetY, outerOffsetX, outerOffsetY, innerFieldScale, centerShape) {
  const centerRadius = centerShape === "circle" ? "50%" : "24px";
  // innerFieldWidthDesktop / innerFieldWidthMobile kept for tests; absolute centering uses % directly.
  return `
.profileLitePowerPlace .powerCenterPhoto.hasImage,
.profileLitePowerPlace .altarCenterPhoto.hasImage,
.profileLitePowerPlace .businessCenterPhoto.hasImage,
.profileLitePowerPlace .zodiacCenterPhoto.hasImage,
.profileLitePowerPlace .starCenterPhoto.hasImage,
.profileLitePowerPlace .daoCenterPhoto.hasImage,
.powerPlacePdfOnlyArea .powerCenterPhoto.hasImage,
.powerPlacePdfOnlyArea .altarCenterPhoto.hasImage,
.powerPlacePdfOnlyArea .businessCenterPhoto.hasImage,
.powerPlacePdfOnlyArea .zodiacCenterPhoto.hasImage,
.powerPlacePdfOnlyArea .starCenterPhoto.hasImage,
.powerPlacePdfOnlyArea .daoCenterPhoto.hasImage {
  background-size: calc(100% * var(--power-center-image-scale, 1)) calc(100% * var(--power-center-image-scale, 1)) !important;
  background-repeat: no-repeat !important;
  background-position: center !important;
}
.profileLitePowerPlace .power-place-chess__center.hasImage,
.powerPlacePdfOnlyArea .power-place-chess__center.hasImage {
  background-size: calc(100% * var(--power-center-image-scale, 1)) calc(100% * var(--power-center-image-scale, 1)) !important;
  background-repeat: no-repeat !important;
  background-position: center !important;
}
.profileLitePowerPlace .power-place-chess__slot.hasImage,
.profileLitePowerPlace .powerSource.hasImage,
.profileLitePowerPlace .altarTopSource.hasImage,
.profileLitePowerPlace .altarSupportSource.hasImage,
.profileLitePowerPlace .businessVertexZone.hasImage,
.profileLitePowerPlace .zodiacPositionImage[style],
.profileLitePowerPlace .zodiacFieldPlusPositionImage[style],
.profileLitePowerPlace .starPositionImage[style],
.profileLitePowerPlace .daoElementImage.hasImage,
.powerPlacePdfOnlyArea .power-place-chess__slot.hasImage,
.powerPlacePdfOnlyArea .powerSource.hasImage,
.powerPlacePdfOnlyArea .altarTopSource.hasImage,
.powerPlacePdfOnlyArea .altarSupportSource.hasImage,
.powerPlacePdfOnlyArea .businessVertexZone.hasImage,
.powerPlacePdfOnlyArea .zodiacPositionImage[style],
.powerPlacePdfOnlyArea .zodiacFieldPlusPositionImage[style],
.powerPlacePdfOnlyArea .starPositionImage[style],
.powerPlacePdfOnlyArea .daoElementImage.hasImage {
  background-size: cover !important;
  background-repeat: no-repeat !important;
  background-position: center !important;
  background-color: transparent !important;
  print-color-adjust: exact !important;
  -webkit-print-color-adjust: exact !important;
}
.profileLitePowerPlace .power-place-chess__slot.hasImage::before,
.profileLitePowerPlace .power-place-chess__slot.hasImage::after,
.profileLitePowerPlace .powerSource.hasImage::before,
.profileLitePowerPlace .powerSource.hasImage::after,
.profileLitePowerPlace .altarTopSource.hasImage::before,
.profileLitePowerPlace .altarTopSource.hasImage::after,
.profileLitePowerPlace .altarSupportSource.hasImage::before,
.profileLitePowerPlace .altarSupportSource.hasImage::after,
.profileLitePowerPlace .businessVertexZone.hasImage::before,
.profileLitePowerPlace .businessVertexZone.hasImage::after,
.profileLitePowerPlace .daoElementImage.hasImage::before,
.profileLitePowerPlace .daoElementImage.hasImage::after,
.profileLitePowerPlace .zodiacPositionImage[style]::before,
.profileLitePowerPlace .zodiacPositionImage[style]::after,
.profileLitePowerPlace .zodiacFieldPlusPositionImage[style]::before,
.profileLitePowerPlace .zodiacFieldPlusPositionImage[style]::after,
.profileLitePowerPlace .starPositionImage[style]::before,
.profileLitePowerPlace .starPositionImage[style]::after,
.powerPlacePdfOnlyArea .power-place-chess__slot.hasImage::before,
.powerPlacePdfOnlyArea .power-place-chess__slot.hasImage::after,
.powerPlacePdfOnlyArea .powerSource.hasImage::before,
.powerPlacePdfOnlyArea .powerSource.hasImage::after,
.powerPlacePdfOnlyArea .altarTopSource.hasImage::before,
.powerPlacePdfOnlyArea .altarTopSource.hasImage::after,
.powerPlacePdfOnlyArea .altarSupportSource.hasImage::before,
.powerPlacePdfOnlyArea .altarSupportSource.hasImage::after,
.powerPlacePdfOnlyArea .businessVertexZone.hasImage::before,
.powerPlacePdfOnlyArea .businessVertexZone.hasImage::after,
.powerPlacePdfOnlyArea .daoElementImage.hasImage::before,
.powerPlacePdfOnlyArea .daoElementImage.hasImage::after,
.powerPlacePdfOnlyArea .zodiacPositionImage[style]::before,
.powerPlacePdfOnlyArea .zodiacPositionImage[style]::after,
.powerPlacePdfOnlyArea .zodiacFieldPlusPositionImage[style]::before,
.powerPlacePdfOnlyArea .zodiacFieldPlusPositionImage[style]::after,
.powerPlacePdfOnlyArea .starPositionImage[style]::before,
.powerPlacePdfOnlyArea .starPositionImage[style]::after {
  display: none !important;
  content: none !important;
  box-shadow: none !important;
  background: transparent !important;
}
.profileLitePowerPlace .power-place-chess__cell:has(.power-place-chess__slot.hasImage),
.profileLitePowerPlace .zodiacPosition.hasImage,
.profileLitePowerPlace .zodiacFieldPlusPosition.hasImage,
.profileLitePowerPlace .starPosition.hasImage,
.powerPlacePdfOnlyArea .power-place-chess__cell:has(.power-place-chess__slot.hasImage),
.powerPlacePdfOnlyArea .zodiacPosition.hasImage,
.powerPlacePdfOnlyArea .zodiacFieldPlusPosition.hasImage,
.powerPlacePdfOnlyArea .starPosition.hasImage {
  background: transparent !important;
  box-shadow: none !important;
  backdrop-filter: none !important;
}
.profileLitePowerPlace .powerMandala[style],
.profileLitePowerPlace .altarMandalaSheet[style],
.profileLitePowerPlace .businessMandalaSheet[style],
.profileLitePowerPlace .zodiacMandalaSheet[style],
.profileLitePowerPlace .starMandalaSheet[style],
.profileLitePowerPlace .daoMandalaSheet[style],
.profileLitePowerPlace .power-place-chess[style],
.powerPlacePdfOnlyArea .powerMandala[style],
.powerPlacePdfOnlyArea .altarMandalaSheet[style],
.powerPlacePdfOnlyArea .businessMandalaSheet[style],
.powerPlacePdfOnlyArea .zodiacMandalaSheet[style],
.powerPlacePdfOnlyArea .starMandalaSheet[style],
.powerPlacePdfOnlyArea .daoMandalaSheet[style],
.powerPlacePdfOnlyArea .power-place-chess[style] {
  background-size: cover !important;
  background-repeat: no-repeat !important;
  background-position: ${innerOffsetX}% ${innerOffsetY}% !important;
  print-color-adjust: exact !important;
  -webkit-print-color-adjust: exact !important;
}
.profileLitePowerPlace .powerPlaceExternalTitle,
.powerPlacePdfOnlyArea .powerPlaceExternalTitle {
  order: -3;
  width: min(520px, 94%);
  margin: 0 auto 8px;
  text-align: center;
  pointer-events: none;
}
.profileLitePowerPlace .powerPlaceExternalTitle p,
.powerPlacePdfOnlyArea .powerPlaceExternalTitle p {
  margin: 0 0 2px;
  color: #8a5308;
  font-size: 12px;
  font-weight: 900;
  letter-spacing: 0.18em;
  text-transform: uppercase;
}
.profileLitePowerPlace .powerPlaceExternalTitle h3,
.powerPlacePdfOnlyArea .powerPlaceExternalTitle h3 {
  margin: 0;
  color: #5b3b12;
  font-size: clamp(24px, 5vw, 38px);
  line-height: 1;
  text-shadow: 0 1px 10px rgba(255, 246, 215, 0.72);
}
.profileLitePowerPlace .powerMandalaPanel[style] > .powerPrintMeta,
.powerPlacePdfOnlyArea .powerMandalaPanel[style] > .powerPrintMeta {
  display: none !important;
}
.profileLitePowerPlace .has-custom-inner-cover,
.powerPlacePdfOnlyArea .has-custom-inner-cover {
  background-image: var(--power-inner-cover-image, none) !important;
  background-color: transparent !important;
  background-size: cover !important;
  background-repeat: no-repeat !important;
  background-position: ${innerOffsetX}% ${innerOffsetY}% !important;
}
.profileLitePowerPlace .powerMandalaPanel[style],
.powerPlacePdfOnlyArea .powerMandalaPanel[style] {
  position: relative;
  justify-items: center !important;
  align-content: start !important;
  padding: clamp(34px, 8vw, 58px) !important;
  background-size: cover !important;
  background-repeat: no-repeat !important;
  background-position: ${outerOffsetX}% ${outerOffsetY}% !important;
  background-origin: border-box !important;
  background-clip: border-box !important;
  background-color: #fffaf0;
  print-color-adjust: exact !important;
  -webkit-print-color-adjust: exact !important;
}
.profileLitePowerPlace .powerMandalaPanel.field-layout-square,
.powerPlacePdfOnlyArea .powerMandalaPanel.field-layout-square {
  aspect-ratio: 1 / 1 !important;
  width: min(620px, 100%) !important;
}
.profileLitePowerPlace .powerMandalaPanel.field-layout-vertical,
.profileLitePowerPlace .powerMandalaPanel.field-layout-rectangle,
.powerPlacePdfOnlyArea .powerMandalaPanel.field-layout-vertical,
.powerPlacePdfOnlyArea .powerMandalaPanel.field-layout-rectangle {
  aspect-ratio: 9 / 16 !important;
  width: min(430px, 100%) !important;
  min-height: auto !important;
}
.profileLitePowerPlace .powerMandalaPanel.field-layout-horizontal,
.powerPlacePdfOnlyArea .powerMandalaPanel.field-layout-horizontal {
  aspect-ratio: 16 / 9 !important;
  width: min(760px, 100%) !important;
  min-height: auto !important;
}
.profileLitePowerPlace .powerMandalaPanel[style] > .power-place-chess,
.profileLitePowerPlace .powerMandalaPanel[style] > .powerMandala,
.profileLitePowerPlace .powerMandalaPanel[style] > .altarMandalaSheet,
.profileLitePowerPlace .powerMandalaPanel[style] > .businessMandalaSheet,
.profileLitePowerPlace .powerMandalaPanel[style] > .zodiacMandalaSheet,
.profileLitePowerPlace .powerMandalaPanel[style] > .starMandalaSheet,
.profileLitePowerPlace .powerMandalaPanel[style] > .daoMandalaSheet,
.powerPlacePdfOnlyArea .powerMandalaPanel[style] > .power-place-chess,
.powerPlacePdfOnlyArea .powerMandalaPanel[style] > .powerMandala,
.powerPlacePdfOnlyArea .powerMandalaPanel[style] > .altarMandalaSheet,
.powerPlacePdfOnlyArea .powerMandalaPanel[style] > .businessMandalaSheet,
.powerPlacePdfOnlyArea .powerMandalaPanel[style] > .zodiacMandalaSheet,
.powerPlacePdfOnlyArea .powerMandalaPanel[style] > .starMandalaSheet,
.powerPlacePdfOnlyArea .powerMandalaPanel[style] > .daoMandalaSheet {
  position: absolute !important;
  z-index: 1;
  top: 50% !important;
  left: 50% !important;
  transform: translate(-50%, -50%) !important;
  width: ${innerFieldScale}% !important;
  max-width: ${innerFieldScale}% !important;
  aspect-ratio: 1 / 1 !important;
  border-radius: ${centerRadius} !important;
  overflow: hidden !important;
  box-shadow: 0 18px 42px rgba(86, 55, 16, 0.12), inset 0 0 26px rgba(255, 250, 234, 0.22) !important;
}
.profileLitePowerPlace .powerMandalaPanel[style] .zodiacClockFace,
.profileLitePowerPlace .powerMandalaPanel[style] .daoUsinCore,
.powerPlacePdfOnlyArea .powerMandalaPanel[style] .zodiacClockFace,
.powerPlacePdfOnlyArea .powerMandalaPanel[style] .daoUsinCore {
  border-radius: ${centerRadius} !important;
}
.powerPlacePdfOnlyArea .power-place-chess__slot,
.powerPlacePdfOnlyArea .power-place-chess__center,
.powerPlacePdfOnlyArea .powerSource,
.powerPlacePdfOnlyArea .zodiacPositionImage,
.powerPlacePdfOnlyArea .zodiacFieldPlusPositionImage,
.powerPlacePdfOnlyArea .starPositionImage {
  border: 1px solid rgba(255, 213, 117, 0.74) !important;
  print-color-adjust: exact !important;
  -webkit-print-color-adjust: exact !important;
}
.powerPlacePdfOnlyArea .power-place-chess__slot.selected,
.powerPlacePdfOnlyArea .powerSource.selected,
.powerPlacePdfOnlyArea .zodiacPositionImage.selected,
.powerPlacePdfOnlyArea .zodiacFieldPlusPositionImage.selected,
.powerPlacePdfOnlyArea .starPositionImage.selected {
  border-color: #fff6d7 !important;
  box-shadow: 0 0 0 3px rgba(255, 246, 215, 0.48), 0 0 26px rgba(245, 198, 86, 0.52) !important;
}
.profileLitePowerPlace .coverVariantList.coverVariantsGrid button:nth-child(3),
.profileLitePowerPlace .coverVariantList.coverVariantsGrid button:nth-child(5),
.profileLitePowerPlace .coverVariantList.coverVariantsGrid button:nth-child(n+11),
.profileLitePowerPlace .mandalaFieldLayoutButtons button:nth-child(3) {
  display: none;
}
.profileLitePowerPlace .coverVariantList.coverVariantsGrid button.active {
  display: inline-flex;
}
.profileLitePowerPlace .mandalaFieldLayoutButtons button:nth-child(4) { order: -3; }
.profileLitePowerPlace .mandalaFieldLayoutButtons button:nth-child(1) { order: -2; }
.profileLitePowerPlace .mandalaFieldLayoutButtons button:nth-child(2) { order: -1; }
.profileLitePowerPlace .mandalaFieldLayoutSwitch {
  gap: 12px !important;
}
.profileLitePowerPlace .mandalaFieldLayoutSwitch > span {
  font-size: 0 !important;
}
.profileLitePowerPlace .mandalaFieldLayoutSwitch > span::before {
  content: "Фон";
  color: #6d5436;
  font-size: 12px;
  font-weight: 900;
}
.profileLitePowerPlace .centerShapeControl {
  display: grid;
  gap: 8px;
  border-top: 1px solid rgba(184, 121, 29, 0.18);
  padding-top: 10px;
}
.profileLitePowerPlace .centerShapeControl > span {
  color: #6d5436;
  font-size: 12px;
  font-weight: 900;
}
.profileLitePowerPlace .centerShapeButtons {
  display: flex;
  gap: 7px;
}
.profileLitePowerPlace .centerShapeButtons button {
  width: 38px;
  height: 34px;
  display: grid;
  place-items: center;
  border: 1px solid rgba(184, 121, 29, 0.28);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.72);
  color: #744c17;
  cursor: pointer;
}
.profileLitePowerPlace .centerShapeButtons button.active {
  border-color: rgba(245, 198, 106, 0.72);
  background: linear-gradient(180deg, #2a1a09, #8c570d);
  color: #fff0cd;
  box-shadow: 0 8px 20px rgba(127, 78, 14, 0.16);
}
.profileLitePowerPlace .centerShapeIcon {
  width: 20px;
  height: 20px;
  display: block;
  border: 2px solid currentColor;
}
.profileLitePowerPlace .centerShapeIcon.square { border-radius: 3px; }
.profileLitePowerPlace .centerShapeIcon.circle { border-radius: 50%; }
.profileLitePowerPlace .coverOffsetOverlay {
  position: absolute;
  inset: 0;
  z-index: 45;
  pointer-events: none;
}
.profileLitePowerPlace .coverOffsetCornerGroup {
  position: absolute;
  display: grid;
  grid-template-columns: repeat(2, 22px);
  gap: 4px;
  pointer-events: none;
}
.profileLitePowerPlace .coverOffsetCornerGroup.inner {
  top: 9px;
  left: 9px;
}
.profileLitePowerPlace .coverOffsetCornerGroup.outer {
  right: 9px;
  bottom: 9px;
}
.profileLitePowerPlace .coverOffsetCornerGroup button {
  border: 1px solid rgba(184, 121, 29, 0.32);
  border-radius: 999px;
  padding: 0;
  background: rgba(255, 250, 238, 0.82);
  color: #704812;
  font-weight: 900;
  line-height: 1;
  box-shadow: 0 8px 18px rgba(80, 52, 14, 0.12);
  width: 22px;
  min-width: 22px;
  height: 22px;
  font-size: 11px;
  pointer-events: auto;
}
.profileLitePowerPlace .coverOffsetCornerGroup button:active {
  transform: scale(0.96);
}
.profileLitePowerPlace .chessSizeControl,
.profileLitePowerPlace .innerFieldScaleControl,
.profileLitePowerPlace .centerImageScaleControl {
  width: 100%;
  display: grid;
  grid-template-columns: minmax(170px, 220px) 28px minmax(240px, 1fr) 28px;
  gap: 6px;
  align-items: center;
  margin-top: 4px;
  color: #3a2715;
  font-size: 15px;
  font-weight: 900;
}
.profileLitePowerPlace .chessSizeControl input,
.profileLitePowerPlace .innerFieldScaleControl input,
.profileLitePowerPlace .centerImageScaleControl input {
  width: 100%;
}
.profileLitePowerPlace .innerFieldScaleControl small,
.profileLitePowerPlace .centerImageScaleControl small {
  color: #704812;
  font-size: 12px;
}
.powerPlacePdfOnlyArea .coverOffsetOverlay,
body.printMandalaOnly .coverOffsetOverlay {
  display: none !important;
}
@media print {
  .coverOffsetOverlay,
  .chessSizeControl,
  .innerFieldScaleControl,
  .centerImageScaleControl,
  .centerShapeControl {
    display: none !important;
  }
}
@media (max-width: 560px) {
  .profileLitePowerPlace .powerMandalaPanel[style],
  .powerPlacePdfOnlyArea .powerMandalaPanel[style] {
    padding: clamp(28px, 9vw, 44px) !important;
  }
  .profileLitePowerPlace .chessSizeControl,
  .profileLitePowerPlace .innerFieldScaleControl,
  .profileLitePowerPlace .centerImageScaleControl {
    grid-template-columns: minmax(0, 120px) 24px minmax(0, 1fr) 24px;
  }
}
`;
}

function cleanRefs(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

function emptyOuterCover() {
  return { id: "no-cover", label: "Без фона", type: "none", tone: "none", src: "", display_src: "" };
}

function templateCover(template, currentCover) {
  const current = currentCover && typeof currentCover === "object" && !Array.isArray(currentCover) ? currentCover : {};
  const outer = current.outer || emptyOuterCover();
  const inner = {
    id: template.id,
    label: template.title,
    type: "image",
    tone: template.coverTone || template.id,
    src: template.src,
    display_src: template.src
  };

  return {
    id: inner.id,
    label: inner.label,
    type: inner.type,
    tone: inner.tone,
    src: inner.src,
    display_src: inner.display_src,
    inner,
    outer
  };
}

function normalizeLayeredCoverRef(coverRef) {
  const cover = cleanRefs(coverRef);
  const hasNestedLayers = Boolean(cover.inner || cover.outer);
  const legacyInner = hasNestedLayers ? {} : cover;
  const inner = cleanRefs(cover.inner || legacyInner);
  const outer = cleanRefs(cover.outer || emptyOuterCover());

  return {
    ...cover,
    id: inner.id || cover.id || "no-cover",
    label: inner.label || cover.label || "Без фона",
    type: inner.type || cover.type || "none",
    tone: inner.tone || cover.tone || "none",
    src: inner.src || cover.src || "",
    display_src: inner.display_src || inner.displaySrc || cover.display_src || cover.displaySrc || cover.src || "",
    inner: Object.keys(inner).length ? inner : emptyOuterCover(),
    outer: Object.keys(outer).length ? outer : emptyOuterCover()
  };
}

export default function ProfileLitePowerPlaceModule(props) {
  const [powerPanelNode, setPowerPanelNode] = useState(null);
  const [printAreaNode, setPrintAreaNode] = useState(null);
  const [layoutPanelNode, setLayoutPanelNode] = useState(null);
  const objectRefs = cleanRefs(props.compositionDraft?.object_refs);
  const activeTemplateId = objectRefs[MANDALA_TEMPLATE_REF_KEY] || "";
  const innerCoverOffsetX = coverOffsetValue(objectRefs[INNER_COVER_OFFSET_X_REF_KEY]);
  const innerCoverOffsetY = coverOffsetValue(objectRefs[INNER_COVER_OFFSET_Y_REF_KEY]);
  const outerCoverOffsetX = coverOffsetValue(objectRefs[OUTER_COVER_OFFSET_X_REF_KEY]);
  const outerCoverOffsetY = coverOffsetValue(objectRefs[OUTER_COVER_OFFSET_Y_REF_KEY]);
  const innerFieldScale = innerFieldScaleValue(objectRefs[INNER_FIELD_SCALE_REF_KEY]);
  const centerImageScale = centerImageScaleValue(objectRefs[CENTER_IMAGE_SCALE_REF_KEY]);
  const centerShape = centerShapeValue(objectRefs[CENTER_SHAPE_REF_KEY]);
  const activeTemplate = placePowerMandalaTemplates.find((template) => template.id === activeTemplateId) || null;
  const isClientMandala = (props.compositionDraft?.constructor_type || "") === "client";
  const formatLabel = CONSTRUCTOR_LABELS[props.compositionDraft?.constructor_type || ""] || "Место силы";
  const fitStyleText = useMemo(
    () => profileLiteFitFixStyles(innerCoverOffsetX, innerCoverOffsetY, outerCoverOffsetX, outerCoverOffsetY, innerFieldScale, centerShape),
    [innerCoverOffsetX, innerCoverOffsetY, outerCoverOffsetX, outerCoverOffsetY, innerFieldScale, centerShape]
  );

  useEffect(() => {
    if (typeof document === "undefined") return undefined;
    const refreshNodes = () => {
      setPowerPanelNode(document.querySelector(".profileLitePowerPlace .powerMandalaPanel") || null);
      setPrintAreaNode(document.querySelector(".profileLitePowerPlace .powerPlacePrintArea") || null);
      setLayoutPanelNode(document.querySelector(".profileLitePowerPlace .layoutCenterCell") || null);
    };
    refreshNodes();
    const timeoutId = window.setTimeout(refreshNodes, 0);
    return () => window.clearTimeout(timeoutId);
  }, [props.compositionDraft?.constructor_type, props.compositionDraft?.chess_variant, props.compositionDraft?.field_layout, props.compositionDraft?.cover_ref]);

  const writeObjectRefs = useCallback((nextRefs) => {
    props.onCompositionObjectRefsChange?.(JSON.stringify(nextRefs, null, 2));
  }, [props]);

  const shiftCoverOffset = useCallback((layer, axis, delta) => {
    const key = layer === "outer"
      ? (axis === "y" ? OUTER_COVER_OFFSET_Y_REF_KEY : OUTER_COVER_OFFSET_X_REF_KEY)
      : (axis === "y" ? INNER_COVER_OFFSET_Y_REF_KEY : INNER_COVER_OFFSET_X_REF_KEY);
    const current = coverOffsetValue(objectRefs[key]);
    writeObjectRefs({ ...objectRefs, [key]: coverOffsetValue(current + delta) });
  }, [objectRefs, writeObjectRefs]);

  const setCenterShape = useCallback((nextShape) => {
    writeObjectRefs({ ...objectRefs, [CENTER_SHAPE_REF_KEY]: centerShapeValue(nextShape) });
  }, [objectRefs, writeObjectRefs]);

  const writeTemplateId = useCallback((templateId) => {
    const nextRefs = { ...objectRefs };
    if (templateId) {
      nextRefs[MANDALA_TEMPLATE_REF_KEY] = templateId;
    } else {
      delete nextRefs[MANDALA_TEMPLATE_REF_KEY];
    }
    writeObjectRefs(nextRefs);
  }, [objectRefs, writeObjectRefs]);

  const handleTemplateSelect = useCallback((templateId) => {
    writeTemplateId(templateId);
    props.onCompositionDraftChange?.("constructor_type", "client");
    props.onCompositionDraftChange?.("geometry", 9);
  }, [props, writeTemplateId]);

  const handleTemplateClear = useCallback(() => {
    writeTemplateId("");
    props.onCompositionDraftChange?.("constructor_type", "client");
    if (Number(props.compositionDraft?.geometry) === 9) {
      props.onCompositionDraftChange?.("geometry", 4);
    }
  }, [props, writeTemplateId]);

  const handleDraftChange = useCallback((field, value) => {
    if ((field === "geometry" && activeTemplateId) || (field === "constructor_type" && value !== "client" && activeTemplateId)) {
      writeTemplateId("");
    }
    props.onCompositionDraftChange?.(field, value);
  }, [activeTemplateId, props, writeTemplateId]);

  const enhancedDraft = useMemo(() => {
    const baseDraft = activeTemplate && isClientMandala
      ? {
        ...props.compositionDraft,
        geometry: 9,
        cover_ref: templateCover(activeTemplate, props.compositionDraft?.cover_ref)
      }
      : props.compositionDraft;
    return {
      ...baseDraft,
      field_scale: innerFieldScale,
      __center_image_scale: centerImageScale,
      cover_ref: normalizeLayeredCoverRef(baseDraft?.cover_ref)
    };
  }, [activeTemplate, centerImageScale, innerFieldScale, isClientMandala, props.compositionDraft]);

  const externalTitle = (
    <div className="powerPlaceExternalTitle" aria-label="Название формата мандалы">
      <p>Формат</p>
      <h3>{formatLabel}</h3>
    </div>
  );

  const coverOffsetOverlay = (
    <div className="coverOffsetOverlay" aria-label="Смещение фоновых фото" data-print-hidden="true">
      <div className="coverOffsetCornerGroup inner" aria-label="Смещение внутреннего фона">
        <button type="button" onClick={() => shiftCoverOffset("inner", "x", -5)} aria-label="Сдвинуть внутренний фон влево">←</button>
        <button type="button" onClick={() => shiftCoverOffset("inner", "x", 5)} aria-label="Сдвинуть внутренний фон вправо">→</button>
        <button type="button" onClick={() => shiftCoverOffset("inner", "y", -5)} aria-label="Сдвинуть внутренний фон вверх">↑</button>
        <button type="button" onClick={() => shiftCoverOffset("inner", "y", 5)} aria-label="Сдвинуть внутренний фон вниз">↓</button>
      </div>
      <div className="coverOffsetCornerGroup outer" aria-label="Смещение внешнего фона">
        <button type="button" onClick={() => shiftCoverOffset("outer", "x", -5)} aria-label="Сдвинуть внешний фон влево">←</button>
        <button type="button" onClick={() => shiftCoverOffset("outer", "x", 5)} aria-label="Сдвинуть внешний фон вправо">→</button>
        <button type="button" onClick={() => shiftCoverOffset("outer", "y", -5)} aria-label="Сдвинуть внешний фон вверх">↑</button>
        <button type="button" onClick={() => shiftCoverOffset("outer", "y", 5)} aria-label="Сдвинуть внешний фон вниз">↓</button>
      </div>
    </div>
  );

  const centerShapeControl = (
    <div className="centerShapeControl" aria-label="Форма центра">
      <span>Центр</span>
      <div className="centerShapeButtons" role="group" aria-label="Форма центра">
        <button className={centerShape === "square" ? "active" : ""} type="button" onClick={() => setCenterShape("square")} aria-label="Центр квадрат" title="Квадрат">
          <i className="centerShapeIcon square" aria-hidden="true" />
        </button>
        <button className={centerShape === "circle" ? "active" : ""} type="button" onClick={() => setCenterShape("circle")} aria-label="Центр круг" title="Круг">
          <i className="centerShapeIcon circle" aria-hidden="true" />
        </button>
      </div>
    </div>
  );

  const templatePanel = (
    <>
      <style data-profile-lite-fit-fixes>{fitStyleText}</style>
      {printAreaNode ? createPortal(externalTitle, printAreaNode) : null}
      {powerPanelNode ? createPortal(coverOffsetOverlay, powerPanelNode) : null}
      {layoutPanelNode ? createPortal(centerShapeControl, layoutPanelNode) : null}
      {props.shellChrome}
      <div className="mandalaTemplatePilotPanel" aria-label="Сетки мандалы">
        <div>
          <p className="cabinetEyebrow">Сетка мандалы</p>
          <b>Фото-сетка для формата «Мандала»</b>
          <small>Пилот: сетка 1 включает 9 зон для загрузки мини-мандал.</small>
        </div>
        <div className="mandalaTemplatePilotButtons" role="group" aria-label="Выбор сетки мандалы">
          <button className={!activeTemplateId ? "active" : ""} type="button" onClick={handleTemplateClear}>Без сетки</button>
          {placePowerMandalaTemplates.map((template) => (
            <button className={activeTemplateId === template.id ? "active" : ""} key={template.id} type="button" onClick={() => handleTemplateSelect(template.id)} title={template.title}>
              {template.label}
            </button>
          ))}
        </div>
      </div>
    </>
  );

  return (
    <BaseProfileLitePowerPlaceModule
      {...props}
      compositionDraft={enhancedDraft}
      onCompositionDraftChange={handleDraftChange}
      shellChrome={templatePanel}
    />
  );
}
