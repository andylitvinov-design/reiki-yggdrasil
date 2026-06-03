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
.power-place-chess__center.hasImage {
  background-size: auto 100% !important;
  background-repeat: no-repeat !important;
  background-position: center !important;
}
.powerMandala[style],
.altarMandalaSheet[style],
.businessMandalaSheet[style],
.zodiacMandalaSheet[style],
.starMandalaSheet[style],
.daoMandalaSheet[style],
.power-place-chess[style] {
  background-size: 100% auto !important;
  background-repeat: no-repeat !important;
  background-position: ${innerOffsetX}% ${innerOffsetY}% !important;
}
.powerMandalaPanel[style] {
  position: relative;
  background-size: 100% auto !important;
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
.coverOffsetSideGroup {
  position: absolute;
  left: 6px;
  right: 6px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  pointer-events: none;
}
.coverOffsetSideGroup.inner {
  top: 0;
  height: 50%;
}
.coverOffsetSideGroup.outer {
  top: 50%;
  bottom: 0;
}
.coverOffsetVerticalGroup {
  position: absolute;
  left: 50%;
  display: flex;
  gap: 8px;
  transform: translateX(-50%);
  pointer-events: none;
}
.coverOffsetVerticalGroup.inner {
  top: 7px;
}
.coverOffsetVerticalGroup.outer {
  bottom: 7px;
}
.coverOffsetSideGroup button,
.coverOffsetVerticalGroup button {
  border: 1px solid rgba(184, 121, 29, 0.32);
  border-radius: 999px;
  padding: 0;
  background: rgba(255, 250, 238, 0.78);
  color: #704812;
  font-weight: 900;
  line-height: 1;
  box-shadow: 0 10px 24px rgba(80, 52, 14, 0.12);
  pointer-events: auto;
}
.coverOffsetSideGroup button {
  width: 20px;
  min-width: 20px;
  height: min(124px, 64%);
  font-size: 11px;
}
.coverOffsetVerticalGroup button {
  width: 34px;
  min-width: 34px;
  height: 22px;
  font-size: 10px;
}
.coverOffsetSideGroup button:active,
.coverOffsetVerticalGroup button:active {
  transform: scale(0.96);
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

export default function ProfileLitePowerPlaceModule(props) {
  const [powerPanelNode, setPowerPanelNode] = useState(null);
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
    const refreshPanelNode = () => {
      setPowerPanelNode(document.querySelector(".profileLitePowerPlace .powerMandalaPanel") || null);
    };
    refreshPanelNode();
    const timeoutId = window.setTimeout(refreshPanelNode, 0);
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
    if (!activeTemplate || !isClientMandala) return props.compositionDraft;
    return {
      ...props.compositionDraft,
      geometry: 9,
      cover_ref: templateCover(activeTemplate, props.compositionDraft?.cover_ref)
    };
  }, [activeTemplate, isClientMandala, props.compositionDraft]);

  const coverOffsetOverlay = (
    <div className="coverOffsetOverlay" aria-label="Смещение фоновых фото">
      <div className="coverOffsetSideGroup inner" aria-label="Смещение внутреннего фона по горизонтали">
        <button type="button" onClick={() => shiftCoverOffset("inner", "x", -5)} aria-label="Сдвинуть внутренний фон влево">L</button>
        <button type="button" onClick={() => shiftCoverOffset("inner", "x", 5)} aria-label="Сдвинуть внутренний фон вправо">R</button>
      </div>
      <div className="coverOffsetVerticalGroup inner" aria-label="Смещение внутреннего фона по вертикали">
        <button type="button" onClick={() => shiftCoverOffset("inner", "y", -5)} aria-label="Сдвинуть внутренний фон вверх">U</button>
        <button type="button" onClick={() => shiftCoverOffset("inner", "y", 5)} aria-label="Сдвинуть внутренний фон вниз">D</button>
      </div>
      <div className="coverOffsetSideGroup outer" aria-label="Смещение внешнего фона по горизонтали">
        <button type="button" onClick={() => shiftCoverOffset("outer", "x", -5)} aria-label="Сдвинуть внешний фон влево">L</button>
        <button type="button" onClick={() => shiftCoverOffset("outer", "x", 5)} aria-label="Сдвинуть внешний фон вправо">R</button>
      </div>
      <div className="coverOffsetVerticalGroup outer" aria-label="Смещение внешнего фона по вертикали">
        <button type="button" onClick={() => shiftCoverOffset("outer", "y", -5)} aria-label="Сдвинуть внешний фон вверх">U</button>
        <button type="button" onClick={() => shiftCoverOffset("outer", "y", 5)} aria-label="Сдвинуть внешний фон вниз">D</button>
      </div>
    </div>
  );

  const templatePanel = (
    <>
      <style data-profile-lite-fit-fixes>{fitStyleText}</style>
      {powerPanelNode ? createPortal(coverOffsetOverlay, powerPanelNode) : null}
      {props.shellChrome}
      <div className="mandalaTemplatePilotPanel" aria-label="Макеты мандалы">
        <div>
          <p className="cabinetEyebrow">Макеты мандалы</p>
          <b>Фото-макет для формата «Мандала»</b>
          <small>Пилот: макет 1 включает 9 зон для загрузки мини-мандал.</small>
        </div>
        <div className="mandalaTemplatePilotButtons" role="group" aria-label="Выбор макета мандалы">
          <button
            className={!activeTemplateId ? "active" : ""}
            type="button"
            onClick={handleTemplateClear}
          >
            Без макета
          </button>
          {placePowerMandalaTemplates.map((template) => (
            <button
              className={activeTemplateId === template.id ? "active" : ""}
              key={template.id}
              type="button"
              onClick={() => handleTemplateSelect(template.id)}
              title={template.title}
            >
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
