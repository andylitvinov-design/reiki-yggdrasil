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
  shellChrome,
  stepOptions
}) {
  return (
    <section className="profileLiteModule profileLiteMaterialsModule mandalaWorkspace" aria-label="Материалы">
      <div className="mandalaHero">
        <div className="mandalaHeroSeal">✦</div>
        <div>
          <p className="cabinetEyebrow">Материалы</p>
          <h2>Алтарь материалов</h2>
          <p>Собирайте мандалы, артефакты и практики вокруг ступени, настройки и рабочего образа.</p>
        </div>
        <div className="mandalaHeroStats">
          <span><b>{materials.length}</b> Записи</span>
          <span><b>{MATERIAL_TYPES.length}</b> Типы</span>
          <span><b>{materialsStatus}</b> Статус</span>
        </div>
      </div>
      {shellChrome}
      <div className="workspaceMainColumns profileLiteLegacyColumns">
        <aside className="mandalaModeSidebar">
          <p className="cabinetEyebrow">Источники силы</p>
          <h3>Выбор материала</h3>
          <div className="materialFilterList" aria-label="Типы материалов">
            {MATERIAL_TYPES.map((type) => (
              <button className={materialForm.type === type.value ? "active" : ""} key={type.value} type="button" onClick={() => onFieldChange("type", type.value)}>
                <span>{type.label}</span>
                <small>{type.value}</small>
              </button>
            ))}
          </div>
          <div className="powerLibraryPrimaryActions">
            <button className="powerChooseBaseButton" type="button" onClick={() => onSave("draft")}>Добавить в список</button>
          </div>
          <div className="powerSavedImageList" aria-label="Сохранённые изображения">
            <p className="cabinetEyebrow">Сохранённые изображения</p>
            {materials.slice(0, 4).map((material) => (
              <div className="powerSavedImageCard" key={`saved-${material.id || material.title}`}>
                <div className={material.display_url || material.image_url ? "powerSavedImageThumb hasImage" : "powerSavedImageThumb"} style={material.display_url || material.image_url ? { backgroundImage: `url(${material.display_url || material.image_url})` } : undefined}>
                  {!(material.display_url || material.image_url) && <span>◎</span>}
                </div>
                <b>{material.title || "Материал"}</b>
                <small>{publicationTypeLabel(material.type)}</small>
              </div>
            ))}
            {materials.length === 0 && <p>Сохранённые изображения появятся здесь после загрузки.</p>}
          </div>
          <div className="cabinetNotice compactNotice">
            Сохраняйте мандалы, артефакты и практики к выбранной ступени и настройке.
          </div>
        </aside>

        <div className="workspaceCenterColumn">
          <section className="cabinetCard profileLiteMaterialsAltar" aria-label="Алтарь материалов">
            <p className="cabinetEyebrow">Алтарь материалов</p>
            <h2>Основная рабочая зона</h2>
            <p>Соберите материал вокруг выбранной ступени, настройки и образа. Список ниже повторяет старую рабочую логику кабинета.</p>
          </section>
          <div className="mandalaGallery">
            <div className="cabinetFormHeader">
              <div>
                <p className="cabinetEyebrow">Мои мандалы и материалы</p>
                <h2>Галерея мастера</h2>
              </div>
              <span className="cabinetStatus">{materialsStatus === "loading" ? "..." : materials.length}</span>
            </div>
            {materialsError && <div className="cabinetNotice cabinetSecondaryDataWarning">needs verification: {materialsError}</div>}
            {materialsStatus === "loading" && <p>Загружаю материалы...</p>}
            {materialsStatus === "success" && materials.length === 0 && (
              <div className="mandalaEmptyState">
                <div className="mandalaEmptySeal">✦</div>
                <b>Добавьте первую мандалу к выбранной настройке</b>
                <p>Она появится здесь как карточка вашей мастерской.</p>
              </div>
            )}
            {materials.length > 0 && (
              <div className="mandalaCardsGrid profileLiteMaterials">
                {materials.map((material) => (
                  <article className="mandalaMaterialCard" key={material.id || `${material.title}-${material.updated_at}`}>
                    {material.display_url || material.image_url ? (
                      <div className="mandalaCardImage" style={{ backgroundImage: `url(${material.display_url || material.image_url})` }} />
                    ) : (
                      <div className="mandalaCardImage placeholder">◎</div>
                    )}
                    <div className="mandalaCardBody">
                      <div className="mandalaCardChips">
                        <span>{publicationTypeLabel(material.type)}</span>
                        <span className={`statusChip status-${material.status || "draft"}`}>{materialStatusText(material.status)}</span>
                      </div>
                      <h3>{material.title || "Без названия"}</h3>
                      <p>{material.description || "Описание не заполнено."}</p>
                      <small>{[material.step_id, material.step_title, material.setting_title].filter(Boolean).join(" · ")}</small>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="workspaceRightColumn">
          <form className="cabinetCard profileLiteMaterialForm" onSubmit={(event) => { event.preventDefault(); onSave("draft"); }}>
            <p className="cabinetEyebrow">Создание материала</p>
            <h2>Мандала / артефакт / практика</h2>
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
            <div className="materialTitleDescriptionGrid">
              <label>
                Название
                <input value={materialForm.title} onChange={(event) => onFieldChange("title", event.target.value)} placeholder="Например: Мандала денежной активации" />
              </label>
              <label>
                Описание / инструкция
                <textarea value={materialForm.description} onChange={(event) => onFieldChange("description", event.target.value)} rows={2} placeholder="(по желанию)" />
              </label>
            </div>
            <label>
              URL изображения / мандалы
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
        </div>
      </div>
    </section>
  );
}
