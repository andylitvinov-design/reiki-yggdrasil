import React, { useEffect, useMemo, useState } from "react";
import { extractCssUrls } from "../lib/printUtils.js";
import { reikiLevels } from "../data/reikiKnowledgeBase.js";
import { sourcedStepSettings } from "../data/reikiStepSettings.js";
import { mysteryTraditions } from "../data/mysteryTraditions.js";
import {
  createEmptyMaterialForm,
  createOwnMaterial,
  listOwnMaterials,
  normalizeMaterialForm
} from "../lib/profileMaterialsClient.js";
import {
  createEmptyServiceForm,
  createOwnService,
  listOwnServiceOrders,
  listOwnServices,
  publishOwnService,
  updateServiceOrder
} from "../lib/profileServicesClient.js";
import {
  clearStoredSession,
  getCurrentUser,
  getOwnProfile,
  getStoredSession,
  isStoredSessionExpired,
  saveOwnProfile,
  signInWithGoogle,
  storeSessionFromUrlHash,
  supabaseEnv
} from "../lib/supabaseClient.js";
import {
  createClientGoalPhoto,
  createPowerPlaceComposition,
  createTraditionAsset,
  deleteClientGoalPhoto,
  getPlanLimits,
  listClientGoalPhotos,
  listPowerPlaceCompositions,
  listTraditionAssets,
  normalizeAccountPlan,
  updatePowerPlaceComposition
} from "../lib/powerPlaceClient.js";
import { uploadProfileMedia, validateProfileMediaFile } from "../lib/profileMediaClient.js";
import { loadProfileCabinetBootstrap } from "../lib/profileBootstrapClient.js";
import { listOwnChatThreads, sendChatMessage } from "../lib/masterChatClient.js";
import {
  createProfileLiteDiagnostics,
  createProfileLiteForm,
  createProfileLiteSavePayload,
  getProfileLiteTabById,
  getProfileLiteRouteByTabId,
  hasProfileLiteSessionCredential,
  safeProfileLiteError
} from "../lib/profileLiteClient.js";
import ProfileLiteShell from "./profile-lite/ProfileLiteShell.jsx";
import ProfileLiteOverview from "./profile-lite/ProfileLiteOverview.jsx";
import ProfileLiteProfileModule from "./profile-lite/ProfileLiteProfileModule.jsx";
import ProfileLiteMandalasModule from "./profile-lite/ProfileLiteMandalasModule.jsx";
import ProfileLiteMediaModule from "./profile-lite/ProfileLiteMediaModule.jsx";
import ProfileLiteMaterialsModule from "./profile-lite/ProfileLiteMaterialsModule.jsx";
import ProfileLiteServicesModule from "./profile-lite/ProfileLiteServicesModule.jsx";
import ProfileLiteOrdersModule from "./profile-lite/ProfileLiteOrdersModule.jsx";
import ProfileLiteChatsModule from "./profile-lite/ProfileLiteChatsModule.jsx";
import ProfileLiteSettingsModule from "./profile-lite/ProfileLiteSettingsModule.jsx";
import ProfileLiteDiagnosticsModule from "./profile-lite/ProfileLiteDiagnosticsModule.jsx";

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
const EMPTY_CLIENT_PHOTO = { title: "", image_url: "", notes: "", file: null };
const EMPTY_TRADITION_ASSET = {
  tradition_id: mysteryTraditions[0]?.id || "",
  title: "",
  image_url: "",
  notes: "",
  file: null
};
const EMPTY_COMPOSITION = {
  id: "",
  title: "",
  constructor_type: "zodiac",
  geometry: 4,
  zodiac_variant: "classic-12",
  zodiac_visible_count: 12,
  altar_center_ratio: "1",
  business_vertex_zone_count: 1,
  star_variant: "closed",
  chess_variant: "classic-14",
  chess_slot_scale: 1,
  slot_scale: 1,
  field_scale: 78,
  cover_ref: null,
  object_refs: {},
  central_photo_id: "",
  tradition_id: "",
  tradition_title: "",
  resource_comparison_mode: "client_photo",
  resource_without_mandala_comment: "",
  resource_with_mandala_comment: ""
};
const PROFILE_LITE_REPORT_REF_KEY = "__profile_lite_report";
const EMPTY_PROFILE_LITE_REPORT = {
  mode: "without_report",
  added: false,
  situation: "",
  mandala_effect: "",
  extra_help: "",
  master_note: ""
};
const EMPTY_ORDER_PATCH = {
  id: "",
  master_comment: "",
  result_image_url: "",
  result_image_bucket: null,
  result_image_path: null,
  status: "sent"
};
const POWER_PLACE_START_LIMIT_MESSAGE = "Лимит 7 сохранённых мандал достигнут. Выберите мандалу из списка и нажмите «Обновить» или удалите одну мандалу.";
const ROUTE_CHANGE_EVENT = "reiki-route-change";

class ProfileLiteModuleErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidUpdate(previousProps) {
    if (previousProps.boundaryKey !== this.props.boundaryKey && this.state.error) {
      this.setState({ error: null });
    }
  }

  render() {
    if (this.state.error) {
      return (
        <section className="cabinetError profileLiteModuleError" aria-label="Ошибка модуля">
          <p className="cabinetEyebrow">Module error</p>
          <h2>{this.props.moduleLabel || "Раздел кабинета"} временно недоступен</h2>
          <p>{safeProfileLiteError(this.state.error, "Модуль не отрисовался. Оболочка кабинета остаётся доступной.")}</p>
        </section>
      );
    }

    return this.props.children;
  }
}

function resetWindowUrl() {
  if (typeof window === "undefined") return;
  window.history.replaceState({}, document.title, window.location.pathname);
}

function settingsForStep(stepId) {
  const step = stepOptions.find((item) => item.id === stepId) || firstStep;
  return sourcedStepSettings[step?.id] || step?.settings || [];
}

function moduleError(error, fallback) {
  return safeProfileLiteError(error, fallback);
}

function buildMaterialPayload(form, profileId, nextStatus) {
  const step = stepOptions.find((item) => item.id === form.step_id) || firstStep;
  const settings = settingsForStep(step?.id);
  const settingIndex = settings.findIndex((item) => item.title === form.setting_title);

  return {
    profile_id: profileId,
    ...normalizeMaterialForm({
      ...form,
      step_id: step?.id || "",
      step_title: step?.title || "",
      setting_title: form.setting_title || "",
      setting_index: settingIndex >= 0 ? settingIndex + 1 : null
    }, nextStatus),
    updated_at: new Date().toISOString()
  };
}

