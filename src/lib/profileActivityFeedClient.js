import { getStoredSession, supabaseEnv } from "./supabaseClient.js";

const SUPABASE_URL = import.meta.env?.VITE_SUPABASE_URL?.replace(/\/$/, "") || "";
const SUPABASE_ANON_KEY = import.meta.env?.VITE_SUPABASE_ANON_KEY || "";
const ACTIVITY_EVENTS_TABLE = "profile_cabinet_activity_events";
const ACTIVE_DUPLICATE_STATUSES = ["draft", "pending", "approved"];
const FEED_TARGET_TABLES = [
  "profile_cabinet_publications",
  "profile_cabinet_services",
  "profile_cabinet_photo_albums",
  "profile_cabinet_power_place_compositions"
];
const PUBLIC_ACTIVITY_FIELDS = [
  "id",
  "profile_id",
  "activity_type",
  "target_table",
  "target_id",
  "title",
  "body",
  "image_url",
  "category",
  "subcategory",
  "tags",
  "status",
  "visibility",
  "is_featured",
  "event_at",
  "created_at",
  "updated_at"
].join(",");

export const ACTIVITY_TYPES = [
  "master_update",
  "mandala_published",
  "power_place_published",
  "photo_album_published",
  "service_created",
  "service_updated",
  "practice_published",
  "artifact_published",
  "admin_announcement",
  "featured_item"
];

export const ACTIVITY_STATUSES = ["draft", "pending", "approved", "rejected", "archived"];
export const ACTIVITY_VISIBILITIES = ["private", "profile_only", "public_feed"];

export const ACTIVITY_FEED_TABS = [
  { id: "all", label: "Все", types: [] },
  { id: "news", label: "Новости", types: ["master_update", "admin_announcement", "featured_item"] },
  { id: "mandalas", label: "Мандалы", types: ["mandala_published", "power_place_published", "artifact_published"] },
  { id: "photos", label: "Фото", types: ["photo_album_published"] },
  { id: "services", label: "Услуги", types: ["service_created", "service_updated"] },
  { id: "practices", label: "Практики", types: ["practice_published"] }
];

const ACTIVITY_TYPE_LABELS = {
  master_update: "Новость мастера",
  mandala_published: "Мандала опубликована",
  power_place_published: "Место силы",
  photo_album_published: "Фотоальбом",
  service_created: "Новая услуга",
  service_updated: "Услуга обновлена",
  practice_published: "Практика",
  artifact_published: "Артефакт",
  admin_announcement: "Объявление",
  featured_item: "Избранное"
};

function feedError(message, details = null) {
  const error = new Error(message);
  error.details = details;
  return error;
}

function text(value) {
  return String(value || "").trim();
}

function cleanLimit(value) {
  const parsed = Number(value);
  const fallback = 30;
  const number = Number.isFinite(parsed) ? Math.trunc(parsed) : fallback;
  return Math.min(Math.max(number, 1), 60);
}

function cleanTab(tab) {
  return ACTIVITY_FEED_TABS.find((item) => item.id === tab) || ACTIVITY_FEED_TABS[0];
}

function cleanActivityType(value) {
  const type = text(value);
  return ACTIVITY_TYPES.includes(type) ? type : "master_update";
}

function cleanStatus(value) {
  const status = text(value);
  return ACTIVITY_STATUSES.includes(status) ? status : "draft";
}

function cleanVisibility(value) {
  const visibility = text(value);
  return ACTIVITY_VISIBILITIES.includes(visibility) ? visibility : "private";
}

function cleanTags(value) {
  if (Array.isArray(value)) return value.map(text).filter(Boolean).slice(0, 12);
  if (typeof value === "string") return value.split(",").map(text).filter(Boolean).slice(0, 12);
  return [];
}

function cleanTargetTable(value) {
  const table = text(value);
  return FEED_TARGET_TABLES.includes(table) ? table : "";
}

function cleanNullableUuid(value) {
  return text(value);
}

export function activityTypeLabel(type) {
  return ACTIVITY_TYPE_LABELS[type] || "Событие";
}

