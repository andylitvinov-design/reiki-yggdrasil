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
  "Макет",
  "Отчёт",
  "Анализ",
  "Ресурс без мандалы",
  "Ресурс с мандалой",
  "Объекты композиции",
  "Сохранить место силы",
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
assert.match(profileLitePageSource, /slot_scale:\s*1/, "Profile Lite empty composition should include the shared slot_scale field");
assert.match(profileMandalaCss, /--power-source-slot-scale/, "Mandala workspace CSS should include shared source slot scaling");
assert.match(powerPlaceSource, /has-custom-inner-cover/, "inner custom covers should be rendered through React-owned classes");
assert.match(powerPlaceSource, /has-custom-outer-cover/, "outer custom covers should be rendered through React-owned classes");
assert.match(powerPlaceSource, /coverLayerMode === "outer" \? "custom-outer-cover" : "custom-cover"/, "saved cover photos should use stable custom inner/outer cover ids");
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
