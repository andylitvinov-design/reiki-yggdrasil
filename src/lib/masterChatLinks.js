const DEFAULT_ORIGIN = "https://mentalica.vercel.app";

function cleanText(value) {
  return String(value || "").trim();
}

export function isPublishedShareableService(service) {
  return Boolean(service?.id && service?.status === "published");
}

export function buildServicePublicPath(service) {
  if (!service?.id) return "";
  return `/services/${encodeURIComponent(service.id)}`;
}

export function buildServicePublicUrl(service, origin = "") {
  const path = buildServicePublicPath(service);
  if (!path) return "";
  const safeOrigin = cleanText(origin).replace(/\/$/, "") || DEFAULT_ORIGIN;
  return `${safeOrigin}${path}`;
}

export function buildServiceShareText(service, origin = "") {
  if (!isPublishedShareableService(service)) return "";
  const title = cleanText(service.title) || "Услуга мастера";
  const description = cleanText(service.description);
  const url = buildServicePublicUrl(service, origin);
  const price = service.price_amount ? `${service.price_amount} ${service.price_currency || "EUR"}` : "Бесплатно / donation";
  return [
    `Посмотри мою услугу: ${title}`,
    description ? `Описание: ${description}` : "",
    `Формат/цена: ${price}`,
    url
  ].filter(Boolean).join("\n");
}

export function listShareableServices(services = []) {
  return (Array.isArray(services) ? services : [])
    .filter(isPublishedShareableService)
    .sort((a, b) => cleanText(a.title).localeCompare(cleanText(b.title), "ru"));
}
