import {
  PROFILE_MEDIA_BUCKET,
  createSignedMediaUrl,
  hydrateMediaRowsForDisplay,
  isStorageRef,
  parseStorageRef,
} from "./profileMediaClient.js";
import { getStoredSession, supabaseEnv } from "./supabaseClient.js";

const SUPABASE_URL = import.meta.env?.VITE_SUPABASE_URL?.replace(/\/$/, "") || "";
const SUPABASE_ANON_KEY = import.meta.env?.VITE_SUPABASE_ANON_KEY || "";
const REQUEST_TIMEOUT_MS = 12000;

const CLIENT_PHOTOS_TABLE = "profile_cabinet_client_goal_photos";
const TRADITION_ASSETS_TABLE = "profile_cabinet_tradition_assets";
const COMPOSITIONS_TABLE = "profile_cabinet_power_place_compositions";

const VALID_PLANS = ["start", "pro"];
const VALID_CONSTRUCTOR_TYPES = ["client", "altar", "business", "dao", "zodiac", "star", "chess"];
const VALID_GEOMETRIES = [2, 4, 5, 6, 8, 9, 12];
const VALID_ZODIAC_VISIBLE_COUNTS = [2, 4, 6, 8, 12];
const VALID_ALTAR_RATIOS = ["1", "1-5", "2", "3"];
const VALID_BUSINESS_ZONE_COUNTS = [1, 3];
const VALID_RESOURCE_COMPARISON_MODES = ["client_photo", "photo_mandala"];
const VALID_STAR_VARIANTS = ["closed", "open"];
const VALID_CHESS_VARIANTS = ["classic-14", "classic-8", "plus-8", "compact-5"];
const PROFILE_LITE_REPORT_REF_KEY = "__profile_lite_report";
const SLOT_SCALE_REF_KEY = "__slot_scale";
const INNER_FIELD_SCALE_REF_KEY = "__inner_field_scale";
const CENTER_IMAGE_SCALE_REF_KEY = "__center_image_scale";
const CENTER_FRAME_SCALE_REF_KEY = "__center_frame_scale";
const CENTER_IMAGE_OFFSET_X_REF_KEY = "__center_image_offset_x";
const CENTER_IMAGE_OFFSET_Y_REF_KEY = "__center_image_offset_y";
const CENTER_SHAPE_REF_KEY = "__center_shape";
const FIELD_LAYOUT_REF_KEY = "__field_layout";
const INNER_COVER_OFFSET_X_REF_KEY = "__inner_cover_offset_x";
const INNER_COVER_OFFSET_Y_REF_KEY = "__inner_cover_offset_y";
const OUTER_COVER_OFFSET_X_REF_KEY = "__outer_cover_offset_x";
const OUTER_COVER_OFFSET_Y_REF_KEY = "__outer_cover_offset_y";
const VALID_FIELD_LAYOUTS = ["square", "vertical", "horizontal", "rectangle"];
const HYDRATION_TIMEOUT_MS = 8000;

export const ACCOUNT_PLANS = [
  { value: "start", label: "Start" },
  { value: "pro", label: "Pro" }
];

function powerPlaceError(message, details = null) {
  const error = new Error(message);
  error.details = details;
  return error;
}

function safeErrorText(error) {
  return cleanText(error?.message || error?.details?.message || error?.details?.msg) || "Ошибка Supabase запроса.";
}

function withTimeout(promise, timeoutMs, message, details = null) {
  let timeoutId = null;
  const timeout = new Promise((_, reject) => {
    timeoutId = globalThis.setTimeout(() => reject(powerPlaceError(message, details)), timeoutMs);
  });

  return Promise.race([promise, timeout]).finally(() => {
    if (timeoutId) globalThis.clearTimeout(timeoutId);
  });
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

function clampNumericRef(value, min, max) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return null;
  return String(Math.min(max, Math.max(min, parsed)));
}

function normalizeNumericRef(value, min, max, fallback) {
  return clampNumericRef(value, min, max) ?? String(fallback);
}

function normalizeCenterShape(value) {
  return cleanText(value) === "circle" ? "circle" : "square";
}

function normalizeFieldLayout(value) {
  const layout = cleanText(value);
  return VALID_FIELD_LAYOUTS.includes(layout) ? layout : "square";
}

