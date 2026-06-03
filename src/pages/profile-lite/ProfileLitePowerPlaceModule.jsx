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

function coverOffsetValue(value) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 50;
  return Math.min(80, Math.max(20, parsed));
}

function hasImageCover(cover) {
  return Boolean(cover?.type === "image" && (cover.src || cover.display_src || cover.displaySrc));
}

function profileLiteFitFixStyles(innerOffsetX, innerOffsetY, outerOffsetX, outerOffsetY) {
  return `
.powerCenterPhoto.hasImage,
.altarCenterPhoto.hasImage,
.businessCenterPhoto.hasImage,
.zodiacCenterPhoto.hasImage,
.starCenterPhoto.hasImage,
.daoCenterPhoto.hasImage {
  background-size: contain !important;
  background-repeat: no-repeat !important;
  background-position: center !important;
}
.power-place-chess__center.hasImage,
.power-place-chess__slot.hasImage,
.powerSource.hasImage,
.altarTopSource.hasImage,
.altarSupportSource.hasImage,
.businessVertexZone.hasImage,
.zodiacPositionImage[style],
.zodiacFieldPlusPositionImage[style],
.starPositionImage[style],
.daoElementImage.hasImage {
  background-size: auto 100% !important;
  background-repeat: no-repeat !important;
  background-position: center !important;
  background-color: transparent !important;
}
.power-place-chess__slot.hasImage::after,
.powerSource.hasImage::after,
.altarTopSource.hasImage::after,
.altarSupportSource.hasImage::after,
.businessVertexZone.hasImage::after,
.daoElementImage.hasImage::after {
  display: none !important;
  content: none !important;
  box-shadow: none !important;
  background: transparent !important;
}
.powerMandala[style],
.altarMandalaSheet[style],
.businessMandalaSheet[style],
.zodiacMandalaSheet[style],
.starMandalaSheet[style],
.daoMandalaSheet[style],
.power-place-chess[style] {
  background-size: cover !important;
  background-repeat: no-repeat !important;
  background-position: ${innerOffsetX}% ${innerOffsetY}% !important;
}
.powerMandalaPanel[style] {
  position: relative;
  background-size: cover !important;
  background-repeat: no-repeat !important;
  background-position: ${outerOffsetX}% ${outerOffsetY}% !important;
  background-color: #fffaf0;
}
.coverOffsetOverlay {
  position: absolute;
  inset: 0;
  z-index: 45;
  pointer-events: none;
}
.coverOffsetCornerGroup {
  position: absolute;
  display: grid;
  grid-template-columns: repeat(2, 22px);
  gap: 4px;
  pointer-events: none;
}
.coverOffsetCornerGroup.inner {
  top: 9px;
  left: 9px;
}
.coverOffsetCornerGroup.outer {
  right: 9px;
  bottom: 9px;
}
.coverOffsetCornerGroup button,
.explicitCoverUploadGrid label {
  border: 1px solid rgba(184, 121, 29, 0.32);
  border-radius: 999px;
  padding: 0;
  background: rgba(255, 250, 238, 0.82);
  color: #704812;
  font-weight: 900;
  line-height: 1;
  box-shadow: 0 8px 18px rgba(80, 52, 14, 0.12);
}
.coverOffsetCornerGroup button {
  width: 22px;
  min-width: 22px;
  height: 22px;
  font-size: 11px;
  pointer-events: auto;
}
.coverOffsetCornerGroup button:active,
.explicitCoverUploadGrid label:active {
  transform: scale(0.96);
}
.profileLitePowerPlace .coverUploadButton {
  display: none !important;
}
.explicitCoverUploadGrid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
  margin-top: 8px;
}
.explicitCoverUploadGrid label {
  min-height: 36px;
  display: grid;
  place-items: center;
  padding: 8px 10px;
  font-size: 12px;
  cursor: pointer;
}
.explicitCoverUploadGrid input {
  position: absolute;
  width: 1px;
  height: 1px;
  opacity: 0;
  pointer-events: none;
}
`;
}

function cleanRefs(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

function templateCover(template, currentCover) {
  const current = currentCover && typeof currentCover === "object" && !Array.isArray(currentCover) ? currentCover : {};
  const outer = current.outer || { id: "no-cover", label: "Без фона", type: "none", tone: "none", src: "", display_src: "" };
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

function coverRefWithOuterFallback(coverRef) {
  const cover = cleanRefs(coverRef);
  const inner = cleanRefs(cover.inner || cover);
  const outer = cleanRefs(cover.outer);
  if (hasImageCover(outer) || !hasImageCover(inner)) return coverRef;
  return {
    ...cover,
    outer: {
      ...inner,
      id: "custom-outer-cover-fallback",
      label: inner.label || "Фон снаружи",
      type: "image"
    }
  };
}

export default function ProfileLitePowerPlaceModule(props) {
  const [powerPanelNode, setPowerPanelNode] = useState(null);
  const [coverPanelNode, setCoverPanelNode] = useState(null);
  const objectRefs = cleanRefs(props.compositionDraft?.object_refs);
  const activeTemplateId = objectRefs[MANDALA_TEMPLATE_REF_KEY] || "";
  const innerCoverOffsetX = coverOffsetValue(objectRefs[INNER_COVER_OFFSET_X_REF_KEY]);
  const innerCoverOffsetY = coverOffsetValue(objectRefs[INNER_COVER_OFFSET_Y_REF_KEY]);
  const outerCoverOffsetX = coverOffsetValue(objectRefs[OUTER_COVER_OFFSET_X_REF_KEY]);
  const outerCoverOffsetY = coverOffsetValue(objectRefs[OUTER_COVER_OFFSET_Y_REF_KEY]);
  const activeTemplate = placePowerMandalaTemplates.find((template) => template.id === activeTemplateId) || null;
  const isClientMandala = (props.compositionDraft?.constructor_type || "") === "client";
  const fitStyleText = useMemo(
    () => profileLiteFitFixStyles(innerCoverOffsetX, innerCoverOffsetY, outerCoverOffsetX, outerCoverOffsetY),
    [innerCoverOffsetX, innerCoverOffsetY, outerCoverOffsetX, outerCoverOffsetY]
  );

  useEffect(() => {
    if (typeof document === "undefined") return undefined;
    const refreshNodes = () => {
      setPowerPanelNode(document.querySelector(".profileLitePowerPlace .powerMandalaPanel") || null);
      setCoverPanelNode(document.querySelector(".profileLitePowerPlace .coverPickerPanel") || null);
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

  const handleExplicitCoverUpload = useCallback((layer, event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (file) props.onCoverFileUpload?.(layer, file);
  }, [props]);

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
      cover_ref: coverRefWithOuterFallback(baseDraft?.cover_ref)
    };
  }, [activeTemplate, isClientMandala, props.compositionDraft]);

  const coverOffsetOverlay = (
    <div className="coverOffsetOverlay" aria-label="Смещение фоновых фото">
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

  const explicitCoverUploadControls = (
    <div className="explicitCoverUploadGrid" aria-label="Загрузить свой фон">
      <label>
        Своё внутри
        <input type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={(event) => handleExplicitCoverUpload("inner", event)} />
      </label>
      <label>
        Своё снаружи
        <input type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={(event) => handleExplicitCoverUpload("outer", event)} />
      </label>
    </div>
  );

  const templatePanel = (
    <>
      <style data-profile-lite-fit-fixes>{fitStyleText}</style>
      {powerPanelNode ? createPortal(coverOffsetOverlay, powerPanelNode) : null}
      {coverPanelNode ? createPortal(explicitCoverUploadControls, coverPanelNode) : null}
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
