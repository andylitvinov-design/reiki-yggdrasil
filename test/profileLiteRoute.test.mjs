import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const mainSource = readFileSync("src/main.jsx", "utf8");
const vercelConfig = JSON.parse(readFileSync("vercel.json", "utf8"));
const profilePageSource = readFileSync("src/pages/ProfilePage.jsx", "utf8");
const profileLiteSource = readFileSync("src/pages/ProfileLitePage.jsx", "utf8");

function assertRouteMapsTo(path, componentName) {
  assert.match(
    mainSource,
    new RegExp(`if \\(path === "${path.replace("/", "\\/")}"\\) \\{[\\s\\S]*?return <${componentName}\\b`),
    `${path} should render ${componentName}`
  );
}

function assertRouteMapsToProfileLiteTab(path, initialTab) {
  assert.match(
    mainSource,
    new RegExp(`if \\(path === "${path.replace("/", "\\/")}"\\) \\{[\\s\\S]*?return <ProfileLitePage\\b[^>]*initialTab="${initialTab}"`),
    `${path} should render ProfileLitePage with initialTab="${initialTab}"`
  );
}

function assertProfilePageHasKey(path, expectedKey) {
  assert.match(
    mainSource,
    new RegExp(`if \\(path === "${path.replace(/\//g, "\\/")}"\\) \\{[\\s\\S]*?return <ProfilePage\\b[^>]*key="${expectedKey}"`),
    `${path} must render ProfilePage with key="${expectedKey}" so React remounts on navigation`
  );
}

assert.match(mainSource, /import ProfileLitePage from "\.\/pages\/ProfileLitePage\.jsx";/);
assert.match(mainSource, /import ProfilePage from "\.\/pages\/ProfilePage\.jsx";/);

assertRouteMapsTo("/profile", "ProfileLitePage");
assertRouteMapsTo("/profile-lite", "ProfileLitePage");
assertRouteMapsTo("/profile-old", "ProfilePage");
assertProfilePageHasKey("/profile-old", "profile-old");
assertRouteMapsToProfileLiteTab("/profile/mandalas", "mandalas");
assertRouteMapsToProfileLiteTab("/profile/services", "services");
assertRouteMapsToProfileLiteTab("/profile/orders", "orders");
assertRouteMapsToProfileLiteTab("/profile/chats", "chats");
assertRouteMapsToProfileLiteTab("/profile/settings", "settings");
assertRouteMapsTo("/profile/admin", "AdminPage");
assertRouteMapsTo("/masters", "MastersPage");

assert.ok(
  /if \(path === "\/profile-lite"\) \{[\s\S]*?return <ProfileLitePage\b/.test(mainSource),
  "/profile-lite must remain the lightweight fallback route"
);

assert.ok(
  /if \(path === "\/profile-old"\) \{[\s\S]*?return <ProfilePage\b/.test(mainSource),
  "/profile-old must remain the heavy diagnostic alias"
);

for (const [path, initialTab] of [
  ["/profile/mandalas", "mandalas"],
  ["/profile/services", "services"],
  ["/profile/orders", "orders"],
  ["/profile/chats", "chats"],
  ["/profile/settings", "settings"]
]) {
  assertRouteMapsToProfileLiteTab(path, initialTab);
}

assert.ok(
  vercelConfig.rewrites.some((rewrite) => rewrite.source === "/profile-lite" && rewrite.destination === "/"),
  "vercel.json should rewrite /profile-lite to the SPA root"
);

assert.ok(
  vercelConfig.rewrites.some((rewrite) => rewrite.source === "/profile-old" && rewrite.destination === "/"),
  "vercel.json should rewrite /profile-old to the SPA root"
);

for (const path of [
  "/profile/mandalas",
  "/profile/services",
  "/profile/orders",
  "/profile/chats",
  "/profile/settings"
]) {
  assert.ok(
    vercelConfig.rewrites.some((rewrite) => rewrite.source === path && rewrite.destination === "/"),
    `vercel.json should rewrite ${path} to the SPA root`
  );
}

assert.match(
  profilePageSource,
  /export default function ProfilePage\(\{ onNavigateHome, onNavigateMasters, initialTopTab = "power-place" \}\)/,
  "ProfilePage should accept a safe default initialTopTab prop"
);

assert.match(
  profilePageSource,
  /const \[activeTopTab, setActiveTopTab\] = useState\(initialTopTab\);/,
  "ProfilePage should use initialTopTab only as the initial activeTopTab state"
);

assert.match(profilePageSource, /href="\/profile-lite"/);
assert.match(profilePageSource, /Открыть простой кабинет/);

for (const forbidden of [
  "access_token",
  "refresh_token",
  "VITE_SUPABASE_URL",
  "VITE_SUPABASE_ANON_KEY",
  "service_role",
  "service-role"
]) {
  assert.equal(
    profileLiteSource.includes(forbidden),
    false,
    `ProfileLitePage.jsx must not include ${forbidden}`
  );
}
