import { getStoredSession, supabaseEnv } from "./supabaseClient.js";

const SUPABASE_URL = import.meta.env?.VITE_SUPABASE_URL?.replace(/\/$/, "") || "";
const SUPABASE_ANON_KEY = import.meta.env?.VITE_SUPABASE_ANON_KEY || "";
const SERVICES_TABLE = "profile_cabinet_services";
const ORDERS_TABLE = "profile_cabinet_service_orders";
const PUBLIC_SERVICE_FIELDS = "id,profile_id,composition_id,title,description,image_url,image_bucket,image_path,price_amount,price_currency,status,created_at,updated_at";

export const SERVICE_STATUSES = ["draft", "published", "archived"];
export const ORDER_STATUSES = ["draft", "new", "in_progress", "sent", "closed"];
export const SERVICE_FORMATS = ["signature", "no_signature", "both"];
export const SERVICE_FORMAT_OPTIONS = [
  {
    value: "signature",
    label: "С подписью мастера",
    shortLabel: "Подпись мастера",
    description: "Авторская версия с подписью мастера на готовом артефакте."
  },
  {
    value: "no_signature",
    label: "Без подписи мастера",
    shortLabel: "Без подписи",
    description: "Чистая версия изображения без подписи, удобная для личного использования или печати."
  },
  {
    value: "both",
    label: "Две версии",
    shortLabel: "Две версии",
    description: "Вы получите оба варианта: с подписью мастера и без подписи."
  }
];

function makeError(message, details = null) {
  const error = new Error(message);
  error.details = details;
  return error;
}

function text(value) {
  return String(value || "").trim();
}

function serviceStatus(value) {
  return SERVICE_STATUSES.includes(value) ? value : "draft";
}

function orderStatus(value) {
  return ORDER_STATUSES.includes(value) ? value : "new";
}

function serviceFormat(value) {
  return SERVICE_FORMATS.includes(value) ? value : "signature";
}

function price(value) {
  if (value === null || value === undefined || value === "") return null;
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? number : null;
}

export function createEmptyServiceForm(overrides = {}) {
  return {
    id: "",
    profile_id: "",
    composition_id: "",
    title: "",
    description: "",
    image_url: "",
    image_bucket: null,
    image_path: null,
    price_amount: "",
    price_currency: "EUR",
    status: "draft",
    ...overrides
  };
}

export function serviceStatusText(status) {
  return ({ draft: "Черновик", published: "Размещено", archived: "Архив" })[status] || "Черновик";
}

export function orderStatusText(status) {
  return ({ draft: "Черновик", new: "Новая", in_progress: "В работе", sent: "Отправлено", closed: "Закрыта" })[status] || "Новая";
}

export function serviceFormatText(format) {
  return SERVICE_FORMAT_OPTIONS.find((item) => item.value === serviceFormat(format))?.label || "С подписью мастера";
}

export function normalizeServiceForm(form = {}, requestedStatus = form?.status) {
  return {
    profile_id: text(form.profile_id),
    composition_id: text(form.composition_id) || null,
    title: text(form.title),
    description: text(form.description),
    image_url: text(form.image_url),
    image_bucket: text(form.image_bucket) || null,
    image_path: text(form.image_path) || null,
    price_amount: price(form.price_amount),
    price_currency: text(form.price_currency || "EUR") || "EUR",
    status: serviceStatus(requestedStatus)
  };
}

export function normalizeServiceRow(row = {}) {
  const normalized = normalizeServiceForm(row, row.status);
  return {
    ...normalized,
    id: text(row.id),
    created_at: row.created_at || null,
    updated_at: row.updated_at || null,
    price_amount: row.price_amount === null || row.price_amount === undefined ? "" : Number(row.price_amount),
    display_url: text(row.display_url || row.image_url)
  };
}

export function normalizeServiceOrder(row = {}) {
  const service = row.profile_cabinet_services || row.service || null;
  return {
    id: text(row.id),
    service_id: text(row.service_id),
    master_profile_id: text(row.master_profile_id),
    client_name: text(row.client_name),
    client_photo_url: text(row.client_photo_url),
    client_photo_bucket: text(row.client_photo_bucket) || null,
    client_photo_path: text(row.client_photo_path) || null,
    service_format: serviceFormat(row.service_format),
    request_text: text(row.request_text),
    goal_text: text(row.goal_text),
    client_comment: text(row.client_comment),
    master_comment: text(row.master_comment),
    result_image_url: text(row.result_image_url),
    result_image_bucket: text(row.result_image_bucket) || null,
    result_image_path: text(row.result_image_path) || null,
    status: orderStatus(row.status),
    created_at: row.created_at || null,
    updated_at: row.updated_at || null,
    service: service ? normalizeServiceRow(service) : null
  };
}

