import assert from "node:assert/strict";

import {
  loadPowerPlaceOptionalData,
  loadProfileCabinetBootstrap,
  normalizeProfileRecord,
  runBackgroundUserVerification
} from "../src/lib/profileBootstrapClient.js";

const RECOVERY_NOTICE_PATTERN = /базовом режиме|без ожидания дополнительных данных/;

function assertRecoveryNotice(result) {
  assert.equal(result.currentProfile, null);
  assert.equal(result.notices.length, 1);
  assert.match(result.notices[0], RECOVERY_NOTICE_PATTERN);
}

function base64UrlEncodeJson(value) {
  return Buffer.from(JSON.stringify(value), "utf8")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function fakeJwt(payload) {
  return [
    base64UrlEncodeJson({ alg: "none", typ: "JWT" }),
    base64UrlEncodeJson(payload),
    "signature"
  ].join(".");
}

let noSessionCurrentUserCalled = false;
const noSession = await loadProfileCabinetBootstrap({
  session: null,
  getCurrentUser: async () => {
    noSessionCurrentUserCalled = true;
    throw new Error("should not run");
  }
});

assert.deepEqual(noSession, { currentUser: null, currentProfile: null, notices: [] });
assert.equal(noSessionCurrentUserCalled, false);

const currentUserSteps = [];
const currentUserOnly = await loadProfileCabinetBootstrap({
  session: { access_token: "token-1" },
  getCurrentUser: async () => ({ id: "user-1", email: "master@example.com" }),
  getOwnProfile: undefined,
  timeoutMs: 20,
  onStep: (step) => currentUserSteps.push(step)
});

assert.equal(currentUserOnly.currentUser.id, "user-1");
assertRecoveryNotice(currentUserOnly);
assert.equal(currentUserSteps.includes("fallback-used"), false);
assert.equal(currentUserSteps.includes("profile-request-started"), false);
assert.equal(currentUserSteps.includes("profile-request-skipped-for-recovery"), true);

let ownProfileCalled = false;
const currentUserProfileSkippedSteps = [];
const currentUserProfileSkipped = await loadProfileCabinetBootstrap({
  session: { access_token: "token-profile" },
  getCurrentUser: async () => ({ id: "user-profile", email: "master@example.com" }),
  getOwnProfile: async () => {
    ownProfileCalled = true;
    throw new Error("profile request should not run during recovery bootstrap");
  },
  timeoutMs: 20,
  onStep: (step) => currentUserProfileSkippedSteps.push(step)
});

assert.equal(ownProfileCalled, false);
assert.equal(currentUserProfileSkipped.currentUser.id, "user-profile");
assertRecoveryNotice(currentUserProfileSkipped);
assert.deepEqual(currentUserProfileSkippedSteps, [
  "started",
  "user-request-started",
  "user-request-resolved",
  "user-has-id",
  "profile-request-skipped-for-recovery"
]);

const wrappedCurrentUser = await loadProfileCabinetBootstrap({
  session: { access_token: "token-wrapped" },
  getCurrentUser: async () => ({ user: { id: "user-wrapped", email: "wrapped@example.com" } }),
  timeoutMs: 20
});

assert.equal(wrappedCurrentUser.currentUser.id, "user-wrapped");
assert.equal(wrappedCurrentUser.currentUser.email, "wrapped@example.com");
assertRecoveryNotice(wrappedCurrentUser);

const timeoutError = await loadProfileCabinetBootstrap({
  session: { access_token: "token-2" },
  getCurrentUser: () => new Promise(() => {}),
  timeoutMs: 20
}).catch((error) => error);

assert.equal(timeoutError.code, "auth_load_timeout");
assert.equal(timeoutError.details?.status, 408);
assert.equal(timeoutError.details?.timeout, true);
assert.match(timeoutError.message, /Вход не отвечает/);

const fallbackSession = {
  access_token: fakeJwt({ sub: "user-from-token", email: "fallback@example.com" })
};
const fastFallbackSteps = [];
const fastFallbackStartedAt = Date.now();
const fastFallbackUser = await loadProfileCabinetBootstrap({
  session: fallbackSession,
  getCurrentUser: () => new Promise(() => {}),
  timeoutMs: 500,
  fallbackTimeoutMs: 20,
  onStep: (step) => fastFallbackSteps.push(step)
});

assert.equal(fastFallbackUser.currentUser.id, "user-from-token");
assert.equal(fastFallbackUser.currentUser.source, "session-jwt-fallback");
assert.ok(Date.now() - fastFallbackStartedAt < 50, "JWT session-shell-opened should not wait for any auth timeout");
assert.equal(fastFallbackSteps.includes("session-shell-opened"), true);
assert.equal(fastFallbackSteps.includes("fallback-used"), false);
assert.equal(fastFallbackSteps.includes("profile-request-started"), false);

const fallbackUser = await loadProfileCabinetBootstrap({
  session: fallbackSession,
  getCurrentUser: () => new Promise(() => {}),
  timeoutMs: 20
});

assert.equal(fallbackUser.currentUser.id, "user-from-token");
assert.equal(fallbackUser.currentUser.email, "fallback@example.com");
assert.equal(fallbackUser.currentUser.source, "session-jwt-fallback");
assert.equal(fallbackUser.currentProfile, null);
assert.deepEqual(fallbackUser.notices, []);

const fastNoFallbackStartedAt = Date.now();
const fastNoFallbackTimeoutError = await loadProfileCabinetBootstrap({
  session: { access_token: "not-a-parseable-jwt" },
  getCurrentUser: () => new Promise(() => {}),
  timeoutMs: 500,
  fallbackTimeoutMs: 20
}).catch((error) => error);

assert.equal(fastNoFallbackTimeoutError.code, "auth_load_timeout");
assert.equal(fastNoFallbackTimeoutError.details?.status, 408);
assert.equal(fastNoFallbackTimeoutError.details?.timeout, true);
assert.ok(Date.now() - fastNoFallbackStartedAt < 200, "missing JWT fallback should still fail on the short recovery timeout");

const quickDirectSteps = [];
const quickDirectUser = await loadProfileCabinetBootstrap({
  session: fallbackSession,
  getCurrentUser: async () => ({ id: "direct-user", email: "direct@example.com" }),
  timeoutMs: 500,
  fallbackTimeoutMs: 20,
  onStep: (step) => quickDirectSteps.push(step)
});

assert.equal(quickDirectUser.currentUser.id, "user-from-token");
assert.equal(quickDirectUser.currentUser.source, "session-jwt-fallback");
assert.equal(quickDirectSteps.includes("session-shell-opened"), true);
assert.equal(quickDirectSteps.includes("fallback-used"), false);

const malformedCurrentUserFallback = await loadProfileCabinetBootstrap({
  session: fallbackSession,
  getCurrentUser: async () => ({ email: "missing-id@example.com" }),
  timeoutMs: 20
});

assert.equal(malformedCurrentUserFallback.currentUser.id, "user-from-token");
assert.equal(malformedCurrentUserFallback.currentUser.source, "session-jwt-fallback");
assert.equal(malformedCurrentUserFallback.currentProfile, null);

const missingIdFallbackUser = await loadProfileCabinetBootstrap({
  session: fallbackSession,
  getCurrentUser: async () => ({ aud: "authenticated" }),
  timeoutMs: 20
});

assert.equal(missingIdFallbackUser.currentUser.id, "user-from-token");

const userIdFallbackSession = {
  access_token: fakeJwt({ user_id: "user-id-from-token" })
};
const missingIdUserIdFallbackUser = await loadProfileCabinetBootstrap({
  session: userIdFallbackSession,
  getCurrentUser: async () => ({ aud: "authenticated" }),
  timeoutMs: 20
});

assert.equal(missingIdUserIdFallbackUser.currentUser.id, "user-id-from-token");

const networkFallbackUser = await loadProfileCabinetBootstrap({
  session: fallbackSession,
  getCurrentUser: async () => {
    throw new TypeError("Failed to fetch");
  },
  timeoutMs: 20
});

assert.equal(networkFallbackUser.currentUser.id, "user-from-token");

const bootstrapSteps = [];
await loadProfileCabinetBootstrap({
  session: fallbackSession,
  getCurrentUser: async () => ({ data: { user: { id: "user-from-wrapper" } } }),
  timeoutMs: 20,
  onStep: (step) => bootstrapSteps.push(step)
});

assert.deepEqual(bootstrapSteps, [
  "started",
  "session-shell-opened"
]);

const nonJwtBootstrapSteps = [];
await loadProfileCabinetBootstrap({
  session: { access_token: "non-jwt-token" },
  getCurrentUser: async () => ({ data: { user: { id: "user-from-wrapper" } } }),
  timeoutMs: 20,
  onStep: (step) => nonJwtBootstrapSteps.push(step)
});

assert.deepEqual(nonJwtBootstrapSteps, [
  "started",
  "user-request-started",
  "user-request-resolved",
  "user-has-id",
  "profile-request-skipped-for-recovery"
]);

const nonJwtUnauthorizedError = await loadProfileCabinetBootstrap({
  session: { access_token: "non-jwt-token" },
  getCurrentUser: async () => {
    const error = new Error("Unauthorized");
    error.details = { status: 401 };
    throw error;
  },
  timeoutMs: 20
}).catch((error) => error);

assert.equal(nonJwtUnauthorizedError.details?.status, 401);
assert.equal(nonJwtUnauthorizedError.source, undefined);

const nonJwtForbiddenError = await loadProfileCabinetBootstrap({
  session: { access_token: "non-jwt-token" },
  getCurrentUser: async () => {
    const error = new Error("Forbidden");
    error.details = { status: 403 };
    throw error;
  },
  timeoutMs: 20
}).catch((error) => error);

assert.equal(nonJwtForbiddenError.details?.status, 403);
assert.equal(nonJwtForbiddenError.source, undefined);

const bgVerifySuccessSteps = [];
const bgVerifySuccess = await runBackgroundUserVerification({
  session: fallbackSession,
  getCurrentUser: async () => ({ id: "verified-user", email: "ok@example.com" }),
  timeoutMs: 500,
  onStep: (step) => bgVerifySuccessSteps.push(step)
});

assert.equal(bgVerifySuccess.status, "success");
assert.equal(bgVerifySuccess.user.id, "verified-user");
assert.equal(bgVerifySuccessSteps.includes("background-verification-started"), true);
assert.equal(bgVerifySuccessSteps.includes("background-verification-success"), true);

const bgVerifyTimeoutSteps = [];
const bgVerifyTimeoutStartedAt = Date.now();
const bgVerifyTimeout = await runBackgroundUserVerification({
  session: fallbackSession,
  getCurrentUser: () => new Promise(() => {}),
  timeoutMs: 30,
  onStep: (step) => bgVerifyTimeoutSteps.push(step)
});

assert.equal(bgVerifyTimeout.status, "timeout");
assert.ok(Date.now() - bgVerifyTimeoutStartedAt < 200, "background timeout should fire within the given timeoutMs");
assert.equal(bgVerifyTimeoutSteps.includes("background-verification-timeout"), true);

const bgVerify401Steps = [];
const bgVerify401 = await runBackgroundUserVerification({
  session: fallbackSession,
  getCurrentUser: async () => {
    const error = new Error("Unauthorized");
    error.details = { status: 401 };
    throw error;
  },
  timeoutMs: 500,
  onStep: (step) => bgVerify401Steps.push(step)
});

assert.equal(bgVerify401.status, "auth-error");
assert.equal(bgVerify401Steps.includes("background-verification-auth-error"), true);

const bgVerify403 = await runBackgroundUserVerification({
  session: fallbackSession,
  getCurrentUser: async () => {
    const error = new Error("Forbidden");
    error.details = { status: 403 };
    throw error;
  },
  timeoutMs: 500
});

assert.equal(bgVerify403.status, "auth-error");

const bgVerifyNetworkFail = await runBackgroundUserVerification({
  session: fallbackSession,
  getCurrentUser: async () => { throw new TypeError("Failed to fetch"); },
  timeoutMs: 500
});

assert.equal(bgVerifyNetworkFail.status, "network-fail");

const bgVerifySkipped = await runBackgroundUserVerification({
  session: null
});
assert.equal(bgVerifySkipped.status, "skipped");

let bgVerifyGetCurrentUserCalled = false;
const sessionShellOpenedTiming = Date.now();
const jwtShellResult = await loadProfileCabinetBootstrap({
  session: fallbackSession,
  getCurrentUser: async () => {
    bgVerifyGetCurrentUserCalled = true;
    return { id: "remote-user" };
  },
  timeoutMs: 500,
  fallbackTimeoutMs: 20
});

assert.equal(jwtShellResult.currentUser.id, "user-from-token");
assert.equal(jwtShellResult.currentUser.source, "session-jwt-fallback");
assert.equal(bgVerifyGetCurrentUserCalled, false, "getCurrentUser must not be called in critical path for JWT sessions");
assert.ok(Date.now() - sessionShellOpenedTiming < 50, "JWT shell should open without waiting for getCurrentUser");

const invalidSessionError = await loadProfileCabinetBootstrap({
  session: { access_token: "token-3" },
  getCurrentUser: async () => null
}).catch((error) => error);

assert.equal(invalidSessionError.details?.status, 401);
assert.match(invalidSessionError.message, /Войдите заново/);

const normalizedProfile = normalizeProfileRecord(null, { id: "user-123" }, {
  display_name: "",
  bio: "",
  status: "draft"
});

assert.equal(normalizedProfile.user_id, "user-123");
assert.equal(normalizedProfile.display_name, "");
assert.equal(normalizedProfile.status, "draft");

const optionalData = await loadPowerPlaceOptionalData({
  profileId: "profile-1",
  session: { access_token: "token-1" },
  listClientGoalPhotos: async () => {
    throw new Error("photo feed failed");
  },
  listPowerPlaceCompositions: async () => [{ id: "composition-1" }]
});

assert.deepEqual(optionalData.clientGoalPhotos, []);
assert.deepEqual(optionalData.powerPlaceCompositions, [{ id: "composition-1" }]);
assert.equal(optionalData.notices.length, 1);
assert.match(optionalData.notices[0], /photo feed failed/);
