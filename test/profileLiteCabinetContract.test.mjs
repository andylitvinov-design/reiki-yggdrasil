import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import {
  createProfileLiteDiagnostics,
  createProfileLiteForm,
  createProfileLiteSavePayload,
  createProfileLiteShellViewModel,
  getProfileLiteInitialTabFromLocation,
  getProfileLiteRouteByTabId,
  getProfileLiteTabById,
  PROFILE_LITE_TABS,
  safeProfileLiteError
} from "../src/lib/profileLiteClient.js";

const expectedTabs = [
  ["mandalas", "Мои мандалы"],
  ["profile", "Профиль"],
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
  "Profile Lite cabinet should expose the current tab map without Overview"
);

assert.deepEqual(
  PROFILE_LITE_TABS.map((tab) => [tab.id, tab.href]),
  [
    ["mandalas", "/profile/mandalas"],
    ["profile", "/profile?tab=profile"],
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

assert.equal(PROFILE_LITE_TABS.some((tab) => tab.id === "overview" || tab.label === "Обзор"), false);
assert.equal(getProfileLiteTabById("missing").id, "mandalas");
assert.equal(getProfileLiteTabById("orders").label, "Заказы");
assert.equal(getProfileLiteRouteByTabId("mandalas"), "/profile/mandalas");
assert.equal(getProfileLiteRouteByTabId("services"), "/profile/services");
assert.equal(getProfileLiteRouteByTabId("orders"), "/profile/orders");
assert.equal(getProfileLiteRouteByTabId("chats"), "/profile/chats");
assert.equal(getProfileLiteRouteByTabId("settings"), "/profile/settings");
assert.equal(getProfileLiteRouteByTabId("media"), "/profile?tab=media");
assert.equal(getProfileLiteInitialTabFromLocation("/profile", ""), "mandalas");
assert.equal(getProfileLiteInitialTabFromLocation("/profile-lite", ""), "mandalas");
assert.equal(getProfileLiteInitialTabFromLocation("/profile/mandalas", ""), "mandalas");
assert.equal(getProfileLiteInitialTabFromLocation("/profile", "?tab=profile"), "profile");
assert.equal(getProfileLiteInitialTabFromLocation("/unknown", ""), "mandalas");

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
const credentialField = ["access", "token"].join("_");
const shell = await createProfileLiteShellViewModel({
  supabaseConfigured: true,
  session: { [credentialField]: "present" },
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
  session: { [credentialField]: "present" },
  user: { id: "user-1", email: "master@example.com" },
  authStatus: "success"
}));

assert.doesNotMatch(diagnosticText, new RegExp(`"${credentialField}"\\\\s*:`), "diagnostics must not expose credential field names");
assert.doesNotMatch(diagnosticText, /fake|token|secret|Bearer/i, "diagnostics must not expose credential values");
assert.match(diagnosticText, /user id present/, "diagnostics may include safe presence labels");
assert.equal(safeProfileLiteError(new Error("failed https://project.example/path")), "failed [url hidden]");

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
const profileLitePageSource = readFileSync("src/pages/ProfileLitePage.jsx", "utf8");
const powerPlaceWrapperSource = readFileSync(join(moduleDir, "ProfileLitePowerPlaceModule.jsx"), "utf8");
const powerPlaceBaseSource = readFileSync(join(moduleDir, "ProfileLitePowerPlaceModuleBase.jsx"), "utf8");
const powerPlaceSource = `${powerPlaceWrapperSource}\n${powerPlaceBaseSource}`;
const profileMandalaCss = readFileSync("src/profileMandalaWorkspace.css", "utf8");
const mobileOrderCss = readFileSync("public/profile-lite-mobile-order-hotfix.css", "utf8");
const layoutFinalFix = readFileSync("public/profile-lite-layout-final-fix.js", "utf8");

for (const label of expectedTabs.map(([, label]) => label)) {
  assert.match(moduleSource, new RegExp(label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")), `module source should include ${label}`);
}

for (const requiredPowerPlaceText of [
  "Мастерская мандал",
  "Место силы",
  "Мои мандалы",
  "Источники силы",
  "Добавить фото",
  "Группа",
  "Категория",
  "Подкатегория / Ступень",
  "Фон места силы",
  "Фон внутри",
  "Фон снаружи",
  "Отчёт",
  "Анализ",
  "Размер поля",
  "Размер центра",
  "Сохранённые мандалы",
  "Объекты композиции",
  "Сохранить",
  "Обновить",
  "Скачать PDF",
  "Печать"
]) {
  assert.match(powerPlaceSource, new RegExp(requiredPowerPlaceText.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")), `Lite Power Place should include UX text: ${requiredPowerPlaceText}`);
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
  assert.match(`${powerPlaceSource}\n${profileMandalaCss}`, new RegExp(requiredClass), `Lite Power Place should reuse visual workshop class ${requiredClass}`);
}

assert.match(powerPlaceSource, /<aside className="mandalaModeSidebar powerLibrarySidebar"[\s\S]*<div className="workspaceCenterColumn"[\s\S]*<div className="workspaceRightColumn"/, "Lite Power Place should preserve desktop left / center / right source order");
assert.match(powerPlaceSource, /data-compact-photo-list="true"/, "Profile Lite source rail should expose a compact photo list marker");
assert.match(profileLitePageSource, /PROFILE_LITE_REPORT_REF_KEY[\s\S]*object_refs[\s\S]*normalizeProfileLiteReport/, "Profile Lite page should save report payload into object_refs");
assert.match(profileLitePageSource, /const EMPTY_PROFILE_LITE_REPORT = \{[\s\S]*mode: "without_report"/, "new Profile Lite drafts should default to Без отчёта in the page state");
assert.match(powerPlaceBaseSource, /const EMPTY_PROFILE_LITE_REPORT = \{[\s\S]*mode: "without_report"/, "new Profile Lite report UI drafts should default to Без отчёта");
assert.match(profileLitePageSource, /slot_scale:\s*1/, "Profile Lite empty composition should include the shared slot_scale field");
assert.match(profileLitePageSource, /field_scale:\s*78/, "Profile Lite empty composition should include the persisted field_scale control");
assert.match(profileMandalaCss, /--power-source-slot-scale/, "Mandala workspace CSS should include shared source slot scaling");
assert.match(profileMandalaCss, /--power-field-scale/, "Mandala workspace CSS should include independent inner field scaling");
assert.match(powerPlaceSource, /CENTER_IMAGE_SCALE_REF_KEY = "__center_image_scale"/, "center photo scale should persist through object_refs");
assert.match(powerPlaceSource, /__center_image_scale: centerImageScale/, "center photo scale should be passed through enhanced draft only");
assert.match(powerPlaceSource, /style=\{centerImageStyle\}/, "center photo renderer should receive the independent center image scale style");
assert.match(profileMandalaCss, /--power-center-image-scale/, "Mandala workspace CSS should include independent center photo scaling");
assert.match(powerPlaceSource, /Размер фото[\s\S]*Размер поля[\s\S]*Размер центра/, "Power Place constructor controls should show photo, field, and center sliders in the required order");
assert.equal((powerPlaceBaseSource.match(/renderScaleControl\(\{ className: "chessSizeControl"/g) || []).length, 1, "Размер фото slider should render once from the base module");
assert.equal((powerPlaceBaseSource.match(/renderScaleControl\(\{ className: "innerFieldScaleControl"/g) || []).length, 1, "Размер поля slider should render once from the base module");
assert.equal((powerPlaceBaseSource.match(/renderScaleControl\(\{ className: "centerImageScaleControl"/g) || []).length, 1, "Размер центра slider should render once from the base module");
assert.match(profileMandalaCss, /\.profileLitePowerPlace \.chessSizeControl,[\s\S]*\.profileLitePowerPlace \.innerFieldScaleControl,[\s\S]*\.profileLitePowerPlace \.centerImageScaleControl \{[\s\S]*grid-template-columns: minmax\(170px, 220px\) 28px minmax\(240px, 1fr\) 28px;/, "all three size sliders should share the requested desktop grid");
assert.match(profileMandalaCss, /@media \(max-width: 980px\)[\s\S]*\.profileLitePowerPlace \.chessSizeControl,[\s\S]*grid-template-columns: minmax\(0, 120px\) 24px minmax\(0, 1fr\) 24px;/, "all three size sliders should share the requested mobile grid");
assert.match(profileMandalaCss, /@media \(max-width: 980px\)[\s\S]*\.profileLitePowerPlace \.powerLayoutPanel\.compactFieldLayoutSwitch \{[\s\S]*order: 1 !important;/, "source CSS should keep compact layout controls above the background card on mobile");
assert.match(powerPlaceSource, /powerSavedMandalaSelect[\s\S]*placeholder: "Сохранённые мандалы"|<option value="">\s*Сохранённые мандалы\s*<\/option>/, "saved mandala select should expose the fixed placeholder");
assert.match(powerPlaceSource, /compositionMessage[\s\S]*compactNotice/, "composition message should remain a compact message below controls/select");
assert.match(powerPlaceSource, />Сохранить<\/button>[\s\S]*>Обновить<\/button>/, "Power Place actions should expose separate Save and Update buttons");
assert.match(powerPlaceBaseSource, /powerPlacePrintArea[\s\S]*renderPowerPlaceActions\(\)[\s\S]*reportAdded/, "Power Place actions should render in the central mandala area before report output");
assert.match(profileLitePageSource, /handleCompositionSaveNew/, "Profile Lite page should split composition create into handleCompositionSaveNew");
assert.match(profileLitePageSource, /handleCompositionUpdateExisting/, "Profile Lite page should split composition update into handleCompositionUpdateExisting");
assert.match(profileLitePageSource, /createPowerPlaceComposition\(\s*\{\s*\.\.\.createPayload\s*,\s*id:\s*undefined\s*\}|delete createPayload\.id/, "Save should create a new composition without preserving draft id");
assert.match(profileLitePageSource, /копия/, "Duplicate saved mandala titles should be saved as copy titles");
assert.match(profileLitePageSource, /Сначала откройте сохранённую мандалу/, "Update without an existing composition should show the required message");
assert.match(profileLitePageSource, /updatePowerPlaceComposition\(compositionDraft\.id/, "Update should call updatePowerPlaceComposition for the current saved composition");
assert.match(profileLitePageSource, /Лимит 7 сохранённых мандал достигнут/, "Save-new should show a clear RU limit message before backend create");
assert.match(profileLitePageSource, /currentSavedCompositionCount[\s\S]*powerPlaceCompositions\.length[\s\S]*currentCompositionLimit[\s\S]*planLimits\.compositions[\s\S]*currentSavedCompositionCount >= currentCompositionLimit[\s\S]*return;[\s\S]*createPowerPlaceComposition/, "Save-new should return before createPowerPlaceComposition when saved mandalas reach the current plan limit");
assert.match(profileLitePageSource, /handleCompositionUpdateExisting[\s\S]*updatePowerPlaceComposition\(compositionDraft\.id/, "Update existing should keep using updatePowerPlaceComposition even when the save-new limit guard exists");
assert.match(powerPlaceBaseSource, /const savedCompositionCount = powerPlaceCompositions\.length[\s\S]*const savedCompositionLimit = planLimits\.compositions[\s\S]*const saveNewDisabled = savedCompositionCount >= savedCompositionLimit && !compositionDraft\.id/, "Power Place UI should compute the saved-count limit and disable save-new only for unsaved drafts at the limit");
assert.match(powerPlaceBaseSource, /saveNewAriaLabel[\s\S]*disabled=\{saveNewDisabled\}[\s\S]*aria-label=\{saveNewAriaLabel\}[\s\S]*>Сохранить<\/button>/, "Save button should remain visible but disabled with an explanatory label at the 7/7 limit");
assert.match(powerPlaceSource, /\{savedCompositionCount\}\/\{savedCompositionLimit\} сохранённых мест силы/, "Power Place UI should show count text like 7/7 сохранённых мест силы");
assert.match(powerPlaceSource, /!reportEnabled \? null :|reportEnabled && \(/, "Без отчёта should hide the lower report body fields and actions");
assert.match(powerPlaceBaseSource, /renderFieldLayoutSelector\(\)[\s\S]*<div className="coverSelector coverPickerPanel"[\s\S]*renderReportModule\(\)/, "right column should render layout controls above background and report below background");
assert.doesNotMatch(powerPlaceSource, /Макет|макет/, "Profile Lite Power Place UI should not show the word Макет");
assert.doesNotMatch(powerPlaceSource, /className="resourceComparisonPanel"/, "resource comparison mini-block should not be visible in the React report/settings UI");
assert.doesNotMatch(powerPlaceSource, /<span className="cabinetStatus">\{mediaStatus\}<\/span>/, "Power Place header should not show raw media status text");
assert.match(powerPlaceSource, /has-custom-inner-cover/, "inner custom covers should be rendered through React-owned classes");
assert.match(powerPlaceSource, /has-custom-outer-cover/, "outer custom covers should be rendered through React-owned classes");
assert.match(powerPlaceSource, /coverLayerMode === "outer" \? "custom-outer-cover" : "custom-cover"/, "saved cover photos should use stable custom inner/outer cover ids");
assert.match(powerPlaceSource, /outerCover\?\.type === "image" \? "image" : outerCover\?\.tone \|\| "none"/, "image outer cover must produce class outer-cover-image, not outer-cover-none");
assert.doesNotMatch(powerPlaceSource, /outer-cover-\$\{outerCover\?\.tone \|\| "none"\}/, "outer cover class must not use tone directly — image type would silently become outer-cover-none");
assert.match(powerPlaceSource, /--power-outer-cover-image.*coverDisplaySrc\(outerCover\)/, "image outer cover must set --power-outer-cover-image CSS variable for the CSS rule to use");
assert.match(profileMandalaCss, /\.powerMandalaPanel\.outer-cover-image[\s\S]*--power-outer-cover-image/, "CSS must render outer image cover via --power-outer-cover-image variable");
assert.match(profileLitePageSource, /\[nextLayer\.src\]: nextLayer\.display_src/, "cover signed URLs should be stored by durable storage ref");
assert.match(profileMandalaCss, /\.profileLitePowerPlace \.has-custom-inner-cover/, "custom inner cover styling should be scoped to Profile Lite");
assert.match(profileMandalaCss, /\.profileLitePowerPlace \.powerMandalaPanel\.has-custom-outer-cover/, "custom outer cover styling should be scoped to the outer panel");
assert.match(powerPlaceSource, /hiddenCoverShortcutIds/, "saved cover shortcuts should be hideable in local React state only");
assert.match(powerPlaceSource, /\.slice\(0,\s*6\)/, "cover picker should show 6 saved cover shortcuts before collapsing the rest");
assert.match(powerPlaceSource, /coverShortcutHideButton/, "saved cover shortcuts should expose a local hide badge");
assert.doesNotMatch(powerPlaceSource, /className="coverUploadButton"[\s\S]*Своё изображение/, "cover module should not show the old direct custom image upload button");
assert.match(powerPlaceSource, /if \(visibleCount === 8\) return signSlots/, "Zodiac 8+ should render only the 8 round zodiac slots");
assert.match(powerPlaceSource, /className={`coverPreview[\s\S]*onClick=\{\(\) => \{[\s\S]*openPicker\("cover"\)/, "empty cover preview should open the React image picker");
assert.doesNotMatch(powerPlaceSource, /zodiac-plus-\$\{compositionDraft\.zodiac_visible_count \|\| 12\}[\s\S]*visibleCount === 8[\s\S]*ZODIAC_PLUS_SLOT_LAYOUT\[8\]/, "Zodiac 8+ must not append the old four plus slots");

assert.match(profileLitePageSource, /destination === "materials"[\s\S]*createOwnMaterial/, "image picker material uploads should use the existing material publication save flow");
assert.doesNotMatch(profileLitePageSource, /создание image material без миграции пока не подтверждено/, "material image upload should no longer be blocked by the old placeholder error");
assert.doesNotMatch(powerPlaceSource, /MutationObserver/, "Profile Lite React module must not introduce MutationObserver");
assert.doesNotMatch(profileLitePageSource, /MutationObserver/, "Profile Lite page must not introduce MutationObserver");

const publicFiles = readdirSync("public");
assert.equal(publicFiles.includes("profile-power-place-cover-polish.js"), false, "new public cover polish runtime patch must not be present");
assert.equal(publicFiles.includes("profile-lite-custom-inner-cover-fix.js"), false, "new public inner cover runtime patch must not be present");
assert.equal(publicFiles.includes("profile-lite-custom-inner-cover-fix.css"), false, "new public inner cover CSS patch must not be present");
assert.doesNotMatch(powerPlaceSource, /MutationObserver/, "Profile Lite React module must not introduce MutationObserver");
assert.doesNotMatch(profileLitePageSource, /MutationObserver/, "Profile Lite page must not introduce MutationObserver");

assert.match(mobileOrderCss, /profile-lite-mobile order hotfix|Profile Lite mobile order hotfix/i, "mobile order CSS should be present");
assert.match(mobileOrderCss, /profileLiteTabs a\[href="\/profile"\]/, "mobile order CSS should hide the Overview tab link");
assert.match(mobileOrderCss, /powerLibrarySidebar\{order:99/, "mobile order CSS should move source library to the bottom");
assert.match(mobileOrderCss, /reportSettingsPanel\{order:20/, "mobile order CSS should move report analysis lower on mobile");
assert.match(mobileOrderCss, /coverPickerPanel\{order:2/, "mobile order CSS should place Power Place background near the top on mobile");
assert.match(mobileOrderCss, /coverOffsetCornerGroup\.inner button\{[\s\S]*width:44px/, "inner background arrows should be larger and cleaner");
assert.match(mobileOrderCss, /coverOffsetCornerGroup\.outer\{display:none/, "outer background arrows should be hidden by the mobile hotfix");

assert.match(layoutFinalFix, /preferMandalasRoute/, "layout fix should prefer mandalas on bare profile route");
assert.match(layoutFinalFix, /window\.location\.search \|\| window\.location\.hash/, "mandalas default redirect should leave callback/query URLs untouched");
assert.match(layoutFinalFix, /Отчёт и анализ/, "layout fix should merge report and analysis labels");
assert.match(layoutFinalFix, /mergedResourceComparison/, "layout fix should move resource comparison into the report card");
assert.match(layoutFinalFix, /__inner_cover_offset_x[\s\S]*__inner_cover_offset_y/, "diagonal arrows should update only inner cover offsets");
assert.doesNotMatch(layoutFinalFix, /__outer_cover_offset_x|__outer_cover_offset_y/, "diagonal arrows must not update outer cover offsets");