export function isPublicSafeFeedImageUrl(value) {
  const url = text(value);
  if (!/^https?:\/\//i.test(url)) return false;
  if (/^data:image/i.test(url)) return false;
  if (/storage:\/\//i.test(url)) return false;

  try {
    const parsed = new URL(url);
    const joined = `${parsed.pathname}?${parsed.searchParams.toString()}`.toLowerCase();
    if (joined.includes("/storage/v1/object/sign/")) return false;
    if (joined.includes("profile-cabinet-media")) return false;
    if (parsed.searchParams.has("token") && joined.includes("/storage/v1/")) return false;
  } catch {
    return false;
  }

  return true;
}

export function normalizeActivityEvent(row = {}) {
  const imageUrl = text(row.image_url);
  return {
    id: text(row.id),
    profileId: text(row.profile_id),
    activityType: cleanActivityType(row.activity_type),
    targetTable: text(row.target_table),
    targetId: text(row.target_id),
    title: text(row.title),
    body: text(row.body),
    imageUrl: isPublicSafeFeedImageUrl(imageUrl) ? imageUrl : "",
    category: text(row.category),
    subcategory: text(row.subcategory),
    tags: cleanTags(row.tags),
    status: cleanStatus(row.status),
    visibility: cleanVisibility(row.visibility),
    isFeatured: Boolean(row.is_featured),
    eventAt: row.event_at || row.created_at || "",
    createdAt: row.created_at || "",
    updatedAt: row.updated_at || ""
  };
}

export function feedActivityTypeForMaterial(material = {}) {
  const type = text(material.type);
  if (type === "mandala") return "mandala_published";
  if (type === "artifact") return "artifact_published";
  if (type === "practice") return "practice_published";
  return "";
}

export function buildSafeActivityEventPayload(event = {}) {
  const imageUrl = text(event.image_url);
  return {
    profile_id: text(event.profile_id) || null,
    activity_type: cleanActivityType(event.activity_type),
    target_table: cleanTargetTable(event.target_table) || null,
    target_id: cleanNullableUuid(event.target_id) || null,
    title: text(event.title),
    body: text(event.body),
    image_url: isPublicSafeFeedImageUrl(imageUrl) ? imageUrl : "",
    image_bucket: null,
    image_path: null,
    category: text(event.category),
    subcategory: text(event.subcategory),
    tags: cleanTags(event.tags),
    status: cleanStatus(event.status || "pending"),
    visibility: cleanVisibility(event.visibility || "public_feed"),
    is_featured: Boolean(event.is_featured)
  };
}

export function buildActivityEventDuplicatePath(event = {}) {
  const targetTable = cleanTargetTable(event.target_table);
  const targetId = cleanNullableUuid(event.target_id);
  const activityType = cleanActivityType(event.activity_type);
  const query = [
    targetTable ? `target_table=eq.${encodeURIComponent(targetTable)}` : "target_table=is.null",
    targetId ? `target_id=eq.${encodeURIComponent(targetId)}` : "target_id=is.null",
    `activity_type=eq.${encodeURIComponent(activityType)}`,
    `status=in.(${ACTIVE_DUPLICATE_STATUSES.join(",")})`,
    `select=${PUBLIC_ACTIVITY_FIELDS}`,
    "order=updated_at.desc",
    "limit=1"
  ];
  return `/rest/v1/${ACTIVITY_EVENTS_TABLE}?${query.join("&")}`;
}

export function buildMaterialActivityEvent(material = {}, profileId = material.profile_id) {
  const activityType = feedActivityTypeForMaterial(material);
  if (!activityType) throw feedError("Для этой категории гримуара лента пока не подключена.");
  return buildSafeActivityEventPayload({
    profile_id: profileId,
    activity_type: activityType,
    target_table: "profile_cabinet_publications",
    target_id: material.id,
    title: material.title || activityTypeLabel(activityType),
    body: material.description || "Материал подготовлен мастером для публичной ленты.",
    image_url: material.image_url,
    category: material.type || "materials",
    tags: [material.step_id, material.step_title, material.setting_title].filter(Boolean),
    status: "pending",
    visibility: "public_feed"
  });
}

export function buildServiceActivityEvent(service = {}, profileId = service.profile_id, activityType = "service_created") {
  const safeType = activityType === "service_updated" ? "service_updated" : "service_created";
  return buildSafeActivityEventPayload({
    profile_id: profileId,
    activity_type: safeType,
    target_table: "profile_cabinet_services",
    target_id: service.id,
    title: service.title || activityTypeLabel(safeType),
    body: service.description || "Мастер подготовил публичное описание услуги.",
    image_url: service.image_url || service.display_url,
    category: "services",
    tags: [service.price_currency].filter(Boolean),
    status: "pending",
    visibility: "public_feed"
  });
}

export function buildPowerPlaceActivityEvent(composition = {}, projection = {}, profileId = composition.profile_id) {
  return buildSafeActivityEventPayload({
    profile_id: profileId,
    activity_type: "power_place_published",
    target_table: "profile_cabinet_power_place_compositions",
    target_id: composition.id,
    title: projection.title || composition.title || "Место силы",
    body: projection.body || "Мастер подготовил публичную проекцию места силы.",
    image_url: projection.image_url || "",
    category: projection.category || "mandalas",
    tags: projection.tags || [],
    status: "pending",
    visibility: "public_feed"
  });
}

export function buildPublicActivityEventsPath({ tab = "all", type = "", category = "", profileId = "", limit = 30 } = {}) {
  const selectedTab = cleanTab(tab);
  const requestedType = text(type);
  const types = ACTIVITY_TYPES.includes(requestedType) ? [requestedType] : selectedTab.types;
  const query = [
    "status=eq.approved",
    "visibility=eq.public_feed",
    `select=${PUBLIC_ACTIVITY_FIELDS}`,
    "order=event_at.desc",
    `limit=${cleanLimit(limit)}`
  ];

  if (types.length > 0) query.push(`activity_type=in.(${types.join(",")})`);
  if (text(category)) query.push(`category=eq.${encodeURIComponent(text(category))}`);
  if (text(profileId)) query.push(`profile_id=eq.${encodeURIComponent(text(profileId))}`);

  return `/rest/v1/${ACTIVITY_EVENTS_TABLE}?${query.join("&")}`;
}

async function request(path, options = {}) {
  if (!supabaseEnv.isConfigured) throw feedError("Лента сообщества требует настройки подключения Supabase.");

  const session = options.session || getStoredSession();
  const token = options.publicRequest ? SUPABASE_ANON_KEY : session?.access_token;
  if (!options.publicRequest && !token) throw feedError("Нужно войти в кабинет.");

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
  if (!response.ok) throw feedError(data?.msg || data?.message || "Ошибка загрузки ленты сообщества.", { ...(data || {}), status: response.status });
  return data;
}

export async function listPublicActivityEvents(filters = {}) {
  const rows = await request(buildPublicActivityEventsPath(filters), { publicRequest: true });
  return Array.isArray(rows) ? rows.map(normalizeActivityEvent) : [];
}

export async function listOwnActivityEvents(profileId, session = getStoredSession()) {
  if (!profileId || !session?.access_token) return [];
  const rows = await request(
    `/rest/v1/${ACTIVITY_EVENTS_TABLE}?profile_id=eq.${encodeURIComponent(profileId)}&select=${PUBLIC_ACTIVITY_FIELDS}&order=event_at.desc`,
    { session }
  );
  return Array.isArray(rows) ? rows.map(normalizeActivityEvent) : [];
}

export async function createOwnActivityEvent(event, session = getStoredSession()) {
  if (!session?.access_token) throw feedError("Нужно войти в кабинет.");
  const rows = await request(`/rest/v1/${ACTIVITY_EVENTS_TABLE}`, {
    method: "POST",
    session,
    prefer: "return=representation",
    body: buildSafeActivityEventPayload(event)
  });
  return rows?.[0] ? normalizeActivityEvent(rows[0]) : null;
}

export async function findDuplicateActivityEvent(event, session = getStoredSession()) {
  if (!session?.access_token) throw feedError("Нужно войти в кабинет.");
  const rows = await request(buildActivityEventDuplicatePath(event), { session });
  return rows?.[0] ? normalizeActivityEvent(rows[0]) : null;
}

export async function createOrUpdatePendingActivityEvent(event, session = getStoredSession()) {
  if (!session?.access_token) throw feedError("Нужно войти в кабинет.");
  const payload = buildSafeActivityEventPayload(event);
  if (!payload.title) throw feedError("Добавьте публичное название события.");
  if (!payload.target_table || !payload.target_id) throw feedError("Не удалось определить объект для публикации в ленту.");

  const existing = await findDuplicateActivityEvent(payload, session);
  if (existing?.id && existing.status === "approved") {
    return {
      event: existing,
      mode: "duplicate",
      message: "Это событие уже одобрено и есть в ленте."
    };
  }

  if (existing?.id) {
    const rows = await request(`/rest/v1/${ACTIVITY_EVENTS_TABLE}?id=eq.${encodeURIComponent(existing.id)}`, {
      method: "PATCH",
      session,
      prefer: "return=representation",
      body: {
        title: payload.title,
        body: payload.body,
        image_url: payload.image_url,
        image_bucket: null,
        image_path: null,
        category: payload.category,
        subcategory: payload.subcategory,
        tags: payload.tags,
        status: "pending",
        visibility: "public_feed",
        is_featured: payload.is_featured
      }
    });
    return {
      event: rows?.[0] ? normalizeActivityEvent(rows[0]) : existing,
      mode: "updated",
      message: "Событие уже было в очереди, публичное описание обновлено."
    };
  }

  const created = await createOwnActivityEvent(payload, session);
  return {
    event: created,
    mode: "created",
    message: "Событие отправлено на модерацию ленты."
  };
}

export async function listPendingActivityEvents(session = getStoredSession()) {
  if (!session?.access_token) throw feedError("Нужен вход администратора.");
  const rows = await request(
    `/rest/v1/${ACTIVITY_EVENTS_TABLE}?status=eq.pending&select=${PUBLIC_ACTIVITY_FIELDS}&order=event_at.asc`,
    { session }
  );
  return Array.isArray(rows) ? rows.map(normalizeActivityEvent) : [];
}

export async function updateActivityEventStatus(eventId, status, session = getStoredSession()) {
  if (!session?.access_token) throw feedError("Нужен вход администратора.");
  const safeStatus = cleanStatus(status);
  const body = {
    status: safeStatus,
    ...(safeStatus === "approved" ? { visibility: "public_feed", event_at: new Date().toISOString() } : {})
  };
  const rows = await request(`/rest/v1/${ACTIVITY_EVENTS_TABLE}?id=eq.${encodeURIComponent(eventId)}`, {
    method: "PATCH",
    session,
    prefer: "return=representation",
    body
  });
  return rows?.[0] ? normalizeActivityEvent(rows[0]) : null;
}
