import assert from "node:assert/strict";

import {
  createProfileLiteDiagnostics,
  createProfileLiteForm,
  createProfileLiteSavePayload,
  loadProfileLiteViewModel,
  safeProfileLiteError,
  shortUserId
} from "../src/lib/profileLiteClient.js";

let noEnvCurrentUserCalled = false;
const noEnv = await loadProfileLiteViewModel({
  supabaseConfigured: false,
  session: { profileSessionPresent: true },
  getCurrentUser: async () => {
    noEnvCurrentUserCalled = true;
  }
});

assert.equal(noEnv.authStatus, "idle");
assert.equal(noEnv.profileStatus, "idle");
assert.equal(noEnv.user, null);
assert.equal(noEnvCurrentUserCalled, false);

let noSessionCurrentUserCalled = false;
const noSession = await loadProfileLiteViewModel({
  supabaseConfigured: true,
  session: null,
  getCurrentUser: async () => {
    noSessionCurrentUserCalled = true;
  }
});

assert.equal(noSession.authStatus, "idle");
assert.equal(noSession.profileStatus, "idle");
assert.equal(noSession.user, null);
assert.equal(noSessionCurrentUserCalled, false);

const successful = await loadProfileLiteViewModel({
  supabaseConfigured: true,
  session: { profileSessionPresent: true },
  getCurrentUser: async () => ({ id: "user-1234567890", email: "master@example.com" }),
  getOwnProfile: async () => ({ id: "profile-1", status: "draft", display_name: "Master", bio: "Bio" })
});

assert.equal(successful.authStatus, "success");
assert.equal(successful.profileStatus, "success");
assert.equal(successful.user.email, "master@example.com");
assert.equal(successful.profile.id, "profile-1");

const userError = await loadProfileLiteViewModel({
  supabaseConfigured: true,
  session: { profileSessionPresent: true },
  getCurrentUser: async () => {
    throw new Error("Failed token abc.def.ghi https://example.supabase.co/auth/v1/user");
  }
});

assert.equal(userError.authStatus, "error");
assert.equal(userError.profileStatus, "idle");
assert.equal(userError.user, null);
assert.doesNotMatch(userError.error, /example\.supabase\.co/);
assert.doesNotMatch(userError.error, /abc\.def\.ghi/);

const profileError = await loadProfileLiteViewModel({
  supabaseConfigured: true,
  session: { profileSessionPresent: true },
  getCurrentUser: async () => ({ id: "user-1", email: "master@example.com" }),
  getOwnProfile: async () => {
    throw new Error("RLS rejected profile load");
  }
});

assert.equal(profileError.authStatus, "success");
assert.equal(profileError.profileStatus, "error");
assert.equal(profileError.user.id, "user-1");
assert.equal(profileError.profile, null);
assert.match(profileError.profileError, /RLS rejected/);

const expired = await loadProfileLiteViewModel({
  supabaseConfigured: true,
  session: { profileSessionPresent: true },
  sessionExpired: true
});

assert.equal(expired.authStatus, "error");
assert.match(expired.error, /Сессия устарела/);

const diagnostics = createProfileLiteDiagnostics({
  supabaseConfigured: true,
  session: {
    profileSessionPresent: true,
    access_token: "jwt.header.payload",
    refresh_token: "refresh-secret",
    url: "https://project.supabase.co",
    anon: "anon-secret-value"
  },
  sessionExpired: false,
  user: { id: "user-1", email: "master@example.com" },
  profile: { id: "profile-1" },
  authStatus: "success",
  profileStatus: "success"
});

const diagnosticText = JSON.stringify(diagnostics);
assert.doesNotMatch(diagnosticText, /jwt\.header\.payload/);
assert.doesNotMatch(diagnosticText, /refresh-secret/);
assert.doesNotMatch(diagnosticText, /project\.supabase\.co/);
assert.doesNotMatch(diagnosticText, /anon-secret-value/);
assert.match(diagnosticText, /"current user","value":"yes"/);

assert.equal(shortUserId("12345678abcdefgh"), "12345678...efgh");
assert.equal(shortUserId("short-id"), "short-id");

const form = createProfileLiteForm(null, { email: "master@example.com" });
assert.equal(form.display_name, "master");
assert.equal(form.status, "draft");

const payload = createProfileLiteSavePayload({ display_name: "  Master  ", bio: "  Bio  ", status: "approved" }, { id: "user-1" });
assert.deepEqual(payload, {
  user_id: "user-1",
  display_name: "Master",
  bio: "Bio",
  status: "draft"
});

assert.equal(safeProfileLiteError(new Error("token abcdefghijklmnopqrstuvwxyz1234567890")), "token [secret hidden]");
