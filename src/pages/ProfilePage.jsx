import React, { useEffect, useMemo, useState } from "react";
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
  getOwnProfile,
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
  { value: "client", label: "Мандала" },
  { value: "altar", label: "Алтарь" },
  { value: "business", label: "Бизнес" },
  { value: "dao", label: "ДАО" },
  { value: "zodiac", label: "Зодиак" },
  { value: "star", label: "Звезда" }
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
const ZODIAC_VISIBLE_COUNTS = [2, 4, 6, 8, 12];
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
  { value: "client_photo", label: "Фото клиента" },
  { value: "photo_mandala", label: "Фото + мандала" }
];
const ALTAR_CENTER_RATIOS = [
  { value: "1", label: "1:1" },
  { value: "1-5", label: "1.5:1" },
  { value: "2", label: "2:1" },
  { value: "3", label: "3:1" }
];

const FALLBACK_COVER_VARIANTS = [
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
    label: "Каналы Богов",
    subcategories: mysteryTraditions.flatMap((tradition) =>
      (tradition.entities || []).map((entity) => ({
        value: `${tradition.id}-${entity.id}`,
        label: entity.title,
        traditionId: tradition.id
      }))
    )
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
  }
];

function normalizeProfile(profile, user) {
  return {
    ...EMPTY_PROFILE,
    ...(profile || {}),
    user_id: profile?.user_id || user?.id || ""
  };
}

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

function isStorageImageRef(value) {
  return Boolean(value && value.startsWith("storage://"));
}

