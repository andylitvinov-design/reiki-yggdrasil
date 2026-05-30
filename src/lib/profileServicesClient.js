import { getStoredSession, supabaseEnv } from "./supabaseClient.js";

const SUPABASE_URL = import.meta.env?.VITE_SUPABASE_URL?.replace(/\/$/, "") || "";
const SUPABASE_ANON_KEY = import.meta.env?.VITE_SUPABASE_ANON_KEY || "";
const SERVICES_TABLE = "profile_cabinet_services";
const ORDERS_TABLE = "profile_cabinet_service_orders";
const PUBLIC_SERVICE_FIELDS = [
  "id",
  "profile_id",
  "composition_id",
  "title",
  "description",
  "image_url",
  "image_bucket",
  "image_path",
  "template_image_url",
  "template_image_bucket",
  "template_image_path",
  "delivery_auto_enabled",
  "delivery_master_enabled",
  "delivery_both_enabled",
  "price_amount",
  "price_auto_amount",
  "price_master_amount",
  "price_both_amount",
  "price_currency",
  "status",
  "created_at",
  "updated_at"
].join(",");

export const SERVICE_STATUSES = ["draft", "published", "archived"];
export const ORDER_STATUSES = ["new", "in_progress", "sent", "closed"];
export const DELIVERY_MODES = ["auto_template", "master_finish", "both"];

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

function deliveryMode(value) {
  return DELIVERY_MODES.includes(value) ? value : "auto_template";
}

function bool(value, fallback = true) {
  if (value === undefined || value === null || value === "") return fallback;
  if (typeof value === "boolean") return value;
  if (typeof value === "string") return ["true", "1", "yes", "on"].includes(value.toLowerCase());
  return Boolean(value);
}

function price(value) {
  if (value === null || value === undefined || value === "") return null;
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? number : null;
}

function displayPrice(value) {
  return value === null || value === undefined ? "" : Number(value);
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
    template_image_url: "",
    template_image_bucket: null,
    template_image_path: null,
    delivery_auto_enabled: true,
    delivery_master_enabled: true,
    delivery_both_enabled: true,
    price_amount: "",
    price_auto_amount: "",
    price_master_amount: "",
    price_both_amount: "",
    price_currency: "EUR",
    status: "draft",
    ...overrides
  };
}

export function serviceStatusText(status) {
  return ({ draft: "Черновик", published: "Размещено", archived: "Архив" })[status] || "Черновик";
}

export function orderStatusText(status) {
  return ({ new: "Новая", in_progress: "В работе", sent: "Отправлено", closed: "Закрыта" })[status] || "Новая";
}

export function deliveryModeText(mode) {
  return ({
    auto_template: "Автоматическая мандала",
    master_finish: "С доработкой мастера",
    both: "Обе мандалы"
  })[mode] || "Автоматическая мандала";
}

export function normalizeServiceForm(form = {}, requestedStatus = form?.status) {
  const imageUrl = text(form.image_url || form.template_image_url);
  const templateImageUrl = text(form.template_image_url || form.image_url);

  return {
    profile_id: text(form.profile_id),
    composition_id: text(form.composition_id) || null,
    title: text(form.title),
    description: text(form.description),
    image_url: imageUrl,
    image_bucket: text(form.image_bucket) || null,
    image_path: text(form.image_path) || null,
    template_image_url: templateImageUrl,
    template_image_bucket: text(form.template_image_bucket || form.image_bucket) || null,
    template_image_path: text(form.template_image_path || form.image_path) || null,
    delivery_auto_enabled: bool(form.delivery_auto_enabled, true),
    delivery_master_enabled: bool(form.delivery_master_enabled, true),
    delivery_both_enabled: bool(form.delivery_both_enabled, true),
    price_amount: price(form.price_amount),
    price_auto_amount: price(form.price_auto_amount ?? form.price_amount),
    price_master_amount: price(form.price_master_amount),
    price_both_amount: price(form.price_both_amount),
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
    price_amount: displayPrice(row.price_amount),
    price_auto_amount: displayPrice(row.price_auto_amount ?? row.price_amount),
    price_master_amount: displayPrice(row.price_master_amount),
    price_both_amount: displayPrice(row.price_both_amount),
    display_url: text(row.display_url || row.template_image_url || row.image_url)
  };
}

