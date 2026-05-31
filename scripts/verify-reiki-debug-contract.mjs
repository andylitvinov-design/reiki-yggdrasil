import { buildReikiDebugSnapshot } from "../src/lib/reikiDebugSnapshot.js";

const snapshot = buildReikiDebugSnapshot({
  env: {
    VITE_SUPABASE_URL: "present-for-contract-check",
    VITE_SUPABASE_ANON_KEY: "present-for-contract-check",
    VITE_ADMIN_EMAIL: "present-for-contract-check",
  },
});

const failures = [];

function requireObject(path, value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    failures.push(`${path} must be an object`);
  }
}

function requireArray(path, value, minLength = 1) {
  if (!Array.isArray(value) || value.length < minLength) {
    failures.push(`${path} must be an array with at least ${minLength} item(s)`);
  }
}

function requireString(path, value) {
  if (typeof value !== "string" || !value.trim()) {
    failures.push(`${path} must be a non-empty string`);
  }
}

function requireBoolean(path, value) {
  if (typeof value !== "boolean") {
    failures.push(`${path} must be a boolean`);
  }
}

function requireIncludes(path, value, expected) {
  if (!Array.isArray(value) || !value.includes(expected)) {
    failures.push(`${path} must include ${expected}`);
  }
}

requireObject("snapshot", snapshot);
requireString("project", snapshot.project);
requireString("repo", snapshot.repo);
requireString("framework", snapshot.framework);
requireString("hosting", snapshot.hosting);
requireObject("live_urls", snapshot.live_urls);
requireArray("expected_routes", snapshot.expected_routes, 4);
requireObject("env_presence", snapshot.env_presence);
requireObject("env_policy", snapshot.env_policy);
requireObject("ui_contract", snapshot.ui_contract);
requireObject("supabase_contract", snapshot.supabase_contract);
requireObject("media_contract", snapshot.media_contract);
requireObject("intake_contract", snapshot.intake_contract);
requireObject("evidence_contract", snapshot.evidence_contract);
requireObject("repair_loop_contract", snapshot.repair_loop_contract);
requireObject("quality_rubric", snapshot.quality_rubric);
requireArray("bug_taxonomy", snapshot.bug_taxonomy, 10);
requireArray("audit_checks", snapshot.audit_checks, 1);
requireArray("warnings", snapshot.warnings, 0);

for (const route of ["/", "/profile", "/profile-lite", "/masters", "/profile/admin"]) {
  requireIncludes("expected_routes", snapshot.expected_routes, route);
}

for (const envName of ["VITE_SUPABASE_URL", "VITE_SUPABASE_ANON_KEY", "VITE_ADMIN_EMAIL"]) {
  requireBoolean(`env_presence.${envName}`, snapshot.env_presence?.[envName]);
  requireIncludes("env_policy.required_names", snapshot.env_policy?.required_names, envName);
}

if (snapshot.env_policy?.exposes_values !== false) {
  failures.push("env_policy.exposes_values must be false");
}

if (snapshot.ui_contract?.language_default !== "ru") {
  failures.push("ui_contract.language_default must be ru");
}

if (snapshot.ui_contract?.desktop_layout !== "three-column") {
  failures.push("ui_contract.desktop_layout must be three-column");
}

if (snapshot.media_contract?.private_bucket !== "profile-cabinet-media") {
  failures.push("media_contract.private_bucket must be profile-cabinet-media");
}

for (const taskType of ["bug", "design_mismatch", "live_mismatch", "auth_data_flow", "media_storage", "service_order"]) {
  requireIncludes("intake_contract.task_types", snapshot.intake_contract?.task_types, taskType);
}

for (const field of [
  "project",
  "task_type",
  "user_symptom",
  "affected_route",
  "environment",
  "expected_behavior",
  "actual_behavior",
  "evidence_provided",
]) {
  requireIncludes("intake_contract.required_fields", snapshot.intake_contract?.required_fields, field);
}

