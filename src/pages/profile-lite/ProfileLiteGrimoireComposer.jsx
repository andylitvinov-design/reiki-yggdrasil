import React, { useState } from "react";
import { MATERIAL_TYPES } from "../../lib/profileMaterialsClient.js";

const DEFAULT_TYPE = "ri";

function filenamesLabel(files) {
  if (!files.length) return "Файлы не выбраны";
  if (files.length === 1) {
    const file = files[0];
    return `${file.name || "файл"}${file.size ? ` · ${Math.ceil(file.size / 1024)} KB` : ""}`;
  }
  return `Выбрано файлов: ${files.length}`;
}

export default function ProfileLiteGrimoireComposer({
  disabled = false,
  status = "idle",
  onCreate = async () => {},
  onShowUncategorized = () => {}
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState(DEFAULT_TYPE);
  const [files, setFiles] = useState([]);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const reset = () => {
    setTitle("");
    setDescription("");
    setType(DEFAULT_TYPE);
    setFiles([]);
  };

  const handleFileChange = (event) => {
    setFiles(Array.from(event.target.files || []));
    event.target.value = "";
    setMessage("");
  };

  const handleSubmit = async (forceUncategorized = false) => {
    if (disabled || submitting) return;
    if (!title.trim() && !description.trim() && !files.length) {
      setMessage("Добавьте текст, название или файл.");
      return;
    }

    setSubmitting(true);
    setMessage("Сохраняю в Гримуарий...");
    try {
      await onCreate({
        title,
        description,
        type: forceUncategorized ? "uncategorized" : type,
        files,
        forceUncategorized
      });
      reset();
      setMessage(forceUncategorized ? "Сохранено как неразобранное." : "Материал сохранён в Гримуарий.");
    } catch (error) {
      setMessage(String(error?.message || error || "Не удалось сохранить материал."));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="grimoireComposer" aria-label="Быстро добавить материал в Гримуарий">
      <div className="grimoireComposerHeader">
        <div className="grimoireComposerAvatar" aria-hidden="true">✦</div>
        <div>
          <p className="cabinetEyebrow">Мастерская</p>
          <h3>Что вы хотите добавить в мастерскую?</h3>
          <small>Сначала запись сохраняется как черновик. Позже её можно разобрать и отправить в ленту.</small>
        </div>
      </div>

      <label className="grimoireComposerField">
        <span>Название / тема</span>
        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Например: Мандала силы, заметка о практике, статья..."
          disabled={disabled || submitting}
        />
      </label>

      <label className="grimoireComposerField">
        <span>Заметка</span>
        <textarea
          rows={4}
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="Заметка, идея, описание мандалы, статья или материал..."
          disabled={disabled || submitting}
        />
      </label>

      <div className="grimoireComposerTools">
        <label className="grimoireComposerField compact">
          <span>Тип</span>
          <select value={type} onChange={(event) => setType(event.target.value)} disabled={disabled || submitting}>
            {MATERIAL_TYPES.map((item) => (
              <option key={item.value} value={item.value}>{item.label}</option>
            ))}
          </select>
        </label>

        <label className="grimoireComposerFile">
          <input
            type="file"
            multiple
            accept="image/jpeg,image/png,image/webp,image/gif,audio/mpeg,audio/mp4,audio/wav,audio/webm,audio/ogg,audio/aac,application/pdf,text/plain,text/markdown,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            onChange={handleFileChange}
            disabled={disabled || submitting}
          />
          <span>+ Фото / файлы</span>
          <small>{filenamesLabel(files)}</small>
        </label>
      </div>

      {files.length > 0 && (
        <ul className="grimoireComposerFiles" aria-label="Файлы для записи">
          {files.map((file) => (
            <li key={`${file.name}-${file.size}`}>{file.name}</li>
          ))}
        </ul>
      )}

      <div className="grimoireComposerActions">
        <button className="cabinetPrimary" type="button" onClick={() => handleSubmit(false)} disabled={disabled || submitting}>
          {submitting ? "Сохраняю..." : "Сохранить в Гримуарий"}
        </button>
        <button className="cabinetSecondary" type="button" onClick={() => handleSubmit(true)} disabled={disabled || submitting}>
          Сохранить как неразобранное
        </button>
        <button className="cabinetGhost" type="button" onClick={onShowUncategorized}>
          Показать неразобранное
        </button>
      </div>

      {message && <p className="grimoireComposerMessage">{message}</p>}
      {status === "needs-verification" && <small className="grimoireComposerWarning">Проверьте Supabase/RLS, если сохранение не сработало.</small>}
    </section>
  );
}
