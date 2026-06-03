import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import {
  createProfileLiteDiagnostics,
  createProfileLiteForm,
  createProfileLiteSavePayload,
  createProfileLiteShellViewModel,
  getProfileLiteRouteByTabId,
  getProfileLiteTabById,
  PROFILE_LITE_TABS,
  safeProfileLiteError
} from "../src/lib/profileLiteClient.js";

const expectedTabs = [
  ["overview", "Обзор"],
  ["profile", "Профиль"],
  ["mandalas", "Место силы"],
  ["media", "Фото / Медиа"],
  ["materials", "Материалы"],
  ["services", "Услуги"],
  ["orders", "Заказы"],
  ["chats", "Чаты"],
  ["settings", "Настройки"],
  ["diagnostics", "Диагностика"]
];

assert.deepEqual(
  PROFILE_LITE_TABS.map((tab) => [tab.id, tab.label]),
  expectedTabs,
  "Profile Lite cabinet should expose the complete tab map"
);

assert.deepEqual(
  PROFILE_LITE_TABS.map((tab) => [tab.id, tab.href]),
  [
    ["overview", "/profile"],
    ["profile", "/profile?tab=profile"],
    ["mandalas", "/profile/mandalas"],
    ["media", "/profile?tab=media"],
    ["materials", "/profile?tab=materials"],
    ["services", "/profile/services"],
    ["orders", "/profile/orders"],
    ["chats", "/profile/chats"],
    ["settings", "/profile/settings"],
    ["diagnostics", "/profile?tab=diagnostics"]
  ],
  "Profile Lite tabs must be backed by stable URL paths or query strings"
);

assert.equal(getProfileLiteTabById("missing").id, "overview");
assert.equal(getProfileLiteTabById("orders").label, "Заказы");
assert.equal(getProfileLiteTabById("mandalas").label, "Место силы");
assert.equal(getProfileLiteRouteByTabId("mandalas"), "/profile/mandalas");
assert.equal(getProfileLiteRouteByTabId("services"), "/profile/services");
assert.equal(getProfileLiteRouteByTabId("orders"), "/profile/orders");
assert.equal(getProfileLiteRouteByTabId("chats"), "/profile/chats");
assert.equal(getProfileLiteRouteByTabId("settings"), "/profile/settings");
assert.equal(getProfileLiteRouteByTabId("media"), "/profile?tab=media");

const fullForm = createProfileLiteForm({
  display_name: "Master",
  bio: "Bio",
  city: "Barcelona",
  country: "Spain",
  telegram: "@master",
  website: "https://example.com",
  avatar_url: "https://example.com/avatar.jpg",
  account_plan: "pro",
  status: "approved"
});

for (const field of [
  "display_name",
  "bio",
  "city",
  "country",
  "telegram",
  "website",
  "avatar_url",
  "account_plan",
  "status"
]) {
  assert.ok(Object.hasOwn(fullForm, field), `profile lite form should include ${field}`);
}

const payload = createProfileLiteSavePayload({
  display_name: " Master ",
  bio: " Bio ",
  city: " Barcelona ",
  country: " Spain ",
  telegram: " @master ",
  website: " https://example.com ",
  avatar_url: " https://example.com/avatar.jpg ",
  account_plan: "pro",
  status: "approved"
}, { id: "user-1" }, "pending");

assert.deepEqual(payload, {
  user_id: "user-1",
  display_name: "Master",
  bio: "Bio",
  city: "Barcelona",
  country: "Spain",
  telegram: "@master",
  website: "https://example.com",
  avatar_url: "https://example.com/avatar.jpg",
  account_plan: "pro",
  status: "pending"
});

let profileLoaderCalled = false;
const shell = await createProfileLiteShellViewModel({
  supabaseConfigured: true,
  session: { access_token: "present" },
  sessionExpired: false,
  getCurrentUser: async () => ({ id: "user-1", email: "master@example.com" }),
  getOwnProfile: async () => {
    profileLoaderCalled = true;
    throw new Error("Profile should not block shell");
  }
});

assert.equal(shell.authStatus, "success");
assert.equal(shell.user.id, "user-1");
assert.equal(shell.profile, null);
assert.equal(profileLoaderCalled, false, "own profile loading must not be part of shell bootstrap");

const diagnosticText = JSON.stringify(createProfileLiteDiagnostics({
  supabaseConfigured: true,
  session: {
    access_token: "jwt.header.payload",
    refresh_token: "refresh-secret",
    authorization: "Bearer secret",
    headers: { apikey: "anon" }
  },
  user: { id: "user-1", email: "master@example.com" },
  authStatus: "success"
}));

assert.doesNotMatch(diagnosticText, /jwt\.header\.payload|refresh-secret|Bearer secret|apikey|anon/);
assert.equal(safeProfileLiteError(new Error("failed https://project.supabase.co token abc.def.ghi")), "failed [url hidden] token [token hidden]");

const moduleDir = "src/pages/profile-lite";
assert.equal(existsSync(moduleDir), true, "Profile Lite cabinet modules directory should exist");

for (const file of [
  "ProfileLiteShell.jsx",
  "ProfileLiteOverview.jsx",
  "ProfileLiteProfileModule.jsx",
  "ProfileLiteMandalasModule.jsx",
  "ProfileLiteMediaModule.jsx",
  "ProfileLiteMaterialsModule.jsx",
  "ProfileLitePowerPlaceModule.jsx",
  "ProfileLitePowerPlaceModuleBase.jsx",
  "ProfileLiteImagePicker.jsx",
  "ProfileLiteServicesModule.jsx",
  "ProfileLiteOrdersModule.jsx",
  "ProfileLiteChatsModule.jsx",
  "ProfileLiteSettingsModule.jsx",
  "ProfileLiteDiagnosticsModule.jsx"
]) {
  assert.equal(existsSync(join(moduleDir, file)), true, `${file} should exist`);
}

