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
requireArray("bug_taxonomy", snapshot.bug_taxonomy, 10);
requireArray("audit_checks", snapshot.audit_checks, 1);
requireArray("warnings", snapshot.warnings, 0);

for (const route of ["/", "/profile", "/masters", "/profile/admin"]) {
  if (!snapshot.expected_routes.includes(route)) {
    failures.push(`expected_routes missing ${route}`);
  }
}

for (const envName of ["VITE_SUPABASE_URL", "VITE_SUPABASE_ANON_KEY", "VITE_ADMIN_EMAIL"]) {
  requireBoolean(`env_presence.${envName}`, snapshot.env_presence?.[envName]);
  if (!snapshot.env_policy?.required_names?.includes(envName)) {
    failures.push(`env_policy.required_names missing ${envName}`);
  }
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
      audit_checks: snapshot.audit_checks.length,
      env_values_exposed: snapshot.env_policy.exposes_values,
    },
    null,
    2
  )
);
