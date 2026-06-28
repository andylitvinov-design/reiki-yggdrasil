import { normalizeMasterPlan } from "./masterPlans.js";

const SUPABASE_URL = import.meta.env?.VITE_SUPABASE_URL?.replace(/\/$/, "") || "";
const SUPABASE_ANON_KEY = import.meta.env?.VITE_SUPABASE_ANON_KEY || "";
const ADMIN_EMAIL = import.meta.env?.VITE_ADMIN_EMAIL || "";

const SESSION_KEY = "reiki-yggdrasil-session";
const PKCE_VERIFIER_KEY = "reiki-yggdrasil-pkce-verifier";
const PROFILES_TABLE = "profile_cabinet_profiles";
const ADMINS_TABLE = "profile_cabinet_admins";
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

function storeSession(session) {
  if (!session?.access_token) return null;

  const expiresAt = Number(session.expires_at) || (session.expires_in ? Math.floor(Date.now() / 1000) + Number(session.expires_in) : null);
  const storedSession = {
    access_token: session.access_token,
    refresh_token: session.refresh_token || "",
    expires_at: expiresAt,
    token_type: session.token_type || "bearer"
  };

  localStorage.setItem(SESSION_KEY, JSON.stringify(storedSession));
  return storedSession;
}

function base64UrlEncode(value) {
  const bytes = value instanceof ArrayBuffer ? new Uint8Array(value) : value;
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function createPkceVerifier() {
  const bytes = new Uint8Array(64);
  crypto.getRandomValues(bytes);
  return base64UrlEncode(bytes);
}

async function createPkceChallenge(verifier) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier));
  return base64UrlEncode(digest);
}

async function exchangeOAuthCodeFromUrl() {
  if (typeof window === "undefined" || !supabaseEnv.isConfigured) return;

  const searchParams = new URLSearchParams(window.location.search);
  const authCode = searchParams.get("code");
  if (!authCode) return;

  const codeVerifier = sessionStorage.getItem(PKCE_VERIFIER_KEY);
  if (!codeVerifier) return;

  try {
    const data = await request("/auth/v1/token?grant_type=pkce", {
      method: "POST",
      body: {
        auth_code: authCode,
        code_verifier: codeVerifier
      }
    });
    const storedSession = storeSession(data);
    sessionStorage.removeItem(PKCE_VERIFIER_KEY);
    window.history.replaceState({}, document.title, window.location.pathname);
    if (storedSession?.access_token) window.location.reload();
  } catch (_error) {
    sessionStorage.removeItem(PKCE_VERIFIER_KEY);
    window.history.replaceState({}, document.title, window.location.pathname);
  }
}

if (typeof window !== "undefined") {
  void exchangeOAuthCodeFromUrl();
}

export function getStoredSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    clearStoredSession();
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
    storeSession(session);
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

export async function signInWithGoogle(redirectPath = "/profile") {
  requireConfig();

  const safePath = redirectPath.startsWith("/") && !redirectPath.startsWith("//") ? redirectPath : "/profile";
  const redirectTo = new URL(safePath, window.location.origin).toString();
  const authorizeUrl = new URL("/auth/v1/authorize", `${SUPABASE_URL}/`);
  const codeVerifier = createPkceVerifier();
  const codeChallenge = await createPkceChallenge(codeVerifier);

  sessionStorage.setItem(PKCE_VERIFIER_KEY, codeVerifier);
  authorizeUrl.searchParams.set("provider", "google");
  authorizeUrl.searchParams.set("redirect_to", redirectTo);
  authorizeUrl.searchParams.set("code_challenge", codeChallenge);
  authorizeUrl.searchParams.set("code_challenge_method", "s256");

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

export async function getCurrentAdmin(session = getStoredSession(), currentUser = null) {
  if (!session?.access_token) return null;

  const user = currentUser?.id ? currentUser : await getCurrentUser(session);
  if (!user?.id) return null;

  const rows = await request(`/rest/v1/${ADMINS_TABLE}?user_id=eq.${encodeURIComponent(user.id)}&select=user_id,email&limit=1`, {
    accessToken: session.access_token
  });

  return rows?.[0] || null;
}

export async function isCurrentUserAdmin(session = getStoredSession(), currentUser = null) {
  if (!session?.access_token) return false;

  const user = currentUser?.id ? currentUser : await getCurrentUser(session);
  if (!user?.id) return false;

  const adminRow = await getCurrentAdmin(session, user);
  if (adminRow) return true;

  return isAdminUser(user);
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

function safePostgrestSearch(value) {
  return String(value || "")
    .trim()
    .replace(/[,%*()]/g, " ")
    .replace(/\s+/g, " ")
    .slice(0, 80);
}

export async function listProfilesForAdmin(session = getStoredSession(), search = "") {
  if (!session?.access_token) throw cabinetError("Нужен вход администратора.");

  const term = safePostgrestSearch(search);
  const query = [
    "select=*",
    "order=updated_at.desc",
    "limit=30"
  ];

  if (term) {
    query.push(`or=${encodeURIComponent(`(display_name.ilike.*${term}*,email.ilike.*${term}*)`)}`);
  }

  return request(`/rest/v1/${PROFILES_TABLE}?${query.join("&")}`, {
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

export async function updateProfileAccountPlan(profileId, accountPlan, session = getStoredSession()) {
  if (!session?.access_token) throw cabinetError("Нужен вход администратора.");
  if (!profileId) throw cabinetError("Профиль участника не выбран.");

  return updateProfileAdminFields(profileId, { accountPlan }, session);
}

export async function updateProfileAdminFields(profileId, { accountPlan, status } = {}, session = getStoredSession()) {
  if (!session?.access_token) throw cabinetError("Нужен вход администратора.");
  if (!profileId) throw cabinetError("Профиль участника не выбран.");

  const body = {};
  if (accountPlan !== undefined) body.account_plan = normalizeMasterPlan(accountPlan);
  if (status !== undefined) body.status = status;
  if (!Object.keys(body).length) throw cabinetError("Нет изменений для сохранения.");

  const rows = await request(`/rest/v1/${PROFILES_TABLE}?id=eq.${encodeURIComponent(profileId)}`, {
    method: "PATCH",
    accessToken: session.access_token,
    prefer: "return=representation",
    body
  });

  return rows?.[0] || null;
}
