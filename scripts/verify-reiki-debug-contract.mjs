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
requireObject("evidence_contract", snapshot.evidence_contract);
requireObject("repair_loop_contract", snapshot.repair_loop_contract);
requireArray("bug_taxonomy", snapshot.bug_taxonomy, 10);
requireArray("audit_checks", snapshot.audit_checks, 1);
requireArray("warnings", snapshot.warnings, 0);

for (const route of ["/", "/profile", "/masters", "/profile/admin"]) {
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

for (const auditCheck of ["env_values_hidden", "routes_contract", "evidence_protocol", "repair_loop_protocol"]) {
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
      evidence_levels: snapshot.evidence_contract.levels.length,
      repair_loop_states: snapshot.repair_loop_contract.states.length,
      audit_checks: snapshot.audit_checks.length,
      env_values_exposed: snapshot.env_policy.exposes_values,
    },
    null,
    2
  )
);
