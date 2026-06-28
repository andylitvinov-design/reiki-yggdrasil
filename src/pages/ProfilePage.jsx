import React, { useEffect, useMemo, useRef, useState } from "react";
import { reikiLevels } from "../data/reikiKnowledgeBase.js";
import { mysteryTraditions } from "../data/mysteryTraditions.js";
import { sourcedStepSettings } from "../data/reikiStepSettings.js";
import { leftMenuSections } from "../data/topSectionMenus.js";
import {
  MATERIAL_TYPES,
  createEmptyMaterialForm,
  createOwnMaterial,
  listOwnMaterials,
  materialStatusText,
  normalizeMaterialForm,
  publicationTypeLabel
} from "../lib/profileMaterialsClient.js";
import {
  clearStoredSession,
  getCurrentUser,
  getStoredSession,
  isExpiredOrInvalidAuthError,
  isStoredSessionExpired,
  sendMagicLink,
  signInWithGoogle,
  storeSessionFromUrlHash,
  submitOwnProfile,
  supabaseEnv,
  saveOwnProfile
} from "../lib/supabaseClient.js";
import {
  ACCOUNT_PLANS,
  createClientGoalPhoto,
  deletePowerPlaceComposition,
  deleteClientGoalPhoto,
  createPowerPlaceComposition,
  createTraditionAsset,
  getPlanLimits,
  listClientGoalPhotos,
  listPowerPlaceCompositions,
  listTraditionAssets,
  normalizeAccountPlan,
  normalizeCoverRef,
  updatePowerPlaceComposition
} from "../lib/powerPlaceClient.js";
import { uploadProfileMedia, validateProfileMediaFile } from "../lib/profileMediaClient.js";
import {
  loadPowerPlaceOptionalData,
  loadProfileCabinetBootstrap,
  normalizeProfileRecord,
  runBackgroundUserVerification
} from "../lib/profileBootstrapClient.js";
import { formatCabinetId } from "../lib/masterChatClient.js";
import "../profileMandalaWorkspace.css";

const EMPTY_PROFILE = {
  display_name: "",
  bio: "",
  city: "",
  country: "",
  telegram: "",
  website: "",
  avatar_url: "",
  account_plan: "start",
  status: "draft"
};

const PROFILE_SESSION_STORAGE_KEY = "reiki-yggdrasil-session";
const stepOptions = reikiLevels.flatMap((level) =>
  level.steps.map((step) => ({
    ...step,
    levelId: level.id,
    levelName: level.name,
    stepLabel: level.stepLabel,
    fullLabel: `${level.id}. ${level.name} · ${level.stepLabel} ${step.number}: ${step.title}`
  }))
);

const firstStep = stepOptions[0];
const firstSettings = sourcedStepSettings[firstStep?.id] || firstStep?.settings || [];

const EMPTY_MATERIAL = createEmptyMaterialForm({
  step_id: firstStep?.id || "",
  step_title: firstStep?.title || "",
  setting_title: firstSettings[0]?.title || "",
  setting_index: firstSettings.length > 0 ? 1 : null
});

const POWER_SOURCE_COUNTS = [2, 4, 6, 8, 12];
const CONSTRUCTOR_TYPES = [
  { value: "zodiac", label: "Зодиак" },
  { value: "star", label: "Звезда" },
  { value: "chess", label: "Шахматы" },
  { value: "client", label: "Мандала" },
  { value: "altar", label: "Алтарь" },
  { value: "business", label: "Бизнес" },
  { value: "dao", label: "ДАО" }
];
const STAR_VARIANTS = [
  { value: "closed", label: "Закрытая" },
  { value: "open", label: "Открытая" }
];
const STAR_POINTS = [
  { id: "top", className: "top", label: "Верхний луч" },
  { id: "right", className: "right", label: "Правый луч" },
  { id: "lower-right", className: "lowerRight", label: "Нижний правый луч" },
  { id: "lower-left", className: "lowerLeft", label: "Нижний левый луч" },
  { id: "left", className: "left", label: "Левый луч" }
];
const CHESS_VARIANTS = [
  { value: "classic-14", label: "14 фоток", slotCount: 14, layout: "grid-5x3" },
  { value: "classic-8", label: "8 фоток", slotCount: 8, layout: "grid-3x3" },
  { value: "plus-8", label: "8 фото+", slotCount: 8, layout: "cross-plus-corners" }
];
const CHESS_TOP_SLOTS = Array.from({ length: 5 }, (_, index) => ({
  id: `chess-top-${index + 1}`,
  className: `chess-top-${index + 1}`,
  label: `Верхняя мандала ${index + 1}`,
  classPrefix: "chess-top"
}));
const CHESS_SLOT_LAYOUTS = {
  "classic-14": [
    { id: "chess-1", row: 1, col: 1, label: "Шахматная ячейка 1" },
    { id: "chess-2", row: 1, col: 2, label: "Шахматная ячейка 2" },
    { id: "chess-3", row: 1, col: 3, label: "Шахматная ячейка 3" },
    { id: "chess-4", row: 2, col: 1, label: "Шахматная ячейка 4" },
    { id: "chess-5", row: 2, col: 2, label: "Шахматная ячейка 5" },
    { id: "chess-6", row: 2, col: 3, label: "Шахматная ячейка 6" },
    { id: "chess-7", row: 3, col: 1, label: "Шахматная ячейка 7" },
    { id: "chess-8", row: 3, col: 3, label: "Шахматная ячейка 8" },
    { id: "chess-9", row: 4, col: 1, label: "Шахматная ячейка 9" },
    { id: "chess-10", row: 4, col: 2, label: "Шахматная ячейка 10" },
    { id: "chess-11", row: 4, col: 3, label: "Шахматная ячейка 11" },
    { id: "chess-12", row: 5, col: 1, label: "Шахматная ячейка 12" },
    { id: "chess-13", row: 5, col: 2, label: "Шахматная ячейка 13" },
    { id: "chess-14", row: 5, col: 3, label: "Шахматная ячейка 14" }
  ],
  "classic-8": [
    { id: "chess-1", row: 1, col: 1, label: "Шахматная ячейка 1" },
    { id: "chess-2", row: 1, col: 2, label: "Шахматная ячейка 2" },
    { id: "chess-3", row: 1, col: 3, label: "Шахматная ячейка 3" },
    { id: "chess-4", row: 2, col: 1, label: "Шахматная ячейка 4" },
    { id: "chess-5", row: 2, col: 3, label: "Шахматная ячейка 5" },
    { id: "chess-6", row: 3, col: 1, label: "Шахматная ячейка 6" },
    { id: "chess-7", row: 3, col: 2, label: "Шахматная ячейка 7" },
    { id: "chess-8", row: 3, col: 3, label: "Шахматная ячейка 8" }
  ],
  "plus-8": [
    { id: "chess-1", className: "cross-top", label: "Верхняя большая мандала" },
    { id: "chess-2", className: "cross-right", label: "Правая большая мандала" },
    { id: "chess-3", className: "cross-bottom", label: "Нижняя большая мандала" },
    { id: "chess-4", className: "cross-left", label: "Левая большая мандала" },
    { id: "chess-5", className: "corner-top-left", label: "Верхний левый угол" },
    { id: "chess-6", className: "corner-top-right", label: "Верхний правый угол" },
    { id: "chess-7", className: "corner-bottom-left", label: "Нижний левый угол" },
    { id: "chess-8", className: "corner-bottom-right", label: "Нижний правый угол" }
  ]
};
const ZODIAC_SIGNS = [
  { id: "aries", className: "aries", label: "Овен" },
  { id: "taurus", className: "taurus", label: "Телец" },
  { id: "gemini", className: "gemini", label: "Близнецы" },
  { id: "cancer", className: "cancer", label: "Рак" },
  { id: "leo", className: "leo", label: "Лев" },
  { id: "virgo", className: "virgo", label: "Дева" },
  { id: "libra", className: "libra", label: "Весы" },
  { id: "scorpio", className: "scorpio", label: "Скорпион" },
  { id: "sagittarius", className: "sagittarius", label: "Стрелец" },
  { id: "capricorn", className: "capricorn", label: "Козерог" },
  { id: "aquarius", className: "aquarius", label: "Водолей" },
  { id: "pisces", className: "pisces", label: "Рыбы" }
];
const ZODIAC_VISIBLE_COUNTS = [2, 4, 6, 8, 12];
const ZODIAC_VARIANTS = [
  { value: "classic-2", label: "2", visibleCount: 2 },
  { value: "classic-4", label: "4", visibleCount: 4 },
  { value: "classic-6", label: "6", visibleCount: 6 },
  { value: "classic-8", label: "8", visibleCount: 8 },
  { value: "plus-8", label: "8+", visibleCount: 8 },
  { value: "classic-12", label: "12", visibleCount: 12 },
  { value: "plus-12", label: "12+", visibleCount: 12 }
];
const ZODIAC_PLUS_SLOT_IDS = {
  "8": ["zodiac-plus-top", "zodiac-plus-right", "zodiac-plus-bottom", "zodiac-plus-left"],
  "12": [
    "zodiac-plus-top",
    "zodiac-plus-right",
    "zodiac-plus-bottom",
    "zodiac-plus-left",
    "zodiac-plus-corner-tl",
    "zodiac-plus-corner-tr",
    "zodiac-plus-corner-bl",
    "zodiac-plus-corner-br"
  ]
};
const ZODIAC_PLUS_SLOT_LAYOUT = {
  8: [
    { id: "zodiac-plus-top", className: "zodiac-plus-top", label: "Топ", classPrefix: "zodiac-plus" },
    { id: "zodiac-plus-right", className: "zodiac-plus-right", label: "Правая точка", classPrefix: "zodiac-plus" },
    { id: "zodiac-plus-bottom", className: "zodiac-plus-bottom", label: "Низ", classPrefix: "zodiac-plus" },
    { id: "zodiac-plus-left", className: "zodiac-plus-left", label: "Лево", classPrefix: "zodiac-plus" }
  ],
  12: [
    { id: "zodiac-plus-top", className: "zodiac-plus-top", label: "Топ", classPrefix: "zodiac-plus" },
    { id: "zodiac-plus-right", className: "zodiac-plus-right", label: "Правая точка", classPrefix: "zodiac-plus" },
    { id: "zodiac-plus-bottom", className: "zodiac-plus-bottom", label: "Низ", classPrefix: "zodiac-plus" },
    { id: "zodiac-plus-left", className: "zodiac-plus-left", label: "Лево", classPrefix: "zodiac-plus" },
    { id: "zodiac-plus-corner-tl", className: "zodiac-plus-corner-tl", label: "Угол верх-лев", classPrefix: "zodiac-plus" },
    { id: "zodiac-plus-corner-tr", className: "zodiac-plus-corner-tr", label: "Угол верх-прав", classPrefix: "zodiac-plus" },
    { id: "zodiac-plus-corner-bl", className: "zodiac-plus-corner-bl", label: "Угол низ-лев", classPrefix: "zodiac-plus" },
    { id: "zodiac-plus-corner-br", className: "zodiac-plus-corner-br", label: "Угол низ-прав", classPrefix: "zodiac-plus" }
  ]
};
const BUSINESS_VERTEX_ZONE_COUNTS = [1, 3];
const BUSINESS_VERTICES = [
  { id: "goal", className: "top", label: "Цель" },
  { id: "function", className: "left", label: "Функция / продукт" },
  { id: "structure", className: "right", label: "Структура / связи / клиенты" }
];
const DAO_ELEMENTS = [
  { id: "water", className: "water", label: "Вода" },
  { id: "wood", className: "wood", label: "Дерево" },
  { id: "fire", className: "fire", label: "Огонь" },
  { id: "earth", className: "earth", label: "Земля" },
  { id: "metal", className: "metal", label: "Металл" }
];
const RESOURCE_COMPARISON_MODES = [
  { value: "client_photo", label: "Фото цели" },
  { value: "photo_mandala", label: "Цель + мандала" }
];
const ALTAR_CENTER_RATIOS = [
  { value: "1", label: "1:1" },
  { value: "1-5", label: "1.5:1" },
  { value: "2", label: "2:1" },
  { value: "3", label: "3:1" }
];

const MANDALA_FIELD_LAYOUTS = [
  { value: "vertical", label: "Вертикальное" },
  { value: "horizontal", label: "Горизонтальное" },
  { value: "square", label: "Квадрат" }
];

const FALLBACK_COVER_VARIANTS = [
  { id: "cover-zodiac-map", label: "Карта мандалы", tone: "zodiac-map" },
  { id: "cover-gold", label: "Золотой поток", tone: "gold" },
  { id: "cover-forest", label: "Древо силы", tone: "forest" },
  { id: "cover-night", label: "Ночная мандала", tone: "night" }
];

const MATERIAL_FILTERS = [
  { value: "all", label: "Все" },
  { value: "mandala", label: "Мандалы" },
  { value: "artifact", label: "Артефакты" },
  { value: "practice", label: "Практики" },
  { value: "draft", label: "Черновики" },
  { value: "pending", label: "На модерации" },
  { value: "approved", label: "Опубликовано" }
];

const artifactItems = [
  ...(leftMenuSections["artifact-creation"]?.items || []),
  ...(leftMenuSections["artifact-creation"]?.groups || []).flatMap((group) => group.items || [])
].filter((item) => item.id !== "artifact-workshop-overview");

const talismanItems = artifactItems.filter((item) => item.label?.includes("Талисман"));

const CHANNELS_SUBCATEGORIES = [
  {
    value: "sefirot",
    label: "Сефирот",
    thirdLevels: [
      { value: "major-arcana", label: "Большие арканы" },
      { value: "minor-arcana", label: "Малые арканы" },
      { value: "sephirot-siphers", label: "Сиферы" }
    ]
  },
  {
    value: "runes",
    label: "Руны",
    thirdLevels: [
      { value: "first-at", label: "Первый атт" },
      { value: "second-at", label: "Второй атт" },
      { value: "third-at", label: "Третий атт" }
    ]
  },
  {
    value: "planets",
    label: "Планеты",
    thirdLevels: [
      { value: "sun", label: "Солнце" },
      { value: "moon", label: "Луна" },
      { value: "mercury", label: "Меркурий" },
      { value: "venus", label: "Венера" },
      { value: "mars", label: "Марс" },
      { value: "jupiter", label: "Юпитер" },
      { value: "saturn", label: "Сатурн" }
    ]
  },
  {
    value: "money",
    label: "Деньги"
  },
  {
    value: "life",
    label: "Жизнь"
  }
];

const SOURCE_LIBRARY_CATEGORIES = [
  {
    value: "dao-ri",
    label: "ДАО РИ",
    subcategories: reikiLevels.map((level) => ({
      value: `level-${level.id}`,
      label: `${level.id}. ${level.name}`,
      steps: level.steps,
      thirdLevels: level.steps.map((step) => ({
        value: step.id,
        label: `${level.stepLabel} ${step.number}: ${step.title}`,
        stepId: step.id,
        stepTitle: step.title
      }))
    }))
  },
  {
    value: "god-channels",
    label: "Мистерии",
    subcategories: mysteryTraditions.map((tradition) => ({
      value: tradition.id,
      label: tradition.title,
      traditionId: tradition.id,
      entities: tradition.entities || []
    }))
  },
  {
    value: "channels",
    label: "Каналы",
    subcategories: CHANNELS_SUBCATEGORIES
  },
  {
    value: "covers",
    label: "Фон",
    subcategories: [{ value: "cover", label: "Фон" }]
  },
  {
    value: "form",
    label: "Форма",
    subcategories: [
      { value: "zashchitnye", label: "Защитные" },
      { value: "tselyebnye", label: "Целебные" },
      { value: "business", label: "Бизнес" },
      { value: "other", label: "Другие" }
    ]
  },
  {
    value: "talismans",
    label: "Талисманы",
    subcategories: talismanItems.map((item) => ({ value: item.id, label: item.label }))
  },
  {
    value: "artifacts",
    label: "Артефакты",
    subcategories: artifactItems.map((item) => ({ value: item.id, label: item.label }))
  },
  {
    value: "covers-legacy",
    label: "Фон Места Силы",
    subcategories: []
  },
  {
    value: "client-goals",
    label: "Клиенты",
    subcategories: []
  }
];

function textPart(item, key, fallback = "") {
  const raw = item?.[key];
  if (Array.isArray(raw)) return raw.map((value) => String(value || "")).filter(Boolean).join(" ");
  return String(raw || fallback);
}

const PRACTICE_AUDIO_TYPES = ["audio/mpeg", "audio/mp4", "audio/wav", "audio/webm", "audio/ogg"];
const PRACTICE_AUDIO_ACCEPT = PRACTICE_AUDIO_TYPES.join(",");
const MATERIAL_FILE_ACCEPT = "image/png,image/jpeg,image/webp,image/gif";
const PRACTICE_FILE_ACCEPT = `${MATERIAL_FILE_ACCEPT},${PRACTICE_AUDIO_TYPES.join(",")}`;

const FORM_SUBCATEGORY_MAP = {
  zashchitnye: ["protective", "защитные", "zaщитные", "zashchitnye", "защитный"],
  tselyebnye: ["healing", "целебные", "tselyebnye", "целебное", "целебное", "целебный"],
  business: ["бизнес", "business", "businesses"],
  other: ["другие", "other", "any", "прочее"]
};

function getMaterialUploadAccept(fileType) {
  return fileType === "practice" ? PRACTICE_AUDIO_ACCEPT : MATERIAL_FILE_ACCEPT;
}

function isZodiacPlusVariant(variant, visibleCount = 0) {
  return variant === "plus-8" || variant === "plus-12" || (Number(visibleCount) === 8 && variant?.startsWith("plus")) || (Number(visibleCount) === 12 && variant?.startsWith("plus"));
}
function materialTextIndex(item) {
  return [
    textPart(item, "title"),
    textPart(item, "description"),
    textPart(item, "step_title"),
    textPart(item, "setting_title"),
    textPart(item, "type"),
    textPart(item, "category"),
    textPart(item, "subcategory"),
    textPart(item, "channels"),
    textPart(item, "channelCategory"),
    textPart(item, "channelCategoryLabel"),
    textPart(item, "channelSubcategory"),
    textPart(item, "channelSubcategoryLabel"),
    textPart(item, "channelThirdLevel"),
    textPart(item, "channelThirdLevelLabel"),
    textPart(item, "material_category"),
    textPart(item, "material_subcategory")
  ].join(" ").toLowerCase();
}

function textMatches(item, text) {
  const needle = String(text || "").trim().toLowerCase();
  if (!needle) return false;
  return materialTextIndex(item).includes(needle);
}

function metadataMatches(item, values) {
  return values.some((value) => {
    const itemValues = [
      item?.channelCategory,
      item?.channelCategoryLabel,
      item?.channelSubcategory,
      item?.channelSubcategoryLabel,
      item?.channelThirdLevel,
      item?.channelThirdLevelLabel,
      item?.material_category,
      item?.material_subcategory,
      item?.category,
      item?.subcategory,
      item?.channels
    ];

    return itemValues.some((fieldValue) => String(fieldValue || "").toLowerCase() === String(value || "").trim().toLowerCase());
  });
}

function normalizeCategoryValue(value) {
  return String(value || "").trim().toLowerCase();
}

function materialMatchesCategory(item, categoryValue, subcategoryValue = "") {
  const targetCategory = normalizeCategoryValue(categoryValue);
  const targetSubcategory = normalizeCategoryValue(subcategoryValue);
  const normalizedCategory = normalizeCategoryValue(item.material_category);
  const normalizedSubcategory = normalizeCategoryValue(item.material_subcategory);
  const normalizedCategoryLegacy = normalizeCategoryValue(item.category);
  const normalizedSubcategoryLegacy = normalizeCategoryValue(item.subcategory);

  const hasAnyMatch = (lhs, rhs) => lhs === rhs;

  if (targetCategory === "covers") {
    return hasAnyMatch(normalizedCategory, "cover") || hasAnyMatch(normalizedCategory, "фон") || hasAnyMatch(normalizedSubcategory, "cover") || hasAnyMatch(normalizedSubcategory, "фон");
  }

  if (targetCategory === "form") {
    if (!targetSubcategory) return normalizedCategory === "form" || normalizedSubcategory === "form" || normalizedCategory === "форма" || normalizedSubcategory === "форма";

    const expectedValues = new Set(
      FORM_SUBCATEGORY_MAP[targetSubcategory] || [targetSubcategory]
    );
    return (
      (hasAnyMatch(normalizedCategory, "form") || hasAnyMatch(normalizedSubcategory, "form") || hasAnyMatch(normalizedCategory, "форма") || hasAnyMatch(normalizedSubcategory, "форма"))
      && ([normalizedCategory, normalizedSubcategory, normalizedCategoryLegacy, normalizedSubcategoryLegacy].some((entry) => expectedValues.has(entry)))
    );
  }

  return false;
}

function channelTextMatch(item, values) {
  if (!values.length) return true;
  return values.some((entry) => metadataMatches(item, [entry]) || textMatches(item, entry));
}

const MATERIAL_CATEGORY_TABS = [
  {
    value: "dao-ri",
    label: "ДАО РИ",
    subcategories: reikiLevels.map((level) => ({
      value: `level-${level.id}`,
      label: `${level.id}. ${level.name}`,
      steps: level.steps
    }))
  },
  {
    value: "god-channels",
    label: "Мистерии",
    subcategories: mysteryTraditions.flatMap((tradition) =>
      (tradition.entities || []).map((entity) => ({
        value: `${tradition.id}-${entity.id}`,
        label: entity.title,
        traditionId: tradition.id
      }))
    )
  },
  {
    value: "channels",
    label: "Каналы",
    subcategories: CHANNELS_SUBCATEGORIES
  },
  {
    value: "covers",
    label: "Фон",
    subcategories: [{ value: "cover", label: "Фон" }]
  },
  {
    value: "form",
    label: "Форма",
    subcategories: [
      { value: "zashchitnye", label: "Защитные", displayLabel: "Защитные" },
      { value: "tselyebnye", label: "Целебные", displayLabel: "Целебные" },
      { value: "business", label: "Бизнес", displayLabel: "Бизнес" },
      { value: "other", label: "Другие", displayLabel: "Другие" }
    ]
  },
  {
    value: "talismans",
    label: "Талисманы",
    // needs verification: no dedicated talisman taxonomy found; using existing artifact-creation labels containing "Талисман".
    subcategories: talismanItems.map((item) => ({ value: item.id, label: item.label }))
  },
  {
    value: "artifacts",
    label: "Артефакты",
    subcategories: artifactItems.map((item) => ({ value: item.id, label: item.label }))
  },
  {
    value: "client-goals",
    label: "Клиенты",
    subcategories: [{ value: "client-goals", label: "Фото клиентов" }]
  }
];

