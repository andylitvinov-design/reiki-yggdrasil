import React, { useEffect, useMemo, useState } from "react";
import {
  SERVICE_FORMAT_OPTIONS,
  buildServiceCartItem,
  createServiceCartStore,
  formatServicePrice,
  getPublicServiceById,
  listPublicServices,
  resolvePublicServiceState
} from "../lib/profileServicesClient.js";

function isSafePublicPreview(value) {
  return typeof value === "string" && /^https?:\/\//.test(value) && !value.startsWith("data:image/");
}

function servicePreviewUrl(service) {
  return isSafePublicPreview(service?.display_url || service?.image_url) ? service.display_url || service.image_url : "";
}

function navigateTo(path) {
  window.history.pushState({}, "", path);
  window.dispatchEvent(new Event("reiki-route-change"));
  window.scrollTo({ top: 0, behavior: "smooth" });
}

export default function PublicServicesPage({ serviceId = "", onNavigateHome = () => navigateTo("/"), onNavigateProfile = () => navigateTo("/profile") }) {
  const [services, setServices] = useState([]);
  const [selectedService, setSelectedService] = useState(null);
  const [status, setStatus] = useState("loading");
  const [message, setMessage] = useState("");
  const [selectedFormat, setSelectedFormat] = useState(SERVICE_FORMAT_OPTIONS[0].value);
  const [cartMessage, setCartMessage] = useState("");
  const isDetail = Boolean(serviceId);

  useEffect(() => {
    let cancelled = false;
    async function loadPublicServices() {
      setStatus("loading");
      setMessage("");
      setCartMessage("");
      try {
        if (isDetail) {
          const row = await getPublicServiceById(serviceId);
          if (cancelled) return;
          const state = resolvePublicServiceState(row, serviceId);
          setSelectedService(state.service);
          setMessage(state.message);
          setStatus(state.isVisible ? "success" : "empty");
          return;
        }

        const rows = await listPublicServices({ limit: 48 });
        if (cancelled) return;
        setServices(rows);
        setStatus("success");
      } catch {
        if (cancelled) return;
        setSelectedService(null);
        setServices([]);
        setStatus("error");
        setMessage("Каталог временно недоступен. Попробуйте позже.");
      }
    }

    void loadPublicServices();
    return () => {
      cancelled = true;
    };
  }, [isDetail, serviceId]);

  const visibleServices = useMemo(() => services.filter((service) => service.status === "published"), [services]);
  const currentService = selectedService;

  const handleAddToCart = (service) => {
    try {
      const item = buildServiceCartItem({ service, format: selectedFormat });
      createServiceCartStore().set(item);
      setCartMessage("Услуга добавлена в корзину. В корзине хранится одна услуга.");
    } catch {
      setCartMessage("Не удалось добавить услугу в корзину.");
    }
  };

  const handleCheckout = (service = currentService) => {
    try {
      const store = createServiceCartStore();
      const item = service ? buildServiceCartItem({ service, format: selectedFormat }) : store.get();
      store.set(item);
      store.savePending(item);
      navigateTo("/profile/orders");
    } catch {
      setCartMessage("Не удалось перейти к оформлению заказа.");
    }
  };

  return (
    <main className="publicServicesPage" aria-label={isDetail ? "Публичная услуга" : "Магазин услуг"}>
      <header className="publicServicesHeader">
        <button type="button" onClick={onNavigateHome}>Главная</button>
        <button type="button" onClick={onNavigateProfile}>Кабинет</button>
      </header>

      {!isDetail && (
        <section className="publicServicesHero">
          <p className="cabinetEyebrow">Магазин</p>
          <h1>Услуги мастеров</h1>
          <p>Опубликованные мандальные услуги. Черновики и архив не показываются публично.</p>
        </section>
      )}

      {status === "loading" && <p className="publicServicesState">Загружаем услуги...</p>}
      {message && <p className="publicServicesState">{message}</p>}
      {cartMessage && <p className="publicServicesState">{cartMessage}</p>}

      {!isDetail && status === "success" && (
        <section className="publicServicesGrid" aria-label="Опубликованные услуги">
          {visibleServices.map((service) => {
            const previewUrl = servicePreviewUrl(service);
            return (
              <article className="publicServiceCard" key={service.id}>
                {previewUrl ? <img alt="" src={previewUrl} /> : <div className="publicServicePreview">◇</div>}
                <div>
                  <p className="cabinetEyebrow">Услуга</p>
                  <h2>{service.title || "Услуга мастера"}</h2>
                  <p>{service.description || "Описание готовится."}</p>
                  <strong>{formatServicePrice(service)}</strong>
                  <div className="cabinetActions">
                    <button type="button" onClick={() => navigateTo(`/services/${service.id}`)}>Открыть</button>
                  </div>
                </div>
              </article>
            );
          })}
          {visibleServices.length === 0 && <p>Опубликованные услуги пока не найдены.</p>}
        </section>
      )}

      {isDetail && currentService && (
        <section className="publicServiceDetail">
          {servicePreviewUrl(currentService) ? <img alt="" src={servicePreviewUrl(currentService)} /> : <div className="publicServicePreview publicServicePreviewLarge">◇</div>}
          <div className="publicServiceDetailBody">
            <p className="cabinetEyebrow">Услуга</p>
            <h1>{currentService.title || "Услуга мастера"}</h1>
            <p>{currentService.description || "Описание готовится."}</p>
            <strong>{formatServicePrice(currentService)}</strong>
            <fieldset className="cabinetCardInline">
              <legend>Формат</legend>
              {SERVICE_FORMAT_OPTIONS.map((option) => (
                <label className="cabinetCheckbox" key={option.value}>
                  <input
                    checked={selectedFormat === option.value}
                    name="public-service-format"
                    onChange={() => setSelectedFormat(option.value)}
                    type="radio"
                  />
                  {option.label}
                </label>
              ))}
            </fieldset>
            <div className="cabinetActions">
              <button className="cabinetSecondary" type="button" onClick={() => handleAddToCart(currentService)}>Добавить в корзину</button>
              <button className="cabinetPrimary" type="button" onClick={() => handleCheckout(currentService)}>Оформить заказ</button>
            </div>
          </div>
        </section>
      )}
    </main>
  );
}
