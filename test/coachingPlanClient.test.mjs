import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  COACHING_PLAN_SECTIONS,
  getClientVisibleConsultationReports,
  hasCoachingPlanContent,
  normalizeCoachingPlanSections
} from "../src/lib/coachingPlanClient.js";

assert.equal(COACHING_PLAN_SECTIONS.length, 9);
assert.deepEqual(
  COACHING_PLAN_SECTIONS.map((section) => section.id),
  ["direction", "wellbeing", "relationships", "career", "money", "growth", "lifestyle", "goals", "reflection"]
);

const empty = normalizeCoachingPlanSections();
assert.equal(Object.keys(empty).length, 9);
assert.equal(hasCoachingPlanContent(empty), false);
assert.equal(empty.direction.visibility, "private");

const normalized = normalizeCoachingPlanSections({
  direction: {
    current_state: "  I am reassessing priorities ",
    desired_state: "Clear direction",
    next_steps: "Write three priorities",
    notes: "Personal note",
    visibility: "public"
  },
  extra: { current_state: "not allowed" }
});
assert.equal(normalized.direction.current_state, "I am reassessing priorities");
assert.equal(normalized.direction.visibility, "private");
assert.equal(normalized.extra, undefined);
assert.equal(hasCoachingPlanContent(normalized), true);
assert.equal(hasCoachingPlanContent({ direction: { current_state: " ", desired_state: "", next_steps: "", notes: "" } }), false);
assert.equal(hasCoachingPlanContent(null), false);

const reports = getClientVisibleConsultationReports([
  { id: "draft", status: "in_progress", final_result_composition_id: "result-1", created_at: "2026-11-08T10:00:00Z" },
  { id: "not-yet-sent", status: "ready_for_review", final_result_composition_id: "result-2", created_at: "2026-11-08T11:00:00Z" },
  { id: "sent-older", status: "sent", final_result_composition_id: "result-3", created_at: "2026-11-08T09:00:00Z" },
  { id: "sent-newer", status: "sent", final_result_composition_id: "result-4", created_at: "2026-11-09T09:00:00Z" },
  { id: "sent-no-result", status: "sent", final_result_composition_id: "", created_at: "2026-11-09T10:00:00Z" }
]);
assert.deepEqual(reports.map((report) => report.id), ["sent-newer", "sent-older"]);
assert.deepEqual(getClientVisibleConsultationReports(null), []);
console.log("coachingPlanClient tests passed");


const lifePlanMigration = readFileSync("supabase/migrations/20261109120000_profile_client_life_plans.sql", "utf8");
assert.match(lifePlanMigration, /create table if not exists public\\.profile_cabinet_life_plans/);
assert.match(lifePlanMigration, /auth\\.uid\\(\\) = user_id/);
assert.match(lifePlanMigration, /alter table public\\.profile_cabinet_life_plans enable row level security/);
assert.match(lifePlanMigration, /revoke all on public\\.profile_cabinet_life_plans from anon/);
