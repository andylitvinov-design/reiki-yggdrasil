import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const manifestPath = resolve("docs/debug/reiki-debug-manifest.json");
const failures = [];

function fail(message) {
  failures.push(message);
}

function requireArray(path, value, minLength = 1) {
  if (!Array.isArray(value) || value.length < minLength) {
    fail(`${path} must be an array with at least ${minLength} item(s)`);
  }
}

function requireString(path, value) {
  if (typeof value !== "string" || !value.trim()) {
    fail(`${path} must be a non-empty string`);
  }
}

function requireIncludes(path, value, expected) {
  if (!Array.isArray(value) || !value.includes(expected)) {
    fail(`${path} must include ${expected}`);
  }
}

if (!existsSync(manifestPath)) {
  fail("docs/debug/reiki-debug-manifest.json is missing");
}

let manifest = {};
if (!failures.length) {
  try {
    manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
  } catch (error) {
    fail(`debug manifest JSON is invalid: ${error.message}`);
  }
}

if (!failures.length) {
  requireString("project", manifest.project);
  requireString("version", manifest.version);
  requireString("repo", manifest.repo);
  requireArray("required_routes", manifest.required_routes, 4);
  requireArray("required_commands", manifest.required_commands, 3);
  requireArray("debug_docs", manifest.debug_docs, 10);
  requireArray("contract_docs", manifest.contract_docs, 4);
  requireArray("code_contracts", manifest.code_contracts, 3);
  requireArray("bug_classes", manifest.bug_classes, 10);
  requireArray("evidence_levels", manifest.evidence_levels, 5);
  requireArray("safety_invariants", manifest.safety_invariants, 5);

  for (const route of ["/", "/profile", "/profile-lite", "/masters", "/profile/admin"]) {
    requireIncludes("required_routes", manifest.required_routes, route);
  }

  for (const command of ["npm run verify:debug-contract", "npm run check", "npm run build"]) {
    requireIncludes("required_commands", manifest.required_commands, command);
  }

  for (const bugClass of [
    "DEPLOY_MISMATCH",
    "AUTH",
    "SUPABASE_RLS",
    "STORAGE_MEDIA",
    "UI_LAYOUT_DESKTOP",
    "UI_LAYOUT_MOBILE",
    "SERVICE_ORDER_FLOW",
    "PRINT_DOWNLOAD_EXPORT",
  ]) {
    requireIncludes("bug_classes", manifest.bug_classes, bugClass);
  }

  for (const level of ["E0_user_report", "E1_visual", "E2_repo", "E3_runtime", "E4_verified_fix"]) {
    requireIncludes("evidence_levels", manifest.evidence_levels, level);
  }

  if (manifest.quality_gates?.max_clarifying_questions_before_self_checks !== 1) {
    fail("quality_gates.max_clarifying_questions_before_self_checks must be 1");
  }

  if ((manifest.quality_gates?.minimum_codex_prompt_score || 0) < 16) {
    fail("quality_gates.minimum_codex_prompt_score must be at least 16");
  }

  if ((manifest.quality_gates?.minimum_analysis_answer_score || 0) < 14) {
    fail("quality_gates.minimum_analysis_answer_score must be at least 14");
  }

  const allFileRefs = [
    ...(manifest.debug_docs || []),
    ...(manifest.contract_docs || []),
    ...(manifest.code_contracts || []),
  ];

  for (const filePath of allFileRefs) {
    if (!existsSync(resolve(filePath))) {
      fail(`manifest references missing file: ${filePath}`);
    }
  }
}

if (failures.length) {
  console.error("Reiki debug manifest verification failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("Reiki debug manifest verification passed.");
console.log(
  JSON.stringify(
    {
      project: manifest.project,
      version: manifest.version,
      debug_docs: manifest.debug_docs.length,
      contract_docs: manifest.contract_docs.length,
      code_contracts: manifest.code_contracts.length,
      bug_classes: manifest.bug_classes.length,
      evidence_levels: manifest.evidence_levels.length,
    },
    null,
    2
  )
);
