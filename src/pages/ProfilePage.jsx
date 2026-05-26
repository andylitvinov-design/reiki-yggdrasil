import React, { useEffect, useMemo, useState } from "react";
import { reikiLevels } from "../data/reikiKnowledgeBase.js";
import { mysteryTraditions } from "../data/mysteryTraditions.js";
import { sourcedStepSettings } from "../data/reikiStepSettings.js";
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
  updatePowerPlaceComposition
} from "../lib/powerPlaceClient.js";
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

const POWER_SOURCE_COUNTS = [2, 4, 5, 6, 8, 12];
const CONSTRUCTOR_TYPES = [
  { value: "client", label: "Мандала клиенту" },
  { value: "altar", label: "Алтарь" },
  { value: "business", label: "Бизнес-мандала" },
  { value: "dao", label: "ДАО" }
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

const COMMAND_SLOT_LABELS = [
  "Команда 1",
  "Команда 2",
  "Команда 3",
  "Команда 4",
  "Команда 5"
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

function uniqueImageSources(items) {
  const seen = new Set();

  return items.filter((item) => {
    if (!isImagePreview(item?.src) || seen.has(item.src)) return false;
    seen.add(item.src);
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

function persistableObjectRefs(refs, allowedIds = null) {
  const allowed = allowedIds ? new Set(allowedIds) : null;

  return Object.fromEntries(
    Object.entries(refs || {})
      .filter(([key]) => !allowed || allowed.has(key))
      .map(([key, value]) => [key, persistableImageRef(String(value || ""))])
      .filter(([, value]) => Boolean(value))
  );
}

export default function ProfilePage({ onNavigateHome, onNavigateMasters }) {
  const [email, setEmail] = useState("");
  const [session, setSession] = useState(() => getStoredSession());
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(EMPTY_PROFILE);
  const [materials, setMaterials] = useState([]);
  const [clientGoalPhotos, setClientGoalPhotos] = useState([]);
  const [traditionAssets, setTraditionAssets] = useState([]);
  const [powerPlaceCompositions, setPowerPlaceCompositions] = useState([]);
  const [materialForm, setMaterialForm] = useState(EMPTY_MATERIAL);
  const [clientPhotoForm, setClientPhotoForm] = useState({ title: "", image_url: "", notes: "" });
  const [traditionAssetForm, setTraditionAssetForm] = useState({ title: "", image_url: "", notes: "" });
  const [materialsLoading, setMaterialsLoading] = useState(false);
  const [loading, setLoading] = useState(Boolean(supabaseEnv.isConfigured));
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [fileNotice, setFileNotice] = useState("");
  const [powerSourceCount, setPowerSourceCount] = useState(4);
  const [constructorType, setConstructorType] = useState("client");
  const [businessVertexZoneCount, setBusinessVertexZoneCount] = useState(1);
  const [altarCenterRatio, setAltarCenterRatio] = useState("1");
  const [objectImages, setObjectImages] = useState({});
  const [selectedCoverId, setSelectedCoverId] = useState(FALLBACK_COVER_VARIANTS[0].id);
  const [customCoverImage, setCustomCoverImage] = useState("");
  const [coverNotice, setCoverNotice] = useState("");
  const [selectedCentralPhotoId, setSelectedCentralPhotoId] = useState("");
  const [selectedTraditionId, setSelectedTraditionId] = useState(mysteryTraditions[0]?.id || "");
  const [compositionTitle, setCompositionTitle] = useState("");
  const [powerPlaceIntention, setPowerPlaceIntention] = useState("");
  const [selectedCompositionId, setSelectedCompositionId] = useState("");
  const [resourceComparisonMode, setResourceComparisonMode] = useState("client_photo");
  const [resourceWithoutMandalaComment, setResourceWithoutMandalaComment] = useState("");
  const [resourceWithMandalaComment, setResourceWithMandalaComment] = useState("");

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

  const reusableImages = useMemo(() => uniqueImageSources([
    ...clientGoalPhotos.map((item) => ({
      id: `client-${item.id}`,
      label: item.title || "Фото клиента / цели",
      src: item.image_url
    })),
    ...materials.map((item, index) => ({
      id: `material-${item.id || index}`,
      label: item.title || `Материал ${index + 1}`,
      src: item.image_url
    }))
  ]), [clientGoalPhotos, materials]);

  const traditionImageOptions = useMemo(() => uniqueImageSources(
    traditionAssets.map((item) => ({
      id: `tradition-${item.id}`,
      label: item.title || selectedTradition?.title || "Образ традиции",
      src: item.image_url
    }))
  ), [selectedTradition?.title, traditionAssets]);

  const coverVariants = useMemo(() => [
    ...reusableImages.map((item) => ({ ...item, type: "image" })),
    ...(customCoverImage ? [{ id: "custom-cover", label: "Своё изображение", src: customCoverImage, type: "image" }] : []),
    ...FALLBACK_COVER_VARIANTS.map((item) => ({ ...item, type: "placeholder" }))
  ], [customCoverImage, reusableImages]);

  const selectedCover = useMemo(
    () => coverVariants.find((item) => item.id === selectedCoverId) || coverVariants[0],
    [coverVariants, selectedCoverId]
  );

  const centerImage = isImagePreview(selectedCentralPhoto?.image_url) ? selectedCentralPhoto.image_url : "";

  const commandSlots = Array.from({ length: 5 }, (_, index) => reusableImages[index] || null);

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

    return Array.from({ length: powerSourceCount }, (_, index) => ({
      id: `source-${index + 1}`,
      label: sourceLabel(powerSourceCount, index)
    }));
  }, [businessVertexZoneCount, constructorType, powerSourceCount]);

  useEffect(() => {
    const nextSession = storeSessionFromUrlHash();
    setSession(nextSession);
  }, []);

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

    return {
      id: selectedCover.id,
      label: selectedCover.label,
      type: selectedCover.type,
      tone: selectedCover.tone || "",
      src: persistableImageRef(selectedCover.src || "")
    };
  };

  const buildPowerPlacePayload = () => ({
    profile_id: profile.id,
    title: compositionTitle,
    constructor_type: constructorType,
    geometry: constructorType === "client" ? powerSourceCount : null,
    altar_center_ratio: altarCenterRatio,
    business_vertex_zone_count: businessVertexZoneCount,
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
    setBusinessVertexZoneCount(Number(composition.business_vertex_zone_count) === 3 ? 3 : 1);
    setAltarCenterRatio(composition.altar_center_ratio || "1");
    setObjectImages(composition.object_refs || {});
    setSelectedCentralPhotoId(composition.central_photo_id || "");
    setSelectedTraditionId(composition.tradition_id || mysteryTraditions[0]?.id || "");
    setPowerPlaceIntention("");
    setResourceComparisonMode(composition.resource_comparison_mode || "client_photo");
    setResourceWithoutMandalaComment(composition.resource_without_mandala_comment || "");
    setResourceWithMandalaComment(composition.resource_with_mandala_comment || "");

    if (composition.cover_ref?.id) {
      if (composition.cover_ref.id === "custom-cover" && composition.cover_ref.src) {
        setCustomCoverImage(composition.cover_ref.src);
      }
      setSelectedCoverId(composition.cover_ref.id);
    }
  };

  const handleMandalaFile = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setFileNotice("Выберите файл изображения: JPG, PNG или WEBP.");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setFileNotice("Для первого релиза загрузите изображение до 2 MB или вставьте внешнюю ссылку.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      updateMaterialField("image_url", String(reader.result || ""));
      setFileNotice(`Фото «${file.name}» добавлено в алтарь мандалы.`);
    };
    reader.onerror = () => setFileNotice("Не удалось прочитать изображение. Попробуйте другой файл.");
    reader.readAsDataURL(file);
  };

  const handleCoverFile = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setCoverNotice("Выберите изображение для заставки: JPG, PNG или WEBP.");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setCoverNotice("Для локального MVP выберите изображение до 2 MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setCustomCoverImage(String(reader.result || ""));
      setSelectedCoverId("custom-cover");
      setCoverNotice(`Заставка «${file.name}» выбрана локально. Постоянное хранение требует отдельной проверки.`);
    };
    reader.onerror = () => setCoverNotice("Не удалось прочитать заставку. Попробуйте другой файл.");
    reader.readAsDataURL(file);
  };

  const setObjectImage = (slotId, value) => {
    setObjectImages((current) => ({ ...current, [slotId]: value }));
  };

  const handleObjectFile = (slotId, event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setCoverNotice("Выберите изображение для объекта: JPG, PNG или WEBP.");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setCoverNotice("Для локального MVP выберите изображение объекта до 2 MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setObjectImage(slotId, String(reader.result || ""));
      setCoverNotice(`Изображение «${file.name}» добавлено в объект локально.`);
    };
    reader.onerror = () => setCoverNotice("Не удалось прочитать изображение объекта. Попробуйте другой файл.");
    reader.readAsDataURL(file);
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
      const saved = await createOwnMaterial(buildMaterialPayload(materialForm, profile.id, nextStatus), session);
      setMaterials((current) => [saved, ...current].filter(Boolean));
      setMaterialForm((current) => ({
        ...EMPTY_MATERIAL,
        type: current.type,
        step_id: current.step_id,
        step_title: current.step_title,
        setting_title: current.setting_title,
        setting_index: current.setting_index
      }));
      setFileNotice("");
      setMessage(nextStatus === "pending" ? "Материал отправлен на модерацию." : "Материал сохранён как черновик.");
    } catch (err) {
      setError(err.message || "Не удалось сохранить материал.");
    }
  };

  const handleClientPhotoSave = async () => {
    setMessage("");
    setError("");

    if (!profile?.id) {
      setError("Сначала сохраните профиль мастера.");
      return;
    }

    try {
      const saved = await createClientGoalPhoto({ ...clientPhotoForm, profile_id: profile.id }, accountPlan, session);
      setClientGoalPhotos((current) => [saved, ...current].filter(Boolean));
      setSelectedCentralPhotoId((current) => current || saved?.id || "");
      setClientPhotoForm({ title: "", image_url: "", notes: "" });
      setMessage("Фото клиента / цели сохранено.");
    } catch (err) {
      setError(err.message || "Не удалось сохранить фото клиента / цели.");
    }
  };

  const handleTraditionAssetSave = async () => {
    setMessage("");
    setError("");

    if (!profile?.id || !selectedTradition) {
      setError("Сначала сохраните профиль и выберите традицию.");
      return;
    }

    try {
      const saved = await createTraditionAsset({
        ...traditionAssetForm,
        profile_id: profile.id,
        tradition_id: selectedTradition.id,
        tradition_title: selectedTradition.title
      }, session);
      setTraditionAssets((current) => [saved, ...current].filter(Boolean));
      setTraditionAssetForm({ title: "", image_url: "", notes: "" });
      setMessage("Образ традиции сохранён.");
    } catch (err) {
      setError(err.message || "Не удалось сохранить образ традиции.");
    }
  };

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
    setObjectImages({});
    setSelectedCentralPhotoId("");
    setSelectedCompositionId("");
    setCompositionTitle("");
    setFileNotice("");
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

  return (
    <CabinetShell title="Кабинет мастера" onNavigateHome={onNavigateHome} onNavigateMasters={onNavigateMasters}>
      {loading && <div className="cabinetNotice">Загружаю кабинет...</div>}
      {error && <div className="cabinetError">{error}</div>}
      {message && <div className="cabinetSuccess">{message}</div>}

      {!loading && !user && (
        <form className="cabinetCard authCard" onSubmit={handleMagicLink}>
          <p className="cabinetEyebrow">Вход мастера</p>
          <h2>Войдите, чтобы создать профиль мастера</h2>
          <p>Войдите через Google или используйте email-ссылку. После входа можно заполнить профиль и отправить его на модерацию.</p>
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
          <form className="cabinetCard profileForm" onSubmit={(event) => { event.preventDefault(); handleSave(); }}>
            <div className="cabinetFormHeader">
              <div>
                <p className="cabinetEyebrow">Профиль мастера</p>
                <h2>{profile.display_name || "Новый профиль"}</h2>
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

          <section className="mandalaWorkspace">
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

            <div className="flowTuningPanel">
              <div>
                <p className="cabinetEyebrow">Настройка потока</p>
                <h3>{activeStep?.id} · {activeStep?.title}</h3>
                <p>{materialForm.setting_title || "Выберите настройку этой ступени"}</p>
              </div>
              <div className="flowTuningGlow">
                <span>✦</span>
                <b>{activeStep?.stepLabel} {activeStep?.number}</b>
                <small>{activeStep?.levelName}</small>
              </div>
            </div>

            <div className="mandalaAtelierGrid">
              <div className="mandalaAltarCard">
                <p className="cabinetEyebrow">Алтарь мандалы</p>
                <div className={isImagePreview(materialForm.image_url) ? "mandalaPreview hasImage" : "mandalaPreview"} style={isImagePreview(materialForm.image_url) ? { backgroundImage: `url(${materialForm.image_url})` } : undefined}>
                  {!isImagePreview(materialForm.image_url) && <span>⇧</span>}
                </div>
                <label className="mandalaUploadButton">
                  <input type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={handleMandalaFile} />
                  Загрузить фото мандалы
                </label>
                <div className="mandalaDropHint">
                  JPG, PNG, WEBP до 2 MB. Файл будет сохранён как изображение в материале; также можно вставить внешний URL.
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

                <label>
                  Название
                  <input value={materialForm.title} onChange={(event) => updateMaterialField("title", event.target.value)} placeholder="Например: Мандала денежной активации" />
                </label>

                <label>
                  Описание / инструкция
                  <textarea value={materialForm.description} onChange={(event) => updateMaterialField("description", event.target.value)} rows={4} placeholder="Что делает материал, как использовать, для какой задачи создан." />
                </label>

                <label>
                  URL изображения / мандалы
                  <input value={materialForm.image_url} onChange={(event) => updateMaterialField("image_url", event.target.value)} placeholder="https://... или загрузите фото слева" />
                </label>

                <div className="cabinetActions">
                  <button className="cabinetPrimary" type="submit" disabled={!profile?.id}>Сохранить черновик</button>
                  <button className="cabinetSecondary" type="button" disabled={!profile?.id} onClick={() => handleMaterialSave("pending")}>Отправить на модерацию</button>
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
                  <input value={clientPhotoForm.image_url} onChange={(event) => setClientPhotoForm((current) => ({ ...current, image_url: event.target.value }))} placeholder="URL фото клиента / цели" />
                  <input value={clientPhotoForm.notes} onChange={(event) => setClientPhotoForm((current) => ({ ...current, notes: event.target.value }))} placeholder="Заметка" />
                  <button className="cabinetSecondary" type="button" disabled={!profile?.id || clientGoalPhotos.length >= planLimits.clientPhotos} onClick={handleClientPhotoSave}>Сохранить фото</button>
                </div>
                <p className="powerPlanNote">Файловое хранилище: needs verification. Сейчас сохраняется URL/ссылка на изображение.</p>
                <div className="clientPhotoStrip">
                  {clientGoalPhotos.map((photo) => (
                    <button
                      className={selectedCentralPhotoId === photo.id ? "active" : ""}
                      key={photo.id}
                      onClick={() => setSelectedCentralPhotoId(photo.id)}
                      type="button"
                    >
                      <span style={imageStyle(photo.image_url)} />
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
                  <input value={traditionAssetForm.image_url} onChange={(event) => setTraditionAssetForm((current) => ({ ...current, image_url: event.target.value }))} placeholder="URL изображения традиции" />
                  <input value={traditionAssetForm.notes} onChange={(event) => setTraditionAssetForm((current) => ({ ...current, notes: event.target.value }))} placeholder="Заметка" />
                  <button className="cabinetSecondary" type="button" disabled={!profile?.id || !selectedTradition} onClick={handleTraditionAssetSave}>Сохранить образ</button>
                </div>
                <p className="powerPlanNote">IA: Личный кабинет → Мистерии → {selectedTradition?.title || "традиция"}. Загрузка файлов в Storage: needs verification.</p>
                <div className="traditionAssetStrip">
                  {traditionAssets.map((asset) => (
                    <span key={asset.id}>
                      <i style={imageStyle(asset.image_url)} />
                      <b>{asset.title || selectedTradition?.title}</b>
                    </span>
                  ))}
                  {traditionAssets.length === 0 && <p>Сохранённые образы выбранной традиции появятся в селекторах объектов алтаря.</p>}
                </div>
              </div>
            </section>

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
                  <label className="powerIntentionField">
                    Цель места силы
                    <textarea
                      value={powerPlaceIntention}
                      onChange={(event) => setPowerPlaceIntention(event.target.value)}
                      rows="3"
                      placeholder="Сформулируйте намерение, которое должна удерживать эта мандала."
                    />
                  </label>
                  {constructorType === "client" ? (
                    <div className={`powerMandala geometry-${powerSourceCount}`}>
                      <div className={centerImage ? "powerCenterPhoto hasImage" : "powerCenterPhoto"} style={imageStyle(centerImage)}>
                        {!centerImage && <span>◎</span>}
                      </div>
                      <div className="powerMandalaBase">
                        <span>мандала места силы</span>
                      </div>
                      {Array.from({ length: powerSourceCount }, (_, index) => {
                        const slotId = `source-${index + 1}`;
                        const sourceImage = objectImages[slotId];

                        return (
                          <div
                            className={`${sourceClassName(powerSourceCount, index)}${sourceImage ? " hasImage" : ""}`}
                            key={`source-${powerSourceCount}-${index}`}
                            style={imageStyle(sourceImage)}
                            title={sourceLabel(powerSourceCount, index)}
                          >
                            {!sourceImage && <span>{index + 1}</span>}
                          </div>
                        );
                      })}
                    </div>
                  ) : constructorType === "altar" ? (
                    <div className={`altarMandalaSheet ratio-${altarCenterRatio}`}>
                      <div className="altarTopRow" aria-label="Верхние источники алтаря">
                        {Array.from({ length: 5 }, (_, index) => {
                          const slotId = `altar-top-${index + 1}`;
                          const slotImage = objectImages[slotId];
                          const isMain = index === 2;

                          return (
                            <div
                              className={`${isMain ? "altarTopSource main" : "altarTopSource"}${slotImage ? " hasImage" : ""}`}
                              key={slotId}
                              style={imageStyle(slotImage)}
                              title={isMain ? "Центральный верхний объект" : `Верхний объект ${index + 1}`}
                            >
                              {!slotImage && <span>{index + 1}</span>}
                            </div>
                          );
                        })}
                      </div>
                      <div className={centerImage ? "altarCenterPhoto hasImage" : "altarCenterPhoto"} style={imageStyle(centerImage)}>
                        {!centerImage && <span>◎</span>}
                      </div>
                      <div className="altarMandalaBase">
                        <span>мандала места силы</span>
                      </div>
                      <div className="altarBottomSupports" aria-label="Нижние опоры алтаря">
                        {[1, 2].map((number) => {
                          const slotId = `altar-support-${number}`;
                          const slotImage = objectImages[slotId];

                          return (
                            <div
                              className={`altarSupportSource${slotImage ? " hasImage" : ""}`}
                              key={slotId}
                              style={imageStyle(slotImage)}
                              title={`Нижняя опора ${number}`}
                            >
                              {!slotImage && <span>{number}</span>}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : constructorType === "business" ? (
                    <div className={`businessMandalaSheet zones-${businessVertexZoneCount}`}>
                      <div className={centerImage ? "businessCenterPhoto hasImage" : "businessCenterPhoto"} style={imageStyle(centerImage)}>
                        {!centerImage && <span>◎</span>}
                      </div>
                      <div className="businessTriangleLines" aria-hidden="true" />
                      {BUSINESS_VERTICES.map((vertex) => (
                        <div className={`businessVertex ${vertex.className}`} key={vertex.id}>
                          <b>{vertex.label}</b>
                          <div className="businessVertexZones">
                            {Array.from({ length: businessVertexZoneCount }, (_, index) => {
                              const slotId = `business-${vertex.id}-${index + 1}`;
                              const slotImage = objectImages[slotId];

                              return (
                                <div
                                  className={`businessVertexZone${slotImage ? " hasImage" : ""}`}
                                  key={slotId}
                                  style={imageStyle(slotImage)}
                                  title={businessVertexZoneCount === 1 ? vertex.label : `${vertex.label} · зона ${index + 1}`}
                                >
                                  {!slotImage && <span>{index + 1}</span>}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="daoMandalaSheet">
                      <div className={centerImage ? "daoCenterPhoto hasImage" : "daoCenterPhoto"} style={imageStyle(centerImage)}>
                        {!centerImage && <span>◎</span>}
                      </div>
                      <div className="daoUsinCore" aria-hidden="true">
                        <span>УСИН</span>
                      </div>
                      {DAO_ELEMENTS.map((element) => {
                        const slotId = `dao-${element.id}`;
                        const slotImage = objectImages[slotId];

                        return (
                          <div className={`daoElement ${element.className}`} key={element.id}>
                            <div
                              className={`daoElementImage${slotImage ? " hasImage" : ""}`}
                              style={imageStyle(slotImage)}
                              title={element.label}
                            >
                              {!slotImage && <span>◎</span>}
                            </div>
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
                    <div className="objectSlotList">
                      {activeObjectSlots.map((slot) => {
                        const slotImage = objectImages[slot.id] || "";

                        return (
                          <div className="objectSlotEditor" key={slot.id}>
                            <div className={slotImage ? "objectSlotPreview hasImage" : "objectSlotPreview"} style={imageStyle(slotImage)}>
                              {!slotImage && <span>◎</span>}
                            </div>
                            <div>
                              <b>{slot.label}</b>
                              <select value={slotImage} onChange={(event) => setObjectImage(slot.id, event.target.value)}>
                                {objectImageOptions.map((option) => (
                                  <option key={`${slot.id}-${option.id || "empty"}`} value={option.src}>{option.label}</option>
                                ))}
                              </select>
                              <div className="objectSlotActions">
                                <label>
                                  <input type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={(event) => handleObjectFile(slot.id, event)} />
                                  Загрузить
                                </label>
                                <button type="button" onClick={() => setObjectImage(slot.id, "")}>Очистить</button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="commandSlots" aria-label="Командные изображения">
                    {COMMAND_SLOT_LABELS.map((label, index) => {
                      const commandImage = commandSlots[index];

                      return (
                        <div className={commandImage ? "commandSlot hasImage" : "commandSlot"} key={label} style={commandImage ? { backgroundImage: `url(${commandImage.src})` } : undefined}>
                          {!commandImage && <span>{index + 1}</span>}
                          <small>{label}</small>
                        </div>
                      );
                    })}
                  </div>

                  <div className="coverSelector">
                    <p className="cabinetEyebrow">Заставка места силы</p>
                    <div className="coverPreviewWrap">
                      <div
                        className={`coverPreview ${selectedCover?.type === "image" ? "hasImage" : `tone-${selectedCover?.tone || "gold"}`}`}
                        style={selectedCover?.type === "image" ? { backgroundImage: `url(${selectedCover.src})` } : undefined}
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
                      Своё изображение
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
                <span>{powerPlaceCompositions.length}/{planLimits.compositions} сохранённых мест силы · Storage upload: needs verification.</span>
              </div>
            </section>

            <div className="mandalaGallery">
              <div className="cabinetFormHeader">
                <div>
                  <p className="cabinetEyebrow">Мои мандалы и материалы</p>
                  <h2>Галерея мастера</h2>
                </div>
                <span className="cabinetStatus">{materialsLoading ? "..." : materials.length}</span>
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

              {materials.length > 0 && (
                <div className="mandalaCardsGrid">
                  {materials.map((item) => (
                    <article className="mandalaMaterialCard" key={item.id}>
                      {item.image_url ? <div className="mandalaCardImage" style={{ backgroundImage: `url(${item.image_url})` }} /> : <div className="mandalaCardImage placeholder">◎</div>}
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