function downloadText(filename, text) {
  const blob = new Blob([text], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function normalizeProfileLiteReport(value) {
  const source = value && typeof value === "object" && !Array.isArray(value) ? value : {};
  const hasReportBody = Boolean(source.added || source.situation || source.mandala_effect || source.extra_help);
  return {
    ...EMPTY_PROFILE_LITE_REPORT,
    mode: source.mode === "with_report" || (!source.mode && hasReportBody) ? "with_report" : "without_report",
    added: Boolean(source.added),
    situation: String(source.situation || "").trim(),
    mandala_effect: String(source.mandala_effect || "").trim(),
    extra_help: String(source.extra_help || "").trim(),
    master_note: ""
  };
}

function uniqueCompositionCopyTitle(title, compositions) {
  const baseTitle = String(title || "").trim() || "Место силы";
  const copyBase = `${baseTitle} копия`;
  const existingTitles = new Set((compositions || []).map((item) => String(item?.title || "").trim()).filter(Boolean));
  if (!existingTitles.has(baseTitle)) return baseTitle;
  if (!existingTitles.has(copyBase)) return copyBase;

  let index = 2;
  while (existingTitles.has(`${copyBase} ${index}`)) index += 1;
  return `${copyBase} ${index}`;
}

function safeFilename(value) {
  const safe = String(value || "power-place")
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
  return safe || "power-place";
}

function collectPrintableStyles() {
  return Array.from(document.styleSheets || []).map((sheet) => {
    if (sheet.href) return `<link rel="stylesheet" href="${escapeHtml(sheet.href)}">`;
    try {
      const cssText = Array.from(sheet.cssRules || []).map((rule) => rule.cssText).join("\n");
      return cssText ? `<style>${cssText}</style>` : "";
    } catch {
      return "";
    }
  }).join("\n");
}

function preloadImagesForPrint(urls, timeoutMs = 2500) {
  if (!urls.length) return Promise.resolve();
  if (typeof Image === "undefined") return Promise.resolve();
  return new Promise((resolve) => {
    let remaining = urls.length;
    let settled = false;
    const finish = () => { if (!settled) { settled = true; clearTimeout(timer); resolve(); } };
    const decrement = () => { if (--remaining <= 0) finish(); };
    const timer = setTimeout(finish, timeoutMs);
    urls.forEach((src) => {
      try {
        const img = new Image();
        img.onload = img.onerror = decrement;
        img.src = src;
      } catch (_) {
        decrement();
      }
    });
  });
}

function raf2(win) {
  if (typeof win.requestAnimationFrame === "function") {
    return new Promise((res) => win.requestAnimationFrame(() => win.requestAnimationFrame(res)));
  }
  return new Promise((res) => setTimeout(res, 32));
}

function openPowerPlacePdfPrintView(title) {
  const printArea = document.querySelector(".profileLitePowerPlace .powerPlacePrintArea") || document.querySelector(".powerPlacePrintArea");
  if (!printArea) throw new Error("Макет мандалы не найден.");

  const filename = `${safeFilename(title || "power-place")}.pdf`;
  // window.open must stay synchronous on the click event stack
  const printWindow = window.open("", "_blank", "width=980,height=900");
  if (!printWindow) throw new Error("Разрешите всплывающее окно для печати в PDF.");

  const imageUrls = extractCssUrls(printArea);

  const clonedArea = printArea.cloneNode(true);
  clonedArea.classList.add("powerPlacePdfOnlyArea");
  printWindow.document.open();
  printWindow.document.write(`<!doctype html>
<html lang="ru">
<head>
  <meta charset="utf-8">
  <title>${escapeHtml(filename)}</title>
  ${collectPrintableStyles()}
  <style>
    body{margin:0;background:#fffaf0;color:#2f2418}
    body.printMandalaOnly .powerPlacePdfOnlyArea{position:static!important;width:100%!important;min-height:100vh!important}
    @page{size:auto;margin:10mm}
    #pdfStatus{position:fixed;top:0;left:0;right:0;padding:12px;background:#f5f0e8;text-align:center;font-family:sans-serif;font-size:14px;color:#5a4030;z-index:9999}
  </style>
</head>
<body class="printMandalaOnly">
  <div id="pdfStatus">Подготовка PDF: загружаем изображения…</div>
  <main aria-label="Скачать PDF / Печать в PDF"></main>
</body>
</html>`);
  printWindow.document.querySelector("main")?.appendChild(printWindow.document.importNode(clonedArea, true));
  printWindow.document.close();

  Promise.all([
    preloadImagesForPrint(imageUrls),
    printWindow.document.fonts?.ready ?? Promise.resolve(),
  ])
    .then(() => raf2(printWindow))
    .then(() => {
      const status = printWindow.document.getElementById("pdfStatus");
      if (status) status.style.display = "none";
      printWindow.focus();
      printWindow.print();
    });
}

export default function ProfileLitePage({ initialTab = "overview", onNavigateHome, onNavigateMasters }) {
  const [activeTab, setActiveTab] = useState(getProfileLiteTabById(initialTab).id);
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [authStatus, setAuthStatus] = useState("idle");
  const [profileStatus, setProfileStatus] = useState("idle");
  const [authError, setAuthError] = useState("");
  const [profileError, setProfileError] = useState("");
  const [form, setForm] = useState(() => createProfileLiteForm());
  const [saveStatus, setSaveStatus] = useState("idle");
  const [saveMessage, setSaveMessage] = useState("");

  const [materialsStatus, setMaterialsStatus] = useState("idle");
  const [materialsError, setMaterialsError] = useState("");
  const [materials, setMaterials] = useState([]);
  const [materialForm, setMaterialForm] = useState(EMPTY_MATERIAL);
  const [materialFile, setMaterialFile] = useState(null);

  const [mediaStatus, setMediaStatus] = useState("idle");
  const [mediaError, setMediaError] = useState("");
  const [clientGoalPhotos, setClientGoalPhotos] = useState([]);
  const [traditionAssets, setTraditionAssets] = useState([]);
  const [clientPhotoForm, setClientPhotoForm] = useState(EMPTY_CLIENT_PHOTO);
  const [traditionAssetForm, setTraditionAssetForm] = useState(EMPTY_TRADITION_ASSET);

  const [mandalasStatus, setMandalasStatus] = useState("idle");
  const [mandalasError, setMandalasError] = useState("");
  const [powerPlaceCompositions, setPowerPlaceCompositions] = useState([]);
  const [compositionDraft, setCompositionDraft] = useState(EMPTY_COMPOSITION);
  const [compositionMessage, setCompositionMessage] = useState("");

  const [servicesStatus, setServicesStatus] = useState("idle");
  const [servicesError, setServicesError] = useState("");
  const [services, setServices] = useState([]);
  const [serviceForm, setServiceForm] = useState(() => createEmptyServiceForm());

  const [ordersStatus, setOrdersStatus] = useState("idle");
  const [ordersError, setOrdersError] = useState("");
  const [orders, setOrders] = useState([]);
  const [orderPatch, setOrderPatch] = useState(EMPTY_ORDER_PATCH);

  const [chatsStatus, setChatsStatus] = useState("idle");
  const [chatsError, setChatsError] = useState("");
  const [chatThreads, setChatThreads] = useState([]);
  const [selectedThreadId, setSelectedThreadId] = useState("");
  const [chatDraft, setChatDraft] = useState("");

  const sessionExpired = useMemo(() => isStoredSessionExpired(session), [session]);
  const activeSettings = useMemo(() => settingsForStep(materialForm.step_id), [materialForm.step_id]);
  const accountPlan = normalizeAccountPlan(form.account_plan || profile?.account_plan);
  const planLimits = getPlanLimits(accountPlan);
  const diagnostics = useMemo(() => createProfileLiteDiagnostics({
    supabaseConfigured: supabaseEnv.isConfigured,
    session,
    sessionExpired,
    user,
    profile,
    authStatus,
    profileStatus
  }), [authStatus, profile, profileStatus, session, sessionExpired, user]);

  useEffect(() => {
    setActiveTab(getProfileLiteTabById(initialTab).id);
  }, [initialTab]);

  const moduleStates = useMemo(() => ({
    profile: { status: profileStatus, count: profile ? 1 : 0, error: profileError },
    materials: { status: materialsStatus, count: materials.length, error: materialsError },
    media: { status: mediaStatus, count: clientGoalPhotos.length + traditionAssets.length, error: mediaError },
    mandalas: { status: mandalasStatus, count: powerPlaceCompositions.length, error: mandalasError },
    services: { status: servicesStatus, count: services.length, error: servicesError },
    orders: { status: ordersStatus, count: orders.length, error: ordersError },
    chats: { status: chatsStatus, count: chatThreads.length, error: chatsError }
  }), [
    chatThreads.length,
    chatsError,
    chatsStatus,
    clientGoalPhotos.length,
    materials.length,
    materialsError,
    materialsStatus,
    mediaError,
    mediaStatus,
    mandalasError,
    mandalasStatus,
    orders.length,
    ordersError,
    ordersStatus,
    powerPlaceCompositions.length,
    profile,
    profileError,
    profileStatus,
    services.length,
    servicesError,
    servicesStatus,
    traditionAssets.length
  ]);

  const resetLocalState = () => {
    clearStoredSession();
    setSession(null);
    setUser(null);
    setProfile(null);
    setAuthStatus("idle");
    setProfileStatus("idle");
    setAuthError("");
    setProfileError("");
    setForm(createProfileLiteForm());
    setSaveStatus("idle");
    setSaveMessage("");
    setMaterials([]);
    setMaterialsStatus("idle");
    setMaterialsError("");
    setClientGoalPhotos([]);
    setTraditionAssets([]);
    setMediaStatus("idle");
    setMediaError("");
    setPowerPlaceCompositions([]);
    setMandalasStatus("idle");
    setMandalasError("");
    setServices([]);
    setServicesStatus("idle");
    setServicesError("");
    setOrders([]);
    setOrdersStatus("idle");
    setOrdersError("");
    setChatThreads([]);
    setChatsStatus("idle");
    setChatsError("");
    resetWindowUrl();
  };

  const refreshShell = async () => {
    const nextSession = storeSessionFromUrlHash() || getStoredSession();
    setSession(nextSession);
    setUser(null);
    setProfile(null);
    setAuthError("");
    setProfileError("");
    setSaveMessage("");

    if (!supabaseEnv.isConfigured) {
      setAuthStatus("idle");
      setAuthError("Supabase не настроен. Кабинет не зависает и ждёт настройки окружения.");
      return;
    }

    if (!nextSession) {
      setAuthStatus("idle");
      return;
    }

    if (isStoredSessionExpired(nextSession)) {
      setAuthStatus("error");
      setAuthError("Сессия устарела. Войдите заново.");
      return;
    }

    setAuthStatus("loading");
    try {
      const { currentUser } = await loadProfileCabinetBootstrap({ session: nextSession, getCurrentUser });
      if (!currentUser?.id) {
        setAuthStatus("error");
        setAuthError("Пользователь не найден. Войдите заново.");
        return;
      }
      setUser(currentUser);
      setForm(createProfileLiteForm(null, currentUser));
      setAuthStatus("success");
    } catch (error) {
      setAuthStatus("error");
      setAuthError(safeProfileLiteError(error, "Пользователь не загрузился."));
    }
  };

  useEffect(() => {
    void refreshShell();
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function loadProfile() {
      if (!user?.id || !hasProfileLiteSessionCredential(session)) {
        setProfile(null);
        setProfileStatus("idle");
        return;
      }
      setProfileStatus("loading");
      setProfileError("");
      try {
        const row = await getOwnProfile(user.id, session);
        if (cancelled) return;
        setProfile(row);
        setForm(createProfileLiteForm(row, user));
        setProfileStatus(row ? "success" : "idle");
      } catch (error) {
        if (cancelled) return;
        setProfile(null);
        setProfileStatus("error");
        setProfileError(moduleError(error, "Профиль не загрузился."));
      }
    }
    void loadProfile();
    return () => {
      cancelled = true;
    };
  }, [session, user?.id]);

  useEffect(() => {
    let cancelled = false;
    async function loadMaterials() {
      if (!profile?.id || !hasProfileLiteSessionCredential(session)) {
        setMaterials([]);
        setMaterialsStatus("idle");
        return;
      }
      setMaterialsStatus("loading");
      setMaterialsError("");
      try {
        const rows = await listOwnMaterials(profile.id, session);
        if (cancelled) return;
        setMaterials(rows || []);
        setMaterialsStatus("success");
      } catch (error) {
        if (cancelled) return;
        setMaterials([]);
        setMaterialsStatus("needs-verification");
        setMaterialsError(moduleError(error, "profile_cabinet_publications request failed or migration/RLS not applied"));
      }
    }
    void loadMaterials();
    return () => {
      cancelled = true;
    };
  }, [profile?.id, session]);

  useEffect(() => {
    let cancelled = false;
    async function loadMediaAndMandalas() {
      if (!profile?.id || !hasProfileLiteSessionCredential(session)) {
        setClientGoalPhotos([]);
        setTraditionAssets([]);
        setPowerPlaceCompositions([]);
        setMediaStatus("idle");
        setMandalasStatus("idle");
        return;
      }
      setMediaStatus("loading");
      setMandalasStatus("loading");
      setMediaError("");
      setMandalasError("");
      const [photosResult, traditionResult, compositionsResult] = await Promise.allSettled([
        listClientGoalPhotos(profile.id, session),
        listTraditionAssets(profile.id, traditionAssetForm.tradition_id, session),
        listPowerPlaceCompositions(profile.id, session)
      ]);
      if (cancelled) return;
      if (photosResult.status === "fulfilled") {
        setClientGoalPhotos(photosResult.value || []);
      } else {
        setMediaError(moduleError(photosResult.reason, "profile_cabinet_client_goal_photos request failed or migration/RLS not applied"));
      }
      if (traditionResult.status === "fulfilled") {
        setTraditionAssets(traditionResult.value || []);
      } else {
        setMediaError(moduleError(traditionResult.reason, "profile_cabinet_tradition_assets request failed or migration/RLS not applied"));
      }
      if (compositionsResult.status === "fulfilled") {
        setPowerPlaceCompositions(compositionsResult.value || []);
        setMandalasStatus("success");
      } else {
        setPowerPlaceCompositions([]);
        setMandalasStatus("needs-verification");
        setMandalasError(moduleError(compositionsResult.reason, "profile_cabinet_power_place_compositions request failed or migration/RLS not applied"));
      }
      setMediaStatus(photosResult.status === "fulfilled" || traditionResult.status === "fulfilled" ? "success" : "needs-verification");
    }
    void loadMediaAndMandalas();
    return () => {
      cancelled = true;
    };
  }, [profile?.id, session, traditionAssetForm.tradition_id]);

  useEffect(() => {
    let cancelled = false;
    async function loadBusinessModules() {
      if (!profile?.id || !hasProfileLiteSessionCredential(session)) {
        setServices([]);
        setOrders([]);
        setChatThreads([]);
        setServicesStatus("idle");
        setOrdersStatus("idle");
        setChatsStatus("idle");
        return;
      }
      setServicesStatus("loading");
      setOrdersStatus("loading");
      setChatsStatus("loading");
      const [servicesResult, ordersResult, chatsResult] = await Promise.allSettled([
        listOwnServices(profile.id, session),
        listOwnServiceOrders(profile.id, session),
        listOwnChatThreads(profile.id, session)
      ]);
      if (cancelled) return;
      if (servicesResult.status === "fulfilled") {
        setServices(servicesResult.value || []);
        setServicesStatus("success");
        setServicesError("");
      } else {
        setServices([]);
        setServicesStatus("needs-verification");
        setServicesError(moduleError(servicesResult.reason, "profile_cabinet_services request failed or migration/RLS not applied"));
      }
      if (ordersResult.status === "fulfilled") {
        setOrders(ordersResult.value || []);
        setOrdersStatus("success");
        setOrdersError("");
      } else {
        setOrders([]);
        setOrdersStatus("needs-verification");
        setOrdersError(moduleError(ordersResult.reason, "profile_cabinet_service_orders request failed or migration/RLS not applied"));
      }
      if (chatsResult.status === "fulfilled") {
        const threads = (chatsResult.value || []).map((thread) => ({ ...thread, ownerProfileId: profile.id }));
        setChatThreads(threads);
        setSelectedThreadId((current) => current || threads[0]?.conversation_id || "");
        setChatsStatus("success");
        setChatsError("");
      } else {
        setChatThreads([]);
        setChatsStatus("needs-verification");
        setChatsError(moduleError(chatsResult.reason, "profile_cabinet_chat_* request failed or migration/RLS not applied"));
      }
    }
    void loadBusinessModules();
    return () => {
      cancelled = true;
    };
  }, [profile?.id, session]);

  const handleGoogleLogin = async () => {
    setAuthError("");
    try {
      await signInWithGoogle(window.location.pathname === "/profile-lite" ? "/profile-lite" : "/profile");
    } catch (error) {
      setAuthStatus("error");
      setAuthError(safeProfileLiteError(error, "Не удалось начать вход через Google."));
    }
  };

  const handleSaveProfile = async (nextStatus = "draft") => {
    if (!user?.id || !hasProfileLiteSessionCredential(session)) return;
    setSaveStatus("loading");
    setSaveMessage("");
    setProfileError("");
    try {
      const saved = await saveOwnProfile(createProfileLiteSavePayload(form, user, nextStatus), session);
      setProfile(saved);
      setForm(createProfileLiteForm(saved, user));
      setProfileStatus("success");
      setSaveStatus("success");
      setSaveMessage(nextStatus === "pending" ? "Профиль отправлен на модерацию." : "Профиль сохранён.");
    } catch (error) {
      setSaveStatus("error");
      setProfileStatus("error");
      setProfileError(safeProfileLiteError(error, "Профиль не сохранился."));
    }
  };

  const handleMaterialStepChange = (value) => {
    const step = stepOptions.find((item) => item.id === value) || firstStep;
    const settings = settingsForStep(step?.id);
    setMaterialForm((current) => ({
      ...current,
      step_id: step?.id || "",
      step_title: step?.title || "",
      setting_title: settings[0]?.title || "",
      setting_index: settings.length > 0 ? 1 : null
    }));
  };

  const handleMaterialFieldChange = (field, value) => {
    if (field === "step_id") {
      handleMaterialStepChange(value);
      return;
    }
    setMaterialForm((current) => ({ ...current, [field]: value }));
  };

  const handleMaterialSave = async (nextStatus = "draft") => {
    if (!profile?.id || !hasProfileLiteSessionCredential(session)) {
      setMaterialsError("Сначала сохраните профиль мастера.");
      setMaterialsStatus("needs-verification");
      return;
    }
    try {
      let nextForm = materialForm;
      if (materialFile) {
        const uploaded = await uploadProfileMedia(materialFile, { profileId: profile.id, kind: "material" }, session);
        nextForm = { ...materialForm, image_url: uploaded.ref };
      }
      const saved = await createOwnMaterial(buildMaterialPayload(nextForm, profile.id, nextStatus), session);
      setMaterials((current) => [saved, ...current.filter((item) => item.id !== saved?.id)].filter(Boolean));
      setMaterialForm(EMPTY_MATERIAL);
      setMaterialFile(null);
      setMaterialsStatus("success");
      setMaterialsError("");
    } catch (error) {
      setMaterialsStatus("needs-verification");
      setMaterialsError(moduleError(error, "profile_cabinet_publications save failed or migration/RLS not applied"));
    }
  };

  const handleClientPhotoSave = async () => {
    if (!profile?.id || !hasProfileLiteSessionCredential(session)) {
      setMediaError("Сначала сохраните профиль мастера.");
      setMediaStatus("needs-verification");
      return;
    }
    try {
      let photo = {
        profile_id: profile.id,
        title: clientPhotoForm.title,
        image_url: clientPhotoForm.image_url,
        notes: clientPhotoForm.notes
      };
      if (clientPhotoForm.file) {
        validateProfileMediaFile(clientPhotoForm.file);
        const uploaded = await uploadProfileMedia(clientPhotoForm.file, { profileId: profile.id, kind: "client-goal" }, session);
        photo = {
          ...photo,
          image_url: "",
          image_bucket: uploaded.bucket,
          image_path: uploaded.path,
          mime_type: uploaded.metadata.mimeType,
          file_size_bytes: uploaded.metadata.size
        };
      }
      const saved = await createClientGoalPhoto(photo, accountPlan, session);
      setClientGoalPhotos((current) => [saved, ...current].filter(Boolean));
      setClientPhotoForm(EMPTY_CLIENT_PHOTO);
      setMediaStatus("success");
      setMediaError("");
    } catch (error) {
      setMediaStatus("needs-verification");
      setMediaError(moduleError(error, "profile_cabinet_client_goal_photos save failed or migration/RLS not applied"));
    }
  };

  const handleTraditionAssetSave = async () => {
    if (!profile?.id || !hasProfileLiteSessionCredential(session)) {
      setMediaError("Сначала сохраните профиль мастера.");
      setMediaStatus("needs-verification");
      return;
    }
    const tradition = mysteryTraditions.find((item) => item.id === traditionAssetForm.tradition_id);
    try {
      let asset = {
        profile_id: profile.id,
        tradition_id: tradition?.id || traditionAssetForm.tradition_id,
        tradition_title: tradition?.title || "",
        title: traditionAssetForm.title,
        image_url: traditionAssetForm.image_url,
        notes: traditionAssetForm.notes
      };
      if (traditionAssetForm.file) {
        validateProfileMediaFile(traditionAssetForm.file);
        const uploaded = await uploadProfileMedia(traditionAssetForm.file, { profileId: profile.id, kind: "tradition", traditionId: asset.tradition_id }, session);
        asset = {
          ...asset,
          image_url: "",
          image_bucket: uploaded.bucket,
          image_path: uploaded.path,
          mime_type: uploaded.metadata.mimeType,
          file_size_bytes: uploaded.metadata.size
        };
      }
      const saved = await createTraditionAsset(asset, session);
      setTraditionAssets((current) => [saved, ...current].filter(Boolean));
      setTraditionAssetForm(EMPTY_TRADITION_ASSET);
      setMediaStatus("success");
      setMediaError("");
    } catch (error) {
      setMediaStatus("needs-verification");
      setMediaError(moduleError(error, "profile_cabinet_tradition_assets save failed or migration/RLS not applied"));
    }
  };

  const handleLibraryClientPhotoUpload = async ({
    file,
    title = "",
    notes = "",
    destination = "clients",
    material = null
  }) => {
    if (destination === "materials") {
      if (!profile?.id || !hasProfileLiteSessionCredential(session)) {
        setMaterialsError("Сначала сохраните профиль мастера.");
        setMaterialsStatus("needs-verification");
        throw new Error("Сначала сохраните профиль мастера.");
      }

      try {
        validateProfileMediaFile(file);
        const uploaded = await uploadProfileMedia(file, { profileId: profile.id, kind: "material" }, session);
        const materialPayload = buildMaterialPayload({
          ...EMPTY_MATERIAL,
          type: material?.type || "mandala",
          title: title || file.name || "Материал",
          description: [material?.group, material?.category, material?.subcategory].filter(Boolean).join(" · "),
          image_url: uploaded.ref,
          step_id: material?.step_id || "",
          step_title: material?.step_title || "",
          setting_title: material?.setting_title || "",
          setting_index: material?.setting_index ?? null
        }, profile.id, "draft");
        const saved = await createOwnMaterial(materialPayload, session);
        setMaterials((current) => [saved, ...current.filter((item) => item.id !== saved?.id)].filter(Boolean));
        setMaterialsStatus("success");
        setMaterialsError("");
        return saved;
      } catch (error) {
        setMaterialsStatus("needs-verification");
        setMaterialsError(moduleError(error, "profile_cabinet_publications material upload failed or Storage/RLS not applied"));
        throw error;
      }
    }

    if (!profile?.id || !hasProfileLiteSessionCredential(session)) {
      setMediaError("Сначала сохраните профиль мастера.");
      setMediaStatus("needs-verification");
      throw new Error("Сначала сохраните профиль мастера.");
    }

    try {
      validateProfileMediaFile(file);
      const uploaded = await uploadProfileMedia(file, { profileId: profile.id, kind: "client-goal" }, session);
      const saved = await createClientGoalPhoto({
        profile_id: profile.id,
        title: title || file.name || "Фото клиента / цели",
        image_url: "",
        image_bucket: uploaded.bucket,
        image_path: uploaded.path,
        mime_type: uploaded.metadata.mimeType,
        file_size_bytes: uploaded.metadata.size,
        notes
      }, accountPlan, session);
      const savedImageRef = saved?.image_ref || uploaded.ref;
      const savedDisplayUrl = saved?.display_url || saved?.signed_url || uploaded.signedUrl;
      const savedPhoto = saved ? { ...saved, image_ref: savedImageRef, display_url: savedDisplayUrl } : null;
      setClientGoalPhotos((current) => [savedPhoto, ...current].filter(Boolean));
      setMediaStatus("success");
      setMediaError("");
      return savedPhoto;
    } catch (error) {
      setMediaStatus("needs-verification");
      setMediaError(moduleError(error, "profile_cabinet_client_goal_photos upload failed or Storage/RLS not applied"));
      throw error;
    }
  };

  const handleDeleteClientPhoto = async (photo) => {
    if (!profile?.id || !photo?.id || !hasProfileLiteSessionCredential(session)) return;
    const confirmed = window.confirm("Удалить фото из базы?");
    if (!confirmed) return;
    const deletedRefs = new Set([
      photo.src,
      photo.image_ref,
      photo.image_url,
      photo.displaySrc,
      photo.display_url,
      photo.signed_url
    ].filter(Boolean));
    try {
      await deleteClientGoalPhoto(photo.id, profile.id, session);
      setClientGoalPhotos((current) => current.filter((item) => item.id !== photo.id));
      setCompositionDraft((current) => {
        const centerRef = current.object_refs?.__center_image || "";
        const nextObjectRefs = { ...(current.object_refs || {}) };
        const nextObjectRefUrls = { ...(current.object_ref_urls || {}) };
        let changed = false;

        for (const [slotId, ref] of Object.entries(nextObjectRefs)) {
          if (deletedRefs.has(ref)) {
            delete nextObjectRefs[slotId];
            if (ref) delete nextObjectRefUrls[ref];
            changed = true;
          }
        }

        if (current.central_photo_id === photo.id) {
          delete nextObjectRefs.__center_image;
          if (centerRef) delete nextObjectRefUrls[centerRef];
          return { ...current, central_photo_id: "", object_refs: nextObjectRefs, object_ref_urls: nextObjectRefUrls };
        }

        return changed ? { ...current, object_refs: nextObjectRefs, object_ref_urls: nextObjectRefUrls } : current;
      });
    } catch (error) {
      setMediaStatus("needs-verification");
      setMediaError(moduleError(error, "delete client goal photo failed or RLS not applied"));
    }
  };

  const handleCompositionDraftChange = (field, value) => {
    setCompositionDraft((current) => {
      if (field === PROFILE_LITE_REPORT_REF_KEY) {
        return {
          ...current,
          object_refs: {
            ...(current.object_refs || {}),
            [PROFILE_LITE_REPORT_REF_KEY]: normalizeProfileLiteReport(value)
          }
        };
      }
      if (field === "field_scale") {
        return {
          ...current,
          field_scale: value,
          object_refs: {
            ...(current.object_refs || {}),
            __inner_field_scale: String(value)
          }
        };
      }
      if (field === "__center_image_scale") {
        return {
          ...current,
          __center_image_scale: value,
          object_refs: {
            ...(current.object_refs || {}),
            __center_image_scale: String(value)
          }
        };
      }
      if (field === "__center_window_scale") {
        return {
          ...current,
          __center_window_scale: value,
          object_refs: {
            ...(current.object_refs || {}),
            __center_window_scale: String(value)
          }
        };
      }
      if (field !== "slot_scale") return { ...current, [field]: value };
      return {
        ...current,
        slot_scale: value,
        object_refs: {
          ...(current.object_refs || {}),
          __slot_scale: String(value)
        }
      };
    });
  };

  const handleCompositionObjectRefsChange = (value) => {
    try {
      const refs = value.trim() ? JSON.parse(value) : {};
      setCompositionDraft((current) => ({ ...current, object_refs: refs }));
      setCompositionMessage("");
    } catch {
      setCompositionMessage("Object refs JSON: needs verification, исправьте формат JSON.");
    }
  };

  const setCompositionObjectRef = (slotId, value, displayUrl = "") => {
    setCompositionDraft((current) => ({
      ...current,
      object_refs: {
        ...(current.object_refs || {}),
        [slotId]: value
      },
      object_ref_urls: displayUrl && displayUrl !== value
        ? { ...(current.object_ref_urls || {}), [value]: displayUrl }
        : current.object_ref_urls
    }));
  };

  const handleCompositionCoverSelect = (layer, cover) => {
    const normalizeLayer = (item, fallbackId) => ({
      id: item?.id || fallbackId,
      label: item?.label || "Без фона",
      type: item?.type || "none",
      tone: item?.tone || "",
      src: item?.src || "",
      display_src: item?.display_src || item?.displaySrc || item?.src || ""
    });

    setCompositionDraft((current) => {
      const currentCover = current.cover_ref || {};
      const inner = normalizeLayer(currentCover.inner || currentCover, "no-cover");
      const outer = normalizeLayer(currentCover.outer || { id: "no-cover", label: "Без фона", type: "none" }, "no-cover");
      const nextLayerBase = normalizeLayer(cover, layer === "outer" ? "custom-outer-cover" : "custom-cover");
      const nextLayer = nextLayerBase.type === "image"
        ? { ...nextLayerBase, id: layer === "outer" ? "custom-outer-cover" : "custom-cover" }
        : nextLayerBase;
      const nextObjectRefUrls = (nextLayer.src && nextLayer.display_src && nextLayer.display_src !== nextLayer.src)
        ? { ...(current.object_ref_urls || {}), [nextLayer.src]: nextLayer.display_src }
        : current.object_ref_urls;
      return {
        ...current,
        cover_ref: {
          id: layer === "inner" ? nextLayer.id : inner.id,
          label: layer === "inner" ? nextLayer.label : inner.label,
          type: layer === "inner" ? nextLayer.type : inner.type,
          tone: layer === "inner" ? nextLayer.tone : inner.tone,
          src: layer === "inner" ? nextLayer.src : inner.src,
          display_src: layer === "inner" ? nextLayer.display_src : inner.display_src,
          inner: layer === "inner" ? nextLayer : inner,
          outer: layer === "outer" ? nextLayer : outer
        },
        object_ref_urls: nextObjectRefUrls
      };
    });
  };

  const handleUploadedCentralPhoto = async (file) => {
    try {
      const savedPhoto = await handleLibraryClientPhotoUpload({ file, notes: "Центр мандалы" });
      const savedImageRef = savedPhoto?.image_ref || savedPhoto?.image_url || "";
      const savedDisplayUrl = savedPhoto?.display_url || savedPhoto?.signed_url || savedPhoto?.image_url || savedImageRef;
      setCompositionDraft((current) => ({
        ...current,
        central_photo_id: savedPhoto?.id || "",
        object_refs: { ...(current.object_refs || {}), __center_image: savedImageRef },
        object_ref_urls: { ...(current.object_ref_urls || {}), [savedImageRef]: savedDisplayUrl }
      }));
      setMediaStatus("success");
      setMediaError("");
      return savedPhoto;
    } catch (error) {
      setMediaStatus("needs-verification");
      setMediaError(moduleError(error, "central photo upload failed or Storage/RLS not applied"));
      throw error;
    }
  };

  const handleCompositionObjectFileUpload = async (slotId, file) => {
    try {
      const savedPhoto = await handleLibraryClientPhotoUpload({ file, notes: `Объект мандалы: ${slotId}` });
      const savedImageRef = savedPhoto?.image_ref || savedPhoto?.image_url || "";
      const savedDisplayUrl = savedPhoto?.display_url || savedPhoto?.signed_url || savedPhoto?.image_url || savedImageRef;
      setCompositionObjectRef(slotId, savedImageRef, savedDisplayUrl);
      setMandalasStatus("success");
      setMandalasError("");
      return savedPhoto;
    } catch (error) {
      setMandalasStatus("needs-verification");
      setMandalasError(moduleError(error, "power place object upload failed or Storage/RLS not applied"));
      throw error;
    }
  };

  const handleCompositionCoverFileUpload = async (layer, file) => {
    try {
      const savedPhoto = await handleLibraryClientPhotoUpload({ file, notes: `Фон мандалы: ${layer}` });
      const savedImageRef = savedPhoto?.image_ref || savedPhoto?.image_url || "";
      const savedDisplayUrl = savedPhoto?.display_url || savedPhoto?.signed_url || savedPhoto?.image_url || savedImageRef;
      handleCompositionCoverSelect(layer, {
        id: layer === "outer" ? "custom-outer-cover" : "custom-cover",
        label: "Своё изображение",
        type: "image",
        src: savedImageRef,
        display_src: savedDisplayUrl
      });
      setMandalasStatus("success");
      setMandalasError("");
      return savedPhoto;
    } catch (error) {
      setMandalasStatus("needs-verification");
      setMandalasError(moduleError(error, "power place cover upload failed or Storage/RLS not applied"));
      throw error;
    }
  };

  const handleCompositionLoad = (composition) => {
    setCompositionDraft({
      ...EMPTY_COMPOSITION,
      ...composition,
      id: composition.id || "",
      object_refs: composition.object_refs || {},
      object_ref_urls: composition.object_ref_urls || {}
    });
    setCompositionMessage("Сохранённая мандала открыта в конструкторе.");
  };

  const refreshSavedCompositions = async (saved) => {
    const freshCompositions = await listPowerPlaceCompositions(profile.id, session);
    const freshSaved = freshCompositions.find((composition) => composition.id === saved?.id) || saved;
    setPowerPlaceCompositions(freshCompositions.length
      ? freshCompositions
      : [saved].filter(Boolean)
    );
    if (freshSaved) {
      setCompositionDraft({ ...EMPTY_COMPOSITION, ...freshSaved, id: freshSaved?.id || "" });
    }
    return freshSaved;
  };

  const handleCompositionSaveNew = async () => {
    if (!profile?.id || !hasProfileLiteSessionCredential(session)) {
      setMandalasError("Сначала сохраните профиль мастера.");
      setMandalasStatus("needs-verification");
      return;
    }
    const currentSavedCompositionCount = powerPlaceCompositions.length;
    const currentCompositionLimit = planLimits.compositions || getPlanLimits(accountPlan).compositions;
    if (currentSavedCompositionCount >= currentCompositionLimit) {
      setMandalasStatus("needs-verification");
      setMandalasError(POWER_PLACE_START_LIMIT_MESSAGE);
      setCompositionMessage(POWER_PLACE_START_LIMIT_MESSAGE);
      return;
    }
    setMandalasError("");
    let saved = null;
    try {
      const createPayload = {
        ...compositionDraft,
        id: undefined,
        title: uniqueCompositionCopyTitle(compositionDraft.title, powerPlaceCompositions),
        profile_id: profile.id
      };
      delete createPayload.id;
      saved = await createPowerPlaceComposition(createPayload, accountPlan, session);
      if (!saved?.id) {
        setMandalasStatus("needs-verification");
        setMandalasError("Место силы не сохранилось: сервер не вернул запись. Проверьте Supabase RLS/migration.");
        return;
      }
      setPowerPlaceCompositions((current) => {
        const without = current.filter((item) => item.id !== saved.id);
        return [saved, ...without];
      });
      setCompositionDraft((current) => ({ ...EMPTY_COMPOSITION, ...saved, id: saved.id, object_refs: saved.object_refs || current.object_refs || {}, object_ref_urls: saved.object_ref_urls || current.object_ref_urls || {} }));
      setCompositionMessage("Место силы сохранено и добавлено в Мои мандалы.");
      setMandalasStatus("success");
    } catch (error) {
      setMandalasStatus("needs-verification");
      setMandalasError("Место силы не сохранилось: " + moduleError(error, "profile_cabinet_power_place_compositions create failed or migration/RLS not applied"));
      return;
    }
    try {
      await refreshSavedCompositions(saved);
    } catch {
      // refresh failed but composition was created — keep the optimistic state
    }
  };

  const handleCompositionUpdateExisting = async () => {
    if (!profile?.id || !hasProfileLiteSessionCredential(session)) {
      setMandalasError("Сначала сохраните профиль мастера.");
      setMandalasStatus("needs-verification");
      return;
    }
    if (!compositionDraft.id) {
      setCompositionMessage("Сначала откройте сохранённую мандалу.");
      return;
    }
    try {
      const payload = { ...compositionDraft, profile_id: profile.id };
      const saved = await updatePowerPlaceComposition(compositionDraft.id, payload, session);
      await refreshSavedCompositions(saved);
      setCompositionMessage("Место силы обновлено.");
      setMandalasStatus("success");
      setMandalasError("");
    } catch (error) {
      setMandalasStatus("needs-verification");
      setMandalasError(moduleError(error, "profile_cabinet_power_place_compositions update failed or migration/RLS not applied"));
    }
  };

  const handleAddCompositionToServices = async (composition) => {
    if (!composition?.id) {
      setCompositionMessage("Сначала сохраните мандалу.");
      return;
    }
    if (!profile?.id || !hasProfileLiteSessionCredential(session)) {
      setServicesError("Сначала сохраните профиль мастера.");
      setServicesStatus("needs-verification");
      return;
    }
    const duplicate = services.find((service) => service.composition_id && String(service.composition_id) === String(composition.id));
    if (duplicate) {
      setCompositionMessage("Эта мандала уже есть в Моих услугах.");
      return;
    }
    const imageUrl = (composition.cover_ref?.inner?.src || composition.cover_ref?.src) || "";
    try {
      const saved = await createOwnService({
        profile_id: profile.id,
        composition_id: composition.id,
        title: composition.title || "Мандала Места Силы",
        description: "Услуга подготовлена из сохранённой мандалы.",
        image_url: imageUrl,
        status: "draft"
      }, session);
      if (saved) {
        setServices((current) => [saved, ...current.filter((item) => item.id !== saved.id)].filter(Boolean));
        setServicesStatus("success");
        setServicesError("");
      }
      setCompositionMessage("Мандала добавлена в Мои услуги.");
    } catch (error) {
      setServicesStatus("needs-verification");
      setServicesError(moduleError(error, "profile_cabinet_services create failed or migration/RLS not applied"));
      setCompositionMessage("Не удалось добавить в Мои услуги: " + moduleError(error, "profile_cabinet_services request failed"));
    }
  };

  const handleSendCompositionToServices = () => {
    setServiceForm((current) => ({
      ...current,
      profile_id: profile?.id || "",
      composition_id: compositionDraft.id || "",
      title: compositionDraft.title || "Мандала Места Силы",
      description: current.description || "Услуга подготовлена из сохранённой мандалы.",
      image_url: compositionDraft.cover_ref?.src || ""
    }));
    handleProfileLiteTabNavigate({ id: "services", href: getProfileLiteRouteByTabId("services") });
  };

  const handleProfileLiteTabNavigate = (tab) => {
    const nextTab = getProfileLiteTabById(tab?.id);
    const href = tab?.href || getProfileLiteRouteByTabId(nextTab.id);
    setActiveTab(nextTab.id);
    if (typeof window !== "undefined" && window.location.pathname + window.location.search !== href) {
      window.history.pushState({}, "", href);
      window.dispatchEvent(new Event(ROUTE_CHANGE_EVENT));
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleDownloadComposition = () => {
    try {
      openPowerPlacePdfPrintView(compositionDraft.title || "power-place");
      setCompositionMessage("Скачать PDF / Печать в PDF: в открывшемся окне выберите Save as PDF.");
    } catch (error) {
      setCompositionMessage(moduleError(error, "PDF preview failed"));
    }
  };

  const handlePrintComposition = () => {
    const cleanup = () => document.body.classList.remove("printMandalaOnly");
    document.body.classList.add("printMandalaOnly");
    window.addEventListener("afterprint", cleanup, { once: true });
    window.print();
    window.setTimeout(cleanup, 1200);
  };

  const handleServiceSave = async (nextStatus = "draft") => {
    if (!profile?.id || !hasProfileLiteSessionCredential(session)) {
      setServicesError("Сначала сохраните профиль мастера.");
      setServicesStatus("needs-verification");
      return;
    }
    try {
      const saved = await createOwnService({ ...serviceForm, profile_id: profile.id, status: nextStatus }, session);
      setServices((current) => [saved, ...current.filter((item) => item.id !== saved?.id)].filter(Boolean));
      setServiceForm(createEmptyServiceForm());
      setServicesStatus("success");
      setServicesError("");
    } catch (error) {
      setServicesStatus("needs-verification");
      setServicesError(moduleError(error, "profile_cabinet_services request failed or migration/RLS not applied"));
    }
  };

  const handleServicePublish = async () => {
    if (!profile?.id || !hasProfileLiteSessionCredential(session)) return;
    try {
      const saved = await publishOwnService({ ...serviceForm, profile_id: profile.id }, null, session);
      setServices((current) => [saved, ...current.filter((item) => item.id !== saved?.id)].filter(Boolean));
      setServiceForm(createEmptyServiceForm());
      setServicesStatus("success");
      setServicesError("");
    } catch (error) {
      setServicesStatus("needs-verification");
      setServicesError(moduleError(error, "profile_cabinet_services publish failed or migration/RLS not applied"));
    }
  };

  const handleOrderUpdate = async () => {
    if (!orderPatch.id || !hasProfileLiteSessionCredential(session)) return;
    try {
      const saved = await updateServiceOrder(orderPatch.id, orderPatch, session);
      setOrders((current) => current.map((item) => item.id === saved.id ? saved : item));
      setOrderPatch(EMPTY_ORDER_PATCH);
      setOrdersStatus("success");
      setOrdersError("");
    } catch (error) {
      setOrdersStatus("needs-verification");
      setOrdersError(moduleError(error, "profile_cabinet_service_orders update failed or migration/RLS not applied"));
    }
  };

  const handleSendMessage = async (thread) => {
    if (!thread?.conversation_id || !profile?.id || !chatDraft.trim() || !hasProfileLiteSessionCredential(session)) return;
    try {
      const message = await sendChatMessage(thread.conversation_id, profile.id, chatDraft, session);
      setChatThreads((current) => current.map((item) => item.conversation_id === thread.conversation_id
        ? { ...item, messages: [...(item.messages || []), message].filter(Boolean) }
        : item));
      setChatDraft("");
      setChatsStatus("success");
      setChatsError("");
    } catch (error) {
      setChatsStatus("needs-verification");
      setChatsError(moduleError(error, "profile_cabinet_chat_messages send failed or migration/RLS not applied"));
    }
  };

  if (!user || authStatus !== "success") {
    return (
      <div className="cabinetShell profileLiteShell profileLiteFullShell">
        <header className="cabinetTopbar">
          <button type="button" onClick={onNavigateHome}>На главную</button>
          <div>
            <p>Альтернативный кабинет</p>
            <h1>Кабинет мастера Lite</h1>
          </div>
          <button type="button" onClick={onNavigateMasters}>Мастера</button>
        </header>
        <main className="cabinetMain profileLiteMain">
          <section className="cabinetCard profileLitePanel">
            <p className="cabinetEyebrow">Auth flow</p>
            <h2>Вход в кабинет</h2>
            {!supabaseEnv.isConfigured && <div className="cabinetNotice compactNotice">Supabase не настроен. Кабинет не зависает и ждёт настройки окружения.</div>}
            {authStatus === "loading" && <div className="cabinetNotice compactNotice">Сессия найдена, открываю оболочку...</div>}
            {authError && <div className="cabinetError">{authError}</div>}
            <div className="cabinetActions">
              <button className="cabinetGoogle" type="button" onClick={handleGoogleLogin} disabled={!supabaseEnv.isConfigured}>Войти через Google</button>
              <button className="cabinetSecondary" type="button" onClick={resetLocalState}>Сбросить сессию</button>
              <button className="cabinetGhost" type="button" onClick={refreshShell}>Повторить</button>
            </div>
          </section>
          <ProfileLiteDiagnosticsModule diagnostics={diagnostics} moduleStates={moduleStates} />
        </main>
      </div>
    );
  }

  const moduleProps = {
    activeSettings,
    accountPlan,
    chatDraft,
    chatThreads,
    chatsError,
    chatsStatus,
    clientGoalPhotos,
    clientPhotoForm,
    compositionDraft,
    compositionMessage,
    form,
    materialFile,
    materialForm,
    materials,
    materialsError,
    materialsStatus,
    mediaError,
    mediaStatus,
    moduleStates,
    orderPatch,
    orders,
    ordersError,
    ordersStatus,
    planLimits,
    powerPlaceCompositions,
    profile,
    profileError,
    profileStatus,
    saveMessage,
    saveStatus,
    selectedThreadId,
    serviceForm,
    services,
    servicesError,
    servicesStatus,
    session,
    stepOptions,
    traditionAssetForm,
    traditionAssets,
    user
  };

  const renderedModule = {
    overview: <ProfileLiteOverview {...moduleProps} />,
    profile: (
      <ProfileLiteProfileModule
        {...moduleProps}
        onFieldChange={(field, value) => setForm((current) => ({ ...current, [field]: value }))}
        onSave={handleSaveProfile}
      />
    ),
    mandalas: (
      <ProfileLiteMandalasModule
        {...moduleProps}
        onClientPhotoDelete={handleDeleteClientPhoto}
        onCompositionCoverSelect={handleCompositionCoverSelect}
        onCompositionDraftChange={handleCompositionDraftChange}
        onCompositionLoad={handleCompositionLoad}
        onCompositionObjectRefSelect={setCompositionObjectRef}
        onCompositionObjectRefsChange={handleCompositionObjectRefsChange}
        onCoverFileUpload={handleCompositionCoverFileUpload}
        onAddCompositionToServices={handleAddCompositionToServices}
        onDownload={handleDownloadComposition}
        onLibraryPhotoUpload={handleLibraryClientPhotoUpload}
        onObjectFileUpload={handleCompositionObjectFileUpload}
        onPrint={handlePrintComposition}
        onSaveNew={handleCompositionSaveNew}
        onSendToServices={handleSendCompositionToServices}
        onUpdateExisting={handleCompositionUpdateExisting}
        onUploadedCentralPhoto={handleUploadedCentralPhoto}
      />
    ),
    media: (
      <ProfileLiteMediaModule
        {...moduleProps}
        onClientPhotoDelete={handleDeleteClientPhoto}
        onClientPhotoFieldChange={(field, value) => setClientPhotoForm((current) => ({ ...current, [field]: value }))}
        onClientPhotoFileChange={(event) => setClientPhotoForm((current) => ({ ...current, file: event.target.files?.[0] || null, image_url: event.target.files?.[0] ? "" : current.image_url }))}
        onClientPhotoSave={handleClientPhotoSave}
        onTraditionAssetFieldChange={(field, value) => setTraditionAssetForm((current) => ({ ...current, [field]: value }))}
        onTraditionAssetFileChange={(event) => setTraditionAssetForm((current) => ({ ...current, file: event.target.files?.[0] || null, image_url: event.target.files?.[0] ? "" : current.image_url }))}
        onTraditionAssetSave={handleTraditionAssetSave}
      />
    ),
    materials: (
      <ProfileLiteMaterialsModule
        {...moduleProps}
        onFieldChange={handleMaterialFieldChange}
        onFileChange={(event) => {
          const file = event.target.files?.[0] || null;
          setMaterialFile(file);
          if (file) setMaterialForm((current) => ({ ...current, image_url: "" }));
        }}
        onSave={handleMaterialSave}
      />
    ),
    services: (
      <ProfileLiteServicesModule
        {...moduleProps}
        onFieldChange={(field, value) => setServiceForm((current) => ({ ...current, [field]: value }))}
        onPublish={handleServicePublish}
        onSave={handleServiceSave}
      />
    ),
    orders: (
      <ProfileLiteOrdersModule
        {...moduleProps}
        onOrderPatchChange={(patch) => setOrderPatch({
          id: patch.id || "",
          master_comment: patch.master_comment || "",
          result_image_url: patch.result_image_url || "",
          result_image_bucket: patch.result_image_bucket || null,
          result_image_path: patch.result_image_path || null,
          status: patch.status || "sent"
        })}
        onOrderUpdate={handleOrderUpdate}
      />
    ),
    chats: (
      <ProfileLiteChatsModule
        {...moduleProps}
        onChatDraftChange={setChatDraft}
        onSendMessage={handleSendMessage}
        onThreadSelect={setSelectedThreadId}
      />
    ),
    settings: <ProfileLiteSettingsModule {...moduleProps} onReset={resetLocalState} />,
    diagnostics: <ProfileLiteDiagnosticsModule diagnostics={diagnostics} moduleStates={moduleStates} />
  }[activeTab] || <ProfileLiteOverview {...moduleProps} />;
  const activeTabMeta = getProfileLiteTabById(activeTab);
  const renderModuleWithShellChrome = (shellChrome) => (
    <ProfileLiteModuleErrorBoundary boundaryKey={activeTab} moduleLabel={activeTabMeta.label}>
      {React.isValidElement(renderedModule) ? React.cloneElement(renderedModule, { shellChrome }) : renderedModule}
    </ProfileLiteModuleErrorBoundary>
  );

  return (
    <ProfileLiteShell
      activeTab={activeTab}
      authStatus={authStatus}
      onNavigateHome={onNavigateHome}
      onNavigateMasters={onNavigateMasters}
      onRefresh={refreshShell}
      onReset={resetLocalState}
      onTabNavigate={handleProfileLiteTabNavigate}
      profile={profile}
      user={user}
    >
      {renderModuleWithShellChrome}
    </ProfileLiteShell>
  );
}
