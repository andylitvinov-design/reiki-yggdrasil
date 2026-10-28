const SUPABASE_URL = import.meta.env?.VITE_SUPABASE_URL?.replace(/\/$/, "") || "";
const SUPABASE_ANON_KEY = import.meta.env?.VITE_SUPABASE_ANON_KEY || "";

export const PROFILE_MEDIA_BUCKET = "profile-cabinet-media";
export const PROFILE_MEDIA_MAX_BYTES = 5 * 1024 * 1024;
export const PROFILE_AUDIO_MAX_BYTES = 100 * 1024 * 1024;
export const PROFILE_MEDIA_ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "audio/mpeg",
  "audio/mp4",
  "audio/wav",
  "audio/webm",
  "audio/ogg",
  "audio/aac",
  "application/pdf",
  "text/plain",
  "text/markdown",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
];
export const PROFILE_MEDIA_ALLOWED_GRIMOIRE_TYPES = PROFILE_MEDIA_ALLOWED_TYPES;
export const PROFILE_AUDIO_ALLOWED_TYPES = [
  "audio/mpeg",
  "audio/mp4",
  "audio/wav",
  "audio/webm",
  "audio/ogg",
  "audio/aac",
  "audio/flac",
  "audio/x-m4a"
];
export const MEDIA_SIGNING_ERROR_MESSAGE = "signed URL не создан — проверьте Storage/RLS";

function mediaError(message, details = null) {
  const error = new Error(message);
  error.details = details;
  return error;
}

function cleanText(value) {
  return String(value || "").trim();
}

function cleanSegment(value) {
  return cleanText(value)
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function randomUuid() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (char) => {
    const value = Math.floor(Math.random() * 16);
    const next = char === "x" ? value : (value & 0x3) | 0x8;
    return next.toString(16);
  });
}

export function sanitizeMediaFilename(filename) {
  const fallback = "image";
  const raw = cleanText(filename).split(/[\\/]/).pop() || fallback;
  const dotIndex = raw.lastIndexOf(".");
  const base = dotIndex > 0 ? raw.slice(0, dotIndex) : raw;
  const extension = dotIndex > 0 ? raw.slice(dotIndex + 1) : "";
  const safeBase = base
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 72) || fallback;
  const safeExtension = extension.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 8);

  return safeExtension ? `${safeBase}.${safeExtension}` : safeBase;
}

export function validateProfileMediaFile(file) {
  if (!file) throw mediaError("Выберите файл изображения.");
  if (!PROFILE_MEDIA_ALLOWED_TYPES.includes(file.type)) {
    throw mediaError("Недопустимый тип файла. Загрузите JPG, PNG, WEBP или GIF.");
  }
  if (file.size > PROFILE_MEDIA_MAX_BYTES) {
    throw mediaError("Файл слишком большой. Максимальный размер изображения — 5 MB.");
  }
}

export function validateGrimoireFile(file) {
  if (!file) throw mediaError("Выберите файл.");
  if (!PROFILE_MEDIA_ALLOWED_TYPES.includes(file.type)) {
    throw mediaError("Недопустимый тип файла. Поддерживаются изображения, аудио, PDF, TXT, MD, DOC, DOCX.");
  }
  if (file.size > PROFILE_MEDIA_MAX_BYTES) {
    throw mediaError("Файл слишком большой. Максимальный размер — 5 MB.");
  }
}

export function validateProfileAudioFile(file) {
  if (!file) throw mediaError("Выберите аудиофайл.");
  if (!PROFILE_AUDIO_ALLOWED_TYPES.includes(file.type)) {
    throw mediaError("Недопустимый тип аудио. Поддерживаются MP3, M4A, WAV, WEBM, OGG, AAC и FLAC.");
  }
  if (file.size > PROFILE_AUDIO_MAX_BYTES) {
    throw mediaError("Файл слишком большой. Максимальный размер аудио — 100 MB.");
  }
}

