import { getStoredSession, supabaseEnv } from "./supabaseClient.js";
import { createSignedMediaUrl, isStorageRef, parseStorageRef } from "./profileMediaClient.js";

const SUPABASE_URL = import.meta.env?.VITE_SUPABASE_URL?.replace(/\/$/, "") || "";
const SUPABASE_ANON_KEY = import.meta.env?.VITE_SUPABASE_ANON_KEY || "";
const PUBLICATIONS_TABLE = "profile_cabinet_publications";
const PUBLIC_MATERIAL_FIELDS = [
  "id",
  "type",
  "material_group",
  "material_type",
  "title",
  "description",
  "image_url",
  "step_id",
  "step_title",
  "setting_title",
  "setting_index",
  "category",
  "subcategory",
  "status",
  "created_at",
  "updated_at",
  "profile_id"
].join(",");

export const MATERIAL_TYPES = [
  { value: "practice", label: "Материал" },
  { value: "photo", label: "Фото / образ" },
  { value: "article", label: "Статья" },
  { value: "document", label: "Документ" },
  { value: "audio", label: "Аудио" },
  { value: "artifact", label: "Артефакт" },
  { value: "mandala", label: "Мандала" }
];

export const DB_SAFE_GRIMOIRE_TYPE = "practice";
export const TAXONOMY_UNCLASSIFIED = "unclassified";
export const TAXONOMY_UNCLASSIFIED_LABEL = "Неразобранно";
export const GRIMOIRE_TAXONOMY_NEEDS_VERIFICATION = true;

export const GRIMOIRE_TAXONOMY = [
  {
    value: "dao-ri",
    label: "РИ",
    children: [
      {
        value: "dao-ri-foundation",
        label: "База РИ",
        children: [
          { value: "dao-ri-practices", label: "Практики" },
          { value: "dao-ri-initiations", label: "Настройки" },
          { value: "dao-ri-materials", label: "Материалы" }
        ]
      },
      {
        value: "dao-ri-mandalas",
        label: "Мандалы РИ",
        children: [
          { value: "dao-ri-client-mandala", label: "Клиентская мандала" },
          { value: "dao-ri-place-mandala", label: "Место силы" },
          { value: "dao-ri-service-mandala", label: "Услуга" }
        ]
      }
    ]
  },
  {
    value: "channels",
    label: "Каналы",
    children: [
      {
        value: "god-channels",
        label: "Каналы богов",
        children: [
          { value: "healing-channel", label: "Исцеление" },
          { value: "protection-channel", label: "Защита" },
          { value: "resource-channel", label: "Ресурс" }
        ]
      },
      {
        value: "practice-channels",
        label: "Каналы практик",
        children: [
          { value: "audio-channel", label: "Аудио" },
          { value: "text-channel", label: "Тексты" },
          { value: "visual-channel", label: "Образы" }
        ]
      }
    ]
  },
  {
    value: "deities",
    label: "Боги",
    children: [
      {
        value: "norse-deities",
        label: "Северная традиция",
        children: [
          { value: "odin", label: "Один" },
          { value: "freyja", label: "Фрейя" },
          { value: "thor", label: "Тор" }
        ]
      },
      {
        value: "greek-deities",
        label: "Греческая традиция",
        children: [
          { value: "apollo", label: "Аполлон" },
          { value: "athena", label: "Афина" },
          { value: "hestia", label: "Гестия" }
        ]
      }
    ]
  },
  {
    value: "clients",
    label: "Клиенты",
    children: [
      {
        value: "client-work",
        label: "Работа с клиентом",
        children: [
          { value: "client-request", label: "Запрос" },
          { value: "client-result", label: "Результат" },
          { value: "client-followup", label: "Сопровождение" }
        ]
      },
      {
        value: "client-materials",
        label: "Материалы клиента",
        children: [
          { value: "client-photo", label: "Фото клиента" },
          { value: "client-notes", label: "Заметки" },
          { value: "client-documents", label: "Документы" }
        ]
      }
    ]
  }
];

const UNCLASSIFIED_OPTION = { value: TAXONOMY_UNCLASSIFIED, label: TAXONOMY_UNCLASSIFIED_LABEL, children: [] };

function withUnclassified(options) {
  return [UNCLASSIFIED_OPTION, ...(options || [])];
}

export function grimoireTaxonomyLevelOptions(level, parentValues = {}) {
  if (level === 1) return withUnclassified(GRIMOIRE_TAXONOMY);

  const level1 = GRIMOIRE_TAXONOMY.find((item) => item.value === parentValues.level1);
  if (level === 2) return withUnclassified(level1?.children || []);

  const level2 = (level1?.children || []).find((item) => item.value === parentValues.level2);
  return withUnclassified(level2?.children || []);
}

