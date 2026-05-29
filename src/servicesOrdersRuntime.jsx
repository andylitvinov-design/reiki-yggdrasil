import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { getCurrentUser, getOwnProfile, getStoredSession, supabaseEnv } from "./lib/supabaseClient.js";
import {
  createEmptyServiceForm,
  createOwnService,
  createServiceOrder,
  listOwnServiceOrders,
  listOwnServices,
  listPublicServices,
  orderStatusText,
  publishOwnService,
  serviceStatusText,
  updateOwnService,
  updateServiceOrder
} from "./lib/profileServicesClient.js";
import "./servicesOrdersRuntime.css";

const ROUTE_CHANGE_EVENT = "reiki-route-change";

function formatPrice(service) {
  if (!service || service.price_amount === "" || service.price_amount === null || service.price_amount === undefined) return "Цена по запросу";
  return `${Number(service.price_amount)} ${service.price_currency || "EUR"}`;
}

function getRoute() {
  return window.location.pathname || "/";
}

function useRoute() {
  const [route, setRoute] = useState(getRoute());

  useEffect(() => {
    const update = () => setRoute(getRoute());
    window.addEventListener("popstate", update);
    window.addEventListener(ROUTE_CHANGE_EVENT, update);
    const timer = window.setInterval(update, 600);
    return () => {
      window.removeEventListener("popstate", update);
      window.removeEventListener(ROUTE_CHANGE_EVENT, update);
      window.clearInterval(timer);
    };
  }, []);

  return route;
}

function useSessionProfile(route) {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [status, setStatus] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (route !== "/profile" || !supabaseEnv.isConfigured) {
        setSession(null);
        setProfile(null);
        return;
      }

      const stored = getStoredSession();
      if (!stored?.access_token) {
        setSession(null);
        setProfile(null);
        return;
      }

      try {
        const user = await getCurrentUser(stored);
        const ownProfile = await getOwnProfile(user.id, stored);
        if (!cancelled) {
          setSession(stored);
          setProfile(ownProfile || null);
          setStatus("");
        }
      } catch (error) {
        if (!cancelled) {
          setSession(null);
          setProfile(null);
          setStatus(error.message || "Не удалось загрузить профиль для услуг.");
        }
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [route]);

  return { session, profile, status };
}

