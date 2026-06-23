import { clonePowerPlaceCompositionForOrder } from "./powerPlaceClient.js";
import { getStoredSession, supabaseEnv } from "./supabaseClient.js";

const SUPABASE_URL = import.meta.env?.VITE_SUPABASE_URL?.replace(/\/$/, "") || "";
const SUPABASE_ANON_KEY = import.meta.env?.VITE_SUPABASE_ANON_KEY || "";
const SERVICES_TABLE = "profile_cabinet_services";
const ORDERS_TABLE = "profile_cabinet_service_orders";
const PUBLIC_SERVICE_FIELDS = "id,profile_id,composition_id,title,description,image_url,image_bucket,image_path,price_amount,price_currency,status,created_at,updated_at";
const PENDING_CART_MAX_AGE_MS = 24 * 60 * 60 * 1000;

export const SERVICE_STATUSES = ["draft", "published", "archived"];
export const ORDER_STATUSES = ["draft", "photo_required", "new", "ready_for_review", "in_progress", "sent", "closed"];
export const SERVICE_FORMAT_OPTIONS = [
  { value: "signature", label: "С подписью мастера" },
  { value: "no_signature", label: "Без подписи мастера" },
  { value: "both", label: "Две версии" }
];
export const SERVICE_CART_KEY = "reiki-yggdrasil-service-cart";
export const PENDING_SERVICE_CART_KEY = "reiki-yggdrasil-pending-service-cart";
export const PUBLIC_SERVICE_NOT_FOUND_MESSAGE = "Услуга не найдена";
export const PUBLIC_SERVICE_UNAVAILABLE_MESSAGE = "Услуга недоступна или снята с публикации";

function makeError(message, details = null) {
  const error = new Error(message);
  error.details = details;
  return error;
}

function text(value) {
  return String(value || "").trim();
}

function isFilenameLikeName(value) {
  const name = text(value);
  if (!name) return false;
  return (
    /^img[_-]?\d+\.(jpe?g|png|webp|heic|gif)$/i.test(name) ||
    /^[\w\s().-]+\.(jpe?g|png|webp|heic|gif|pdf)$/i.test(name)
  );
}

export function getClientDisplayName(client = {}) {
  const rawName = text(client.client_name || client.name || client.title);
  if (rawName && !isFilenameLikeName(rawName)) return rawName;
  return "Клиент без имени";
}

function getClientDisplayNote(client = {}) {
  const rawName = text(client.client_name || client.name || client.title);
  return rawName && rawName !== getClientDisplayName(client) ? "Имя клиента не заполнено" : "";
}

function serviceStatus(value) {
  return SERVICE_STATUSES.includes(value) ? value : "draft";
}

function orderStatus(value) {
  return ORDER_STATUSES.includes(value) ? value : "new";
}

function price(value) {
  if (value === null || value === undefined || value === "") return null;
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? number : null;
}

function serviceImageRef(value) {
  const ref = text(value);
  return ref.startsWith("data:image/") ? "" : ref;
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
    format_option: SERVICE_FORMAT_OPTIONS[0].value,
    status: "draft",
    ...overrides
  };
}

export function serviceStatusText(status) {
  return ({ draft: "Черновик", published: "Размещено", archived: "Архив" })[status] || "Черновик";
}

export function orderStatusText(status) {
  return ({
    draft: "Черновик",
    photo_required: "Нужно фото",
    new: "Новая",
    ready_for_review: "Готово к проверке",
    in_progress: "В работе",
    sent: "Отправлено",
    closed: "Закрыта"
  })[status] || "Новая";
}

export function clientMandalaStatusText(status) {
  return ({
    draft: "Черновик",
    photo_required: "Черновик",
    new: "Черновик",
    in_progress: "Черновик",
    saved_for_client: "Сохранено для клиента",
    ready_for_review: "Готово к отправке",
    sent: "Отправлено клиенту",
    closed: "Отправлено клиенту",
    save_error: "Ошибка сохранения/отправки",
    send_error: "Ошибка сохранения/отправки",
    error: "Ошибка сохранения/отправки"
  })[text(status)] || "Черновик";
}

