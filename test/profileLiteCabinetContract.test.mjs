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
  ["mandalas", "Мастерская"],
  ["profile", "Профиль"],
  ["media", "Фото / Медиа"],
  ["materials", "Гримуар"],
  ["services", "Услуги"],
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
    ["profile", "/profile?tab=profile"],
    ["media", "/profile?tab=media"],
    ["materials", "/profile?tab=materials"],
    ["services", "/profile/services"],
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
assert.equal(getProfileLiteRouteByTabId("services"), "/profile/services");
assert.equal(getProfileLiteRouteByTabId("orders"), "/profile/orders");
assert.equal(getProfileLiteRouteByTabId("chats"), "/profile/chats");
assert.equal(getProfileLiteRouteByTabId("settings"), "/profile/settings");
assert.equal(getProfileLiteRouteByTabId("diagnostics"), "/profile?tab=diagnostics");
assert.equal(getProfileLiteRouteByTabId("media"), "/profile?tab=media");
assert.equal(getProfileLiteInitialTabFromLocation("/profile", ""), "mandalas");
assert.equal(getProfileLiteInitialTabFromLocation("/profile-lite", ""), "mandalas");
assert.equal(getProfileLiteInitialTabFromLocation("/profile/mandalas", ""), "mandalas");
assert.equal(getProfileLiteInitialTabFromLocation("/profile", "?tab=profile"), "profile");
assert.equal(getProfileLiteInitialTabFromLocation("/profile", "?tab=diagnostics"), "diagnostics");
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
const powerPlaceClientSource = readFileSync("src/lib/powerPlaceClient.js", "utf8");
const profileServicesClientSource = readFileSync("src/lib/profileServicesClient.js", "utf8");
const profileServicesModuleSource = readFileSync(join(moduleDir, "ProfileLiteServicesModule.jsx"), "utf8");
const profileServicesManagerSource = `${profileServicesModuleSource}\n${profileServicesClientSource}`;
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
  "Услуги",
  "Источники силы",
  "Добавить фото",
  "Добавить в мои услуги",
  "В услугах ✓",
  "Пока нет мандал, добавленных в услуги.",
  "Группа",
  "Категория",
  "Подкатегория / Ступень",
  "Фон места силы",
  "Фон внутри",
  "Фон снаружи",
  "Отчёт",
  "Анализ",
  "Размер окон",
  "Размер фоток",
  "Размер поля",
  "Размер центра",
  "Сохранённые мандалы",
  "Объекты композиции",
  "Сохранить мандалу",
  "Перенести в услуги",
  "Опубликовать как услугу",
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
assert.match(powerPlaceSource, /POWER_PLACE_DRAG_PAYLOAD_TYPE = "application\/x-reiki-power-place-source"/, "Power Place DnD should use a scoped compact payload MIME type");
assert.match(powerPlaceSource, /function buildPowerPlaceDragPayload\(/, "Power Place source cards should build a compact drag payload");
assert.match(powerPlaceSource, /function parsePowerPlaceDragPayload\(/, "Power Place drops should parse drag payloads defensively");
assert.match(powerPlaceSource, /const assignPowerPlaceSlotImage = \(/, "Power Place slot assignment should be shared by dropdowns, picker, and drops");
assert.match(powerPlaceSource, /const getPowerPlaceSlotDropHandlers = \(/, "Power Place slots should expose shared drop target handlers");
assert.match(powerPlaceSource, /const openCoverPickerForLayer = \(layer\) => \{[\s\S]*setCoverLayerMode\(layer\)[\s\S]*openPicker\("cover"\)/, "the existing cover picker helper should remain available for the choose-photo button");
assert.doesNotMatch(powerPlaceSource, /renderCoverDropIcon|coverDropIconRow|coverDropIconButton/, "duplicate cover drop icon row should be removed from the React module");
assert.match(powerPlaceSource, /className=\{`coverLayerTabButton[\s\S]*coverLayerMode === "inner"[\s\S]*dragOverSlotId === "cover_ref\.inner"[\s\S]*power-place-slot--drag-over[\s\S]*onClick=\{\(\) => setCoverLayerMode\("inner"\)\}[\s\S]*aria-label="Фон внутри\. Можно перетащить фото"[\s\S]*title="Фон внутри\. Можно перетащить фото"[\s\S]*getPowerPlaceSlotDropHandlers\("cover_ref\.inner"\)/, "existing inner cover tab should be the cover_ref.inner drop target without opening the picker");
assert.match(powerPlaceSource, /className=\{`coverLayerTabButton[\s\S]*coverLayerMode === "outer"[\s\S]*dragOverSlotId === "cover_ref\.outer"[\s\S]*power-place-slot--drag-over[\s\S]*onClick=\{\(\) => setCoverLayerMode\("outer"\)\}[\s\S]*aria-label="Фон снаружи\. Можно перетащить фото"[\s\S]*title="Фон снаружи\. Можно перетащить фото"[\s\S]*getPowerPlaceSlotDropHandlers\("cover_ref\.outer"\)/, "existing outer cover tab should be the cover_ref.outer drop target without opening the picker");
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
assert.match(powerPlaceSource, /style=\{centerImageStyle\}/, "center photo renderer should receive the independent center image scale style");
assert.match(profileMandalaCss, /--power-center-image-scale/, "Mandala workspace CSS should include independent center photo scaling");
assert.match(powerPlaceSource, /CENTER_FRAME_SCALE_REF_KEY = "__center_frame_scale"/, "center frame/window scale should persist through object_refs without a schema change");
assert.match(powerPlaceSource, /__center_frame_scale: centerFrameScale/, "center frame/window scale should be passed through enhanced draft only");
assert.match(powerPlaceSource, /Размер окон[\s\S]*field: "slot_scale"[\s\S]*Размер поля[\s\S]*field: "field_scale"[\s\S]*Размер центра[\s\S]*field: "__center_frame_scale"[\s\S]*Размер фоток[\s\S]*field: "__center_image_scale"/, "Power Place constructor controls should map slot-window, field, center, and photo-content sliders to distinct fields");
assert.equal((powerPlaceBaseSource.match(/renderScaleControl\(\{ className: "sourceSlotScaleControl"/g) || []).length, 1, "Размер окон slider should render once from the base module");
assert.equal((powerPlaceBaseSource.match(/renderScaleControl\(\{ className: "photoScaleControl"/g) || []).length, 1, "Размер фоток slider should render once from the base module");
assert.equal((powerPlaceBaseSource.match(/renderScaleControl\(\{ className: "innerFieldScaleControl"/g) || []).length, 1, "Размер поля slider should render once from the base module");
assert.equal((powerPlaceBaseSource.match(/renderScaleControl\(\{ className: "centerFrameScaleControl"/g) || []).length, 1, "Размер центра slider should render once from the base module");
assert.match(profileMandalaCss, /\.profileLitePowerPlace \.sourceSlotScaleControl,[\s\S]*\.profileLitePowerPlace \.innerFieldScaleControl,[\s\S]*\.profileLitePowerPlace \.centerFrameScaleControl,[\s\S]*\.profileLitePowerPlace \.photoScaleControl \{[\s\S]*grid-template-columns: minmax\(140px, 190px\) 28px minmax\(180px, 1fr\) 28px;/, "all four size sliders should share the requested desktop grid");
assert.match(profileMandalaCss, /@media \(max-width: 640px\)[\s\S]*\.profileLitePowerPlace \.sourceSlotScaleControl,[\s\S]*grid-template-columns: minmax\(0, 1fr\) 28px minmax\(110px, 1fr\) 28px;/, "all four size sliders should share the requested mobile grid");
assert.match(profileMandalaCss, /@media \(max-width: 980px\)[\s\S]*\.profileLitePowerPlace \.powerLayoutPanel\.compactFieldLayoutSwitch \{[\s\S]*order: 1 !important;/, "source CSS should keep compact layout controls above the background card on mobile");
assert.match(powerPlaceSource, /powerSavedMandalaSelect[\s\S]*placeholder: "Сохранённые мандалы"|<option value="">\s*Сохранённые мандалы\s*<\/option>/, "saved mandala select should expose the fixed placeholder");
assert.match(powerPlaceSource, /compositionMessage[\s\S]*compactNotice/, "composition message should remain a compact message below controls/select");
assert.match(powerPlaceSource, />Сохранить мандалу<\/button>[\s\S]*>Перенести в услуги<\/button>[\s\S]*>Опубликовать как услугу<\/button>/, "Power Place actions should expose the three Phase 1 mandala-service buttons");
assert.match(powerPlaceBaseSource, /<label className="compositionTitleField">[\s\S]*Название мандалы[\s\S]*<input className="compositionTitleInput"[\s\S]*<\/label>[\s\S]*<div className="powerPlaceActions">[\s\S]*>Сохранить мандалу<\/button>/, "Power Place title field should appear before action buttons in the DOM contract");
assert.doesNotMatch(profileMandalaCss, /\.profileLitePowerPlace \.powerPlaceActions\s*\{[^}]*?(?<![a-z])order\s*:/, "mobile CSS must not reorder the Power Place action button group above the title field");
assert.match(powerPlaceBaseSource, /const handleSaveNewClick = \(\) => \{[\s\S]*if \(saveNewDisabled\)[\s\S]*return;[\s\S]*onSaveNew\(\);[\s\S]*\}/, "Save button should use an explicit click wrapper that calls onSaveNew only when enabled");
assert.match(powerPlaceBaseSource, /<button className="cabinetPrimary powerPlaceSaveButton"[\s\S]*onClick=\{handleSaveCompositionClick\}[\s\S]*disabled=\{!compositionDraft\.id && saveNewDisabled\}[\s\S]*>Сохранить мандалу<\/button>/, "Save mandala button should create new drafts or update the opened composition");
assert.doesNotMatch(powerPlaceBaseSource, /<div className="powerPlaceActions">[\s\S]*<span>[\s\S]*сохранённых мест силы[\s\S]*<\/span>[\s\S]*<\/div>/, "saved-count text must not be a raw inline span inside the clickable actions row");
assert.match(powerPlaceBaseSource, /<p className="powerPlaceActionsMeta"[\s\S]*\{savedCompositionCount\}\/\{savedCompositionLimit\} сохранённых мест силы/, "saved-count text should render as a dedicated meta block below action buttons");
assert.match(profileMandalaCss, /\.profileLitePowerPlace \.powerPlaceActions button:disabled[\s\S]*cursor: not-allowed[\s\S]*opacity:/, "Power Place disabled action buttons should have obvious scoped disabled styling");
assert.match(profileMandalaCss, /\.profileLitePowerPlace \.powerPlaceActionsMeta[\s\S]*width: 100%[\s\S]*pointer-events: none/, "Power Place saved-count meta should not be able to cover or intercept action buttons");
assert.match(profileMandalaCss, /\.profileLitePowerPlace \.profileLitePowerPlaceActions > \.powerPlaceActions \{[\s\S]*order: 2 !important;[\s\S]*\.profileLitePowerPlace \.profileLitePowerPlaceActions > \.profileLitePowerPlaceActionFeedback \{[\s\S]*order: 3;[\s\S]*\.profileLitePowerPlace \.profileLitePowerPlaceActions > \.powerPlaceActionsMeta \{[\s\S]*order: 4;/, "Profile Lite action card should force buttons, stage feedback, then saved-count meta even when public mobile hotfixes assign action order");
assert.match(powerPlaceBaseSource, /powerPlacePrintArea[\s\S]*renderPowerPlaceActions\(\)[\s\S]*reportAdded/, "Power Place actions should render in the central mandala area before report output");
assert.match(profileLitePageSource, /handleCompositionSaveNew/, "Profile Lite page should split composition create into handleCompositionSaveNew");
assert.match(profileLitePageSource, /const message = "Сначала сохраните профиль мастера\.";[\s\S]*setMandalasError\(message\);[\s\S]*setCompositionMessage\(powerPlaceSaveFailureMessage\("profile", \{ message \}, message\)\);/, "Save preflight failure should render near the Power Place action controls as a visible staged composition message");
assert.match(profileLitePageSource, /handleCompositionUpdateExisting/, "Profile Lite page should split composition update into handleCompositionUpdateExisting");
assert.match(profileLitePageSource, /createPowerPlaceComposition\(\s*\{\s*\.\.\.createPayload\s*,\s*id:\s*undefined\s*\}|delete createPayload\.id/, "Save should create a new composition without preserving draft id");
assert.match(profileLitePageSource, /копия/, "Duplicate saved mandala titles should be saved as copy titles");
assert.match(profileLitePageSource, /Сначала откройте сохранённую мандалу/, "Update without an existing composition should show the required message");
assert.match(profileLitePageSource, /updatePowerPlaceComposition\(compositionDraft\.id/, "Update should call updatePowerPlaceComposition for the current saved composition");
assert.match(profileLitePageSource, /Лимит 7 сохранённых мандал достигнут/, "Save-new should show a clear RU limit message before backend create");
assert.match(profileLitePageSource, /currentSavedCompositionCount[\s\S]*powerPlaceCompositions\.length[\s\S]*currentCompositionLimit[\s\S]*planLimits\.compositions[\s\S]*currentSavedCompositionCount >= currentCompositionLimit[\s\S]*return;[\s\S]*createPowerPlaceComposition/, "Save-new should return before createPowerPlaceComposition when saved mandalas reach the current plan limit");
assert.match(profileLitePageSource, /handleCompositionUpdateExisting[\s\S]*updatePowerPlaceComposition\(compositionDraft\.id/, "Update existing should keep using updatePowerPlaceComposition even when the save-new limit guard exists");
assert.match(powerPlaceBaseSource, /const savedCompositionCount = powerPlaceCompositions\.length[\s\S]*const savedCompositionLimit = planLimits\.compositions[\s\S]*const saveNewDisabled = savedCompositionCount >= savedCompositionLimit && !compositionDraft\.id/, "Power Place UI should compute the saved-count limit and disable save-new only for unsaved drafts at the limit");
assert.match(powerPlaceBaseSource, /saveNewAriaLabel[\s\S]*disabled=\{!compositionDraft\.id && saveNewDisabled\}[\s\S]*aria-label=\{compositionDraft\.id \? "Сохранить мандалу" : saveNewAriaLabel\}[\s\S]*>Сохранить мандалу<\/button>/, "Save mandala button should remain visible but disabled with an explanatory label at the 7/7 limit for unsaved drafts");
assert.match(powerPlaceSource, /\{savedCompositionCount\}\/\{savedCompositionLimit\} сохранённых мест силы/, "Power Place UI should show count text like 7/7 сохранённых мест силы");
for (const servicesManagerText of [
  "Черновики",
  "Опубликованные",
  "Архив",
  "Опубликовать",
  "Вернуть в черновик",
  "Архивировать",
  "С подписью мастера",
  "Без подписи мастера",
  "Две версии",
  "Ссылка появится после публикации",
  "Публичная ссылка будет доступна после подключения маршрута /services/:serviceId",
  "Услуга в архиве. Публичная ссылка отключена."
]) {
  assert.match(profileServicesManagerSource, new RegExp(servicesManagerText.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")), `/profile/services should include ${servicesManagerText}`);
}
assert.match(profileServicesModuleSource, /onServiceSelect[\s\S]*serviceForm[\s\S]*selectedServiceId/, "services manager should support selecting a service and editing it in the form");
assert.match(profileLitePageSource, /updateOwnService\(serviceForm\.id/, "saving an existing selected service should PATCH the existing service");
assert.match(profileLitePageSource, /handleServiceStatusChange[\s\S]*published[\s\S]*draft[\s\S]*archived/, "services manager should expose safe publish/draft/archive status actions");
assert.match(powerPlaceSource, /!reportEnabled \? null :|reportEnabled && \(/, "Без отчёта should hide the lower report body fields and actions");
assert.match(powerPlaceBaseSource, /renderFieldLayoutSelector\(\)[\s\S]*<div className="coverSelector coverPickerPanel"[\s\S]*renderReportModule\(\)/, "right column should render layout controls above background and report below background");
assert.doesNotMatch(powerPlaceSource, /Макет|макет/, "Profile Lite Power Place UI should not show the word Макет");
assert.doesNotMatch(powerPlaceSource, /className="resourceComparisonPanel"/, "resource comparison mini-block should not be visible in the React report/settings UI");
assert.doesNotMatch(powerPlaceSource, /<span className="cabinetStatus">\{mediaStatus\}<\/span>/, "Power Place header should not show raw media status text");
assert.match(powerPlaceSource, /has-custom-inner-cover/, "inner custom covers should be rendered through React-owned classes");
assert.match(powerPlaceSource, /has-custom-outer-cover/, "outer custom covers should be rendered through React-owned classes");
assert.match(powerPlaceSource, /workspaceTab === "services"/, "Power Place workshop should expose an internal services tab");
assert.match(powerPlaceSource, /services \|\| \[\]\)\.filter\(\(service\) => String\(service\?\.composition_id/, "internal services tab should list only services linked by composition_id");
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
assert.doesNotMatch(profileLitePageSource, /создание image material без миграции пока не подтверждено/, "material image upload should no longer be blocked by the old placeholder error");
assert.doesNotMatch(powerPlaceSource, /MutationObserver/, "Profile Lite React module must not introduce MutationObserver");
assert.doesNotMatch(profileLitePageSource, /MutationObserver/, "Profile Lite page must not introduce MutationObserver");
assert.doesNotMatch(powerPlaceBaseSource, /startImageReposition|clampImageOffset|__center_image_offset_x|__inner_cover_offset_x|__outer_cover_offset_x|onPointerDown|onPointerMove|onPointerUp|imageOffsetStyle/, "cover drop icon UI must not reintroduce pointer repositioning or offset persistence in the edited base module");
assert.doesNotMatch(powerPlaceSource, /startImageReposition|clampImageOffset|onPointerDown|onPointerMove|onPointerUp|imageOffsetStyle/, "cover drop icon PR must not reintroduce pointer repositioning handlers");
assert.doesNotMatch(layoutFinalFix, /tuneInnerCoverArrows|nudgeInnerCover|coverOffsetCornerGroup|↖|↗|↙|↘/, "public Profile Lite layout fix should not inject legacy diagonal inner-cover arrows");

// Part A: in-mandala cover drop targets
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
// No pan/zoom keys or pointer repositioning introduced
assert.doesNotMatch(powerPlaceBaseSource, /__center_image_offset_x|__center_image_offset_y|__center_image_zoom/, "Part A must not introduce center image pan/zoom persistence keys");
assert.doesNotMatch(powerPlaceBaseSource, /onPointerDown|onPointerMove|onPointerUp/, "Part A must not introduce pointer pan/zoom handlers");

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

assert.match(layoutFinalFix, /preferMandalasRoute/, "layout fix should prefer mandalas on bare profile route");
assert.match(layoutFinalFix, /window\.location\.search \|\| window\.location\.hash/, "mandalas default redirect should leave callback/query URLs untouched");
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

// --- C: Услуги internal workshop tab ---
assert.match(powerPlaceBaseSource, /onAddCompositionToServices/, "ProfileLitePowerPlaceModuleBase should accept onAddCompositionToServices prop");
assert.match(powerPlaceBaseSource, /Добавить в мои услуги/, "composition cards in Мои мандалы should expose the add-to-services button");
assert.match(powerPlaceBaseSource, /Эта мандала уже есть в Моих услугах/, "add-to-services button should be disabled with the required message when already in services");
assert.match(powerPlaceBaseSource, /workspaceTab === "services" \? renderServicesTab\(\)/, "workspace should expose a dedicated internal Услуги tab");
assert.match(powerPlaceBaseSource, /Пока нет мандал, добавленных в услуги/, "empty Услуги tab should show the required placeholder text");
assert.match(powerPlaceBaseSource, /\(services \|\| \[\]\)\.filter\(\(service\) => String\(service\?\.composition_id/, "Услуги tab should filter services by composition_id");
assert.match(profileLitePageSource, /handleSendCompositionToServices/, "ProfileLitePage should expose handleSendCompositionToServices");
assert.match(profileLitePageSource, /handlePublishCompositionAsService/, "ProfileLitePage should expose handlePublishCompositionAsService");
assert.match(profileLitePageSource, /saveCompositionForServiceAction/, "service actions should save or update the composition before creating a service");
assert.match(profileLitePageSource, /upsertOwnServiceForComposition/, "service actions should reuse the service for profile_id + composition_id");
assert.match(profileLitePageSource, /setActiveTab\("services"\)/, "service transfer/publish actions should open the /profile/services tab");
assert.match(profileLitePageSource, /Мандала уже добавлена в услуги/, "add-to-services duplicate guard should show the required message");
assert.match(profileLitePageSource, /Мандала добавлена в услуги/, "successful add-to-services should show the required confirmation message");
assert.match(profileServicesClientSource, /composition_id: compositionId/, "add-to-services should pass composition_id through the shared upsert helper");
assert.match(powerPlaceBaseSource, /Сохранить мандалу/, "Power Place actions should expose explicit save-only button text");
assert.match(powerPlaceBaseSource, /Перенести в услуги/, "Power Place actions should expose explicit transfer-to-services button text");
assert.match(powerPlaceBaseSource, /Опубликовать как услугу/, "Power Place actions should expose explicit publish-as-service button text");
assert.match(powerPlaceBaseSource, /onPublishAsService/, "Power Place module should accept a dedicated publish-as-service handler");

// --- C2: Services manager Phase 1 grouping and public-link honesty ---
const servicesModuleSource = readFileSync(join(moduleDir, "ProfileLiteServicesModule.jsx"), "utf8");
assert.match(servicesModuleSource, /Черновики/, "Services module should group drafts under Черновики");
assert.match(servicesModuleSource, /Опубликованные/, "Services module should group published services under Опубликованные");
assert.match(servicesModuleSource, /Архив/, "Services module should group archived services under Архив");
assert.match(profileServicesManagerSource, /Ссылка появится после публикации/, "Draft services should not show an active public link");
assert.match(profileServicesManagerSource, /Публичная ссылка будет доступна после подключения маршрута \/services\/:serviceId/, "Published services should not show a fake public link before /services/:serviceId exists");
assert.doesNotMatch(servicesModuleSource, /Скопировать ссылку/, "Phase 1 should not expose copy link before the public service route exists");
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

// --- E: Grimoire tab (issue #273) ---
const grimoireModuleSource = readFileSync(join(moduleDir, "ProfileLiteMaterialsModule.jsx"), "utf8");

assert.match(grimoireModuleSource, /Гримуар мастера/, "Grimoire hero should say 'Гримуар мастера'");
assert.match(grimoireModuleSource, /Соберите фото, статьи, практики, аудио и документы\. Сначала загрузите всё без структуры, потом разложите по категориям\./, "Grimoire hero should explain the collect-first workflow");
assert.match(grimoireModuleSource, /Без категории[\s\S]*Готово к работе/, "Grimoire hero should expose uncategorized and ready-to-work stats");
assert.match(grimoireModuleSource, /Фильтр гримуара/, "Grimoire left column should say 'Фильтр гримуара'");
assert.match(grimoireModuleSource, /Записи гримуара/, "Grimoire center column should say 'Записи гримуара'");
assert.match(grimoireModuleSource, /Загрузить в гримуар/, "Grimoire right column should say 'Загрузить в гримуар'");
assert.match(grimoireModuleSource, /type="file"[\s\S]*multiple/, "Grimoire uploader should be a multi-file input");
assert.match(grimoireModuleSource, /Перетащите файлы сюда или выберите с телефона/, "Grimoire uploader should expose a clear drop-zone instruction");
assert.match(grimoireModuleSource, /selectedFiles/, "Grimoire uploader should keep selected files before upload");
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
assert.match(profileLitePageSource, /handleGrimoireUpdate/, "ProfileLitePage should expose handleGrimoireUpdate");
assert.match(profileLitePageSource, /handleGrimoireDelete/, "ProfileLitePage should expose handleGrimoireDelete");
assert.match(profileLitePageSource, /deleteOwnMaterial/, "ProfileLitePage should import deleteOwnMaterial");
assert.match(profileLitePageSource, /updateOwnMaterial/, "ProfileLitePage should import updateOwnMaterial");
assert.match(profileLitePageSource, /detectMaterialTypeFromFile/, "ProfileLitePage should use detectMaterialTypeFromFile for grimoire uploads");
assert.match(profileLitePageSource, /stripFileExtension/, "ProfileLitePage should use stripFileExtension for grimoire title derivation");

const profileMaterialsClientSource = readFileSync("src/lib/profileMaterialsClient.js", "utf8");
assert.match(profileMaterialsClientSource, /export.*GRIMOIRE_CATEGORIES/, "profileMaterialsClient.js should export GRIMOIRE_CATEGORIES");
assert.match(profileMaterialsClientSource, /export function detectMaterialTypeFromFile/, "profileMaterialsClient.js should export detectMaterialTypeFromFile");
assert.match(profileMaterialsClientSource, /export function stripFileExtension/, "profileMaterialsClient.js should export stripFileExtension");
assert.match(profileMaterialsClientSource, /export async function updateOwnMaterial/, "profileMaterialsClient.js should export updateOwnMaterial");
assert.match(profileMaterialsClientSource, /export async function deleteOwnMaterial/, "profileMaterialsClient.js should export deleteOwnMaterial");

const profileMediaClientSource = readFileSync("src/lib/profileMediaClient.js", "utf8");
assert.match(profileMediaClientSource, /export function validateGrimoireFile/, "profileMediaClient.js should export validateGrimoireFile");
assert.match(profileMediaClientSource, /audio\/mpeg/, "PROFILE_MEDIA_ALLOWED_TYPES should include audio/mpeg for grimoire");
assert.match(profileMediaClientSource, /application\/pdf/, "PROFILE_MEDIA_ALLOWED_TYPES should include application/pdf for grimoire");

const grimoireMigration = readFileSync("supabase/migrations/20260605120000_grimoire_publication_types.sql", "utf8");
assert.match(grimoireMigration, /uncategorized.*photo.*article.*document.*audio/, "Grimoire migration should add uncategorized, photo, article, document, audio type values");

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

assert.match(profileMandalaCss, /@media \(max-width: 768px\)[\s\S]*\.profileLiteGrimoireModule \.grimoireUploaderColumn\s*\{[\s\S]*order: 1/, "mobile grimoire should show uploader first");
assert.match(profileMandalaCss, /@media \(max-width: 768px\)[\s\S]*\.profileLiteGrimoireModule \.grimoireFilterSidebar\s*\{[\s\S]*order: 2/, "mobile grimoire should show filters second");
assert.match(profileMandalaCss, /@media \(max-width: 768px\)[\s\S]*\.profileLiteGrimoireModule \.workspaceCenterColumn\s*\{[\s\S]*order: 3/, "mobile grimoire should show records third");

console.log("Profile Lite cabinet contract: all assertions passed.");