export function createDefaultTaxonomy(overrides = {}) {
  return {
    level1: TAXONOMY_UNCLASSIFIED,
    level2: TAXONOMY_UNCLASSIFIED,
    level3: TAXONOMY_UNCLASSIFIED,
    ...overrides
  };
}

export const GRIMOIRE_CATEGORIES = [
  { value: "all", label: "Все записи" },
  { value: TAXONOMY_UNCLASSIFIED, label: TAXONOMY_UNCLASSIFIED_LABEL },
  ...GRIMOIRE_TAXONOMY
];

const LEGACY_MATERIAL_TYPE_LABELS = new Map([
  ["photo", "Фото / образ"],
  ["article", "Статья"],
  ["document", "Документ"],
  ["audio", "Аудио"],
  ["practice", "Практика"],
  ["artifact", "Артефакт"],
  ["mandala", "Мандала"],
  ["uncategorized", "Без категории"]
]);

const AUDIO_EXTENSIONS = ["mp3", "mp4a", "ogg", "wav", "webm", "aac", "flac", "m4a", "opus"];
const DOC_EXTENSIONS = ["pdf", "doc", "docx"];
const TEXT_EXTENSIONS = ["txt", "md"];
const IMAGE_EXTENSIONS = ["jpg", "jpeg", "png", "webp", "gif", "avif"];

export function stripFileExtension(filename) {
  const name = String(filename || "").trim();
  const dotIndex = name.lastIndexOf(".");
  if (dotIndex > 0) return name.slice(0, dotIndex);
  return name;
}

export function detectMaterialTypeFromFile(file) {
  if (!file) return DB_SAFE_GRIMOIRE_TYPE;
  const mimeType = String(file.type || "").toLowerCase();
  if (mimeType.startsWith("image/")) return "photo";
  const ext = String(file.name || "").split(".").pop().toLowerCase();
  if (IMAGE_EXTENSIONS.includes(ext)) return "photo";
  if (mimeType.startsWith("audio/") || AUDIO_EXTENSIONS.includes(ext)) return "audio";
  if (
    mimeType === "application/pdf" ||
    mimeType === "application/msword" ||
    mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    DOC_EXTENSIONS.includes(ext) ||
    TEXT_EXTENSIONS.includes(ext)
  ) return "document";
  return DB_SAFE_GRIMOIRE_TYPE;
}

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
  if (MATERIAL_TYPES.some((item) => item.value === value)) return value;
  if (value === "uncategorized") return "uncategorized";
  if (["ri", "channels", "gods", "clients"].includes(value)) return DB_SAFE_GRIMOIRE_TYPE;
  return DB_SAFE_GRIMOIRE_TYPE;
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
    type: DB_SAFE_GRIMOIRE_TYPE,
    taxonomy: createDefaultTaxonomy(),
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
  return MATERIAL_TYPES.find((item) => item.value === type)?.label || LEGACY_MATERIAL_TYPE_LABELS.get(type) || "Без категории";
}

export function normalizeGrimoireTaxonomy(value = {}) {
  const level1 = cleanText(value.level1 ?? value.category ?? value.material_category) || TAXONOMY_UNCLASSIFIED;
  const level2 = cleanText(value.level2 ?? value.subcategory ?? value.material_subcategory) || TAXONOMY_UNCLASSIFIED;
  const level3 = cleanText(value.level3 ?? value.material_group ?? value.materialGroup ?? value.group) || TAXONOMY_UNCLASSIFIED;
  return { level1, level2, level3 };
}

export function grimoireTaxonomyFromMaterial(material = {}) {
  return normalizeGrimoireTaxonomy({
    level1: material.taxonomy?.level1 ?? material.category,
    level2: material.taxonomy?.level2 ?? material.subcategory,
    level3: material.taxonomy?.level3 ?? material.material_group
  });
}

function findTaxonomyLabel(level, value, parentValues = {}) {
  const cleanValue = cleanText(value) || TAXONOMY_UNCLASSIFIED;
  if (cleanValue === TAXONOMY_UNCLASSIFIED || cleanValue === "uncategorized") return TAXONOMY_UNCLASSIFIED_LABEL;
  return grimoireTaxonomyLevelOptions(level, parentValues).find((item) => item.value === cleanValue)?.label || cleanValue;
}

