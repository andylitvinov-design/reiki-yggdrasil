import React, { useEffect, useMemo, useState } from "react";
import { extractCssUrls } from "../lib/printUtils.js";
import { reikiLevels } from "../data/reikiKnowledgeBase.js";
import { sourcedStepSettings } from "../data/reikiStepSettings.js";
import { mysteryTraditions } from "../data/mysteryTraditions.js";
import {
  listAvailableCourseLessons,
  listAvailableCoursesForProfile,
  listAvailableCourseSteps
} from "../lib/profileCoursesClient.js";
import {
  DB_SAFE_GRIMOIRE_TYPE,
  buildGrimoireDescriptionValue,
  buildMaterialUploadPublicationPayload,
  createEmptyMaterialForm,
  createOwnMaterial,
  deleteOwnMaterial,
  detectMaterialTypeFromFile,
  listOwnMaterials,
  normalizeGrimoireTaxonomy,
  normalizeMaterialForm,
  stripFileExtension,
  updateOwnMaterial
} from "../lib/profileMaterialsClient.js";
import {
  buildMaterialActivityEvent,
  buildPowerPlaceActivityEvent,
  buildServiceActivityEvent,
  createOrUpdatePendingActivityEvent
} from "../lib/profileActivityFeedClient.js";
import { validateGrimoireFile } from "../lib/profileMediaClient.js";
import {
  createEmptyServiceForm,
  buildClientDirectoryFromOrders,
  claimClientInvite,
  createClientInvite,
  createServiceCartStore,
  createServiceOrderDraft,
  createOwnService,
  generateDraftResultComposition,
  listClientServiceOrders,
  listOwnClientInvites,
  listOwnServiceOrders,
  listOwnServices,
  PENDING_CLIENT_INVITE_KEY,
  publishOwnService,
  sendOrderResultToClient,
  submitServiceOrderToMaster,
  updateOwnService,
  upsertOwnServiceForComposition
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
  deletePowerPlaceComposition,
  filterMasterPowerPlaceCompositions,
  getPlanLimits,
  getPowerPlaceCompositionById,
  listClientGoalPhotos,
  listPowerPlaceCompositions,
  listTraditionAssets,
  updateClientGoalPhotoCategory,
  updatePowerPlaceComposition
} from "../lib/powerPlaceClient.js";
import { uploadProfileMedia, validateProfileMediaFile } from "../lib/profileMediaClient.js";
import { loadProfileCabinetBootstrap } from "../lib/profileBootstrapClient.js";
import {
  createConversationWithMaster,
  listApprovedMasterProfiles,
  listOwnChatThreads,
  sendChatMessage
} from "../lib/masterChatClient.js";
import {
  createProfileLiteDiagnostics,
  createProfileLiteForm,
  createProfileLiteSavePayload,
  getProfileLiteInitialRoleFromLocation,
  getProfileLiteTabById,
  getProfileLiteRoleById,
  getProfileLiteRoleForTab,
  getProfileLiteRouteByTabId,
  hasProfileLiteSessionCredential,
  safeProfileLiteError
} from "../lib/profileLiteClient.js";
import {
  canCreateWithinPlanLimit,
  isPaidServiceDraft,
  masterPlanLimitMessage,
  resolveProfileMasterPlan
} from "../lib/masterPlans.js";
import ProfileLiteShell from "./profile-lite/ProfileLiteShell.jsx";
import ProfileLiteOverview from "./profile-lite/ProfileLiteOverview.jsx";
import ProfileLiteProfileModule from "./profile-lite/ProfileLiteProfileModule.jsx";
import ProfileLiteMandalasModule from "./profile-lite/ProfileLiteMandalasModule.jsx";
import ProfileLiteMediaModule from "./profile-lite/ProfileLiteMediaModule.jsx";
import ProfileLiteMaterialsModule from "./profile-lite/ProfileLiteMaterialsModule.jsx";
import ProfileLiteCoursesModule from "./profile-lite/ProfileLiteCoursesModule.jsx";
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
const EMPTY_CLIENT_PHOTO = { title: "", image_url: "", notes: "", client_category: "all", file: null };
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
  field_layout: "square",
  constructor_type: "zodiac",
  geometry: 4,
  zodiac_variant: "classic-12",
  zodiac_visible_count: 12,
  altar_center_ratio: "1",
  business_vertex_zone_count: 1,
  star_variant: "closed",
  star_format_variant: "classic",
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
const FIELD_LAYOUT_REF_KEY = "__field_layout";
const VISIBILITY_SETTINGS_REF_KEY = "__visibility_settings";
const MOTION_SETTINGS_REF_KEY = "__motion_settings";
const DAO_LAYOUT_OPTIONS_REF_KEY = "__dao_layout_options";
const DAO_LAYOUT_TEMPLATE_OPTIONS_REF_KEY = "__dao_layout_template_options";
const VALID_FIELD_LAYOUTS = ["square", "vertical", "horizontal", "rectangle"];
const VALID_MOTION_MODES = ["photo", "video"];
const VALID_VIDEO_COUNTS = [1, 4];
const VALID_VIDEO_DIRECTIONS = ["clockwise", "counterclockwise"];
const VALID_VIDEO_STEP_SECONDS = [1, 2, 3];
const VALID_DAO_LAYOUT_TEMPLATE_TOP_CROWNS = ["roof_double_line", "three_checks"];
const VALID_DAO_LAYOUT_TEMPLATE_SIDE_NODE_COUNTS = [2, 3];
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
const EMPTY_ORDER_PATCH = {
  id: "",
  master_comment: "",
  result_image_url: "",
  result_image_bucket: null,
  result_image_path: null,
  status: "sent"
};
const EMPTY_ORDER_CONFIRMATION = {
  orderId: "",
  photoId: "",
  requestText: "",
  status: "idle",
  message: ""
};
const EMPTY_CLIENT_SAVE_FORM = {
  isOpen: false,
  clientKey: "",
  clientName: "",
  requestText: "",
  clientPhotoId: "",
  status: "idle",
  message: ""
};
const EMPTY_CLIENT_INVITE_FORM = {
  client_name: "",
  service_id: "",
  service_order_id: "",
  expires_at: ""
};
const POWER_PLACE_LIMIT_HELP = "Выберите мандалу из списка и нажмите «Обновить» или удалите одну мандалу.";
const ROUTE_CHANGE_EVENT = "reiki-route-change";
const POWER_PLACE_SAVE_STAGE_MESSAGES = {
  clicked: "Нажали сохранить…",
  profile: "Проверяем профиль…",
  limit: "Проверяем лимит…",
  countRows: "Проверяем лимит…",
  POST: "Отправляем в Supabase…",
  insertReturned: "Supabase вернул запись…",
  hydrate: "Supabase вернул запись…",
  refresh: "Обновляем список…",
  success: "Сохранено."
};
const POWER_PLACE_SAVE_STAGE_LABELS = {
  profile: "Проверяем профиль",
  limit: "Проверяем лимит",
  countRows: "Проверяем лимит",
  POST: "Отправляем в Supabase",
  insertReturned: "Supabase вернул запись",
  hydrate: "Подготовка изображений",
  refresh: "Обновляем список",
  response: "Ответ Supabase"
};

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

function powerPlaceSaveStageLabel(stage) {
  return POWER_PLACE_SAVE_STAGE_LABELS[stage] || String(stage || "Сохранение");
}