export function buildProfileMediaPath(file, context = {}, uuid = randomUuid()) {
  const profileId = cleanText(context.profileId);
  const kind = cleanText(context.kind);
  const safeFilename = sanitizeMediaFilename(file?.name || "image");

  if (!profileId) throw mediaError("Сначала сохраните профиль мастера.");

  if (kind === "client-goal") {
    return `${profileId}/client-goal/${uuid}-${safeFilename}`;
  }

  if (kind === "tradition") {
    const traditionId = cleanSegment(context.traditionId);
    if (!traditionId) throw mediaError("Выберите традицию для загрузки.");
    return `${profileId}/traditions/${traditionId}/${uuid}-${safeFilename}`;
  }

  if (kind === "power-place") {
    const compositionId = cleanSegment(context.compositionId) || "draft";
    const slotId = cleanSegment(context.slotId);
    if (!slotId) throw mediaError("Выберите слот мандалы для загрузки.");
    return `${profileId}/power-place/${compositionId}/${slotId}-${uuid}-${safeFilename}`;
  }

  if (kind === "material") {
    return `${profileId}/materials/${uuid}-${safeFilename}`;
  }

  if (kind === "underlay") {
    return `${profileId}/underlays/${uuid}-${safeFilename}`;
  }

  throw mediaError("Неизвестный тип загрузки изображения.");
}

export function buildCourseAudioPath(file, context = {}, uuid = randomUuid()) {
  const courseSlug = cleanSegment(context.courseSlug) || "course";
  const stepSlug = cleanSegment(context.stepSlug) || "step";
  const lessonId = cleanSegment(context.lessonId) || "draft";
  const safeFilename = sanitizeMediaFilename(file?.name || "audio");

  return `courses/${courseSlug}/${stepSlug}/${lessonId}/${uuid}-${safeFilename}`;
}

export function encodeStorageObjectPath(path) {
  return cleanText(path)
    .split("/")
    .filter(Boolean)
    .map((segment) => encodeURIComponent(segment))
    .join("/");
}

export function normalizeSignedStorageUrl(signedURL, baseUrl = SUPABASE_URL) {
  const value = cleanText(signedURL);
  const origin = cleanText(baseUrl).replace(/\/$/, "");

  if (value.startsWith("http")) return value;
  if (value.startsWith("/storage/v1/")) return `${origin}${value}`;
  if (value.startsWith("/object/")) return `${origin}/storage/v1${value}`;

  return `${origin}/storage/v1/${value.replace(/^\/+/, "")}`;
}

export function toStorageRef(bucket, path) {
  return `storage://${bucket}/${path}`;
}

export function isStorageRef(value) {
  return cleanText(value).startsWith("storage://");
}

export function parseStorageRef(value) {
  const ref = cleanText(value);
  const prefix = "storage://";
  if (!ref.startsWith(prefix)) return null;
  const withoutProtocol = ref.slice(prefix.length);
  const slashIndex = withoutProtocol.indexOf("/");
  if (slashIndex <= 0) return null;

  return {
    bucket: withoutProtocol.slice(0, slashIndex),
    path: withoutProtocol.slice(slashIndex + 1)
  };
}

function storageRefFromRow(row) {
  const path = cleanText(row?.image_path);
  const bucket = cleanText(row?.image_bucket) || PROFILE_MEDIA_BUCKET;
  if (path) return toStorageRef(bucket, path);
  const imageUrl = cleanText(row?.image_url);
  return isStorageRef(imageUrl) ? imageUrl : "";
}

export async function hydrateMediaRowsForDisplay(rows, session, signer = createSignedMediaUrl) {
  return Promise.all((rows || []).map(async (row) => {
    const storageRef = storageRefFromRow(row);
    if (!storageRef) {
      const imageUrl = cleanText(row?.image_url);
      return {
        ...row,
        image_ref: imageUrl,
        display_url: imageUrl,
        media_signing_status: imageUrl ? "not-needed" : ""
      };
    }

    try {
      const parsed = parseStorageRef(storageRef);
      const signedUrl = parsed?.path && session?.access_token
        ? await signer(parsed.path, session, parsed.bucket || PROFILE_MEDIA_BUCKET)
        : "";
      if (!signedUrl) throw mediaError(MEDIA_SIGNING_ERROR_MESSAGE);
      return {
        ...row,
        image_ref: storageRef,
        signed_url: signedUrl,
        display_url: signedUrl,
        media_signing_status: "success",
        media_signing_error: ""
      };
    } catch {
      return {
        ...row,
        image_ref: storageRef,
        signed_url: "",
        display_url: "",
        media_signing_status: "error",
        media_signing_error: MEDIA_SIGNING_ERROR_MESSAGE
      };
    }
  }));
}

