import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { reikiLevels } from "../../data/reikiKnowledgeBase.js";
import { mysteryTraditions } from "../../data/mysteryTraditions.js";
import {
  POWER_PLACE_SYMBOL_SHELVES,
  listPowerPlaceBackgroundsByShelf,
  listPowerPlaceSymbolsByShelf,
  symbolShelfForConstructorType
} from "../../data/powerPlaceSymbolLibrary.js";
import ProfileLiteImagePicker from "./ProfileLiteImagePicker.jsx";
import "../../profileMandalaWorkspace.css";

const CONSTRUCTOR_TYPES = [
  { value: "zodiac", label: "Зодиак" },
  { value: "star", label: "Звезда" },
  { value: "chess", label: "Шахматы" },
  { value: "client", label: "Мандала" },
  { value: "altar", label: "Алтарь" },
  { value: "business", label: "Бизнес" },
  { value: "dao", label: "ДАО" }
];

const GEOMETRIES = [2, 4, 6, 8, 12];
const MANDALA_STYLE_VARIANTS = [
  { value: "style-1", label: "Стиль 1" },
  { value: "style-2", label: "Стиль 2" },
  { value: "style-3", label: "Стиль 3" }
];
const DAO_LAYOUT_TEMPLATE_STYLE_ID = "dao-layout-template";
const DAO_LAYOUT_TEMPLATE_OPTIONS_REF_KEY = "__dao_layout_template_options";
const DAO_LAYOUT_TEMPLATE_TOP_CROWNS = [
  { value: "roof_double_line", label: "Крыша" },
  { value: "three_checks", label: "3 галочки" }
];
const DAO_LAYOUT_TEMPLATE_SIDE_NODE_COUNTS = [2, 3];
const DAO_STYLE_VARIANTS = [
  { value: "style-1", label: "Стиль 1" },
  { value: "style-2", label: "Стиль 2" },
  { value: "talisman-1", label: "Талисман 1" },
  { value: "talisman-2", label: "Талисман 2" },
  { value: DAO_LAYOUT_TEMPLATE_STYLE_ID, label: "ДАО: Макет" },
  { value: "fu-paper-slip", label: "Фу-лист" },
  { value: "cloud-register", label: "Облачный реестр" },
  { value: "thunder-tablet", label: "Громовая табличка" },
  { value: "taofu-charm", label: "Таофу" },
  { value: "dao-fu-wide-gate-roof", label: "ДАО: широкие врата" },
  { value: "dao-fu-narrow-banner-roof", label: "ДАО: узкий свиток" },
  { value: "dao-fu-grand-gate-p", label: "ДАО: большие врата P" },
  { value: "dao-fu-bottle-p", label: "ДАО: сосуд P" },
  { value: "dao-fu-node-column", label: "ДАО: колонна с узлами" },
  { value: "dao-fu-soft-shoulder-banner", label: "ДАО: мягкий свиток" }
];
const DAO_FULU_STYLES = new Set(["fu-paper-slip", "cloud-register", "thunder-tablet", "taofu-charm"]);
const DAO_FULU_STYLE_VALUES = {
  "fu-paper-slip": {
    className: "dao-fu-paper-slip",
    contourAsset: "/symbols/power-place/dao/fulu/fu-paper-slip.svg"
  },
  "cloud-register": {
    className: "dao-cloud-register",
    contourAsset: "/symbols/power-place/dao/fulu/cloud-register.svg"
  },
  "thunder-tablet": {
    className: "dao-thunder-tablet",
    contourAsset: "/symbols/power-place/dao/fulu/thunder-tablet.svg"
  },
  "taofu-charm": {
    className: "dao-taofu-charm",
    contourAsset: "/symbols/power-place/dao/fulu/taofu-charm.svg"
  }
};
const DAO_FU_OUTLINE_STYLE_VALUES = {
  "dao-fu-wide-gate-roof": {
    className: "dao-fu-wide-gate-roof",
    geometry: { width: "min(372px, 88%) !important", maxWidth: "min(372px, 88%) !important", aspectRatio: "5 / 7" }
  },
  "dao-fu-narrow-banner-roof": {
    className: "dao-fu-narrow-banner-roof",
    geometry: { width: "min(230px, 62%) !important", maxWidth: "min(230px, 62%) !important", aspectRatio: "3 / 7" }
  },
  "dao-fu-grand-gate-p": {
    className: "dao-fu-grand-gate-p",
    geometry: { width: "min(410px, 92%) !important", maxWidth: "min(410px, 92%) !important", aspectRatio: "5 / 6.5" }
  },
  "dao-fu-bottle-p": {
    className: "dao-fu-bottle-p",
    geometry: { width: "min(276px, 68%) !important", maxWidth: "min(276px, 68%) !important", aspectRatio: "3 / 5.8" }
  },
  "dao-fu-node-column": {
    className: "dao-fu-node-column",
    geometry: { width: "min(292px, 72%) !important", maxWidth: "min(292px, 72%) !important", aspectRatio: "3 / 6.2" }
  },
  "dao-fu-soft-shoulder-banner": {
    className: "dao-fu-soft-shoulder-banner",
    geometry: { width: "min(260px, 68%) !important", maxWidth: "min(260px, 68%) !important", aspectRatio: "3 / 6.5" }
  }
};
const DAO_FU_OUTLINE_STYLES = new Set(Object.keys(DAO_FU_OUTLINE_STYLE_VALUES));
const DAO_TALISMAN_NODE_COUNTS = [3, 5, 7, 9];
const ZODIAC_2_VARIANT = "zodiac-2-12";
const ZODIAC_VARIANTS = [
  { value: "classic-2", label: "2", visibleCount: 2 },
  { value: "classic-4", label: "4", visibleCount: 4 },
  { value: "classic-6", label: "6", visibleCount: 6 },
  { value: "classic-8", label: "8", visibleCount: 8 },
  { value: "plus-8", label: "8+", visibleCount: 8 },
  { value: "classic-12", label: "Зодиак 1", visibleCount: 12 },
  { value: ZODIAC_2_VARIANT, label: "Зодиак 2", visibleCount: 12 }
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
  { value: "classic-14", label: "15 фоток", slotCount: 14, layout: "grid-5x3" },
  { value: "classic-8", label: "9 фоток", slotCount: 8, layout: "grid-3x3" },
  { value: "plus-8", label: "9 фото+", slotCount: 8, layout: "outer-inner-square" },
  { value: "compact-5", label: "6 фоток", slotCount: 5, layout: "compact-pentagon-ring" }
];
const CHESS_TOP_SLOTS = Array.from({ length: 5 }, (_, index) => ({
  id: `chess-top-${index + 1}`,
  className: `chess-top-${index + 1}`,
  label: `Верхняя мандала ${index + 1}`,
  classPrefix: "chess-top"
}));
const PROFILE_LITE_REPORT_REF_KEY = "__profile_lite_report";
const MOTION_SETTINGS_REF_KEY = "__motion_settings";
const VISIBILITY_SETTINGS_REF_KEY = "__visibility_settings";
const SHOW_POWER_PLACE_FEED_PROJECTION = false;

const EMPTY_VISIBILITY_SETTINGS = {
  center: true,
  slots: true,
  outer_cover: true,
  inner_cover: true
};
const EMPTY_PROFILE_LITE_REPORT = {
  mode: "without_report",
  added: false,
  situation: "",
  mandala_effect: "",
  extra_help: "",
  master_note: ""
};
const EMPTY_MOTION_SETTINGS = {
  mode: "photo",
  count: 1,
  direction: "clockwise",
  step_seconds: 2,
  video_background_ref: ""
};
const VALID_MOTION_MODES = ["photo", "video"];
const VALID_VIDEO_COUNTS = [1, 4];
const VALID_VIDEO_DIRECTIONS = ["clockwise", "counterclockwise"];
const VALID_VIDEO_STEP_SECONDS = [1, 2, 3];
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
    { id: "chess-1", className: "outer-square outer-top-left", label: "Внешний квадрат · верхний левый" },
    { id: "chess-2", className: "outer-square outer-top-right", label: "Внешний квадрат · верхний правый" },
    { id: "chess-3", className: "outer-square outer-bottom-left", label: "Внешний квадрат · нижний левый" },
    { id: "chess-4", className: "outer-square outer-bottom-right", label: "Внешний квадрат · нижний правый" },
    { id: "chess-5", className: "inner-square inner-top-left", label: "Внутренний квадрат · верхний левый" },
    { id: "chess-6", className: "inner-square inner-top-right", label: "Внутренний квадрат · верхний правый" },
    { id: "chess-7", className: "inner-square inner-bottom-left", label: "Внутренний квадрат · нижний левый" },
    { id: "chess-8", className: "inner-square inner-bottom-right", label: "Внутренний квадрат · нижний правый" }
  ],
  "compact-5": [
    { id: "chess-1", className: "compact-pentagon compact-top", label: "Верхняя мандала" },
    { id: "chess-2", className: "compact-pentagon compact-right", label: "Правая мандала" },
    { id: "chess-3", className: "compact-pentagon compact-bottom-right", label: "Нижняя правая мандала" },
    { id: "chess-4", className: "compact-pentagon compact-bottom-left", label: "Нижняя левая мандала" },
    { id: "chess-5", className: "compact-pentagon compact-left", label: "Левая мандала" }
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
const ZODIAC_PLUS_SLOT_LAYOUT = {
  8: [
    { id: "zodiac-plus-top", className: "plus-top", label: "Топ", classPrefix: "plus" },
    { id: "zodiac-plus-right", className: "plus-right", label: "Право", classPrefix: "plus" },
    { id: "zodiac-plus-bottom", className: "plus-bottom", label: "Низ", classPrefix: "plus" },
    { id: "zodiac-plus-left", className: "plus-left", label: "Лево", classPrefix: "plus" }
  ],
  12: [
    { id: "zodiac-plus-corner-tl", className: "plus-corner-tl", label: "Угол верх-лев", classPrefix: "plus" },
    { id: "zodiac-plus-corner-tr", className: "plus-corner-tr", label: "Угол верх-прав", classPrefix: "plus" },
    { id: "zodiac-plus-corner-bl", className: "plus-corner-bl", label: "Угол низ-лев", classPrefix: "plus" },
    { id: "zodiac-plus-corner-br", className: "plus-corner-br", label: "Угол низ-прав", classPrefix: "plus" }
  ]
};
const ZODIAC_2_INNER_SLOTS = Array.from({ length: 12 }, (_, index) => ({
  id: `zodiac-inner-${index + 1}`,
  className: `inner-${index + 1}`,
  label: `Внутренняя мандала ${index + 1}`,
  classPrefix: "inner"
}));
export const ZODIAC_STYLE_REF_KEY = "__zodiac_style";
export const ZODIAC_STYLE_VARIANTS = [
  { value: "sun", label: "Солнце" },
  { value: "stars", label: "Звёзды" },
  { value: "ribbon", label: "Лента" }
];
export function zodiacStyleValue(value) {
  if (value === "stars" || value === "ribbon") return value;
  return "sun";
}

function isZodiac2Variant(value) {
  return String(value || "") === ZODIAC_2_VARIANT;
}
const CHANNELS_SUBCATEGORIES = [
  { value: "sefirot", label: "Сефирот", thirdLevels: [{ value: "major-arcana", label: "Большие арканы" }, { value: "minor-arcana", label: "Малые арканы" }, { value: "sephirot-siphers", label: "Сиферы" }] },
  { value: "runes", label: "Руны", thirdLevels: [{ value: "first-at", label: "Первый атт" }, { value: "second-at", label: "Второй атт" }, { value: "third-at", label: "Третий атт" }] },
  { value: "planets", label: "Планеты", thirdLevels: [{ value: "sun", label: "Солнце" }, { value: "moon", label: "Луна" }, { value: "mercury", label: "Меркурий" }, { value: "venus", label: "Венера" }, { value: "mars", label: "Марс" }, { value: "jupiter", label: "Юпитер" }, { value: "saturn", label: "Сатурн" }] },
  { value: "money", label: "Деньги" },
  { value: "life", label: "Жизнь" }
];
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
const FALLBACK_COVERS = [
  { id: "no-cover", label: "Без фона", type: "none", src: "" },
  { id: "cover-mentalica", label: "Mentalica", type: "placeholder", tone: "mentalica", src: "" },
  { id: "cover-zodiac-map", label: "Карта мандалы", type: "placeholder", tone: "zodiac-map", src: "" },
  { id: "cover-gold", label: "Золотой поток", type: "placeholder", tone: "gold", src: "" },
  { id: "cover-forest", label: "Древо силы", type: "placeholder", tone: "forest", src: "" },
  { id: "cover-night", label: "Ночная мандала", type: "placeholder", tone: "night", src: "" },
  { id: "cover-gradient-gold", label: "Золото", type: "placeholder", tone: "gradient-gold", src: "" },
  { id: "cover-gradient-forest", label: "Лес", type: "placeholder", tone: "gradient-forest", src: "" },
  { id: "cover-gradient-night", label: "Ночь", type: "placeholder", tone: "gradient-night", src: "" },
  { id: "cover-gradient-fire", label: "Огонь", type: "placeholder", tone: "gradient-fire", src: "" },
  { id: "cover-gradient-water", label: "Вода", type: "placeholder", tone: "gradient-water", src: "" }
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
  { value: "channels", label: "Каналы", subcategories: CHANNELS_SUBCATEGORIES },
  { value: "covers", label: "Фон", subcategories: [{ value: "cover", label: "Фон" }] },
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
  { value: "talismans", label: "Талисманы", subcategories: [] },
  { value: "artifacts", label: "Артефакты", subcategories: [] },
  { value: "favorites", label: "Избранные", subcategories: [] },
  { value: "client-goals", label: "Клиенты", subcategories: [{ value: "client-goals", label: "Фото клиентов" }] }
];
const FIELD_LAYOUTS = [
  { value: "vertical", label: "Вертикальное" },
  { value: "horizontal", label: "Горизонтальное" },
  { value: "rectangle", label: "Прямоугольник" },
  { value: "square", label: "Квадрат" }
];
const POWER_PLACE_DRAG_PAYLOAD_TYPE = "application/x-reiki-power-place-source";

function objectRefText(value) {
  try {
    return JSON.stringify(value || {}, null, 2);
  } catch {
    return "{}";
  }
}

function isImagePreview(value) {
  return Boolean(value && (/^https?:\/\//.test(value) || value.startsWith("data:image/") || value.startsWith("/")));
}

function imageStyle(src) {
  return isImagePreview(src) ? { backgroundImage: `url(${src})` } : undefined;
}

function coverFitValue(value) {
  return String(value || "").trim() === "contain" ? "contain" : "";
}

function buildPowerPlaceDragPayload(item) {
  const objectRef = String(item?.src || item?.object_ref || "");
  if (!objectRef) return null;
  const fit = coverFitValue(item?.fit || item?.cover_fit || item?.coverFit);

  return {
    id: String(item?.id || ""),
    title: String(item?.label || item?.title || item?.name || ""),
    name: String(item?.name || item?.label || item?.title || ""),
    src: String(item?.displaySrc || item?.display_url || item?.src || ""),
    object_ref: objectRef,
    type: item?.kind === "client-photo"
      ? "profile-media"
      : item?.kind === "saved-mandala"
        ? "saved-mandala"
        : item?.kind === "power-place-background"
          ? "power-place-background"
          : String(item?.kind || "profile-media"),
    photoId: item?.photoId ? String(item.photoId) : "",
    ...(fit ? { fit, cover_fit: fit } : {})
  };
}

function parsePowerPlaceDragPayload(dataTransfer) {
  if (!dataTransfer) return null;
  const raw = dataTransfer.getData(POWER_PLACE_DRAG_PAYLOAD_TYPE) || dataTransfer.getData("text/plain");
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw);
    const objectRef = String(parsed?.object_ref || "").trim();
    if (!objectRef) return null;
    const fit = coverFitValue(parsed?.fit || parsed?.cover_fit || parsed?.coverFit);
    return {
      id: String(parsed?.id || "").trim(),
      title: String(parsed?.title || parsed?.name || "").trim(),
      name: String(parsed?.name || parsed?.title || "").trim(),
      src: String(parsed?.src || "").trim(),
      object_ref: objectRef,
      type: ["saved-mandala", "profile-media", "client-photo", "tradition-asset", "material", "power-place-background"].includes(parsed?.type) ? parsed.type : "profile-media",
      photoId: String(parsed?.photoId || "").trim(),
      ...(fit ? { fit, cover_fit: fit } : {})
    };
  } catch {
    return null;
  }
}

// For inner cover images, use a CSS variable so the dynamic style rule can override
// cover-none/cover-gold's !important background declarations without a specificity war.
function innerCoverImageStyle(cover, displaySrc) {
  if (cover?.type === "image" && isImagePreview(displaySrc)) {
    return { "--power-inner-cover-image": `url(${displaySrc})` };
  }
  return imageStyle(displaySrc);
}

function daoFuluContourStyle(styleValue) {
  const asset = DAO_FULU_STYLE_VALUES[styleValue]?.contourAsset;
  return asset ? { "--dao-fulu-contour-image": `url("${asset}")` } : {};
}

function isDaoFuluContourAsset(src) {
  return typeof src === "string" && src.includes("/symbols/power-place/dao/fulu/");
}

function slotScaleValue(value) {
  const scale = Number(value);
  if (!Number.isFinite(scale)) return 1;
  return Math.min(1.85, Math.max(0.7, scale));
}

function chessSlotScaleValue(value) {
  return slotScaleValue(value);
}

function fieldScaleValue(value) {
  const scale = Number(value);
  if (!Number.isFinite(scale)) return 78;
  return Math.min(145, Math.max(48, scale));
}

function centerImageScaleValue(value) {
  const scale = Number(value);
  if (!Number.isFinite(scale)) return 1;
  return Math.min(2, Math.max(0.65, scale));
}

function centerFrameScaleValue(value) {
  const scale = Number(value);
  if (!Number.isFinite(scale)) return 1;
  return Math.min(1.85, Math.max(0.72, scale));
}

export function clampCenterImageOffset(value) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 50;
  return Math.min(80, Math.max(20, parsed));
}

export function clampCenterImageZoom(value) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 1;
  return Math.min(1.8, Math.max(0.65, parsed));
}

export function clampSlotImageOffset(value) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 50;
  return Math.min(80, Math.max(20, parsed));
}

export function clampSlotImageZoom(value) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 1;
  return Math.min(1.8, Math.max(0.65, parsed));
}