function MasterServicesPanel({ session, profile }) {
  const [activeTab, setActiveTab] = useState("services");
  const [services, setServices] = useState([]);
  const [orders, setOrders] = useState([]);
  const [selectedServiceId, setSelectedServiceId] = useState("");
  const [selectedOrderId, setSelectedOrderId] = useState("");
  const [serviceForm, setServiceForm] = useState(() => createEmptyServiceForm());
  const [orderDraft, setOrderDraft] = useState({ master_comment: "", result_image_url: "" });
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);
  const selectedService = useMemo(() => services.find((item) => item.id === selectedServiceId) || null, [services, selectedServiceId]);
  const selectedOrder = useMemo(() => orders.find((item) => item.id === selectedOrderId) || orders[0] || null, [orders, selectedOrderId]);

  const loadData = async () => {
    if (!profile?.id || !session?.access_token) return;
    setLoading(true);
    try {
      const [ownServices, ownOrders] = await Promise.all([
        listOwnServices(profile.id, session),
        listOwnServiceOrders(profile.id, session)
      ]);
      setServices(ownServices || []);
      setOrders(ownOrders || []);
      setSelectedOrderId((current) => current || ownOrders?.[0]?.id || "");
    } catch (error) {
      setNotice(error.message || "Не удалось загрузить услуги и заявки.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [profile?.id, session?.access_token]);

  useEffect(() => {
    const handler = (event) => {
      const trigger = event.target?.closest?.("button");
      const label = String(trigger?.textContent || "").replace(/\s+/g, " ").trim();
      if (!trigger || label !== "В услуги") return;
      setActiveTab("services");
      setSelectedServiceId("");
      setServiceForm(createEmptyServiceForm({
        profile_id: profile?.id || "",
        title: document.querySelector(".compositionTitleInput")?.value || "Место силы",
        price_currency: "EUR"
      }));
      setNotice("Черновик услуги подготовлен. Если место силы ещё не сохранено, сначала нажмите «Сохранить место силы». Связь с composition_id требует прямой интеграции в ProfilePage.");
      window.setTimeout(() => document.getElementById("services-orders-runtime")?.scrollIntoView({ behavior: "smooth", block: "center" }), 50);
    };
    document.addEventListener("click", handler, true);
    return () => document.removeEventListener("click", handler, true);
  }, [profile?.id]);

  useEffect(() => {
    if (!profile?.id) return;
    if (document.querySelector("[data-services-runtime-action='to-service']")) return;
    const mountButton = () => {
      const actions = document.querySelector(".powerPlaceActions");
      if (!actions || actions.querySelector("[data-services-runtime-action='to-service']")) return;
      const button = document.createElement("button");
      button.type = "button";
      button.className = "cabinetSecondary";
      button.dataset.servicesRuntimeAction = "to-service";
      button.textContent = "В услуги";
      const downloadButton = Array.from(actions.querySelectorAll("button")).find((item) => item.textContent.trim() === "Скачать");
      actions.insertBefore(button, downloadButton || actions.firstChild);
    };
    mountButton();
    const timer = window.setInterval(mountButton, 1000);
    return () => window.clearInterval(timer);
  }, [profile?.id]);

  const updateField = (field, value) => setServiceForm((current) => ({ ...current, [field]: value }));

  const selectService = (service) => {
    setSelectedServiceId(service?.id || "");
    setServiceForm(createEmptyServiceForm({
      ...service,
      price_amount: service?.price_amount === null || service?.price_amount === undefined ? "" : service.price_amount
    }));
  };

  const saveService = async (status) => {
    if (!profile?.id) return setNotice("Сначала сохраните профиль мастера.");
    if (!serviceForm.title.trim()) return setNotice("Добавьте название услуги.");
    setNotice("");
    try {
      const payload = { ...serviceForm, profile_id: profile.id, status };
      const saved = status === "published"
        ? await publishOwnService(selectedServiceId || payload, payload, session)
        : selectedServiceId
          ? await updateOwnService(selectedServiceId, payload, session)
          : await createOwnService(payload, session);
      setServices((current) => [saved, ...current.filter((item) => item.id !== saved.id)].filter(Boolean));
      setSelectedServiceId(saved.id || "");
      setServiceForm(createEmptyServiceForm({ ...saved, price_amount: saved.price_amount ?? "" }));
      setNotice(status === "published" ? "Услуга размещена." : "Услуга сохранена как черновик.");
    } catch (error) {
      setNotice(error.message || "Не удалось сохранить услугу.");
    }
  };

  const selectOrder = (order) => {
    setSelectedOrderId(order?.id || "");
    setOrderDraft({
      master_comment: order?.master_comment || "",
      result_image_url: order?.result_image_url || ""
    });
  };

  const sendOrder = async () => {
    if (!selectedOrder?.id) return;
    setNotice("");
    try {
      const saved = await updateServiceOrder(selectedOrder.id, { ...orderDraft, status: "sent" }, session);
      setOrders((current) => [saved, ...current.filter((item) => item.id !== saved.id)].filter(Boolean));
      setSelectedOrderId(saved.id || "");
      setNotice("Статус заявки обновлён. Внешний канал доставки пока не подключён.");
    } catch (error) {
      setNotice(error.message || "Не удалось обновить заявку.");
    }
  };

  if (!profile?.id) return null;

  return (
    <section className="servicesRuntimePanel" aria-label="Услуги и заявки мастера">
      <div className="servicesRuntimeHeader">
        <div>
          <p>Дополнительный MVP-блок</p>
          <h2>Услуги и заявки</h2>
        </div>
        <div className="servicesRuntimeTabs" role="tablist">
          <button type="button" className={activeTab === "services" ? "active" : ""} onClick={() => setActiveTab("services")}>Услуги</button>
          <button type="button" className={activeTab === "orders" ? "active" : ""} onClick={() => setActiveTab("orders")}>Заявки</button>
        </div>
      </div>

      {notice && <p className="servicesRuntimeNotice">{notice}</p>}
      {loading && <p className="servicesRuntimeNotice">Загружаю услуги и заявки...</p>}

      {activeTab === "services" && (
        <div className="servicesRuntimeGrid">
          <aside className="servicesRuntimeList">
            <button type="button" onClick={() => { setSelectedServiceId(""); setServiceForm(createEmptyServiceForm({ profile_id: profile.id })); }}>+ Новая услуга</button>
            {services.map((service) => (
              <button type="button" key={service.id} className={selectedServiceId === service.id ? "active" : ""} onClick={() => selectService(service)}>
                <b>{service.title || "Услуга без названия"}</b>
                <small>{serviceStatusText(service.status)} · {formatPrice(service)}</small>
              </button>
            ))}
            {services.length === 0 && <p>Услуг пока нет.</p>}
          </aside>

          <div className="servicesRuntimeEditor">
            <div className="servicesRuntimePreview" style={serviceForm.image_url ? { backgroundImage: `url(${serviceForm.image_url})` } : undefined}>{!serviceForm.image_url && "◎"}</div>
            <label>Название услуги<input value={serviceForm.title} onChange={(event) => updateField("title", event.target.value)} placeholder="Место силы для цели" /></label>
            <label>Описание<textarea rows={4} value={serviceForm.description} onChange={(event) => updateField("description", event.target.value)} placeholder="Что получает клиент, срок, формат работы" /></label>
            <label>URL изображения / превью<input value={serviceForm.image_url} onChange={(event) => updateField("image_url", event.target.value)} placeholder="https://..." /></label>
            <div className="servicesRuntimePrice">
              <label>Цена<input type="number" min="0" step="0.01" value={serviceForm.price_amount ?? ""} onChange={(event) => updateField("price_amount", event.target.value)} /></label>
              <label>Валюта<input value={serviceForm.price_currency || "EUR"} onChange={(event) => updateField("price_currency", event.target.value)} /></label>
            </div>
            <div className="servicesRuntimeActions">
              <button type="button" onClick={() => saveService("draft")}>Сохранить</button>
              <button type="button" onClick={() => saveService("published")}>Разместить</button>
            </div>
          </div>
        </div>
      )}

      {activeTab === "orders" && (
        <div className="servicesRuntimeGrid">
          <aside className="servicesRuntimeList">
            {orders.map((order) => (
              <button type="button" key={order.id} className={selectedOrder?.id === order.id ? "active" : ""} onClick={() => selectOrder(order)}>
                <b>{order.client_name || "Клиент"}</b>
                <small>{orderStatusText(order.status)} · {order.service?.title || "Услуга"}</small>
                <span>{order.request_text || "Запрос без текста"}</span>
              </button>
            ))}
            {orders.length === 0 && <p>Заявок пока нет.</p>}
          </aside>
          {selectedOrder && (
            <div className="servicesRuntimeEditor">
              <div className="servicesRuntimePreview" style={selectedOrder.service?.image_url ? { backgroundImage: `url(${selectedOrder.service.image_url})` } : undefined}>{!selectedOrder.service?.image_url && "◎"}</div>
              <h3>{selectedOrder.service?.title || "Услуга"}</h3>
              <p><b>{selectedOrder.client_name || "Клиент"}</b>: {selectedOrder.request_text || "Запрос не заполнен."}</p>
              <label>URL результата<input value={orderDraft.result_image_url} onChange={(event) => setOrderDraft((current) => ({ ...current, result_image_url: event.target.value }))} placeholder="https://..." /></label>
              <label>Комментарий<textarea rows={4} value={orderDraft.master_comment} onChange={(event) => setOrderDraft((current) => ({ ...current, master_comment: event.target.value }))} /></label>
              <div className="servicesRuntimeActions"><button type="button" onClick={sendOrder}>Отправить</button></div>
              <p className="servicesRuntimeSmall">MVP: отправка фиксирует статус заявки, внешний канал доставки пока не подключён.</p>
            </div>
          )}
        </div>
      )}
    </section>
  );
}

function PublicServicesPanel({ route }) {
  const [services, setServices] = useState([]);
  const [selectedServiceId, setSelectedServiceId] = useState("");
  const [form, setForm] = useState({ client_name: "", client_photo_url: "", request_text: "" });
  const [notice, setNotice] = useState("");
  const selectedService = services.find((item) => item.id === selectedServiceId) || services[0] || null;

  useEffect(() => {
    let cancelled = false;
    listPublicServices({ limit: 8 })
      .then((rows) => {
        if (!cancelled) {
          setServices(rows || []);
          setSelectedServiceId((current) => current || rows?.[0]?.id || "");
        }
      })
      .catch(() => {
        if (!cancelled) setServices([]);
      });
    return () => {
      cancelled = true;
    };
  }, [route]);

  const submitOrder = async (event) => {
    event.preventDefault();
    if (!selectedService?.id) return setNotice("Выберите услугу.");
    try {
      await createServiceOrder({
        service_id: selectedService.id,
        master_profile_id: selectedService.profile_id,
        client_name: form.client_name,
        client_photo_url: form.client_photo_url,
        request_text: form.request_text
      });
      setForm({ client_name: "", client_photo_url: "", request_text: "" });
      setNotice("Заявка отправлена мастеру. Фото пока добавляется ссылкой; публичная загрузка файла требует отдельной Storage/RLS настройки.");
    } catch (error) {
      setNotice(error.message || "Не удалось отправить заявку.");
    }
  };

  if (route === "/profile" || route === "/profile/admin" || route === "/masters") return null;
  if (!supabaseEnv.isConfigured) return null;

  return (
    <aside className="servicesRuntimePublic" aria-label="Услуги мастеров">
      <h2>Услуги мастеров</h2>
      {services.length === 0 ? (
        <p>Опубликованные услуги появятся после размещения мастерами.</p>
      ) : (
        <div className="servicesRuntimePublicCards">
          {services.map((service) => (
            <button type="button" key={service.id} className={selectedService?.id === service.id ? "active" : ""} onClick={() => setSelectedServiceId(service.id)}>
              {service.image_url && <span style={{ backgroundImage: `url(${service.image_url})` }} />}
              <b>{service.title || "Услуга мастера"}</b>
              <small>{formatPrice(service)}</small>
              <em>Заказать</em>
            </button>
          ))}
        </div>
      )}
      {selectedService && (
        <form onSubmit={submitOrder} className="servicesRuntimeOrderForm">
          <b>Заказать: {selectedService.title || "услуга"}</b>
          <input value={form.client_name} onChange={(event) => setForm((current) => ({ ...current, client_name: event.target.value }))} placeholder="Имя клиента" />
          <input value={form.client_photo_url} onChange={(event) => setForm((current) => ({ ...current, client_photo_url: event.target.value }))} placeholder="URL фото клиента" />
          <textarea rows={3} value={form.request_text} onChange={(event) => setForm((current) => ({ ...current, request_text: event.target.value }))} placeholder="Запрос / заметка" />
          <button type="submit">Заказать</button>
          {notice && <p>{notice}</p>}
        </form>
      )}
    </aside>
  );
}

function ServicesOrdersRuntime() {
  const route = useRoute();
  const { session, profile, status } = useSessionProfile(route);

  return (
    <>
      {route === "/profile" && status && <div className="servicesRuntimeToast">{status}</div>}
      {route === "/profile" && <MasterServicesPanel session={session} profile={profile} />}
      <PublicServicesPanel route={route} />
    </>
  );
}

const rootNode = document.createElement("div");
rootNode.id = "services-orders-runtime";
document.body.appendChild(rootNode);

createRoot(rootNode).render(<ServicesOrdersRuntime />);