const moduleSource = readdirSync(moduleDir)
  .filter((file) => file.endsWith(".jsx"))
  .map((file) => readFileSync(join(moduleDir, file), "utf8"))
  .join("\n");
const readmeSource = readFileSync("README.md", "utf8");
const compactChessMigrationSource = readFileSync("supabase/migrations/20260602120000_power_place_chess_compact_variant.sql", "utf8");
const migrationRunnerSource = readFileSync("scripts/apply-reiki-supabase-migrations.mjs", "utf8");

for (const label of expectedTabs.map(([, label]) => label)) {
  assert.match(moduleSource, new RegExp(label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")), `module source should include ${label}`);
}

for (const forbidden of [
  "refresh_token",
  "VITE_SUPABASE_URL",
  "VITE_SUPABASE_ANON_KEY",
  "service_role",
  "service-role"
]) {
  assert.equal(moduleSource.includes(forbidden), false, `Profile Lite modules must not include ${forbidden}`);
}

const powerPlaceWrapperSource = readFileSync(join(moduleDir, "ProfileLitePowerPlaceModule.jsx"), "utf8");
const powerPlaceBaseSource = readFileSync(join(moduleDir, "ProfileLitePowerPlaceModuleBase.jsx"), "utf8");
const powerPlaceSource = `${powerPlaceWrapperSource}\n${powerPlaceBaseSource}`;
const imagePickerSource = readFileSync(join(moduleDir, "ProfileLiteImagePicker.jsx"), "utf8");
const powerPlacePickerSource = `${powerPlaceSource}\n${imagePickerSource}`;
const shellSource = readFileSync(join(moduleDir, "ProfileLiteShell.jsx"), "utf8");
const profileLitePageSource = readFileSync("src/pages/ProfileLitePage.jsx", "utf8");
const libraryUploadSource = profileLitePageSource.match(/const handleLibraryClientPhotoUpload[\s\S]*?const handleDeleteClientPhoto/)?.[0] || "";
const powerPlaceClientSource = readFileSync("src/lib/powerPlaceClient.js", "utf8");
const backgroundZoneControlsSource = readFileSync("public/profile-background-zone-controls.js", "utf8");
const backgroundTabsRefineSource = readFileSync("public/profile-background-tabs-refine.js", "utf8");
const profileMandalaCss = readFileSync("src/profileMandalaWorkspace.css", "utf8");
const mandalaTemplatePilotCss = readFileSync("src/profileMandalaTemplatePilot.css", "utf8");
const mandalaTemplateSource = readFileSync("src/data/placePowerMandalaTemplates.js", "utf8");
const overviewModuleSource = readFileSync(join(moduleDir, "ProfileLiteOverview.jsx"), "utf8");
const profileModuleSource = readFileSync(join(moduleDir, "ProfileLiteProfileModule.jsx"), "utf8");
const mediaModuleSource = readFileSync(join(moduleDir, "ProfileLiteMediaModule.jsx"), "utf8");
const materialsModuleSource = readFileSync(join(moduleDir, "ProfileLiteMaterialsModule.jsx"), "utf8");
const servicesModuleSource = readFileSync(join(moduleDir, "ProfileLiteServicesModule.jsx"), "utf8");
const ordersModuleSource = readFileSync(join(moduleDir, "ProfileLiteOrdersModule.jsx"), "utf8");
const chatsModuleSource = readFileSync(join(moduleDir, "ProfileLiteChatsModule.jsx"), "utf8");
const settingsModuleSource = readFileSync(join(moduleDir, "ProfileLiteSettingsModule.jsx"), "utf8");
const diagnosticsModuleSource = readFileSync(join(moduleDir, "ProfileLiteDiagnosticsModule.jsx"), "utf8");

for (const requiredPowerPlaceText of [
  "Мастерская мандал",
  "Место силы",
  "Добавить фото",
  "Группа",
  "Категория",
  "Подкатегория / Ступень",
  "Избранные",
  "Последние фото",
  "Фото клиента / цели",
  "Фон Места Силы",
  "Фон внутри",
  "Фон снаружи",
  "Без фона",
  "Макет",
  "Размер внутреннего поля",
  "Отчёт и анализ",
  "Ресурс без мандалы",
  "Ресурс с мандалой",
  "Объекты композиции",
  "Сохранить место силы",
  "Скачать PDF",
  "Печать",
  "Для цветной печати включите в окне печати: Background graphics / Фоновая графика.",
  "Загрузить фото",
  "Удалить фото из базы?"
]) {
  assert.match(powerPlacePickerSource, new RegExp(requiredPowerPlaceText.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")), `Lite Power Place should include old workshop UX text: ${requiredPowerPlaceText}`);
}

assert.doesNotMatch(powerPlaceSource, /Выбрать из базы/, "Profile Lite left rail should not render the old select-from-base button");
assert.doesNotMatch(powerPlaceSource, /powerChooseBaseButton/, "Profile Lite left rail should remove the old select-from-base button class");
assert.match(powerPlaceSource, /data-compact-photo-list="true"/, "Profile Lite left rail should expose a compact photo list marker");
assert.match(powerPlaceSource, /aria-label="Компактный список фото"/, "Profile Lite left rail should label the compact photo list");
assert.match(powerPlaceSource, /data-delete-photo-button="true"/, "Profile Lite left rail should expose a delete button marker for client photos");
assert.match(powerPlaceSource, /openPicker\("library"\)/, "left rail upload should open explicit library upload mode");
assert.doesNotMatch(powerPlaceSource, /openPicker\(selectedSlot \? "object" : "center"\)/, "left rail upload must not infer target upload from selected slot state");
assert.match(powerPlaceSource, /value: "favorites"[\s\S]*label: "Избранные"/, "Profile Lite left filter should include favorites as a source group");
assert.match(powerPlaceSource, /<option value="">Последние фото<\/option>/, "Profile Lite left filter should default to latest photos when no filter is selected");

for (const requiredSourceGroup of ["ДАО РИ", "Мистерии", "Каналы", "Фон", "Форма", "Талисманы", "Артефакты", "Клиенты"]) {
  assert.match(powerPlaceSource, new RegExp(requiredSourceGroup), `Lite Power Place should expose old source taxonomy group: ${requiredSourceGroup}`);
}

for (const requiredFormat of ["2", "4", "6", "8", "8+", "12", "12+", "closed", "open", "classic-14", "classic-8", "plus-8", "client", "altar", "business", "dao"]) {
  assert.match(powerPlaceSource, new RegExp(requiredFormat.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")), `Lite Power Place should expose format ${requiredFormat}`);
}

for (const requiredClass of [
  "mandalaWorkspace",
  "workspaceMainColumns",
  "workspaceCenterColumn",
  "workspaceRightColumn",
  "powerPlaceConstructor",
  "powerPlacePrintArea",
  "powerMandalaPanel",
  "powerCenterPhoto",
  "powerLibrarySidebar",
  "powerPlaceSettings",
  "coverPickerPanel",
  "objectImageEditor",
  "clientPhotoPickerModal"
]) {
  assert.match(powerPlacePickerSource, new RegExp(requiredClass), `Lite Power Place should reuse visual workshop class ${requiredClass}`);
}

assert.doesNotMatch(powerPlaceSource, /mandalaWorkspace powerPlaceMode/, "Lite Power Place must not use the old two-column powerPlaceMode override");
assert.match(
  powerPlaceSource,
  /<aside className="mandalaModeSidebar powerLibrarySidebar"[\s\S]*<div className="workspaceCenterColumn"[\s\S]*<div className="workspaceRightColumn"/,
  "Lite Power Place should render old left / center / right workspace columns in order"
);
assert.match(powerPlaceSource, /import \{ reikiLevels \}/, "Lite Power Place DAO RI hierarchy should be backed by the canonical Reiki levels");
assert.match(powerPlaceSource, /SOURCE_LIBRARY_CATEGORIES[\s\S]*value: "dao-ri"[\s\S]*subcategories: reikiLevels\.map/, "Lite Power Place should copy old DAO RI level hierarchy instead of a flat label");
assert.match(powerPlaceSource, /activeSourceSubcategoryData\?\.thirdLevels\?\.length[\s\S]*Подкатегория \/ Ступень[\s\S]*<select/, "Lite Power Place should expose DAO RI third-level filtering as a compact select");
assert.doesNotMatch(powerPlaceSource, /aria-label="Быстрые группы источников"/, "Profile Lite left rail should not render the old large quick-group catalog");
assert.doesNotMatch(powerPlaceSource, /activeSourceSubcategoryData\?\.steps\.map/, "Profile Lite left rail should not render the old large DAO step button catalog");
assert.match(powerPlaceSource, /const ZODIAC_SIGNS = \[/, "Lite Power Place should copy old zodiac sign placement definitions");
assert.match(powerPlaceSource, /ZODIAC_PLUS_SLOT_LAYOUT/, "Lite Power Place should copy old zodiac plus placement definitions");
assert.match(powerPlaceSource, /const CHESS_TOP_SLOTS = Array\.from/, "Lite Power Place should copy old chess top row slot definitions");
assert.match(powerPlaceSource, /CHESS_SLOT_LAYOUTS[\s\S]*row: 5, col: 3/, "Lite Power Place should copy old chess board coordinate layout");
assert.match(powerPlaceSource, /value: "classic-14"[\s\S]*label: "15 фоток"[\s\S]*slotCount: 14/, "classic-14 UI label should count the central photo as the 15th photo");
assert.match(powerPlaceSource, /value: "classic-8"[\s\S]*label: "9 фоток"[\s\S]*slotCount: 8/, "classic-8 UI label should count the central photo as the 9th photo");
assert.match(powerPlaceSource, /value: "plus-8"[\s\S]*label: "9 фото\+"[\s\S]*slotCount: 8/, "plus-8 UI label should count the central photo as the 9th photo");
assert.match(powerPlaceSource, /value: "compact-5"[\s\S]*label: "6 фоток"[\s\S]*slotCount: 5/, "compact-5 UI label should count the central photo as the 6th photo");
assert.match(powerPlaceSource, /CHESS_SLOT_LAYOUTS[\s\S]*"compact-5"[\s\S]*id: "chess-5"/, "Lite chess compact-5 layout should define exactly five source slots");
assert.match(powerPlaceSource, /CHESS_SLOT_LAYOUTS[\s\S]*outer-square[\s\S]*inner-square/, "Lite chess plus-8 should use outer and inner square markers");
assert.match(powerPlaceSource, /CHESS_SLOT_LAYOUTS[\s\S]*"compact-5"[\s\S]*compact-pentagon/, "Lite chess compact-5 should expose a stable pentagon/ring placement marker");
assert.doesNotMatch(powerPlaceSource, /buildSlotList[\s\S]*type === "chess"[\s\S]*\.\.\.CHESS_TOP_SLOTS/, "Lite chess source slot lists should not automatically add top-row slots");
assert.doesNotMatch(powerPlaceSource, /<div className="power-place-chess__top-row"[\s\S]*CHESS_TOP_SLOTS\.map/, "Lite chess top-row should not render unconditionally for every chess variant");
assert.match(profileMandalaCss, /\.power-place-chess--plus-8 \.power-place-chess__center,[\s\S]*\.power-place-chess--compact-5 \.power-place-chess__center[\s\S]*height: auto;[\s\S]*aspect-ratio: 1 \/ 1;/, "absolute chess variants should override the shared center height so the center remains square");
assert.match(powerPlaceSource, /chess_slot_scale/, "Lite chess should persist a slot size control value in the composition draft");
assert.match(profileLitePageSource, /slot_scale:\s*1/, "Profile Lite empty composition should include the shared slot_scale field");
assert.match(powerPlaceSource, /function slotScaleValue/, "Lite Power Place should use a shared slot scale helper for all constructor formats");
assert.match(powerPlaceSource, /compositionDraft\.slot_scale\s*\?\?\s*objectRefs\.__slot_scale\s*\?\?\s*compositionDraft\.chess_slot_scale\s*\?\?\s*1/, "chess should keep persisted object_refs and existing chess_slot_scale fallback behind shared slot_scale");
assert.match(powerPlaceSource, /--power-source-slot-scale/, "Lite Power Place should expose shared source slot scale via a CSS variable");
assert.match(powerPlaceSource, /--power-place-chess-slot-scale/, "Lite chess should expose slot size via a CSS variable");
assert.match(powerPlaceSource, /Размер фото/, "Lite chess should render a visible photo size control");
assert.doesNotMatch(powerPlaceSource, /compositionDraft\.constructor_type === "chess" && \(\s*<div className="chessSizeControl"/, "Размер фото control should not be gated to chess only");
assert.match(powerPlaceSource, /powerPlaceFormatTitle[\s\S]*Формат:/, "format title should render above the mandala visual field");
assert.doesNotMatch(powerPlaceSource, /powerMandalaPanel[\s\S]*powerPrintMeta[\s\S]*Формат:/, "format title should not render inside the visual mandala field");
assert.match(powerPlaceSource, /renderCenterPhotoWithMode[\s\S]*Mentalica/, "all constructor center photos should share the Mentalica watermark helper");
assert.match(profileMandalaCss, /powerCenterWatermark[\s\S]*Mentalica|powerCenterWatermark/, "Mentalica watermark should have a CSS hook");
for (const scaledClass of [
  "powerSource",
  "zodiacPositionImage",
  "starPositionImage",
  "altarTopSource",
  "altarSupportSource",
  "businessVertexZone",
  "daoElementImage",
  "power-place-chess__slot"
]) {
  assert.match(profileMandalaCss, new RegExp(`${scaledClass.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}[\\s\\S]*--power-source-slot-scale|--power-source-slot-scale[\\s\\S]*${scaledClass.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`), `${scaledClass} should be wired to the shared source slot scale`);
}
assert.match(powerPlaceSource, /cover-mentalica[\s\S]*label: "Mentalica"/, "Lite fallback covers should include Mentalica");
assert.match(profileMandalaCss, /\.power-place-chess\.cover-mentalica/, "Chess CSS should render a Mentalica fallback cover tone");
assert.match(profileMandalaCss, /field-layout-square[\s\S]*--power-place-chess-card-aspect/, "Square field layout should affect chess card aspect");
assert.match(profileMandalaCss, /field-layout-vertical[\s\S]*--power-place-chess-card-aspect/, "Vertical field layout should affect chess card aspect");
assert.match(profileMandalaCss, /field-layout-horizontal[\s\S]*--power-place-chess-card-aspect/, "Horizontal field layout should affect chess card aspect");
assert.match(profileMandalaCss, /\.powerMandalaPanel\.field-layout-square[\s\S]*--power-field-aspect/, "field layout should expose panel aspect CSS variables");
assert.match(profileMandalaCss, /\.powerMandalaPanel\.field-layout-vertical[\s\S]*--power-field-aspect/, "vertical field layout should expose panel aspect CSS variables");
assert.match(profileMandalaCss, /\.powerMandalaPanel\.field-layout-horizontal[\s\S]*--power-field-aspect/, "horizontal field layout should expose panel aspect CSS variables");
assert.doesNotMatch(powerPlaceBaseSource, /value:\s*"rectangle"/, "Lite layout controls should expose only square, vertical, and horizontal");
assert.doesNotMatch(powerPlaceBaseSource, /field-layout-rectangle|layout === "rectangle"|field_layout:\s*"rectangle"/, "Lite Power Place should not keep the old rectangle layout key");
assert.match(powerPlaceBaseSource, /const FIELD_LAYOUTS = \[[\s\S]*value: "square"[\s\S]*value: "vertical"[\s\S]*value: "horizontal"[\s\S]*\];/, "Lite layout controls should define exactly three layout choices");
assert.match(powerPlaceBaseSource, /INNER_FIELD_SHAPES[\s\S]*value: "circle"[\s\S]*Круг[\s\S]*value: "square"[\s\S]*Квадрат/, "Lite layout controls should include inner field circle/square shape");
assert.match(powerPlaceBaseSource, /__inner_field_shape/, "inner field shape should persist through object_refs");
assert.match(powerPlaceBaseSource, /__inner_field_size/, "inner field size should persist through object_refs");
assert.match(powerPlaceBaseSource, /type="range"[\s\S]*min="60"[\s\S]*max="100"[\s\S]*step="1"/, "inner field size should be a 60-100 slider");
assert.match(profileMandalaCss, /--power-place-inner-field-size/, "inner field size should be exposed through a CSS variable");
assert.match(profileMandalaCss, /inner-field-shape-circle[\s\S]*border-radius:\s*50%/, "circle inner field should render round");
assert.match(profileMandalaCss, /inner-field-shape-square[\s\S]*border-radius:\s*0/, "square inner field should not render circular");
assert.match(powerPlaceSource, /BUSINESS_VERTICES[\s\S]*className: "top"[\s\S]*className: "left"[\s\S]*className: "right"/, "Lite Power Place should copy old three-vertex business layout");
assert.match(powerPlaceSource, /DAO_ELEMENTS[\s\S]*"water"[\s\S]*"wood"[\s\S]*"fire"[\s\S]*"earth"[\s\S]*"metal"/, "Lite Power Place should copy old DAO element order");
assert.match(powerPlaceSource, /powerCommandRail/, "Lite right rail should reuse old powerCommandRail shell");
assert.match(powerPlaceSource, /mandalaFieldLayoutSwitch/, "Lite right rail should reuse old mandala field layout switch");
assert.match(powerPlaceSource, /coverSelector/, "Lite right rail should reuse old cover selector shell");
assert.match(powerPlaceSource, /coverLayerTabs/, "Lite right rail should reuse old cover layer tabs");
assert.match(powerPlaceSource, /coverPreviewWrap/, "Lite right rail should reuse old cover preview structure");
assert.match(powerPlaceSource, /coverVariantList/, "Lite right rail should reuse old cover variant list");
assert.match(powerPlaceSource, /coverSelector[\s\S]*mandalaFieldLayoutSwitch/, "Lite right rail should place layout controls inside the Power Place background module");
assert.doesNotMatch(powerPlaceSource, /<section className="mandalaFieldLayoutSwitch">/, "Макет should not remain a standalone right-rail card");
assert.match(powerPlaceSource, /reportAnalysisPanel/, "Report and analysis should render as one compact right-rail card");
assert.match(powerPlaceSource, /С отчётом[\s\S]*Без отчёта/, "Report module should expose with/without report toggle");
for (const reportLabel of ["Анализ ситуации", "Что даёт мандала", "Что ещё поможет", "Ресурс без мандалы", "Ресурс с мандалой"]) {
  assert.match(powerPlaceSource, new RegExp(reportLabel), `Report module should include ${reportLabel}`);
}
assert.doesNotMatch(powerPlaceSource, /Доступно в Pro формате\.|О Мастере/, "Compact report should not keep the bulky disabled master note");
for (const reportAction of ["Добавить отчёт", "Обновить", "Удалить отчёт"]) {
  assert.match(powerPlaceSource, new RegExp(reportAction), `Report module should expose ${reportAction}`);
}
assert.match(powerPlaceSource, /reportEnabled[\s\S]*reportAdded[\s\S]*powerReportOutput/, "Report output should render under the mandala only when report mode is enabled and report is added");
assert.match(powerPlaceSource, /reportEnabled[\s\S]*resourceComparison/, "resource analysis fields should be gated by the report-enabled body");
assert.match(powerPlaceSource, /__profile_lite_report/, "Report payload should persist through object_refs without a DB migration");
assert.match(profileLitePageSource, /PROFILE_LITE_REPORT_REF_KEY[\s\S]*object_refs[\s\S]*normalizeProfileLiteReport/, "Profile Lite page should save report payload into object_refs");
assert.match(profileLitePageSource, /__field_layout/, "Profile Lite page should save layout through object_refs.__field_layout");
assert.match(profileLitePageSource, /__inner_field_shape/, "Profile Lite page should save inner field shape through object_refs.__inner_field_shape");
assert.match(profileLitePageSource, /__inner_field_size/, "Profile Lite page should save inner field size through object_refs.__inner_field_size");
assert.match(powerPlaceSource, /powerPlacePrintArea[\s\S]*powerReportOutput[\s\S]*Анализ ситуации[\s\S]*Что даёт мандала[\s\S]*Что ещё поможет/, "print/PDF area should include the working report sections");
assert.doesNotMatch(profileLitePageSource, /handleDownloadComposition[\s\S]*О Мастере/, "PDF flow must not rebuild the disabled Pro master note as export HTML");
assert.match(powerPlaceClientSource, /PROFILE_LITE_REPORT_REF_KEY[\s\S]*normalizeProfileLiteReport/, "Power Place API normalization should preserve the nested report object");
assert.match(powerPlaceClientSource, /INNER_FIELD_SHAPE_REF_KEY[\s\S]*normalizeInnerFieldShape/, "Power Place API normalization should preserve inner field shape object_ref");
assert.match(powerPlaceClientSource, /INNER_FIELD_SIZE_REF_KEY[\s\S]*normalizeInnerFieldSize/, "Power Place API normalization should preserve inner field size object_ref");
assert.match(backgroundZoneControlsSource, /closest\("\.profileLitePowerPlace"\)/, "legacy background zone enhancer should explicitly skip Profile Lite");
assert.match(backgroundTabsRefineSource, /closest\("\.profileLitePowerPlace"\)/, "legacy background tabs enhancer should explicitly skip Profile Lite");
assert.doesNotMatch(shellSource, /<header[\s\S]*<\/header>\s*<nav className="profileLiteTabs"/, "Profile Lite shell must not render cabinet tabs before the active module canonical hero");
assert.match(shellSource, /const shellChrome = \(/, "Profile Lite shell should expose tabs/status as canonical shell chrome");
assert.match(shellSource, /typeof children === "function"/, "ProfileLitePage/Shell integration should let modules place shell chrome below their canonical hero");
assert.match(powerPlaceSource, /<div className="mandalaHero"[\s\S]*Мастерская мандал[\s\S]*\{shellChrome\}[\s\S]*<div className="workspaceSwitches"/, "Mandala hero must render before Profile Lite cabinet tabs/status chrome");
assert.match(powerPlaceWrapperSource, /BaseProfileLitePowerPlaceModule/, "Power Place wrapper should delegate to the preserved base module");
assert.match(powerPlaceWrapperSource, /\{props\.shellChrome\}[\s\S]*mandalaTemplatePilotPanel/, "template wrapper should keep shellChrome before the pilot template controls");
assert.match(powerPlaceWrapperSource, /__mandala_template_id/, "template wrapper should store the selected template id in object_refs");
assert.match(powerPlaceWrapperSource, /onCompositionDraftChange\?\.\("geometry", 9\)/, "template 1 should force client geometry 9 when selected");
assert.match(mandalaTemplateSource, /id: "stone-mosaic-01"[\s\S]*src: "\/mandala-templates\/place-power\/stone-mosaic-01\.svg"/, "template registry should point template 1 at the pilot asset");
assert.equal(existsSync("public/mandala-templates/place-power/stone-mosaic-01.svg"), true, "template 1 SVG asset should exist");
for (const refId of ["client-1", "client-2", "client-3", "client-4", "client-5", "client-6", "client-7", "client-8", "client-9"]) {
  assert.match(mandalaTemplateSource, new RegExp(refId), `template 1 should use existing ${refId} object ref`);
}
for (const sourceClass of ["source-1", "source-2", "source-3", "source-4", "source-5", "source-6", "source-7", "source-8", "source-9"]) {
  assert.match(mandalaTemplatePilotCss, new RegExp(`\\.${sourceClass}\\s*\\{[^}]*left:[^}]*top:`), `template CSS should position ${sourceClass}`);
}
assert.match(powerPlaceSource, /className: "plus-top"[\s\S]*className: "plus-right"[\s\S]*className: "plus-bottom"[\s\S]*className: "plus-left"/, "Lite zodiac 8+ should use old plus slot class names");
assert.match(powerPlaceSource, /className: "plus-corner-tl"[\s\S]*className: "plus-corner-tr"[\s\S]*className: "plus-corner-bl"[\s\S]*className: "plus-corner-br"/, "Lite zodiac 12+ should use old plus corner class names");
assert.match(powerPlaceSource, /<div className="altarTopRow"[\s\S]*altarTopSource main[\s\S]*altarMandalaBase[\s\S]*altarBottomSupports/, "Lite altar should render the old top row, center/base, and bottom support structure");
assert.doesNotMatch(powerPlaceSource, /altarObject altarObject-|altarSupport altarSupport-/, "Lite altar must not use non-reference altar object class names");
assert.match(powerPlaceSource, /<div className="workspaceRightColumn"[\s\S]*powerCommandRail[\s\S]*workspaceTab === "power-place" && renderPowerPlaceActions\(\)[\s\S]*profileLiteAdvancedJson/, "Power Place settings rail should render before save/actions and advanced JSON in the mobile source order");
assert.match(profileMandalaCss, /profileLitePowerPlaceColumns[\s\S]*minmax\(320px, 340px\)/, "Lite Power Place right rail should keep old thicker right-column proportions");
assert.match(profileMandalaCss, /print-color-adjust:\s*exact/, "Print CSS should preserve color backgrounds");
assert.match(profileMandalaCss, /-webkit-print-color-adjust:\s*exact/, "Print CSS should preserve WebKit color backgrounds");
for (const printClass of [
  "powerPlacePrintArea",
  "powerMandalaPanel",
  "powerMandala",
  "zodiacMandalaSheet",
  "starMandalaSheet",
  "power-place-chess",
  "altarMandalaSheet",
  "businessMandalaSheet",
  "daoMandalaSheet",
  "powerSource",
  "zodiacPositionImage",
  "starPositionImage",
  "powerCenterPhoto"
]) {
  assert.match(profileMandalaCss, new RegExp(`body\\.printMandalaOnly \\.${printClass}[\\s\\S]*print-color-adjust:\\s*exact`), `print CSS should explicitly preserve color for ${printClass}`);
}
assert.match(profileLitePageSource, /openPowerPlacePdfPrintView/, "PDF download action should open an isolated print/PDF view for the mandala area");
assert.match(profileLitePageSource, /application\/pdf|Скачать PDF \/ Печать в PDF/, "PDF action should describe a PDF/print workflow instead of HTML export");
assert.doesNotMatch(profileLitePageSource, /\.html[`'"]|downloadHtml\(/, "Profile Lite must not download a .html Power Place export");

assert.match(profileModuleSource, /profileTabContent/, "Lite profile module should reuse old profileEditor profileTabContent wrapper");
assert.match(profileModuleSource, /Как это будет выглядеть/, "Lite profile preview should use the old profile preview heading");

assert.match(powerPlaceSource, /activeCover = visibleCover/, "cover active state should be computed from the visible layer only");
assert.match(powerPlaceSource, /coverLayerMode === "inner"\s*\?\s*"cover_ref.inner"\s*:\s*"cover_ref.outer"/, "cover layer UI should carry explicit inner/outer save markers");
assert.doesNotMatch(powerPlaceSource, /key=\{`\$\{coverLayerMode\}-\$\{cover\.id\}`\}/, "cover layer switching must not remount the full cover option list");
assert.match(powerPlaceSource, /item\.display_url \|\| item\.signed_url \|\| item\.image_url/, "material cover options should use signed URL hydration like other media rows");
assert.match(powerPlaceSource, /function coverLayer[\s\S]*layer === "inner"[\s\S]*coverRef\.inner \|\| coverRef[\s\S]*coverRef\.outer \|\| FALLBACK_COVERS\[0\]/, "old single cover_ref should remain an inner fallback while outer defaults to no-cover");
assert.match(profileLitePageSource, /inner:\s*layer === "inner" \? nextLayer : inner/, "inner cover selection should save only into cover_ref.inner");
assert.match(profileLitePageSource, /outer:\s*layer === "outer" \? nextLayer : outer/, "outer cover selection should save only into cover_ref.outer");
assert.match(profileMandalaCss, /@media \(max-width: 980px\)[\s\S]*\.workspaceCenterColumn[\s\S]*order:\s*1[\s\S]*\.workspaceRightColumn[\s\S]*order:\s*2[\s\S]*\.mandalaModeSidebar[\s\S]*order:\s*3/, "mobile order should keep the Power Place settings rail immediately after the visual constructor");
assert.match(profileMandalaCss, /@media \(max-width: 1180px\)[\s\S]*\.profileLitePowerPlace \.workspaceCenterColumn[\s\S]*order:\s*1[\s\S]*\.profileLitePowerPlace \.coverSelector[\s\S]*order:\s*1[\s\S]*\.profileLitePowerPlace \.reportAnalysisPanel[\s\S]*order:\s*2[\s\S]*\.profileLitePowerPlace \.objectCompositionPanel[\s\S]*order:\s*3[\s\S]*\.profileLitePowerPlace \.profileLitePowerPlaceActions[\s\S]*order:\s*3[\s\S]*\.profileLitePowerPlace \.profileLiteAdvancedJson[\s\S]*order:\s*4[\s\S]*\.profileLitePowerPlace \.mandalaModeSidebar[\s\S]*order:\s*5/, "Profile Lite mobile order should be preview, background/layout, report+analysis, objects, then actions/advanced/source");

for (const [source, label] of [
  [overviewModuleSource, "overview"],
  [profileModuleSource, "profile"],
  [mediaModuleSource, "media"],
  [materialsModuleSource, "materials"],
  [servicesModuleSource, "services"],
  [ordersModuleSource, "orders"],
  [chatsModuleSource, "chats"],
  [settingsModuleSource, "settings"],
  [diagnosticsModuleSource, "diagnostics"]
]) {
  assert.match(source, /mandalaHero/, `Lite ${label} module should render the canonical mandala-style hero`);
  assert.match(source, /shellChrome/, `Lite ${label} module should place cabinet tabs below its canonical hero`);
  assert.match(source, /mandalaWorkspace/, `Lite ${label} module should share the canonical mandala workspace surface`);
}

for (const [source, label] of [
  [materialsModuleSource, "materials"],
  [servicesModuleSource, "services"],
  [ordersModuleSource, "orders"],
  [chatsModuleSource, "chats"]
]) {
  assert.match(source, /workspaceMainColumns/, `Lite ${label} module should use old workspaceMainColumns structure`);
  assert.match(source, /mandalaModeSidebar/, `Lite ${label} module should keep the old left rail class`);
  assert.match(source, /workspaceRightColumn/, `Lite ${label} module should keep the old right rail class`);
}

assert.match(materialsModuleSource, /mandalaGallery/, "Lite materials should reuse old mandalaGallery surface for saved materials");
assert.match(materialsModuleSource, /mandalaCardsGrid/, "Lite materials should reuse old mandalaCardsGrid cards");
assert.match(materialsModuleSource, /Источники силы[\s\S]*Сохранённые изображения/, "Lite materials left rail should restore old sources and saved image structure");
assert.match(materialsModuleSource, /Алтарь материалов[\s\S]*Основная рабочая зона/, "Lite materials center should restore old altar/list work area");
assert.match(materialsModuleSource, /profileLiteMaterialForm[\s\S]*Создание материала/, "Lite materials right rail should keep material creation actions");

for (const [source, label] of [
  [servicesModuleSource, "services"],
  [ordersModuleSource, "orders"],
  [chatsModuleSource, "chats"]
]) {
  assert.match(source, /chatPlaceholderWorkspace/, `Lite ${label} module should reuse the old placeholder workspace surface`);
  assert.match(source, /chatPlaceholderHeader/, `Lite ${label} module should reuse the old placeholder header`);
}

assert.match(powerPlaceSource, /advanced|diagnostics|Диагностика/i, "Object refs JSON should be hidden behind an advanced diagnostics surface");

assert.match(powerPlaceSource, /ProfileLiteImagePicker/, "Lite Power Place should delegate image picking to ProfileLiteImagePicker");
assert.doesNotMatch(powerPlaceSource, /clientPhotoPickerBackdrop[\s\S]*Выбрать из базы[\s\S]*setPickerMode\(""\)/, "old mixed picker modal must not keep inert select-from-base and immediate upload close logic");

for (const requiredPickerProp of [
  "mode",
  "images",
  "defaultLibraryTab",
  "selectedImageRef",
  "onSelect",
  "onUpload",
  "onDelete",
  "onClose",
  "uploadStatus",
  "uploadError"
]) {
  assert.match(imagePickerSource, new RegExp(requiredPickerProp), `ProfileLiteImagePicker should expose ${requiredPickerProp}`);
}

for (const requiredPickerText of [
  "Новые",
  "Клиенты",
  "Материалы",
  "Загрузить фото",
  "signed URL не создан — проверьте Storage/RLS",
  "needs verification",
  "Удалить фото из базы?"
]) {
  assert.match(imagePickerSource, new RegExp(requiredPickerText.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")), `ProfileLiteImagePicker should include ${requiredPickerText}`);
}

assert.match(imagePickerSource, /useState\("clients"\)/, "upload destination tabs should default to Клиенты");
assert.match(imagePickerSource, /mode === "library"/, "picker should distinguish global library upload from slot upload");
assert.match(imagePickerSource, /onUpload\(\{[\s\S]*destination:[\s\S]*file/, "picker upload should pass destination metadata to the parent upload flow");
assert.match(imagePickerSource, /onSelect\(image\)/, "picker cards should select images directly");
assert.match(imagePickerSource, /await onUpload\(/, "picker upload should wait for the parent upload flow before closing");
assert.match(imagePickerSource, /mediaSigningError|signingError/, "picker should expose a safe signing diagnostic for storage refs without displaySrc");
assert.doesNotMatch(imagePickerSource, /needsSignedUrl\s*\?\s*"Нужна signed URL"/, "storage refs without displaySrc must not look like a successful preview state");
assert.doesNotMatch(imagePickerSource, /onChange=\{\(event\)[\s\S]*onClose\(\)/, "picker file input must not close the modal before upload success");

assert.match(profileLitePageSource, /handleLibraryClientPhotoUpload/, "Profile Lite page should have a library-only client photo upload handler");
assert.match(libraryUploadSource, /setClientGoalPhotos\(\(current\) => \[savedPhoto,[\s\S]*current\]/, "library upload should add the saved photo to the left photo list");
assert.doesNotMatch(libraryUploadSource, /central_photo_id/, "library upload must not set central_photo_id");
assert.doesNotMatch(libraryUploadSource, /__center_image/, "library upload must not write object_refs.__center_image");
assert.doesNotMatch(libraryUploadSource, /setCompositionObjectRef/, "library upload must not write object slot refs");
assert.doesNotMatch(libraryUploadSource, /handleCompositionCoverSelect/, "library upload must not change cover_ref");
assert.match(libraryUploadSource, /savedDisplayUrl\s*=\s*saved\?\.display_url\s*\|\|\s*saved\?\.signed_url\s*\|\|\s*uploaded\.signedUrl/, "library upload should keep saved display URL or uploaded signed URL fallback");
assert.match(libraryUploadSource, /savedImageRef\s*=\s*saved\?\.image_ref\s*\|\|\s*uploaded\.ref/, "library upload should keep saved image ref or uploaded ref fallback");
assert.match(profileLitePageSource, /__center_image:\s*savedImageRef/, "central upload should set __center_image to the durable ref");
assert.match(profileLitePageSource, /\[savedImageRef\]:\s*savedDisplayUrl/, "central upload should populate object_ref_urls for the durable ref");
assert.match(powerPlaceSource, /objectRefUrls\[centralImageRef\]\s*\|\|\s*objectRefUrls\.__center_image/, "central photo rendering should keep legacy __center_image URL fallback");
assert.match(powerPlaceSource, /objectRefUrls\[src\]\s*\|\|\s*objectRefUrls\[slot\.id\]\s*\|\|\s*src/, "slot rendering should keep legacy slot-id URL fallback");
assert.match(powerPlaceClientSource, /object_ref_urls:\s*\{\s*\.\.\.signedUrls\s*\}/, "hydrated composition rows should expose storageRef -> signedUrl object_ref_urls");
assert.match(powerPlaceClientSource, /coverRef\.inner\?\.src[\s\S]*coverRef\.outer\?\.src/, "composition hydration should sign nested inner and outer cover refs");
assert.match(profileLitePageSource, /handleCompositionObjectFileUpload[\s\S]*setCompositionObjectRef\(slotId,\s*savedImageRef,\s*savedDisplayUrl\)/, "object upload should apply to the selected object slot");
assert.match(profileLitePageSource, /handleCompositionCoverFileUpload[\s\S]*handleCompositionCoverSelect\(layer/, "cover upload should apply to the active cover layer");
assert.match(profileLitePageSource, /throw new Error\("Сначала сохраните профиль мастера\."\)/, "upload handlers should reject missing profile/session so the picker modal stays open");
assert.match(profileLitePageSource, /await listPowerPlaceCompositions\(profile\.id,\s*session\)/, "saving a Power Place should refresh saved compositions from Supabase");
assert.match(profileLitePageSource, /setPowerPlaceCompositions\(freshCompositions/, "fresh Supabase composition list should drive the saved select/list after save");
assert.match(profileLitePageSource, /const deletedRefs = new Set/, "client photo deletion should track all refs that can point at the deleted image");
assert.match(profileLitePageSource, /for \(const \[slotId, ref\] of Object\.entries\(nextObjectRefs\)\)/, "client photo deletion should clear object refs that point at the deleted image");

assert.match(
  readmeSource,
  /20260531090000_power_place_chess_format\.sql/,
  "README setup must include the chess composition migration used by Profile Lite"
);
assert.match(
  readmeSource,
  /20260602120000_power_place_chess_compact_variant\.sql/,
  "README setup must include the compact chess variant migration used by Profile Lite"
);
assert.match(
  compactChessMigrationSource,
  /chess_variant in \('classic-14', 'classic-8', 'plus-8', 'compact-5'\)/,
  "compact chess migration should allow the UI's compact-5 technical value"
);
assert.match(
  migrationRunnerSource,
  /20260602120000_power_place_chess_compact_variant\.sql/,
  "Supabase migration runner should allowlist the compact chess migration"
);

assert.match(shellSource, /href=\{tab\.href\}/, "ProfileLiteShell tabs should render route-backed hrefs");
assert.match(shellSource, /profileLiteShell-\$\{activeTab\}/, "ProfileLiteShell should expose active-tab class hooks for compact mandalas parity styling");
assert.match(shellSource, /event\.preventDefault\(\)/, "ProfileLiteShell should intercept tab links for SPA navigation");
assert.match(
  shellSource,
  /onTabNavigate\(tab\)/,
  "ProfileLiteShell tab click should delegate to URL-aware navigation"
);

assert.match(
  profileLitePageSource,
  /class ProfileLiteModuleErrorBoundary extends React\.Component/,
  "ProfileLitePage should isolate the active module with an ErrorBoundary"
);
assert.match(
  profileLitePageSource,
  /<ProfileLiteModuleErrorBoundary[^>]*moduleLabel=/,
  "ProfileLitePage should wrap renderedModule in the module ErrorBoundary"
);
assert.match(
  profileLitePageSource,
  /profileLiteModuleError/,
  "ProfileLitePage should render inline module errors without removing shell tabs"
);
