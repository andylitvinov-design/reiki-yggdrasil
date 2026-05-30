const SUPABASE_URL = import.meta.env?.VITE_SUPABASE_URL?.replace(/\/$/, "") || "";
const SUPABASE_ANON_KEY = import.meta.env?.VITE_SUPABASE_ANON_KEY || "";
const ADMIN_EMAIL = import.meta.env?.VITE_ADMIN_EMAIL || "";

const SESSION_KEY = "reiki-yggdrasil-session";
const PROFILES_TABLE = "profile_cabinet_profiles";
const REQUEST_TIMEOUT_MS = 12000;

export const supabaseEnv = {
  url: SUPABASE_URL,
  isConfigured: Boolean(SUPABASE_URL && SUPABASE_ANON_KEY),
  adminEmail: ADMIN_EMAIL
};

function cabinetError(message, details = null) {
  const error = new Error(message);
  error.details = details;
  return error;
}

export function isExpiredOrInvalidAuthError(error) {
  const details = error?.details || {};
  const status = Number(details.status || details.code || 0);
  const text = [
    error?.message,
    details.message,
    details.msg,
    details.error,
    details.error_description
  ].filter(Boolean).join(" ").toLowerCase();

  return (
    status === 401 ||
    text.includes("jwt") ||
    text.includes("token") && text.includes("expired") ||
    text.includes("invalid claim") ||
    text.includes("invalid claims") ||
    text.includes("unable to parse or verify signature")
  );
}

export function isStoredSessionExpired(session) {
  if (!session?.expires_at) return false;
  const expiresAt = Number(session.expires_at);
  if (!Number.isFinite(expiresAt)) return false;
  return expiresAt * 1000 <= Date.now();
}

function requireConfig() {
  if (!supabaseEnv.isConfigured) {
    throw cabinetError("Кабинет профиля требует настройки подключения Supabase.");
  }
}

async function request(path, options = {}) {
  requireConfig();

  const {
    method = "GET",
    body,
    accessToken,
    prefer,
    headers = {},
    timeoutMs = REQUEST_TIMEOUT_MS
  } = options;

  const controller = new AbortController();
  const timeoutId = globalThis.setTimeout(() => controller.abort(), timeoutMs);

  let response;
  try {
    response = await fetch(`${SUPABASE_URL}${path}`, {
      method,
      signal: controller.signal,
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${accessToken || SUPABASE_ANON_KEY}`,
        "Content-Type": "application/json",
        ...(prefer ? { Prefer: prefer } : {}),
        ...headers
      },
      body: body === undefined ? undefined : JSON.stringify(body)
    });
  } catch (error) {
    if (error?.name === "AbortError") {
      throw cabinetError("Кабинет загружается слишком долго. Проверьте подключение и попробуйте войти заново.", {
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
    throw cabinetError(data?.msg || data?.message || "Ошибка Supabase запроса.", {
      ...(data && typeof data === "object" ? data : {}),
      status: response.status
    });
  }

  return data;
}

export function getStoredSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function clearStoredSession() {
  localStorage.removeItem(SESSION_KEY);
}

export function storeSessionFromUrlHash() {
  if (!window.location.hash.includes("access_token")) return getStoredSession();

  const hash = new URLSearchParams(window.location.hash.slice(1));
  const session = {
    access_token: hash.get("access_token"),
    refresh_token: hash.get("refresh_token"),
    expires_at: hash.get("expires_at"),
    token_type: hash.get("token_type")
  };

  if (session.access_token) {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    window.history.replaceState({}, document.title, window.location.pathname);
    return session;
  }

  return getStoredSession();
}

export async function sendMagicLink(email, redirectPath = "/profile") {
  requireConfig();

  const safePath = redirectPath.startsWith("/") ? redirectPath : "/profile";
  const redirectTo = `${window.location.origin}${safePath}`;

  return request("/auth/v1/otp", {
    method: "POST",
    body: {
      email,
      create_user: true,
      options: {
        email_redirect_to: redirectTo
      }
    }
  });
}

export function signInWithGoogle(redirectPath = "/profile") {
  requireConfig();

  const safePath = redirectPath.startsWith("/") && !redirectPath.startsWith("//") ? redirectPath : "/profile";
  const redirectTo = new URL(safePath, window.location.origin).toString();
  const authorizeUrl = new URL("/auth/v1/authorize", `${SUPABASE_URL}/`);

  authorizeUrl.searchParams.set("provider", "google");
  authorizeUrl.searchParams.set("redirect_to", redirectTo);

  window.location.assign(authorizeUrl.toString());
}

export async function getCurrentUser(session = getStoredSession()) {
  if (!session?.access_token) return null;

  const user = await request("/auth/v1/user", {
    accessToken: session.access_token
  });

  return user;
}

export function isAdminUser(user) {
  return Boolean(user?.email && ADMIN_EMAIL && user.email.toLowerCase() === ADMIN_EMAIL.toLowerCase());
}

export async function getOwnProfile(userId, session = getStoredSession()) {
  if (!userId || !session?.access_token) return null;

  const rows = await request(`/rest/v1/${PROFILES_TABLE}?user_id=eq.${encodeURIComponent(userId)}&select=*`, {
    accessToken: session.access_token
  });

  return rows?.[0] || null;
}

export async function saveOwnProfile(profile, session = getStoredSession()) {
  if (!session?.access_token) throw cabinetError("Нужно войти в кабинет.");

  const rows = await request(`/rest/v1/${PROFILES_TABLE}?on_conflict=user_id`, {
    method: "POST",
    accessToken: session.access_token,
    prefer: "resolution=merge-duplicates,return=representation",
    body: profile
  });

  return rows?.[0] || null;
}

export async function submitOwnProfile(profile, session = getStoredSession()) {
  return saveOwnProfile({ ...profile, status: "pending" }, session);
}

export async function listApprovedProfiles() {
  return request(`/rest/v1/${PROFILES_TABLE}?status=eq.approved&select=*&order=updated_at.desc`);
}

export async function listPendingProfiles(session = getStoredSession()) {
  if (!session?.access_token) throw cabinetError("Нужен вход администратора.");

  return request(`/rest/v1/${PROFILES_TABLE}?status=eq.pending&select=*&order=updated_at.asc`, {
    accessToken: session.access_token
  });
}

export async function updateProfileStatus(profileId, status, session = getStoredSession()) {
  if (!session?.access_token) throw cabinetError("Нужен вход администратора.");

  const rows = await request(`/rest/v1/${PROFILES_TABLE}?id=eq.${encodeURIComponent(profileId)}`, {
    method: "PATCH",
    accessToken: session.access_token,
    prefer: "return=representation",
    body: { status }
  });

  return rows?.[0] || null;
}
