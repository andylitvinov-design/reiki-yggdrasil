import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const mainSource = readFileSync("src/main.jsx", "utf8");
const vercelConfig = JSON.parse(readFileSync("vercel.json", "utf8"));
const profilePageSource = readFileSync("src/pages/ProfilePage.jsx", "utf8");
const profileLiteSource = readFileSync("src/pages/ProfileLitePage.jsx", "utf8");

assert.match(mainSource, /import ProfileLitePage from "\.\/pages\/ProfileLitePage\.jsx";/);
assert.match(mainSource, /path === "\/profile-lite"/);
assert.match(mainSource, /<ProfileLitePage/);

assert.ok(
  vercelConfig.rewrites.some((rewrite) => rewrite.source === "/profile-lite" && rewrite.destination === "/"),
  "vercel.json should rewrite /profile-lite to the SPA root"
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
