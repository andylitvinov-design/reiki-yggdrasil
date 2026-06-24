import React, { useMemo, useState } from "react";
import {
  createOwnMaterial,
  DB_SAFE_GRIMOIRE_TYPE,
  detectMaterialTypeFromFile,
  getGrimoireFeedActionLabel,
  getGrimoireNextVisibilityStatus,
  getGrimoirePreviewUrl,
  GRIMOIRE_CATEGORIES,
  grimoireTaxonomyFilterLevelOptions,
  grimoireTaxonomyCompactLabel,
  grimoireTaxonomyLevelOptions,
  isGrimoireTaxonomyUnclassified,
  materialMatchesGrimoireTaxonomyFilter,
  TAXONOMY_UNCLASSIFIED,
  TAXONOMY_ALL,
  materialStatusText,
  normalizeGrimoireTaxonomy,
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

function materialDate(material) {
  const value = material?.updated_at || material?.updatedAt || material?.created_at || material?.createdAt || "";
  if (!value) return "черновик";
  try {
    return new Intl.DateTimeFormat("ru-RU", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(value));
  } catch {
    return "черновик";
  }
}

function localMaterialPayload({ profileId, title, description, type, taxonomy, materialType, imageUrl }) {
  const normalizedTaxonomy = normalizeGrimoireTaxonomy(taxonomy);
  return {
    profile_id: profileId,
    type: type || DB_SAFE_GRIMOIRE_TYPE,
    material_group: normalizedTaxonomy.level3,
    material_type: materialType || "",
    title: title || "Запись гримуара",
    description: description || "",
    image_url: imageUrl || "",
    step_id: "",
    step_title: "",
    setting_title: "",
    setting_index: null,
    category: normalizedTaxonomy.level1,
    subcategory: normalizedTaxonomy.level2,
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

function GrimoireRecordCard({ material, onAddToFeed, onEdit, onDelete, onToggleVisibility }) {
  const [previewFailed, setPreviewFailed] = useState(false);
  const isUncategorized = isGrimoireTaxonomyUnclassified(material);
  const noteText = material.description || "Комментарий ещё не добавлен";
  const canAddToFeed = Boolean(material.id && feedActivityTypeForMaterial(material));
  const feedActionLabel = getGrimoireFeedActionLabel(material);
  const previewUrl = previewFailed ? "" : getGrimoirePreviewUrl(material);
  const showFeedAction = canAddToFeed || feedActionLabel === "Спрятать";
  const compactTaxonomy = grimoireTaxonomyCompactLabel(material);

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
        <div className={previewUrl ? "grimoirePostPreview hasImage" : "grimoirePostPreview"}>
          {previewUrl ? (
            <img
              alt={material.title || "Изображение гримуара"}
              className="grimoireCardImage"
              loading="lazy"
              src={previewUrl}
              onError={() => setPreviewFailed(true)}
            />
          ) : (
            <span className="grimoireCardIcon">◎</span>
          )}
        </div>
        {(material.step_id || material.step_title || material.setting_title) && (
          <small className="grimoirePostMeta">{[material.step_id, material.step_title, material.setting_title].filter(Boolean).join(" · ")}</small>
        )}
        {compactTaxonomy && <small className="grimoirePostMeta grimoireTaxonomyMeta">{compactTaxonomy}</small>}
      </div>

      <footer className="grimoirePostActions">
        {showFeedAction && (
          <button
            className="grimoireActionBtn grimoireActionBtnVisibility"
            type="button"
            onClick={() => feedActionLabel === "Спрятать" ? onToggleVisibility(material) : onAddToFeed(material)}
          >
            {feedActionLabel}
          </button>
        )}
        <button className="grimoireActionBtn" type="button" onClick={() => onEdit(material)}>Редактировать</button>
        <button className="grimoireActionBtn grimoireActionBtnDelete" type="button" onClick={() => onDelete(material)}>Удалить</button>
      </footer>
    </article>
  );
}

function GrimoireMaterialFilterPanel({ filter, options, onChange, onReset }) {
  return (
    <div className="grimoireMaterialFilterPanel" aria-label="Фильтр материалов">
      <b>Фильтр материалов</b>
      <label>
        <span>Уровень 1</span>
        <select value={filter.level1} onChange={(event) => onChange("level1", event.target.value)}>
          {options.level1.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
      </label>
      <label>
        <span>Уровень 2</span>
        <select value={filter.level2} onChange={(event) => onChange("level2", event.target.value)}>
          {options.level2.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
      </label>
      <label>
        <span>Уровень 3</span>
        <select value={filter.level3} onChange={(event) => onChange("level3", event.target.value)}>
          {options.level3.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
      </label>
      <button className="grimoireMaterialFilterReset" type="button" onClick={onReset}>Сбросить</button>
    </div>
  );
}

function GrimoireEditModal({ material, onClose, onSave, onDelete }) {
  const initialTaxonomy = normalizeGrimoireTaxonomy(material);
  const [form, setForm] = useState({
    title: material.title || "",
    description: material.description || "",
    taxonomy: initialTaxonomy,
    step_title: material.step_title || "",
    setting_title: material.setting_title || ""
  });
  const level1Options = grimoireTaxonomyLevelOptions(1);
  const level2Options = grimoireTaxonomyLevelOptions(2, form.taxonomy);
  const level3Options = grimoireTaxonomyLevelOptions(3, form.taxonomy);

  const handleTaxonomyChange = (level, value) => {
    setForm((current) => {
      if (level === "level1") {
        return {
          ...current,
          taxonomy: { level1: value, level2: TAXONOMY_UNCLASSIFIED, level3: TAXONOMY_UNCLASSIFIED }
        };
      }
      if (level === "level2") {
        return {
          ...current,
          taxonomy: { ...current.taxonomy, level2: value, level3: TAXONOMY_UNCLASSIFIED }
        };
      }
      return {
        ...current,
        taxonomy: { ...current.taxonomy, level3: value }
      };
    });
  };

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
          Уровень 1
          <select value={form.taxonomy.level1} onChange={(e) => handleTaxonomyChange("level1", e.target.value)}>
            {level1Options.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </label>
        <label>
          Уровень 2
          <select value={form.taxonomy.level2} onChange={(e) => handleTaxonomyChange("level2", e.target.value)}>
            {level2Options.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </label>
        <label>
          Уровень 3
          <select value={form.taxonomy.level3} onChange={(e) => handleTaxonomyChange("level3", e.target.value)}>
            {level3Options.map((c) => (
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
  const [taxonomyFilter, setTaxonomyFilter] = useState({
    level1: TAXONOMY_ALL,
    level2: TAXONOMY_ALL,
    level3: TAXONOMY_ALL
  });

  const allMaterials = useMemo(() => mergeMaterials(localMaterials, materials), [localMaterials, materials]);
  const taxonomyFilterOptions = useMemo(() => ({
    level1: grimoireTaxonomyFilterLevelOptions(1, taxonomyFilter),
    level2: grimoireTaxonomyFilterLevelOptions(2, taxonomyFilter),
    level3: grimoireTaxonomyFilterLevelOptions(3, taxonomyFilter)
  }), [taxonomyFilter]);
  const uncategorizedCount = allMaterials.filter((m) => isGrimoireTaxonomyUnclassified(m)).length;
  const readyCount = Math.max(allMaterials.length - uncategorizedCount, 0);

  const filteredMaterials = allMaterials.filter((m) => {
    if (activeFilter === "all") return true;
    if (activeFilter === TAXONOMY_UNCLASSIFIED) return isGrimoireTaxonomyUnclassified(m);
    const taxonomy = normalizeGrimoireTaxonomy(m);
    return taxonomy.level1 === activeFilter || m.type === activeFilter;
  }).filter((m) => materialMatchesGrimoireTaxonomyFilter(m, taxonomyFilter));

  const handleTaxonomyFilterChange = (level, value) => {
    setTaxonomyFilter((current) => ({
      level1: level === "level1" ? value : current.level1,
      level2: level === "level1" ? TAXONOMY_ALL : level === "level2" ? value : current.level2,
      level3: level === "level1" || level === "level2" ? TAXONOMY_ALL : value
    }));
  };

  const resetTaxonomyFilter = () => setTaxonomyFilter({
    level1: TAXONOMY_ALL,
    level2: TAXONOMY_ALL,
    level3: TAXONOMY_ALL
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

  const handleComposerCreate = async ({ title = "", description = "", taxonomy = {}, files = [], forceUncategorized = false } = {}) => {
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
        let uploaded = null;
        let imageUrl = "";
        let materialType = "";
        const finalTaxonomy = forceUncategorized
          ? normalizeGrimoireTaxonomy({})
          : normalizeGrimoireTaxonomy(taxonomy);
        let finalTitle = cleanTitle;

        if (file) {
          validateGrimoireFile(file);
          uploaded = await uploadProfileMedia(file, { profileId: profile.id, kind: "material" }, session);
          imageUrl = uploaded.ref;
          if (!finalTitle) finalTitle = stripFileExtension(file.name) || "Запись гримуара";
          materialType = detectMaterialTypeFromFile(file);
        }

        if (!finalTitle) finalTitle = cleanDescription.slice(0, 64) || "Запись гримуара";

        const saved = await createOwnMaterial(localMaterialPayload({
          profileId: profile.id,
          title: finalTitle,
          description: cleanDescription,
          type: DB_SAFE_GRIMOIRE_TYPE,
          taxonomy: finalTaxonomy,
          materialType,
          imageUrl
        }), session);
        if (saved) {
          savedRecords.push(file && uploaded?.signedUrl ? {
            ...saved,
            display_url: saved.display_url || uploaded.signedUrl,
            signed_url: saved.signed_url || uploaded.signedUrl
          } : saved);
        }
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

  const handleToggleVisibility = async (material) => {
    try {
      const nextStatus = getGrimoireNextVisibilityStatus(material);
      if (material?.id && onUpdate) await onUpdate(material.id, { status: nextStatus });
      setLocalMaterials((current) => current.map((item) => (
        item === material || item?.id === material?.id
          ? { ...item, status: nextStatus, updated_at: new Date().toISOString() }
          : item
      )));
    } catch (error) {
      alert("Не удалось изменить видимость: " + String(error?.message || error));
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
          <span><b>{uncategorizedCount}</b> Неразобранно</span>
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
              const isPriority = cat.value === TAXONOMY_UNCLASSIFIED;
              const count = cat.value === TAXONOMY_UNCLASSIFIED
                ? allMaterials.filter((m) => isGrimoireTaxonomyUnclassified(m)).length
                : allMaterials.filter((m) => normalizeGrimoireTaxonomy(m).level1 === cat.value || m.type === cat.value).length;
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
	            onShowUncategorized={() => setActiveFilter(TAXONOMY_UNCLASSIFIED)}
          />

          <div className="grimoireCenterHeader">
            <p className="cabinetEyebrow">Записи гримуара</p>
            <span className="cabinetStatus">{materialsStatus === "loading" || composerStatus === "loading" ? "..." : filteredMaterials.length}</span>
          </div>
          <GrimoireMaterialFilterPanel
            filter={taxonomyFilter}
            options={taxonomyFilterOptions}
            onChange={handleTaxonomyFilterChange}
            onReset={resetTaxonomyFilter}
          />
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
                  onToggleVisibility={handleToggleVisibility}
                />
              ))}
            </div>
          )}
        </div>

        <div className="workspaceRightColumn grimoireUploaderColumn">
          <div className="cabinetCard grimoireUploaderCard">
            <p className="cabinetEyebrow">Быстрая загрузка</p>
            <h3>Добавить записи</h3>
            <p className="grimoireUploaderHint">Загрузите один или несколько файлов. Быстрая загрузка сохранит их как неразобранные; три уровня можно уточнить после.</p>
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
	              <small>Неразобранно на всех уровнях. Можно разобрать после загрузки.</small>
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
            <button className="cabinetSecondary" type="button" onClick={() => setActiveFilter(TAXONOMY_UNCLASSIFIED)}>Показать</button>
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
