const PROFILE_LOADING_TIMEOUT_MS = 15000;
const PROFILE_SECONDARY_TIMEOUT_MS = 1200;

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

function secondaryDataTimeoutError(message) {
  const error = cabinetError(message, { status: 408, timeout: true, secondary: true });
  error.code = "secondary_profile_timeout";
  return error;
}

function sanitizeSecondaryDataMessage(value) {
  return String(value || "")
    .replace(/https?:\/\/\S+/gi, "[url hidden]")
    .replace(/[A-Za-z0-9_-]{3,}\.[A-Za-z0-9_-]{3,}\.[A-Za-z0-9_-]{3,}/g, "[token hidden]")
    .replace(/[A-Za-z0-9_-]{32,}/g, "[secret hidden]")
    .slice(0, 180);
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

function normalizeCurrentUser(value) {
  if (value?.id) return value;
  if (value?.user?.id) return value.user;
  if (value?.data?.user?.id) return value.data.user;
  return value || null;
}

function shouldUseSessionFallback(error) {
  const details = error?.details || {};
  const status = Number(details.status || details.code || 0);

  if (error?.code === "auth_load_timeout" || status === 408 || details.timeout) return true;
  if (status === 401 || status === 403) return false;
  return !status;
}

async function withTimeout(promise, timeoutMs = PROFILE_LOADING_TIMEOUT_MS, createTimeoutError = authTimeoutError) {
  let timeoutId;
  const timeoutPromise = new Promise((_, reject) => {
    timeoutId = globalThis.setTimeout(() => {
      reject(createTimeoutError("Вход не отвечает. Пробую открыть кабинет по сохранённой сессии."));
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
  getOwnProfile,
  timeoutMs = PROFILE_LOADING_TIMEOUT_MS,
  secondaryTimeoutMs = PROFILE_SECONDARY_TIMEOUT_MS,
  onStep = () => {}
} = {}) {
  onStep("started");

  if (!session?.access_token) {
    onStep("no-session");
    return { currentUser: null, currentProfile: null, notices: [] };
  }

  let currentUser;
  try {
    onStep("user-request-started");
    currentUser = normalizeCurrentUser(await withTimeout(getCurrentUser(session), timeoutMs));
    onStep("user-request-resolved");
  } catch (error) {
    const fallbackUser = shouldUseSessionFallback(error) ? fallbackUserFromSession(session) : null;
    if (fallbackUser?.id) {
      onStep("fallback-used");
      return { currentUser: fallbackUser, currentProfile: null, notices: [] };
    }
    onStep("error", error);
    throw error;
  }

  if (!currentUser?.id) {
    onStep("user-missing-id");
    const fallbackUser = fallbackUserFromSession(session);
    if (fallbackUser?.id) {
      onStep("fallback-used");
      return { currentUser: fallbackUser, currentProfile: null, notices: [] };
    }

    const error = authLoadError("Сессия устарела. Войдите заново.");
    onStep("error", error);
    throw error;
  }

  onStep("user-has-id");

  if (typeof getOwnProfile !== "function") {
    return { currentUser, currentProfile: null, notices: [] };
  }

  try {
    onStep("profile-request-started");
    const ownProfileTimeoutMs = Math.max(1, Math.min(Number(secondaryTimeoutMs) || PROFILE_SECONDARY_TIMEOUT_MS, Number(timeoutMs) || PROFILE_LOADING_TIMEOUT_MS));
    const currentProfile = await withTimeout(
      getOwnProfile(currentUser.id, session),
      ownProfileTimeoutMs,
      () => secondaryDataTimeoutError("Профиль загружается слишком долго")
    );
    onStep("profile-request-resolved");
    return { currentUser, currentProfile: currentProfile || null, notices: [] };
  } catch (error) {
    onStep("profile-request-failed", error);
    return {
      currentUser,
      currentProfile: null,
      notices: [`Профиль не загрузился: ${sanitizeSecondaryDataMessage(error?.message || "данные профиля временно недоступны")}. Кабинет открыт в базовом режиме.`]
    };
  }
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
