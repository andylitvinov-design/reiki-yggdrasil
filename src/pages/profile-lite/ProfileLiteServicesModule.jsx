import React, { useEffect, useState } from "react";
import {
  SERVICE_FORMAT_OPTIONS,
  buildCompositionResultUrl,
  buildServicePublicUrl,
  clientMandalaStatusText,
  formatServicePrice,
  getClientDisplayName,
  getClientMandalaPreviewState,
  getServicePublicLinkState,
  groupServicesByStatus,
  serviceStatusText
} from "../../lib/profileServicesClient.js";

function clientMandalaResultId(item = {}) {
  return item.final_result_composition_id || item.result_composition_id || "";
}

function ClientMandalaPreview({ item, title }) {
  const preview = getClientMandalaPreviewState(item);
  return (
    <div className={`profileLiteMandalaPreview${preview.src ? " hasImage" : ""}`}>
      {preview.src ? (
        <img alt={`Превью мандалы: ${title || "мандала"}`} src={preview.src} />
      ) : (
        <span>{preview.message}</span>
      )}
    </div>
  );
}

function serviceUiStatusText(status) {
  return ({
    idle: "Готово",
    loading: "Загрузка",
    success: "Сохранено",
    error: "Нужно проверить",
    "needs-verification": "Нужно проверить"
  })[status] || "Готово";
}

