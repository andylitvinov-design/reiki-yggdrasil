import { getStoredSession, supabaseEnv } from "./supabaseClient.js";

const SUPABASE_URL = import.meta.env?.VITE_SUPABASE_URL?.replace(/\/$/, "") || "";
const SUPABASE_ANON_KEY = import.meta.env?.VITE_SUPABASE_ANON_KEY || "";

const CLIENT_PHOTOS_TABLE = "profile_cabinet_client_goal_photos";
const TRADITION_ASSETS_TABLE = "profile_cabinet_tradition_assets";
const COMPOSITIONS_TABLE = "profile_cabinet_power_place_compositions";

const VALID_PLANS = ["start", "pro"];
const VALID_CONSTRUCTOR_TYPES = ["client", "altar", "business", "dao", "zodiac"];
const VALID_GEOMETRIES = [2, 4, 5, 6, 8, 12];
const VALID_ZODIAC_VISIBLE_COUNTS = [2, 4, 6, 8, 12];
const VALID_ALTAR_RATIOS = ["1", "1-5", "2", "3"];
const VALID_BUSINESS_ZONE_COUNTS = [1, 3];
const VALID_RESOURCE_COMPARISON_MODES = ["client_photo", "photo_mandala"];

export const ACCOUNT_PLANS = [
  { value: "start", label: "Start" },
  { value: "pro", label: "Pro" }
];

function powerPlaceError(message, details = null) {
  const error = new Error(message);
  error.details = details;
  return error;
}

function cleanText(value) {
  return String(value || "").trim();
}

