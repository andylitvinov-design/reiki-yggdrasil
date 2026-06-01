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

assert.match(mainSource, /import ProfileLitePage from "\.\/pages\/ProfileLitePage\.jsx";/);
assert.match(mainSource, /import ProfilePage from "\.\/pages\/ProfilePage\.jsx";/);

assertRouteMapsTo("/profile", "ProfileLitePage");
assertRouteMapsTo("/profile-lite", "ProfileLitePage");
assertRouteMapsTo("/profile-old", "ProfilePage");
assertRouteMapsTo("/profile/admin", "AdminPage");
assertRouteMapsTo("/masters", "MastersPage");

assert.equal(
  /if \(path === "\/profile"\) \{[\s\S]*?return <ProfilePage\b/.test(mainSource),
  false,
  "/profile must not route back to the old heavy ProfilePage"
);

assert.ok(
  vercelConfig.rewrites.some((rewrite) => rewrite.source === "/profile-lite" && rewrite.destination === "/"),
  "vercel.json should rewrite /profile-lite to the SPA root"
);

assert.ok(
  vercelConfig.rewrites.some((rewrite) => rewrite.source === "/profile-old" && rewrite.destination === "/"),
  "vercel.json should rewrite /profile-old to the SPA root"
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
