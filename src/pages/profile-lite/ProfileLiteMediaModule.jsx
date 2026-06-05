import React, { useMemo, useRef, useState } from "react";
import { reikiLevels } from "../../data/reikiKnowledgeBase.js";
import { mysteryTraditions } from "../../data/mysteryTraditions.js";

/* ── Library categories matching SOURCE_LIBRARY_CATEGORIES
   in ProfileLitePowerPlaceModuleBase.jsx ─────────────────────────── */

const CHANNELS_SUBCATEGORIES = [
  { value: "sefirot", label: "Сефирот" },
  { value: "runes", label: "Руны" },
  { value: "planets", label: "Планеты" },
  { value: "money", label: "Деньги" },
  { value: "life", label: "Жизнь" }
];

const SOURCE_LIBRARY_CATEGORIES = [
  {
    value: "dao-ri",
    label: "ДАО РИ",
    subcategories: reikiLevels.map((level) => ({
      value: `level-${level.id}`,
      label: `${level.id}. ${level.name}`,
      thirdLevels: level.steps.map((step) => ({
        value: step.id,
        label: `${level.stepLabel} ${step.number}: ${step.title}`,
        step_id: step.id,
        step_title: step.title
      }))
    }))
  },
  {
    value: "god-channels",
    label: "Мистерии",
    subcategories: mysteryTraditions.map((t) => ({
      value: t.id,
      label: t.title
    }))
  },
  {
    value: "channels",
    label: "Каналы",
    subcategories: CHANNELS_SUBCATEGORIES
  },
  {
    value: "covers",
    label: "Фон",
    subcategories: [{ value: "cover", label: "Фон" }]
  },
  {
    value: "form",
    label: "Форма",
    subcategories: [
      { value: "zashchitnye", label: "Защитные" },
      { value: "tselyebnye", label: "Целебные" },
      { value: "business", label: "Бизнес" },
      { value: "other", label: "Другие" }
    ]
  },
  { value: "talismans", label: "Талисманы", subcategories: [] },
  { value: "artifacts", label: "Артефакты", subcategories: [] },
  { value: "favorites", label: "Избранные", subcategories: [] },
  {
    value: "client-goals",
    label: "Клиенты",
    subcategories: [{ value: "client-goals", label: "Фото клиентов" }]
  }
];