function cleanJsonObject(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

function cleanObjectRefs(value) {
  return Object.fromEntries(
    Object.entries(cleanJsonObject(value))
      .map(([key, item]) => [cleanText(key), cleanText(item)])
      .filter(([key, item]) => key && item && !item.startsWith("data:image/"))
  );
}

function requestSession(session) {
  return session || getStoredSession();
}

function requireSession(session) {
  if (!session?.access_token) throw powerPlaceError("Нужно войти в кабинет.");
}

async function request(path, options = {}) {
  if (!supabaseEnv.isConfigured) {
    throw powerPlaceError("Сохранение мест силы требует настройки подключения Supabase.");
  }

  const session = requestSession(options.session);
  const response = await fetch(`${SUPABASE_URL}${path}`, {
    method: options.method || "GET",
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${session?.access_token || SUPABASE_ANON_KEY}`,
      "Content-Type": "application/json",
      ...(options.prefer ? { Prefer: options.prefer } : {})
    },
    body: options.body === undefined ? undefined : JSON.stringify(options.body)
  });

  const text = await response.text();
  const data = text ? JSON.parse(text) : null;

  if (!response.ok) {
    throw powerPlaceError(data?.msg || data?.message || "Ошибка сохранения места силы.", data);
  }

  return data;
}

async function countRows(table, profileId, session) {
  const rows = await request(`/rest/v1/${table}?profile_id=eq.${encodeURIComponent(profileId)}&select=id`, { session });
  return Array.isArray(rows) ? rows.length : 0;
}

export function normalizeAccountPlan(plan) {
  const normalized = cleanText(plan).toLowerCase();
  return VALID_PLANS.includes(normalized) ? normalized : "start";
}

export function getPlanLimits(plan) {
  return normalizeAccountPlan(plan) === "pro"
    ? { compositions: 20, clientPhotos: 30 }
    : { compositions: 7, clientPhotos: 10 };
}

export function normalizeClientGoalPhoto(photo) {
  const imageUrl = cleanText(photo?.image_url);
  if (!imageUrl) throw powerPlaceError("Добавьте ссылку на фото клиента или цели.");

  return {
    profile_id: cleanText(photo?.profile_id),
    title: cleanText(photo?.title) || "Фото клиента / цели",
    image_url: imageUrl,
    notes: cleanText(photo?.notes)
  };
}

export function normalizeTraditionAsset(asset) {
  const imageUrl = cleanText(asset?.image_url);
  if (!imageUrl) throw powerPlaceError("Добавьте ссылку на изображение традиции.");

  return {
    profile_id: cleanText(asset?.profile_id),
    tradition_id: cleanText(asset?.tradition_id),
    tradition_title: cleanText(asset?.tradition_title),
    title: cleanText(asset?.title) || "Образ традиции",
    image_url: imageUrl,
    notes: cleanText(asset?.notes)
  };
}

export function normalizePowerPlaceComposition(composition) {
  const constructorType = VALID_CONSTRUCTOR_TYPES.includes(composition?.constructor_type)
    ? composition.constructor_type
    : "client";
  const geometry = Number(composition?.geometry);
  const ratio = cleanText(composition?.altar_center_ratio);
  const businessZoneCount = Number(composition?.business_vertex_zone_count);
  const zodiacVisibleCount = Number(composition?.zodiac_visible_count);
  const resourceComparisonMode = cleanText(composition?.resource_comparison_mode);

  return {
    profile_id: cleanText(composition?.profile_id),
    title: cleanText(composition?.title) || "Место силы",
    constructor_type: constructorType,
    geometry: constructorType === "client" && VALID_GEOMETRIES.includes(geometry) ? geometry : null,
    zodiac_visible_count: VALID_ZODIAC_VISIBLE_COUNTS.includes(zodiacVisibleCount) ? zodiacVisibleCount : 12,
    altar_center_ratio: VALID_ALTAR_RATIOS.includes(ratio) ? ratio : "1",
    business_vertex_zone_count: VALID_BUSINESS_ZONE_COUNTS.includes(businessZoneCount) ? businessZoneCount : 1,
    cover_ref: composition?.cover_ref || null,
    object_refs: cleanObjectRefs(composition?.object_refs),
    central_photo_id: cleanText(composition?.central_photo_id) || null,
    tradition_id: constructorType === "altar" ? cleanText(composition?.tradition_id) : "",
    tradition_title: constructorType === "altar" ? cleanText(composition?.tradition_title) : "",
    resource_comparison_mode: VALID_RESOURCE_COMPARISON_MODES.includes(resourceComparisonMode) ? resourceComparisonMode : "client_photo",
    resource_without_mandala_comment: cleanText(composition?.resource_without_mandala_comment),
    resource_with_mandala_comment: cleanText(composition?.resource_with_mandala_comment)
  };
}

export async function listClientGoalPhotos(profileId, session = getStoredSession()) {
  if (!profileId || !session?.access_token) return [];

  return request(`/rest/v1/${CLIENT_PHOTOS_TABLE}?profile_id=eq.${encodeURIComponent(profileId)}&select=*&order=created_at.desc`, {
    session
  });
}

export async function createClientGoalPhoto(photo, plan, session = getStoredSession()) {
  requireSession(session);
  const payload = normalizeClientGoalPhoto(photo);
  const count = await countRows(CLIENT_PHOTOS_TABLE, payload.profile_id, session);
  const limits = getPlanLimits(plan);
  if (count >= limits.clientPhotos) {
    throw powerPlaceError(`Лимит ${limits.clientPhotos} фото клиентов / целей для плана ${normalizeAccountPlan(plan) === "pro" ? "Pro" : "Start"} достигнут.`);
  }

  const rows = await request(`/rest/v1/${CLIENT_PHOTOS_TABLE}`, {
    method: "POST",
    session,
    prefer: "return=representation",
    body: payload
  });

  return rows?.[0] || null;
}

export async function listTraditionAssets(profileId, traditionId, session = getStoredSession()) {
  if (!profileId || !traditionId || !session?.access_token) return [];

  return request(`/rest/v1/${TRADITION_ASSETS_TABLE}?profile_id=eq.${encodeURIComponent(profileId)}&tradition_id=eq.${encodeURIComponent(traditionId)}&select=*&order=created_at.desc`, {
    session
  });
}

export async function createTraditionAsset(asset, session = getStoredSession()) {
  requireSession(session);
  const payload = normalizeTraditionAsset(asset);
  const rows = await request(`/rest/v1/${TRADITION_ASSETS_TABLE}`, {
    method: "POST",
    session,
    prefer: "return=representation",
    body: payload
  });

  return rows?.[0] || null;
}

export async function listPowerPlaceCompositions(profileId, session = getStoredSession()) {
  if (!profileId || !session?.access_token) return [];

  return request(`/rest/v1/${COMPOSITIONS_TABLE}?profile_id=eq.${encodeURIComponent(profileId)}&select=*&order=updated_at.desc`, {
    session
  });
}

export async function createPowerPlaceComposition(composition, plan, session = getStoredSession()) {
  requireSession(session);
  const payload = normalizePowerPlaceComposition(composition);
  const count = await countRows(COMPOSITIONS_TABLE, payload.profile_id, session);
  const limits = getPlanLimits(plan);
  if (count >= limits.compositions) {
    throw powerPlaceError(`Лимит ${limits.compositions} сохранённых мест силы для плана ${normalizeAccountPlan(plan) === "pro" ? "Pro" : "Start"} достигнут.`);
  }

  const rows = await request(`/rest/v1/${COMPOSITIONS_TABLE}`, {
    method: "POST",
    session,
    prefer: "return=representation",
    body: payload
  });

  return rows?.[0] || null;
}

export async function updatePowerPlaceComposition(compositionId, composition, session = getStoredSession()) {
  requireSession(session);
  const rows = await request(`/rest/v1/${COMPOSITIONS_TABLE}?id=eq.${encodeURIComponent(compositionId)}`, {
    method: "PATCH",
    session,
    prefer: "return=representation",
    body: normalizePowerPlaceComposition(composition)
  });

  return rows?.[0] || null;
}
