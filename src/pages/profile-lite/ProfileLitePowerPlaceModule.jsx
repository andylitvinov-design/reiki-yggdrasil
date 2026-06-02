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
  { value: "client-goals", label: "Клиенты", subcategories: [{ value: "client-goals", label: "Фото клиентов" }] }
];
const FIELD_LAYOUTS = [
  { value: "vertical", label: "Вертикальное" },
  { value: "horizontal", label: "Горизонтальное" },
  { value: "square", label: "Квадрат" }
];

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

function uniqueImageSources(items) {
  const seen = new Set();
  return items.filter((item) => {
    const key = item?.src || item?.displaySrc;
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function cleanObjectRefs(refs) {
  return refs && typeof refs === "object" && !Array.isArray(refs) ? refs : {};
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
    return [
      ...CHESS_TOP_SLOTS,
      ...(CHESS_SLOT_LAYOUTS[draft.chess_variant] || CHESS_SLOT_LAYOUTS["classic-14"])
    ];
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
  return coverRef[layer] || coverRef || FALLBACK_COVERS[0];
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
  onClientPhotoDelete,
  onCompositionCoverSelect,
  onCompositionDraftChange,
  onCompositionLoad,
  onCompositionObjectRefSelect,
  onCompositionObjectRefsChange,
  onCoverFileUpload,
  onDownload,
  onObjectFileUpload,
  onPrint,
  onSave,
  onSendToServices,
  onUploadedCentralPhoto,
  planLimits,
  powerPlaceCompositions,
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
  const [activeSourceCategory, setActiveSourceCategory] = useState("dao-ri");
  const [activeSourceSubcategory, setActiveSourceSubcategory] = useState(SOURCE_LIBRARY_CATEGORIES[0]?.subcategories?.[0]?.value || "");
  const [activeSourceThirdLevel, setActiveSourceThirdLevel] = useState(SOURCE_LIBRARY_CATEGORIES[0]?.subcategories?.[0]?.thirdLevels?.[0]?.value || "");
  const objectRefs = cleanObjectRefs(compositionDraft.object_refs);
  const slots = useMemo(() => buildSlotList(compositionDraft), [compositionDraft]);
  const selectedSlot = slots.find((slot) => slot.id === selectedSlotId) || slots[0] || null;
  const selectedSlotImage = selectedSlot ? objectRefs[selectedSlot.id] || "" : "";
  const objectRefUrls = cleanObjectRefs(compositionDraft.object_ref_urls);
  const centralPhoto = clientGoalPhotos.find((item) => item.id === compositionDraft.central_photo_id) || null;
  const centralImageRef = objectRefs.__center_image || "";
  const centralDisplayCandidate = objectRefUrls[centralImageRef] || centralPhoto?.display_url || centralPhoto?.signed_url || centralPhoto?.image_url || centralImageRef;
  const centralImage = isImagePreview(centralDisplayCandidate) ? centralDisplayCandidate : "";
  const innerCover = coverLayer(compositionDraft.cover_ref, "inner");
  const outerCover = coverLayer(compositionDraft.cover_ref, "outer");
  const visibleCover = coverLayerMode === "outer" ? outerCover : innerCover;

  const savedImages = useMemo(() => uniqueImageSources([
    ...clientGoalPhotos.map((photo) => ({
      id: `client-${photo.id}`,
      label: photo.title || "Фото клиента / цели",
      meta: photo.notes || "Клиенты",
      src: photo.image_ref || photo.image_url,
      displaySrc: photo.display_url || photo.signed_url || photo.image_url,
      signingError: photo.media_signing_error || "",
      kind: "client-photo",
      photoId: photo.id
    })),
    ...traditionAssets.map((asset) => ({
      id: `tradition-${asset.id}`,
      label: asset.title || asset.tradition_title || "Образ традиции",
      meta: asset.tradition_title || "Мистерии",
      src: asset.image_ref || asset.image_url,
      displaySrc: asset.display_url || asset.signed_url || asset.image_url,
      signingError: asset.media_signing_error || "",
      kind: "tradition-asset",
      traditionId: asset.tradition_id || ""
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
      type: item.type || ""
    }))
  ]), [clientGoalPhotos, materials, traditionAssets]);

  const coverOptions = useMemo(() => [
    ...FALLBACK_COVERS,
    ...savedImages.map((item) => ({
      id: `saved-cover-${item.id}`,
      label: item.label,
      type: "image",
      src: item.src,
      display_src: item.displaySrc,
      displaySrc: item.displaySrc
    })),
    ...(innerCover?.id === "custom-cover" ? [innerCover] : []),
    ...(outerCover?.id === "custom-outer-cover" ? [outerCover] : [])
  ], [innerCover, outerCover, savedImages]);
  const activeCover = visibleCover;
  const coverLayerSaveTarget = coverLayerMode === "inner" ? "cover_ref.inner" : "cover_ref.outer";
  const activeSourceCategoryData = SOURCE_LIBRARY_CATEGORIES.find((item) => item.value === activeSourceCategory) || SOURCE_LIBRARY_CATEGORIES[0];
  const activeSourceSubcategoryData = activeSourceCategoryData.subcategories.find((item) => item.value === activeSourceSubcategory) || activeSourceCategoryData.subcategories[0] || null;
  const activeSourceThirdLevelData = activeSourceSubcategoryData?.thirdLevels?.find((item) => item.value === activeSourceThirdLevel) || activeSourceSubcategoryData?.thirdLevels?.[0] || null;

  const filteredSavedImages = useMemo(() => savedImages.filter((item) => {
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
  }), [activeSourceCategory, activeSourceSubcategoryData, activeSourceThirdLevelData, savedImages]);

  const openObjectPicker = (slotId) => {
    setSelectedSlotId(slotId);
    openPicker("object");
  };

  const chooseImage = async (item) => {
    if (pickerMode === "center") {
      onCompositionDraftChange("central_photo_id", item.kind === "client-photo" ? item.photoId : "");
      onCompositionObjectRefSelect("__center_image", item.src || "", item.displaySrc || item.src || "");
    } else if (pickerMode === "cover") {
      onCompositionCoverSelect(coverLayerMode, {
        id: item.id,
        label: item.label,
        type: "image",
        src: item.src,
        display_src: item.displaySrc || item.src
      });
    } else if (selectedSlotId) {
      onCompositionObjectRefSelect(selectedSlotId, item.src || "", item.displaySrc || item.src || "");
    }
  };

  const openPicker = (mode) => {
    setPickerUploadStatus("idle");
    setPickerUploadError("");
    setPickerMode(mode);
  };

  const closePicker = () => {
    setPickerMode("");
    setPickerUploadStatus("idle");
    setPickerUploadError("");
  };

  const uploadPickerImage = async (file) => {
    setPickerUploadStatus("loading");
    setPickerUploadError("");
    try {
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
    const displaySrc = objectRefUrls[src] || src;
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
        className={`powerSource source-${index + 1}${src ? " hasImage" : ""}${selectedSlotId === slot.id ? " selected" : ""}`}
        key={slot.id}
        onClick={() => openObjectPicker(slot.id)}
        style={style}
        type="button"
        title={slot.label}
        aria-label={`Выбрать ${slot.label.toLowerCase()}`}
      >
        {!src && <span>{index + 1}</span>}
      </button>
    );
  };

  const renderCenterPhotoWithMode = (className) => (
    <button className={`${className}${centralImage ? " hasImage" : ""}`} style={imageStyle(centralImage)} onClick={() => openPicker("center")} title="Фото клиента / цели" type="button" aria-label="Фото клиента / цели">
      {!centralImage && <span>Фото клиента / цели</span>}
    </button>
  );

  const renderObjectImageButton = (slot, index, className, labelPrefix = "") => {
    const src = objectRefs[slot.id] || "";
    const displaySrc = objectRefUrls[src] || src;

    return (
      <button
        className={`${className}${src ? " hasImage" : ""}${selectedSlotId === slot.id ? " selected" : ""}`}
        key={slot.id}
        onClick={() => openObjectPicker(slot.id)}
        style={imageStyle(displaySrc)}
        type="button"
        title={slot.label}
        aria-label={`Выбрать ${labelPrefix}${slot.label.toLowerCase()}`}
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

  const renderPowerPlaceActions = () => (
    <div className="profileLitePowerPlaceActions">
      <label className="compositionTitleField">
        Название мандалы
        <input className="compositionTitleInput" value={compositionDraft.title} onChange={(event) => onCompositionDraftChange("title", event.target.value)} placeholder="Название мандалы" />
      </label>
      <div className="powerPlaceActions">
        <button className="cabinetPrimary" type="button" onClick={onSave}>{compositionDraft.id ? "Обновить место силы" : "Сохранить место силы"}</button>
        <button className="cabinetSecondary" type="button" onClick={onSendToServices}>В услуги</button>
        <button className="cabinetSecondary" type="button" onClick={onDownload}>Скачать</button>
        <button className="cabinetPrimary" type="button" onClick={onPrint}>Печать</button>
        <span>{powerPlaceCompositions.length}/{planLimits.compositions} сохранённых мест силы · Storage refs сохраняются без data:image.</span>
      </div>
    </div>
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
        </div>
      </div>

      {mandalasError && <div className="cabinetNotice cabinetSecondaryDataWarning">needs verification: {mandalasError}</div>}
      {mediaError && <div className="cabinetNotice cabinetSecondaryDataWarning">needs verification: {mediaError}</div>}
      {compositionMessage && <div className="cabinetSuccess compactNotice">{compositionMessage}</div>}

      <div className="workspaceMainColumns profileLitePowerPlaceColumns">
        <aside className="mandalaModeSidebar powerLibrarySidebar">
          <p className="cabinetEyebrow">Источники силы</p>
          <h3>Источники силы</h3>
          <div className="powerLibraryPrimaryActions">
            <button className="powerAddImageButton" type="button" onClick={() => openPicker(selectedSlot ? "object" : "center")}>
              Добавить мандалу
            </button>
            <button className="powerChooseBaseButton" type="button" onClick={() => openPicker(selectedSlot ? "object" : "center")}>
              Выбрать из базы
            </button>
          </div>
          <select value={compositionDraft.id || ""} onChange={(event) => {
            const composition = powerPlaceCompositions.find((item) => item.id === event.target.value);
            if (composition) onCompositionLoad(composition);
          }}>
            <option value="">Загрузить сохранённое место силы</option>
            {powerPlaceCompositions.map((composition) => (
              <option key={composition.id} value={composition.id}>{composition.title || "Место силы"}</option>
            ))}
          </select>
          <div className="profileLiteCompositionList">
            {powerPlaceCompositions.map((composition) => (
              <button key={composition.id} type="button" onClick={() => onCompositionLoad(composition)}>
                <b>{composition.title || "Место силы"}</b>
                <span>{formatLabel(composition.constructor_type)}</span>
              </button>
            ))}
            {mandalasStatus === "success" && powerPlaceCompositions.length === 0 && <p>Сохранённые мандалы пока не найдены.</p>}
          </div>
          <div className="powerLibraryFilter">
            <label className="powerLibrarySelectLabel">
              Группа
              <select value={activeSourceCategory} onChange={(event) => {
                const nextCategory = SOURCE_LIBRARY_CATEGORIES.find((category) => category.value === event.target.value) || SOURCE_LIBRARY_CATEGORIES[0];
                setActiveSourceCategory(nextCategory.value);
                setActiveSourceSubcategory(nextCategory.subcategories[0]?.value || "");
                setActiveSourceThirdLevel(nextCategory.subcategories[0]?.thirdLevels?.[0]?.value || "");
              }}>
                {SOURCE_LIBRARY_CATEGORIES.map((category) => (
                  <option key={category.value} value={category.value}>{category.label}</option>
                ))}
              </select>
            </label>
            {activeSourceCategoryData.subcategories.length > 0 && (
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
              <div className="powerLibrarySubcategoryButtons">
                {activeSourceSubcategoryData.thirdLevels.map((thirdLevel) => (
                  <button
                    className={activeSourceThirdLevel === thirdLevel.value ? "active" : ""}
                    key={thirdLevel.value}
                    onClick={() => setActiveSourceThirdLevel(thirdLevel.value)}
                    type="button"
                  >
                    {thirdLevel.label}
                  </button>
                ))}
              </div>
            )}
            {activeSourceCategory === "dao-ri" && activeSourceSubcategoryData?.steps?.length > 0 && (
              <div className="powerLibrarySubcategoryButtons">
                {activeSourceSubcategoryData.steps.map((step) => (
                  <button
                    className={activeSourceThirdLevel === step.id ? "active" : ""}
                    key={step.id}
                    onClick={() => setActiveSourceThirdLevel(step.id)}
                    type="button"
                  >
                    {step.label} {step.number}: {step.title}
                  </button>
                ))}
              </div>
            )}
            <div className="powerLibrarySubcategoryButtons" aria-label="Быстрые группы источников">
              {SOURCE_LIBRARY_CATEGORIES.map((category) => (
                <button className={activeSourceCategory === category.value ? "active" : ""} key={category.value} type="button" onClick={() => {
                  setActiveSourceCategory(category.value);
                  setActiveSourceSubcategory(category.subcategories[0]?.value || "");
                  setActiveSourceThirdLevel(category.subcategories[0]?.thirdLevels?.[0]?.value || "");
                }}>
                  {category.label}
                </button>
              ))}
            </div>
          </div>
          <div className="powerSavedImageList" aria-label="Сохранённые изображения">
            <div className="powerSavedImageHeader">
              <b>Сохранённые изображения</b>
              <small>{selectedSlot ? `Позиция: ${selectedSlot.label}` : "Выберите позицию на схеме"}</small>
            </div>
            {filteredSavedImages.map((item) => (
              <button className="powerSavedImageCard" key={item.id} type="button" onClick={() => chooseImage(item)}>
                <span className={`powerSavedImageThumb${item.displaySrc ? " hasImage" : ""}`} style={imageStyle(item.displaySrc || item.src)} />
                <b>{item.label}</b>
                <small>{item.meta}</small>
              </button>
            ))}
            {savedImages.length === 0 && <p>Сохранённые фото, подложки и изображения появятся здесь после загрузки.</p>}
            {savedImages.length > 0 && filteredSavedImages.length === 0 && <p>В этой категории пока нет изображений.</p>}
          </div>
        </aside>

        <div className="workspaceCenterColumn">
          {workspaceTab === "mandalas" ? (
            <section className="cabinetCard mandalaGallery">
              <div className="cabinetFormHeader">
                <div>
                  <p className="cabinetEyebrow">Мои мандалы</p>
                  <h2>Сохранённые места силы</h2>
                </div>
                <span className="cabinetStatus">{mandalasStatus}</span>
              </div>
              <div className="profileLiteCompositionList">
                {powerPlaceCompositions.map((composition) => (
                  <button key={composition.id} type="button" onClick={() => {
                    onCompositionLoad(composition);
                    setWorkspaceTab("power-place");
                  }}>
                    <b>{composition.title || "Место силы"}</b>
                    <span>{formatLabel(composition.constructor_type)} · {composition.updated_at || composition.created_at || "needs verification"}</span>
                  </button>
                ))}
              </div>
            </section>
          ) : (
            <section className="powerPlaceConstructor" aria-label="Конструктор магической мандалы места силы">
              <div className="powerPlaceHeader">
                <div>
                  <p className="cabinetEyebrow">Места силы</p>
                  <h2>Магическая мандала</h2>
                </div>
                <span className="cabinetStatus">{mediaStatus}</span>
              </div>

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
                {compositionDraft.constructor_type === "business" && (
                  <div className="businessZoneSelector" aria-label="Зон в каждой вершине">
                    <span>Зон в каждой вершине</span>
                    {[1, 3].map((count) => (
                      <button className={Number(compositionDraft.business_vertex_zone_count) === count ? "active" : ""} key={count} onClick={() => onCompositionDraftChange("business_vertex_zone_count", count)} type="button">{count}</button>
                    ))}
                  </div>
                )}
              </div>

              <div className={`powerPlacePrintArea field-layout-${compositionDraft.field_layout || "square"}`}>
                <div className={`powerMandalaPanel field-layout-${compositionDraft.field_layout || "square"} outer-cover-${outerCover?.tone || "gold"}`} style={imageStyle(outerCover?.display_src || outerCover?.displaySrc || outerCover?.src)}>
                  <div className="powerPrintMeta">
                    <p className="cabinetEyebrow">Формат</p>
                    <h3>{formatLabel(compositionDraft.constructor_type)}</h3>
                  </div>
                  {compositionDraft.constructor_type === "client" ? (
                    <div className={`powerMandala geometry-${compositionDraft.geometry || slots.length} cover-${innerCover?.tone || "gold"} constructor-client`} style={imageStyle(innerCover?.display_src || innerCover?.displaySrc || innerCover?.src)}>
                      {renderCenterPhotoWithMode("powerCenterPhoto")}
                      <div className="powerMandalaBase">{slots.map(renderSourceSlot)}</div>
                    </div>
                  ) : compositionDraft.constructor_type === "altar" ? (
                    <div className={`altarMandalaSheet ratio-${compositionDraft.altar_center_ratio || "1"} cover-${innerCover?.tone || "gold"}`} style={imageStyle(innerCover?.display_src || innerCover?.displaySrc || innerCover?.src)}>
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
                    <div className={`businessMandalaSheet zones-${compositionDraft.business_vertex_zone_count || 1} cover-${innerCover?.tone || "gold"}`} style={imageStyle(innerCover?.display_src || innerCover?.displaySrc || innerCover?.src)}>
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
                      <div className={`zodiacMandalaSheet zodiac-${compositionDraft.zodiac_visible_count || 12} ${(compositionDraft.zodiac_variant || "").startsWith("plus") ? `zodiac-plus-${compositionDraft.zodiac_visible_count || 12}` : ""} cover-${innerCover?.tone || "gold"}`} style={imageStyle(innerCover?.display_src || innerCover?.displaySrc || innerCover?.src)}>
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
                                className={`zodiacPositionImage${selectedSlotId === slot.id ? " selected" : ""}`}
                                onClick={() => openObjectPicker(slot.id)}
                                style={imageStyle(displaySrc)}
                                type="button"
                                title={slot.label}
                                aria-label={`Выбрать знак ${slot.label}`}
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
                              className={`zodiacFieldPlusPositionImage${selectedSlotId === slot.id ? " selected" : ""}`}
                              onClick={() => openObjectPicker(slot.id)}
                              style={imageStyle(displaySrc)}
                              type="button"
                              title={slot.label}
                              aria-label={`Выбрать ${slot.label.toLowerCase()}`}
                            >
                              {!src && <span>{index + 1}</span>}
                            </button>
                            <b>{slot.label}</b>
                          </div>
                        );
                      })}
                    </>
                  ) : compositionDraft.constructor_type === "star" ? (
                    <div className={`starMandalaSheet star-${compositionDraft.star_variant || "closed"} cover-${innerCover?.tone || "gold"}`} style={imageStyle(innerCover?.display_src || innerCover?.displaySrc || innerCover?.src)}>
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
                              className={`starPositionImage${selectedSlotId === slot.id ? " selected" : ""}`}
                              onClick={() => openObjectPicker(slot.id)}
                              style={imageStyle(displaySrc)}
                              type="button"
                              title={slot.label}
                              aria-label={`Выбрать ${slot.label.toLowerCase()}`}
                            >
                              {!src && <span>{index + 1}</span>}
                            </button>
                            <b>{slot.label}</b>
                          </div>
                        );
                      })}
                    </div>
                  ) : compositionDraft.constructor_type === "chess" ? (
                    <div className={`power-place-chess power-place-chess--${compositionDraft.chess_variant || "classic-14"} cover-${innerCover?.tone || "gold"}`} style={imageStyle(innerCover?.display_src || innerCover?.displaySrc || innerCover?.src)}>
                      <div className="power-place-chess__top-row" aria-label="Верхний ряд мандал">
                        {CHESS_TOP_SLOTS.map((slot, index) => renderObjectImageButton(slot, index, `power-place-chess__top-slot ${slot.className}`))}
                      </div>
                      <div className="power-place-chess__board" aria-label="Шахматная раскладка">
                        {(compositionDraft.chess_variant || "classic-14") === "plus-8" ? (
                          <>
                            {renderCenterPhotoWithMode("power-place-chess__center")}
                            {(CHESS_SLOT_LAYOUTS["plus-8"] || []).map((slot, index) => renderChessSlot(slot, index, `power-place-chess__slot--${slot.className}`))}
                          </>
                        ) : (
                          Array.from({ length: (compositionDraft.chess_variant || "classic-14") === "classic-14" ? 15 : 9 }, (_, index) => {
                            const row = Math.floor(index / 3) + 1;
                            const col = (index % 3) + 1;
                            const centerIndex = (compositionDraft.chess_variant || "classic-14") === "classic-14" ? 7 : 4;
                            const toneClass = (row + col) % 2 === 0 ? "is-dark" : "is-light";

                            if (index === centerIndex) {
                              return (
                                <div className={`power-place-chess__cell power-place-chess__cell--center ${toneClass}`} key="chess-center">
                                  {renderCenterPhotoWithMode("power-place-chess__center")}
                                </div>
                              );
                            }

                            const slot = (CHESS_SLOT_LAYOUTS[compositionDraft.chess_variant || "classic-14"] || []).find((item) => item.row === row && item.col === col);
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
                    <div className={`daoMandalaSheet cover-${innerCover?.tone || "gold"}`} style={imageStyle(innerCover?.display_src || innerCover?.displaySrc || innerCover?.src)}>
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
                              className={`daoElementImage${src ? " hasImage" : ""}${selectedSlotId === slotId ? " selected" : ""}`}
                              onClick={() => openObjectPicker(slotId)}
                              style={imageStyle(displaySrc)}
                              type="button"
                              title={element.label}
                              aria-label={`Выбрать элемент ${element.label}`}
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

              <details className="profileLiteAdvancedJson" open={advancedOpen} onToggle={(event) => setAdvancedOpen(event.currentTarget.open)}>
                <summary>Диагностика / advanced object refs JSON</summary>
                <label>
                  Object refs JSON
                  <textarea value={objectRefText(compositionDraft.object_refs)} onChange={(event) => onCompositionObjectRefsChange(event.target.value)} rows={6} />
                </label>
              </details>
            </section>
          )}
          {workspaceTab === "power-place" && renderPowerPlaceActions()}
        </div>

        <div className="workspaceRightColumn">
          <aside className="powerCommandRail powerPlaceSettings">
            <div className="mandalaFieldLayoutSwitch powerLayoutPanel" aria-label="Расположение поля мандалы">
              <p className="cabinetEyebrow">Макет</p>
              <span>Расположение поля мандалы</span>
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

            <div className="coverSelector coverPickerPanel">
              <p className="cabinetEyebrow" aria-label="Фон места силы">Фон Места Силы</p>
              <div className="coverLayerTabs" role="tablist" aria-label="Слой фона">
                <button className={coverLayerMode === "inner" ? "active" : ""} type="button" onClick={() => setCoverLayerMode("inner")}>Фон внутри</button>
                <button className={coverLayerMode === "outer" ? "active" : ""} type="button" onClick={() => setCoverLayerMode("outer")}>Фон снаружи</button>
              </div>
              <div className="coverPreviewWrap">
                <div
                  className={`coverPreview ${visibleCover?.type === "image" ? "hasImage" : `tone-${visibleCover?.tone || "none"}`}`}
                  style={visibleCover?.type === "image" ? imageStyle(visibleCover.display_src || visibleCover.displaySrc || visibleCover.src) : undefined}
                >
                  <span>{visibleCover?.label || "Без фона"}</span>
                </div>
              </div>
              <div className="coverVariantList coverVariantsGrid" aria-label="Варианты фона" data-cover-layer-target={coverLayerSaveTarget}>
                {coverOptions.map((cover) => (
                  <button className={activeCover?.id === cover.id ? "active" : ""} key={cover.id} onClick={() => onCompositionCoverSelect(coverLayerMode, cover)} type="button">
                    {cover.label}
                  </button>
                ))}
              </div>
              <label className="coverUploadButton">
                <input type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) onCoverFileUpload(coverLayerMode, file);
                  event.target.value = "";
                }} />
                Своё изображение
              </label>
              <button className="coverPickerButton" type="button" onClick={() => openPicker("cover")}>Выбрать фото</button>
            </div>

            <div className="resourceComparisonPanel">
              <p className="cabinetEyebrow">Анализ</p>
              <div className="resourceModeToggle" aria-label="Сравнение ресурса">
                <button className={compositionDraft.resource_comparison_mode === "client_photo" ? "active" : ""} type="button" onClick={() => onCompositionDraftChange("resource_comparison_mode", "client_photo")}>Фото цели</button>
                <button className={compositionDraft.resource_comparison_mode === "photo_mandala" ? "active" : ""} type="button" onClick={() => onCompositionDraftChange("resource_comparison_mode", "photo_mandala")}>Цель + мандала</button>
              </div>
              <label className="resourceField">
                Ресурс без мандалы
                <textarea
                  className="resourceFieldInput"
                  value={compositionDraft.resource_without_mandala_comment || ""}
                  onChange={(event) => onCompositionDraftChange("resource_without_mandala_comment", event.target.value)}
                  rows={3}
                />
              </label>
              <label className="resourceField">
                Ресурс с мандалой
                <textarea
                  className="resourceFieldInput"
                  value={compositionDraft.resource_with_mandala_comment || ""}
                  onChange={(event) => onCompositionDraftChange("resource_with_mandala_comment", event.target.value)}
                  rows={3}
                />
              </label>
            </div>

            <div className="objectImageEditor">
              <p className="cabinetEyebrow">Объекты композиции</p>
              <div className="selectedObjectControl">
                <div className={selectedSlotImage ? "selectedObjectPreview hasImage" : "selectedObjectPreview"} style={imageStyle(objectRefUrls[selectedSlotImage] || selectedSlotImage)}>
                  {!selectedSlotImage && <span>◎</span>}
                </div>
                <div className="selectedObjectBody">
                  <b>{selectedSlot?.label || "Выберите позицию на мандале"}</b>
                  <small>Нажмите точку на диаграмме, затем выберите образ или загрузите файл.</small>
                  <select disabled={!selectedSlot} value={selectedSlotImage} onChange={(event) => selectedSlot && onCompositionObjectRefSelect(selectedSlot.id, event.target.value, event.target.value)}>
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
      </div>

      {pickerMode && (
        <ProfileLiteImagePicker
          mode={pickerMode}
          images={savedImages}
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
