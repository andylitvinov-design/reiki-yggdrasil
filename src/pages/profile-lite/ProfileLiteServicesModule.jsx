import React, { useState } from "react";
import {
  SERVICE_FORMAT_OPTIONS,
  buildCompositionResultUrl,
  buildServicePublicUrl,
  formatServicePrice,
  getClientDisplayName,
  getServicePublicLinkState,
  groupServicesByStatus,
  orderStatusText,
  serviceStatusText
} from "../../lib/profileServicesClient.js";

export default function ProfileLiteServicesModule({
  onFieldChange,
  onAddToFeed = () => {},
  onPublish,
  onSave,
  onServiceSelect,
  onStatusChange,
  clientDirectory = [],
  selectedClient = null,
  selectedClientKey = "",
  onClientSelect = () => {},
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
  const [copiedResultUrl, setCopiedResultUrl] = useState("");
  const [clientPickerOpen, setClientPickerOpen] = useState(false);
  const [clientSearch, setClientSearch] = useState("");
  const serviceGroups = [
    ["draft", "Черновики"],
    ["published", "Опубликованные"],
    ["archived", "Архив"]
  ];
  const copyPublicLink = async (service) => {
    const url = buildServicePublicUrl(service, window.location.origin);
    if (!url) return;
    try {
      await navigator.clipboard?.writeText(url);
    } catch {
      window.prompt("Публичная ссылка для клиентов", url);
    }
  };
  const copyResultLink = async (url) => {
    if (!url) return;
    try {
      await navigator.clipboard?.writeText(url);
    } catch {
      window.prompt("Ссылка на мандалу", url);
    }
    setCopiedResultUrl(url);
  };
  const renderSentResultLink = (compositionId) => {
    const url = buildCompositionResultUrl(compositionId, window.location.origin);
    return (
      <div className="profileLiteClientResultLink">
        <p className="cabinetEyebrow">Отправленная мандала</p>
        {url ? (
          <>
            <small>Внутренняя ссылка на мандалу</small>
            <a href={url}>Ссылка на мандалу</a>
            <button className="cabinetSecondary" type="button" onClick={() => void copyResultLink(url)}>
              Скопировать ссылку
            </button>
            {copiedResultUrl === url && <p className="cabinetNotice">Ссылка скопирована</p>}
          </>
        ) : (
          <p className="cabinetMuted">Ссылка появится после отправки мандалы клиенту.</p>
        )}
      </div>
    );
  };
  const selectedClientDisplayName = selectedClient ? getClientDisplayName(selectedClient) : "Выберите клиента";
  const normalizedClientSearch = clientSearch.trim().toLocaleLowerCase("ru");
  const filteredClientDirectory = normalizedClientSearch
    ? clientDirectory.filter((client) => {
      const visibleText = [
        client.client_display_name,
        getClientDisplayName(client),
        client.client_display_note,
        client.orders?.length ? `${client.orders.length}` : "",
        client.clientWorks?.length ? `${client.clientWorks.length}` : ""
      ].filter(Boolean).join(" ").toLocaleLowerCase("ru");
      return visibleText.includes(normalizedClientSearch);
    })
    : clientDirectory;
  const handleClientPick = (key) => {
    onClientSelect(key);
    setClientPickerOpen(false);
    setClientSearch("");
  };

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
            {["Каталог услуг", "Клиенты", "Черновики", "Публикация", "Места силы"].map((item) => (
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
              <span>Управляйте черновиками, публикациями и клиентскими мандалами.</span>
            </div>
            {servicesError && <div className="cabinetNotice cabinetSecondaryDataWarning">needs verification: {servicesError}</div>}
            {serviceMessage && <div className="cabinetNotice">{serviceMessage}</div>}
            <section className="cabinetCard profileLiteClientDatabase" aria-label="Клиенты База клиентов">
              <div className="cabinetFormHeader">
                <div>
                  <p className="cabinetEyebrow">Клиенты</p>
                  <h3>База клиентов</h3>
                </div>
                <span className="cabinetStatus">{clientDirectory.length}</span>
              </div>
              <div className="profileLiteClientSelector">
                <span className="profileLiteClientSelectorLabel">Клиент</span>
                <button
                  aria-controls="profile-lite-client-options"
                  aria-expanded={clientPickerOpen}
                  className="profileLiteClientSelectorButton"
                  onClick={() => setClientPickerOpen((open) => !open)}
                  type="button"
                >
                  <span>{selectedClientDisplayName}</span>
                  <small>{selectedClient ? "Открыть список клиентов" : "Нажмите, чтобы выбрать"}</small>
                </button>
                {clientPickerOpen && (
                  <div className="profileLiteClientSelectorPanel" id="profile-lite-client-options">
                    {clientDirectory.length > 6 && (
                      <input
                        aria-label="Поиск клиента"
                        className="profileLiteClientSearch"
                        onChange={(event) => setClientSearch(event.target.value)}
                        placeholder="Найти клиента"
                        type="search"
                        value={clientSearch}
                      />
                    )}
                    <button
                      className={`profileLiteClientOption ${selectedClientKey === "" ? "active" : ""}`}
                      onClick={() => handleClientPick("")}
                      type="button"
                    >
                      <span>Все клиенты</span>
                      <small>Сбросить выбор</small>
                    </button>
                    {filteredClientDirectory.map((client) => {
                      const displayName = client.client_display_name || getClientDisplayName(client);
                      return (
                        <button
                          className={`profileLiteClientOption ${selectedClientKey === client.key ? "active" : ""}`}
                          key={client.key}
                          onClick={() => handleClientPick(client.key)}
                          type="button"
                        >
                          <span>{displayName}</span>
                          <small>
                            {client.client_display_note || `Заказы: ${client.orders.length} · Мандалы: ${client.clientWorks.length}`}
                          </small>
                        </button>
                      );
                    })}
                    {filteredClientDirectory.length === 0 && <p className="cabinetMuted">Клиенты пока не найдены.</p>}
                  </div>
                )}
              </div>
              {!selectedClient && <p className="cabinetMuted">Выберите клиента, чтобы увидеть его заказы и отправленные мандалы.</p>}
              {selectedClient && (
                <div className="profileLiteClientDatabaseBody">
                  <p className="cabinetMuted">
                    Заказы: {selectedClient.orders.length} · Активные: {selectedClient.orders.filter((order) => order.status !== "sent" && order.status !== "closed").length} · Отправлено: {selectedClient.orders.filter((order) => order.final_result_composition_id || order.status === "sent").length}
                  </p>
                  {selectedClient.orders.map((order) => (
                    <article className="materialCard profileLiteClientOrderCard" key={order.id}>
                      <div className="materialThumb">{orderStatusText(order.status).slice(0, 1)}</div>
                      <div>
                        <h4>{order.service?.title || "Услуга"}</h4>
                        <p>{order.request_text || "Запрос клиента не заполнен."}</p>
                        <small>{orderStatusText(order.status)} · {order.order_format}</small>
                        {order.final_result_composition_id ? renderSentResultLink(order.final_result_composition_id) : (
                          <p className="cabinetMuted">Ссылка появится после отправки мандалы клиенту.</p>
                        )}
                      </div>
                    </article>
                  ))}
                  {selectedClient.clientWorks.map((work) => (
                    <article className="materialCard profileLiteClientOrderCard" key={work.id}>
                      <div className="materialThumb">К</div>
                      <div>
                        <h4>{work.title}</h4>
                        <p>{work.request_text || "Комментарий / запрос клиента не заполнен."}</p>
                        <small>Сохранено для клиента</small>
                        {renderSentResultLink(work.result_composition_id)}
                      </div>
                    </article>
                  ))}
                  {selectedClient.orders.length === 0 && selectedClient.clientWorks.length === 0 && (
                    <p>Для этого клиента пока нет заказов.</p>
                  )}
                </div>
              )}
            </section>
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
                    <article
                      className={`materialCard profileLiteServiceCard ${selectedServiceId === service.id ? "active" : ""}`}
                      key={service.id || service.title}
                    >
                      <div className="materialThumb">{serviceStatusText(service.status).slice(0, 1)}</div>
                      <div>
                        <h3>{service.title || "Без названия"}</h3>
                        <p>{service.description || "Описание не заполнено."}</p>
                        <small>{formatServicePrice(service)} · {serviceStatusText(service.status)}</small>
                        <p className="cabinetMuted">
                          {service.composition_id ? `composition_id: ${service.composition_id}` : "composition_id не привязан"}
                        </p>
                        <p className={status === "published" ? "cabinetNotice" : "cabinetMuted"}>
                          {getServicePublicLinkState(service).message}
                        </p>
                        {getServicePublicLinkState(service).isActive && (
                          <button
                            className="cabinetSecondary"
                            disabled={isSaving}
                            onClick={() => void copyPublicLink(service)}
                            type="button"
                          >
                            Скопировать ссылку
                          </button>
                        )}
                        <button className="cabinetSecondary" disabled={isSaving} onClick={() => onServiceSelect(service)} type="button">
                          Редактировать
                        </button>
                      </div>
                    </article>
                  ))}
                  {groupedServices[status].length === 0 && <p>Нет записей в этом разделе.</p>}
                </section>
              ))}
              {servicesStatus === "success" && services.length === 0 && <p>Услуги пока не найдены.</p>}
            </div>
          </section>
        </div>

        <div className="workspaceRightColumn">
          <form className="cabinetCard profileLiteServiceEditorForm" onSubmit={(event) => { event.preventDefault(); onSave("draft"); }}>
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
            <p className="cabinetMuted">Публичная ссылка активна только для опубликованных услуг.</p>
          </form>
        </div>
      </div>
    </section>
  );
}
