import React, { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { innerFieldWidthDesktop, innerFieldWidthMobile } from "../../lib/powerPlaceStyleContract.js"; // kept for backward compat; absolute centering uses % directly
import BaseProfileLitePowerPlaceModule from "./ProfileLitePowerPlaceModuleBase.jsx";

const MANDALA_STYLE_REF_KEY = "__mandala_style";
const DAO_STYLE_REF_KEY = "__dao_style";
const ZODIAC_STYLE_REF_KEY = "__zodiac_style";
const DAO_TALISMAN_NODE_COUNT_REF_KEY = "__dao_talisman_node_count";
const INNER_COVER_OFFSET_X_REF_KEY = "__inner_cover_offset_x";
const INNER_COVER_OFFSET_Y_REF_KEY = "__inner_cover_offset_y";
const OUTER_COVER_OFFSET_X_REF_KEY = "__outer_cover_offset_x";
const OUTER_COVER_OFFSET_Y_REF_KEY = "__outer_cover_offset_y";
const INNER_FIELD_SCALE_REF_KEY = "__inner_field_scale";
const CENTER_IMAGE_SCALE_REF_KEY = "__center_image_scale";
const CENTER_FRAME_SCALE_REF_KEY = "__center_frame_scale";
const CENTER_SHAPE_REF_KEY = "__center_shape";
const CENTER_IMAGE_OFFSET_X_REF_KEY = "__center_image_offset_x";
const CENTER_IMAGE_OFFSET_Y_REF_KEY = "__center_image_offset_y";
const CENTER_IMAGE_ZOOM_REF_KEY = "__center_image_zoom";
const DAO_LAYOUT_OPTIONS_REF_KEY = "__dao_layout_options";
const DAO_LAYOUT_TEMPLATE_OPTIONS_REF_KEY = "__dao_layout_template_options";

const CONSTRUCTOR_LABELS = {
  zodiac: "Зодиак",
  star: "Звезда",
  chess: "Шахматы",
  client: "Мандала",
  altar: "Алтарь",
  business: "Бизнес",
  dao: "ДАО",
  "dao-layout": "ДАО-Макет"
};

function coverOffsetValue(value) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 50;
  return Math.min(80, Math.max(20, parsed));
}

function innerFieldScaleValue(value) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 78;
  return Math.min(145, Math.max(48, parsed));
}

function centerImageScaleValue(value) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 1;
  return Math.min(4, Math.max(0.65, parsed));
}

function centerFrameScaleValue(value) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 1;
  return Math.min(3.7, Math.max(0.72, parsed));
}

function centerShapeValue(value) {
  return value === "circle" ? "circle" : "square";
}

function clampCenterImageOffset(value) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 50;
  return Math.min(80, Math.max(20, parsed));
}

function clampCenterImageZoom(value) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 1;
  return Math.min(1.8, Math.max(0.65, parsed));
}

function coverZoomValue(value) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 1;
  return Math.min(1.8, Math.max(0.65, parsed));
}

function daoStyleValue(value) {
  if (value === "style-2") return "style-2";
  if (value === "talisman" || value === "talisman-1") return "talisman-1";
  if (value === "talisman-2") return "talisman-2";
  if (
    value === "fu-paper-slip" ||
    value === "cloud-register" ||
    value === "thunder-tablet" ||
    value === "taofu-charm" ||
    value === "dao-fu-wide-gate-roof" ||
    value === "dao-fu-narrow-banner-roof" ||
    value === "dao-fu-grand-gate-p" ||
    value === "dao-fu-bottle-p" ||
    value === "dao-fu-node-column" ||
    value === "dao-fu-soft-shoulder-banner"
  ) return value;
  return "style-1";
}

function normalizeDaoLayoutOptions(value) {
  const source = value && typeof value === "object" && !Array.isArray(value) ? value : {};
  const sideNodeCount = Number(source.sideNodeCount);
  return {
    topCrown: source.topCrown === "three_checks" ? "three_checks" : "roof_double_line",
    sideNodesVisible: source.sideNodesVisible === false ? false : true,
    sideNodeCount: sideNodeCount === 3 ? 3 : 2
  };
}

function zodiacStyleValue(value) {
  if (value === "stars" || value === "ribbon") return value;
  return "sun";
}

function daoTalismanNodeCountValue(value) {
  const n = Number(value);
  if (n === 3 || n === 5 || n === 7 || n === 9) return n;
  return 5;
}

