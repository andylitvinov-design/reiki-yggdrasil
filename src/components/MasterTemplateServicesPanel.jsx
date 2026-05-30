import React, { useEffect, useMemo, useState } from "react";
import {
  createEmptyServiceForm,
  createOwnService,
  deliveryModeText,
  listOwnServiceOrders,
  listOwnServices,
  orderStatusText,
  priceForDeliveryMode,
  publishOwnService,
  serviceDeliveryOptions,
  serviceStatusText,
  updateOwnService,
  updateServiceOrder
} from "../lib/profileServicesClient.js";
import { uploadProfileMedia } from "../lib/profileMediaClient.js";

const CURRENCY_OPTIONS = ["EUR", "USD", "CAD", "UAH"];

function displayPrice(value, currency = "EUR") {
  if (value === "" || value === null || value === undefined) return "Цена по запросу";
  return `${Number(value)} ${currency}`;
}

function imageStyle(url) {
  return url ? { backgroundImage: `url(${url})` } : undefined;
}

function serviceFormFromPowerPlace(powerPlaceDraft, profileId) {
  const imageUrl = powerPlaceDraft?.template_image_url || powerPlaceDraft?.image_url || "";
  return createEmptyServiceForm({
    profile_id: profileId || "",
    composition_id: powerPlaceDraft?.composition_id || "",
    title: powerPlaceDraft?.title || "Мандала Места Силы",
    description: powerPlaceDraft?.description || "",
    image_url: imageUrl,
    template_image_url: imageUrl,
    template_image_bucket: powerPlaceDraft?.template_image_bucket || powerPlaceDraft?.image_bucket || null,
    template_image_path: powerPlaceDraft?.template_image_path || powerPlaceDraft?.image_path || null,
    image_bucket: powerPlaceDraft?.image_bucket || powerPlaceDraft?.template_image_bucket || null,
    image_path: powerPlaceDraft?.image_path || powerPlaceDraft?.template_image_path || null,
    delivery_auto_enabled: true,
    delivery_master_enabled: true,
    delivery_both_enabled: true,
    price_currency: "EUR",
    status: "draft"
  });
}

