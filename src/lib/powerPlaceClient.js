import {
  PROFILE_MEDIA_BUCKET,
  createSignedMediaUrl,
  isStorageRef,
  parseStorageRef,
  toStorageRef
} from "./profileMediaClient.js";
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

function isDataImage(value) {
  return cleanText(value).startsWith("data:image/");
}

function isPersistableImageRef(value) {
  const ref = cleanText(value);
  return Boolean(ref && !isDataImage(ref));
}

function cleanObjectRefs(value) {
  return Object.fromEntries(
    Object.entries(cleanJsonObject(value))
      .map(([key, item]) => [cleanText(key), cleanText(item)])
      .filter(([key, item]) => key && isPersistableImageRef(item))
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

function storageRefFromRow(row) {
  const path = cleanText(row?.image_path);
  const bucket = cleanText(row?.image_bucket) || PROFILE_MEDIA_BUCKET;
  return path ? toStorageRef(bucket, path) : "";
}

function displayUrlFromRow(row) {
  return cleanText(row?.display_url) || cleanText(row?.signed_url) || cleanText(row?.image_url);
}

async function resolveStorageRef(ref, session) {
  const parsed = parseStorageRef(ref);
  if (!parsed?.path || parsed.bucket !== PROFILE_MEDIA_BUCKET || !session?.access_token) return "";
  return createSignedMediaUrl(parsed.path, session, parsed.bucket);
}

async function resolveStorageRefs(refs, session) {
  const entries = await Promise.all(
    [...new Set(refs.filter((ref) => isStorageRef(ref)))].map(async (ref) => {
      try {
        return [ref, await resolveStorageRef(ref, session)];
      } catch {
        return [ref, ""];
      }
    })
  );

  return Object.fromEntries(entries.filter(([, url]) => Boolean(url)));
}

async function hydrateMediaRows(rows, session) {
  return Promise.all((rows || []).map(async (row) => {
    const storageRef = storageRefFromRow(row);
    if (!storageRef) {
      return {
        ...row,
        image_ref: cleanText(row?.image_url),
        display_url: cleanText(row?.image_url)
      };
    }

    const signedUrl = await resolveStorageRef(storageRef, session).catch(() => "");
    return {
      ...row,
      image_ref: storageRef,
      signed_url: signedUrl,
      display_url: signedUrl || cleanText(row?.image_url),
      image_url: signedUrl || cleanText(row?.image_url)
    };
  }));
}

async function hydrateCompositionRows(rows, session) {
  const refs = [];
  for (const row of rows || []) {
    for (const value of Object.values(cleanJsonObject(row.object_refs))) {
      if (isStorageRef(value)) refs.push(value);
    }
    const coverSrc = cleanText(row.cover_ref?.src);
    if (isStorageRef(coverSrc)) refs.push(coverSrc);
  }

  const signedUrls = await resolveStorageRefs(refs, session);
  return (rows || []).map((row) => {
    const objectRefs = cleanJsonObject(row.object_refs);
    const displayObjectRefs = Object.fromEntries(
      Object.entries(objectRefs).map(([key, value]) => [key, signedUrls[value] || value])
    );
    const coverRef = row.cover_ref?.src && signedUrls[row.cover_ref.src]
      ? { ...row.cover_ref, display_src: signedUrls[row.cover_ref.src] }
      : row.cover_ref;

    return {
      ...row,
      object_ref_urls: displayObjectRefs,
      cover_ref: coverRef
    };
  });
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
  const imagePath = cleanText(photo?.image_path);
  const imageBucket = cleanText(photo?.image_bucket) || PROFILE_MEDIA_BUCKET;
  if (!isPersistableImageRef(imageUrl) && !imagePath) throw powerPlaceError("Добавьте фото клиента или цели.");

  return {
    profile_id: cleanText(photo?.profile_id),
    title: cleanText(photo?.title) || "Фото клиента / цели",
    image_url: imagePath ? "" : imageUrl,
    image_bucket: imagePath ? imageBucket : PROFILE_MEDIA_BUCKET,
    image_path: imagePath,
    mime_type: cleanText(photo?.mime_type),
    file_size_bytes: Number(photo?.file_size_bytes) || 0,
    notes: cleanText(photo?.notes)
  };
}

export function normalizeTraditionAsset(asset) {
  const imageUrl = cleanText(asset?.image_url);
  const imagePath = cleanText(asset?.image_path);
  const imageBucket = cleanText(asset?.image_bucket) || PROFILE_MEDIA_BUCKET;
  if (!isPersistableImageRef(imageUrl) && !imagePath) throw powerPlaceError("Добавьте изображение традиции.");

  return {
    profile_id: cleanText(asset?.profile_id),
    tradition_id: cleanText(asset?.tradition_id),
    tradition_title: cleanText(asset?.tradition_title),
    title: cleanText(asset?.title) || "Образ традиции",
    image_url: imagePath ? "" : imageUrl,
    image_bucket: imagePath ? imageBucket : PROFILE_MEDIA_BUCKET,
    image_path: imagePath,
    mime_type: cleanText(asset?.mime_type),
    file_size_bytes: Number(asset?.file_size_bytes) || 0,
    notes: cleanText(asset?.notes)
  };
}

export function normalizeCoverRef(coverRef) {
  const cover = cleanJsonObject(coverRef);
  const id = cleanText(cover.id);
  if (!id) return null;

  const type = cleanText(cover.type) === "image" ? "image" : "placeholder";

  return {
    id,
    label: cleanText(cover.label) || "Заставка места силы",
    type,
    tone: cleanText(cover.tone),
    src: isPersistableImageRef(cover.src) ? cleanText(cover.src) : ""
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
    cover_ref: normalizeCoverRef(composition?.cover_ref),
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

  const rows = await request(`/rest/v1/${CLIENT_PHOTOS_TABLE}?profile_id=eq.${encodeURIComponent(profileId)}&select=*&order=created_at.desc`, {
    session
  });
  return hydrateMediaRows(rows, session);
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

  const hydrated = await hydrateMediaRows(rows, session);
  return hydrated?.[0] || null;
}

export async function listTraditionAssets(profileId, traditionId, session = getStoredSession()) {
  if (!profileId || !traditionId || !session?.access_token) return [];

  const rows = await request(`/rest/v1/${TRADITION_ASSETS_TABLE}?profile_id=eq.${encodeURIComponent(profileId)}&tradition_id=eq.${encodeURIComponent(traditionId)}&select=*&order=created_at.desc`, {
    session
  });
  return hydrateMediaRows(rows, session);
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

  const hydrated = await hydrateMediaRows(rows, session);
  return hydrated?.[0] || null;
}

export async function listPowerPlaceCompositions(profileId, session = getStoredSession()) {
  if (!profileId || !session?.access_token) return [];

  const rows = await request(`/rest/v1/${COMPOSITIONS_TABLE}?profile_id=eq.${encodeURIComponent(profileId)}&select=*&order=updated_at.desc`, {
    session
  });
  return hydrateCompositionRows(rows, session);
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

  const hydrated = await hydrateCompositionRows(rows, session);
  return hydrated?.[0] || null;
}

export async function updatePowerPlaceComposition(compositionId, composition, session = getStoredSession()) {
  requireSession(session);
  const rows = await request(`/rest/v1/${COMPOSITIONS_TABLE}?id=eq.${encodeURIComponent(compositionId)}`, {
    method: "PATCH",
    session,
    prefer: "return=representation",
    body: normalizePowerPlaceComposition(composition)
  });

  const hydrated = await hydrateCompositionRows(rows, session);
  return hydrated?.[0] || null;
}