if (snapshot.intake_contract?.max_clarifying_questions_before_self_checks !== 1) {
  failures.push("intake_contract.max_clarifying_questions_before_self_checks must be 1");
}

for (const evidenceLevel of [
  "E0_user_report",
  "E1_visual",
  "E2_repo",
  "E3_runtime",
  "E4_verified_fix",
]) {
  requireIncludes("evidence_contract.levels", snapshot.evidence_contract?.levels, evidenceLevel);
}

for (const field of [
  "evidence_level",
  "bug_class",
  "affected_route",
  "actual",
  "confirmed_facts",
  "unverified_assumptions",
  "files_checked",
  "minimal_safe_fix",
  "risks",
]) {
  requireIncludes("evidence_contract.required_report_fields", snapshot.evidence_contract?.required_report_fields, field);
}

for (const state of [
  "task_prepared",
  "codex_reported_done",
  "not_visible_on_live",
  "checks_failed",
  "ui_regression",
  "data_auth_regression",
]) {
  requireIncludes("repair_loop_contract.states", snapshot.repair_loop_contract?.states, state);
}

for (const field of [
  "branch",
  "commit_or_pr",
  "changed_files",
  "checks_run",
  "live_status",
  "routes_checked",
  "risks",
]) {
  requireIncludes("repair_loop_contract.acceptance_fields", snapshot.repair_loop_contract?.acceptance_fields, field);
}

if (snapshot.repair_loop_contract?.default_not_visible_classification !== "DEPLOY_MISMATCH until disproven") {
  failures.push("repair_loop_contract.default_not_visible_classification must preserve deploy-first live debugging rule");
}

for (const area of [
  "project_context",
  "bug_classification",
  "evidence",
  "files",
  "root_cause",
  "safety",
  "codex_prompt",
  "verification",
  "honesty",
]) {
  requireIncludes("quality_rubric.score_areas", snapshot.quality_rubric?.score_areas, area);
}

for (const selfCheck of [
  "affected_route_environment_identified",
  "live_preview_local_distinguished",
  "primary_bug_layer_classified",
  "confirmed_vs_needs_verification_split",
  "likely_files_named",
  "checks_specified",
  "not_verified_items_listed",
]) {
  requireIncludes("quality_rubric.mandatory_self_checks", snapshot.quality_rubric?.mandatory_self_checks, selfCheck);
}

if ((snapshot.quality_rubric?.target_scores?.codex_implementation_prompt || 0) < 16) {
  failures.push("quality_rubric.target_scores.codex_implementation_prompt must be at least 16");
}

if ((snapshot.quality_rubric?.target_scores?.analysis_answer || 0) < 14) {
  failures.push("quality_rubric.target_scores.analysis_answer must be at least 14");
}

for (const auditCheck of [
  "env_values_hidden",
  "routes_contract",
  "intake_protocol",
  "evidence_protocol",
  "repair_loop_protocol",
  "quality_rubric",
]) {
  if (!snapshot.audit_checks.some((check) => check.name === auditCheck)) {
    failures.push(`audit_checks missing ${auditCheck}`);
  }
}

if (failures.length) {
  console.error("Reiki debug contract verification failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("Reiki debug contract verification passed.");
console.log(
  JSON.stringify(
    {
      project: snapshot.project,
      routes: snapshot.expected_routes,
      bug_taxonomy_count: snapshot.bug_taxonomy.length,
      intake_task_types: snapshot.intake_contract.task_types.length,
      evidence_levels: snapshot.evidence_contract.levels.length,
      repair_loop_states: snapshot.repair_loop_contract.states.length,
      quality_score_areas: snapshot.quality_rubric.score_areas.length,
      audit_checks: snapshot.audit_checks.length,
      env_values_exposed: snapshot.env_policy.exposes_values,
    },
    null,
    2
  )
);
