import assert from "node:assert/strict";

import {
  loadPowerPlaceOptionalData,
  loadProfileCabinetBootstrap,
  normalizeProfileRecord
} from "../src/lib/profileBootstrapClient.js";

const noSession = await loadProfileCabinetBootstrap({
  session: null,
  getCurrentUser: async () => {
    throw new Error("should not run");
  },
  getOwnProfile: async () => {
    throw new Error("should not run");
  }
});

assert.deepEqual(noSession, { currentUser: null, currentProfile: null });

const timeoutError = await loadProfileCabinetBootstrap({
  session: { access_token: "token-1" },
  getCurrentUser: async () => ({ id: "user-1", email: "master@example.com" }),
  getOwnProfile: () => new Promise(() => {}),
  timeoutMs: 20
}).catch((error) => error);

assert.equal(timeoutError.code, "auth_load_timeout");
assert.match(timeoutError.message, /Вход не отвечает/);

const invalidSessionError = await loadProfileCabinetBootstrap({
  session: { access_token: "token-2" },
  getCurrentUser: async () => null,
  getOwnProfile: async () => ({ id: "profile-1" })
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
