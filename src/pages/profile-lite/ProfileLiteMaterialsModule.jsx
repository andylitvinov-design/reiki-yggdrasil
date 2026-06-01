import React from "react";
import { MATERIAL_TYPES, materialStatusText, publicationTypeLabel } from "../../lib/profileMaterialsClient.js";

export default function ProfileLiteMaterialsModule({
  activeSettings,
  materialFile,
  materialForm,
  materials,
  materialsError,
  materialsStatus,
  onFieldChange,
  onFileChange,
  onSave,
  stepOptions
}) {
  return (
    <section className="profileLiteModule profileLiteMaterialsModule" aria-label="Материалы">
      <div className="cabinetCard">
        <div className="cabinetFormHeader">
          <div>
            <p className="cabinetEyebrow">Материалы</p>
            <h2>Материалы мастера</h2>
          </div>
          <span className="cabinetStatus">{materialsStatus}</span>
        </div>
        {materialsError && <div className="cabinetNotice cabinetSecondaryDataWarning">needs verification: {materialsError}</div>}
        {materialsStatus === "loading" && <p>Загружаю материалы...</p>}
        <div className="materialsGrid profileLiteMaterials">
          {materials.map((material) => (
            <article className="materialCard" key={material.id || `${material.title}-${material.updated_at}`}>
              <div
                className={material.display_url || material.image_url ? "materialThumb hasImage" : "materialThumb"}
                style={material.display_url || material.image_url ? { backgroundImage: `url(${material.display_url || material.image_url})` } : undefined}
              >
                {!(material.display_url || material.image_url) && publicationTypeLabel(material.type).slice(0, 1)}
              </div>
              <div>
                <h3>{material.title || "Без названия"}</h3>
                <p>{material.description || "Описание не заполнено."}</p>
                <small>{publicationTypeLabel(material.type)} · {materialStatusText(material.status)}</small>
              </div>
            </article>
          ))}
          {materialsStatus === "success" && materials.length === 0 && <p>Материалы пока не найдены.</p>}
        </div>
      </div>

      <form className="cabinetCard profileLiteMaterialForm" onSubmit={(event) => { event.preventDefault(); onSave("draft"); }}>
        <p className="cabinetEyebrow">Создать материал</p>
        <h2>Мандала / артефакт / практика</h2>
        <div className="profileLiteSegmented">
          {MATERIAL_TYPES.map((type) => (
            <button className={materialForm.type === type.value ? "active" : ""} key={type.value} type="button" onClick={() => onFieldChange("type", type.value)}>
              {type.label}
            </button>
          ))}
        </div>
        <div className="cabinetTwoColumns">
          <label>
            Ступень Reiki Yggdrasil
            <select value={materialForm.step_id} onChange={(event) => onFieldChange("step_id", event.target.value)}>
              {stepOptions.map((step) => <option key={step.id} value={step.id}>{step.fullLabel}</option>)}
            </select>
          </label>
          <label>
            Настройка ступени
            <select value={materialForm.setting_title} onChange={(event) => onFieldChange("setting_title", event.target.value)}>
              {activeSettings.length === 0 && <option value="">Настройки уточняются</option>}
              {activeSettings.map((setting, index) => <option key={`${setting.title}-${index}`} value={setting.title}>{setting.title}</option>)}
            </select>
          </label>
        </div>
        <label>
          Название
          <input value={materialForm.title} onChange={(event) => onFieldChange("title", event.target.value)} placeholder="Название материала" />
        </label>
        <label>
          Описание / инструкция
          <textarea value={materialForm.description} onChange={(event) => onFieldChange("description", event.target.value)} rows={3} placeholder="Описание для ученика или клиента" />
        </label>
        <label>
          URL изображения / файла
          <input value={materialForm.image_url} onChange={(event) => onFieldChange("image_url", event.target.value)} placeholder="https://... или загрузите файл" />
        </label>
        <label className="profileLiteFileInput">
          <input type="file" accept="image/png,image/jpeg,image/webp,image/gif,audio/mpeg,audio/mp4,audio/wav,audio/webm,audio/ogg" onChange={onFileChange} />
          {materialFile ? `Выбрано: ${materialFile.name}` : "Загрузить изображение / аудио практики"}
        </label>
        <div className="cabinetActions">
          <button className="cabinetPrimary" type="submit">Сохранить черновик</button>
          <button className="cabinetSecondary" type="button" onClick={() => onSave("pending")}>На модерацию</button>
        </div>
      </form>
    </section>
  );
}
