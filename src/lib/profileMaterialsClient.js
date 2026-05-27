import { getStoredSession, supabaseEnv } from "./supabaseClient.js";
import { createSignedMediaUrl, isStorageRef, parseStorageRef } from "./profileMediaClient.js";

const SUPABASE_URL = import.meta.env?.VITE_SUPABASE_URL?.replace(/\/$/, "") || "";
const SUPABASE_ANON_KEY = import.meta.env?.VITE_SUPABASE_ANON_KEY || "";
const PUBLICATIONS_TABLE = "profile_cabinet_publications";

export const MATERIAL_TYPES = [
  { value: "mandala", label: "Мандала" },
  { value: "artifact", label: "Артефакт" },
  { value: "practice", label: "Практика" }
];

export const MATERIAL_STATUSES = [
  { value: "draft", label: "черновик" },
  { value: "pending", label: "на модерации" },
  { value: "approved", label: "опубликовано" },
  { value: "rejected", label: "нужна правка" }
];

function materialError(message, details = null) {
  const error = new Error(message);
  error.details = details;
  return error;
}

function cleanText(value) {
  return String(value || "").trim();
}

function cleanType(value) {
  return MATERIAL_TYPES.some((item) => item.value === value) ? value : "mandala";
}

function cleanStatus(value) {
  return MATERIAL_STATUSES.some((item) => item.value === value) ? value : "draft";
}

function cleanSettingIndex(value) {
  if (value === null || value === undefined || value === "") return null;
  const number = Number(value);
  return Number.isInteger(number) && number >= 0 ? number : null;
}

export function createEmptyMaterialForm(overrides = {}) {
  return {
    type: "mandala",
    title: "",
    description: "",
    image_url: "",
    step_id: "",
    step_title: "",
    setting_title: "",
    setting_index: null,
    status: "draft",
    ...overrides
  };
}

export function publicationTypeLabel(type) {
  return MATERIAL_TYPES.find((item) => item.value === type)?.label || "Мандала";
}

export function materialStatusText(status) {
  return MATERIAL_STATUSES.find((item) => item.value === status)?.label || "черновик";
}

export function normalizeMaterialForm(form, requestedStatus = form?.status) {
  return {
    type: cleanType(form?.type),
    title: cleanText(form?.title),
    description: cleanText(form?.description),
    image_url: cleanText(form?.image_url),
    step_id: cleanText(form?.step_id),
    step_title: cleanText(form?.step_title),
    setting_title: cleanText(form?.setting_title),
    setting_index: cleanSettingIndex(form?.setting_index),
    status: cleanStatus(requestedStatus)
  };
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

async function hydrateMaterialRows(rows, session) {
  return Promise.all((rows || []).map(async (row) => {
    if (!isStorageRef(row?.image_url) || !session?.access_token) return row;

    const parsed = parseStorageRef(row.image_url);
    if (!parsed?.path) return row;

    try {
      return {
        ...row,
        display_url: await createSignedMediaUrl(parsed.path, session, parsed.bucket)
      };
    } catch {
      return row;
    }
  }));
}

export async function listOwnMaterials(profileId, session = getStoredSession()) {
  if (!profileId || !session?.access_token) return [];

  const rows = await request(`/rest/v1/${PUBLICATIONS_TABLE}?profile_id=eq.${encodeURIComponent(profileId)}&select=*&order=updated_at.desc`, {
    session
  });

  return hydrateMaterialRows(rows, session);
}

export async function createOwnMaterial(material, session = getStoredSession()) {
  if (!session?.access_token) throw materialError("Нужно войти в кабинет.");

  const rows = await request(`/rest/v1/${PUBLICATIONS_TABLE}`, {
    method: "POST",
    session,
    prefer: "return=representation",
    body: material
  });

  const hydrated = await hydrateMaterialRows(rows, session);
  return hydrated?.[0] || null;
}