export function grimoireTaxonomyLabels(materialOrTaxonomy = {}) {
  const taxonomy = materialOrTaxonomy.level1 || materialOrTaxonomy.level2 || materialOrTaxonomy.level3
    ? normalizeGrimoireTaxonomy(materialOrTaxonomy)
    : grimoireTaxonomyFromMaterial(materialOrTaxonomy);

  return [
    findTaxonomyLabel(1, taxonomy.level1),
    findTaxonomyLabel(2, taxonomy.level2, taxonomy),
    findTaxonomyLabel(3, taxonomy.level3, taxonomy)
  ];
}

export function grimoireTaxonomyCompactLabel(materialOrTaxonomy = {}) {
  return grimoireTaxonomyLabels(materialOrTaxonomy)
    .filter((label) => label && label !== TAXONOMY_UNCLASSIFIED_LABEL)
    .join(" / ");
}

export function isGrimoireTaxonomyUnclassified(materialOrTaxonomy = {}) {
  const taxonomy = materialOrTaxonomy.level1 || materialOrTaxonomy.level2 || materialOrTaxonomy.level3
    ? normalizeGrimoireTaxonomy(materialOrTaxonomy)
    : grimoireTaxonomyFromMaterial(materialOrTaxonomy);
  return [taxonomy.level1, taxonomy.level2, taxonomy.level3].some((value) => !value || value === TAXONOMY_UNCLASSIFIED || value === "uncategorized");
}

export function materialStatusText(status) {
  return MATERIAL_STATUSES.find((item) => item.value === status)?.label || "черновик";
}

export function getGrimoirePreviewUrl(material) {
  const displayUrl = cleanText(material?.display_url ?? material?.displayUrl);
  if (displayUrl) return displayUrl;

  const signedUrl = cleanText(material?.signed_url ?? material?.signedUrl);
  if (signedUrl) return signedUrl;

  const imageUrl = cleanText(material?.image_url ?? material?.imageUrl);
  return isStorageRef(imageUrl) ? "" : imageUrl;
}

export function isGrimoireFeedVisible(material) {
  return cleanStatus(material?.status) === "approved" || Boolean(material?.feed_item_id || material?.feedItemId);
}

export function getGrimoireFeedActionLabel(material) {
  return isGrimoireFeedVisible(material) ? "Спрятать" : "Добавить в ленту";
}

export function getGrimoireNextVisibilityStatus(material) {
  return isGrimoireFeedVisible(material) ? "draft" : "approved";
}

export function normalizeMaterialForm(form, requestedStatus = form?.status) {
  const taxonomy = normalizeGrimoireTaxonomy(form?.taxonomy || form);
  return {
    type: cleanType(form?.type),
    material_group: taxonomy.level3,
    material_type: cleanText(form?.material_type ?? form?.materialType ?? form?.type),
    title: cleanText(form?.title),
    description: cleanText(form?.description),
    image_url: cleanText(form?.image_url),
    step_id: cleanText(form?.step_id),
    step_title: cleanText(form?.step_title),
    setting_title: cleanText(form?.setting_title),
    setting_index: cleanSettingIndex(form?.setting_index),
    category: taxonomy.level1,
    subcategory: taxonomy.level2,
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

export async function listPublicMaterials({ limit = 24 } = {}) {
  const normalizedLimit = Number.isFinite(Number(limit)) ? Number(limit) : 24;
  const safeLimit = Math.min(Math.max(Math.trunc(normalizedLimit), 1), 48);
  const rows = await request(`/rest/v1/${PUBLICATIONS_TABLE}?status=eq.approved&select=${PUBLIC_MATERIAL_FIELDS}&order=created_at.desc&limit=${safeLimit}`);

  return Array.isArray(rows) ? rows : [];
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

export async function updateOwnMaterial(id, patch, session = getStoredSession()) {
  if (!session?.access_token) throw materialError("Нужно войти в кабинет.");
  if (!id) throw materialError("Не указан идентификатор материала.");

  const rows = await request(`/rest/v1/${PUBLICATIONS_TABLE}?id=eq.${encodeURIComponent(id)}`, {
    method: "PATCH",
    session,
    prefer: "return=representation",
    body: { ...patch, updated_at: new Date().toISOString() }
  });

  const hydrated = await hydrateMaterialRows(rows, session);
  return hydrated?.[0] || null;
}

export async function deleteOwnMaterial(id, session = getStoredSession()) {
  if (!session?.access_token) throw materialError("Нужно войти в кабинет.");
  if (!id) throw materialError("Не указан идентификатор материала.");

  await request(`/rest/v1/${PUBLICATIONS_TABLE}?id=eq.${encodeURIComponent(id)}`, {
    method: "DELETE",
    session
  });
}
