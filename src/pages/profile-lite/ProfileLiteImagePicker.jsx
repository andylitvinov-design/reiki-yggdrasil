import React, { useState } from "react";

function isRenderableImage(value) {
  return Boolean(value && (/^https?:\/\//.test(value) || value.startsWith("data:image/")));
}

function imageStyle(value) {
  return isRenderableImage(value) ? { backgroundImage: `url(${value})` } : undefined;
}

function pickerTitle(mode, selectedLabel = "") {
  if (mode === "center") return "Выбрать центральное изображение";
  if (mode === "cover") return "Выбрать фон";
  return "Выбрать изображение объекта";
}

function pickerEyebrow(mode, selectedLabel = "") {
  if (mode === "center") return "Центр мандалы";
  if (mode === "cover") return "Фон Места Силы";
  return selectedLabel || "Объект мандалы";
}

export default function ProfileLiteImagePicker({
  mode,
  images = [],
  limitText = "",
  selectedLabel = "",
  onClose,
  onDelete,
  onSelect,
  onUpload
}) {
  const [uploadStatus, setUploadStatus] = useState("idle");
  const [uploadError, setUploadError] = useState("");

  const handleUpload = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setUploadStatus("loading");
    setUploadError("");
    try {
      const result = await onUpload?.(file);
      if (result === false) {
        setUploadStatus("error");
        setUploadError("Загрузка не завершилась. Проверьте сообщение модуля выше.");
        return;
      }
      setUploadStatus("success");
      onClose?.();
    } catch (error) {
      setUploadStatus("error");
      setUploadError(error?.message || "Не удалось загрузить изображение.");
    }
  };

  return (
    <div className="clientPhotoPickerBackdrop" onMouseDown={(event) => {
      if (event.target === event.currentTarget) onClose?.();
    }}>
      <section className="clientPhotoPickerModal profileLiteImagePicker" role="dialog" aria-modal="true" aria-labelledby="profileLiteImagePickerTitle">
        <div className="clientPhotoPickerHeader">
          <div>
            <p className="cabinetEyebrow">{pickerEyebrow(mode, selectedLabel)}</p>
            <h2 id="profileLiteImagePickerTitle">{pickerTitle(mode, selectedLabel)}</h2>
            <small>Выберите сохранённый образ из базы или загрузите новый файл.</small>
          </div>
          <button type="button" onClick={onClose} aria-label="Закрыть выбор изображения">×</button>
        </div>

        <div className="clientPhotoPickerModeTabs profileLiteImagePickerMode" role="tablist" aria-label="Режим выбора фото">
          <button className="active" type="button">Сохранённые фото</button>
          <label className={`clientPhotoPickerUploadDirectButton${uploadStatus === "loading" ? " isLoading" : ""}`}>
            <input type="file" accept="image/png,image/jpeg,image/webp,image/gif" disabled={uploadStatus === "loading"} onChange={handleUpload} />
            {uploadStatus === "loading" ? "Загружаю..." : "Загрузить новое фото"}
          </label>
        </div>

        {uploadError && <div className="cabinetNotice cabinetSecondaryDataWarning">{uploadError}</div>}

        <div className="clientPhotoPickerGrid profileLiteImagePickerGrid">
          {images.map((item) => {
            const displaySrc = item.displaySrc || item.display_url || item.signed_url || item.image_url || "";
            const canRender = isRenderableImage(displaySrc);
            return (
              <button className="clientPhotoPickerCard profileLiteImagePickerCard" key={item.id} onClick={() => onSelect?.(item)} type="button">
                <span className={canRender ? "hasImage" : "needsSignedUrl"} style={imageStyle(displaySrc)}>
                  {!canRender && <small>Нужна signed URL</small>}
                </span>
                <b>{item.label || item.title || "Без названия"}</b>
                {(item.meta || item.kind) && <small>{item.meta || item.kind}</small>}
                {item.kind === "client-photo" && onDelete && (
                  <span
                    className="savedImageDeleteButton"
                    role="button"
                    tabIndex={0}
                    title="Удалить фото"
                    aria-label="Удалить фото из базы"
                    onClick={(event) => {
                      event.stopPropagation();
                      onDelete(item);
                    }}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        event.stopPropagation();
                        onDelete(item);
                      }
                    }}
                  >
                    ×
                  </span>
                )}
              </button>
            );
          })}
          {images.length === 0 && (
            <div className="clientPhotoPickerEmpty">
              <b>В этой категории пока нет сохранённых изображений.</b>
              <p>Нажмите «Загрузить новое фото».</p>
            </div>
          )}
        </div>

        {limitText && <p className="powerPlanNote">{limitText}</p>}
      </section>
    </div>
  );
}
