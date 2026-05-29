#!/usr/bin/env node
import fs from "node:fs";

function readFile(path) {
  return fs.readFileSync(path, "utf8");
}

function writeFile(path, content) {
  fs.writeFileSync(path, content);
}

function insertAfter(content, needle, addition, label) {
  if (content.includes(addition.trim())) return content;
  if (!content.includes(needle)) throw new Error("Patch point not found: " + label);
  return content.replace(needle, needle + addition);
}

function insertBefore(content, needle, addition, label) {
  if (content.includes(addition.trim())) return content;
  if (!content.includes(needle)) throw new Error("Patch point not found: " + label);
  return content.replace(needle, addition + needle);
}

function replaceOnce(content, needle, replacement, label) {
  if (content.includes(replacement.trim())) return content;
  if (!content.includes(needle)) throw new Error("Patch point not found: " + label);
  return content.replace(needle, replacement);
}

function patchProfilePage() {
  const path = "src/pages/ProfilePage.jsx";
  let content = readFile(path);

  content = insertAfter(content, `} from "../lib/profileMaterialsClient.js";`, `
import {
  createEmptyServiceForm,
  createOwnService,
  listOwnServiceOrders,
  listOwnServices,
  orderStatusText,
  publishOwnService,
  serviceStatusText,
  updateOwnService,
  updateServiceOrder
} from "../lib/profileServicesClient.js";`, "profile services import");

  content = insertAfter(content, `function persistableImageRef(src) {
  if (!src || src.startsWith("data:image/")) return "";
  return src;
}`, `

function formatServicePrice(service) {
  const amount = service?.price_amount;
  if (amount === null || amount === undefined || amount === "") return "Цена по запросу";
  return String(Number(amount)) + " " + (service?.price_currency || "EUR");
}`, "service price helper");

  content = insertAfter(content, `  const [mediaUploadTarget, setMediaUploadTarget] = useState("");`, `
  const [services, setServices] = useState([]);
  const [serviceForm, setServiceForm] = useState(() => createEmptyServiceForm());
  const [selectedServiceId, setSelectedServiceId] = useState("");
  const [servicesLoading, setServicesLoading] = useState(false);
  const [serviceNotice, setServiceNotice] = useState("");
  const [serviceOrders, setServiceOrders] = useState([]);
  const [selectedOrderId, setSelectedOrderId] = useState("");
  const [orderDraft, setOrderDraft] = useState({ master_comment: "", result_image_url: "" });
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [orderNotice, setOrderNotice] = useState("");`, "services state");

  content = insertAfter(content, `  const materialPreviewUrl = materialFilePreview || displayMaterialImageUrl(materialForm.image_url);`, `

  const selectedService = useMemo(
    () => services.find((item) => item.id === selectedServiceId) || null,
    [services, selectedServiceId]
  );

  const selectedOrder = useMemo(
    () => serviceOrders.find((item) => item.id === selectedOrderId) || serviceOrders[0] || null,
    [serviceOrders, selectedOrderId]
  );

  const draftServicePreview = serviceForm.image_url || selectedService?.display_url || selectedService?.image_url || "";`, "services memo");

  content = insertAfter(content, `  const updateMaterialField = (field, value) => {
    setMaterialForm((current) => {
      if (field === "step_id") {
        const step = stepOptions.find((item) => item.id === value) || firstStep;
        const settings = settingsForStep(value);

        return {
          ...current,
          step_id: value,
          step_title: step?.title || "",
          setting_title: settings[0]?.title || "",
          setting_index: settings.length > 0 ? 1 : null
        };
      }

      if (field === "setting_title") {
        const settingIndex = activeSettings.findIndex((item) => item.title === value);
        return { ...current, setting_title: value, setting_index: settingIndex >= 0 ? settingIndex + 1 : null };
      }

      return { ...current, [field]: value };
    });
  };`, `

  const updateServiceField = (field, value) => {
    setServiceForm((current) => ({ ...current, [field]: value }));
  };

  const handleServiceSelect = (service) => {
    setSelectedServiceId(service?.id || "");
    setServiceForm(createEmptyServiceForm({
      ...service,
      price_amount: service?.price_amount === null || service?.price_amount === undefined ? "" : service.price_amount
    }));
  };

  const handleOrderSelect = (order) => {
    setSelectedOrderId(order?.id || "");
    setOrderDraft({
      master_comment: order?.master_comment || "",
      result_image_url: order?.result_image_url || ""
    });
  };`, "service field handlers");

  content = insertAfter(content, `  }, [profile?.id, session]);`, `

  useEffect(() => {
    let cancelled = false;

    async function loadServicesAndOrders() {
      if (!profile?.id || !session?.access_token) {
        setServices([]);
        setServiceOrders([]);
        return;
      }

      setServicesLoading(true);
      setOrdersLoading(true);

      try {
        const [ownServices, ownOrders] = await Promise.all([
          listOwnServices(profile.id, session),
          listOwnServiceOrders(profile.id, session)
        ]);
        if (!cancelled) {
          setServices(ownServices || []);
          setServiceOrders(ownOrders || []);
          setSelectedOrderId((current) => current || ownOrders?.[0]?.id || "");
        }
      } catch (err) {
        if (!cancelled) setError(err.message || "Не удалось загрузить услуги и заявки.");
      } finally {
        if (!cancelled) {
          setServicesLoading(false);
          setOrdersLoading(false);
        }
      }
    }

    loadServicesAndOrders();

    return () => {
      cancelled = true;
    };
  }, [profile?.id, session]);`, "services load effect");

  content = insertBefore(content, `  const handleClientPhotoSave = async ({ selectSaved = false, closePicker = false } = {}) => {`, `  const saveCurrentPowerPlaceComposition = async () => {
    const payload = buildPowerPlacePayload();
    const saved = selectedCompositionId
      ? await updatePowerPlaceComposition(selectedCompositionId, payload, session)
      : await createPowerPlaceComposition(payload, session);

    setPowerPlaceCompositions((current) => [saved, ...current.filter((item) => item.id !== saved.id)].filter(Boolean));
    setSelectedCompositionId(saved.id || "");
    return saved;
  };

  const handlePowerPlaceToService = async () => {
    setMessage("");
    setError("");
    setServiceNotice("");

    if (!profile?.id) {
      setError("Сначала сохраните профиль мастера.");
      return;
    }

    try {
      const saved = await saveCurrentPowerPlaceComposition();
      const firstObjectImage = Object.values(objectImages || {}).find(Boolean) || "";
      const previewImage = selectedCentralPhoto?.image_url || selectedCentralPhoto?.display_url || firstObjectImage || "";
      setSelectedServiceId("");
      setServiceForm(createEmptyServiceForm({
        profile_id: profile.id,
        composition_id: saved?.id || "",
        title: saved?.title || compositionTitle || "Место силы",
        image_url: persistableImageRef(previewImage) || previewImage,
        price_currency: "EUR"
      }));
      setActiveTopTab("services");
      setServiceNotice("Место силы сохранено и подготовлено как черновик услуги.");
    } catch (err) {
      setError(err.message || "Не удалось перенести место силы в услуги.");
    }
  };

  const handleServiceSave = async (status = "draft") => {
    setMessage("");
    setError("");
    setServiceNotice("");

    if (!profile?.id) {
      setError("Сначала сохраните профиль мастера.");
      return;
    }

    if (!serviceForm.title.trim()) {
      setServiceNotice("Добавьте название услуги.");
      return;
    }

    try {
      const payload = { ...serviceForm, profile_id: profile.id, status };
      const saved = status === "published"
        ? await publishOwnService(selectedServiceId || payload, payload, session)
        : selectedServiceId
          ? await updateOwnService(selectedServiceId, payload, session)
          : await createOwnService(payload, session);
      setServices((current) => [saved, ...current.filter((item) => item.id !== saved.id)].filter(Boolean));
      setSelectedServiceId(saved?.id || "");
      setServiceForm(createEmptyServiceForm({ ...saved, price_amount: saved?.price_amount ?? "" }));
      setServiceNotice(status === "published" ? "Услуга размещена." : "Услуга сохранена как черновик.");
    } catch (err) {
      setServiceNotice(err.message || "Не удалось сохранить услугу.");
    }
  };

  const handleOrderSend = async () => {
    if (!selectedOrder?.id) return;
    setOrderNotice("");

    try {
      const saved = await updateServiceOrder(selectedOrder.id, {
        ...orderDraft,
        status: "sent"
      }, session);
      setServiceOrders((current) => [saved, ...current.filter((item) => item.id !== saved.id)].filter(Boolean));
      setSelectedOrderId(saved?.id || "");
      setOrderDraft({
        master_comment: saved?.master_comment || "",
        result_image_url: saved?.result_image_url || ""
      });
      setOrderNotice("Статус заявки обновлён. MVP фиксирует отправку без внешнего канала доставки.");
    } catch (err) {
      setOrderNotice(err.message || "Не удалось обновить заявку.");
    }
  };

`, "services handlers");

  content = replaceOnce(content, `<button className={activeTopTab === "power-place" ? "active" : ""} type="button" onClick={() => setActiveTopTab("power-place")}>Место силы</button>
                <button className={activeTopTab === "chats" ? "active" : ""} type="button" onClick={() => setActiveTopTab("chats")}>Чаты</button>`, `<button className={activeTopTab === "power-place" ? "active" : ""} type="button" onClick={() => setActiveTopTab("power-place")}>Место силы</button>
                <button className={activeTopTab === "services" ? "active" : ""} type="button" onClick={() => setActiveTopTab("services")}>Услуги</button>
                <button className={activeTopTab === "orders" ? "active" : ""} type="button" onClick={() => setActiveTopTab("orders")}>Заявки</button>
                <button className={activeTopTab === "chats" ? "active" : ""} type="button" onClick={() => setActiveTopTab("chats")}>Чаты</button>`, "top tabs");

  content = replaceOnce(content, `              ) : activeTopTab === "chats" ? (
                <>
                  <p className="cabinetEyebrow">Рабочий режим</p>`, `              ) : activeTopTab === "services" ? (
                <>
                  <p className="cabinetEyebrow">Услуги</p>
                  <h3>{services.length} услуг</h3>
                  <div className="profileServiceMiniList">
                    {services.map((service) => (
                      <button key={service.id} type="button" onClick={() => handleServiceSelect(service)} className={selectedServiceId === service.id ? "active" : ""}>
                        <b>{service.title || "Услуга без названия"}</b>
                        <small>{serviceStatusText(service.status)} · {formatServicePrice(service)}</small>
                      </button>
                    ))}
                    {services.length === 0 && <p>Создайте услугу из места силы или вручную.</p>}
                  </div>
                </>
              ) : activeTopTab === "orders" ? (
                <>
                  <p className="cabinetEyebrow">Заявки</p>
                  <h3>{serviceOrders.length} заявок</h3>
                  <div className="profileServiceMiniList">
                    {serviceOrders.map((order) => (
                      <button key={order.id} type="button" onClick={() => handleOrderSelect(order)} className={selectedOrder?.id === order.id ? "active" : ""}>
                        <b>{order.client_name || "Клиент"}</b>
                        <small>{orderStatusText(order.status)} · {order.service?.title || "Услуга"}</small>
                      </button>
                    ))}
                    {serviceOrders.length === 0 && <p>Новые заявки появятся после заказов на сайте.</p>}
                  </div>
                </>
              ) : activeTopTab === "chats" ? (
                <>
                  <p className="cabinetEyebrow">Рабочий режим</p>`, "sidebar branches");

  content = insertBefore(content, `            {activeTopTab === "chats" && (`, `            {activeTopTab === "services" && (
              <section className="serviceWorkspace" aria-label="Услуги мастера">
                <div className="cabinetFormHeader">
                  <div>
                    <p className="cabinetEyebrow">Услуги</p>
                    <h2>{selectedServiceId ? "Редактировать услугу" : "Новая услуга"}</h2>
                  </div>
                  <span className="cabinetStatus">{servicesLoading ? "..." : services.length}</span>
                </div>
                {serviceNotice && <p className="mediaUploadNotice">{serviceNotice}</p>}
                <div className="serviceDraftGrid">
                  <div className="servicePreviewCard">
                    <div className={draftServicePreview ? "servicePreviewImage hasImage" : "servicePreviewImage"} style={imageStyle(displayImageUrl(draftServicePreview))}>
                      {!draftServicePreview && <span>◎</span>}
                    </div>
                    <small>Изображение / композиция места силы слева.</small>
                  </div>
                  <div className="serviceDraftFields">
                    <label>Название услуги<input value={serviceForm.title} onChange={(event) => updateServiceField("title", event.target.value)} placeholder="Место силы для цели" /></label>
                    <label>Описание услуги<textarea value={serviceForm.description} onChange={(event) => updateServiceField("description", event.target.value)} rows={5} placeholder="Что получит клиент, как проходит работа, срок выполнения." /></label>
                    <label>URL изображения / превью<input value={serviceForm.image_url} onChange={(event) => updateServiceField("image_url", event.target.value)} placeholder="https://... или storage ref" /></label>
                  </div>
                  <div className="servicePriceBox">
                    <label>Цена<input type="number" min="0" step="0.01" value={serviceForm.price_amount ?? ""} onChange={(event) => updateServiceField("price_amount", event.target.value)} placeholder="120" /></label>
                    <label>Валюта<input value={serviceForm.price_currency} onChange={(event) => updateServiceField("price_currency", event.target.value)} placeholder="EUR" /></label>
                    <span className={"statusChip status-" + (serviceForm.status || "draft")}>{serviceStatusText(serviceForm.status)}</span>
                  </div>
                </div>
                <div className="cabinetActions">
                  <button className="cabinetPrimary" type="button" onClick={() => handleServiceSave("draft")}>Сохранить</button>
                  <button className="cabinetSecondary" type="button" onClick={() => handleServiceSave("published")}>Разместить</button>
                </div>
              </section>
            )}

            {activeTopTab === "orders" && (
              <section className="ordersWorkspace" aria-label="Заявки клиентов">
                <div className="cabinetFormHeader"><div><p className="cabinetEyebrow">Заявки</p><h2>Клиентские заказы</h2></div><span className="cabinetStatus">{ordersLoading ? "..." : serviceOrders.length}</span></div>
                {orderNotice && <p className="mediaUploadNotice">{orderNotice}</p>}
                <div className="orderCardsGrid">
                  {serviceOrders.map((order) => (
                    <button key={order.id} type="button" className={selectedOrder?.id === order.id ? "orderCard active" : "orderCard"} onClick={() => handleOrderSelect(order)}>
                      <span className={order.client_photo_url ? "orderPhoto hasImage" : "orderPhoto"} style={imageStyle(order.client_photo_url)}>{!order.client_photo_url && "◎"}</span>
                      <b>{order.service?.title || "Услуга"}</b><small>{formatServicePrice(order.service)} · {orderStatusText(order.status)}</small><p>{order.request_text || "Запрос без текста."}</p>
                    </button>
                  ))}
                  {serviceOrders.length === 0 && <p>Заявок пока нет.</p>}
                </div>
                {selectedOrder && (
                  <div className="orderDetailWorkspace">
                    <div className="servicePreviewCard"><div className={selectedOrder.service?.image_url ? "servicePreviewImage hasImage" : "servicePreviewImage"} style={imageStyle(selectedOrder.service?.image_url)}>{!selectedOrder.service?.image_url && <span>◎</span>}</div><small>Превью услуги / места силы. Полный PNG/JPEG export требует проверки.</small></div>
                    <div className="serviceDraftFields">
                      <h3>{selectedOrder.client_name || "Клиент"}</h3><p>{selectedOrder.request_text || "Запрос не заполнен."}</p>
                      <label>URL результата / фото<input value={orderDraft.result_image_url} onChange={(event) => setOrderDraft((current) => ({ ...current, result_image_url: event.target.value }))} placeholder="https://..." /></label>
                      <label>Комментарий мастера<textarea rows={4} value={orderDraft.master_comment} onChange={(event) => setOrderDraft((current) => ({ ...current, master_comment: event.target.value }))} placeholder="Комментарий для клиента" /></label>
                      <button className="cabinetPrimary" type="button" onClick={handleOrderSend}>Отправить</button><p className="powerPlanNote">MVP: отправка фиксирует статус заявки, внешний канал доставки пока не подключён.</p>
                    </div>
                  </div>
                )}
              </section>
            )}

`, "center services panels");

  content = replaceOnce(content, `<button className="cabinetSecondary" type="button" onClick={handleDownloadMandala}>Скачать</button>`, `<button className="cabinetSecondary" type="button" disabled={!profile?.id} onClick={handlePowerPlaceToService}>В услуги</button>
                <button className="cabinetSecondary" type="button" onClick={handleDownloadMandala}>Скачать</button>`, "power actions button");

  writeFile(path, content);
}

