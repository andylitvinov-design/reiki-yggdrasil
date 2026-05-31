const PROFILE_LOADING_TIMEOUT_MS = 15000;

function cabinetError(message, details = null) {
  const error = new Error(message);
  error.details = details;
  return error;
}

function authLoadError(message) {
  return cabinetError(message, { status: 401 });
}

function authTimeoutError(message) {
  const error = cabinetError(message, { status: 408, timeout: true });
  error.code = "auth_load_timeout";
  return error;
}

function base64UrlDecode(value) {
  if (!value || typeof value !== "string") return "";
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(normalized.length + (4 - normalized.length % 4) % 4, "=");

  if (typeof atob === "function") {
    try {
      return atob(padded);
    } catch {
      return "";
    }
  }

  if (typeof Buffer !== "undefined") {
    try {
      return Buffer.from(padded, "base64").toString("utf8");
    } catch {
      return "";
    }
  }

  return "";
}

function fallbackUserFromSession(session) {
  const token = session?.access_token || "";
  const [, payloadSegment] = token.split(".");
  if (!payloadSegment) return null;

  try {
    const payload = JSON.parse(base64UrlDecode(payloadSegment));
    const id = payload?.sub || payload?.user_id || "";
    if (!id) return null;

    return {
      id,
      email: typeof payload.email === "string" ? payload.email : "",
      app_metadata: payload.app_metadata || {},
      user_metadata: payload.user_metadata || {},
      source: "session-jwt-fallback"
    };
  } catch {
    return null;
  }
}

function shouldUseSessionFallback(error) {
  const details = error?.details || {};
  const status = Number(details.status || details.code || 0);

  if (error?.code === "auth_load_timeout" || status === 408 || details.timeout) return true;
  if (status === 401 || status === 403) return false;
  return !status;
}

async function withTimeout(promise, timeoutMs = PROFILE_LOADING_TIMEOUT_MS) {
  let timeoutId;
  const timeoutPromise = new Promise((_, reject) => {
    timeoutId = globalThis.setTimeout(() => {
      reject(authTimeoutError("Вход не отвечает. Пробую открыть кабинет по сохранённой сессии."));
    }, timeoutMs);
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    globalThis.clearTimeout(timeoutId);
  }
}

export async function loadProfileCabinetBootstrap({
  session,
  getCurrentUser,
  timeoutMs = PROFILE_LOADING_TIMEOUT_MS
} = {}) {
  if (!session?.access_token) {
    return { currentUser: null, currentProfile: null };
  }

  let currentUser;
  try {
    currentUser = await withTimeout(getCurrentUser(session), timeoutMs);
  } catch (error) {
    const fallbackUser = shouldUseSessionFallback(error) ? fallbackUserFromSession(session) : null;
    if (fallbackUser?.id) {
      return { currentUser: fallbackUser, currentProfile: null };
    }
    throw error;
  }

  if (!currentUser?.id) {
    const fallbackUser = fallbackUserFromSession(session);
    if (fallbackUser?.id) {
      return { currentUser: fallbackUser, currentProfile: null };
    }

    throw authLoadError("Сессия устарела. Войдите заново.");
  }

  // Keep the critical cabinet path limited to auth → current user.
  // Profile data can be absent/slow without blocking the cabinet shell.
  return { currentUser, currentProfile: null };
}

export async function loadPowerPlaceOptionalData({
  profileId,
  session,
  listClientGoalPhotos,
  listPowerPlaceCompositions
} = {}) {
  if (!profileId || !session?.access_token) {
    return {
      clientGoalPhotos: [],
      powerPlaceCompositions: [],
      notices: []
    };
  }

  const [photosResult, compositionsResult] = await Promise.allSettled([
    listClientGoalPhotos(profileId, session),
    listPowerPlaceCompositions(profileId, session)
  ]);

  const notices = [];
  const clientGoalPhotos = photosResult.status === "fulfilled" ? photosResult.value || [] : [];
  const powerPlaceCompositions = compositionsResult.status === "fulfilled" ? compositionsResult.value || [] : [];

  if (photosResult.status === "rejected") {
    notices.push(photosResult.reason?.message || "Не удалось загрузить фото клиентов / целей.");
  }

  if (compositionsResult.status === "rejected") {
    notices.push(compositionsResult.reason?.message || "Не удалось загрузить места силы.");
  }

  return { clientGoalPhotos, powerPlaceCompositions, notices };
}

export function normalizeProfileRecord(profile, user, emptyProfile = {}) {
  return {
    ...emptyProfile,
    ...(profile || {}),
    user_id: profile?.user_id || user?.id || ""
  };
}
