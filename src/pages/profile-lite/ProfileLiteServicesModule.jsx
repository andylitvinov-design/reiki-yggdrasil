import React from "react";
import {
  SERVICE_FORMAT_OPTIONS,
  formatServicePrice,
  getServicePublicLinkState,
  groupServicesByStatus,
  serviceStatusText
} from "../../lib/profileServicesClient.js";

export default function ProfileLiteServicesModule({
  onFieldChange,
  onAddToFeed = () => {},
  onPublish,
  onSave,
  onServiceSelect,
  onStatusChange,
  serviceActionStatus = "idle",
  serviceForm,
  serviceMessage = "",
  shellChrome,
  services,
  servicesError,
  servicesStatus
}) {
  const groupedServices = groupServicesByStatus(services);
  const selectedServiceId = serviceForm?.id || "";
  const selectedCompositionId = serviceForm?.composition_id || "";
  const isSaving = serviceActionStatus === "loading";
  const canPublish = Boolean(selectedServiceId && selectedCompositionId);
  const canAddSelectedToFeed = Boolean(selectedServiceId && serviceForm?.status === "published");
  const serviceGroups = [
    ["draft", "Черновики"],
    ["published", "Опубликованные"],
    ["archived", "Архив"]
  ];

  return (
    <section className="profileLiteModule profileLiteServices mandalaWorkspace" aria-label="Услуги">
      <div className="mandalaHero">
        <div className="mandalaHeroSeal">◇</div>
        <div>
          <p className="cabinetEyebrow">Услуги</p>
          <h2>Каталог услуг</h2>
          <p>Публикуйте мандалы и рабочие форматы как услуги мастера, сохраняя связь с местами силы.</p>
        </div>
        <div className="mandalaHeroStats">
          <span><b>{services.length}</b> Услуги</span>
          <span><b>{servicesStatus}</b> Статус</span>
          <span><b>Lite</b> Shell</span>
        </div>
      </div>
      {shellChrome}
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
          <section className="chatPlaceholderWorkspace" aria-label="Менеджер услуг">
            <div className="chatPlaceholderHeader">
              <p className="cabinetEyebrow">Услуги</p>
              <h2>Менеджер услуг</h2>
              <span>Источник данных: profile_cabinet_services · публичный маршрут /services/:serviceId не подключён</span>
            </div>
            {servicesError && <div className="cabinetNotice cabinetSecondaryDataWarning">needs verification: {servicesError}</div>}
            {serviceMessage && <div className="cabinetNotice">{serviceMessage}</div>}
            <div className="profileLiteServiceList">
              {serviceGroups.map(([status, title]) => (
                <section className="profileLiteServiceGroup" key={status} aria-label={title}>
                  <div className="cabinetFormHeader">
                    <div>
                      <p className="cabinetEyebrow">{title}</p>
                      <h3>{title}</h3>
                    </div>
                    <span className="cabinetStatus">{groupedServices[status].length}</span>
                  </div>
                  {groupedServices[status].map((service) => (
                    <button
                      className={`materialCard profileLiteServiceCard ${selectedServiceId === service.id ? "active" : ""}`}
                      disabled={isSaving}
                      key={service.id || service.title}
                      onClick={() => onServiceSelect(service)}
                      type="button"
                    >
                      <div className="materialThumb">{serviceStatusText(service.status).slice(0, 1)}</div>
                      <div>
                        <h3>{service.title || "Без названия"}</h3>
                        <p>{service.description || "Описание не заполнено."}</p>
                        <small>{formatServicePrice(service)} · {serviceStatusText(service.status)}</small>
                        <p className="cabinetMuted">
                          {service.composition_id ? `composition_id: ${service.composition_id}` : "composition_id не привязан"}
                        </p>
                        <p className={status === "published" ? "cabinetSecondaryDataWarning" : "cabinetMuted"}>
                          {getServicePublicLinkState(service).message}
                        </p>
                      </div>
                    </button>
                  ))}
                  {groupedServices[status].length === 0 && <p>Нет записей в этом разделе.</p>}
                </section>
              ))}
              {servicesStatus === "success" && services.length === 0 && <p>Услуги пока не найдены.</p>}
            </div>
          </section>
        </div>

        <div className="workspaceRightColumn">
          <form className="cabinetCard" onSubmit={(event) => { event.preventDefault(); onSave("draft"); }}>
            <p className="cabinetEyebrow">Услуги</p>
            <h2>{selectedServiceId ? "Редактировать услугу" : "Создать черновик услуги"}</h2>
            <span className="cabinetStatus">{servicesStatus}</span>
            {selectedServiceId && <p className="cabinetMuted">Выбрана услуга: {selectedServiceId}</p>}
            <label>
              Название
              <input disabled={isSaving} value={serviceForm.title} onChange={(event) => onFieldChange("title", event.target.value)} placeholder="Мандала Места Силы" />
            </label>
            <label>
              Описание
              <textarea disabled={isSaving} value={serviceForm.description} onChange={(event) => onFieldChange("description", event.target.value)} rows={3} />
            </label>
            <div className="cabinetTwoColumns">
              <label>
                Цена
                <input disabled={isSaving} value={serviceForm.price_amount} onChange={(event) => onFieldChange("price_amount", event.target.value)} inputMode="decimal" placeholder="120" />
              </label>
              <label>
                Валюта
                <input disabled={isSaving} value={serviceForm.price_currency} onChange={(event) => onFieldChange("price_currency", event.target.value)} placeholder="EUR" />
              </label>
            </div>
            <label>
              Изображение
              <input disabled={isSaving} value={serviceForm.image_url} onChange={(event) => onFieldChange("image_url", event.target.value)} placeholder="https://... или storage ref" />
            </label>
            <fieldset className="cabinetCardInline">
              <legend>Форматы / delivery modes MVP</legend>
              {SERVICE_FORMAT_OPTIONS.map((option) => (
                <label className="cabinetCheckbox" key={option.value}>
                  <input
                    checked={(serviceForm.format_option || SERVICE_FORMAT_OPTIONS[0].value) === option.value}
                    disabled={isSaving}
                    name="service-format"
                    onChange={() => onFieldChange("format_option", option.value)}
                    type="radio"
                  />
                  {option.label}
                </label>
              ))}
              <p className="cabinetMuted">formats persistence: needs verification без миграции таблицы.</p>
            </fieldset>
            <div className="cabinetActions">
              <button className="cabinetPrimary" disabled={isSaving} type="submit">
                {isSaving ? "Сохраняем..." : "Сохранить черновик"}
              </button>
              <button className="cabinetSecondary" disabled={isSaving || !canPublish} type="button" onClick={onPublish}>Опубликовать</button>
              <button className="cabinetSecondary" disabled={isSaving || !selectedServiceId} type="button" onClick={() => onStatusChange("draft")}>Вернуть в черновик</button>
              <button className="cabinetSecondary" disabled={isSaving || !selectedServiceId} type="button" onClick={() => onStatusChange("archived")}>Архивировать</button>
              <button className="cabinetSecondary" disabled={isSaving || !canAddSelectedToFeed} type="button" onClick={() => onAddToFeed("service_created")}>Добавить в ленту</button>
              <button className="cabinetSecondary" disabled={isSaving || !canAddSelectedToFeed} type="button" onClick={() => onAddToFeed("service_updated")}>Опубликовать обновление</button>
            </div>
            {!canAddSelectedToFeed && <p className="cabinetMuted">В ленту можно отправить только выбранную опубликованную услугу.</p>}
            {!canPublish && <p className="cabinetMuted">Сначала выберите услугу с привязанной мандалой. Публикация без шаблона отключена.</p>}
            <p className="cabinetMuted">Активная кнопка copy link появится только после реализации рабочего маршрута /services/:serviceId.</p>
          </form>
        </div>
      </div>
    </section>
  );
}