function settingsForStep(stepId) {
  const step = stepOptions.find((item) => item.id === stepId);
  return sourcedStepSettings[stepId] || step?.settings || [];
}

function buildMaterialPayload(form, profileId, nextStatus) {
  const step = stepOptions.find((item) => item.id === form.step_id) || firstStep;
  const settings = settingsForStep(step?.id);
  const settingIndex = settings.findIndex((item) => item.title === form.setting_title);

  return {
    profile_id: profileId,
    ...normalizeMaterialForm(
      {
        ...form,
        step_id: step?.id || "",
        step_title: step?.title || "",
        setting_title: form.setting_title || "",
        setting_index: settingIndex >= 0 ? settingIndex + 1 : null
      },
      nextStatus
    ),
    updated_at: new Date().toISOString()
  };
}

function statusCount(materials, status) {
  return materials.filter((item) => item.status === status).length;
}

function isImagePreview(value) {
  return Boolean(value && (value.startsWith("http://") || value.startsWith("https://") || value.startsWith("data:image/")));
}

function looksLikeAudio(value) {
  const source = String(value || "").trim().toLowerCase();
  if (!source) return false;
  if (source.startsWith("data:audio/")) return true;
  return /\.(mp3|m4a|mp4|wav|ogg|oga|webm)(\?|#|$)/.test(source);
}

function isStorageImageRef(value) {
  return Boolean(value && value.startsWith("storage://"));
}

function uniqueImageSources(items) {
  const seen = new Set();

  return items.filter((item) => {
    const identity = item?.src || item?.displaySrc;
    const displaySrc = item?.displaySrc || (isImagePreview(item?.src) ? item?.src : "");
    if (!identity || !isImagePreview(displaySrc) || seen.has(identity)) return false;
    seen.add(identity);
    return true;
  });
}

function sourceClassName(count, index) {
  const sourceNumber = index + 1;
  const isIntermediate = (count === 8 || count === 12) && index % 2 === 1 && index < 8;
  const isGuardian = count === 12 && index >= 8;

  return [
    "powerSource",
    `source-${sourceNumber}`,
    isIntermediate ? "small" : "",
    isGuardian ? "guardian" : "",
    count === 18 ? "compact" : ""
  ].filter(Boolean).join(" ");
}

function sourceLabel(count, index) {
  if (count === 12 && index >= 8) return `Хранитель ${index - 7}`;
  if ((count === 8 || count === 12) && index % 2 === 1 && index < 8) return `Источник ${index + 1}`;
  return `Крест ${index + 1}`;
}

function imageStyle(src) {
  return isImagePreview(src) ? { backgroundImage: `url(${src})` } : undefined;
}

function sourcePositionStyle(count, index) {
  if (count !== 18) return null;

  const radius = 35;
  const angle = (360 / count) * index - 90;
  const radians = angle * (Math.PI / 180);
  return {
    left: `${50 + radius * Math.cos(radians)}%`,
    top: `${50 + radius * Math.sin(radians)}%`
  };
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function safeFilename(value) {
  const safe = String(value || "power-place")
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
  return safe || "power-place";
}

function persistableImageRef(src) {
  if (!src || src.startsWith("data:image/")) return "";
  return src;
}

function constructorTypeLabel(value) {
  return CONSTRUCTOR_TYPES.find((item) => item.value === value)?.label || CONSTRUCTOR_TYPES[0].label;
}

function menuSectionEntries(section) {
  return [
    ...(section?.items || []),
    ...(section?.groups || []).flatMap((group) => group.items || [])
  ];
}

function persistableObjectRefs(refs, allowedIds = null) {
  const allowed = allowedIds ? new Set(allowedIds) : null;

  return Object.fromEntries(
    Object.entries(refs || {})
      .filter(([key]) => !allowed || allowed.has(key))
      .map(([key, value]) => [key, persistableImageRef(String(value || ""))])
      .filter(([, value]) => Boolean(value))
  );
}

function inferZodiacVariant(visibleCount, refs = {}) {
  const keys = new Set(Object.keys(refs || {}).map((key) => String(key || "").trim()));
  if (visibleCount === 8) {
    const isPlus = ZODIAC_PLUS_SLOT_IDS["8"].some((slotId) => keys.has(slotId));
    return isPlus ? "plus-8" : "classic-8";
  }

  if (visibleCount === 12) {
    const isPlus = ZODIAC_PLUS_SLOT_IDS["12"].some((slotId) => keys.has(slotId));
    return isPlus ? "plus-12" : "classic-12";
  }

  const fallback = ZODIAC_VARIANTS.find((item) => item.visibleCount === visibleCount && item.value.startsWith("classic"));
  return fallback?.value || `classic-${visibleCount}`;
}

function zodiacPlusSlotLayout(visibleCount) {
  return ZODIAC_PLUS_SLOT_LAYOUT[Number(visibleCount)] || [];
}

function zodiacVariantOption(optionValue, visibleCount) {
  const fallbackValue = `classic-${visibleCount}`;
  const option = ZODIAC_VARIANTS.find((item) => item.value === optionValue && item.visibleCount === visibleCount);
  return option ? option.value : fallbackValue;
}

function chessVariantOption(optionValue) {
  return CHESS_VARIANTS.some((item) => item.value === optionValue) ? optionValue : "classic-14";
}

function clearProfileSessionStorage() {
  clearStoredSession();

  try {
    localStorage.removeItem(PROFILE_SESSION_STORAGE_KEY);
  } catch {
    // Ignore storage access failures and still reset in-memory state.
  }
}

function isUsableStoredSession(session) {
  return Boolean(
    session
    && typeof session === "object"
    && typeof session.access_token === "string"
    && session.access_token.trim()
    && !isStoredSessionExpired(session)
  );
}

const EMPTY_BOOTSTRAP_DEBUG = {
  bootstrapStep: "idle",
  bootstrapErrorMessage: "",
  bootstrapCurrentUserIdPresent: false,
  bootstrapCancelledBeforeApply: false,
  bootstrapFallbackUserUsed: false,
  renderGateOpen: false,
  reactBootstrapCheckpoint: "idle"
};

function sanitizeDebugMessage(value) {
  return String(value || "")
    .replace(/https?:\/\/\S+/gi, "[url hidden]")
    .replace(/eyJ[a-zA-Z0-9._-]+/g, "[redacted]")
    .replace(/[a-zA-Z0-9_-]{3,}\.[a-zA-Z0-9_-]{3,}\.[a-zA-Z0-9_-]{3,}/g, "[token hidden]")
    .replace(/[a-zA-Z0-9_-]{24,}\.[a-zA-Z0-9_.-]{24,}/g, "[redacted]")
    .replace(/[a-zA-Z0-9_-]{32,}/g, "[secret hidden]")
    .slice(0, 180);
}

function getInitialStoredSession() {
  let hadStoredSession = false;

  try {
    hadStoredSession = localStorage.getItem(PROFILE_SESSION_STORAGE_KEY) !== null;
  } catch {
    hadStoredSession = false;
  }

  const storedSession = getStoredSession();
  if (hadStoredSession && !isUsableStoredSession(storedSession)) {
    clearProfileSessionStorage();
    return null;
  }
  return storedSession;
}

function getProfileRouteDebug() {
  if (typeof window === "undefined") {
    return {
      routeName: "unknown",
      profileOld: false
    };
  }

  const profileOld = window.location.pathname === "/profile-old";
  return {
    routeName: profileOld ? "profile-old" : "profile",
    profileOld
  };
}

function isProfileReactDebugEnabled() {
  if (typeof window === "undefined") return false;
  return new URLSearchParams(window.location.search).get("debugAuth") === "1";
}

function publishProfileReactDebug(patch) {
  if (!isProfileReactDebugEnabled()) return;
  window.__REIKI_PROFILE_REACT_DEBUG__ = {
    ...(window.__REIKI_PROFILE_REACT_DEBUG__ || {}),
    ...getProfileRouteDebug(),
    ...patch
  };
  window.dispatchEvent(new CustomEvent("reiki-profile-react-debug-update", {
    detail: window.__REIKI_PROFILE_REACT_DEBUG__
  }));
}

export default function ProfilePage({ onNavigateHome, onNavigateMasters, initialTopTab = "power-place" }) {
  const [email, setEmail] = useState("");
  const [session, setSession] = useState(() => getInitialStoredSession());
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(EMPTY_PROFILE);
  const [materials, setMaterials] = useState([]);
  const [clientGoalPhotos, setClientGoalPhotos] = useState([]);
  const [traditionAssets, setTraditionAssets] = useState([]);
  const [powerPlaceCompositions, setPowerPlaceCompositions] = useState([]);
  const [materialForm, setMaterialForm] = useState(EMPTY_MATERIAL);
  const [materialFile, setMaterialFile] = useState(null);
  const [materialFilePreview, setMaterialFilePreview] = useState("");
  const [clientPhotoForm, setClientPhotoForm] = useState({ title: "", image_url: "", notes: "", file: null });
  const [traditionAssetForm, setTraditionAssetForm] = useState({ title: "", image_url: "", notes: "", file: null });
  const [materialsLoading, setMaterialsLoading] = useState(false);
  const [authStatus, setAuthStatus] = useState(supabaseEnv.isConfigured ? "loading" : "idle");
  const loading = authStatus === "loading";
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [fileNotice, setFileNotice] = useState("");
  const [powerSourceCount, setPowerSourceCount] = useState(4);
  const [constructorType, setConstructorType] = useState("zodiac");
  const [zodiacVisibleCount, setZodiacVisibleCount] = useState(12);
  const [zodiacVariant, setZodiacVariant] = useState("classic-12");
  const [starVariant, setStarVariant] = useState("closed");
  const [chessVariant, setChessVariant] = useState("classic-14");
  const [businessVertexZoneCount, setBusinessVertexZoneCount] = useState(1);
  const [altarCenterRatio, setAltarCenterRatio] = useState("1");
  const [objectImages, setObjectImages] = useState({});
  const [objectImageUrls, setObjectImageUrls] = useState({});
  const [selectedCoverId, setSelectedCoverId] = useState(FALLBACK_COVER_VARIANTS[0].id);
  const [selectedOuterCoverId, setSelectedOuterCoverId] = useState("no-cover");
  const [activeCoverLayer, setActiveCoverLayer] = useState("inner");
  const [mandalaFieldLayout, setMandalaFieldLayout] = useState("square");
  const [customCoverImage, setCustomCoverImage] = useState("");
  const [customOuterCoverImage, setCustomOuterCoverImage] = useState("");
  const [coverNotice, setCoverNotice] = useState("");
  const [selectedCentralPhotoId, setSelectedCentralPhotoId] = useState("");
  const [selectedCentralImageRef, setSelectedCentralImageRef] = useState("");
  const [imagePickerContext, setImagePickerContext] = useState({ mode: "", slotId: "" });
  const [selectedTraditionId, setSelectedTraditionId] = useState(mysteryTraditions[0]?.id || "");
  const [compositionTitle, setCompositionTitle] = useState("");
  const [selectedCompositionId, setSelectedCompositionId] = useState("");
  const [resourceComparisonMode, setResourceComparisonMode] = useState("photo_mandala");
  const [resourceWithoutMandalaComment, setResourceWithoutMandalaComment] = useState("");
  const [resourceWithMandalaComment, setResourceWithMandalaComment] = useState("");
  const [activeTopTab, setActiveTopTab] = useState(initialTopTab);
  const [templateServicesTab, setTemplateServicesTab] = useState("services");
  const [powerPlaceServiceDraft, setPowerPlaceServiceDraft] = useState(null);
  const [activeMaterialCategory, setActiveMaterialCategory] = useState(MATERIAL_CATEGORY_TABS[0].value);
  const [activeMaterialSubcategory, setActiveMaterialSubcategory] = useState(MATERIAL_CATEGORY_TABS[0].subcategories[0]?.value || "");
  const [activeMaterialThirdLevel, setActiveMaterialThirdLevel] = useState("");
  const [isMaterialThirdLevelPanelOpen, setIsMaterialThirdLevelPanelOpen] = useState(false);
  const [activePickerCategory, setActivePickerCategory] = useState(SOURCE_LIBRARY_CATEGORIES[0].value);
  const [activePickerSubcategory, setActivePickerSubcategory] = useState(SOURCE_LIBRARY_CATEGORIES[0].subcategories[0]?.value || "");
  const [activePickerThirdLevel, setActivePickerThirdLevel] = useState("");
  const [selectedObjectSlotId, setSelectedObjectSlotId] = useState("");
  const [materialFilter, setMaterialFilter] = useState("all");
  const [mediaStatus, setMediaStatus] = useState("");
  const [mediaUploadTarget, setMediaUploadTarget] = useState("");
  const [isClientPhotoUploadOpen, setIsClientPhotoUploadOpen] = useState(false);
  const [loadingTimedOut, setLoadingTimedOut] = useState(false);
  const [secondaryDataNotice, setSecondaryDataNotice] = useState("");
  const [bootstrapRetryKey, setBootstrapRetryKey] = useState(0);
  const [bootstrapDebug, setBootstrapDebug] = useState(EMPTY_BOOTSTRAP_DEBUG);
  const backgroundVerificationTokenRef = useRef("");
  const hasAuthenticatedUser = Boolean(user?.id);
  const shouldShowCabinet = hasAuthenticatedUser;
  const shouldShowInitialLoading = !hasAuthenticatedUser && authStatus === "loading" && !loadingTimedOut;
  const shouldShowRecovery = !hasAuthenticatedUser && loadingTimedOut;
  const shouldShowLogin = !hasAuthenticatedUser && authStatus !== "loading" && !loadingTimedOut;

  const resetProfileSessionState = (notice = "") => {
    clearProfileSessionStorage();
    setSession(null);
    setUser(null);
    setProfile(EMPTY_PROFILE);
    setMaterials([]);
    setClientGoalPhotos([]);
    setTraditionAssets([]);
    setPowerPlaceCompositions([]);
    setMaterialForm(EMPTY_MATERIAL);
    setMaterialFile(null);
    setMaterialFilePreview("");
    setClientPhotoForm({ title: "", image_url: "", notes: "", file: null });
    setTraditionAssetForm({ title: "", image_url: "", notes: "", file: null });
    setObjectImages({});
    setObjectImageUrls({});
    setSelectedCentralPhotoId("");
    setSelectedCentralImageRef("");
    setSelectedCompositionId("");
    setCompositionTitle("");
    setImagePickerContext({ mode: "", slotId: "" });
    setSelectedObjectSlotId("");
    setActiveMaterialCategory(MATERIAL_CATEGORY_TABS[0].value);
    setActiveMaterialSubcategory(MATERIAL_CATEGORY_TABS[0].subcategories[0]?.value || "");
    setActiveMaterialThirdLevel(MATERIAL_CATEGORY_TABS[0].subcategories[0]?.thirdLevels?.[0]?.value || "");
    setIsMaterialThirdLevelPanelOpen(Boolean(MATERIAL_CATEGORY_TABS[0].subcategories[0]?.thirdLevels?.length));
    setActivePickerCategory(SOURCE_LIBRARY_CATEGORIES[0].value);
    setActivePickerSubcategory(SOURCE_LIBRARY_CATEGORIES[0].subcategories[0]?.value || "");
    setActivePickerThirdLevel(SOURCE_LIBRARY_CATEGORIES[0].subcategories[0]?.thirdLevels?.[0]?.value || "");
    setMaterialFilter("all");
    setCustomCoverImage("");
    setCustomOuterCoverImage("");
    setSelectedCoverId(FALLBACK_COVER_VARIANTS[0].id);
    setSelectedOuterCoverId("no-cover");
    setActiveCoverLayer("inner");
    setCoverNotice("");
    setFileNotice("");
    setMediaStatus("");
    setMediaUploadTarget("");
    setIsClientPhotoUploadOpen(false);
    setLoadingTimedOut(false);
    setSecondaryDataNotice("");
    setBootstrapRetryKey(0);
    setPowerPlaceServiceDraft(null);
    setTemplateServicesTab("services");
    setActiveTopTab("power-place");
    setResourceComparisonMode("photo_mandala");
    setResourceWithoutMandalaComment("");
    setResourceWithMandalaComment("");
    setAuthStatus("idle");
    setError("");
    setMessage(notice);
  };

  const statusText = useMemo(() => {
    if (profile.status === "approved") return "опубликован";
    if (profile.status === "pending") return "на модерации";
    if (profile.status === "rejected") return "нужна правка";
    return "черновик";
  }, [profile.status]);

  const activeStep = useMemo(
    () => stepOptions.find((item) => item.id === materialForm.step_id) || firstStep,
    [materialForm.step_id]
  );

  const activeSettings = useMemo(() => settingsForStep(materialForm.step_id), [materialForm.step_id]);

  const materialCounts = useMemo(() => ({
    draft: statusCount(materials, "draft"),
    pending: statusCount(materials, "pending"),
    approved: statusCount(materials, "approved")
  }), [materials]);

  const activeMaterialCategoryData = useMemo(
    () => MATERIAL_CATEGORY_TABS.find((item) => item.value === activeMaterialCategory) || MATERIAL_CATEGORY_TABS[0],
    [activeMaterialCategory]
  );

  const activeMaterialSubcategoryData = useMemo(
    () => activeMaterialCategoryData.subcategories.find((item) => item.value === activeMaterialSubcategory) || activeMaterialCategoryData.subcategories[0] || null,
    [activeMaterialCategoryData, activeMaterialSubcategory]
  );
  const activeMaterialThirdLevelData = useMemo(
    () => activeMaterialSubcategoryData?.thirdLevels?.find((item) => item.value === activeMaterialThirdLevel) || activeMaterialSubcategoryData?.thirdLevels?.[0] || null,
    [activeMaterialSubcategoryData, activeMaterialThirdLevel]
  );

  const activeMaterialStepLabel = useMemo(
    () => materialForm.step_title || stepOptions.find((step) => step.id === materialForm.step_id)?.fullLabel || materialForm.step_id || "не выбрано",
    [materialForm.step_id, materialForm.step_title]
  );

  const activePickerCategoryData = useMemo(
    () => SOURCE_LIBRARY_CATEGORIES.find((item) => item.value === activePickerCategory) || SOURCE_LIBRARY_CATEGORIES[0],
    [activePickerCategory]
  );

  const activePickerSubcategoryData = useMemo(
    () => activePickerCategoryData.subcategories.find((item) => item.value === activePickerSubcategory) || activePickerCategoryData.subcategories[0] || null,
    [activePickerCategoryData, activePickerSubcategory]
  );
  const activePickerThirdLevelData = useMemo(
    () => activePickerSubcategoryData?.thirdLevels?.find((item) => item.value === activePickerThirdLevel) || activePickerSubcategoryData?.thirdLevels?.[0] || null,
    [activePickerSubcategoryData, activePickerThirdLevel]
  );
  const materialChannelValues = useMemo(() => {
    if (activeMaterialCategory !== "channels") return [];
    const subcategoryValues = [
      activeMaterialSubcategoryData?.value,
      activeMaterialSubcategoryData?.label
    ].filter(Boolean);
    const thirdLevelValues = [
      activeMaterialThirdLevelData?.value,
      activeMaterialThirdLevelData?.label
    ].filter(Boolean);
    const next = [subcategoryValues, thirdLevelValues].filter((entry) => entry.length > 0);
    return next;
  }, [activeMaterialCategory, activeMaterialSubcategoryData, activeMaterialThirdLevelData]);
  const pickerChannelValues = useMemo(() => {
    if (activePickerCategory !== "channels") return [];
    const subcategoryValues = [
      activePickerSubcategoryData?.value,
      activePickerSubcategoryData?.label
    ].filter(Boolean);
    const thirdLevelValues = [
      activePickerThirdLevelData?.value,
      activePickerThirdLevelData?.label
    ].filter(Boolean);
    const next = [subcategoryValues, thirdLevelValues].filter((entry) => entry.length > 0);
    return next;
  }, [activePickerCategory, activePickerSubcategoryData, activePickerThirdLevelData]);

  const filteredMaterials = useMemo(() => {
    let nextMaterials = materials;

    if (materialFilter !== "all") {
      nextMaterials = ["mandala", "artifact", "practice"].includes(materialFilter)
        ? nextMaterials.filter((item) => item.type === materialFilter)
        : nextMaterials.filter((item) => item.status === materialFilter);
    }

    if (activeMaterialCategory === "dao-ri" && activeMaterialSubcategoryData?.steps?.length) {
      const stepIds = new Set(activeMaterialSubcategoryData.steps.map((step) => step.id));
      nextMaterials = nextMaterials.filter((item) => !item.step_id || stepIds.has(item.step_id));
    }

    if (activeMaterialCategory === "artifacts") {
      nextMaterials = nextMaterials.filter((item) => item.type === "artifact");
    }

    if (activeMaterialCategory === "channels") {
      nextMaterials = nextMaterials.filter((item) => {
        if (!materialChannelValues.length) return true;
        return materialChannelValues.every((entry) => channelTextMatch(item, entry));
      });
    }

  if (activeMaterialCategory === "covers") {
    nextMaterials = nextMaterials.filter((item) => materialMatchesCategory(item, "covers"));
  }

  if (activeMaterialCategory === "client-goals") {
    return [];
  }

  if (activeMaterialCategory === "form") {
    nextMaterials = nextMaterials.filter((item) => materialMatchesCategory(item, "form", activeMaterialSubcategoryData?.value || activeMaterialSubcategoryData?.label));
  }

    return nextMaterials;
  }, [activeMaterialCategory, activeMaterialSubcategoryData, activeMaterialThirdLevelData, materialFilter, materialChannelValues, materials]);

  const accountPlan = normalizeAccountPlan(profile.account_plan);
  const planLimits = getPlanLimits(accountPlan);
  const selectedTradition = useMemo(
    () => mysteryTraditions.find((item) => item.id === selectedTraditionId) || mysteryTraditions[0] || null,
    [selectedTraditionId]
  );
  const selectedSavedComposition = useMemo(
    () => powerPlaceCompositions.find((item) => item.id === selectedCompositionId) || null,
    [powerPlaceCompositions, selectedCompositionId]
  );
  const selectedCentralPhoto = useMemo(
    () => clientGoalPhotos.find((item) => item.id === selectedCentralPhotoId) || null,
    [clientGoalPhotos, selectedCentralPhotoId]
  );

  const displayImageUrl = (value) => objectImageUrls[value] || value;

  const previewImageUrl = (...values) => {
    for (const value of values) {
      const displayValue = displayImageUrl(value);
      if (isImagePreview(displayValue)) return displayValue;
    }
    return "";
  };

  const imageStyleFor = (value) => imageStyle(displayImageUrl(value));

  const displayMaterialImageUrl = (value) => {
    const material = materials.find((item) => item.image_url === value);
    return material?.display_url || value;
  };

  const materialPreviewUrl = materialFilePreview || displayMaterialImageUrl(materialForm.image_url);

  const materialImageStyle = (value) => imageStyle(displayMaterialImageUrl(value));

  const buildSourceLibraryItems = (categoryValue, category, subcategory, thirdLevel) => {
    const materialToOption = (item, index) => ({
      id: `picker-material-${item.id || index}`,
      label: item.title || `Материал ${index + 1}`,
      meta: [publicationTypeLabel(item.type), item.step_title, materialStatusText(item.status)].filter(Boolean).join(" · "),
      src: item.image_url,
      displaySrc: item.display_url || displayMaterialImageUrl(item.image_url),
      kind: "material"
    });
    const traditionToOption = (item, index) => ({
      id: `picker-tradition-${item.id || index}`,
      label: item.title || item.tradition_title || "Образ традиции",
      meta: [item.tradition_title, "Мистерии"].filter(Boolean).join(" · "),
      src: item.image_ref || item.image_url,
      displaySrc: item.display_url || item.image_url,
      kind: "tradition-asset"
    });
    const hasImage = (item) => Boolean(item?.src || item?.displaySrc);

    if (categoryValue === "dao-ri") {
      const selectedStepId = thirdLevel?.stepId || thirdLevel?.value || "";
      const stepIds = new Set(selectedStepId ? [selectedStepId] : (subcategory?.steps?.map((step) => step.id) || []));
      return uniqueImageSources(materials
        .filter((item) => item.image_url && (!stepIds.size || !item.step_id || stepIds.has(item.step_id)))
        .map(materialToOption)
        .filter(hasImage));
    }

    if (categoryValue === "god-channels") {
      const traditionId = subcategory?.traditionId || "";
      return uniqueImageSources(traditionAssets
        .filter((item) => item.image_ref || item.image_url)
        .filter((item) => !traditionId || item.tradition_id === traditionId)
        .map(traditionToOption)
        .filter(hasImage));
    }

    if (categoryValue === "client-goals") {
      return uniqueImageSources(clientGoalPhotos
        .filter((photo) => photo.image_ref || photo.image_url)
        .map((photo, index) => ({
          id: `picker-client-${photo.id || index}`,
          label: photo.title || "Фото клиента / цели",
          meta: photo.notes || "Клиенты / цель",
          src: photo.image_ref || photo.image_url,
          displaySrc: previewImageUrl(photo.display_url, photo.signed_url, photo.image_url, photo.image_ref),
          kind: "client-photo",
          photoId: photo.id
        })));
    }

    if (categoryValue === "covers") {
      return [
        { id: "picker-cover-no-cover", label: "Без фона", meta: "фон отключён", src: "", displaySrc: "", kind: "none" },
        ...uniqueImageSources([
          ...coverVariants
            .filter((cover) => cover.type === "image")
            .map((cover) => ({
              id: `picker-cover-${cover.id}`,
              label: cover.label || "Фон",
              meta: "фон места силы",
              src: cover.src,
              displaySrc: cover.displaySrc || cover.src,
              kind: "cover"
            })),
          ...materials
            .filter((item) => item.image_url && materialMatchesCategory(item, "covers"))
            .map(materialToOption)
        ].filter((item) => item?.kind === "cover" || item?.src || item?.displaySrc))
      ];
    }

    if (categoryValue === "form") {
      return uniqueImageSources(materials
        .filter((item) => item.image_url && materialMatchesCategory(item, "form", subcategory?.value || subcategory?.label))
        .map(materialToOption)
        .filter(hasImage));
    }

    if (categoryValue === "talismans") {
      return uniqueImageSources(materials
        .filter((item) => item.image_url && item.type === "artifact")
        .filter((item) => textMatches(item, subcategory?.label || "Талисман"))
        .map(materialToOption)
        .filter(hasImage));
    }

    if (categoryValue === "channels") {
      const subcategoryValues = [subcategory?.value, subcategory?.label].filter(Boolean);
      const thirdLevelValues = [thirdLevel?.value, thirdLevel?.label].filter(Boolean);
      const pickerValues = [subcategoryValues, thirdLevelValues].filter((entry) => entry.length > 0);

      return uniqueImageSources(materials
        .filter((item) => item.image_url && (
          !pickerValues.length || pickerValues.every((entry) => textMatches(item, entry) || channelTextMatch(item, entry))
        ))
        .map(materialToOption)
        .filter(hasImage));
    }

    return uniqueImageSources(materials
      .filter((item) => item.image_url && item.type === "artifact")
      .map(materialToOption)
      .filter(hasImage));
  };

  const reusableImages = useMemo(() => uniqueImageSources([
    ...clientGoalPhotos.map((item) => ({
      id: `client-${item.id}`,
      label: item.title || "Фото клиента / цели",
      src: item.image_ref || item.image_url,
      displaySrc: previewImageUrl(item.display_url, item.signed_url, item.image_url, item.image_ref)
    })),
    ...materials.map((item, index) => ({
      id: `material-${item.id || index}`,
      label: item.title || `Материал ${index + 1}`,
      src: item.image_url,
      displaySrc: item.display_url || displayMaterialImageUrl(item.image_url)
    }))
  ]), [clientGoalPhotos, materials]);

  const traditionImageOptions = useMemo(() => uniqueImageSources(
    traditionAssets.map((item) => ({
      id: `tradition-${item.id}`,
      label: item.title || selectedTradition?.title || "Образ традиции",
      src: item.image_ref || item.image_url,
      displaySrc: item.display_url || item.image_url
    }))
  ), [selectedTradition?.title, traditionAssets]);

  const coverVariants = useMemo(() => [
    { id: "no-cover", label: "Без фона", type: "none" },
    ...reusableImages.map((item) => ({ ...item, type: "image" })),
    ...(customCoverImage ? [{ id: "custom-cover", label: "Своё изображение", src: customCoverImage, displaySrc: displayImageUrl(customCoverImage), type: "image" }] : []),
    ...(customOuterCoverImage ? [{ id: "custom-outer-cover", label: "Своё изображение снаружи", src: customOuterCoverImage, displaySrc: displayImageUrl(customOuterCoverImage), type: "image" }] : []),
    ...FALLBACK_COVER_VARIANTS.map((item) => ({ ...item, type: "placeholder" }))
  ], [customCoverImage, customOuterCoverImage, objectImageUrls, reusableImages]);

  const pickerImageOptions = useMemo(() => {
    return buildSourceLibraryItems(activePickerCategory, activePickerCategoryData, activePickerSubcategoryData, activePickerThirdLevelData);
  }, [activePickerCategory, activePickerCategoryData, activePickerSubcategoryData, activePickerThirdLevelData, coverVariants, materials, clientGoalPhotos, traditionAssets]);

  const modalPickerImageOptions = pickerImageOptions;

  const selectedCover = useMemo(
    () => coverVariants.find((item) => item.id === selectedCoverId) || coverVariants[0],
    [coverVariants, selectedCoverId]
  );
  const selectedOuterCover = useMemo(
    () => coverVariants.find((item) => item.id === selectedOuterCoverId) || coverVariants[0],
    [coverVariants, selectedOuterCoverId]
  );
  const selectedCoverClass = selectedCover?.type === "none"
    ? "cover-none"
    : selectedCover?.type === "image"
      ? "cover-image"
      : `cover-${selectedCover?.tone || "gold"}`;
  const selectedCoverStyle = selectedCover?.type === "image" && selectedCover.src
    ? { "--power-cover-image": `url(${displayImageUrl(selectedCover.src)})` }
    : undefined;
  const selectedOuterCoverClass = selectedOuterCover?.type === "none"
    ? "outer-cover-none"
    : selectedOuterCover?.type === "image"
      ? "outer-cover-image"
      : `outer-cover-${selectedOuterCover?.tone || "gold"}`;
  const selectedOuterCoverStyle = selectedOuterCover?.type === "image" && selectedOuterCover.src
    ? { "--power-outer-cover-image": `url(${displayImageUrl(selectedOuterCover.src)})` }
    : undefined;

  const centerImage = previewImageUrl(
    selectedCentralImageRef,
    selectedCentralPhoto?.display_url,
    selectedCentralPhoto?.signed_url,
    selectedCentralPhoto?.image_url,
    selectedCentralPhoto?.image_ref
  );

  const artifactMenuEntries = useMemo(() => [
    ...menuSectionEntries(leftMenuSections["artifact-creation"]),
    ...menuSectionEntries(leftMenuSections["artifact-shop"])
  ], []);

  const talismanMenuEntries = useMemo(
    () => artifactMenuEntries.filter((item) => /талисман/i.test(`${item.label || ""} ${item.description || ""}`)),
    [artifactMenuEntries]
  );

  const powerLibraryGroups = useMemo(() => [
    {
      id: "dao-ri",
      label: "ДАО РИ",
      count: stepOptions.length,
      items: stepOptions.map((step) => ({
        id: step.id,
        title: step.fullLabel,
        meta: step.contentStatus === "needs_review" ? "needs verification" : step.status || ""
      }))
    },
    {
      id: "divine-channels",
      label: "Мистерии",
      count: mysteryTraditions.reduce((sum, tradition) => sum + 1 + (tradition.entities?.length || 0), 0),
      items: mysteryTraditions.flatMap((tradition) => [
        {
          id: tradition.id,
          title: tradition.title,
          meta: tradition.contentStatus === "needs_review" ? "needs verification" : tradition.subtitle || ""
        },
        ...(tradition.entities || []).map((entity) => ({
          id: `${tradition.id}-${entity.id}`,
          title: entity.title,
          meta: entity.contentStatus === "needs_review" ? "needs verification" : tradition.title
        }))
      ])
    },
    {
      id: "talismans",
      label: "Талисманы",
      count: talismanMenuEntries.length,
      emptyText: "Категории талисманов требуют проверки в источниках.",
      items: talismanMenuEntries.map((item) => ({
        id: item.id,
        title: item.label,
        meta: item.status || "категория сайта"
      }))
    },
    {
      id: "artifacts",
      label: "Артефакты",
      count: artifactMenuEntries.length + materials.filter((item) => item.type === "artifact").length,
      items: [
        ...materials.filter((item) => item.type === "artifact").map((item) => ({
          id: `material-${item.id}`,
          title: item.title || "Артефакт без названия",
          meta: materialStatusText(item.status)
        })),
        ...artifactMenuEntries.map((item) => ({
          id: item.id,
          title: item.label,
          meta: item.status || "категория сайта"
        }))
      ]
    },
    {
      id: "material-covers",
      label: "Фон",
      count: materials.filter((item) => item.image_url && materialMatchesCategory(item, "covers")).length,
      items: materials
        .filter((item) => item.image_url && materialMatchesCategory(item, "covers"))
        .map((item) => ({
          id: `material-cover-${item.id}`,
          title: item.title || "Материал",
          meta: "фон"
        }))
    },
    {
      id: "material-form",
      label: "Форма",
      count: materials.filter((item) => materialMatchesCategory(item, "form")).length,
      items: materials
        .filter((item) => item.image_url && materialMatchesCategory(item, "form"))
        .map((item) => ({
          id: `material-form-${item.id}`,
          title: item.title || "Форма",
          meta: item.material_subcategory || item.material_category || item.category || item.subcategory || "форма"
        }))
    },
    {
      id: "covers",
      label: "Фон Места Силы",
      count: coverVariants.length,
      items: coverVariants.map((cover) => ({
        id: cover.id,
        title: cover.label,
        meta: cover.type === "image" ? "изображение" : "фон"
      }))
    },
    {
      id: "client-goals",
      label: "Клиенты",
      count: clientGoalPhotos.length,
      emptyText: "Фото появятся после сохранения в кабинете.",
      items: clientGoalPhotos.map((photo) => ({
        id: photo.id,
        title: photo.title || "Фото клиента / цели",
        meta: photo.notes || "центр композиции"
      }))
    }
  ], [artifactMenuEntries, clientGoalPhotos, coverVariants, materials, talismanMenuEntries]);

  const savedPowerImages = useMemo(() => uniqueImageSources([
    ...clientGoalPhotos.map((photo) => ({
      id: `client-photo-${photo.id}`,
      title: photo.title || "Фото клиента / цели",
      label: photo.title || "Фото клиента / цели",
      source: "Клиенты",
      status: photo.notes || "",
      src: photo.image_ref || photo.image_url,
      displaySrc: previewImageUrl(photo.display_url, photo.signed_url, photo.image_url, photo.image_ref),
      kind: "client-photo",
      categoryValue: "client-goals",
      photoId: photo.id
    })),
    ...traditionAssets.map((asset) => ({
      id: `tradition-asset-${asset.id}`,
      title: asset.title || selectedTradition?.title || "Образ традиции",
      label: asset.title || selectedTradition?.title || "Образ традиции",
      source: "Мистерии",
      status: asset.tradition_title || selectedTradition?.title || "",
      src: asset.image_ref || asset.image_url,
      displaySrc: asset.display_url || asset.image_url,
      kind: "tradition-asset",
      categoryValue: "god-channels",
      traditionId: asset.tradition_id || selectedTradition?.id || ""
    })),
    ...materials.map((item, index) => ({
      id: `material-image-${item.id || index}`,
      title: item.title || `Материал ${index + 1}`,
      label: item.title || `Материал ${index + 1}`,
      source: publicationTypeLabel(item.type),
      status: materialStatusText(item.status),
      src: item.image_url,
      displaySrc: item.display_url || displayMaterialImageUrl(item.image_url),
      kind: "material",
      rawMaterial: item
    })),
    ...coverVariants.filter((cover) => cover.type === "image").map((cover) => ({
      id: `cover-${cover.id}`,
      title: cover.label || "Подложка",
      label: cover.label || "Подложка",
      source: "Фон Места Силы",
      status: "фон",
      src: cover.src,
      displaySrc: cover.displaySrc || cover.src,
      kind: "cover",
      categoryValue: "covers"
    }))
  ]), [clientGoalPhotos, coverVariants, materials, selectedTradition?.title, traditionAssets]);


  const filteredSavedPowerImages = useMemo(() => {
    const sorted = [...savedPowerImages].sort((a, b) => {
      const ad = Date.parse(a.rawMaterial?.updated_at || a.rawMaterial?.created_at || "");
      const bd = Date.parse(b.rawMaterial?.updated_at || b.rawMaterial?.created_at || "");
      return (Number.isFinite(bd) ? bd : 0) - (Number.isFinite(ad) ? ad : 0);
    });

    return sorted.filter((item) => {
      const raw = item.rawMaterial;
      if (activeMaterialCategory === "client-goals") return item.kind === "client-photo";
      if (activeMaterialCategory === "covers") return item.kind === "cover" || (raw && materialMatchesCategory(raw, "covers"));
      if (activeMaterialCategory === "god-channels") return item.kind === "tradition-asset" || (raw && textMatches(raw, activeMaterialSubcategoryData?.label || ""));
      if (activeMaterialCategory === "artifacts") return raw?.type === "artifact";
      if (activeMaterialCategory === "talismans") return raw?.type === "artifact" && textMatches(raw, activeMaterialSubcategoryData?.label || "Талисман");
      if (activeMaterialCategory === "form") return raw && materialMatchesCategory(raw, "form", activeMaterialSubcategoryData?.value || activeMaterialSubcategoryData?.label);
      if (activeMaterialCategory === "channels") return raw && (!materialChannelValues.length || materialChannelValues.every((entry) => channelTextMatch(raw, entry)));
      if (activeMaterialCategory === "dao-ri") {
        if (!raw) return false;
        const stepIds = new Set(activeMaterialSubcategoryData?.steps?.map((step) => step.id) || []);
        return !stepIds.size || !raw.step_id || stepIds.has(raw.step_id);
      }
      return true;
    });
  }, [activeMaterialCategory, activeMaterialSubcategoryData, materialChannelValues, savedPowerImages]);

  const objectImageOptions = useMemo(() => [
    { id: "", label: "Пусто", src: "" },
    ...(constructorType === "altar" ? traditionImageOptions : reusableImages)
  ], [constructorType, reusableImages, traditionImageOptions]);

  const activeObjectSlots = useMemo(() => {
    if (constructorType === "altar") {
      return [
        ...Array.from({ length: 5 }, (_, index) => ({
          id: `altar-top-${index + 1}`,
          label: index === 2 ? "Верхний центр" : `Верхний ${index + 1}`
        })),
        { id: "altar-support-1", label: "Нижняя опора 1" },
        { id: "altar-support-2", label: "Нижняя опора 2" }
      ];
    }

    if (constructorType === "business") {
      return BUSINESS_VERTICES.flatMap((vertex) =>
        Array.from({ length: businessVertexZoneCount }, (_, index) => ({
          id: `business-${vertex.id}-${index + 1}`,
          label: businessVertexZoneCount === 1 ? vertex.label : `${vertex.label} · зона ${index + 1}`
        }))
      );
    }

    if (constructorType === "dao") {
      return DAO_ELEMENTS.map((element) => ({
        id: `dao-${element.id}`,
        label: element.label
      }));
    }

    if (constructorType === "zodiac") {
      const isPlusVariant = zodiacVariant.startsWith("plus");
      const visibleSignCount = isPlusVariant ? 8 : zodiacVisibleCount;
      const signSlots = ZODIAC_SIGNS.slice(0, visibleSignCount).map((sign, index) => ({
        id: `zodiac-${index + 1}`,
        label: sign.label,
        className: `${sign.className}`,
        classPrefix: "classic"
      }));

      if (!isPlusVariant) {
        return signSlots;
      }

      const plusSlotDefinitions = zodiacVisibleCount >= 12
        ? [
          { id: "zodiac-plus-corner-tl", label: "Угол верх-лев", className: "plus-corner-tl", classPrefix: "plus" },
          { id: "zodiac-plus-corner-tr", label: "Угол верх-прав", className: "plus-corner-tr", classPrefix: "plus" },
          { id: "zodiac-plus-corner-bl", label: "Угол низ-лев", className: "plus-corner-bl", classPrefix: "plus" },
          { id: "zodiac-plus-corner-br", label: "Угол низ-прав", className: "plus-corner-br", classPrefix: "plus" }
        ]
        : [
          { id: "zodiac-plus-top", label: "Топ", className: "plus-top", classPrefix: "plus" },
          { id: "zodiac-plus-right", label: "Право", className: "plus-right", classPrefix: "plus" },
          { id: "zodiac-plus-bottom", label: "Низ", className: "plus-bottom", classPrefix: "plus" },
          { id: "zodiac-plus-left", label: "Лево", className: "plus-left", classPrefix: "plus" }
        ];

      return [...signSlots, ...plusSlotDefinitions];
    }

    if (constructorType === "star") {
      return STAR_POINTS.map((point, index) => ({
        id: `star-${index + 1}`,
        label: point.label
      }));
    }

    if (constructorType === "chess") {
      return [
        ...CHESS_TOP_SLOTS,
        ...(CHESS_SLOT_LAYOUTS[chessVariant] || CHESS_SLOT_LAYOUTS["classic-14"])
      ];
    }

    return Array.from({ length: powerSourceCount }, (_, index) => ({
      id: `source-${index + 1}`,
      label: sourceLabel(powerSourceCount, index)
    }));
  }, [businessVertexZoneCount, chessVariant, constructorType, powerSourceCount, zodiacVisibleCount, zodiacVariant]);

  const selectedObjectSlot = useMemo(
    () => activeObjectSlots.find((slot) => slot.id === selectedObjectSlotId) || activeObjectSlots[0] || null,
    [activeObjectSlots, selectedObjectSlotId]
  );

  const selectedObjectImage = selectedObjectSlot ? objectImages[selectedObjectSlot.id] || "" : "";

  useEffect(() => {
    if (!activeObjectSlots.length) {
      setSelectedObjectSlotId("");
      return;
    }

    setSelectedObjectSlotId((current) =>
      activeObjectSlots.some((slot) => slot.id === current) ? current : activeObjectSlots[0].id
    );
  }, [activeObjectSlots]);

  useEffect(() => {
    if (constructorType !== "zodiac") return;
    setZodiacVariant((current) => zodiacVariantOption(current, zodiacVisibleCount));
  }, [constructorType, zodiacVisibleCount]);

  useEffect(() => {
    const resetParams = new URLSearchParams(window.location.search);
    if (resetParams.get("resetProfileSession") === "1") {
      clearStoredSession();
      window.history.replaceState({}, document.title, window.location.pathname);
      resetProfileSessionState();
      return;
    }

    const nextSession = storeSessionFromUrlHash();
    if (nextSession && !isUsableStoredSession(nextSession)) {
      resetProfileSessionState("Сессия повреждена. Войдите заново.");
      return;
    }

    setSession((currentSession) => {
      if (currentSession?.access_token && currentSession.access_token === nextSession?.access_token) {
        return currentSession;
      }
      return nextSession;
    });
  }, []);

  useEffect(() => {
    if (!materialFile) {
      setMaterialFilePreview("");
      return undefined;
    }

    const previewUrl = URL.createObjectURL(materialFile);
    setMaterialFilePreview(previewUrl);
    return () => URL.revokeObjectURL(previewUrl);
  }, [materialFile]);

  useEffect(() => {
    setActiveMaterialSubcategory(activeMaterialCategoryData.subcategories[0]?.value || "");
  }, [activeMaterialCategory, activeMaterialCategoryData.subcategories]);

  useEffect(() => {
    setActiveMaterialThirdLevel(activeMaterialSubcategoryData?.thirdLevels?.[0]?.value || "");
    setIsMaterialThirdLevelPanelOpen(Boolean(activeMaterialSubcategoryData?.thirdLevels?.length));
  }, [activeMaterialSubcategoryData]);

  useEffect(() => {
    setActivePickerSubcategory(activePickerCategoryData.subcategories[0]?.value || "");
  }, [activePickerCategory, activePickerCategoryData.subcategories]);

  useEffect(() => {
    setActivePickerThirdLevel(activePickerSubcategoryData?.thirdLevels?.[0]?.value || "");
  }, [activePickerSubcategoryData]);

  const sessionAccessToken = session?.access_token || "";

  const publishBootstrapDebug = (patch) => {
    setBootstrapDebug((current) => {
      const next = { ...current, ...patch };
      publishProfileReactDebug(next);
      return next;
    });
  };

  useEffect(() => {
    if (typeof window !== "undefined" && isProfileReactDebugEnabled()) {
      window.__REIKI_PROFILE_REACT_DEBUG__ = {};
    }
    publishBootstrapDebug(EMPTY_BOOTSTRAP_DEBUG);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    publishProfileReactDebug({
      authStatus,
      hasUser: Boolean(user),
      hasUserId: Boolean(user?.id),
      hasSessionState: Boolean(sessionAccessToken),
      cabinetCondition: shouldShowCabinet,
      renderGateOpen: shouldShowCabinet,
      loadingTimedOut: Boolean(loadingTimedOut),
      ...bootstrapDebug
    });
  }, [authStatus, user, sessionAccessToken, loadingTimedOut, bootstrapDebug, shouldShowCabinet]);

  if (shouldShowCabinet) {
    publishProfileReactDebug({
      renderGateOpen: shouldShowCabinet,
      reactBootstrapCheckpoint: "first-cabinet-render-attempt"
    });
  }

  useEffect(() => {
    if (authStatus !== "loading" || hasAuthenticatedUser) {
      setLoadingTimedOut(false);
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      setLoadingTimedOut(true);
      setAuthStatus("error");
      setError((current) => current || "Не удалось дождаться загрузки кабинета. Попробуйте обновить страницу или войти заново.");
    }, 16000);

    return () => window.clearTimeout(timeoutId);
  }, [authStatus, hasAuthenticatedUser]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!supabaseEnv.isConfigured) {
        publishBootstrapDebug({ ...EMPTY_BOOTSTRAP_DEBUG });
        setAuthStatus("idle");
        return;
      }

      if (!session?.access_token) {
        publishBootstrapDebug({ ...EMPTY_BOOTSTRAP_DEBUG, bootstrapStep: "no-session" });
        setAuthStatus("idle");
        return;
      }

      if (isStoredSessionExpired(session)) {
        publishBootstrapDebug({
          bootstrapStep: "error",
          bootstrapErrorMessage: "Сессия устарела.",
          bootstrapCurrentUserIdPresent: false,
          bootstrapCancelledBeforeApply: false,
          bootstrapFallbackUserUsed: false,
          reactBootstrapCheckpoint: "session-expired"
        });
        resetProfileSessionState("Сессия устарела. Войдите заново.");
        return;
      }

      setAuthStatus("loading");
      setLoadingTimedOut(false);
      setError("");
      publishBootstrapDebug({
        ...EMPTY_BOOTSTRAP_DEBUG,
        bootstrapStep: "started",
        reactBootstrapCheckpoint: "before-bootstrap-call"
      });

      try {
        const { currentUser, currentProfile, notices = [] } = await loadProfileCabinetBootstrap({
          session,
          getCurrentUser,
          onStep: (bootstrapStep, stepError) => publishBootstrapDebug({
            bootstrapStep,
            bootstrapErrorMessage: stepError ? sanitizeDebugMessage(stepError?.message || "bootstrap error") : "",
            bootstrapFallbackUserUsed: bootstrapStep === "fallback-used" || bootstrapStep === "session-shell-opened",
            reactBootstrapCheckpoint: "inside-bootstrap"
          })
        });

        publishBootstrapDebug({
          bootstrapCurrentUserIdPresent: Boolean(currentUser?.id),
          reactBootstrapCheckpoint: "bootstrap-returned"
        });

        if (cancelled) {
          publishBootstrapDebug({
            bootstrapStep: "cancelled",
            bootstrapCancelledBeforeApply: true,
            reactBootstrapCheckpoint: "cancelled-before-apply"
          });
          return;
        }

        publishBootstrapDebug({ reactBootstrapCheckpoint: "before-set-user" });
        setUser(currentUser);
        publishBootstrapDebug({
          bootstrapStep: "user-applied",
          bootstrapCurrentUserIdPresent: Boolean(currentUser?.id),
          reactBootstrapCheckpoint: "after-set-user"
        });
        setProfile(normalizeProfileRecord(currentProfile, currentUser, EMPTY_PROFILE));
        publishBootstrapDebug({
          bootstrapStep: "profile-applied",
          bootstrapCurrentUserIdPresent: Boolean(currentUser?.id),
          reactBootstrapCheckpoint: "after-set-profile"
        });
        setSecondaryDataNotice(notices.map(sanitizeDebugMessage).filter(Boolean).join(" "));
        setLoadingTimedOut(false);
        setAuthStatus("ready");
        publishBootstrapDebug({
          bootstrapStep: "auth-ready-applied",
          bootstrapCurrentUserIdPresent: Boolean(currentUser?.id),
          reactBootstrapCheckpoint: "after-auth-ready"
        });
      } catch (err) {
        publishBootstrapDebug({
          bootstrapStep: "error",
          bootstrapErrorMessage: sanitizeDebugMessage(err?.message || "bootstrap error"),
          bootstrapCurrentUserIdPresent: false,
          reactBootstrapCheckpoint: "bootstrap-error"
        });

        if (err?.code === "auth_load_timeout") {
          if (!cancelled) {
            setAuthStatus("error");
            setError(sanitizeDebugMessage(err.message || "Пользователь не загрузился."));
          }
          return;
        }

        if (isExpiredOrInvalidAuthError(err)) {
          if (!cancelled) {
            resetProfileSessionState(err?.message || "Сессия устарела. Войдите заново.");
          }
          return;
        }

        if (!cancelled) {
          setAuthStatus("error");
          setError(err.message || "Не удалось загрузить профиль.");
        }
      }
    }

    load();

    return () => {
      cancelled = true;
      if (typeof window !== "undefined") {
        publishProfileReactDebug({
          bootstrapStep: "cancelled",
          reactBootstrapCheckpoint: "cleanup-cancelled"
        });
      }
    };
  }, [sessionAccessToken, bootstrapRetryKey]);

  useEffect(() => {
    if (
      authStatus !== "ready" ||
      !user?.id ||
      !sessionAccessToken ||
      user?.source !== "session-jwt-fallback"
    ) return undefined;

    if (backgroundVerificationTokenRef.current === sessionAccessToken) return undefined;
    backgroundVerificationTokenRef.current = sessionAccessToken;

    let cancelled = false;

    runBackgroundUserVerification({
      session,
      getCurrentUser,
      onStep: (step) => {
        if (!cancelled) publishBootstrapDebug({ bootstrapStep: step });
      }
    }).then((result) => {
      if (cancelled) return;
      if (result.status === "timeout" || result.status === "network-fail") {
        setSecondaryDataNotice("Авторизация работает в автономном режиме. Кабинет открыт по сохранённой сессии.");
      } else if (result.status === "auth-error") {
        resetProfileSessionState("Сессия устарела. Войдите заново.");
      }
    }).catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [authStatus, user?.id, user?.source, sessionAccessToken]);

  useEffect(() => {
    let cancelled = false;

    async function loadMaterials() {
      if (!profile?.id || !session?.access_token) {
        setMaterials([]);
        return;
      }

      setMaterialsLoading(true);

      try {
        const rows = await listOwnMaterials(profile.id, session);
        if (!cancelled) setMaterials(rows || []);
      } catch (err) {
        if (!cancelled) {
          setMaterials([]);
          setSecondaryDataNotice(`Материалы не загрузились: ${sanitizeDebugMessage(err?.message || "данные материалов временно недоступны")}. Кабинет открыт в базовом режиме.`);
        }
      } finally {
        if (!cancelled) setMaterialsLoading(false);
      }
    }

    loadMaterials();

    return () => {
      cancelled = true;
    };
  }, [profile?.id, session]);

  useEffect(() => {
    let cancelled = false;

    async function loadPowerPlaceData() {
      if (!profile?.id || !session?.access_token) {
        setClientGoalPhotos([]);
        setPowerPlaceCompositions([]);
        return;
      }

      try {
        const { clientGoalPhotos: photos, powerPlaceCompositions: compositions, notices } = await loadPowerPlaceOptionalData({
          profileId: profile.id,
          session,
          listClientGoalPhotos,
          listPowerPlaceCompositions
        });

        if (!cancelled) {
          setClientGoalPhotos(photos || []);
          setPowerPlaceCompositions(compositions || []);
          setSelectedCentralPhotoId((current) => current || photos?.[0]?.id || "");
          if (notices.length) {
            setSecondaryDataNotice(notices.map(sanitizeDebugMessage).join(" "));
          }
        }
      } catch (err) {
        if (!cancelled) setSecondaryDataNotice(`Места силы не загрузились: ${sanitizeDebugMessage(err?.message || "данные временно недоступны")}. Кабинет открыт в базовом режиме.`);
      }
    }

    loadPowerPlaceData();

    return () => {
      cancelled = true;
    };
  }, [profile?.id, session]);

  useEffect(() => {
    let cancelled = false;

    async function loadTraditionImages() {
      if (!profile?.id || !selectedTraditionId || !session?.access_token) {
        setTraditionAssets([]);
        return;
      }

      try {
        const rows = await listTraditionAssets(profile.id, selectedTraditionId, session);
        if (!cancelled) setTraditionAssets(rows || []);
      } catch (err) {
        if (!cancelled) {
          setTraditionAssets([]);
          setSecondaryDataNotice(`Медиа традиции не загрузились: ${sanitizeDebugMessage(err?.message || "данные временно недоступны")}. Кабинет открыт в базовом режиме.`);
        }
      }
    }

    loadTraditionImages();

    return () => {
      cancelled = true;
    };
  }, [profile?.id, selectedTraditionId, session]);

  const updateField = (field, value) => {
    setProfile((current) => ({ ...current, [field]: value }));
  };

  const updateMaterialField = (field, value) => {
    setMaterialForm((current) => {
      if (field === "step_id") {
        const step = stepOptions.find((item) => item.id === value) || firstStep;
        const settings = settingsForStep(value);

        return {
          ...current,
          step_id: value,
          step_title: step?.title || "",
          setting_title: settings[0]?.title || "",
          setting_index: settings.length > 0 ? 1 : null
        };
      }

      if (field === "setting_title") {
        const settingIndex = activeSettings.findIndex((item) => item.title === value);
        return { ...current, setting_title: value, setting_index: settingIndex >= 0 ? settingIndex + 1 : null };
      }

      return { ...current, [field]: value };
    });
  };

  const buildCoverRef = () => {
    const buildLayer = (cover) => ({
      id: cover?.id || "no-cover",
      label: cover?.label || "Без фона",
      type: cover?.type || "none",
      tone: cover?.tone || "",
      src: cover?.src || ""
    });

    return normalizeCoverRef({
      ...buildLayer(selectedCover),
      inner: buildLayer(selectedCover),
      outer: buildLayer(selectedOuterCover)
    });
  };

  const buildPowerPlacePayload = () => ({
    profile_id: profile.id,
    title: compositionTitle,
    constructor_type: constructorType,
    geometry: constructorType === "client" ? powerSourceCount : null,
    zodiac_visible_count: zodiacVisibleCount,
    altar_center_ratio: altarCenterRatio,
    business_vertex_zone_count: businessVertexZoneCount,
    star_variant: starVariant,
    chess_variant: chessVariant,
    cover_ref: buildCoverRef(),
    object_refs: persistableObjectRefs(
      { ...objectImages, __center_image: selectedCentralImageRef },
      [...activeObjectSlots.map((slot) => slot.id), "__center_image"]
    ),
    central_photo_id: selectedCentralPhotoId,
    tradition_id: constructorType === "altar" ? selectedTradition?.id || "" : "",
    tradition_title: constructorType === "altar" ? selectedTradition?.title || "" : "",
    resource_comparison_mode: resourceComparisonMode,
    resource_without_mandala_comment: resourceWithoutMandalaComment,
    resource_with_mandala_comment: resourceWithMandalaComment
  });

  const applyComposition = (composition) => {
    setSelectedCompositionId(composition.id || "");
    setCompositionTitle(composition.title || "");
    setConstructorType(composition.constructor_type || "client");
    if (composition.geometry) setPowerSourceCount(Number(composition.geometry));
    const nextZodiacVisibleCount = ZODIAC_VISIBLE_COUNTS.includes(Number(composition.zodiac_visible_count))
      ? Number(composition.zodiac_visible_count)
      : 12;

    setZodiacVisibleCount(nextZodiacVisibleCount);
    setZodiacVariant(inferZodiacVariant(nextZodiacVisibleCount, composition.object_refs || {}));
    setBusinessVertexZoneCount(Number(composition.business_vertex_zone_count) === 3 ? 3 : 1);
    setStarVariant(STAR_VARIANTS.some((item) => item.value === composition.star_variant) ? composition.star_variant : "closed");
    setChessVariant(chessVariantOption(composition.chess_variant));
    setAltarCenterRatio(composition.altar_center_ratio || "1");
    const { __center_image: savedCenterImageRef = "", ...compositionObjectRefs } = composition.object_refs || {};
    setObjectImages(compositionObjectRefs);
    setObjectImageUrls((current) => ({ ...current, ...(composition.object_ref_urls || {}) }));
    setSelectedCentralImageRef(savedCenterImageRef || "");
    setSelectedCentralPhotoId(composition.central_photo_id || "");
    setSelectedTraditionId(composition.tradition_id || mysteryTraditions[0]?.id || "");
    setResourceComparisonMode(composition.resource_comparison_mode || "photo_mandala");
    setResourceWithoutMandalaComment(composition.resource_without_mandala_comment || "");
    setResourceWithMandalaComment(composition.resource_with_mandala_comment || "");

    if (composition.cover_ref?.id) {
      const savedCover = normalizeCoverRef(composition.cover_ref);
      const savedInnerCover = savedCover?.inner || savedCover;
      const savedOuterCover = savedCover?.outer || { id: "no-cover", type: "none", label: "Без фона" };
      const savedCoverExists = coverVariants.some((cover) => cover.id === savedInnerCover?.id);
      const savedOuterCoverExists = coverVariants.some((cover) => cover.id === savedOuterCover?.id);

      if (savedInnerCover?.src && (composition.cover_ref?.display_src || composition.cover_ref?.inner?.display_src)) {
        setObjectImageUrls((current) => ({ ...current, [savedInnerCover.src]: composition.cover_ref.display_src || composition.cover_ref.inner.display_src }));
      }

      if (savedOuterCover?.src && composition.cover_ref?.outer?.display_src) {
        setObjectImageUrls((current) => ({ ...current, [savedOuterCover.src]: composition.cover_ref.outer.display_src }));
      }

      if (savedInnerCover?.id === "custom-cover" && savedInnerCover.src) {
        setCustomCoverImage(savedInnerCover.src);
        setSelectedCoverId("custom-cover");
      } else if (savedCoverExists) {
        setSelectedCoverId(savedInnerCover.id);
      } else {
        setSelectedCoverId("no-cover");
      }

      if (savedOuterCover?.id === "custom-outer-cover" && savedOuterCover.src) {
        setCustomOuterCoverImage(savedOuterCover.src);
        setSelectedOuterCoverId("custom-outer-cover");
      } else if (savedOuterCoverExists) {
        setSelectedOuterCoverId(savedOuterCover.id);
      } else {
        setSelectedOuterCoverId("no-cover");
      }

    }
  };

  const handleCreateNewComposition = () => {
    setSelectedCompositionId("");
    setCompositionTitle("");
    setConstructorType("zodiac");
    setPowerSourceCount(4);
    setZodiacVisibleCount(12);
    setZodiacVariant("classic-12");
    setStarVariant("closed");
    setChessVariant("classic-14");
    setBusinessVertexZoneCount(1);
    setAltarCenterRatio("1");
    setObjectImages({});
    setSelectedCoverId(FALLBACK_COVER_VARIANTS[0].id);
    setSelectedOuterCoverId("no-cover");
    setActiveCoverLayer("inner");
    setMandalaFieldLayout("square");
    setCustomCoverImage("");
    setCustomOuterCoverImage("");
    setCoverNotice("");
    setSelectedCentralPhotoId("");
    setSelectedCentralImageRef("");
    setSelectedTraditionId(mysteryTraditions[0]?.id || "");
    setResourceComparisonMode("photo_mandala");
    setResourceWithoutMandalaComment("");
    setResourceWithMandalaComment("");
    setSelectedObjectSlotId("");
    setImagePickerContext({ mode: "", slotId: "" });
    setMessage("Редактор переключён в режим новой мандалы.");
    setError("");
  };

  const handleDeleteComposition = async (composition, event) => {
    event?.preventDefault?.();
    event?.stopPropagation?.();
    if (!composition?.id || !profile?.id) return;
    const title = composition.title || "Без названия";
    if (!window.confirm(`Удалить мандалу «${title}»? Это действие нельзя отменить.`)) return;

    setMessage("");
    setError("");
    try {
      await deletePowerPlaceComposition(composition.id, profile.id, session);
      setPowerPlaceCompositions((current) => current.filter((item) => item.id !== composition.id));
      if (selectedCompositionId === composition.id) {
        setSelectedCompositionId("");
        setMessage("Мандала удалена из базы. Текущий макет остался в редакторе как черновик.");
      } else {
        setMessage("Мандала удалена.");
      }
    } catch (err) {
      setError(err.message || "Не удалось удалить мандалу.");
    }
  };

  const handleMandalaFile = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      validateProfileMediaFile(file);
      setMaterialFile(file);
      setFileNotice(`Фото «${file.name}» выбрано. Оно будет загружено при сохранении.`);
    } catch (err) {
      setFileNotice(formatUploadError(err));
    }
  };

  const formatUploadError = (err) => err?.message || "Не удалось загрузить изображение.";

  const handleCoverFile = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!profile?.id || !session?.access_token) {
      setCoverNotice("Сначала войдите и сохраните профиль мастера.");
      return;
    }

    try {
      validateProfileMediaFile(file);
      setMediaUploadTarget("cover");
      setCoverNotice("Загружаю заставку...");
      const uploaded = await uploadProfileMedia(file, { profileId: profile.id, kind: "underlay" }, session);
      setObjectImageUrls((current) => ({ ...current, [uploaded.ref]: uploaded.signedUrl }));

      if (activeCoverLayer === "outer") {
        setCustomOuterCoverImage(uploaded.ref);
        setSelectedOuterCoverId("custom-outer-cover");
      } else {
        setCustomCoverImage(uploaded.ref);
        setSelectedCoverId("custom-cover");
      }

      setCoverNotice(`Заставка «${uploaded.metadata.filename}» загружена.`);
    } catch (err) {
      setCoverNotice(formatUploadError(err));
    } finally {
      setMediaUploadTarget("");
      event.target.value = "";
    }
  };

  const setObjectImage = (slotId, value, displayUrl = "") => {
    setObjectImages((current) => ({ ...current, [slotId]: value }));
    setObjectImageUrls((current) => {
      if (!displayUrl || displayUrl === value) return current;
      return { ...current, [value]: displayUrl };
    });
  };

  const handleLibraryImageSelect = (item) => {
    const imageRef = item?.src || item?.displaySrc || "";
    if (!imageRef) return;

    if (item.src && item.displaySrc) {
      setObjectImageUrls((current) => ({ ...current, [item.src]: item.displaySrc }));
    }

    setMaterialFile(null);
    setMaterialFilePreview("");
    setActiveTopTab("mandalas");
    setMaterialForm((current) => ({
      ...current,
      type: item?.rawMaterial?.type || current.type || "mandala",
      title: current.title?.trim() ? current.title : item.title || item.label || "Мандала",
      image_url: imageRef
    }));
    setMessage("Изображение открыто во вкладке «Мои мандалы». Добавьте описание и сохраните.");
  };

  const handleObjectSelect = (slotId, value) => {
    const option = objectImageOptions.find((item) => item.src === value);
    setObjectImage(slotId, value, option?.displaySrc || value);
  };

  const openObjectSlot = (slotId) => {
    setSelectedObjectSlotId(slotId);
    setImagePickerContext({ mode: "object", slotId });
  };

  const handleObjectFile = async (slotId, event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!profile?.id || !session?.access_token) {
      setCoverNotice("Сначала войдите и сохраните профиль мастера.");
      return;
    }

    try {
      validateProfileMediaFile(file);
      setMediaUploadTarget(`slot-${slotId}`);
      setCoverNotice("Загружаю изображение объекта...");
      const uploaded = await uploadProfileMedia(file, {
        profileId: profile.id,
        kind: "power-place",
        compositionId: selectedCompositionId || "draft",
        slotId
      }, session);
      setObjectImage(slotId, uploaded.ref, uploaded.signedUrl);
      setCoverNotice(`Изображение «${uploaded.metadata.filename}» загружено в Storage.`);
    } catch (err) {
      setCoverNotice(formatUploadError(err));
    } finally {
      setMediaUploadTarget("");
      event.target.value = "";
    }
  };

  const handlePrintMandala = () => {
    const cleanup = () => document.body.classList.remove("printMandalaOnly");

    document.body.classList.add("printMandalaOnly");
    window.addEventListener("afterprint", cleanup, { once: true });
    window.print();
    window.setTimeout(cleanup, 1200);
  };

  const handleMagicLink = async (event) => {
    event.preventDefault();
    setMessage("");
    setError("");

    try {
      await sendMagicLink(email.trim());
      setMessage("Письмо для входа отправлено. Откройте ссылку из письма на этом устройстве.");
    } catch (err) {
      setError(err.message || "Не удалось отправить ссылку для входа.");
    }
  };

  const handleGoogleLogin = () => {
    setMessage("");
    setError("");

    try {
      const debugAuth = new URLSearchParams(window.location.search).get("debugAuth") === "1";
      signInWithGoogle(debugAuth ? "/profile?debugAuth=1" : "/profile");
    } catch (err) {
      setError(err.message || "Не удалось начать вход через Google.");
    }
  };

  const handleMaterialCategorySelect = (categoryValue) => {
    setActiveMaterialCategory(categoryValue);
    const category = MATERIAL_CATEGORY_TABS.find((item) => item.value === categoryValue) || MATERIAL_CATEGORY_TABS[0];
    const firstSubcategory = category.subcategories[0];
    setActiveMaterialSubcategory(firstSubcategory?.value || "");
    setActiveMaterialThirdLevel(firstSubcategory?.thirdLevels?.[0]?.value || "");
    setIsMaterialThirdLevelPanelOpen(Boolean(firstSubcategory?.thirdLevels?.length));

    if (categoryValue === "artifacts" || categoryValue === "talismans") {
      updateMaterialField("type", "artifact");
    } else if (categoryValue === "dao-ri" || categoryValue === "god-channels" || categoryValue === "channels") {
      updateMaterialField("type", "mandala");
    }

    if (categoryValue === "dao-ri" && firstSubcategory?.steps?.[0]?.id) {
      updateMaterialField("step_id", firstSubcategory.steps[0].id);
    }
  };

  const handleMaterialSubcategorySelect = (subcategory) => {
    setActiveMaterialSubcategory(subcategory.value);
    setActiveMaterialThirdLevel(subcategory?.thirdLevels?.[0]?.value || "");
    setIsMaterialThirdLevelPanelOpen(Boolean(subcategory?.thirdLevels?.length));
    if (activeMaterialCategory === "dao-ri" && subcategory.steps?.[0]?.id) {
      updateMaterialField("step_id", subcategory.steps[0].id);
    }
  };

  const handleMaterialThirdLevelSelect = (thirdLevel) => {
    setActiveMaterialThirdLevel(thirdLevel.value);
  };

  const handleDaoStepSelect = (stepId) => {
    updateMaterialField("step_id", stepId);
  };

  const handlePickerCategorySelect = (categoryValue) => {
    setActivePickerCategory(categoryValue);
    const category = SOURCE_LIBRARY_CATEGORIES.find((item) => item.value === categoryValue) || SOURCE_LIBRARY_CATEGORIES[0];
    const firstSubcategory = category.subcategories[0];
    setActivePickerSubcategory(firstSubcategory?.value || "");
    setActivePickerThirdLevel(firstSubcategory?.thirdLevels?.[0]?.value || "");
  };

  const handlePickerSubcategorySelect = (subcategory) => {
    setActivePickerSubcategory(subcategory.value);
    setActivePickerThirdLevel(subcategory?.thirdLevels?.[0]?.value || "");
  };

  const handlePickerThirdLevelSelect = (thirdLevel) => {
    setActivePickerThirdLevel(thirdLevel.value);
  };

  const handleSave = async (requestedStatus) => {
    setMessage("");
    setError("");

    try {
      const nextStatus = requestedStatus || (profile.status === "approved" ? "pending" : profile.status || "draft");
      const isApprovedResubmission = profile.status === "approved" && nextStatus === "pending";
      const payload = {
        ...profile,
        user_id: user.id,
        status: nextStatus,
        updated_at: new Date().toISOString()
      };

      const saved = nextStatus === "pending"
        ? await submitOwnProfile(payload, session)
        : await saveOwnProfile(payload, session);

      setProfile(normalizeProfile(saved, user));
      setMessage(isApprovedResubmission ? "Профиль обновлён и отправлен на повторную модерацию." : nextStatus === "pending" ? "Профиль отправлен на модерацию." : "Профиль сохранён.");
    } catch (err) {
      setError(err.message || "Не удалось сохранить профиль.");
    }
  };

  const handleMaterialSave = async (nextStatus = "draft") => {
    setMessage("");
    setError("");

    if (!profile?.id) {
      setError("Сначала сохраните профиль мастера, затем добавляйте мандалы и материалы.");
      return;
    }

    if (!materialForm.title.trim()) {
      setError("Добавьте название мандалы или материала.");
      return;
    }

    try {
      let nextForm = materialForm;
      if (materialFile) {
        setMediaUploadTarget("material");
        setFileNotice("Загружаю фото мандалы...");
        const uploaded = await uploadProfileMedia(materialFile, { profileId: profile.id, kind: "material" }, session);
        nextForm = { ...materialForm, image_url: uploaded.ref };
      }

      const saved = await createOwnMaterial(buildMaterialPayload(nextForm, profile.id, nextStatus), session);
      setMaterials((current) => [saved, ...current].filter(Boolean));
      setMaterialForm((current) => ({
        ...EMPTY_MATERIAL,
        type: current.type,
        step_id: current.step_id,
        step_title: current.step_title,
        setting_title: current.setting_title,
        setting_index: current.setting_index
      }));
      setMaterialFile(null);
      setMaterialFilePreview("");
      setFileNotice("");
      setMessage(nextStatus === "pending" ? "Материал отправлен на модерацию." : "Материал сохранён.");
    } catch (err) {
      setError(err.message || "Не удалось сохранить материал.");
    } finally {
      setMediaUploadTarget("");
    }
  };

  const handleClientPhotoSave = async ({ selectSaved = false, closePicker = false, fileOverride = null } = {}) => {
    setMessage("");
    setError("");
    setMediaStatus("");

    if (!profile?.id) {
      setError("Сначала сохраните профиль мастера.");
      return;
    }

    try {
      let mediaPayload = {};
      let uploadedPreviewUrl = "";
      let uploadedStorageRef = "";
      const uploadFile = fileOverride || clientPhotoForm.file;
      if (uploadFile) {
        setMediaUploadTarget("client-goal");
        setMediaStatus("Загружаю фото клиента / цели...");
        const uploaded = await uploadProfileMedia(uploadFile, { profileId: profile.id, kind: "client-goal" }, session);
        uploadedPreviewUrl = uploaded.signedUrl || "";
        uploadedStorageRef = uploaded.ref || "";
        mediaPayload = {
          image_bucket: uploaded.bucket,
          image_path: uploaded.path,
          mime_type: uploaded.metadata.mimeType,
          file_size_bytes: uploaded.metadata.size
        };
      }

      const saved = await createClientGoalPhoto({
        ...clientPhotoForm,
        title: clientPhotoForm.title || fileOverride?.name?.replace(/\.[^.]+$/, "") || "Фото клиента / цели",
        image_url: fileOverride ? "" : clientPhotoForm.image_url,
        ...mediaPayload,
        profile_id: profile.id,
        file: undefined
      }, accountPlan, session);
      const savedForUi = uploadedPreviewUrl && !previewImageUrl(saved?.display_url, saved?.signed_url, saved?.image_url, saved?.image_ref)
        ? {
          ...saved,
          image_ref: saved?.image_ref || uploadedStorageRef,
          display_url: uploadedPreviewUrl,
          image_url: uploadedPreviewUrl
        }
        : saved;
      if (uploadedStorageRef && uploadedPreviewUrl) {
        setObjectImageUrls((current) => ({ ...current, [uploadedStorageRef]: uploadedPreviewUrl }));
      }
      setClientGoalPhotos((current) => [savedForUi, ...current].filter(Boolean));
      setSelectedCentralPhotoId((current) => (selectSaved ? savedForUi?.id || "" : current || savedForUi?.id || ""));
      if (selectSaved && (savedForUi?.image_ref || uploadedStorageRef)) {
        setSelectedCentralImageRef(savedForUi.image_ref || uploadedStorageRef);
      }
      setClientPhotoForm({ title: "", image_url: "", notes: "", file: null });
      if (closePicker) closeImagePicker();
      setMediaStatus("Фото загружено и сохранено.");
      setMessage(selectSaved ? "Фото клиента / цели сохранено и выбрано в центр." : "Фото клиента / цели сохранено.");
      return savedForUi;
    } catch (err) {
      setMediaStatus(formatUploadError(err));
      setError(err.message || "Не удалось сохранить фото клиента / цели.");
      return null;
    } finally {
      setMediaUploadTarget("");
    }
  };

  const handleClientPhotoFile = (event) => {
    const file = event.target.files?.[0] || null;
    if (!file) return;

    try {
      validateProfileMediaFile(file);
      setClientPhotoForm((current) => ({ ...current, file }));
      setMediaStatus(`Фото «${file.name}» готово к загрузке.`);
    } catch (err) {
      setClientPhotoForm((current) => ({ ...current, file: null }));
      setMediaStatus(formatUploadError(err));
      event.target.value = "";
    }
  };

  const handlePickerDirectFileUpload = async (event) => {
    const file = event.target.files?.[0] || null;
    event.target.value = "";
    if (!file) return;

    if (activePickerCategory === "client-goals") {
      await handleClientPhotoSave({ selectSaved: true, closePicker: false, fileOverride: file });
      return;
    }

    setMessage("");
    setError("");
    setMediaStatus("");

    if (!profile?.id) {
      setError("Сначала сохраните профиль мастера.");
      return;
    }

    try {
      validateProfileMediaFile(file);
      const title = file.name?.replace(/\.[^.]+$/, "") || "Фото";
      const categoryLabel = activePickerCategoryData?.label || "Материал";
      const subcategoryLabel = activePickerSubcategoryData?.label || "";
      const thirdLabel = activePickerThirdLevelData?.label || "";
      setMediaUploadTarget(`picker-${activePickerCategory}`);

      if (activePickerCategory === "god-channels") {
        const traditionId = activePickerSubcategoryData?.traditionId || activePickerSubcategoryData?.value || selectedTradition?.id || "";
        const tradition = mysteryTraditions.find((item) => item.id === traditionId) || selectedTradition;
        if (!tradition?.id) throw new Error("Выберите традицию для загрузки.");

        const uploaded = await uploadProfileMedia(file, { profileId: profile.id, kind: "tradition", traditionId: tradition.id }, session);
        const saved = await createTraditionAsset({
          profile_id: profile.id,
          tradition_id: tradition.id,
          tradition_title: tradition.title,
          title,
          image_url: uploaded.ref,
          image_bucket: uploaded.bucket,
          image_path: uploaded.path,
          mime_type: uploaded.metadata.mimeType,
          file_size_bytes: uploaded.metadata.size,
          notes: [subcategoryLabel, thirdLabel].filter(Boolean).join(" · "),
          file: undefined
        }, session);
        const savedForUi = {
          ...saved,
          image_ref: saved?.image_ref || uploaded.ref,
          display_url: saved?.display_url || uploaded.signedUrl,
          image_url: saved?.image_url || uploaded.ref
        };
        setTraditionAssets((current) => [savedForUi, ...current].filter(Boolean));
        setObjectImageUrls((current) => ({ ...current, [uploaded.ref]: uploaded.signedUrl }));
        setSelectedCentralPhotoId("");
        setSelectedCentralImageRef(uploaded.ref);
        setMediaStatus("Фото загружено в Мистерии.");
        setMessage("Фото загружено в выбранную традицию.");
        return;
      }

      const uploaded = await uploadProfileMedia(file, { profileId: profile.id, kind: "material" }, session);
      const selectedStepId = activePickerCategory === "dao-ri" ? (activePickerThirdLevelData?.stepId || activePickerThirdLevelData?.value || activePickerSubcategoryData?.steps?.[0]?.id || "") : materialForm.step_id;
      const selectedStep = stepOptions.find((step) => step.id === selectedStepId) || firstStep;
      const firstSetting = settingsForStep(selectedStep?.id)?.[0] || null;
      const materialType = ["talismans", "artifacts"].includes(activePickerCategory) ? "artifact" : "mandala";
      const nextForm = {
        ...EMPTY_MATERIAL,
        type: materialType,
        title,
        description: [categoryLabel, subcategoryLabel, thirdLabel].filter(Boolean).join(" · "),
        image_url: uploaded.ref,
        step_id: selectedStep?.id || materialForm.step_id || "",
        step_title: selectedStep?.title || materialForm.step_title || "",
        setting_title: materialForm.setting_title || firstSetting?.title || "",
        setting_index: firstSetting ? 1 : null
      };
      const saved = await createOwnMaterial(buildMaterialPayload(nextForm, profile.id, "draft"), session);
      const savedForUi = {
        ...saved,
        display_url: saved?.display_url || uploaded.signedUrl,
        image_url: saved?.image_url || uploaded.ref
      };
      setMaterials((current) => [savedForUi, ...current].filter(Boolean));
      setObjectImageUrls((current) => ({ ...current, [uploaded.ref]: uploaded.signedUrl }));
      setSelectedCentralPhotoId("");
      setSelectedCentralImageRef(uploaded.ref);
      setMediaStatus(`Фото загружено в ${categoryLabel}.`);
      setMessage(`Фото загружено в ${categoryLabel}.`);
    } catch (err) {
      setMediaStatus(formatUploadError(err));
      setError(err.message || "Не удалось загрузить фото в выбранный раздел.");
    } finally {
      setMediaUploadTarget("");
    }
  };


  const handleTraditionAssetSave = async () => {
    setMessage("");
    setError("");
    setMediaStatus("");

    if (!profile?.id || !selectedTradition) {
      setError("Сначала сохраните профиль и выберите традицию.");
      return;
    }

    try {
      let mediaPayload = {};
      if (traditionAssetForm.file) {
        setMediaUploadTarget("tradition");
        setMediaStatus("Загружаю образ традиции...");
        const uploaded = await uploadProfileMedia(traditionAssetForm.file, {
          profileId: profile.id,
          kind: "tradition",
          traditionId: selectedTradition.id
        }, session);
        mediaPayload = {
          image_bucket: uploaded.bucket,
          image_path: uploaded.path,
          mime_type: uploaded.metadata.mimeType,
          file_size_bytes: uploaded.metadata.size
        };
      }

      const saved = await createTraditionAsset({
        ...traditionAssetForm,
        ...mediaPayload,
        profile_id: profile.id,
        tradition_id: selectedTradition.id,
        tradition_title: selectedTradition.title,
        file: undefined
      }, session);
      setTraditionAssets((current) => [saved, ...current].filter(Boolean));
      setTraditionAssetForm({ title: "", image_url: "", notes: "", file: null });
      setMediaStatus("Образ загружен и сохранён.");
      setMessage("Образ традиции сохранён.");
    } catch (err) {
      setMediaStatus(formatUploadError(err));
      setError(err.message || "Не удалось сохранить образ традиции.");
    } finally {
      setMediaUploadTarget("");
    }
  };

  const handleTraditionAssetFile = (event) => {
    const file = event.target.files?.[0] || null;
    if (!file) return;

    try {
      validateProfileMediaFile(file);
      setTraditionAssetForm((current) => ({ ...current, file }));
      setMediaStatus(`Образ «${file.name}» готов к загрузке.`);
    } catch (err) {
      setTraditionAssetForm((current) => ({ ...current, file: null }));
      setMediaStatus(formatUploadError(err));
      event.target.value = "";
    }
  };

  const closeImagePicker = () => {
    setImagePickerContext({ mode: "", slotId: "" });
    setIsClientPhotoUploadOpen(false);
  };

  const openClientPhotoPicker = () => {
    handlePickerCategorySelect("client-goals");
    setActivePickerSubcategory("client-goals");
    setActivePickerThirdLevel("");
    setIsClientPhotoUploadOpen(false);
    setImagePickerContext({ mode: "center", slotId: "" });
  };

  const openClientPhotoUpload = () => {
    handlePickerCategorySelect("client-goals");
    setActivePickerSubcategory("client-goals");
    setActivePickerThirdLevel("");
    setIsClientPhotoUploadOpen(true);
    setImagePickerContext({ mode: "center", slotId: "" });
  };

  const openCoverPicker = (layer = activeCoverLayer) => {
    handlePickerCategorySelect("covers");
    setActivePickerSubcategory("cover");
    setActivePickerThirdLevel("");
    setImagePickerContext({ mode: "cover", slotId: layer });
  };

  const chooseCentralPhoto = (photoId) => {
    setSelectedCentralPhotoId(photoId);
    setSelectedCentralImageRef("");
    closeImagePicker();
  };

  const choosePickerOption = (option) => {
    if (imagePickerContext.mode === "center") {
      chooseCenterPickerImage(option);
      return;
    }

    if (imagePickerContext.mode === "cover") {
      chooseCoverPickerImage(option);
      return;
    }

    chooseObjectPickerImage(option);
  };

  const chooseCenterPickerImage = async (option) => {
    if (option?.src && option.displaySrc) {
      setObjectImageUrls((current) => ({ ...current, [option.src]: option.displaySrc }));
    }

    if (option?.kind === "client-photo" && option.photoId) {
      chooseCentralPhoto(option.photoId);
      return;
    }

    if (!option?.src) return;

    setSelectedCentralPhotoId("");
    setSelectedCentralImageRef(option.src);
    setMessage("Изображение выбрано в центр мандалы.");
    closeImagePicker();
  };

  const chooseCoverPickerImage = (option) => {
    const layer = imagePickerContext.slotId === "outer" ? "outer" : "inner";

    if (option?.id === "picker-cover-no-cover" || option?.id === "no-cover" || option?.kind === "none") {
      if (layer === "outer") setSelectedOuterCoverId("no-cover");
      else setSelectedCoverId("no-cover");
      closeImagePicker();
      return;
    }

    if (!option?.src) return;

    const existingCover = coverVariants.find((cover) =>
      option.id === `picker-cover-${cover.id}` || cover.id === option.id || cover.src === option.src
    );

    if (existingCover) {
      if (layer === "outer") setSelectedOuterCoverId(existingCover.id);
      else setSelectedCoverId(existingCover.id);
    } else if (layer === "outer") {
      setCustomOuterCoverImage(option.src);
      setObjectImageUrls((current) => ({ ...current, [option.src]: option.displaySrc || option.src }));
      setSelectedOuterCoverId("custom-outer-cover");
    } else {
      setCustomCoverImage(option.src);
      setObjectImageUrls((current) => ({ ...current, [option.src]: option.displaySrc || option.src }));
      setSelectedCoverId("custom-cover");
    }

    closeImagePicker();
  };

  const chooseObjectPickerImage = (option) => {
    if (!imagePickerContext.slotId || !option?.src) return;
    setObjectImage(imagePickerContext.slotId, option.src, option.displaySrc || option.src);
    closeImagePicker();
  };


  const handleDeleteSavedClientPhoto = async (photo, event) => {
    event?.stopPropagation?.();
    event?.preventDefault?.();

    if (!photo?.photoId || !profile?.id) return;
    const confirmed = window.confirm("Удалить фото из базы?");
    if (!confirmed) return;

    setMessage("");
    setError("");

    try {
      await deleteClientGoalPhoto(photo.photoId, profile.id, session);
      setClientGoalPhotos((current) => current.filter((item) => item.id !== photo.photoId));
      if (selectedCentralPhotoId === photo.photoId) setSelectedCentralPhotoId("");
      setMessage("Фото удалено из базы.");
    } catch (err) {
      setError(err.message || "Не удалось удалить фото.");
    }
  };

  const renderCenterPhotoButton = (className) => (
    <button
      className={className + (centerImage ? " hasImage" : "")}
      style={imageStyle(centerImage)}
      onClick={openClientPhotoPicker}
      title="Фото клиента / цели"
      type="button"
      aria-label="Фото клиента / цели"
    >
      {!centerImage && <span>Фото клиента / цели</span>}
      </button>
  );

  const renderCenterPhotoWithMode = (className) => renderCenterPhotoButton(className);

  const renderChessSlot = (slot, index, extraClassName = "", extraStyle = {}) => {
    const slotImage = objectImages[slot.id];
    const toneClass = (Number(slot.row || 0) + Number(slot.col || index || 0)) % 2 === 0 ? "is-dark" : "is-light";

    return (
      <button
        className={`power-place-chess__slot ${toneClass} ${extraClassName}${slotImage ? " hasImage" : ""}${selectedObjectSlotId === slot.id ? " selected" : ""}`}
        key={slot.id}
        onClick={() => openObjectSlot(slot.id)}
        style={{ ...imageStyleFor(slotImage), ...extraStyle }}
        type="button"
        title={slot.label}
        aria-label={`Выбрать ${slot.label.toLowerCase()}`}
      >
        {!slotImage && <span>{index + 1}</span>}
      </button>
    );
  };

  const handleDownloadMandala = () => {
    const objectRefs = persistableObjectRefs(objectImages, activeObjectSlots.map((slot) => slot.id));
    const objectRows = activeObjectSlots.map((slot) => {
      const ref = objectRefs[slot.id] || objectImages[slot.id] || "";
      const display = displayImageUrl(ref);
      return `<li><b>${escapeHtml(slot.label)}</b>: ${ref ? escapeHtml(ref) : "пусто"}${display && display !== ref ? `<br><small>${escapeHtml(display)}</small>` : ""}</li>`;
    }).join("");
    const centerRef = selectedCentralImageRef || selectedCentralPhoto?.image_ref || selectedCentralPhoto?.image_url || "";
    const centerDisplay = selectedCentralImageRef
      ? displayImageUrl(selectedCentralImageRef)
      : (selectedCentralPhoto?.display_url || selectedCentralPhoto?.image_url || "");
    const coverRef = selectedCover ? {
      id: selectedCover.id,
      label: selectedCover.label,
      type: selectedCover.type || "placeholder",
      src: selectedCover.src || ""
    } : {};
    const html = `<!doctype html>
<html lang="ru">
<head>
  <meta charset="utf-8">
  <title>${escapeHtml(compositionTitle || "Место силы")}</title>
  <style>
    body{font-family:Arial,sans-serif;max-width:880px;margin:32px auto;padding:0 18px;color:#2f2418;background:#fffaf0}
    h1{margin:0 0 8px} section{border:1px solid #d2aa63;border-radius:14px;padding:16px;margin:14px 0;background:#fffdf8}
    img{max-width:260px;border-radius:16px;border:1px solid #d2aa63} li{margin:8px 0;overflow-wrap:anywhere} small{color:#6f604d}
  </style>
</head>
<body>
  <h1>${escapeHtml(compositionTitle || "Место силы")}</h1>
  <section>
    <p><b>Бренд:</b> Mentalica</p>
    <p><b>Режим:</b> ${escapeHtml(RESOURCE_COMPARISON_MODES.find((item) => item.value === resourceComparisonMode)?.label || "Фото цели")}</p>
    <p><b>Центральное изображение:</b> ${centerRef ? escapeHtml(centerRef) : "не выбрано"}</p>
    ${centerDisplay && isImagePreview(centerDisplay) ? `<img src="${escapeHtml(centerDisplay)}" alt="Центральное изображение">` : ""}
  </section>
  <section>
    <h2>Объекты</h2>
    <ul>${objectRows || "<li>Нет объектов</li>"}</ul>
  </section>
  <section>
    <h2>Подложка</h2>
    <pre>${escapeHtml(JSON.stringify(coverRef, null, 2))}</pre>
  </section>
  <section>
    <h2>Сравнение ресурса</h2>
    <p><b>Ресурс без мандалы:</b> ${escapeHtml(resourceWithoutMandalaComment || "—")}</p>
    <p><b>Ресурс с мандалой:</b> ${escapeHtml(resourceWithMandalaComment || "—")}</p>
  </section>
</body>
</html>`;
    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const href = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = href;
    link.download = `${safeFilename(compositionTitle || "power-place")}.html`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(href), 1000);
  };

  const handleCompositionSave = async () => {
    setMessage("");
    setError("");

    if (!profile?.id) {
      setError("Сначала сохраните профиль мастера.");
      return;
    }

    const hasCentralImage = Boolean(selectedCentralPhotoId || selectedCentralImageRef || centerImage);
    if (!hasCentralImage) {
      setError("Выберите или загрузите центральное изображение.");
      return;
    }

    try {
      const payload = buildPowerPlacePayload();
      const saved = selectedCompositionId
        ? await updatePowerPlaceComposition(selectedCompositionId, payload, session)
        : await createPowerPlaceComposition(payload, accountPlan, session);

      setPowerPlaceCompositions((current) => {
        const withoutSaved = current.filter((item) => item.id !== saved?.id);
        return [saved, ...withoutSaved].filter(Boolean);
      });
      setSelectedCompositionId(saved?.id || "");
      setCompositionTitle(saved?.title || compositionTitle);
      setMessage(selectedCompositionId ? "Место силы обновлено." : "Место силы сохранено.");
      setPowerPlaceServiceDraft({
        composition_id: saved?.id || selectedCompositionId || "",
        title: saved?.title || compositionTitle || "Мандала Места Силы",
        image_url: saved?.cover_ref?.src || selectedCover?.src || customCoverImage || centerImage || "",
        template_image_url: saved?.cover_ref?.src || selectedCover?.src || customCoverImage || centerImage || "",
        image_bucket: saved?.cover_ref?.bucket || null,
        image_path: saved?.cover_ref?.path || null
      });
    } catch (err) {
      setError(err.message || "Не удалось сохранить место силы.");
    }
  };

  const handleLogout = () => {
    resetProfileSessionState("Вход сброшен. Можно войти заново.");
  };

  const handleRetryBootstrap = () => {
    setLoadingTimedOut(false);
    setError("");
    setMessage("");
    setAuthStatus("loading");
    setBootstrapRetryKey((current) => current + 1);
  };

  if (!supabaseEnv.isConfigured) {
    return (
      <CabinetShell title="Кабинет мастера" onNavigateHome={onNavigateHome} onNavigateMasters={onNavigateMasters}>
        <div className="cabinetNotice">
          <b>Кабинет мастера подготовлен, но Supabase ещё не подключён.</b>
          <p>Нужно настроить env names в Vercel: VITE_SUPABASE_URL и VITE_SUPABASE_ANON_KEY. Значения не должны храниться в repo.</p>
          <a className="cabinetGhost profileLiteFallbackLink" href="/profile-lite">
            Открыть простой кабинет
          </a>
        </div>
      </CabinetShell>
    );
  }

  const profileEditor = (
    <div className="profileTabContent">
      <form className="cabinetCard profileForm" onSubmit={(event) => { event.preventDefault(); handleSave(); }}>
        <div className="cabinetFormHeader">
          <div>
            <p className="cabinetEyebrow">Профиль мастера</p>
            <h2>{profile.display_name || "Новый профиль"}</h2>
            {profile?.id && <small className="cabinetPublicId">ID: {formatCabinetId(profile.id)}</small>}
          </div>
          <span className={`cabinetStatus status-${profile.status || "draft"}`}>{statusText}</span>
        </div>

        <label>
          Имя мастера
          <input value={profile.display_name} onChange={(event) => updateField("display_name", event.target.value)} placeholder="Например: Андрей Ли" required />
        </label>

        <label>
          Описание
          <textarea value={profile.bio} onChange={(event) => updateField("bio", event.target.value)} placeholder="Кратко опишите практики, подход и чем вы можете быть полезны ученикам." rows={6} />
        </label>

        <div className="cabinetTwoColumns">
          <label>
            Город
            <input value={profile.city || ""} onChange={(event) => updateField("city", event.target.value)} placeholder="Город" />
          </label>
          <label>
            Страна
            <input value={profile.country || ""} onChange={(event) => updateField("country", event.target.value)} placeholder="Страна" />
          </label>
        </div>

        <div className="cabinetTwoColumns">
          <label>
            Telegram
            <input value={profile.telegram || ""} onChange={(event) => updateField("telegram", event.target.value)} placeholder="@username или ссылка" />
          </label>
          <label>
            Сайт
            <input value={profile.website || ""} onChange={(event) => updateField("website", event.target.value)} placeholder="https://..." />
          </label>
        </div>

        <label>
          Аватар / фото URL
          <input value={profile.avatar_url || ""} onChange={(event) => updateField("avatar_url", event.target.value)} placeholder="https://..." />
        </label>

        <label>
          План кабинета
          <select value={accountPlan} onChange={(event) => updateField("account_plan", event.target.value)}>
            {ACCOUNT_PLANS.map((plan) => (
              <option key={plan.value} value={plan.value}>{plan.label}</option>
            ))}
          </select>
        </label>
        <p className="powerPlanNote">Start: 7 мест силы и 10 фото клиентов. Pro: 20 мест силы и 30 фото. Биллинг: needs verification.</p>

        <div className="cabinetActions">
          <button className="cabinetPrimary" type="submit">{profile.status === "approved" ? "Сохранить и отправить на модерацию" : "Сохранить черновик"}</button>
          <button className="cabinetSecondary" type="button" onClick={() => handleSave("pending")}>Отправить на модерацию</button>
          <button className="cabinetGhost" type="button" onClick={handleLogout}>Выйти</button>
        </div>
      </form>

      <aside className="cabinetCard cabinetPreview">
        <p className="cabinetEyebrow">Как это будет выглядеть</p>
        <div className="masterPreviewImage" style={profile.avatar_url ? { backgroundImage: `url(${profile.avatar_url})` } : undefined}>◎</div>
        <h3>{profile.display_name || "Имя мастера"}</h3>
        <p>{profile.bio || "Здесь появится описание мастера, практик, мандал и артефактов."}</p>
        <small>{[profile.city, profile.country].filter(Boolean).join(", ") || "Локация не указана"}</small>
      </aside>
    </div>
  );