function profileLiteFitFixStyles(innerOffsetX, innerOffsetY, outerOffsetX, outerOffsetY, innerCoverZoom, outerCoverZoom, innerFieldScale, centerImageScale, centerFrameScale, centerShape, centerImageOffsetX, centerImageOffsetY, centerImageZoom) {
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
  background-size: calc(100% * var(--power-center-image-scale, 1)) auto !important;
  background-repeat: no-repeat !important;
  background-position: var(--power-center-bg-pos, center) !important;
}
.profileLitePowerPlace .power-place-chess__center.hasImage,
.powerPlacePdfOnlyArea .power-place-chess__center.hasImage {
  background-size: calc(100% * var(--power-center-image-scale, 1)) auto !important;
  background-repeat: no-repeat !important;
  background-position: var(--power-center-bg-pos, center) !important;
}
.profileLitePowerPlace .powerCenterPhoto.hasImage,
.profileLitePowerPlace .altarCenterPhoto.hasImage,
.profileLitePowerPlace .businessCenterPhoto.hasImage,
.profileLitePowerPlace .zodiacCenterPhoto.hasImage,
.profileLitePowerPlace .starCenterPhoto.hasImage,
.profileLitePowerPlace .daoCenterPhoto.hasImage,
.profileLitePowerPlace .power-place-chess__center.hasImage,
.profileLitePowerPlace .slotImagePanZoomTarget.hasImage,
.powerPlacePdfOnlyArea .powerCenterPhoto.hasImage,
.powerPlacePdfOnlyArea .altarCenterPhoto.hasImage,
.powerPlacePdfOnlyArea .businessCenterPhoto.hasImage,
.powerPlacePdfOnlyArea .zodiacCenterPhoto.hasImage,
.powerPlacePdfOnlyArea .starCenterPhoto.hasImage,
.powerPlacePdfOnlyArea .daoCenterPhoto.hasImage,
.powerPlacePdfOnlyArea .power-place-chess__center.hasImage,
.powerPlacePdfOnlyArea .slotImagePanZoomTarget.hasImage {
  position: relative !important;
  overflow: hidden !important;
  background-image: none !important;
}
.profileLitePowerPlace .powerCenterPhoto.hasImage::before,
.profileLitePowerPlace .altarCenterPhoto.hasImage::before,
.profileLitePowerPlace .businessCenterPhoto.hasImage::before,
.profileLitePowerPlace .zodiacCenterPhoto.hasImage::before,
.profileLitePowerPlace .starCenterPhoto.hasImage::before,
.profileLitePowerPlace .daoCenterPhoto.hasImage::before,
.profileLitePowerPlace .power-place-chess__center.hasImage::before,
.powerPlacePdfOnlyArea .powerCenterPhoto.hasImage::before,
.powerPlacePdfOnlyArea .altarCenterPhoto.hasImage::before,
.powerPlacePdfOnlyArea .businessCenterPhoto.hasImage::before,
.powerPlacePdfOnlyArea .zodiacCenterPhoto.hasImage::before,
.powerPlacePdfOnlyArea .starCenterPhoto.hasImage::before,
.powerPlacePdfOnlyArea .daoCenterPhoto.hasImage::before,
.powerPlacePdfOnlyArea .power-place-chess__center.hasImage::before {
  content: "" !important;
  display: block !important;
  position: absolute !important;
  inset: 0 !important;
  border-radius: inherit !important;
  background-image: var(--power-center-image, none) !important;
  background-size: calc(100% * var(--power-center-image-scale, 1)) auto !important;
  background-repeat: no-repeat !important;
  background-position: var(--power-center-bg-pos, center) !important;
  transform: rotate(var(--slot-bg-rotate, 0deg)) !important;
  transform-origin: center !important;
}
.profileLitePowerPlace .slotImagePanZoomTarget.hasImage::before,
.powerPlacePdfOnlyArea .slotImagePanZoomTarget.hasImage::before {
  content: "" !important;
  display: block !important;
  position: absolute !important;
  inset: 0 !important;
  border-radius: inherit !important;
  background-image: var(--slot-bg-image, none) !important;
  background-size: calc(100% * var(--slot-bg-zoom, 1)) auto !important;
  background-repeat: no-repeat !important;
  background-position: var(--slot-bg-pos, center) !important;
  transform: rotate(var(--slot-bg-rotate, 0deg)) !important;
  transform-origin: center !important;
}
.profileLitePowerPlace .power-place-chess__slot.hasImage,
.profileLitePowerPlace .powerSource.hasImage,
.profileLitePowerPlace .altarTopSource.hasImage,
.profileLitePowerPlace .altarSupportSource.hasImage,
.profileLitePowerPlace .businessVertexZone.hasImage,
.profileLitePowerPlace .zodiacPositionImage[style],
.profileLitePowerPlace .zodiacFieldPlusPositionImage[style],
.profileLitePowerPlace .zodiacInnerPositionImage[style],
.profileLitePowerPlace .zodiacRibbonCellImage[style],
.profileLitePowerPlace .starPositionImage[style],
.profileLitePowerPlace .starAdditionalPositionImage[style],
.profileLitePowerPlace .daoElementImage.hasImage,
.powerPlacePdfOnlyArea .power-place-chess__slot.hasImage,
.powerPlacePdfOnlyArea .powerSource.hasImage,
.powerPlacePdfOnlyArea .altarTopSource.hasImage,
.powerPlacePdfOnlyArea .altarSupportSource.hasImage,
.powerPlacePdfOnlyArea .businessVertexZone.hasImage,
.powerPlacePdfOnlyArea .zodiacPositionImage[style],
.powerPlacePdfOnlyArea .zodiacFieldPlusPositionImage[style],
.powerPlacePdfOnlyArea .zodiacInnerPositionImage[style],
.powerPlacePdfOnlyArea .zodiacRibbonCellImage[style],
.powerPlacePdfOnlyArea .starPositionImage[style],
.powerPlacePdfOnlyArea .starAdditionalPositionImage[style],
.powerPlacePdfOnlyArea .daoElementImage.hasImage {
  background-size: calc(100% * var(--slot-bg-zoom, 1)) auto !important;
  background-repeat: no-repeat !important;
  background-position: var(--slot-bg-pos, center) !important;
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
.profileLitePowerPlace .zodiacInnerPositionImage[style]::before,
.profileLitePowerPlace .zodiacInnerPositionImage[style]::after,
.profileLitePowerPlace .zodiacRibbonCellImage[style]::before,
.profileLitePowerPlace .zodiacRibbonCellImage[style]::after,
.profileLitePowerPlace .starPositionImage[style]::before,
.profileLitePowerPlace .starPositionImage[style]::after,
.profileLitePowerPlace .starAdditionalPositionImage[style]::before,
.profileLitePowerPlace .starAdditionalPositionImage[style]::after,
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
.powerPlacePdfOnlyArea .zodiacInnerPositionImage[style]::before,
.powerPlacePdfOnlyArea .zodiacInnerPositionImage[style]::after,
.powerPlacePdfOnlyArea .zodiacRibbonCellImage[style]::before,
.powerPlacePdfOnlyArea .zodiacRibbonCellImage[style]::after,
.powerPlacePdfOnlyArea .starPositionImage[style]::before,
.powerPlacePdfOnlyArea .starPositionImage[style]::after,
.powerPlacePdfOnlyArea .starAdditionalPositionImage[style]::before,
.powerPlacePdfOnlyArea .starAdditionalPositionImage[style]::after {
  display: none !important;
  content: none !important;
  box-shadow: none !important;
  background: transparent !important;
}
.profileLitePowerPlace .powerCenterPhoto.hasImage::before,
.profileLitePowerPlace .altarCenterPhoto.hasImage::before,
.profileLitePowerPlace .businessCenterPhoto.hasImage::before,
.profileLitePowerPlace .zodiacCenterPhoto.hasImage::before,
.profileLitePowerPlace .starCenterPhoto.hasImage::before,
.profileLitePowerPlace .daoCenterPhoto.hasImage::before,
.profileLitePowerPlace .power-place-chess__center.hasImage::before,
.powerPlacePdfOnlyArea .powerCenterPhoto.hasImage::before,
.powerPlacePdfOnlyArea .altarCenterPhoto.hasImage::before,
.powerPlacePdfOnlyArea .businessCenterPhoto.hasImage::before,
.powerPlacePdfOnlyArea .zodiacCenterPhoto.hasImage::before,
.powerPlacePdfOnlyArea .starCenterPhoto.hasImage::before,
.powerPlacePdfOnlyArea .daoCenterPhoto.hasImage::before,
.powerPlacePdfOnlyArea .power-place-chess__center.hasImage::before {
  content: "" !important;
  display: block !important;
  position: absolute !important;
  inset: 0 !important;
  border-radius: inherit !important;
  background-image: var(--power-center-image, none) !important;
  background-size: calc(100% * var(--power-center-image-scale, 1)) auto !important;
  background-repeat: no-repeat !important;
  background-position: var(--power-center-bg-pos, center) !important;
  transform: rotate(var(--slot-bg-rotate, 0deg)) !important;
  transform-origin: center !important;
}
.profileLitePowerPlace .slotImagePanZoomTarget.hasImage::before,
.powerPlacePdfOnlyArea .slotImagePanZoomTarget.hasImage::before {
  content: "" !important;
  display: block !important;
  position: absolute !important;
  inset: 0 !important;
  border-radius: inherit !important;
  background-image: var(--slot-bg-image, none) !important;
  background-size: calc(100% * var(--slot-bg-zoom, 1)) auto !important;
  background-repeat: no-repeat !important;
  background-position: var(--slot-bg-pos, center) !important;
  transform: rotate(var(--slot-bg-rotate, 0deg)) !important;
  transform-origin: center !important;
}
.profileLitePowerPlace .power-place-chess__cell:has(.power-place-chess__slot.hasImage),
.profileLitePowerPlace .zodiacPosition.hasImage,
.profileLitePowerPlace .zodiacFieldPlusPosition.hasImage,
.profileLitePowerPlace .zodiacInnerPosition.hasImage,
.profileLitePowerPlace .zodiacRibbonCell.hasImage,
.profileLitePowerPlace .starPosition.hasImage,
.powerPlacePdfOnlyArea .power-place-chess__cell:has(.power-place-chess__slot.hasImage),
.powerPlacePdfOnlyArea .zodiacPosition.hasImage,
.powerPlacePdfOnlyArea .zodiacFieldPlusPosition.hasImage,
.powerPlacePdfOnlyArea .zodiacInnerPosition.hasImage,
.powerPlacePdfOnlyArea .zodiacRibbonCell.hasImage,
.powerPlacePdfOnlyArea .starPosition.hasImage {
  background: transparent !important;
  box-shadow: none !important;
  backdrop-filter: none !important;
}
.profileLitePowerPlace .powerMandala[style],
.profileLitePowerPlace .altarMandalaSheet[style],
.profileLitePowerPlace .businessMandalaSheet[style],
.profileLitePowerPlace .zodiacMandalaSheet[style],
.profileLitePowerPlace .zodiacRibbonSheet[style],
.profileLitePowerPlace .starMandalaSheet[style],
.profileLitePowerPlace .daoMandalaSheet[style],
.profileLitePowerPlace .power-place-chess[style],
.powerPlacePdfOnlyArea .powerMandala[style],
.powerPlacePdfOnlyArea .altarMandalaSheet[style],
.powerPlacePdfOnlyArea .businessMandalaSheet[style],
.powerPlacePdfOnlyArea .zodiacMandalaSheet[style],
.powerPlacePdfOnlyArea .zodiacRibbonSheet[style],
.powerPlacePdfOnlyArea .starMandalaSheet[style],
.powerPlacePdfOnlyArea .daoMandalaSheet[style],
.powerPlacePdfOnlyArea .power-place-chess[style] {
  background-size: cover !important;
  background-repeat: no-repeat !important;
  background-position: ${innerOffsetX}% ${innerOffsetY}% !important;
  print-color-adjust: exact !important;
  -webkit-print-color-adjust: exact !important;
}
.profileLitePowerPlace .powerMandalaPanel[style],
.powerPlacePdfOnlyArea .powerMandalaPanel[style] {
  --power-center-image-scale: ${centerImageScale * centerImageZoom};
  --power-center-frame-scale: ${centerFrameScale};
  --power-center-bg-pos: ${centerImageOffsetX}% ${centerImageOffsetY}%;
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
  background-size: calc(100% * ${innerCoverZoom}) auto !important;
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
.profileLitePowerPlace .powerMandalaPanel[style].outer-cover-image,
.powerPlacePdfOnlyArea .powerMandalaPanel[style].outer-cover-image {
  background-size: calc(100% * ${outerCoverZoom}) auto !important;
  background-position: ${outerOffsetX}% ${outerOffsetY}% !important;
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
  aspect-ratio: 9 / 19.5 !important;
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
.profileLitePowerPlace .powerMandalaPanel[style] > .zodiacRibbonSheet,
.profileLitePowerPlace .powerMandalaPanel[style] > .starMandalaSheet,
.profileLitePowerPlace .powerMandalaPanel[style] > .daoMandalaSheet,
.powerPlacePdfOnlyArea .powerMandalaPanel[style] > .power-place-chess,
.powerPlacePdfOnlyArea .powerMandalaPanel[style] > .powerMandala,
.powerPlacePdfOnlyArea .powerMandalaPanel[style] > .altarMandalaSheet,
.powerPlacePdfOnlyArea .powerMandalaPanel[style] > .businessMandalaSheet,
.powerPlacePdfOnlyArea .powerMandalaPanel[style] > .zodiacMandalaSheet,
.powerPlacePdfOnlyArea .powerMandalaPanel[style] > .zodiacRibbonSheet,
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
.profileLitePowerPlace .powerMandalaPanel[style] > .daoMandalaSheet.dao-shared-stage,
.powerPlacePdfOnlyArea .powerMandalaPanel[style] > .daoMandalaSheet.dao-shared-stage {
  height: min(500px, 88%) !important;
  width: auto !important;
  max-width: 92% !important;
  overflow: visible !important;
  border-radius: 0 !important;
  box-shadow: none !important;
}
.profileLitePowerPlace .powerMandalaPanel[style] > .daoMandalaSheet.dao-shared-stage.dao-fu-wide-gate-roof,
.powerPlacePdfOnlyArea .powerMandalaPanel[style] > .daoMandalaSheet.dao-shared-stage.dao-fu-wide-gate-roof {
  aspect-ratio: 5 / 7 !important;
}
.profileLitePowerPlace .powerMandalaPanel[style] > .daoMandalaSheet.dao-shared-stage.dao-fu-narrow-banner-roof,
.powerPlacePdfOnlyArea .powerMandalaPanel[style] > .daoMandalaSheet.dao-shared-stage.dao-fu-narrow-banner-roof {
  aspect-ratio: 3 / 7 !important;
}
.profileLitePowerPlace .powerMandalaPanel[style] > .daoMandalaSheet.dao-shared-stage.dao-fu-grand-gate-p,
.powerPlacePdfOnlyArea .powerMandalaPanel[style] > .daoMandalaSheet.dao-shared-stage.dao-fu-grand-gate-p {
  aspect-ratio: 5 / 6.5 !important;
}
.profileLitePowerPlace .powerMandalaPanel[style] > .daoMandalaSheet.dao-shared-stage.dao-fu-bottle-p,
.powerPlacePdfOnlyArea .powerMandalaPanel[style] > .daoMandalaSheet.dao-shared-stage.dao-fu-bottle-p {
  aspect-ratio: 3 / 5.8 !important;
}
.profileLitePowerPlace .powerMandalaPanel[style] > .daoMandalaSheet.dao-shared-stage.dao-fu-node-column,
.powerPlacePdfOnlyArea .powerMandalaPanel[style] > .daoMandalaSheet.dao-shared-stage.dao-fu-node-column {
  aspect-ratio: 3 / 6.2 !important;
}
.profileLitePowerPlace .powerMandalaPanel[style] > .daoMandalaSheet.dao-shared-stage.dao-fu-soft-shoulder-banner,
.powerPlacePdfOnlyArea .powerMandalaPanel[style] > .daoMandalaSheet.dao-shared-stage.dao-fu-soft-shoulder-banner {
  aspect-ratio: 3 / 6.5 !important;
}
.profileLitePowerPlace .powerMandalaPanel[style] > .daoMandalaSheet.dao-talisman,
.powerPlacePdfOnlyArea .powerMandalaPanel[style] > .daoMandalaSheet.dao-talisman {
  width: min(336px, 82%) !important;
  max-width: min(336px, 82%) !important;
  aspect-ratio: 9 / 16 !important;
  border-radius: 12px 12px 8px 8px !important;
}
.profileLitePowerPlace .powerMandalaPanel[style] > .daoMandalaSheet.dao-talisman-2,
.powerPlacePdfOnlyArea .powerMandalaPanel[style] > .daoMandalaSheet.dao-talisman-2 {
  width: min(292px, 78%) !important;
  max-width: min(292px, 78%) !important;
  aspect-ratio: 9 / 16 !important;
  border-radius: 12px 12px 8px 8px !important;
}
.profileLitePowerPlace .powerMandalaPanel[style] > .daoMandalaSheet.dao-fu-paper-slip,
.profileLitePowerPlace .powerMandalaPanel[style] > .daoMandalaSheet.dao-cloud-register,
.profileLitePowerPlace .powerMandalaPanel[style] > .daoMandalaSheet.dao-thunder-tablet,
.profileLitePowerPlace .powerMandalaPanel[style] > .daoMandalaSheet.dao-taofu-charm,
.powerPlacePdfOnlyArea .powerMandalaPanel[style] > .daoMandalaSheet.dao-fu-paper-slip,
.powerPlacePdfOnlyArea .powerMandalaPanel[style] > .daoMandalaSheet.dao-cloud-register,
.powerPlacePdfOnlyArea .powerMandalaPanel[style] > .daoMandalaSheet.dao-thunder-tablet,
.powerPlacePdfOnlyArea .powerMandalaPanel[style] > .daoMandalaSheet.dao-taofu-charm {
  width: min(248px, 60%) !important;
  max-width: min(248px, 60%) !important;
  aspect-ratio: 1 / 2.9 !important;
  border-radius: 10px !important;
  overflow: visible !important;
}
@media (max-width: 640px) {
  .profileLitePowerPlace .powerMandalaPanel[style] > .daoMandalaSheet.dao-fu-paper-slip,
  .profileLitePowerPlace .powerMandalaPanel[style] > .daoMandalaSheet.dao-cloud-register,
  .profileLitePowerPlace .powerMandalaPanel[style] > .daoMandalaSheet.dao-thunder-tablet,
  .profileLitePowerPlace .powerMandalaPanel[style] > .daoMandalaSheet.dao-taofu-charm,
  .powerPlacePdfOnlyArea .powerMandalaPanel[style] > .daoMandalaSheet.dao-fu-paper-slip,
  .powerPlacePdfOnlyArea .powerMandalaPanel[style] > .daoMandalaSheet.dao-cloud-register,
  .powerPlacePdfOnlyArea .powerMandalaPanel[style] > .daoMandalaSheet.dao-thunder-tablet,
  .powerPlacePdfOnlyArea .powerMandalaPanel[style] > .daoMandalaSheet.dao-taofu-charm {
    width: min(220px, 58vw) !important;
    max-width: min(220px, 58vw) !important;
    aspect-ratio: 1 / 2.9 !important;
  }
  .profileLitePowerPlace .powerMandalaPanel[style] > .daoMandalaSheet.dao-talisman,
  .powerPlacePdfOnlyArea .powerMandalaPanel[style] > .daoMandalaSheet.dao-talisman {
    width: min(190px, 64%) !important;
    max-width: min(190px, 64%) !important;
  }
  .profileLitePowerPlace .powerMandalaPanel[style] > .daoMandalaSheet.dao-talisman-2,
  .powerPlacePdfOnlyArea .powerMandalaPanel[style] > .daoMandalaSheet.dao-talisman-2 {
    width: min(190px, 64%) !important;
    max-width: min(190px, 64%) !important;
  }
}
.profileLitePowerPlace .powerMandalaPanel.field-layout-vertical[style] > .power-place-chess,
.profileLitePowerPlace .powerMandalaPanel.field-layout-vertical[style] > .powerMandala,
.profileLitePowerPlace .powerMandalaPanel.field-layout-vertical[style] > .altarMandalaSheet,
.profileLitePowerPlace .powerMandalaPanel.field-layout-vertical[style] > .businessMandalaSheet,
.profileLitePowerPlace .powerMandalaPanel.field-layout-vertical[style] > .zodiacMandalaSheet,
.profileLitePowerPlace .powerMandalaPanel.field-layout-vertical[style] > .starMandalaSheet,
.profileLitePowerPlace .powerMandalaPanel.field-layout-vertical[style] > .daoMandalaSheet,
.profileLitePowerPlace .powerMandalaPanel.field-layout-rectangle[style] > .power-place-chess,
.profileLitePowerPlace .powerMandalaPanel.field-layout-rectangle[style] > .powerMandala,
.profileLitePowerPlace .powerMandalaPanel.field-layout-rectangle[style] > .altarMandalaSheet,
.profileLitePowerPlace .powerMandalaPanel.field-layout-rectangle[style] > .businessMandalaSheet,
.profileLitePowerPlace .powerMandalaPanel.field-layout-rectangle[style] > .zodiacMandalaSheet,
.profileLitePowerPlace .powerMandalaPanel.field-layout-rectangle[style] > .starMandalaSheet,
.profileLitePowerPlace .powerMandalaPanel.field-layout-rectangle[style] > .daoMandalaSheet,
.powerPlacePdfOnlyArea .powerMandalaPanel.field-layout-vertical[style] > .power-place-chess,
.powerPlacePdfOnlyArea .powerMandalaPanel.field-layout-vertical[style] > .powerMandala,
.powerPlacePdfOnlyArea .powerMandalaPanel.field-layout-vertical[style] > .altarMandalaSheet,
.powerPlacePdfOnlyArea .powerMandalaPanel.field-layout-vertical[style] > .businessMandalaSheet,
.powerPlacePdfOnlyArea .powerMandalaPanel.field-layout-vertical[style] > .zodiacMandalaSheet,
.powerPlacePdfOnlyArea .powerMandalaPanel.field-layout-vertical[style] > .starMandalaSheet,
.powerPlacePdfOnlyArea .powerMandalaPanel.field-layout-vertical[style] > .daoMandalaSheet,
.powerPlacePdfOnlyArea .powerMandalaPanel.field-layout-rectangle[style] > .power-place-chess,
.powerPlacePdfOnlyArea .powerMandalaPanel.field-layout-rectangle[style] > .powerMandala,
.powerPlacePdfOnlyArea .powerMandalaPanel.field-layout-rectangle[style] > .altarMandalaSheet,
.powerPlacePdfOnlyArea .powerMandalaPanel.field-layout-rectangle[style] > .businessMandalaSheet,
.powerPlacePdfOnlyArea .powerMandalaPanel.field-layout-rectangle[style] > .zodiacMandalaSheet,
.powerPlacePdfOnlyArea .powerMandalaPanel.field-layout-rectangle[style] > .starMandalaSheet,
.powerPlacePdfOnlyArea .powerMandalaPanel.field-layout-rectangle[style] > .daoMandalaSheet {
  aspect-ratio: 9 / 19.5 !important;
}
.profileLitePowerPlace .powerMandalaPanel.field-layout-vertical[style] > .daoMandalaSheet.dao-talisman,
.profileLitePowerPlace .powerMandalaPanel.field-layout-rectangle[style] > .daoMandalaSheet.dao-talisman,
.powerPlacePdfOnlyArea .powerMandalaPanel.field-layout-vertical[style] > .daoMandalaSheet.dao-talisman,
.powerPlacePdfOnlyArea .powerMandalaPanel.field-layout-rectangle[style] > .daoMandalaSheet.dao-talisman,
.profileLitePowerPlace .powerMandalaPanel.field-layout-vertical[style] > .daoMandalaSheet.dao-talisman-2,
.profileLitePowerPlace .powerMandalaPanel.field-layout-rectangle[style] > .daoMandalaSheet.dao-talisman-2,
.powerPlacePdfOnlyArea .powerMandalaPanel.field-layout-vertical[style] > .daoMandalaSheet.dao-talisman-2,
.powerPlacePdfOnlyArea .powerMandalaPanel.field-layout-rectangle[style] > .daoMandalaSheet.dao-talisman-2 {
  aspect-ratio: 9 / 16 !important;
}
.profileLitePowerPlace .powerMandalaPanel.field-layout-vertical[style] > .daoMandalaSheet.dao-fu-paper-slip,
.profileLitePowerPlace .powerMandalaPanel.field-layout-vertical[style] > .daoMandalaSheet.dao-cloud-register,
.profileLitePowerPlace .powerMandalaPanel.field-layout-vertical[style] > .daoMandalaSheet.dao-thunder-tablet,
.profileLitePowerPlace .powerMandalaPanel.field-layout-vertical[style] > .daoMandalaSheet.dao-taofu-charm,
.profileLitePowerPlace .powerMandalaPanel.field-layout-rectangle[style] > .daoMandalaSheet.dao-fu-paper-slip,
.profileLitePowerPlace .powerMandalaPanel.field-layout-rectangle[style] > .daoMandalaSheet.dao-cloud-register,
.profileLitePowerPlace .powerMandalaPanel.field-layout-rectangle[style] > .daoMandalaSheet.dao-thunder-tablet,
.profileLitePowerPlace .powerMandalaPanel.field-layout-rectangle[style] > .daoMandalaSheet.dao-taofu-charm,
.powerPlacePdfOnlyArea .powerMandalaPanel.field-layout-vertical[style] > .daoMandalaSheet.dao-fu-paper-slip,
.powerPlacePdfOnlyArea .powerMandalaPanel.field-layout-vertical[style] > .daoMandalaSheet.dao-cloud-register,
.powerPlacePdfOnlyArea .powerMandalaPanel.field-layout-vertical[style] > .daoMandalaSheet.dao-thunder-tablet,
.powerPlacePdfOnlyArea .powerMandalaPanel.field-layout-vertical[style] > .daoMandalaSheet.dao-taofu-charm,
.powerPlacePdfOnlyArea .powerMandalaPanel.field-layout-rectangle[style] > .daoMandalaSheet.dao-fu-paper-slip,
.powerPlacePdfOnlyArea .powerMandalaPanel.field-layout-rectangle[style] > .daoMandalaSheet.dao-cloud-register,
.powerPlacePdfOnlyArea .powerMandalaPanel.field-layout-rectangle[style] > .daoMandalaSheet.dao-thunder-tablet,
.powerPlacePdfOnlyArea .powerMandalaPanel.field-layout-rectangle[style] > .daoMandalaSheet.dao-taofu-charm {
  aspect-ratio: 1 / 2.9 !important;
  width: min(248px, 60%) !important;
  max-width: min(248px, 60%) !important;
  border-radius: 10px !important;
  overflow: visible !important;
}
.profileLitePowerPlace .powerCenterPhoto,
.powerPlacePdfOnlyArea .powerCenterPhoto {
  width: calc(34% * var(--power-center-frame-scale, 1)) !important;
}
.profileLitePowerPlace .altarCenterPhoto,
.powerPlacePdfOnlyArea .altarCenterPhoto {
  width: calc(30% * var(--power-center-frame-scale, 1)) !important;
}
.profileLitePowerPlace .businessCenterPhoto,
.profileLitePowerPlace .daoCenterPhoto,
.powerPlacePdfOnlyArea .businessCenterPhoto,
.powerPlacePdfOnlyArea .daoCenterPhoto {
  width: calc(28% * var(--power-center-frame-scale, 1)) !important;
}
.profileLitePowerPlace .zodiacCenterPhoto,
.powerPlacePdfOnlyArea .zodiacCenterPhoto {
  width: calc(31% * var(--power-center-frame-scale, 1)) !important;
}
.profileLitePowerPlace .starCenterPhoto,
.powerPlacePdfOnlyArea .starCenterPhoto {
  width: calc(29% * var(--power-center-frame-scale, 1)) !important;
}
.profileLitePowerPlace .power-place-chess__center,
.powerPlacePdfOnlyArea .power-place-chess__center {
  width: calc(100% * var(--power-center-frame-scale, 1)) !important;
  height: calc(100% * var(--power-center-frame-scale, 1)) !important;
  place-self: center !important;
  aspect-ratio: 1 / 1 !important;
}
.profileLitePowerPlace .power-place-chess--plus-8 .power-place-chess__center,
.profileLitePowerPlace .power-place-chess--compact-5 .power-place-chess__center,
.powerPlacePdfOnlyArea .power-place-chess--plus-8 .power-place-chess__center,
.powerPlacePdfOnlyArea .power-place-chess--compact-5 .power-place-chess__center {
  width: calc(28% * var(--power-center-frame-scale, 1)) !important;
  height: auto !important;
}
.profileLitePowerPlace .daoTalisman2CenterArea .daoCenterPhoto,
.powerPlacePdfOnlyArea .daoTalisman2CenterArea .daoCenterPhoto {
  width: clamp(58px, 100%, 88px) !important;
  height: clamp(58px, 100%, 88px) !important;
  aspect-ratio: 1 / 1 !important;
  border-radius: 50% !important;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
}
.profileLitePowerPlace .daoStyle2CenterArea .daoCenterPhoto,
.powerPlacePdfOnlyArea .daoStyle2CenterArea .daoCenterPhoto {
  width: clamp(74px, 100%, 108px) !important;
  height: clamp(74px, 100%, 108px) !important;
  aspect-ratio: 1 / 1 !important;
  border-radius: 50% !important;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
}
.profileLitePowerPlace .daoFuluCenterArea .daoCenterPhoto,
.powerPlacePdfOnlyArea .daoFuluCenterArea .daoCenterPhoto {
  width: clamp(52px, 32%, 78px) !important;
  height: clamp(52px, 32%, 78px) !important;
  aspect-ratio: 1 / 1 !important;
  border-radius: 50% !important;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
}
.profileLitePowerPlace .daoFuOutlineCenterArea .daoCenterPhoto,
.powerPlacePdfOnlyArea .daoFuOutlineCenterArea .daoCenterPhoto {
  width: clamp(52px, 35%, 86px) !important;
  height: clamp(52px, 35%, 86px) !important;
  aspect-ratio: 1 / 1 !important;
  border-radius: 50% !important;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
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
.profileLitePowerPlace .centerFrameScaleControl,
.profileLitePowerPlace .photoScaleControl,
.profileLitePowerPlace .innerFieldScaleControl {
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
.profileLitePowerPlace .centerFrameScaleControl input,
.profileLitePowerPlace .photoScaleControl input,
.profileLitePowerPlace .innerFieldScaleControl input {
  width: 100%;
}
.profileLitePowerPlace .innerFieldScaleControl small,
.profileLitePowerPlace .photoScaleControl small {
  color: #704812;
  font-size: 12px;
}
@media print {
  .centerFrameScaleControl,
  .photoScaleControl,
  .innerFieldScaleControl,
  .centerShapeControl {
    display: none !important;
  }
}
@media (max-width: 560px) {
  .profileLitePowerPlace .powerMandalaPanel[style],
  .powerPlacePdfOnlyArea .powerMandalaPanel[style] {
    padding: clamp(28px, 9vw, 44px) !important;
  }
  .profileLitePowerPlace .centerFrameScaleControl,
  .profileLitePowerPlace .photoScaleControl,
  .profileLitePowerPlace .innerFieldScaleControl {
    grid-template-columns: minmax(0, 120px) 24px minmax(0, 1fr) 24px;
  }
}
`;
}

function cleanRefs(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

function coverTransformZoom(objectRefs, slotId) {
  return coverZoomValue(cleanRefs(cleanRefs(objectRefs.__slot_transforms)[slotId]).zoom);
}

function emptyOuterCover() {
  return { id: "no-cover", label: "Без фона", type: "none", tone: "none", src: "", display_src: "" };
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
  const innerCoverOffsetX = coverOffsetValue(objectRefs[INNER_COVER_OFFSET_X_REF_KEY]);
  const innerCoverOffsetY = coverOffsetValue(objectRefs[INNER_COVER_OFFSET_Y_REF_KEY]);
  const outerCoverOffsetX = coverOffsetValue(objectRefs[OUTER_COVER_OFFSET_X_REF_KEY]);
  const outerCoverOffsetY = coverOffsetValue(objectRefs[OUTER_COVER_OFFSET_Y_REF_KEY]);
  const innerCoverZoom = coverTransformZoom(objectRefs, "cover_ref.inner");
  const outerCoverZoom = coverTransformZoom(objectRefs, "cover_ref.outer");
  const innerFieldScale = innerFieldScaleValue(objectRefs[INNER_FIELD_SCALE_REF_KEY]);
  const centerImageScale = centerImageScaleValue(objectRefs[CENTER_IMAGE_SCALE_REF_KEY]);
  const centerFrameScale = centerFrameScaleValue(objectRefs[CENTER_FRAME_SCALE_REF_KEY]);
  const centerShape = centerShapeValue(objectRefs[CENTER_SHAPE_REF_KEY]);
  const centerImageOffsetX = clampCenterImageOffset(objectRefs[CENTER_IMAGE_OFFSET_X_REF_KEY]);
  const centerImageOffsetY = clampCenterImageOffset(objectRefs[CENTER_IMAGE_OFFSET_Y_REF_KEY]);
  const centerImageZoom = clampCenterImageZoom(objectRefs[CENTER_IMAGE_ZOOM_REF_KEY]);
  const mandalaStyle = objectRefs[MANDALA_STYLE_REF_KEY] || "style-1";
  const legacyDaoLayoutStyle = objectRefs[DAO_STYLE_REF_KEY] === "dao-layout-template";
  const constructorType = legacyDaoLayoutStyle ? "dao-layout" : props.compositionDraft?.constructor_type;
  const daoStyle = daoStyleValue(objectRefs[DAO_STYLE_REF_KEY]);
  const daoLayoutOptions = normalizeDaoLayoutOptions(objectRefs[DAO_LAYOUT_OPTIONS_REF_KEY] || objectRefs[DAO_LAYOUT_TEMPLATE_OPTIONS_REF_KEY]);
  const zodiacStyle = zodiacStyleValue(objectRefs[ZODIAC_STYLE_REF_KEY]);
  const daoTalismanNodeCount = daoTalismanNodeCountValue(objectRefs[DAO_TALISMAN_NODE_COUNT_REF_KEY]);
  const formatLabel = CONSTRUCTOR_LABELS[constructorType || ""] || "Место силы";
  const fitStyleText = useMemo(
    () => profileLiteFitFixStyles(innerCoverOffsetX, innerCoverOffsetY, outerCoverOffsetX, outerCoverOffsetY, innerCoverZoom, outerCoverZoom, innerFieldScale, centerImageScale, centerFrameScale, centerShape, centerImageOffsetX, centerImageOffsetY, centerImageZoom),
    [innerCoverOffsetX, innerCoverOffsetY, outerCoverOffsetX, outerCoverOffsetY, innerCoverZoom, outerCoverZoom, innerFieldScale, centerImageScale, centerFrameScale, centerShape, centerImageOffsetX, centerImageOffsetY, centerImageZoom]
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
  }, [constructorType, props.compositionDraft?.chess_variant, props.compositionDraft?.field_layout, props.compositionDraft?.cover_ref]);

  const writeObjectRefs = useCallback((nextRefs) => {
    props.onCompositionObjectRefsChange?.(JSON.stringify(nextRefs, null, 2));
  }, [props]);

  const setCenterShape = useCallback((nextShape) => {
    writeObjectRefs({ ...objectRefs, [CENTER_SHAPE_REF_KEY]: centerShapeValue(nextShape) });
  }, [objectRefs, writeObjectRefs]);

  const handleDraftChange = useCallback((field, value) => {
    if (field === CENTER_IMAGE_SCALE_REF_KEY) {
      writeObjectRefs({ ...objectRefs, [CENTER_IMAGE_SCALE_REF_KEY]: String(centerImageScaleValue(value)) });
      return;
    }

    if (field === CENTER_FRAME_SCALE_REF_KEY) {
      writeObjectRefs({ ...objectRefs, [CENTER_FRAME_SCALE_REF_KEY]: String(centerFrameScaleValue(value)) });
      return;
    }

    if (field === MANDALA_STYLE_REF_KEY) {
      writeObjectRefs({ ...objectRefs, [MANDALA_STYLE_REF_KEY]: value });
      return;
    }

    if (field === DAO_STYLE_REF_KEY) {
      writeObjectRefs({ ...objectRefs, [DAO_STYLE_REF_KEY]: daoStyleValue(value) });
      if (constructorType === "dao-layout" && props.compositionDraft?.constructor_type !== "dao-layout") {
        props.onCompositionDraftChange?.("constructor_type", "dao-layout");
      }
      return;
    }

    if (field === DAO_LAYOUT_OPTIONS_REF_KEY || field === DAO_LAYOUT_TEMPLATE_OPTIONS_REF_KEY) {
      writeObjectRefs({ ...objectRefs, [DAO_LAYOUT_OPTIONS_REF_KEY]: normalizeDaoLayoutOptions(value) });
      return;
    }

    if (field === DAO_TALISMAN_NODE_COUNT_REF_KEY) {
      writeObjectRefs({ ...objectRefs, [DAO_TALISMAN_NODE_COUNT_REF_KEY]: String(daoTalismanNodeCountValue(value)) });
      return;
    }

    if (field === ZODIAC_STYLE_REF_KEY) {
      writeObjectRefs({ ...objectRefs, [ZODIAC_STYLE_REF_KEY]: zodiacStyleValue(value) });
      return;
    }

    if (field === "constructor_type") {
      const nextRefs = { ...objectRefs };
      if (value === "dao-layout" && objectRefs[DAO_STYLE_REF_KEY] === "dao-layout-template") {
        nextRefs[DAO_STYLE_REF_KEY] = "style-1";
      }
      if (value === "dao-layout" && !nextRefs[DAO_LAYOUT_OPTIONS_REF_KEY]) {
        nextRefs[DAO_LAYOUT_OPTIONS_REF_KEY] = daoLayoutOptions;
      }
      if (value === "dao-layout" || objectRefs[DAO_STYLE_REF_KEY] === "dao-layout-template") {
        writeObjectRefs(nextRefs);
      }
      props.onCompositionDraftChange?.(field, value);
      return;
    }

    props.onCompositionDraftChange?.(field, value);
  }, [constructorType, daoLayoutOptions, objectRefs, props, writeObjectRefs]);

  const enhancedDraft = useMemo(() => ({
    ...props.compositionDraft,
    constructor_type: constructorType,
    field_scale: innerFieldScale,
    __center_image_scale: centerImageScale,
    __center_frame_scale: centerFrameScale,
    __mandala_style: mandalaStyle,
    __dao_style: daoStyle,
    __dao_talisman_node_count: daoTalismanNodeCount,
    __zodiac_style: zodiacStyle,
    __center_image_offset_x: centerImageOffsetX,
    __center_image_offset_y: centerImageOffsetY,
    __center_image_zoom: centerImageZoom,
    cover_ref: normalizeLayeredCoverRef(props.compositionDraft?.cover_ref)
  }), [centerFrameScale, centerImageOffsetX, centerImageOffsetY, centerImageScale, centerImageZoom, constructorType, daoStyle, daoTalismanNodeCount, innerFieldScale, mandalaStyle, props.compositionDraft, zodiacStyle]);

  const externalTitle = (
    <div className="powerPlaceExternalTitle" aria-label="Название формата мандалы">
      <p>Формат</p>
      <h3>{formatLabel}</h3>
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
      {layoutPanelNode ? createPortal(centerShapeControl, layoutPanelNode) : null}
      {props.shellChrome}
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
