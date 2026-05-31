import assert from "node:assert/strict";

import {
  loadPowerPlaceOptionalData,
  loadProfileCabinetBootstrap,
  normalizeProfileRecord
} from "../src/lib/profileBootstrapClient.js";

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

const noSession = await loadProfileCabinetBootstrap({
  session: null,
  getCurrentUser: async () => {
    throw new Error("should not run");
  }
});

assert.deepEqual(noSession, { currentUser: null, currentProfile: null });

const currentUserOnly = await loadProfileCabinetBootstrap({
  session: { access_token: "token-1" },
  getCurrentUser: async () => ({ id: "user-1", email: "master@example.com" }),
  getOwnProfile: () => new Promise(() => {}),
  timeoutMs: 20
});

assert.deepEqual(currentUserOnly, {
  currentUser: { id: "user-1", email: "master@example.com" },
  currentProfile: null
});

const wrappedCurrentUser = await loadProfileCabinetBootstrap({
  session: { access_token: "token-wrapped" },
  getCurrentUser: async () => ({ user: { id: "user-wrapped", email: "wrapped@example.com" } }),
  timeoutMs: 20
});

assert.deepEqual(wrappedCurrentUser, {
  currentUser: { id: "user-wrapped", email: "wrapped@example.com" },
  currentProfile: null
});

const dataWrappedCurrentUser = await loadProfileCabinetBootstrap({
  session: { access_token: "token-data-wrapped" },
  getCurrentUser: async () => ({ data: { user: { id: "user-data-wrapped", email: "data@example.com" } } }),
  timeoutMs: 20
});

assert.deepEqual(dataWrappedCurrentUser, {
  currentUser: { id: "user-data-wrapped", email: "data@example.com" },
  currentProfile: null
});

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
const fallbackUser = await loadProfileCabinetBootstrap({
  session: fallbackSession,
  getCurrentUser: () => new Promise(() => {}),
  timeoutMs: 20
});

assert.equal(fallbackUser.currentUser.id, "user-from-token");
assert.equal(fallbackUser.currentUser.email, "fallback@example.com");
assert.equal(fallbackUser.currentUser.source, "session-jwt-fallback");
assert.equal(fallbackUser.currentProfile, null);

const malformedCurrentUserFallback = await loadProfileCabinetBootstrap({
  session: fallbackSession,
  getCurrentUser: async () => ({ email: "missing-id@example.com" }),
  timeoutMs: 20
});

assert.equal(malformedCurrentUserFallback.currentUser.id, "user-from-token");
assert.equal(malformedCurrentUserFallback.currentUser.source, "session-jwt-fallback");
assert.equal(malformedCurrentUserFallback.currentProfile, null);

const unauthorizedError = await loadProfileCabinetBootstrap({
  session: fallbackSession,
  getCurrentUser: async () => {
    const error = new Error("Unauthorized");
    error.details = { status: 401 };
    throw error;
  },
  timeoutMs: 20
}).catch((error) => error);

assert.equal(unauthorizedError.details?.status, 401);
assert.equal(unauthorizedError.source, undefined);

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
