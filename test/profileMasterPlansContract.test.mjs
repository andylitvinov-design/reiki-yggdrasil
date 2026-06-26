import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const profileLitePageSource = readFileSync("src/pages/ProfileLitePage.jsx", "utf8");
const profileModuleSource = readFileSync("src/pages/profile-lite/ProfileLiteProfileModule.jsx", "utf8");
const settingsModuleSource = readFileSync("src/pages/profile-lite/ProfileLiteSettingsModule.jsx", "utf8");
const powerPlaceClientSource = readFileSync("src/lib/powerPlaceClient.js", "utf8");
const profileLiteClientSource = readFileSync("src/lib/profileLiteClient.js", "utf8");
const profileCabinetCss = readFileSync("src/profileCabinet.css", "utf8");
const masterPlansSource = readFileSync("src/lib/masterPlans.js", "utf8");

assert.match(profileLiteClientSource, /resolveProfileMasterPlan/, "Profile Lite form should use shared plan resolver for owner/admin defaults");
assert.match(profileLiteClientSource, /supabaseEnv\.adminEmail/, "Profile Lite form should derive the owner/admin default from VITE_ADMIN_EMAIL metadata only");
assert.match(profileLiteClientSource, /account_plan:\s*normalizeMasterPlan/, "Profile Lite save payload should normalize Start / Practic / Master");

assert.match(profileLitePageSource, /const accountPlan = resolveProfileMasterPlan\(/, "ProfileLitePage should derive the active plan through shared Start/Practic/Master helper");
assert.match(profileLitePageSource, /canCreateWithinPlanLimit\([^)]*"compositions"/, "Save-new should use shared entitlement helper for saved template limits");
assert.match(profileLitePageSource, /canCreateWithinPlanLimit\([^)]*"clientPhotos"/, "Photo save should use shared entitlement helper for client/photo limits");

assert.match(powerPlaceClientSource, /MASTER_PLAN_CONFIG/, "Power Place client should expose Start / Practic / Master plan config");
assert.match(powerPlaceClientSource, /normalizeMasterPlan/, "Power Place client should normalize legacy plan values through the shared helper");
assert.doesNotMatch(powerPlaceClientSource, /normalizeAccountPlan\(plan\) === "pro"/, "Power Place limits must not keep Pro-only branch logic");

assert.match(profileModuleSource, /MASTER_PLAN_CONFIG\.map/, "Profile module should render the visible three-plan switcher from config");
assert.match(profileModuleSource, /Режим кабинета|Тариф мастера/, "Profile module should label the plan switcher in Russian");
assert.match(profileModuleSource, /getMasterPlanPaymentLink/, "Profile module should use frontend-safe payment links for paid plan CTA");
assert.match(masterPlansSource, /VITE_PRACTIC_PAYMENT_LINK[\s\S]*VITE_MASTER_PAYMENT_LINK/, "Payment bridge should reference only public Vite payment-link env names");
assert.match(settingsModuleSource, /getMasterPlan\(profile\?\.account_plan/, "Settings should display the normalized cabinet plan label");
assert.match(profileCabinetCss, /\.masterPlanSwitcher/, "Profile cabinet CSS should style the responsive plan switcher");

console.log("profileMasterPlansContract: all assertions passed.");
