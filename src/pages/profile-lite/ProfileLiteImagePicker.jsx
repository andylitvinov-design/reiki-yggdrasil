import React, { useMemo, useState } from "react";
import {
  POWER_PLACE_SYMBOL_SHELVES,
  listPowerPlaceSymbolsByShelf,
  symbolShelfForConstructorType
} from "../../data/powerPlaceSymbolLibrary.js";
import {
  MATERIAL_GROUP_TABS,
  buildMaterialPayloadFromSelection,
  getMaterialCategoryOptions,
  getMaterialSubcategoryOptions,
  materialImageMatchesSelection,
  normalizeMaterialSelection
} from "./profileLiteMaterialTaxonomy.js";

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

const CLIENT_PHOTO_SUBCATEGORIES = [
  { value: "all", label: "Все" },
  { value: "client-1", label: "Клиент 1" },
  { value: "client-2", label: "Клиент 2" },
  { value: "client-3", label: "Клиент 3" },
  { value: "pro-more-clients", label: "Больше клиентов / Pro mode /", proOnly: true }
];

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
  const defaultMaterialSelection = useMemo(() => normalizeMaterialSelection("dao-ri"), []);
  const [materialGroup, setMaterialGroup] = useState(defaultMaterialSelection.group);
  const [materialCategory, setMaterialCategory] = useState(defaultMaterialSelection.categoryValue);
  const [materialSubcategory, setMaterialSubcategory] = useState(defaultMaterialSelection.subcategoryValue);
  const [materialFilterGroup, setMaterialFilterGroup] = useState(defaultMaterialSelection.group);
  const [materialFilterCategory, setMaterialFilterCategory] = useState(defaultMaterialSelection.categoryValue);
  const [materialFilterSubcategory, setMaterialFilterSubcategory] = useState(defaultMaterialSelection.subcategoryValue);
  const [localUploadStatus, setLocalUploadStatus] = useState("idle");
  const [localUploadError, setLocalUploadError] = useState("");
  const [uploadFileCount, setUploadFileCount] = useState(0);
  const currentUploadStatus = uploadStatus === "idle" ? localUploadStatus : uploadStatus;
  const currentUploadError = uploadError || localUploadError;
  const isUploading = currentUploadStatus === "loading";
  const isProAccount = accountPlan === "pro";
  const symbolImages = useMemo(() => listPowerPlaceSymbolsByShelf(symbolShelf), [symbolShelf]);
  const materialSelection = normalizeMaterialSelection(materialGroup, materialCategory, materialSubcategory);
  const materialFilterSelection = normalizeMaterialSelection(materialFilterGroup, materialFilterCategory, materialFilterSubcategory);
  const materialCategoryOptions = getMaterialCategoryOptions(materialSelection.group);
  const materialSubcategoryOptions = getMaterialSubcategoryOptions(materialSelection.group, materialSelection.categoryValue);
  const materialFilterCategoryOptions = getMaterialCategoryOptions(materialFilterSelection.group);
  const materialFilterSubcategoryOptions = getMaterialSubcategoryOptions(materialFilterSelection.group, materialFilterSelection.categoryValue);
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
        .filter((image) => materialImageMatchesSelection(image, materialFilterSelection));
    }
    if (activeTab === "symbols") return symbolImages;
    return validImages;
  }, [activeTab, clientCategory, images, materialFilterSelection, symbolImages]);
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
    const files = Array.from(event.target.files || []);
    event.target.value = "";
    if (files.length === 0) return;

    const activeUploadDestination = uploadDestination || defaultLibraryTab;
    const selectedFiles = activeUploadDestination === "materials" ? files : files.slice(0, 1);
    const file = selectedFiles[0];
    setLocalUploadStatus("loading");
    setLocalUploadError("");
    setUploadFileCount(selectedFiles.length);
    try {
      await onUpload({
        destination: activeUploadDestination,
        file,
        files: selectedFiles,
        title: activeUploadDestination === "clients" ? (uploadTitle.trim() || file.name || "") : file.name || "",
        notes: "",
        clientCategory: activeUploadDestination === "clients" ? clientCategory || "all" : undefined,
        material: buildMaterialPayloadFromSelection(materialSelection)
      });
      setLocalUploadStatus("success");
      setUploadTitle("");
      setUploadFileCount(0);
      onClose?.();
    } catch (error) {
      setLocalUploadStatus("error");
      setLocalUploadError(error?.message || "Загрузка не завершилась.");
      setUploadFileCount(0);
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
          <div className="profileLiteUploadFields profileLiteMaterialTaxonomyGrid imagePickerStructuredControls">
            <div className="profileLiteMaterialGroupField">
              <span>Группа</span>
              <div className="imagePickerMaterialGroupTabs" role="tablist" aria-label="Группа материалов">
                {MATERIAL_GROUP_TABS.map((group) => (
                  <button
                    key={group.value}
                    className={materialFilterSelection.group === group.value ? "active" : ""}
                    type="button"
                    role="tab"
                    aria-selected={materialFilterSelection.group === group.value}
                    onClick={() => {
                      const nextSelection = normalizeMaterialSelection(group.value);
                      setMaterialFilterGroup(nextSelection.group);
                      setMaterialFilterCategory(nextSelection.categoryValue);
                      setMaterialFilterSubcategory(nextSelection.subcategoryValue);
                    }}
                  >
                    {group.label}
                  </button>
                ))}
              </div>
            </div>
            <label className="profileLiteMaterialTaxonomyField">
              {materialFilterSelection.group === "god-channels" ? "Пантеон / традиция" : "Категория"}
              <select value={materialFilterSelection.categoryValue} onChange={(event) => {
                const nextSelection = normalizeMaterialSelection(materialFilterSelection.group, event.target.value, "");
                setMaterialFilterCategory(nextSelection.categoryValue);
                setMaterialFilterSubcategory(nextSelection.subcategoryValue);
              }}>
                {materialFilterCategoryOptions.map((category) => (
                  <option key={category.value} value={category.value}>{category.label}</option>
                ))}
              </select>
            </label>
            <label className="profileLiteMaterialTaxonomyField">
              {materialFilterSelection.group === "god-channels" ? "Бог / канал" : "Подкатегория"}
              <select value={materialFilterSelection.subcategoryValue} onChange={(event) => setMaterialFilterSubcategory(event.target.value)}>
                {materialFilterSubcategoryOptions.map((subcategory) => (
                  <option key={subcategory.value} value={subcategory.value}>{subcategory.label}</option>
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
              <div className="profileLiteUploadFields profileLiteUploadMaterialFields profileLiteMaterialTaxonomyGrid">
                <div className="profileLiteMaterialGroupField">
                  <span>Группа</span>
                  <div className="imagePickerMaterialGroupTabs" role="tablist" aria-label="Группа материалов">
                    {MATERIAL_GROUP_TABS.map((group) => (
                      <button
                        key={group.value}
                        className={materialSelection.group === group.value ? "active" : ""}
                        type="button"
                        role="tab"
                        aria-selected={materialSelection.group === group.value}
                        onClick={() => {
                          const nextSelection = normalizeMaterialSelection(group.value);
                          setMaterialGroup(nextSelection.group);
                          setMaterialCategory(nextSelection.categoryValue);
                          setMaterialSubcategory(nextSelection.subcategoryValue);
                        }}
                      >
                        {group.label}
                      </button>
                    ))}
                  </div>
                </div>
                <label className="profileLiteMaterialTaxonomyField">
                  {materialSelection.group === "god-channels" ? "Пантеон / традиция" : "Категория"}
                  <select value={materialSelection.categoryValue} onChange={(event) => {
                    const nextSelection = normalizeMaterialSelection(materialSelection.group, event.target.value, "");
                    setMaterialCategory(nextSelection.categoryValue);
                    setMaterialSubcategory(nextSelection.subcategoryValue);
                  }}>
                    {materialCategoryOptions.map((category) => <option key={category.value} value={category.value}>{category.label}</option>)}
                  </select>
                </label>
                <label className="profileLiteMaterialTaxonomyField">
                  {materialSelection.group === "god-channels" ? "Бог / канал" : "Подкатегория"}
                  <select value={materialSelection.subcategoryValue} onChange={(event) => setMaterialSubcategory(event.target.value)}>
                    {materialSubcategoryOptions.map((subcategory) => <option key={subcategory.value} value={subcategory.value}>{subcategory.label}</option>)}
                  </select>
                </label>
              </div>
            )}

            <label className="clientPhotoPickerUploadDirectButton profileLiteUploadFileButton">
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                multiple={uploadDestination === "materials"}
                disabled={isUploading}
                onChange={handleUpload}
              />
              {isUploading ? `Загружаю${uploadFileCount > 1 ? ` ${uploadFileCount} фото` : ""}...` : "Загрузить фото"}
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
