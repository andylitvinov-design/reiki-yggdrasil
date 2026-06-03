import React, { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { placePowerMandalaTemplates } from "../../data/placePowerMandalaTemplates.js";
import BaseProfileLitePowerPlaceModule from "./ProfileLitePowerPlaceModuleBase.jsx";
import "../../profileMandalaTemplatePilot.css";

const MANDALA_TEMPLATE_REF_KEY = "__mandala_template_id";
const INNER_COVER_OFFSET_X_REF_KEY = "__inner_cover_offset_x";
const INNER_COVER_OFFSET_Y_REF_KEY = "__inner_cover_offset_y";
const OUTER_COVER_OFFSET_X_REF_KEY = "__outer_cover_offset_x";
const OUTER_COVER_OFFSET_Y_REF_KEY = "__outer_cover_offset_y";
const INNER_FIELD_SCALE_REF_KEY = "__inner_field_scale";

function coverOffsetValue(value) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 50;
  return Math.min(80, Math.max(20, parsed));
}

function innerFieldScaleValue(value) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 78;
  return Math.min(92, Math.max(48, parsed));
}

function profileLiteFitFixStyles(innerOffsetX, innerOffsetY, outerOffsetX, outerOffsetY, innerFieldScale) {
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
  background-size: cover !important;
  background-repeat: no-repeat !important;
  background-position: center !important;
}
.profileLitePowerPlace .power-place-chess__center.hasImage,
.profileLitePowerPlace .power-place-chess__slot.hasImage,
.profileLitePowerPlace .powerSource.hasImage,
.profileLitePowerPlace .altarTopSource.hasImage,
.profileLitePowerPlace .altarSupportSource.hasImage,
.profileLitePowerPlace .businessVertexZone.hasImage,
.profileLitePowerPlace .zodiacPositionImage[style],
.profileLitePowerPlace .zodiacFieldPlusPositionImage[style],
.profileLitePowerPlace .starPositionImage[style],
.profileLitePowerPlace .daoElementImage.hasImage,
.powerPlacePdfOnlyArea .power-place-chess__center.hasImage,
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
.profileLitePowerPlace .powerMandalaPanel[style],
.powerPlacePdfOnlyArea .powerMandalaPanel[style] {
  position: relative;
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
.profileLitePowerPlace .powerMandalaPanel[style] .powerPrintMeta,
.powerPlacePdfOnlyArea .powerMandalaPanel[style] .powerPrintMeta {
  order: -1;
  position: relative !important;
  z-index: 2 !important;
  width: min(500px, 92%) !important;
  margin: 0 auto 12px !important;
  padding: 0 !important;
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
  position: relative;
  z-index: 1;
  width: min(440px, ${innerFieldScale}%) !important;
  max-width: min(440px, ${innerFieldScale}%) !important;
  box-shadow: 0 18px 42px rgba(86, 55, 16, 0.12), inset 0 0 26px rgba(255, 250, 234, 0.22) !important;
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
.profileLitePowerPlace .coverVariantList.coverVariantsGrid button:nth-child(n+11) {
  display: none;
}
.profileLitePowerPlace .coverVariantList.coverVariantsGrid button.active {
  display: inline-flex;
}
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
.profileLitePowerPlace .innerFieldScaleControl {
  width: 100%;
  display: grid;
  grid-template-columns: auto minmax(120px, 260px) auto;
  gap: 6px;
  align-items: center;
  margin-top: 4px;
  color: #3a2715;
  font-size: 15px;
  font-weight: 900;
}
.profileLitePowerPlace .innerFieldScaleControl input {
  width: 100%;
}
.profileLitePowerPlace .innerFieldScaleControl small {
  color: #704812;
  font-size: 12px;
}
.powerPlacePdfOnlyArea .coverOffsetOverlay,
body.printMandalaOnly .coverOffsetOverlay {
  display: none !important;
}
@media print {
  .coverOffsetOverlay,
  .innerFieldScaleControl {
    display: none !important;
  }
}
@media (max-width: 560px) {
  .profileLitePowerPlace .powerMandalaPanel[style],
  .powerPlacePdfOnlyArea .powerMandalaPanel[style] {
    padding: clamp(28px, 9vw, 44px) !important;
  }
  .profileLitePowerPlace .innerFieldScaleControl {
    grid-template-columns: minmax(0, 1fr) minmax(110px, 240px) auto;
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
  const [constructorControlsNode, setConstructorControlsNode] = useState(null);
  const objectRefs = cleanRefs(props.compositionDraft?.object_refs);
  const activeTemplateId = objectRefs[MANDALA_TEMPLATE_REF_KEY] || "";
  const innerCoverOffsetX = coverOffsetValue(objectRefs[INNER_COVER_OFFSET_X_REF_KEY]);
  const innerCoverOffsetY = coverOffsetValue(objectRefs[INNER_COVER_OFFSET_Y_REF_KEY]);
  const outerCoverOffsetX = coverOffsetValue(objectRefs[OUTER_COVER_OFFSET_X_REF_KEY]);
  const outerCoverOffsetY = coverOffsetValue(objectRefs[OUTER_COVER_OFFSET_Y_REF_KEY]);
  const innerFieldScale = innerFieldScaleValue(objectRefs[INNER_FIELD_SCALE_REF_KEY]);
  const activeTemplate = placePowerMandalaTemplates.find((template) => template.id === activeTemplateId) || null;
  const isClientMandala = (props.compositionDraft?.constructor_type || "") === "client";
  const fitStyleText = useMemo(
    () => profileLiteFitFixStyles(innerCoverOffsetX, innerCoverOffsetY, outerCoverOffsetX, outerCoverOffsetY, innerFieldScale),
    [innerCoverOffsetX, innerCoverOffsetY, outerCoverOffsetX, outerCoverOffsetY, innerFieldScale]
  );

  useEffect(() => {
    if (typeof document === "undefined") return undefined;
    const refreshNodes = () => {
      setPowerPanelNode(document.querySelector(".profileLitePowerPlace .powerMandalaPanel") || null);
      setConstructorControlsNode(document.querySelector(".profileLitePowerPlace .constructorControls") || null);
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

  const setInnerFieldScaleValue = useCallback((nextValue) => {
    writeObjectRefs({ ...objectRefs, [INNER_FIELD_SCALE_REF_KEY]: String(innerFieldScaleValue(nextValue)) });
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
      cover_ref: normalizeLayeredCoverRef(baseDraft?.cover_ref)
    };
  }, [activeTemplate, isClientMandala, props.compositionDraft]);

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

  const innerFieldScaleControl = (
    <div className="innerFieldScaleControl" aria-label="Размер центра">
      <span>Размер центра</span>
      <input
        type="range"
        min="48"
        max="92"
        step="1"
        value={innerFieldScale}
        onChange={(event) => setInnerFieldScaleValue(event.target.value)}
      />
      <small>{innerFieldScale}%</small>
    </div>
  );

  const templatePanel = (
    <>
      <style data-profile-lite-fit-fixes>{fitStyleText}</style>
      {powerPanelNode ? createPortal(coverOffsetOverlay, powerPanelNode) : null}
      {constructorControlsNode ? createPortal(innerFieldScaleControl, constructorControlsNode) : null}
      {props.shellChrome}
      <div className="mandalaTemplatePilotPanel" aria-label="Макеты мандалы">
        <div>
          <p className="cabinetEyebrow">Макеты мандалы</p>
          <b>Фото-макет для формата «Мандала»</b>
          <small>Пилот: макет 1 включает 9 зон для загрузки мини-мандал.</small>
        </div>
        <div className="mandalaTemplatePilotButtons" role="group" aria-label="Выбор макета мандалы">
          <button className={!activeTemplateId ? "active" : ""} type="button" onClick={handleTemplateClear}>Без макета</button>
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
