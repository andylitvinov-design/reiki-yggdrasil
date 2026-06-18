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

const CLIENT_PHOTO_SUBCATEGORIES = [
  { value: "all", label: "Все" },
  { value: "client-1", label: "Клиент 1" },
  { value: "client-2", label: "Клиент 2" },
  { value: "client-3", label: "Клиент 3" },
  { value: "pro-more-clients", label: "Больше клиентов / Pro mode /", proOnly: true }
];

function clientPhotoCategoryLabel(value) {
  return CLIENT_PHOTO_SUBCATEGORIES.find((item) => item.value === value)?.label || "Все";
}

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
  accountPlan,
  clientGoalPhotos,
  materials,
  mediaError,
  mediaStatus,
  onClientPhotoDelete,
  onClientPhotoCategoryMove,
  onClientPhotoFieldChange,
  onClientPhotoFileChange,
  onClientPhotoSave,
  onLibraryPhotoUpload,
  clientPhotoForm,
  shellChrome
}) {
  const isProAccount = accountPlan === "pro";
  /* ── Filter state ───────────────────────────────────────────────── */
  const [filterGroup, setFilterGroup] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterSubcategory, setFilterSubcategory] = useState("");
  const [activeClientFolder, setActiveClientFolder] = useState("all");
  const [draggedPhotoId, setDraggedPhotoId] = useState("");
  const [moveStatus, setMoveStatus] = useState("idle");
  const [moveMessage, setMoveMessage] = useState("");

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

  /* ── Shared filter helper ───────────────────────────────────────── */
  function matchesMediaFilter(item, { filterGroup: fg, filterCategory: fc, filterSubcategory: fs }) {
    if (!fg && !fc && !fs) return true;
    if (fg) {
      const itemGroup = item.material_group || item.group || item.library_group || "";
      if (!itemGroup || itemGroup !== fg) return false;
    }
    if (fc) {
      const itemCategory = item.material_category || item.category || item.step_id || "";
      if (!itemCategory || itemCategory !== fc) return false;
    }
    if (fs) {
      const itemSubcategory = item.material_subcategory || item.subcategory || item.setting_title || item.step_id || "";
      if (!itemSubcategory || itemSubcategory !== fs) return false;
    }
    return true;
  }

  /* ── Filtered photo list ────────────────────────────────────────── */
  const filteredPhotos = useMemo(() => {
    const folderPhotos = activeClientFolder === "all"
      ? clientGoalPhotos
      : clientGoalPhotos.filter((photo) => (photo.client_category || "all") === activeClientFolder);
    if (!filterGroup && !filterCategory && !filterSubcategory) return folderPhotos;
    return folderPhotos.filter((photo) =>
      matchesMediaFilter(photo, { filterGroup, filterCategory, filterSubcategory })
    );
  }, [activeClientFolder, clientGoalPhotos, filterGroup, filterCategory, filterSubcategory]);

  /* ── Filtered materials list ────────────────────────────────────── */
  const filteredMaterials = useMemo(() => {
    if (!filterGroup && !filterCategory && !filterSubcategory) return materials || [];
    return (materials || []).filter((mat) =>
      matchesMediaFilter(mat, { filterGroup, filterCategory, filterSubcategory })
    );
  }, [materials, filterGroup, filterCategory, filterSubcategory]);

  const clientsFormError = mediaStatus === "needs-verification" ? mediaError : "";
  const isUploading = uploadStatus === "loading";
  const clientFolderCounts = useMemo(() => {
    const counts = Object.fromEntries(CLIENT_PHOTO_SUBCATEGORIES.map((item) => [item.value, 0]));
    counts.all = clientGoalPhotos.length;
    for (const photo of clientGoalPhotos) {
      const category = photo.client_category || "all";
      if (category !== "all" && Object.hasOwn(counts, category)) counts[category] += 1;
    }
    return counts;
  }, [clientGoalPhotos]);

  const moveClientPhoto = async (photo, nextCategory) => {
    const option = CLIENT_PHOTO_SUBCATEGORIES.find((item) => item.value === nextCategory);
    if (!photo?.id || !option) return;
    if (option.proOnly && !isProAccount) {
      setMoveStatus("error");
      setMoveMessage("Больше клиентов доступно в Pro.");
      return;
    }
    if ((photo.client_category || "all") === nextCategory) return;

    setMoveStatus("loading");
    setMoveMessage("");
    try {
      await onClientPhotoCategoryMove?.(photo, nextCategory);
      setMoveStatus("success");
      setMoveMessage(`Фото перемещено в «${option.label}».`);
    } catch (error) {
      setMoveStatus("error");
      setMoveMessage(error?.message || "Не удалось переместить фото.");
    }
  };

  const handleFolderDrop = async (event, nextCategory) => {
    event.preventDefault();
    const photoId = event.dataTransfer.getData("text/plain") || draggedPhotoId;
    const photo = clientGoalPhotos.find((item) => item.id === photoId);
    setDraggedPhotoId("");
    if (photo) await moveClientPhoto(photo, nextCategory);
  };

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
          {materials?.length > 0 && <span><b>{materials.length}</b> Материалы</span>}
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

          <div className="cabinetCard profileLiteMediaBrowserCard">
            <div className="cabinetFormHeader">
              <div>
                <p className="cabinetEyebrow">Фото / Медиа</p>
                <h2>Файлы клиентов</h2>
              </div>
              <span className="cabinetStatus">{mediaStatus}</span>
            </div>
            <div className="profileLiteMediaFolderRail" role="tablist" aria-label="Папки фото клиентов">
              {CLIENT_PHOTO_SUBCATEGORIES.map((option) => {
                const disabled = option.proOnly && !isProAccount;
                return (
                  <button
                    key={option.value}
                    className={activeClientFolder === option.value ? "active" : ""}
                    type="button"
                    role="tab"
                    aria-selected={activeClientFolder === option.value}
                    disabled={disabled}
                    onClick={() => {
                      if (disabled) {
                        setMoveStatus("error");
                        setMoveMessage("Больше клиентов доступно в Pro.");
                        return;
                      }
                      setActiveClientFolder(option.value);
                    }}
                    onDragOver={(event) => {
                      if (!disabled) event.preventDefault();
                    }}
                    onDrop={(event) => {
                      if (disabled) {
                        event.preventDefault();
                        setMoveStatus("error");
                        setMoveMessage("Больше клиентов доступно в Pro.");
                        return;
                      }
                      void handleFolderDrop(event, option.value);
                    }}
                  >
                    <span>{option.value === "all" ? "Все фото" : option.label}</span>
                    <b>{clientFolderCounts[option.value] || 0}</b>
                  </button>
                );
              })}
              <button
                type="button"
                className="profileLiteMediaMaterialFolder"
                onClick={() => setFilterGroup(filterGroup ? "" : "dao-ri")}
              >
                <span>Материалы</span>
                <b>{materials?.length || 0}</b>
              </button>
            </div>
            {moveMessage && (
              <div className={`cabinetNotice profileLiteMediaMoveNotice ${moveStatus === "error" ? "cabinetSecondaryDataWarning" : ""}`} role="status">
                {moveMessage}
              </div>
            )}
            <div className="profileLiteMediaGrid">
              {filteredPhotos.map((photo) => (
                <article
                  className="profileLiteMediaCard"
                  key={photo.id || photo.image_ref || photo.image_url}
                  draggable={photo.kind !== "material"}
                  onDragStart={(event) => {
                    setDraggedPhotoId(photo.id || "");
                    event.dataTransfer.setData("text/plain", photo.id || "");
                    event.dataTransfer.effectAllowed = "move";
                  }}
                  onDragEnd={() => setDraggedPhotoId("")}
                >
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
                  <p>{clientPhotoCategoryLabel(photo.client_category || "all")}</p>
                  <small>Фото клиента</small>
                  <div className="profileLiteMediaCardActions">
                    <label>
                      Переместить
                      <select
                        value={photo.client_category || "all"}
                        disabled={moveStatus === "loading"}
                        onChange={(event) => void moveClientPhoto(photo, event.target.value)}
                      >
                        {CLIENT_PHOTO_SUBCATEGORIES.map((option) => (
                          <option key={option.value} value={option.value} disabled={option.proOnly && !isProAccount}>
                            {option.proOnly && !isProAccount ? `${option.label} — Pro` : option.label}
                          </option>
                        ))}
                      </select>
                    </label>
                    <button className="cabinetGhost" type="button" onClick={() => onClientPhotoDelete(photo)}>
                      Удалить
                    </button>
                  </div>
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

          {materials?.length > 0 && (
            <div className="cabinetCard profileLiteMediaMaterialsBlock">
              <p className="cabinetEyebrow">Материалы библиотеки</p>
              <h2>Загруженные материалы</h2>
              <div className="profileLiteMediaGrid">
                {filteredMaterials.map((mat) => (
                  <article className="profileLiteMediaCard" key={mat.id || mat.image_url}>
                    <div
                      className="profileLiteMediaThumb"
                      style={
                        mat.display_url || mat.image_url
                          ? { backgroundImage: `url(${mat.display_url || mat.image_url})` }
                          : undefined
                      }
                    >
                      ◎
                    </div>
                    <h3>{mat.title || "Материал"}</h3>
                    <p>{mat.description || mat.step_title || mat.setting_title || ""}</p>
                  </article>
                ))}
                {filteredMaterials.length === 0 && (filterGroup || filterCategory || filterSubcategory) && (
                  <p>Нет материалов по выбранному фильтру.</p>
                )}
              </div>
            </div>
          )}
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
                  Название фото
                  <input
                    value={clientPhotoForm.title}
                    onChange={(event) => onClientPhotoFieldChange("title", event.target.value)}
                    placeholder="Фото цели"
                  />
                </label>
                <label>
                  Подкатегория
                  <select
                    value={clientPhotoForm.client_category || "all"}
                    onChange={(event) => {
                      const nextValue = event.target.value;
                      const option = CLIENT_PHOTO_SUBCATEGORIES.find((item) => item.value === nextValue);
                      if (option?.proOnly && !isProAccount) return;
                      onClientPhotoFieldChange("client_category", nextValue);
                    }}
                  >
                    {CLIENT_PHOTO_SUBCATEGORIES.map((option) => (
                      <option
                        key={option.value}
                        value={option.value}
                        disabled={option.proOnly && !isProAccount}
                      >
                        {option.proOnly && !isProAccount ? `${option.label} — доступно в Pro` : option.label}
                      </option>
                    ))}
                  </select>
                </label>
                {!isProAccount && (
                  <p className="profileLiteMediaFormHint">Больше клиентов доступно в Pro.</p>
                )}
                <label className="profileLiteFileInput">
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/gif"
                    onChange={onClientPhotoFileChange}
                  />
                  {clientPhotoForm.file ? `Выбрано: ${clientPhotoForm.file.name}` : "Загрузить файл"}
                </label>
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