function patchMain() {
  const path = "src/main.jsx";
  let content = readFile(path);

  content = insertAfter(content, `import { youtubeEmbedUrl as buildYoutubeEmbedUrl, youtubeWatchUrl } from "./lib/youtube.js";`, `
import { createServiceOrder, listPublicServices } from "./lib/profileServicesClient.js";`, "public services import");

  content = insertBefore(content, `function MysteryRightPanel({ entity }) {`, `function PublicServicesMiniShop() {
  const [services, setServices] = useState([]);
  const [selectedServiceId, setSelectedServiceId] = useState("");
  const [form, setForm] = useState({ client_name: "", client_photo_url: "", request_text: "" });
  const [status, setStatus] = useState("");
  const selectedService = services.find((item) => item.id === selectedServiceId) || services[0] || null;

  useEffect(() => {
    let cancelled = false;
    listPublicServices({ limit: 6 }).then((rows) => {
      if (!cancelled) {
        setServices(rows || []);
        setSelectedServiceId((current) => current || rows?.[0]?.id || "");
      }
    }).catch(() => {
      if (!cancelled) setServices([]);
    });
    return () => { cancelled = true; };
  }, []);

  const price = (service) => service?.price_amount || service?.price_amount === 0
    ? String(Number(service.price_amount)) + " " + (service.price_currency || "EUR")
    : "Цена по запросу";

  const submitOrder = async (event) => {
    event.preventDefault();
    setStatus("");
    if (!selectedService?.id) {
      setStatus("Выберите услугу.");
      return;
    }
    try {
      await createServiceOrder({
        service_id: selectedService.id,
        master_profile_id: selectedService.profile_id,
        client_name: form.client_name,
        client_photo_url: form.client_photo_url,
        request_text: form.request_text
      });
      setForm({ client_name: "", client_photo_url: "", request_text: "" });
      setStatus("Заявка отправлена мастеру. Фото можно указать ссылкой; публичная загрузка файла требует проверки Storage/RLS.");
    } catch (err) {
      setStatus(err.message || "Не удалось отправить заявку.");
    }
  };

  return (
    <section className="mysteryPanelBlock publicServicesBlock">
      <h3>Услуги мастеров</h3>
      {services.length === 0 ? <p className="mysteryEmpty">Опубликованные услуги появятся после размещения мастерами.</p> : (
        <div className="publicServiceCards">
          {services.map((service) => (
            <button type="button" className={selectedService?.id === service.id ? "publicServiceCard active" : "publicServiceCard"} key={service.id} onClick={() => setSelectedServiceId(service.id)}>
              {service.image_url && <span className="publicServiceImage" style={{ backgroundImage: "url(" + service.image_url + ")" }} />}
              <b>{service.title || "Услуга мастера"}</b><small>{price(service)}</small><p>{service.description || "Описание услуги уточняется."}</p><em>Заказать</em>
            </button>
          ))}
        </div>
      )}
      {selectedService && (
        <form className="publicServiceOrderForm" onSubmit={submitOrder}>
          <b>Заказать: {selectedService.title || "услуга"}</b>
          <input value={form.client_name} onChange={(event) => setForm((current) => ({ ...current, client_name: event.target.value }))} placeholder="Имя клиента" />
          <input value={form.client_photo_url} onChange={(event) => setForm((current) => ({ ...current, client_photo_url: event.target.value }))} placeholder="URL фото клиента (для MVP)" />
          <textarea rows={3} value={form.request_text} onChange={(event) => setForm((current) => ({ ...current, request_text: event.target.value }))} placeholder="Запрос / заметка" />
          <button type="submit">Заказать</button>
          {status && <p>{status}</p>}
        </form>
      )}
    </section>
  );
}

`, "public services component");

  content = insertAfter(content, `      <MysteryPanelList title="Артефакты / магазин" items={entity.shopItems} />`, `
      <PublicServicesMiniShop />`, "public services panel");

  writeFile(path, content);
}