function powerPlaceSaveFailureMessage(stage, error, fallback) {
  const stageLabel = powerPlaceSaveStageLabel(stage);
  const safeMessage = moduleError(error, fallback);
  return `Не сохранилось на этапе: ${stageLabel}. ${safeMessage}`;
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

function normalizeFieldLayout(value) {
  const layout = String(value || "").trim();
  return VALID_FIELD_LAYOUTS.includes(layout) ? layout : "square";
}

function normalizeMotionSettings(value) {
  const source = value && typeof value === "object" && !Array.isArray(value) ? value : {};
  const mode = VALID_MOTION_MODES.includes(String(source.mode || "").trim()) ? String(source.mode).trim() : EMPTY_MOTION_SETTINGS.mode;
  const count = Number(source.count);
  const direction = VALID_VIDEO_DIRECTIONS.includes(String(source.direction || "").trim()) ? String(source.direction).trim() : EMPTY_MOTION_SETTINGS.direction;
  const stepSeconds = Number(source.step_seconds);
  const videoBackgroundRef = String(source.video_background_ref || "").trim();
  const safeVideoBackgroundRef = videoBackgroundRef.startsWith("storage://") && !videoBackgroundRef.startsWith("data:") ? videoBackgroundRef : "";

  return {
    mode,
    count: VALID_VIDEO_COUNTS.includes(count) ? count : EMPTY_MOTION_SETTINGS.count,
    direction,
    step_seconds: VALID_VIDEO_STEP_SECONDS.includes(stepSeconds) ? stepSeconds : EMPTY_MOTION_SETTINGS.step_seconds,
    video_background_ref: safeVideoBackgroundRef
  };
}

function normalizeDaoLayoutTemplateOptions(value) {
  const source = value && typeof value === "object" && !Array.isArray(value) ? value : {};
  const sideNodeCount = Number(source.sideNodeCount);
  return {
    topCrown: VALID_DAO_LAYOUT_TEMPLATE_TOP_CROWNS.includes(String(source.topCrown || "").trim()) ? String(source.topCrown).trim() : "roof_double_line",
    sideNodesVisible: source.sideNodesVisible === false ? false : true,
    sideNodeCount: VALID_DAO_LAYOUT_TEMPLATE_SIDE_NODE_COUNTS.includes(sideNodeCount) ? sideNodeCount : 2
  };
}

function normalizePowerPlaceDraftForRuntime(composition) {
  const objectRefs = composition?.object_refs && typeof composition.object_refs === "object" && !Array.isArray(composition.object_refs)
    ? composition.object_refs
    : {};
  const legacyDaoLayout = objectRefs.__dao_style === "dao-layout-template";
  if (!legacyDaoLayout && composition?.constructor_type !== "dao-layout") return composition;
  return {
    ...composition,
    constructor_type: "dao-layout",
    object_refs: {
      ...objectRefs,
      __dao_style: legacyDaoLayout ? "style-1" : objectRefs.__dao_style,
      [DAO_LAYOUT_OPTIONS_REF_KEY]: normalizeDaoLayoutTemplateOptions(objectRefs[DAO_LAYOUT_OPTIONS_REF_KEY] || objectRefs[DAO_LAYOUT_TEMPLATE_OPTIONS_REF_KEY])
    }
  };
}

function withDefaultMotionSettings(composition) {
  const source = normalizePowerPlaceDraftForRuntime(composition || {});
  const objectRefs = source.object_refs && typeof source.object_refs === "object" && !Array.isArray(source.object_refs)
    ? source.object_refs
    : {};
  return {
    ...source,
    object_refs: {
      ...objectRefs,
      [MOTION_SETTINGS_REF_KEY]: normalizeMotionSettings(objectRefs[MOTION_SETTINGS_REF_KEY])
    }
  };
}

function fieldLayoutFromComposition(composition) {
  return normalizeFieldLayout(composition?.field_layout ?? composition?.object_refs?.[FIELD_LAYOUT_REF_KEY]);
}

function slotScaleFromComposition(composition) {
  return composition?.slot_scale ?? composition?.object_refs?.__slot_scale ?? composition?.chess_slot_scale ?? EMPTY_COMPOSITION.slot_scale;
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

function cssBackgroundUrl(value) {
  const match = String(value || "").match(/url\((['"]?)(.*?)\1\)/);
  return match?.[2] || "";
}

function isPrintablePhotoLayer(element) {
  return Boolean(element?.matches?.([
    ".powerCenterPhoto.hasImage",
    ".altarCenterPhoto.hasImage",
    ".businessCenterPhoto.hasImage",
    ".zodiacCenterPhoto.hasImage",
    ".starCenterPhoto.hasImage",
    ".daoCenterPhoto.hasImage",
    ".power-place-chess__center.hasImage",
    ".power-place-chess__slot.hasImage",
    ".powerSource.hasImage",
    ".altarTopSource.hasImage",
    ".altarSupportSource.hasImage",
    ".businessVertexZone.hasImage",
    ".zodiacPositionImage[style]",
    ".zodiacFieldPlusPositionImage[style]",
    ".zodiacInnerPositionImage[style]",
    ".zodiacRibbonCellImage[style]",
    ".starPositionImage[style]",
    ".daoElementImage.hasImage",
    ".has-custom-inner-cover",
    ".has-custom-outer-cover"
  ].join(",")));
}

function injectPrintablePhotoImages(sourceArea, clonedArea) {
  const sourceNodes = Array.from(sourceArea.querySelectorAll("*"));
  const clonedNodes = Array.from(clonedArea.querySelectorAll("*"));
  const injectedUrls = [];

  sourceNodes.forEach((sourceNode, index) => {
    if (!isPrintablePhotoLayer(sourceNode)) return;
    const clonedNode = clonedNodes[index];
    if (!clonedNode) return;

    const style = window.getComputedStyle(sourceNode);
    const imageUrl = cssBackgroundUrl(style.backgroundImage || sourceNode.style.backgroundImage);
    if (!imageUrl || imageUrl.endsWith(".svg") || imageUrl.includes("/symbols/")) return;

    const img = clonedArea.ownerDocument.createElement("img");
    img.src = imageUrl;
    img.alt = "";
    img.decoding = "async";
    img.loading = "eager";
    img.setAttribute("aria-hidden", "true");
    Object.assign(img.style, {
      position: "absolute",
      inset: "0",
      width: "100%",
      height: "100%",
      maxWidth: "none",
      objectFit: style.backgroundSize.includes("contain") ? "contain" : "cover",
      objectPosition: style.backgroundPosition || "50% 50%",
      borderRadius: "inherit",
      filter: style.filter === "none" ? "" : style.filter,
      transform: "translateZ(0)",
      pointerEvents: "none",
      zIndex: "0"
    });

    clonedNode.style.position = style.position === "static" ? "relative" : style.position;
    clonedNode.style.overflow = "hidden";
    clonedNode.style.backgroundImage = "none";
    clonedNode.insertBefore(img, clonedNode.firstChild);
    injectedUrls.push(imageUrl);
  });

  return injectedUrls;
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
  // window.open must stay synchronous on the click event stack (popup blocker)
  const printWindow = window.open("", "_blank", "width=980,height=900");
  if (!printWindow) throw new Error("Разрешите всплывающее окно для печати в PDF.");

  // Write skeleton HTML synchronously so the popup isn't blank while waiting
  printWindow.document.open();
  printWindow.document.write(`<!doctype html>
<html lang="ru">
<head>
  <meta charset="utf-8">
  <title>${escapeHtml(filename)}</title>
  ${collectPrintableStyles()}
  <style>
    body{margin:0;background:#fffaf0;color:#2f2418}
    body.printMandalaOnly .powerPlacePdfOnlyArea{position:static!important;width:100%!important;min-height:auto!important;height:auto!important;break-inside:avoid;page-break-inside:avoid}
    @page{size:auto;margin:10mm}
    #pdfStatus{position:fixed;top:0;left:0;right:0;padding:12px;background:#f5f0e8;text-align:center;font-family:sans-serif;font-size:14px;color:#5a4030;z-index:9999}
    @media print{html,body{margin:0!important;padding:0!important;background:#fff!important}#pdfStatus{display:none!important}.powerPlacePdfOnlyArea{break-inside:avoid;page-break-inside:avoid;margin:0 auto!important}}
  </style>
</head>
<body class="printMandalaOnly">
  <div id="pdfStatus">Подготовка PDF: загружаем изображения…</div>
  <main aria-label="Скачать PDF / Печать в PDF"></main>
</body>
</html>`);
  printWindow.document.close();

  // Double RAF ensures React has flushed the latest slider state into the DOM
  // before we clone it, so print/PDF always reflects the current unsaved layout.
  return raf2(window)
    .then(() => {
      const freshPrintArea = document.querySelector(".profileLitePowerPlace .powerPlacePrintArea") || document.querySelector(".powerPlacePrintArea");
      if (!freshPrintArea) throw new Error("Макет мандалы не найден.");
      const clonedArea = freshPrintArea.cloneNode(true);
      clonedArea.classList.add("powerPlacePdfOnlyArea");
      const injectedImageUrls = injectPrintablePhotoImages(freshPrintArea, clonedArea);
      const imageUrls = Array.from(new Set([...extractCssUrls(freshPrintArea), ...injectedImageUrls]));
      printWindow.document.querySelector("main")?.appendChild(printWindow.document.importNode(clonedArea, true));
      return Promise.all([
        preloadImagesForPrint(imageUrls),
        printWindow.document.fonts?.ready ?? Promise.resolve(),
      ]);
    })
    .then(() => raf2(printWindow))
    .then(() => {
      const status = printWindow.document.getElementById("pdfStatus");
      if (status) status.style.display = "none";
      printWindow.focus();
      printWindow.print();
    });
}

export default function ProfileLitePage({ initialRole = "", initialTab = "overview", onNavigateHome, onNavigateMasters }) {
  const [activeTab, setActiveTab] = useState(getProfileLiteTabById(initialTab).id);
  const [cabinetRole, setCabinetRole] = useState(() => initialRole || getProfileLiteRoleForTab(getProfileLiteTabById(initialTab).id));
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
  const [materialsFeedMessage, setMaterialsFeedMessage] = useState("");
  const [materials, setMaterials] = useState([]);
  const [materialForm, setMaterialForm] = useState(EMPTY_MATERIAL);
  const [materialFile, setMaterialFile] = useState(null);

  const [courses, setCourses] = useState([]);
  const [coursesStatus, setCoursesStatus] = useState("idle");
  const [coursesError, setCoursesError] = useState("");
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [courseSteps, setCourseSteps] = useState([]);
  const [selectedStepId, setSelectedStepId] = useState("");
  const [courseLessons, setCourseLessons] = useState([]);
  const [courseLessonsStatus, setCourseLessonsStatus] = useState("idle");
  const [courseLessonsError, setCourseLessonsError] = useState("");

  const [mediaStatus, setMediaStatus] = useState("idle");
  const [mediaError, setMediaError] = useState("");
  const [clientGoalPhotos, setClientGoalPhotos] = useState([]);
  const [traditionAssets, setTraditionAssets] = useState([]);
  const [clientPhotoForm, setClientPhotoForm] = useState(EMPTY_CLIENT_PHOTO);
  const [traditionAssetForm, setTraditionAssetForm] = useState(EMPTY_TRADITION_ASSET);

  const [mandalasStatus, setMandalasStatus] = useState("idle");
  const [mandalasError, setMandalasError] = useState("");
  const [powerPlaceCompositions, setPowerPlaceCompositions] = useState([]);
  const [compositionDraft, setCompositionDraft] = useState(() => withDefaultMotionSettings(EMPTY_COMPOSITION));
  const [compositionMessage, setCompositionMessage] = useState("");
  const [powerPlaceFeedForm, setPowerPlaceFeedForm] = useState({ title: "", body: "", category: "mandalas", tags: "" });
  const [powerPlaceFeedStatus, setPowerPlaceFeedStatus] = useState("idle");

  const [servicesStatus, setServicesStatus] = useState("idle");
  const [servicesError, setServicesError] = useState("");
  const [services, setServices] = useState([]);
  const [serviceForm, setServiceForm] = useState(() => createEmptyServiceForm());
  const [serviceActionStatus, setServiceActionStatus] = useState("idle");
  const [serviceMessage, setServiceMessage] = useState("");
  const [selectedClientKey, setSelectedClientKey] = useState("");
  const [clientSaveForm, setClientSaveForm] = useState(EMPTY_CLIENT_SAVE_FORM);
  const [clientInvites, setClientInvites] = useState([]);
  const [clientInviteForm, setClientInviteForm] = useState(EMPTY_CLIENT_INVITE_FORM);

  const [ordersStatus, setOrdersStatus] = useState("idle");
  const [ordersError, setOrdersError] = useState("");
  const [orders, setOrders] = useState([]);
  const [clientOrders, setClientOrders] = useState([]);
  const [pendingCartMessage, setPendingCartMessage] = useState("");
  const [orderConfirmation, setOrderConfirmation] = useState(EMPTY_ORDER_CONFIRMATION);
  const [orderPatch, setOrderPatch] = useState(EMPTY_ORDER_PATCH);

  const [chatsStatus, setChatsStatus] = useState("idle");
  const [chatsError, setChatsError] = useState("");
  const [chatThreads, setChatThreads] = useState([]);
  const [selectedThreadId, setSelectedThreadId] = useState("");
  const [chatDraft, setChatDraft] = useState("");
  const [approvedChatProfiles, setApprovedChatProfiles] = useState([]);
  const [approvedChatProfilesStatus, setApprovedChatProfilesStatus] = useState("idle");
  const [approvedChatProfilesError, setApprovedChatProfilesError] = useState("");

  const sessionExpired = useMemo(() => isStoredSessionExpired(session), [session]);
  const clientDirectory = useMemo(
    () => buildClientDirectoryFromOrders(orders, clientGoalPhotos, powerPlaceCompositions, clientInvites),
    [orders, clientGoalPhotos, powerPlaceCompositions, clientInvites]
  );
  const masterPowerPlaceCompositions = useMemo(
    () => filterMasterPowerPlaceCompositions(powerPlaceCompositions),
    [powerPlaceCompositions]
  );
  const selectedClient = useMemo(
    () => clientDirectory.find((client) => client.key === selectedClientKey) || null,
    [clientDirectory, selectedClientKey]
  );
  const activeSettings = useMemo(() => settingsForStep(materialForm.step_id), [materialForm.step_id]);
  const accountPlan = resolveProfileMasterPlan({ account_plan: form.account_plan || profile?.account_plan }, user, supabaseEnv.adminEmail);
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
    const nextTab = getProfileLiteTabById(initialTab).id;
    setActiveTab(nextTab);
    setCabinetRole(initialRole || getProfileLiteInitialRoleFromLocation(
      typeof window !== "undefined" ? window.location.pathname : "/profile",
      typeof window !== "undefined" ? window.location.search : ""
    ));
  }, [initialRole, initialTab]);

  const moduleStates = useMemo(() => ({
    profile: { status: profileStatus, count: profile ? 1 : 0, error: profileError },
    materials: { status: materialsStatus, count: materials.length, error: materialsError },
    courses: { status: coursesStatus, count: courses.length, error: coursesError || courseLessonsError },
    media: { status: mediaStatus, count: clientGoalPhotos.length + traditionAssets.length, error: mediaError },
    mandalas: { status: mandalasStatus, count: powerPlaceCompositions.length, error: mandalasError },
    services: { status: servicesStatus, count: services.length, error: servicesError },
    orders: { status: ordersStatus, count: orders.length + clientOrders.length, error: ordersError },
    chats: { status: chatsStatus, count: chatThreads.length, error: chatsError || approvedChatProfilesError }
  }), [
    approvedChatProfilesError,
    chatThreads.length,
    chatsError,
    chatsStatus,
    clientOrders.length,
    clientGoalPhotos.length,
    courseLessonsError,
    courses.length,
    coursesError,
    coursesStatus,
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
    setCourses([]);
    setCoursesStatus("idle");
    setCoursesError("");
    setSelectedCourseId("");
    setCourseSteps([]);
    setSelectedStepId("");
    setCourseLessons([]);
    setCourseLessonsStatus("idle");
    setCourseLessonsError("");
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
    setServiceForm(createEmptyServiceForm());
    setServiceActionStatus("idle");
    setServiceMessage("");
    setClientInvites([]);
    setClientInviteForm(EMPTY_CLIENT_INVITE_FORM);
    setOrders([]);
    setClientOrders([]);
    setOrdersStatus("idle");
    setOrdersError("");
    setPendingCartMessage("");
    setOrderConfirmation(EMPTY_ORDER_CONFIRMATION);
    setChatThreads([]);
    setChatsStatus("idle");
    setChatsError("");
    setApprovedChatProfiles([]);
    setApprovedChatProfilesStatus("idle");
    setApprovedChatProfilesError("");
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
    async function claimPendingClientInvite() {
      if (!profile?.id || !hasProfileLiteSessionCredential(session)) return;
      const searchParams = new URLSearchParams(typeof window !== "undefined" ? window.location.search : "");
      const token = searchParams.get("invite") || localStorage.getItem(PENDING_CLIENT_INVITE_KEY);
      if (!token) return;
      try {
        const claimed = await claimClientInvite(token, session);
        if (cancelled) return;
        setClientInvites((current) => [claimed, ...current.filter((item) => item.id !== claimed?.id)].filter(Boolean));
        localStorage.removeItem(PENDING_CLIENT_INVITE_KEY);
        setOrdersStatus("success");
        setOrdersError("");
      } catch (error) {
        if (cancelled) return;
        localStorage.setItem(PENDING_CLIENT_INVITE_KEY, token);
        setOrdersStatus("needs-verification");
        setOrdersError(moduleError(error, "profile_cabinet_client_invites claim failed or migration/RLS not applied"));
      }
    }
    void claimPendingClientInvite();
    return () => {
      cancelled = true;
    };
  }, [profile?.id, session]);

  useEffect(() => {
    let cancelled = false;
    async function loadCourses() {
      if (!profile?.id || !hasProfileLiteSessionCredential(session)) {
        setCourses([]);
        setSelectedCourseId("");
        setCourseSteps([]);
        setSelectedStepId("");
        setCourseLessons([]);
        setCoursesStatus("idle");
        setCourseLessonsStatus("idle");
        return;
      }
      setCoursesStatus("loading");
      setCoursesError("");
      try {
        const rows = await listAvailableCoursesForProfile(profile.id, session);
        if (cancelled) return;
        setCourses(rows || []);
        setSelectedCourseId((current) => (rows || []).some((course) => course.id === current) ? current : rows?.[0]?.id || "");
        setCoursesStatus("success");
      } catch (error) {
        if (cancelled) return;
        setCourses([]);
        setSelectedCourseId("");
        setCoursesStatus("needs-verification");
        setCoursesError(moduleError(error, "profile_cabinet_courses request failed or migration/RLS not applied"));
      }
    }
    void loadCourses();
    return () => {
      cancelled = true;
    };
  }, [profile?.id, session]);

  useEffect(() => {
    let cancelled = false;
    async function loadCourseSteps() {
      if (!profile?.id || !selectedCourseId || !hasProfileLiteSessionCredential(session)) {
        setCourseSteps([]);
        setSelectedStepId("");
        setCourseLessons([]);
        setCourseLessonsStatus("idle");
        return;
      }
      try {
        const rows = await listAvailableCourseSteps(profile.id, selectedCourseId, session);
        if (cancelled) return;
        setCourseSteps(rows || []);
        setSelectedStepId((current) => (rows || []).some((step) => step.id === current) ? current : rows?.[0]?.id || "");
      } catch (error) {
        if (cancelled) return;
        setCourseSteps([]);
        setSelectedStepId("");
        setCourseLessons([]);
        setCoursesStatus("needs-verification");
        setCoursesError(moduleError(error, "profile_cabinet_course_steps request failed or migration/RLS not applied"));
      }
    }
    void loadCourseSteps();
    return () => {
      cancelled = true;
    };
  }, [profile?.id, selectedCourseId, session]);

  useEffect(() => {
    let cancelled = false;
    async function loadCourseLessons() {
      if (!profile?.id || !selectedCourseId || !selectedStepId || !hasProfileLiteSessionCredential(session)) {
        setCourseLessons([]);
        setCourseLessonsStatus("idle");
        return;
      }
      setCourseLessonsStatus("loading");
      setCourseLessonsError("");
      try {
        const rows = await listAvailableCourseLessons(profile.id, selectedCourseId, selectedStepId, session);
        if (cancelled) return;
        setCourseLessons(rows || []);
        setCourseLessonsStatus("success");
      } catch (error) {
        if (cancelled) return;
        setCourseLessons([]);
        setCourseLessonsStatus("needs-verification");
        setCourseLessonsError(moduleError(error, "profile_cabinet_course_lessons request failed or migration/RLS not applied"));
      }
    }
    void loadCourseLessons();
    return () => {
      cancelled = true;
    };
  }, [profile?.id, selectedCourseId, selectedStepId, session]);

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
        setPowerPlaceCompositions((compositionsResult.value || []).map(withDefaultMotionSettings));
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
        setClientOrders([]);
        setClientInvites([]);
        setChatThreads([]);
        setApprovedChatProfiles([]);
        setServicesStatus("idle");
        setOrdersStatus("idle");
        setChatsStatus("idle");
        setApprovedChatProfilesStatus("idle");
        return;
      }
      setServicesStatus("loading");
      setOrdersStatus("loading");
      setChatsStatus("loading");
      setApprovedChatProfilesStatus("loading");
      const [servicesResult, clientOrdersResult, masterOrdersResult, invitesResult, chatsResult, approvedProfilesResult] = await Promise.allSettled([
        listOwnServices(profile.id, session),
        listClientServiceOrders(profile.id, session),
        listOwnServiceOrders(profile.id, session),
        listOwnClientInvites(profile.id, session),
        listOwnChatThreads(profile.id, session),
        listApprovedMasterProfiles(session)
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
      if (clientOrdersResult.status === "fulfilled" || masterOrdersResult.status === "fulfilled") {
        setClientOrders(clientOrdersResult.status === "fulfilled" ? clientOrdersResult.value || [] : []);
        setOrders(masterOrdersResult.status === "fulfilled" ? masterOrdersResult.value || [] : []);
        setOrdersStatus("success");
        setOrdersError([
          clientOrdersResult.status === "rejected" ? moduleError(clientOrdersResult.reason, "client orders request failed or migration/RLS not applied") : "",
          masterOrdersResult.status === "rejected" ? moduleError(masterOrdersResult.reason, "master orders request failed or migration/RLS not applied") : ""
        ].filter(Boolean).join(" · "));
      } else {
        setClientOrders([]);
        setOrders([]);
        setOrdersStatus("needs-verification");
        setOrdersError(moduleError(clientOrdersResult.reason || masterOrdersResult.reason, "profile_cabinet_service_orders request failed or migration/RLS not applied"));
      }
      if (invitesResult.status === "fulfilled") {
        setClientInvites(invitesResult.value || []);
      } else {
        setClientInvites([]);
        setOrdersError((current) => [
          current,
          moduleError(invitesResult.reason, "profile_cabinet_client_invites request failed or migration/RLS not applied")
        ].filter(Boolean).join(" · "));
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
      if (approvedProfilesResult.status === "fulfilled") {
        const profiles = (approvedProfilesResult.value || []).filter((item) => item?.id && item.id !== profile.id);
        setApprovedChatProfiles(profiles);
        setApprovedChatProfilesStatus("success");
        setApprovedChatProfilesError("");
      } else {
        setApprovedChatProfiles([]);
        setApprovedChatProfilesStatus("needs-verification");
        setApprovedChatProfilesError(moduleError(approvedProfilesResult.reason, "approved profile lookup failed or RLS not applied"));
      }
    }
    void loadBusinessModules();
    return () => {
      cancelled = true;
    };
  }, [profile?.id, session]);

  useEffect(() => {
    let cancelled = false;
    async function restoreFreshPendingServiceCart() {
      if (!profile?.id || !hasProfileLiteSessionCredential(session)) return;
      const cartStore = createServiceCartStore();
      const pendingCart = cartStore.restoreFreshPending();
      if (!pendingCart) return;
      setPendingCartMessage("Восстановили заказ из корзины. Проверьте фото и отправьте заказ мастеру.");
      setOrdersStatus("loading");
      try {
        const draft = await createServiceOrderDraft({ cartItem: pendingCart, clientProfileId: profile.id }, session);
        if (cancelled) return;
        cartStore.clearPending();
        cartStore.clear();
        setClientOrders((current) => [draft, ...current.filter((item) => item.id !== draft?.id)].filter(Boolean));
        setOrderConfirmation((current) => ({ ...current, orderId: draft?.id || current.orderId }));
        setOrdersStatus("success");
        setOrdersError("");
      } catch (error) {
        if (cancelled) return;
        setOrdersStatus("needs-verification");
        setOrdersError(moduleError(error, "Не удалось создать черновик заказа. Проверьте публикацию услуги и RLS."));
      }
    }
    void restoreFreshPendingServiceCart();
    return () => {
      cancelled = true;
    };
  }, [profile?.id, session]);

  const handleGoogleLogin = async () => {
    setAuthError("");
    try {
      const redirectPath = ["/profile-lite", "/profile/orders"].includes(window.location.pathname)
        ? window.location.pathname
        : "/profile";
      await signInWithGoogle(redirectPath);
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

  const handleGrimoireMultiUpload = async (files) => {
  if (!profile?.id || !hasProfileLiteSessionCredential(session)) {
      setMaterialsError("Сначала сохраните профиль мастера.");
      setMaterialsStatus("needs-verification");
      throw new Error("Сначала сохраните профиль мастера.");
    }
    const uploadFiles = Array.from(files || []).filter(Boolean);
    const uploadEntitlement = canCreateWithinPlanLimit(accountPlan, "dailyPhotoUploads", uploadFiles.length - 1);
    if (uploadFiles.length > uploadEntitlement.limit) {
      const message = masterPlanLimitMessage(accountPlan, "dailyPhotoUploads");
      setMaterialsError(message);
      setMaterialsStatus("needs-verification");
      throw new Error(message);
    }
    try {
      const results = await Promise.allSettled(uploadFiles.map(async (file) => {
        validateGrimoireFile(file);
        const uploaded = await uploadProfileMedia(file, { profileId: profile.id, kind: "material" }, session);
        return { file, uploaded };
      }));
      const uploadedFiles = results.filter((r) => r.status === "fulfilled").map((r) => r.value).filter(Boolean);
      const failed = results.filter((r) => r.status === "rejected");
      if (!uploadedFiles.length && failed.length > 0) {
        throw failed[0].reason || new Error("Файлы не загрузились.");
      }

      const firstUpload = uploadedFiles[0];
      const detectedType = detectMaterialTypeFromFile(firstUpload?.file);
      const attachments = uploadedFiles.map(({ file, uploaded }) => ({
        image_url: uploaded.ref,
        signed_url: uploaded.signedUrl || "",
        title: stripFileExtension(file.name) || file.name || "Фото",
        type: detectMaterialTypeFromFile(file)
      }));
      const title = uploadedFiles.length > 1
        ? `Фото (${uploadedFiles.length})`
        : stripFileExtension(firstUpload?.file?.name) || "Запись гримуара";
      const payload = {
        profile_id: profile.id,
        type: DB_SAFE_GRIMOIRE_TYPE,
        material_type: detectedType,
        title,
        description: buildGrimoireDescriptionValue("", attachments),
        image_url: firstUpload?.uploaded?.ref || "",
        step_id: "",
        step_title: "",
        setting_title: "",
        setting_index: null,
        category: "unclassified",
        subcategory: "unclassified",
        material_group: "unclassified",
        status: "draft",
        updated_at: new Date().toISOString()
      };
      const saved = await createOwnMaterial(payload, session);
      const savedWithPreview = firstUpload?.uploaded?.signedUrl ? {
        ...saved,
        attachments,
        display_url: saved?.display_url || firstUpload.uploaded.signedUrl,
        signed_url: saved?.signed_url || firstUpload.uploaded.signedUrl
      } : { ...saved, attachments };
      setMaterials((current) => [savedWithPreview, ...current.filter((item) => item.id !== savedWithPreview?.id)].filter(Boolean));
      setMaterialsStatus("success");
      setMaterialsError("");
      if (failed.length > 0) {
        setMaterialsError(`${failed.length} файл(ов) не загрузилось: ${moduleError(failed[0]?.reason, "upload or save failed")}`);
        throw new Error(`${failed.length} файл(ов) не загрузилось.`);
      }
    } catch (error) {
      setMaterialsStatus("needs-verification");
      setMaterialsError(moduleError(error, "upload or save failed"));
      throw error;
    }
  };

  const handleGrimoireUpdate = async (id, patch) => {
    if (!hasProfileLiteSessionCredential(session)) {
      throw new Error("Нужно войти в кабинет.");
    }
    try {
      const updatePatch = { ...patch };
      if (updatePatch.status === "draft") {
        const hiddenCount = materials.filter((item) => item.id !== id && item.status !== "approved").length;
        const entitlement = canCreateWithinPlanLimit(accountPlan, "hiddenPublications", hiddenCount);
        if (!entitlement.allowed) throw new Error(entitlement.message);
      }
      if (patch?.taxonomy) {
        const taxonomy = normalizeGrimoireTaxonomy(patch.taxonomy);
        updatePatch.category = taxonomy.level1;
        updatePatch.subcategory = taxonomy.level2;
        updatePatch.material_group = taxonomy.level3;
        delete updatePatch.taxonomy;
      }
      if (updatePatch.type && ["ri", "channels", "gods", "clients", "uncategorized"].includes(updatePatch.type)) {
        updatePatch.type = DB_SAFE_GRIMOIRE_TYPE;
      }
      const saved = await updateOwnMaterial(id, updatePatch, session);
      if (saved) {
        setMaterials((current) => current.map((item) => item.id === id ? { ...item, ...saved } : item));
      }
      setMaterialsStatus("success");
      setMaterialsError("");
    } catch (error) {
      setMaterialsStatus("needs-verification");
      setMaterialsError(moduleError(error, "profile_cabinet_publications update failed or migration/RLS not applied"));
      throw error;
    }
  };

  const handleGrimoireDelete = async (material) => {
    if (!hasProfileLiteSessionCredential(session)) {
      throw new Error("Нужно войти в кабинет.");
    }
    try {
      await deleteOwnMaterial(material.id, session);
      setMaterials((current) => current.filter((item) => item.id !== material.id));
      setMaterialsStatus("success");
      setMaterialsError("");
    } catch (error) {
      setMaterialsStatus("needs-verification");
      setMaterialsError(moduleError(error, "profile_cabinet_publications delete failed or migration/RLS not applied"));
      throw error;
    }
  };

  const handleAddMaterialToFeed = async (material) => {
    if (!profile?.id || !hasProfileLiteSessionCredential(session)) {
      setMaterialsError("Сначала сохраните профиль мастера.");
      setMaterialsStatus("needs-verification");
      return;
    }
    try {
      const result = await createOrUpdatePendingActivityEvent(buildMaterialActivityEvent(material, profile.id), session);
      setMaterialsFeedMessage(result.message);
      setMaterialsStatus("success");
      setMaterialsError("");
    } catch (error) {
      setMaterialsStatus("needs-verification");
      setMaterialsError(moduleError(error, "profile_cabinet_activity_events material create failed or migration/RLS not applied"));
    }
  };

  const handleClientPhotoSave = async () => {
    if (!profile?.id || !hasProfileLiteSessionCredential(session)) {
      setMediaError("Сначала сохраните профиль мастера.");
      setMediaStatus("needs-verification");
      return;
    }
    const entitlement = canCreateWithinPlanLimit(accountPlan, "clientPhotos", clientGoalPhotos.length);
    if (!entitlement.allowed) {
      setMediaError(entitlement.message);
      setMediaStatus("needs-verification");
      return;
    }
    try {
      let photo = {
        profile_id: profile.id,
        title: clientPhotoForm.title,
        image_url: clientPhotoForm.image_url,
        client_category: clientPhotoForm.client_category || "all",
        notes: ""
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
    files = null,
    title = "",
    notes = "",
    destination = "clients",
    material = null,
    clientCategory = "all"
  }) => {
    if (destination === "materials" || destination === "backgrounds") {
      if (!profile?.id || !hasProfileLiteSessionCredential(session)) {
        setMaterialsError("Сначала сохраните профиль мастера.");
        setMaterialsStatus("needs-verification");
        throw new Error("Сначала сохраните профиль мастера.");
      }

      try {
        const uploadFiles = (Array.isArray(files) && files.length > 0 ? files : [file]).filter(Boolean);
        const results = await Promise.allSettled(uploadFiles.map(async (uploadFile) => {
          validateProfileMediaFile(uploadFile);
          const uploaded = await uploadProfileMedia(uploadFile, { profileId: profile.id, kind: "material" }, session);
          const materialPayload = buildMaterialUploadPublicationPayload({
            profileId: profile.id,
            file: uploadFile,
            title: uploadFiles.length === 1 ? title || uploadFile.name || (destination === "backgrounds" ? "Фон" : "Материал") : uploadFile.name || (destination === "backgrounds" ? "Фон" : "Материал"),
            imageUrl: uploaded.ref,
            material,
            status: "draft"
          });
          const saved = await createOwnMaterial(materialPayload, session);
          return uploaded?.signedUrl ? {
            ...saved,
            display_url: saved?.display_url || uploaded.signedUrl,
            signed_url: saved?.signed_url || uploaded.signedUrl
          } : saved;
        }));
        const saved = results.filter((result) => result.status === "fulfilled").map((result) => result.value).filter(Boolean);
        const failed = results.filter((result) => result.status === "rejected");
        setMaterials((current) => [...saved, ...current.filter((item) => !saved.some((savedItem) => savedItem?.id === item.id))].filter(Boolean));
        setMaterialsStatus("success");
        if (failed.length > 0) {
          setMaterialsError(`${failed.length} файл(ов) не загрузилось: ${moduleError(failed[0]?.reason, "upload or save failed")}`);
          throw new Error(`${failed.length} файл(ов) не загрузилось.`);
        }
        setMaterialsError("");
        return uploadFiles.length === 1 ? saved[0] || null : saved;
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
    const entitlement = canCreateWithinPlanLimit(accountPlan, "clientPhotos", clientGoalPhotos.length);
    if (!entitlement.allowed) {
      setMediaError(entitlement.message);
      setMediaStatus("needs-verification");
      throw new Error(entitlement.message);
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
        client_category: clientCategory || "all",
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

        // Reset cover_ref layers when the deleted photo was the active cover
        const NO_COVER_LAYER = { id: "no-cover", label: "Без фона", type: "none", tone: "", src: "", display_src: "" };
        const currentCoverRef = current.cover_ref || {};
        const innerSrc = (currentCoverRef.inner || currentCoverRef).src || "";
        const outerSrc = (currentCoverRef.outer || {}).src || "";
        let nextCoverRef = currentCoverRef;
        if (innerSrc && deletedRefs.has(innerSrc)) {
          if (innerSrc) delete nextObjectRefUrls[innerSrc];
          nextCoverRef = {
            ...nextCoverRef,
            id: NO_COVER_LAYER.id, label: NO_COVER_LAYER.label, type: NO_COVER_LAYER.type,
            tone: NO_COVER_LAYER.tone, src: NO_COVER_LAYER.src, display_src: NO_COVER_LAYER.display_src,
            inner: NO_COVER_LAYER
          };
          changed = true;
        }
        if (outerSrc && deletedRefs.has(outerSrc)) {
          if (outerSrc) delete nextObjectRefUrls[outerSrc];
          nextCoverRef = { ...nextCoverRef, outer: NO_COVER_LAYER };
          changed = true;
        }

        const isCenterDeleted = current.central_photo_id === photo.id;
        if (isCenterDeleted) {
          delete nextObjectRefs.__center_image;
          if (centerRef) delete nextObjectRefUrls[centerRef];
        }

        if (isCenterDeleted || changed) {
          return {
            ...current,
            ...(isCenterDeleted ? { central_photo_id: "" } : {}),
            object_refs: nextObjectRefs,
            object_ref_urls: nextObjectRefUrls,
            ...(nextCoverRef !== currentCoverRef ? { cover_ref: nextCoverRef } : {})
          };
        }
        return current;
      });
    } catch (error) {
      setMediaStatus("needs-verification");
      setMediaError(moduleError(error, "delete client goal photo failed or RLS not applied"));
    }
  };

  const handleClientPhotoCategoryMove = async (photo, clientCategory) => {
    if (!profile?.id || !photo?.id || !hasProfileLiteSessionCredential(session)) {
      setMediaError("Сначала сохраните профиль мастера.");
      setMediaStatus("needs-verification");
      throw new Error("Сначала сохраните профиль мастера.");
    }

    try {
      const updated = await updateClientGoalPhotoCategory(photo.id, profile.id, clientCategory, session);
      setClientGoalPhotos((current) => current.map((item) => (
        item?.id === photo.id
          ? {
            ...item,
            ...(updated || {}),
            client_category: updated?.client_category || clientCategory || "all"
          }
          : item
      )));
      setMediaStatus("success");
      setMediaError("");
      return updated;
    } catch (error) {
      setMediaStatus("needs-verification");
      setMediaError(moduleError(error, "profile_cabinet_client_goal_photos category update failed or migration/RLS not applied"));
      throw error;
    }
  };

  const handleCompositionDraftChange = (field, value) => {
    setCompositionDraft((current) => {
      if (field === VISIBILITY_SETTINGS_REF_KEY) {
        return {
          ...current,
          object_refs: {
            ...(current.object_refs || {}),
            [VISIBILITY_SETTINGS_REF_KEY]: value && typeof value === "object" ? value : {}
          }
        };
      }
      if (field === PROFILE_LITE_REPORT_REF_KEY) {
        return {
          ...current,
          object_refs: {
            ...(current.object_refs || {}),
            [PROFILE_LITE_REPORT_REF_KEY]: normalizeProfileLiteReport(value)
          }
        };
      }
      if (field === DAO_LAYOUT_OPTIONS_REF_KEY || field === DAO_LAYOUT_TEMPLATE_OPTIONS_REF_KEY) {
        return {
          ...current,
          object_refs: {
            ...(current.object_refs || {}),
            [DAO_LAYOUT_OPTIONS_REF_KEY]: normalizeDaoLayoutTemplateOptions(value)
          }
        };
      }
      if (field === "field_layout") {
        const fieldLayout = normalizeFieldLayout(value);
        return {
          ...current,
          field_layout: fieldLayout,
          object_refs: {
            ...(current.object_refs || {}),
            [FIELD_LAYOUT_REF_KEY]: fieldLayout
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
      if (field === "__center_frame_scale") {
        return {
          ...current,
          __center_frame_scale: value,
          object_refs: {
            ...(current.object_refs || {}),
            __center_frame_scale: String(value)
          }
        };
      }
      if (["motion_mode", "video_count", "video_direction", "video_step_seconds", "video_background_ref"].includes(field)) {
        const currentMotionSettings = normalizeMotionSettings(current.object_refs?.[MOTION_SETTINGS_REF_KEY]);
        const nextMotionSettings = normalizeMotionSettings({
          ...currentMotionSettings,
          ...(field === "motion_mode" ? { mode: value } : {}),
          ...(field === "video_count" ? { count: value } : {}),
          ...(field === "video_direction" ? { direction: value } : {}),
          ...(field === "video_step_seconds" ? { step_seconds: value } : {}),
          ...(field === "video_background_ref" ? { video_background_ref: value } : {})
        });
        return {
          ...current,
          object_refs: {
            ...(current.object_refs || {}),
            [MOTION_SETTINGS_REF_KEY]: nextMotionSettings
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
      const refsWithMotionSettings = {
        ...refs,
        [MOTION_SETTINGS_REF_KEY]: normalizeMotionSettings(refs[MOTION_SETTINGS_REF_KEY])
      };
      setCompositionDraft((current) => ({
        ...current,
        field_layout: fieldLayoutFromComposition({ ...current, object_refs: refsWithMotionSettings }),
        object_refs: refsWithMotionSettings
      }));
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
        [MOTION_SETTINGS_REF_KEY]: normalizeMotionSettings(current.object_refs?.[MOTION_SETTINGS_REF_KEY]),
        [slotId]: value
      },
      object_ref_urls: displayUrl && displayUrl !== value
        ? { ...(current.object_ref_urls || {}), [value]: displayUrl }
        : current.object_ref_urls
    }));
  };

  const handleCompositionCoverSelect = (layer, cover) => {
    const normalizeCoverFit = (item) =>
      item?.fit === "contain" || item?.cover_fit === "contain" || item?.coverFit === "contain" ? "contain" : "";
    const normalizeLayer = (item, fallbackId) => {
      const fit = normalizeCoverFit(item);
      return {
        id: item?.id || fallbackId,
        label: item?.label || "Без фона",
        type: item?.type || "none",
        tone: item?.tone || "",
        src: item?.src || "",
        display_src: item?.display_src || item?.displaySrc || item?.src || "",
        ...(fit ? { fit, cover_fit: fit } : {})
      };
    };

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
        object_refs: {
          ...(current.object_refs || {}),
          [MOTION_SETTINGS_REF_KEY]: normalizeMotionSettings(current.object_refs?.[MOTION_SETTINGS_REF_KEY]),
          __center_image: savedImageRef
        },
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
    setCompositionDraft(withDefaultMotionSettings({
      ...EMPTY_COMPOSITION,
      ...composition,
      id: composition.id || "",
      slot_scale: slotScaleFromComposition(composition),
      field_layout: fieldLayoutFromComposition(composition),
      object_refs: composition.object_refs || {},
      object_ref_urls: composition.object_ref_urls || {}
    }));
    setCompositionMessage("Сохранённая мандала открыта в конструкторе.");
  };

  const handleCompositionStartNewDraft = () => {
    setCompositionDraft(withDefaultMotionSettings({
      ...EMPTY_COMPOSITION,
      object_refs: {},
      object_ref_urls: {}
    }));
    setCompositionMessage("Новая мандала подготовлена. Настройте макет и нажмите «Создать новую».");
    setMandalasError("");
  };


  const openCompositionInMandalas = async (compositionId, fallbackMessage = "Мандала заказа открыта в конструкторе.") => {
    if (!compositionId || !hasProfileLiteSessionCredential(session)) return null;
    let composition = powerPlaceCompositions.find((item) => item.id === compositionId) || null;
    if (!composition) {
      composition = await getPowerPlaceCompositionById(compositionId, session);
      if (composition) {
        setPowerPlaceCompositions((current) => [composition, ...current.filter((item) => item.id !== composition.id)]);
      }
    }
    if (!composition) throw new Error("Мандала результата не найдена или недоступна.");
    handleCompositionLoad(composition);
    setCompositionMessage(fallbackMessage);
    setActiveTab("mandalas");
    if (typeof window !== "undefined" && window.location.pathname !== "/profile/mandalas") {
      window.history.pushState({}, "", "/profile/mandalas");
      window.dispatchEvent(new Event(ROUTE_CHANGE_EVENT));
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
    return composition;
  };

  const refreshSavedCompositions = async (saved) => {
    const freshCompositions = await listPowerPlaceCompositions(profile.id, session);
    const freshSaved = freshCompositions.find((composition) => composition.id === saved?.id) || saved;
    setPowerPlaceCompositions(freshCompositions.length
      ? freshCompositions.map(withDefaultMotionSettings)
      : [saved].filter(Boolean).map(withDefaultMotionSettings)
    );
    if (freshSaved) {
      setCompositionDraft(withDefaultMotionSettings({
        ...EMPTY_COMPOSITION,
        ...freshSaved,
        id: freshSaved?.id || "",
        slot_scale: slotScaleFromComposition(freshSaved),
        field_layout: fieldLayoutFromComposition(freshSaved)
      }));
    }
    return freshSaved ? withDefaultMotionSettings(freshSaved) : freshSaved;
  };

  const handleCompositionSaveNew = async () => {
    setCompositionMessage("Создаём новую мандалу…");
    await Promise.resolve();
    setCompositionMessage(POWER_PLACE_SAVE_STAGE_MESSAGES.profile);
    if (!profile?.id || !hasProfileLiteSessionCredential(session)) {
      const message = "Сначала сохраните профиль мастера.";
      setMandalasError(message);
      setCompositionMessage(powerPlaceSaveFailureMessage("profile", { message }, message));
      setMandalasStatus("needs-verification");
      return;
    }
    setCompositionMessage(POWER_PLACE_SAVE_STAGE_MESSAGES.limit);
    const currentSavedCompositionCount = masterPowerPlaceCompositions.length;
    const entitlement = canCreateWithinPlanLimit(accountPlan, "compositions", currentSavedCompositionCount);
    if (!entitlement.allowed) {
      const message = `${entitlement.message} ${POWER_PLACE_LIMIT_HELP}`;
      setMandalasStatus("needs-verification");
      setMandalasError(message);
      setCompositionMessage(powerPlaceSaveFailureMessage("limit", { message }, message));
      return;
    }
    setMandalasError("");
    setMandalasStatus("loading");
    let saved = null;
    try {
      const createPayload = {
        ...withDefaultMotionSettings(compositionDraft),
        id: undefined,
        title: uniqueCompositionCopyTitle(compositionDraft.title, masterPowerPlaceCompositions),
        profile_id: profile.id
      };
      delete createPayload.id;
      saved = await createPowerPlaceComposition(createPayload, accountPlan, session, {
        onStage: (stage) => {
          setCompositionMessage(POWER_PLACE_SAVE_STAGE_MESSAGES[stage] || `Сохраняем: ${powerPlaceSaveStageLabel(stage)}…`);
        }
      });
      if (!saved?.id) {
        const message = "сервер не вернул запись. Проверьте Supabase RLS/migration.";
        setMandalasStatus("needs-verification");
        setMandalasError("Место силы не сохранилось: " + message);
        setCompositionMessage(powerPlaceSaveFailureMessage("response", { message }, message));
        return;
      }
      if (saved.__hydration_warning) {
        setCompositionMessage("Supabase вернул запись, изображения догрузятся после обновления списка.");
      }
      setPowerPlaceCompositions((current) => {
        const without = current.filter((item) => item.id !== saved.id);
        return [withDefaultMotionSettings(saved), ...without];
      });
      setCompositionDraft((current) => {
        const savedWithMotionSettings = withDefaultMotionSettings({ ...EMPTY_COMPOSITION, ...saved });
        return {
          ...savedWithMotionSettings,
          id: saved.id,
          field_layout: fieldLayoutFromComposition(saved),
          object_refs: savedWithMotionSettings.object_refs || current.object_refs || {},
          object_ref_urls: saved.object_ref_urls || current.object_ref_urls || {}
        };
      });
      setCompositionMessage("Новая мандала создана и открыта в конструкторе. Место силы сохранено и добавлено в Мои мандалы.");
      setMandalasStatus("success");
    } catch (error) {
      const failedStage = error?.details?.stage || "POST";
      const safeMsg = moduleError(error, "profile_cabinet_power_place_compositions create failed or migration/RLS not applied");
      setMandalasStatus("needs-verification");
      setMandalasError("Место силы не сохранилось: " + safeMsg);
      setCompositionMessage("Новая мандала не создана: " + powerPlaceSaveFailureMessage(failedStage, error, safeMsg));
      return;
    }
    try {
      setCompositionMessage(POWER_PLACE_SAVE_STAGE_MESSAGES.refresh);
      await refreshSavedCompositions(saved);
      setCompositionMessage("Новая мандала создана и открыта в конструкторе. Место силы сохранено и добавлено в Мои мандалы.");
    } catch {
      setCompositionMessage("Мандала сохранена, но список не обновился. Обновите кабинет, если она не появилась в списке.");
    }
  };

  const handleCompositionUpdateExisting = async () => {
    if (!profile?.id || !hasProfileLiteSessionCredential(session)) {
      setMandalasError("Сначала сохраните профиль мастера.");
      setMandalasStatus("needs-verification");
      return;
    }
    if (!compositionDraft.id) {
      setCompositionMessage("Сначала создайте новую мандалу или откройте сохранённую.");
      return;
    }
    setCompositionMessage("Обновляем мандалу…");
    try {
      const payload = { ...withDefaultMotionSettings(compositionDraft), profile_id: profile.id };
      const saved = await updatePowerPlaceComposition(compositionDraft.id, payload, session);
      await refreshSavedCompositions(saved);
      setCompositionMessage("Мандала обновлена.");
      setMandalasStatus("success");
      setMandalasError("");
    } catch (error) {
      const safeMsg = moduleError(error, "profile_cabinet_power_place_compositions update failed or migration/RLS not applied");
      setMandalasStatus("needs-verification");
      setMandalasError(safeMsg);
      setCompositionMessage("Мандала не обновлена: " + safeMsg);
    }
  };

  const handleOpenClientSave = () => {
    setClientSaveForm((current) => ({
      ...current,
      isOpen: true,
      clientKey: current.clientKey || selectedClientKey,
      status: "idle",
      message: ""
    }));
  };

  const handleClientSaveFormChange = (field, value) => {
    setClientSaveForm((current) => ({ ...current, [field]: value, message: "" }));
  };

  const handleSaveCompositionForClient = async () => {
    if (!profile?.id || !hasProfileLiteSessionCredential(session)) {
      const message = "Сначала сохраните профиль мастера.";
      setClientSaveForm((current) => ({ ...current, status: "error", message }));
      setMandalasError(message);
      return;
    }
    const existingClient = clientDirectory.find((client) => client.key === clientSaveForm.clientKey) || null;
    const clientName = (clientSaveForm.clientName || existingClient?.client_name || "").trim();
    if (!clientName) {
      setClientSaveForm((current) => ({ ...current, status: "error", message: "Укажите имя клиента или выберите клиента из списка." }));
      return;
    }

    setClientSaveForm((current) => ({ ...current, status: "loading", message: "Сохраняю для клиента…" }));
    try {
      const clientKey = existingClient?.key || `name:${clientName}`;
      const clientMeta = {
        client_key: clientKey,
        client_profile_id: existingClient?.client_profile_id || "",
        client_name: clientName,
        client_photo_id: clientSaveForm.clientPhotoId || "",
        request_text: clientSaveForm.requestText || "",
        source_composition_id: compositionDraft.id || "",
        result_composition_id: "",
        status: "saved_for_client"
      };
      const createPayload = {
        ...withDefaultMotionSettings(compositionDraft),
        id: undefined,
        title: uniqueCompositionCopyTitle(`${compositionDraft.title || "Мандала"} · ${clientName}`, powerPlaceCompositions),
        profile_id: profile.id,
        central_photo_id: clientSaveForm.clientPhotoId || compositionDraft.central_photo_id || "",
        object_refs: {
          ...(compositionDraft.object_refs || {}),
          __client_work: clientMeta
        }
      };
      delete createPayload.id;
      const saved = await createPowerPlaceComposition(createPayload, accountPlan, session);
      if (!saved?.id) throw new Error("сервер не вернул сохранённую мандалу.");
      const savedWithClientMeta = {
        ...saved,
        object_refs: {
          ...(saved.object_refs || createPayload.object_refs || {}),
          __client_work: {
            ...clientMeta,
            result_composition_id: saved.id
          }
        }
      };
      setPowerPlaceCompositions((current) => [withDefaultMotionSettings(savedWithClientMeta), ...current.filter((item) => item.id !== saved.id)]);
      setSelectedClientKey(clientKey);
      setClientSaveForm({
        ...EMPTY_CLIENT_SAVE_FORM,
        clientKey,
        clientName,
        status: "success",
        message: "Сохранено для клиента."
      });
      setCompositionMessage("Сохранено для клиента.");
      setMandalasStatus("success");
      setMandalasError("");
      openServicesTab();
    } catch (error) {
      const safeMsg = moduleError(error, "Не удалось сохранить для клиента.");
      setClientSaveForm((current) => ({ ...current, status: "error", message: safeMsg }));
      setMandalasStatus("needs-verification");
      setMandalasError(safeMsg);
      setCompositionMessage("Не удалось сохранить для клиента. " + safeMsg);
    }
  };

  const handleCompositionDelete = async (composition) => {
    if (!profile?.id || !composition?.id || !hasProfileLiteSessionCredential(session)) {
      setMandalasError("Сначала сохраните профиль мастера.");
      setMandalasStatus("needs-verification");
      return;
    }

    const confirmed = window.confirm("Удалить сохранённую мандалу? Фото и источники силы не удалятся.");
    if (!confirmed) return;

    setCompositionMessage("Удаляем сохранённую мандалу…");
    setMandalasStatus("loading");
    try {
      await deletePowerPlaceComposition(composition.id, profile.id, session);
      setPowerPlaceCompositions((current) => current.filter((item) => item.id !== composition.id));
      if (compositionDraft.id === composition.id) {
        setCompositionDraft(withDefaultMotionSettings({ ...EMPTY_COMPOSITION }));
      }
      setMandalasStatus("success");
      setMandalasError("");
      setCompositionMessage("Сохранённая мандала удалена. Фото и источники силы остались в библиотеке.");
    } catch (error) {
      const safeMsg = moduleError(error, "profile_cabinet_power_place_compositions delete failed or RLS not applied");
      setMandalasStatus("needs-verification");
      setMandalasError(safeMsg);
      setCompositionMessage("Мандала не удалена: " + safeMsg);
    }
  };

  const saveCompositionForServiceAction = async (composition = compositionDraft) => {
    if (!profile?.id || !hasProfileLiteSessionCredential(session)) {
      const message = "Сначала сохраните профиль мастера.";
      setMandalasError(message);
      setCompositionMessage(message);
      setMandalasStatus("needs-verification");
      return null;
    }

    try {
      if (composition?.id) {
        const saved = await updatePowerPlaceComposition(composition.id, { ...withDefaultMotionSettings(composition), profile_id: profile.id }, session);
        await refreshSavedCompositions(saved);
        return saved;
      }

      const createPayload = {
        ...withDefaultMotionSettings(composition),
        id: undefined,
        title: uniqueCompositionCopyTitle(composition?.title, masterPowerPlaceCompositions),
        profile_id: profile.id
      };
      delete createPayload.id;
      const saved = await createPowerPlaceComposition(createPayload, accountPlan, session);
      if (!saved?.id) throw new Error("сервер не вернул сохранённую мандалу.");
      await refreshSavedCompositions(saved);
      return saved;
    } catch (error) {
      setMandalasStatus("needs-verification");
      setMandalasError(moduleError(error, "profile_cabinet_power_place_compositions save failed or migration/RLS not applied"));
      setCompositionMessage(moduleError(error, "Мандала не сохранилась перед переносом в услуги."));
      return null;
    }
  };

  const openServicesTab = () => {
    setActiveTab("services");
    setCabinetRole("master");
    if (typeof window !== "undefined" && window.location.pathname !== "/profile/services") {
      window.history.pushState({}, "", "/profile/services");
      window.dispatchEvent(new Event(ROUTE_CHANGE_EVENT));
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleSendCompositionToServices = async (composition = compositionDraft) => {
    const savedComposition = await saveCompositionForServiceAction(composition);
    if (!savedComposition?.id) return null;
    try {
      const existing = services.find((service) => String(service.composition_id || "") === String(savedComposition.id));
      const saved = await upsertOwnServiceForComposition({
        profileId: profile.id,
        composition: savedComposition,
        status: existing?.status || "draft"
      }, session);
      setServices((current) => [saved, ...current.filter((item) => item.id !== saved?.id)].filter(Boolean));
      setServicesStatus("success");
      setServicesError("");
      setCompositionMessage(existing ? "Мандала уже добавлена в услуги." : "Мандала добавлена в услуги.");
      openServicesTab();
      return saved;
    } catch (error) {
      setServicesStatus("needs-verification");
      setServicesError(moduleError(error, "profile_cabinet_services request failed or migration/RLS not applied"));
      return null;
    }
  };

  const handlePublishCompositionAsService = async (composition = compositionDraft) => {
    const savedComposition = await saveCompositionForServiceAction(composition);
    if (!savedComposition?.id) return null;
    try {
      const saved = await upsertOwnServiceForComposition({
        profileId: profile.id,
        composition: savedComposition,
        status: "published"
      }, session);
      setServices((current) => [saved, ...current.filter((item) => item.id !== saved?.id)].filter(Boolean));
      setServicesStatus("success");
      setServicesError("");
      setCompositionMessage("Мандала опубликована как услуга. Публичный маршрут needs verification.");
      openServicesTab();
      return saved;
    } catch (error) {
      setServicesStatus("needs-verification");
      setServicesError(moduleError(error, "profile_cabinet_services publish failed or migration/RLS not applied"));
      return null;
    }
  };

  const handlePowerPlaceFeedFormChange = (field, value) => {
    setPowerPlaceFeedForm((current) => ({ ...current, [field]: value }));
  };

  const handlePublishCompositionToFeed = async (composition = compositionDraft) => {
    if (!profile?.id || !hasProfileLiteSessionCredential(session)) {
      const message = "Сначала сохраните профиль мастера.";
      setMandalasError(message);
      setCompositionMessage(message);
      setMandalasStatus("needs-verification");
      return;
    }

    const compositionId = composition?.id || compositionDraft.id;
    if (!compositionId) {
      setCompositionMessage("Сначала сохраните мандалу, затем отправьте публичную проекцию в ленту.");
      return;
    }

    setPowerPlaceFeedStatus("loading");
    try {
      const result = await createOrUpdatePendingActivityEvent(
        buildPowerPlaceActivityEvent({ ...composition, id: compositionId }, powerPlaceFeedForm, profile.id),
        session
      );
      setCompositionMessage(result.message);
      setMandalasStatus("success");
      setMandalasError("");
      setPowerPlaceFeedStatus("success");
    } catch (error) {
      setPowerPlaceFeedStatus("error");
      setMandalasStatus("needs-verification");
      setMandalasError(moduleError(error, "profile_cabinet_activity_events power place create failed or migration/RLS not applied"));
      setCompositionMessage(moduleError(error, "Публичная проекция не отправлена."));
    }
  };

  const handleProfileLiteTabNavigate = (tab) => {
    const nextTab = getProfileLiteTabById(tab?.id);
    const href = tab?.href || getProfileLiteRouteByTabId(nextTab.id);
    const nextRole = tab?.role || getProfileLiteRoleForTab(nextTab.id, cabinetRole);
    setActiveTab(nextTab.id);
    setCabinetRole(nextRole);
    if (typeof window !== "undefined" && window.location.pathname + window.location.search !== href) {
      window.history.pushState({}, "", href);
      window.dispatchEvent(new Event(ROUTE_CHANGE_EVENT));
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleCabinetRoleChange = (role) => {
    const nextRole = getProfileLiteRoleById(role?.id);
    setCabinetRole(nextRole.id);
    handleProfileLiteTabNavigate({
      id: nextRole.defaultTabId,
      href: getProfileLiteRouteByTabId(nextRole.defaultTabId),
      role: nextRole.id
    });
  };

  const handleDownloadComposition = async () => {
    try {
      await openPowerPlacePdfPrintView(compositionDraft.title || "power-place");
      setCompositionMessage("Скачать PDF / Печать в PDF: в открывшемся окне выберите Save as PDF.");
    } catch (error) {
      setCompositionMessage(moduleError(error, "PDF preview failed"));
    }
  };

  const handlePrintComposition = async () => {
    try {
      await openPowerPlacePdfPrintView(compositionDraft.title || "power-place");
      setCompositionMessage("Открылось окно печати. Выберите принтер или Save as PDF.");
    } catch (error) {
      setCompositionMessage(moduleError(error, "Печать недоступна"));
    }
  };

  const ensureServiceEntitlement = (payload, currentId = "") => {
    const paid = isPaidServiceDraft(payload);
    const limitKey = paid ? "paidServices" : "trialServices";
    const count = services.filter((service) => {
      if (currentId && service.id === currentId) return false;
      return paid ? isPaidServiceDraft(service) : !isPaidServiceDraft(service);
    }).length;
    const entitlement = canCreateWithinPlanLimit(accountPlan, limitKey, count);
    if (!entitlement.allowed) throw new Error(entitlement.message);
  };

  const handleServiceSave = async (nextStatus = "draft") => {
    if (!profile?.id || !hasProfileLiteSessionCredential(session)) {
      setServicesError("Сначала сохраните профиль мастера.");
      setServicesStatus("needs-verification");
      return;
    }
    setServiceActionStatus("loading");
    setServiceMessage("");
    setServicesError("");
    try {
      const payload = { ...serviceForm, profile_id: profile.id, status: nextStatus };
      if (!serviceForm.id) ensureServiceEntitlement(payload, "");
      const saved = serviceForm.id
        ? await updateOwnService(serviceForm.id, payload, session)
        : await createOwnService(payload, session);
      setServices((current) => [saved, ...current.filter((item) => item.id !== saved?.id)].filter(Boolean));
      setServiceForm(createEmptyServiceForm(saved || payload));
      setServicesStatus("success");
      setServiceActionStatus("success");
      setServiceMessage(serviceForm.id ? "Услуга обновлена." : "Черновик услуги сохранён.");
      setServicesError("");
    } catch (error) {
      setServicesStatus("needs-verification");
      setServiceActionStatus("error");
      setServicesError(moduleError(error, "profile_cabinet_services request failed or migration/RLS not applied"));
    }
  };

  const handleServicePublish = async () => {
    if (!profile?.id || !hasProfileLiteSessionCredential(session)) {
      setServicesError("Сначала сохраните профиль мастера.");
      setServicesStatus("needs-verification");
      return;
    }
    setServiceActionStatus("loading");
    setServiceMessage("");
    setServicesError("");
    try {
      ensureServiceEntitlement({ ...serviceForm, profile_id: profile.id, status: "published" }, serviceForm.id);
      const saved = await publishOwnService({ ...serviceForm, profile_id: profile.id }, null, session);
      setServices((current) => [saved, ...current.filter((item) => item.id !== saved?.id)].filter(Boolean));
      setServiceForm(createEmptyServiceForm(saved || { ...serviceForm, status: "published" }));
      setServicesStatus("success");
      setServiceActionStatus("success");
      setServiceMessage("Услуга опубликована.");
      setServicesError("");
    } catch (error) {
      setServicesStatus("needs-verification");
      setServiceActionStatus("error");
      setServicesError(moduleError(error, "profile_cabinet_services publish failed or migration/RLS not applied"));
    }
  };

  const handleServiceStatusChange = async (status, serviceOverride = null) => {
    if (!profile?.id || !hasProfileLiteSessionCredential(session)) {
      setServicesError("Сначала сохраните профиль мастера.");
      setServicesStatus("needs-verification");
      return;
    }
    const targetService = serviceOverride?.id ? createEmptyServiceForm(serviceOverride) : serviceForm;
    if (!targetService.id) {
      setServicesError("Выберите услугу из списка перед сменой статуса.");
      setServicesStatus("needs-verification");
      return;
    }
    const normalizedStatus = status === "published" ? "published" : status === "archived" ? "archived" : "draft";
    setServiceActionStatus("loading");
    setServiceMessage("");
    setServicesError("");
    try {
      if (normalizedStatus === "published") {
        ensureServiceEntitlement({ ...targetService, profile_id: profile.id, status: normalizedStatus }, targetService.id);
      }
      const saved = await updateOwnService(targetService.id, { ...targetService, profile_id: profile.id, status: normalizedStatus }, session);
      setServices((current) => [saved, ...current.filter((item) => item.id !== saved?.id)].filter(Boolean));
      setServiceForm(createEmptyServiceForm(saved || { ...targetService, status: normalizedStatus }));
      setServicesStatus("success");
      setServiceActionStatus("success");
      setServiceMessage(
        normalizedStatus === "published"
          ? "Услуга опубликована."
          : normalizedStatus === "archived"
            ? "Услуга перенесена в архив."
            : "Услуга возвращена в черновик."
      );
    } catch (error) {
      setServicesStatus("needs-verification");
      setServiceActionStatus("error");
      setServicesError(moduleError(error, "profile_cabinet_services status update failed or migration/RLS not applied"));
    }
  };

  const handleCreateClientInvite = async () => {
    if (!profile?.id || !hasProfileLiteSessionCredential(session)) {
      setServicesError("Сначала сохраните профиль мастера.");
      setServicesStatus("needs-verification");
      return;
    }
    setServiceActionStatus("loading");
    setServiceMessage("");
    setServicesError("");
    try {
      const invite = await createClientInvite({
        ...clientInviteForm,
        service_id: clientInviteForm.service_id || serviceForm.id || ""
      }, session);
      setClientInvites((current) => [invite, ...current.filter((item) => item.id !== invite?.id)].filter(Boolean));
      setClientInviteForm(EMPTY_CLIENT_INVITE_FORM);
      setServiceActionStatus("success");
      setServicesStatus("success");
      setServiceMessage("Ссылка для клиента создана.");
    } catch (error) {
      setServiceActionStatus("error");
      setServicesStatus("needs-verification");
      setServicesError(moduleError(error, "profile_cabinet_client_invites create failed or migration/RLS not applied"));
    }
  };

  const handleAddServiceToFeed = async (activityType = "service_created") => {
    if (!profile?.id || !hasProfileLiteSessionCredential(session)) {
      setServicesError("Сначала сохраните профиль мастера.");
      setServicesStatus("needs-verification");
      return;
    }
    if (!serviceForm.id) {
      setServicesError("Выберите опубликованную услугу из списка.");
      setServicesStatus("needs-verification");
      return;
    }
    if (serviceForm.status !== "published") {
      setServicesError("Сначала опубликуйте услугу, затем добавьте её в ленту.");
      setServicesStatus("needs-verification");
      return;
    }
    setServiceActionStatus("loading");
    setServiceMessage("");
    setServicesError("");
    try {
      const result = await createOrUpdatePendingActivityEvent(
        buildServiceActivityEvent(serviceForm, profile.id, activityType),
        session
      );
      setServicesStatus("success");
      setServiceActionStatus("success");
      setServiceMessage(result.message);
    } catch (error) {
      setServicesStatus("needs-verification");
      setServiceActionStatus("error");
      setServicesError(moduleError(error, "profile_cabinet_activity_events service create failed or migration/RLS not applied"));
    }
  };

  const handleSubmitServiceOrderToMaster = async (order) => {
    if (!profile?.id || !order?.id || !hasProfileLiteSessionCredential(session)) return;
    const selectedPhoto = clientGoalPhotos.find((photo) => photo.id === orderConfirmation.photoId);
    if (!selectedPhoto) {
      setOrderConfirmation((current) => ({
        ...current,
        orderId: order.id,
        status: "error",
        message: "Загрузите своё фото, чтобы отправить заказ в работу Мастеру."
      }));
      return;
    }
    setOrderConfirmation((current) => ({ ...current, orderId: order.id, status: "loading", message: "" }));
    try {
      const saved = await submitServiceOrderToMaster(order.id, {
        clientProfileId: profile.id,
        photo: selectedPhoto,
        requestText: orderConfirmation.requestText
      }, session);
      setClientOrders((current) => current.map((item) => item.id === saved.id ? { ...item, ...saved, service: saved.service || item.service } : item));
      setOrderConfirmation(EMPTY_ORDER_CONFIRMATION);
      setOrdersStatus("success");
      setOrdersError("");
    } catch (error) {
      setOrderConfirmation((current) => ({
        ...current,
        orderId: order.id,
        status: "error",
        message: moduleError(error, "Не удалось отправить заказ мастеру.")
      }));
      setOrdersStatus("needs-verification");
      setOrdersError(moduleError(error, "profile_cabinet_service_orders submit failed or migration/RLS not applied"));
    }
  };

  const handleGenerateDraftResultComposition = async (order) => {
    if (!order?.id || !hasProfileLiteSessionCredential(session)) return;
    try {
      const saved = await generateDraftResultComposition(order.id, session);
      setOrders((current) => current.map((item) => item.id === saved.id ? { ...item, ...saved, service: saved.service || item.service } : item));
      setOrdersStatus("success");
      setOrdersError("");
      if (saved.draft_result_composition_id) {
        await openCompositionInMandalas(saved.draft_result_composition_id, "Черновик мандалы заказа создан и открыт в конструкторе.");
      }
    } catch (error) {
      setOrdersStatus("needs-verification");
      setOrdersError(moduleError(error, "Не удалось создать мандалу заказа. Проверьте template composition, фото клиента и RLS."));
    }
  };

  const handleOpenOrderResult = async (order, mode = "draft") => {
    const compositionId = mode === "final" ? order?.final_result_composition_id : order?.draft_result_composition_id;
    try {
      await openCompositionInMandalas(compositionId, mode === "final" ? "Финальный результат заказа открыт в конструкторе." : "Черновик мандалы заказа открыт в конструкторе.");
    } catch (error) {
      setOrdersStatus("needs-verification");
      setOrdersError(moduleError(error, "Мандала результата не открылась."));
    }
  };

  const handleDownloadOrderResult = async (order) => {
    try {
      const composition = await openCompositionInMandalas(order?.final_result_composition_id, "Результат открыт. Скачать PDF / Печать в PDF доступна в конструкторе.");
      window.setTimeout(() => {
        try {
          openPowerPlacePdfPrintView(composition?.title || order?.service?.title || "power-place");
        } catch (error) {
          setCompositionMessage(moduleError(error, "PDF preview failed"));
        }
      }, 100);
    } catch (error) {
      setOrdersStatus("needs-verification");
      setOrdersError(moduleError(error, "Результат для скачивания не открылся."));
    }
  };

  const handleSendOrderResultToClient = async (order) => {
    if (!order?.id || !hasProfileLiteSessionCredential(session)) return;
    const patch = orderPatch.id === order.id ? orderPatch : { ...EMPTY_ORDER_PATCH, id: order.id };
    const resultCompositionId = patch.resultCompositionId || order.draft_result_composition_id || compositionDraft.id;
    try {
      const saved = await sendOrderResultToClient(order.id, resultCompositionId, patch.master_comment || order.master_comment || "", session);
      setOrders((current) => current.map((item) => item.id === saved.id ? { ...item, ...saved, service: saved.service || item.service } : item));
      setClientOrders((current) => current.map((item) => item.id === saved.id ? { ...item, ...saved, service: saved.service || item.service } : item));
      setOrderPatch(EMPTY_ORDER_PATCH);
      setOrdersStatus("success");
      setOrdersError("");
    } catch (error) {
      setOrdersStatus("needs-verification");
      setOrdersError(moduleError(error, "profile_cabinet_service_orders result send failed or migration/RLS not applied"));
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

  const handleStartChatWithMaster = async (masterProfileId) => {
    if (!profile?.id || !masterProfileId || !hasProfileLiteSessionCredential(session)) return;
    setChatsStatus("loading");
    setChatsError("");
    try {
      const conversationId = await createConversationWithMaster(profile.id, masterProfileId, session);
      const threads = (await listOwnChatThreads(profile.id, session)).map((thread) => ({ ...thread, ownerProfileId: profile.id }));
      setChatThreads(threads);
      setSelectedThreadId(conversationId || threads[0]?.conversation_id || "");
      setChatsStatus("success");
      setChatsError("");
    } catch (error) {
      setChatsStatus("needs-verification");
      setChatsError(moduleError(error, "profile_cabinet_chat_conversations create failed or migration/RLS not applied"));
    }
  };

  if (!user || authStatus !== "success") {
    const authGateCabinetLabel = getProfileLiteRoleById(cabinetRole).label;
    return (
      <div className="cabinetShell profileLiteShell profileLiteFullShell">
        <header className="cabinetTopbar">
          <button type="button" onClick={onNavigateHome}>На главную</button>
          <div>
            <p>Альтернативный кабинет</p>
            <h1>{authGateCabinetLabel} Lite</h1>
          </div>
          <button type="button" onClick={onNavigateMasters}>Мастера</button>
        </header>
        <main className="cabinetMain profileLiteMain">
          <section className="cabinetCard profileLitePanel">
            <p className="cabinetEyebrow">Auth flow</p>
            <h2>Вход в кабинет</h2>
            {window.location.pathname === "/profile/orders" && (
              <div className="cabinetNotice compactNotice">Войдите через Google, чтобы открыть Кабинет Личный / Мои Заказы. Корзина заказа сохранена на 24 часа.</div>
            )}
            {!supabaseEnv.isConfigured && <div className="cabinetNotice compactNotice">Supabase не настроен. Кабинет не зависает и ждёт настройки окружения.</div>}
            {authStatus === "loading" && <div className="cabinetNotice compactNotice">Сессия найдена, открываю оболочку...</div>}
            {authError && <div className="cabinetError">{authError}</div>}
            <div className="cabinetActions">
              <button className="cabinetGoogle" type="button" onClick={handleGoogleLogin} disabled={!supabaseEnv.isConfigured}>Войти через Google</button>
              <button className="cabinetSecondary" type="button" onClick={resetLocalState}>Сбросить сессию</button>
              <button className="cabinetGhost" type="button" onClick={refreshShell}>Повторить</button>
            </div>
          </section>
        </main>
      </div>
    );
  }

  const moduleProps = {
    activeSettings,
    accountPlan,
    cabinetRole,
    chatDraft,
    chatThreads,
    approvedChatProfiles,
    approvedChatProfilesError,
    approvedChatProfilesStatus,
    chatsError,
    chatsStatus,
    cabinetRole,
    clientGoalPhotos,
    clientInviteForm,
    clientInvites,
    clientOrders,
    clientPhotoForm,
    compositionDraft,
    compositionMessage,
    courseLessons,
    courseLessonsError,
    courseLessonsStatus,
    courseSteps,
    courses,
    coursesError,
    coursesStatus,
    form,
    materialFile,
    materialForm,
    materials,
    materialsError,
    materialsFeedMessage,
    materialsStatus,
    mediaError,
    mediaStatus,
    moduleStates,
    orderConfirmation,
    orderPatch,
    orders,
    ordersError,
    ordersStatus,
    pendingCartMessage,
    planLimits,
    powerPlaceFeedForm,
    powerPlaceFeedStatus,
    powerPlaceCompositions: masterPowerPlaceCompositions,
    profile,
    profileError,
    profileStatus,
    saveMessage,
    saveStatus,
    selectedCourseId,
    selectedStepId,
    selectedThreadId,
    serviceActionStatus,
    serviceForm,
    serviceMessage,
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
        clientDirectory={clientDirectory}
        clientSaveForm={clientSaveForm}
        onClientPhotoDelete={handleDeleteClientPhoto}
        onClientSaveCancel={() => setClientSaveForm(EMPTY_CLIENT_SAVE_FORM)}
        onClientSaveFormChange={handleClientSaveFormChange}
        onClientSaveSubmit={handleSaveCompositionForClient}
        onCompositionCoverSelect={handleCompositionCoverSelect}
        onCompositionDelete={handleCompositionDelete}
        onCompositionDraftChange={handleCompositionDraftChange}
        onCompositionLoad={handleCompositionLoad}
        onStartNewDraft={handleCompositionStartNewDraft}
        onCompositionObjectRefSelect={setCompositionObjectRef}
        onCompositionObjectRefsChange={handleCompositionObjectRefsChange}
        onCoverFileUpload={handleCompositionCoverFileUpload}
        onAddCompositionToServices={handleSendCompositionToServices}
        onDownload={handleDownloadComposition}
        onLibraryPhotoUpload={handleLibraryClientPhotoUpload}
        onObjectFileUpload={handleCompositionObjectFileUpload}
        onOpenClientSave={handleOpenClientSave}
        onPrint={handlePrintComposition}
        onPublishAsService={handlePublishCompositionAsService}
        onPublishToFeed={handlePublishCompositionToFeed}
        onFeedFormChange={handlePowerPlaceFeedFormChange}
        onSaveNew={handleCompositionSaveNew}
        onSendToServices={handleSendCompositionToServices}
        services={services}
        onUpdateExisting={handleCompositionUpdateExisting}
        onUploadedCentralPhoto={handleUploadedCentralPhoto}
      />
    ),
    media: (
      <ProfileLiteMediaModule
        {...moduleProps}
        onClientPhotoDelete={handleDeleteClientPhoto}
        onClientPhotoCategoryMove={handleClientPhotoCategoryMove}
        onClientPhotoFieldChange={(field, value) => setClientPhotoForm((current) => ({ ...current, [field]: value }))}
        onClientPhotoFileChange={(event) => setClientPhotoForm((current) => ({ ...current, file: event.target.files?.[0] || null, image_url: event.target.files?.[0] ? "" : current.image_url }))}
        onClientPhotoSave={handleClientPhotoSave}
        onLibraryPhotoUpload={handleLibraryClientPhotoUpload}
      />
    ),
    materials: (
      <ProfileLiteMaterialsModule
        materialFile={materialFile}
        materials={materials}
        materialsError={materialsError}
        materialsStatus={materialsStatus}
        materialsFeedMessage={materialsFeedMessage}
        onAddToFeed={handleAddMaterialToFeed}
        onDelete={handleGrimoireDelete}
        onMultiUpload={handleGrimoireMultiUpload}
        onUpdate={handleGrimoireUpdate}
      />
    ),
    courses: (
      <ProfileLiteCoursesModule
        {...moduleProps}
        onCourseSelect={(courseId) => {
          setSelectedCourseId(courseId);
          setSelectedStepId("");
          setCourseLessons([]);
        }}
        onStepSelect={setSelectedStepId}
      />
    ),
    services: (
      <ProfileLiteServicesModule
        {...moduleProps}
        activeView="services"
        clientDirectory={clientDirectory}
        selectedClient={selectedClient}
        selectedClientKey={selectedClientKey}
        onClientSelect={setSelectedClientKey}
        onFieldChange={(field, value) => setServiceForm((current) => ({ ...current, [field]: value }))}
        onAddToFeed={handleAddServiceToFeed}
        onClientInviteFieldChange={(field, value) => setClientInviteForm((current) => ({ ...current, [field]: value }))}
        onCreateClientInvite={handleCreateClientInvite}
        onPublish={handleServicePublish}
        onSave={handleServiceSave}
        onServiceSelect={(service) => {
          setServiceForm(createEmptyServiceForm(service));
          setServiceMessage("Услуга выбрана для редактирования.");
          setServicesError("");
        }}
        onStatusChange={handleServiceStatusChange}
      />
    ),
    clients: (
      <ProfileLiteServicesModule
        {...moduleProps}
        activeView="clients"
        clientDirectory={clientDirectory}
        selectedClient={selectedClient}
        selectedClientKey={selectedClientKey}
        onClientSelect={setSelectedClientKey}
        onFieldChange={(field, value) => setServiceForm((current) => ({ ...current, [field]: value }))}
        onAddToFeed={handleAddServiceToFeed}
        onClientInviteFieldChange={(field, value) => setClientInviteForm((current) => ({ ...current, [field]: value }))}
        onCreateClientInvite={handleCreateClientInvite}
        onPublish={handleServicePublish}
        onSave={handleServiceSave}
        onServiceSelect={(service) => {
          setServiceForm(createEmptyServiceForm(service));
          setServiceMessage("Услуга выбрана для редактирования.");
          setServicesError("");
        }}
        onStatusChange={handleServiceStatusChange}
      />
    ),
    orders: (
      <ProfileLiteOrdersModule
        {...moduleProps}
        onClientPhotoFieldChange={(field, value) => setClientPhotoForm((current) => ({ ...current, [field]: value }))}
        onClientPhotoFileChange={(event) => setClientPhotoForm((current) => ({ ...current, file: event.target.files?.[0] || null, image_url: event.target.files?.[0] ? "" : current.image_url }))}
        onClientPhotoSave={handleClientPhotoSave}
        onOrderConfirmationChange={(patch) => setOrderConfirmation((current) => ({ ...current, ...patch }))}
        onGenerateDraftResult={handleGenerateDraftResultComposition}
        onOpenOrderResult={handleOpenOrderResult}
        onDownloadOrderResult={handleDownloadOrderResult}
        onOrderPatchChange={(patch) => setOrderPatch((current) => ({ ...current, ...patch }))}
        onSendOrderResult={handleSendOrderResultToClient}
        onSubmitOrderToMaster={handleSubmitServiceOrderToMaster}
      />
    ),
    chats: (
      <ProfileLiteChatsModule
        {...moduleProps}
        onChatDraftChange={setChatDraft}
        onSendMessage={handleSendMessage}
        onStartChatWithMaster={handleStartChatWithMaster}
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
      cabinetRole={cabinetRole}
      onCabinetRoleChange={handleCabinetRoleChange}
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
