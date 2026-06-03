import React, { useCallback, useMemo } from "react";
import { placePowerMandalaTemplates } from "../../data/placePowerMandalaTemplates.js";
import BaseProfileLitePowerPlaceModule from "./ProfileLitePowerPlaceModuleBase.jsx";
import "../../profileMandalaTemplatePilot.css";

const MANDALA_TEMPLATE_REF_KEY = "__mandala_template_id";
const INNER_COVER_OFFSET_REF_KEY = "__inner_cover_offset_x";
const OUTER_COVER_OFFSET_REF_KEY = "__outer_cover_offset_x";

function coverOffsetValue(value) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 50;
  return Math.min(80, Math.max(20, parsed));
}

function profileLiteFitFixStyles(innerOffset, outerOffset) {
  return `
.powerCenterPhoto.hasImage,
.altarCenterPhoto.hasImage,
.businessCenterPhoto.hasImage,
.zodiacCenterPhoto.hasImage,
.starCenterPhoto.hasImage,
.daoCenterPhoto.hasImage,
.power-place-chess__center.hasImage {
  background-size: contain !important;
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
  background-size: auto 100% !important;
  background-repeat: no-repeat !important;
  background-position: ${innerOffset}% center !important;
}
.powerMandalaPanel[style] {
  background-size: auto 100% !important;
  background-repeat: no-repeat !important;
  background-position: ${outerOffset}% center !important;
  background-color: #fffaf0;
}
.coverOffsetPanel {
  display: grid;
  gap: 8px;
  border: 1px solid rgba(184, 121, 29, 0.2);
  border-radius: 20px;
  padding: 10px;
  background: rgba(255, 250, 238, 0.76);
}
.coverOffsetPanel p {
  margin: 0;
  color: #704812;
  font-size: 12px;
  font-weight: 900;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}
.coverOffsetRow {
  display: grid;
  grid-template-columns: 44px minmax(0, 1fr) 44px;
  gap: 8px;
  align-items: center;
}
.coverOffsetRow span {
  color: #5d3c12;
  font-size: 12px;
  font-weight: 900;
  text-align: center;
}
.coverOffsetRow button {
  min-width: 44px;
  height: 34px;
  border: 1px solid rgba(184, 121, 29, 0.34);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.78);
  color: #704812;
  font-size: 12px;
  font-weight: 900;
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
  const objectRefs = cleanRefs(props.compositionDraft?.object_refs);
  const activeTemplateId = objectRefs[MANDALA_TEMPLATE_REF_KEY] || "";
  const innerCoverOffsetX = coverOffsetValue(objectRefs[INNER_COVER_OFFSET_REF_KEY]);
  const outerCoverOffsetX = coverOffsetValue(objectRefs[OUTER_COVER_OFFSET_REF_KEY]);
  const activeTemplate = placePowerMandalaTemplates.find((template) => template.id === activeTemplateId) || null;
  const isClientMandala = (props.compositionDraft?.constructor_type || "") === "client";
  const fitStyleText = useMemo(() => profileLiteFitFixStyles(innerCoverOffsetX, outerCoverOffsetX), [innerCoverOffsetX, outerCoverOffsetX]);

  const writeObjectRefs = useCallback((nextRefs) => {
    props.onCompositionObjectRefsChange?.(JSON.stringify(nextRefs, null, 2));
  }, [props]);

  const shiftCoverOffset = useCallback((layer, delta) => {
    const key = layer === "outer" ? OUTER_COVER_OFFSET_REF_KEY : INNER_COVER_OFFSET_REF_KEY;
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

  const templatePanel = (
    <>
      <style data-profile-lite-fit-fixes>{fitStyleText}</style>
      {props.shellChrome}
      <div className="coverOffsetPanel" aria-label="Смещение фоновых фото">
        <p>Смещение фона</p>
        <div className="coverOffsetRow" aria-label="Верхняя группа — фон внутри">
          <button type="button" onClick={() => shiftCoverOffset("inner", -5)} aria-label="Сдвинуть внутренний фон влево">L</button>
          <span>Фон внутри · {innerCoverOffsetX}%</span>
          <button type="button" onClick={() => shiftCoverOffset("inner", 5)} aria-label="Сдвинуть внутренний фон вправо">R</button>
        </div>
        <div className="coverOffsetRow" aria-label="Нижняя группа — фон снаружи">
          <button type="button" onClick={() => shiftCoverOffset("outer", -5)} aria-label="Сдвинуть внешний фон влево">L</button>
          <span>Фон снаружи · {outerCoverOffsetX}%</span>
          <button type="button" onClick={() => shiftCoverOffset("outer", 5)} aria-label="Сдвинуть внешний фон вправо">R</button>
        </div>
      </div>
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
