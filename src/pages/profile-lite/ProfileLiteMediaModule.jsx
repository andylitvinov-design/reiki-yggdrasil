import React, { useMemo, useRef, useState } from "react";
import { reikiLevels } from "../../data/reikiKnowledgeBase.js";
import { mysteryTraditions } from "../../data/mysteryTraditions.js";

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
  { value: "pro-more-clients", label: "Больше клиентов / Pro", proOnly: true }
];

const MEDIA_FOLDERS = [
  { id: "all-files", label: "Все файлы", type: "all" },
  { id: "client-all", label: "Клиенты / Все", type: "client-all", targetCategory: "all" },
  { id: "client-1", label: "Клиент 1", type: "client-category", targetCategory: "client-1" },
  { id: "client-2", label: "Клиент 2", type: "client-category", targetCategory: "client-2" },
  { id: "client-3", label: "Клиент 3", type: "client-category", targetCategory: "client-3" },
  { id: "pro-more-clients", label: "Больше клиентов / Pro", type: "client-category", targetCategory: "pro-more-clients", proOnly: true },
  { id: "materials", label: "Материалы", type: "materials" }
];

function clientPhotoCategoryLabel(value) {
  return CLIENT_PHOTO_SUBCATEGORIES.find((item) => item.value === value)?.label || "Все";
}

function mediaFolderForPhoto(value) {
  return clientPhotoCategoryLabel(value || "all");
}

function materialFolderLabel(item) {
  return item?.step_title || item?.setting_title || item?.category || item?.material_group || "Материалы";
}

