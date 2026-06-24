import React, { useMemo, useState } from "react";
import {
  createOwnMaterial,
  detectMaterialTypeFromFile,
  GRIMOIRE_CATEGORIES,
  MATERIAL_TYPES,
  materialStatusText,
  publicationTypeLabel,
  stripFileExtension
} from "../../lib/profileMaterialsClient.js";
import { feedActivityTypeForMaterial } from "../../lib/profileActivityFeedClient.js";
import { getCurrentUser, getOwnProfile, getStoredSession } from "../../lib/supabaseClient.js";
import { uploadProfileMedia, validateGrimoireFile } from "../../lib/profileMediaClient.js";
import ProfileLiteGrimoireComposer from "./ProfileLiteGrimoireComposer.jsx";
import "./ProfileLiteGrimoireWorkspace.css";

function safeText(value) {
  return String(value || "").trim();
}

function safePreviewUrl(material) {
  const url = safeText(material?.display_url || material?.displayUrl || "");
  if (/^https?:\/\//i.test(url) && !url.includes("/storage/v1/object/sign/")) return url;
  return "";
}

function materialDate(material) {
  const value = material?.updated_at || material?.updatedAt || material?.created_at || material?.createdAt || "";
  if (!value) return "черновик";
  try {
    return new Intl.DateTimeFormat("ru-RU", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(value));
  } catch {
    return "черновик";
  }
}

function localMaterialPayload({ profileId, title, description, type, imageUrl }) {
  return {
    profile_id: profileId,
    type: type || "ri",
    title: title || "Запись гримуара",
    description: description || "",
    image_url: imageUrl || "",
    step_id: "",
    step_title: "",
    setting_title: "",
    setting_index: null,
    status: "draft",
    updated_at: new Date().toISOString()
  };
}

function mergeMaterials(localMaterials, sourceMaterials) {
  const seen = new Set();
  return [...localMaterials, ...(sourceMaterials || [])].filter((item) => {
    const key = item?.id || `${item?.title || ""}-${item?.updated_at || item?.updatedAt || ""}`;
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function GrimoireRecordCard({ material, onAddToFeed, onEdit, onDelete }) {
  const isUncategorized = !material.type || material.type === "uncategorized";
  const noteText = material.description || "Комментарий ещё не добавлен";
  const canAddToFeed = Boolean(material.id && feedActivityTypeForMaterial(material));
  const previewUrl = safePreviewUrl(material);

  return (
    <article className={`grimoireRecordCard grimoirePostCard${isUncategorized ? " grimoireRecordCard--uncategorized grimoirePostCard--uncategorized" : ""}`} key={material.id || material.title}>
      <header className="grimoirePostHeader">
        <div className="grimoirePostAvatar" aria-hidden="true">✦</div>
        <div className="grimoirePostIdentity">
          <b>Мастерская</b>
          <small>{publicationTypeLabel(material.type)} · {materialStatusText(material.status)} · {materialDate(material)}</small>
        </div>
        {isUncategorized && <span className="grimoirePostBadge">Неразобранное</span>}
      </header>

      <div className="grimoirePostBody">
        <h3>{material.title || "Без названия"}</h3>
        <p className={material.description ? "" : "grimoirePostEmptyText"}>{noteText}</p>
        <div className={previewUrl ? "grimoirePostPreview hasImage" : "grimoirePostPreview"} style={previewUrl ? { backgroundImage: `url(${previewUrl})` } : undefined}>
          {!previewUrl && <span className="grimoireCardIcon">◎</span>}
        </div>
        {(material.step_id || material.step_title || material.setting_title) && (
          <small className="grimoirePostMeta">{[material.step_id, material.step_title, material.setting_title].filter(Boolean).join(" · ")}</small>
        )}
      </div>

      <footer className="grimoirePostActions">
        {canAddToFeed && <button className="grimoireActionBtn" type="button" onClick={() => onAddToFeed(material)}>Добавить в ленту</button>}
        <button className="grimoireActionBtn" type="button" onClick={() => onEdit(material)}>Редактировать</button>
        <button className="grimoireActionBtn grimoireActionBtnDelete" type="button" onClick={() => onDelete(material)}>Удалить</button>
      </footer>
    </article>
  );
}

function GrimoireEditModal({ material, onClose, onSave, onDelete }) {
  const [form, setForm] = useState({
    title: material.title || "",
    description: material.description || "",
    type: MATERIAL_TYPES.some((item) => item.value === material.type) ? material.type : "ri",
    step_title: material.step_title || "",
    setting_title: material.setting_title || ""
  });

  return (
    <div className="grimoireEditBackdrop" role="dialog" aria-modal="true" aria-label="Редактировать запись гримуара">
      <div className="grimoireEditModal">
        <h3>Редактировать запись гримуара</h3>
        <label>
          Название
          <input value={form.title} onChange={(e) => setForm((s) => ({ ...s, title: e.target.value }))} />
        </label>
        <label>
          Комментарий
          <textarea rows={3} value={form.description} onChange={(e) => setForm((s) => ({ ...s, description: e.target.value }))} />
        </label>
        <label>
          Категория
          <select value={form.type} onChange={(e) => setForm((s) => ({ ...s, type: e.target.value }))}>
            {MATERIAL_TYPES.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </label>
        <label>
          Ступень
          <input value={form.step_title} onChange={(e) => setForm((s) => ({ ...s, step_title: e.target.value }))} />
        </label>
        <label>
          Настройка
          <input value={form.setting_title} onChange={(e) => setForm((s) => ({ ...s, setting_title: e.target.value }))} />
        </label>
        <div className="cabinetActions grimoireEditActions">
          <button className="cabinetPrimary" type="button" onClick={() => onSave(material.id, form)}>Сохранить</button>
          <button className="cabinetSecondary" type="button" onClick={onClose}>Отмена</button>
          <button className="grimoireActionBtn grimoireActionBtnDelete" type="button" onClick={() => onDelete(material).then(onClose)}>Удалить</button>
        </div>
      </div>
    </div>
  );
}

export default function ProfileLiteMaterialsModule({
  materialFile,
  materials,
  materialsError,
  materialsFeedMessage,
  materialsStatus,
  onAddToFeed = () => {},
  onDelete,
  onMultiUpload,
  onUpdate,
  shellChrome
}) {
  const [activeFilter, setActiveFilter] = useState("all");
  const [editingMaterial, setEditingMaterial] = useState(null);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploadStatus, setUploadStatus] = useState("");
  const [composerStatus, setComposerStatus] = useState("");
  const [localMaterials, setLocalMaterials] = useState([]);

  const allMaterials = useMemo(() => mergeMaterials(localMaterials, materials), [localMaterials, materials]);
  const uncategorizedCount = allMaterials.filter((m) => !m.type || m.type === "uncategorized").length;
  const readyCount = Math.max(allMaterials.length - uncategorizedCount, 0);

  const filteredMaterials = allMaterials.filter((m) => {
    if (activeFilter === "all") return true;
    if (activeFilter === "uncategorized") return !m.type || m.type === "uncategorized";
    return m.type === activeFilter;
  });

  const setPendingFiles = (files) => {
    setSelectedFiles(Array.from(files || []));
    setUploadStatus("");
  };

  const handleFileInputChange = (event) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;
    setPendingFiles(files);
    event.target.value = "";
  };

  const handleFileDrop = (event) => {
    event.preventDefault();
    setPendingFiles(event.dataTransfer?.files || []);
  };

  const handleComposerCreate = async ({ title = "", description = "", type = "ri", files = [], forceUncategorized = false } = {}) => {
    const session = getStoredSession();
    const cleanTitle = safeText(title);
    const cleanDescription = safeText(description);
    const selectedFiles = Array.from(files || []).filter(Boolean);
    if (!cleanTitle && !cleanDescription && !selectedFiles.length) throw new Error("Добавьте текст, название или файл.");
    if (!session?.access_token) throw new Error("Нужно войти в кабинет.");

    setComposerStatus("loading");
    try {
      const user = await getCurrentUser(session);
      const profile = await getOwnProfile(user?.id, session);
      if (!profile?.id) throw new Error("Сначала сохраните профиль мастера.");

      const records = selectedFiles.length ? selectedFiles : [null];
      const savedRecords = [];

      for (const file of records) {
        let imageUrl = "";
        let finalType = forceUncategorized ? "uncategorized" : (type || "ri");
        let finalTitle = cleanTitle;

        if (file) {
          validateGrimoireFile(file);
          const uploaded = await uploadProfileMedia(file, { profileId: profile.id, kind: "material" }, session);
          imageUrl = uploaded.ref;
          if (!finalTitle) finalTitle = stripFileExtension(file.name) || "Запись гримуара";
          if (!forceUncategorized && !type) finalType = detectMaterialTypeFromFile(file);
        }

        if (!finalTitle) finalTitle = cleanDescription.slice(0, 64) || "Запись гримуара";

        const saved = await createOwnMaterial(localMaterialPayload({
          profileId: profile.id,
          title: finalTitle,
          description: cleanDescription,
          type: finalType,
          imageUrl
        }), session);
        if (saved) savedRecords.push(saved);
      }

      setLocalMaterials((current) => [
        ...savedRecords,
        ...current.filter((item) => !savedRecords.some((saved) => saved?.id === item.id))
      ].filter(Boolean));
      setComposerStatus("success");
      return savedRecords;
    } catch (error) {
      setComposerStatus("needs-verification");
      throw error;
    }
  };

  const handleUploadSelectedFiles = async () => {
    if (!selectedFiles.length) return;
    setUploadStatus(`Загружаю ${selectedFiles.length} файл(ов)...`);
    try {
      await onMultiUpload(selectedFiles);
      setSelectedFiles([]);
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
      setLocalMaterials((current) => current.filter((item) => item.id !== material.id));
    } catch (error) {
      alert("Не удалось удалить: " + String(error?.message || error));
    }
  };

  const handleEditSave = async (id, patch) => {
    try {
      await onUpdate(id, patch);
      setLocalMaterials((current) => current.map((item) => item.id === id ? { ...item, ...patch, updated_at: new Date().toISOString() } : item));
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
          <p>Соберите фото, статьи, практики, аудио и документы. Сначала загрузите всё без структуры, потом разложите по категориям. Быстрый composer ниже помогает добавить заметку или материал сразу в рабочую ленту.</p>
        </div>
        <div className="mandalaHeroStats">
          <span><b>{allMaterials.length}</b> Всего записей</span>
          <span><b>{uncategorizedCount}</b> Без категории</span>
          <span><b>{readyCount}</b> Готово к работе</span>
        </div>
      </div>
      {shellChrome}
      <div className="workspaceMainColumns profileLiteLegacyColumns">
        <aside className="mandalaModeSidebar grimoireFilterSidebar">
          <p className="cabinetEyebrow">Фильтр гримуара</p>
          <h3>Категория</h3>
          <div className="grimoireFilterList" aria-label="Фильтры гримуара">
            {GRIMOIRE_CATEGORIES.map((cat) => {
              const isPriority = cat.value === "uncategorized";
              const count = cat.value === "uncategorized"
                ? allMaterials.filter((m) => !m.type || m.type === "uncategorized").length
                : allMaterials.filter((m) => m.type === cat.value).length;
              return (
                <button
                  className={`grimoireFilterBtn${activeFilter === cat.value ? " active" : ""}${isPriority ? " grimoireFilterBtn--priority" : ""}`}
                  key={cat.value}
                  type="button"
                  onClick={() => setActiveFilter(cat.value)}
                >
                  {cat.label}
                  {cat.value !== "all" && <span className="grimoireFilterCount">{count}</span>}
                </button>
              );
            })}
          </div>
        </aside>

        <div className="workspaceCenterColumn">
          <ProfileLiteGrimoireComposer
            disabled={materialsStatus === "loading" || composerStatus === "loading"}
            status={composerStatus || materialsStatus}
            onCreate={handleComposerCreate}
            onShowUncategorized={() => setActiveFilter("uncategorized")}
          />

          <div className="grimoireCenterHeader">
            <p className="cabinetEyebrow">Записи гримуара</p>
            <span className="cabinetStatus">{materialsStatus === "loading" || composerStatus === "loading" ? "..." : filteredMaterials.length}</span>
          </div>
          {materialsError && <div className="cabinetNotice cabinetSecondaryDataWarning">needs verification: {materialsError}</div>}
          {materialsFeedMessage && <div className="cabinetNotice">{materialsFeedMessage}</div>}
          {materialsStatus === "loading" && <p>Загружаю гримуар...</p>}
          {materialsStatus !== "loading" && filteredMaterials.length === 0 && (
            <div className="mandalaEmptyState grimoireEmptyState">
              <div className="mandalaEmptySeal">✦</div>
              <b>Гримуар пуст</b>
              <p>Загрузите первые фото, статьи или документы — их можно разобрать позже.</p>
            </div>
          )}
          {filteredMaterials.length > 0 && (
            <div className="grimoireRecordsList grimoirePostList">
              {filteredMaterials.map((material) => (
                <GrimoireRecordCard
                  key={material.id || `${material.title}-${material.updated_at}`}
                  material={material}
                  onAddToFeed={onAddToFeed}
                  onEdit={setEditingMaterial}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}
        </div>

        <div className="workspaceRightColumn grimoireUploaderColumn">
          <div className="cabinetCard grimoireUploaderCard">
            <p className="cabinetEyebrow">Быстрая загрузка</p>
            <h3>Добавить записи</h3>
            <p className="grimoireUploaderHint">Загрузите один или несколько файлов. Быстрая загрузка сохранит их в РИ; категорию и описание можно уточнить после.</p>
            <label className="grimoireFileInputLabel" onDragOver={(event) => event.preventDefault()} onDrop={handleFileDrop}>
              <input
                type="file"
                multiple
                accept="image/jpeg,image/png,image/webp,image/gif,audio/mpeg,audio/mp4,audio/wav,audio/webm,audio/ogg,audio/aac,application/pdf,text/plain,text/markdown,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                onChange={handleFileInputChange}
                className="grimoireFileInput"
              />
              <span className="grimoireFileInputText">
                Перетащите файлы сюда или выберите с телефона
              </span>
              <small>РИ по умолчанию. Можно разобрать после загрузки.</small>
            </label>
            {selectedFiles.length > 0 && (
              <div className="grimoireSelectedFiles" aria-label="Выбранные файлы">
                <b>Выбрано перед загрузкой</b>
                <ul>
                  {selectedFiles.map((file) => (
                    <li key={`${file.name}-${file.size}`}>{file.name}</li>
                  ))}
                </ul>
              </div>
            )}
            <button className="cabinetPrimary grimoireUploadPrimary" type="button" onClick={handleUploadSelectedFiles} disabled={!selectedFiles.length}>
              Загрузить в гримуар
            </button>
            {uploadStatus && <p className="grimoireUploadStatus">{uploadStatus}</p>}
            <p className="grimoireUploaderFormats">Поддерживаются: изображения, аудио, PDF, TXT, MD, DOC, DOCX · до 5 MB каждый</p>
          </div>

          <div className="cabinetCard grimoireQuickStatsCard">
            <p className="cabinetEyebrow">Неразобранное</p>
            <h3>{uncategorizedCount} материалов</h3>
            <p>Разберите позже: быстрый вход в материалы, которые нужно назвать, описать и разложить.</p>
            <button className="cabinetSecondary" type="button" onClick={() => setActiveFilter("uncategorized")}>Показать</button>
          </div>

          <div className="cabinetCard grimoireQuickActionsCard">
            <p className="cabinetEyebrow">Быстрые действия</p>
            <h3>Мастерская</h3>
            <a href="/profile/mandalas">Создать мандалу</a>
            <a href="/profile/services">Открыть услуги</a>
            <a href="/feed">Лента сообщества</a>
            <a href="/masters/demo-master">Публичная страница</a>
          </div>
        </div>
      </div>

      {editingMaterial && (
        <GrimoireEditModal
          material={editingMaterial}
          onClose={() => setEditingMaterial(null)}
          onSave={handleEditSave}
          onDelete={handleDelete}
        />
      )}
    </section>
  );
}