export default function ProfileLiteMediaModule({
  clientGoalPhotos,
  mediaError,
  mediaStatus,
  onClientPhotoDelete,
  onClientPhotoFieldChange,
  onClientPhotoFileChange,
  onClientPhotoSave,
  onLibraryPhotoUpload,
  clientPhotoForm,
  shellChrome
}) {
  /* ── Filter state ───────────────────────────────────────────────── */
  const [filterGroup, setFilterGroup] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterSubcategory, setFilterSubcategory] = useState("");

  const activeFilterGroup = useMemo(
    () => SOURCE_LIBRARY_CATEGORIES.find((g) => g.value === filterGroup) || null,
    [filterGroup]
  );
  const filterCategoryOptions = activeFilterGroup?.subcategories || [];
  const activeFilterCategory = useMemo(
    () => filterCategoryOptions.find((c) => c.value === filterCategory) || null,
    [filterCategoryOptions, filterCategory]
  );
  const filterSubcategoryOptions = activeFilterCategory?.thirdLevels || [];

  /* ── Upload destination tabs ───────────────────────────────────── */
  const [uploadDestination, setUploadDestination] = useState("clients");

  /* ── Materials upload local state ─────────────────────────────── */
  const [uploadGroup, setUploadGroup] = useState(SOURCE_LIBRARY_CATEGORIES[0]?.value || "");
  const [uploadCategory, setUploadCategory] = useState("");
  const [uploadSubcategory, setUploadSubcategory] = useState("");
  const [uploadTitle, setUploadTitle] = useState("");
  const [uploadNotes, setUploadNotes] = useState("");
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadStatus, setUploadStatus] = useState("idle");
  const [uploadError, setUploadError] = useState("");
  const fileInputRef = useRef(null);

  const activeUploadGroup = useMemo(
    () => SOURCE_LIBRARY_CATEGORIES.find((g) => g.value === uploadGroup) || null,
    [uploadGroup]
  );
  const uploadCategoryOptions = activeUploadGroup?.subcategories || [];
  const activeUploadCategory = useMemo(
    () => uploadCategoryOptions.find((c) => c.value === uploadCategory) || null,
    [uploadCategoryOptions, uploadCategory]
  );
  const uploadSubcategoryOptions = activeUploadCategory?.thirdLevels || [];
  const activeUploadSubcategory = useMemo(
    () => uploadSubcategoryOptions.find((s) => s.value === uploadSubcategory) || null,
    [uploadSubcategoryOptions, uploadSubcategory]
  );

  /* ── Filtered photo list ────────────────────────────────────────── */
  const filteredPhotos = useMemo(() => {
    if (!filterGroup && !filterCategory && !filterSubcategory) return clientGoalPhotos;
    return clientGoalPhotos.filter((photo) => {
      if (filterGroup && photo.material_group && photo.material_group !== filterGroup) return false;
      if (filterCategory && photo.step_id && photo.step_id !== filterCategory) return false;
      if (filterSubcategory && photo.setting_title && photo.setting_title !== filterSubcategory) return false;
      return true;
    });
  }, [clientGoalPhotos, filterGroup, filterCategory, filterSubcategory]);

  const clientsFormError = mediaStatus === "needs-verification" ? mediaError : "";
  const isUploading = uploadStatus === "loading";

  /* ── Materials upload handler ───────────────────────────────────── */
  const handleMaterialsUpload = async (event) => {
    event.preventDefault();
    if (!uploadFile) {
      setUploadError("Выберите файл для загрузки.");
      return;
    }
    setUploadStatus("loading");
    setUploadError("");
    try {
      await onLibraryPhotoUpload({
        destination: "materials",
        file: uploadFile,
        title: uploadTitle || uploadFile.name || "Материал",
        notes: uploadNotes,
        material: {
          group: uploadGroup,
          category: uploadCategory,
          subcategory: activeUploadSubcategory?.label || uploadSubcategory,
          step_id: activeUploadSubcategory?.step_id || uploadSubcategory,
          step_title: activeUploadSubcategory?.step_title || activeUploadSubcategory?.label || "",
          setting_title: activeUploadSubcategory?.label || "",
          setting_index: uploadSubcategoryOptions.indexOf(activeUploadSubcategory) >= 0
            ? uploadSubcategoryOptions.indexOf(activeUploadSubcategory) + 1
            : null,
          type: "mandala"
        }
      });
      setUploadStatus("success");
      setUploadFile(null);
      setUploadTitle("");
      setUploadNotes("");
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (error) {
      setUploadStatus("error");
      setUploadError(error?.message || "Загрузка не завершилась.");
    }
  };

  return (
    <section className="profileLiteModule profileLiteMediaModule mandalaWorkspace" aria-label="Фото / Медиа">
      <div className="mandalaHero">
        <div className="mandalaHeroSeal">◌</div>
        <div>
          <p className="cabinetEyebrow">Фото / Медиа</p>
          <h2>Медиа мастерской</h2>
          <p>Загружайте фото клиентов и образы материалов для мандал, алтаря и материалов.</p>
        </div>
        <div className="mandalaHeroStats">
          <span><b>{clientGoalPhotos.length}</b> Фото</span>
        </div>
      </div>
      {shellChrome}

      <div className="profileLiteMediaLayout">
        {/* Left column: filter bar + photo list */}
        <div className="profileLiteMediaMain">
          <div className="profileLiteMediaFilterBar" role="group" aria-label="Фильтр фото">
            <div className="profileLiteMediaFilterField">
              <label htmlFor="mediaFilterGroup">Группа</label>
              <select
                id="mediaFilterGroup"
                value={filterGroup}
                onChange={(event) => {
                  setFilterGroup(event.target.value);
                  setFilterCategory("");
                  setFilterSubcategory("");
                }}
              >
                <option value="">Все группы</option>
                {SOURCE_LIBRARY_CATEGORIES.map((g) => (
                  <option key={g.value} value={g.value}>{g.label}</option>
                ))}
              </select>
            </div>

            <div className="profileLiteMediaFilterField">
              <label htmlFor="mediaFilterCategory">Категория</label>
              <select
                id="mediaFilterCategory"
                value={filterCategory}
                disabled={!filterGroup || filterCategoryOptions.length === 0}
                onChange={(event) => {
                  setFilterCategory(event.target.value);
                  setFilterSubcategory("");
                }}
              >
                <option value="">Все</option>
                {filterCategoryOptions.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>

            <div className="profileLiteMediaFilterField">
              <label htmlFor="mediaFilterSubcategory">Ступень</label>
              <select
                id="mediaFilterSubcategory"
                value={filterSubcategory}
                disabled={!filterCategory || filterSubcategoryOptions.length === 0}
                onChange={(event) => setFilterSubcategory(event.target.value)}
              >
                <option value="">Все</option>
                {filterSubcategoryOptions.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="cabinetCard">
            <div className="cabinetFormHeader">
              <div>
                <p className="cabinetEyebrow">Фото / Медиа</p>
                <h2>Фото клиентов и материалов</h2>
              </div>
              <span className="cabinetStatus">{mediaStatus}</span>
            </div>
            <div className="profileLiteMediaGrid">
              {filteredPhotos.map((photo) => (
                <article className="profileLiteMediaCard" key={photo.id || photo.image_ref || photo.image_url}>
                  <div
                    className="profileLiteMediaThumb"
                    style={
                      photo.display_url || photo.image_url
                        ? { backgroundImage: `url(${photo.display_url || photo.image_url})` }
                        : undefined
                    }
                  >
                    ◎
                  </div>
                  <h3>{photo.title || "Фото клиента / цели"}</h3>
                  <p>{photo.notes || "Без заметки"}</p>
                  <button className="cabinetGhost" type="button" onClick={() => onClientPhotoDelete(photo)}>
                    Удалить
                  </button>
                </article>
              ))}
              {mediaStatus === "success" && filteredPhotos.length === 0 && clientGoalPhotos.length === 0 && (
                <p>Фото клиентов пока не найдены.</p>
              )}
              {filteredPhotos.length === 0 && clientGoalPhotos.length > 0 && (
                <p>Нет фото по выбранному фильтру.</p>
              )}
            </div>
          </div>
        </div>

        {/* Right column: single upload card */}
        <div className="profileLiteMediaUploadPanel">
          <div className="cabinetCard profileLiteMediaUploadCard">
            <p className="cabinetEyebrow">Загрузить фото</p>

            <div
              className="profileLiteMediaDestinationTabs"
              role="tablist"
              aria-label="Назначение загрузки"
            >
              <button
                className={uploadDestination === "clients" ? "active" : ""}
                type="button"
                role="tab"
                aria-selected={uploadDestination === "clients"}
                onClick={() => setUploadDestination("clients")}
              >
                Клиенты
              </button>
              <button
                className={uploadDestination === "materials" ? "active" : ""}
                type="button"
                role="tab"
                aria-selected={uploadDestination === "materials"}
                onClick={() => { setUploadDestination("materials"); setUploadStatus("idle"); setUploadError(""); }}
              >
                Материалы
              </button>
            </div>

            {uploadDestination === "clients" ? (
              <form
                className="profileLiteMediaUploadForm"
                onSubmit={(event) => {
                  event.preventDefault();
                  onClientPhotoSave();
                }}
              >
                {clientsFormError && (
                  <div className="cabinetNotice cabinetSecondaryDataWarning profileLiteMediaFormError" role="alert">
                    {clientsFormError}
                  </div>
                )}
                <label>
                  Название
                  <input
                    value={clientPhotoForm.title}
                    onChange={(event) => onClientPhotoFieldChange("title", event.target.value)}
                    placeholder="Фото цели"
                  />
                </label>
                <label>
                  URL изображения
                  <input
                    value={clientPhotoForm.image_url}
                    onChange={(event) => onClientPhotoFieldChange("image_url", event.target.value)}
                    placeholder="https://..."
                  />
                </label>
                <label>
                  Заметка
                  <textarea
                    value={clientPhotoForm.notes}
                    onChange={(event) => onClientPhotoFieldChange("notes", event.target.value)}
                    rows={2}
                  />
                </label>
                <label className="profileLiteFileInput">
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/gif"
                    onChange={onClientPhotoFileChange}
                  />
                  {clientPhotoForm.file ? `Выбрано: ${clientPhotoForm.file.name}` : "Загрузить файл"}
                </label>
                <p className="profileLiteMediaFormHint">
                  Файл и URL — взаимоисключающие: выберите одно из двух.
                </p>
                <button className="cabinetPrimary" type="submit">
                  Сохранить фото
                </button>
              </form>
            ) : (
              <form
                className="profileLiteMediaUploadForm"
                onSubmit={handleMaterialsUpload}
              >
                {uploadError && (
                  <div className="cabinetNotice cabinetSecondaryDataWarning profileLiteMediaFormError" role="alert">
                    {uploadError}
                  </div>
                )}
                {uploadStatus === "success" && (
                  <div className="cabinetNotice profileLiteMediaFormHint" role="status">
                    Материал сохранён.
                  </div>
                )}

                <label>
                  Группа
                  <select
                    value={uploadGroup}
                    disabled={isUploading}
                    onChange={(event) => {
                      setUploadGroup(event.target.value);
                      setUploadCategory("");
                      setUploadSubcategory("");
                    }}
                  >
                    {SOURCE_LIBRARY_CATEGORIES.map((g) => (
                      <option key={g.value} value={g.value}>{g.label}</option>
                    ))}
                  </select>
                </label>

                {uploadCategoryOptions.length > 0 && (
                  <label>
                    Категория
                    <select
                      value={uploadCategory}
                      disabled={isUploading}
                      onChange={(event) => {
                        setUploadCategory(event.target.value);
                        setUploadSubcategory("");
                      }}
                    >
                      <option value="">Выбрать</option>
                      {uploadCategoryOptions.map((c) => (
                        <option key={c.value} value={c.value}>{c.label}</option>
                      ))}
                    </select>
                  </label>
                )}

                {uploadSubcategoryOptions.length > 0 && (
                  <label>
                    Ступень / подкатегория
                    <select
                      value={uploadSubcategory}
                      disabled={isUploading}
                      onChange={(event) => setUploadSubcategory(event.target.value)}
                    >
                      <option value="">Выбрать</option>
                      {uploadSubcategoryOptions.map((s) => (
                        <option key={s.value} value={s.value}>{s.label}</option>
                      ))}
                    </select>
                  </label>
                )}

                <label>
                  Название
                  <input
                    value={uploadTitle}
                    disabled={isUploading}
                    onChange={(event) => setUploadTitle(event.target.value)}
                    placeholder="Название материала (необязательно)"
                  />
                </label>
                <label>
                  Заметка
                  <textarea
                    value={uploadNotes}
                    disabled={isUploading}
                    onChange={(event) => setUploadNotes(event.target.value)}
                    rows={2}
                  />
                </label>

                <label className="profileLiteFileInput">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/gif"
                    disabled={isUploading}
                    onChange={(event) => {
                      const file = event.target.files?.[0] || null;
                      setUploadFile(file);
                      setUploadStatus("idle");
                      setUploadError("");
                    }}
                  />
                  {uploadFile ? `Выбрано: ${uploadFile.name}` : "Выбрать файл"}
                </label>

                <button className="cabinetPrimary" type="submit" disabled={isUploading || !uploadFile}>
                  {isUploading ? "Загружаю..." : "Сохранить фото"}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
