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
  ["mandalas", "Мои мандалы"],
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

const powerPlaceSource = readFileSync(join(moduleDir, "ProfileLitePowerPlaceModule.jsx"), "utf8");
const imagePickerSource = readFileSync(join(moduleDir, "ProfileLiteImagePicker.jsx"), "utf8");
const powerPlacePickerSource = `${powerPlaceSource}\n${imagePickerSource}`;
const shellSource = readFileSync(join(moduleDir, "ProfileLiteShell.jsx"), "utf8");
const profileLitePageSource = readFileSync("src/pages/ProfileLitePage.jsx", "utf8");
const profileMandalaCss = readFileSync("src/profileMandalaWorkspace.css", "utf8");
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
  "Мои мандалы",
  "Загрузить сохранённое место силы",
  "Добавить мандалу",
  "Выбрать из базы",
  "Группа",
  "Категория",
  "Сохранённые изображения",
  "Фото клиента / цели",
  "Фон места силы",
  "Фон внутри",
  "Фон снаружи",
  "Без фона",
  "Макет",
  "Анализ",
  "Ресурс без мандалы",
  "Ресурс с мандалой",
  "Объекты композиции",
  "Сохранить место силы",
  "Скачать",
  "Печать",
  "Загрузить новое фото",
  "Удалить фото из базы?"
]) {
  assert.match(powerPlacePickerSource, new RegExp(requiredPowerPlaceText.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")), `Lite Power Place should include old workshop UX text: ${requiredPowerPlaceText}`);
}

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
assert.match(powerPlaceSource, /activeSourceSubcategoryData\?\.thirdLevels\?\.length/, "Lite Power Place should expose old source subcategory third-level buttons");
assert.match(powerPlaceSource, /activeSourceCategory === "dao-ri"[\s\S]*activeSourceSubcategoryData\?\.steps/, "Lite Power Place should expose old DAO RI step buttons");
assert.match(powerPlaceSource, /const ZODIAC_SIGNS = \[/, "Lite Power Place should copy old zodiac sign placement definitions");
assert.match(powerPlaceSource, /ZODIAC_PLUS_SLOT_LAYOUT/, "Lite Power Place should copy old zodiac plus placement definitions");
assert.match(powerPlaceSource, /const CHESS_TOP_SLOTS = Array\.from/, "Lite Power Place should copy old chess top row slot definitions");
assert.match(powerPlaceSource, /CHESS_SLOT_LAYOUTS[\s\S]*row: 5, col: 3/, "Lite Power Place should copy old chess board coordinate layout");
assert.match(powerPlaceSource, /value: "compact-5"[\s\S]*label: "5 фоток"[\s\S]*slotCount: 5/, "Lite chess variants should include compact 5-photo format");
assert.match(powerPlaceSource, /CHESS_SLOT_LAYOUTS[\s\S]*"compact-5"[\s\S]*id: "chess-5"/, "Lite chess compact-5 layout should define exactly five source slots");
assert.match(powerPlaceSource, /CHESS_SLOT_LAYOUTS[\s\S]*outer-square[\s\S]*inner-square/, "Lite chess plus-8 should use outer and inner square markers");
assert.doesNotMatch(powerPlaceSource, /buildSlotList[\s\S]*type === "chess"[\s\S]*\.\.\.CHESS_TOP_SLOTS/, "Lite chess source slot lists should not automatically add top-row slots");
assert.doesNotMatch(powerPlaceSource, /<div className="power-place-chess__top-row"[\s\S]*CHESS_TOP_SLOTS\.map/, "Lite chess top-row should not render unconditionally for every chess variant");
assert.match(powerPlaceSource, /chess_slot_scale/, "Lite chess should persist a slot size control value in the composition draft");
assert.match(powerPlaceSource, /--power-place-chess-slot-scale/, "Lite chess should expose slot size via a CSS variable");
assert.match(powerPlaceSource, /Размер фото/, "Lite chess should render a visible photo size control");
assert.match(powerPlaceSource, /cover-mentalica[\s\S]*label: "Mentalica"/, "Lite fallback covers should include Mentalica");
assert.match(profileMandalaCss, /\.power-place-chess\.cover-mentalica/, "Chess CSS should render a Mentalica fallback cover tone");
assert.match(profileMandalaCss, /field-layout-square[\s\S]*--power-place-chess-card-aspect/, "Square field layout should affect chess card aspect");
assert.match(profileMandalaCss, /field-layout-(?:vertical|rectangle)[\s\S]*--power-place-chess-card-aspect/, "Rectangle/vertical field layout should affect chess card aspect");
assert.match(powerPlaceSource, /BUSINESS_VERTICES[\s\S]*className: "top"[\s\S]*className: "left"[\s\S]*className: "right"/, "Lite Power Place should copy old three-vertex business layout");
assert.match(powerPlaceSource, /DAO_ELEMENTS[\s\S]*"water"[\s\S]*"wood"[\s\S]*"fire"[\s\S]*"earth"[\s\S]*"metal"/, "Lite Power Place should copy old DAO element order");
assert.match(powerPlaceSource, /powerCommandRail/, "Lite right rail should reuse old powerCommandRail shell");
assert.match(powerPlaceSource, /mandalaFieldLayoutSwitch/, "Lite right rail should reuse old mandala field layout switch");
assert.match(powerPlaceSource, /coverSelector/, "Lite right rail should reuse old cover selector shell");
assert.match(powerPlaceSource, /coverLayerTabs/, "Lite right rail should reuse old cover layer tabs");
assert.match(powerPlaceSource, /coverPreviewWrap/, "Lite right rail should reuse old cover preview structure");
assert.match(powerPlaceSource, /coverVariantList/, "Lite right rail should reuse old cover variant list");
assert.doesNotMatch(shellSource, /<header[\s\S]*<\/header>\s*<nav className="profileLiteTabs"/, "Profile Lite shell must not render cabinet tabs before the active module canonical hero");
assert.match(shellSource, /const shellChrome = \(/, "Profile Lite shell should expose tabs/status as canonical shell chrome");
assert.match(shellSource, /typeof children === "function"/, "ProfileLitePage/Shell integration should let modules place shell chrome below their canonical hero");
assert.match(powerPlaceSource, /<div className="mandalaHero"[\s\S]*Мастерская мандал[\s\S]*\{shellChrome\}[\s\S]*<div className="workspaceSwitches"/, "Mandala hero must render before Profile Lite cabinet tabs/status chrome");
assert.match(powerPlaceSource, /className: "plus-top"[\s\S]*className: "plus-right"[\s\S]*className: "plus-bottom"[\s\S]*className: "plus-left"/, "Lite zodiac 8+ should use old plus slot class names");
assert.match(powerPlaceSource, /className: "plus-corner-tl"[\s\S]*className: "plus-corner-tr"[\s\S]*className: "plus-corner-bl"[\s\S]*className: "plus-corner-br"/, "Lite zodiac 12+ should use old plus corner class names");
assert.match(powerPlaceSource, /<div className="altarTopRow"[\s\S]*altarTopSource main[\s\S]*altarMandalaBase[\s\S]*altarBottomSupports/, "Lite altar should render the old top row, center/base, and bottom support structure");
assert.doesNotMatch(powerPlaceSource, /altarObject altarObject-|altarSupport altarSupport-/, "Lite altar must not use non-reference altar object class names");
assert.match(powerPlaceSource, /<div className="workspaceCenterColumn"[\s\S]*powerPlaceConstructor[\s\S]*workspaceTab === "power-place" && renderPowerPlaceActions\(\)[\s\S]*<div className="workspaceRightColumn"/, "Save/actions block should live in the center workspace before the right rail");
assert.match(profileMandalaCss, /profileLitePowerPlaceColumns[\s\S]*minmax\(320px, 340px\)/, "Lite Power Place right rail should keep old thicker right-column proportions");
assert.match(profileMandalaCss, /print-color-adjust:\s*exact/, "Print CSS should preserve color backgrounds");
assert.match(profileMandalaCss, /-webkit-print-color-adjust:\s*exact/, "Print CSS should preserve WebKit color backgrounds");

assert.match(profileModuleSource, /profileTabContent/, "Lite profile module should reuse old profileEditor profileTabContent wrapper");
assert.match(profileModuleSource, /Как это будет выглядеть/, "Lite profile preview should use the old profile preview heading");

assert.match(powerPlaceSource, /activeCover = visibleCover/, "cover active state should be computed from the visible layer only");
assert.match(powerPlaceSource, /coverLayerMode === "inner"\s*\?\s*"cover_ref.inner"\s*:\s*"cover_ref.outer"/, "cover layer UI should carry explicit inner/outer save markers");
assert.doesNotMatch(powerPlaceSource, /key=\{`\$\{coverLayerMode\}-\$\{cover\.id\}`\}/, "cover layer switching must not remount the full cover option list");
assert.match(powerPlaceSource, /item\.display_url \|\| item\.signed_url \|\| item\.image_url/, "material cover options should use signed URL hydration like other media rows");
assert.match(profileLitePageSource, /inner:\s*layer === "inner" \? nextLayer : inner/, "inner cover selection should save only into cover_ref.inner");
assert.match(profileLitePageSource, /outer:\s*layer === "outer" \? nextLayer : outer/, "outer cover selection should save only into cover_ref.outer");

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
  "Сохранённые фото",
  "signed URL не создан — проверьте Storage/RLS",
  "Загрузить новое фото",
  "Удалить фото из базы?"
]) {
  assert.match(imagePickerSource, new RegExp(requiredPickerText.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")), `ProfileLiteImagePicker should include ${requiredPickerText}`);
}

assert.match(imagePickerSource, /onSelect\(image\)/, "picker cards should select images directly");
assert.match(imagePickerSource, /await onUpload\(file\)/, "picker upload should wait for the parent upload flow before closing");
assert.match(imagePickerSource, /mediaSigningError|signingError/, "picker should expose a safe signing diagnostic for storage refs without displaySrc");
assert.doesNotMatch(imagePickerSource, /needsSignedUrl\s*\?\s*"Нужна signed URL"/, "storage refs without displaySrc must not look like a successful preview state");
assert.doesNotMatch(imagePickerSource, /onChange=\{\(event\)[\s\S]*onClose\(\)/, "picker file input must not close the modal before upload success");

assert.match(profileLitePageSource, /savedDisplayUrl\s*=\s*saved\?\.display_url\s*\|\|\s*saved\?\.signed_url\s*\|\|\s*uploaded\.signedUrl/, "central upload should keep saved display URL or uploaded signed URL fallback");
assert.match(profileLitePageSource, /savedImageRef\s*=\s*saved\?\.image_ref\s*\|\|\s*uploaded\.ref/, "central upload should keep saved image ref or uploaded ref fallback");
assert.match(profileLitePageSource, /__center_image:\s*savedImageRef/, "central upload should set __center_image to the durable ref");
assert.match(profileLitePageSource, /\[savedImageRef\]:\s*savedDisplayUrl/, "central upload should populate object_ref_urls for the durable ref");
assert.match(profileLitePageSource, /throw new Error\("Сначала сохраните профиль мастера\."\)/, "upload handlers should reject missing profile/session so the picker modal stays open");

assert.match(
  readmeSource,
  /20260531090000_power_place_chess_format\.sql/,
  "README setup must include the chess composition migration used by Profile Lite"
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
