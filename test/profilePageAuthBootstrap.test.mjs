import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const profilePageSource = readFileSync("src/pages/ProfilePage.jsx", "utf8");
const bootstrapClientSource = readFileSync("src/lib/profileBootstrapClient.js", "utf8");
const renderRecoverySource = readFileSync("public/profile-auth-render-recovery.js", "utf8");
const indexHtml = readFileSync("index.html", "utf8");

function assertOrder(source, first, second, message) {
  const firstIndex = source.indexOf(first);
  const secondIndex = source.indexOf(second);
  assert.notEqual(firstIndex, -1, `${message}: missing ${first}`);
  assert.notEqual(secondIndex, -1, `${message}: missing ${second}`);
  assert.ok(firstIndex < secondIndex, message);
}

function assertNearbyExcludes(source, marker, forbidden, message) {
  const markerIndex = source.indexOf(marker);
  assert.notEqual(markerIndex, -1, `${message}: missing ${marker}`);
  const snippet = source.slice(markerIndex, markerIndex + 700);
  assert.equal(snippet.includes(forbidden), false, message);
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

assert.equal(
  /loadProfileCabinetBootstrap\(\{[\s\S]*getOwnProfile,/.test(profilePageSource),
  false,
  "old /profile recovery bootstrap should not pass getOwnProfile as a blocking dependency"
);

assert.equal(
  /\bgetOwnProfile\b/.test(bootstrapClientSource),
  false,
  "profile recovery bootstrap client should not require own-profile loading to open the shell"
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
  /const hasAuthenticatedUser = Boolean\(user\?\.id\);/,
  "old /profile should derive authenticated render state from a valid user id"
);

assert.match(
  profilePageSource,
  /const shouldShowCabinet = hasAuthenticatedUser;/,
  "cabinet shell should not require authStatus ready once a user id exists"
);

assert.match(
  profilePageSource,
  /const shouldShowInitialLoading = !hasAuthenticatedUser && authStatus === "loading" && !loadingTimedOut;/,
  "initial loading gate should be blocked only while no authenticated user id exists"
);

assert.match(
  profilePageSource,
  /const shouldShowRecovery = !hasAuthenticatedUser && loadingTimedOut;/,
  "recovery gate should be blocked only while no authenticated user id exists"
);

assert.match(
  profilePageSource,
  /const shouldShowLogin = !hasAuthenticatedUser && authStatus !== "loading" && !loadingTimedOut;/,
  "login gate should be blocked only while no authenticated user id exists"
);

assert.match(
  profilePageSource,
  /\{shouldShowCabinet && \(/,
  "authenticated cabinet shell should render from shouldShowCabinet"
);

assert.match(
  profilePageSource,
  /cabinetCondition: shouldShowCabinet,/,
  "React debug cabinetCondition should use the same user-id cabinet rule"
);

assert.match(
  profilePageSource,
  /routeName:[\s\S]*"profile-old"/,
  "old /profile debug should identify the /profile-old route with a safe boolean"
);

assert.match(
  profilePageSource,
  /profileOld:/,
  "old /profile debug should publish a safe profileOld boolean"
);

for (const checkpoint of [
  "before-bootstrap-call",
  "session-shell-opened",
  "user-request-started",
  "fallback-used",
  "user-request-resolved",
  "before-set-user",
  "after-set-user",
  "after-set-profile",
  "after-auth-ready",
  "first-cabinet-render-attempt"
]) {
  assert.match(
    `${profilePageSource}\n${bootstrapClientSource}`,
    new RegExp(checkpoint.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")),
    `old /profile debug should publish checkpoint ${checkpoint}`
  );
}

assert.match(
  profilePageSource,
  /renderGateOpen: shouldShowCabinet,/,
  "old /profile debug should expose a safe renderGateOpen boolean"
);

assert.equal(
  /Boolean\(user && authStatus === "ready"\)/.test(profilePageSource),
  false,
  "old /profile must not keep the authStatus-ready cabinet gate"
);

assert.match(
  profilePageSource,
  /setSecondaryDataNotice\(/,
  "secondary profile/material/media failures should render an inline cabinet warning"
);

assert.match(
  profilePageSource,
  /activeTopTab === "services"[\s\S]*profile_cabinet_services[\s\S]*inline smoke mode/,
  "old /profile services tab should render an inline smoke notice instead of a blank or blocking module"
);

assert.match(
  profilePageSource,
  /activeTopTab === "orders"[\s\S]*profile_cabinet_service_orders[\s\S]*не возвращать весь heavy cabinet в полноэкранную загрузку/,
  "old /profile orders tab should render an inline smoke notice instead of a blank or blocking module"
);

for (const marker of [
  "Материалы не загрузились:",
  "Места силы не загрузились:",
  "Медиа традиции не загрузились:"
]) {
  assertNearbyExcludes(
    profilePageSource,
    marker,
    'setAuthStatus("loading")',
    "secondary module failures must not force the heavy cabinet back into global loading"
  );
}

assert.match(
  profilePageSource,
  /setLoadingTimedOut\(true\)/,
  "profile loading should have a finite timeout recovery state"
);

assert.match(
  bootstrapClientSource,
  /function normalizeCurrentUser\(value\) \{[\s\S]*value\?\.id[\s\S]*value\?\.user\?\.id[\s\S]*value\?\.data\?\.user\?\.id/,
  "bootstrap should accept direct, { user }, and { data: { user } } getCurrentUser response shapes"
);

assert.match(
  renderRecoverySource,
  /const renderRecoveryEnabled = search\.get\("enableRenderRecovery"\) === "1";/,
  "profile render recovery must be explicitly opt-in"
);

assert.equal(
  indexHtml.includes("profile-auth-render-recovery"),
  false,
  "profile-auth-render-recovery.js must not be loaded by index.html because it creates path-sensitive /profile reload behavior"
);

assert.match(
  renderRecoverySource,
  /if \(window\.location\.pathname !== "\/profile" \|\| !renderRecoveryEnabled\) return;/,
  "profile render recovery must not auto-run on /profile without the opt-in flag"
);

assert.equal(
  /window\.location\.pathname !== "\/profile"\) return;/.test(renderRecoverySource),
  false,
  "profile render recovery must not keep the old unconditional exact-/profile gate"
);

assert.match(
  renderRecoverySource,
  /window\.location\.replace\(url\.toString\(\)\);/,
  "profile render recovery may still preserve its old replace behavior only behind the explicit opt-in gate"
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
