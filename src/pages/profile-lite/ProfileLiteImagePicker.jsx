import React, { useMemo, useState } from "react";
import { reikiLevels } from "../../data/reikiKnowledgeBase.js";
import { sourcedStepSettings } from "../../data/reikiStepSettings.js";
import {
  POWER_PLACE_SYMBOL_SHELVES,
  listPowerPlaceSymbolsByShelf,
  symbolShelfForConstructorType
} from "../../data/powerPlaceSymbolLibrary.js";

function isDisplayUrl(value) {
  return Boolean(value && (/^https?:\/\//.test(value) || value.startsWith("data:image/") || value.startsWith("/")));
}

function isStorageRef(value) {
  return typeof value === "string" && value.startsWith("storage://");
}

function imageStyle(src) {
  return isDisplayUrl(src) ? { backgroundImage: `url(${src})` } : undefined;
}

function modeTitle(mode) {
  if (mode === "library") return "Добавить фото в библиотеку";
  if (mode === "center") return "Выбрать центральное изображение";
  if (mode === "cover") return "Выбрать фон";
  return "Выбрать изображение объекта";
}

function modeEyebrow(mode) {
  if (mode === "library") return "Библиотека фото";
  if (mode === "center") return "Центр мандалы";
  if (mode === "cover") return "Фон Места Силы";
  return "Объект мандалы";
}

const materialStepOptions = reikiLevels.flatMap((level) =>
  level.steps.map((step) => ({
    id: step.id,
    title: step.title,
    levelName: level.name,
    label: `${level.id}. ${level.name} · ${level.stepLabel} ${step.number}: ${step.title}`,
    settings: sourcedStepSettings[step.id] || step.settings || []
  }))
);

const firstMaterialStep = materialStepOptions[0] || null;
const MATERIAL_GROUPS = [
  { value: "dao-ri", label: "ДАО РИ" },
  { value: "god-channels", label: "Мистерии" },
  { value: "channels", label: "Каналы" },
  { value: "form", label: "Форма" }
];
const MATERIAL_TYPES = [
  { value: "mandala", label: "Мандала" },
  { value: "artifact", label: "Артефакт" },
  { value: "practice", label: "Практика" }
];
const ALL_MATERIAL_FILTER = "all";
const ALL_MATERIAL_OPTION = { value: ALL_MATERIAL_FILTER, label: "Все" };
const CLIENT_PHOTO_SUBCATEGORIES = [
  { value: "all", label: "Все" },
  { value: "client-1", label: "Клиент 1" },
  { value: "client-2", label: "Клиент 2" },
  { value: "client-3", label: "Клиент 3" },
  { value: "pro-more-clients", label: "Больше клиентов / Pro mode /", proOnly: true }
];

function cleanText(value) {
  return String(value || "").trim();
}

function normalizeSearchText(value) {
  return cleanText(value).toLowerCase();
}

function fieldValues(...values) {
  return values
    .flatMap((value) => Array.isArray(value) ? value : [value])
    .map(cleanText)
    .filter(Boolean);
}

function normalizeMaterialImageMetadata(image) {
  const group = fieldValues(image?.materialGroup, image?.material_group, image?.group);
  const type = fieldValues(image?.materialType, image?.material_type, image?.type);
  const stepId = fieldValues(image?.stepId, image?.step_id);
  const stepTitle = fieldValues(image?.stepTitle, image?.step_title, image?.category);
  const settingTitle = fieldValues(image?.settingTitle, image?.setting_title, image?.subcategory, image?.material_subcategory);
  const legacyText = normalizeSearchText([image?.label, image?.meta].filter(Boolean).join(" "));

  return {
    group,
    type,
    stepId,
    stepTitle,
    settingTitle,
    legacyText
  };
}

function matchesMaterialField(values, selectedValue, legacyText = "", legacyLabels = []) {
  if (!selectedValue || selectedValue === ALL_MATERIAL_FILTER) return true;
  const normalizedSelected = normalizeSearchText(selectedValue);
  if (!values.length) return true;
  if (values.some((value) => normalizeSearchText(value) === normalizedSelected)) return true;
  if (legacyLabels.some((label) => legacyText.includes(normalizeSearchText(label)))) return true;
  return legacyText.includes(normalizedSelected);
}

function matchesMaterialFilter(image, filters) {
  const metadata = normalizeMaterialImageMetadata(image);
  const selectedStep = materialStepOptions.find((step) => step.id === filters.stepId);
  const selectedSetting = selectedStep?.settings?.find((setting) => setting.title === filters.settingTitle);

  return (
    matchesMaterialField(metadata.group, filters.group, metadata.legacyText, MATERIAL_GROUPS.map((group) => group.label)) &&
    matchesMaterialField(metadata.type, filters.type, metadata.legacyText, MATERIAL_TYPES.map((type) => type.label)) &&
    matchesMaterialField([...metadata.stepId, ...metadata.stepTitle], filters.stepId, metadata.legacyText, [selectedStep?.title, selectedStep?.label, selectedStep?.levelName]) &&
    matchesMaterialField(metadata.settingTitle, filters.settingTitle, metadata.legacyText, [selectedSetting?.title])
  );
}

export default function ProfileLiteImagePicker({
  accountPlan = "start",
  mode = "center",
  images = [],
  constructorType = "zodiac",
  defaultLibraryTab = "clients",
  selectedImageRef = "",
  onSelect = async () => {},
  onUpload = async () => {},
  onDelete,
  onClose,
  uploadStatus = "idle",
  uploadError = ""
}) {
  const [activeTab, setActiveTab] = useState(mode === "library" ? "upload" : "clients");
  const [uploadDestination, setUploadDestination] = useState(defaultLibraryTab === "materials" ? "materials" : "clients");
  const [uploadTitle, setUploadTitle] = useState("");
  const [clientCategory, setClientCategory] = useState("all");
  const [symbolShelf, setSymbolShelf] = useState(() => symbolShelfForConstructorType(constructorType));
  const [materialGroup, setMaterialGroup] = useState("dao-ri");
  const [materialType, setMaterialType] = useState("mandala");
  const [materialStepId, setMaterialStepId] = useState(firstMaterialStep?.id || "");
  const activeMaterialStep = materialStepOptions.find((step) => step.id === materialStepId) || firstMaterialStep;
  const [materialSettingTitle, setMaterialSettingTitle] = useState(activeMaterialStep?.settings?.[0]?.title || "");
  const activeSetting = activeMaterialStep?.settings?.find((setting) => setting.title === materialSettingTitle) || activeMaterialStep?.settings?.[0] || null;
  const [materialFilterGroup, setMaterialFilterGroup] = useState(ALL_MATERIAL_FILTER);
  const [materialFilterType, setMaterialFilterType] = useState(ALL_MATERIAL_FILTER);
  const [materialFilterStepId, setMaterialFilterStepId] = useState(ALL_MATERIAL_FILTER);
  const activeMaterialFilterStep = materialStepOptions.find((step) => step.id === materialFilterStepId) || null;
  const [materialFilterSettingTitle, setMaterialFilterSettingTitle] = useState(ALL_MATERIAL_FILTER);
  const [localUploadStatus, setLocalUploadStatus] = useState("idle");
  const [localUploadError, setLocalUploadError] = useState("");
  const currentUploadStatus = uploadStatus === "idle" ? localUploadStatus : uploadStatus;
  const currentUploadError = uploadError || localUploadError;
  const isUploading = currentUploadStatus === "loading";
  const isProAccount = accountPlan === "pro";
  const symbolImages = useMemo(() => listPowerPlaceSymbolsByShelf(symbolShelf), [symbolShelf]);
  const visibleImages = useMemo(() => {
    const validImages = images.filter((image) => image?.id || image?.src || image?.displaySrc);
    if (activeTab === "clients") {
      return validImages.filter((image) => (
        image.kind === "client-photo"
        && (clientCategory === "all" || image.clientCategory === clientCategory || image.client_category === clientCategory)
      ));
    }
    if (activeTab === "materials") {
      return validImages
        .filter((image) => image.kind === "material" || image.kind === "tradition-asset")
        .filter((image) => matchesMaterialFilter(image, {
          group: materialFilterGroup,
          type: materialFilterType,
          stepId: materialFilterStepId,
          settingTitle: materialFilterSettingTitle
        }));
    }
    if (activeTab === "symbols") return symbolImages;
    return validImages;
  }, [activeTab, clientCategory, images, materialFilterGroup, materialFilterSettingTitle, materialFilterStepId, materialFilterType, symbolImages]);
  const tabLabels = mode === "library"
    ? [{ id: "upload", label: "Загрузить своё" }]
    : [
      { id: "clients", label: "Клиенты" },
      { id: "materials", label: "Материалы" },
      { id: "symbols", label: "Символы" },
      { id: "upload", label: "Загрузить своё" }
    ];

  const handleSelect = async (image) => {
    await onSelect(image);
    onClose?.();
  };

  const handleUpload = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    const activeUploadDestination = uploadDestination || defaultLibraryTab;
    setLocalUploadStatus("loading");
    setLocalUploadError("");
    try {
      await onUpload({
        destination: activeUploadDestination,
        file,
        title: activeUploadDestination === "clients" ? (uploadTitle.trim() || file.name || "") : file.name || "",
        notes: "",
        clientCategory: activeUploadDestination === "clients" ? clientCategory || "all" : undefined,
        material: {
          group: materialGroup,
          type: materialType,
          step_id: activeMaterialStep?.id || "",
          step_title: activeMaterialStep?.title || "",
          setting_title: activeSetting?.title || "",
          setting_index: activeSetting ? activeMaterialStep.settings.indexOf(activeSetting) + 1 : null,
          category: activeMaterialStep?.levelName || "",
          subcategory: activeSetting?.title || ""
        }
      });
      setLocalUploadStatus("success");
      setUploadTitle("");
      onClose?.();
    } catch (error) {
      setLocalUploadStatus("error");
      setLocalUploadError(error?.message || "Загрузка не завершилась.");
    }
  };

  return (
    <div className="clientPhotoPickerBackdrop" onMouseDown={(event) => {
      if (event.target === event.currentTarget && !isUploading) onClose?.();
    }}>
      <section className="clientPhotoPickerModal profileLiteImagePicker" role="dialog" aria-modal="true" aria-labelledby="profileLiteImagePickerTitle">
        <div className="clientPhotoPickerHeader">
          <div>
            <p className="cabinetEyebrow">{modeEyebrow(mode)}</p>
            <h2 id="profileLiteImagePickerTitle">{modeTitle(mode)}</h2>
            <small>Сохранённые фото доступны сразу. Storage refs без signed URL показываются как placeholder.</small>
          </div>
          <button className="profileLiteImagePickerCloseButton" type="button" onClick={onClose} disabled={isUploading} aria-label="Закрыть выбор изображения">×</button>
        </div>

        <div className="clientPhotoPickerModeTabs imagePickerModeBar imagePickerSourceGroups" role="tablist" aria-label="Источник изображения">
          {tabLabels.map((tab) => (
            <button
              className={`imagePickerSourceButton${activeTab === tab.id ? " active" : ""}`}
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              role="tab"
              aria-selected={activeTab === tab.id}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === "clients" && (
          <div className="imagePickerSecondLevel" aria-label="Категории клиентов">
            {CLIENT_PHOTO_SUBCATEGORIES.map((option) => (
              <button
                key={option.value}
                className={clientCategory === option.value ? "active" : ""}
                type="button"
                disabled={option.proOnly && !isProAccount}
                onClick={() => {
                  if (option.proOnly && !isProAccount) return;
                  setClientCategory(option.value);
                }}
              >
                {option.proOnly && !isProAccount ? `${option.label} — Pro` : option.label}
              </button>
            ))}
          </div>
        )}

        {activeTab === "materials" && (
          <div className="profileLiteUploadFields imagePickerStructuredControls">
            <label>
              Группа
              <select value={materialFilterGroup} onChange={(event) => setMaterialFilterGroup(event.target.value)}>
                {[ALL_MATERIAL_OPTION, ...MATERIAL_GROUPS].map((group) => <option key={group.value} value={group.value}>{group.label}</option>)}
              </select>
            </label>
            <label>
              Тип материала
              <select value={materialFilterType} onChange={(event) => setMaterialFilterType(event.target.value)}>
                {[ALL_MATERIAL_OPTION, ...MATERIAL_TYPES].map((type) => <option key={type.value} value={type.value}>{type.label}</option>)}
              </select>
            </label>
            <label>
              Категория / ступень
              <select value={materialFilterStepId} onChange={(event) => {
                setMaterialFilterStepId(event.target.value);
                setMaterialFilterSettingTitle(ALL_MATERIAL_FILTER);
              }}>
                {[ALL_MATERIAL_OPTION, ...materialStepOptions].map((step) => <option key={step.id || step.value} value={step.id || step.value}>{step.label}</option>)}
              </select>
            </label>
            <label>
              Подкатегория
              <select value={materialFilterSettingTitle} onChange={(event) => setMaterialFilterSettingTitle(event.target.value)}>
                {[ALL_MATERIAL_OPTION, ...((activeMaterialFilterStep?.settings || []).map((setting) => ({ value: setting.title, label: setting.title })))].map((setting) => (
                  <option key={setting.value} value={setting.value}>{setting.label}</option>
                ))}
              </select>
            </label>
          </div>
        )}

        {activeTab === "symbols" && (
          <label className="imagePickerSecondLevel imagePickerSecondLevelSelect">
            Полка
            <select value={symbolShelf} onChange={(event) => setSymbolShelf(event.target.value)}>
              {POWER_PLACE_SYMBOL_SHELVES.map((shelf) => (
                <option key={shelf.value} value={shelf.value}>{shelf.label}</option>
              ))}
            </select>
          </label>
        )}

        {currentUploadError && <div className="cabinetError compactNotice">{currentUploadError}</div>}

        {activeTab === "upload" && (
          <div className="profileLiteUploadPanel">
            <div className="clientPhotoPickerModeTabs imagePickerDestinationTabs" role="tablist" aria-label="Назначение загрузки">
              <button className={uploadDestination === "clients" ? "active" : ""} type="button" onClick={() => setUploadDestination("clients")}>Клиенты</button>
              <button className={uploadDestination === "materials" ? "active" : ""} type="button" onClick={() => setUploadDestination("materials")}>Материалы</button>
            </div>

            {uploadDestination === "clients" && (
              <div className="profileLiteUploadFields profileLiteUploadClientFields">
                <label>
                  Название фото
                  <input
                    value={uploadTitle}
                    disabled={isUploading}
                    onChange={(event) => setUploadTitle(event.target.value)}
                    placeholder="Название фото"
                  />
                </label>
                <label>
                  Подкатегория
                  <select
                    value={clientCategory}
                    disabled={isUploading}
                    onChange={(event) => {
                      const nextValue = event.target.value;
                      const option = CLIENT_PHOTO_SUBCATEGORIES.find((item) => item.value === nextValue);
                      if (option?.proOnly && !isProAccount) return;
                      setClientCategory(nextValue);
                    }}
                  >
                    {CLIENT_PHOTO_SUBCATEGORIES.map((option) => (
                      <option
                        key={option.value}
                        value={option.value}
                        disabled={option.proOnly && !isProAccount}
                      >
                        {option.proOnly && !isProAccount ? `${option.label} — доступно в Pro` : option.label}
                      </option>
                    ))}
                  </select>
                </label>
                {!isProAccount && (
                  <p className="profileLiteMediaFormHint">Больше клиентов доступно в Pro.</p>
                )}
              </div>
            )}

            {uploadDestination === "materials" && (
              <div className="profileLiteUploadFields profileLiteUploadMaterialFields">
                <label>
                  Группа
                  <select value={materialGroup} onChange={(event) => setMaterialGroup(event.target.value)}>
                    {MATERIAL_GROUPS.map((group) => <option key={group.value} value={group.value}>{group.label}</option>)}
                  </select>
                </label>
                <label>
                  Тип материала
                  <select value={materialType} onChange={(event) => setMaterialType(event.target.value)}>
                    {MATERIAL_TYPES.map((type) => <option key={type.value} value={type.value}>{type.label}</option>)}
                  </select>
                </label>
                <label>
                  Категория / ступень
                  <select value={materialStepId} onChange={(event) => {
                    const nextStep = materialStepOptions.find((step) => step.id === event.target.value) || firstMaterialStep;
                    setMaterialStepId(nextStep?.id || "");
                    setMaterialSettingTitle(nextStep?.settings?.[0]?.title || "");
                  }}>
                    {materialStepOptions.map((step) => <option key={step.id} value={step.id}>{step.label}</option>)}
                  </select>
                </label>
                <label>
                  Подкатегория
                  <select value={materialSettingTitle} onChange={(event) => setMaterialSettingTitle(event.target.value)}>
                    {(activeMaterialStep?.settings || []).map((setting) => <option key={setting.title} value={setting.title}>{setting.title}</option>)}
                  </select>
                </label>
              </div>
            )}

            <label className="clientPhotoPickerUploadDirectButton profileLiteUploadFileButton">
              <input type="file" accept="image/png,image/jpeg,image/webp,image/gif" disabled={isUploading} onChange={handleUpload} />
              {isUploading ? "Загружаю..." : "Загрузить фото"}
            </label>
          </div>
        )}

        {activeTab !== "upload" && <div className="clientPhotoPickerGrid profileLiteImagePickerGrid">
          {visibleImages.map((image) => {
            const displaySrc = image.displaySrc || "";
            const selected = selectedImageRef && (selectedImageRef === image.src || selectedImageRef === image.displaySrc);
            const signingError = image.signingError || "";
            const mediaSigningError = signingError
              || (!image.src && !displaySrc ? "empty image ref"
                : !isDisplayUrl(displaySrc) && image.src && !isStorageRef(image.src) ? "invalid image url"
                : !isDisplayUrl(displaySrc) && isStorageRef(image.src) ? "signed URL не создан — проверьте Storage/RLS"
                : "");
            return (
              <article className={`clientPhotoPickerCard profileLiteImagePickerCard${selected ? " active" : ""}`} key={image.id}>
                <button className="profileLiteImagePickerSelect" type="button" onClick={() => handleSelect(image)} disabled={isUploading}>
                  <span className={isDisplayUrl(displaySrc) ? "hasImage" : "needsSignedUrl"} style={imageStyle(displaySrc)}>
                    {!isDisplayUrl(displaySrc) && <em>{mediaSigningError || "Нет preview"}</em>}
                  </span>
                  <b>{image.label || "Изображение"}</b>
                  {image.meta && <small>{image.meta}</small>}
                  {mediaSigningError && <small className="profileLiteImagePickerDiagnostic">{mediaSigningError}</small>}
                </button>
                {image.kind === "client-photo" && onDelete && (
                  <button
                    className="savedImageDeleteButton"
                    type="button"
                    title="Удалить фото"
                    aria-label="Удалить фото из базы?"
                    onClick={() => onDelete({ ...image, id: image.photoId })}
                    disabled={isUploading}
                  >
                    x
                  </button>
                )}
              </article>
            );
          })}
          {visibleImages.length === 0 && (
            <div className="clientPhotoPickerEmpty">
              <b>В этой категории пока нет сохранённых изображений.</b>
              <p>Откройте вкладку «Загрузить своё».</p>
            </div>
          )}
        </div>}
      </section>
    </div>
  );
}
