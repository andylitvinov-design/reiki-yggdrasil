import React, { useMemo, useState } from "react";
import { reikiLevels } from "../../data/reikiKnowledgeBase.js";
import { mysteryTraditions } from "../../data/mysteryTraditions.js";
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
const ZODIAC_VARIANTS = [
  { value: "classic-2", label: "2", visibleCount: 2 },
  { value: "classic-4", label: "4", visibleCount: 4 },
  { value: "classic-6", label: "6", visibleCount: 6 },
  { value: "classic-8", label: "8", visibleCount: 8 },
  { value: "plus-8", label: "8+", visibleCount: 8 },
  { value: "classic-12", label: "12", visibleCount: 12 },
  { value: "plus-12", label: "12+", visibleCount: 12 }
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
const EMPTY_PROFILE_LITE_REPORT = {
  mode: "without_report",
  added: false,
  situation: "",
  mandala_effect: "",
  extra_help: "",
  master_note: ""
};
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
  { id: "cover-night", label: "Ночная мандала", type: "placeholder", tone: "night", src: "" }
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
  return Boolean(value && (/^https?:\/\//.test(value) || value.startsWith("data:image/")));
}

function imageStyle(src) {
  return isImagePreview(src) ? { backgroundImage: `url(${src})` } : undefined;
}

function buildPowerPlaceDragPayload(item) {
  const objectRef = String(item?.src || item?.object_ref || "");
  if (!objectRef) return null;

  return {
    id: String(item?.id || ""),
    title: String(item?.label || item?.title || item?.name || ""),
    name: String(item?.name || item?.label || item?.title || ""),
    src: String(item?.displaySrc || item?.display_url || item?.src || ""),
    object_ref: objectRef,
    type: item?.kind === "client-photo" ? "profile-media" : item?.kind === "saved-mandala" ? "saved-mandala" : String(item?.kind || "profile-media"),
    photoId: item?.photoId ? String(item.photoId) : ""
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
    return {
      id: String(parsed?.id || "").trim(),
      title: String(parsed?.title || parsed?.name || "").trim(),
      name: String(parsed?.name || parsed?.title || "").trim(),
      src: String(parsed?.src || "").trim(),
      object_ref: objectRef,
      type: ["saved-mandala", "profile-media", "client-photo", "tradition-asset", "material"].includes(parsed?.type) ? parsed.type : "profile-media",
      photoId: String(parsed?.photoId || "").trim()
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

function slotScaleValue(value) {
  const scale = Number(value);
  if (!Number.isFinite(scale)) return 1;
  return Math.min(1.18, Math.max(0.7, scale));
}

function chessSlotScaleValue(value) {
  return slotScaleValue(value);
}

function fieldScaleValue(value) {
  const scale = Number(value);
  if (!Number.isFinite(scale)) return 78;
  return Math.min(92, Math.max(48, scale));
}

function centerImageScaleValue(value) {
  const scale = Number(value);
  if (!Number.isFinite(scale)) return 1;
  return Math.min(1.45, Math.max(0.65, scale));
}

function centerFrameScaleValue(value) {
  const scale = Number(value);
  if (!Number.isFinite(scale)) return 1;
  return Math.min(1.4, Math.max(0.72, scale));
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
    const isPlusVariant = variant.startsWith("plus");
    const signSlots = ZODIAC_SIGNS.slice(0, isPlusVariant ? 8 : visibleCount).map((sign, index) => ({
      id: `zodiac-${index + 1}`,
      label: sign.label,
      className: sign.className,
      classPrefix: "classic"
    }));

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

function coverLayer(coverRef, layer) {
  if (!coverRef) return FALLBACK_COVERS[0];
  if (layer === "inner") return coverRef.inner || coverRef || FALLBACK_COVERS[0];
  return coverRef.outer || FALLBACK_COVERS[0];
}

function coverKindClass(cover, layer) {
  if (cover?.type === "image") return layer === "outer" ? "has-custom-outer-cover" : "has-custom-inner-cover";
  return "";
}

export default function ProfileLitePowerPlaceModule({
  clientGoalPhotos,
  compositionDraft,
  compositionMessage,
  mandalasError,
  mandalasStatus,
  materials,
  mediaError,
  mediaStatus,
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
  onSaveNew,
  onSendToServices,
  onUpdateExisting,
  onUploadedCentralPhoto,
  planLimits,
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
  const objectRefs = cleanObjectRefs(compositionDraft.object_refs);
  const slots = useMemo(() => buildSlotList(compositionDraft), [compositionDraft]);
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
  const sourceSlotScale = slotScaleValue(objectRefs.__slot_scale ?? compositionDraft.slot_scale ?? compositionDraft.chess_slot_scale ?? 1);
  const fieldScale = fieldScaleValue(compositionDraft.field_scale ?? objectRefs.__inner_field_scale);
  const centerImageScale = centerImageScaleValue(compositionDraft.__center_image_scale ?? objectRefs.__center_image_scale);
  const centerFrameScale = centerFrameScaleValue(compositionDraft.__center_frame_scale ?? objectRefs.__center_frame_scale);
  const chessVariant = compositionDraft.chess_variant || "classic-14";
  const chessSlotScale = chessSlotScaleValue(objectRefs.__slot_scale ?? compositionDraft.slot_scale ?? compositionDraft.chess_slot_scale ?? 1);
  const savedCompositionCount = powerPlaceCompositions.length;
  const savedCompositionLimit = planLimits.compositions;
  const saveNewDisabled = savedCompositionCount >= savedCompositionLimit && !compositionDraft.id;
  const saveNewTitle = saveNewDisabled
    ? "Лимит 7 сохранённых мандал достигнут. Выберите мандалу из списка и нажмите «Обновить» или удалите одну мандалу."
    : "Сохранить новую мандалу";
  const saveNewAriaLabel = saveNewDisabled ? `Сохранить: ${saveNewTitle}` : saveNewTitle;
  const handleSaveNewClick = () => {
    if (saveNewDisabled) return;
    onSaveNew();
  };

  const handleSaveCompositionClick = () => {
    if (compositionDraft.id) {
      onUpdateExisting();
      return;
    }
    handleSaveNewClick();
  };
  const sourceSlotScaleStyle = {
    "--power-source-slot-scale": sourceSlotScale,
    "--power-place-chess-slot-scale": chessSlotScale,
    "--power-field-scale": `${fieldScale}%`,
    "--power-center-image-scale": centerImageScale,
    "--power-center-frame-scale": centerFrameScale
  };
  const centerImageStyle = {
    ...(imageStyle(centralImage) || {}),
    "--power-center-image-scale": centerImageScale
  };
  const chessCoverStyle = {
    ...(innerCoverImageStyle(innerCover, coverDisplaySrc(innerCover)) || {}),
    ...sourceSlotScaleStyle
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
      onCompositionCoverSelect(layer, {
        id: item?.id || (layer === "outer" ? "custom-outer-cover" : "custom-cover"),
        label: item?.label || item?.title || item?.name || "Своё изображение",
        type: "image",
        src: ref,
        display_src: displaySrc
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
    const style = {
      left: `${50 + radius * Math.cos(radians)}%`,
      top: `${50 + radius * Math.sin(radians)}%`,
      ...imageStyle(displaySrc)
    };

    return (
      <button
        className={`powerSource source-${index + 1}${src ? " hasImage" : ""}${selectedSlotId === slot.id ? " selected" : ""}${dragOverSlotId === slot.id ? " power-place-slot--drag-over" : ""}`}
        key={slot.id}
        onClick={() => openObjectPicker(slot.id)}
        style={style}
        type="button"
        title={slot.label}
        aria-label={`Выбрать ${slot.label.toLowerCase()}`}
        {...getPowerPlaceSlotDropHandlers(slot.id)}
      >
        {!src && <span>{index + 1}</span>}
      </button>
    );
  };

  const renderCenterPhotoWithMode = (className) => (
    <button
      className={`${className}${centralImage ? " hasImage" : ""}${dragOverSlotId === "__center_image" ? " power-place-slot--drag-over" : ""}`}
      style={centerImageStyle}
      onClick={() => openPicker("center")}
      title="Фото клиента / цели"
      type="button"
      aria-label="Фото клиента / цели"
      {...getPowerPlaceSlotDropHandlers("__center_image")}
    >
      {!centralImage && <span>Фото клиента / цели</span>}
    </button>
  );

  const renderObjectImageButton = (slot, index, className, labelPrefix = "") => {
    const src = objectRefs[slot.id] || "";
    const displaySrc = objectRefUrls[src] || objectRefUrls[slot.id] || src;

    return (
      <button
        className={`${className}${src ? " hasImage" : ""}${selectedSlotId === slot.id ? " selected" : ""}${dragOverSlotId === slot.id ? " power-place-slot--drag-over" : ""}`}
        key={slot.id}
        onClick={() => openObjectPicker(slot.id)}
        style={imageStyle(displaySrc)}
        type="button"
        title={slot.label}
        aria-label={`Выбрать ${labelPrefix}${slot.label.toLowerCase()}`}
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

  const renderPowerPlaceActions = () => (
    <div className="profileLitePowerPlaceActions">
      <label className="compositionTitleField">
        Название мандалы
        <input className="compositionTitleInput" value={compositionDraft.title} onChange={(event) => onCompositionDraftChange("title", event.target.value)} placeholder="Название мандалы" />
      </label>
      <div className="powerPlaceActions">
        <button className="cabinetPrimary powerPlaceSaveButton" type="button" onClick={handleSaveCompositionClick} disabled={!compositionDraft.id && saveNewDisabled} title={compositionDraft.id ? "Обновить сохранённую мандалу" : saveNewTitle} aria-label={compositionDraft.id ? "Сохранить мандалу" : saveNewAriaLabel}>Сохранить мандалу</button>
        <button className="cabinetSecondary" type="button" onClick={onSendToServices}>Перенести в услуги</button>
        <button className="cabinetSecondary" type="button" onClick={onPublishAsService}>Опубликовать как услугу</button>
        <button className="cabinetSecondary" type="button" onClick={onDownload}>Скачать PDF</button>
        <button className="cabinetPrimary" type="button" onClick={onPrint}>Печать</button>
      </div>
      {compositionMessage && <div className="cabinetSuccess compactNotice profileLitePowerPlaceActionFeedback">{compositionMessage}</div>}
      <p className="powerPlaceActionsMeta">{savedCompositionCount}/{savedCompositionLimit} сохранённых мест силы · Storage refs сохраняются без data:image.</p>
      <p className="powerPrintColorHint">Для цветной печати включите в окне печати: Background graphics / Фоновая графика.</p>
    </div>
  );

  const renderScaleControl = ({ className, label, value, min, max, step, field }) => (
    <div className={className} aria-label={label}>
      <span>{label}</span>
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
                    const nextComposition = powerPlaceCompositions.find((item) => String(item.id) === String(nextId));
                    if (nextComposition) onCompositionLoad(nextComposition);
                  }}
                  aria-label="Сохранённые мандалы"
                >
                  <option value="">Сохранённые мандалы</option>
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
                  <div className="zodiacCountSelector" aria-label="Количество видимых позиций зодиака">
                    <span>Позиции зодиака</span>
                    {ZODIAC_VARIANTS.map((variant) => (
                      <button className={(compositionDraft.zodiac_variant || `classic-${compositionDraft.zodiac_visible_count}`) === variant.value ? "active" : ""} key={variant.value} onClick={() => {
                        onCompositionDraftChange("zodiac_variant", variant.value);
                        onCompositionDraftChange("zodiac_visible_count", variant.visibleCount);
                      }} type="button">{variant.label}</button>
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
                {renderScaleControl({ className: "sourceSlotScaleControl", label: "Размер окон", value: sourceSlotScale, min: "0.7", max: "1.18", step: "0.01", field: "slot_scale" })}
                {renderScaleControl({ className: "innerFieldScaleControl", label: "Размер поля", value: fieldScale, min: "48", max: "96", step: "1", field: "field_scale" })}
                {renderScaleControl({ className: "centerFrameScaleControl", label: "Размер центра", value: centerFrameScale, min: "0.72", max: "1.4", step: "0.01", field: "__center_frame_scale" })}
                {renderScaleControl({ className: "photoScaleControl", label: "Размер фоток", value: centerImageScale, min: "0.65", max: "1.45", step: "0.01", field: "__center_image_scale" })}
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
                <div className={`powerMandalaPanel field-layout-${compositionDraft.field_layout || "square"} outer-cover-${outerCover?.type === "image" ? "image" : outerCover?.tone || "none"} ${outerCoverClass}`.trim()} style={{ ...(outerCover?.type === "image" ? { "--power-outer-cover-image": `url(${coverDisplaySrc(outerCover)})` } : {}), ...sourceSlotScaleStyle }}>
                  {renderInMandalaCoverDropTargets()}
                  <div className="powerPrintMeta">
                    <p className="cabinetEyebrow">Формат</p>
                    <h3>{formatLabel(compositionDraft.constructor_type)}</h3>
                  </div>
                  {compositionDraft.constructor_type === "client" ? (
                    <div className={`powerMandala geometry-${compositionDraft.geometry || slots.length} cover-${innerCover?.tone || "gold"} constructor-client mandala-${compositionDraft.__mandala_style || "style-1"} ${innerCoverClass}`.trim()} style={innerCoverImageStyle(innerCover, coverDisplaySrc(innerCover))}>
                      {renderCenterPhotoWithMode("powerCenterPhoto")}
                      <div className="powerMandalaBase">{slots.map(renderSourceSlot)}</div>
                    </div>
                  ) : compositionDraft.constructor_type === "altar" ? (
                    <div className={`altarMandalaSheet ratio-${compositionDraft.altar_center_ratio || "1"} cover-${innerCover?.tone || "gold"} ${innerCoverClass}`.trim()} style={innerCoverImageStyle(innerCover, coverDisplaySrc(innerCover))}>
                      <div className="altarTopRow" aria-label="Верхние источники алтаря">
                        {slots.slice(0, 5).map((slot, index) => renderObjectImageButton(
                          slot,
                          index,
                          `${index === 2 ? "altarTopSource main" : "altarTopSource"}`
                        ))}
                      </div>
                      {renderCenterPhotoWithMode("altarCenterPhoto")}
                      <div className="altarMandalaBase">
                        <span>мандала места силы</span>
                      </div>
                      <div className="altarBottomSupports" aria-label="Нижние опоры алтаря">
                        {slots.slice(5).map((slot, index) => renderObjectImageButton(slot, index, "altarSupportSource"))}
                      </div>
                    </div>
                  ) : compositionDraft.constructor_type === "business" ? (
                    <div className={`businessMandalaSheet zones-${compositionDraft.business_vertex_zone_count || 1} cover-${innerCover?.tone || "gold"} ${innerCoverClass}`.trim()} style={innerCoverImageStyle(innerCover, coverDisplaySrc(innerCover))}>
                      {renderCenterPhotoWithMode("businessCenterPhoto")}
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
                      <div className={`zodiacMandalaSheet zodiac-${compositionDraft.zodiac_visible_count || 12} ${(compositionDraft.zodiac_variant || "").startsWith("plus") ? `zodiac-plus-${compositionDraft.zodiac_visible_count || 12}` : ""} cover-${innerCover?.tone || "gold"} ${innerCoverClass}`.trim()} style={innerCoverImageStyle(innerCover, coverDisplaySrc(innerCover))}>
                        {renderCenterPhotoWithMode("zodiacCenterPhoto")}
                        <div className="zodiacClockFace" aria-hidden="true">
                          <span>ЗОДИАК</span>
                        </div>
                        {slots.filter((slot) => slot.id.startsWith("zodiac-") && !slot.id.startsWith("zodiac-plus")).map((slot, index) => {
                          const src = objectRefs[slot.id] || "";
                          const displaySrc = objectRefUrls[src] || src;
                          return (
                            <div className={`zodiacPosition ${slot.className}${src ? " hasImage" : ""}`} key={slot.id}>
                              <button
                                className={`zodiacPositionImage${selectedSlotId === slot.id ? " selected" : ""}${dragOverSlotId === slot.id ? " power-place-slot--drag-over" : ""}`}
                                onClick={() => openObjectPicker(slot.id)}
                                style={imageStyle(displaySrc)}
                                type="button"
                                title={slot.label}
                                aria-label={`Выбрать знак ${slot.label}`}
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
                              className={`zodiacFieldPlusPositionImage${selectedSlotId === slot.id ? " selected" : ""}${dragOverSlotId === slot.id ? " power-place-slot--drag-over" : ""}`}
                              onClick={() => openObjectPicker(slot.id)}
                              style={imageStyle(displaySrc)}
                              type="button"
                              title={slot.label}
                              aria-label={`Выбрать ${slot.label.toLowerCase()}`}
                              {...getPowerPlaceSlotDropHandlers(slot.id)}
                            >
                              {!src && <span>{index + 1}</span>}
                            </button>
                            <b>{slot.label}</b>
                          </div>
                        );
                      })}
                    </>
                  ) : compositionDraft.constructor_type === "star" ? (
                    <div className={`starMandalaSheet star-${compositionDraft.star_variant || "closed"} cover-${innerCover?.tone || "gold"} ${innerCoverClass}`.trim()} style={innerCoverImageStyle(innerCover, coverDisplaySrc(innerCover))}>
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
                      </div>
                      {slots.map((slot, index) => {
                        const src = objectRefs[slot.id] || "";
                        const displaySrc = objectRefUrls[src] || src;
                        return (
                          <div className={`starPosition ${slot.className}${src ? " hasImage" : ""}`} key={slot.id}>
                            <button
                              className={`starPositionImage${selectedSlotId === slot.id ? " selected" : ""}${dragOverSlotId === slot.id ? " power-place-slot--drag-over" : ""}`}
                              onClick={() => openObjectPicker(slot.id)}
                              style={imageStyle(displaySrc)}
                              type="button"
                              title={slot.label}
                              aria-label={`Выбрать ${slot.label.toLowerCase()}`}
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
                    <div className={`power-place-chess power-place-chess--${chessVariant} cover-${innerCover?.tone || "gold"} ${innerCoverClass}`.trim()} style={chessCoverStyle}>
                      <div className="power-place-chess__board" aria-label="Шахматная раскладка">
                        {chessVariant === "plus-8" || chessVariant === "compact-5" ? (
                          <>
                            {renderCenterPhotoWithMode("power-place-chess__center")}
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
                          })
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className={`daoMandalaSheet cover-${innerCover?.tone || "gold"} ${innerCoverClass}`.trim()} style={innerCoverImageStyle(innerCover, coverDisplaySrc(innerCover))}>
                      {renderCenterPhotoWithMode("daoCenterPhoto")}
                      <div className="daoUsinCore" aria-hidden="true">
                        <span>УСИН</span>
                      </div>
                      {DAO_ELEMENTS.map((element) => {
                        const slotId = `dao-${element.id}`;
                        const src = objectRefs[slotId] || "";
                        const displaySrc = objectRefUrls[src] || src;
                        return (
                          <div className={`daoElement ${element.className}`} key={element.id}>
                            <button
                              className={`daoElementImage${src ? " hasImage" : ""}${selectedSlotId === slotId ? " selected" : ""}${dragOverSlotId === slotId ? " power-place-slot--drag-over" : ""}`}
                              onClick={() => openObjectPicker(slotId)}
                              style={imageStyle(displaySrc)}
                              type="button"
                              title={element.label}
                              aria-label={`Выбрать элемент ${element.label}`}
                              {...getPowerPlaceSlotDropHandlers(slotId)}
                            >
                              {!src && <span>◎</span>}
                            </button>
                            <b>{element.label}</b>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {workspaceTab === "power-place" && renderPowerPlaceActions()}

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
                {coverOptions.map((cover) => cover.shortcutId ? (
                  <span className="coverVariantShortcut" key={cover.id}>
                    <button className={activeCover?.src === cover.src ? "active" : ""} onClick={() => onCompositionCoverSelect(coverLayerMode, cover)} type="button">
                      {cover.label}
                    </button>
                    <button className="coverShortcutHideButton" type="button" onClick={(event) => hideCoverShortcut(cover, event)} aria-label={`Скрыть ${cover.label}`}>
                      ×
                    </button>
                  </span>
                ) : (
                  <button className={activeCover?.id === cover.id ? "active" : ""} key={cover.id} onClick={() => onCompositionCoverSelect(coverLayerMode, cover)} type="button">
                    {cover.label}
                  </button>
                ))}
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
          mode={pickerMode}
          images={savedImages}
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
