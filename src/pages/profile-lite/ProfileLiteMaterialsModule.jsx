import React, { useState } from "react";
import { GRIMOIRE_CATEGORIES, materialStatusText, publicationTypeLabel } from "../../lib/profileMaterialsClient.js";

function GrimoireRecordCard({ material, onEdit, onDelete }) {
  return (
    <article className="grimoireRecordCard" key={material.id || material.title}>
      <div className={material.display_url || material.image_url ? "grimoireCardPreview hasImage" : "grimoireCardPreview"} style={material.display_url || material.image_url ? { backgroundImage: `url(${material.display_url || material.image_url})` } : undefined}>
        {!(material.display_url || material.image_url) && <span className="grimoireCardIcon">◎</span>}
      </div>
      <div className="grimoireCardBody">
        <div className="grimoireCardChips">
          <span className="grimoireChipType">{publicationTypeLabel(material.type)}</span>
          <span className={`statusChip status-${material.status || "draft"}`}>{materialStatusText(material.status)}</span>
        </div>
        <h3 className="grimoireCardTitle">{material.title || "Без названия"}</h3>
        {material.description && <p className="grimoireCardDesc">{material.description}</p>}
        {(material.step_id || material.step_title || material.setting_title) && (
          <small className="grimoireCardMeta">{[material.step_id, material.step_title, material.setting_title].filter(Boolean).join(" · ")}</small>
        )}
      </div>
      <div className="grimoireCardActions">
        <button className="grimoireActionBtn" type="button" onClick={() => onEdit(material)}>Редактировать</button>
        <button className="grimoireActionBtn grimoireActionBtnDelete" type="button" onClick={() => onDelete(material)}>Удалить</button>
      </div>
    </article>
  );
}

