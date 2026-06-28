import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import {
  createProfileLiteDiagnostics,
  createProfileLiteForm,
  createProfileLiteSavePayload,
  createProfileLiteShellViewModel,
  getProfileLiteInitialTabFromLocation,
  getProfileLiteInitialRoleFromLocation,
  getProfileLiteRoleById,
  getProfileLiteRoleForTab,
  getProfileLiteRoleNav,
  getProfileLiteRouteByTabId,
  getProfileLiteTabById,
  PROFILE_LITE_CABINET_ROLES,
  PROFILE_LITE_ROLE_NAV,
  PROFILE_LITE_TABS,
  safeProfileLiteError
} from "../src/lib/profileLiteClient.js";

const expectedTabs = [
  ["mandalas", "Мастерская"],
  ["profile", "Профиль"],
  ["media", "Фото / Медиа"],
  ["materials", "Гримуар"],
  ["masterProfile", "Профиль Мастера"],
  ["courses", "Курсы"],
  ["services", "Услуги"],
  ["clients", "Клиенты"],
  ["orders", "Заказы"],
  ["chats", "Чаты"]
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
    ["profile", "/profile/profile"],
    ["media", "/profile/photos"],
    ["materials", "/profile?tab=materials"],
    ["masterProfile", "/profile?tab=masterProfile"],
    ["courses", "/profile/courses"],
    ["services", "/profile/services"],
    ["clients", "/profile?tab=clients"],
    ["orders", "/profile/orders"],
    ["chats", "/profile/chats"]
  ],
  "Profile Lite tabs must be backed by stable URL paths or query strings"
);

assert.equal(PROFILE_LITE_TABS.some((tab) => tab.id === "overview" || tab.label === "Обзор"), false);
assert.equal(PROFILE_LITE_TABS.some((tab) => tab.id === "settings" || tab.label === "Настройки"), false);
assert.equal(PROFILE_LITE_TABS.some((tab) => tab.id === "diagnostics" || tab.label === "Диагностика"), false);
assert.equal(getProfileLiteTabById("missing").id, "mandalas");
assert.equal(getProfileLiteTabById("orders").label, "Заказы");
assert.equal(getProfileLiteTabById("settings").label, "Настройки");
assert.equal(getProfileLiteTabById("diagnostics").label, "Диагностика");
assert.equal(getProfileLiteRouteByTabId("mandalas"), "/profile/mandalas");
assert.equal(getProfileLiteRouteByTabId("courses"), "/profile/courses");
assert.equal(getProfileLiteRouteByTabId("services"), "/profile/services");
assert.equal(getProfileLiteRouteByTabId("orders"), "/profile/orders");
assert.equal(getProfileLiteRouteByTabId("chats"), "/profile/chats");
assert.equal(getProfileLiteRouteByTabId("settings"), "/profile/settings");
assert.equal(getProfileLiteRouteByTabId("diagnostics"), "/profile?tab=diagnostics");
assert.equal(getProfileLiteRouteByTabId("media"), "/profile/photos");
assert.equal(getProfileLiteRouteByTabId("profile"), "/profile/profile");
assert.equal(getProfileLiteInitialTabFromLocation("/profile", ""), "orders");
assert.equal(getProfileLiteInitialTabFromLocation("/profile-lite", ""), "orders");
assert.equal(getProfileLiteInitialTabFromLocation("/profile/mandalas", ""), "mandalas");
assert.equal(getProfileLiteInitialTabFromLocation("/profile/courses", ""), "courses");
assert.equal(getProfileLiteInitialTabFromLocation("/profile/photos", ""), "media");
assert.equal(getProfileLiteInitialTabFromLocation("/profile/profile", ""), "profile");
assert.equal(getProfileLiteInitialTabFromLocation("/profile", "?tab=profile"), "profile");
assert.equal(getProfileLiteInitialTabFromLocation("/profile", "?tab=masterProfile"), "masterProfile");
assert.equal(getProfileLiteInitialTabFromLocation("/profile", "?tab=diagnostics"), "diagnostics");
assert.equal(getProfileLiteInitialTabFromLocation("/unknown", ""), "mandalas");
assert.equal(getProfileLiteInitialRoleFromLocation("/profile/orders", ""), "client");
assert.equal(getProfileLiteInitialRoleFromLocation("/profile/orders", "?role=master"), "master");
assert.equal(getProfileLiteInitialRoleFromLocation("/profile/orders", "?cabinet=master"), "master");

assert.deepEqual(
  PROFILE_LITE_CABINET_ROLES.map((role) => [role.id, role.label, role.defaultTabId]),
  [
    ["client", "Кабинет Личный", "orders"],
    ["master", "Кабинет Мастера", "mandalas"]
  ],
  "Profile Lite should expose the two cabinet role switcher labels without adding routes"
);

assert.deepEqual(
  PROFILE_LITE_ROLE_NAV.client.map((item) => item.label),
  ["Мои заказы", "Мои курсы", "Мои фото", "Чаты", "Профиль"],
  "client cabinet nav should expose personal course access between orders and photos"
);

assert.deepEqual(
  PROFILE_LITE_ROLE_NAV.master.map((item) => item.label),
  ["Мастерская", "Услуги", "Клиенты", "Заявки", "Гримуар", "Профиль Мастера"],
  "master cabinet nav should expose only master role items"
);

assert.equal(getProfileLiteRoleById("missing").label, "Кабинет Личный");
assert.equal(getProfileLiteRoleForTab("orders"), "client");
assert.equal(getProfileLiteRoleForTab("orders", "master"), "master");
assert.equal(getProfileLiteRoleForTab("mandalas"), "master");
assert.equal(getProfileLiteRoleForTab("services"), "master");
assert.equal(getProfileLiteRoleForTab("clients"), "master");
assert.equal(getProfileLiteRoleForTab("masterProfile"), "master");
assert.equal(getProfileLiteRoleForTab("profile"), "client");
assert.deepEqual(getProfileLiteRoleNav("client").map((item) => item.tabId), ["orders", "courses", "media", "chats", "profile"]);
assert.deepEqual(getProfileLiteRoleNav("master").map((item) => item.tabId), ["mandalas", "services", "clients", "orders", "materials", "masterProfile"]);
assert.deepEqual(getProfileLiteRoleNav("master").find((item) => item.label === "Заявки"), { label: "Заявки", tabId: "orders", role: "master", href: "/profile/orders?role=master" });

const fullForm = createProfileLiteForm({
  display_name: "Master",
  bio: "Bio",
  city: "Barcelona",
  country: "Spain",
  telegram: "@master",
  website: "https://example.com",
  avatar_url: "https://example.com/avatar.jpg",
  account_plan: "practic",
  status: "approved"
});
assert.equal(fullForm.account_plan, "practic", "legacy Pro profile rows should normalize to Practic");

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
  account_plan: "practic",
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
  account_plan: "practic",
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
  "ProfileLiteCoursesModule.jsx",
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
const profileMaterialsClientSource = readFileSync("src/lib/profileMaterialsClient.js", "utf8");
const powerPlaceClientSource = readFileSync("src/lib/powerPlaceClient.js", "utf8");
const profileServicesClientSource = readFileSync("src/lib/profileServicesClient.js", "utf8");
const profileLiteShellSource = readFileSync(join(moduleDir, "ProfileLiteShell.jsx"), "utf8");
const profileServicesModuleSource = readFileSync(join(moduleDir, "ProfileLiteServicesModule.jsx"), "utf8");
const profileOrdersModuleSource = readFileSync(join(moduleDir, "ProfileLiteOrdersModule.jsx"), "utf8");
const profileChatsModuleSource = readFileSync(join(moduleDir, "ProfileLiteChatsModule.jsx"), "utf8");
const profileServicesManagerSource = `${profileServicesModuleSource}\n${profileServicesClientSource}`;
const profileLiteMediaModuleSource = readFileSync(join(moduleDir, "ProfileLiteMediaModule.jsx"), "utf8");
const profileMaterialsModuleSource = readFileSync(join(moduleDir, "ProfileLiteMaterialsModule.jsx"), "utf8");
const profileGrimoireComposerSource = readFileSync(join(moduleDir, "ProfileLiteGrimoireComposer.jsx"), "utf8");
const profileCoursesClientSource = readFileSync("src/lib/profileCoursesClient.js", "utf8");
const profileCoursesModuleSource = readFileSync(join(moduleDir, "ProfileLiteCoursesModule.jsx"), "utf8");
const adminCoursesPanelSource = readFileSync("src/pages/admin/AdminCoursesPanel.jsx", "utf8");
const powerPlaceWrapperSource = readFileSync(join(moduleDir, "ProfileLitePowerPlaceModule.jsx"), "utf8");
const powerPlaceBaseSource = readFileSync(join(moduleDir, "ProfileLitePowerPlaceModuleBase.jsx"), "utf8");
const imagePickerSource = readFileSync(join(moduleDir, "ProfileLiteImagePicker.jsx"), "utf8");
const powerPlaceSource = `${powerPlaceWrapperSource}\n${powerPlaceBaseSource}`;
const profileMandalaCss = readFileSync("src/profileMandalaWorkspace.css", "utf8");
const grimoireWorkspaceCss = readFileSync(join(moduleDir, "ProfileLiteGrimoireWorkspace.css"), "utf8");
const mobileOrderCss = readFileSync("public/profile-lite-mobile-order-hotfix.css", "utf8");
const layoutFinalFix = readFileSync("public/profile-lite-layout-final-fix.js", "utf8");
const clientOrdersViewSource = profileOrdersModuleSource.slice(
  profileOrdersModuleSource.indexOf("function ClientOrdersView"),
  profileOrdersModuleSource.indexOf("function MasterOrdersView")
);
const masterOrdersViewSource = profileOrdersModuleSource.slice(
  profileOrdersModuleSource.indexOf("function MasterOrdersView"),
  profileOrdersModuleSource.indexOf("export default function ProfileLiteOrdersModule")
);