function normalizeProfileLiteReport(value) {
  const source = value && typeof value === "object" && !Array.isArray(value) ? value : {};
  const hasReportBody = Boolean(source.added || source.situation || source.mandala_effect || source.extra_help);
  return {
    mode: source.mode === "with_report" || (!source.mode && hasReportBody) ? "with_report" : "without_report",
    added: Boolean(source.added),
    situation: cleanText(source.situation),
    mandala_effect: cleanText(source.mandala_effect),
    extra_help: cleanText(source.extra_help),
    master_note: ""
  };
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
  const controller = new AbortController();
  const timeoutId = globalThis.setTimeout(() => controller.abort(), options.timeoutMs || REQUEST_TIMEOUT_MS);

  let response;
  try {
    response = await fetch(`${SUPABASE_URL}${path}`, {
      method: options.method || "GET",
      signal: controller.signal,
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${session?.access_token || SUPABASE_ANON_KEY}`,
        "Content-Type": "application/json",
        ...(options.prefer ? { Prefer: options.prefer } : {})
      },
      body: options.body === undefined ? undefined : JSON.stringify(options.body)
    });
  } catch (error) {
    if (error?.name === "AbortError") {
      throw powerPlaceError("Загрузка или сохранение места силы заняли слишком много времени. Проверьте подключение и попробуйте снова.", {
        status: 408,
        timeout: true
      });
    }

    throw error;
  } finally {
    globalThis.clearTimeout(timeoutId);
  }

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

async function resolveStorageRef(ref, session) {
  const parsed = parseStorageRef(ref);
  if (!parsed?.path || parsed.bucket !== PROFILE_MEDIA_BUCKET || !session?.access_token) return "";
  return createSignedMediaUrl(parsed.path, session, parsed.bucket);
}

async function resolveStorageRefs(refs, session) {
  const entries = await Promise.all(
    [...new Set(refs.filter((ref) => isStorageRef(ref)))].map(async (ref) => {
      try {
        return [ref, await withTimeout(
          resolveStorageRef(ref, session),
          HYDRATION_TIMEOUT_MS,
          "Подписание изображения места силы заняло слишком много времени.",
          { stage: "hydrate", timeout: true }
        )];
      } catch {
        return [ref, ""];
      }
    })
  );

  return Object.fromEntries(entries.filter(([, url]) => Boolean(url)));
}

function collectCompositionStorageRefs(row) {
  const refs = [];
  for (const value of Object.values(cleanJsonObject(row?.object_refs))) {
    if (typeof value === "string" && isStorageRef(value)) refs.push(value);
  }

  const coverRef = cleanJsonObject(row?.cover_ref);
  for (const value of [coverRef.src, coverRef.inner?.src, coverRef.outer?.src]) {
    if (typeof value === "string" && isStorageRef(value)) refs.push(value);
  }

  return refs;
}

function hydrateCoverDisplayRef(coverRef, signedUrls) {
  const cover = cleanJsonObject(coverRef);
  if (!coverRef || Object.keys(cover).length === 0) return coverRef;

  const hydrateLayer = (layer) => {
    const source = cleanJsonObject(layer);
    if (!layer || Object.keys(source).length === 0) return layer;
    const signedUrl = typeof source.src === "string" ? signedUrls[source.src] : "";
    return signedUrl ? { ...source, display_src: signedUrl } : source;
  };

  const signedUrl = typeof cover.src === "string" ? signedUrls[cover.src] : "";
  return {
    ...cover,
    ...(signedUrl ? { display_src: signedUrl } : {}),
    ...(cover.inner ? { inner: hydrateLayer(cover.inner) } : {}),
    ...(cover.outer ? { outer: hydrateLayer(cover.outer) } : {})
  };
}

function hydrateCompositionRowsWithSignedUrls(rows, signedUrls) {
  return (rows || []).map((row) => ({
    ...row,
    object_ref_urls: { ...signedUrls },
    cover_ref: hydrateCoverDisplayRef(row.cover_ref, signedUrls)
  }));
}

async function hydrateMediaRows(rows, session) {
  return hydrateMediaRowsForDisplay(rows, session);
}

async function hydrateCompositionRows(rows, session) {
  const refs = (rows || []).flatMap(collectCompositionStorageRefs);

  const signedUrls = await resolveStorageRefs(refs, session);
  return hydrateCompositionRowsWithSignedUrls(rows, signedUrls);
}

export const __testPowerPlaceClient = {
  collectCompositionStorageRefs,
  hydrateCompositionRowsWithSignedUrls
};

export function normalizeAccountPlan(plan) {
  const normalized = cleanText(plan).toLowerCase();
  return VALID_PLANS.includes(normalized) ? normalized : "start";
}

export function getPlanLimits(plan) {
  return normalizeAccountPlan(plan) === "pro"
    ? { compositions: 20, clientPhotos: 30 }
    : { compositions: 7, clientPhotos: 25 };
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

  const normalizeLayer = (layer, fallback = {}) => {
    const source = cleanJsonObject(layer);
    const layerId = cleanText(source.id) || cleanText(fallback.id) || "no-cover";
    const rawType = cleanText(source.type) || cleanText(fallback.type);
    const type = rawType === "image" ? "image" : rawType === "none" ? "none" : "placeholder";

    return {
      id: layerId,
      label: cleanText(source.label) || cleanText(fallback.label) || (type === "none" ? "Без фона" : "Заставка места силы"),
      type,
      tone: cleanText(source.tone) || cleanText(fallback.tone),
      src: cleanText(source.src) || cleanText(fallback.src)
    };
  };

  const type = cleanText(cover.type) === "image" ? "image" : cleanText(cover.type) === "none" ? "none" : "placeholder";
  const legacy = {
    id,
    label: cleanText(cover.label) || "Заставка места силы",
    type,
    tone: cleanText(cover.tone),
    src: cleanText(cover.src)
  };

  if (!cover.inner && !cover.outer) return legacy;

  return {
    ...legacy,
    inner: normalizeLayer(cover.inner, legacy),
    outer: normalizeLayer(cover.outer, { id: "no-cover", label: "Без фона", type: "none" })
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
  const starVariant = cleanText(composition?.star_variant);
  const chessVariant = cleanText(composition?.chess_variant);
  const sourceObjectRefs = cleanJsonObject(composition?.object_refs);
  const slotScale = composition?.slot_scale ?? sourceObjectRefs[SLOT_SCALE_REF_KEY];
  const fieldScale = composition?.field_scale ?? sourceObjectRefs[INNER_FIELD_SCALE_REF_KEY];
  const centerImageScale = composition?.__center_image_scale ?? sourceObjectRefs[CENTER_IMAGE_SCALE_REF_KEY];
  const centerFrameScale = composition?.__center_frame_scale ?? sourceObjectRefs[CENTER_FRAME_SCALE_REF_KEY];
  const objectRefs = cleanObjectRefs(sourceObjectRefs);
  const fieldLayout = normalizeFieldLayout(composition?.field_layout ?? sourceObjectRefs[FIELD_LAYOUT_REF_KEY]);
  const report = sourceObjectRefs[PROFILE_LITE_REPORT_REF_KEY];
  if (slotScale !== undefined || Object.hasOwn(sourceObjectRefs, SLOT_SCALE_REF_KEY)) {
    objectRefs[SLOT_SCALE_REF_KEY] = normalizeNumericRef(slotScale, 0.7, 1.18, 1);
  }
  if (fieldScale !== undefined || Object.hasOwn(sourceObjectRefs, INNER_FIELD_SCALE_REF_KEY)) {
    objectRefs[INNER_FIELD_SCALE_REF_KEY] = normalizeNumericRef(fieldScale, 48, 92, 78);
  }
  if (centerImageScale !== undefined || Object.hasOwn(sourceObjectRefs, CENTER_IMAGE_SCALE_REF_KEY)) {
    objectRefs[CENTER_IMAGE_SCALE_REF_KEY] = normalizeNumericRef(centerImageScale, 0.65, 1.45, 1);
  }
  if (centerFrameScale !== undefined || Object.hasOwn(sourceObjectRefs, CENTER_FRAME_SCALE_REF_KEY)) {
    objectRefs[CENTER_FRAME_SCALE_REF_KEY] = normalizeNumericRef(centerFrameScale, 0.72, 1.4, 1);
  }
  if (Object.hasOwn(sourceObjectRefs, CENTER_SHAPE_REF_KEY)) {
    objectRefs[CENTER_SHAPE_REF_KEY] = normalizeCenterShape(sourceObjectRefs[CENTER_SHAPE_REF_KEY]);
  }
  for (const key of [CENTER_IMAGE_OFFSET_X_REF_KEY, CENTER_IMAGE_OFFSET_Y_REF_KEY, INNER_COVER_OFFSET_X_REF_KEY, INNER_COVER_OFFSET_Y_REF_KEY, OUTER_COVER_OFFSET_X_REF_KEY, OUTER_COVER_OFFSET_Y_REF_KEY]) {
    if (Object.hasOwn(sourceObjectRefs, key)) objectRefs[key] = normalizeNumericRef(sourceObjectRefs[key], 20, 80, 50);
  }
  objectRefs[FIELD_LAYOUT_REF_KEY] = fieldLayout;
  if (report && typeof report === "object" && !Array.isArray(report)) {
    objectRefs[PROFILE_LITE_REPORT_REF_KEY] = normalizeProfileLiteReport(report);
  }

  return {
    profile_id: cleanText(composition?.profile_id),
    title: cleanText(composition?.title) || "Место силы",
    constructor_type: constructorType,
    geometry: constructorType === "client" && VALID_GEOMETRIES.includes(geometry) ? geometry : null,
    zodiac_visible_count: VALID_ZODIAC_VISIBLE_COUNTS.includes(zodiacVisibleCount) ? zodiacVisibleCount : 12,
    altar_center_ratio: VALID_ALTAR_RATIOS.includes(ratio) ? ratio : "1",
    business_vertex_zone_count: VALID_BUSINESS_ZONE_COUNTS.includes(businessZoneCount) ? businessZoneCount : 1,
    star_variant: VALID_STAR_VARIANTS.includes(starVariant) ? starVariant : "closed",
    chess_variant: VALID_CHESS_VARIANTS.includes(chessVariant) ? chessVariant : "classic-14",
    cover_ref: normalizeCoverRef(composition?.cover_ref),
    object_refs: objectRefs,
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


export async function deleteClientGoalPhoto(photoId, profileId, session = getStoredSession()) {
  requireSession(session);
  const cleanPhotoId = cleanText(photoId);
  const cleanProfileId = cleanText(profileId);
  if (!cleanPhotoId || !cleanProfileId) throw powerPlaceError("Не удалось определить фото для удаления.");

  await request(`/rest/v1/${CLIENT_PHOTOS_TABLE}?id=eq.${encodeURIComponent(cleanPhotoId)}&profile_id=eq.${encodeURIComponent(cleanProfileId)}`, {
    method: "DELETE",
    session
  });

  return true;
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

export async function createPowerPlaceComposition(composition, plan, session = getStoredSession(), options = {}) {
  return createPowerPlaceCompositionWithDependencies(composition, plan, session, {
    onStage: options.onStage,
    countRows: (profileId) => countRows(COMPOSITIONS_TABLE, profileId, session),
    insertRows: (payload) => request(`/rest/v1/${COMPOSITIONS_TABLE}`, {
      method: "POST",
      session,
      prefer: "return=representation",
      body: payload
    }),
    hydrateRows: (rows) => hydrateCompositionRows(rows, session)
  });
}

export async function createPowerPlaceCompositionWithDependencies(composition, plan, session = getStoredSession(), dependencies = {}) {
  requireSession(session);
  const payload = normalizePowerPlaceComposition(composition);
  const countRowsFailureMessage = "Не удалось проверить лимит сохранённых мандал перед сохранением. Проверьте подключение к Supabase и попробуйте снова.";
  const postFailureMessage = "Не удалось сохранить мандалу в Supabase. Проверьте доступ к таблице и попробуйте снова.";
  const hydrationFailureMessage = "Supabase вернул запись, но изображения мандалы не успели подготовиться. Запись добавлена без подписанных ссылок.";
  const onStage = typeof dependencies.onStage === "function" ? dependencies.onStage : () => {};
  let count = 0;
  try {
    onStage("countRows");
    count = await dependencies.countRows(payload.profile_id, session, payload);
  } catch (error) {
    throw powerPlaceError(countRowsFailureMessage, {
      stage: "countRows",
      error: safeErrorText(error)
    });
  }
  const limits = getPlanLimits(plan);
  if (count >= limits.compositions) {
    throw powerPlaceError(`Лимит ${limits.compositions} сохранённых мест силы для плана ${normalizeAccountPlan(plan) === "pro" ? "Pro" : "Start"} достигнут.`);
  }

  let rows = null;
  try {
    onStage("POST");
    rows = await dependencies.insertRows(payload, session);
    onStage("insertReturned");
  } catch (error) {
    throw powerPlaceError(postFailureMessage, {
      stage: "POST",
      error: safeErrorText(error)
    });
  }

  try {
    onStage("hydrate");
    const hydrated = await withTimeout(
      dependencies.hydrateRows(rows, session),
      HYDRATION_TIMEOUT_MS,
      hydrationFailureMessage,
      { stage: "hydrate", timeout: true }
    );
    return hydrated?.[0] || rows?.[0] || null;
  } catch (error) {
    const rawRow = Array.isArray(rows) ? rows[0] : null;
    if (rawRow?.id) {
      return {
        ...rawRow,
        __hydration_warning: true,
        __hydration_error: safeErrorText(error)
      };
    }

    throw powerPlaceError(hydrationFailureMessage, {
      stage: "hydrate",
      error: safeErrorText(error)
    });
  }
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