export default function ProfileLiteServicesModule({
  activeView = "services",
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
  const isClientsView = activeView === "clients";
  const groupedServices = groupServicesByStatus(services);
  const selectedServiceId = serviceForm?.id || "";
  const selectedCompositionId = serviceForm?.composition_id || "";
  const isSaving = serviceActionStatus === "loading";
  const canPublish = Boolean(selectedServiceId && selectedCompositionId);
  const canAddSelectedToFeed = Boolean(selectedServiceId && serviceForm?.status === "published");
  const [copiedResultUrl, setCopiedResultUrl] = useState("");
  const [clientPickerOpen, setClientPickerOpen] = useState(false);
  const [clientSearch, setClientSearch] = useState("");
  const [clientMaterialFilter, setClientMaterialFilter] = useState("all");
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const serviceGroups = [
    ["draft", "Черновики"],
    ["published", "Опубликованные"],
    ["archived", "Архив"]
  ];
  const hasClients = clientDirectory.length > 0;
  const effectiveSelectedClient = selectedClient || clientDirectory[0] || null;
  const selectedClientDisplayName = effectiveSelectedClient ? getClientDisplayName(effectiveSelectedClient) : "Выберите клиента";
  const selectedClientOrders = effectiveSelectedClient?.orders || [];
  const selectedClientWorks = effectiveSelectedClient?.clientWorks || [];
  const selectedClientMaterials = [
    ...selectedClientOrders.map((item) => ({ type: "order", item })),
    ...selectedClientWorks.map((item) => ({ type: "saved", item }))
  ];
  const readyCount = selectedClientOrders.filter((order) => order.status === "ready_for_review").length;
  const sentCount = selectedClientOrders.filter((order) => order.final_result_composition_id || order.status === "sent" || order.status === "closed").length;
  const filteredClientMaterials = selectedClientMaterials.filter(({ type, item }) => {
    if (clientMaterialFilter === "saved") return type === "saved";
    if (clientMaterialFilter === "ready") return item.status === "ready_for_review";
    if (clientMaterialFilter === "sent") return item.final_result_composition_id || item.status === "sent" || item.status === "closed";
    return true;
  });
  const statusLabel = serviceUiStatusText(servicesStatus);
  const actionStatusLabel = serviceUiStatusText(serviceActionStatus);

  useEffect(() => {
    if (selectedServiceId) setIsEditorOpen(true);
  }, [selectedServiceId]);

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
  const renderMandalaActions = (compositionId) => {
    const url = buildCompositionResultUrl(compositionId, window.location.origin);
    return (
      <div className="profileLiteClientResultActions">
        {url ? (
          <>
            <a className="cabinetPrimary profileLiteMandalaOpenLink" href={url}>
              Открыть мандалу
            </a>
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
  const renderClientMandalaCard = ({ item, title, subtitle, description, meta, key }) => {
    const statusLabel = clientMandalaStatusText(item.status);
    const compositionId = clientMandalaResultId(item);
    return (
      <article className="materialCard profileLiteClientOrderCard profileLiteClientMandalaCard" key={key}>
        <ClientMandalaPreview item={item} title={title} />
        <div className="profileLiteClientMandalaBody">
          <div className="profileLiteClientMandalaHeader">
            <div>
              <h4>{title}</h4>
              <p>{subtitle}</p>
            </div>
            <span className="cabinetStatus">{statusLabel}</span>
          </div>
          <p>{description}</p>
          {meta && <small>{meta}</small>}
          {renderMandalaActions(compositionId)}
        </div>
      </article>
    );
  };
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
  const handleServiceEdit = (service) => {
    setIsEditorOpen(true);
    onServiceSelect(service);
  };
  const openNewServiceEditor = () => {
    setIsEditorOpen(true);
  };
  const renderClientWorkspace = () => (
    <section className="cabinetCard profileLiteClientDatabase profileLiteClientWorkspace" aria-label="Клиенты и материалы клиента">
      <div className="cabinetFormHeader">
        <div>
          <p className="cabinetEyebrow">Клиенты</p>
          <h3>База клиентов и материалы клиента</h3>
        </div>
        <span className="cabinetStatus">{hasClients ? `${clientDirectory.length} клиентов` : "Пусто"}</span>
      </div>

      {!hasClients ? (
        <div className="profileLiteClientEmptyState">
          <h4>Клиентов пока нет</h4>
          <p>
            Клиенты появятся, когда вы сохраните мандалу через "Сохранить для клиента" или когда клиент оформит заказ.
          </p>
          <div className="cabinetActions">
            <a className="cabinetPrimary" href="/profile/mandalas">Открыть Места силы</a>
            <a className="cabinetSecondary" href="/profile/services">Открыть услуги</a>
          </div>
        </div>
      ) : (
        <>
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
              <small>Заказы и мандалы клиента</small>
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
                {filteredClientDirectory.map((client) => {
                  const displayName = client.client_display_name || getClientDisplayName(client);
                  const isActive = (selectedClientKey && selectedClientKey === client.key) || (!selectedClientKey && effectiveSelectedClient?.key === client.key);
                  return (
                    <button
                      className={`profileLiteClientOption ${isActive ? "active" : ""}`}
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
                {filteredClientDirectory.length === 0 && <p className="cabinetMuted">Клиенты по этому запросу не найдены.</p>}
              </div>
            )}
          </div>

          <div className="profileLiteClientSummaryGrid" aria-label="Сводка клиента">
            <span><b>{selectedClientOrders.length}</b> Заказы</span>
            <span><b>{selectedClientWorks.length}</b> Сохранено</span>
            <span><b>{readyCount}</b> Готово</span>
            <span><b>{sentCount}</b> Отправлено</span>
          </div>

          <div className="profileLiteMaterialFilters" aria-label="Фильтр материалов клиента">
            {[
              ["all", "Все"],
              ["saved", "Сохранённые"],
              ["ready", "Готовые"],
              ["sent", "Отправленные"]
            ].map(([value, label]) => (
              <button
                className={clientMaterialFilter === value ? "active" : ""}
                key={value}
                onClick={() => setClientMaterialFilter(value)}
                type="button"
              >
                {label}
              </button>
            ))}
          </div>

          <div className="profileLiteClientDatabaseBody">
            {filteredClientMaterials.map(({ type, item }) => renderClientMandalaCard({
              item,
              title: type === "order" ? item.service?.title || "Мандала клиента" : item.title || "Сохранённая мандала",
              subtitle: `Клиент: ${selectedClientDisplayName}`,
              description: item.request_text || (type === "order" ? "Запрос клиента не заполнен." : "Комментарий / запрос клиента не заполнен."),
              meta: type === "order" ? item.order_format : "Сохранённая работа клиента",
              key: `${type}-${item.id}`
            }))}
            {filteredClientMaterials.length === 0 && (
              <p className="cabinetMuted">В этом разделе пока нет материалов клиента.</p>
            )}
          </div>
        </>
      )}
    </section>
  );
  const renderServiceGroups = () => (
    <div className="profileLiteSecondaryServices">
      <div className="cabinetFormHeader">
        <div>
          <p className="cabinetEyebrow">Услуги</p>
          <h3>Черновики и публикации</h3>
        </div>
        <button className="cabinetSecondary profileLiteEditorToggle" type="button" onClick={openNewServiceEditor}>
          Создать услугу
        </button>
      </div>
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
                  <p className={status === "published" ? "cabinetNotice" : "cabinetMuted"}>
                    {getServicePublicLinkState(service).message}
                  </p>
                  <div className="cabinetActions">
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
                    <button className="cabinetSecondary" disabled={isSaving} onClick={() => handleServiceEdit(service)} type="button">
                      Редактировать
                    </button>
                  </div>
                </div>
              </article>
            ))}
            {groupedServices[status].length === 0 && <p>Нет записей в этом разделе.</p>}
          </section>
        ))}
        {servicesStatus === "success" && services.length === 0 && <p>Услуги пока не найдены.</p>}
      </div>
    </div>
  );
  const renderEditor = () => (
    <form className="cabinetCard profileLiteServiceEditorForm" onSubmit={(event) => { event.preventDefault(); onSave("draft"); }}>
      <div className="cabinetFormHeader">
        <div>
          <p className="cabinetEyebrow">Услуги</p>
          <h2>{selectedServiceId ? "Редактировать услугу" : "Создать черновик услуги"}</h2>
        </div>
        <span className="cabinetStatus">{actionStatusLabel}</span>
      </div>
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
      <fieldset className="profileLiteFormatCards">
        <legend>Формат результата</legend>
        {SERVICE_FORMAT_OPTIONS.map((option) => (
          <label className="profileLiteFormatOption" key={option.value}>
            <input
              checked={(serviceForm.format_option || SERVICE_FORMAT_OPTIONS[0].value) === option.value}
              disabled={isSaving}
              name="service-format"
              onChange={() => onFieldChange("format_option", option.value)}
              type="radio"
            />
            <span>{option.label}</span>
          </label>
        ))}
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
        <button className="cabinetSecondary" type="button" onClick={() => setIsEditorOpen(false)}>Закрыть</button>
      </div>
      {!canAddSelectedToFeed && <p className="cabinetMuted">В ленту можно отправить только выбранную опубликованную услугу.</p>}
      {!canPublish && <p className="cabinetMuted">Сначала выберите услугу с привязанной мандалой. Публикация без шаблона отключена.</p>}
      <p className="cabinetMuted">Публичная ссылка активна только для опубликованных услуг.</p>
    </form>
  );

  return (
    <section className={`profileLiteModule profileLiteServices mandalaWorkspace ${isClientsView ? "profileLiteClientsView" : "profileLiteServicesView"}`} aria-label={isClientsView ? "Клиенты" : "Услуги"}>
      <div className="mandalaHero">
        <div className="mandalaHeroSeal">◇</div>
        <div>
          <p className="cabinetEyebrow">{isClientsView ? "Клиенты" : "Услуги"}</p>
          <h2>{isClientsView ? "Клиентская база" : "Каталог услуг"}</h2>
          <p>
            {isClientsView
              ? "Фильтр по клиентам, сохранённые материалы и мандалы клиента."
              : "Шаблонные услуги, черновики, редактор и публикации из сохранённых мандал."}
          </p>
        </div>
        <div className="mandalaHeroStats">
          <span><b>{isClientsView ? clientDirectory.length : services.length}</b> {isClientsView ? "Клиенты" : "Услуги"}</span>
          <span><b>{isClientsView ? selectedClientMaterials.length : groupedServices.draft.length}</b> {isClientsView ? "Материалы" : "Черновики"}</span>
          <span><b>{statusLabel}</b> Статус</span>
        </div>
      </div>
      {shellChrome}
      <div className={`workspaceMainColumns profileLiteLegacyColumns ${isClientsView ? "profileLiteClientsColumns" : "profileLiteServicesColumns"}`}>
        <div className="workspaceCenterColumn">
          <section className="chatPlaceholderWorkspace" aria-label={isClientsView ? "Клиенты и материалы" : "Шаблоны услуг"}>
            <div className="chatPlaceholderHeader">
              <p className="cabinetEyebrow">{isClientsView ? "Клиенты" : "Услуги"}</p>
              <h2>{isClientsView ? "Клиенты и материалы" : "Шаблоны, черновики и публикации"}</h2>
              <span>
                {isClientsView
                  ? "Клиентская база, фильтр и сохранённые мандалы клиента."
                  : "Создавайте услугу из сохранённой или отправленной мандалы."}
              </span>
            </div>
            {servicesError && <div className="cabinetNotice cabinetSecondaryDataWarning">Нужно проверить данные услуг: {servicesError}</div>}
            {serviceMessage && <div className="cabinetNotice">{serviceMessage}</div>}
            {isClientsView ? renderClientWorkspace() : renderServiceGroups()}
          </section>
        </div>

        {!isClientsView && (
          <div className="workspaceRightColumn">
            {!isEditorOpen ? (
              <div className="cabinetCard profileLiteEditorClosedCard">
                <p className="cabinetEyebrow">Редактор</p>
                <h2>Редактор услуги скрыт</h2>
                <p>Откройте форму только когда нужно создать или отредактировать услугу.</p>
                <button className="cabinetPrimary profileLiteEditorToggle" type="button" onClick={openNewServiceEditor}>
                  Создать услугу
                </button>
              </div>
            ) : renderEditor()}
          </div>
        )}
      </div>
    </section>
  );
}
