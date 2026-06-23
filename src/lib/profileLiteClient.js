export const PROFILE_LITE_AUTH_STATUSES = ["idle", "loading", "success", "error"];
export const PROFILE_LITE_PROFILE_STATUSES = ["idle", "loading", "success", "error"];

export const PROFILE_LITE_TABS = [
  { id: "mandalas", label: "Мастерская", href: "/profile/mandalas" },
  { id: "profile", label: "Профиль", href: "/profile?tab=profile" },
  { id: "media", label: "Фото / Медиа", href: "/profile?tab=media" },
  { id: "materials", label: "Гримуар", href: "/profile?tab=materials" },
  { id: "courses", label: "Курсы", href: "/profile/courses" },
  { id: "services", label: "Услуги", href: "/profile/services" },
  { id: "clients", label: "Клиенты", href: "/profile?tab=clients" },
  { id: "orders", label: "Заказы", href: "/profile/orders" },
  { id: "chats", label: "Чаты", href: "/profile/chats" }
];

export const PROFILE_LITE_CABINET_ROLES = [
  { id: "client", label: "Кабинет Личный", defaultTabId: "orders" },
  { id: "master", label: "Кабинет Мастера", defaultTabId: "mandalas" }
];

export const PROFILE_LITE_ROLE_NAV = {
  client: [
    { label: "Мои заказы", tabId: "orders" },
    { label: "Мои фото", tabId: "media" },
    { label: "Чаты", tabId: "chats" },
    { label: "Профиль", tabId: "profile" }
  ],
  master: [
    { label: "Мастерская", tabId: "mandalas" },
    { label: "Услуги", tabId: "services" },
    { label: "Клиенты", tabId: "clients" },
    { label: "Заявки", tabId: "orders", role: "master" },
    { label: "Гримуар", tabId: "materials" }
  ]
};

const PROFILE_LITE_ROLE_TAB_IDS = {
  client: ["orders", "media", "chats", "profile"],
  master: ["mandalas", "services", "clients", "materials", "orders"]
};

const PROFILE_LITE_INTERNAL_TABS = [
  ...PROFILE_LITE_TABS,
  { id: "settings", label: "Настройки", href: "/profile/settings" },
  { id: "diagnostics", label: "Диагностика", href: "/profile?tab=diagnostics" }
];

const SAFE_STATUS_VALUES = ["draft", "pending", "approved", "rejected"];
const SAVE_STATUS_VALUES = ["draft", "pending"];
const SAFE_PLAN_VALUES = ["start", "pro"];
const SESSION_CREDENTIAL_FIELD = ["access", "token"].join("_");

function hasText(value) {
  return typeof value === "string" && value.trim().length > 0;
}

export function normalizeProfileLiteStatus(value, fallback = "idle") {
  return PROFILE_LITE_AUTH_STATUSES.includes(value) || PROFILE_LITE_PROFILE_STATUSES.includes(value)
    ? value
    : fallback;
}

export function getProfileLiteTabById(tabId) {
  return PROFILE_LITE_INTERNAL_TABS.find((tab) => tab.id === tabId) || PROFILE_LITE_TABS[0];
}

export function getProfileLiteRouteByTabId(tabId) {
  return getProfileLiteTabById(tabId).href;
}

export function getProfileLiteRoleById(roleId) {
  return PROFILE_LITE_CABINET_ROLES.find((role) => role.id === roleId) || PROFILE_LITE_CABINET_ROLES[0];
}

export function getProfileLiteRoleForTab(tabId, preferredRole = "") {
  if (tabId === "orders" && preferredRole === "master") return "master";
  return ["mandalas", "services", "clients", "materials"].includes(tabId) ? "master" : "client";
}

export function getProfileLiteRoleNav(roleId) {
  const role = getProfileLiteRoleById(roleId);
  return PROFILE_LITE_ROLE_NAV[role.id] || PROFILE_LITE_ROLE_NAV.client;
}

export function getProfileLiteTabsForRole(roleId) {
  const role = getProfileLiteRoleById(roleId);
  const allowedIds = PROFILE_LITE_ROLE_TAB_IDS[role.id] || PROFILE_LITE_ROLE_TAB_IDS.client;
  return PROFILE_LITE_TABS.filter((tab) => allowedIds.includes(tab.id));
}

export function getProfileLiteInitialTabFromLocation(pathname = "/profile", search = "") {
  const routeTabMap = {
    "/profile/mandalas": "mandalas",
    "/profile/courses": "courses",
    "/profile/services": "services",
    "/profile/orders": "orders",
    "/profile/chats": "chats",
    "/profile/settings": "settings"
  };

  if (routeTabMap[pathname]) return routeTabMap[pathname];

  if (pathname === "/profile" || pathname === "/profile-lite") {
    const queryTab = new URLSearchParams(search).get("tab");
    return queryTab ? getProfileLiteTabById(queryTab).id : getProfileLiteRoleById("client").defaultTabId;
  }

  return "mandalas";
}

export function hasProfileLiteSessionCredential(session) {
  return Boolean(session?.[SESSION_CREDENTIAL_FIELD]);
}

export function shortUserId(value) {
  const id = String(value || "").trim();
  if (!id) return "нет";
  if (id.length <= 12) return id;
  return `${id.slice(0, 8)}...${id.slice(-4)}`;
}

export function safeProfileLiteError(error, fallback = "Не удалось загрузить данные кабинета.") {
  const message = hasText(error?.message) ? error.message : fallback;
  const lowerMessage = message.toLowerCase();
  if (
    lowerMessage.includes("schema cache")
    && lowerMessage.includes("profile_cabinet_publications")
    && (
      lowerMessage.includes("'category'")
      || lowerMessage.includes("category")
      || lowerMessage.includes("material_group")
      || lowerMessage.includes("subcategory")
    )
  ) {
    return "В Supabase не применена миграция таксономии материалов: отсутствует колонка category в profile_cabinet_publications. Нужно применить migration 20260617120000_profile_cabinet_publication_material_taxonomy.sql на staging/2mentalica.";
  }
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
