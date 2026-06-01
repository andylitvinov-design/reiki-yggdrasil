import React from "react";
import { serviceStatusText } from "../../lib/profileServicesClient.js";

export default function ProfileLiteServicesModule({
  onFieldChange,
  onPublish,
  onSave,
  serviceForm,
  services,
  servicesError,
  servicesStatus
}) {
  return (
    <section className="profileLiteModule profileLiteServices" aria-label="Услуги">
      <div className="cabinetCard">
        <div className="cabinetFormHeader">
          <div>
            <p className="cabinetEyebrow">Услуги</p>
            <h2>Каталог услуг</h2>
          </div>
          <span className="cabinetStatus">{servicesStatus}</span>
        </div>
        {servicesError && <div className="cabinetNotice cabinetSecondaryDataWarning">needs verification: {servicesError}</div>}
        <div className="profileLiteServiceList">
          {services.map((service) => (
            <article className="materialCard" key={service.id || service.title}>
              <div className="materialThumb">{serviceStatusText(service.status).slice(0, 1)}</div>
              <div>
                <h3>{service.title || "Без названия"}</h3>
                <p>{service.description || "Описание не заполнено."}</p>
                <small>{service.price_amount || "0"} {service.price_currency || "EUR"} · {serviceStatusText(service.status)}</small>
              </div>
            </article>
          ))}
          {servicesStatus === "success" && services.length === 0 && <p>Услуги пока не найдены.</p>}
        </div>
      </div>

      <form className="cabinetCard" onSubmit={(event) => { event.preventDefault(); onSave("draft"); }}>
        <p className="cabinetEyebrow">Новая услуга</p>
        <h2>Опубликовать мандалу как услугу</h2>
        <label>
          Название
          <input value={serviceForm.title} onChange={(event) => onFieldChange("title", event.target.value)} placeholder="Мандала Места Силы" />
        </label>
        <label>
          Описание
          <textarea value={serviceForm.description} onChange={(event) => onFieldChange("description", event.target.value)} rows={3} />
        </label>
        <div className="cabinetTwoColumns">
          <label>
            Цена
            <input value={serviceForm.price_amount} onChange={(event) => onFieldChange("price_amount", event.target.value)} inputMode="decimal" placeholder="120" />
          </label>
          <label>
            Валюта
            <input value={serviceForm.price_currency} onChange={(event) => onFieldChange("price_currency", event.target.value)} placeholder="EUR" />
          </label>
        </div>
        <label>
          Изображение
          <input value={serviceForm.image_url} onChange={(event) => onFieldChange("image_url", event.target.value)} placeholder="https://... или storage ref" />
        </label>
        <div className="cabinetActions">
          <button className="cabinetPrimary" type="submit">Сохранить черновик</button>
          <button className="cabinetSecondary" type="button" onClick={onPublish}>Опубликовать</button>
        </div>
      </form>
    </section>
  );
}
