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
    <section className="profileLiteModule profileLiteServices mandalaWorkspace" aria-label="Услуги">
      <div className="workspaceMainColumns profileLiteLegacyColumns">
        <aside className="mandalaModeSidebar">
          <p className="cabinetEyebrow">Рабочий режим</p>
          <h3>Услуги</h3>
          <div className="chatModeNav" aria-label="Статические разделы услуг">
            {["Каталог услуг", "Черновики", "Публикация", "Места силы"].map((item) => (
              <button className={item === "Каталог услуг" ? "active" : ""} key={item} type="button">
                <span>{item}</span>
                <small>Profile Lite</small>
              </button>
            ))}
          </div>
        </aside>

        <div className="workspaceCenterColumn">
          <section className="chatPlaceholderWorkspace" aria-label="Диагностика модуля услуг">
            <div className="chatPlaceholderHeader">
              <p className="cabinetEyebrow">Услуги</p>
              <h2>Каталог услуг</h2>
              <span>Источник данных: profile_cabinet_services · stable auth shell</span>
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
          </section>
        </div>

        <div className="workspaceRightColumn">
          <form className="cabinetCard" onSubmit={(event) => { event.preventDefault(); onSave("draft"); }}>
            <p className="cabinetEyebrow">Услуги</p>
            <h2>Опубликовать мандалу как услугу</h2>
            <span className="cabinetStatus">{servicesStatus}</span>
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
        </div>
      </div>
    </section>
  );
}
