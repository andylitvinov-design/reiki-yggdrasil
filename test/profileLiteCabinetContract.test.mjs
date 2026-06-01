import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import {
  createProfileLiteDiagnostics,
  createProfileLiteForm,
  createProfileLiteSavePayload,
  createProfileLiteShellViewModel,
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

assert.equal(getProfileLiteTabById("missing").id, "overview");
assert.equal(getProfileLiteTabById("orders").label, "Заказы");

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
const profileLitePageSource = readFileSync("src/pages/ProfileLitePage.jsx", "utf8");

for (const requiredPowerPlaceText of [
  "Мастерская мандал",
  "Место силы",
  "Мои мандалы",
  "Загрузить сохранённое место силы",
  "Добавить мандалу",
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
  "Нужна signed URL",
  "Загрузить новое фото",
  "Удалить фото из базы?"
]) {
  assert.match(imagePickerSource, new RegExp(requiredPickerText.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")), `ProfileLiteImagePicker should include ${requiredPickerText}`);
}

assert.match(imagePickerSource, /onSelect\(image\)/, "picker cards should select images directly");
assert.match(imagePickerSource, /await onUpload\(file\)/, "picker upload should wait for the parent upload flow before closing");
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
