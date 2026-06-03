import React, { useCallback, useMemo } from "react";
import { placePowerMandalaTemplates } from "../../data/placePowerMandalaTemplates.js";
import BaseProfileLitePowerPlaceModule from "./ProfileLitePowerPlaceModuleBase.jsx";
import "../../profileMandalaTemplatePilot.css";

const MANDALA_TEMPLATE_REF_KEY = "__mandala_template_id";
const PROFILE_LITE_FIT_FIX_STYLES = `
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
.power-place-chess[style],
.powerMandalaPanel[style] {
  background-size: contain !important;
  background-repeat: no-repeat !important;
  background-position: center !important;
}
.powerMandalaPanel[style] {
  background-color: #fffaf0;
}
`;

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
  const activeTemplate = placePowerMandalaTemplates.find((template) => template.id === activeTemplateId) || null;
  const isClientMandala = (props.compositionDraft?.constructor_type || "") === "client";

  const writeTemplateId = useCallback((templateId) => {
    const nextRefs = { ...objectRefs };
    if (templateId) {
      nextRefs[MANDALA_TEMPLATE_REF_KEY] = templateId;
    } else {
      delete nextRefs[MANDALA_TEMPLATE_REF_KEY];
    }
    props.onCompositionObjectRefsChange?.(JSON.stringify(nextRefs, null, 2));
  }, [objectRefs, props]);

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
      <style data-profile-lite-fit-fixes>{PROFILE_LITE_FIT_FIX_STYLES}</style>
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