function requireStorageConfig(session) {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw mediaError("Загрузка файлов требует настройки подключения Supabase.");
  }
  if (!session?.access_token) throw mediaError("Нужно войти в кабинет.");
}

export async function createSignedMediaUrl(path, session, bucket = PROFILE_MEDIA_BUCKET, expiresIn = 3600) {
  requireStorageConfig(session);

  const encodedBucket = encodeURIComponent(cleanText(bucket) || PROFILE_MEDIA_BUCKET);
  const encodedPath = encodeStorageObjectPath(path);
  const response = await fetch(`${SUPABASE_URL}/storage/v1/object/sign/${encodedBucket}/${encodedPath}`, {
    method: "POST",
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${session.access_token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ expiresIn })
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) throw mediaError(data?.message || data?.msg || "Не удалось создать ссылку на изображение.", data);

  const signedURL = data?.signedURL || data?.signedUrl;
  if (!signedURL) throw mediaError("Supabase не вернул ссылку на изображение.");
  return normalizeSignedStorageUrl(signedURL);
}

export async function uploadCourseAudio(file, context = {}, session) {
  requireStorageConfig(session);
  validateProfileAudioFile(file);

  const path = buildCourseAudioPath(file, context);
  const response = await fetch(`${SUPABASE_URL}/storage/v1/object/${PROFILE_MEDIA_BUCKET}/${encodeStorageObjectPath(path)}`, {
    method: "POST",
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${session.access_token}`,
      "Content-Type": file.type,
      "x-upsert": "false"
    },
    body: file
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) throw mediaError(data?.message || data?.msg || "Не удалось загрузить аудио.", data);

  const signedUrl = await createSignedMediaUrl(path, session);

  return {
    bucket: PROFILE_MEDIA_BUCKET,
    path,
    ref: toStorageRef(PROFILE_MEDIA_BUCKET, path),
    signedUrl,
    metadata: {
      filename: sanitizeMediaFilename(file.name),
      originalFilename: file.name,
      mimeType: file.type,
      size: file.size
    }
  };
}

export async function createSignedCourseAudioUrl(refOrPath, session, expiresIn = 3600) {
  const parsed = parseStorageRef(refOrPath);
  const bucket = parsed?.bucket || PROFILE_MEDIA_BUCKET;
  const path = parsed?.path || cleanText(refOrPath);
  if (!path) return "";
  return createSignedMediaUrl(path, session, bucket, expiresIn);
}

export async function resolveLessonAudioDisplayUrl(lesson = {}, session, signer = createSignedCourseAudioUrl) {
  const storageRef = lesson.audio_storage_path
    ? toStorageRef(lesson.audio_storage_bucket || PROFILE_MEDIA_BUCKET, lesson.audio_storage_path)
    : cleanText(lesson.audio_url);

  if (!storageRef) {
    return { audioUrl: "", status: "missing", error: "" };
  }

  if (/^https?:\/\//i.test(storageRef) && !storageRef.includes("/storage/v1/object/sign/")) {
    return { audioUrl: storageRef, status: "external", error: "" };
  }

  try {
    const audioUrl = await signer(storageRef, session);
    return audioUrl
      ? { audioUrl, status: "signed", error: "" }
      : { audioUrl: "", status: "error", error: MEDIA_SIGNING_ERROR_MESSAGE };
  } catch {
    return { audioUrl: "", status: "error", error: MEDIA_SIGNING_ERROR_MESSAGE };
  }
}

export async function uploadProfileMedia(file, context = {}, session) {
  requireStorageConfig(session);
  validateProfileMediaFile(file);

  const path = buildProfileMediaPath(file, context);
  const response = await fetch(`${SUPABASE_URL}/storage/v1/object/${PROFILE_MEDIA_BUCKET}/${encodeStorageObjectPath(path)}`, {
    method: "POST",
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${session.access_token}`,
      "Content-Type": file.type,
      "x-upsert": "false"
    },
    body: file
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) throw mediaError(data?.message || data?.msg || "Не удалось загрузить изображение.", data);

  const signedUrl = await createSignedMediaUrl(path, session);

  return {
    bucket: PROFILE_MEDIA_BUCKET,
    path,
    ref: toStorageRef(PROFILE_MEDIA_BUCKET, path),
    signedUrl,
    metadata: {
      filename: sanitizeMediaFilename(file.name),
      originalFilename: file.name,
      mimeType: file.type,
      size: file.size
    }
  };
}
