import React, { useMemo, useState } from "react";
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
  { value: "closed", label: "Закрытая", slots: ["star-top", "star-right", "star-lower-right", "star-lower-left", "star-left"] },
  { value: "open", label: "Открытая", slots: ["star-top", "star-right", "star-lower-right", "star-lower-left", "star-left"] }
];
const CHESS_VARIANTS = [
  { value: "classic-14", label: "14 фоток", count: 14 },
  { value: "classic-8", label: "8 фоток", count: 8 },
  { value: "plus-8", label: "8 фото+", count: 8 }
];
const BUSINESS_VERTICES = [
  { id: "goal", label: "Цель" },
  { id: "function", label: "Функция / продукт" },
  { id: "structure", label: "Структура" },
  { id: "flow", label: "Поток клиентов" },
  { id: "money", label: "Деньги" },
  { id: "team", label: "Команда" }
];
const DAO_SLOTS = ["dao-water", "dao-fire", "dao-earth", "dao-metal", "dao-wood"];
const FALLBACK_COVERS = [
  { id: "no-cover", label: "Без фона", type: "none", src: "" },
  { id: "cover-gold", label: "Золотой фон", type: "placeholder", tone: "gold", src: "" },
  { id: "cover-forest", label: "Лесной фон", type: "placeholder", tone: "green", src: "" },
  { id: "cover-night", label: "Ночной фон", type: "placeholder", tone: "blue", src: "" }
];
const SOURCE_GROUPS = [
  { value: "all", label: "Все источники" },
  { value: "client-photo", label: "Фото клиентов" },
  { value: "tradition-asset", label: "Традиции" },
  { value: "material", label: "Материалы" }
];
const FIELD_LAYOUTS = [
  { value: "square", label: "Квадрат" },
  { value: "vertical", label: "Вертикальное" },
  { value: "horizontal", label: "Горизонтальное" }
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

function sourceGroupLabel(value) {
  return SOURCE_GROUPS.find((group) => group.value === value)?.label || "Все источники";
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
    const classicSlots = Array.from({ length: visibleCount }, (_, index) => ({
      id: `zodiac-${index + 1}`,
      label: `Знак ${index + 1}`
    }));
    const variant = draft.zodiac_variant || (visibleCount === 8 ? "classic-8" : visibleCount === 12 ? "classic-12" : `classic-${visibleCount}`);
    const plusSlots = variant.includes("plus")
      ? Array.from({ length: visibleCount === 12 ? 8 : 4 }, (_, index) => ({
        id: `zodiac-plus-${index + 1}`,
        label: `Доп. точка ${index + 1}`
      }))
      : [];
    return [...classicSlots, ...plusSlots];
  }
  if (type === "star") {
    return (STAR_VARIANTS.find((item) => item.value === draft.star_variant)?.slots || STAR_VARIANTS[0].slots)
      .map((id, index) => ({ id, label: `Луч ${index + 1}` }));
  }
  if (type === "chess") {
    const count = CHESS_VARIANTS.find((item) => item.value === draft.chess_variant)?.count || 14;
    return Array.from({ length: count }, (_, index) => ({ id: `chess-${index + 1}`, label: `Шахматная ячейка ${index + 1}` }));
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
  if (type === "dao") return DAO_SLOTS.map((id) => ({ id, label: id.replace("dao-", "ДАО · ") }));
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
  traditionAssets
}) {
  const [workspaceTab, setWorkspaceTab] = useState("power-place");
  const [selectedSlotId, setSelectedSlotId] = useState("");
  const [pickerMode, setPickerMode] = useState("");
  const [pickerUploadStatus, setPickerUploadStatus] = useState("idle");
  const [pickerUploadError, setPickerUploadError] = useState("");
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [coverLayerMode, setCoverLayerMode] = useState("inner");
  const [sourceGroup, setSourceGroup] = useState("all");
  const [sourceCategory, setSourceCategory] = useState("all");
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
      kind: "client-photo",
      photoId: photo.id
    })),
    ...traditionAssets.map((asset) => ({
      id: `tradition-${asset.id}`,
      label: asset.title || asset.tradition_title || "Образ традиции",
      meta: asset.tradition_title || "Мистерии",
      src: asset.image_ref || asset.image_url,
      displaySrc: asset.display_url || asset.signed_url || asset.image_url,
      kind: "tradition-asset"
    })),
    ...materials.map((item) => ({
      id: `material-${item.id}`,
      label: item.title || "Материал",
      meta: item.material_category || item.step_title || item.type || "Материалы",
      src: item.image_ref || item.image_url,
      displaySrc: item.display_url || item.image_url,
      kind: "material"
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
  const sourceCategories = useMemo(() => {
    const categories = savedImages
      .filter((item) => sourceGroup === "all" || item.kind === sourceGroup)
      .map((item) => item.meta || sourceGroupLabel(item.kind))
      .filter(Boolean);
    return ["all", ...Array.from(new Set(categories))];
  }, [savedImages, sourceGroup]);
  const filteredSavedImages = useMemo(() => savedImages.filter((item) => {
    const groupMatches = sourceGroup === "all" || item.kind === sourceGroup;
    const categoryMatches = sourceCategory === "all" || item.meta === sourceCategory;
    return groupMatches && categoryMatches;
  }), [savedImages, sourceCategory, sourceGroup]);

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

  const renderSlot = (slot, index) => {
    const src = objectRefs[slot.id] || "";
    const displaySrc = objectRefUrls[src] || src;
    const angle = (360 / Math.max(slots.length, 1)) * index - 90;
    const radius = compositionDraft.constructor_type === "chess" ? 0 : 39;
    const radians = angle * (Math.PI / 180);
    const style = compositionDraft.constructor_type === "chess"
      ? imageStyle(displaySrc)
      : {
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
          <button className="powerAddImageButton" type="button" onClick={() => setWorkspaceTab("mandalas")}>
            Добавить мандалу
          </button>
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
              <select value={sourceGroup} onChange={(event) => {
                setSourceGroup(event.target.value);
                setSourceCategory("all");
              }}>
                {SOURCE_GROUPS.map((group) => (
                  <option key={group.value} value={group.value}>{group.label}</option>
                ))}
              </select>
            </label>
            <label className="powerLibrarySelectLabel">
              Категория
              <select value={sourceCategory} onChange={(event) => setSourceCategory(event.target.value)}>
                {sourceCategories.map((category) => (
                  <option key={category} value={category}>{category === "all" ? "Все категории" : category}</option>
                ))}
              </select>
            </label>
            <div className="powerLibrarySubcategoryButtons" aria-label="Быстрые группы источников">
              {SOURCE_GROUPS.map((group) => (
                <button className={sourceGroup === group.value ? "active" : ""} key={group.value} type="button" onClick={() => {
                  setSourceGroup(group.value);
                  setSourceCategory("all");
                }}>
                  {group.label}
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
                  <div className={`powerMandala geometry-${compositionDraft.geometry || slots.length} cover-${innerCover?.tone || "gold"} constructor-${compositionDraft.constructor_type}`} style={imageStyle(innerCover?.display_src || innerCover?.displaySrc || innerCover?.src)}>
                    <button className={`powerCenterPhoto${centralImage ? " hasImage" : ""}`} style={imageStyle(centralImage)} onClick={() => openPicker("center")} title="Фото клиента / цели" type="button" aria-label="Фото клиента / цели">
                      {!centralImage && <span>Фото клиента / цели</span>}
                    </button>
                    <div className="powerMandalaBase">{slots.map(renderSlot)}</div>
                  </div>
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
        </div>

        <div className="workspaceRightColumn">
          <aside className="powerPlaceSettings">
            <div className="coverPickerPanel">
              <p className="cabinetEyebrow">Фон места силы</p>
              <div className="clientPhotoPickerModeTabs" role="tablist" aria-label="Слой фона">
                <button className={coverLayerMode === "inner" ? "active" : ""} type="button" onClick={() => setCoverLayerMode("inner")}>Фон внутри</button>
                <button className={coverLayerMode === "outer" ? "active" : ""} type="button" onClick={() => setCoverLayerMode("outer")}>Фон снаружи</button>
              </div>
              <div className="coverVariantsGrid" aria-label="Варианты фона">
                {coverOptions.map((cover) => (
                  <button className={visibleCover?.id === cover.id ? "active" : ""} key={`${coverLayerMode}-${cover.id}`} onClick={() => onCompositionCoverSelect(coverLayerMode, cover)} type="button">
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

            <div className="powerLayoutPanel">
              <p className="cabinetEyebrow">Макет</p>
              <div className="mandalaFieldLayoutButtons" role="group" aria-label="Макет поля мандалы">
                {FIELD_LAYOUTS.map((layout) => (
                  <button
                    className={(compositionDraft.field_layout || "square") === layout.value ? "active" : ""}
                    key={layout.value}
                    onClick={() => onCompositionDraftChange("field_layout", layout.value)}
                    type="button"
                  >
                    {layout.label}
                  </button>
                ))}
              </div>
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