async function request(path, options = {}) {
  if (!supabaseEnv.isConfigured) throw makeError("Supabase is not configured.");
  const session = options.session || getStoredSession();
  const token = options.publicRequest ? SUPABASE_ANON_KEY : session?.access_token;
  if (!options.publicRequest && !token) throw makeError("Auth required.");

  const response = await fetch(`${SUPABASE_URL}${path}`, {
    method: options.method || "GET",
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${token || SUPABASE_ANON_KEY}`,
      "Content-Type": "application/json",
      ...(options.prefer ? { Prefer: options.prefer } : {})
    },
    body: options.body === undefined ? undefined : JSON.stringify(options.body)
  });
  const raw = await response.text();
  const data = raw ? JSON.parse(raw) : null;
  if (!response.ok) throw makeError(data?.msg || data?.message || "Services request failed.", { ...(data || {}), status: response.status });
  return data;
}

export async function listPublicServices({ limit = 24 } = {}) {
  const safeLimit = Math.min(Math.max(Math.trunc(Number(limit) || 24), 1), 48);
  const rows = await request(`/rest/v1/${SERVICES_TABLE}?status=eq.published&select=${PUBLIC_SERVICE_FIELDS}&order=updated_at.desc&limit=${safeLimit}`, { publicRequest: true });
  return Array.isArray(rows) ? rows.map(normalizeServiceRow) : [];
}

export async function listOwnServices(profileId, session = getStoredSession()) {
  if (!profileId || !session?.access_token) return [];
  const rows = await request(`/rest/v1/${SERVICES_TABLE}?profile_id=eq.${encodeURIComponent(profileId)}&select=*&order=updated_at.desc`, { session });
  return Array.isArray(rows) ? rows.map(normalizeServiceRow) : [];
}

export async function createOwnService(service, session = getStoredSession()) {
  const rows = await request(`/rest/v1/${SERVICES_TABLE}`, {
    method: "POST",
    session,
    prefer: "return=representation",
    body: normalizeServiceForm(service, service?.status || "draft")
  });
  return rows?.[0] ? normalizeServiceRow(rows[0]) : null;
}

export async function updateOwnService(serviceId, service, session = getStoredSession()) {
  if (!serviceId) throw makeError("Missing service id.");
  const rows = await request(`/rest/v1/${SERVICES_TABLE}?id=eq.${encodeURIComponent(serviceId)}`, {
    method: "PATCH",
    session,
    prefer: "return=representation",
    body: normalizeServiceForm(service, service?.status || "draft")
  });
  return rows?.[0] ? normalizeServiceRow(rows[0]) : null;
}

export async function publishOwnService(serviceOrId, service = null, session = getStoredSession()) {
  const id = typeof serviceOrId === "string" ? serviceOrId : serviceOrId?.id;
  const payload = typeof serviceOrId === "string" ? service || {} : serviceOrId || {};
  return id ? updateOwnService(id, { ...payload, status: "published" }, session) : createOwnService({ ...payload, status: "published" }, session);
}

export async function createServiceOrder(order, session = getStoredSession()) {
  const body = {
    service_id: text(order?.service_id),
    master_profile_id: text(order?.master_profile_id),
    client_name: text(order?.client_name),
    client_photo_url: text(order?.client_photo_url),
    client_photo_bucket: text(order?.client_photo_bucket) || null,
    client_photo_path: text(order?.client_photo_path) || null,
    service_format: serviceFormat(order?.service_format),
    request_text: text(order?.request_text),
    goal_text: text(order?.goal_text),
    client_comment: text(order?.client_comment),
    status: orderStatus(order?.status || "new")
  };
  if (!body.service_id) throw makeError("Missing service id.");
  const rows = await request(`/rest/v1/${ORDERS_TABLE}`, {
    method: "POST",
    session,
    publicRequest: !session?.access_token,
    prefer: "return=representation",
    body
  });
  return rows?.[0] ? normalizeServiceOrder(rows[0]) : null;
}

export async function listOwnServiceOrders(profileId, session = getStoredSession()) {
  if (!profileId || !session?.access_token) return [];
  const select = "*,profile_cabinet_services(id,profile_id,composition_id,title,description,image_url,image_bucket,image_path,price_amount,price_currency,status)";
  const rows = await request(`/rest/v1/${ORDERS_TABLE}?master_profile_id=eq.${encodeURIComponent(profileId)}&select=${select}&order=created_at.desc`, { session });
  return Array.isArray(rows) ? rows.map(normalizeServiceOrder) : [];
}

export async function updateServiceOrder(orderId, order, session = getStoredSession()) {
  if (!orderId) throw makeError("Missing order id.");
  const body = {
    master_comment: text(order?.master_comment),
    result_image_url: text(order?.result_image_url),
    result_image_bucket: text(order?.result_image_bucket) || null,
    result_image_path: text(order?.result_image_path) || null,
    status: orderStatus(order?.status || "sent")
  };
  const rows = await request(`/rest/v1/${ORDERS_TABLE}?id=eq.${encodeURIComponent(orderId)}`, {
    method: "PATCH",
    session,
    prefer: "return=representation",
    body
  });
  return rows?.[0] ? normalizeServiceOrder(rows[0]) : null;
}