function patchMigrationRunner() {
  const path = "scripts/apply-reiki-supabase-migrations.mjs";
  let content = readFile(path);

  content = replaceOnce(content, `  "supabase/migrations/20260527143000_power_place_star_format.sql"`, `  "supabase/migrations/20260527143000_power_place_star_format.sql",
  "supabase/migrations/20260529090000_master_services_orders_mvp.sql"`, "migration allowlist");

  content = replaceOnce(content, `  profile_cabinet_media_storage_policy: false`, `  profile_cabinet_media_storage_policy: false,
  profile_cabinet_services: false,
  profile_cabinet_service_orders: false`, "schema checks");

  content = replaceOnce(content, `  exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'owners upload profile cabinet media'
  ) as profile_cabinet_media_storage_policy`, `  exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'owners upload profile cabinet media'
  ) as profile_cabinet_media_storage_policy,
  exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'profile_cabinet_services'
  ) as profile_cabinet_services,
  exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'profile_cabinet_service_orders'
  ) as profile_cabinet_service_orders`, "schema query");

  writeFile(path, content);
}

function patchStyles() {
  const profileCssPath = "src/profileMandalaWorkspace.css";
  let profileCss = readFile(profileCssPath);
  if (!profileCss.includes("serviceDraftGrid")) {
    profileCss += `

/* Master services/orders MVP */
.serviceWorkspace, .ordersWorkspace { background: rgba(255,255,255,.72); border: 1px solid rgba(91,62,28,.14); border-radius: 24px; padding: 20px; box-shadow: 0 18px 50px rgba(72,45,16,.08); }
.profileServiceMiniList, .serviceDraftFields, .servicePriceBox, .publicServiceOrderForm { display: grid; gap: 10px; }
.profileServiceMiniList button, .orderCard, .publicServiceCard { text-align: left; border: 1px solid rgba(91,62,28,.14); border-radius: 16px; padding: 12px; background: rgba(255,255,255,.82); }
.profileServiceMiniList button.active, .orderCard.active, .publicServiceCard.active { border-color: rgba(168,116,36,.55); box-shadow: 0 10px 24px rgba(168,116,36,.14); }
.serviceDraftGrid, .orderDetailWorkspace { display: grid; grid-template-columns: minmax(180px,.85fr) minmax(260px,1.4fr) minmax(160px,.7fr); gap: 16px; align-items: start; }
.servicePreviewCard, .servicePriceBox { border: 1px solid rgba(91,62,28,.14); border-radius: 18px; padding: 14px; background: rgba(255,255,255,.72); }
.servicePreviewImage, .orderPhoto, .publicServiceImage { display: grid; place-items: center; min-height: 160px; border-radius: 16px; background: linear-gradient(135deg, rgba(236,211,164,.5), rgba(255,255,255,.8)); background-size: cover; background-position: center; }
.orderCardsGrid, .publicServiceCards { display: grid; gap: 12px; }
.orderCard { display: grid; grid-template-columns: 72px 1fr; gap: 10px; }
.orderPhoto { min-height: 72px; }
@media (max-width: 900px) { .serviceDraftGrid, .orderDetailWorkspace, .orderCard { grid-template-columns: 1fr; } }
`;
    writeFile(profileCssPath, profileCss);
  }

  const indexCssPath = "src/index.css";
  let indexCss = readFile(indexCssPath);
  if (!indexCss.includes("publicServicesBlock")) {
    indexCss += `

/* Public service order MVP */
.publicServicesBlock { display: grid; gap: 12px; }
.publicServiceCards { display: grid; gap: 10px; }
.publicServiceCard { width: 100%; cursor: pointer; }
.publicServiceCard em { display: inline-flex; margin-top: 8px; font-style: normal; font-weight: 700; }
.publicServiceOrderForm input, .publicServiceOrderForm textarea { width: 100%; }
`;
    writeFile(indexCssPath, indexCss);
  }
}

patchProfilePage();
patchMain();
patchMigrationRunner();
patchStyles();
console.log("Master services/orders MVP patches applied.");