const resourceComparisonPanel = (
  <div className="resourceComparisonPanel">
    <div className="resourceComparisonModeRail">
      <span>Режим сравнения</span>
      <div className="resourceModeToggle resourceModeToggleRail" aria-label="Сравнение ресурса">
        {RESOURCE_COMPARISON_MODES.map((mode) => (
          <button
            className={resourceComparisonMode === mode.value ? "active" : ""}
            key={mode.value}
            onClick={() => setResourceComparisonMode(mode.value)}
            type="button"
          >
            {mode.label}
          </button>
        ))}
      </div>
    </div>
    <label className="resourceField">
      <textarea
        className="resourceFieldInput"
        rows="1"
        value={resourceWithoutMandalaComment}
        onChange={(event) => setResourceWithoutMandalaComment(event.target.value)}
        placeholder="Кратко опишите ресурс без мандалы"
      />
    </label>
    <label className="resourceField">
      <textarea
        className="resourceFieldInput"
        rows="1"
        value={resourceWithMandalaComment}
        onChange={(event) => setResourceWithMandalaComment(event.target.value)}
        placeholder="Кратко опишите ресурс с мандалой"
      />
    </label>
  </div>
);

  const resourceModeToggle = (
    <div className="resourceModeToggle" aria-label="Сравнение ресурса">
      {RESOURCE_COMPARISON_MODES.map((mode) => (
        <button
          className={resourceComparisonMode === mode.value ? "active" : ""}
          key={mode.value}
          onClick={() => setResourceComparisonMode(mode.value)}
          type="button"
        >
          {mode.label}
        </button>
      ))}
    </div>
  );

  const renderCenterPhotoFrame = (className) => (
    <div
      className={className + (centerImage ? " hasImage" : "")}
      style={imageStyleFor(centerImage)}
    >
      {!centerImage && <span>Фото клиента / цели</span>}
    </div>
  );

  return (
    <CabinetShell title="Кабинет мастера" onNavigateHome={onNavigateHome} onNavigateMasters={onNavigateMasters}>
      {shouldShowInitialLoading && (
        <div className="cabinetNotice">
          <p>Загружаю кабинет...</p>
          <a className="cabinetSecondary" href="/profile?resetProfileSession=1">
            Войти заново / сбросить вход
          </a>
          <a className="cabinetGhost profileLiteFallbackLink" href="/profile-lite">
            Открыть простой кабинет
          </a>
        </div>
      )}

      {shouldShowRecovery && (
        <div className="cabinetNotice cabinetRecovery">
          <p>Не удалось дождаться загрузки кабинета. Проверьте соединение и попробуйте снова.</p>
          {error && <div className="cabinetError">{error}</div>}
          <div className="cabinetActions">
            <a className="cabinetPrimary" href="/profile">Повторить загрузку</a>
            <a className="cabinetSecondary" href="/profile?resetProfileSession=1">Войти заново</a>
            <a className="cabinetGhost" href="/profile-lite">Открыть простой кабинет</a>
          </div>
        </div>
      )}

      {shouldShowLogin && (
        <form className="cabinetCard authCard" onSubmit={handleMagicLink}>
          <p className="cabinetEyebrow">Вход мастера</p>
          <h2>Войдите, чтобы создать профиль мастера</h2>
          <p>Войдите через Google или используйте email-ссылку. После входа можно заполнить профиль и отправить его на модерацию.</p>
          {error && <div className="cabinetError">{error}</div>}
          {message && <div className="cabinetSuccess">{message}</div>}
          <button className="cabinetGoogle" type="button" onClick={handleGoogleLogin}>Войти через Google</button>
          <a className="cabinetGhost profileLiteFallbackLink" href="/profile-lite">
            Открыть простой кабинет
          </a>
          <div className="authDivider">или войдите по email</div>
          <label>
            Email
            <input value={email} onChange={(event) => setEmail(event.target.value)} type="email" required placeholder="you@example.com" />
          </label>
          <button className="cabinetPrimary" type="submit">Отправить ссылку для входа</button>
        </form>
      )}

      {shouldShowCabinet && (
        <div className="cabinetGrid">
          <section className={`mandalaWorkspace ${activeTopTab === "power-place" ? "powerPlaceMode" : ""}`}>
            <div className="mandalaHero">
              <div className="mandalaHeroSeal">♣</div>
              <div>
                <p className="cabinetEyebrow">Рабочее место мастера</p>
                <h2>Мастерская мандал</h2>
                <p>Создавайте мандалы, артефакты и практики по ступеням Рейки Иггдрасиль. Выберите поток, поместите мандалу на алтарь и сохраните материал.</p>
              </div>
              <div className="mandalaHeroStats" aria-label="Статусы материалов">
                <span><b>{materialCounts.draft}</b> Черновики</span>
                <span><b>{materialCounts.pending}</b> На модерации</span>
                <span><b>{materialCounts.approved}</b> Опубликовано</span>
              </div>
            </div>

            {!profile?.id && (
              <div className="mandalaGuide">
                Сначала сохраните профиль мастера. После этого можно добавлять мандалы, артефакты и практики к ступеням и настройкам.
              </div>
            )}

            <div className="workspaceSwitches">
              <div className="workspaceTabs" role="tablist" aria-label="Основной раздел кабинета">
                <button className={activeTopTab === "power-place" ? "active" : ""} type="button" onClick={() => setActiveTopTab("power-place")}>Место силы</button>
                <button className={activeTopTab === "mandalas" ? "active" : ""} type="button" onClick={() => setActiveTopTab("mandalas")}>Мои мандалы</button>
                <button className={activeTopTab === "services" ? "active" : ""} type="button" onClick={() => { setActiveTopTab("services"); setTemplateServicesTab("services"); }}>Услуги</button>
                <button className={activeTopTab === "orders" ? "active" : ""} type="button" onClick={() => { setActiveTopTab("orders"); setTemplateServicesTab("orders"); }}>Заявки</button>
                <button className={activeTopTab === "chats" ? "active" : ""} type="button" onClick={() => setActiveTopTab("chats")}>Чаты</button>
                <button className={activeTopTab === "profile" ? "active" : ""} type="button" onClick={() => setActiveTopTab("profile")}>Профиль</button>
              </div>
            </div>

            {authStatus === "loading" && !loadingTimedOut && <div className="cabinetNotice">Загружаю кабинет...</div>}
            {secondaryDataNotice && <div className="cabinetNotice cabinetSecondaryDataWarning">{secondaryDataNotice}</div>}
            {error && <div className="cabinetError">{error}</div>}
            {message && <div className="cabinetSuccess">{message}</div>}

            <div className="workspaceMainColumns">
            <aside className="mandalaModeSidebar">
              {(activeTopTab === "power-place" || activeTopTab === "mandalas") ? (
                <>
                  <p className="cabinetEyebrow">Источники силы</p>
                  <h3>Источники силы</h3>
                  <button className="powerAddImageButton" type="button" onClick={() => setActiveTopTab("mandalas")}>
                    Добавить мандалу
                  </button>
                  <div className="powerLibrarySidebar" aria-label="Единый источник материалов для мест силы">
                    <div className="powerLibraryFilter">
                      <label className="powerLibrarySelectLabel">
                        Группа
                        <select value={activeMaterialCategory} onChange={(event) => handleMaterialCategorySelect(event.target.value)}>
                          {MATERIAL_CATEGORY_TABS.map((category) => (
                            <option key={category.value} value={category.value}>{category.label}</option>
                          ))}
                        </select>
                      </label>

                      {activeMaterialCategoryData.subcategories.length > 0 && (
                        <label className="powerLibrarySelectLabel">
                          Категория
                          <select
                            value={activeMaterialSubcategory}
                            onChange={(event) => {
                              const nextSubcategory = activeMaterialCategoryData.subcategories.find((subcategory) => subcategory.value === event.target.value);
                              if (nextSubcategory) handleMaterialSubcategorySelect(nextSubcategory);
                            }}
                          >
                            {activeMaterialCategoryData.subcategories.map((subcategory) => (
                              <option key={subcategory.value} value={subcategory.value}>{subcategory.displayLabel || subcategory.label}</option>
                            ))}
                          </select>
                        </label>
                      )}

                      {activeMaterialSubcategoryData?.thirdLevels?.length > 0 && (
                        <div className="powerLibrarySubcategoryButtons">
                          {activeMaterialSubcategoryData.thirdLevels.map((thirdLevel) => (
                            <button
                              className={activeMaterialThirdLevel === thirdLevel.value ? "active" : ""}
                              key={thirdLevel.value}
                              onClick={() => handleMaterialThirdLevelSelect(thirdLevel)}
                              type="button"
                            >
                              {thirdLevel.label}
                            </button>
                          ))}
                        </div>
                      )}

                      {activeMaterialCategory === "dao-ri" && activeMaterialSubcategoryData?.steps?.length > 0 && (
                        <div className="powerLibrarySubcategoryButtons">
                          {activeMaterialSubcategoryData.steps.map((step) => (
                            <button
                              className={materialForm.step_id === step.id ? "active" : ""}
                              key={step.id}
                              onClick={() => handleDaoStepSelect(step.id)}
                              type="button"
                            >
                              {step.label} {step.number}: {step.title}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="powerSavedImageList" aria-label="Сохранённые изображения">
                      <div className="powerSavedImageHeader">
                        <b>Сохранённые изображения</b>
                        <small>{selectedObjectSlot ? `Позиция: ${selectedObjectSlot.label}` : "Выберите позицию на схеме"}</small>
                      </div>
                      {filteredSavedPowerImages.map((item) => (
                        <div className="powerSavedImageItem" key={item.id}>
                          <button className="powerSavedImageCard" type="button" onClick={() => handleLibraryImageSelect(item)}>
                            <span className="powerSavedImageThumb" style={imageStyle(displayImageUrl(item.displaySrc || item.src))} />
                            <b>{item.title}</b>
                            <small>{[item.source, item.status].filter(Boolean).join(" · ")}</small>
                          </button>
                          {item.kind === "client-photo" && item.photoId && (
                            <button
                              className="savedImageDeleteButton powerSavedImageDeleteButton"
                              type="button"
                              title="Удалить фото"
                              aria-label="Удалить фото из базы"
                              onClick={(event) => handleDeleteSavedClientPhoto(item, event)}
                            >
                              ×
                            </button>
                          )}
                        </div>
                      ))}
                      {savedPowerImages.length === 0 && <p>Сохранённые фото, подложки и изображения появятся здесь после загрузки.</p>}
                      {savedPowerImages.length > 0 && filteredSavedPowerImages.length === 0 && <p>В этой категории пока нет изображений.</p>}
                    </div>
                  </div>
                </>
              ) : activeTopTab === "chats" ? (
                <>
                  <p className="cabinetEyebrow">Рабочий режим</p>
                  <h3>Чаты</h3>
                  <div className="chatModeNav" aria-label="Статические разделы чатов">
                    {["Места силы", "Фото клиентов", "Мистерии", "Галерея"].map((item) => (
                      <button key={item} type="button">{item}</button>
                    ))}
                  </div>
                  <div className="quickPhotoGrid">
                    {["Клиент", "Цель", "Вода", "Огонь"].map((item) => (
                      <span key={item}><i />{item}<small>из базы</small></span>
                    ))}
                  </div>
                </>
              ) : (
                <>
                  <p className="cabinetEyebrow">Профиль</p>
                  <h3>{profile.display_name || "Мой профиль"}</h3>
                  <div className="profileStatusStack">
                    <span className={`cabinetStatus status-${profile.status || "draft"}`}>{statusText}</span>
                    {profile?.id && <small>ID: {formatCabinetId(profile.id)}</small>}
                    <small>{user?.email || "Email не загружен"}</small>
                  </div>
                </>
              )}
            </aside>

            <div className="workspaceCenterColumn">
            {activeTopTab === "mandalas" && (
              <>
            <div className="mandalaWorkspaceSectionHeader">
              <p className="cabinetEyebrow">Мои мандалы и материалы</p>
              <h2>Мастерская мандал</h2>
            </div>
            <section className="materialCategoryNav" aria-label="Категории материалов">
              <div className="materialSelectionChips" aria-label="Выбранные параметры материалов">
                <span className="materialSelectionChip">
                  <b>Категория:</b> {activeMaterialCategoryData.label}
                </span>
                <span className="materialSelectionChip">
                  <b>Подкатегория:</b> {activeMaterialSubcategoryData?.label || "не выбрана"}
                </span>
                {activeMaterialCategory === "channels" && activeMaterialThirdLevelData && (
                  <span className="materialSelectionChip">
                    <b>Третий уровень:</b> {activeMaterialThirdLevelData.label}
                  </span>
                )}
                <span className="materialSelectionChip">
                  <b>DAO ступень:</b> {activeMaterialStepLabel}
                </span>
              </div>

              <details className="materialCategoryDetails" open>
                <summary>Дополнительные категории</summary>
                <div className="materialCategoryDetailsPanel">
                  <div className="materialCategoryTabs" role="tablist" aria-label="Категории материалов">
                    {MATERIAL_CATEGORY_TABS.map((category) => (
                      <button
                        className={activeMaterialCategory === category.value ? "active" : ""}
                        key={category.value}
                        onClick={() => handleMaterialCategorySelect(category.value)}
                        type="button"
                      >
                        {category.label}
                      </button>
                    ))}
                  </div>
                </div>
              </details>

              {activeMaterialCategoryData.subcategories.length > 0 && (
                <details className="materialCategoryDetails" open>
                  <summary>Подкатегории</summary>
                  <div className="materialCategoryDetailsPanel">
                    <div className="materialSubcategoryTabs" role="tablist" aria-label="Подкатегории материалов">
                      {activeMaterialCategoryData.subcategories.map((subcategory) => (
                        <button
                          className={activeMaterialSubcategory === subcategory.value ? "active" : ""}
                          key={subcategory.value}
                          onClick={() => handleMaterialSubcategorySelect(subcategory)}
                          type="button"
                        >
                          {subcategory.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </details>
              )}

              {activeMaterialSubcategoryData?.thirdLevels?.length > 0 && (
                <details className="materialCategoryDetails" open={isMaterialThirdLevelPanelOpen} onToggle={(event) => setIsMaterialThirdLevelPanelOpen(event.currentTarget.open)}>
                  <summary>Третий уровень</summary>
                  <div className="materialCategoryDetailsPanel">
                    <div className="materialSubcategoryTabs" role="tablist" aria-label="Третий уровень материалов">
                      {activeMaterialSubcategoryData.thirdLevels.map((thirdLevel) => (
                        <button
                          className={activeMaterialThirdLevel === thirdLevel.value ? "active" : ""}
                          key={thirdLevel.value}
                          onClick={() => handleMaterialThirdLevelSelect(thirdLevel)}
                          type="button"
                        >
                          {thirdLevel.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </details>
              )}

              {activeMaterialCategory === "dao-ri" && activeMaterialSubcategoryData?.steps?.length > 0 && (
                <details className="materialCategoryDetails" open>
                  <summary>DAO ступени</summary>
                  <div className="materialCategoryDetailsPanel">
                    <div className="materialStepTabs" aria-label="Ступени Reiki Yggdrasil">
                      {activeMaterialSubcategoryData.steps.map((step) => (
                        <button
                          className={materialForm.step_id === step.id ? "active" : ""}
                          key={step.id}
                          onClick={() => handleDaoStepSelect(step.id)}
                          type="button"
                        >
                          {step.label} {step.number}: {step.title}
                        </button>
                      ))}
                    </div>
                  </div>
                </details>
              )}
              <div className="materialCategoryContext">
                <b>{activeMaterialCategoryData.label}</b>
                <span>{activeMaterialSubcategoryData?.label || "Подкатегория требует уточнения"}</span>
              </div>
            </section>

            <div className="mandalaAtelierGrid">
              <div className="mandalaAltarCard">
                <p className="cabinetEyebrow">Алтарь мандалы</p>
                <div className={isImagePreview(materialPreviewUrl) ? "mandalaPreview hasImage" : "mandalaPreview"} style={imageStyle(materialPreviewUrl)}>
                  {!isImagePreview(materialPreviewUrl) && <span>⇧</span>}
                </div>
                <label className="mandalaUploadButton">
                  <input type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={handleMandalaFile} />
                  {mediaUploadTarget === "material" ? "Загружаю..." : "Загрузить фото мандалы"}
                </label>
                <div className="mandalaDropHint">
                  JPG, PNG, WEBP или GIF до 5 MB. Файл сохраняется в private Supabase Storage; также можно вставить внешний URL.
                </div>
                {fileNotice && <div className="mandalaFileNotice">{fileNotice}</div>}
                <div className="mandalaFlowLink">
                  <b>{materialForm.step_id}</b> · {materialForm.step_title || "ступень"} · {materialForm.setting_title || "настройка уточняется"}
                </div>
              </div>

              <form className="mandalaCreationCard" onSubmit={(event) => { event.preventDefault(); handleMaterialSave("draft"); }}>
                <p className="cabinetEyebrow">Создание материала</p>
                <div className="materialTypeChips" role="group" aria-label="Тип материала">
                  {MATERIAL_TYPES.map((type) => (
                    <button key={type.value} type="button" className={materialForm.type === type.value ? "active" : ""} onClick={() => updateMaterialField("type", type.value)}>
                      {type.label}
                    </button>
                  ))}
                </div>

                <div className="cabinetTwoColumns">
                  <label>
                    Ступень Reiki Yggdrasil
                    <select value={materialForm.step_id} onChange={(event) => updateMaterialField("step_id", event.target.value)}>
                      {stepOptions.map((step) => (
                        <option value={step.id} key={step.id}>{step.fullLabel}</option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Настройка ступени
                    <select value={materialForm.setting_title} onChange={(event) => updateMaterialField("setting_title", event.target.value)}>
                      {activeSettings.length === 0 && <option value="">Настройки уточняются</option>}
                      {activeSettings.map((setting, index) => (
                        <option value={setting.title} key={`${setting.title}-${index}`}>{setting.title}</option>
                      ))}
                    </select>
                  </label>
                </div>

                <div className="materialTitleDescriptionGrid">
                  <label>
                    Название
                    <input value={materialForm.title} onChange={(event) => updateMaterialField("title", event.target.value)} placeholder="Например: Мандала денежной активации" />
                  </label>

                  <label>
                    Описание / инструкция
                    <textarea value={materialForm.description} onChange={(event) => updateMaterialField("description", event.target.value)} rows={2} placeholder="(по желанию)" />
                  </label>
                </div>

                <label>
                  URL изображения / мандалы
                  <input
                    value={materialForm.image_url}
                    onChange={(event) => {
                      setMaterialFile(null);
                      setMaterialFilePreview("");
                      updateMaterialField("image_url", event.target.value);
                    }}
                    placeholder="https://... или загрузите фото слева"
                  />
                </label>

                <div className="cabinetActions">
                  <button className="cabinetPrimary" type="submit" disabled={!profile?.id}>Сохранить</button>
                </div>
              </form>
            </div>

              </>
            )}

            {activeTopTab === "chats" && (
              <section className="chatPlaceholderWorkspace" aria-label="Статический режим чатов">
                <div className="chatPlaceholderHeader">
                  <p className="cabinetEyebrow">Центр действия</p>
                  <h2>Чаты и рабочие заметки</h2>
                  <span>UI placeholder · backend не подключён в этом режиме</span>
                </div>
                <div className="chatMockMessages" aria-hidden="true">
                  <div>
                    <b>Мария Север</b>
                    <p>Добавила фото цели. Проверь зодиакальную мандалу.</p>
                  </div>
                  <div className="own">
                    <b>Вы</b>
                    <p>Место силы открываем отдельной вкладкой рабочей области.</p>
                  </div>
                  <div>
                    <b>Мария Север</b>
                    <p>Сохрани потом в Мистерии → Традиция.</p>
                  </div>
                </div>
                <div className="chatComposerMock">
                  <span>Написать сообщение мастеру...</span>
                  <button type="button">Отправить</button>
                </div>
              </section>
            )}
            {activeTopTab === "services" && (
              <section className="chatPlaceholderWorkspace" aria-label="Диагностика модуля услуг">
                <div className="chatPlaceholderHeader">
                  <p className="cabinetEyebrow">Услуги</p>
                  <h2>Каталог услуг</h2>
                  <span>Черновики, публикации и клиентские мандалы в одном рабочем разделе.</span>
                </div>
                <div className="cabinetNotice cabinetSecondaryDataWarning">
                  Модуль услуг не участвует в критической загрузке кабинета. Если таблицы услуг, RLS или runtime-блок недоступны, тяжелый кабинет остаётся открытым, а услугу можно подготовить из сохранённого места силы следующим отдельным шагом.
                </div>
                {powerPlaceServiceDraft?.title && (
                  <div className="chatMockMessages">
                    <div>
                      <b>{powerPlaceServiceDraft.title}</b>
                      <p>Черновик подготовлен из вкладки «Место силы». Сохранение услуги требует отдельной live-проверки таблицы услуг.</p>
                    </div>
                  </div>
                )}
              </section>
            )}
            {activeTopTab === "orders" && (
              <section className="chatPlaceholderWorkspace" aria-label="Диагностика модуля заявок">
                <div className="chatPlaceholderHeader">
                  <p className="cabinetEyebrow">Заявки</p>
                  <h2>Заявки клиентов</h2>
                  <span>Источник данных: profile_cabinet_service_orders · inline smoke mode</span>
                </div>
                <div className="cabinetNotice cabinetSecondaryDataWarning">
                  Модуль заявок изолирован от auth/bootstrap пути. Ошибка загрузки заявок должна оставаться inline-сообщением внутри этой вкладки и не возвращать весь heavy cabinet в полноэкранную загрузку.
                </div>
              </section>
            )}
            {activeTopTab === "profile" && profileEditor}
            </div>

            <div className="workspaceRightColumn">
            {activeTopTab === "power-place" && (
            <section className="powerPlaceConstructor" aria-label="Конструктор магической мандалы места силы">
                <div className="powerPlaceHeader">
                  <div>
                    <p className="cabinetEyebrow">Места силы</p>
                    <h2>Магическая мандала</h2>
                  </div>
                  <div className="constructorControls">
                  <div className="constructorTypeSelector" aria-label="Тип конструктора">
                        {CONSTRUCTOR_TYPES.filter((type) => type.value !== "client").map((type) => (
                      <button
                        className={constructorType === type.value ? "active" : ""}
                        key={type.value}
                        onClick={() => setConstructorType(type.value)}
                        type="button"
                      >
                        {type.label}
                      </button>
                    ))}
                  </div>
                  {constructorType === "client" && (
                    <div className="geometrySelector" aria-label="Геометрия источников силы">
                      {POWER_SOURCE_COUNTS.map((count) => (
                        <button
                          className={powerSourceCount === count ? "active" : ""}
                          key={count}
                          onClick={() => setPowerSourceCount(count)}
                          type="button"
                        >
                          {count}
                        </button>
                      ))}
                    </div>
                  )}
                  {constructorType === "altar" && (
                    <>
                      <select value={selectedTraditionId} onChange={(event) => setSelectedTraditionId(event.target.value)}>
                        {mysteryTraditions.map((tradition) => (
                          <option key={tradition.id} value={tradition.id}>{tradition.title}</option>
                        ))}
                      </select>
                      <div className="altarRatioSelector" aria-label="Пропорция центрального верхнего объекта">
                        {ALTAR_CENTER_RATIOS.map((ratio) => (
                          <button
                            className={altarCenterRatio === ratio.value ? "active" : ""}
                            key={ratio.value}
                            onClick={() => setAltarCenterRatio(ratio.value)}
                            type="button"
                          >
                            {ratio.label}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                  {constructorType === "business" && (
                    <div className="businessZoneSelector" aria-label="Зон в каждой вершине">
                      <span>Зон в каждой вершине</span>
                      {BUSINESS_VERTEX_ZONE_COUNTS.map((count) => (
                        <button
                          className={businessVertexZoneCount === count ? "active" : ""}
                          key={count}
                          onClick={() => setBusinessVertexZoneCount(count)}
                          type="button"
                        >
                          {count}
                        </button>
                      ))}
                    </div>
                  )}
                  {constructorType === "zodiac" && (
                    <div className="zodiacCountSelector" aria-label="Количество видимых позиций зодиака">
                      <span>Позиции зодиака</span>
                      {ZODIAC_VARIANTS.map((variant) => (
                        <button
                          className={variant.visibleCount === zodiacVisibleCount && zodiacVariant === variant.value ? "active" : ""}
                          key={variant.value}
                          onClick={() => {
                            setZodiacVariant(variant.value);
                            setZodiacVisibleCount(variant.visibleCount);
                          }}
                          type="button"
                        >
                          {variant.label}
                        </button>
                      ))}
                    </div>
                  )}
                  {constructorType === "star" && (
                    <div className="starVariantSelector" aria-label="Формат звезды">
                      <span>Вариант звезды</span>
                      {STAR_VARIANTS.map((variant) => (
                        <button
                          className={starVariant === variant.value ? "active" : ""}
                          key={variant.value}
                          onClick={() => setStarVariant(variant.value)}
                          type="button"
                        >
                          {variant.label}
                        </button>
                      ))}
                    </div>
                  )}
                  {constructorType === "chess" && (
                    <div className="starVariantSelector" aria-label="Формат шахмат">
                      <span>Формат шахмат</span>
                      {CHESS_VARIANTS.map((variant) => (
                        <button
                          className={chessVariant === variant.value ? "active" : ""}
                          key={variant.value}
                          onClick={() => setChessVariant(variant.value)}
                          type="button"
                        >
                          {variant.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className={`powerPlacePrintArea field-layout-${mandalaFieldLayout}`}>
                <div className={`powerMandalaPanel field-layout-${mandalaFieldLayout} ${selectedOuterCoverClass}`} style={selectedOuterCoverStyle}>
                  <div className="powerPlaceMentalicaBrand" aria-label="Бренд Mentalica">Mentalica</div>
                  {resourceComparisonMode === "client_photo" ? (
                    <div className="powerPhotoOnlyFrame">
                      {renderCenterPhotoWithMode("powerCenterPhoto photoOnly")}
                      <p>Фото клиента / цели</p>
                    </div>
                  ) : constructorType === "client" ? (
                    <div className={`powerMandala geometry-${powerSourceCount} ${selectedCoverClass}`} style={selectedCoverStyle}>
                      {renderCenterPhotoWithMode("powerCenterPhoto")}
                      <div className="powerMandalaBase">
                        <span>мандала места силы</span>
                      </div>
                      {Array.from({ length: powerSourceCount }, (_, index) => {
                        const slotId = `source-${index + 1}`;
                        const sourceImage = objectImages[slotId];

                        return (
                          <button
                            className={`${sourceClassName(powerSourceCount, index)}${sourceImage ? " hasImage" : ""}${selectedObjectSlotId === slotId ? " selected" : ""}`}
                            key={`source-${powerSourceCount}-${index}`}
                            onClick={() => openObjectSlot(slotId)}
                            style={{ ...imageStyleFor(sourceImage), ...(sourcePositionStyle(powerSourceCount, index) || {}) }}
                            type="button"
                            title={sourceLabel(powerSourceCount, index)}
                            aria-label={`Выбрать позицию ${sourceLabel(powerSourceCount, index)}`}
                          >
                            {!sourceImage && <span>{index + 1}</span>}
                          </button>
                        );
                      })}
                    </div>
                  ) : constructorType === "altar" ? (
                    <div className={`altarMandalaSheet ratio-${altarCenterRatio} ${selectedCoverClass}`} style={selectedCoverStyle}>
                      <div className="altarTopRow" aria-label="Верхние источники алтаря">
                        {Array.from({ length: 5 }, (_, index) => {
                          const slotId = `altar-top-${index + 1}`;
                          const slotImage = objectImages[slotId];
                          const isMain = index === 2;

                          return (
                            <button
                              className={`${isMain ? "altarTopSource main" : "altarTopSource"}${slotImage ? " hasImage" : ""}${selectedObjectSlotId === slotId ? " selected" : ""}`}
                              key={slotId}
                              onClick={() => openObjectSlot(slotId)}
                              style={imageStyleFor(slotImage)}
                              type="button"
                              title={isMain ? "Центральный верхний объект" : `Верхний объект ${index + 1}`}
                              aria-label={isMain ? "Выбрать центральный верхний объект" : `Выбрать верхний объект ${index + 1}`}
                            >
                              {!slotImage && <span>{index + 1}</span>}
                            </button>
                          );
                        })}
                      </div>
                      {renderCenterPhotoWithMode("altarCenterPhoto")}
                      <div className="altarMandalaBase">
                        <span>мандала места силы</span>
                      </div>
                      <div className="altarBottomSupports" aria-label="Нижние опоры алтаря">
                        {[1, 2].map((number) => {
                          const slotId = `altar-support-${number}`;
                          const slotImage = objectImages[slotId];

                          return (
                            <button
                              className={`altarSupportSource${slotImage ? " hasImage" : ""}${selectedObjectSlotId === slotId ? " selected" : ""}`}
                              key={slotId}
                              onClick={() => openObjectSlot(slotId)}
                              style={imageStyleFor(slotImage)}
                              type="button"
                              title={`Нижняя опора ${number}`}
                              aria-label={`Выбрать нижнюю опору ${number}`}
                            >
                              {!slotImage && <span>{number}</span>}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ) : constructorType === "business" ? (
                    <div className={`businessMandalaSheet zones-${businessVertexZoneCount} ${selectedCoverClass}`} style={selectedCoverStyle}>
                      {renderCenterPhotoWithMode("businessCenterPhoto")}
                      <div className="businessTriangleLines" aria-hidden="true" />
                      {BUSINESS_VERTICES.map((vertex) => (
                        <div className={`businessVertex ${vertex.className}`} key={vertex.id}>
                          <b>{vertex.label}</b>
                          <div className="businessVertexZones">
                            {Array.from({ length: businessVertexZoneCount }, (_, index) => {
                              const slotId = `business-${vertex.id}-${index + 1}`;
                              const slotImage = objectImages[slotId];

                              return (
                                <button
                                  className={`businessVertexZone${slotImage ? " hasImage" : ""}${selectedObjectSlotId === slotId ? " selected" : ""}`}
                                  key={slotId}
                                  onClick={() => openObjectSlot(slotId)}
                                  style={imageStyleFor(slotImage)}
                                  type="button"
                                  title={businessVertexZoneCount === 1 ? vertex.label : `${vertex.label} · зона ${index + 1}`}
                                  aria-label={`Выбрать ${businessVertexZoneCount === 1 ? vertex.label : `${vertex.label}, зона ${index + 1}`}`}
                                >
                                  {!slotImage && <span>{index + 1}</span>}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : constructorType === "zodiac" ? (
                    <>
                      <div className={`zodiacMandalaSheet zodiac-${zodiacVisibleCount} ${isZodiacPlusVariant(zodiacVariant, zodiacVisibleCount) ? `zodiac-plus-${zodiacVisibleCount}` : ""} ${selectedCoverClass}`} style={selectedCoverStyle}>
                        {renderCenterPhotoWithMode("zodiacCenterPhoto")}
                        <div className="zodiacClockFace" aria-hidden="true">
                          <span>ЗОДИАК</span>
                        </div>
                        {ZODIAC_SIGNS.slice(0, isZodiacPlusVariant(zodiacVariant, zodiacVisibleCount) ? 8 : zodiacVisibleCount).map((sign, index) => {
                          const slotId = `zodiac-${index + 1}`;
                          const slotImage = objectImages[slotId];

                          return (
                            <div className={`zodiacPosition ${sign.className}${slotImage ? " hasImage" : ""}`} key={slotId}>
                              <button
                                className={`zodiacPositionImage${selectedObjectSlotId === slotId ? " selected" : ""}`}
                                onClick={() => openObjectSlot(slotId)}
                                style={imageStyleFor(slotImage)}
                                type="button"
                                title={sign.label}
                                aria-label={`Выбрать знак ${sign.label}`}
                              >
                                {!slotImage && <span>{index + 1}</span>}
                              </button>
                              <b>{sign.label}</b>
                            </div>
                          );
                        })}
                      </div>
                      {activeObjectSlots.filter((slot) => slot.id.startsWith("zodiac-plus")).map((slot, index) => {
                        const slotImage = objectImages[slot.id];
                        return (
                          <div className={`zodiacFieldPlusPosition ${slot.className || ""}${slotImage ? " hasImage" : ""}`} key={slot.id}>
                            <button
                              className={`zodiacFieldPlusPositionImage${selectedObjectSlotId === slot.id ? " selected" : ""}`}
                              onClick={() => openObjectSlot(slot.id)}
                              style={imageStyleFor(slotImage)}
                              type="button"
                              title={slot.label}
                              aria-label={`Выбрать ${slot.label.toLowerCase()}`}
                            >
                              {!slotImage && <span>{index + 1}</span>}
                            </button>
                            <b>{slot.label}</b>
                          </div>
                        );
                      })}
                    </>
                  ) : constructorType === "star" ? (
                    <div className={`starMandalaSheet star-${starVariant} ${selectedCoverClass}`} style={selectedCoverStyle}>
                      <div className="starSacredLabel starElhai">ELHAI</div>
                      <div className="starSacredLabel starAdonay">ADONAY</div>
                      {renderCenterPhotoWithMode("starCenterPhoto")}
                      <div className="starGuide" aria-hidden="true">
                        <span className="starAxis vertical" />
                        <span className="starAxis horizontal" />
                        <span className="starTriangle upper" />
                        <span className="starTriangle lower" />
                        <span className="starCoreTriangle" />
                        <span className="starClosedFrame" />
                        <span className="starClosedDivider horizontalTop" />
                        <span className="starClosedDivider horizontalBottom" />
                        <span className="starRay rayTop" />
                        <span className="starRay rayRight" />
                        <span className="starRay rayLowerRight" />
                        <span className="starRay rayLowerLeft" />
                        <span className="starRay rayLeft" />
                        <span className="starOpenLine starOpenRight" />
                        <span className="starOpenLine starOpenLowerLeft" />
                        <span className="starCornerSigil cornerTopLeft">↯</span>
                        <span className="starCornerSigil cornerTopRight">✶</span>
                        <span className="starCornerSigil cornerBottomLeft">↯</span>
                        <span className="starCornerSigil cornerBottomRight">↯</span>
                      </div>
                      {STAR_POINTS.map((point, index) => {
                        const slotId = `star-${index + 1}`;
                        const slotImage = objectImages[slotId];

                        return (
                          <div className={`starPosition ${point.className}${slotImage ? " hasImage" : ""}`} key={slotId}>
                            <button
                              className={`starPositionImage${selectedObjectSlotId === slotId ? " selected" : ""}`}
                              onClick={() => openObjectSlot(slotId)}
                              style={imageStyleFor(slotImage)}
                              type="button"
                              title={point.label}
                              aria-label={`Выбрать ${point.label.toLowerCase()}`}
                            >
                              {!slotImage && <span>{index + 1}</span>}
                            </button>
                            <b>{point.label}</b>
                          </div>
                        );
                      })}
                    </div>
                  ) : constructorType === "chess" ? (
                    <div className={`power-place-chess power-place-chess--${chessVariant} ${selectedCoverClass}`} style={selectedCoverStyle}>
                      <div className="power-place-chess__top-row" aria-label="Верхний ряд мандал">
                        {CHESS_TOP_SLOTS.map((slot, index) => {
                          const slotImage = objectImages[slot.id];

                          return (
                            <button
                              className={`power-place-chess__top-slot ${slot.className}${slotImage ? " hasImage" : ""}${selectedObjectSlotId === slot.id ? " selected" : ""}`}
                              key={slot.id}
                              onClick={() => openObjectSlot(slot.id)}
                              style={imageStyleFor(slotImage)}
                              type="button"
                              title={slot.label}
                              aria-label={`Выбрать ${slot.label.toLowerCase()}`}
                            >
                              {!slotImage && <span>{index + 1}</span>}
                            </button>
                          );
                        })}
                      </div>
                      <div className="power-place-chess__board" aria-label="Шахматная раскладка">
                        {chessVariant === "plus-8" ? (
                          <>
                            {renderCenterPhotoWithMode("power-place-chess__center")}
                            {(CHESS_SLOT_LAYOUTS["plus-8"] || []).map((slot, index) =>
                              renderChessSlot(slot, index, `power-place-chess__slot--${slot.className}`)
                            )}
                          </>
                        ) : (
                          Array.from({ length: chessVariant === "classic-14" ? 15 : 9 }, (_, index) => {
                            const row = Math.floor(index / 3) + 1;
                            const col = index % 3 + 1;
                            const centerIndex = chessVariant === "classic-14" ? 7 : 4;
                            const toneClass = (row + col) % 2 === 0 ? "is-dark" : "is-light";

                            if (index === centerIndex) {
                              return (
                                <div className={`power-place-chess__cell power-place-chess__cell--center ${toneClass}`} key="chess-center">
                                  {renderCenterPhotoWithMode("power-place-chess__center")}
                                </div>
                              );
                            }

                            const slot = (CHESS_SLOT_LAYOUTS[chessVariant] || []).find((item) => item.row === row && item.col === col);
                            return slot ? (
                              <div className={`power-place-chess__cell ${toneClass}`} key={slot.id}>
                                {renderChessSlot(slot, Number(slot.id.replace("chess-", "")) - 1)}
                              </div>
                            ) : null;
                          })
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className={`daoMandalaSheet ${selectedCoverClass}`} style={selectedCoverStyle}>
                      {renderCenterPhotoWithMode("daoCenterPhoto")}
                      <div className="daoUsinCore" aria-hidden="true">
                        <span>УСИН</span>
                      </div>
                      {DAO_ELEMENTS.map((element) => {
                        const slotId = `dao-${element.id}`;
                        const slotImage = objectImages[slotId];

                        return (
                          <div className={`daoElement ${element.className}`} key={element.id}>
                            <button
                              className={`daoElementImage${slotImage ? " hasImage" : ""}${selectedObjectSlotId === slotId ? " selected" : ""}`}
                              onClick={() => openObjectSlot(slotId)}
                              style={imageStyleFor(slotImage)}
                              type="button"
                              title={element.label}
                              aria-label={`Выбрать элемент ${element.label}`}
                            >
                              {!slotImage && <span>◎</span>}
                            </button>
                            <b>{element.label}</b>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  <p className="powerPlaceHint">
                    {constructorType === "client"
                      ? "Центр использует только фото из раздела «Фото клиентов / целей». При 12 точках добавлены внешние позиции вокруг центра."
                      : constructorType === "altar"
                        ? "Алтарь ставит выбранное фото цели ниже центра, а объекты берёт из образов выбранной традиции."
                        : constructorType === "business"
                          ? "Бизнес-мандала собирает цель, функцию и структуру в треугольник с единым числом зон на каждой вершине."
                          : constructorType === "zodiac"
                            ? "Зодиак ставит фото клиента или цели в центр и раскладывает до 12 образов по часовому кругу."
                            : constructorType === "star"
                              ? "Звезда собирает пять ключевых образов вокруг центра; открытый вариант продолжает правый и нижний левый лучи как линии движения."
                              : constructorType === "chess"
                                ? "Шахматы добавляют верхний ряд из пяти мандал и основную доску с центральным фото клиента / цели."
                              : "ДАО-формат держит центр цели внутри круга У-син и пять образов элементов вокруг него."}
                  </p>
                  <div className="resourcePrintNotes">
                    <p><b>Сравнение ресурса:</b> {RESOURCE_COMPARISON_MODES.find((item) => item.value === resourceComparisonMode)?.label || "Фото цели"}</p>
                    <p><b>Ресурс без мандалы:</b> {resourceWithoutMandalaComment || "—"}</p>
                    <p><b>Ресурс с мандалой:</b> {resourceWithMandalaComment || "—"}</p>
                  </div>
                </div>

                <div className="powerFieldNotes">
                  <p className="powerPlaceHint">
                    {constructorType === "client"
                      ? "Центр использует только фото из раздела «Фото клиентов / целей». При 12 точках добавлены внешние позиции вокруг центра."
                      : constructorType === "altar"
                        ? "Алтарь ставит выбранное фото цели ниже центра, а объекты берёт из образов выбранной традиции."
                        : constructorType === "business"
                          ? "Бизнес-мандала собирает цель, функцию и структуру в треугольник с единым числом зон на каждой вершине."
                          : constructorType === "zodiac"
                            ? "Зодиак ставит фото клиента или цели в центр и раскладывает до 12 образов по часовому кругу."
                            : constructorType === "star"
                              ? "Звезда собирает пять ключевых образов вокруг центра; открытый вариант продолжает правый и нижний левый лучи как линии движения."
                              : constructorType === "chess"
                                ? "Шахматы добавляют верхний ряд из пяти мандал и основную доску с центральным фото клиента / цели."
                              : "ДАО-формат держит центр цели внутри круга У-син и пять образов элементов вокруг него."}
                  </p>
                  <div className="resourcePrintNotes">
                    <p><b>Сравнение ресурса:</b> {RESOURCE_COMPARISON_MODES.find((item) => item.value === resourceComparisonMode)?.label || "Фото цели"}</p>
                    <p><b>Ресурс без мандалы:</b> {resourceWithoutMandalaComment || "—"}</p>
                    <p><b>Ресурс с мандалой:</b> {resourceWithMandalaComment || "—"}</p>
                  </div>
                </div>

                <aside className="powerCommandRail">

                  <div className="mandalaFieldLayoutSwitch" aria-label="Расположение поля мандалы">
                    <span>Расположение поля мандалы</span>
                    <div className="mandalaFieldLayoutButtons" role="group" aria-label="Расположение поля мандалы">
                      {MANDALA_FIELD_LAYOUTS.map((layout) => (
                        <button
                          className={mandalaFieldLayout === layout.value ? "active" : ""}
                          key={layout.value}
                          onClick={() => setMandalaFieldLayout(layout.value)}
                          type="button"
                          title={layout.label}
                          aria-label={layout.label}
                        >
                          <i aria-hidden="true" className={`fieldLayoutIcon ${layout.value}`} />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="coverSelector">
                    <p className="cabinetEyebrow">Фон Места Силы</p>
                    <div className="coverLayerTabs" role="tablist" aria-label="Слой фона">
                      <button className={activeCoverLayer === "inner" ? "active" : ""} type="button" onClick={() => setActiveCoverLayer("inner")}>Фон внутри</button>
                      <button className={activeCoverLayer === "outer" ? "active" : ""} type="button" onClick={() => setActiveCoverLayer("outer")}>Фон снаружи</button>
                    </div>
                    <div className="coverPreviewWrap">
                      <div
                        className={`coverPreview ${activeCoverLayer === "outer"
                          ? selectedOuterCover?.type === "image" ? "hasImage" : `tone-${selectedOuterCover?.tone || "none"}`
                          : selectedCover?.type === "image" ? "hasImage" : `tone-${selectedCover?.tone || "none"}`}`}
                        style={activeCoverLayer === "outer"
                          ? selectedOuterCover?.type === "image" ? { backgroundImage: `url(${displayImageUrl(selectedOuterCover.src)})` } : undefined
                          : selectedCover?.type === "image" ? { backgroundImage: `url(${displayImageUrl(selectedCover.src)})` } : undefined}
                      >
                        <span>{activeCoverLayer === "outer" ? selectedOuterCover?.label || "Без фона" : selectedCover?.label || "Без фона"}</span>
                      </div>
                    </div>
                    <div className="coverVariantList" aria-label="Варианты фона">
                      {coverVariants.map((cover) => {
                        const isActive = activeCoverLayer === "outer" ? selectedOuterCover?.id === cover.id : selectedCover?.id === cover.id;
                        return (
                          <button
                            className={isActive ? "active" : ""}
                            key={`${activeCoverLayer}-${cover.id}`}
                            onClick={() => activeCoverLayer === "outer" ? setSelectedOuterCoverId(cover.id) : setSelectedCoverId(cover.id)}
                            type="button"
                          >
                            {cover.label}
                          </button>
                        );
                      })}
                    </div>
                    <label className="coverUploadButton">
                      <input type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={handleCoverFile} />
                      {mediaUploadTarget === "cover" ? "Загружаю..." : "Своё изображение"}
                    </label>
                    <button className="coverPickerButton" type="button" onClick={() => openCoverPicker(activeCoverLayer)}>Выбрать фото</button>
                    {coverNotice && <p className="coverNotice">{coverNotice}</p>}
                  </div>

                  {resourceComparisonPanel}


                  <div className="objectImageEditor">
                    <p className="cabinetEyebrow">Объекты композиции</p>
                    <div className="selectedObjectControl">
                      <div className={selectedObjectImage ? "selectedObjectPreview hasImage" : "selectedObjectPreview"} style={imageStyleFor(selectedObjectImage)}>
                        {!selectedObjectImage && <span>◎</span>}
                      </div>
                      <div className="selectedObjectBody">
                        <b>{selectedObjectSlot?.label || "Выберите позицию на мандале"}</b>
                        <small>Нажмите точку на диаграмме, затем выберите образ или загрузите файл.</small>
                        <select
                          disabled={!selectedObjectSlot}
                          value={selectedObjectImage}
                          onChange={(event) => selectedObjectSlot && handleObjectSelect(selectedObjectSlot.id, event.target.value)}
                        >
                          {objectImageOptions.map((option) => (
                            <option key={`${selectedObjectSlot?.id || "slot"}-${option.id || "empty"}`} value={option.src}>{option.label}</option>
                          ))}
                        </select>
                        <div className="selectedObjectActions">
                          <label className={!selectedObjectSlot ? "disabled" : ""}>
                            <input
                              type="file"
                              accept="image/png,image/jpeg,image/webp,image/gif"
                              disabled={!selectedObjectSlot}
                              onChange={(event) => selectedObjectSlot && handleObjectFile(selectedObjectSlot.id, event)}
                            />
                            Загрузить
                          </label>
                          <button type="button" disabled={!selectedObjectSlot || !selectedObjectImage} onClick={() => selectedObjectSlot && setObjectImage(selectedObjectSlot.id, "")}>Очистить</button>
                        </div>
                      </div>
                    </div>
                  </div>

                </aside>
              </div>

              <section className="savedCompositionsPanel" aria-label="Сохранённые мандалы">
                <div className="savedCompositionsHeader">
                  <div>
                    <p className="cabinetEyebrow">Библиотека</p>
                    <h3>Сохранённые мандалы</h3>
                  </div>
                  <span className="savedCompositionsCounter">{powerPlaceCompositions.length}/{planLimits.compositions}</span>
                </div>
                {powerPlaceCompositions.length > 0 ? (
                  <div className="savedCompositionsList">
                    {powerPlaceCompositions.map((composition) => {
                      const isSelected = composition.id === selectedCompositionId;
                      return (
                        <article
                          className={`savedCompositionCard${isSelected ? " selected" : ""}`}
                          key={composition.id}
                        >
                          <div className="savedCompositionBody">
                            <b>{composition.title || "Место силы"}</b>
                            <span>{constructorTypeLabel(composition.constructor_type)}</span>
                            <small>{isSelected ? "Сейчас открыта в редакторе" : "Можно загрузить в редактор"}</small>
                          </div>
                          <div className="savedCompositionActions">
                            <button
                              className="cabinetSecondary"
                              type="button"
                              onClick={() => applyComposition(composition)}
                            >
                              {isSelected ? "Редактировать" : "Выбрать"}
                            </button>
                            <button
                              className="cabinetSecondary"
                              type="button"
                              onClick={(event) => handleDeleteComposition(composition, event)}
                            >
                              Удалить
                            </button>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                ) : (
                  <p className="savedCompositionsEmpty">Сохранённые мандалы появятся здесь после первого сохранения.</p>
                )}
              </section>

              <label className="compositionTitleField">
                Название мандалы
                <input
                  className="compositionTitleInput"
                  value={compositionTitle}
                  onChange={(event) => setCompositionTitle(event.target.value)}
                  placeholder="Название мандалы"
                />
              </label>
              <div className="powerPlaceActions">
                <button className="cabinetPrimary" type="button" disabled={!profile?.id} onClick={handleCompositionSave}>
                  {selectedCompositionId ? "Обновить" : "Сохранить новую"}
                </button>
                <button className="cabinetSecondary" type="button" disabled={!profile?.id} onClick={handleCreateNewComposition}>
                  Создать новую
                </button>
                <button
                  className="cabinetSecondary"
                  type="button"
                  disabled={!profile?.id}
                  onClick={() => {
                    setPowerPlaceServiceDraft({
                      composition_id: selectedCompositionId || "",
                      title: compositionTitle || "Мандала Места Силы",
                      image_url: selectedCover?.src || customCoverImage || centerImage || "",
                      template_image_url: selectedCover?.src || customCoverImage || centerImage || ""
                    });
                    setTemplateServicesTab("services");
                    setActiveTopTab("services");
                    setMessage("Черновик услуги создан из текущего шаблона мандалы. Добавьте описание и цены.");
                  }}
                >
                  В услуги
                </button>
                <button className="cabinetSecondary" type="button" onClick={handleDownloadMandala}>Скачать</button>
                <button className="cabinetPrimary" type="button" onClick={handlePrintMandala}>Распечатать</button>
                <span>
                  {selectedSavedComposition ? `Редактируется: ${selectedSavedComposition.title || "Место силы"}` : "Новая мандала"}
                  {" · "}
                  {powerPlaceCompositions.length}/{planLimits.compositions} сохранённых мандал · Storage refs сохраняются без data:image.
                </span>
              </div>
            </section>
            )}

            {imagePickerContext.mode && (
              <div className="clientPhotoPickerBackdrop" onMouseDown={(event) => {
                if (event.target === event.currentTarget) closeImagePicker();
              }}>
                <section className="clientPhotoPickerModal" role="dialog" aria-modal="true" aria-labelledby="clientPhotoPickerTitle">
                  <div className="clientPhotoPickerHeader">
                    <div>
                      <p className="cabinetEyebrow">{imagePickerContext.mode === "center" ? "Центр мандалы" : imagePickerContext.mode === "cover" ? "Фон Места Силы" : selectedObjectSlot?.label || "Объект мандалы"}</p>
                      <h2 id="clientPhotoPickerTitle">{imagePickerContext.mode === "center" ? "Выбрать центральное изображение" : imagePickerContext.mode === "cover" ? "Выбрать фон" : "Выбрать изображение объекта"}</h2>
                      <small>Выберите группу, категорию и подкатегорию — как в левом поле источников.</small>
                    </div>
                    <button type="button" onClick={closeImagePicker} aria-label="Закрыть выбор изображения">×</button>
                  </div>
                  <div className="imagePickerStructuredControls pickerUploadDropdowns" aria-label="Структура выбора изображения">
                    <label>
                      Группа
                      <select
                        value={activePickerCategory}
                        onChange={(event) => handlePickerCategorySelect(event.target.value)}
                      >
                        {SOURCE_LIBRARY_CATEGORIES.map((category) => (
                          <option key={category.value} value={category.value}>{category.label}</option>
                        ))}
                      </select>
                    </label>

                    <label>
                      Категория
                      <select
                        value={activePickerSubcategory}
                        disabled={activePickerCategoryData.subcategories.length === 0}
                        onChange={(event) => {
                          const nextSubcategory = activePickerCategoryData.subcategories.find((subcategory) => subcategory.value === event.target.value);
                          if (nextSubcategory) handlePickerSubcategorySelect(nextSubcategory);
                        }}
                      >
                        {activePickerCategoryData.subcategories.length === 0 && <option value="">Без категории</option>}
                        {activePickerCategoryData.subcategories.map((subcategory) => (
                          <option key={subcategory.value} value={subcategory.value}>{subcategory.label}</option>
                        ))}
                      </select>
                    </label>

                    <label>
                      Подкатегория
                      <select
                        value={activePickerThirdLevel}
                        disabled={!activePickerSubcategoryData?.thirdLevels?.length}
                        onChange={(event) => {
                          const nextThird = activePickerSubcategoryData?.thirdLevels?.find((thirdLevel) => thirdLevel.value === event.target.value);
                          if (nextThird) handlePickerThirdLevelSelect(nextThird);
                        }}
                      >
                        {!activePickerSubcategoryData?.thirdLevels?.length && <option value="">Без подкатегории</option>}
                        {activePickerSubcategoryData?.thirdLevels?.map((thirdLevel) => (
                          <option key={thirdLevel.value} value={thirdLevel.value}>{thirdLevel.label}</option>
                        ))}
                      </select>
                    </label>
                  </div>
                  <div className="clientPhotoPickerGrid">
                    {modalPickerImageOptions.map((option) => (
                      <button
                        className={selectedObjectImage === option.src ? "clientPhotoPickerCard active" : "clientPhotoPickerCard"}
                        key={option.id}
                        onClick={() => choosePickerOption(option)}
                        type="button"
                      >
                        <span style={imageStyle(option.displaySrc || option.src)} />
                        <b>{option.label}</b>
                        {option.meta && <small>{option.meta}</small>}
                        {option.kind === "client-photo" && (
                          <span
                            className="savedImageDeleteButton"
                            role="button"
                            tabIndex={0}
                            title="Удалить фото"
                            aria-label="Удалить фото из базы"
                            onClick={(event) => handleDeleteSavedClientPhoto(option, event)}
                            onKeyDown={(event) => {
                              if (event.key === "Enter" || event.key === " ") handleDeleteSavedClientPhoto(option, event);
                            }}
                          >
                            ×
                          </span>
                        )}
                      </button>
                    ))}
                    {modalPickerImageOptions.length === 0 && (
                      <div className="clientPhotoPickerEmpty">
                        <b>{imagePickerContext.mode === "center" ? "В этой категории пока нет сохранённых изображений." : activePickerCategory === "channels" ? "Материалы для этого канала пока не добавлены." : "В этой категории пока нет сохранённых изображений."}</b>
                        <p>Выберите другую группу или нажмите «Загрузить новое фото».</p>
                      </div>
                    )}
                  </div>

                  {imagePickerContext.mode === "center" && (
                    <div className="clientPhotoPickerModeTabs" role="tablist" aria-label="Режим выбора фото">
                      <button
                        className="active"
                        type="button"
                        onClick={() => setIsClientPhotoUploadOpen(false)}
                      >
                        Выбрать из базы
                      </button>
                      <label className="clientPhotoPickerUploadDirectButton">
                        <input
                          type="file"
                          accept="image/png,image/jpeg,image/webp,image/gif"
                          onChange={handlePickerDirectFileUpload}
                        />
                        Загрузить новое фото
                      </label>
                    </div>
                  )}

                  {imagePickerContext.mode === "object" && (
                  <div className="clientPhotoPickerUpload">
                    <div className="cabinetFormHeader">
                      <div>
                        <p className="cabinetEyebrow">{imagePickerContext.mode === "center" ? "Загрузить новое фото" : "Загрузить объект"}</p>
                        <h3>{imagePickerContext.mode === "center" ? `${clientGoalPhotos.length}/${planLimits.clientPhotos}` : (selectedObjectSlot?.label || "Позиция мандалы")}</h3>
                      </div>
                    </div>
                    {imagePickerContext.mode === "cover" ? (
                      <p className="powerPlanNote">Выберите сохранённый фон выше. Новая загрузка фона остаётся в блоке «Фон Места Силы».</p>
                    ) : (
                      <>
                        <div className="selectedObjectActions">
                          <label className={!selectedObjectSlot ? "disabled" : ""}>
                            <input
                              type="file"
                              accept="image/png,image/jpeg,image/webp,image/gif"
                              disabled={!selectedObjectSlot}
                              onChange={(event) => selectedObjectSlot && handleObjectFile(selectedObjectSlot.id, event)}
                            />
                            {mediaUploadTarget === `slot-${selectedObjectSlot?.id}` ? "Загружаю..." : "Загрузить файл"}
                          </label>
                          <button type="button" disabled={!selectedObjectSlot || !selectedObjectImage} onClick={() => selectedObjectSlot && setObjectImage(selectedObjectSlot.id, "")}>Очистить слот</button>
                        </div>
                        {coverNotice && <p className="coverNotice">{coverNotice}</p>}
                        <p className="powerPlanNote">Новые файлы сохраняются через существующий private Storage flow, если профиль и сессия доступны.</p>
                      </>
                    )}
                  </div>
                  )}
                </section>
              </div>
            )}

            {activeTopTab === "mandalas" && (
            <div className="mandalaGallery">
              <div className="cabinetFormHeader">
                <div>
                  <p className="cabinetEyebrow">Мои мандалы и материалы</p>
                  <h2>Галерея мастера</h2>
                </div>
                <span className="cabinetStatus">{materialsLoading ? "..." : filteredMaterials.length}</span>
              </div>

              {materialsLoading && <p>Загружаю материалы...</p>}
              {!materialsLoading && profile?.id && materials.length === 0 && (
                <div className="mandalaEmptyState">
                  <div className="mandalaEmptySeal">✦</div>
                  <b>Добавьте первую мандалу к выбранной настройке</b>
                  <p>Она появится здесь как карточка вашей мастерской.</p>
                </div>
              )}
              {!profile?.id && <p>Список появится после первого сохранения профиля.</p>}

              {filteredMaterials.length > 0 && (
                <div className="mandalaCardsGrid">
                  {filteredMaterials.map((item) => (
                    <article className="mandalaMaterialCard" key={item.id}>
                      {item.image_url ? <div className="mandalaCardImage" style={materialImageStyle(item.image_url)} /> : <div className="mandalaCardImage placeholder">◎</div>}
                      <div className="mandalaCardBody">
                        <div className="mandalaCardChips">
                          <span>{publicationTypeLabel(item.type)}</span>
                          <span className={`statusChip status-${item.status || "draft"}`}>{materialStatusText(item.status)}</span>
                        </div>
                        <h3>{item.title}</h3>
                        <p>{item.description || "Описание не заполнено."}</p>
                        <small>{[item.step_id, item.step_title, item.setting_title].filter(Boolean).join(" · ")}</small>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>
            )}
            </div>
            </div>
          </section>
        </div>
      )}
    </CabinetShell>
  );
}

function CabinetShell({ title, children, onNavigateHome, onNavigateMasters }) {
  return (
    <div className="cabinetShell">
      <header className="cabinetTopbar">
        <button type="button" onClick={onNavigateHome}>← На главную</button>
        <div>
          <p>Reiki Yggdrasil</p>
          <h1>{title}</h1>
        </div>
        <button type="button" onClick={onNavigateMasters}>Каталог мастеров →</button>
      </header>
      <main className="cabinetMain">{children}</main>
    </div>
  );
}
