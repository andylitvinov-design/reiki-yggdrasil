import assert from "node:assert/strict";
import {
  MASTER_PLAN_VALUES,
  canCreateWithinPlanLimit,
  getMasterPlan,
  getMasterPlanLimit,
  getMasterPlanPaymentLink,
  normalizeMasterPlan,
  resolveProfileMasterPlan
} from "../src/lib/masterPlans.js";

assert.deepEqual(MASTER_PLAN_VALUES, ["start", "practic", "master"]);

assert.equal(normalizeMasterPlan("start"), "start");
assert.equal(normalizeMasterPlan("practic"), "practic");
assert.equal(normalizeMasterPlan("practice"), "practic");
assert.equal(normalizeMasterPlan("pro"), "practic");
assert.equal(normalizeMasterPlan("master"), "master");
assert.equal(normalizeMasterPlan("unknown"), "start");

assert.equal(resolveProfileMasterPlan({ account_plan: "master" }, { email: "student@example.com" }, "owner@example.com"), "master");
assert.equal(resolveProfileMasterPlan(null, { email: "student@example.com" }, "owner@example.com"), "start");
assert.equal(resolveProfileMasterPlan(null, { email: "owner@example.com" }, "owner@example.com"), "practic");
assert.equal(resolveProfileMasterPlan({ account_plan: "start" }, { email: "owner@example.com" }, "owner@example.com"), "start");

assert.deepEqual(getMasterPlan("start").limits, {
  compositions: 7,
  dailyPhotoUploads: 7,
  clients: 5,
  clientPhotos: 10,
  trialServices: 0,
  paidServices: 0,
  hiddenPublications: 0,
  serviceItems: 0
});
assert.equal(getMasterPlanLimit("practic", "compositions"), 25);
assert.equal(getMasterPlanLimit("practic", "trialServices"), 3);
assert.equal(getMasterPlanLimit("master", "compositions"), 50);
assert.equal(getMasterPlanLimit("master", "paidServices"), 10);
assert.equal(getMasterPlanLimit("master", "hiddenPublications"), 10);

assert.equal(canCreateWithinPlanLimit("start", "compositions", 6).allowed, true);
assert.equal(canCreateWithinPlanLimit("start", "compositions", 7).allowed, false);
assert.match(canCreateWithinPlanLimit("start", "compositions", 7).message, /Лимит 7/);
assert.equal(canCreateWithinPlanLimit("start", "clientPhotos", 9).allowed, true);
assert.equal(canCreateWithinPlanLimit("start", "clientPhotos", 10).allowed, false);
assert.match(canCreateWithinPlanLimit("start", "clientPhotos", 10).message, /Лимит 10 фото клиентов \/ целей/);
assert.equal(canCreateWithinPlanLimit("master", "paidServices", 9).allowed, true);
assert.equal(canCreateWithinPlanLimit("practic", "paidServices", 0).allowed, false);

assert.equal(getMasterPlanPaymentLink("start", { VITE_PRACTIC_PAYMENT_LINK: "https://pay/practic" }), "");
assert.equal(getMasterPlanPaymentLink("practic", { VITE_PRACTIC_PAYMENT_LINK: "https://pay/practic" }), "https://pay/practic");
assert.equal(getMasterPlanPaymentLink("master", { VITE_MASTER_PAYMENT_LINK: "https://pay/master" }), "https://pay/master");
assert.equal(getMasterPlanPaymentLink("master", { VITE_MASTER_PAYMENT_LINK: "javascript:alert(1)" }), "");

console.log("masterPlans: all assertions passed.");