export function normalizeServiceOrder(row = {}) {
  const service = row.profile_cabinet_services || row.service || null;
  const autoResult = text(row.auto_result_image_url);
  const masterResult = text(row.master_result_image_url || row.result_image_url);
  const finalResult = text(row.final_result_image_url || masterResult || autoResult || row.result_image_url);

  return {
    id: text(row.id),
    service_id: text(row.service_id),
    master_profile_id: text(row.master_profile_id),
    client_name: text(row.client_name),
    client_photo_url: text(row.client_photo_url),
    client_photo_bucket: text(row.client_photo_bucket) || null,
    client_photo_path: text(row.client_photo_path) || null,
    request_text: text(row.request_text),
    delivery_mode: deliveryMode(row.delivery_mode),
    master_comment: text(row.master_comment),
    auto_result_image_url: autoResult,
    auto_result_image_bucket: text(row.auto_result_image_bucket) || null,
    auto_result_image_path: text(row.auto_result_image_path) || null,
    master_result_image_url: masterResult,
    master_result_image_bucket: text(row.master_result_image_bucket || row.result_image_bucket) || null,
    master_result_image_path: text(row.master_result_image_path || row.result_image_path) || null,
    final_result_image_url: finalResult,
    final_result_image_bucket: text(row.final_result_image_bucket || row.result_image_bucket) || null,
    final_result_image_path: text(row.final_result_image_path || row.result_image_path) || null,
    result_image_url: text(row.result_image_url || finalResult),
    result_image_bucket: text(row.result_image_bucket) || null,
    result_image_path: text(row.result_image_path) || null,
    status: orderStatus(row.status),
    created_at: row.created_at || null,
    updated_at: row.updated_at || null,
    service: service ? normalizeServiceRow(service) : null
  };
}

export function serviceDeliveryOptions(service = {}) {
  const options = [];
  if (bool(service.delivery_auto_enabled, true)) {
    options.push({ mode: "auto_template", label: deliveryModeText("auto_template"), price_amount: service.price_auto_amount ?? service.price_amount ?? "" });
  }
  if (bool(service.delivery_master_enabled, true)) {
    options.push({ mode: "master_finish", label: deliveryModeText("master_finish"), price_amount: service.price_master_amount ?? "" });
  }
  if (bool(service.delivery_both_enabled, true)) {
    options.push({ mode: "both", label: deliveryModeText("both"), price_amount: service.price_both_amount ?? "" });
  }
  return options;
}

export function priceForDeliveryMode(service = {}, mode = "auto_template") {
  if (mode === "master_finish") return service.price_master_amount ?? service.price_amount ?? "";
  if (mode === "both") return service.price_both_amount ?? service.price_amount ?? "";
  return service.price_auto_amount ?? service.price_amount ?? "";
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
  const mode = deliveryMode(order?.delivery_mode);
  const body = {
    service_id: text(order?.service_id),
    master_profile_id: text(order?.master_profile_id),
    client_name: text(order?.client_name),
    client_photo_url: text(order?.client_photo_url),
    client_photo_bucket: text(order?.client_photo_bucket) || null,
    client_photo_path: text(order?.client_photo_path) || null,
    request_text: text(order?.request_text),
    delivery_mode: mode,
    auto_result_image_url: text(order?.auto_result_image_url),
    auto_result_image_bucket: text(order?.auto_result_image_bucket) || null,
    auto_result_image_path: text(order?.auto_result_image_path) || null,
    final_result_image_url: mode === "auto_template" ? text(order?.auto_result_image_url || order?.final_result_image_url) : text(order?.final_result_image_url),
    status: "new"
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
  const select = "*,profile_cabinet_services(id,profile_id,composition_id,title,description,image_url,image_bucket,image_path,template_image_url,template_image_bucket,template_image_path,delivery_auto_enabled,delivery_master_enabled,delivery_both_enabled,price_amount,price_auto_amount,price_master_amount,price_both_amount,price_currency,status)";
  const rows = await request(`/rest/v1/${ORDERS_TABLE}?master_profile_id=eq.${encodeURIComponent(profileId)}&select=${select}&order=created_at.desc`, { session });
  return Array.isArray(rows) ? rows.map(normalizeServiceOrder) : [];
}

export async function updateServiceOrder(orderId, order, session = getStoredSession()) {
  if (!orderId) throw makeError("Missing order id.");
  const masterResult = text(order?.master_result_image_url || order?.result_image_url);
  const finalResult = text(order?.final_result_image_url || masterResult || order?.auto_result_image_url);
  const body = {
    master_comment: text(order?.master_comment),
    auto_result_image_url: text(order?.auto_result_image_url),
    auto_result_image_bucket: text(order?.auto_result_image_bucket) || null,
    auto_result_image_path: text(order?.auto_result_image_path) || null,
    master_result_image_url: masterResult,
    master_result_image_bucket: text(order?.master_result_image_bucket || order?.result_image_bucket) || null,
    master_result_image_path: text(order?.master_result_image_path || order?.result_image_path) || null,
    final_result_image_url: finalResult,
    final_result_image_bucket: text(order?.final_result_image_bucket || order?.result_image_bucket) || null,
    final_result_image_path: text(order?.final_result_image_path || order?.result_image_path) || null,
    result_image_url: masterResult || finalResult,
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
