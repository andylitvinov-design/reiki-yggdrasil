const SAFE_PUBLIC_ORIGINS = /^https?:\/\//;

function isSafePublicUrl(value) {
  return typeof value === "string" && SAFE_PUBLIC_ORIGINS.test(value);
}

export function getMasterPagePath(profileId) {
  if (!profileId) return null;
  return `/masters/${encodeURIComponent(String(profileId))}`;
}

export function getMasterPageUrl(profileId, origin = "") {
  const path = getMasterPagePath(profileId);
  if (!path) return null;
  const base = typeof origin === "string" && isSafePublicUrl(origin) ? origin.replace(/\/$/, "") : "";
  return `${base}${path}`;
}

export function getServicePath(serviceId) {
  if (!serviceId) return null;
  return `/services/${encodeURIComponent(String(serviceId))}`;
}

export function getServiceUrl(serviceId, origin = "") {
  const path = getServicePath(serviceId);
  if (!path) return null;
  const base = typeof origin === "string" && isSafePublicUrl(origin) ? origin.replace(/\/$/, "") : "";
  return `${base}${path}`;
}

export function getMasterPageInsertText(profileId, origin = "") {
  const url = getMasterPageUrl(profileId, origin);
  if (!url) return "";
  return url;
}

export function getServiceInsertText(service, origin = "") {
  if (!service?.id) return "";
  const url = getServiceUrl(service.id, origin);
  if (!url) return "";
  const title = String(service.title || "Услуга").trim();
  return `${title}: ${url}`;
}

export function filterPublishedServices(services) {
  if (!Array.isArray(services)) return [];
  return services.filter((service) => service.status === "published");
}
