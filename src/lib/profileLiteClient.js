export const PROFILE_LITE_AUTH_STATUSES = ["idle", "loading", "success", "error"];
export const PROFILE_LITE_PROFILE_STATUSES = ["idle", "loading", "success", "error"];

export const PROFILE_LITE_TABS = [
  { id: "overview", label: "Обзор", href: "/profile" },
  { id: "profile", label: "Профиль", href: "/profile?tab=profile" },
  { id: "mandalas", label: "Место силы", href: "/profile/mandalas" },
  { id: "media", label: "Фото / Медиа", href: "/profile?tab=media" },
  { id: "materials", label: "Материалы", href: "/profile?tab=materials" },
  { id: "services", label: "Услуги", href: "/profile/services" },
  { id: "orders", label: "Заказы", href: "/profile/orders" },
  { id: "chats", label: "Чаты", href: "/profile/chats" },
  { id: "settings", label: "Настройки", href: "/profile/settings" },
  { id: "diagnostics", label: "Диагностика", href: "/profile?tab=diagnostics" }
];

const SAFE_STATUS_VALUES = ["draft", "pending", "approved", "rejected"];
const SAVE_STATUS_VALUES = ["draft", "pending"];
const SAFE_PLAN_VALUES = ["start", "pro"];

function hasText(value) {
  return typeof value === "string" && value.trim().length > 0;
}

export function normalizeProfileLiteStatus(value, fallback = "idle") {
  return PROFILE_LITE_AUTH_STATUSES.includes(value) || PROFILE_LITE_PROFILE_STATUSES.includes(value)
    ? value
    : fallback;
}

export function getProfileLiteTabById(tabId) {
  return PROFILE_LITE_TABS.find((tab) => tab.id === tabId) || PROFILE_LITE_TABS[0];
}

export function getProfileLiteRouteByTabId(tabId) {
  return getProfileLiteTabById(tabId).href;
}

export function getProfileLiteInitialTabFromLocation(pathname = "/profile", search = "") {
  const routeTabMap = {
    "/profile/mandalas": "mandalas",
    "/profile/services": "services",
    "/profile/orders": "orders",
    "/profile/chats": "chats",
    "/profile/settings": "settings"
  };

  if (routeTabMap[pathname]) return routeTabMap[pathname];

  if (pathname === "/profile" || pathname === "/profile-lite") {
    const queryTab = new URLSearchParams(search).get("tab");
    return queryTab ? getProfileLiteTabById(queryTab).id : "mandalas";
  }

  return "overview";
}

export function hasProfileLiteSessionCredential(session) {
  return Boolean(session?.access_token);
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
    city: profile?.city || "",
    country: profile?.country || "",
    telegram: profile?.telegram || "",
    website: profile?.website || "",
    avatar_url: profile?.avatar_url || "",
    account_plan: SAFE_PLAN_VALUES.includes(profile?.account_plan) ? profile.account_plan : "start",
    status: SAFE_STATUS_VALUES.includes(profile?.status) ? profile.status : "draft"
  };
}

export function createProfileLiteSavePayload(form = {}, user = null, requestedStatus = form.status) {
  return {
    user_id: user?.id || "",
    display_name: String(form.display_name || "").trim(),
    bio: String(form.bio || "").trim(),
    city: String(form.city || "").trim(),
    country: String(form.country || "").trim(),
    telegram: String(form.telegram || "").trim(),
    website: String(form.website || "").trim(),
    avatar_url: String(form.avatar_url || "").trim(),
    account_plan: SAFE_PLAN_VALUES.includes(form.account_plan) ? form.account_plan : "start",
    status: SAVE_STATUS_VALUES.includes(requestedStatus) ? requestedStatus : "draft"
  };
}

export async function createProfileLiteShellViewModel({
  supabaseConfigured = false,
  session = null,
  sessionExpired = false,
  getCurrentUser
} = {}) {
  if (!supabaseConfigured) {
    return {
      authStatus: "idle",
      user: null,
      profile: null,
      error: "Supabase не настроен."
    };
  }

  if (!session) {
    return {
      authStatus: "idle",
      user: null,
      profile: null,
      error: ""
    };
  }

  if (sessionExpired) {
    return {
      authStatus: "error",
      user: null,
      profile: null,
      error: "Сессия устарела. Войдите заново."
    };
  }

  try {
    const user = await getCurrentUser(session);
    if (!user?.id) {
      return {
        authStatus: "error",
        user: null,
        profile: null,
        error: "Пользователь не найден. Войдите заново."
      };
    }

    return {
      authStatus: "success",
      user,
      profile: null,
      error: ""
    };
  } catch (error) {
    return {
      authStatus: "error",
      user: null,
      profile: null,
      error: safeProfileLiteError(error, "Пользователь не загрузился.")
    };
  }
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
