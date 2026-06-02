import React, { useMemo, useState } from "react";

function isDisplayUrl(value) {
  return Boolean(value && (/^https?:\/\//.test(value) || value.startsWith("data:image/")));
}

function isStorageRef(value) {
  return typeof value === "string" && value.startsWith("storage://");
}

function imageStyle(src) {
  return isDisplayUrl(src) ? { backgroundImage: `url(${src})` } : undefined;
}

function modeTitle(mode) {
  if (mode === "library") return "Добавить фото в библиотеку";
  if (mode === "center") return "Выбрать центральное изображение";
  if (mode === "cover") return "Выбрать фон";
  return "Выбрать изображение объекта";
}

function modeEyebrow(mode) {
  if (mode === "library") return "Библиотека фото";
  if (mode === "center") return "Центр мандалы";
  if (mode === "cover") return "Фон Места Силы";
  return "Объект мандалы";
}

export default function ProfileLiteImagePicker({
  mode = "center",
  images = [],
  defaultLibraryTab = "clients",
  selectedImageRef = "",
  onSelect = async () => {},
  onUpload = async () => {},
  onDelete,
  onClose,
  uploadStatus = "idle",
  uploadError = ""
}) {
  const [activeTab, setActiveTab] = useState(mode === "library" ? "upload" : "new");
  const [uploadDestination, setUploadDestination] = useState("clients");
  const [uploadTitle, setUploadTitle] = useState("");
  const [uploadNotes, setUploadNotes] = useState("");
  const [materialGroup, setMaterialGroup] = useState("dao-ri");
  const [materialCategory, setMaterialCategory] = useState("");
  const [materialSubcategory, setMaterialSubcategory] = useState("");
  const [materialStep, setMaterialStep] = useState("");
  const [localUploadStatus, setLocalUploadStatus] = useState("idle");
  const [localUploadError, setLocalUploadError] = useState("");
  const currentUploadStatus = uploadStatus === "idle" ? localUploadStatus : uploadStatus;
  const currentUploadError = uploadError || localUploadError;
  const isUploading = currentUploadStatus === "loading";
  const visibleImages = useMemo(() => {
    const validImages = images.filter((image) => image?.id || image?.src || image?.displaySrc);
    if (activeTab === "clients") return validImages.filter((image) => image.kind === "client-photo");
    if (activeTab === "materials") return validImages.filter((image) => image.kind === "material" || image.kind === "tradition-asset");
    return validImages;
  }, [activeTab, images]);
  const tabLabels = mode === "library"
    ? [{ id: "upload", label: "Загрузить фото" }]
    : [
      { id: "new", label: "Новые" },
      { id: "clients", label: "Клиенты" },
      { id: "materials", label: "Материалы" },
      { id: "upload", label: "Загрузить фото" }
    ];

  const handleSelect = async (image) => {
    await onSelect(image);
    onClose?.();
  };

  const handleUpload = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setLocalUploadStatus("loading");
    setLocalUploadError("");
    try {
      await onUpload({
        destination: uploadDestination || defaultLibraryTab,
        file,
        title: uploadTitle || file.name || "",
        notes: uploadNotes,
        material: {
          group: materialGroup,
          category: materialCategory,
          subcategory: materialSubcategory,
          step: materialStep,
          description: uploadNotes
        }
      });
      setLocalUploadStatus("success");
      onClose?.();
    } catch (error) {
      setLocalUploadStatus("error");
      setLocalUploadError(error?.message || "Загрузка не завершилась.");
    }
  };

  return (
    <div className="clientPhotoPickerBackdrop" onMouseDown={(event) => {
      if (event.target === event.currentTarget && !isUploading) onClose?.();
    }}>
      <section className="clientPhotoPickerModal profileLiteImagePicker" role="dialog" aria-modal="true" aria-labelledby="profileLiteImagePickerTitle">
        <div className="clientPhotoPickerHeader">
          <div>
            <p className="cabinetEyebrow">{modeEyebrow(mode)}</p>
            <h2 id="profileLiteImagePickerTitle">{modeTitle(mode)}</h2>
            <small>Сохранённые фото доступны сразу. Storage refs без signed URL показываются как placeholder.</small>
          </div>
          <button type="button" onClick={onClose} disabled={isUploading} aria-label="Закрыть выбор изображения">x</button>
        </div>

        <div className="clientPhotoPickerModeTabs imagePickerModeBar" role="tablist" aria-label="Режим выбора фото">
          {tabLabels.map((tab) => (
            <button
              className={activeTab === tab.id ? "active" : ""}
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              role="tab"
              aria-selected={activeTab === tab.id}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {currentUploadError && <div className="cabinetError compactNotice">{currentUploadError}</div>}

        {activeTab === "upload" && (
          <div className="profileLiteUploadPanel">
            <div className="clientPhotoPickerModeTabs imagePickerDestinationTabs" role="tablist" aria-label="Назначение загрузки">
              <button className={uploadDestination === "clients" ? "active" : ""} type="button" onClick={() => setUploadDestination("clients")}>Клиенты</button>
              <button className={uploadDestination === "materials" ? "active" : ""} type="button" onClick={() => setUploadDestination("materials")}>Материалы</button>
            </div>

            {uploadDestination === "clients" ? (
              <div className="profileLiteUploadFields">
                <label>
                  Название
                  <input value={uploadTitle} onChange={(event) => setUploadTitle(event.target.value)} placeholder="По умолчанию имя файла" />
                </label>
                <label>
                  Заметки
                  <textarea value={uploadNotes} onChange={(event) => setUploadNotes(event.target.value)} rows={3} placeholder="meta / notes" />
                </label>
              </div>
            ) : (
              <div className="profileLiteUploadFields">
                <div className="cabinetNotice compactNotice">Материалы: needs verification — image material creation без миграции не включён.</div>
                <label>
                  Группа
                  <select value={materialGroup} onChange={(event) => setMaterialGroup(event.target.value)}>
                    <option value="dao-ri">ДАО РИ</option>
                    <option value="god-channels">Мистерии</option>
                    <option value="channels">Каналы</option>
                    <option value="form">Форма</option>
                  </select>
                </label>
                <label>
                  Категория
                  <input value={materialCategory} onChange={(event) => setMaterialCategory(event.target.value)} placeholder="category" />
                </label>
                <label>
                  Подкатегория
                  <input value={materialSubcategory} onChange={(event) => setMaterialSubcategory(event.target.value)} placeholder="subcategory" />
                </label>
                <label>
                  Ступень
                  <input value={materialStep} onChange={(event) => setMaterialStep(event.target.value)} placeholder="RY-L01-S01" />
                </label>
                <label>
                  Название
                  <input value={uploadTitle} onChange={(event) => setUploadTitle(event.target.value)} placeholder="Название материала" />
                </label>
                <label>
                  Описание
                  <textarea value={uploadNotes} onChange={(event) => setUploadNotes(event.target.value)} rows={3} placeholder="notes / description" />
                </label>
              </div>
            )}

            <label className="clientPhotoPickerUploadDirectButton profileLiteUploadFileButton">
              <input type="file" accept="image/png,image/jpeg,image/webp,image/gif" disabled={isUploading} onChange={handleUpload} />
              {isUploading ? "Загружаю..." : "Загрузить фото"}
            </label>
          </div>
        )}

        {activeTab !== "upload" && <div className="clientPhotoPickerGrid profileLiteImagePickerGrid">
          {visibleImages.map((image) => {
            const displaySrc = image.displaySrc || "";
            const selected = selectedImageRef && (selectedImageRef === image.src || selectedImageRef === image.displaySrc);
            const signingError = image.signingError || "";
            const mediaSigningError = signingError
              || (!image.src && !displaySrc ? "empty image ref"
                : !isDisplayUrl(displaySrc) && image.src && !isStorageRef(image.src) ? "invalid image url"
                : !isDisplayUrl(displaySrc) && isStorageRef(image.src) ? "signed URL не создан — проверьте Storage/RLS"
                : "");
            return (
              <article className={`clientPhotoPickerCard profileLiteImagePickerCard${selected ? " active" : ""}`} key={image.id}>
                <button className="profileLiteImagePickerSelect" type="button" onClick={() => handleSelect(image)} disabled={isUploading}>
                  <span className={isDisplayUrl(displaySrc) ? "hasImage" : "needsSignedUrl"} style={imageStyle(displaySrc)}>
                    {!isDisplayUrl(displaySrc) && <em>{mediaSigningError || "Нет preview"}</em>}
                  </span>
                  <b>{image.label || "Изображение"}</b>
                  {image.meta && <small>{image.meta}</small>}
                  {mediaSigningError && <small className="profileLiteImagePickerDiagnostic">{mediaSigningError}</small>}
                </button>
                {image.kind === "client-photo" && onDelete && (
                  <button
                    className="savedImageDeleteButton"
                    type="button"
                    title="Удалить фото"
                    aria-label="Удалить фото из базы?"
                    onClick={() => onDelete({ ...image, id: image.photoId })}
                    disabled={isUploading}
                  >
                    x
                  </button>
                )}
              </article>
            );
          })}
          {visibleImages.length === 0 && (
            <div className="clientPhotoPickerEmpty">
              <b>В этой категории пока нет сохранённых изображений.</b>
              <p>Откройте вкладку «Загрузить фото».</p>
            </div>
          )}
        </div>}
      </section>
    </div>
  );
}
