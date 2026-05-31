const PROFILE_LOADING_TIMEOUT_MS = 15000;

function cabinetError(message, details = null) {
  const error = new Error(message);
  error.details = details;
  return error;
}

function authLoadError(message) {
  return cabinetError(message, { status: 401 });
}

async function withTimeout(promise, timeoutMs = PROFILE_LOADING_TIMEOUT_MS) {
  let timeoutId;
  const timeoutPromise = new Promise((_, reject) => {
    timeoutId = globalThis.setTimeout(() => {
      const error = authLoadError("Вход не отвечает. Сессия сброшена, войдите заново.");
      error.code = "auth_load_timeout";
      reject(error);
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
  timeoutMs = PROFILE_LOADING_TIMEOUT_MS
} = {}) {
  if (!session?.access_token) {
    return { currentUser: null, currentProfile: null };
  }

  return withTimeout((async () => {
    const currentUser = await getCurrentUser(session);
    if (!currentUser?.id) {
      throw authLoadError("Сессия устарела. Войдите заново.");
    }

    const currentProfile = await getOwnProfile(currentUser.id, session);
    return { currentUser, currentProfile };
  })(), timeoutMs);
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
