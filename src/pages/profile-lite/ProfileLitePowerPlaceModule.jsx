import React from "react";

const CONSTRUCTOR_TYPES = [
  { value: "zodiac", label: "Зодиак" },
  { value: "star", label: "Звезда" },
  { value: "chess", label: "Шахматы" },
  { value: "client", label: "Мандала" },
  { value: "altar", label: "Алтарь" },
  { value: "business", label: "Бизнес" },
  { value: "dao", label: "ДАО" }
];

const GEOMETRIES = [2, 4, 6, 8, 12];
const ZODIAC_COUNTS = [2, 4, 6, 8, 12];
const STAR_VARIANTS = [
  { value: "closed", label: "Закрытая" },
  { value: "open", label: "Открытая" }
];
const CHESS_VARIANTS = [
  { value: "classic-14", label: "14 фоток" },
  { value: "classic-8", label: "8 фоток" },
  { value: "plus-8", label: "8 фото+" }
];

function objectRefText(value) {
  try {
    return JSON.stringify(value || {}, null, 2);
  } catch {
    return "{}";
  }
}

export default function ProfileLitePowerPlaceModule({
  compositionDraft,
  compositionMessage,
  mandalasError,
  mandalasStatus,
  onCompositionDraftChange,
  onCompositionLoad,
  onCompositionObjectRefsChange,
  onDownload,
  onPrint,
  onSave,
  onSendToServices,
  powerPlaceCompositions
}) {
  return (
    <section className="profileLiteModule profileLitePowerPlace" aria-label="Мои мандалы">
      <div className="cabinetCard">
        <div className="cabinetFormHeader">
          <div>
            <p className="cabinetEyebrow">Мои мандалы</p>
            <h2>Сохранённые места силы</h2>
          </div>
          <span className="cabinetStatus">{mandalasStatus}</span>
        </div>
        {mandalasError && <div className="cabinetNotice cabinetSecondaryDataWarning">needs verification: {mandalasError}</div>}
        {compositionMessage && <div className="cabinetSuccess compactNotice">{compositionMessage}</div>}
        <div className="profileLiteCompositionList">
          {powerPlaceCompositions.map((composition) => (
            <button key={composition.id} type="button" onClick={() => onCompositionLoad(composition)}>
              <b>{composition.title || "Место силы"}</b>
              <span>{composition.constructor_type || "client"}</span>
            </button>
          ))}
          {mandalasStatus === "success" && powerPlaceCompositions.length === 0 && <p>Сохранённые мандалы пока не найдены.</p>}
        </div>
      </div>

      <div className="cabinetCard profileLiteConstructor">
        <p className="cabinetEyebrow">Power Place constructor</p>
        <h2>Конструктор Места силы</h2>
        <label>
          Название
          <input value={compositionDraft.title} onChange={(event) => onCompositionDraftChange("title", event.target.value)} placeholder="Место силы" />
        </label>
        <div className="profileLiteSegmented">
          {CONSTRUCTOR_TYPES.map((type) => (
            <button className={compositionDraft.constructor_type === type.value ? "active" : ""} key={type.value} type="button" onClick={() => onCompositionDraftChange("constructor_type", type.value)}>
              {type.label}
            </button>
          ))}
        </div>
        {compositionDraft.constructor_type === "client" && (
          <div className="profileLiteSegmented">
            {GEOMETRIES.map((geometry) => (
              <button className={Number(compositionDraft.geometry) === geometry ? "active" : ""} key={geometry} type="button" onClick={() => onCompositionDraftChange("geometry", geometry)}>
                {geometry}
              </button>
            ))}
          </div>
        )}
        {compositionDraft.constructor_type === "zodiac" && (
          <div className="profileLiteSegmented">
            {ZODIAC_COUNTS.map((count) => (
              <button className={Number(compositionDraft.zodiac_visible_count) === count ? "active" : ""} key={count} type="button" onClick={() => onCompositionDraftChange("zodiac_visible_count", count)}>
                {count}
              </button>
            ))}
          </div>
        )}
        {compositionDraft.constructor_type === "star" && (
          <div className="profileLiteSegmented">
            {STAR_VARIANTS.map((variant) => (
              <button className={compositionDraft.star_variant === variant.value ? "active" : ""} key={variant.value} type="button" onClick={() => onCompositionDraftChange("star_variant", variant.value)}>
                {variant.label}
              </button>
            ))}
          </div>
        )}
        {compositionDraft.constructor_type === "chess" && (
          <div className="profileLiteSegmented">
            {CHESS_VARIANTS.map((variant) => (
              <button className={compositionDraft.chess_variant === variant.value ? "active" : ""} key={variant.value} type="button" onClick={() => onCompositionDraftChange("chess_variant", variant.value)}>
                {variant.label}
              </button>
            ))}
          </div>
        )}
        <div className="cabinetTwoColumns">
          <label>
            Пропорция алтаря
            <select value={compositionDraft.altar_center_ratio} onChange={(event) => onCompositionDraftChange("altar_center_ratio", event.target.value)}>
              <option value="1">1:1</option>
              <option value="1-5">1.5:1</option>
              <option value="2">2:1</option>
              <option value="3">3:1</option>
            </select>
          </label>
          <label>
            Зон в бизнес-вершине
            <select value={compositionDraft.business_vertex_zone_count} onChange={(event) => onCompositionDraftChange("business_vertex_zone_count", Number(event.target.value))}>
              <option value="1">1</option>
              <option value="3">3</option>
            </select>
          </label>
        </div>
        <label>
          Object refs JSON
          <textarea value={objectRefText(compositionDraft.object_refs)} onChange={(event) => onCompositionObjectRefsChange(event.target.value)} rows={6} />
        </label>
        <div className="profileLiteMandalaPreview">
          <span>{compositionDraft.constructor_type}</span>
          <strong>{compositionDraft.title || "Место силы"}</strong>
          <small>cover_ref / object_refs сохраняются через существующий `powerPlaceClient`.</small>
        </div>
        <div className="cabinetActions">
          <button className="cabinetPrimary" type="button" onClick={onSave}>{compositionDraft.id ? "Обновить место силы" : "Сохранить место силы"}</button>
          <button className="cabinetSecondary" type="button" onClick={onSendToServices}>В услуги</button>
          <button className="cabinetSecondary" type="button" onClick={onDownload}>Скачать JSON</button>
          <button className="cabinetGhost" type="button" onClick={onPrint}>Печать</button>
        </div>
      </div>
    </section>
  );
}
