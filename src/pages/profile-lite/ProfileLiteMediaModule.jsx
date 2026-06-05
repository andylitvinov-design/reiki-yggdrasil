import React, { useMemo, useState } from "react";
import { mysteryTraditions } from "../../data/mysteryTraditions.js";
import { reikiLevels } from "../../data/reikiKnowledgeBase.js";
import { sourcedStepSettings } from "../../data/reikiStepSettings.js";

const MATERIAL_GROUPS = [
  { value: "", label: "Все группы" },
  { value: "dao-ri", label: "ДАО РИ" },
  { value: "god-channels", label: "Мистерии" },
  { value: "channels", label: "Каналы" },
  { value: "form", label: "Форма" }
];

const MATERIAL_TYPES = [
  { value: "mandala", label: "Мандала" },
  { value: "artifact", label: "Артефакт" },
  { value: "practice", label: "Практика" }
];

const materialStepOptions = reikiLevels.flatMap((level) =>
  level.steps.map((step) => ({
    id: step.id,
    title: step.title,
    levelName: level.name,
    label: `${level.id}. ${level.name} · ${level.stepLabel} ${step.number}: ${step.title}`,
    settings: sourcedStepSettings[step.id] || step.settings || []
  }))
);

export default function ProfileLiteMediaModule({
  clientGoalPhotos,
  mediaError,
  mediaStatus,
  onClientPhotoDelete,
  onClientPhotoFieldChange,
  onClientPhotoFileChange,
  onClientPhotoSave,
  onTraditionAssetFieldChange,
  onTraditionAssetFileChange,
  onTraditionAssetSave,
  traditionAssetForm,
  traditionAssets,
  clientPhotoForm,
  shellChrome
}) {
  const [filterGroup, setFilterGroup] = useState("");
  const [filterStepId, setFilterStepId] = useState("");
  const [filterSettingTitle, setFilterSettingTitle] = useState("");

  const activeFilterStep = useMemo(
    () => materialStepOptions.find((s) => s.id === filterStepId) || null,
    [filterStepId]
  );
  const filterSettings = activeFilterStep?.settings || [];

  // UI-only filter: photos without metadata are never hidden aggressively
  const filteredPhotos = useMemo(() => {
    if (!filterGroup && !filterStepId && !filterSettingTitle) return clientGoalPhotos;
    return clientGoalPhotos.filter((photo) => {
      if (filterGroup && photo.material_group && photo.material_group !== filterGroup) return false;
      if (filterStepId && photo.step_id && photo.step_id !== filterStepId) return false;
      if (filterSettingTitle && photo.setting_title && photo.setting_title !== filterSettingTitle) return false;
      return true;
    });
  }, [clientGoalPhotos, filterGroup, filterStepId, filterSettingTitle]);

  const formError = mediaStatus === "needs-verification" ? mediaError : "";

  return (
    <section className="profileLiteModule profileLiteMediaModule mandalaWorkspace" aria-label="Фото / Медиа">
      <div className="mandalaHero">
        <div className="mandalaHeroSeal">◌</div>
        <div>
          <p className="cabinetEyebrow">Фото / Медиа</p>
          <h2>Медиа мастерской</h2>
          <p>Загружайте фото клиентов, цели и образы традиций для мандал, алтаря и материалов.</p>
        </div>
        <div className="mandalaHeroStats">
          <span><b>{clientGoalPhotos.length}</b> Фото</span>
          <span><b>{traditionAssets.length}</b> Традиции</span>
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
                  setFilterStepId("");
                  setFilterSettingTitle("");
                }}
              >
                {MATERIAL_GROUPS.map((g) => (
                  <option key={g.value} value={g.value}>{g.label}</option>
                ))}
              </select>
            </div>
            <div className="profileLiteMediaFilterField">
              <label htmlFor="mediaFilterStep">Категория</label>
              <select
                id="mediaFilterStep"
                value={filterStepId}
                onChange={(event) => {
                  setFilterStepId(event.target.value);
                  setFilterSettingTitle("");
                }}
              >
                <option value="">Все</option>
                {materialStepOptions.map((s) => (
                  <option key={s.id} value={s.id}>{s.label}</option>
                ))}
              </select>
            </div>
            <div className="profileLiteMediaFilterField">
              <label htmlFor="mediaFilterSetting">Подкатегория</label>
              <select
                id="mediaFilterSetting"
                value={filterSettingTitle}
                onChange={(event) => setFilterSettingTitle(event.target.value)}
                disabled={!filterStepId}
              >
                <option value="">Все</option>
                {filterSettings.map((s) => (
                  <option key={s.title} value={s.title}>{s.title}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="cabinetCard">
            <div className="cabinetFormHeader">
              <div>
                <p className="cabinetEyebrow">Фото / Медиа</p>
                <h2>Фото клиентов и цели</h2>
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

        {/* Right column: upload form, always open */}
        <div className="profileLiteMediaUploadPanel">
          <form
            className="cabinetCard"
            onSubmit={(event) => {
              event.preventDefault();
              onClientPhotoSave();
            }}
          >
            <p className="cabinetEyebrow">Загрузить фото</p>
            <h2>Фото клиента / цели</h2>
            {formError && (
              <div
                className="cabinetNotice cabinetSecondaryDataWarning profileLiteMediaFormError"
                role="alert"
              >
                {formError}
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
        </div>
      </div>

      <form
        className="cabinetCard"
        onSubmit={(event) => {
          event.preventDefault();
          onTraditionAssetSave();
        }}
      >
        <p className="cabinetEyebrow">Медиа традиций</p>
        <h2>Образы для алтаря</h2>
        <label>
          Традиция
          <select
            value={traditionAssetForm.tradition_id}
            onChange={(event) => onTraditionAssetFieldChange("tradition_id", event.target.value)}
          >
            {mysteryTraditions.map((tradition) => (
              <option key={tradition.id} value={tradition.id}>{tradition.title}</option>
            ))}
          </select>
        </label>
        <label>
          Название
          <input
            value={traditionAssetForm.title}
            onChange={(event) => onTraditionAssetFieldChange("title", event.target.value)}
            placeholder="Образ традиции"
          />
        </label>
        <label>
          URL
          <input
            value={traditionAssetForm.image_url}
            onChange={(event) => onTraditionAssetFieldChange("image_url", event.target.value)}
            placeholder="https://..."
          />
        </label>
        <label className="profileLiteFileInput">
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            onChange={onTraditionAssetFileChange}
          />
          {traditionAssetForm.file ? `Выбрано: ${traditionAssetForm.file.name}` : "Загрузить файл"}
        </label>
        <button className="cabinetPrimary" type="submit">Сохранить образ</button>
        <div className="profileLiteMediaGrid">
          {traditionAssets.map((asset) => (
            <article className="profileLiteMediaCard" key={asset.id || asset.image_ref || asset.image_url}>
              <div
                className="profileLiteMediaThumb"
                style={
                  asset.display_url || asset.image_url
                    ? { backgroundImage: `url(${asset.display_url || asset.image_url})` }
                    : undefined
                }
              >
                ◎
              </div>
              <h3>{asset.title || "Образ традиции"}</h3>
              <p>{asset.tradition_title || asset.tradition_id}</p>
            </article>
          ))}
        </div>
      </form>
    </section>
  );
}
