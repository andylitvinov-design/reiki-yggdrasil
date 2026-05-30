import React, { useEffect, useMemo, useState } from "react";
import {
  createServiceOrder,
  deliveryModeText,
  listPublicServices,
  priceForDeliveryMode,
  serviceDeliveryOptions
} from "../lib/profileServicesClient.js";
import { renderTemplateMandalaToDataUrl } from "../lib/mandalaTemplateRenderer.js";
import "../templateServices.css";

function imageStyle(url) {
  return url ? { backgroundImage: `url(${url})` } : undefined;
}

function displayPrice(value, currency = "EUR") {
  if (value === "" || value === null || value === undefined) return "Цена по запросу";
  return `${Number(value)} ${currency}`;
}

export default function PublicTemplateServicesPanel({ enabled = true, limit = 24 }) {
  const [services, setServices] = useState([]);
  const [selectedServiceId, setSelectedServiceId] = useState("");
  const [deliveryMode, setDeliveryMode] = useState("auto_template");
  const [form, setForm] = useState({ client_name: "", client_photo_url: "", request_text: "" });
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);
  const [autoPreviewUrl, setAutoPreviewUrl] = useState("");

  const selectedService = useMemo(
    () => services.find((service) => service.id === selectedServiceId) || services[0] || null,
    [services, selectedServiceId]
  );

  const deliveryOptions = useMemo(() => serviceDeliveryOptions(selectedService || {}), [selectedService]);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const rows = await listPublicServices({ limit });
        if (cancelled) return;
        setServices(rows || []);
        setSelectedServiceId((current) => current || rows?.[0]?.id || "");
      } catch (error) {
        if (!cancelled) setNotice(error.message || "Не удалось загрузить услуги мастеров.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [enabled, limit]);

  useEffect(() => {
    if (!deliveryOptions.some((option) => option.mode === deliveryMode)) {
      setDeliveryMode(deliveryOptions[0]?.mode || "auto_template");
    }
  }, [deliveryMode, deliveryOptions]);

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
    setAutoPreviewUrl("");
  }

  async function buildAutoPreview(service = selectedService) {
    const templateImageUrl = service?.template_image_url || service?.image_url || "";
    if (!templateImageUrl || !form.client_photo_url) return "";

    try {
      return await renderTemplateMandalaToDataUrl({
        templateImageUrl,
        clientPhotoUrl: form.client_photo_url,
        centerShape: "circle",
        centerSizeRatio: 0.28
      });
    } catch {
      return "";
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!selectedService?.id) {
      setNotice("Выберите услугу.");
      return;
    }

    if (!form.client_name.trim()) {
      setNotice("Укажите имя клиента.");
      return;
    }

    if (!form.client_photo_url.trim()) {
      setNotice("Добавьте ссылку на фото клиента. Загрузка файла будет отдельным безопасным шагом после Storage/RLS проверки.");
      return;
    }

    setLoading(true);
    setNotice("");

    try {
      const autoResult = await buildAutoPreview(selectedService);
      await createServiceOrder({
        service_id: selectedService.id,
        master_profile_id: selectedService.profile_id,
        client_name: form.client_name,
        client_photo_url: form.client_photo_url,
        request_text: form.request_text,
        delivery_mode: deliveryMode,
        auto_result_image_url: autoResult
      });

      setAutoPreviewUrl(autoResult);
      setForm({ client_name: "", client_photo_url: "", request_text: "" });
      setNotice(deliveryMode === "auto_template"
        ? "Заявка создана. Автоматическая мандала подготовлена, если браузер смог собрать шаблон с фото."
        : "Заявка отправлена мастеру. Заготовка из шаблона появится во вкладке «Заявки»."
      );
    } catch (error) {
      setNotice(error.message || "Не удалось создать заявку.");
    } finally {
      setLoading(false);
    }
  }

  if (!enabled) return null;

  return (
    <section className="publicTemplateServicesPanel">
      <div>
        <p className="cabinetEyebrow">Услуги мастеров</p>
        <h2>Шаблонные мандалы с фото клиента</h2>
        <p>Выберите готовый шаблон мастера и вариант: автоматическая мандала, ручная доработка мастера или обе версии.</p>
      </div>

      {notice && <div className="cabinetNotice">{notice}</div>}
      {loading && <div className="cabinetNotice">Загружаю...</div>}

      <div className="publicTemplateServicesGrid">
        {services.map((service) => (
          <article className="publicTemplateServiceCard" key={service.id}>
            <div className="publicTemplateServiceImage" style={imageStyle(service.template_image_url || service.image_url)}>◎</div>
            <h3>{service.title || "Услуга мастера"}</h3>
            <p>{service.description || "Персональная мандала на основе сохранённого шаблона."}</p>
            <div className="publicTemplateDeliveryOptions">
              {serviceDeliveryOptions(service).map((option) => (
                <button
                  className={selectedService?.id === service.id && deliveryMode === option.mode ? "active" : ""}
                  key={option.mode}
                  onClick={() => {
                    setSelectedServiceId(service.id);
                    setDeliveryMode(option.mode);
                    setNotice("");
                  }}
                  type="button"
                >
                  <b>{option.label}</b><br />
                  <small>{displayPrice(priceForDeliveryMode(service, option.mode), service.price_currency)}</small>
                </button>
              ))}
            </div>
          </article>
        ))}
      </div>

      {services.length === 0 && !loading && <p>Опубликованные услуги появятся здесь после размещения мастерами.</p>}

      {selectedService && (
        <form className="publicTemplateOrderForm" onSubmit={handleSubmit}>
          <h3>Заказать: {selectedService.title}</h3>
          <p><b>Вариант:</b> {deliveryModeText(deliveryMode)} · {displayPrice(priceForDeliveryMode(selectedService, deliveryMode), selectedService.price_currency)}</p>

          <label>
            Ваше имя
            <input value={form.client_name} onChange={(event) => updateField("client_name", event.target.value)} placeholder="Имя клиента" />
          </label>

          <label>
            Фото клиента / цели
            <input value={form.client_photo_url} onChange={(event) => updateField("client_photo_url", event.target.value)} placeholder="Ссылка на фото" />
            <small>В этом безопасном MVP используется ссылка на фото. Анонимная загрузка файла требует отдельной Storage/RLS проверки.</small>
          </label>

          <label>
            Примечание / запрос
            <textarea rows={4} value={form.request_text} onChange={(event) => updateField("request_text", event.target.value)} placeholder="Опишите задачу" />
          </label>

          {autoPreviewUrl && (
            <div className="publicTemplateServiceCard">
              <b>Автоматическая версия</b>
              <div className="publicTemplateServiceImage" style={imageStyle(autoPreviewUrl)} />
              <a className="cabinetSecondary" href={autoPreviewUrl} download="mandala-template-result.png">Скачать</a>
            </div>
          )}

          <button className="cabinetPrimary" disabled={loading} type="submit">Заказать</button>
        </form>
      )}
    </section>
  );
}