function GrimoireEditModal({ material, onClose, onSave }) {
  const [form, setForm] = useState({
    title: material.title || "",
    description: material.description || "",
    type: material.type || "mandala"
  });

  return (
    <div className="grimoireEditBackdrop" role="dialog" aria-modal="true" aria-label="Редактировать запись гримуара">
      <div className="grimoireEditModal">
        <h3>Редактировать запись</h3>
        <label>
          Название
          <input value={form.title} onChange={(e) => setForm((s) => ({ ...s, title: e.target.value }))} />
        </label>
        <label>
          Описание / комментарий
          <textarea rows={3} value={form.description} onChange={(e) => setForm((s) => ({ ...s, description: e.target.value }))} />
        </label>
        <label>
          Категория
          <select value={form.type} onChange={(e) => setForm((s) => ({ ...s, type: e.target.value }))}>
            {GRIMOIRE_CATEGORIES.filter((c) => c.value !== "all" && c.value !== "uncategorized").map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </label>
        <div className="cabinetActions">
          <button className="cabinetPrimary" type="button" onClick={() => onSave(material.id, form)}>Сохранить</button>
          <button className="cabinetSecondary" type="button" onClick={onClose}>Отмена</button>
        </div>
      </div>
    </div>
  );
}

export default function ProfileLiteMaterialsModule({
  materialFile,
  materials,
  materialsError,
  materialsStatus,
  onDelete,
  onMultiUpload,
  onUpdate,
  shellChrome
}) {
  const [activeFilter, setActiveFilter] = useState("all");
  const [editingMaterial, setEditingMaterial] = useState(null);
  const [uploadStatus, setUploadStatus] = useState("");

  const filteredMaterials = materials.filter((m) => {
    if (activeFilter === "all") return true;
    if (activeFilter === "uncategorized") return !m.type || m.type === "mandala";
    return m.type === activeFilter;
  });

  const handleFileInputChange = async (event) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;
    event.target.value = "";
    setUploadStatus(`Загружаю ${files.length} файл(ов)...`);
    try {
      await onMultiUpload(files);
      setUploadStatus("Загружено.");
    } catch (error) {
      setUploadStatus("Ошибка загрузки: " + String(error?.message || error));
    }
  };

  const handleDelete = async (material) => {
    const confirmed = window.confirm(`Удалить запись «${material.title || "Без названия"}» из гримуара?`);
    if (!confirmed) return;
    try {
      await onDelete(material);
    } catch (error) {
      alert("Не удалось удалить: " + String(error?.message || error));
    }
  };

  const handleEditSave = async (id, patch) => {
    try {
      await onUpdate(id, patch);
      setEditingMaterial(null);
    } catch (error) {
      alert("Не удалось сохранить: " + String(error?.message || error));
    }
  };

  return (
    <section className="profileLiteModule profileLiteMaterialsModule profileLiteGrimoireModule mandalaWorkspace" aria-label="Гримуар">
      <div className="mandalaHero">
        <div className="mandalaHeroSeal">✦</div>
        <div>
          <p className="cabinetEyebrow">Гримуар</p>
          <h2>Гримуар мастера</h2>
          <p>Личная библиотека материалов: загружайте файлы, добавляйте описания, назначайте категории.</p>
        </div>
        <div className="mandalaHeroStats">
          <span><b>{materials.length}</b> Записи</span>
          <span><b>{filteredMaterials.length}</b> Показаны</span>
          <span><b>{materialsStatus}</b> Статус</span>
        </div>
      </div>
      {shellChrome}
      <div className="workspaceMainColumns profileLiteLegacyColumns">
        <aside className="mandalaModeSidebar grimoireFilterSidebar">
          <p className="cabinetEyebrow">Фильтр гримуара</p>
          <h3>Категория</h3>
          <div className="grimoireFilterList" aria-label="Фильтры гримуара">
            {GRIMOIRE_CATEGORIES.map((cat) => (
              <button
                className={`grimoireFilterBtn${activeFilter === cat.value ? " active" : ""}`}
                key={cat.value}
                type="button"
                onClick={() => setActiveFilter(cat.value)}
              >
                {cat.label}
                {cat.value !== "all" && (
                  <span className="grimoireFilterCount">
                    {cat.value === "uncategorized"
                      ? materials.filter((m) => !m.type || m.type === "mandala").length
                      : materials.filter((m) => m.type === cat.value).length}
                  </span>
                )}
              </button>
            ))}
          </div>
        </aside>

        <div className="workspaceCenterColumn">
          <div className="grimoireCenterHeader">
            <p className="cabinetEyebrow">Записи гримуара</p>
            <span className="cabinetStatus">{materialsStatus === "loading" ? "..." : filteredMaterials.length}</span>
          </div>
          {materialsError && <div className="cabinetNotice cabinetSecondaryDataWarning">needs verification: {materialsError}</div>}
          {materialsStatus === "loading" && <p>Загружаю гримуар...</p>}
          {materialsStatus !== "loading" && filteredMaterials.length === 0 && (
            <div className="mandalaEmptyState">
              <div className="mandalaEmptySeal">✦</div>
              <b>Записей не найдено</b>
              <p>Загрузите файлы через панель справа — они появятся здесь.</p>
            </div>
          )}
          {filteredMaterials.length > 0 && (
            <div className="grimoireRecordsList">
              {filteredMaterials.map((material) => (
                <GrimoireRecordCard
                  key={material.id || `${material.title}-${material.updated_at}`}
                  material={material}
                  onEdit={setEditingMaterial}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}
        </div>

        <div className="workspaceRightColumn grimoireUploaderColumn">
          <div className="cabinetCard grimoireUploaderCard">
            <p className="cabinetEyebrow">Загрузить в гримуар</p>
            <h3>Добавить записи</h3>
            <p className="grimoireUploaderHint">Загрузите один или несколько файлов. Категория и описание — необязательны при загрузке, их можно добавить после.</p>
            <label className="grimoireFileInputLabel">
              <input
                type="file"
                multiple
                accept="image/jpeg,image/png,image/webp,image/gif,audio/mpeg,audio/mp4,audio/wav,audio/webm,audio/ogg,audio/aac,application/pdf,text/plain,text/markdown,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                onChange={handleFileInputChange}
                className="grimoireFileInput"
              />
              <span className="grimoireFileInputText">
                {materialFile ? `Выбрано: ${materialFile.name}` : "Выбрать файлы"}
              </span>
            </label>
            {uploadStatus && <p className="grimoireUploadStatus">{uploadStatus}</p>}
            <p className="grimoireUploaderFormats">Поддерживаются: изображения, аудио, PDF, TXT, MD, DOC, DOCX · до 5 MB каждый</p>
          </div>
        </div>
      </div>

      {editingMaterial && (
        <GrimoireEditModal
          material={editingMaterial}
          onClose={() => setEditingMaterial(null)}
          onSave={handleEditSave}
        />
      )}
    </section>
  );
}
