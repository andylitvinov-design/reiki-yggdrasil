import { isPublicSafeFeedImageUrl } from "./profileActivityFeedClient.js";
import { supabaseEnv } from "./supabaseClient.js";

const SUPABASE_URL = import.meta.env?.VITE_SUPABASE_URL?.replace(/\/$/, "") || "";
const SUPABASE_ANON_KEY = import.meta.env?.VITE_SUPABASE_ANON_KEY || "";

const PROFILES_TABLE = "profile_cabinet_profiles";
const PUBLICATIONS_TABLE = "profile_cabinet_publications";
const SERVICES_TABLE = "profile_cabinet_services";

const PUBLIC_PROFILE_FIELDS = [
  "id",
  "display_name",
  "bio",
  "city",
  "country",
  "telegram",
  "website",
  "avatar_url",
  "status",
  "created_at",
  "updated_at"
].join(",");

const PUBLIC_PUBLICATION_FIELDS = [
  "id",
  "profile_id",
  "type",
  "title",
  "description",
  "image_url",
  "step_id",
  "step_title",
  "setting_title",
  "status",
  "created_at",
  "updated_at"
].join(",");

const PUBLIC_SERVICE_FIELDS = [
  "id",
  "profile_id",
  "title",
  "description",
  "image_url",
  "price_amount",
  "price_currency",
  "status",
  "created_at",
  "updated_at"
].join(",");

export const MASTER_PAGE_TABS = [
  { id: "all", label: "Все" },
  { id: "notes", label: "Заметки" },
  { id: "articles", label: "Статьи" },
  { id: "mandalas", label: "Мандалы" },
  { id: "services", label: "Услуги" },
  { id: "materials", label: "Материалы" }
];

function publicMasterError(message, details = null) {
  const error = new Error(message);
  error.details = details;
  return error;
}

function text(value) {
  return String(value || "").trim();
}

function safeLimit(value, fallback = 24) {
  const parsed = Number(value);
  const number = Number.isFinite(parsed) ? Math.trunc(parsed) : fallback;
  return Math.min(Math.max(number, 1), 48);
}

function publicImageUrl(value) {
  const url = text(value);
  return isPublicSafeFeedImageUrl(url) ? url : "";
}

function publicWebsite(value) {
  const url = text(value);
  if (!/^https?:\/\//i.test(url)) return "";

  try {
    return new URL(url).toString();
  } catch {
    return "";
  }
}

function publicTelegram(value) {
  const raw = text(value);
  if (!raw) return "";
  if (/^https:\/\/t\.me\/[a-z0-9_]+\/?$/i.test(raw)) return raw;
  const handle = raw.replace(/^@/, "").replace(/^https?:\/\/t\.me\//i, "").replace(/\/.*$/, "");
  return /^[a-z0-9_]{5,32}$/i.test(handle) ? `https://t.me/${handle}` : "";
}

export function normalizePublicMasterProfile(row = {}) {
  return {
    id: text(row.id),
    displayName: text(row.display_name) || "Мастер Reiki Yggdrasil",
    role: "Мастер Рейки Иггдрасиль",
    bio: text(row.bio),
    city: text(row.city),
    country: text(row.country),
    avatarUrl: publicImageUrl(row.avatar_url),
    telegramUrl: publicTelegram(row.telegram),
    websiteUrl: publicWebsite(row.website),
    status: text(row.status),
    createdAt: row.created_at || "",
    updatedAt: row.updated_at || ""
  };
}

function publicationKind(type) {
  if (type === "article") return "article";
  if (type === "mandala") return "mandala";
  if (type === "practice") return "material";
  return "material";
}

export function normalizePublicMasterPublication(row = {}) {
  const kind = publicationKind(text(row.type));
  return {
    id: text(row.id),
    source: "publication",
    kind,
    profileId: text(row.profile_id),
    title: text(row.title) || (kind === "article" ? "Статья мастера" : kind === "mandala" ? "Мандала мастера" : "Материал мастера"),
    description: text(row.description),
    imageUrl: publicImageUrl(row.image_url),
    category: text(row.step_title || row.setting_title),
    type: text(row.type) || "uncategorized",
    status: text(row.status),
    createdAt: row.created_at || "",
    updatedAt: row.updated_at || ""
  };
}

export function normalizePublicMasterService(row = {}) {
  return {
    id: text(row.id),
    source: "service",
    kind: "service",
    profileId: text(row.profile_id),
    title: text(row.title) || "Услуга мастера",
    description: text(row.description),
    imageUrl: publicImageUrl(row.image_url),
    priceAmount: row.price_amount === null || row.price_amount === undefined || row.price_amount === "" ? null : Number(row.price_amount),
    priceCurrency: text(row.price_currency || "EUR") || "EUR",
    status: text(row.status),
    createdAt: row.created_at || "",
    updatedAt: row.updated_at || ""
  };
}

export function buildApprovedMasterProfilePath(profileId) {
  const id = text(profileId);
  return `/rest/v1/${PROFILES_TABLE}?id=eq.${encodeURIComponent(id)}&status=eq.approved&select=${PUBLIC_PROFILE_FIELDS}&limit=1`;
}

export function buildPublicMasterPublicationsPath({ profileId, limit = 24 } = {}) {
  const id = text(profileId);
  return `/rest/v1/${PUBLICATIONS_TABLE}?profile_id=eq.${encodeURIComponent(id)}&status=eq.approved&select=${PUBLIC_PUBLICATION_FIELDS}&order=created_at.desc&limit=${safeLimit(limit)}`;
}

export function buildPublicMasterServicesPath({ profileId, limit = 12 } = {}) {
  const id = text(profileId);
  return `/rest/v1/${SERVICES_TABLE}?profile_id=eq.${encodeURIComponent(id)}&status=eq.published&select=${PUBLIC_SERVICE_FIELDS}&order=updated_at.desc&limit=${safeLimit(limit, 12)}`;
}

async function request(path) {
  if (!supabaseEnv.isConfigured) {
    throw publicMasterError("Публичная страница мастера требует настройки подключения Supabase.");
  }

  const response = await fetch(`${SUPABASE_URL}${path}`, {
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      "Content-Type": "application/json"
    }
  });

  const raw = await response.text();
  const data = raw ? JSON.parse(raw) : null;
  if (!response.ok) {
    throw publicMasterError(data?.msg || data?.message || "Не удалось загрузить публичную страницу мастера.", {
      ...(data || {}),
      status: response.status
    });
  }

  return data;
}

export async function getApprovedMasterProfile(profileId) {
  const rows = await request(buildApprovedMasterProfilePath(profileId));
  return rows?.[0] ? normalizePublicMasterProfile(rows[0]) : null;
}

export async function listPublicMasterPublications(profileId, { limit = 24 } = {}) {
  const rows = await request(buildPublicMasterPublicationsPath({ profileId, limit }));
  return Array.isArray(rows) ? rows.map(normalizePublicMasterPublication) : [];
}

export async function listPublicMasterServices(profileId, { limit = 12 } = {}) {
  const rows = await request(buildPublicMasterServicesPath({ profileId, limit }));
  return Array.isArray(rows) ? rows.map(normalizePublicMasterService) : [];
}

export async function fetchPublicMasterPage(profileId) {
  const profile = await getApprovedMasterProfile(profileId);
  if (!profile) return { profile: null, publications: [], services: [] };

  const [publications, services] = await Promise.all([
    listPublicMasterPublications(profile.id),
    listPublicMasterServices(profile.id)
  ]);

  return { profile, publications, services };
}
