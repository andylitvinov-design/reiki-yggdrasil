import React, { useState } from "react";
import {
  createDefaultTaxonomy,
  grimoireTaxonomyCompactLabel,
  grimoireTaxonomyLevelOptions,
  TAXONOMY_UNCLASSIFIED
} from "../../lib/profileMaterialsClient.js";

const DEFAULT_TAXONOMY = createDefaultTaxonomy();

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
  const [description, setDescription] = useState("");
  const [taxonomy, setTaxonomy] = useState(DEFAULT_TAXONOMY);
  const [files, setFiles] = useState([]);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const reset = () => {
    setDescription("");
    setTaxonomy(DEFAULT_TAXONOMY);
    setFiles([]);
  };

  const handleFileChange = (event) => {
    setFiles(Array.from(event.target.files || []));
    event.target.value = "";
    setMessage("");
  };

  const handleSubmit = async (forceUncategorized = false) => {
    if (disabled || submitting) return;
    if (!description.trim() && !files.length) {
      setMessage("Добавьте заметку или файл.");
      return;
    }

    setSubmitting(true);
    setMessage("Сохраняю в Гримуарий...");
    try {
      await onCreate({
        description,
        taxonomy: forceUncategorized ? createDefaultTaxonomy() : taxonomy,
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

  const level1Options = grimoireTaxonomyLevelOptions(1);
  const level2Options = grimoireTaxonomyLevelOptions(2, taxonomy);
  const level3Options = grimoireTaxonomyLevelOptions(3, taxonomy);
  const taxonomySummary = grimoireTaxonomyCompactLabel(taxonomy) || "Неразобранно";

  const handleTaxonomyChange = (level, value) => {
    setMessage("");
    setTaxonomy((current) => {
      if (level === "level1") {
        return createDefaultTaxonomy({ level1: value, level2: TAXONOMY_UNCLASSIFIED, level3: TAXONOMY_UNCLASSIFIED });
      }
      if (level === "level2") {
        return createDefaultTaxonomy({ ...current, level2: value, level3: TAXONOMY_UNCLASSIFIED });
      }
      return createDefaultTaxonomy({ ...current, level3: value });
    });
  };

  const chooseRootTaxonomy = (value) => {
    handleTaxonomyChange("level1", value);
  };

  return (
    <section className="grimoireComposer" aria-label="Быстро добавить материал в Гримуарий">
      <div className="grimoireComposerHeader">
        <div className="grimoireComposerAvatar" aria-hidden="true">✦</div>
        <div className="grimoireComposerIntro">
          <p className="cabinetEyebrow">Мастерская</p>
          <h3>Что хотите добавить?</h3>
        </div>
      </div>

      <label className="grimoireComposerField">
        <textarea
          rows={3}
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="Поделитесь заметкой, практикой, описанием мандалы..."
          disabled={disabled || submitting}
        />
      </label>

      <div className="grimoireComposerTools">
        <div className="grimoireComposerTaxonomy">
          <div className="grimoireComposerGroupPills" role="tablist" aria-label="Группа материалов">
            {level1Options.map((item) => (
              <button
                key={item.value}
                className={taxonomy.level1 === item.value ? "active" : ""}
                type="button"
                role="tab"
                aria-selected={taxonomy.level1 === item.value}
                onClick={() => chooseRootTaxonomy(item.value)}
                disabled={disabled || submitting}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="grimoireComposerTaxonomyPanel">
            <div className="grimoireComposerTaxonomySummary">
              <span>Выбрано</span>
              <b>{taxonomySummary}</b>
            </div>

            <label className="grimoireComposerField compact">
              <span>Категория</span>
              <select value={taxonomy.level2} onChange={(event) => handleTaxonomyChange("level2", event.target.value)} disabled={disabled || submitting}>
                {level2Options.map((item) => (
                  <option key={item.value} value={item.value}>{item.label}</option>
                ))}
              </select>
            </label>

            <label className="grimoireComposerField compact">
              <span>Подкатегория / ступень</span>
              <select value={taxonomy.level3} onChange={(event) => handleTaxonomyChange("level3", event.target.value)} disabled={disabled || submitting}>
                {level3Options.map((item) => (
                  <option key={item.value} value={item.value}>{item.label}</option>
                ))}
              </select>
            </label>
          </div>
        </div>

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
