export const PROFILE_LITE_AUTH_STATUSES = ["idle", "loading", "success", "error"];
export const PROFILE_LITE_PROFILE_STATUSES = ["idle", "loading", "success", "error"];

const SAFE_STATUS_VALUES = ["draft", "pending"];

function hasText(value) {
  return typeof value === "string" && value.trim().length > 0;
}

export function normalizeProfileLiteStatus(value, fallback = "idle") {
  return PROFILE_LITE_AUTH_STATUSES.includes(value) || PROFILE_LITE_PROFILE_STATUSES.includes(value)
    ? value
    : fallback;
}

export function shortUserId(value) {
  const id = String(value || "").trim();
  if (!id) return "нет";
  if (id.length <= 12) return id;
  return `${id.slice(0, 8)}...${id.slice(-4)}`;
}

export function safeProfileLiteError(error, fallback = "Не удалось загрузить данные кабинета.") {
  const message = hasText(error?.message) ? error.message : fallback;
  return message
    .replace(/https?:\/\/\S+/gi, "[url hidden]")
    .replace(/[A-Za-z0-9_-]{3,}\.[A-Za-z0-9_-]{3,}\.[A-Za-z0-9_-]{3,}/g, "[token hidden]")
    .replace(/[A-Za-z0-9_-]{24,}\.[A-Za-z0-9_-]{16,}\.[A-Za-z0-9_-]{16,}/g, "[token hidden]")
    .replace(/[A-Za-z0-9_-]{32,}/g, "[secret hidden]");
}

export function createProfileLiteDiagnostics({
  supabaseConfigured = false,
  session = null,
  sessionExpired = false,
  user = null,
  profile = null,
  authStatus = "idle",
  profileStatus = "idle"
} = {}) {
  return [
    { label: "supabase configured", value: supabaseConfigured ? "yes" : "no" },
    { label: "stored session", value: session ? "yes" : "no" },
    { label: "session expired", value: sessionExpired ? "yes" : "no" },
    { label: "current user", value: user ? "yes" : "no" },
    { label: "user id present", value: user?.id ? "yes" : "no" },
    { label: "user email present", value: user?.email ? "yes" : "no" },
    { label: "own profile", value: profile ? "yes" : "no" },
    { label: "auth status", value: normalizeProfileLiteStatus(authStatus) },
    { label: "profile status", value: normalizeProfileLiteStatus(profileStatus) }
  ];
}

export function createProfileLiteForm(profile = null, user = null) {
  return {
    display_name: profile?.display_name || user?.email?.split("@")?.[0] || "",
    bio: profile?.bio || "",
    status: SAFE_STATUS_VALUES.includes(profile?.status) ? profile.status : "draft"
  };
}

export function createProfileLiteSavePayload(form = {}, user = null) {
  return {
    user_id: user?.id || "",
    display_name: String(form.display_name || "").trim(),
    bio: String(form.bio || "").trim(),
    status: SAFE_STATUS_VALUES.includes(form.status) ? form.status : "draft"
  };
}

export async function loadProfileLiteViewModel({
  supabaseConfigured = false,
  session = null,
  sessionExpired = false,
  getCurrentUser,
  getOwnProfile
} = {}) {
  if (!supabaseConfigured) {
    return {
      authStatus: "idle",
      profileStatus: "idle",
      user: null,
      profile: null,
      error: "Supabase не настроен.",
      profileError: ""
    };
  }

  if (!session) {
    return {
      authStatus: "idle",
      profileStatus: "idle",
      user: null,
      profile: null,
      error: "",
      profileError: ""
    };
  }

  if (sessionExpired) {
    return {
      authStatus: "error",
      profileStatus: "idle",
      user: null,
      profile: null,
      error: "Сессия устарела. Войдите заново.",
      profileError: ""
    };
  }

  try {
    const user = await getCurrentUser(session);
    if (!user?.id) {
      return {
        authStatus: "error",
        profileStatus: "idle",
        user: null,
        profile: null,
        error: "Пользователь не найден. Войдите заново.",
        profileError: ""
      };
    }

    try {
      const profile = await getOwnProfile(user.id, session);
      return {
        authStatus: "success",
        profileStatus: "success",
        user,
        profile,
        error: "",
        profileError: ""
      };
    } catch (error) {
      return {
        authStatus: "success",
        profileStatus: "error",
        user,
        profile: null,
        error: "",
        profileError: safeProfileLiteError(error, "Профиль не загрузился.")
      };
    }
  } catch (error) {
    return {
      authStatus: "error",
      profileStatus: "idle",
      user: null,
      profile: null,
      error: safeProfileLiteError(error, "Пользователь не загрузился."),
      profileError: ""
    };
  }
}