// Classify a saved image item as an inner-cover, outer-cover, or legacy (both) shortcut.
// Uses the `meta` field which maps to the `notes` column in the database.
// Cover uploads use notes `Фон мандалы: inner` / `Фон мандалы: outer`.
export function coverShortcutLayerFromPhoto(item) {
  const notes = String(item?.meta || item?.notes || "");
  if (/Фон мандалы:\s*inner/i.test(notes)) return "inner";
  if (/Фон мандалы:\s*outer/i.test(notes)) return "outer";
  return null; // unclassified legacy — show in both layers
}

// Filter cover shortcut candidates for a given layer.
// Photos with a layer marker appear only in their layer.
// Photos without a layer marker appear in both (legacy).
// The active cover for the layer is always included.
export function filterCoverShortcutsByLayer(items, layer, activeCoverSrc) {
  return items.filter((item) => {
    if (activeCoverSrc && item.src === activeCoverSrc) return true;
    const itemLayer = coverShortcutLayerFromPhoto(item);
    if (itemLayer === null) return true; // unclassified legacy
    return itemLayer === layer;
  });
}

function uniqueImageSources(items) {
  const seen = new Set();
  return items.filter((item) => {
    const key = item?.src || item?.displaySrc || item?.id;
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function cleanObjectRefs(refs) {
  return refs && typeof refs === "object" && !Array.isArray(refs) ? refs : {};
}

function normalizeReportDraft(value) {
  const source = value && typeof value === "object" && !Array.isArray(value) ? value : {};
  const hasReportBody = Boolean(source.added || source.situation || source.mandala_effect || source.extra_help);
  return {
    ...EMPTY_PROFILE_LITE_REPORT,
    mode: source.mode === "with_report" || (!source.mode && hasReportBody) ? "with_report" : "without_report",
    added: Boolean(source.added),
    situation: String(source.situation || ""),
    mandala_effect: String(source.mandala_effect || ""),
    extra_help: String(source.extra_help || ""),
    master_note: ""
  };
}

function normalizeMotionSettings(value) {
  const source = value && typeof value === "object" && !Array.isArray(value) ? value : {};
  const mode = VALID_MOTION_MODES.includes(String(source.mode || "").trim()) ? String(source.mode).trim() : EMPTY_MOTION_SETTINGS.mode;
  const count = Number(source.count);
  const direction = VALID_VIDEO_DIRECTIONS.includes(String(source.direction || "").trim()) ? String(source.direction).trim() : EMPTY_MOTION_SETTINGS.direction;
  const stepSeconds = Number(source.step_seconds);
  return {
    mode,
    count: VALID_VIDEO_COUNTS.includes(count) ? count : EMPTY_MOTION_SETTINGS.count,
    direction,
    step_seconds: VALID_VIDEO_STEP_SECONDS.includes(stepSeconds) ? stepSeconds : EMPTY_MOTION_SETTINGS.step_seconds,
    video_background_ref: String(source.video_background_ref || "").trim().startsWith("storage://") ? String(source.video_background_ref || "").trim() : ""
  };
}

function normalizeVisibilitySettings(value) {
  const source = value && typeof value === "object" && !Array.isArray(value) ? value : {};
  return {
    ...EMPTY_VISIBILITY_SETTINGS,
    center: source.center === false ? false : true,
    slots: source.slots === false ? false : true,
    outer_cover: source.outer_cover === false ? false : true,
    inner_cover: source.inner_cover === false ? false : true
  };
}

function normalizeDaoLayoutTemplateOptions(value) {
  const source = value && typeof value === "object" && !Array.isArray(value) ? value : {};
  const topCrown = source.topCrown === "three_checks" ? "three_checks" : "roof_double_line";
  const sideNodeCount = Number(source.sideNodeCount);
  return {
    topCrown,
    sideNodesVisible: source.sideNodesVisible === false ? false : true,
    sideNodeCount: DAO_LAYOUT_TEMPLATE_SIDE_NODE_COUNTS.includes(sideNodeCount) ? sideNodeCount : 2
  };
}

function formatLabel(type) {
  return CONSTRUCTOR_TYPES.find((item) => item.value === type)?.label || "Место силы";
}

function buildSlotList(draft) {
  const type = draft.constructor_type || "zodiac";
  if (type === "client") {
    return Array.from({ length: Number(draft.geometry) || 4 }, (_, index) => ({
      id: `client-${index + 1}`,
      label: `Источник ${index + 1}`
    }));
  }
  if (type === "zodiac") {
    const visibleCount = Number(draft.zodiac_visible_count) || 12;
    const variant = draft.zodiac_variant || (visibleCount === 8 ? "classic-8" : visibleCount === 12 ? "classic-12" : `classic-${visibleCount}`);
    const zodiac2 = isZodiac2Variant(variant);
    const isPlusVariant = !zodiac2 && variant.startsWith("plus");
    const baseVisibleCount = zodiac2 ? 12 : visibleCount;
    const signSlots = ZODIAC_SIGNS.slice(0, isPlusVariant ? 8 : baseVisibleCount).map((sign, index) => ({
      id: `zodiac-${index + 1}`,
      label: sign.label,
      className: sign.className,
      classPrefix: "classic"
    }));

    if (zodiac2) return [...signSlots, ...ZODIAC_2_INNER_SLOTS];
    if (!isPlusVariant) return signSlots;
    if (visibleCount === 8) return signSlots;
    return [...signSlots, ...(ZODIAC_PLUS_SLOT_LAYOUT[visibleCount] || ZODIAC_PLUS_SLOT_LAYOUT[8])];
  }
  if (type === "star") {
    return STAR_POINTS.map((point, index) => ({
      id: `star-${index + 1}`,
      label: point.label,
      className: point.className
    }));
  }
  if (type === "chess") {
    return CHESS_SLOT_LAYOUTS[draft.chess_variant] || CHESS_SLOT_LAYOUTS["classic-14"];
  }
  if (type === "altar") {
    return [
      ...Array.from({ length: 5 }, (_, index) => ({ id: `altar-top-${index + 1}`, label: index === 2 ? "Верхний центр" : `Верхний ${index + 1}` })),
      { id: "altar-support-1", label: "Нижняя опора 1" },
      { id: "altar-support-2", label: "Нижняя опора 2" }
    ];
  }
  if (type === "business") {
    const zones = Number(draft.business_vertex_zone_count) === 3 ? 3 : 1;
    return BUSINESS_VERTICES.flatMap((vertex) =>
      Array.from({ length: zones }, (_, index) => ({
        id: `business-${vertex.id}-${index + 1}`,
        label: zones === 1 ? vertex.label : `${vertex.label} · зона ${index + 1}`
      }))
    );
  }
  if (type === "dao") return DAO_ELEMENTS.map((element) => ({
    id: `dao-${element.id}`,
    label: element.label,
    className: element.className
  }));
  return [];
}

function clockPositions(count, radius = 38, startAngle = -90) {
  const safeCount = Math.max(1, Number(count) || 1);
  return Array.from({ length: safeCount }, (_, index) => {
    const angle = startAngle + (360 / safeCount) * index;
    const radians = angle * (Math.PI / 180);
    return {
      left: 50 + radius * Math.cos(radians),
      top: 50 + radius * Math.sin(radians)
    };
  });
}

function motionCopyOffsets(count, positionsLength) {
  if (Number(count) !== 4) return [0];
  const length = Math.max(1, Number(positionsLength) || 1);
  if (length >= 8) return [0, Math.floor(length / 4), Math.floor(length / 2), Math.floor((length * 3) / 4)];
  if (length === 5) return [0, 1, 2, 3];
  return [0, 1, 2, 3].map((offset) => offset % length);
}

function getGridRingPositions(rows, cols, skipIndex = -1) {
  const positions = [];
  const push = (row, col) => {
    const index = (row - 1) * cols + col;
    if (index === skipIndex) return;
    positions.push({
        left: cols === 1 ? 50 : ((col - 0.5) / cols) * 100,
        top: rows === 1 ? 50 : ((row - 0.5) / rows) * 100
      });
  };
  for (let col = 1; col <= cols; col += 1) push(1, col);
  for (let row = 2; row <= rows; row += 1) push(row, cols);
  if (rows > 1) {
    for (let col = cols - 1; col >= 1; col -= 1) push(rows, col);
  }
  if (cols > 1) {
    for (let row = rows - 1; row >= 2; row -= 1) push(row, 1);
  }
  return positions;
}

const DEFAULT_MOTION_RADIUS = 25;
const CLIENT_MOTION_RADIUS = 25;
// Zodiac geometry (% of container)
const ZODIAC_OUTER_SLOT_RADIUS = 39;      // where zodiac/clock slots sit
const ZODIAC_CENTER_EDGE_RADIUS = 14;     // where the center photo edge reaches
const ZODIAC_COPY_CLEARANCE = 5;          // safe gap between copy outer edge and outer ring inner edge
const ZODIAC_VIDEO_COPY_SAFE_RADIUS = 23; // safe inner ring: ZODIAC_CENTER_EDGE_RADIUS < 23 < ZODIAC_OUTER_SLOT_RADIUS
const ZODIAC_MOTION_RADIUS = Math.round((ZODIAC_OUTER_SLOT_RADIUS + ZODIAC_CENTER_EDGE_RADIUS) / 2); // = 27, midpoint reference
const DAO_MOTION_RADIUS = 24;
const CHESS_MOTION_RADIUS = 24;

function getMotionPositionsForComposition(draft, slots) {
  const type = draft?.constructor_type || "zodiac";
  if (type === "client") return clockPositions(Number(draft.geometry) || slots.length || 4, CLIENT_MOTION_RADIUS);
  if (type === "zodiac") return clockPositions(Number(draft.zodiac_visible_count) || 12, ZODIAC_VIDEO_COPY_SAFE_RADIUS);
  if (type === "star") {
    return [
      { left: 50, top: 22 },
      { left: 73, top: 40 },
      { left: 64, top: 68 },
      { left: 36, top: 68 },
      { left: 27, top: 40 }
    ];
  }
  if (type === "dao") return clockPositions(5, DAO_MOTION_RADIUS, -90);
  if (type === "business") {
    return [
      { left: 50, top: 24 },
      { left: 68, top: 68 },
      { left: 32, top: 68 }
    ];
  }
  if (type === "altar") {
    return [
      { left: 26, top: 30 },
      { left: 38, top: 30 },
      { left: 50, top: 30 },
      { left: 62, top: 30 },
      { left: 74, top: 30 },
      { left: 38, top: 70 },
      { left: 62, top: 70 }
    ];
  }
  if (type === "chess") {
    if (draft.chess_variant === "compact-5") {
      return clockPositions(5, CHESS_MOTION_RADIUS, -90);
    }
    if (draft.chess_variant === "plus-8") {
      return [
        { left: 26, top: 26 },
        { left: 74, top: 26 },
        { left: 74, top: 74 },
        { left: 26, top: 74 },
        { left: 39, top: 39 },
        { left: 61, top: 39 },
        { left: 61, top: 61 },
        { left: 39, top: 61 }
      ];
    }
    if (draft.chess_variant === "classic-8") return getGridRingPositions(3, 3, 5);
    return getGridRingPositions(5, 3, 8);
  }
  return clockPositions(slots.length || 4, DEFAULT_MOTION_RADIUS);
}

function coverLayer(coverRef, layer) {
  if (!coverRef) return FALLBACK_COVERS[0];
  if (layer === "inner") return coverRef.inner || coverRef || FALLBACK_COVERS[0];
  return coverRef.outer || FALLBACK_COVERS[0];
}

function coverKindClass(cover, layer) {
  if (cover?.type === "image") return layer === "outer" ? "has-custom-outer-cover" : "has-custom-inner-cover";
  return "";
}

function outerCoverFitClass(cover) {
  return cover?.type === "image" && coverFitValue(cover?.fit || cover?.cover_fit || cover?.coverFit) === "contain"
    ? "outer-cover-fit-contain"
    : "";
}

function coverToneClass(cover) {
  if (!cover || cover.type === "none" || cover.id === "no-cover") return "cover-none";
  if (cover.type === "image") return "cover-image";
  return `cover-${cover.tone || "none"}`;
}

export default function ProfileLitePowerPlaceModule({
  accountPlan = "start",
  clientGoalPhotos,
  compositionDraft,
  compositionMessage,
  mandalasError,
  mandalasStatus,
  materials,
  mediaError,
  mediaStatus,
  onFeedFormChange,
  onAddCompositionToServices,
  onClientPhotoDelete,
  onCompositionCoverSelect,
  onCompositionDraftChange,
  onCompositionLoad,
  onCompositionObjectRefSelect,
  onCompositionObjectRefsChange,
  onCoverFileUpload,
  onDownload,
  onLibraryPhotoUpload,
  onObjectFileUpload,
  onPrint,
  onPublishAsService,
  onPublishToFeed,
  onSaveNew,
  onSendToServices,
  onStartNewDraft,
  onUpdateExisting,
  onUploadedCentralPhoto,
  planLimits,
  powerPlaceFeedForm = { title: "", body: "", category: "mandalas", tags: "" },
  powerPlaceFeedStatus = "idle",
  powerPlaceCompositions,
  services = [],
  shellChrome,
  traditionAssets
}) {
  const [workspaceTab, setWorkspaceTab] = useState("power-place");
  const [selectedSlotId, setSelectedSlotId] = useState("");
  const [pickerMode, setPickerMode] = useState("");
  const [pickerUploadStatus, setPickerUploadStatus] = useState("idle");
  const [pickerUploadError, setPickerUploadError] = useState("");
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [coverLayerMode, setCoverLayerMode] = useState("inner");
  const [activeSourceCategory, setActiveSourceCategory] = useState("");
  const [activeSourceSubcategory, setActiveSourceSubcategory] = useState("");
  const [activeSourceThirdLevel, setActiveSourceThirdLevel] = useState("");
  const [hiddenCoverShortcutIds, setHiddenCoverShortcutIds] = useState([]);
  const [dragOverSlotId, setDragOverSlotId] = useState("");
  const [libraryMode, setLibraryMode] = useState("symbols");
  const [symbolShelfState, setSymbolShelfState] = useState(() => ({
    value: symbolShelfForConstructorType(compositionDraft?.constructor_type),
    manual: false
  }));
  const [motionStep, setMotionStep] = useState(0);
  const [videoExportMessage, setVideoExportMessage] = useState("");
  const suppressCenterPickerClickRef = useRef(false);
  const centerDragRef = useRef({ active: false, startX: 0, startY: 0, startOffsetX: 50, startOffsetY: 50, startPointerId: -1, moved: false, currentOffsetX: 50, currentOffsetY: 50 });
  const centerPinchRef = useRef({ active: false, pointers: [], startDist: 0, startZoom: 1, currentZoom: undefined });
  const slotDragRef = useRef({});
  const slotPinchRef = useRef({});
  const suppressSlotPickerClickRef = useRef({});
  const objectRefs = cleanObjectRefs(compositionDraft.object_refs);
  const slots = useMemo(() => buildSlotList(compositionDraft), [compositionDraft]);
  const motionSettings = normalizeMotionSettings(objectRefs[MOTION_SETTINGS_REF_KEY]);
  const visibilitySettings = normalizeVisibilitySettings(objectRefs[VISIBILITY_SETTINGS_REF_KEY]);
  const motionMode = motionSettings.mode;
  const videoCount = motionSettings.count;
  const videoDirection = motionSettings.direction;
  const videoStepSeconds = motionSettings.step_seconds;
  const videoEnabled = motionMode === "video";
  const selectedSlot = slots.find((slot) => slot.id === selectedSlotId) || slots[0] || null;
  const selectedSlotImage = selectedSlot ? objectRefs[selectedSlot.id] || "" : "";
  const objectRefUrls = cleanObjectRefs(compositionDraft.object_ref_urls);
  const coverDisplaySrc = (cover) =>
    objectRefUrls[cover?.src] ||
    objectRefUrls[cover?.display_src] ||
    cover?.display_src ||
    cover?.displaySrc ||
    cover?.src ||
    "";
  const centralPhoto = clientGoalPhotos.find((item) => item.id === compositionDraft.central_photo_id) || null;
  const centralImageRef = objectRefs.__center_image || "";
  const centralDisplayCandidate = objectRefUrls[centralImageRef] || objectRefUrls.__center_image || centralPhoto?.display_url || centralPhoto?.signed_url || centralPhoto?.image_url || centralImageRef;
  const centralImage = isImagePreview(centralDisplayCandidate) ? centralDisplayCandidate : "";
  const innerCover = coverLayer(compositionDraft.cover_ref, "inner");
  const outerCover = coverLayer(compositionDraft.cover_ref, "outer");
  const visibleCover = coverLayerMode === "outer" ? outerCover : innerCover;
  const innerCoverClass = coverKindClass(innerCover, "inner");
  const outerCoverClass = coverKindClass(outerCover, "outer");
  const outerCoverFitClassName = outerCoverFitClass(outerCover);
  const daoStyle = compositionDraft.__dao_style || "style-1";
  const isDaoStyle1 = daoStyle === "style-1";
  const isDaoStyle2 = daoStyle === "style-2";
  const isDaoTalisman1 = daoStyle === "talisman-1";
  const isDaoTalisman2 = daoStyle === "talisman-2";
  const isDaoLayoutTemplate = daoStyle === DAO_LAYOUT_TEMPLATE_STYLE_ID;
  const isDaoFulu = DAO_FULU_STYLES.has(daoStyle);
  const isDaoFuOutline = DAO_FU_OUTLINE_STYLES.has(daoStyle);
  const daoLayoutTemplateOptions = normalizeDaoLayoutTemplateOptions(objectRefs[DAO_LAYOUT_TEMPLATE_OPTIONS_REF_KEY]);
  const innerCoverSrc = coverDisplaySrc(innerCover);
  const innerCoverIsFuluContour = isDaoFuluContourAsset(innerCoverSrc);
  const sourceSlotScale = slotScaleValue(objectRefs.__slot_scale ?? compositionDraft.slot_scale ?? compositionDraft.chess_slot_scale ?? 1);
  const fieldScale = fieldScaleValue(compositionDraft.field_scale ?? objectRefs.__inner_field_scale);
  const centerImageScale = centerImageScaleValue(compositionDraft.__center_image_scale ?? objectRefs.__center_image_scale);
  const centerFrameScale = centerFrameScaleValue(compositionDraft.__center_frame_scale ?? objectRefs.__center_frame_scale);
  const centerImageOffsetX = clampCenterImageOffset(compositionDraft.__center_image_offset_x ?? objectRefs.__center_image_offset_x);
  const centerImageOffsetY = clampCenterImageOffset(compositionDraft.__center_image_offset_y ?? objectRefs.__center_image_offset_y);
  const centerImageZoom = clampCenterImageZoom(compositionDraft.__center_image_zoom ?? objectRefs.__center_image_zoom);
  const chessVariant = compositionDraft.chess_variant || "classic-14";
  const zodiacVariant = compositionDraft.zodiac_variant || `classic-${compositionDraft.zodiac_visible_count || 12}`;
  const isZodiac2 = compositionDraft.constructor_type === "zodiac" && isZodiac2Variant(zodiacVariant);
  const zodiacStyle = zodiacStyleValue(compositionDraft.__zodiac_style);
  const chessSlotScale = chessSlotScaleValue(objectRefs.__slot_scale ?? compositionDraft.slot_scale ?? compositionDraft.chess_slot_scale ?? 1);
  const savedCompositionCount = powerPlaceCompositions.length;
  const savedCompositionLimit = planLimits.compositions;
  const createNewDisabled = savedCompositionCount >= savedCompositionLimit;
  const updateExistingDisabled = !compositionDraft.id;
  const defaultSymbolShelf = symbolShelfForConstructorType(compositionDraft.constructor_type);
  const activeSymbolShelf = symbolShelfState.value || defaultSymbolShelf;
  const activeSymbolShelfItems = useMemo(() => listPowerPlaceSymbolsByShelf(activeSymbolShelf), [activeSymbolShelf]);
  const activeBackgroundShelfItems = useMemo(() => listPowerPlaceBackgroundsByShelf(activeSymbolShelf), [activeSymbolShelf]);

  useEffect(() => {
    if (symbolShelfState.manual) return;
    setSymbolShelfState((current) => current.value === defaultSymbolShelf
      ? current
      : { value: defaultSymbolShelf, manual: false });
  }, [defaultSymbolShelf, symbolShelfState.manual]);

  useEffect(() => {
    if (!videoEnabled) return undefined;
    const timer = window.setInterval(() => {
      setMotionStep((current) => current + 1);
    }, videoStepSeconds * 1000);
    return () => window.clearInterval(timer);
  }, [
    videoEnabled,
    videoStepSeconds,
    videoDirection,
    videoCount,
    compositionDraft.constructor_type,
    compositionDraft.geometry,
    compositionDraft.zodiac_visible_count,
    compositionDraft.chess_variant
  ]);

  const handleSaveNewClick = () => {
    if (createNewDisabled) return;
    onSaveNew();
  };

  const writeCenterImageTransform = useCallback((offsetX, offsetY, zoom) => {
    const nextRefs = {
      ...objectRefs,
      __center_image_offset_x: String(clampCenterImageOffset(offsetX)),
      __center_image_offset_y: String(clampCenterImageOffset(offsetY)),
      __center_image_zoom: String(clampCenterImageZoom(zoom))
    };
    onCompositionObjectRefsChange(JSON.stringify(nextRefs, null, 2));
  }, [objectRefs, onCompositionObjectRefsChange]);

  const slotTransforms = cleanObjectRefs(objectRefs.__slot_transforms);

  function slotImageTransformFor(slotId) {
    const t = slotTransforms[slotId];
    return {
      x: clampSlotImageOffset(t?.x ?? 50),
      y: clampSlotImageOffset(t?.y ?? 50),
      zoom: clampSlotImageZoom(t?.zoom ?? 1)
    };
  }

  const writeSlotImageTransform = useCallback((slotId, x, y, zoom) => {
    const currentTransforms = cleanObjectRefs(objectRefs.__slot_transforms);
    const nextTransforms = {
      ...currentTransforms,
      [slotId]: {
        x: clampSlotImageOffset(x),
        y: clampSlotImageOffset(y),
        zoom: clampSlotImageZoom(zoom)
      }
    };
    const nextRefs = { ...objectRefs, __slot_transforms: nextTransforms };
    onCompositionObjectRefsChange(JSON.stringify(nextRefs, null, 2));
  }, [objectRefs, onCompositionObjectRefsChange]);

  const slotAdjustments = cleanObjectRefs(objectRefs.__slot_adjustments);

  function slotImageAdjustmentFor(slotId) {
    const a = slotAdjustments[slotId];
    const b = Number(a?.brightness);
    const c = Number(a?.contrast);
    return {
      brightness: Number.isFinite(b) ? Math.round(Math.max(40, Math.min(160, b))) : 100,
      contrast: Number.isFinite(c) ? Math.round(Math.max(40, Math.min(180, c))) : 100
    };
  }

  const writeSlotImageAdjustment = useCallback((slotId, brightness, contrast) => {
    const currentAdjustments = cleanObjectRefs(objectRefs.__slot_adjustments);
    const nextAdjustments = {
      ...currentAdjustments,
      [slotId]: {
        brightness: Math.round(Math.max(40, Math.min(160, brightness))),
        contrast: Math.round(Math.max(40, Math.min(180, contrast)))
      }
    };
    const nextRefs = { ...objectRefs, __slot_adjustments: nextAdjustments };
    onCompositionObjectRefsChange(JSON.stringify(nextRefs, null, 2));
  }, [objectRefs, onCompositionObjectRefsChange]);

  function slotImageStyle(slotId, displaySrc) {
    if (!isImagePreview(displaySrc)) return imageStyle(displaySrc);
    const { x, y, zoom } = slotImageTransformFor(slotId);
    const { brightness, contrast } = slotImageAdjustmentFor(slotId);
    return {
      backgroundImage: `url(${displaySrc})`,
      "--slot-bg-pos": `${x}% ${y}%`,
      "--slot-bg-zoom": String(zoom),
      filter: `brightness(${brightness}%) contrast(${contrast}%)`,
      touchAction: "none"
    };
  }

  function getSlotImagePanZoomHandlers(slotId) {
    return {
      onPointerDown(e) {
        const pinch = slotPinchRef.current[slotId];
        if (pinch && pinch.pointers.length === 1) {
          pinch.pointers.push({ id: e.pointerId, x: e.clientX, y: e.clientY });
          const [p1, p2] = pinch.pointers;
          pinch.startDist = Math.hypot(p2.x - p1.x, p2.y - p1.y);
          const t = slotImageTransformFor(slotId);
          pinch.startZoom = t.zoom;
          pinch.currentZoom = t.zoom;
          pinch.active = true;
          const drag = slotDragRef.current[slotId];
          if (drag) drag.active = false;
          return;
        }
        const t = slotImageTransformFor(slotId);
        e.currentTarget.setPointerCapture(e.pointerId);
        slotDragRef.current[slotId] = {
          active: true,
          startX: e.clientX,
          startY: e.clientY,
          startOffsetX: t.x,
          startOffsetY: t.y,
          pointerId: e.pointerId,
          moved: false,
          currentOffsetX: t.x,
          currentOffsetY: t.y
        };
        slotPinchRef.current[slotId] = { pointers: [{ id: e.pointerId, x: e.clientX, y: e.clientY }], active: false, startDist: 0, startZoom: t.zoom, currentZoom: t.zoom };
        e.currentTarget.style.cursor = "grabbing";
      },
      onPointerMove(e) {
        const pinch = slotPinchRef.current[slotId];
        if (pinch?.active) {
          const pIdx = pinch.pointers.findIndex((p) => p.id === e.pointerId);
          if (pIdx === -1) return;
          pinch.pointers[pIdx] = { id: e.pointerId, x: e.clientX, y: e.clientY };
          const [p1, p2] = pinch.pointers;
          const dist = Math.hypot(p2.x - p1.x, p2.y - p1.y);
          if (pinch.startDist > 0) {
            const newZoom = clampSlotImageZoom(pinch.startZoom * (dist / pinch.startDist));
            pinch.currentZoom = newZoom;
            e.currentTarget.style.setProperty("--slot-bg-zoom", String(newZoom));
            suppressSlotPickerClickRef.current[slotId] = true;
          }
          return;
        }
        const drag = slotDragRef.current[slotId];
        if (!drag?.active || e.pointerId !== drag.pointerId) return;
        const dX = e.clientX - drag.startX;
        const dY = e.clientY - drag.startY;
        if (Math.abs(dX) > 3 || Math.abs(dY) > 3) {
          drag.moved = true;
          suppressSlotPickerClickRef.current[slotId] = true;
        }
        const rect = e.currentTarget.getBoundingClientRect();
        drag.currentOffsetX = clampSlotImageOffset(drag.startOffsetX - (rect.width > 0 ? (dX / rect.width) * 100 : 0));
        drag.currentOffsetY = clampSlotImageOffset(drag.startOffsetY - (rect.height > 0 ? (dY / rect.height) * 100 : 0));
        e.currentTarget.style.setProperty("--slot-bg-pos", `${drag.currentOffsetX}% ${drag.currentOffsetY}%`);
      },
      onPointerUp(e) {
        const pinch = slotPinchRef.current[slotId];
        if (pinch?.active) {
          const pIdx = pinch.pointers.findIndex((p) => p.id === e.pointerId);
          if (pIdx !== -1) pinch.pointers.splice(pIdx, 1);
          if (pinch.pointers.length < 2) {
            pinch.active = false;
            const t = slotImageTransformFor(slotId);
            writeSlotImageTransform(slotId, t.x, t.y, pinch.currentZoom ?? t.zoom);
            e.currentTarget.style.removeProperty("--slot-bg-zoom");
          }
          return;
        }
        const drag = slotDragRef.current[slotId];
        if (!drag?.active || e.pointerId !== drag.pointerId) return;
        drag.active = false;
        e.currentTarget.style.cursor = "";
        e.currentTarget.style.removeProperty("--slot-bg-pos");
        if (drag.moved) {
          const t = slotImageTransformFor(slotId);
          writeSlotImageTransform(slotId, drag.currentOffsetX, drag.currentOffsetY, t.zoom);
        }
        if (pinch) {
          const pIdx = pinch.pointers.findIndex((p) => p.id === e.pointerId);
          if (pIdx !== -1) pinch.pointers.splice(pIdx, 1);
        }
      },
      onPointerCancel() {
        delete slotDragRef.current[slotId];
        delete slotPinchRef.current[slotId];
        delete suppressSlotPickerClickRef.current[slotId];
      },
      onWheel(e) {
        e.preventDefault();
        const t = slotImageTransformFor(slotId);
        const delta = e.deltaY > 0 ? -0.05 : 0.05;
        writeSlotImageTransform(slotId, t.x, t.y, clampSlotImageZoom(t.zoom + delta));
      }
    };
  }

  const handleCenterPointerDown = useCallback((e) => {
    if (!centralImage) return;
    const pinch = centerPinchRef.current;
    if (pinch.pointers.length === 1) {
      pinch.pointers.push({ id: e.pointerId, x: e.clientX, y: e.clientY });
      const [p1, p2] = pinch.pointers;
      pinch.startDist = Math.hypot(p2.x - p1.x, p2.y - p1.y);
      pinch.startZoom = centerImageZoom;
      pinch.currentZoom = centerImageZoom;
      pinch.active = true;
      centerDragRef.current.active = false;
      return;
    }
    e.currentTarget.setPointerCapture(e.pointerId);
    centerPinchRef.current = { active: false, pointers: [{ id: e.pointerId, x: e.clientX, y: e.clientY }], startDist: 0, startZoom: centerImageZoom, currentZoom: centerImageZoom };
    centerDragRef.current = {
      active: true,
      startX: e.clientX,
      startY: e.clientY,
      startOffsetX: centerImageOffsetX,
      startOffsetY: centerImageOffsetY,
      startPointerId: e.pointerId,
      moved: false,
      currentOffsetX: centerImageOffsetX,
      currentOffsetY: centerImageOffsetY
    };
    e.currentTarget.style.cursor = "grabbing";
  }, [centralImage, centerImageOffsetX, centerImageOffsetY, centerImageZoom]);

  const handleCenterPointerMove = useCallback((e) => {
    const pinch = centerPinchRef.current;
    if (pinch.active) {
      const pIdx = pinch.pointers.findIndex((p) => p.id === e.pointerId);
      if (pIdx === -1) return;
      pinch.pointers[pIdx] = { id: e.pointerId, x: e.clientX, y: e.clientY };
      const [p1, p2] = pinch.pointers;
      const dist = Math.hypot(p2.x - p1.x, p2.y - p1.y);
      if (pinch.startDist > 0) {
        const newZoom = clampCenterImageZoom(pinch.startZoom * (dist / pinch.startDist));
        pinch.currentZoom = newZoom;
        e.currentTarget.parentElement?.style.setProperty("--power-center-image-scale", String(newZoom));
        suppressCenterPickerClickRef.current = true;
      }
      return;
    }
    const drag = centerDragRef.current;
    if (!drag.active || e.pointerId !== drag.startPointerId) return;
    const deltaX = e.clientX - drag.startX;
    const deltaY = e.clientY - drag.startY;
    if (Math.abs(deltaX) > 3 || Math.abs(deltaY) > 3) {
      drag.moved = true;
      suppressCenterPickerClickRef.current = true;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    const xPct = rect.width > 0 ? (deltaX / rect.width) * 100 : 0;
    const yPct = rect.height > 0 ? (deltaY / rect.height) * 100 : 0;
    drag.currentOffsetX = clampCenterImageOffset(drag.startOffsetX - xPct);
    drag.currentOffsetY = clampCenterImageOffset(drag.startOffsetY - yPct);
    e.currentTarget.style.setProperty("--power-center-bg-pos", `${drag.currentOffsetX}% ${drag.currentOffsetY}%`);
  }, []);

  const handleCenterPointerUp = useCallback((e) => {
    const pinch = centerPinchRef.current;
    if (pinch.active) {
      const pIdx = pinch.pointers.findIndex((p) => p.id === e.pointerId);
      if (pIdx !== -1) pinch.pointers.splice(pIdx, 1);
      if (pinch.pointers.length < 2) {
        pinch.active = false;
        e.currentTarget.parentElement?.style.removeProperty("--power-center-image-scale");
        writeCenterImageTransform(centerImageOffsetX, centerImageOffsetY, pinch.currentZoom ?? centerImageZoom);
      }
      return;
    }
    const drag = centerDragRef.current;
    if (!drag.active || e.pointerId !== drag.startPointerId) return;
    drag.active = false;
    e.currentTarget.style.cursor = "";
    e.currentTarget.style.removeProperty("--power-center-bg-pos");
    if (drag.moved) {
      writeCenterImageTransform(drag.currentOffsetX, drag.currentOffsetY, centerImageZoom);
    }
    if (pinch.pointers.length > 0) {
      const pIdx = pinch.pointers.findIndex((p) => p.id === e.pointerId);
      if (pIdx !== -1) pinch.pointers.splice(pIdx, 1);
    }
  }, [centerImageOffsetX, centerImageOffsetY, centerImageZoom, writeCenterImageTransform]);

  const handleCenterPointerCancel = useCallback((e) => {
    const drag = centerDragRef.current;
    drag.active = false;
    drag.moved = false;
    centerPinchRef.current = { active: false, pointers: [], startDist: 0, startZoom: 1, currentZoom: undefined };
    suppressCenterPickerClickRef.current = false;
    e.currentTarget.style.cursor = "";
    e.currentTarget.style.removeProperty("--power-center-bg-pos");
    e.currentTarget.parentElement?.style.removeProperty("--power-center-image-scale");
  }, []);

  const handleCenterWheel = useCallback((e) => {
    if (!centralImage) return;
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.05 : 0.05;
    const newZoom = clampCenterImageZoom(centerImageZoom + delta);
    writeCenterImageTransform(centerImageOffsetX, centerImageOffsetY, newZoom);
  }, [centralImage, centerImageOffsetX, centerImageOffsetY, centerImageZoom, writeCenterImageTransform]);

  const sourceSlotScaleStyle = {
    "--power-source-slot-scale": sourceSlotScale,
    "--power-place-chess-slot-scale": chessSlotScale,
    "--power-field-scale": `${fieldScale}%`,
    "--power-center-image-scale": centerImageScale,
    "--power-center-frame-scale": centerFrameScale
  };
  const centerImageAdj = slotImageAdjustmentFor("__center_image");
  const centerImageStyle = {
    ...(imageStyle(centralImage) || {}),
    "--power-center-image-scale": centerImageScale,
    ...(centralImage ? { filter: `brightness(${centerImageAdj.brightness}%) contrast(${centerImageAdj.contrast}%)` } : {})
  };
  const chessCoverStyle = {
    ...(innerCoverImageStyle(innerCover, coverDisplaySrc(innerCover)) || {}),
    ...sourceSlotScaleStyle
  };
  const daoBaseCoverStyle = !isDaoFulu && !isDaoFuOutline && !innerCoverIsFuluContour
    ? innerCoverImageStyle(innerCover, innerCoverSrc) || {}
    : {};
  const daoFuluStyle = isDaoFulu
    ? {
      ...daoFuluContourStyle(daoStyle),
      ...(!innerCoverIsFuluContour && isImagePreview(innerCoverSrc)
        ? { "--dao-fulu-user-cover-image": `url(${innerCoverSrc})` }
      : {})
    }
    : {};
  const daoFieldLayerStyle = !innerCoverIsFuluContour && isImagePreview(innerCoverSrc)
    ? { "--dao-field-cover-image": `url(${innerCoverSrc})` }
    : {};
  const daoStyleGeometry = isDaoTalisman1
    ? { width: "min(336px, 82%) !important", maxWidth: "min(336px, 82%) !important", aspectRatio: "9 / 16" }
    : isDaoTalisman2
      ? { width: "min(292px, 78%) !important", maxWidth: "min(292px, 78%) !important", aspectRatio: "9 / 16" }
      : isDaoLayoutTemplate
        ? { width: "min(292px, 78%) !important", maxWidth: "min(292px, 78%) !important", aspectRatio: "9 / 16" }
        : isDaoFulu || isDaoStyle2
          ? { width: "min(248px, 60%) !important", maxWidth: "min(248px, 60%) !important", aspectRatio: "1 / 2.9" }
          : isDaoFuOutline
            ? DAO_FU_OUTLINE_STYLE_VALUES[daoStyle].geometry
            : {};
  const daoOuterStyle = {
    ...daoBaseCoverStyle,
    ...daoFuluStyle,
    ...daoFieldLayerStyle,
    ...daoStyleGeometry
  };

  const savedImages = useMemo(() => uniqueImageSources([
    ...powerPlaceCompositions.map((composition) => {
      const refs = cleanObjectRefs(composition.object_refs);
      const urls = cleanObjectRefs(composition.object_ref_urls);
      const cover = composition.cover_ref || {};
      const innerCoverRef = cover.inner?.src || cover.src || "";
      const outerCoverRef = cover.outer?.src || "";
      const src = refs.__center_image || innerCoverRef || outerCoverRef || Object.values(refs).find((value) => typeof value === "string" && isImagePreview(urls[value] || value)) || "";
      const displaySrc = urls[src] || cover.inner?.display_src || cover.display_src || cover.outer?.display_src || src;

      return {
        id: `composition-${composition.id}`,
        label: composition.title || "Сохранённая мандала",
        meta: formatLabel(composition.constructor_type),
        src,
        displaySrc,
        signingError: "",
        kind: "saved-mandala",
        compositionId: composition.id,
        favorite: false,
        updatedAt: composition.updated_at || composition.created_at || ""
      };
    }),
    ...clientGoalPhotos.map((photo) => ({
      id: `client-${photo.id}`,
      label: photo.title || "Фото клиента / цели",
      meta: photo.notes || "Клиенты",
      src: photo.image_ref || photo.image_url,
      displaySrc: photo.display_url || photo.signed_url || photo.image_url,
      signingError: photo.media_signing_error || "",
      kind: "client-photo",
      clientCategory: photo.client_category || "all",
      photoId: photo.id,
      favorite: Boolean(photo.favorite || photo.is_favorite || photo.pinned),
      updatedAt: photo.updated_at || photo.created_at || ""
    })),
    ...traditionAssets.map((asset) => ({
      id: `tradition-${asset.id}`,
      label: asset.title || asset.tradition_title || "Образ традиции",
      meta: asset.tradition_title || "Мистерии",
      src: asset.image_ref || asset.image_url,
      displaySrc: asset.display_url || asset.signed_url || asset.image_url,
      signingError: asset.media_signing_error || "",
      kind: "tradition-asset",
      group: "god-channels",
      traditionId: asset.tradition_id || "",
      favorite: Boolean(asset.favorite || asset.is_favorite || asset.pinned),
      updatedAt: asset.updated_at || asset.created_at || ""
    })),
    ...materials.map((item) => ({
      id: `material-${item.id}`,
      label: item.title || "Материал",
      meta: item.material_category || item.step_title || item.type || "Материалы",
      src: item.image_ref || item.image_url,
      displaySrc: item.display_url || item.signed_url || item.image_url,
      signingError: item.media_signing_error || "",
      kind: "material",
      group: item.material_group || item.group || "",
      stepId: item.step_id || "",
      type: item.type || "",
      favorite: Boolean(item.favorite || item.is_favorite || item.pinned),
      updatedAt: item.updated_at || item.created_at || ""
    }))
  ]), [clientGoalPhotos, materials, powerPlaceCompositions, traditionAssets]);

  const latestSavedImages = useMemo(() => [...savedImages].sort((a, b) => {
    const left = Date.parse(a.updatedAt || "");
    const right = Date.parse(b.updatedAt || "");
    if (Number.isNaN(left) && Number.isNaN(right)) return 0;
    if (Number.isNaN(left)) return 1;
    if (Number.isNaN(right)) return -1;
    return right - left;
  }), [savedImages]);

  const hiddenCoverShortcutIdSet = useMemo(() => new Set(hiddenCoverShortcutIds), [hiddenCoverShortcutIds]);
  const savedCoverOptions = useMemo(() => {
    // Only client-photo items can be cover shortcuts (they carry the "Фон мандалы: layer" note).
    // Unclassified client photos (no layer note) appear in both layers as legacy shortcuts.
    const activeCoverSrc = visibleCover?.src || "";
    const candidates = latestSavedImages.filter((item) =>
      item.src && item.kind === "client-photo" && !hiddenCoverShortcutIdSet.has(item.id)
    );
    return filterCoverShortcutsByLayer(candidates, coverLayerMode, activeCoverSrc)
      .slice(0, 6)
      .map((item) => ({
        id: `saved-cover-${item.id}`,
        shortcutId: item.id,
        label: item.label,
        type: "image",
        src: item.src,
        display_src: item.displaySrc,
        displaySrc: item.displaySrc
      }));
  }, [hiddenCoverShortcutIdSet, latestSavedImages, coverLayerMode, visibleCover]);
  const coverOptions = useMemo(() => [
    ...FALLBACK_COVERS,
    ...savedCoverOptions,
    ...(innerCover?.id === "custom-cover" ? [innerCover] : []),
    ...(outerCover?.id === "custom-outer-cover" ? [outerCover] : [])
  ], [innerCover, outerCover, savedCoverOptions]);
  const activeCover = visibleCover;
  const coverLayerSaveTarget = coverLayerMode === "inner" ? "cover_ref.inner" : "cover_ref.outer";
  const activeSourceCategoryData = SOURCE_LIBRARY_CATEGORIES.find((item) => item.value === activeSourceCategory) || null;
  const activeSourceSubcategoryData = activeSourceCategoryData?.subcategories?.find((item) => item.value === activeSourceSubcategory) || activeSourceCategoryData?.subcategories?.[0] || null;
  const activeSourceThirdLevelData = activeSourceSubcategoryData?.thirdLevels?.find((item) => item.value === activeSourceThirdLevel) || activeSourceSubcategoryData?.thirdLevels?.[0] || null;
  const reportDraft = normalizeReportDraft(objectRefs[PROFILE_LITE_REPORT_REF_KEY]);
  const reportEnabled = reportDraft.mode === "with_report";
  const reportAdded = reportEnabled && reportDraft.added;
  const reportHasBody = Boolean(reportDraft.situation || reportDraft.mandala_effect || reportDraft.extra_help);
  const serviceByCompositionId = useMemo(() => {
    const next = new Map();
    (services || []).forEach((service) => {
      const compositionId = String(service?.composition_id || "").trim();
      if (compositionId && !next.has(compositionId)) next.set(compositionId, service);
    });
    return next;
  }, [services]);
  const compositionById = useMemo(() => {
    const next = new Map();
    (powerPlaceCompositions || []).forEach((composition) => {
      const compositionId = String(composition?.id || "").trim();
      if (compositionId) next.set(compositionId, composition);
    });
    return next;
  }, [powerPlaceCompositions]);
  const compositionServices = useMemo(
    () => (services || []).filter((service) => String(service?.composition_id || "").trim()),
    [services]
  );

  const resolveCompositionPreviewSrc = (composition) => {
    const coverRef = composition?.cover_ref || {};
    const innerCoverRef = coverRef?.inner || {};
    const compositionObjectRefUrls = cleanObjectRefs(composition?.object_ref_urls);
    const candidates = [
      innerCoverRef.display_src,
      innerCoverRef.displaySrc,
      innerCoverRef.src,
      coverRef.display_src,
      coverRef.displaySrc,
      coverRef.src
    ];
    return candidates
      .map((candidate) => compositionObjectRefUrls[candidate] || candidate)
      .find(isImagePreview) || "";
  };

  const compositionDateLabel = (composition) => {
    const raw = composition?.updated_at || composition?.created_at || "";
    if (!raw) return "needs verification";
    const parsed = new Date(raw);
    if (Number.isNaN(parsed.getTime())) return raw;
    return parsed.toLocaleDateString("ru-RU");
  };

  const updateReportDraft = (patch) => {
    const nextReport = normalizeReportDraft({ ...reportDraft, ...patch });
    onCompositionDraftChange(PROFILE_LITE_REPORT_REF_KEY, nextReport);
  };

  const renderMotionControls = () => (
    <div className="powerPlaceMotionControls" aria-label="Режим фото и видео">
      <div className="powerPlaceVideoControls" role="group" aria-label="Режим конструктора" data-motion-mode-switch="true">
        <span>Режим</span>
        <button className={motionMode === "photo" ? "active" : ""} type="button" onClick={() => onCompositionDraftChange("motion_mode", "photo")}>Фото</button>
        <button className={motionMode === "video" ? "active" : ""} type="button" onClick={() => onCompositionDraftChange("motion_mode", "video")}>Видео</button>
      </div>
      {videoEnabled && (
        <>
          <div className="powerPlaceVideoControls" role="group" aria-label="Количество видео копий">
            <span>Копии</span>
            {[1, 4].map((count) => (
              <button
                className={videoCount === count ? "active" : ""}
                data-video-count={count}
                key={count}
                type="button"
                onClick={() => onCompositionDraftChange("video_count", count)}
              >
                {`Видео ${count}`}
              </button>
            ))}
          </div>
          <div className="powerPlaceVideoControls" role="group" aria-label="Направление видео">
            <span>Ход</span>
            <button
              className={videoDirection === "clockwise" ? "active" : ""}
              data-video-direction="clockwise"
              type="button"
              onClick={() => onCompositionDraftChange("video_direction", "clockwise")}
            >
              По часовой
            </button>
            <button
              className={videoDirection === "counterclockwise" ? "active" : ""}
              data-video-direction="counterclockwise"
              type="button"
              onClick={() => onCompositionDraftChange("video_direction", "counterclockwise")}
            >
              Против часовой
            </button>
          </div>
          <div className="powerPlaceVideoControls" role="group" aria-label="Задержка шага видео">
            <span>Шаг</span>
            {[1, 2, 3].map((seconds) => (
              <button
                className={videoStepSeconds === seconds ? "active" : ""}
                data-video-step-seconds={seconds}
                key={seconds}
                type="button"
                onClick={() => onCompositionDraftChange("video_step_seconds", seconds)}
              >
                {seconds} сек
              </button>
            ))}
          </div>
          {!centralImage && <div className="powerPlaceVideoHint">Сначала добавьте фото клиента / цели</div>}
          <div className="powerPlaceVideoHint">Видео-фон: needs implementation</div>
          <div className="powerPlaceVideoControls powerPlaceVideoControls--export">
            <button
              data-video-export-button="true"
              type="button"
              onClick={() => setVideoExportMessage("Экспорт видео: needs implementation")}
            >
              Скачать видеоролик
            </button>
            {videoExportMessage && <span className="powerPlaceVideoHint">{videoExportMessage}</span>}
          </div>
        </>
      )}
    </div>
  );

  const renderReportModule = () => (
    <div className="reportSettingsPanel">
      <p className="cabinetEyebrow">Отчёт</p>
      <div className="reportModeToggle" role="group" aria-label="Режим отчёта">
        <button className={reportEnabled ? "active" : ""} type="button" onClick={() => updateReportDraft({ mode: "with_report" })}>С отчётом</button>
        <button className={!reportEnabled ? "active" : ""} type="button" onClick={() => updateReportDraft({ mode: "without_report", added: false })}>Без отчёта</button>
      </div>
      {!reportEnabled ? null : (
        <>
          <label className="reportField">
            Анализ ситуации
            <textarea
              className="reportFieldInput"
              value={reportDraft.situation}
              onChange={(event) => updateReportDraft({ situation: event.target.value })}
              rows={2}
            />
          </label>
          <label className="reportField">
            Что даёт мандала
            <textarea
              className="reportFieldInput"
              value={reportDraft.mandala_effect}
              onChange={(event) => updateReportDraft({ mandala_effect: event.target.value })}
              rows={2}
            />
          </label>
          <label className="reportField">
            Что ещё поможет
            <textarea
              className="reportFieldInput"
              value={reportDraft.extra_help}
              onChange={(event) => updateReportDraft({ extra_help: event.target.value })}
              rows={2}
            />
          </label>
          <label className="reportField disabled">
            О Мастере
            <textarea className="reportFieldInput" disabled value="Доступно в Pro формате." rows={2} readOnly />
          </label>
          <div className="reportActions">
            <button className="cabinetPrimary" type="button" onClick={() => updateReportDraft({ added: true })}>
              {reportDraft.added ? "Обновить" : "Добавить отчёт"}
            </button>
            <button className="cabinetSecondary" disabled={!reportDraft.added && !reportHasBody} type="button" onClick={() => updateReportDraft({ ...EMPTY_PROFILE_LITE_REPORT, mode: "without_report" })}>
              Удалить отчёт
            </button>
          </div>
        </>
      )}
    </div>
  );

  const renderSymbolLibraryModule = () => {
    const isBackgroundMode = libraryMode === "backgrounds";
    const activeItems = isBackgroundMode ? activeBackgroundShelfItems : activeSymbolShelfItems;

    return (
      <div className="powerSymbolLibraryPanel">
        <div className="powerSymbolLibraryHeader">
          <div>
            <p className="cabinetEyebrow">Библиотека</p>
            <div className="powerSymbolLibraryModeToggle" role="group" aria-label="Режим библиотеки">
              <button
                className={!isBackgroundMode ? "active" : ""}
                type="button"
                onClick={() => setLibraryMode("symbols")}
              >
                Символы
              </button>
              <button
                className={isBackgroundMode ? "active" : ""}
                type="button"
                onClick={() => setLibraryMode("backgrounds")}
              >
                Фон
              </button>
            </div>
            <small>
              {isBackgroundMode
                ? "Фоны вставляются во внешний фон места силы."
                : "Draft символы вставляются в выбранную ячейку. На desktop можно перетащить символ на мини-мандалу."}
            </small>
          </div>
          <label>
            Полка
            <select
              value={activeSymbolShelf}
              onChange={(event) => setSymbolShelfState({ value: event.target.value, manual: true })}
            >
              {POWER_PLACE_SYMBOL_SHELVES.map((shelf) => (
                <option key={shelf.value} value={shelf.value}>{shelf.label}</option>
              ))}
            </select>
          </label>
        </div>
        <div className="powerSymbolLibraryGrid" aria-label={isBackgroundMode ? "Фоны места силы" : "Символы места силы"}>
          {activeItems.map((item) => (
            <button
              className="powerSymbolLibraryItem"
              key={item.id}
              type="button"
              draggable
              onDragStart={(event) => handleSavedImageDragStart(event, item)}
              onClick={() => {
                if (isBackgroundMode) {
                  assignPowerPlaceSlotImage("cover_ref.outer", item.src || "", item.displaySrc || item.src || "", item);
                  return;
                }
                chooseImage(item);
              }}
              title={`${item.label}. ${item.meta}`}
            >
              <span className="powerSymbolLibraryThumb" style={imageStyle(item.displaySrc || item.src)} aria-hidden="true" />
              <b>{item.label}</b>
              <small>{item.meta}</small>
            </button>
          ))}
          {activeItems.length === 0 && (
            <p className="powerSymbolLibraryEmpty">
              {isBackgroundMode ? "Фоны для этой полки требуют проверки ассетов." : "Символы для этой полки не найдены."}
            </p>
          )}
        </div>
      </div>
    );
  };

  const filteredSavedImages = useMemo(() => {
    if (!activeSourceCategory) return latestSavedImages;
    return savedImages.filter((item) => {
      if (activeSourceCategory === "favorites") return item.favorite;
      if (activeSourceCategory === "client-goals") return item.kind === "client-photo";
      if (activeSourceCategory === "god-channels") return item.kind === "tradition-asset" && (!activeSourceSubcategoryData?.traditionId || item.traditionId === activeSourceSubcategoryData.traditionId);
      if (activeSourceCategory === "dao-ri") {
        if (item.kind !== "material") return false;
        const stepIds = new Set(activeSourceThirdLevelData?.stepId ? [activeSourceThirdLevelData.stepId] : activeSourceSubcategoryData?.steps?.map((step) => step.id) || []);
        return !stepIds.size || !item.stepId || stepIds.has(item.stepId);
      }
      if (activeSourceCategory === "covers") return /фон|cover/i.test(item.meta || "");
      if (activeSourceCategory === "form") return /форма|form|мандала/i.test(`${item.meta || ""} ${item.label || ""}`);
      if (activeSourceCategory === "talismans") return /талисман/i.test(`${item.meta || ""} ${item.label || ""}`);
      if (activeSourceCategory === "artifacts") return item.kind === "material" && /artifact|артефакт/i.test(item.meta || "");
      if (activeSourceCategory === "channels") return item.kind === "material";
      return true;
    });
  }, [activeSourceCategory, activeSourceSubcategoryData, activeSourceThirdLevelData, latestSavedImages, savedImages]);

  const openObjectPicker = (slotId) => {
    setSelectedSlotId(slotId);
    openPicker("object");
  };

  const assignPowerPlaceSlotImage = (slotKey, selectedRef, displayUrl = "", item = null) => {
    const ref = String(selectedRef || "");
    const displaySrc = String(displayUrl || ref);
    if (!slotKey || !ref) return;

    if (slotKey === "__center_image") {
      onCompositionDraftChange("central_photo_id", item?.kind === "client-photo" || item?.type === "profile-media" ? item?.photoId || "" : "");
      onCompositionObjectRefSelect("__center_image", ref, displaySrc);
      return;
    }

    if (slotKey === "cover_ref.inner" || slotKey === "cover_ref.outer") {
      const layer = slotKey === "cover_ref.outer" ? "outer" : "inner";
      const fit = coverFitValue(item?.fit || item?.cover_fit || item?.coverFit);
      onCompositionCoverSelect(layer, {
        id: item?.id || (layer === "outer" ? "custom-outer-cover" : "custom-cover"),
        label: item?.label || item?.title || item?.name || "Своё изображение",
        type: "image",
        src: ref,
        display_src: displaySrc,
        ...(fit ? { fit, cover_fit: fit } : {})
      });
      return;
    }

    onCompositionObjectRefSelect(slotKey, ref, displaySrc);
  };

  const chooseImage = async (item) => {
    if (pickerMode === "center" || (!pickerMode && !selectedSlot)) {
      assignPowerPlaceSlotImage("__center_image", item.src || "", item.displaySrc || item.src || "", item);
    } else if (pickerMode === "cover") {
      assignPowerPlaceSlotImage(coverLayerMode === "outer" ? "cover_ref.outer" : "cover_ref.inner", item.src || "", item.displaySrc || item.src || "", {
        ...item,
        id: coverLayerMode === "outer" ? "custom-outer-cover" : "custom-cover"
      });
    } else if (selectedSlotId || selectedSlot?.id) {
      assignPowerPlaceSlotImage(selectedSlotId || selectedSlot.id, item.src || "", item.displaySrc || item.src || "", item);
    }
  };

  const handleSavedImageDragStart = (event, item) => {
    const payload = buildPowerPlaceDragPayload(item);
    if (!payload) return;
    const encoded = JSON.stringify(payload);
    event.dataTransfer.effectAllowed = "copy";
    event.dataTransfer.setData(POWER_PLACE_DRAG_PAYLOAD_TYPE, encoded);
    event.dataTransfer.setData("text/plain", encoded);
  };

  const getPowerPlaceSlotDropHandlers = (slotKey) => ({
    onDragOver: (event) => {
      if (!slotKey) return;
      event.preventDefault();
      event.dataTransfer.dropEffect = "copy";
    },
    onDragEnter: (event) => {
      if (!slotKey) return;
      event.preventDefault();
      setDragOverSlotId(slotKey);
    },
    onDragLeave: (event) => {
      if (event.currentTarget.contains(event.relatedTarget)) return;
      setDragOverSlotId((current) => current === slotKey ? "" : current);
    },
    onDrop: (event) => {
      event.preventDefault();
      setDragOverSlotId("");
      const payload = parsePowerPlaceDragPayload(event.dataTransfer);
      if (!payload) return;
      if (payload.type === "power-place-background" && slotKey !== "cover_ref.outer") return;
      assignPowerPlaceSlotImage(slotKey, payload.object_ref, payload.src || payload.object_ref, payload);
    }
  });

  const handleSavedImageDelete = (item, event) => {
    event.stopPropagation();
    if (!onClientPhotoDelete || item.kind !== "client-photo" || !item.photoId) return;
    onClientPhotoDelete({ ...item, id: item.photoId });
  };

  const openPicker = (mode) => {
    setPickerUploadStatus("idle");
    setPickerUploadError("");
    setPickerMode(mode);
  };

  const openCoverPickerForLayer = (layer) => {
    setCoverLayerMode(layer);
    openPicker("cover");
  };

  const hideCoverShortcut = (cover, event) => {
    event.stopPropagation();
    const shortcutId = cover?.shortcutId || cover?.id;
    if (!shortcutId) return;
    setHiddenCoverShortcutIds((current) => current.includes(shortcutId) ? current : [...current, shortcutId]);
  };

  const closePicker = () => {
    setPickerMode("");
    setPickerUploadStatus("idle");
    setPickerUploadError("");
  };

  const uploadPickerImage = async (uploadRequest) => {
    const file = uploadRequest?.file || uploadRequest;
    setPickerUploadStatus("loading");
    setPickerUploadError("");
    try {
      if (uploadRequest?.destination === "materials") {
        await onLibraryPhotoUpload(uploadRequest);
        return;
      }
      if (pickerMode === "library") {
        await onLibraryPhotoUpload(uploadRequest);
      }
      if (pickerMode === "center") await onUploadedCentralPhoto(file);
      if (pickerMode === "cover") await onCoverFileUpload(coverLayerMode, file);
      if (pickerMode === "object" && selectedSlot) await onObjectFileUpload(selectedSlot.id, file);
      setPickerUploadStatus("success");
    } catch (error) {
      setPickerUploadStatus("error");
      setPickerUploadError(error?.message || "Загрузка не завершилась.");
      throw error;
    }
  };

  const renderSourceSlot = (slot, index) => {
    const src = objectRefs[slot.id] || "";
    const displaySrc = objectRefUrls[src] || objectRefUrls[slot.id] || src;
    const angle = (360 / Math.max(slots.length, 1)) * index - 90;
    const radius = 39;
    const radians = angle * (Math.PI / 180);
    const posStyle = {
      left: `${50 + radius * Math.cos(radians)}%`,
      top: `${50 + radius * Math.sin(radians)}%`
    };
    const imgStyle = src ? slotImageStyle(slot.id, displaySrc) : imageStyle(displaySrc);
    const style = { ...posStyle, ...imgStyle };

    return (
      <button
        className={`powerSource source-${index + 1} slotImagePanZoomTarget${src ? " hasImage" : ""}${selectedSlotId === slot.id ? " selected" : ""}${dragOverSlotId === slot.id ? " power-place-slot--drag-over" : ""}`}
        key={slot.id}
        onClick={() => {
          if (suppressSlotPickerClickRef.current[slot.id]) {
            suppressSlotPickerClickRef.current[slot.id] = false;
            return;
          }
          openObjectPicker(slot.id);
        }}
        style={style}
        type="button"
        title={slot.label}
        aria-label={`Выбрать ${slot.label.toLowerCase()}`}
        {...(src ? getSlotImagePanZoomHandlers(slot.id) : {})}
        {...getPowerPlaceSlotDropHandlers(slot.id)}
      >
        {!src && <span>{index + 1}</span>}
      </button>
    );
  };

  const renderCenterPhotoWithMode = (className) => (
    <button
      className={`${className}${centralImage ? " hasImage" : ""}${dragOverSlotId === "__center_image" ? " power-place-slot--drag-over" : ""}`}
      style={centralImage ? { ...centerImageStyle, touchAction: "none" } : centerImageStyle}
      onClick={(e) => {
        if (suppressCenterPickerClickRef.current) {
          e.preventDefault();
          suppressCenterPickerClickRef.current = false;
          return;
        }
        setSelectedSlotId("__center_image");
        openPicker("center");
      }}
      onPointerDown={handleCenterPointerDown}
      onPointerMove={handleCenterPointerMove}
      onPointerUp={handleCenterPointerUp}
      onPointerCancel={handleCenterPointerCancel}
      onWheel={handleCenterWheel}
      title="Фото клиента / цели"
      type="button"
      aria-label="Фото клиента / цели"
      {...getPowerPlaceSlotDropHandlers("__center_image")}
    >
      {!centralImage && <span>Фото клиента / цели</span>}
    </button>
  );

  const renderPowerPlaceMotionLayer = () => {
    if (!videoEnabled || !centralImage) return null;
    const positions = getMotionPositionsForComposition(compositionDraft, slots);
    if (!positions.length) return null;
    const directionFactor = videoDirection === "counterclockwise" ? -1 : 1;
    const baseIndex = ((motionStep * directionFactor) % positions.length + positions.length) % positions.length;
    const offsets = motionCopyOffsets(videoCount, positions.length);

    return (
      <div className="powerPlaceMotionLayer" data-motion-layer="true" aria-hidden="true" key="power-place-motion-layer">
        {offsets.map((offset, index) => {
          const position = positions[(baseIndex + offset) % positions.length];
          return (
            <span
              className={`powerPlaceMotionPhoto powerPlaceMotionPhoto--count-${videoCount}`}
              data-motion-copy={index + 1}
              key={`${index}-${offset}`}
              style={{
                left: `${position.left}%`,
                top: `${position.top}%`,
                backgroundImage: `url(${centralImage})`
              }}
            />
          );
        })}
      </div>
    );
  };

  function renderDaoElementSlot(element, className) {
    const slotId = `dao-${element.id}`;
    const src = objectRefs[slotId] || "";
    const displaySrc = objectRefUrls[src] || src;

    return (
      <div className={className} key={element.id}>
        <button
          className={`daoElementImage slotImagePanZoomTarget${src ? " hasImage" : ""}${selectedSlotId === slotId ? " selected" : ""}${dragOverSlotId === slotId ? " power-place-slot--drag-over" : ""}`}
          onClick={() => {
            if (suppressSlotPickerClickRef.current[slotId]) {
              suppressSlotPickerClickRef.current[slotId] = false;
              return;
            }
            openObjectPicker(slotId);
          }}
          style={src ? slotImageStyle(slotId, displaySrc) : imageStyle(displaySrc)}
          type="button"
          title={element.label}
          aria-label={`Выбрать элемент ${element.label}`}
          {...(src ? getSlotImagePanZoomHandlers(slotId) : {})}
          {...getPowerPlaceSlotDropHandlers(slotId)}
        >
          {!src && <span>◎</span>}
        </button>
        <b>{element.label}</b>
      </div>
    );
  }

  function renderDaoStyle1() {
    return (
      <>
        {renderCenterPhotoWithMode("daoCenterPhoto")}
        {renderPowerPlaceMotionLayer()}
        <div className="daoUsinCore" aria-hidden="true">
          <span>УСИН</span>
        </div>
        {DAO_ELEMENTS.map((element) => renderDaoElementSlot(element, `daoElement ${element.className}`))}
      </>
    );
  }

  function renderDaoTalisman1() {
    return (
      <div className="daoTalismanScroll" aria-label="Даосский талисман">
        <div className="daoFieldCoverLayer" aria-hidden="true" />
        <div className="daoTalismanRoof" aria-hidden="true">
          <span className="daoTalismanPureMarks" aria-hidden="true">✓ ✓ ✓</span>
          <span className="daoTalismanThreePure" aria-hidden="true">三清</span>
        </div>
        <div className="daoTalismanAxis" aria-hidden="true" />
        <div className="daoTalismanBody">
          <div className="daoTalismanCenterArea">
            {renderCenterPhotoWithMode("daoCenterPhoto")}
          </div>
          {DAO_ELEMENTS.map((element) => renderDaoElementSlot(element, `daoTalismanSlot daoTalismanSlot--${element.className}`))}
        </div>
        {renderPowerPlaceMotionLayer()}
        <div className="daoTalismanSeal" aria-hidden="true">
          <span className="daoTalismanSealCircle">印</span>
        </div>
      </div>
    );
  }

  function renderDaoTalisman2() {
    const nodeCount = compositionDraft.__dao_talisman_node_count || 5;

    return (
      <div className="daoTalismanScroll daoTalisman2Scroll" data-node-count={nodeCount} aria-label="Даосский вертикальный свиток">
        <div className="daoFieldCoverLayer" aria-hidden="true" />
        <div className="daoTalismanRoof daoTalisman2Roof" aria-hidden="true">
          <span className="daoTalismanPureMarks" aria-hidden="true">✓ ✓ ✓</span>
          <span className="daoTalismanThreePure" aria-hidden="true">三清</span>
        </div>
        <div className="daoTalisman2Body">
          <div className="daoTalisman2CenterArea">
            {renderCenterPhotoWithMode("daoCenterPhoto")}
          </div>
          {Array.from(
            { length: nodeCount },
            (_, index) => ({
              id: `dao-talisman-2-${index + 1}`,
              label: `Узел ${index + 1}`
            })
          ).map((node) => {
            const slotId = node.id;
            const src = objectRefs[slotId] || "";
            const displaySrc = objectRefUrls[src] || src;
            return (
              <div className="daoTalisman2Node" key={node.id}>
                <button
                  className={`daoElementImage slotImagePanZoomTarget${src ? " hasImage" : ""}${selectedSlotId === slotId ? " selected" : ""}${dragOverSlotId === slotId ? " power-place-slot--drag-over" : ""}`}
                  onClick={() => {
                    if (suppressSlotPickerClickRef.current[slotId]) {
                      suppressSlotPickerClickRef.current[slotId] = false;
                      return;
                    }
                    openObjectPicker(slotId);
                  }}
                  style={src ? slotImageStyle(slotId, displaySrc) : imageStyle(displaySrc)}
                  type="button"
                  title={node.label}
                  aria-label={`Выбрать элемент ${node.label}`}
                  {...(src ? getSlotImagePanZoomHandlers(slotId) : {})}
                  {...getPowerPlaceSlotDropHandlers(slotId)}
                >
                  {!src && <span>◎</span>}
                </button>
                <b>{node.label}</b>
              </div>
            );
          })}
        </div>
        {renderPowerPlaceMotionLayer()}
        <div className="daoTalismanSeal" aria-hidden="true">
          <span className="daoTalismanSealCircle">印</span>
        </div>
      </div>
    );
  }

  function renderDaoFulu() {
    const nodeCount = compositionDraft.__dao_talisman_node_count || 5;

    return (
      <div className="daoFuluScroll" aria-label="Даосский талисман">
        <div className="daoFuluUserCoverLayer" aria-hidden="true" />
        <div className="daoFuluContourLayer" aria-hidden="true" />
        <div className="daoFuluBody">
          <div className="daoFuluCenterArea">
            {renderCenterPhotoWithMode("daoCenterPhoto")}
          </div>
          <div className="daoFuluNodeColumn" data-node-count={nodeCount}>
            {Array.from(
              { length: nodeCount },
              (_, index) => ({
                id: `dao-fulu-${index + 1}`,
                label: `Узел ${index + 1}`
              })
            ).map((node) => {
              const slotId = node.id;
              const src = objectRefs[slotId] || "";
              const displaySrc = objectRefUrls[src] || src;
              return (
                <div className="daoFuluSlot" key={node.id}>
                  <button
                    className={`daoElementImage slotImagePanZoomTarget${src ? " hasImage" : ""}${selectedSlotId === slotId ? " selected" : ""}${dragOverSlotId === slotId ? " power-place-slot--drag-over" : ""}`}
                    onClick={() => {
                      if (suppressSlotPickerClickRef.current[slotId]) {
                        suppressSlotPickerClickRef.current[slotId] = false;
                        return;
                      }
                      openObjectPicker(slotId);
                    }}
                    style={src ? slotImageStyle(slotId, displaySrc) : imageStyle(displaySrc)}
                    type="button"
                    title={node.label}
                    aria-label={`Выбрать элемент ${node.label}`}
                    {...(src ? getSlotImagePanZoomHandlers(slotId) : {})}
                    {...getPowerPlaceSlotDropHandlers(slotId)}
                  >
                    {!src && <span>◎</span>}
                  </button>
                  <b>{node.label}</b>
                </div>
              );
            })}
          </div>
        </div>
        {renderPowerPlaceMotionLayer()}
      </div>
    );
  }

  function renderDaoFuReferenceOutline() {
    const common = {
      className: "daoFuReferenceOutline",
      viewBox: "0 0 300 440",
      role: "img",
      "aria-label": DAO_STYLE_VARIANTS.find((variant) => variant.value === daoStyle)?.label || "ДАО фу-талисман"
    };
    const node = (cx, cy, r = 7) => <circle cx={cx} cy={cy} r={r} key={`${cx}-${cy}-${r}`} />;
    const roof = (leftX = 70, leftY = 75, topX = 150, topY = 32, rightX = 230, rightY = 75) => (
      <g className="daoFuRoof">
        <path d={`M ${leftX} ${leftY} L ${topX} ${topY} L ${rightX} ${rightY}`} />
        {[node(leftX, leftY), node(topX, topY), node(rightX, rightY)]}
      </g>
    );
    const topSignP = (
      <text className="daoFuTopSignP" x="150" y="116" textAnchor="middle">P</text>
    );

    if (daoStyle === "dao-fu-wide-gate-roof") {
      return (
        <svg {...common}>
          {roof(52, 76, 150, 28, 248, 76)}
          <path d="M 86 110 L 214 110 L 224 142 L 236 154 L 236 392" />
          <path d="M 86 110 L 76 142 L 64 154 L 64 392" />
          <path d="M 64 136 H 30" />
          <path d="M 236 136 H 270" />
          {node(30, 136, 7)}
          {node(270, 136, 7)}
        </svg>
      );
    }

    if (daoStyle === "dao-fu-narrow-banner-roof") {
      return (
        <svg {...common}>
          {roof(94, 72, 150, 30, 206, 72)}
          <path d="M 102 116 L 198 116 L 208 136 L 208 396" />
          <path d="M 102 116 L 92 136 L 92 396" />
        </svg>
      );
    }

    if (daoStyle === "dao-fu-grand-gate-p") {
      return (
        <svg {...common}>
          {roof(46, 70, 150, 30, 254, 70)}
          <path className="daoFuCurvedRoofLine" d="M 48 93 C 92 96 126 80 150 62 C 174 80 208 96 252 93" />
          <path d="M 40 130 H 260" />
          {topSignP}
          <path d="M 38 130 L 52 142 L 52 398" />
          <path d="M 262 130 L 248 142 L 248 398" />
        </svg>
      );
    }

    if (daoStyle === "dao-fu-bottle-p") {
      return (
        <svg {...common}>
          {roof(96, 68, 150, 32, 204, 68)}
          {topSignP}
          <path d="M 100 176 C 100 132 200 132 200 176 L 200 286 C 200 346 178 388 158 414" />
          <path d="M 100 176 L 100 286 C 100 346 122 388 142 414" />
          {[node(72, 234, 7), node(72, 286, 7), node(228, 234, 7), node(228, 286, 7)]}
        </svg>
      );
    }

    if (daoStyle === "dao-fu-node-column") {
      return (
        <svg {...common}>
          {roof(72, 74, 150, 36, 228, 74)}
          <path className="daoFuCurvedRoofLine" d="M 70 96 C 106 96 132 86 150 66 C 168 86 194 96 230 96" />
          <path d="M 64 120 Q 64 134 52 140 L 52 398" />
          <path d="M 236 120 Q 236 134 248 140 L 248 398" />
          <path d="M 64 120 H 236" />
          {[160, 216, 272].flatMap((y) => [node(52, y, 7), node(248, y, 7)])}
        </svg>
      );
    }

    return (
      <svg {...common}>
        {roof(88, 72, 150, 32, 212, 72)}
        <path d="M 100 124 Q 92 132 92 146 L 92 398" />
        <path d="M 200 124 Q 208 132 208 146 L 208 398" />
        <path d="M 100 124 Q 150 114 200 124" />
        <path d="M 92 174 Q 104 162 104 148" />
        <path d="M 208 174 Q 196 162 196 148" />
      </svg>
    );
  }

  function renderDaoStyle2() {
    const nodeCount = compositionDraft.__dao_talisman_node_count || 5;

    return (
      <div className="daoStyle2Scroll" aria-label="Даосский стиль 2" data-node-count={nodeCount}>
        <div className="daoStyle2UserCoverLayer" aria-hidden="true" />
        <div className="daoStyle2Body">
          <div className="daoStyle2CenterArea">
            {renderCenterPhotoWithMode("daoCenterPhoto")}
          </div>
          <div className="daoStyle2NodeColumn" data-node-count={nodeCount}>
            {Array.from(
              { length: nodeCount },
              (_, index) => ({
                id: `dao-style-2-${index + 1}`,
                label: `Окно ${index + 1}`
              })
            ).map((node) => {
              const slotId = node.id;
              const src = objectRefs[slotId] || "";
              const displaySrc = objectRefUrls[src] || src;
              return (
                <div className="daoStyle2Slot" key={node.id}>
                  <button
                    className={`daoElementImage slotImagePanZoomTarget${src ? " hasImage" : ""}${selectedSlotId === slotId ? " selected" : ""}${dragOverSlotId === slotId ? " power-place-slot--drag-over" : ""}`}
                    onClick={() => {
                      if (suppressSlotPickerClickRef.current[slotId]) {
                        suppressSlotPickerClickRef.current[slotId] = false;
                        return;
                      }
                      openObjectPicker(slotId);
                    }}
                    style={src ? slotImageStyle(slotId, displaySrc) : imageStyle(displaySrc)}
                    type="button"
                    title={node.label}
                    aria-label={`Выбрать элемент ${node.label}`}
                    {...(src ? getSlotImagePanZoomHandlers(slotId) : {})}
                    {...getPowerPlaceSlotDropHandlers(slotId)}
                  >
                    {!src && <span>◎</span>}
                  </button>
                  <b>{node.label}</b>
                </div>
              );
            })}
          </div>
        </div>
        {renderPowerPlaceMotionLayer()}
      </div>
    );
  }

  function renderDaoLayoutTemplate() {
    const sideNodes = Array.from({ length: daoLayoutTemplateOptions.sideNodeCount }, (_, index) => index + 1);

    return (
      <div
        className={`daoLayoutTemplateScroll top-crown-${daoLayoutTemplateOptions.topCrown}${daoLayoutTemplateOptions.sideNodesVisible ? "" : " side-nodes-hidden"}`}
        aria-label="ДАО: пустой талисман"
      >
        <div className="daoLayoutTemplateCrown" aria-hidden="true">
          {daoLayoutTemplateOptions.topCrown === "three_checks" ? (
            <>
              <span className="daoLayoutTemplateCheck check-1" />
              <span className="daoLayoutTemplateCheck check-2" />
              <span className="daoLayoutTemplateCheck check-3" />
            </>
          ) : (
            <>
              <span className="daoLayoutTemplateRoofLine roof-left" />
              <span className="daoLayoutTemplateRoofLine roof-right" />
              <span className="daoLayoutTemplateRoofNode node-left" />
              <span className="daoLayoutTemplateRoofNode node-top" />
              <span className="daoLayoutTemplateRoofNode node-right" />
            </>
          )}
        </div>
        <div className="daoLayoutTemplateBody" data-side-node-count={daoLayoutTemplateOptions.sideNodeCount} aria-hidden="true">
          {daoLayoutTemplateOptions.sideNodesVisible && sideNodes.flatMap((node) => [
            <span className={`daoLayoutTemplateSideNode left node-${node}`} key={`left-${node}`} />,
            <span className={`daoLayoutTemplateSideNode right node-${node}`} key={`right-${node}`} />
          ])}
        </div>
      </div>
    );
  }

  const daoClassName = `daoMandalaSheet${isDaoStyle2 ? " dao-style-2" : ""}${isDaoTalisman1 ? " dao-talisman" : ""}${isDaoTalisman2 ? " dao-talisman-2" : ""}${isDaoLayoutTemplate ? " dao-layout-template" : ""}${isDaoFulu ? " dao-fulu" : ""}${isDaoFuOutline ? " dao-fu-outline" : ""}${DAO_FULU_STYLE_VALUES[daoStyle]?.className ? ` ${DAO_FULU_STYLE_VALUES[daoStyle].className}` : ""}${DAO_FU_OUTLINE_STYLE_VALUES[daoStyle]?.className ? ` ${DAO_FU_OUTLINE_STYLE_VALUES[daoStyle].className}` : ""} ${coverToneClass(innerCover)} ${innerCoverClass}`.trim();

  const renderObjectImageButton = (slot, index, className, labelPrefix = "") => {
    const src = objectRefs[slot.id] || "";
    const displaySrc = objectRefUrls[src] || objectRefUrls[slot.id] || src;

    return (
      <button
        className={`${className} slotImagePanZoomTarget${src ? " hasImage" : ""}${selectedSlotId === slot.id ? " selected" : ""}${dragOverSlotId === slot.id ? " power-place-slot--drag-over" : ""}`}
        key={slot.id}
        onClick={() => {
          if (suppressSlotPickerClickRef.current[slot.id]) {
            suppressSlotPickerClickRef.current[slot.id] = false;
            return;
          }
          openObjectPicker(slot.id);
        }}
        style={src ? slotImageStyle(slot.id, displaySrc) : imageStyle(displaySrc)}
        type="button"
        title={slot.label}
        aria-label={`Выбрать ${labelPrefix}${slot.label.toLowerCase()}`}
        {...(src ? getSlotImagePanZoomHandlers(slot.id) : {})}
        {...getPowerPlaceSlotDropHandlers(slot.id)}
      >
        {!src && <span>{index + 1}</span>}
      </button>
    );
  };

  const renderChessSlot = (slot, index, extraClass = "") => renderObjectImageButton(
    slot,
    index,
    `power-place-chess__slot ${extraClass}`.trim(),
    ""
  );

  const chessSlotClass = (className = "") => className
    .split(/\s+/)
    .filter(Boolean)
    .map((item) => `power-place-chess__slot--${item}`)
    .join(" ");

  const renderInMandalaCoverDropTargets = () => (
    <div className="powerMandalaCoverDropTargets">
      <button
        className={`powerMandalaCoverDropTarget powerMandalaCoverDropTarget--inner${dragOverSlotId === "cover_ref.inner" ? " power-place-slot--drag-over" : ""}`}
        type="button"
        title="Фон внутри. Перетащите фото"
        aria-label="Фон внутри. Перетащите фото"
        onClick={() => openCoverPickerForLayer("inner")}
        {...getPowerPlaceSlotDropHandlers("cover_ref.inner")}
      >
        ◎ Внутрь
      </button>
      <button
        className={`powerMandalaCoverDropTarget powerMandalaCoverDropTarget--outer${dragOverSlotId === "cover_ref.outer" ? " power-place-slot--drag-over" : ""}`}
        type="button"
        title="Фон снаружи. Перетащите фото"
        aria-label="Фон снаружи. Перетащите фото"
        onClick={() => openCoverPickerForLayer("outer")}
        {...getPowerPlaceSlotDropHandlers("cover_ref.outer")}
      >
        ▣ Снаружи
      </button>
    </div>
  );

  const renderSlotPhotoEditor = () => {
    const isCenterSlot = selectedSlotId === "__center_image";
    const { brightness, contrast } = slotImageAdjustmentFor(selectedSlotId);
    const zoom = isCenterSlot ? centerImageZoom : slotImageTransformFor(selectedSlotId).zoom;
    const editorLabel = isCenterSlot ? "Фото клиента / цели" : selectedSlot?.label || selectedSlotId;
    return (
      <div className="slotPhotoEditor" aria-label="Редактор мини-фото">
        <p className="cabinetEyebrow">Редактирование: {editorLabel}</p>
        <label className="slotPhotoEditorControl">
          Масштаб фото
          <input
            type="range"
            min="0.65"
            max="1.8"
            step="0.01"
            value={zoom}
            onChange={(e) => {
              if (isCenterSlot) {
                writeCenterImageTransform(centerImageOffsetX, centerImageOffsetY, Number(e.target.value));
              } else {
                const t = slotImageTransformFor(selectedSlotId);
                writeSlotImageTransform(selectedSlotId, t.x, t.y, Number(e.target.value));
              }
            }}
          />
          <span>{Math.round(zoom * 100)}%</span>
        </label>
        <label className="slotPhotoEditorControl">
          Яркость фото
          <input
            type="range"
            min="40"
            max="160"
            value={brightness}
            onChange={(e) => writeSlotImageAdjustment(selectedSlotId, Number(e.target.value), contrast)}
          />
          <span>{brightness}%</span>
        </label>
        <label className="slotPhotoEditorControl">
          Контраст фото
          <input
            type="range"
            min="40"
            max="180"
            value={contrast}
            onChange={(e) => writeSlotImageAdjustment(selectedSlotId, brightness, Number(e.target.value))}
          />
          <span>{contrast}%</span>
        </label>
        <button
          className="slotPhotoEditorReset cabinetSecondary"
          type="button"
          onClick={() => {
            if (isCenterSlot) {
              writeCenterImageTransform(50, 50, 1);
            } else {
              writeSlotImageTransform(selectedSlotId, 50, 50, 1);
            }
            writeSlotImageAdjustment(selectedSlotId, 100, 100);
          }}
        >
          Сбросить
        </button>
      </div>
    );
  };

  const renderPowerPlaceActions = () => (
    <div className="profileLitePowerPlaceActions">
      <label className="compositionTitleField">
        Название мандалы
        <input className="compositionTitleInput" value={compositionDraft.title} onChange={(event) => onCompositionDraftChange("title", event.target.value)} placeholder="Название мандалы" />
      </label>
      <div className="powerPlaceActions powerPlaceActions--save">
        <button
          className="cabinetPrimary powerPlaceUpdateButton"
          type="button"
          onClick={onUpdateExisting}
          disabled={updateExistingDisabled}
          title={updateExistingDisabled ? "Сначала создайте новую мандалу или откройте сохранённую" : "Обновить текущую сохранённую мандалу"}
          aria-label={updateExistingDisabled ? "Обновить: сначала создайте новую мандалу или откройте сохранённую" : "Обновить текущую сохранённую мандалу"}>
          Обновить
        </button>
        <button
          className="cabinetSecondary powerPlaceCreateButton"
          type="button"
          onClick={handleSaveNewClick}
          disabled={createNewDisabled}
          title={createNewDisabled ? "Лимит сохранённых мандал достигнут" : "Создать новую мандалу из текущей композиции"}
          aria-label={createNewDisabled ? "Создать новую: лимит сохранённых мандал достигнут" : "Создать новую мандалу"}>
          Создать новую
        </button>
      </div>
      <div className="powerPlaceActions powerPlaceActions--export">
        <button className="cabinetPrimary" type="button" onClick={onPrint}>Печать</button>
        <button className="cabinetSecondary" type="button" onClick={onDownload}>Скачать PDF</button>
      </div>
      <div className="powerPlaceActions powerPlaceActions--service">
        <button className="cabinetSecondary" type="button" onClick={onSendToServices}>Перенести в услуги</button>
        <button className="cabinetSecondary" type="button" onClick={onPublishAsService}>Опубликовать как услугу</button>
      </div>
      {compositionMessage && <div className="cabinetSuccess compactNotice profileLitePowerPlaceActionFeedback">{compositionMessage}</div>}
      <p className="powerPlaceActionsMeta">{savedCompositionCount}/{savedCompositionLimit} сохранённых мест силы · Storage refs сохраняются без data:image.</p>
      {SHOW_POWER_PLACE_FEED_PROJECTION && (
        <div className="powerPlaceFeedProjection" aria-label="Публичная проекция для ленты">
          <div className="cabinetFormHeader">
            <div>
              <p className="cabinetEyebrow">публичная проекция</p>
              <h3>Опубликовать в ленту</h3>
            </div>
            <span className="cabinetStatus">{powerPlaceFeedStatus}</span>
          </div>
          <label>
            Название для ленты
            <input
              value={powerPlaceFeedForm.title}
              onChange={(event) => onFeedFormChange?.("title", event.target.value)}
              placeholder={compositionDraft.title || "Место силы"}
            />
          </label>
          <label>
            Публичное описание
            <textarea
              value={powerPlaceFeedForm.body}
              onChange={(event) => onFeedFormChange?.("body", event.target.value)}
              rows={3}
              placeholder="Опишите только публичный смысл мандалы, без клиентских фото и приватных заметок"
            />
          </label>
          <div className="powerPlaceFeedProjectionGrid">
            <label>
              Категория
              <input value={powerPlaceFeedForm.category} onChange={(event) => onFeedFormChange?.("category", event.target.value)} placeholder="mandalas" />
            </label>
            <label>
              Теги
              <input value={powerPlaceFeedForm.tags} onChange={(event) => onFeedFormChange?.("tags", event.target.value)} placeholder="мандала, рэйки" />
            </label>
          </div>
          <button className="cabinetSecondary" type="button" onClick={() => onPublishToFeed?.(compositionDraft)} disabled={!compositionDraft.id || powerPlaceFeedStatus === "loading"}>
            Опубликовать в ленту
          </button>
          {!compositionDraft.id && <p className="cabinetMuted">Сначала сохраните мандалу. В ленту отправляется только эта публичная форма, без приватных данных композиции.</p>}
        </div>
      )}
      <p className="powerPrintColorHint">Для цветной печати включите в окне печати: Background graphics / Фоновая графика.</p>
    </div>
  );

  const renderScaleControl = ({ className, label, value, min, max, step, field, visibilityKey, visibilityLabel }) => (
    <div className={className} aria-label={label}>
      <label className={`inlineVisibilityScaleToggle${visibilityKey && !visibilitySettings[visibilityKey] ? " power-place-layer-hidden" : ""}`}>
        {visibilityKey && (
          <input
            type="checkbox"
            checked={!!visibilitySettings[visibilityKey]}
            onChange={(event) => setVisibilitySetting(visibilityKey, event.target.checked)}
            aria-label={visibilityLabel || label}
          />
        )}
        <span>{label}</span>
      </label>
      <button type="button" onClick={() => onCompositionDraftChange(field, Number((Number(value) - Number(step)).toFixed(2)))} aria-label={`Уменьшить ${label.toLowerCase()}`}>-</button>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onCompositionDraftChange(field, Number(event.target.value))}
      />
      <button type="button" onClick={() => onCompositionDraftChange(field, Number((Number(value) + Number(step)).toFixed(2)))} aria-label={`Увеличить ${label.toLowerCase()}`}>+</button>
    </div>
  );

  const setVisibilitySetting = (key, value) => {
    const next = { ...visibilitySettings, [key]: value };
    onCompositionDraftChange(VISIBILITY_SETTINGS_REF_KEY, next);
  };

  const renderFieldLayoutSelector = () => (
    <div className="mandalaFieldLayoutSwitch powerLayoutPanel compactFieldLayoutSwitch" aria-label="Расположение поля мандалы">
      <div className="layoutCenterCell" data-layout-cell="center" />
      <div className="layoutBackgroundCell" data-layout-cell="background">
        <span>Фон</span>
        <div className="mandalaFieldLayoutButtons" role="group" aria-label="Расположение поля мандалы">
          {FIELD_LAYOUTS.map((layout) => (
            <button
              className={(compositionDraft.field_layout || "square") === layout.value ? "active" : ""}
              key={layout.value}
              onClick={() => onCompositionDraftChange("field_layout", layout.value)}
              type="button"
              title={layout.label}
              aria-label={layout.label}
            >
              <i aria-hidden="true" className={`fieldLayoutIcon ${layout.value}`} />
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  const handleAddCompositionToServices = async (composition) => {
    const saved = await onSendToServices(composition);
    if (saved) setWorkspaceTab("services");
  };

  const renderCompositionPreview = (src, label = "Мандала") => (
    <span className={`profileLiteCompositionPreview${src ? " hasImage" : ""}`} style={imageStyle(src)} aria-hidden="true">
      {!src && <span>М</span>}
    </span>
  );

  const buildCompositionDragItem = (composition, previewSrc = "") => {
    const refs = cleanObjectRefs(composition?.object_refs);
    const urls = cleanObjectRefs(composition?.object_ref_urls);
    const cover = composition?.cover_ref || {};
    const innerCoverRef = cover.inner?.src || cover.src || "";
    const outerCoverRef = cover.outer?.src || "";
    const src = refs.__center_image || innerCoverRef || outerCoverRef || Object.values(refs).find((value) => typeof value === "string" && isImagePreview(urls[value] || value)) || "";

    if (!src) return null;

    return {
      id: `composition-${composition.id}`,
      label: composition.title || "Сохранённая мандала",
      title: composition.title || "Сохранённая мандала",
      meta: formatLabel(composition.constructor_type),
      src,
      kind: "saved-mandala",
      displaySrc: previewSrc || urls[src] || cover.inner?.display_src || cover.display_src || cover.outer?.display_src || src,
      compositionId: composition.id
    };
  };

  const renderMandalasTab = () => (
    <section className="cabinetCard mandalaGallery">
      <div className="cabinetFormHeader">
        <div>
          <p className="cabinetEyebrow">Мои мандалы</p>
          <h2>Сохранённые места силы</h2>
        </div>
        <span className="cabinetStatus">{mandalasStatus}</span>
      </div>
      <div className="profileLiteCompositionList">
        {powerPlaceCompositions.map((composition) => {
          const linkedService = serviceByCompositionId.get(String(composition.id));
          const previewSrc = resolveCompositionPreviewSrc(composition);
          const compositionDragItem = buildCompositionDragItem(composition, previewSrc);
          return (
            <div className="profileLiteCompositionItem profileLiteCompositionItem--card" key={composition.id}>
              <button
                className="profileLiteCompositionCard profileLiteCompositionCard--horizontal"
                type="button"
                draggable={Boolean(compositionDragItem?.src)}
                onDragStart={(event) => compositionDragItem && handleSavedImageDragStart(event, compositionDragItem)}
                onClick={() => {
                onCompositionLoad(composition);
                setWorkspaceTab("power-place");
              }}>
                {renderCompositionPreview(previewSrc, composition.title || "Место силы")}
                <span className="profileLiteCompositionBody">
                  <b>{composition.title || "Место силы"}</b>
                  <span>{formatLabel(composition.constructor_type)} · {compositionDateLabel(composition)}</span>
                  <small>{composition.tradition_title || composition.resource_comparison_mode || composition.chess_variant || "Сохранённая мандала места силы"}</small>
                </span>
              </button>
              <div className="profileLiteCompositionActions">
                {linkedService ? (
                  <button
                    className="cabinetSecondary profileLiteAddToServicesButton"
                    disabled
                    title="Эта мандала уже есть в Моих услугах"
                    type="button"
                  >
                    В услугах ✓
                  </button>
                ) : (
                  <button className="cabinetSecondary profileLiteAddToServicesButton" type="button" onClick={() => handleAddCompositionToServices(composition)}>
                    Добавить в мои услуги
                  </button>
                )}
              </div>
            </div>
          );
        })}
        {powerPlaceCompositions.length === 0 && <p>Сохранённые мандалы появятся здесь после сохранения места силы.</p>}
      </div>
    </section>
  );

  const renderServicesTab = () => (
    <section className="cabinetCard mandalaGallery">
      <div className="cabinetFormHeader">
        <div>
          <p className="cabinetEyebrow">Услуги</p>
          <h2>Мандалы в услугах</h2>
        </div>
        <span className="cabinetStatus">{compositionServices.length}</span>
      </div>
      <div className="profileLiteServicesList">
        {compositionServices.map((service) => {
          const composition = compositionById.get(String(service.composition_id));
          const previewSrc = composition ? resolveCompositionPreviewSrc(composition) : service.display_url || service.image_url || "";
          const title = composition?.title || service.title || "Мандала Места Силы";
          const typeLabel = composition ? formatLabel(composition.constructor_type) : "Услуга";
          return (
            <article className="profileLiteServicesItem profileLiteCompositionItem profileLiteCompositionItem--card" key={service.id || service.composition_id}>
              {renderCompositionPreview(previewSrc, title)}
              <span className="profileLiteCompositionBody">
                <b>{title}</b>
                <span>{typeLabel} · {service.updated_at || service.created_at || "needs verification"}</span>
                <small>{service.description || composition?.tradition_title || "Услуга подготовлена из сохранённой мандалы."}</small>
              </span>
              <div className="profileLiteCompositionActions">
                <span className="profileLiteServiceLinkedStatus">В услугах ✓</span>
              </div>
            </article>
          );
        })}
        {compositionServices.length === 0 && <p>Пока нет мандал, добавленных в услуги.</p>}
      </div>
    </section>
  );

  return (
    <section className="profileLiteModule profileLitePowerPlace mandalaWorkspace" aria-label="Мои мандалы">
      <div className="mandalaHero">
        <div className="mandalaHeroSeal">♣</div>
        <div>
          <p className="cabinetEyebrow">Рабочее место мастера</p>
          <h2>Мастерская мандал</h2>
          <p>Создавайте место силы, выбирайте фото клиента / цели, фон, объекты и сохраняйте композицию в базе.</p>
        </div>
        <div className="mandalaHeroStats">
          <span><b>{powerPlaceCompositions.length}</b> Места силы</span>
          <span><b>{clientGoalPhotos.length}</b> Фото</span>
          <span><b>{savedImages.length}</b> Образы</span>
        </div>
      </div>

      {shellChrome}

      <div className="workspaceSwitches">
        <div className="workspaceTabs" role="tablist" aria-label="Раздел мастерской мандал">
          <button className={workspaceTab === "power-place" ? "active" : ""} type="button" onClick={() => setWorkspaceTab("power-place")}>Место силы</button>
          <button className={workspaceTab === "mandalas" ? "active" : ""} type="button" onClick={() => setWorkspaceTab("mandalas")}>Мои мандалы</button>
          <button className={workspaceTab === "services" ? "active" : ""} type="button" onClick={() => setWorkspaceTab("services")}>Услуги</button>
        </div>
      </div>

      {mandalasError && <div className="cabinetNotice cabinetSecondaryDataWarning">needs verification: {mandalasError}</div>}
      {mediaError && <div className="cabinetNotice cabinetSecondaryDataWarning">needs verification: {mediaError}</div>}

      <div className="workspaceMainColumns profileLitePowerPlaceColumns">
        <aside className="mandalaModeSidebar powerLibrarySidebar">
          <p className="cabinetEyebrow">Источники силы</p>
          <h3>Фото</h3>
          <div className="powerLibraryPrimaryActions">
            <button className="powerAddImageButton" type="button" onClick={() => openPicker("library")}>
              Добавить фото
            </button>
          </div>
          <div className="powerLibraryFilter">
            <label className="powerLibrarySelectLabel">
              Группа
              <select value={activeSourceCategory} onChange={(event) => {
                const nextCategory = SOURCE_LIBRARY_CATEGORIES.find((category) => category.value === event.target.value) || null;
                setActiveSourceCategory(nextCategory?.value || "");
                setActiveSourceSubcategory(nextCategory?.subcategories?.[0]?.value || "");
                setActiveSourceThirdLevel(nextCategory?.subcategories?.[0]?.thirdLevels?.[0]?.value || "");
              }}>
                <option value="">Последние фото</option>
                {SOURCE_LIBRARY_CATEGORIES.map((category) => (
                  <option key={category.value} value={category.value}>{category.label}</option>
                ))}
              </select>
            </label>
            {activeSourceCategoryData?.subcategories?.length > 0 && (
              <label className="powerLibrarySelectLabel">
                Категория
                <select
                  value={activeSourceSubcategory}
                  onChange={(event) => {
                    const nextSubcategory = activeSourceCategoryData.subcategories.find((subcategory) => subcategory.value === event.target.value);
                    setActiveSourceSubcategory(nextSubcategory?.value || "");
                    setActiveSourceThirdLevel(nextSubcategory?.thirdLevels?.[0]?.value || "");
                  }}
                >
                  {activeSourceCategoryData.subcategories.map((subcategory) => (
                    <option key={subcategory.value} value={subcategory.value}>{subcategory.displayLabel || subcategory.label}</option>
                  ))}
                </select>
              </label>
            )}
            {activeSourceSubcategoryData?.thirdLevels?.length > 0 && (
              <label className="powerLibrarySelectLabel">
                Подкатегория / Ступень
                <select value={activeSourceThirdLevel} onChange={(event) => setActiveSourceThirdLevel(event.target.value)}>
                  {activeSourceSubcategoryData.thirdLevels.map((thirdLevel) => (
                    <option key={thirdLevel.value} value={thirdLevel.value}>{thirdLevel.label}</option>
                  ))}
                </select>
              </label>
            )}
          </div>
          <div className="powerSavedImageList compactPhotoList" aria-label="Компактный список фото" data-compact-photo-list="true">
            <div className="powerSavedImageHeader">
              <b>{activeSourceCategory ? "По фильтру" : "Последние фото"}</b>
              <small>{selectedSlot ? `Позиция: ${selectedSlot.label}` : "Центр / объект"}</small>
            </div>
            {filteredSavedImages.map((item) => (
              <div className="powerSavedImageItem" key={item.id}>
                <button
                  className="powerSavedImageCard"
                  type="button"
                  draggable={Boolean(item.src)}
                  onDragStart={(event) => handleSavedImageDragStart(event, item)}
                  onClick={() => chooseImage(item)}
                >
                  <span className={`powerSavedImageThumb${item.displaySrc ? " hasImage" : ""}`} style={imageStyle(item.displaySrc || item.src)} />
                  <b>{item.label}</b>
                  <small>{item.meta}</small>
                </button>
                {item.kind === "client-photo" && item.photoId && onClientPhotoDelete && (
                  <button
                    className="savedImageDeleteButton powerSavedImageDeleteButton"
                    type="button"
                    title="Удалить фото"
                    aria-label="Удалить фото из базы?"
                    data-delete-photo-button="true"
                    onClick={(event) => handleSavedImageDelete(item, event)}
                  >
                    x
                  </button>
                )}
              </div>
            ))}
            {savedImages.length === 0 && <p>Сохранённые фото, подложки и изображения появятся здесь после загрузки.</p>}
            {savedImages.length > 0 && filteredSavedImages.length === 0 && <p>В этой категории пока нет изображений.</p>}
          </div>
        </aside>

        <div className="workspaceCenterColumn">
          {workspaceTab === "mandalas" ? renderMandalasTab() : workspaceTab === "services" ? renderServicesTab() : (
            <section className="powerPlaceConstructor" aria-label="Конструктор магической мандалы места силы">
              <div className="powerPlaceHeader">
                <div>
                  <p className="cabinetEyebrow">Места силы</p>
                  <h2>Магическая мандала</h2>
                </div>
                <select
                  className="powerSavedMandalaSelect"
                  value={compositionDraft.id || ""}
                  onChange={(event) => {
                    const nextId = event.target.value;
                    if (!nextId) return;
                    if (nextId === "__create_new__") {
                      if (onStartNewDraft) onStartNewDraft();
                      return;
                    }
                    const nextComposition = powerPlaceCompositions.find((item) => String(item.id) === String(nextId));
                    if (nextComposition) onCompositionLoad(nextComposition);
                  }}
                  aria-label="Сохранённые мандалы"
                >
                  <option value="">Сохранённые мандалы</option>
                  <option value="__create_new__">Создать новую мандалу</option>
                  {powerPlaceCompositions.map((composition) => (
                    <option key={composition.id} value={composition.id}>
                      {composition.title || "Место силы"}
                    </option>
                  ))}
                </select>
              </div>
              {compositionMessage && <div className="cabinetSuccess compactNotice">{compositionMessage}</div>}

              <div className="constructorControls">
                <div className="constructorTypeSelector" aria-label="Тип конструктора">
                  {CONSTRUCTOR_TYPES.map((type) => (
                    <button className={compositionDraft.constructor_type === type.value ? "active" : ""} key={type.value} onClick={() => onCompositionDraftChange("constructor_type", type.value)} type="button">
                      {type.label}
                    </button>
                  ))}
                </div>
                {compositionDraft.constructor_type === "client" && (
                  <div className="geometrySelector" aria-label="Геометрия источников силы">
                    {GEOMETRIES.map((geometry) => (
                      <button className={Number(compositionDraft.geometry) === geometry ? "active" : ""} key={geometry} onClick={() => onCompositionDraftChange("geometry", geometry)} type="button">{geometry}</button>
                    ))}
                  </div>
                )}
                {compositionDraft.constructor_type === "client" && (
                  <div className="mandalaStyleSelector" aria-label="Стиль мандалы">
                    {MANDALA_STYLE_VARIANTS.map((variant) => (
                      <button className={(compositionDraft.__mandala_style || "style-1") === variant.value ? "active" : ""} key={variant.value} onClick={() => onCompositionDraftChange("__mandala_style", variant.value)} type="button">{variant.label}</button>
                    ))}
                  </div>
                )}
                {compositionDraft.constructor_type === "zodiac" && (
                  <div className="zodiacCountSelector" aria-label="Формат зодиака">
                    <span>Формат зодиака</span>
                    {ZODIAC_VARIANTS.map((variant) => (
                      <button className={(compositionDraft.zodiac_variant || `classic-${compositionDraft.zodiac_visible_count}`) === variant.value ? "active" : ""} key={variant.value} onClick={() => {
                        onCompositionDraftChange("zodiac_variant", variant.value);
                        onCompositionDraftChange("zodiac_visible_count", variant.visibleCount);
                      }} type="button">{variant.label}</button>
                    ))}
                  </div>
                )}
                {compositionDraft.constructor_type === "zodiac" && (
                  <div className="zodiacStyleSelector" aria-label="Стиль зодиака">
                    <span>Стиль зодиака</span>
                    {ZODIAC_STYLE_VARIANTS.map((variant) => (
                      <button className={zodiacStyle === variant.value ? "active" : ""} key={variant.value} onClick={() => onCompositionDraftChange(ZODIAC_STYLE_REF_KEY, variant.value)} type="button">{variant.label}</button>
                    ))}
                  </div>
                )}
                {compositionDraft.constructor_type === "star" && (
                  <div className="starVariantSelector" aria-label="Формат звезды">
                    <span>Вариант звезды</span>
                    {STAR_VARIANTS.map((variant) => (
                      <button className={compositionDraft.star_variant === variant.value ? "active" : ""} key={variant.value} onClick={() => onCompositionDraftChange("star_variant", variant.value)} type="button">{variant.label}</button>
                    ))}
                  </div>
                )}
                {compositionDraft.constructor_type === "chess" && (
                  <div className="starVariantSelector" aria-label="Формат шахмат">
                    <span>Формат шахмат</span>
                    {CHESS_VARIANTS.map((variant) => (
                      <button className={compositionDraft.chess_variant === variant.value ? "active" : ""} key={variant.value} onClick={() => onCompositionDraftChange("chess_variant", variant.value)} type="button">{variant.label}</button>
                    ))}
                  </div>
                )}
                {compositionDraft.constructor_type === "dao" && (
                  <div className="mandalaStyleSelector daoStyleSelector" aria-label="Стиль ДАО">
                    {DAO_STYLE_VARIANTS.map((variant) => (
                      <button className={(compositionDraft.__dao_style || "style-1") === variant.value ? "active" : ""} key={variant.value} onClick={() => onCompositionDraftChange("__dao_style", variant.value)} type="button">{variant.label}</button>
                    ))}
                  </div>
                )}
                {compositionDraft.constructor_type === "dao" && (isDaoTalisman2 || isDaoFulu || isDaoStyle2) && (
                  <div className="mandalaStyleSelector daoTalisman2NodeSelector" aria-label="Узлов в вертикальном талисмане">
                    {DAO_TALISMAN_NODE_COUNTS.map((n) => (
                      <button className={(compositionDraft.__dao_talisman_node_count || 5) === n ? "active" : ""} key={n} onClick={() => onCompositionDraftChange("__dao_talisman_node_count", n)} type="button">{n}</button>
                    ))}
                  </div>
                )}
                {compositionDraft.constructor_type === "dao" && isDaoLayoutTemplate && (
                  <div className="daoLayoutTemplateOptions" aria-label="Параметры ДАО">
                    <div className="daoLayoutTemplateOptionRow">
                      <span>Верхушка</span>
                      <div className="mandalaStyleSelector" role="group" aria-label="Верхушка ДАО">
                        {DAO_LAYOUT_TEMPLATE_TOP_CROWNS.map((option) => (
                          <button
                            className={daoLayoutTemplateOptions.topCrown === option.value ? "active" : ""}
                            key={option.value}
                            onClick={() => onCompositionDraftChange(DAO_LAYOUT_TEMPLATE_OPTIONS_REF_KEY, { ...daoLayoutTemplateOptions, topCrown: option.value })}
                            type="button"
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="daoLayoutTemplateOptionRow">
                      <span>Боковые точки</span>
                      <label className="daoLayoutTemplateCheckbox">
                        <input
                          checked={daoLayoutTemplateOptions.sideNodesVisible}
                          onChange={(event) => onCompositionDraftChange(DAO_LAYOUT_TEMPLATE_OPTIONS_REF_KEY, { ...daoLayoutTemplateOptions, sideNodesVisible: event.target.checked })}
                          type="checkbox"
                        />
                        Показывать
                      </label>
                    </div>
                    <div className="daoLayoutTemplateOptionRow">
                      <span>Количество точек</span>
                      <div className="mandalaStyleSelector" role="group" aria-label="Количество боковых точек">
                        {DAO_LAYOUT_TEMPLATE_SIDE_NODE_COUNTS.map((count) => (
                          <button
                            className={daoLayoutTemplateOptions.sideNodeCount === count ? "active" : ""}
                            key={count}
                            onClick={() => onCompositionDraftChange(DAO_LAYOUT_TEMPLATE_OPTIONS_REF_KEY, { ...daoLayoutTemplateOptions, sideNodeCount: count })}
                            type="button"
                          >
                            {count}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
                {renderScaleControl({ className: "sourceSlotScaleControl", label: "Размер окон", value: sourceSlotScale, min: "0.7", max: "1.85", step: "0.01", field: "slot_scale", visibilityKey: "slots", visibilityLabel: "Мини-мандалы" })}
                {renderScaleControl({ className: "innerFieldScaleControl", label: "Размер поля", value: fieldScale, min: "48", max: "145", step: "1", field: "field_scale", visibilityKey: "inner_cover", visibilityLabel: "Фон внутри" })}
                {renderScaleControl({ className: "centerFrameScaleControl", label: "Размер центра", value: centerFrameScale, min: "0.72", max: "1.85", step: "0.01", field: "__center_frame_scale", visibilityKey: "center", visibilityLabel: "Центр мандалы" })}
                {renderMotionControls()}
                {compositionDraft.constructor_type === "business" && (
                  <div className="businessZoneSelector" aria-label="Зон в каждой вершине">
                    <span>Зон в каждой вершине</span>
                    {[1, 3].map((count) => (
                      <button className={Number(compositionDraft.business_vertex_zone_count) === count ? "active" : ""} key={count} onClick={() => onCompositionDraftChange("business_vertex_zone_count", count)} type="button">{count}</button>
                    ))}
                  </div>
                )}
              </div>

              <div className={`powerPlacePrintArea field-layout-${compositionDraft.field_layout || "square"}`} style={sourceSlotScaleStyle}>
                <div className={[`powerMandalaPanel field-layout-${compositionDraft.field_layout || "square"} outer-cover-${outerCover?.type === "image" ? "image" : outerCover?.tone || "none"} ${outerCoverClass} ${outerCoverFitClassName}`, !visibilitySettings.center ? "power-place-hide-center" : "", !visibilitySettings.slots ? "power-place-hide-slots" : "", !visibilitySettings.outer_cover ? "power-place-hide-outer-cover" : "", !visibilitySettings.inner_cover ? "power-place-hide-inner-cover" : ""].filter(Boolean).join(" ")} style={{ ...(outerCover?.type === "image" ? { "--power-outer-cover-image": `url(${coverDisplaySrc(outerCover)})` } : {}), ...sourceSlotScaleStyle }}>
                  <div className="powerPrintMeta">
                    <p className="cabinetEyebrow">Формат</p>
                    <h3>{formatLabel(compositionDraft.constructor_type)}</h3>
                  </div>
                  {compositionDraft.constructor_type === "client" ? (
                    <div className={`powerMandala geometry-${compositionDraft.geometry || slots.length} ${coverToneClass(innerCover)} constructor-client mandala-${compositionDraft.__mandala_style || "style-1"} ${innerCoverClass}`.trim()} style={innerCoverImageStyle(innerCover, coverDisplaySrc(innerCover))}>
                      {renderCenterPhotoWithMode("powerCenterPhoto")}
                      {renderPowerPlaceMotionLayer()}
                      <div className="powerMandalaBase">{slots.map(renderSourceSlot)}</div>
                    </div>
                  ) : compositionDraft.constructor_type === "altar" ? (
                    <div className={`altarMandalaSheet ratio-${compositionDraft.altar_center_ratio || "1"} ${coverToneClass(innerCover)} ${innerCoverClass}`.trim()} style={innerCoverImageStyle(innerCover, coverDisplaySrc(innerCover))}>
                      <div className="altarTopRow" aria-label="Верхние источники алтаря">
                        {slots.slice(0, 5).map((slot, index) => renderObjectImageButton(
                          slot,
                          index,
                          `${index === 2 ? "altarTopSource main" : "altarTopSource"}`
                        ))}
                      </div>
                      {renderCenterPhotoWithMode("altarCenterPhoto")}
                      {renderPowerPlaceMotionLayer()}
                      <div className="altarMandalaBase">
                        <span>мандала места силы</span>
                      </div>
                      <div className="altarBottomSupports" aria-label="Нижние опоры алтаря">
                        {slots.slice(5).map((slot, index) => renderObjectImageButton(slot, index, "altarSupportSource"))}
                      </div>
                    </div>
                  ) : compositionDraft.constructor_type === "business" ? (
                    <div className={`businessMandalaSheet zones-${compositionDraft.business_vertex_zone_count || 1} ${coverToneClass(innerCover)} ${innerCoverClass}`.trim()} style={innerCoverImageStyle(innerCover, coverDisplaySrc(innerCover))}>
                      {renderCenterPhotoWithMode("businessCenterPhoto")}
                      {renderPowerPlaceMotionLayer()}
                      <div className="businessTriangleLines" aria-hidden="true" />
                      {BUSINESS_VERTICES.map((vertex) => (
                        <div className={`businessVertex ${vertex.className}`} key={vertex.id}>
                          <b>{vertex.label}</b>
                          <div className="businessVertexZones">
                            {Array.from({ length: Number(compositionDraft.business_vertex_zone_count) === 3 ? 3 : 1 }, (_, index) => {
                              const slot = { id: `business-${vertex.id}-${index + 1}`, label: Number(compositionDraft.business_vertex_zone_count) === 3 ? `${vertex.label} · зона ${index + 1}` : vertex.label };
                              return renderObjectImageButton(slot, index, "businessVertexZone");
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : compositionDraft.constructor_type === "zodiac" ? (
                    <>
                      {zodiacStyle === "ribbon" ? (
                        <div className={`zodiacRibbonSheet ${coverToneClass(innerCover)} ${innerCoverClass}`.trim()} style={innerCoverImageStyle(innerCover, coverDisplaySrc(innerCover))}>
                          {renderCenterPhotoWithMode("zodiacCenterPhoto")}
                          {renderPowerPlaceMotionLayer()}
                          <div className="zodiacRibbonTrack">
                            {slots.filter((slot) => slot.id.startsWith("zodiac-") && !slot.id.startsWith("zodiac-plus") && !slot.id.startsWith("zodiac-inner-")).map((slot, index) => {
                              const src = objectRefs[slot.id] || "";
                              const displaySrc = objectRefUrls[src] || src;
                              return (
                                <div className={`zodiacRibbonCell${src ? " hasImage" : ""}${selectedSlotId === slot.id ? " selected" : ""}${dragOverSlotId === slot.id ? " power-place-slot--drag-over" : ""}`} key={slot.id}>
                                  <button
                                    className={`zodiacRibbonCellImage slotImagePanZoomTarget${src ? " hasImage" : ""}${selectedSlotId === slot.id ? " selected" : ""}${dragOverSlotId === slot.id ? " power-place-slot--drag-over" : ""}`}
                                    onClick={() => {
                                      if (suppressSlotPickerClickRef.current[slot.id]) {
                                        suppressSlotPickerClickRef.current[slot.id] = false;
                                        return;
                                      }
                                      openObjectPicker(slot.id);
                                    }}
                                    style={src ? slotImageStyle(slot.id, displaySrc) : imageStyle(displaySrc)}
                                    type="button"
                                    title={slot.label}
                                    aria-label={`Выбрать ${slot.label.toLowerCase()}`}
                                    {...(src ? getSlotImagePanZoomHandlers(slot.id) : {})}
                                    {...getPowerPlaceSlotDropHandlers(slot.id)}
                                  >
                                    {!src && <span>{index + 1}</span>}
                                  </button>
                                  <b>{slot.label}</b>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className={`zodiacMandalaSheet zodiac-${compositionDraft.zodiac_visible_count || 12} ${!isZodiac2 && (compositionDraft.zodiac_variant || "").startsWith("plus") ? `zodiac-plus-${compositionDraft.zodiac_visible_count || 12}` : ""} ${isZodiac2 ? "zodiac-2-format" : ""} ${zodiacStyle === "stars" ? "zodiac-style-stars" : ""} ${coverToneClass(innerCover)} ${innerCoverClass}`.trim()} style={innerCoverImageStyle(innerCover, coverDisplaySrc(innerCover))}>
                            {renderCenterPhotoWithMode("zodiacCenterPhoto")}
                            {renderPowerPlaceMotionLayer()}
                            <div className="zodiacClockFace" aria-hidden="true">
                              <span>ЗОДИАК</span>
                            </div>
                            {isZodiac2 && slots.filter((slot) => slot.id.startsWith("zodiac-inner-")).map((slot, index) => {
                              const src = objectRefs[slot.id] || "";
                              const displaySrc = objectRefUrls[src] || src;
                              return (
                                <div className={`zodiacInnerPosition ${slot.className || ""}${src ? " hasImage" : ""}`} key={slot.id}>
                                  <button
                                    className={`zodiacInnerPositionImage slotImagePanZoomTarget${selectedSlotId === slot.id ? " selected" : ""}${dragOverSlotId === slot.id ? " power-place-slot--drag-over" : ""}`}
                                    onClick={() => {
                                      if (suppressSlotPickerClickRef.current[slot.id]) {
                                        suppressSlotPickerClickRef.current[slot.id] = false;
                                        return;
                                      }
                                      openObjectPicker(slot.id);
                                    }}
                                    style={src ? slotImageStyle(slot.id, displaySrc) : imageStyle(displaySrc)}
                                    type="button"
                                    title={slot.label}
                                    aria-label={`Выбрать внутреннюю мандалу ${slot.label}`}
                                    {...(src ? getSlotImagePanZoomHandlers(slot.id) : {})}
                                    {...getPowerPlaceSlotDropHandlers(slot.id)}
                                  >
                                    {!src && <span>{index + 1}</span>}
                                  </button>
                                </div>
                              );
                            })}
                            {slots.filter((slot) => slot.id.startsWith("zodiac-") && !slot.id.startsWith("zodiac-plus") && !slot.id.startsWith("zodiac-inner-")).map((slot, index) => {
                              const src = objectRefs[slot.id] || "";
                              const displaySrc = objectRefUrls[src] || src;
                              return (
                                <div className={`zodiacPosition ${slot.className}${src ? " hasImage" : ""}`} key={slot.id}>
                                  <button
                                    className={`zodiacPositionImage slotImagePanZoomTarget${selectedSlotId === slot.id ? " selected" : ""}${dragOverSlotId === slot.id ? " power-place-slot--drag-over" : ""}`}
                                    onClick={() => {
                                      if (suppressSlotPickerClickRef.current[slot.id]) {
                                        suppressSlotPickerClickRef.current[slot.id] = false;
                                        return;
                                      }
                                      openObjectPicker(slot.id);
                                    }}
                                    style={src ? slotImageStyle(slot.id, displaySrc) : imageStyle(displaySrc)}
                                    type="button"
                                    title={slot.label}
                                    aria-label={`Выбрать знак ${slot.label}`}
                                    {...(src ? getSlotImagePanZoomHandlers(slot.id) : {})}
                                    {...getPowerPlaceSlotDropHandlers(slot.id)}
                                  >
                                    {!src && <span>{index + 1}</span>}
                                  </button>
                                  <b>{slot.label}</b>
                                </div>
                              );
                            })}
                          </div>
                          {slots.filter((slot) => slot.id.startsWith("zodiac-plus")).map((slot, index) => {
                            const src = objectRefs[slot.id] || "";
                            const displaySrc = objectRefUrls[src] || src;
                            return (
                              <div className={`zodiacFieldPlusPosition ${slot.className || ""}${src ? " hasImage" : ""}`} key={slot.id}>
                                <button
                                  className={`zodiacFieldPlusPositionImage slotImagePanZoomTarget${selectedSlotId === slot.id ? " selected" : ""}${dragOverSlotId === slot.id ? " power-place-slot--drag-over" : ""}`}
                                  onClick={() => {
                                    if (suppressSlotPickerClickRef.current[slot.id]) {
                                      suppressSlotPickerClickRef.current[slot.id] = false;
                                      return;
                                    }
                                    openObjectPicker(slot.id);
                                  }}
                                  style={src ? slotImageStyle(slot.id, displaySrc) : imageStyle(displaySrc)}
                                  type="button"
                                  title={slot.label}
                                  aria-label={`Выбрать ${slot.label.toLowerCase()}`}
                                  {...(src ? getSlotImagePanZoomHandlers(slot.id) : {})}
                                  {...getPowerPlaceSlotDropHandlers(slot.id)}
                                >
                                  {!src && <span>{index + 1}</span>}
                                </button>
                                <b>{slot.label}</b>
                              </div>
                            );
                          })}
                        </>
                      )}
                    </>
                  ) : compositionDraft.constructor_type === "star" ? (
                    <div className={`starMandalaSheet star-${compositionDraft.star_variant || "closed"} ${coverToneClass(innerCover)} ${innerCoverClass}`.trim()} style={innerCoverImageStyle(innerCover, coverDisplaySrc(innerCover))}>
                      <div className="starSacredLabel starElhai">ELHAI</div>
                      <div className="starSacredLabel starAdonay">ADONAY</div>
                      {renderCenterPhotoWithMode("starCenterPhoto")}
                      {renderPowerPlaceMotionLayer()}
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
                      </div>
                      {slots.map((slot, index) => {
                        const src = objectRefs[slot.id] || "";
                        const displaySrc = objectRefUrls[src] || src;
                        return (
                          <div className={`starPosition ${slot.className}${src ? " hasImage" : ""}`} key={slot.id}>
                            <button
                              className={`starPositionImage slotImagePanZoomTarget${selectedSlotId === slot.id ? " selected" : ""}${dragOverSlotId === slot.id ? " power-place-slot--drag-over" : ""}`}
                              onClick={() => {
                                if (suppressSlotPickerClickRef.current[slot.id]) {
                                  suppressSlotPickerClickRef.current[slot.id] = false;
                                  return;
                                }
                                openObjectPicker(slot.id);
                              }}
                              style={src ? slotImageStyle(slot.id, displaySrc) : imageStyle(displaySrc)}
                              type="button"
                              title={slot.label}
                              aria-label={`Выбрать ${slot.label.toLowerCase()}`}
                              {...(src ? getSlotImagePanZoomHandlers(slot.id) : {})}
                              {...getPowerPlaceSlotDropHandlers(slot.id)}
                            >
                              {!src && <span>{index + 1}</span>}
                            </button>
                            <b>{slot.label}</b>
                          </div>
                        );
                      })}
                    </div>
                  ) : compositionDraft.constructor_type === "chess" ? (
                    <div className={`power-place-chess power-place-chess--${chessVariant} ${coverToneClass(innerCover)} ${innerCoverClass}`.trim()} style={chessCoverStyle}>
                      <div className="power-place-chess__board" aria-label="Шахматная раскладка">
                        {chessVariant === "plus-8" || chessVariant === "compact-5" ? (
                          <>
                            {renderCenterPhotoWithMode("power-place-chess__center")}
                            {renderPowerPlaceMotionLayer()}
                            {(CHESS_SLOT_LAYOUTS[chessVariant] || []).map((slot, index) => renderChessSlot(slot, index, chessSlotClass(slot.className)))}
                          </>
                        ) : (
                          Array.from({ length: chessVariant === "classic-14" ? 15 : 9 }, (_, index) => {
                            const row = Math.floor(index / 3) + 1;
                            const col = (index % 3) + 1;
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
                          }).concat(renderPowerPlaceMotionLayer())
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className={daoClassName} style={daoOuterStyle}>
                      {isDaoLayoutTemplate ? renderDaoLayoutTemplate()
                        : isDaoTalisman2 ? renderDaoTalisman2()
                          : isDaoTalisman1 ? renderDaoTalisman1()
                            : isDaoFulu ? renderDaoFulu()
                              : isDaoFuOutline ? renderDaoFuReferenceOutline()
                                : isDaoStyle2 ? renderDaoStyle2()
                                  : isDaoStyle1 ? renderDaoStyle1()
                                    : renderDaoStyle1()}
                    </div>
                  )}
                </div>
              </div>

              {renderInMandalaCoverDropTargets()}

              {workspaceTab === "power-place" && selectedSlotId && (selectedSlotId === "__center_image" ? centralImage : selectedSlotImage) && renderSlotPhotoEditor()}

              {reportAdded && (
                <section className="powerReportOutput" aria-label="Отчёт по мандале">
                  <p className="cabinetEyebrow">Отчёт</p>
                  {reportDraft.situation && (
                    <article>
                      <h3>Анализ ситуации</h3>
                      <p>{reportDraft.situation}</p>
                    </article>
                  )}
                  {reportDraft.mandala_effect && (
                    <article>
                      <h3>Что даёт мандала</h3>
                      <p>{reportDraft.mandala_effect}</p>
                    </article>
                  )}
                  {reportDraft.extra_help && (
                    <article>
                      <h3>Что ещё поможет</h3>
                      <p>{reportDraft.extra_help}</p>
                    </article>
                  )}
                  {!reportHasBody && <p>Отчёт добавлен. Заполните поля справа, чтобы текст появился здесь.</p>}
                </section>
              )}
            </section>
          )}
        </div>

        <div className="workspaceRightColumn">
          <aside className="powerCommandRail powerPlaceSettings">
            {renderFieldLayoutSelector()}

            {renderSymbolLibraryModule()}

            <div className="coverSelector coverPickerPanel">
              <p className="cabinetEyebrow" aria-label="Фон места силы">Фон Места Силы</p>
              <div className="coverLayerTabs" role="tablist" aria-label="Слой фона">
                <button
                  className={`coverLayerTabButton${coverLayerMode === "inner" ? " active" : ""}${dragOverSlotId === "cover_ref.inner" ? " power-place-slot--drag-over" : ""}`}
                  type="button"
                  onClick={() => setCoverLayerMode("inner")}
                  aria-label="Фон внутри. Можно перетащить фото"
                  title="Фон внутри. Можно перетащить фото"
                  {...getPowerPlaceSlotDropHandlers("cover_ref.inner")}
                >
                  Фон внутри
                </button>
                <button
                  className={`coverLayerTabButton${coverLayerMode === "outer" ? " active" : ""}${dragOverSlotId === "cover_ref.outer" ? " power-place-slot--drag-over" : ""}`}
                  type="button"
                  onClick={() => setCoverLayerMode("outer")}
                  aria-label="Фон снаружи. Можно перетащить фото"
                  title="Фон снаружи. Можно перетащить фото"
                  {...getPowerPlaceSlotDropHandlers("cover_ref.outer")}
                >
                  Фон снаружи
                </button>
              </div>
              <label className={`coverOuterVisibilityToggle${visibilitySettings.outer_cover ? "" : " power-place-layer-hidden"}`}>
                <input
                  type="checkbox"
                  checked={!!visibilitySettings.outer_cover}
                  onChange={(event) => setVisibilitySetting("outer_cover", event.target.checked)}
                  aria-label="Фон снаружи"
                />
                <span>Фон снаружи</span>
              </label>
              <div className="coverPreviewWrap">
                <button
                  type="button"
                  className={`coverPreview ${visibleCover?.type === "image" ? "hasImage" : `tone-${visibleCover?.tone || "none"}`}${dragOverSlotId === coverLayerSaveTarget ? " power-place-slot--drag-over" : ""}`}
                  onClick={() => {
                    if (!visibleCover?.src) openPicker("cover");
                  }}
                  style={visibleCover?.type === "image" ? imageStyle(coverDisplaySrc(visibleCover)) : undefined}
                  aria-label={visibleCover?.src ? visibleCover.label || "Фон" : "Выбрать фото для пустого фона"}
                  {...getPowerPlaceSlotDropHandlers(coverLayerSaveTarget)}
                >
                  <span>{visibleCover?.label || "Без фона"}</span>
                </button>
              </div>
              <div className="coverVariantList coverVariantsGrid" aria-label="Варианты фона" data-cover-layer-target={coverLayerSaveTarget}>
                {coverOptions.map((cover) => {
                  if (cover.shortcutId) {
                    return (
                      <span className="coverVariantShortcut" key={cover.id}>
                        <button className={activeCover?.src === cover.src ? "active" : ""} onClick={() => onCompositionCoverSelect(coverLayerMode, cover)} type="button">
                          {cover.label}
                        </button>
                        <button className="coverShortcutHideButton" type="button" onClick={(event) => hideCoverShortcut(cover, event)} aria-label={`Скрыть ${cover.label}`}>
                          ×
                        </button>
                      </span>
                    );
                  }
                  const isGradientCover = String(cover.tone || "").startsWith("gradient-");
                  if (isGradientCover) {
                    return (
                      <button
                        className={`coverVariantSwatch coverVariantSwatch--${cover.tone}${activeCover?.id === cover.id ? " active" : ""}`}
                        key={cover.id}
                        onClick={() => onCompositionCoverSelect(coverLayerMode, cover)}
                        type="button"
                        title={cover.label}
                        aria-label={cover.label}
                      >
                        <span className="coverVariantSwatchPreview" aria-hidden="true" />
                        <span className="coverVariantSwatchLabel">{cover.label}</span>
                      </button>
                    );
                  }
                  return (
                    <button className={activeCover?.id === cover.id ? "active" : ""} key={cover.id} onClick={() => onCompositionCoverSelect(coverLayerMode, cover)} type="button">
                      {cover.label}
                    </button>
                  );
                })}
              </div>
              <button className="coverPickerButton" type="button" onClick={() => openPicker("cover")}>Выбрать фото</button>
            </div>

            {renderReportModule()}

            <div className="objectImageEditor">
              <p className="cabinetEyebrow">Объекты композиции</p>
              <div className="selectedObjectControl">
                <div className={selectedSlotImage ? "selectedObjectPreview hasImage" : "selectedObjectPreview"} style={imageStyle(objectRefUrls[selectedSlotImage] || selectedSlotImage)}>
                  {!selectedSlotImage && <span>◎</span>}
                </div>
                <div className="selectedObjectBody">
                  <b>{selectedSlot?.label || "Выберите позицию на мандале"}</b>
                  <small>Нажмите точку на диаграмме, затем выберите образ или загрузите файл.</small>
                  <select disabled={!selectedSlot} value={selectedSlotImage} onChange={(event) => selectedSlot && assignPowerPlaceSlotImage(selectedSlot.id, event.target.value, event.target.value)}>
                    <option value="">Пусто</option>
                    {savedImages.map((item) => (
                      <option key={`${selectedSlot?.id || "slot"}-${item.id}`} value={item.src}>{item.label}</option>
                    ))}
                  </select>
                  <div className="selectedObjectActions">
                    <button type="button" disabled={!selectedSlot} onClick={() => selectedSlot && openPicker("object")}>Выбрать образ</button>
                    <label className={!selectedSlot ? "disabled" : ""}>
                      <input type="file" accept="image/png,image/jpeg,image/webp,image/gif" disabled={!selectedSlot} onChange={(event) => {
                        const file = event.target.files?.[0];
                        if (file && selectedSlot) onObjectFileUpload(selectedSlot.id, file);
                        event.target.value = "";
                      }} />
                      Загрузить
                    </label>
                    <button type="button" disabled={!selectedSlot || !selectedSlotImage} onClick={() => selectedSlot && onCompositionObjectRefSelect(selectedSlot.id, "", "")}>Очистить</button>
                  </div>
                </div>
              </div>
            </div>
          </aside>
        </div>

        {workspaceTab === "power-place" && renderPowerPlaceActions()}

        {workspaceTab === "power-place" && (
          <details className="profileLiteAdvancedJson" open={advancedOpen} onToggle={(event) => setAdvancedOpen(event.currentTarget.open)}>
            <summary>Диагностика / advanced object refs JSON</summary>
            <label>
              Object refs JSON
              <textarea value={objectRefText(compositionDraft.object_refs)} onChange={(event) => onCompositionObjectRefsChange(event.target.value)} rows={6} />
            </label>
          </details>
        )}
      </div>

      {pickerMode && (
        <ProfileLiteImagePicker
          accountPlan={accountPlan}
          mode={pickerMode}
          images={savedImages}
          constructorType={compositionDraft.constructor_type}
          defaultLibraryTab="clients"
          selectedImageRef={pickerMode === "center" ? centralImageRef : pickerMode === "cover" ? visibleCover?.src || "" : selectedSlotImage}
          onSelect={chooseImage}
          onUpload={uploadPickerImage}
          onDelete={onClientPhotoDelete}
          onClose={closePicker}
          uploadStatus={pickerUploadStatus}
          uploadError={pickerUploadError}
        />
      )}
    </section>
  );
}