function hasPreview(item) {
  return Boolean(item?.display_url || item?.image_url);
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
  onClientPhotoFieldChange,
  onClientPhotoFileChange,
  onClientPhotoCategoryMove,
  onClientPhotoSave,
  onLibraryPhotoUpload,
  clientPhotoForm,
  shellChrome
}) {
  const isProAccount = accountPlan === "pro";
  const [activeFolderId, setActiveFolderId] = useState("all-files");
  const [draggedPhoto, setDraggedPhoto] = useState(null);
  const [dragOverFolderId, setDragOverFolderId] = useState("");
  const [moveStatus, setMoveStatus] = useState("");
  const [moveError, setMoveError] = useState("");

  const [uploadDestination, setUploadDestination] = useState("clients");
  const [uploadGroup, setUploadGroup] = useState(SOURCE_LIBRARY_CATEGORIES[0]?.value || "");
  const [uploadCategory, setUploadCategory] = useState("");
  const [uploadSubcategory, setUploadSubcategory] = useState("");
  const [uploadTitle, setUploadTitle] = useState("");
  const [uploadNotes, setUploadNotes] = useState("");
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadStatus, setUploadStatus] = useState("idle");
  const [uploadError, setUploadError] = useState("");
  const fileInputRef = useRef(null);

  const activeFolder = MEDIA_FOLDERS.find((folder) => folder.id === activeFolderId) || MEDIA_FOLDERS[0];
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

  const mediaItems = useMemo(() => {
    const photoItems = (clientGoalPhotos || []).map((photo) => ({
      kind: "client-photo",
      id: photo.id || photo.image_ref || photo.image_url,
      title: photo.title || "Фото клиента / цели",
      folderLabel: mediaFolderForPhoto(photo.client_category),
      category: photo.client_category || "all",
      previewUrl: photo.display_url || photo.image_url || "",
      previewStatus: hasPreview(photo) ? "" : (photo.media_signing_error || "Предпросмотр недоступен"),
      source: photo
    }));
    const materialItems = (materials || []).map((material) => ({
      kind: "material",
      id: material.id || material.image_ref || material.image_url,
      title: material.title || "Материал",
      folderLabel: materialFolderLabel(material),
      category: "materials",
      previewUrl: material.display_url || material.image_url || "",
      previewStatus: hasPreview(material) ? "" : (material.media_signing_error || "Предпросмотр недоступен"),
      source: material
    }));
    return [...photoItems, ...materialItems];
  }, [clientGoalPhotos, materials]);

  const visibleItems = useMemo(() => {
    if (activeFolder.type === "all") return mediaItems;
    if (activeFolder.type === "client-all") return mediaItems.filter((item) => item.kind === "client-photo");
    if (activeFolder.type === "materials") return mediaItems.filter((item) => item.kind === "material");
    if (activeFolder.type === "client-category") {
      return mediaItems.filter((item) => item.kind === "client-photo" && item.category === activeFolder.targetCategory);
    }
    return mediaItems;
  }, [activeFolder, mediaItems]);

  const clientsFormError = mediaStatus === "needs-verification" ? mediaError : "";
  const isUploading = uploadStatus === "loading";

  const moveCategoryOptions = CLIENT_PHOTO_SUBCATEGORIES;

  const handleClientPhotoMove = async (photo, nextCategory) => {
    const option = CLIENT_PHOTO_SUBCATEGORIES.find((item) => item.value === nextCategory);
    if (option?.proOnly && !isProAccount) {
      setMoveStatus("Больше клиентов доступно в Pro.");
      setMoveError("");
      return;
    }
    if (!photo?.id || !nextCategory || nextCategory === (photo.client_category || "all")) return;
    setMoveStatus("Перемещаем фото…");
    setMoveError("");
    try {
      await onClientPhotoCategoryMove?.(photo, nextCategory);
      setMoveStatus(`Фото перемещено в ${clientPhotoCategoryLabel(nextCategory)}.`);
    } catch (error) {
      setMoveStatus("");
      setMoveError(error?.message || "Фото не переместилось.");
    }
  };

  const handleClientPhotoDragStart = (event, photo) => {
    const payload = {
      kind: "client-photo",
      id: photo.id,
      currentCategory: photo.client_category || "all"
    };
    setDraggedPhoto(photo);
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("application/json", JSON.stringify(payload));
    event.dataTransfer.setData("text/plain", photo.id || "");
  };

  const handleFolderDrop = (event, folder) => {
    event.preventDefault();
    setDragOverFolderId("");
    if (!folder.targetCategory) return;
    if (folder.proOnly && !isProAccount) {
      setMoveStatus("Доступно в Pro: папка «Больше клиентов / Pro».");
      setMoveError("");
      return;
    }
    let droppedPhoto = draggedPhoto;
    if (!droppedPhoto?.id) {
      try {
        const payload = JSON.parse(event.dataTransfer.getData("application/json") || "{}");
        droppedPhoto = (clientGoalPhotos || []).find((photo) => photo.id === payload.id);
      } catch {
        const photoId = event.dataTransfer.getData("text/plain");
        droppedPhoto = (clientGoalPhotos || []).find((photo) => photo.id === photoId);
      }
    }
    if (!droppedPhoto?.id) return;
    void handleClientPhotoMove(droppedPhoto, folder.targetCategory);
  };

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
        <div className="profileLiteMediaMain">
          <div className="cabinetCard profileLiteMediaBrowser">
            <div className="cabinetFormHeader">
              <div>
                <p className="cabinetEyebrow">Файлы</p>
                <h2>Браузер медиа</h2>
              </div>
              <span className="cabinetStatus">{mediaStatus}</span>
            </div>

            {(moveStatus || moveError) && (
              <div className={`cabinetNotice ${moveError ? "cabinetSecondaryDataWarning" : ""}`} role={moveError ? "alert" : "status"}>
                {moveError || moveStatus}
              </div>
            )}

            <div className="profileLiteFileManager">
              <nav className="profileLiteMediaFolders" aria-label="Папки медиа">
                {MEDIA_FOLDERS.map((folder) => {
                  const disabled = folder.proOnly && !isProAccount;
                  const isDropTarget = Boolean(folder.targetCategory);
                  return (
                    <button
                      key={folder.id}
                      className={[
                        "profileLiteMediaFolderButton",
                        activeFolder.id === folder.id ? "active" : "",
                        dragOverFolderId === folder.id ? "profileLiteMediaFolderButton--dragOver" : ""
                      ].filter(Boolean).join(" ")}
                      type="button"
                      disabled={folder.proOnly && !isProAccount}
                      onClick={() => {
                        if (disabled) {
                          setMoveStatus("Доступно в Pro: папка «Больше клиентов / Pro».");
                          return;
                        }
                        setActiveFolderId(folder.id);
                      }}
                      onDragOver={(event) => {
                        if (!isDropTarget || disabled) return;
                        event.preventDefault();
                        setDragOverFolderId(folder.id);
                      }}
                      onDragLeave={() => setDragOverFolderId("")}
                      onDrop={(event) => handleFolderDrop(event, folder)}
                      title={disabled ? "Доступно в Pro" : "Открыть папку"}
                    >
                      <span>{folder.label}</span>
                      {disabled && <small>Доступно в Pro</small>}
                    </button>
                  );
                })}
              </nav>

              <div className="profileLiteMediaFilesPanel">
                <div className="profileLiteMediaFilesHeader">
                  <div>
                    <p className="cabinetEyebrow">{activeFolder.label}</p>
                    <h3>{visibleItems.length} файл(ов)</h3>
                  </div>
                  <small>Материалы доступны только для просмотра. Перетаскиваются только фото клиентов.</small>
                </div>

                <div className="profileLiteMediaGrid">
                  {visibleItems.map((item) => {
                    const photo = item.kind === "client-photo" ? item.source : null;
                    const photoDraggable = item.kind === "client-photo" && Boolean(item.source?.id);
                    return (
                      <article
                        className={`profileLiteMediaCard profileLiteMediaCard--${item.kind}`}
                        key={`${item.kind}-${item.id}`}
                        draggable={photoDraggable}
                        onDragStart={(event) => photoDraggable && handleClientPhotoDragStart(event, photo)}
                        onDragEnd={() => {
                          setDraggedPhoto(null);
                          setDragOverFolderId("");
                        }}
                      >
                        <div
                          className="profileLiteMediaThumb"
                          style={item.previewUrl ? { backgroundImage: `url(${item.previewUrl})` } : undefined}
                        >
                          ◎
                        </div>
                        <h3>{item.title}</h3>
                        <p className="profileLiteMediaMeta">
                          <b>{item.kind === "client-photo" ? "Клиент" : "Материал"}</b>
                          <span>{item.folderLabel}</span>
                        </p>
                        {item.previewStatus && <p className="profileLiteMediaPreviewStatus">{item.previewStatus}</p>}

                        {item.kind === "client-photo" && (
                          <div className="profileLiteMediaCardActions">
                            <label>
                              Переместить в…
                              <select
                                value={photo.client_category || "all"}
                                onChange={(event) => handleClientPhotoMove(photo, event.target.value)}
                              >
                                {moveCategoryOptions.map((option) => (
                                  <option
                                    key={option.value}
                                    value={option.value}
                                    disabled={option.proOnly && !isProAccount}
                                  >
                                    {option.proOnly && !isProAccount ? `${option.label} — Pro` : option.label}
                                  </option>
                                ))}
                              </select>
                            </label>
                            <button className="cabinetGhost" type="button" onClick={() => onClientPhotoDelete(item.source)}>
                              Удалить
                            </button>
                          </div>
                        )}
                      </article>
                    );
                  })}
                  {mediaStatus === "success" && visibleItems.length === 0 && (
                    <p>В этой папке пока нет файлов.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

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