function uniqueImageSources(items) {
  const seen = new Set();

  return items.filter((item) => {
    const identity = item?.src || item?.displaySrc;
    const displaySrc = item?.displaySrc || item?.src;
    if ((!isImagePreview(displaySrc) && !isStorageImageRef(identity)) || seen.has(identity)) return false;
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
    isGuardian ? "guardian" : ""
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

function getInitialStoredSession() {
  const storedSession = getStoredSession();
  if (isStoredSessionExpired(storedSession)) {
    clearStoredSession();
    return null;
  }
  return storedSession;
}

export default function ProfilePage({ onNavigateHome, onNavigateMasters }) {
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
  const [loading, setLoading] = useState(Boolean(supabaseEnv.isConfigured));
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [fileNotice, setFileNotice] = useState("");
  const [powerSourceCount, setPowerSourceCount] = useState(4);
  const [constructorType, setConstructorType] = useState("client");
  const [zodiacVisibleCount, setZodiacVisibleCount] = useState(12);
  const [starVariant, setStarVariant] = useState("closed");
  const [businessVertexZoneCount, setBusinessVertexZoneCount] = useState(1);
  const [altarCenterRatio, setAltarCenterRatio] = useState("1");
  const [objectImages, setObjectImages] = useState({});
  const [objectImageUrls, setObjectImageUrls] = useState({});
  const [selectedCoverId, setSelectedCoverId] = useState(FALLBACK_COVER_VARIANTS[0].id);
  const [customCoverImage, setCustomCoverImage] = useState("");
  const [coverNotice, setCoverNotice] = useState("");
  const [selectedCentralPhotoId, setSelectedCentralPhotoId] = useState("");
  const [isClientPhotoPickerOpen, setClientPhotoPickerOpen] = useState(false);
  const [selectedTraditionId, setSelectedTraditionId] = useState(mysteryTraditions[0]?.id || "");
  const [compositionTitle, setCompositionTitle] = useState("");
  const [selectedCompositionId, setSelectedCompositionId] = useState("");
  const [resourceComparisonMode, setResourceComparisonMode] = useState("client_photo");
  const [resourceWithoutMandalaComment, setResourceWithoutMandalaComment] = useState("");
  const [resourceWithMandalaComment, setResourceWithMandalaComment] = useState("");
  const [activeTopTab, setActiveTopTab] = useState("mandalas");
  const [activeMaterialCategory, setActiveMaterialCategory] = useState(MATERIAL_CATEGORY_TABS[0].value);
  const [activeMaterialSubcategory, setActiveMaterialSubcategory] = useState(MATERIAL_CATEGORY_TABS[0].subcategories[0]?.value || "");
  const [selectedObjectSlotId, setSelectedObjectSlotId] = useState("");
  const [materialFilter, setMaterialFilter] = useState("all");
  const [mediaStatus, setMediaStatus] = useState("");
  const [mediaUploadTarget, setMediaUploadTarget] = useState("");

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

    return nextMaterials;
  }, [activeMaterialCategory, activeMaterialSubcategoryData, materialFilter, materials]);

  const accountPlan = normalizeAccountPlan(profile.account_plan);
  const planLimits = getPlanLimits(accountPlan);
  const selectedTradition = useMemo(
    () => mysteryTraditions.find((item) => item.id === selectedTraditionId) || mysteryTraditions[0] || null,
    [selectedTraditionId]
  );
  const selectedCentralPhoto = useMemo(
    () => clientGoalPhotos.find((item) => item.id === selectedCentralPhotoId) || null,
    [clientGoalPhotos, selectedCentralPhotoId]
  );

  const displayImageUrl = (value) => objectImageUrls[value] || value;

  const imageStyleFor = (value) => imageStyle(displayImageUrl(value));

  const displayMaterialImageUrl = (value) => {
    const material = materials.find((item) => item.image_url === value);
    return material?.display_url || value;
  };

  const materialPreviewUrl = materialFilePreview || displayMaterialImageUrl(materialForm.image_url);

  const materialImageStyle = (value) => imageStyle(displayMaterialImageUrl(value));

  const reusableImages = useMemo(() => uniqueImageSources([
    ...clientGoalPhotos.map((item) => ({
      id: `client-${item.id}`,
      label: item.title || "Фото клиента / цели",
      src: item.image_ref || item.image_url,
      displaySrc: item.display_url || item.image_url
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
    ...reusableImages.map((item) => ({ ...item, type: "image" })),
    ...(customCoverImage ? [{ id: "custom-cover", label: "Своё изображение", src: customCoverImage, displaySrc: displayImageUrl(customCoverImage), type: "image" }] : []),
    ...FALLBACK_COVER_VARIANTS.map((item) => ({ ...item, type: "placeholder" }))
  ], [customCoverImage, objectImageUrls, reusableImages]);

  const selectedCover = useMemo(
    () => coverVariants.find((item) => item.id === selectedCoverId) || coverVariants[0],
    [coverVariants, selectedCoverId]
  );
  const selectedCoverClass = selectedCover?.type === "image" ? "cover-image" : `cover-${selectedCover?.tone || "gold"}`;
  const selectedCoverStyle = selectedCover?.type === "image" && selectedCover.src
    ? { "--power-cover-image": `url(${displayImageUrl(selectedCover.src)})` }
    : undefined;

  const centerImage = isImagePreview(selectedCentralPhoto?.display_url || selectedCentralPhoto?.image_url)
    ? selectedCentralPhoto.display_url || selectedCentralPhoto.image_url
    : "";

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
      label: "Каналы Богов",
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
      id: "covers",
      label: "Подложка места силы",
      count: coverVariants.length,
      items: coverVariants.map((cover) => ({
        id: cover.id,
        title: cover.label,
        meta: cover.type === "image" ? "изображение" : "фон"
      }))
    },
    {
      id: "client-goals",
      label: "Фото клиентов / целей",
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
      source: "Фото клиентов / целей",
      status: photo.notes || "",
      src: photo.image_ref || photo.image_url,
      displaySrc: photo.display_url || photo.image_url,
      kind: "client-photo",
      photoId: photo.id
    })),
    ...traditionAssets.map((asset) => ({
      id: `tradition-asset-${asset.id}`,
      title: asset.title || selectedTradition?.title || "Образ традиции",
      label: asset.title || selectedTradition?.title || "Образ традиции",
      source: "Каналы Богов",
      status: asset.tradition_title || selectedTradition?.title || "",
      src: asset.image_ref || asset.image_url,
      displaySrc: asset.display_url || asset.image_url,
      kind: "tradition-asset"
    })),
    ...materials.map((item, index) => ({
      id: `material-image-${item.id || index}`,
      title: item.title || `Материал ${index + 1}`,
      label: item.title || `Материал ${index + 1}`,
      source: publicationTypeLabel(item.type),
      status: materialStatusText(item.status),
      src: item.image_url,
      kind: "material"
    })),
    ...coverVariants.filter((cover) => cover.type === "image").map((cover) => ({
      id: `cover-${cover.id}`,
      title: cover.label || "Подложка",
      label: cover.label || "Подложка",
      source: "Подложка места силы",
      status: "фон",
      src: cover.src,
      displaySrc: cover.displaySrc || cover.src,
      kind: "cover"
    }))
  ]), [clientGoalPhotos, coverVariants, materials, selectedTradition?.title, traditionAssets]);

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
      return ZODIAC_SIGNS.slice(0, zodiacVisibleCount).map((sign, index) => ({
        id: `zodiac-${index + 1}`,
        label: sign.label
      }));
    }

    if (constructorType === "star") {
      return STAR_POINTS.map((point, index) => ({
        id: `star-${index + 1}`,
        label: point.label
      }));
    }

    return Array.from({ length: powerSourceCount }, (_, index) => ({
      id: `source-${index + 1}`,
      label: sourceLabel(powerSourceCount, index)
    }));
  }, [businessVertexZoneCount, constructorType, powerSourceCount, zodiacVisibleCount]);

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
    const nextSession = storeSessionFromUrlHash();
    setSession(nextSession);
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
    let cancelled = false;

    async function load() {
      if (!supabaseEnv.isConfigured) {
        setLoading(false);
        return;
      }

      if (!session?.access_token) {
        setLoading(false);
        return;
      }

      if (isStoredSessionExpired(session)) {
        clearStoredSession();
        setSession(null);
        setUser(null);
        setProfile(EMPTY_PROFILE);
        setMaterials([]);
        setClientGoalPhotos([]);
        setTraditionAssets([]);
        setPowerPlaceCompositions([]);
        setMaterialFile(null);
        setMaterialFilePreview("");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError("");

      try {
        const currentUser = await getCurrentUser(session);
        const currentProfile = await getOwnProfile(currentUser.id, session);

        if (!cancelled) {
          setUser(currentUser);
          setProfile(normalizeProfile(currentProfile, currentUser));
        }
      } catch (err) {
        if (isExpiredOrInvalidAuthError(err)) {
          clearStoredSession();
          if (!cancelled) {
            setSession(null);
            setUser(null);
            setProfile(EMPTY_PROFILE);
            setMaterials([]);
            setClientGoalPhotos([]);
            setTraditionAssets([]);
            setPowerPlaceCompositions([]);
            setMaterialFile(null);
            setMaterialFilePreview("");
            setError("");
          }
          return;
        }

        if (!cancelled) setError(err.message || "Не удалось загрузить профиль.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [session]);

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
        if (!cancelled) setError(err.message || "Не удалось загрузить мандалы и материалы.");
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
        const [photos, compositions] = await Promise.all([
          listClientGoalPhotos(profile.id, session),
          listPowerPlaceCompositions(profile.id, session)
        ]);

        if (!cancelled) {
          setClientGoalPhotos(photos || []);
          setPowerPlaceCompositions(compositions || []);
          setSelectedCentralPhotoId((current) => current || photos?.[0]?.id || "");
        }
      } catch (err) {
        if (!cancelled) setError(err.message || "Не удалось загрузить места силы.");
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
        if (!cancelled) setError(err.message || "Не удалось загрузить образы традиции.");
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
    if (!selectedCover) return null;

    return normalizeCoverRef({
      id: selectedCover.id,
      label: selectedCover.label,
      type: selectedCover.type,
      tone: selectedCover.tone || "",
      src: selectedCover.src || ""
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
    cover_ref: buildCoverRef(),
    object_refs: persistableObjectRefs(objectImages, activeObjectSlots.map((slot) => slot.id)),
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
    setZodiacVisibleCount(ZODIAC_VISIBLE_COUNTS.includes(Number(composition.zodiac_visible_count)) ? Number(composition.zodiac_visible_count) : 12);
    setBusinessVertexZoneCount(Number(composition.business_vertex_zone_count) === 3 ? 3 : 1);
    setStarVariant(STAR_VARIANTS.some((item) => item.value === composition.star_variant) ? composition.star_variant : "closed");
    setAltarCenterRatio(composition.altar_center_ratio || "1");
    setObjectImages(composition.object_refs || {});
    setObjectImageUrls((current) => ({ ...current, ...(composition.object_ref_urls || {}) }));
    setSelectedCentralPhotoId(composition.central_photo_id || "");
    setSelectedTraditionId(composition.tradition_id || mysteryTraditions[0]?.id || "");
    setResourceComparisonMode(composition.resource_comparison_mode || "client_photo");
    setResourceWithoutMandalaComment(composition.resource_without_mandala_comment || "");
    setResourceWithMandalaComment(composition.resource_with_mandala_comment || "");

    if (composition.cover_ref?.id) {
      const savedCover = normalizeCoverRef(composition.cover_ref);
      const savedCoverExists = coverVariants.some((cover) => cover.id === savedCover?.id);
      if (savedCover?.src && composition.cover_ref?.display_src) {
        setObjectImageUrls((current) => ({ ...current, [savedCover.src]: composition.cover_ref.display_src }));
      }

      if (savedCover?.id === "custom-cover" && savedCover.src) {
        setCustomCoverImage(savedCover.src);
        setSelectedCoverId("custom-cover");
      } else if (savedCoverExists) {
        setSelectedCoverId(savedCover.id);
      } else if (savedCover?.type === "image" && isImagePreview(savedCover.src)) {
        setCustomCoverImage(savedCover.src);
        setSelectedCoverId("custom-cover");
      } else {
        setSelectedCoverId(FALLBACK_COVER_VARIANTS[0].id);
      }
    } else {
      setSelectedCoverId(FALLBACK_COVER_VARIANTS[0].id);
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
      setCustomCoverImage(uploaded.ref);
      setSelectedCoverId("custom-cover");
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
    if (item.kind === "client-photo" && item.photoId) {
      setSelectedCentralPhotoId(item.photoId);
    }

    if (selectedObjectSlot && item.src) {
      setObjectImage(selectedObjectSlot.id, item.src, item.displaySrc || item.src);
    }
  };

  const handleObjectSelect = (slotId, value) => {
    const option = objectImageOptions.find((item) => item.src === value);
    setObjectImage(slotId, value, option?.displaySrc || value);
  };

  const openObjectSlot = (slotId) => {
    setSelectedObjectSlotId(slotId);
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
      signInWithGoogle();
    } catch (err) {
      setError(err.message || "Не удалось начать вход через Google.");
    }
  };

  const handleMaterialCategorySelect = (categoryValue) => {
    setActiveMaterialCategory(categoryValue);
    const category = MATERIAL_CATEGORY_TABS.find((item) => item.value === categoryValue) || MATERIAL_CATEGORY_TABS[0];
    const firstSubcategory = category.subcategories[0];
    setActiveMaterialSubcategory(firstSubcategory?.value || "");

    if (categoryValue === "artifacts" || categoryValue === "talismans") {
      updateMaterialField("type", "artifact");
    } else if (categoryValue === "dao-ri" || categoryValue === "god-channels") {
      updateMaterialField("type", "mandala");
    }

    if (categoryValue === "dao-ri" && firstSubcategory?.steps?.[0]?.id) {
      updateMaterialField("step_id", firstSubcategory.steps[0].id);
    }
  };

  const handleMaterialSubcategorySelect = (subcategory) => {
    setActiveMaterialSubcategory(subcategory.value);
    if (activeMaterialCategory === "dao-ri" && subcategory.steps?.[0]?.id) {
      updateMaterialField("step_id", subcategory.steps[0].id);
    }
  };

  const handleDaoStepSelect = (stepId) => {
    updateMaterialField("step_id", stepId);
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

  const handleClientPhotoSave = async ({ selectSaved = false, closePicker = false } = {}) => {
    setMessage("");
    setError("");
    setMediaStatus("");

    if (!profile?.id) {
      setError("Сначала сохраните профиль мастера.");
      return;
    }

    try {
      let mediaPayload = {};
      if (clientPhotoForm.file) {
        setMediaUploadTarget("client-goal");
        setMediaStatus("Загружаю фото клиента / цели...");
        const uploaded = await uploadProfileMedia(clientPhotoForm.file, { profileId: profile.id, kind: "client-goal" }, session);
        mediaPayload = {
          image_bucket: uploaded.bucket,
          image_path: uploaded.path,
          mime_type: uploaded.metadata.mimeType,
          file_size_bytes: uploaded.metadata.size
        };
      }

      const saved = await createClientGoalPhoto({
        ...clientPhotoForm,
        ...mediaPayload,
        profile_id: profile.id,
        file: undefined
      }, accountPlan, session);
      setClientGoalPhotos((current) => [saved, ...current].filter(Boolean));
      setSelectedCentralPhotoId((current) => (selectSaved ? saved?.id || "" : current || saved?.id || ""));
      setClientPhotoForm({ title: "", image_url: "", notes: "", file: null });
      if (closePicker) setClientPhotoPickerOpen(false);
      setMediaStatus("Фото загружено и сохранено.");
      setMessage(selectSaved ? "Фото клиента / цели сохранено и выбрано в центр." : "Фото клиента / цели сохранено.");
      return saved;
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

  const openClientPhotoPicker = () => {
    setClientPhotoPickerOpen(true);
  };

  const chooseCentralPhoto = (photoId) => {
    setSelectedCentralPhotoId(photoId);
    setClientPhotoPickerOpen(false);
  };

  const renderCenterPhotoButton = (className) => (
    <button
      className={className + (centerImage ? " hasImage" : "")}
      style={imageStyle(centerImage)}
      onClick={openClientPhotoPicker}
      title="Выбрать фото клиента"
      type="button"
      aria-label="Выбрать фото клиента в центр мандалы"
    >
      {!centerImage && <span>◎</span>}
    </button>
  );

  const handleCompositionSave = async () => {
    setMessage("");
    setError("");

    if (!profile?.id) {
      setError("Сначала сохраните профиль мастера.");
      return;
    }

    if (!selectedCentralPhotoId) {
      setError("Выберите центральное фото из раздела «Фото клиентов / целей».");
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
    } catch (err) {
      setError(err.message || "Не удалось сохранить место силы.");
    }
  };

  const handleLogout = () => {
    clearStoredSession();
    setSession(null);
    setUser(null);
    setProfile(EMPTY_PROFILE);
    setMaterials([]);
    setClientGoalPhotos([]);
    setTraditionAssets([]);
    setPowerPlaceCompositions([]);
    setMaterialForm(EMPTY_MATERIAL);
    setClientPhotoForm({ title: "", image_url: "", notes: "", file: null });
    setTraditionAssetForm({ title: "", image_url: "", notes: "", file: null });
    setObjectImages({});
    setObjectImageUrls({});
    setMaterialFile(null);
    setMaterialFilePreview("");
    setSelectedCentralPhotoId("");
    setSelectedCompositionId("");
    setCompositionTitle("");
    setActiveTopTab("mandalas");
    setActiveMaterialCategory(MATERIAL_CATEGORY_TABS[0].value);
    setActiveMaterialSubcategory(MATERIAL_CATEGORY_TABS[0].subcategories[0]?.value || "");
    setSelectedObjectSlotId("");
    setMaterialFilter("all");
    setFileNotice("");
    setMediaStatus("");
    setMediaUploadTarget("");
    setMessage("Вы вышли из кабинета.");
  };

  if (!supabaseEnv.isConfigured) {
    return (
      <CabinetShell title="Кабинет мастера" onNavigateHome={onNavigateHome} onNavigateMasters={onNavigateMasters}>
        <div className="cabinetNotice">
          <b>Кабинет мастера подготовлен, но Supabase ещё не подключён.</b>
          <p>Нужно настроить env names в Vercel: VITE_SUPABASE_URL и VITE_SUPABASE_ANON_KEY. Значения не должны храниться в repo.</p>
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

  return (
    <CabinetShell title="Кабинет мастера" onNavigateHome={onNavigateHome} onNavigateMasters={onNavigateMasters}>
      {loading && !user && <div className="cabinetNotice">Загружаю кабинет...</div>}

      {!loading && !user && (
        <form className="cabinetCard authCard" onSubmit={handleMagicLink}>
          <p className="cabinetEyebrow">Вход мастера</p>
          <h2>Войдите, чтобы создать профиль мастера</h2>
          <p>Войдите через Google или используйте email-ссылку. После входа можно заполнить профиль и отправить его на модерацию.</p>
          {error && <div className="cabinetError">{error}</div>}
          {message && <div className="cabinetSuccess">{message}</div>}
          <button className="cabinetGoogle" type="button" onClick={handleGoogleLogin}>Войти через Google</button>
          <div className="authDivider">или войдите по email</div>
          <label>
            Email
            <input value={email} onChange={(event) => setEmail(event.target.value)} type="email" required placeholder="you@example.com" />
          </label>
          <button className="cabinetPrimary" type="submit">Отправить ссылку для входа</button>
        </form>
      )}

      {!loading && user && (
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
                <button className={activeTopTab === "mandalas" ? "active" : ""} type="button" onClick={() => setActiveTopTab("mandalas")}>Мои мандалы</button>
                <button className={activeTopTab === "power-place" ? "active" : ""} type="button" onClick={() => setActiveTopTab("power-place")}>Место силы</button>
                <button className={activeTopTab === "chats" ? "active" : ""} type="button" onClick={() => setActiveTopTab("chats")}>Чаты</button>
                <button className={activeTopTab === "profile" ? "active" : ""} type="button" onClick={() => setActiveTopTab("profile")}>Профиль</button>
              </div>
            </div>

            {loading && <div className="cabinetNotice">Загружаю кабинет...</div>}
            {error && <div className="cabinetError">{error}</div>}
            {message && <div className="cabinetSuccess">{message}</div>}

            <div className="workspaceMainColumns">
            <aside className="mandalaModeSidebar">
              {activeTopTab === "mandalas" ? (
                <>
                  <p className="cabinetEyebrow">Браузер материалов</p>
                  <h3>Фильтр мастерской</h3>
                  <div className="materialFilterList" aria-label="Фильтр материалов">
                    {MATERIAL_FILTERS.map((filter) => (
                      <button
                        className={materialFilter === filter.value ? "active" : ""}
                        key={filter.value}
                        onClick={() => setMaterialFilter(filter.value)}
                        type="button"
                      >
                        <span>{filter.label}</span>
                        <b>{filter.value === "all" ? materials.length : materials.filter((item) => item.type === filter.value || item.status === filter.value).length}</b>
                      </button>
                    ))}
                  </div>
                  <div className="materialMiniList">
                    {filteredMaterials.slice(0, 6).map((item) => (
                      <button key={item.id} type="button">
                        <span className={item.image_url ? "hasImage" : ""} style={materialImageStyle(item.image_url)}>◎</span>
                        <b>{item.title || "Материал без названия"}</b>
                        <small>{[item.step_id, item.setting_title || materialStatusText(item.status)].filter(Boolean).join(" · ")}</small>
                      </button>
                    ))}
                    {filteredMaterials.length === 0 && <p>Материалы этого типа появятся здесь после сохранения.</p>}
                  </div>
                </>
              ) : activeTopTab === "power-place" ? (
                <>
                  <p className="cabinetEyebrow">Место силы</p>
                  <h3>Библиотека образов</h3>
                  <div className="powerLibrarySidebar" aria-label="Навигация и сохранённые образы места силы">
                    <div className="powerLibraryGroups">
                      {powerLibraryGroups.map((group, index) => (
                        <details key={group.id} open={index < 2}>
                          <summary>
                            <span>{group.label}</span>
                            <b>{group.count}</b>
                          </summary>
                          <div className="powerLibraryGroupList">
                            {group.items.slice(0, 14).map((item) => (
                              <button key={item.id} type="button">
                                <span>{item.title}</span>
                                {item.meta && <small>{item.meta}</small>}
                              </button>
                            ))}
                            {group.items.length > 14 && <small>Ещё {group.items.length - 14} элементов внутри раздела.</small>}
                            {group.items.length === 0 && <p>{group.emptyText || "Список пока пуст."}</p>}
                          </div>
                        </details>
                      ))}
                    </div>
                    <div className="powerSavedImageList" aria-label="Сохранённые изображения">
                      <div className="powerSavedImageHeader">
                        <b>Сохранённые изображения</b>
                        <small>{selectedObjectSlot ? `Позиция: ${selectedObjectSlot.label}` : "Выберите позицию на схеме"}</small>
                      </div>
                      {savedPowerImages.map((item) => (
                        <button key={item.id} type="button" onClick={() => handleLibraryImageSelect(item)}>
                          <span className="powerSavedImageThumb" style={imageStyle(displayImageUrl(item.displaySrc || item.src))} />
                          <b>{item.title}</b>
                          <small>{[item.source, item.status].filter(Boolean).join(" · ")}</small>
                        </button>
                      ))}
                      {savedPowerImages.length === 0 && <p>Сохранённые фото, подложки и материалы появятся здесь после загрузки.</p>}
                    </div>
                  </div>
                  <div className="quickPhotoGrid">
                    {[
                      ["Места", powerPlaceCompositions.length],
                      ["Фото", clientGoalPhotos.length],
                      ["Образы", traditionAssets.length],
                      ["План", normalizeAccountPlan(profile.account_plan).toUpperCase()]
                    ].map(([label, value]) => (
                      <span key={label}><i />{label}<small>{value}</small></span>
                    ))}
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
            <section className="materialCategoryNav" aria-label="Категории материалов">
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
              {activeMaterialCategoryData.subcategories.length > 0 && (
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
              )}
              {activeMaterialCategory === "dao-ri" && activeMaterialSubcategoryData?.steps?.length > 0 && (
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

            <section className="powerLibraryGrid">
              <div className="powerLibraryCard">
                <div className="cabinetFormHeader">
                  <div>
                    <p className="cabinetEyebrow">Фото клиентов / целей</p>
                    <h2>Центр места силы</h2>
                  </div>
                  <span className="cabinetStatus">{clientGoalPhotos.length}/{planLimits.clientPhotos}</span>
                </div>
                <div className="powerInlineForm">
                  <input value={clientPhotoForm.title} onChange={(event) => setClientPhotoForm((current) => ({ ...current, title: event.target.value }))} placeholder="Название фото" />
                  <label className="mediaUploadButton">
                    <input type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={handleClientPhotoFile} />
                    {clientPhotoForm.file ? clientPhotoForm.file.name : "Файл JPG/PNG/WEBP/GIF"}
                  </label>
                  <input value={clientPhotoForm.image_url} onChange={(event) => setClientPhotoForm((current) => ({ ...current, image_url: event.target.value }))} placeholder="URL фото клиента / цели (опционально)" />
                  <input value={clientPhotoForm.notes} onChange={(event) => setClientPhotoForm((current) => ({ ...current, notes: event.target.value }))} placeholder="Заметка" />
                  <button className="cabinetSecondary" type="button" disabled={!profile?.id || clientGoalPhotos.length >= planLimits.clientPhotos || mediaUploadTarget === "client-goal"} onClick={handleClientPhotoSave}>
                    {mediaUploadTarget === "client-goal" ? "Загружаю..." : "Сохранить фото"}
                  </button>
                </div>
                {mediaStatus && <p className="mediaUploadNotice">{mediaStatus}</p>}
                <p className="powerPlanNote">Файлы сохраняются в private Supabase Storage; URL поле оставлено для старых внешних ссылок.</p>
                <div className="clientPhotoStrip">
                  {clientGoalPhotos.map((photo) => (
                    <button
                      className={selectedCentralPhotoId === photo.id ? "active" : ""}
                      key={photo.id}
                      onClick={() => setSelectedCentralPhotoId(photo.id)}
                      type="button"
                    >
                      <span style={imageStyle(photo.display_url || photo.image_url)} />
                      <b>{photo.title || "Фото цели"}</b>
                    </button>
                  ))}
                  {clientGoalPhotos.length === 0 && <p>Добавьте фото клиента или цели, чтобы выбрать центр мандалы или алтаря.</p>}
                </div>
              </div>

              <div className="powerLibraryCard">
                <div className="cabinetFormHeader">
                  <div>
                    <p className="cabinetEyebrow">Мистерии</p>
                    <h2>Традиция алтаря</h2>
                  </div>
                  <span className="cabinetStatus">{traditionAssets.length}</span>
                </div>
                <label>
                  Традиция
                  <select value={selectedTraditionId} onChange={(event) => setSelectedTraditionId(event.target.value)}>
                    {mysteryTraditions.map((tradition) => (
                      <option key={tradition.id} value={tradition.id}>{tradition.title}</option>
                    ))}
                  </select>
                </label>
                <div className="powerInlineForm">
                  <input value={traditionAssetForm.title} onChange={(event) => setTraditionAssetForm((current) => ({ ...current, title: event.target.value }))} placeholder="Название образа" />
                  <label className="mediaUploadButton">
                    <input type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={handleTraditionAssetFile} />
                    {traditionAssetForm.file ? traditionAssetForm.file.name : "Файл традиции"}
                  </label>
                  <input value={traditionAssetForm.image_url} onChange={(event) => setTraditionAssetForm((current) => ({ ...current, image_url: event.target.value }))} placeholder="URL изображения традиции (опционально)" />
                  <input value={traditionAssetForm.notes} onChange={(event) => setTraditionAssetForm((current) => ({ ...current, notes: event.target.value }))} placeholder="Заметка" />
                  <button className="cabinetSecondary" type="button" disabled={!profile?.id || !selectedTradition || mediaUploadTarget === "tradition"} onClick={handleTraditionAssetSave}>
                    {mediaUploadTarget === "tradition" ? "Загружаю..." : "Сохранить образ"}
                  </button>
                </div>
                <p className="powerPlanNote">IA: Личный кабинет → Мистерии → {selectedTradition?.title || "традиция"}. Образы доступны только владельцу профиля.</p>
                <div className="traditionAssetStrip">
                  {traditionAssets.map((asset) => (
                    <span key={asset.id}>
                      <i style={imageStyle(asset.display_url || asset.image_url)} />
                      <b>{asset.title || selectedTradition?.title}</b>
                    </span>
                  ))}
                  {traditionAssets.length === 0 && <p>Сохранённые образы выбранной традиции появятся в селекторах объектов алтаря.</p>}
                </div>
              </div>
            </section>

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
                  <input
                    className="compositionTitleInput"
                    value={compositionTitle}
                    onChange={(event) => setCompositionTitle(event.target.value)}
                    placeholder="Название места силы"
                  />
                  <select value={selectedCentralPhotoId} onChange={(event) => setSelectedCentralPhotoId(event.target.value)}>
                    <option value="">Центральное фото из раздела клиентов</option>
                    {clientGoalPhotos.map((photo) => (
                      <option key={photo.id} value={photo.id}>{photo.title || "Фото клиента / цели"}</option>
                    ))}
                  </select>
                  <div className="constructorTypeSelector" aria-label="Тип конструктора">
                    {CONSTRUCTOR_TYPES.map((type) => (
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
                      {ZODIAC_VISIBLE_COUNTS.map((count) => (
                        <button
                          className={zodiacVisibleCount === count ? "active" : ""}
                          key={count}
                          onClick={() => setZodiacVisibleCount(count)}
                          type="button"
                        >
                          {count}
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
                  {powerPlaceCompositions.length > 0 && (
                    <select value={selectedCompositionId} onChange={(event) => {
                      const composition = powerPlaceCompositions.find((item) => item.id === event.target.value);
                      if (composition) applyComposition(composition);
                    }}>
                      <option value="">Загрузить сохранённое место силы</option>
                      {powerPlaceCompositions.map((composition) => (
                        <option key={composition.id} value={composition.id}>{composition.title || "Место силы"}</option>
                      ))}
                    </select>
                  )}
                </div>
              </div>

              <div className="powerPlacePrintArea">
                <div className="powerMandalaPanel">
                  <div className="powerPrintMeta">
                    <p className="cabinetEyebrow">Формат</p>
                    <h3>{constructorTypeLabel(constructorType)}</h3>
                  </div>
                  {constructorType === "client" ? (
                    <div className={`powerMandala geometry-${powerSourceCount} ${selectedCoverClass}`} style={selectedCoverStyle}>
                      {renderCenterPhotoButton("powerCenterPhoto")}
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
                            style={imageStyleFor(sourceImage)}
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
                      {renderCenterPhotoButton("altarCenterPhoto")}
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
                      {renderCenterPhotoButton("businessCenterPhoto")}
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
                    <div className={`zodiacMandalaSheet zodiac-${zodiacVisibleCount} ${selectedCoverClass}`} style={selectedCoverStyle}>
                      {renderCenterPhotoButton("zodiacCenterPhoto")}
                      <div className="zodiacClockFace" aria-hidden="true">
                        <span>ЗОДИАК</span>
                      </div>
                      {ZODIAC_SIGNS.slice(0, zodiacVisibleCount).map((sign, index) => {
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
                  ) : constructorType === "star" ? (
                    <div className={`starMandalaSheet star-${starVariant} ${selectedCoverClass}`} style={selectedCoverStyle}>
                      {renderCenterPhotoButton("starCenterPhoto")}
                      <div className="starGuide" aria-hidden="true">
                        <span className="starRay rayTop" />
                        <span className="starRay rayRight" />
                        <span className="starRay rayLowerRight" />
                        <span className="starRay rayLowerLeft" />
                        <span className="starRay rayLeft" />
                        <span className="starOpenLine starOpenRight" />
                        <span className="starOpenLine starOpenLowerLeft" />
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
                  ) : (
                    <div className={`daoMandalaSheet ${selectedCoverClass}`} style={selectedCoverStyle}>
                      {renderCenterPhotoButton("daoCenterPhoto")}
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
                      ? "Центр использует только фото из раздела «Фото клиентов / целей». В раскладе 12 добавлены четыре внешних хранителя пространства."
                      : constructorType === "altar"
                        ? "Алтарь ставит выбранное фото цели ниже центра, а объекты берёт из образов выбранной традиции."
                        : constructorType === "business"
                          ? "Бизнес-мандала собирает цель, функцию и структуру в треугольник с единым числом зон на каждой вершине."
                          : constructorType === "zodiac"
                            ? "Зодиак ставит фото клиента или цели в центр и раскладывает до 12 образов по часовому кругу."
                            : constructorType === "star"
                              ? "Звезда собирает пять ключевых образов вокруг центра; открытый вариант продолжает правый и нижний левый лучи как линии движения."
                              : "ДАО-формат держит центр цели внутри круга У-син и пять образов элементов вокруг него."}
                  </p>
                  <div className="resourcePrintNotes">
                    <p><b>Сравнение ресурса:</b> {RESOURCE_COMPARISON_MODES.find((item) => item.value === resourceComparisonMode)?.label || "Фото клиента"}</p>
                    <p><b>Ресурс без мандалы:</b> {resourceWithoutMandalaComment || "—"}</p>
                    <p><b>Ресурс с мандалой:</b> {resourceWithMandalaComment || "—"}</p>
                  </div>
                </div>

                <aside className="powerCommandRail">
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

                  <div className="coverSelector">
                    <p className="cabinetEyebrow">Подложка места силы</p>
                    <div className="coverPreviewWrap">
                      <div
                        className={`coverPreview ${selectedCover?.type === "image" ? "hasImage" : `tone-${selectedCover?.tone || "gold"}`}`}
                        style={selectedCover?.type === "image" ? { backgroundImage: `url(${displayImageUrl(selectedCover.src)})` } : undefined}
                      >
                        <span>{selectedCover?.label || "Заставка"}</span>
                      </div>
                    </div>
                    <div className="coverVariantList" aria-label="Варианты заставки">
                      {coverVariants.map((cover) => (
                        <button
                          className={selectedCover?.id === cover.id ? "active" : ""}
                          key={cover.id}
                          onClick={() => setSelectedCoverId(cover.id)}
                          type="button"
                        >
                          {cover.label}
                        </button>
                      ))}
                    </div>
                    <label className="coverUploadButton">
                      <input type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={handleCoverFile} />
	                      {mediaUploadTarget === "cover" ? "Загружаю..." : "Своё изображение"}
                    </label>
                    {coverNotice && <p className="coverNotice">{coverNotice}</p>}
                  </div>
                </aside>
              </div>

              <div className="resourceComparisonPanel">
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
                  <span>Ресурс без / с мандалой</span>
                </div>
                <label>
                  Ресурс без мандалы
                  <textarea
                    value={resourceWithoutMandalaComment}
                    onChange={(event) => setResourceWithoutMandalaComment(event.target.value)}
                    rows="2"
                  />
                </label>
                <label>
                  Ресурс с мандалой
                  <textarea
                    value={resourceWithMandalaComment}
                    onChange={(event) => setResourceWithMandalaComment(event.target.value)}
                    rows="2"
                  />
                </label>
              </div>

              <div className="powerPlaceActions">
                <button className="cabinetPrimary" type="button" disabled={!profile?.id} onClick={handleCompositionSave}>
                  {selectedCompositionId ? "Обновить место силы" : "Сохранить место силы"}
                </button>
                <button className="cabinetPrimary" type="button" onClick={handlePrintMandala}>Распечатать</button>
                <span>{powerPlaceCompositions.length}/{planLimits.compositions} сохранённых мест силы · Storage refs сохраняются без data:image.</span>
              </div>
            </section>
            )}

            {isClientPhotoPickerOpen && (
              <div className="clientPhotoPickerBackdrop" onMouseDown={(event) => {
                if (event.target === event.currentTarget) setClientPhotoPickerOpen(false);
              }}>
                <section className="clientPhotoPickerModal" role="dialog" aria-modal="true" aria-labelledby="clientPhotoPickerTitle">
                  <div className="clientPhotoPickerHeader">
                    <div>
                      <p className="cabinetEyebrow">Центр мандалы</p>
                      <h2 id="clientPhotoPickerTitle">Выбрать фото клиента</h2>
                    </div>
                    <button type="button" onClick={() => setClientPhotoPickerOpen(false)} aria-label="Закрыть выбор фото">×</button>
                  </div>
                  <div className="clientPhotoPickerGrid">
                    {clientGoalPhotos.map((photo) => (
                      <button
                        className={selectedCentralPhotoId === photo.id ? "clientPhotoPickerCard active" : "clientPhotoPickerCard"}
                        key={photo.id}
                        onClick={() => chooseCentralPhoto(photo.id)}
                        type="button"
                      >
                        <span style={imageStyle(photo.display_url || photo.image_url)} />
                        <b>{photo.title || "Фото цели"}</b>
                        {photo.notes && <small>{photo.notes}</small>}
                      </button>
                    ))}
                    {clientGoalPhotos.length === 0 && (
                      <div className="clientPhotoPickerEmpty">
                        <b>Фото клиентов пока нет</b>
                        <p>Загрузите фото ниже, и оно сразу станет центром мандалы.</p>
                      </div>
                    )}
                  </div>
                  <div className="clientPhotoPickerUpload">
                    <div className="cabinetFormHeader">
                      <div>
                        <p className="cabinetEyebrow">Загрузить новое фото</p>
                        <h3>{clientGoalPhotos.length}/{planLimits.clientPhotos}</h3>
                      </div>
                    </div>
                    <div className="powerInlineForm">
                      <input value={clientPhotoForm.title} onChange={(event) => setClientPhotoForm((current) => ({ ...current, title: event.target.value }))} placeholder="Название фото" />
                      <label className="mediaUploadButton">
                        <input type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={handleClientPhotoFile} />
                        {clientPhotoForm.file ? clientPhotoForm.file.name : "Файл JPG/PNG/WEBP/GIF"}
                      </label>
                      <input value={clientPhotoForm.image_url} onChange={(event) => setClientPhotoForm((current) => ({ ...current, image_url: event.target.value }))} placeholder="URL фото клиента / цели (опционально)" />
                      <input value={clientPhotoForm.notes} onChange={(event) => setClientPhotoForm((current) => ({ ...current, notes: event.target.value }))} placeholder="Заметка" />
                      <button className="cabinetSecondary" type="button" disabled={!profile?.id || clientGoalPhotos.length >= planLimits.clientPhotos || mediaUploadTarget === "client-goal"} onClick={() => handleClientPhotoSave({ selectSaved: true, closePicker: true })}>
                        {mediaUploadTarget === "client-goal" ? "Загружаю..." : "Сохранить и выбрать"}
                      </button>
                    </div>
                    {mediaStatus && <p className="mediaUploadNotice">{mediaStatus}</p>}
                    <p className="powerPlanNote">Файл сохраняется в private Supabase Storage; внешний URL можно оставить для старых ссылок.</p>
                  </div>
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
