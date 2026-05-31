import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const profilePageSource = readFileSync("src/pages/ProfilePage.jsx", "utf8");
const bootstrapClientSource = readFileSync("src/lib/profileBootstrapClient.js", "utf8");

function assertOrder(source, first, second, message) {
  const firstIndex = source.indexOf(first);
  const secondIndex = source.indexOf(second);
  assert.notEqual(firstIndex, -1, `${message}: missing ${first}`);
  assert.notEqual(secondIndex, -1, `${message}: missing ${second}`);
  assert.ok(firstIndex < secondIndex, message);
}

assert.match(
  profilePageSource,
  /const \[authStatus, setAuthStatus\] = useState\(supabaseEnv\.isConfigured \? "loading" : "idle"\);/,
  "old /profile should start in loading only when Supabase is configured"
);

assert.match(
  profilePageSource,
  /const nextSession = storeSessionFromUrlHash\(\);[\s\S]*setSession\(\(currentSession\) =>/,
  "old /profile should restore a stored or URL hash session before bootstrap"
);

assert.match(
  profilePageSource,
  /loadProfileCabinetBootstrap\(\{[\s\S]*session,[\s\S]*getCurrentUser,/,
  "old /profile should bootstrap through the proven current-user auth path"
);

assertOrder(
  profilePageSource,
  "setUser(currentUser);",
  'setAuthStatus("ready");',
  "old /profile must apply currentUser before opening the cabinet"
);

assert.match(
  profilePageSource,
  /if \(isStoredSessionExpired\(session\)\) \{[\s\S]*resetProfileSessionState\("Сессия устарела\. Войдите заново\."\);/,
  "expired sessions should be cleared and return to login state"
);

assert.match(
  profilePageSource,
  /if \(err\?\.code === "auth_load_timeout"\) \{[\s\S]*setAuthStatus\("error"\);[\s\S]*setError\(sanitizeDebugMessage/,
  "getCurrentUser timeout/error should finish loading with a safe error state"
);

assert.match(
  profilePageSource,
  /if \(isExpiredOrInvalidAuthError\(err\)\) \{[\s\S]*resetProfileSessionState\(err\?\.message \|\| "Сессия устарела\. Войдите заново\."\);/,
  "invalid auth errors should clear the stored session"
);

assert.match(
  profilePageSource,
  /\{user && authStatus === "ready" && \(/,
  "cabinet render should require the applied user and completed auth state"
);

assert.match(
  bootstrapClientSource,
  /function normalizeCurrentUser\(value\) \{[\s\S]*value\?\.id[\s\S]*value\?\.user\?\.id[\s\S]*value\?\.data\?\.user\?\.id/,
  "bootstrap should accept direct, { user }, and { data: { user } } getCurrentUser response shapes"
);

for (const rawSecretPattern of [
  /<dd>\{sessionAccessToken\}<\/dd>/,
  /<pre>\{JSON\.stringify\(session/,
  /access_token: session\?\.access_token/
]) {
  assert.equal(
    rawSecretPattern.test(profilePageSource),
    false,
    "old /profile must not render stored tokens or raw session data"
  );
}
