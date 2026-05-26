import { getStoredSession, supabaseEnv } from "./supabaseClient.js";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL?.replace(/\/$/, "") || "";
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "";
const PUBLICATIONS_TABLE = "profile_cabinet_publications";

function materialError(message, details = null) {
  const error = new Error(message);
  error.details = details;
  return error;
}

async function request(path, options = {}) {
  if (!supabaseEnv.isConfigured) {
    throw materialError("Кабинет материалов требует настройки подключения Supabase.");
  }

  const session = options.session || getStoredSession();
  const response = await fetch(`${SUPABASE_URL}${path}`, {
    method: options.method || "GET",
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${session?.access_token || SUPABASE_ANON_KEY}`,
      "Content-Type": "application/json",
      ...(options.prefer ? { Prefer: options.prefer } : {})
    },
    body: options.body === undefined ? undefined : JSON.stringify(options.body)
  });

  const text = await response.text();
  const data = text ? JSON.parse(text) : null;

  if (!response.ok) {
    throw materialError(data?.msg || data?.message || "Ошибка сохранения материала.", data);
  }

  return data;
}

export async function listOwnMaterials(profileId, session = getStoredSession()) {
  if (!profileId || !session?.access_token) return [];

  return request(`/rest/v1/${PUBLICATIONS_TABLE}?profile_id=eq.${encodeURIComponent(profileId)}&select=*&order=updated_at.desc`, {
    session
  });
}

export async function createOwnMaterial(material, session = getStoredSession()) {
  if (!session?.access_token) throw materialError("Нужно войти в кабинет.");

  const rows = await request(`/rest/v1/${PUBLICATIONS_TABLE}`, {
    method: "POST",
    session,
    prefer: "return=representation",
    body: material
  });

  return rows?.[0] || null;
}