function displayableImageUrl(value) {
  const url = text(value);
  return url && (/^https?:\/\//.test(url) || url.startsWith("data:image/") || url.startsWith("/")) ? url : "";
}

function compositionPreviewUrl(composition = {}) {
  const objectRefs = composition?.object_refs || {};
  const objectRefUrls = composition?.object_ref_urls || {};
  const cover = composition?.cover_ref || {};
  const candidates = [
    composition.preview_url,
    composition.preview_image_url,
    composition.thumbnail_url,
    composition.image_url,
    objectRefs.__preview_image,
    objectRefs.__mandala_preview,
    objectRefs.__center_image,
    cover.inner?.display_src,
    cover.display_src,
    cover.outer?.display_src,
    cover.inner?.src,
    cover.src,
    cover.outer?.src,
    ...Object.values(objectRefs || {}).filter((value) => typeof value === "string")
  ];

  for (const candidate of candidates) {
    const direct = displayableImageUrl(candidate);
    if (direct) return direct;
    const signed = displayableImageUrl(objectRefUrls?.[candidate]);
    if (signed) return signed;
  }

  return "";
}

export function getClientMandalaPreviewState(item = {}) {
  const imageUrl = displayableImageUrl(item.preview_url || item.display_url || item.result_image_url || item.image_url);
  if (imageUrl) return { src: imageUrl, message: "" };
  if (item.result_image_bucket || item.result_image_path || item.image_bucket || item.image_path) {
    return { src: "", message: "Превью недоступно" };
  }
  return { src: "", message: "Превью мандалы пока не создано" };
}

export function formatServicePrice(service = {}) {
  const amount = price(service.price_amount);
  if (!amount) return "Бесплатно";
  return `${amount} ${text(service.price_currency || "EUR") || "EUR"}`;
}

export function getServicePublicLinkState(service = {}) {
  const status = serviceStatus(service.status);
  if (status === "published") {
    return {
      isActive: Boolean(text(service.id)),
      message: "Публичная ссылка для клиентов"
    };
  }
  if (status === "archived") {
    return {
      isActive: false,
      message: "Услуга в архиве. Публичная ссылка отключена."
    };
  }
  return {
    isActive: false,
    message: "Ссылка появится после публикации."
  };
}

export function buildServicePublicUrl(service = {}, origin = globalThis.location?.origin || "") {
  const id = encodeURIComponent(text(service.id));
  const base = text(origin).replace(/\/$/, "");
  return id && base ? `${base}/services/${id}` : "";
}

export function buildCompositionResultUrl(compositionId, origin = globalThis.location?.origin || "") {
  const id = text(compositionId);
  const base = text(origin).replace(/\/$/, "");
  return id && base ? `${base}/profile/mandalas?composition=${encodeURIComponent(id)}` : "";
}

export function filterPublishedServices(services = []) {
  return (services || []).filter((service) => serviceStatus(service?.status) === "published");
}

export function buildServiceQueryParams({ publicOnly = false, id = "", limit = 24 } = {}) {
  const params = [];
  if (id) params.push(`id=eq.${encodeURIComponent(text(id))}`);
  if (publicOnly) params.push("status=eq.published");
  params.push(`select=${encodeURIComponent(PUBLIC_SERVICE_FIELDS)}`);
  if (!id) {
    params.push("order=updated_at.desc");
    params.push(`limit=${Math.min(Math.max(Math.trunc(Number(limit) || 24), 1), 48)}`);
  } else {
    params.push("limit=1");
  }

  return {
    path: `/rest/v1/${SERVICES_TABLE}?${params.join("&")}`,
    publicRequest: true
  };
}

export function resolvePublicServiceState(service, requestedId = "") {
  if (!service?.id || (requestedId && text(service.id) !== text(requestedId))) {
    return { isVisible: false, message: PUBLIC_SERVICE_NOT_FOUND_MESSAGE, service: null };
  }
  if (serviceStatus(service.status) !== "published") {
    return { isVisible: false, message: PUBLIC_SERVICE_UNAVAILABLE_MESSAGE, service: null };
  }
  return { isVisible: true, message: "", service };
}

export function groupServicesByStatus(services = []) {
  return services.reduce((groups, service) => {
    const status = serviceStatus(service?.status);
    groups[status].push(service);
    return groups;
  }, { draft: [], published: [], archived: [] });
}

function clientWorkFromComposition(composition = {}) {
  const meta = composition?.object_refs?.__client_work || {};
  const clientName = text(meta.client_name);
  if (!clientName && !text(meta.client_profile_id)) return null;
  const previewUrl = displayableImageUrl(meta.preview_url || meta.image_url || meta.result_image_url) || compositionPreviewUrl(composition);
  return {
    id: text(composition.id),
    title: text(composition.title) || "Мандала",
    client_profile_id: text(meta.client_profile_id),
    client_name: clientName || "Без имени",
    client_photo_id: text(meta.client_photo_id),
    request_text: text(meta.request_text),
    result_composition_id: text(meta.result_composition_id || composition.id),
    preview_url: previewUrl,
    image_url: previewUrl,
    image_bucket: text(meta.image_bucket || composition.image_bucket) || null,
    image_path: text(meta.image_path || composition.image_path) || null,
    status: text(meta.status || "saved_for_client"),
    created_at: composition.created_at || null
  };
}

export function buildClientDirectoryFromOrders(orders = [], clientGoalPhotos = [], clientCompositions = []) {
  const clientsByKey = new Map();
  const ensureClient = ({ key, client_profile_id = "", client_name = "Без имени" }) => {
    const safeKey = text(key);
    const normalizedName = text(client_name) || "Без имени";
    const displayName = getClientDisplayName({ client_name: normalizedName, client_profile_id });
    const existing = clientsByKey.get(safeKey) || {
      key: safeKey,
      client_profile_id: text(client_profile_id),
      client_name: normalizedName,
      client_display_name: displayName,
      client_display_note: getClientDisplayNote({ client_name: normalizedName, client_profile_id }),
      orders: [],
      photos: [],
      clientWorks: []
    };
    if (existing.client_display_name === "Клиент без имени" && displayName !== "Клиент без имени") {
      existing.client_name = normalizedName;
      existing.client_display_name = displayName;
      existing.client_display_note = "";
    }
    clientsByKey.set(safeKey, existing);
    return existing;
  };

  for (const order of orders || []) {
    const normalizedOrder = normalizeServiceOrder(order);
    const key = normalizedOrder.client_profile_id
      ? `client:${normalizedOrder.client_profile_id}`
      : `name:${normalizedOrder.client_name || "Без имени"}`;
    ensureClient({
      key,
      client_profile_id: normalizedOrder.client_profile_id,
      client_name: normalizedOrder.client_name || "Без имени"
    }).orders.push(normalizedOrder);
  }

  for (const work of (clientCompositions || []).map(clientWorkFromComposition).filter(Boolean)) {
    const key = work.client_profile_id ? `client:${work.client_profile_id}` : `name:${work.client_name}`;
    ensureClient({
      key,
      client_profile_id: work.client_profile_id,
      client_name: work.client_name
    }).clientWorks.push(work);
  }

  return [...clientsByKey.values()].sort((a, b) => (
    (a.client_display_name || a.client_name).localeCompare((b.client_display_name || b.client_name), "ru")
  ));
}

export function normalizeServiceForm(form = {}, requestedStatus = form?.status) {
  return {
    profile_id: text(form.profile_id),
    composition_id: text(form.composition_id) || null,
    title: text(form.title),
    description: text(form.description),
    image_url: serviceImageRef(form.image_url),
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
    display_url: serviceImageRef(row.display_url || row.image_url),
    format_option: SERVICE_FORMAT_OPTIONS.some((option) => option.value === row.format_option)
      ? row.format_option
      : SERVICE_FORMAT_OPTIONS[0].value
  };
}

export function normalizeServiceOrder(row = {}) {
  const service = row.profile_cabinet_services || row.service || null;
  return {
    id: text(row.id),
    service_id: text(row.service_id),
    master_profile_id: text(row.master_profile_id),
    client_profile_id: text(row.client_profile_id),
    template_composition_id: text(row.template_composition_id),
    draft_result_composition_id: text(row.draft_result_composition_id),
    final_result_composition_id: text(row.final_result_composition_id),
    order_format: normalizeServiceFormat(row.order_format),
    client_photo_id: text(row.client_photo_id),
    client_name: text(row.client_name),
    client_photo_url: text(row.client_photo_url),
    client_photo_bucket: text(row.client_photo_bucket) || null,
    client_photo_path: text(row.client_photo_path) || null,
    request_text: text(row.request_text),
    master_comment: text(row.master_comment),
    result_image_url: text(row.result_image_url),
    result_image_bucket: text(row.result_image_bucket) || null,
    result_image_path: text(row.result_image_path) || null,
    status: orderStatus(row.status),
    sent_at: row.sent_at || null,
    created_at: row.created_at || null,
    updated_at: row.updated_at || null,
    service: service ? normalizeServiceRow(service) : null
  };
}

function normalizeServiceFormat(value) {
  return SERVICE_FORMAT_OPTIONS.some((option) => option.value === value) ? value : SERVICE_FORMAT_OPTIONS[0].value;
}

export function buildServiceCartItem({ service, format = SERVICE_FORMAT_OPTIONS[0].value, now = new Date().toISOString() } = {}) {
  const normalized = normalizeServiceRow(service || {});
  if (!normalized.id) throw makeError("Missing service id.");
  if (serviceStatus(normalized.status) !== "published") throw makeError(PUBLIC_SERVICE_UNAVAILABLE_MESSAGE);
  return {
    service_id: normalized.id,
    composition_id: text(normalized.composition_id),
    master_profile_id: text(normalized.profile_id),
    format: normalizeServiceFormat(format),
    price_amount: price(normalized.price_amount) || null,
    price_currency: text(normalized.price_currency || "EUR") || "EUR",
    created_at: now
  };
}

function parseCartItem(raw) {
  try {
    if (!raw) return null;
    const item = typeof raw === "string" ? JSON.parse(raw) : raw;
    if (!item?.service_id || !item?.master_profile_id) return null;
    return {
      service_id: text(item.service_id),
      composition_id: text(item.composition_id),
      master_profile_id: text(item.master_profile_id),
      format: normalizeServiceFormat(item.format),
      price_amount: price(item.price_amount),
      price_currency: text(item.price_currency || "EUR") || "EUR",
      created_at: item.created_at || new Date().toISOString()
    };
  } catch {
    return null;
  }
}

export function isPendingServiceCartFresh(item, now = new Date()) {
  const createdAt = Date.parse(item?.created_at || "");
  if (!Number.isFinite(createdAt)) return false;
  return now.getTime() - createdAt <= PENDING_CART_MAX_AGE_MS;
}

export function createServiceCartStore(storage = globalThis.localStorage) {
  return {
    get() {
      return parseCartItem(storage?.getItem(SERVICE_CART_KEY));
    },
    set(item) {
      const safeItem = parseCartItem(item);
      if (!safeItem) throw makeError("Missing cart item.");
      storage?.setItem(SERVICE_CART_KEY, JSON.stringify(safeItem));
      return safeItem;
    },
    clear() {
      storage?.removeItem(SERVICE_CART_KEY);
    },
    savePending(item = this.get()) {
      const safeItem = parseCartItem(item);
      if (!safeItem) throw makeError("Missing cart item.");
      storage?.setItem(PENDING_SERVICE_CART_KEY, JSON.stringify(safeItem));
      return safeItem;
    },
    restoreFreshPending(now = new Date()) {
      const pending = parseCartItem(storage?.getItem(PENDING_SERVICE_CART_KEY));
      if (!pending) return null;
      if (!isPendingServiceCartFresh(pending, now)) {
        storage?.removeItem(PENDING_SERVICE_CART_KEY);
        return null;
      }
      storage?.setItem(SERVICE_CART_KEY, JSON.stringify(pending));
      return pending;
    },
    clearPending() {
      storage?.removeItem(PENDING_SERVICE_CART_KEY);
    }
  };
}

export function buildServiceOrderDraftPayload({ cartItem, clientProfileId, service } = {}) {
  const item = parseCartItem(cartItem);
  const normalizedService = normalizeServiceRow(service || {});
  if (!item?.service_id) throw makeError("Missing cart item.");
  if (!clientProfileId) throw makeError("Missing client profile id.");
  if (!normalizedService.id || normalizedService.id !== item.service_id || serviceStatus(normalizedService.status) !== "published") {
    throw makeError(PUBLIC_SERVICE_UNAVAILABLE_MESSAGE);
  }
  return {
    service_id: item.service_id,
    master_profile_id: text(normalizedService.profile_id || item.master_profile_id),
    client_profile_id: text(clientProfileId),
    template_composition_id: text(normalizedService.composition_id || item.composition_id) || null,
    order_format: normalizeServiceFormat(item.format),
    client_photo_id: null,
    client_photo_url: "",
    client_photo_bucket: null,
    client_photo_path: null,
    request_text: "",
    status: "photo_required"
  };
}

export function buildServiceOrderSubmitPayload({ orderId, clientProfileId, photo, requestText = "" } = {}) {
  if (!orderId) throw makeError("Missing service order id.");
  if (!clientProfileId) throw makeError("Missing client profile id.");
  if (!photo?.id) throw makeError("Загрузите своё фото, чтобы отправить заказ в работу Мастеру.");
  return {
    id: text(orderId),
    client_profile_id: text(clientProfileId),
    client_photo_id: text(photo.id),
    client_photo_url: "",
    client_photo_bucket: text(photo.image_bucket) || null,
    client_photo_path: text(photo.image_path) || null,
    request_text: text(requestText),
    status: "new"
  };
}


export function orderHasClientVisibleResult(order = {}) {
  return orderStatus(order.status) === "sent" && Boolean(text(order.final_result_composition_id));
}

export function buildSendOrderResultPayload({ orderId, resultCompositionId, comment = "" } = {}) {
  if (!orderId) throw makeError("Missing service order id.");
  if (!resultCompositionId) throw makeError("Сначала создайте или выберите результат мандалы заказа.");
  return {
    id: text(orderId),
    final_result_composition_id: text(resultCompositionId),
    master_comment: text(comment),
    status: "sent"
  };
}

function mediaRowFromOrderPhoto(order = {}) {
  return {
    id: text(order.client_photo_id),
    title: text(order.client_name) || text(order.client_photo_id) || "клиент",
    image_url: text(order.client_photo_url),
    image_bucket: text(order.client_photo_bucket) || null,
    image_path: text(order.client_photo_path),
    image_ref: text(order.client_photo_url)
  };
}

async function getOwnOrderForResult(orderId, session = getStoredSession()) {
  if (!orderId) throw makeError("Missing service order id.");
  const select = "*,profile_cabinet_services(id,profile_id,composition_id,title,description,image_url,image_bucket,image_path,price_amount,price_currency,status)";
  const rows = await request(`/rest/v1/${ORDERS_TABLE}?id=eq.${encodeURIComponent(orderId)}&select=${select}&limit=1`, { session });
  return rows?.[0] ? normalizeServiceOrder(rows[0]) : null;
}

async function getCompositionRow(compositionId, session = getStoredSession()) {
  if (!compositionId) throw makeError("Не найден шаблон мандалы услуги.");
  const rows = await request(`/rest/v1/profile_cabinet_power_place_compositions?id=eq.${encodeURIComponent(compositionId)}&select=*&limit=1`, { session });
  return rows?.[0] || null;
}

async function insertCompositionRow(composition, session = getStoredSession()) {
  const { id: _id, object_ref_urls: _objectRefUrls, ...body } = composition || {};
  const rows = await request(`/rest/v1/profile_cabinet_power_place_compositions`, {
    method: "POST",
    session,
    prefer: "return=representation",
    body
  });
  return rows?.[0] || null;
}

export async function generateDraftResultComposition(orderId, session = getStoredSession()) {
  if (!session?.access_token) throw makeError("Auth required.");
  const order = await getOwnOrderForResult(orderId, session);
  if (!order?.id) throw makeError("Заявка не найдена.");
  if (order.draft_result_composition_id) return order;
  if (!text(order.client_photo_id) && !text(order.client_photo_path) && !text(order.client_photo_url)) {
    throw makeError("Фото клиента не выбрано для результата заказа.");
  }

  const templateId = text(order.template_composition_id || order.service?.composition_id);
  const template = await getCompositionRow(templateId, session);
  const clonePayload = clonePowerPlaceCompositionForOrder({
    template,
    masterProfileId: order.master_profile_id,
    serviceTitle: order.service?.title || "Услуга",
    clientLabel: order.client_name || order.client_photo_id || "клиент",
    clientPhoto: mediaRowFromOrderPhoto(order)
  });
  const clone = await insertCompositionRow(clonePayload, session);
  if (!clone?.id) throw makeError("Supabase не вернул мандалу результата заказа.");

  const rows = await request(`/rest/v1/${ORDERS_TABLE}?id=eq.${encodeURIComponent(order.id)}`, {
    method: "PATCH",
    session,
    prefer: "return=representation",
    body: {
      draft_result_composition_id: clone.id,
      status: "ready_for_review"
    }
  });
  return rows?.[0] ? normalizeServiceOrder(rows[0]) : { ...order, draft_result_composition_id: clone.id, status: "ready_for_review" };
}

export async function sendOrderResultToClient(orderId, resultCompositionId, comment = "", session = getStoredSession()) {
  if (!session?.access_token) throw makeError("Auth required.");
  const payload = buildSendOrderResultPayload({ orderId, resultCompositionId, comment });
  const rows = await request(`/rest/v1/${ORDERS_TABLE}?id=eq.${encodeURIComponent(payload.id)}`, {
    method: "PATCH",
    session,
    prefer: "return=representation",
    body: {
      final_result_composition_id: payload.final_result_composition_id,
      master_comment: payload.master_comment,
      status: payload.status,
      sent_at: new Date().toISOString()
    }
  });
  return rows?.[0] ? normalizeServiceOrder(rows[0]) : null;
}

export function buildCompositionServicePayload({ profileId, composition, status = "draft", existing = null } = {}) {
  const compositionId = text(composition?.id);
  const fallbackTitle = text(composition?.title) || "Мандала Места Силы";
  const fallbackDescription = "Услуга подготовлена из сохранённой мандалы.";
  const requestedStatus = serviceStatus(status);

  if (!existing) {
    return {
      ...createEmptyServiceForm(),
      profile_id: profileId,
      composition_id: compositionId,
      title: fallbackTitle,
      description: fallbackDescription,
      image_url: "",
      status: requestedStatus
    };
  }

  return {
    ...existing,
    profile_id: profileId,
    composition_id: compositionId,
    title: text(existing.title) || fallbackTitle,
    description: text(existing.description) || fallbackDescription,
    image_url: text(existing.image_url),
    image_bucket: text(existing.image_bucket) || null,
    image_path: text(existing.image_path) || null,
    price_amount: existing.price_amount,
    price_currency: text(existing.price_currency || "EUR") || "EUR",
    status: requestedStatus
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
  const query = buildServiceQueryParams({ publicOnly: true, limit });
  const rows = await request(query.path, { publicRequest: query.publicRequest });
  return Array.isArray(rows) ? rows.map(normalizeServiceRow) : [];
}

export async function getPublicServiceById(serviceId) {
  const query = buildServiceQueryParams({ publicOnly: true, id: serviceId });
  const rows = await request(query.path, { publicRequest: query.publicRequest });
  return rows?.[0] ? normalizeServiceRow(rows[0]) : null;
}

export async function listOwnServices(profileId, session = getStoredSession()) {
  if (!profileId || !session?.access_token) return [];
  const rows = await request(`/rest/v1/${SERVICES_TABLE}?profile_id=eq.${encodeURIComponent(profileId)}&select=*&order=updated_at.desc`, { session });
  return Array.isArray(rows) ? rows.map(normalizeServiceRow) : [];
}

export async function findOwnServiceByComposition(profileId, compositionId, session = getStoredSession()) {
  if (!profileId || !compositionId || !session?.access_token) return null;
  const rows = await request(
    `/rest/v1/${SERVICES_TABLE}?profile_id=eq.${encodeURIComponent(profileId)}&composition_id=eq.${encodeURIComponent(compositionId)}&select=*&order=updated_at.desc&limit=1`,
    { session }
  );
  return rows?.[0] ? normalizeServiceRow(rows[0]) : null;
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
  if (!id && !text(payload.composition_id)) {
    throw makeError("Сначала перенесите сохранённую мандалу в услуги. Публикация без шаблона отключена.");
  }
  return id ? updateOwnService(id, { ...payload, status: "published" }, session) : createOwnService({ ...payload, status: "published" }, session);
}

export async function upsertOwnServiceForComposition({ profileId, composition, status = "draft" } = {}, session = getStoredSession()) {
  const compositionId = text(composition?.id);
  if (!profileId) throw makeError("Missing profile id.");
  if (!compositionId) throw makeError("Missing composition id.");

  const existing = await findOwnServiceByComposition(profileId, compositionId, session);
  const payload = buildCompositionServicePayload({ profileId, composition, status, existing });

  if (!existing) return createOwnService(payload, session);
  return updateOwnService(existing.id, payload, session);
}

export async function createServiceOrder(order, session = getStoredSession()) {
  const body = {
    service_id: text(order?.service_id),
    master_profile_id: text(order?.master_profile_id),
    client_name: text(order?.client_name),
    client_photo_url: text(order?.client_photo_url),
    client_photo_bucket: text(order?.client_photo_bucket) || null,
    client_photo_path: text(order?.client_photo_path) || null,
    request_text: text(order?.request_text),
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

export async function createServiceOrderDraft({ cartItem, clientProfileId } = {}, session = getStoredSession()) {
  if (!session?.access_token) throw makeError("Auth required.");
  const service = await getPublicServiceById(cartItem?.service_id);
  const rows = await request(`/rest/v1/${ORDERS_TABLE}`, {
    method: "POST",
    session,
    prefer: "return=representation",
    body: buildServiceOrderDraftPayload({ cartItem, clientProfileId, service })
  });
  return rows?.[0] ? normalizeServiceOrder(rows[0]) : null;
}

export async function listClientServiceOrders(profileId, session = getStoredSession()) {
  if (!profileId || !session?.access_token) return [];
  const select = "*,profile_cabinet_services(id,profile_id,composition_id,title,description,image_url,image_bucket,image_path,price_amount,price_currency,status)";
  const rows = await request(`/rest/v1/${ORDERS_TABLE}?client_profile_id=eq.${encodeURIComponent(profileId)}&select=${select}&order=created_at.desc`, { session });
  return Array.isArray(rows) ? rows.map(normalizeServiceOrder) : [];
}

export async function submitServiceOrderToMaster(orderId, { clientProfileId, photo, requestText = "" } = {}, session = getStoredSession()) {
  if (!session?.access_token) throw makeError("Auth required.");
  const payload = buildServiceOrderSubmitPayload({ orderId, clientProfileId, photo, requestText });
  const rows = await request(`/rest/v1/${ORDERS_TABLE}?id=eq.${encodeURIComponent(payload.id)}&client_profile_id=eq.${encodeURIComponent(payload.client_profile_id)}`, {
    method: "PATCH",
    session,
    prefer: "return=representation",
    body: {
      client_photo_id: payload.client_photo_id,
      client_photo_url: payload.client_photo_url,
      client_photo_bucket: payload.client_photo_bucket,
      client_photo_path: payload.client_photo_path,
      request_text: payload.request_text,
      status: payload.status
    }
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
  if (!orderId) throw makeError("Missing service id.");
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