for (const label of expectedTabs.map(([, label]) => label)) {
  assert.match(moduleSource, new RegExp(label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")), `module source should include ${label}`);
}

assert.match(profileLitePageSource, /listAvailableCoursesForProfile/, "ProfileLitePage should load private courses through profileCoursesClient");
assert.match(profileLitePageSource, /listAvailableCourseSteps/, "ProfileLitePage should load course steps separately");
assert.match(profileLitePageSource, /listAvailableCourseLessons/, "ProfileLitePage should load lessons separately");
assert.match(profileLitePageSource, /courses:\s*\(\s*<ProfileLiteCoursesModule/, "ProfileLitePage should render the courses module by tab id");
assert.match(profileLitePageSource, /import AdminCoursesPanel from "\.\/admin\/AdminCoursesPanel\.jsx";/, "Profile Lite admin tab should import the shared course admin tools");
assert.match(profileLitePageSource, /admin:\s*isProfileAdmin\s*\?[\s\S]*<ProfileAdminPanel session=\{session\} \/>[\s\S]*<AdminCoursesPanel session=\{session\} \/>/, "Profile Lite admin tab should expose participant admin and course admin tools");
assert.match(profileLitePageSource, /setSelectedCourseId\(courseId\)[\s\S]*setSelectedStepId\(""\)[\s\S]*setCourseLessons\(\[\]\)/, "Course selection should reset selected step and lessons");
assert.match(profileCoursesModuleSource, /Курсы Академии/, "Courses module should expose the RU course heading");
assert.match(profileCoursesModuleSource, /Курсы пока не открыты\./, "Courses module should include empty course state");
assert.match(profileCoursesModuleSource, /Для этого курса пока нет доступных ступеней\./, "Courses module should include empty step state");
assert.match(profileCoursesModuleSource, /Уроки для этой ступени готовятся\./, "Courses module should include empty lesson state");
assert.match(profileCoursesModuleSource, /safeVideoEmbedUrl/, "Courses module should only iframe recognized safe video URLs");
assert.match(profileCoursesModuleSource, /<audio controls preload="metadata" src=\{audioUrl\}/, "Courses module should render audio only after safe URL normalization");
assert.doesNotMatch(profileCoursesModuleSource, /dangerouslySetInnerHTML/, "Courses lesson body must render as plain text");
assert.match(adminCoursesPanelSource, /Курсы и доступы/, "Admin should expose courses and access section");
assert.match(adminCoursesPanelSource, /Сохранить доступ/, "Admin courses panel should grant access");
assert.match(adminCoursesPanelSource, /Закрыть доступ/, "Admin courses panel should revoke access");
assert.match(profileCoursesClientSource, /buildCourseAccessIndex/, "Course client should expose access index helper");
assert.match(profileCoursesClientSource, /listAvailableCoursesForProfile/, "Course client should load courses for current profile");
assert.match(profileCoursesClientSource, /listAvailableCourseSteps/, "Course client should load steps for current profile");
assert.match(profileCoursesClientSource, /listAvailableCourseLessons/, "Course client should load lessons for current profile");
assert.doesNotMatch(`${profileCoursesClientSource}\n${profileCoursesModuleSource}\n${adminCoursesPanelSource}`, /lesson_access|per[-_ ]lesson/i, "Courses MVP should not implement per-lesson access");
assert.match(profileLiteShellSource, /<div className="profileLiteRoleSwitcher"[\s\S]*<header className="cabinetTopbar profileLiteTopbar"/, "Profile Lite role switcher must render before the cabinet topbar");
assert.doesNotMatch(profileLiteShellSource, /PROFILE_LITE_TABS\.map|profileLiteTabs/, "Profile Lite shell must not render the global tab rail that leaks master tabs into client mode");
assert.match(profileLiteShellSource, /const href = item\.href \|\| getProfileLiteRouteByTabId\(item\.tabId\);/, "Profile Lite shell should keep role-aware master navigation hrefs");
assert.match(profileLitePageSource, /initialRole = ""/, "ProfileLitePage should accept an initial role for ambiguous shared routes");
assert.match(profileLitePageSource, /getProfileLiteInitialRoleFromLocation/, "ProfileLitePage should preserve master role when opened through a role-aware URL");
assert.doesNotMatch(profileOrdersModuleSource, /Кабинет Мастера", "Заявки"/, "personal orders sidebar must not include master-only items");
assert.match(profileOrdersModuleSource, /isMasterRole[\s\S]*<MasterOrdersView/, "master requests panel should render only for the master role");
assert.doesNotMatch(profileOrdersModuleSource, /needs verification: \{ordersError\}/, "orders UI must not expose raw Supabase errors to users");
assert.match(profileOrdersModuleSource, /Не удалось загрузить личные заказы\. Попробуйте обновить страницу\./, "client orders UI should show a clean temporary failure message");
assert.match(profileOrdersModuleSource, /Не удалось загрузить заявки мастера\. Попробуйте обновить страницу\./, "master orders UI should show a clean temporary failure message");
assert.doesNotMatch(profileOrdersModuleSource, /clientGoalPhotos\.length\}\/4/, "orders photo summary must not render raw count slash limit text");
assert.doesNotMatch(profileOrdersModuleSource, /aria-label="Кабинет Личный Мои фото"/, "client orders must not render the separate media/photo panel");
assert.doesNotMatch(profileOrdersModuleSource, /Название фото|Загрузить фото/, "client orders must not render media upload form fields");
assert.deepEqual(getProfileLiteRoleNav("client").map((item) => item.tabId), ["orders", "courses", "media", "chats", "profile"]);
assert.match(profileOrdersModuleSource, /Мои заказы и материалы[\s\S]*Здесь появляются ваши заказы, аудио, мандалы и ответы мастера\./, "client orders should use warmer personal materials copy");
assert.match(profileOrdersModuleSource, /profileLiteOrdersServiceCta[\s\S]*Подбор практики[\s\S]*Например: мандала, консультация, аудио[\s\S]*\/profile\/services/, "client orders should include a guided services search CTA");
assert.match(profileOrdersModuleSource, /Пока здесь нет заказов[\s\S]*Когда мастер примет заявку или отправит материал[\s\S]*Найти услугу[\s\S]*Открыть мои курсы/, "client orders empty state should guide the next actions");
assert.match(profileOrdersModuleSource, /const helperActions = \[[\s\S]*Найти услугу[\s\S]*Открыть курсы[\s\S]*Написать мастеру[\s\S]*Добавить фото для работы/, "client orders should define concrete helper actions");
assert.match(profileOrdersModuleSource, /profileLiteOrdersHelperPanel[\s\S]*Что можно сделать сейчас[\s\S]*helperActions\.map/, "client orders should expose a desktop helper panel using the concrete actions");
assert.match(profileLiteMediaModuleSource, /Название фото[\s\S]*Загрузить файл|Загрузить файл[\s\S]*Название фото/, "media module should still own client photo upload UI");
assert.match(profileOrdersModuleSource, /ещё \{extraPhotoCount\} в медиатеке/, "orders photo panel should summarize hidden media without dumping filenames");
assert.match(profileLitePageSource, /listApprovedMasterProfiles/, "ProfileLitePage should load approved master profiles for chat creation");
assert.match(profileLitePageSource, /createConversationWithMaster/, "ProfileLitePage should create or open conversations through the shared chat client");
assert.match(profileLitePageSource, /listApprovedMasterProfiles\(session\)/, "approved chat profiles should keep the existing Supabase auth session flow");
assert.match(profileLitePageSource, /createConversationWithMaster\(profile\.id, masterProfileId, session\)/, "chat creation should preserve profile/session ownership flow");
assert.match(profileLitePageSource, /<ProfileLiteChatsModule[\s\S]*onStartChatWithMaster=\{handleStartChatWithMaster\}/, "ProfileLitePage should pass the start-chat action into the chat module");
assert.match(profileChatsModuleSource, /approvedChatProfiles = \[\]/, "chats module should accept approved master profiles");
assert.match(profileChatsModuleSource, /onStartChatWithMaster\(master\.id\)/, "approved master buttons should create or open a conversation");
assert.match(profileChatsModuleSource, /Начните диалог с мастером/, "empty chat state should invite selecting an approved master");
assert.match(profileChatsModuleSource, /Выберите мастера из одобренных профилей/, "empty chat state should explain the approved-master flow");
assert.match(profileChatsModuleSource, /disabled=\{!selectedThread \|\| !hasDraft\}/, "send button should require a selected thread and non-empty draft");
assert.doesNotMatch(profileChatsModuleSource, /needs verification/i, "chats UI must not expose raw needs verification text");
assert.doesNotMatch(profileChatsModuleSource, /Источник данных|profile_cabinet_chat_\*|Статические разделы чатов|Места силы", "Фото клиентов"|Создание новых диалогов/, "chats UI must not expose debug source or old placeholder copy");

for (const requiredPowerPlaceText of [
  "Мастерская мандал",
  "Место силы",
  "Мои мандалы",
  "Источники силы",
  "Добавить фото",
  "Добавить в мои услуги",
  "В услугах ✓",
  "Удалить",
  "Группа",
  "Категория",
  "Подкатегория / Ступень",
  "Фон места силы",
  "Фон внутри",
  "Фон снаружи",
  "Библиотека",
  "Полка",
  "Символы",
  "Загрузить своё",
  "Отчёт",
  "Анализ",
  "Размер окон",
  "Масштаб фото",
  "Размер поля",
  "Размер центра",
  "Сохранённые мандалы",
  "Объекты композиции",
  "Обновить",
  "Создать новую",
  "Перенести в услуги",
  "Опубликовать как услугу",
  "Скачать PDF",
  "Печать",
  "ДАО-Макет",
  "Верхушка",
  "Крыша",
  "3 галочки",
  "Боковые точки",
  "Показывать",
  "Количество точек"
]) {
  assert.match(`${powerPlaceSource}\n${moduleSource}`, new RegExp(requiredPowerPlaceText.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")), `Lite Power Place should include UX text: ${requiredPowerPlaceText}`);
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
  "powerSymbolLibraryPanel",
  "powerSymbolLibraryGrid",
  "objectImageEditor",
  "clientPhotoPickerModal",
  "profileLiteImagePickerCloseButton",
  "imagePickerSourceGroups",
  "imagePickerSecondLevel"
]) {
  assert.match(`${powerPlaceSource}\n${profileMandalaCss}`, new RegExp(requiredClass), `Lite Power Place should reuse visual workshop class ${requiredClass}`);
}

assert.match(powerPlaceSource, /<aside className="mandalaModeSidebar powerLibrarySidebar"[\s\S]*<div className="workspaceCenterColumn"[\s\S]*<div className="workspaceRightColumn"/, "Lite Power Place should preserve desktop left / center / right source order");
assert.match(powerPlaceSource, /data-compact-photo-list="true"/, "Profile Lite source rail should expose a compact photo list marker");
assert.match(powerPlaceSource, /POWER_PLACE_DRAG_PAYLOAD_TYPE = "application\/x-reiki-power-place-source"/, "Power Place DnD should use a scoped compact payload MIME type");
assert.match(powerPlaceSource, /function buildPowerPlaceDragPayload\(/, "Power Place source cards should build a compact drag payload");
assert.match(powerPlaceSource, /function parsePowerPlaceDragPayload\(/, "Power Place drops should parse drag payloads defensively");
assert.match(powerPlaceSource, /const assignPowerPlaceSlotImage = \(/, "Power Place slot assignment should be shared by dropdowns, picker, and drops");
assert.match(powerPlaceSource, /const getPowerPlaceSlotDropHandlers = \(/, "Power Place slots should expose shared drop target handlers");
assert.match(powerPlaceSource, /listPowerPlaceSymbolsByShelf/, "Power Place module should load symbols from the static symbol library");
assert.match(powerPlaceSource, /handleSavedImageDragStart\(event, item\)/, "Power Place symbol library should reuse the existing source drag payload");
assert.match(powerPlaceSource, /onClick=\{\(\) => chooseImage\(item\)\}/, "Power Place symbol clicks should reuse the existing image selection path");
assert.match(powerPlaceBaseSource, /export default function ProfileLitePowerPlaceModule\(\{[\s\S]*accountPlan = "start"[\s\S]*\}\) \{/, "Power Place base module should default accountPlan so opening the image picker cannot throw when the parent omits it");
assert.match(powerPlaceBaseSource, /<ProfileLiteImagePicker[\s\S]*accountPlan=\{accountPlan\}/, "Power Place image picker should receive the safe accountPlan prop");
assert.match(profileLitePageSource, /const accountPlan = resolveProfileMasterPlan\(\{ account_plan: form\.account_plan \|\| profile\?\.account_plan \}, user, supabaseEnv\.adminEmail\)/, "ProfileLitePage should derive accountPlan through the real profile form/row and owner/admin resolver");
assert.match(profileLitePageSource, /const moduleProps = \{[\s\S]*accountPlan,[\s\S]*compositionDraft/, "ProfileLitePage should pass the real normalized accountPlan when it is available");
assert.match(readFileSync(join(moduleDir, "ProfileLiteImagePicker.jsx"), "utf8"), /accountPlan = "start"[\s\S]*const isProAccount = accountPlan !== "start"[\s\S]*disabled=\{option\.proOnly && !isProAccount\}/, "ProfileLiteImagePicker should keep expanded client options disabled for Start");
assert.match(powerPlaceSource, /const openCoverPickerForLayer = \(layer\) => \{[\s\S]*setCoverLayerMode\(layer\)[\s\S]*openPicker\("cover"\)/, "the existing cover picker helper should remain available for the choose-photo button");
assert.match(powerPlaceBaseSource, /rotateSlotPhoto[\s\S]*↺ 90°[\s\S]*↻ 90°/, "selected photo editor must expose compact rotate-left and rotate-right controls");
assert.match(`${powerPlaceBaseSource}\n${powerPlaceSource}`, /--slot-bg-rotate[\s\S]*rotate\(var\(--slot-bg-rotate, 0deg\)\)/, "slot image rendering must compose persisted rotation into the selected photo layer transform");
assert.match(powerPlaceBaseSource, /writeSlotImageTransform\(selectedSlotId,\s*50,\s*50,\s*1,\s*0\)/, "slot photo reset must also reset persisted rotation to 0");
assert.match(powerPlaceBaseSource, /clearCoverLayer[\s\S]*coverLayerDeleteButton/, "inner and outer background tabs must expose direct delete controls");
assert.doesNotMatch(powerPlaceSource, /renderCoverDropIcon|coverDropIconRow|coverDropIconButton/, "duplicate cover drop icon row should be removed from the React module");
assert.match(powerPlaceBaseSource, /const legacyDaoLayoutStyle = compositionDraft\.__dao_style === DAO_LAYOUT_TEMPLATE_STYLE_ID[\s\S]*const daoStyle = legacyDaoLayoutStyle \? "style-1" : compositionDraft\.__dao_style \|\| "style-1"/, "DAO style should be computed once before rendering with legacy layout normalization");
assert.match(powerPlaceBaseSource, /const isDaoFulu = DAO_FULU_STYLES\.has\(daoStyle\)/, "DAO fulu detection should use computed daoStyle");
assert.match(powerPlaceBaseSource, /function isDaoFuluContourAsset\(src\)/, "DAO renderer should detect built-in fulu contour assets");
assert.match(powerPlaceBaseSource, /function renderDaoFulu\(\)[\s\S]*<div className="daoFuluScroll" aria-label="Даосский талисман">/, "DAO fulu styles should keep the dedicated fulu render branch");
assert.match(powerPlaceBaseSource, /function renderDaoStyle2\(\)[\s\S]*daoStyle2Scroll[\s\S]*dao-style-2-\$\{index \+ 1\}/, "DAO style-2 should keep a dedicated vertical mini-window render branch");
assert.match(powerPlaceBaseSource, /function renderDaoFuReferenceOutline\(\)[\s\S]*className: "daoFuReferenceOutline"/, "DAO outline contour helper should remain the pure SVG contour helper");
assert.match(powerPlaceBaseSource, /const DAO_SHARED_STAGE_STYLE_VALUES = new Set[\s\S]*function renderDaoSharedStage\(\)[\s\S]*renderDaoFieldBackgroundLayer\("daoSharedFieldLayer"\)[\s\S]*renderDaoInnerContentStack\(\)[\s\S]*renderDaoTalismanOverlay\(config\)/, "DAO outline styles should render through the shared stage/layer stack");
assert.match(powerPlaceBaseSource, /function renderDaoInnerContentStack\(\)[\s\S]*DAO_SHARED_STAGE_MINI_SLOTS\.map[\s\S]*DAO_LAYOUT_MINI_SLOT_NUMBERS\[index\][\s\S]*openObjectPicker\(slotId\)[\s\S]*slotImageStyle\(slotId, displaySrc\)[\s\S]*getSlotImagePanZoomHandlers\(slotId\)[\s\S]*getPowerPlaceSlotDropHandlers\(slotId\)/, "shared DAO slots should keep picker, saved pan/zoom, drag/drop, and 3,4,5,7 visual slots");
assert.match(powerPlaceBaseSource, /function renderDaoTalismanOverlay\(config = \{\}\)[\s\S]*renderDaoFuReferenceOutline\(\)[\s\S]*daoSharedTopMarker/, "new DAO outline overlays should use the shared contour layer plus an optional top marker");
assert.match(powerPlaceBaseSource, /<div className="daoFuluContourLayer" aria-hidden="true" \/>/, "DAO fulu render branch should include exactly one self-contained contour layer");
for (const removedFuluLayer of ["daoFuluFallbackPaper", "daoFuluTopHead", "daoFuluSideRail", "daoFuluBottomBase", "daoFuluHeader", "daoFuluFooter", "daoFuluSealBox", "daoFuluPureMarks"]) {
  assert.doesNotMatch(powerPlaceBaseSource, new RegExp(removedFuluLayer), `DAO fulu render branch must not render ${removedFuluLayer}`);
  assert.doesNotMatch(profileMandalaCss, new RegExp(removedFuluLayer), `DAO fulu CSS must not define ${removedFuluLayer}`);
}
assert.doesNotMatch(powerPlaceBaseSource, /style=\{\{[\s\S]*innerCoverImageStyle\(innerCover, coverDisplaySrc\(innerCover\)\)[\s\S]*daoFuluContourStyle\(compositionDraft\.__dao_style \|\| "style-1"\)[\s\S]*\}\}/, "DAO outer sheet must not merge user cover and fulu contour variables blindly");
assert.match(powerPlaceBaseSource, /const daoBaseCoverStyle[\s\S]*!isDaoFulu[\s\S]*!innerCoverIsFuluContour[\s\S]*innerCoverImageStyle\(innerCover, innerCoverSrc\)/, "Non-fulu DAO styles should ignore built-in fulu contours as inner covers");
assert.match(powerPlaceBaseSource, /const daoFuluStyle[\s\S]*daoFuluContourStyle\(daoStyle\)[\s\S]*"--dao-fulu-user-cover-image"/, "Fulu style should separate contour and subtle user cover variables");
assert.match(powerPlaceBaseSource, /className=\{daoClassName\} style=\{daoOuterStyle\}/, "DAO outer sheet should receive the isolated DAO class and style objects");
assert.match(profileMandalaCss, /\.daoMandalaSheet\.dao-fulu/, "CSS should define shared dao-fulu holder");
assert.match(profileMandalaCss, /\.daoMandalaSheet\.dao-style-2/, "CSS should define shared dao-style-2 holder");
assert.match(profileMandalaCss, /--dao-fulu-user-cover-image/, "CSS should consume --dao-fulu-user-cover-image");
assert.match(profileMandalaCss, /--dao-field-cover-image[\s\S]*\.daoFieldCoverLayer|\.daoFieldCoverLayer[\s\S]*--dao-field-cover-image/, "CSS should consume borderless DAO field-cover layer for Размер поля");
assert.match(profileMandalaCss, /\.daoFieldCoverLayer \{[\s\S]*background-image: var\(--dao-field-cover-image, none\)[\s\S]*opacity: var\(--dao-field-cover-opacity, 0\)/, "DAO field cover layer should be invisible without a real uploaded image");
assert.match(profileMandalaCss, /\.daoSharedStage \.daoSharedFieldLayer \{[\s\S]*z-index: 0;/, "shared DAO field layer should sit behind the talisman overlay");
assert.match(profileMandalaCss, /\.daoFieldCoverLayer \{[\s\S]*width: var\(--power-field-scale, 78%\)[\s\S]*background-image: var\(--dao-field-cover-image, none\)/, "DAO shared field layer must scale the selected field background with Размер поля");
assert.doesNotMatch(profileMandalaCss, /\.daoMandalaSheet\.dao-fu-outline \{[\s\S]*--dao-field-cover-image: none;/, "DAO outline styles must not reset the shared field background image variable");
for (const assetPath of [
  "/symbols/power-place/dao/fulu/fu-paper-slip.svg",
  "/symbols/power-place/dao/fulu/cloud-register.svg",
  "/symbols/power-place/dao/fulu/thunder-tablet.svg",
  "/symbols/power-place/dao/fulu/taofu-charm.svg"
]) {
  assert.equal(existsSync(join("public", assetPath)), true, `${assetPath} should exist for DAO fulu contours`);
  assert.match(powerPlaceBaseSource, new RegExp(assetPath.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")), `DAO fulu style values should map ${assetPath}`);
}
assert.match(powerPlaceBaseSource, /className="coverLayerTabShell"[\s\S]*coverLayerMode === "inner"[\s\S]*dragOverSlotId === "cover_ref\.inner"[\s\S]*onClick=\{\(\) => setCoverLayerMode\("inner"\)\}[\s\S]*getPowerPlaceSlotDropHandlers\("cover_ref\.inner"\)/, "inner cover tab should target cover_ref.inner without opening the picker");
assert.match(powerPlaceBaseSource, /className="coverLayerTabShell"[\s\S]*coverLayerMode === "outer"[\s\S]*dragOverSlotId === "cover_ref\.outer"[\s\S]*onClick=\{\(\) => setCoverLayerMode\("outer"\)\}[\s\S]*getPowerPlaceSlotDropHandlers\("cover_ref\.outer"\)/, "outer cover tab should target cover_ref.outer without opening the picker");
assert.match(powerPlaceBaseSource, />\s*Внутрь\s*<\/button>/, "inner cover tab should use the compact Внутрь label");
assert.match(powerPlaceBaseSource, />\s*Снаружи\s*<\/button>/, "outer cover tab should use the compact Снаружи label");
assert.match(powerPlaceSource, /draggable=\{Boolean\(item\.src\)\}/, "Only valid saved source cards should be draggable");
assert.match(powerPlaceSource, /onDragStart=\{\(event\) => handleSavedImageDragStart\(event, item\)\}/, "Saved source cards should write the compact payload on drag start");
assert.match(powerPlaceSource, /const buildCompositionDragItem = \(composition, previewSrc = ""\) => \{[\s\S]*kind: "saved-mandala"[\s\S]*displaySrc: previewSrc/, "saved mandala cards should create a compatible drag item from their preview image");
assert.match(powerPlaceSource, /profileLiteCompositionCard profileLiteCompositionCard--horizontal[\s\S]*draggable=\{Boolean\(compositionDragItem\?\.src\)\}[\s\S]*handleSavedImageDragStart\(event, compositionDragItem\)/, "saved mandala cards should be draggable when they have a usable image ref");
assert.match(powerPlaceSource, /getPowerPlaceSlotDropHandlers\("__center_image"\)/, "Center slot should accept dropped saved images through the shared assignment path");
assert.match(powerPlaceSource, /getPowerPlaceSlotDropHandlers\(slot\.id\)/, "Layout image slots should accept dropped saved images through the shared assignment path");
assert.match(powerPlaceSource, /getPowerPlaceSlotDropHandlers\("cover_ref\.inner"\)/, "inner cover tab should target cover_ref.inner through shared handlers");
assert.match(powerPlaceSource, /getPowerPlaceSlotDropHandlers\("cover_ref\.outer"\)/, "outer cover tab should target cover_ref.outer through shared handlers");
assert.match(powerPlaceSource, /onChange=\{\(event\) => selectedSlot && assignPowerPlaceSlotImage\(selectedSlot\.id, event\.target\.value, event\.target\.value\)\}/, "Object dropdown should reuse the same slot assignment helper as drops");
assert.match(profileMandalaCss, /\.power-place-slot--drag-over/, "Power Place drop targets should have a subtle drag-over state");
assert.doesNotMatch(profileMandalaCss, /coverDropIconRow|coverDropIconButton/, "duplicate cover drop icon CSS should be removed");
assert.match(profileMandalaCss, /\.profileLitePowerPlace \.coverLayerTabs button\.power-place-slot--drag-over/, "cover layer tab drag-over styling should be scoped");
assert.match(profileLiteMediaModuleSource, /Все файлы[\s\S]*Клиенты \/ Все[\s\S]*Клиент 1[\s\S]*Клиент 2[\s\S]*Клиент 3[\s\S]*Больше клиентов \/ Pro[\s\S]*Материалы/, "Profile Lite media manager should expose the requested folder navigation");
assert.match(profileLiteMediaModuleSource, /draggable=\{photoDraggable\}[\s\S]*handleClientPhotoDragStart\(event, photo\)/, "client photo cards should be draggable");
assert.match(profileLiteMediaModuleSource, /onDrop=\{\(event\) => handleFolderDrop\(event, folder\)\}/, "client folders should be droppable");
assert.match(profileLiteMediaModuleSource, /Переместить в…[\s\S]*onChange=\{\(event\) => handleClientPhotoMove\(photo, event\.target\.value\)\}/, "client photo cards should expose a non-drag move action");
assert.match(profileLiteMediaModuleSource, /option\.proOnly && !isProAccount[\s\S]*disabled=\{option\.proOnly && !isProAccount\}/, "Start plan should disable the Pro folder in move controls");
assert.match(profileLiteMediaModuleSource, /folder\.proOnly && !isProAccount[\s\S]*Доступно в Pro/, "Start plan should block dropping into the Pro folder with a hint");
assert.match(profileLiteMediaModuleSource, /kind: "client-photo"[\s\S]*kind: "material"/, "media manager should build one mixed file browser across client photos and materials");
assert.match(profileMandalaCss, /\.profileLitePowerPlace \.sourceSlotScaleControl,[\s\S]*\.profileLitePowerPlace \.innerFieldScaleControl,[\s\S]*\.profileLitePowerPlace \.centerFrameScaleControl,[\s\S]*\.profileLitePowerPlace \.photoScaleControl \{[\s\S]*grid-template-columns: minmax\(140px, 190px\) 28px minmax\(180px, 1fr\) 28px;/, "all four Power Place sliders should share the desktop grid contract");
assert.match(profileMandalaCss, /\.profileLitePowerPlace \.sourceSlotScaleControl button,[\s\S]*\.profileLitePowerPlace \.photoScaleControl button \{[\s\S]*width: 28px;[\s\S]*height: 28px;[\s\S]*display: grid;[\s\S]*place-items: center;/, "all four Power Place slider buttons should share compact square sizing");
assert.match(profileMandalaCss, /@media \(max-width: 640px\) \{[\s\S]*\.profileLitePowerPlace \.sourceSlotScaleControl,[\s\S]*\.profileLitePowerPlace \.photoScaleControl \{[\s\S]*grid-template-columns: minmax\(0, 1fr\) 28px minmax\(110px, 1fr\) 28px;/, "all four Power Place sliders should keep a no-overlap mobile grid");
assert.match(profileLitePageSource, /PROFILE_LITE_REPORT_REF_KEY[\s\S]*object_refs[\s\S]*normalizeProfileLiteReport/, "Profile Lite page should save report payload into object_refs");
assert.match(profileLitePageSource, /const EMPTY_PROFILE_LITE_REPORT = \{[\s\S]*mode: "without_report"/, "new Profile Lite drafts should default to Без отчёта in the page state");
assert.match(powerPlaceBaseSource, /const EMPTY_PROFILE_LITE_REPORT = \{[\s\S]*mode: "without_report"/, "new Profile Lite report UI drafts should default to Без отчёта");
assert.match(profileLitePageSource, /slot_scale:\s*1/, "Profile Lite empty composition should include the shared slot_scale field");
assert.match(profileLitePageSource, /field_scale:\s*78/, "Profile Lite empty composition should include the persisted field_scale control");
assert.match(profileLitePageSource, /slotScaleFromComposition\(composition\)/, "handleCompositionLoad should restore slot_scale from either slot_scale or object_refs.__slot_scale");
assert.match(profileLitePageSource, /slotScaleFromComposition\(freshSaved\)/, "refreshSavedCompositions should restore slot_scale from either slot_scale or object_refs.__slot_scale");
assert.match(profileMandalaCss, /--power-source-slot-scale/, "Mandala workspace CSS should include shared source slot scaling");
assert.match(profileMandalaCss, /--power-field-scale/, "Mandala workspace CSS should include independent inner field scaling");
assert.match(powerPlaceSource, /CENTER_IMAGE_SCALE_REF_KEY = "__center_image_scale"/, "center photo scale should persist through object_refs");
assert.match(powerPlaceSource, /__center_image_scale: centerImageScale/, "center photo scale should be passed through enhanced draft only");
assert.match(powerPlaceSource, /centerImageStyle/, "center photo renderer should use the independent center image scale style");
assert.match(profileMandalaCss, /--power-center-image-scale/, "Mandala workspace CSS should include independent center photo scaling");
assert.match(powerPlaceSource, /CENTER_FRAME_SCALE_REF_KEY = "__center_frame_scale"/, "center frame/window scale should persist through object_refs without a schema change");
assert.match(powerPlaceSource, /__center_frame_scale: centerFrameScale/, "center frame/window scale should be passed through enhanced draft only");
assert.match(powerPlaceSource, /Размер окон[\s\S]*field: "slot_scale"[\s\S]*Размер поля[\s\S]*field: "field_scale"[\s\S]*Размер центра[\s\S]*field: "__center_frame_scale"[\s\S]*Масштаб фото[\s\S]*field: "__center_image_scale"/, "Power Place constructor controls should map slot-window, field, center frame, and center photo sliders to distinct fields");
assert.match(powerPlaceBaseSource, /Масштаб фото[\s\S]*writeSlotImageTransform/, "Масштаб фото slider must be in renderSlotPhotoEditor and call writeSlotImageTransform");
assert.equal((powerPlaceBaseSource.match(/renderScaleControl\(\{ className: "sourceSlotScaleControl"/g) || []).length, 1, "Размер окон slider should render once from the base module");
assert.equal((powerPlaceBaseSource.match(/renderScaleControl\(\{ className: "photoScaleControl"/g) || []).length, 1, "Масштаб фото center photo slider should render once from the base module");
assert.equal((powerPlaceBaseSource.match(/renderScaleControl\(\{ className: "innerFieldScaleControl"/g) || []).length, 1, "Размер поля slider should render once from the base module");
assert.equal((powerPlaceBaseSource.match(/renderScaleControl\(\{ className: "centerFrameScaleControl"/g) || []).length, 1, "Размер центра slider should render once from the base module");
assert.match(powerPlaceBaseSource, /className: "photoScaleControl"[\s\S]*label: "Масштаб фото"[\s\S]*value: centerImageScale[\s\S]*min: "0\.65"[\s\S]*max: "2"[\s\S]*step: "0\.01"[\s\S]*field: "__center_image_scale"[\s\S]*visibilityKey: "center"[\s\S]*visibilityLabel: "Центр мандалы"/, "Масштаб фото must target center image scale and share the center visibility toggle");
assert.match(profileMandalaCss, /\.profileLitePowerPlace \.sourceSlotScaleControl,[\s\S]*\.profileLitePowerPlace \.innerFieldScaleControl,[\s\S]*\.profileLitePowerPlace \.centerFrameScaleControl,[\s\S]*\.profileLitePowerPlace \.photoScaleControl \{[\s\S]*grid-template-columns: minmax\(140px, 190px\) 28px minmax\(180px, 1fr\) 28px;/, "all four size sliders should share the requested desktop grid");
assert.match(profileMandalaCss, /@media \(max-width: 640px\)[\s\S]*\.profileLitePowerPlace \.sourceSlotScaleControl,[\s\S]*grid-template-columns: minmax\(0, 1fr\) 28px minmax\(110px, 1fr\) 28px;/, "all four size sliders should share the requested mobile grid");
assert.match(profileMandalaCss, /@media \(max-width: 980px\)[\s\S]*\.profileLitePowerPlace \.powerLayoutPanel\.compactFieldLayoutSwitch \{[\s\S]*order: 1 !important;/, "source CSS should keep compact layout controls above the background card on mobile");
assert.match(powerPlaceSource, /powerSavedMandalaSelect[\s\S]*placeholder: "Сохранённые мандалы"|<option value="">\s*Сохранённые мандалы\s*<\/option>/, "saved mandala select should expose the fixed placeholder");
assert.match(powerPlaceSource, /compositionMessage[\s\S]*compactNotice/, "composition message should remain a compact message below controls/select");
assert.match(powerPlaceSource, />\s*Обновить\s*<\/button>[\s\S]*>\s*Сохранить как шаблон\s*<\/button>[\s\S]*isMasterWorkflow[\s\S]*>\s*Сохранить для клиента\s*<\/button>[\s\S]*>Перенести в услуги<\/button>[\s\S]*>Опубликовать как услугу<\/button>/, "Power Place actions should expose update, template save, client save, transfer, and publish buttons in order for master workflow");
assert.match(powerPlaceSource, /SHOW_POWER_PLACE_FEED_PROJECTION[\s\S]*Опубликовать в ленту[\s\S]*Название для ленты[\s\S]*Публичное описание/, "Power Place should keep feed projection handlers/form code behind the visibility flag");
assert.match(powerPlaceSource, /const SHOW_POWER_PLACE_FEED_PROJECTION = false;/, "Power Place public projection must be hidden from the builder UI");
const powerPlaceFeedProjectionSource = powerPlaceSource.match(/<div className="powerPlaceFeedProjection"[\s\S]*?<\/div>\s*<p className="powerPrintColorHint">/)?.[0] || "";
assert.doesNotMatch(powerPlaceFeedProjectionSource, /object_refs|storage:\/\/|signed URL|profile-cabinet-media/i, "Power Place feed projection UI must not render private refs");
assert.match(profileMaterialsModuleSource, /getGrimoireFeedActionLabel/, "materials should derive feed action labels from publication visibility");
assert.match(profileMaterialsModuleSource, /getGrimoireNextVisibilityStatus/, "materials should hide visible feed items by changing status, not deleting");
assert.match(profileMaterialsModuleSource, /grimoireTaxonomyFilterLevelOptions/, "Grimoire feed filter should use the shared 3-level taxonomy source");
assert.match(profileMaterialsModuleSource, /materialMatchesGrimoireTaxonomyFilter/, "Grimoire feed filter should use shared taxonomy matching with legacy fallback");
assert.match(profileMaterialsModuleSource, /Фильтр материалов/, "Grimoire feed should render the compact taxonomy filter label");
assert.match(profileMaterialsModuleSource, /Уровень 1[\s\S]*Уровень 2[\s\S]*Уровень 3/, "Grimoire feed should render all three taxonomy filter dropdown labels");
assert.match(profileMaterialsModuleSource, /Сбросить/, "Grimoire feed should expose a reset action for taxonomy filters");
assert.match(profileMaterialsModuleSource, /grimoireMaterialFilterPanel/, "Grimoire feed should render a dedicated compact filter panel above records");
assert.match(profileMaterialsModuleSource, /grimoireTaxonomyMeta/, "Grimoire record cards should render compact taxonomy metadata");
assert.match(profileMaterialsModuleSource, /<img[\s\S]*className="grimoireCardImage"[\s\S]*onError/, "materials should render actual image previews and fall back only after load failure");
assert.match(profileMaterialsModuleSource, /attachments,[\s\S]*display_url:\s*saved\.display_url \|\| firstSignedUrl/, "composer should keep signed preview URLs for newly uploaded parent galleries");
assert.match(profileMaterialsModuleSource, /function GrimoirePhotoGallery/, "Grimoire cards should render photos through one parent gallery component");
assert.match(profileMaterialsModuleSource, /getGrimoirePhotoGalleryItems/, "Grimoire gallery should use normalized parent attachments");
assert.match(profileMaterialsModuleSource, /buildGrimoireBatchUploadPayload\(\{[\s\S]*uploadedFiles,[\s\S]*description:\s*cleanDescription/, "composer should persist multi-photo attachments under one parent material");
assert.doesNotMatch(profileMaterialsModuleSource, /const records = selectedFiles\.length \? selectedFiles : \[null\]/, "composer must not create one parent material per selected file");
assert.match(profileLitePageSource, /buildGrimoireBatchUploadPayload\(\{[\s\S]*uploadedFiles,[\s\S]*taxonomy:\s*normalizeGrimoireTaxonomy\(\{\}\)/, "bulk Grimoire upload should persist selected files as one parent attachment batch");
assert.match(profileGrimoireComposerSource, /grimoireComposerGroupPills/, "Grimoire composer should render large top group pills like the image picker material filter");
assert.match(profileGrimoireComposerSource, /grimoireComposerTaxonomyPanel[\s\S]*Категория[\s\S]*Подкатегория \/ ступень/, "Grimoire composer should render compact grouped taxonomy selects instead of a plain vertical level stack");
assert.doesNotMatch(profileGrimoireComposerSource, />Уровень 1<[\s\S]*>Уровень 2<[\s\S]*>Уровень 3</, "Grimoire composer should not expose the old plain Level 1/2/3 stack");
for (const gallerySelector of [
  ".grimoirePhotoGallery--count-1",
  ".grimoirePhotoGallery--count-2",
  ".grimoirePhotoGallery--count-3",
  ".grimoirePhotoGallery--count-4",
  ".grimoirePhotoGallery--count-5",
  ".grimoirePhotoMore"
]) {
  assert.match(grimoireWorkspaceCss, new RegExp(gallerySelector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")), `Grimoire gallery CSS should include ${gallerySelector}`);
}
assert.match(grimoireWorkspaceCss, /grimoirePhotoGallery[\s\S]*max-height:\s*280px/, "Grimoire gallery should have a controlled desktop height");
assert.match(grimoireWorkspaceCss, /grimoireComposerGroupPills[\s\S]*button\.active/, "Grimoire composer CSS should include picker-style group pill controls");
assert.match(profileServicesModuleSource, /Добавить в ленту[\s\S]*Опубликовать обновление/, "published services should expose explicit feed create/update actions");
assert.match(powerPlaceBaseSource, /<label className="compositionTitleField">[\s\S]*Название мандалы[\s\S]*<input className="compositionTitleInput"[\s\S]*<\/label>[\s\S]*<div className="powerPlaceActions powerPlaceActions--save">[\s\S]*>\s*Обновить\s*<\/button>/, "Power Place title field should appear before action buttons in the DOM contract");
assert.doesNotMatch(profileMandalaCss, /\.profileLitePowerPlace \.powerPlaceActions\s*\{[^}]*?(?<![a-z])order\s*:/, "mobile CSS must not reorder the Power Place action button group above the title field");
assert.match(powerPlaceBaseSource, /const handleSaveNewClick = \(\) => \{[\s\S]*if \(createNewDisabled\)[\s\S]*return;[\s\S]*onSaveNew\(\);[\s\S]*\}/, "Create-new button should use an explicit click wrapper that calls onSaveNew only when not at limit");
assert.match(powerPlaceBaseSource, /onClick=\{onUpdateExisting\}[\s\S]*disabled=\{updateExistingDisabled\}[\s\S]*>[\s\S]*Обновить[\s\S]*<\/button>/, "Update button should call onUpdateExisting and be disabled when no composition is open");
assert.match(powerPlaceBaseSource, /onClick=\{handleSaveNewClick\}[\s\S]*disabled=\{createNewDisabled\}[\s\S]*>[\s\S]*Создать новую[\s\S]*<\/button>/, "Create-new button should call handleSaveNewClick and be disabled at the limit");
assert.doesNotMatch(powerPlaceBaseSource, /<div className="powerPlaceActions">[\s\S]*<span>[\s\S]*сохранённых мест силы[\s\S]*<\/span>[\s\S]*<\/div>/, "saved-count text must not be a raw inline span inside the clickable actions row");
assert.match(powerPlaceBaseSource, /<p className="powerPlaceActionsMeta"[\s\S]*\{savedCompositionCount\}\/\{savedCompositionLimit\} сохранённых мест силы/, "saved-count text should render as a dedicated meta block below action buttons");
assert.match(profileMandalaCss, /\.profileLitePowerPlace \.powerPlaceActions button:disabled[\s\S]*cursor: not-allowed[\s\S]*opacity:/, "Power Place disabled action buttons should have obvious scoped disabled styling");
assert.match(profileMandalaCss, /\.profileLitePowerPlace \.powerPlaceActionsMeta[\s\S]*width: 100%[\s\S]*pointer-events: none/, "Power Place saved-count meta should not be able to cover or intercept action buttons");
assert.match(profileMandalaCss, /\.profileLitePowerPlace \.profileLitePowerPlaceActions > \.powerPlaceActions \{[\s\S]*order: 2 !important;[\s\S]*\.profileLitePowerPlace \.profileLitePowerPlaceActions > \.profileLitePowerPlaceActionFeedback \{[\s\S]*order: 3;[\s\S]*\.profileLitePowerPlace \.profileLitePowerPlaceActions > \.powerPlaceActionsMeta \{[\s\S]*order: 4;/, "Profile Lite action card should force buttons, stage feedback, then saved-count meta even when public mobile hotfixes assign action order");
assert.doesNotMatch(powerPlaceBaseSource, /powerPlacePrintArea[\s\S]*renderPowerPlaceActions\(\)[\s\S]*reportAdded/, "Power Place actions must not render inside the central printable mandala flow before report output");
assert.match(powerPlaceBaseSource, /workspaceRightColumn[\s\S]*renderReportModule\(\)[\s\S]*renderPowerPlaceActions\(\)/, "Power Place actions should render after the library, cover, and report modules for mobile ordering");
assert.match(profileMandalaCss, /@media \(max-width: 980px\) \{[\s\S]*\.profileLitePowerPlace \.profileLitePowerPlaceActions \{[\s\S]*order: 5 !important;[\s\S]*\.profileLitePowerPlace \.powerLibrarySidebar \{[\s\S]*order: 99 !important;/, "mobile Power Place layout should keep title/actions above sources and move Источники силы to the bottom");
assert.match(profileLitePageSource, /handleCompositionSaveNew/, "Profile Lite page should split composition create into handleCompositionSaveNew");
assert.match(profileLitePageSource, /const message = "Сначала сохраните профиль мастера\.";[\s\S]*setMandalasError\(message\);[\s\S]*setCompositionMessage\(powerPlaceSaveFailureMessage\("profile", \{ message \}, message\)\);/, "Save preflight failure should render near the Power Place action controls as a visible staged composition message");
assert.match(profileLitePageSource, /handleCompositionUpdateExisting/, "Profile Lite page should split composition update into handleCompositionUpdateExisting");
assert.match(profileLitePageSource, /createPowerPlaceComposition\(\s*\{\s*\.\.\.createPayload\s*,\s*id:\s*undefined\s*\}|delete createPayload\.id/, "Save should create a new composition without preserving draft id");
assert.match(profileLitePageSource, /копия/, "Duplicate saved mandala titles should be saved as copy titles");
assert.match(profileLitePageSource, /Сначала создайте новую мандалу или откройте сохранённую/, "Update without an existing composition should show the required message");
assert.match(profileLitePageSource, /updatePowerPlaceComposition\(compositionDraft\.id/, "Update should call updatePowerPlaceComposition for the current saved composition");
assert.match(profileLitePageSource, /canCreateWithinPlanLimit\(accountPlan, "compositions", currentSavedCompositionCount\)/, "Save-new should use the shared plan entitlement helper before backend create");
assert.match(profileLitePageSource, /currentSavedCompositionCount[\s\S]*masterPowerPlaceCompositions\.length[\s\S]*canCreateWithinPlanLimit\(accountPlan, "compositions", currentSavedCompositionCount\)[\s\S]*!entitlement\.allowed[\s\S]*return;[\s\S]*createPowerPlaceComposition/, "Save-new should return before createPowerPlaceComposition when master saved mandalas reach the current plan limit");
assert.match(profileLitePageSource, /handleCompositionUpdateExisting[\s\S]*updatePowerPlaceComposition\(compositionDraft\.id/, "Update existing should keep using updatePowerPlaceComposition even when the save-new limit guard exists");
assert.match(powerPlaceBaseSource, /const savedCompositionCount = powerPlaceCompositions\.length[\s\S]*const savedCompositionLimit = planLimits\.compositions[\s\S]*const createNewDisabled = savedCompositionCount >= savedCompositionLimit[\s\S]*const updateExistingDisabled = !compositionDraft\.id/, "Power Place UI should compute separate create-new and update-existing disabled flags");
assert.match(powerPlaceBaseSource, /disabled=\{updateExistingDisabled\}[\s\S]*title=\{updateExistingDisabled[\s\S]*aria-label=\{updateExistingDisabled/, "Update button should show an explanatory title and aria-label when disabled");
assert.match(powerPlaceBaseSource, /disabled=\{createNewDisabled\}[\s\S]*title=\{createNewDisabled[\s\S]*aria-label=\{createNewDisabled/, "Create-new button should show an explanatory title and aria-label when at limit");
assert.doesNotMatch(powerPlaceBaseSource, /handleSaveCompositionClick/, "handleSaveCompositionClick must be removed — two explicit buttons replace it");
assert.match(profileLitePageSource, /const handlePrintComposition[\s\S]*openPowerPlacePdfPrintView/, "handlePrintComposition must use the clean print window, not direct window.print");
assert.doesNotMatch(profileLitePageSource, /handlePrintComposition[\s\S]*body\.classList\.add\("printMandalaOnly"\)/, "handlePrintComposition must not apply printMandalaOnly to the main body");
assert.doesNotMatch(powerPlaceBaseSource, /const createNewDisabled\s*=.*!compositionDraft\.id/, "createNewDisabled definition must not depend on compositionDraft.id — only on the plan limit");
assert.match(profileLitePageSource, /function injectPrintablePhotoImages\(sourceArea, clonedArea\)/, "print/PDF should convert CSS background photo layers into real img nodes for Safari/iOS print");
assert.match(profileLitePageSource, /isPrintablePhotoLayer[\s\S]*powerCenterPhoto\.hasImage[\s\S]*zodiacPositionImage\[style\][\s\S]*has-custom-inner-cover[\s\S]*has-custom-outer-cover/, "print/PDF image injection should include center, mini slot, inner cover, and outer cover photo layers");
assert.match(profileLitePageSource, /clonedNode\.style\.backgroundImage = "none"/, "print/PDF image injection should disable the cloned photo background after inserting a real img to avoid print artifacts");
assert.match(powerPlaceBaseSource, /powerPlaceUpdateButton/, "Update button must carry powerPlaceUpdateButton class for scoped targeting");
assert.match(powerPlaceBaseSource, /powerPlaceCreateButton/, "Create-new button must carry powerPlaceCreateButton class for scoped targeting");
assert.match(powerPlaceSource, /\{savedCompositionCount\}\/\{savedCompositionLimit\} сохранённых мест силы/, "Power Place UI should show count text like 7/7 сохранённых мест силы");
for (const servicesManagerText of [
  "Черновики",
  "Опубликованные",
  "Архив",
  "Клиенты",
  "Клиенты и материалы",
  "Клиентов пока нет",
  "Клиенты появятся, когда вы сохраните мандалу через \"Сохранить для клиента\" или когда клиент оформит заказ.",
  "В этом разделе пока нет материалов клиента.",
  "Открыть мандалу",
  "Превью мандалы пока не создано",
  "Превью недоступно",
  "Сохранено для клиента",
  "Готово к отправке",
  "Отправлено клиенту",
  "Ошибка сохранения/отправки",
  "Ссылка скопирована",
  "Ссылка появится после отправки мандалы клиенту.",
  "Опубликовать",
  "Вернуть в черновик",
  "Архивировать",
  "С подписью мастера",
  "Без подписи мастера",
  "Две версии",
  "Ссылка появится после публикации",
  "Публичная ссылка для клиентов",
  "Скопировать ссылку",
  "Услуга в архиве. Публичная ссылка отключена."
]) {
  assert.match(profileServicesManagerSource, new RegExp(servicesManagerText.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")), `/profile/services should include ${servicesManagerText}`);
}
assert.match(profileServicesModuleSource, /clientDirectory = \[\]/, "services manager should accept clientDirectory");
assert.match(profileServicesModuleSource, /selectedClientKey = ""/, "services manager should accept selected client key");
assert.match(profileServicesModuleSource, /onClientSelect = \(\) => \{\}/, "services manager should accept client selection callback");
assert.match(profileServicesModuleSource, /profileLiteClientSelectorButton/, "services client selector should render a custom selected-client button");
assert.match(profileServicesModuleSource, /profileLiteClientOption/, "services client selector should render inline client options");
assert.match(profileServicesModuleSource, /Все клиенты/, "clients selector should include an all-clients option above saved materials");
assert.match(profileServicesModuleSource, /\+ Новый/, "clients selector should expose a compact add-new-client action");
assert.match(profileServicesModuleSource, /profileLiteClientInviteDrawer/, "client link creation should open as a compact inline drawer");
assert.match(profileServicesModuleSource, /client_display_name/, "services client selector should use safe display names");
assert.doesNotMatch(profileServicesModuleSource, /profile_cabinet_services|\/services\/:serviceId/, "services manager should not show table names or unfinished route debug text in the normal UI");
assert.doesNotMatch(profileServicesModuleSource, /composition_id:|delivery modes MVP|formats persistence|raw success|needs verification/, "services manager normal UI must not expose implementation/debug labels");
assert.match(profileServicesModuleSource, /Клиентов пока нет[\s\S]*Сохранить для клиента/, "services manager should show a useful no-clients empty state instead of an empty selector-first UI");
assert.match(profileServicesModuleSource, /activeView = "services"/, "services/clients module should accept an explicit active view");
assert.match(profileServicesModuleSource, /isClientsView \? "Клиентская база" : "Услуги и шаблоны"/, "Услуги and Клиенты should render distinct compact hero headings");
assert.doesNotMatch(profileServicesModuleSource, /Список клиентов, фильтр, сохранённые мандалы, заказы и статусы\./, "Клиенты mobile UI should not duplicate explanatory copy above the registry");
assert.match(profileServicesModuleSource, /Черновики, публикации и действия по услугам\./, "Услуги should use a short helper line instead of a heavy desktop paragraph");
assert.match(profileServicesModuleSource, /isClientsView \? renderClientWorkspace\(\) : renderServiceGroups\(\)/, "Клиенты should show client materials while Услуги should show service groups");
assert.match(profileMandalaCss, /\.profileLiteServices\.profileLiteClientsView \.mandalaHeroStats[\s\S]*display: none/, "mobile clients view should collapse large hero stats tiles");
assert.match(profileMandalaCss, /\.profileLiteServices\.profileLiteClientsView \.profileLiteClientSummaryGrid[\s\S]*display: block/, "mobile clients summary should collapse to one compact line");
assert.match(profileMandalaCss, /\.profileLiteServices\.profileLiteClientsView \.profileLiteClientMandalaCard[\s\S]*grid-template-columns: 72px minmax\(0, 1fr\)/, "mobile saved client materials should stay horizontal with a 72px thumbnail");
assert.match(profileLitePageSource, /clients:\s*\([\s\S]*<ProfileLiteServicesModule[\s\S]*activeView="clients"/, "Profile Lite should render a dedicated clients tab module");
assert.match(profileLitePageSource, /services:\s*\([\s\S]*<ProfileLiteServicesModule[\s\S]*activeView="services"/, "Profile Lite should render a dedicated services tab module");
assert.match(profileLiteShellSource, /onTabNavigate\(\{ id: item\.tabId, href, role: item\.role \}\)/, "Profile Lite shell should pass master-only role metadata through tab navigation");
assert.match(profileServicesModuleSource, /profileLiteEditorToggle[\s\S]*Создать услугу/, "services manager should hide the editor behind a create/edit action on compact screens");
assert.match(profileServicesModuleSource, /serviceUiStatusText/, "services manager should map raw service load/action statuses to RU UI labels");
assert.match(profileServicesModuleSource, /function ServiceThumbnail[\s\S]*service\?\.display_url \|\| service\?\.image_url[\s\S]*profileLiteServiceThumb[\s\S]*Фото услуги/, "service cards should render an existing service image as a left thumbnail");
assert.match(profileServicesModuleSource, /profileLiteServiceThumb[\s\S]*<span>◇<\/span>/, "service cards should render a designed placeholder thumbnail when no image exists");
assert.match(profileServicesModuleSource, /handleServiceStatusAction[\s\S]*onStatusChange\(status, service\)/, "service card publish/hide actions should pass the clicked service without relying on stale selected form state");
assert.match(profileServicesModuleSource, /Редактировать[\s\S]*Спрятать[\s\S]*Опубликовать/, "service cards should expose edit, hide, and publish actions");
assert.match(profileServicesModuleSource, /navigator\.clipboard\?\.writeText\(url\)/, "sent mandala copy button should use Clipboard API");
assert.match(profileServicesModuleSource, /window\.prompt\("Ссылка на мандалу", url\)/, "sent mandala copy should fall back to prompt");
assert.doesNotMatch(profileServicesModuleSource, /Внутренняя ссылка на мандалу/, "services manager should not expose internal mandala-link labels in normal cards");
assert.doesNotMatch(profileServicesModuleSource, />К<\/div>/, "saved client mandala cards must not use a hardcoded K as a fake preview");
assert.doesNotMatch(profileServicesModuleSource, /orderStatusText\(order\.status\)\.slice\(0,\s*1\)/, "client order cards must not use a status-letter thumbnail as a fake mandala preview");
assert.match(profileServicesModuleSource, /getClientMandalaPreviewState/, "client mandala cards should resolve real preview state before rendering");
assert.match(profileServicesModuleSource, /profileLiteMandalaPreview/, "client mandala cards should render a dedicated preview or clear empty state");
assert.match(profileLitePageSource, /buildClientDirectoryFromOrders\(orders,\s*clientGoalPhotos,\s*powerPlaceCompositions,\s*clientInvites\)/, "ProfileLitePage should derive the Services client database from master orders, saved client work, and invites");
assert.match(profileLitePageSource, /listOwnClientInvites\(profile\.id,\s*session\)/, "ProfileLitePage should load master client invites into the client database");
assert.match(profileLitePageSource, /claimClientInvite\(token,\s*session\)/, "ProfileLitePage should claim invite links only after authenticated login");
assert.match(profileLitePageSource, /selectedClientKey/, "ProfileLitePage should own selected client state");
assert.match(powerPlaceBaseSource, /Сохранить как шаблон/, "Power Place save UI should preserve create-new behavior under the template label");
assert.match(powerPlaceBaseSource, /Сохранить для клиента/, "Power Place save UI should expose client save intent");
assert.match(powerPlaceBaseSource, /onOpenClientSave/, "Power Place save UI should open the client save modal");
assert.match(powerPlaceBaseSource, /cabinetRole = "client"/, "Power Place should default to the client role when role context is absent");
assert.match(powerPlaceBaseSource, /const isMasterWorkflow = cabinetRole === "master"/, "Power Place client-save UI should be explicitly gated to master workflow");
assert.match(powerPlaceBaseSource, /\{isMasterWorkflow && \([\s\S]*powerPlaceClientSaveButton/, "Power Place should render the client-save button only in master workflow");
assert.match(powerPlaceBaseSource, /\{isMasterWorkflow && clientSaveForm\.isOpen && \(/, "Power Place should render the client-save form only in master workflow");
assert.match(powerPlaceBaseSource, /className="profileLiteClientSaveField"[\s\S]*Клиент[\s\S]*className="profileLiteClientSaveField"[\s\S]*Имя клиента[\s\S]*className="profileLiteClientSaveField"[\s\S]*Комментарий \/ запрос клиента[\s\S]*className="profileLiteClientSaveField"[\s\S]*Фото клиента \/ цель/, "client save fields should expose scoped field wrappers for stable mobile layout");
assert.match(profileLitePageSource, /handleSaveCompositionForClient/, "ProfileLitePage should save a client-specific composition");
assert.match(profileLitePageSource, /__client_work/, "client save should persist client metadata in saved composition object_refs");
assert.match(profileLitePageSource, /masterPowerPlaceCompositions[\s\S]*filterMasterPowerPlaceCompositions\(powerPlaceCompositions\)/, "ProfileLitePage should derive master-only saved mandalas from all compositions");
assert.match(profileLitePageSource, /powerPlaceCompositions:\s*masterPowerPlaceCompositions/, "ProfileLitePage should pass only master/global mandalas into the mandala selector and saved list");
assert.match(profileServicesModuleSource, /onServiceSelect[\s\S]*serviceForm[\s\S]*selectedServiceId/, "services manager should support selecting a service and editing it in the form");
assert.match(profileLitePageSource, /handleServiceStatusChange = async \(status, serviceOverride = null\)[\s\S]*const targetService = serviceOverride\?\.id \? createEmptyServiceForm\(serviceOverride\) : serviceForm[\s\S]*updateOwnService\(targetService\.id/, "service status changes should preserve create/edit/publish handlers and support card-level actions");
assert.match(profileMandalaCss, /\.profileLitePowerPlace \.profileLiteClientSaveForm \{[\s\S]*grid-template-columns: minmax\(0, 1fr\);[\s\S]*\.profileLitePowerPlace \.profileLiteClientSaveField \{[\s\S]*display: grid;[\s\S]*grid-template-columns: minmax\(0, 1fr\);[\s\S]*\.profileLitePowerPlace \.profileLiteClientSaveForm input,[\s\S]*\.profileLitePowerPlace \.profileLiteClientSaveForm select,[\s\S]*\.profileLitePowerPlace \.profileLiteClientSaveForm textarea \{[\s\S]*box-sizing: border-box;[\s\S]*width: 100%;/, "client save form should have a base one-column field layout, not only a mobile media override");
assert.match(profileMandalaCss, /@media \(max-width: 760px\)[\s\S]*\.profileLitePowerPlace \.profileLiteClientSaveForm \{[\s\S]*display: grid;[\s\S]*\.profileLitePowerPlace \.profileLiteClientSaveForm label \{[\s\S]*display: grid;[\s\S]*\.profileLitePowerPlace \.profileLiteClientSaveForm \.cabinetActions \{[\s\S]*grid-template-columns: minmax\(0, 1fr\);/, "client save form should stack labels, inputs, and actions as one mobile card");
assert.match(profileMandalaCss, /\.profileLiteServices \.profileLiteClientMandalaCard \{[\s\S]*grid-template-columns: minmax\(0, 1fr\);/, "mobile saved client material cards should stack preview and text to avoid overlap");
assert.match(profileMandalaCss, /\.profileLiteServices \.profileLiteServiceCard \{[\s\S]*grid-template-columns: 88px minmax\(0, 1fr\);/, "service cards should use a left media thumbnail in the base layout");
assert.match(profileMandalaCss, /@media \(max-width: 760px\)[\s\S]*\.profileLiteServicesView \.mandalaHeroSeal \{[\s\S]*display: none;[\s\S]*\.profileLiteServicesView \.mandalaHero h2 \{[\s\S]*font-size: clamp\(1\.32rem, 6vw, 1\.72rem\);/, "mobile Services hero should be compact and remove squeezed ornamental seal");
assert.match(profileMandalaCss, /@media \(max-width: 760px\)[\s\S]*\.profileLiteServices \.profileLiteServicesColumns \{[\s\S]*grid-template-columns: minmax\(0, 1fr\);[\s\S]*\.profileLiteServices \.profileLiteServiceGroup \{[\s\S]*width: 100%;/, "mobile Services layout should override the desktop split so groups and cards can use full width");
assert.match(profileMandalaCss, /\.profileLiteServices\.profileLiteServicesView \.profileLiteServicesColumns \{[\s\S]*grid-template-columns: minmax\(0, 1fr\);/, "mobile Services layout should include a final high-order full-width override for the actual combined module class");
assert.match(profileMandalaCss, /@media \(max-width: 760px\)[\s\S]*\.profileLiteServices \.profileLiteServiceCard \{[\s\S]*grid-template-columns: 82px minmax\(0, 1fr\);/, "mobile service cards should keep a 72-88px left thumbnail and full-width text area");
assert.match(profileMandalaCss, /\.profileLiteServices \.profileLiteServiceThumb \{[\s\S]*width: 88px;[\s\S]*\.profileLiteServices \.profileLiteServiceThumb img \{[\s\S]*object-fit: cover;/, "service thumbnail CSS should size real images and placeholders consistently");
assert.match(profileMandalaCss, /\.profileLiteServices \.mandalaHeroStats \{[\s\S]*grid-template-columns: repeat\(auto-fit, minmax\(128px, 1fr\)\);/, "services/client stats chips should wrap without clipping on mobile");
assert.match(profileMandalaCss, /@media \(max-width: 760px\)[\s\S]*\.profileLiteServices \.profileLiteServiceEditorForm \{[\s\S]*display: grid;[\s\S]*\.profileLiteServices \.profileLiteServiceEditorForm \.cabinetTwoColumns \{[\s\S]*grid-template-columns: minmax\(0, 1fr\);[\s\S]*\.profileLiteServices \.profileLiteServiceEditorForm \.cabinetActions \{[\s\S]*grid-template-columns: minmax\(0, 1fr\);/, "services editor should stack fields and action buttons vertically on mobile");
assert.match(profileServicesModuleSource, /className="cabinetCard profileLiteServiceEditorForm"/, "services editor form should expose a scoped class for mobile stacking");
assert.match(profileLitePageSource, /restoreFreshPendingServiceCart/, "Profile Lite should restore a fresh pending cart after auth");
assert.match(profileLitePageSource, /createServiceOrderDraft/, "checkout should create an order draft after auth, not a public new order");
assert.match(profileLitePageSource, /submitServiceOrderToMaster/, "order flow should require explicit submit to master");
assert.match(profileLitePageSource, /listClientServiceOrders\(profile\.id/, "client cabinet should load own client orders");
assert.match(profileLitePageSource, /listOwnServiceOrders\(profile\.id/, "master cabinet should load incoming orders for own services");
assert.match(profileLitePageSource, /cabinetRole,/, "ProfileLitePage should pass the existing cabinetRole into module props");
assert.match(profileLitePageSource, /authGateCabinetLabel = getProfileLiteRoleById\(cabinetRole\)\.label/, "logged-out Profile Lite shell should use the selected role label");
assert.doesNotMatch(profileLitePageSource, /<h1>Кабинет мастера Lite<\/h1>/, "logged-out Profile Lite shell must not hardcode the master cabinet title");
assert.doesNotMatch(profileLitePageSource, /<ProfileLiteDiagnosticsModule diagnostics=\{diagnostics\} moduleStates=\{moduleStates\} \/>[\s\S]*<\/main>[\s\S]*<\/div>[\s\S]*\);\n  \}/, "logged-out Profile Lite shell must not render the diagnostics block");
assert.match(profileOrdersModuleSource, /Кабинет Личный/, "orders module should expose personal cabinet mode");
assert.match(profileOrdersModuleSource, /function ClientOrdersView/, "orders module should split the personal cabinet branch");
assert.match(profileOrdersModuleSource, /function MasterOrdersView/, "orders module should split the master cabinet branch");
assert.match(profileOrdersModuleSource, /Мои заказы/, "orders module should expose client orders");
assert.match(profileOrdersModuleSource, /Фото для заказа/, "orders module should keep only order-specific client photo selection");
assert.match(profileOrdersModuleSource, /Кабинет Мастера/, "orders module should expose master cabinet mode");
assert.match(profileOrdersModuleSource, /Заявки/, "orders module should expose master requests");
assert.match(profileOrdersModuleSource, /Заявок пока нет[\s\S]*Здесь будут заявки клиентов\./, "master requests should have the required empty state copy");
assert.doesNotMatch(profileOrdersModuleSource, /Мои фото/, "orders module must not expose the standalone media/photo tab content");
assert.doesNotMatch(profileOrdersModuleSource, /\["Мои Заказы", "Мои Фото", "Кабинет Мастера", "Заявки"\]/, "orders module must not render a hardcoded mixed inner sidebar");
assert.doesNotMatch(profileOrdersModuleSource, /Источник данных/, "orders module must not expose source table debug text");
assert.doesNotMatch(profileOrdersModuleSource, /needs verification/, "orders module must not expose raw needs verification text");
assert.match(profileOrdersModuleSource, /Не удалось загрузить личные заказы\. Попробуйте обновить страницу\./, "client orders errors should be non-technical");
assert.match(profileOrdersModuleSource, /Не удалось загрузить заявки мастера\. Попробуйте обновить страницу\./, "master orders errors should be non-technical");
assert.match(profileOrdersModuleSource, /ещё \{extraPhotoCount\} в медиатеке/, "orders module should summarize extra media photos instead of listing every filename");
assert.match(profileOrdersModuleSource, /Загрузите своё фото, чтобы отправить заказ в работу Мастеру\./, "orders module should block submit without a client photo");
assert.match(profileOrdersModuleSource, /Отправить заказ мастеру/, "orders module should require explicit submit button");
assert.doesNotMatch(profileOrdersModuleSource, /onSubmit=\{\(event\) => \{ event\.preventDefault\(\); onOrderUpdate\(\); \}\}/, "orders module should not silently submit via generic form update");
assert.doesNotMatch(clientOrdersViewSource, /Кабинет Мастера|Заявки мастера|Создать мандалу заказа|Комментарий мастера|Отправить клиенту/, "client orders branch must not render master cabinet controls");
assert.doesNotMatch(masterOrdersViewSource, /Мои фото|Отправить заказ мастеру|Название фото|Загрузить фото/, "master orders branch must not render personal photo upload or client submit controls");
for (const phase5OrderText of [
  "Создать мандалу заказа",
  "Открыть мандалу заказа",
  "Комментарий мастера",
  "Отправить клиенту",
  "Сначала создайте или выберите результат мандалы заказа.",
  "Результат отправлен",
  "Открыть результат",
  "Скачать результат"
]) {
  assert.match(profileOrdersModuleSource, new RegExp(phase5OrderText.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")), `Phase 5 orders module should include ${phase5OrderText}`);
}
assert.match(profileLitePageSource, /generateDraftResultComposition/, "Profile Lite page should call Phase 5 draft generation helper");
assert.match(profileLitePageSource, /sendOrderResultToClient/, "Profile Lite page should call Phase 5 send result helper");
assert.doesNotMatch(clientOrdersViewSource, /draft_result_composition_id/, "client UI must not expose draft_result_composition_id before sent");
assert.match(profileServicesModuleSource, /Ссылка для клиента/, "/profile/services client database should include invite-link UI");

// --- Course audio access / invite claim (#480) ---
assert.match(profileLitePageSource, /parseCourseIntentFromLocation/, "Profile Lite should parse /profile?tab=courses course deep links");
assert.match(profileLitePageSource, /findCourseBySlug\(rows,\s*courseIntent\.course\)/, "Courses tab should select requested course slug from deep link");
assert.match(profileLitePageSource, /findStepBySlug\(rows,\s*courseIntent\.step\)/, "Courses tab should select requested step slug from deep link");
assert.match(profileLitePageSource, /resolveLessonAudioDisplayUrl\(lesson,\s*session\)/, "Accessible course lessons should resolve private audio to signed URLs");
assert.match(profileLitePageSource, /claimCourseInvite\(token,\s*session\)/, "Profile Lite should claim course invites after login");
assert.match(profileLitePageSource, /cleanupCourseClaimFromUrl\(\)/, "Profile Lite should remove claim token from the URL after processing");
assert.match(profileCoursesModuleSource, /<audio controls preload="metadata" src=\{audioUrl\}>/, "Course lessons with audio should render an audio player");
assert.match(profileCoursesModuleSource, /Аудио пока не добавлено/, "Course lessons without audio should show a RU empty audio state");
assert.doesNotMatch(profileCoursesModuleSource, /claim=/, "Course module must not render raw claim tokens");
assert.match(profileServicesModuleSource, /Клиент привязывается после входа по invite-ссылке\./, "/profile/services should explain invite-only client linking compactly");
assert.match(profileServicesModuleSource, /buildClientInviteUrl/, "/profile/services should build invite URLs through the client helper");
assert.match(profileLitePageSource, /updateOwnService\(serviceForm\.id/, "saving an existing selected service should PATCH the existing service");
assert.match(profileLitePageSource, /handleServiceStatusChange[\s\S]*published[\s\S]*draft[\s\S]*archived/, "services manager should expose safe publish/draft/archive status actions");
assert.match(powerPlaceSource, /!reportEnabled \? null :|reportEnabled && \(/, "Без отчёта should hide the lower report body fields and actions");
assert.match(powerPlaceBaseSource, /renderFieldLayoutSelector\(\)[\s\S]*<div className="coverSelector coverPickerPanel"[\s\S]*renderReportModule\(\)/, "right column should render layout controls above background and report below background");
assert.match(powerPlaceSource, /"dao-layout": "ДАО-Макет"/, "Profile Lite Power Place UI should expose ДАО-Макет as a dedicated format label");
assert.doesNotMatch(powerPlaceBaseSource, /\{ value: DAO_LAYOUT_TEMPLATE_STYLE_ID, label: "ДАО: Макет" \}/, "ДАО-Макет must not remain registered as a normal DAO style");
assert.doesNotMatch(powerPlaceSource, /className="resourceComparisonPanel"/, "resource comparison mini-block should not be visible in the React report/settings UI");
assert.doesNotMatch(powerPlaceSource, /<span className="cabinetStatus">\{mediaStatus\}<\/span>/, "Power Place header should not show raw media status text");
assert.match(powerPlaceSource, /has-custom-inner-cover/, "inner custom covers should be rendered through React-owned classes");
assert.match(powerPlaceSource, /has-custom-outer-cover/, "outer custom covers should be rendered through React-owned classes");
assert.doesNotMatch(powerPlaceBaseSource, /workspaceTab === "services"/, "Power Place workshop should not expose an internal services tab");
assert.doesNotMatch(powerPlaceBaseSource, /renderServicesTab/, "Power Place workshop should not render a duplicate internal services panel");
assert.match(powerPlaceSource, /serviceByCompositionId\.get\(String\(composition\.id\)\)/, "saved mandala cards should detect services linked by composition_id");
assert.match(powerPlaceSource, /profileLiteCompositionCard profileLiteCompositionCard--horizontal/, "saved mandala cards should use horizontal card class");
assert.match(powerPlaceSource, /profileLiteCompositionPreview/, "saved mandala and service cards should render a preview or placeholder");
assert.match(profileServicesClientSource, /findOwnServiceByComposition\(profileId, compositionId, session\)/, "Add to services handler should guard duplicate composition services through the shared client");
assert.match(profileLitePageSource, /upsertOwnServiceForComposition\(\{[\s\S]*status: existing\?\.status \|\| "draft"/, "Transfer to services should create or reuse a draft service through the shared upsert client");
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
assert.match(profileLitePageSource, /buildMaterialUploadPublicationPayload\(\{[\s\S]*material,[\s\S]*status:\s*"draft"/, "image picker material uploads should build DB-safe draft material publications");
assert.match(profileMaterialsClientSource, /material_group:\s*cleanText\(material\?\.material_group \?\? material\?\.group\)/, "image picker material upload should persist the selected material group");
assert.match(profileMaterialsClientSource, /category\s*=\s*cleanText\(material\?\.category\)/, "image picker material upload should persist the selected step/category");
assert.match(profileMaterialsClientSource, /subcategory\s*=\s*cleanText\(material\?\.subcategory\)/, "image picker material upload should persist the selected material subcategory");
assert.match(powerPlaceBaseSource, /materialGroup:\s*item\.material_group \|\| item\.group/, "saved material images should preserve material group metadata for picker filters");
assert.match(powerPlaceBaseSource, /materialType:\s*item\.material_type \|\| item\.type/, "saved material images should preserve material type metadata for picker filters");
assert.match(powerPlaceBaseSource, /settingTitle:\s*item\.setting_title \|\| item\.settingTitle/, "saved material images should preserve setting/subcategory metadata for picker filters");
assert.match(imagePickerSource, /materialFilterGroup[\s\S]*materialFilterCategory[\s\S]*materialFilterSubcategory/, "saved Materials picker should use group/category/subcategory material filters");
assert.doesNotMatch(imagePickerSource, /materialFilterType/, "saved Materials picker should not require material type filters");
assert.match(imagePickerSource, /materialImageMatchesSelection/, "saved Materials picker should use shared normalized metadata matching");
assert.doesNotMatch(profileLitePageSource, /создание image material без миграции пока не подтверждено/, "material image upload should no longer be blocked by the old placeholder error");
assert.doesNotMatch(powerPlaceSource, /MutationObserver/, "Profile Lite React module must not introduce MutationObserver");
assert.doesNotMatch(profileLitePageSource, /MutationObserver/, "Profile Lite page must not introduce MutationObserver");
assert.doesNotMatch(powerPlaceBaseSource, /startImageReposition|clampImageOffset|__inner_cover_offset_x|__outer_cover_offset_x|imageOffsetStyle/, "base module must not reintroduce legacy cover pointer repositioning or inner/outer cover offset persistence");
assert.doesNotMatch(powerPlaceSource, /startImageReposition|clampImageOffset|imageOffsetStyle/, "module wrapper must not reintroduce legacy cover pointer repositioning");
assert.doesNotMatch(layoutFinalFix, /tuneInnerCoverArrows|nudgeInnerCover|coverOffsetCornerGroup|↖|↗|↙|↘/, "public Profile Lite layout fix should not inject legacy diagonal inner-cover arrows");

// Part A: old arrow overlay must be removed
assert.doesNotMatch(powerPlaceSource, /coverOffsetCornerGroup/, "old coverOffsetCornerGroup arrow overlay must be removed from module");
assert.doesNotMatch(powerPlaceSource, /tuneInnerCoverArrows|nudgeInnerCover/, "old arrow overlay helpers must be absent");

// Part A: in-mandala cover drop targets must still exist
assert.match(powerPlaceBaseSource, /powerMandalaCoverDropTargets/, "in-mandala cover drop targets wrapper must exist");
assert.match(powerPlaceBaseSource, /powerMandalaCoverDropTarget/, "in-mandala cover drop target buttons must exist");
assert.match(powerPlaceBaseSource, /◎ Внутрь/, "in-mandala inner cover drop target must have ◎ Внутрь label");
assert.match(powerPlaceBaseSource, /▣ Снаружи/, "in-mandala outer cover drop target must have ▣ Снаружи label");
assert.match(powerPlaceBaseSource, /getPowerPlaceSlotDropHandlers\("cover_ref\.inner"\)/, "in-mandala inner target must use getPowerPlaceSlotDropHandlers(cover_ref.inner)");
assert.match(powerPlaceBaseSource, /getPowerPlaceSlotDropHandlers\("cover_ref\.outer"\)/, "in-mandala outer target must use getPowerPlaceSlotDropHandlers(cover_ref.outer)");
assert.match(profileMandalaCss, /\.profileLitePowerPlace \.powerMandalaCoverDropTargets/, "CSS must define .powerMandalaCoverDropTargets");
assert.match(profileMandalaCss, /\.profileLitePowerPlace \.powerMandalaCoverDropTarget/, "CSS must define .powerMandalaCoverDropTarget");
assert.match(profileMandalaCss, /\.profileLitePowerPlace \.powerMandalaCoverDropTarget\.power-place-slot--drag-over/, "CSS must define drag-over highlight for in-mandala cover targets");
// Right-panel tabs must still be drop targets
assert.match(powerPlaceSource, /getPowerPlaceSlotDropHandlers\("cover_ref\.inner"\)[\s\S]*getPowerPlaceSlotDropHandlers\("cover_ref\.outer"\)|getPowerPlaceSlotDropHandlers\("cover_ref\.outer"\)[\s\S]*getPowerPlaceSlotDropHandlers\("cover_ref\.inner"\)/, "right-panel cover layer tabs must still use getPowerPlaceSlotDropHandlers for both layers");

// Part B: central photo pan/zoom must exist in base module
assert.match(powerPlaceBaseSource, /__center_image_offset_x/, "central pan/zoom: __center_image_offset_x must be persisted");
assert.match(powerPlaceBaseSource, /__center_image_offset_y/, "central pan/zoom: __center_image_offset_y must be persisted");
assert.match(powerPlaceBaseSource, /__center_image_zoom/, "central pan/zoom: __center_image_zoom must be persisted");
assert.match(powerPlaceBaseSource, /clampCenterImageOffset/, "central pan/zoom: clampCenterImageOffset helper must exist");
assert.match(powerPlaceBaseSource, /clampCenterImageZoom/, "central pan/zoom: clampCenterImageZoom helper must exist");
assert.match(powerPlaceBaseSource, /suppressCenterPickerClickRef/, "central pan/zoom: suppressCenterPickerClickRef must exist");
assert.match(powerPlaceBaseSource, /onPointerDown[\s\S]*handleCenterPointerDown|handleCenterPointerDown[\s\S]*onPointerDown/, "central pan/zoom: onPointerDown must be wired to center photo handler");
assert.match(powerPlaceBaseSource, /onPointerMove[\s\S]*handleCenterPointerMove|handleCenterPointerMove[\s\S]*onPointerMove/, "central pan/zoom: onPointerMove must be wired to center photo handler");
assert.match(powerPlaceBaseSource, /onPointerUp[\s\S]*handleCenterPointerUp|handleCenterPointerUp[\s\S]*onPointerUp/, "central pan/zoom: onPointerUp must be wired to center photo handler");

// Part B: cover slots must NOT have pointer pan/zoom handlers
assert.doesNotMatch(powerPlaceBaseSource, /onPointerDown[\s\S]{0,200}cover_ref\.inner|cover_ref\.inner[\s\S]{0,200}onPointerDown/, "pointer handlers must not be applied to inner cover slots");
assert.doesNotMatch(powerPlaceBaseSource, /onPointerDown[\s\S]{0,200}cover_ref\.outer|cover_ref\.outer[\s\S]{0,200}onPointerDown/, "pointer handlers must not be applied to outer cover slots");
assert.doesNotMatch(powerPlaceBaseSource, /__inner_cover_offset_x|__outer_cover_offset_x/, "cover pan/zoom persistence keys must be absent from base module");

// Part B: CSS must define grab cursor for center photo
assert.match(profileMandalaCss, /\.profileLitePowerPlace \.powerCenterPhoto\.hasImage[\s\S]*cursor:\s*grab/, "CSS must define grab cursor for center photo with image");

// Part C: slot image pan/zoom must exist
assert.match(powerPlaceBaseSource, /clampSlotImageOffset/, "slot pan/zoom: clampSlotImageOffset helper must exist");
assert.match(powerPlaceBaseSource, /clampSlotImageZoom/, "slot pan/zoom: clampSlotImageZoom helper must exist");
assert.match(powerPlaceBaseSource, /slotImageTransformFor/, "slot pan/zoom: slotImageTransformFor helper must exist");
assert.match(powerPlaceBaseSource, /slotImageStyle/, "slot pan/zoom: slotImageStyle helper must exist");
assert.match(powerPlaceBaseSource, /writeSlotImageTransform/, "slot pan/zoom: writeSlotImageTransform helper must exist");
assert.match(powerPlaceBaseSource, /getSlotImagePanZoomHandlers/, "slot pan/zoom: getSlotImagePanZoomHandlers must exist");
assert.match(powerPlaceBaseSource, /__slot_transforms/, "slot pan/zoom: __slot_transforms key must exist in base module");
assert.match(powerPlaceBaseSource, /suppressSlotPickerClickRef/, "slot pan/zoom: suppressSlotPickerClickRef must exist for click suppression");
assert.match(powerPlaceBaseSource, /slotDragRef/, "slot pan/zoom: slotDragRef must exist");
assert.match(powerPlaceBaseSource, /slotPinchRef/, "slot pan/zoom: slotPinchRef must exist for pinch tracking");
assert.match(powerPlaceBaseSource, /Math\.hypot/, "slot pan/zoom: pinch distance must use Math.hypot");
assert.match(powerPlaceBaseSource, /slotImagePanZoomTarget/, "slot pan/zoom: slotImagePanZoomTarget class must be applied to slot buttons");
assert.match(profileMandalaCss, /\.profileLitePowerPlace \.slotImagePanZoomTarget\.hasImage[\s\S]*cursor:\s*grab/, "CSS must define grab cursor for slot images");
assert.match(profileMandalaCss, /\.profileLitePowerPlace \.slotImagePanZoomTarget\.hasImage::before[\s\S]*background-image:\s*var\(--slot-bg-image, none\)/, "slot image CSS must render the selected photo from --slot-bg-image");
assert.match(profileMandalaCss, /\.powerPlacePdfOnlyArea \.slotImagePanZoomTarget\.hasImage::before[\s\S]*background-image:\s*var\(--slot-bg-image, none\)/, "PDF/export slot image CSS must render the selected photo from --slot-bg-image");

// Part C: slot renderers must use slotImageStyle and attach pan/zoom handlers only when image exists
assert.match(powerPlaceBaseSource, /slotImageStyle\(slot\.id/, "renderObjectImageButton must use slotImageStyle");
assert.match(powerPlaceBaseSource, /getSlotImagePanZoomHandlers\(slot\.id/, "renderObjectImageButton must attach slot pan/zoom handlers");
assert.match(powerPlaceBaseSource, /getSlotImagePanZoomHandlers\(slotId/, "inline DAO/zodiac/star renderers must attach slot pan/zoom handlers");
assert.match(
  powerPlaceBaseSource,
  /className=\{`\$\{className\} slotImagePanZoomTarget\$\{src \? " hasImage" : ""\}/,
  "shared slot renderer must apply hasImage to the same slotImagePanZoomTarget element that receives slotImageStyle"
);
for (const slotImageClass of [
  "zodiacInnerPositionImage",
  "zodiacPositionImage",
  "zodiacFieldPlusPositionImage",
  "starPositionImage",
  "starAdditionalPositionImage",
  "daoElementImage"
]) {
  assert.match(
    powerPlaceBaseSource,
    new RegExp(`${slotImageClass}[^\\n]*slotImagePanZoomTarget[^\\n]*\\$\\{src \\? " hasImage" : ""\\}`),
    `${slotImageClass} button must apply hasImage to the same slotImagePanZoomTarget element that receives slotImageStyle`
  );
}

// Part C: cover pan/zoom must NOT have been introduced
assert.doesNotMatch(powerPlaceBaseSource, /__inner_cover_offset_x|__outer_cover_offset_x/, "cover pan/zoom persistence keys must remain absent");
assert.doesNotMatch(powerPlaceBaseSource, /onPointerDown[\s\S]{0,200}cover_ref\.inner|cover_ref\.inner[\s\S]{0,200}onPointerDown/, "pointer handlers must not be applied to inner cover slots");
assert.doesNotMatch(powerPlaceBaseSource, /onPointerDown[\s\S]{0,200}cover_ref\.outer|cover_ref\.outer[\s\S]{0,200}onPointerDown/, "pointer handlers must not be applied to outer cover slots");

// Part C: powerPlaceClient must preserve __slot_transforms
assert.match(powerPlaceClientSource, /SLOT_TRANSFORMS_REF_KEY|__slot_transforms/, "powerPlaceClient must handle __slot_transforms");
assert.match(powerPlaceClientSource, /normalizeSlotTransforms/, "powerPlaceClient must normalize slot transforms");

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
assert.match(mobileOrderCss, /coverPickerPanel\{order:[23]/, "mobile order CSS should place Power Place background near the top on mobile");

assert.match(layoutFinalFix, /preferClientCabinetRoute/, "layout fix should prefer the client cabinet on bare profile route");
assert.match(layoutFinalFix, /window\.history\.replaceState\(\{\}, "", "\/profile\/orders"\)/, "bare profile route should redirect to client orders instead of the master workshop");
assert.doesNotMatch(layoutFinalFix, /replaceState\(\{\}, "", "\/profile\/mandalas"\)/, "bare profile route must not redirect ordinary clients to the master workshop");
assert.match(layoutFinalFix, /window\.location\.search \|\| window\.location\.hash/, "client default redirect should leave callback/query URLs untouched");
assert.match(layoutFinalFix, /Отчёт и анализ/, "layout fix should merge report and analysis labels");
assert.match(layoutFinalFix, /mergedResourceComparison/, "layout fix should move resource comparison into the report card");
assert.doesNotMatch(layoutFinalFix, /tuneInnerCoverArrows|nudgeInnerCover|coverOffsetCornerGroup|↖|↗|↙|↘/, "layout fix should not convert cover controls into legacy diagonal arrows");

// ── PDF / print safety contract ──────────────────────────────────────────────
// No MutationObserver anywhere in the PDF path
assert.doesNotMatch(profileLitePageSource, /MutationObserver/, "PDF safe reimplementation: ProfileLitePage must not introduce MutationObserver");

// openPowerPlacePdfPrintView must exist as a local function and call extractCssUrls internally
assert.match(profileLitePageSource, /function openPowerPlacePdfPrintView\b/, "openPowerPlacePdfPrintView must be defined as a local function");
assert.match(profileLitePageSource, /function openPowerPlacePdfPrintView[\s\S]*extractCssUrls/, "extractCssUrls must be called inside openPowerPlacePdfPrintView");

// extractCssUrls call must NOT appear outside openPowerPlacePdfPrintView (imports are allowed)
{
  const withoutFn = profileLitePageSource.replace(/function openPowerPlacePdfPrintView\b[\s\S]*?\n\}/, "");
  const withoutImport = withoutFn.replace(/import \{[^}]*extractCssUrls[^}]*\}[^\n]*\n/, "");
  assert.doesNotMatch(withoutImport, /extractCssUrls\s*\(/, "extractCssUrls must not be called outside openPowerPlacePdfPrintView");
}

// preloadImagesForPrint must exist with safe 2500ms timeout and Image guard
assert.match(profileLitePageSource, /function preloadImagesForPrint\b/, "PDF preload helper must use safe name preloadImagesForPrint");
assert.match(profileLitePageSource, /timeoutMs\s*=\s*2500/, "PDF preload must default to 2500ms timeout");
assert.match(profileLitePageSource, /typeof Image === "undefined"/, "preloadImagesForPrint must guard against unavailable Image constructor");

// raf2 must guard requestAnimationFrame and fall back to setTimeout
assert.match(profileLitePageSource, /typeof win\.requestAnimationFrame === "function"/, "raf2 must guard requestAnimationFrame with typeof check");
assert.match(profileLitePageSource, /setTimeout\(res,/, "raf2 must fall back to setTimeout when requestAnimationFrame is unavailable");

// auth-gate branch (before user/authStatus check) must not render any PDF helper calls
{
  const authBranchMatch = profileLitePageSource.match(/if \(!user \|\| authStatus !== "success"\)[\s\S]*?return \([\s\S]*?\);\s*\}/);
  if (authBranchMatch) {
    assert.doesNotMatch(authBranchMatch[0], /openPowerPlacePdfPrintView|preloadImagesForPrint|extractCssUrls/, "auth-gate branch must not render PDF helper logic");
  }
}

// --- A: Composition save chain fixes ---
assert.match(profileLitePageSource, /saved\?\.id[\s\S]*Место силы не сохранилось|Место силы не сохранилось[\s\S]*saved\?\.id/, "save should validate that the server returned a row with an id before showing success");
assert.match(profileLitePageSource, /Место силы не сохранилось:/, "save error message should use the required Russian error prefix");
assert.match(profileLitePageSource, /Место силы сохранено и добавлено в Мои мандалы/, "save success message should mention Мои мандалы");
for (const stageText of [
  "Нажали сохранить…",
  "Проверяем профиль…",
  "Проверяем лимит…",
  "Отправляем в Supabase…",
  "Supabase вернул запись…",
  "Обновляем список…",
  "Сохранено."
]) {
  assert.match(profileLitePageSource, new RegExp(stageText.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")), `save flow should include visible stage text: ${stageText}`);
}
assert.match(profileLitePageSource, /Не сохранилось на этапе: \$\{stageLabel\}\. \$\{safeMessage\}/, "save failures should include the failed stage and a safe error");
assert.match(profileLitePageSource, /onStage:\s*\(stage\)[\s\S]*setCompositionMessage/, "save flow should set stage messages from createPowerPlaceComposition before internal async stages");
assert.match(profileLitePageSource, /setPowerPlaceCompositions[\s\S]*saved[\s\S]*without|setPowerPlaceCompositions\(\(current\)/, "after successful save the new composition should be optimistically added to the list before list refresh");
assert.match(profileLitePageSource, /setCompositionDraft[\s\S]*EMPTY_COMPOSITION[\s\S]*saved[\s\S]*id: saved\.id|setCompositionDraft\(\(current\) => \{[\s\S]*saved\.id/, "after save compositionDraft.id should be updated to the new saved id");
assert.match(powerPlaceClientSource, /Не удалось проверить лимит сохранённых мандал[\s\S]*countRows/, "create should expose a clear safe count-stage error before insert");
assert.match(powerPlaceClientSource, /Не удалось сохранить мандалу в Supabase/, "create should expose a clear safe POST-stage error");
assert.match(powerPlaceClientSource, /method: "POST"[\s\S]*COMPOSITIONS_TABLE|COMPOSITIONS_TABLE[\s\S]*method: "POST"/, "create should still POST to the compositions table");
assert.match(powerPlaceClientSource, /__hydration_warning[\s\S]*hydration/, "create should return the raw inserted row with a hydration warning if signed URL hydration fails");
assert.match(profileLitePageSource, /refreshSavedCompositions\(saved\)[\s\S]*catch[\s\S]*setCompositionMessage[\s\S]*Мандала сохранена[\s\S]*список не обновился/, "refresh failure after create should keep the optimistic row and show a visible safe message");
assert.match(powerPlaceBaseSource, /profileLitePowerPlaceActionFeedback[\s\S]*compositionMessage/, "action-area feedback should render near the Power Place Save button");

// --- C: top-level Услуги is the only services-management tab ---
assert.match(powerPlaceBaseSource, /onAddCompositionToServices/, "ProfileLitePowerPlaceModuleBase should accept onAddCompositionToServices prop");
assert.match(powerPlaceBaseSource, /Добавить в мои услуги/, "composition cards in Мои мандалы should expose the add-to-services button");
assert.match(powerPlaceBaseSource, /Эта мандала уже есть в Моих услугах/, "add-to-services button should be disabled with the required message when already in services");
assert.doesNotMatch(powerPlaceBaseSource, /workspaceTab === "services" \? renderServicesTab\(\)/, "workspace should not expose a dedicated internal Услуги tab");
assert.doesNotMatch(powerPlaceBaseSource, /Пока нет мандал, добавленных в услуги/, "empty duplicate Услуги panel should be removed from Мастерская");
assert.doesNotMatch(powerPlaceBaseSource, /\(services \|\| \[\]\)\.filter\(\(service\) => String\(service\?\.composition_id/, "Мастерская should not keep a duplicate services list filtered by composition_id");
assert.match(profileLitePageSource, /handleSendCompositionToServices/, "ProfileLitePage should expose handleSendCompositionToServices");
assert.match(profileLitePageSource, /handlePublishCompositionAsService/, "ProfileLitePage should expose handlePublishCompositionAsService");
assert.match(profileLitePageSource, /deletePowerPlaceComposition/, "ProfileLitePage should import and use deletePowerPlaceComposition for saved mandala deletion");
assert.match(profileLitePageSource, /Удалить сохранённую мандалу\? Фото и источники силы не удалятся\./, "saved mandala deletion should confirm that photos and sources are preserved");
assert.match(profileLitePageSource, /handleCompositionDelete[\s\S]*deletePowerPlaceComposition\(composition\.id, profile\.id, session\)[\s\S]*setPowerPlaceCompositions\(\(current\) => current\.filter\(\(item\) => item\.id !== composition\.id\)\)/, "saved mandala deletion should remove only the composition row and local card");
assert.match(profileLitePageSource, /compositionDraft\.id === composition\.id[\s\S]*setCompositionDraft\(withDefaultMotionSettings\(\{ \.\.\.EMPTY_COMPOSITION \}\)\)/, "deleting the open saved mandala should reset the current draft to a fresh empty composition");
assert.match(powerPlaceBaseSource, /profileLiteCompositionDeleteButton[\s\S]*event\.stopPropagation\(\)[\s\S]*onCompositionDelete\?\.\(composition\)/, "saved mandala delete button should be visible and should not open the composition card");
assert.match(profileLitePageSource, /saveCompositionForServiceAction/, "service actions should save or update the composition before creating a service");
assert.match(profileLitePageSource, /upsertOwnServiceForComposition/, "service actions should reuse the service for profile_id + composition_id");
assert.match(profileLitePageSource, /setActiveTab\("services"\)/, "service transfer/publish actions should open the /profile/services tab");
assert.match(profileLitePageSource, /Мандала уже добавлена в услуги/, "add-to-services duplicate guard should show the required message");
assert.match(profileLitePageSource, /Мандала добавлена в услуги/, "successful add-to-services should show the required confirmation message");
assert.match(profileServicesClientSource, /composition_id: compositionId/, "add-to-services should pass composition_id through the shared upsert helper");
assert.match(powerPlaceBaseSource, /Обновить/, "Power Place actions should expose the Обновить button text");
assert.match(powerPlaceBaseSource, /Создать новую/, "Power Place actions should expose the Создать новую button text");
assert.match(powerPlaceBaseSource, /Перенести в услуги/, "Power Place actions should expose explicit transfer-to-services button text");
assert.match(powerPlaceBaseSource, /Опубликовать как услугу/, "Power Place actions should expose explicit publish-as-service button text");
assert.match(powerPlaceBaseSource, /onPublishAsService/, "Power Place module should accept a dedicated publish-as-service handler");

// --- C2: Services manager Phase 1 grouping and public-link honesty ---
const servicesModuleSource = readFileSync(join(moduleDir, "ProfileLiteServicesModule.jsx"), "utf8");
assert.match(servicesModuleSource, /Черновики/, "Services module should group drafts under Черновики");
assert.match(servicesModuleSource, /Опубликованные/, "Services module should group published services under Опубликованные");
assert.match(servicesModuleSource, /Архив/, "Services module should group archived services under Архив");
assert.match(profileServicesManagerSource, /Ссылка появится после публикации/, "Draft services should not show an active public link");
assert.match(profileServicesManagerSource, /Публичная ссылка для клиентов/, "Published services should show a real public link after /services/:serviceId exists");
assert.match(profileServicesManagerSource, /Скопировать ссылку/, "Published services should expose a copy link button");
assert.match(servicesModuleSource, /Скопировать ссылку/, "Phase 3 should expose copy link after the public service route exists");
assert.match(servicesModuleSource, /formatServicePrice/, "Services module should use the shared free-price formatter");

// --- D: Field layout persistence ---
assert.match(profileLitePageSource, /FIELD_LAYOUT_REF_KEY\s*=\s*"__field_layout"/, "ProfileLitePage should define FIELD_LAYOUT_REF_KEY = \"__field_layout\"");
assert.match(profileLitePageSource, /field_layout:\s*"square"/, "EMPTY_COMPOSITION should include field_layout: \"square\"");
assert.match(profileLitePageSource, /field === "field_layout"[\s\S]*object_refs[\s\S]*FIELD_LAYOUT_REF_KEY/, "handleCompositionDraftChange should persist field_layout into object_refs via FIELD_LAYOUT_REF_KEY");
assert.match(profileLitePageSource, /function normalizeFieldLayout[\s\S]*"square"/, "normalizeFieldLayout should fall back to square");
assert.match(profileLitePageSource, /function fieldLayoutFromComposition[\s\S]*object_refs\?\.\[FIELD_LAYOUT_REF_KEY\]/, "fieldLayoutFromComposition should restore field_layout from object_refs.__field_layout");
assert.match(profileLitePageSource, /handleCompositionLoad[\s\S]*field_layout:\s*fieldLayoutFromComposition\(composition\)/, "handleCompositionLoad should restore field_layout through fieldLayoutFromComposition");
assert.match(profileLitePageSource, /refreshSavedCompositions[\s\S]*field_layout:\s*fieldLayoutFromComposition\(freshSaved\)/, "refreshSavedCompositions should restore field_layout through fieldLayoutFromComposition");
assert.match(powerPlaceClientSource, /FIELD_LAYOUT_REF_KEY\s*=\s*"__field_layout"/, "powerPlaceClient.js should define FIELD_LAYOUT_REF_KEY = \"__field_layout\"");
assert.match(powerPlaceClientSource, /VALID_FIELD_LAYOUTS\s*=\s*\[[\s\S]*"square"[\s\S]*"vertical"[\s\S]*"horizontal"[\s\S]*"rectangle"[\s\S]*\]/, "powerPlaceClient.js should define VALID_FIELD_LAYOUTS with all four layouts");
assert.match(powerPlaceClientSource, /FIELD_LAYOUT_REF_KEY[\s\S]*VALID_FIELD_LAYOUTS\.includes/, "normalizePowerPlaceComposition should validate and persist __field_layout");

// --- E: Power Place motion mode ---
assert.match(powerPlaceClientSource, /MOTION_SETTINGS_REF_KEY\s*=\s*"__motion_settings"/, "powerPlaceClient should define MOTION_SETTINGS_REF_KEY");
assert.match(powerPlaceClientSource, /DEFAULT_MOTION_SETTINGS[\s\S]*mode:\s*"photo"[\s\S]*step_seconds:\s*2[\s\S]*function normalizeMotionSettings/, "powerPlaceClient should normalize motion settings with Фото defaults");
assert.match(powerPlaceClientSource, /cleanObjectRefs[\s\S]*MOTION_SETTINGS_REF_KEY[\s\S]*normalizeMotionSettings/, "cleanObjectRefs should preserve only normalized __motion_settings nested object");
assert.match(powerPlaceClientSource, /objectRefs\[MOTION_SETTINGS_REF_KEY\]\s*=\s*normalizeMotionSettings/, "normalizePowerPlaceComposition should always default __motion_settings");
assert.match(profileLitePageSource, /MOTION_SETTINGS_REF_KEY\s*=\s*"__motion_settings"/, "ProfileLitePage should define MOTION_SETTINGS_REF_KEY");
assert.match(profileLitePageSource, /function withDefaultMotionSettings[\s\S]*MOTION_SETTINGS_REF_KEY[\s\S]*normalizeMotionSettings/, "ProfileLitePage should hydrate default motion settings");
assert.match(profileLitePageSource, /motion_mode[\s\S]*video_count[\s\S]*video_direction[\s\S]*video_step_seconds[\s\S]*video_background_ref/, "handleCompositionDraftChange should map video control fields into __motion_settings");
assert.match(powerPlaceBaseSource, /data-motion-mode-switch="true"/, "motion mode switch should expose a stable data marker");
assert.match(powerPlaceBaseSource, /data-video-count=\{count\}/, "video count controls should expose data-video-count markers");
assert.match(powerPlaceBaseSource, /data-video-direction="clockwise"[\s\S]*data-video-direction="counterclockwise"/, "video direction controls should expose stable markers");
assert.match(powerPlaceBaseSource, /data-video-step-seconds=\{seconds\}/, "video step controls should expose data-video-step-seconds markers");
assert.match(powerPlaceBaseSource, /data-motion-layer="true"[\s\S]*data-motion-copy=\{index \+ 1\}/, "motion layer should expose data markers for copies");
assert.match(powerPlaceBaseSource, /data-video-export-button="true"[\s\S]*Экспорт видео: needs implementation/, "video export button should be honest about missing export implementation");
assert.match(powerPlaceBaseSource, /Видео-фон: needs implementation/, "video background should remain a needs implementation status");
assert.match(powerPlaceBaseSource, /clockPositions[\s\S]*getMotionPositionsForComposition[\s\S]*compact-5[\s\S]*plus-8[\s\S]*classic-8[\s\S]*classic-14/, "motion helpers should define mappings for all required formats");
assert.match(powerPlaceBaseSource, /renderCenterPhotoWithMode\("powerCenterPhoto"\)[\s\S]*renderPowerPlaceMotionLayer\(\)/, "client branch should keep motion layer separate from center button");
assert.doesNotMatch(powerPlaceBaseSource, /value:\s*"video"/, "CONSTRUCTOR_TYPES must not add a video constructor type");

// --- F: Grimoire tab (issue #273) ---
const grimoireModuleSource = readFileSync(join(moduleDir, "ProfileLiteMaterialsModule.jsx"), "utf8");

assert.match(grimoireModuleSource, /Гримуар мастера/, "Grimoire hero should say 'Гримуар мастера'");
assert.match(grimoireModuleSource, /Соберите фото, статьи, практики, аудио и документы\. Сначала загрузите всё без структуры, потом разложите по категориям\./, "Grimoire hero should explain the collect-first workflow");
assert.match(grimoireModuleSource, /Неразобранно[\s\S]*Готово к работе/, "Grimoire hero should expose unclassified and ready-to-work stats");
assert.match(grimoireModuleSource, /Фильтр гримуара/, "Grimoire left column should say 'Фильтр гримуара'");
assert.match(grimoireModuleSource, /Записи гримуара/, "Grimoire center column should say 'Записи гримуара'");
assert.match(grimoireModuleSource, /Загрузить в гримуар/, "Grimoire right column should say 'Загрузить в гримуар'");
assert.match(grimoireModuleSource, /type="file"[\s\S]*multiple/, "Grimoire uploader should be a multi-file input");
assert.match(grimoireModuleSource, /Перетащите файлы сюда или выберите с телефона/, "Grimoire uploader should expose a clear drop-zone instruction");
assert.match(grimoireModuleSource, /selectedFiles/, "Grimoire uploader should keep selected files before upload");
assert.match(grimoireModuleSource, /grimoireTaxonomyLevelOptions\(1\)/, "Grimoire edit select should use level 1 taxonomy options");
assert.doesNotMatch(grimoireModuleSource, /РИ по умолчанию/, "Grimoire uploader should not present flat RI as the new default");
assert.match(grimoireModuleSource, /const uploadedFiles = \[\]/, "Grimoire composer save should collect selected files before creating one parent post");
assert.match(grimoireModuleSource, /const saved = await createOwnMaterial\(payload,\s*session\)/, "Grimoire composer save should create one parent material record for the batch");
assert.doesNotMatch(grimoireModuleSource, /for \(const file of records\)[\s\S]*createOwnMaterial/, "Grimoire composer save must not create one material record per selected file");
assert.match(grimoireModuleSource, /Комментарий ещё не добавлен/, "Grimoire cards should show a note placeholder when description is missing");
assert.match(grimoireModuleSource, /Разберите позже/, "Uncategorized records should be treated as the main working state");
assert.match(grimoireModuleSource, /Гримуар пуст/, "Empty grimoire should use the dedicated empty state title");
assert.match(grimoireModuleSource, /Загрузите первые фото, статьи или документы — их можно разобрать позже\./, "Empty grimoire should explain first upload flow");
assert.match(grimoireModuleSource, /Редактировать запись гримуара/, "Edit panel should use the grimoire-specific title");
assert.match(grimoireModuleSource, /Ступень/, "Edit panel should include step field");
assert.match(grimoireModuleSource, /Настройка/, "Edit panel should include setting field");
assert.match(grimoireModuleSource, /Редактировать/, "Grimoire record cards should expose an edit action");
assert.match(grimoireModuleSource, /Удалить/, "Grimoire record cards should expose a delete action");
assert.match(grimoireModuleSource, /GRIMOIRE_CATEGORIES/, "Grimoire left column should use GRIMOIRE_CATEGORIES for filters");
assert.match(grimoireModuleSource, /grimoireFilterBtn/, "Grimoire filter buttons should use grimoireFilterBtn class");
assert.match(grimoireModuleSource, /grimoireRecordCard/, "Grimoire records should use grimoireRecordCard class");
assert.match(profileLitePageSource, /handleGrimoireMultiUpload/, "ProfileLitePage should expose handleGrimoireMultiUpload");

// --- G: Power Place scale limits and print/PDF correctness ---

assert.match(
  powerPlaceClientSource,
  /SLOT_SCALE_MAX\s*=\s*1\.85/,
  "powerPlaceClient.js must define SLOT_SCALE_MAX = 1.85 to match UI slider max"
);

assert.match(
  powerPlaceClientSource,
  /FIELD_SCALE_MAX\s*=\s*145/,
  "powerPlaceClient.js must define FIELD_SCALE_MAX = 145 to match UI slider max"
);

assert.match(
  powerPlaceClientSource,
  /CENTER_IMAGE_SCALE_MAX\s*=\s*2/,
  "powerPlaceClient.js must define CENTER_IMAGE_SCALE_MAX = 2 to match UI slider max"
);

assert.match(
  powerPlaceClientSource,
  /CENTER_FRAME_SCALE_MAX\s*=\s*1\.85/,
  "powerPlaceClient.js must define CENTER_FRAME_SCALE_MAX = 1.85 to match UI slider max"
);

assert.match(
  profileLitePageSource,
  /field === "__center_frame_scale"[\s\S]*object_refs[\s\S]*__center_frame_scale/,
  "handleCompositionDraftChange must persist __center_frame_scale into object_refs"
);

assert.match(
  profileLitePageSource,
  /field === "__center_image_scale"[\s\S]*object_refs[\s\S]*__center_image_scale/,
  "handleCompositionDraftChange must persist __center_image_scale into object_refs"
);

assert.match(
  powerPlaceWrapperSource,
  /field === CENTER_IMAGE_SCALE_REF_KEY[\s\S]*objectRefs[\s\S]*CENTER_IMAGE_SCALE_REF_KEY[\s\S]*centerImageScaleValue\(value\)/,
  "ProfileLitePowerPlaceModule handleDraftChange must persist __center_image_scale into object_refs"
);

assert.match(
  profileLitePageSource,
  /raf2\(window\)[\s\S]*cloneNode/,
  "openPowerPlacePdfPrintView must defer DOM clone with raf2(window) so React flushes slider state before print"
);

assert.doesNotMatch(
  profileLitePageSource,
  /handleDownloadComposition[\s\S]{0,200}refreshSavedCompositions/,
  "handleDownloadComposition must not call refreshSavedCompositions — print uses current DOM, not saved data"
);

assert.doesNotMatch(
  profileLitePageSource,
  /handlePrintComposition[\s\S]{0,200}refreshSavedCompositions/,
  "handlePrintComposition must not call refreshSavedCompositions — print uses current DOM, not saved data"
);

assert.match(
  powerPlaceBaseSource,
  /powerPlacePrintArea[\s\S]*style=\{sourceSlotScaleStyle\}/,
  ".powerPlacePrintArea must receive sourceSlotScaleStyle so CSS variables survive cloneNode into print window"
);

assert.match(
  powerPlaceBaseSource,
  /sourceSlotScaleStyle[\s\S]*--power-source-slot-scale[\s\S]*--power-place-chess-slot-scale[\s\S]*--power-field-scale[\s\S]*--power-center-image-scale[\s\S]*--power-center-frame-scale/,
  "sourceSlotScaleStyle must include all five layout CSS variables for print fidelity"
);
assert.match(profileLitePageSource, /handleGrimoireUpdate/, "ProfileLitePage should expose handleGrimoireUpdate");
assert.match(profileLitePageSource, /handleGrimoireDelete/, "ProfileLitePage should expose handleGrimoireDelete");
assert.match(profileLitePageSource, /deleteOwnMaterial/, "ProfileLitePage should import deleteOwnMaterial");
assert.match(profileLitePageSource, /updateOwnMaterial/, "ProfileLitePage should import updateOwnMaterial");
assert.match(profileLitePageSource, /buildMaterialUploadPublicationPayload/, "ProfileLitePage should use the DB-safe material upload payload helper");
assert.match(profileLitePageSource, /Promise\.allSettled\(uploadFiles\.map/, "ProfileLitePage material library uploads should save one publication row per selected file");
assert.match(profileLitePageSource, /buildGrimoireBatchUploadPayload/, "ProfileLitePage should use the shared Grimoire batch helper for quick uploads");
assert.match(profileMaterialsClientSource, /detectMaterialTypeFromFile\(firstFile\)/, "Grimoire batch helper should detect material type for uploads");
assert.match(profileMaterialsClientSource, /stripFileExtension\(firstFile\?\.name\)/, "Grimoire batch helper should derive batch titles from file names");

assert.match(profileMaterialsClientSource, /export.*GRIMOIRE_CATEGORIES/, "profileMaterialsClient.js should export GRIMOIRE_CATEGORIES");
assert.match(profileMaterialsClientSource, /reikiLevels\.map/, "profileMaterialsClient.js should derive Grimoire course taxonomy from all Reiki levels");
assert.match(profileMaterialsClientSource, /mysteryTraditions\.map/, "profileMaterialsClient.js should derive deity taxonomy from all mystery traditions");
assert.match(profileMaterialsClientSource, /export function detectMaterialTypeFromFile/, "profileMaterialsClient.js should export detectMaterialTypeFromFile");
assert.match(profileMaterialsClientSource, /export function stripFileExtension/, "profileMaterialsClient.js should export stripFileExtension");
assert.match(profileMaterialsClientSource, /export async function updateOwnMaterial/, "profileMaterialsClient.js should export updateOwnMaterial");
assert.match(profileMaterialsClientSource, /export async function deleteOwnMaterial/, "profileMaterialsClient.js should export deleteOwnMaterial");
assert.match(profileMaterialsClientSource, /export function getGrimoirePreviewUrl/, "profileMaterialsClient.js should expose Grimoire preview URL resolution");
assert.match(profileMaterialsClientSource, /export function buildMaterialUploadPublicationPayload/, "profileMaterialsClient.js should expose a DB-safe material upload payload builder");
assert.match(profileMaterialsClientSource, /Спрятать/, "visible Grimoire feed items should expose the Hide action label");

const profileMediaClientSource = readFileSync("src/lib/profileMediaClient.js", "utf8");
assert.match(profileMediaClientSource, /export function validateGrimoireFile/, "profileMediaClient.js should export validateGrimoireFile");
assert.match(profileMediaClientSource, /audio\/mpeg/, "PROFILE_MEDIA_ALLOWED_TYPES should include audio/mpeg for grimoire");
assert.match(profileMediaClientSource, /application\/pdf/, "PROFILE_MEDIA_ALLOWED_TYPES should include application/pdf for grimoire");

const grimoireMigration = readFileSync("supabase/migrations/20260605120000_grimoire_publication_types.sql", "utf8");
assert.match(grimoireMigration, /uncategorized.*photo.*article.*document.*audio/, "Grimoire migration should add uncategorized, photo, article, document, audio type values");

const publicationTaxonomyMigrations = [
  readFileSync("supabase/migrations/20260617120000_profile_cabinet_publication_material_taxonomy.sql", "utf8"),
  readFileSync("supabase/migrations/20260618133000_profile_cabinet_publication_taxonomy_schema_cache.sql", "utf8")
].join("\n");
assert.match(publicationTaxonomyMigrations, /add column if not exists category text not null default ''/, "publication taxonomy migrations must add the category column idempotently");
assert.match(publicationTaxonomyMigrations, /add column if not exists subcategory text not null default ''/, "publication taxonomy migrations must add the subcategory column idempotently");
assert.match(publicationTaxonomyMigrations, /add column if not exists material_group text not null default ''/, "publication taxonomy migrations must add material_group idempotently");
assert.match(publicationTaxonomyMigrations, /add column if not exists material_type text not null default ''/, "publication taxonomy migrations must add material_type idempotently");
assert.match(publicationTaxonomyMigrations, /profile_cabinet_publications_material_taxonomy_idx/, "publication taxonomy migrations must preserve the taxonomy index");
assert.match(publicationTaxonomyMigrations, /notify\s+pgrst,\s*'reload schema'/i, "publication taxonomy migrations must reload the PostgREST schema cache");

const supabaseMigrationRunnerSource = readFileSync("scripts/apply-reiki-supabase-migrations.mjs", "utf8");
const starFormatVariantMigration = readFileSync("supabase/migrations/20260624120000_power_place_star_format_variant.sql", "utf8");

assert.match(
  starFormatVariantMigration,
  /add column if not exists star_format_variant text not null default 'classic'/,
  "Star format migration must add star_format_variant with Star 1 as the old-composition default"
);

assert.match(
  starFormatVariantMigration,
  /check \(star_format_variant in \('classic', 'star-2-10'\)\)/,
  "Star format migration must constrain values to Star 1 and Star 2"
);

assert.match(
  starFormatVariantMigration,
  /notify\s+pgrst,\s*'reload schema'/i,
  "Star format migration must reload PostgREST schema cache"
);

for (const migrationFile of [
  "supabase/migrations/20260617120000_profile_cabinet_publication_material_taxonomy.sql",
  "supabase/migrations/20260618133000_profile_cabinet_publication_taxonomy_schema_cache.sql",
  "supabase/migrations/20260624120000_power_place_star_format_variant.sql"
]) {
  assert.match(
    supabaseMigrationRunnerSource,
    new RegExp(migrationFile.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")),
    `Supabase migration runner must allow ${migrationFile}`
  );
}

assert.match(
  supabaseMigrationRunnerSource,
  /profile_cabinet_power_place_compositions[\s\S]*column_name = 'star_format_variant'/,
  "Supabase migration runner must verify profile_cabinet_power_place_compositions.star_format_variant"
);

for (const columnName of ["material_group", "material_type", "category", "subcategory"]) {
  assert.match(
    supabaseMigrationRunnerSource,
    new RegExp(`profile_cabinet_publications[\\s\\S]*column_name = '${columnName}'`),
    `Supabase migration runner must verify profile_cabinet_publications.${columnName}`
  );
  assert.match(
    supabaseMigrationRunnerSource,
    new RegExp(`profile_cabinet_publications_${columnName}`),
    `Supabase migration runner schema check must expose profile_cabinet_publications_${columnName}`
  );
}

// ── F: Cover layer separation and mobile width contract ───────────────────────

assert.match(powerPlaceBaseSource, /Фон внутри/, "cover panel must include inner layer tab label");
assert.match(powerPlaceBaseSource, /Фон снаружи/, "cover panel must include outer layer tab label");
assert.match(powerPlaceBaseSource, /coverVariantsGrid/, "cover panel must use coverVariantsGrid");
assert.match(powerPlaceBaseSource, /export function coverShortcutLayerFromPhoto/, "layer classifier helper must be exported for testing");
assert.match(powerPlaceBaseSource, /export function filterCoverShortcutsByLayer/, "layer filter helper must be exported for testing");
assert.match(powerPlaceBaseSource, /item\.kind === "client-photo"/, "cover shortcuts should only come from client-photo items");
assert.match(powerPlaceBaseSource, /filterCoverShortcutsByLayer\(candidates, coverLayerMode, activeCoverSrc\)/, "savedCoverOptions must apply layer filter with current layer mode");

// Mobile CSS: full-width enforcement
assert.match(profileMandalaCss, /@media \(max-width: 980px\)[\s\S]*\.profileLitePowerPlace \.powerLayoutPanel\.compactFieldLayoutSwitch,[\s\S]*\.profileLitePowerPlace \.coverPickerPanel,[\s\S]*\.profileLitePowerPlace \.reportSettingsPanel \{[\s\S]*width: 100%/, "mobile CSS must enforce full width for layout, cover, and report panels");

// Cover shortcuts: no internal scroll clipping
assert.doesNotMatch(profileMandalaCss, /\.profileLitePowerPlace \.coverVariantsGrid\s*\{[^}]*max-height:[^}]*\}/, "coverVariantsGrid must not have a max-height clip that hides shortcuts");
assert.doesNotMatch(profileMandalaCss, /\.profileLitePowerPlace \.coverVariantsGrid\s*\{[^}]*overflow:\s*auto[^}]*\}/, "coverVariantsGrid must not have overflow:auto that creates internal scrollbar");

// Delete cleanup: cover_ref layers must be reset when deleted photo was active cover
assert.match(profileLitePageSource, /NO_COVER_LAYER = \{ id: "no-cover"/, "handleDeleteClientPhoto must define a no-cover fallback for layer reset");
assert.match(profileLitePageSource, /innerSrc && deletedRefs\.has\(innerSrc\)[\s\S]*nextCoverRef[\s\S]*inner: NO_COVER_LAYER/, "handleDeleteClientPhoto must reset inner cover when deleted photo was active inner cover");
assert.match(profileLitePageSource, /outerSrc && deletedRefs\.has\(outerSrc\)[\s\S]*nextCoverRef[\s\S]*outer: NO_COVER_LAYER/, "handleDeleteClientPhoto must reset outer cover when deleted photo was active outer cover");

// ── Mandala style selector: СЕТКА МАНДАЛЫ removed, style buttons added ───────

assert.doesNotMatch(
  powerPlaceSource,
  /Фото-сетка для формата|СЕТКА МАНДАЛЫ|mandalaTemplatePilotPanel/,
  "The separate photo-grid pilot panel must be removed from the Power Place module"
);

assert.doesNotMatch(
  powerPlaceWrapperSource,
  /placePowerMandalaTemplates/,
  "placePowerMandalaTemplates import must be removed from the wrapper module"
);

assert.doesNotMatch(
  powerPlaceWrapperSource,
  /profileMandalaTemplatePilot/,
  "profileMandalaTemplatePilot.css import must be removed from the wrapper module"
);

assert.doesNotMatch(
  powerPlaceWrapperSource,
  /MANDALA_TEMPLATE_REF_KEY/,
  "MANDALA_TEMPLATE_REF_KEY constant must be removed from the wrapper module"
);

assert.equal(
  existsSync("src/data/placePowerMandalaTemplates.js"),
  false,
  "src/data/placePowerMandalaTemplates.js must be deleted as it is no longer used"
);

assert.equal(
  existsSync("src/profileMandalaTemplatePilot.css"),
  false,
  "src/profileMandalaTemplatePilot.css must be deleted as it is no longer used"
);

assert.match(
  powerPlaceBaseSource,
  /MANDALA_STYLE_VARIANTS/,
  "Base module should define MANDALA_STYLE_VARIANTS constant for the Mandala format"
);

assert.match(
  powerPlaceBaseSource,
  /mandalaStyleSelector/,
  "Base module should render a mandala style selector for the Мандала format"
);

assert.match(
  powerPlaceBaseSource,
  /constructor_type.*===.*"client"[\s\S]*mandalaStyleSelector|mandalaStyleSelector[\s\S]*constructor_type.*===.*"client"/,
  "Mandala style selector must render only when constructor_type is client"
);

assert.match(
  powerPlaceBaseSource,
  /Стиль 1[\s\S]*Стиль 2[\s\S]*Стиль 3/,
  "Mandala style buttons must show Стиль 1, Стиль 2, Стиль 3 in order"
);

assert.match(
  powerPlaceBaseSource,
  /compositionDraft\.__mandala_style \|\| "style-1"/,
  "Mandala style must default to style-1 for backward compatibility with existing saved mandalas"
);

assert.match(
  powerPlaceBaseSource,
  /mandala-\$\{compositionDraft\.__mandala_style \|\| "style-1"\}/,
  "Мандала powerMandala div must apply the active style class"
);

assert.match(
  powerPlaceSource,
  /MANDALA_STYLE_REF_KEY = "__mandala_style"/,
  "outer Power Place module must define MANDALA_STYLE_REF_KEY for persistence in object_refs"
);

assert.match(
  powerPlaceSource,
  /__mandala_style: mandalaStyle/,
  "outer Power Place module must pass mandalaStyle through the enhancedDraft"
);

assert.match(
  profileMandalaCss,
  /\.powerMandala\.mandala-style-2/,
  "CSS must define layout overrides for mandala-style-2"
);

assert.match(
  profileMandalaCss,
  /\.powerMandala\.mandala-style-3/,
  "CSS must define layout overrides for mandala-style-3"
);

assert.match(
  profileMandalaCss,
  /\.profileLitePowerPlace \.mandalaStyleSelector/,
  "CSS must include compact pill button styles for the mandala style selector"
);

assert.match(grimoireWorkspaceCss, /\.profileLiteGrimoireModule \.workspaceMainColumns/, "Grimoire workspace CSS should own scoped layout fixes");
assert.match(grimoireWorkspaceCss, /@media \(max-width: 980px\)[\s\S]*\.profileLiteGrimoireModule \.workspaceCenterColumn\s*\{[\s\S]*order: 1/, "mobile grimoire should show composer and center content first");
assert.match(grimoireWorkspaceCss, /@media \(max-width: 980px\)[\s\S]*\.profileLiteGrimoireModule \.grimoireUploaderColumn\s*\{[\s\S]*order: 2/, "mobile grimoire should show uploader and quick actions second");
assert.match(grimoireWorkspaceCss, /@media \(max-width: 980px\)[\s\S]*\.profileLiteGrimoireModule \.grimoireFilterSidebar\s*\{[\s\S]*order: 3/, "mobile grimoire should show filters third");
assert.match(grimoireWorkspaceCss, /@media \(max-width: 980px\)[\s\S]*\.profileLiteGrimoireModule \.grimoireComposer\s*\{[\s\S]*grid-template-columns: minmax\(0, 1fr\)/, "mobile grimoire composer should be a full-width single column");
assert.match(grimoireWorkspaceCss, /@media \(max-width: 980px\)[\s\S]*\.profileLiteGrimoireModule \.grimoireComposerTools\s*\{[\s\S]*grid-template-columns: minmax\(0, 1fr\)/, "mobile grimoire composer tools should stack full width");
assert.match(grimoireWorkspaceCss, /@media \(max-width: 980px\)[\s\S]*\.profileLiteGrimoireModule \.grimoireComposerActions\s*\{[\s\S]*grid-template-columns: minmax\(0, 1fr\)/, "mobile grimoire composer buttons should stack full width");
assert.match(grimoireWorkspaceCss, /\.profileLiteGrimoireModule \.grimoireQuickActionsCard\s+a\s*\{[\s\S]*display: flex/, "Grimoire quick actions should render as separated vertical links");
assert.match(grimoireWorkspaceCss, /\.profileLiteGrimoireModule \.grimoireMaterialFilterPanel[\s\S]*grid-template-columns: repeat\(3, minmax\(0, 1fr\)\)/, "Grimoire material filter should be a compact three-select panel on desktop");
assert.match(profileMaterialsModuleSource, /className=\{`grimoireRecordCard grimoirePostCard/, "Grimoire records should render through the post-card contract");
assert.match(profileMaterialsModuleSource, /className="grimoirePostHeader"/, "Grimoire records should have a post header");
assert.match(profileMaterialsModuleSource, /className="grimoirePostActions"/, "Grimoire records should keep add/edit/delete actions in the post footer");
assert.match(profileMaterialsModuleSource, /feedActionLabel === "Спрятать" \? onToggleVisibility\(material\) : onAddToFeed\(material\)/, "Grimoire feed action should add hidden items and hide already-visible items");
assert.match(profileMaterialsModuleSource, /onClick=\{\(\) => onEdit\(material\)\}/, "Grimoire edit handler must remain wired");
assert.match(profileMaterialsModuleSource, /onClick=\{\(\) => onDelete\(material\)\}/, "Grimoire delete handler must remain wired");
assert.match(profileGrimoireComposerSource, /type="file"/, "Grimoire composer should keep file upload support");
assert.match(profileGrimoireComposerSource, /type="file"[\s\S]*multiple/, "Grimoire composer file input should support multiple files");
assert.match(profileGrimoireComposerSource, /useState\(\[\]\)/, "Grimoire composer should store selected files as an array");
assert.match(profileGrimoireComposerSource, /Array\.from\(event\.target\.files \|\| \[\]\)/, "Grimoire composer should keep all selected files");
assert.match(profileGrimoireComposerSource, /grimoireComposerFiles/, "Grimoire composer should render the selected file list");
assert.match(profileGrimoireComposerSource, /Группа материалов/, "Grimoire composer should render taxonomy group pills");
assert.match(profileGrimoireComposerSource, /Категория/, "Grimoire composer should render compact taxonomy category select");
assert.match(profileGrimoireComposerSource, /Подкатегория \/ ступень/, "Grimoire composer should render compact taxonomy subcategory select");
assert.match(profileGrimoireComposerSource, /grimoireTaxonomyLevelOptions\(2, taxonomy\)/, "Grimoire composer level 2 should depend on selected level 1");
assert.match(profileGrimoireComposerSource, /grimoireTaxonomyLevelOptions\(3, taxonomy\)/, "Grimoire composer level 3 should depend on selected level 2");
assert.doesNotMatch(profileGrimoireComposerSource, /<span>Тип<\/span>/, "Grimoire composer should not use the old flat Type select");
assert.doesNotMatch(profileGrimoireComposerSource, /Название \/ тема/, "Grimoire composer should not expose the removed title/topic field");
assert.doesNotMatch(profileGrimoireComposerSource, /safe interim, needs verification/, "Grimoire composer should not expose taxonomy debug text");
assert.match(profileGrimoireComposerSource, /Что хотите добавить\?/, "Grimoire composer should use a compact composer prompt");
assert.match(profileGrimoireComposerSource, /Поделитесь заметкой, практикой, описанием мандалы/, "Grimoire composer should keep the compact note field");
assert.match(profileMaterialsModuleSource, /grimoireTaxonomyCompactLabel/, "Grimoire feed cards should render compact taxonomy");
assert.match(profileMaterialsModuleSource, /isGrimoireTaxonomyUnclassified/, "Grimoire unclassified logic should inspect all taxonomy levels");
assert.match(grimoireWorkspaceCss, /\.profileLiteGrimoireModule \.grimoireComposerFile input\[type="file"\]\s*\{[\s\S]*opacity: 0/, "Grimoire composer native file input should be visually hidden");
assert.match(grimoireWorkspaceCss, /\.profileLiteGrimoireModule \.grimoireComposerFiles\s*\{/, "Grimoire composer selected files should have compact styled list");
assert.match(grimoireWorkspaceCss, /\.profileLiteGrimoireModule \.grimoireRecordCard\.grimoirePostCard\s*\{[\s\S]*grid-template-columns: minmax\(0, 1fr\)/, "Grimoire post card should override the legacy side-rail grid");
assert.match(grimoireWorkspaceCss, /\.profileLiteGrimoireModule \.grimoireRecordCard\.grimoirePostCard\s*\{[\s\S]*padding: 9px/, "Grimoire feed cards should use compact padding");
assert.match(grimoireWorkspaceCss, /\.profileLiteGrimoireModule \.grimoirePostIdentity b,[\s\S]*overflow-wrap: anywhere/, "Grimoire post header text should wrap long category/date values");
assert.match(grimoireWorkspaceCss, /\.profileLiteGrimoireModule \.grimoirePostPreview\s*\{[\s\S]*aspect-ratio: 16 \/ 9[\s\S]*overflow: hidden/, "Grimoire media block should use a stable desktop aspect ratio");
assert.match(grimoireWorkspaceCss, /\.profileLiteGrimoireModule \.grimoirePostPreview\s*\{[\s\S]*max-height: 150px/, "Grimoire media previews should be capped to compact height");
assert.match(grimoireWorkspaceCss, /\.profileLiteGrimoireModule \.grimoireCardImage\s*\{[\s\S]*object-fit: cover/, "Grimoire image previews should fill the media block without layout shift");
assert.match(grimoireWorkspaceCss, /\.profileLiteGrimoireModule \.grimoirePostActions\s*\{[\s\S]*display: flex[\s\S]*flex-wrap: wrap/, "Grimoire post actions should be a wrapping footer row");
assert.match(grimoireWorkspaceCss, /@media \(max-width: 520px\)[\s\S]*\.profileLiteGrimoireModule \.grimoirePostHeader\s*\{[\s\S]*grid-template-columns: 38px minmax\(0, 1fr\)/, "Mobile Grimoire post header should avoid a three-column side rail");
assert.match(grimoireWorkspaceCss, /@media \(max-width: 520px\)[\s\S]*\.profileLiteGrimoireModule \.grimoirePostPreview,[\s\S]*\.profileLiteGrimoireModule \.grimoirePostPreview\.hasImage\s*\{[\s\S]*aspect-ratio: 4 \/ 3/, "Mobile Grimoire media block should keep a stable 4:3 aspect ratio");
assert.match(grimoireWorkspaceCss, /@media \(max-width: 520px\)[\s\S]*\.profileLiteGrimoireModule \.grimoirePostPreview,[\s\S]*max-height: 170px/, "mobile Grimoire media previews should use a controlled compact cap");
assert.match(grimoireWorkspaceCss, /@media \(max-width: 520px\)[\s\S]*\.profileLiteGrimoireModule \.grimoirePhotoGallery,[\s\S]*max-height: 230px/, "mobile Grimoire galleries should use a controlled compact cap");
assert.doesNotMatch(grimoireWorkspaceCss, /@media \(max-width: 980px\)[\s\S]*\.profileLiteGrimoireModule \.grimoirePostActions\s*\{[\s\S]*grid-template-columns: minmax\(0, 1fr\)/, "Mobile Grimoire post actions should not regress to a full-width stacked side column");

// ── Media module: folder browser applies to both photos and materials ─────────

const mediaModuleSource = readFileSync(join(moduleDir, "ProfileLiteMediaModule.jsx"), "utf8");

assert.match(
  mediaModuleSource,
  /const mediaItems = useMemo/,
  "ProfileLiteMediaModule should build one mediaItems collection from photos and materials"
);

assert.match(
  mediaModuleSource,
  /const visibleItems = useMemo/,
  "ProfileLiteMediaModule should compute visibleItems from the selected folder"
);

assert.match(
  mediaModuleSource,
  /activeFolder\.type === "materials"[\s\S]*item\.kind === "material"/,
  "ProfileLiteMediaModule should keep materials visible only in material/all folders"
);

assert.match(
  mediaModuleSource,
  /profileLiteMediaGrid/,
  "ProfileLiteMediaModule gallery must use profileLiteMediaGrid class"
);

assert.match(
  mediaModuleSource,
  /profileLiteMediaCard/,
  "ProfileLiteMediaModule cards must use profileLiteMediaCard class"
);

assert.match(
  mediaModuleSource,
  /const \[activeFolderId, setActiveFolderId\] = useState\("all-files"\)/,
  "ProfileLiteMediaModule should expose an all-files folder browser state"
);

assert.match(
  mediaModuleSource,
  /onClientPhotoCategoryMove/,
  "ProfileLiteMediaModule should call a category move handler for metadata-only moves"
);

assert.match(
  mediaModuleSource,
  /draggable=\{photoDraggable\}/,
  "ProfileLiteMediaModule should make client photo cards draggable"
);

assert.match(
  mediaModuleSource,
  /option\.proOnly && !isProAccount[\s\S]*Больше клиентов доступно в Pro/,
  "Start plan should keep the Pro client folder disabled with a clear message"
);

assert.match(
  imagePickerSource,
  /clientCategory === "all" \|\| image\.clientCategory === clientCategory \|\| image\.client_category === clientCategory/,
  "ProfileLiteImagePicker visibleImages should filter client-1/client-2/client-3 by saved category"
);

assert.match(
  imagePickerSource,
  /multiple=\{uploadDestination === "materials"\}/,
  "ProfileLiteImagePicker should enable multi-file selection for material uploads"
);

assert.match(
  imagePickerSource,
  /files:\s*selectedFiles/,
  "ProfileLiteImagePicker should pass all selected material files through the upload chain"
);

assert.match(
  imagePickerSource,
  /getUnclassifiedMaterialSelection/,
  "ProfileLiteImagePicker should expose Неразобранно for material upload defaults"
);

assert.match(
  imagePickerSource,
  /getDefaultMaterialFilterSelection/,
  "ProfileLiteImagePicker material browser should default to Все, not the first concrete category"
);

assert.doesNotMatch(
  imagePickerSource,
  /const defaultMaterialSelection = useMemo\(\(\) => normalizeMaterialSelection\("dao-ri"\)/,
  "ProfileLiteImagePicker must not reuse the first concrete ДАО РИ selection for both upload and browsing"
);

assert.match(
  imagePickerSource,
  /value: "all", label: "Все"/,
  "ProfileLiteImagePicker materials browser should render an explicit Все filter option"
);

assert.match(
  imagePickerSource,
  /\{ id: "clients", label: "Клиенты" \}[\s\S]*\{ id: "materials", label: "Материалы" \}[\s\S]*\{ id: "backgrounds", label: "Фон" \}[\s\S]*\{ id: "symbols", label: "Символы" \}[\s\S]*\{ id: "upload", label: "Загрузить своё" \}[\s\S]*\{ id: "all", label: "Все" \}/,
  "ProfileLiteImagePicker source tabs should keep existing tabs and add Все as a top-level source"
);

assert.match(
  imagePickerSource,
  /activeTab === "all"[\s\S]*\[\.\.\.validImages\]\.sort\(newestImagesFirst\)/,
  "ProfileLiteImagePicker Все tab should show all valid image records newest first without category filters"
);

assert.match(
  imagePickerSource,
  /uploadedAt \|\| image\?\.uploaded_at \|\| image\?\.createdAt \|\| image\?\.created_at \|\| image\?\.updatedAt \|\| image\?\.updated_at/,
  "ProfileLiteImagePicker newest-first sorting should prefer upload/create/update timestamps"
);

assert.match(
  imagePickerSource,
  /mode === "cover" \? "backgrounds"/,
  "cover picker should open the real Фон source tab by default"
);

assert.match(
  imagePickerSource,
  /activeTab === "backgrounds"[\s\S]*isBackgroundCompatibleImage[\s\S]*newestImagesFirst/,
  "Фон source should filter background-compatible images and sort newest first"
);

assert.match(
  imagePickerSource,
  /handleSourceTabClick[\s\S]*\["clients", "materials", "backgrounds"\]\.includes\(tabId\)[\s\S]*setUploadDestination\(tabId\)/,
  "selecting Фон should carry the background destination into the upload tab"
);

assert.match(
  imagePickerSource,
  /uploadDestination === "backgrounds"[\s\S]*>Фон<\/button>/,
  "upload destination tabs should include separate Фон uploads"
);

assert.match(
  imagePickerSource,
  /BACKGROUND_UPLOAD_MATERIAL[\s\S]*group: "backgrounds"[\s\S]*subcategory: "Фон места силы"/,
  "background uploads should persist separate background metadata"
);

assert.match(
  imagePickerSource,
  /materialFilterSelection\.group === "all"[\s\S]*sort\(newestImagesFirst\)/,
  "Материалы / Все should show recent uploaded material photos newest first"
);

assert.match(
  imagePickerSource,
  /kind === "power-place-background"[\s\S]*destination === "background"[\s\S]*destination === "backgrounds"[\s\S]*destination === "cover"[\s\S]*\/фон\|обложк\//,
  "Фон source should use existing background/cover metadata instead of a visual-only label"
);

assert.match(
  profileMaterialsClientSource,
  /Неразобранно/,
  "ProfileLiteImagePicker should render the corrected Неразобранно label for material uploads"
);

assert.doesNotMatch(
  imagePickerSource,
  /setClientCategory\("all"\)/,
  "ProfileLiteImagePicker should preserve the selected client folder after upload"
);

assert.match(
  profileMandalaCss,
  /\.profileLiteMediaModule \.profileLiteMediaGrid/,
  "CSS must define grid layout for profileLiteMediaGrid"
);

assert.match(
  profileMandalaCss,
  /\.profileLiteMediaModule \.profileLiteMediaThumb/,
  "CSS must define thumb style for profileLiteMediaThumb"
);

// ─── DAO style selector contract ─────────────────────────────────────────────

assert.match(
  powerPlaceBaseSource,
  /DAO_STYLE_VARIANTS/,
  "Base module must define DAO_STYLE_VARIANTS for the DAO style selector"
);

assert.match(
  powerPlaceBaseSource,
  /daoStyleSelector/,
  "Base module must render daoStyleSelector for DAO constructor type"
);

assert.match(
  powerPlaceBaseSource,
  /mandalaStyleSelector daoStyleSelector/,
  "DAO style selector must carry mandalaStyleSelector class for shared pill button styling"
);

assert.match(
  powerPlaceBaseSource,
  /isDaoConstructorType\(compositionDraft\.constructor_type\)/,
  "DAO style selector must be gated on DAO and DAO layout constructor types"
);

assert.match(
  powerPlaceBaseSource,
  /compositionDraft\.__dao_style/,
  "DAO style selector must read __dao_style from compositionDraft"
);

assert.match(
  powerPlaceBaseSource,
  /const isDaoTalisman1 = daoStyle === "talisman-1"/,
  "Base module must branch on talisman-1 through computed daoStyle"
);

assert.match(
  powerPlaceBaseSource,
  /function renderDaoTalisman1\(\)[\s\S]*daoTalismanScroll/,
  "Base module must render daoTalismanScroll only inside talisman-1 helper"
);

assert.match(
  powerPlaceSource,
  /DAO_STYLE_REF_KEY\s*=\s*"__dao_style"/,
  "Wrapper module must define DAO_STYLE_REF_KEY as __dao_style"
);

assert.match(
  powerPlaceSource,
  /__dao_style:\s*daoStyle/,
  "Wrapper module must pass daoStyle to enhancedDraft as __dao_style"
);

assert.match(
  powerPlaceSource,
  /function daoStyleValue\(/,
  "Wrapper module must define daoStyleValue normalizer"
);

assert.ok(
  powerPlaceSource.includes('objectRefs[DAO_STYLE_REF_KEY] === "dao-layout-template"') &&
    powerPlaceSource.includes('const constructorType = legacyDaoLayoutStyle ? "dao-layout"'),
  "Wrapper module must normalize the legacy DAO layout template style into the dao-layout format"
);

// Talisman must be nested inside daoMandalaSheet — outer surface preserved
assert.match(
  powerPlaceBaseSource,
  /dao-talisman/,
  "daoMandalaSheet must receive dao-talisman modifier class in talisman mode"
);

// daoTalismanScroll is rendered by helper inside daoMandalaSheet selection.
{
  const mandalaSheetIdx = powerPlaceBaseSource.indexOf("daoMandalaSheet");
  const talismanScrollIdx = powerPlaceBaseSource.indexOf("daoTalismanScroll");
  assert.ok(
    mandalaSheetIdx >= 0 && talismanScrollIdx >= 0 && /className=\{daoClassName\} style=\{daoOuterStyle\}[\s\S]*renderDaoTalisman1\(\)/.test(powerPlaceBaseSource),
    "daoTalismanScroll must be routed through the daoMandalaSheet helper selection"
  );
}

// Talisman 1 DAO slot IDs must use dao-${element.id} pattern (dao-water, dao-wood, etc.)
for (const element of ["water", "wood", "fire", "earth", "metal"]) {
  assert.ok(
    powerPlaceBaseSource.includes(`dao-\${element.id}`) || powerPlaceBaseSource.includes(`dao-${element}`),
    `slot id pattern for dao-${element} must be preserved in talisman-1 mode`
  );
}

// Talisman 2 must use dao-talisman-2-${index + 1} node IDs
assert.ok(
  powerPlaceBaseSource.includes("dao-talisman-2-${index + 1}") || powerPlaceBaseSource.includes("`dao-talisman-2-${index + 1}`"),
  "Talisman 2 must generate slot IDs as dao-talisman-2-${index + 1}"
);

assert.ok(
  powerPlaceBaseSource.includes("dao-fulu-${index + 1}") || powerPlaceBaseSource.includes("`dao-fulu-${index + 1}`"),
  "Fulu styles must generate vertical slot IDs as dao-fulu-${index + 1}"
);

assert.match(
  powerPlaceBaseSource,
  /isDaoTalisman2 \|\| isDaoFulu[\s\S]*DAO_TALISMAN_NODE_COUNTS\.map/,
  "DAO node-count selector must be visible for talisman-2 and fulu styles"
);

assert.ok(
  powerPlaceBaseSource.includes("const DAO_LAYOUT_MINI_SLOT_NUMBERS = [3, 4, 5, 7]"),
  "ДАО-Макет must use mini-mandala slots 3,4,5,7 instead of the normal DAO count list"
);

assert.match(
  powerPlaceBaseSource,
  /function renderDaoInnerContentStack\(\)[\s\S]*daoLayoutTemplateCenterArea[\s\S]*renderCenterPhotoWithMode\("daoCenterPhoto"\)[\s\S]*DAO_SHARED_STAGE_MINI_SLOTS\.map/,
  "ДАО-Макет and shared DAO styles must render the central client photo inside the talisman before the mini-mandala stack"
);

assert.match(
  powerPlaceBaseSource,
  /isDaoLayoutTemplate \|\| isDaoSharedStageStyle \? renderDaoSharedStage\(\)[\s\S]*isDaoTalisman2 \? renderDaoTalisman2\(\)/,
  "ДАО-Макет and new DAO styles must use the shared stack without changing the legacy talisman-2 branch"
);

// Talisman 2 must not use DAO_ELEMENTS.slice
assert.ok(
  !powerPlaceBaseSource.match(/talisman-2[\s\S]{0,300}DAO_ELEMENTS\.slice/),
  "Talisman 2 must not use DAO_ELEMENTS.slice for node generation"
);

{
  const style1Branch = powerPlaceBaseSource.slice(powerPlaceBaseSource.indexOf("function renderDaoStyle1()"), powerPlaceBaseSource.indexOf("function renderDaoTalisman1()"));
  const talisman1Branch = powerPlaceBaseSource.slice(powerPlaceBaseSource.indexOf("function renderDaoTalisman1()"), powerPlaceBaseSource.indexOf("function renderDaoTalisman2()"));
  const talisman2Branch = powerPlaceBaseSource.slice(powerPlaceBaseSource.indexOf("function renderDaoTalisman2()"), powerPlaceBaseSource.indexOf("function renderDaoFulu()"));
  const fuluBranch = powerPlaceBaseSource.slice(powerPlaceBaseSource.indexOf("function renderDaoFulu()"), powerPlaceBaseSource.indexOf("function renderDaoFuOutlineLayout()"));
  const outlineBranch = powerPlaceBaseSource.slice(powerPlaceBaseSource.indexOf("function renderDaoSharedStage()"), powerPlaceBaseSource.indexOf("const daoClassName"));

  assert.match(style1Branch, /daoUsinCore/, "style-1 helper must keep classic DAO core");
  assert.doesNotMatch(style1Branch, /daoFuluContourLayer|daoTalismanScroll|daoTalisman2Scroll/, "style-1 helper must not render other DAO style layers");
  assert.match(talisman1Branch, /daoTalismanScroll[\s\S]*daoTalismanBody/, "talisman-1 helper must keep its circular frame/body");
  assert.doesNotMatch(talisman1Branch, /daoFuluContourLayer|daoTalisman2Scroll|daoUsinCore/, "talisman-1 helper must not render other DAO style layers");
  assert.match(talisman2Branch, /daoTalisman2Scroll[\s\S]*dao-talisman-2-\$\{index \+ 1\}/, "talisman-2 helper must keep generated vertical nodes");
  assert.doesNotMatch(talisman2Branch, /daoFuluContourLayer|daoTalismanBody|daoUsinCore/, "talisman-2 helper must not render other DAO style layers");
  assert.match(fuluBranch, /daoFuluContourLayer/, "fulu helper must render the contour layer");
  assert.match(fuluBranch, /compositionDraft\.__dao_talisman_node_count[\s\S]*daoFuluNodeColumn/, "fulu helper must render the counted vertical node column");
  assert.doesNotMatch(fuluBranch, /daoTalismanScroll|daoTalismanBody|daoUsinCore/, "fulu helper must not render old DAO or talisman layers");
  assert.match(outlineBranch, /renderDaoFieldBackgroundLayer\("daoSharedFieldLayer"\)[\s\S]*renderDaoInnerContentStack\(\)[\s\S]*renderDaoTalismanOverlay\(config\)/, "DAO outline helper must render field, inner stack, and contour through the shared stage");
  assert.doesNotMatch(outlineBranch, /daoFuluContourLayer|daoTalismanScroll|daoTalismanBody|daoUsinCore/, "DAO outline helper must not render old DAO, fulu, or talisman layers");
}

assert.match(
  profileMandalaCss,
  /\.profileLitePowerPlace \.powerMandalaPanel \.daoMandalaSheet\.dao-fu-paper-slip,[\s\S]*width: min\(calc\(var\(--power-field-scale, 96%\) \* 2\.28\), 58vw\) !important;/,
  "mobile fulu styles must keep Размер поля wired to actual rendered width"
);

assert.match(
  profileMandalaCss,
  /\.daoFuluCenterArea \.daoCenterPhoto \{[\s\S]*width: clamp\(52px, 32%, 78px\) !important;[\s\S]*aspect-ratio: 1 \/ 1 !important;[\s\S]*border-radius: 50% !important;/,
  "fulu center photo must stay readable, round, and square instead of collapsing or stretching"
);

assert.match(
  profileMandalaCss,
  /\.daoMandalaSheet\.dao-shared-stage \.daoLayoutTemplateCenterArea \.daoCenterPhoto \{[\s\S]*aspect-ratio: 1 \/ 1 !important;[\s\S]*border-radius: 50% !important;/,
  "DAO outline center photo must be readable, round, and square"
);

// Legacy "talisman" value must map to talisman-1 in wrapper daoStyleValue
assert.ok(
  powerPlaceSource.includes('"talisman" || value === "talisman-1"') ||
  (powerPlaceSource.includes('"talisman"') && powerPlaceSource.includes('"talisman-1"')),
  "daoStyleValue must map legacy 'talisman' to 'talisman-1'"
);

// DAO_STYLE_VARIANTS must use talisman-1, not talisman
assert.ok(
  powerPlaceBaseSource.includes('"talisman-1"') && !powerPlaceBaseSource.includes('{ value: "talisman"'),
  "DAO_STYLE_VARIANTS must use talisman-1 value, not legacy talisman"
);

// daoMandalaSheet (style-1) must still exist — not replaced
assert.match(
  powerPlaceBaseSource,
  /daoMandalaSheet/,
  "daoMandalaSheet must still be present for style-1 (existing style must not be removed)"
);

console.log("Profile Lite cabinet contract: all assertions passed.");

// ── Visibility settings module contract ──────────────────────────────────────
assert.match(powerPlaceBaseSource, /__visibility_settings/, "PowerPlaceModuleBase must reference __visibility_settings key");
assert.doesNotMatch(powerPlaceBaseSource, /renderVisibilitySettingsModule/, "PowerPlaceModuleBase must not render a separate right-sidebar visibility module");
assert.doesNotMatch(powerPlaceBaseSource, /Показать\/Скрыть/, "PowerPlaceModuleBase must not include the old separate Показать/Скрыть panel label");
assert.doesNotMatch(powerPlaceBaseSource, /visibilitySettingsPanel/, "PowerPlaceModuleBase must not include the old visibilitySettingsPanel class");
assert.match(powerPlaceBaseSource, /inlineVisibilityScaleToggle/, "PowerPlaceModuleBase must render visibility toggles inline with scale controls");
assert.match(powerPlaceBaseSource, /Центр мандалы/, "PowerPlaceModuleBase must include Центр мандалы toggle label");
assert.match(powerPlaceBaseSource, /Мини-мандалы/, "PowerPlaceModuleBase must include Мини-мандалы toggle label");
assert.match(powerPlaceBaseSource, /Фон снаружи/, "PowerPlaceModuleBase must include Фон снаружи toggle label");
assert.match(powerPlaceBaseSource, /Фон внутри/, "PowerPlaceModuleBase must include Фон внутри toggle label");
assert.match(powerPlaceBaseSource, /label: "Размер окон"[\s\S]*visibilityKey: "slots"[\s\S]*visibilityLabel: "Мини-мандалы"/, "Размер окон must inline the slots visibility toggle");
assert.match(powerPlaceBaseSource, /label: "Размер поля"[\s\S]*visibilityKey: "inner_cover"[\s\S]*visibilityLabel: "Фон внутри"/, "Размер поля must inline the inner cover visibility toggle");
assert.match(powerPlaceBaseSource, /label: "Размер центра"[\s\S]*visibilityKey: "center"[\s\S]*visibilityLabel: "Центр мандалы"/, "Размер центра must inline the center visibility toggle");
assert.match(powerPlaceBaseSource, /label: "Масштаб фото"[\s\S]*visibilityKey: "center"[\s\S]*visibilityLabel: "Центр мандалы"/, "Масштаб фото must inline the center visibility toggle");
assert.match(powerPlaceBaseSource, /coverOuterVisibilityToggle[\s\S]*setVisibilitySetting\("outer_cover"/, "outer cover visibility must remain next to the cover selector");
assert.match(powerPlaceBaseSource, /power-place-hide-center/, "PowerPlaceModuleBase must apply power-place-hide-center class");
assert.match(powerPlaceBaseSource, /power-place-hide-slots/, "PowerPlaceModuleBase must apply power-place-hide-slots class");
assert.match(powerPlaceBaseSource, /power-place-hide-outer-cover/, "PowerPlaceModuleBase must apply power-place-hide-outer-cover class");
assert.match(powerPlaceBaseSource, /power-place-hide-inner-cover/, "PowerPlaceModuleBase must apply power-place-hide-inner-cover class");
assert.match(powerPlaceBaseSource, /function coverToneClass\(cover\)/, "PowerPlaceModuleBase must centralize cover class generation");
assert.doesNotMatch(powerPlaceBaseSource, /cover-\$\{innerCover\?\.tone \|\| "gold"\}/, "Без фона must not fall back to cover-gold");
assert.match(powerPlaceBaseSource, /coverToneClass\(innerCover\)/, "inner cover render paths must use coverToneClass");
assert.match(profileMandalaCss, /\.profileLitePowerPlace \.powerMandala\.cover-none,[\s\S]*\.profileLitePowerPlace \.power-place-chess\.cover-none,[\s\S]*background: transparent !important;[\s\S]*background-image: none !important;[\s\S]*background-color: transparent !important;/, "cover-none must be fully transparent in the scoped Power Place CSS");
assert.match(profileMandalaCss, /\.powerMandalaPanel\.power-place-hide-inner-cover \.businessMandalaSheet,[\s\S]*background: transparent !important;[\s\S]*background-color: transparent !important;/, "hidden inner cover must clear full background on all inner constructor surfaces");
assert.match(profileMandalaCss, /\.profileLitePowerPlace \.inlineVisibilityScaleToggle/, "inline visibility toggle CSS must exist");
assert.match(profileMandalaCss, /\.profileLitePowerPlace \.sourceSlotScaleControl > input\[type="range"\]/, "slider range inputs must remain aligned without stretching inline checkboxes");

// ── Power Place preview slot labels ──────────────────────────────────────────

for (const [pattern, label] of [
  [/<b>\{slot\.label\}<\/b>/, "generic slot labels"],
  [/<b>\{element\.label\}<\/b>/, "DAO element labels"],
  [/<b>\{node\.label\}<\/b>/, "DAO node labels"],
  [/<b>\{resolvedSlot\.label\}<\/b>/, "DAO shared mini-slot labels"],
  [/<b>\{`Окно \$\{slotNumber\}`\}<\/b>/, "DAO outline window labels"],
  [/<b>\{vertex\.label\}<\/b>/, "business vertex labels"]
]) {
  assert.doesNotMatch(
    powerPlaceBaseSource,
    pattern,
    `Power Place preview must not render visible ${label} inside the composition`
  );
}

for (const requiredAccessiblePattern of [
  /title=\{slot\.label\}/,
  /aria-label=\{`Выбрать \$\{slot\.label\.toLowerCase\(\)\}`\}/,
  /title=\{element\.label\}/,
  /aria-label=\{`Выбрать элемент \$\{element\.label\}`\}/
]) {
  assert.match(
    powerPlaceBaseSource,
    requiredAccessiblePattern,
    "Power Place preview must keep title and aria-label names for slot buttons"
  );
}

// ── Zodiac 2 format contract ──────────────────────────────────────────────────

assert.match(
  powerPlaceBaseSource,
  /ZODIAC_2_VARIANT/,
  "Base module must define ZODIAC_2_VARIANT constant"
);

assert.match(
  powerPlaceBaseSource,
  /zodiac-2-12/,
  "Base module must use zodiac-2-12 as the Zodiac 2 variant value"
);

assert.match(
  powerPlaceBaseSource,
  /Зодиак 2/,
  "ZODIAC_VARIANTS must include a Зодиак 2 label for the selector UI"
);

assert.match(
  powerPlaceBaseSource,
  /Зодиак 1/,
  "ZODIAC_VARIANTS must include a Зодиак 1 label (renamed from classic-12)"
);

assert.match(
  powerPlaceBaseSource,
  /buildZodiac2InnerSlots/,
  "Base module must define a dynamic Zodiac 2 inner slot builder"
);

assert.match(
  powerPlaceBaseSource,
  /zodiac-inner-\$\{|`zodiac-inner-|"zodiac-inner-/,
  "Zodiac 2 inner slot builder must generate slot ids with zodiac-inner- prefix"
);

assert.match(
  powerPlaceBaseSource,
  /function buildZodiac2InnerSlots\(count\)/,
  "Zodiac 2 inner slots must be generated from the selected visible count"
);

assert.match(
  powerPlaceBaseSource,
  /function getZodiacRingPosition\(index,\s*count,\s*radius\)/,
  "Zodiac 2 must use a shared ring-position helper for count-aware inner/outer geometry"
);

assert.match(
  powerPlaceBaseSource,
  /const ZODIAC_2_OUTER_RADIUS\s*=\s*43/,
  "Zodiac 2 outer ring radius must be explicit and close to the legacy outer CSS ring"
);

assert.match(
  powerPlaceBaseSource,
  /const ZODIAC_2_INNER_RADIUS\s*=\s*31/,
  "Zodiac 2 inner ring radius must be explicit and keep inner slots near the center without overlapping it"
);

assert.doesNotMatch(
  powerPlaceBaseSource,
  /ZODIAC_2_INNER_SLOTS\s*=\s*Array\.from\(\{\s*length:\s*12\s*\}/,
  "Zodiac 2 inner slots must not be hardcoded to 12"
);

assert.doesNotMatch(
  powerPlaceBaseSource,
  /baseVisibleCount\s*=\s*zodiac2\s*\?\s*12\s*:\s*visibleCount/,
  "Zodiac 2 outer slots must use zodiac_visible_count instead of forcing 12"
);

assert.match(
  powerPlaceBaseSource,
  /if \(zodiac2\) return \[\.\.\.signSlots, \.\.\.buildZodiac2InnerSlots\(visibleCount\)\]/,
  "Zodiac 2 must render the same number of inner slots as the selected visible count"
);

assert.match(
  powerPlaceBaseSource,
  /ZODIAC_COUNT_OPTIONS/,
  "Zodiac count choices must be separate from the Zodiac 1 / Zodiac 2 format choice"
);

assert.match(
  powerPlaceBaseSource,
  /ZODIAC_FORMAT_VARIANTS/,
  "Zodiac format choices must allow Zodiac 1 / Zodiac 2 without resetting the selected count"
);

assert.match(
  powerPlaceBaseSource,
  /isZodiac2Variant/,
  "Base module must define isZodiac2Variant helper function"
);

assert.match(
  powerPlaceBaseSource,
  /zodiac-2-format/,
  "Zodiac JSX must apply zodiac-2-format class on zodiacMandalaSheet when isZodiac2"
);

assert.match(
  powerPlaceBaseSource,
  /zodiacInnerPosition/,
  "Zodiac JSX must render zodiacInnerPosition elements for inner ring slots"
);

// ── Star 1 / Star 2 format contract ─────────────────────────────────────────

assert.match(
  powerPlaceBaseSource,
  /STAR_2_VARIANT/,
  "Base module must define STAR_2_VARIANT constant for the new Star 2 format"
);

assert.match(
  powerPlaceBaseSource,
  /star-2-10/,
  "Base module must use a stable star-2-10 variant value for Star 2"
);

assert.match(
  powerPlaceBaseSource,
  /STAR_FORMAT_VARIANTS[\s\S]*Звезда 1[\s\S]*Звезда 2/,
  "Star format selector must expose Звезда 1 and Звезда 2 labels"
);

assert.match(
  powerPlaceBaseSource,
  /star_format_variant/,
  "Star 1 / Star 2 must use a dedicated star_format_variant field instead of overloading star_variant"
);

assert.match(
  powerPlaceBaseSource,
  /STAR_ADDITIONAL_POINTS/,
  "Star 2 must define five additional mandala slots separately from the existing five ray slots"
);

assert.match(
  powerPlaceBaseSource,
  /if \(isStar2Format\(draft\.star_format_variant\)\) return \[\.\.\.starSlots, \.\.\.STAR_ADDITIONAL_POINTS/,
  "Star 2 slot list must return the five existing star slots plus the five additional slots"
);

assert.match(
  powerPlaceBaseSource,
  /aria-label="Формат звезды"[\s\S]*STAR_FORMAT_VARIANTS[\s\S]*onCompositionDraftChange\("star_format_variant"/,
  "Star controls must include a dedicated format selector that writes star_format_variant"
);

assert.match(
  powerPlaceBaseSource,
  /aria-label="Вариант звезды"[\s\S]*STAR_VARIANTS[\s\S]*onCompositionDraftChange\("star_variant"/,
  "Closed/open Star visual subtype must remain a separate star_variant selector"
);

assert.match(
  powerPlaceBaseSource,
  /star-2-format/,
  "Star JSX must apply star-2-format class when Star 2 is active"
);

assert.match(
  powerPlaceBaseSource,
  /starAdditionalPosition/,
  "Star JSX must render Star 2 additional slots with a separate wrapper class"
);

assert.match(
  powerPlaceBaseSource,
  /const innerPos = getZodiacRingPosition\(index,\s*zodiacVisibleCount,\s*ZODIAC_2_INNER_RADIUS\)[\s\S]*className=\{`zodiacInnerPosition[\s\S]*style=\{innerPos\}/,
  "Zodiac 2 inner wrappers must receive count-aware inline positions"
);

assert.match(
  powerPlaceBaseSource,
  /const outerPos = isZodiac2 \? getZodiacRingPosition\(index,\s*zodiacVisibleCount,\s*ZODIAC_2_OUTER_RADIUS\) : undefined[\s\S]*className=\{`zodiacPosition[\s\S]*style=\{outerPos\}/,
  "Zodiac 2 outer wrappers must use the same count-aware angle grid as the inner ring"
);

assert.match(
  powerPlaceBaseSource,
  /zodiac-inner-[\s\S]*zodiac-inner-/,
  "Inner slot render must filter slots starting with zodiac-inner-"
);

assert.doesNotMatch(
  powerPlaceBaseSource,
  /constructor_type.*===.*"zodiac2"|"zodiac2".*===.*constructor_type/,
  "zodiac2 must NOT be a separate constructor_type — it must remain within zodiac"
);

{
  const outerFilterMatch = powerPlaceBaseSource.match(/slot\.id\.startsWith\(["']zodiac-inner-["']\)/);
  assert.ok(
    outerFilterMatch,
    "Outer zodiac slot map must exclude zodiac-inner- slots via startsWith filter"
  );
}

console.log("Zodiac 2 format contract: all assertions passed.");

// ── Zodiac style selector contract ───────────────────────────────────────────

assert.match(
  powerPlaceBaseSource,
  /ZODIAC_STYLE_REF_KEY/,
  "Base module must define ZODIAC_STYLE_REF_KEY constant"
);

assert.match(
  powerPlaceBaseSource,
  /ZODIAC_STYLE_REF_KEY\s*=\s*"__zodiac_style"/,
  "ZODIAC_STYLE_REF_KEY must equal __zodiac_style"
);

assert.match(
  powerPlaceBaseSource,
  /ZODIAC_STYLE_VARIANTS/,
  "Base module must define ZODIAC_STYLE_VARIANTS array"
);

assert.match(
  powerPlaceBaseSource,
  /ZODIAC_STYLE_VARIANTS[\s\S]*"sun"[\s\S]*"stars"[\s\S]*"ribbon"/,
  "ZODIAC_STYLE_VARIANTS must include sun, stars, and ribbon values in order"
);

assert.match(
  powerPlaceBaseSource,
  /function zodiacStyleValue\(/,
  "Base module must define zodiacStyleValue normalizer function"
);

assert.match(
  powerPlaceBaseSource,
  /zodiacStyleSelector/,
  "Base module must render zodiacStyleSelector UI"
);

assert.match(
  powerPlaceBaseSource,
  /Стиль зодиака/,
  "Zodiac style selector must include Стиль зодиака label"
);

assert.match(
  powerPlaceBaseSource,
  /constructor_type.*===.*"zodiac"[\s\S]*zodiacStyleSelector|zodiacStyleSelector[\s\S]*constructor_type.*===.*"zodiac"/,
  "Zodiac style selector must be gated on constructor_type === zodiac"
);

assert.match(
  powerPlaceSource,
  /ZODIAC_STYLE_REF_KEY\s*=\s*"__zodiac_style"/,
  "Wrapper module must define ZODIAC_STYLE_REF_KEY as __zodiac_style"
);

assert.match(
  powerPlaceSource,
  /__zodiac_style:\s*zodiacStyle/,
  "Wrapper module must pass zodiacStyle to enhancedDraft as __zodiac_style"
);

assert.match(
  powerPlaceSource,
  /function zodiacStyleValue\(/,
  "Wrapper module must define zodiacStyleValue normalizer"
);

assert.doesNotMatch(
  powerPlaceBaseSource,
  /constructor_type.*===.*"zodiac-style"|"zodiac-style".*===.*constructor_type/,
  "zodiac style must NOT introduce a new constructor_type"
);

console.log("Zodiac style selector contract: all assertions passed.");