export default function MasterTemplateServicesPanel({
  activeTab = "services",
  onActiveTabChange,
  profile,
  session,
  powerPlaceDraft = null
}) {
  const [services, setServices] = useState([]);
  const [orders, setOrders] = useState([]);
  const [serviceForm, setServiceForm] = useState(() => createEmptyServiceForm({ profile_id: profile?.id || "" }));
  const [selectedServiceId, setSelectedServiceId] = useState("");
  const [selectedOrderId, setSelectedOrderId] = useState("");
  const [orderDraft, setOrderDraft] = useState({ master_comment: "", master_result_image_url: "", final_result_image_url: "" });
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);

  const selectedService = useMemo(
    () => services.find((service) => service.id === selectedServiceId) || null,
    [services, selectedServiceId]
  );

  const selectedOrder = useMemo(
    () => orders.find((order) => order.id === selectedOrderId) || orders[0] || null,
    [orders, selectedOrderId]
  );

  async function reload() {
    if (!profile?.id || !session?.access_token) {
      setServices([]);
      setOrders([]);
      return;
    }

    setLoading(true);
    try {
      const [nextServices, nextOrders] = await Promise.all([
        listOwnServices(profile.id, session),
        listOwnServiceOrders(profile.id, session)
      ]);
      setServices(nextServices || []);
      setOrders(nextOrders || []);
      setSelectedOrderId((current) => current || nextOrders?.[0]?.id || "");
    } catch (error) {
      setNotice(error.message || "Не удалось загрузить услуги и заявки.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.id, session?.access_token]);

  useEffect(() => {
    if (!powerPlaceDraft) return;
    setServiceForm(serviceFormFromPowerPlace(powerPlaceDraft, profile?.id));
    setSelectedServiceId("");
    setNotice("Черновик услуги создан из сохранённого шаблона мандалы. Добавьте описание и цены.");
    onActiveTabChange?.("services");
  }, [powerPlaceDraft, profile?.id, onActiveTabChange]);

  useEffect(() => {
    if (!selectedOrder) return;
    setOrderDraft({
      master_comment: selectedOrder.master_comment || "",
      master_result_image_url: selectedOrder.master_result_image_url || selectedOrder.result_image_url || "",
      final_result_image_url: selectedOrder.final_result_image_url || selectedOrder.master_result_image_url || selectedOrder.result_image_url || ""
    });
  }, [selectedOrder?.id]);

  function updateServiceField(field, value) {
    setServiceForm((current) => ({ ...current, [field]: value }));
  }

  function startNewService() {
    setSelectedServiceId("");
    setServiceForm(createEmptyServiceForm({ profile_id: profile?.id || "", price_currency: "EUR" }));
    setNotice("");
  }

  function editService(service) {
    setSelectedServiceId(service.id);
    setServiceForm(createEmptyServiceForm({
      ...service,
      price_amount: service.price_amount ?? "",
      price_auto_amount: service.price_auto_amount ?? "",
      price_master_amount: service.price_master_amount ?? "",
      price_both_amount: service.price_both_amount ?? ""
    }));
  }

  async function saveService(status = "draft") {
    if (!profile?.id || !session?.access_token) {
      setNotice("Сначала войдите и сохраните профиль мастера.");
      return;
    }

    if (!serviceForm.title?.trim()) {
      setNotice("Добавьте название услуги.");
      return;
    }

    const payload = { ...serviceForm, profile_id: profile.id, status };
    const imageUrl = payload.template_image_url || payload.image_url;
    payload.template_image_url = imageUrl || "";
    payload.image_url = imageUrl || "";

    setLoading(true);
    try {
      const saved = status === "published"
        ? selectedServiceId
          ? await publishOwnService(selectedServiceId, payload, session)
          : await publishOwnService(payload, null, session)
        : selectedServiceId
          ? await updateOwnService(selectedServiceId, payload, session)
          : await createOwnService(payload, session);

      setSelectedServiceId(saved?.id || "");
      setServiceForm(createEmptyServiceForm({ ...saved, price_currency: saved?.price_currency || "EUR" }));
      setNotice(status === "published" ? "Услуга размещена в магазине услуг." : "Услуга сохранена как черновик.");
      await reload();
    } catch (error) {
      setNotice(error.message || "Не удалось сохранить услугу.");
    } finally {
      setLoading(false);
    }
  }

  async function uploadServiceTemplate(file) {
    if (!file || !profile?.id || !session?.access_token) return;
    setLoading(true);
    try {
      const uploaded = await uploadProfileMedia(file, { profileId: profile.id, kind: "material" }, session);
      setServiceForm((current) => ({
        ...current,
        image_url: uploaded.signedUrl,
        image_bucket: uploaded.bucket,
        image_path: uploaded.path,
        template_image_url: uploaded.signedUrl,
        template_image_bucket: uploaded.bucket,
        template_image_path: uploaded.path
      }));
      setNotice("Шаблон услуги загружен.");
    } catch (error) {
      setNotice(error.message || "Не удалось загрузить шаблон.");
    } finally {
      setLoading(false);
    }
  }

  async function uploadMasterResult(file) {
    if (!file || !profile?.id || !session?.access_token) return;
    setLoading(true);
    try {
      const uploaded = await uploadProfileMedia(file, { profileId: profile.id, kind: "material" }, session);
      setOrderDraft((current) => ({
        ...current,
        master_result_image_url: uploaded.signedUrl,
        final_result_image_url: uploaded.signedUrl,
        master_result_image_bucket: uploaded.bucket,
        master_result_image_path: uploaded.path,
        final_result_image_bucket: uploaded.bucket,
        final_result_image_path: uploaded.path
      }));
      setNotice("Финальная дорисованная мандала загружена. Нажмите «Отправить». ");
    } catch (error) {
      setNotice(error.message || "Не удалось загрузить результат.");
    } finally {
      setLoading(false);
    }
  }

  async function sendOrderResult() {
    if (!selectedOrder?.id || !session?.access_token) {
      setNotice("Выберите заявку.");
      return;
    }

    setLoading(true);
    try {
      const updated = await updateServiceOrder(selectedOrder.id, {
        ...selectedOrder,
        ...orderDraft,
        status: "sent"
      }, session);
      setOrders((current) => current.map((order) => order.id === updated.id ? updated : order));
      setNotice("Ответ по заявке сохранён и помечен как отправленный.");
    } catch (error) {
      setNotice(error.message || "Не удалось отправить результат.");
    } finally {
      setLoading(false);
    }
  }

  function renderDeliveryCheckbox(field, label) {
    return (
      <label className="profileServiceCheckbox">
        <input
          checked={Boolean(serviceForm[field])}
          onChange={(event) => updateServiceField(field, event.target.checked)}
          type="checkbox"
        />
        {label}
      </label>
    );
  }

  if (!profile?.id) {
    return (
      <section className="templateServicesPanel cabinetCard">
        <p className="cabinetEyebrow">Услуги и заявки</p>
        <h2>Сначала сохраните профиль мастера</h2>
        <p>После сохранения профиля здесь можно будет публиковать шаблонные мандалы как услуги и получать заявки клиентов.</p>
      </section>
    );
  }

  return (
    <section className="templateServicesPanel">
      <div className="templateServicesHeader">
        <div>
          <p className="cabinetEyebrow">Магазин услуг</p>
          <h2>{activeTab === "orders" ? "Заявки клиентов" : "Услуги мастера"}</h2>
          <p>Услуги основаны на готовых шаблонах мандал. Клиент присылает фото и выбирает: автоматическая версия, ручная доработка мастера или обе версии.</p>
        </div>
        <div className="templateServicesTabs" role="tablist">
          <button className={activeTab === "services" ? "active" : ""} onClick={() => onActiveTabChange?.("services")} type="button">Услуги</button>
          <button className={activeTab === "orders" ? "active" : ""} onClick={() => onActiveTabChange?.("orders")} type="button">Заявки</button>
        </div>
      </div>

      {notice && <div className="cabinetNotice">{notice}</div>}
      {loading && <div className="cabinetNotice">Загружаю...</div>}

      {activeTab === "services" && (
        <div className="templateServicesGrid">
          <aside className="templateServicesList cabinetCard">
            <button className="cabinetPrimary" onClick={startNewService} type="button">+ Новая услуга</button>
            {services.map((service) => (
              <button className={`templateServiceListItem ${selectedServiceId === service.id ? "active" : ""}`} key={service.id} onClick={() => editService(service)} type="button">
                <span className="templateServiceThumb" style={imageStyle(service.template_image_url || service.image_url)} />
                <b>{service.title || "Услуга без названия"}</b>
                <small>{serviceStatusText(service.status)} · {displayPrice(priceForDeliveryMode(service, "auto_template"), service.price_currency)}</small>
              </button>
            ))}
            {services.length === 0 && <p>Пока нет услуг. Нажмите «В услуги» под Местом силы или создайте услугу вручную.</p>}
          </aside>

          <div className="templateServiceEditor cabinetCard">
            <div className="templateServicePreviewColumn">
              <div className="templateServicePreview" style={imageStyle(serviceForm.template_image_url || serviceForm.image_url)}>◎</div>
              <label>
                URL шаблона мандалы
                <input value={serviceForm.template_image_url || ""} onChange={(event) => {
                  updateServiceField("template_image_url", event.target.value);
                  updateServiceField("image_url", event.target.value);
                }} placeholder="https://..." />
              </label>
              <label className="profileMediaUploadButton">
                <input accept="image/png,image/jpeg,image/webp,image/gif" onChange={(event) => uploadServiceTemplate(event.target.files?.[0])} type="file" />
                Загрузить шаблон
              </label>
            </div>

            <div className="templateServiceTextColumn">
              <label>
                Название услуги
                <input value={serviceForm.title || ""} onChange={(event) => updateServiceField("title", event.target.value)} placeholder="Мандала Места Силы" />
              </label>
              <label>
                Описание
                <textarea rows={8} value={serviceForm.description || ""} onChange={(event) => updateServiceField("description", event.target.value)} placeholder="Что получает клиент, срок, формат работы" />
              </label>
            </div>

            <div className="templateServicePriceColumn">
              <div className="templateDeliveryOptions">
                {renderDeliveryCheckbox("delivery_auto_enabled", "A — автоматическая мандала")}
                {renderDeliveryCheckbox("delivery_master_enabled", "Б — с доработкой мастера")}
                {renderDeliveryCheckbox("delivery_both_enabled", "В — обе мандалы")}
              </div>

              <label>
                Цена A
                <input min="0" step="0.01" type="number" value={serviceForm.price_auto_amount ?? ""} onChange={(event) => updateServiceField("price_auto_amount", event.target.value)} />
              </label>
              <label>
                Цена Б
                <input min="0" step="0.01" type="number" value={serviceForm.price_master_amount ?? ""} onChange={(event) => updateServiceField("price_master_amount", event.target.value)} />
              </label>
              <label>
                Цена В
                <input min="0" step="0.01" type="number" value={serviceForm.price_both_amount ?? ""} onChange={(event) => updateServiceField("price_both_amount", event.target.value)} />
              </label>
              <label>
                Валюта
                <select value={serviceForm.price_currency || "EUR"} onChange={(event) => updateServiceField("price_currency", event.target.value)}>
                  {CURRENCY_OPTIONS.map((currency) => <option key={currency} value={currency}>{currency}</option>)}
                </select>
              </label>

              <div className="templateServiceActions">
                <button className="cabinetSecondary" onClick={() => saveService("draft")} type="button">Сохранить</button>
                <button className="cabinetPrimary" onClick={() => saveService("published")} type="button">Разместить</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "orders" && (
        <div className="templateServicesGrid templateOrdersGrid">
          <aside className="templateOrdersList cabinetCard">
            {orders.map((order) => (
              <button className={`templateOrderCard ${selectedOrder?.id === order.id ? "active" : ""}`} key={order.id} onClick={() => setSelectedOrderId(order.id)} type="button">
                <span className="templateServiceThumb" style={imageStyle(order.client_photo_url)} />
                <b>{order.client_name || "Клиент"}</b>
                <small>{order.service?.title || "Услуга"}</small>
                <small>{deliveryModeText(order.delivery_mode)} · {orderStatusText(order.status)}</small>
                <span>{order.request_text || "Без запроса"}</span>
              </button>
            ))}
            {orders.length === 0 && <p>Заявок пока нет.</p>}
          </aside>

          {selectedOrder && (
            <div className="templateOrderDetail cabinetCard">
              <div className="templateOrderResultGrid">
                <div>
                  <p className="cabinetEyebrow">Автоматическая версия</p>
                  <div className="templateServicePreview" style={imageStyle(selectedOrder.auto_result_image_url || selectedOrder.service?.template_image_url || selectedOrder.service?.image_url)}>◎</div>
                  {selectedOrder.auto_result_image_url && <a className="cabinetSecondary" href={selectedOrder.auto_result_image_url} download>Скачать автоматическую</a>}
                </div>
                <div>
                  <p className="cabinetEyebrow">Финальная версия мастера</p>
                  <div className="templateServicePreview" style={imageStyle(orderDraft.master_result_image_url || orderDraft.final_result_image_url)}>◎</div>
                  <label className="profileMediaUploadButton">
                    <input accept="image/png,image/jpeg,image/webp,image/gif" onChange={(event) => uploadMasterResult(event.target.files?.[0])} type="file" />
                    Загрузить дорисованную
                  </label>
                </div>
              </div>

              <div className="templateOrderInfo">
                <h3>{selectedOrder.service?.title || "Услуга"}</h3>
                <p><b>Клиент:</b> {selectedOrder.client_name || "не указано"}</p>
                <p><b>Вариант:</b> {deliveryModeText(selectedOrder.delivery_mode)}</p>
                <p><b>Запрос:</b> {selectedOrder.request_text || "—"}</p>
              </div>

              <label>
                URL финальной мандалы
                <input value={orderDraft.master_result_image_url || ""} onChange={(event) => setOrderDraft((current) => ({ ...current, master_result_image_url: event.target.value, final_result_image_url: event.target.value }))} placeholder="https://..." />
              </label>

              <label>
                Комментарий мастера
                <textarea rows={5} value={orderDraft.master_comment || ""} onChange={(event) => setOrderDraft((current) => ({ ...current, master_comment: event.target.value }))} />
              </label>

              <div className="templateServiceActions">
                <button className="cabinetPrimary" onClick={sendOrderResult} type="button">Отправить</button>
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
