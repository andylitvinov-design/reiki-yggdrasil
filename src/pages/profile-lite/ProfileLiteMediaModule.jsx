import React from "react";
import { mysteryTraditions } from "../../data/mysteryTraditions.js";

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
          <span><b>{mediaStatus}</b> Статус</span>
        </div>
      </div>
      {shellChrome}
      <div className="cabinetCard">
        <div className="cabinetFormHeader">
          <div>
            <p className="cabinetEyebrow">Фото / Медиа</p>
            <h2>Фото клиентов и цели</h2>
          </div>
          <span className="cabinetStatus">{mediaStatus}</span>
        </div>
        {mediaError && <div className="cabinetNotice cabinetSecondaryDataWarning">needs verification: {mediaError}</div>}
        <div className="profileLiteMediaGrid">
          {clientGoalPhotos.map((photo) => (
            <article className="profileLiteMediaCard" key={photo.id || photo.image_ref || photo.image_url}>
              <div className="profileLiteMediaThumb" style={photo.display_url || photo.image_url ? { backgroundImage: `url(${photo.display_url || photo.image_url})` } : undefined}>◎</div>
              <h3>{photo.title || "Фото клиента / цели"}</h3>
              <p>{photo.notes || "Без заметки"}</p>
              <button className="cabinetGhost" type="button" onClick={() => onClientPhotoDelete(photo)}>Удалить</button>
            </article>
          ))}
          {mediaStatus === "success" && clientGoalPhotos.length === 0 && <p>Фото клиентов пока не найдены.</p>}
        </div>
      </div>

      <form className="cabinetCard" onSubmit={(event) => { event.preventDefault(); onClientPhotoSave(); }}>
        <p className="cabinetEyebrow">Загрузить фото</p>
        <h2>Фото клиента / цели</h2>
        <label>
          Название
          <input value={clientPhotoForm.title} onChange={(event) => onClientPhotoFieldChange("title", event.target.value)} placeholder="Фото цели" />
        </label>
        <label>
          URL
          <input value={clientPhotoForm.image_url} onChange={(event) => onClientPhotoFieldChange("image_url", event.target.value)} placeholder="https://..." />
        </label>
        <label>
          Заметка
          <textarea value={clientPhotoForm.notes} onChange={(event) => onClientPhotoFieldChange("notes", event.target.value)} rows={2} />
        </label>
        <label className="profileLiteFileInput">
          <input type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={onClientPhotoFileChange} />
          {clientPhotoForm.file ? `Выбрано: ${clientPhotoForm.file.name}` : "Загрузить файл"}
        </label>
        <button className="cabinetPrimary" type="submit">Сохранить фото</button>
      </form>

      <form className="cabinetCard" onSubmit={(event) => { event.preventDefault(); onTraditionAssetSave(); }}>
        <p className="cabinetEyebrow">Медиа традиций</p>
        <h2>Образы для алтаря</h2>
        <label>
          Традиция
          <select value={traditionAssetForm.tradition_id} onChange={(event) => onTraditionAssetFieldChange("tradition_id", event.target.value)}>
            {mysteryTraditions.map((tradition) => <option key={tradition.id} value={tradition.id}>{tradition.title}</option>)}
          </select>
        </label>
        <label>
          Название
          <input value={traditionAssetForm.title} onChange={(event) => onTraditionAssetFieldChange("title", event.target.value)} placeholder="Образ традиции" />
        </label>
        <label>
          URL
          <input value={traditionAssetForm.image_url} onChange={(event) => onTraditionAssetFieldChange("image_url", event.target.value)} placeholder="https://..." />
        </label>
        <label className="profileLiteFileInput">
          <input type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={onTraditionAssetFileChange} />
          {traditionAssetForm.file ? `Выбрано: ${traditionAssetForm.file.name}` : "Загрузить файл"}
        </label>
        <button className="cabinetPrimary" type="submit">Сохранить образ</button>
        <div className="profileLiteMediaGrid">
          {traditionAssets.map((asset) => (
            <article className="profileLiteMediaCard" key={asset.id || asset.image_ref || asset.image_url}>
              <div className="profileLiteMediaThumb" style={asset.display_url || asset.image_url ? { backgroundImage: `url(${asset.display_url || asset.image_url})` } : undefined}>◎</div>
              <h3>{asset.title || "Образ традиции"}</h3>
              <p>{asset.tradition_title || asset.tradition_id}</p>
            </article>
          ))}
        </div>
      </form>
    </section>
  );
}
