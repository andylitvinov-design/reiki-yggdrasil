#!/usr/bin/env node
import { spawn } from "node:child_process";
import path from "node:path";
import process from "node:process";

const ACTION_NAME = "Apply Reiki Supabase migrations";
const PROJECT_NAME = "Reiki Yggdrasil / Supabase";
const SECRET_NAMES = ["SUPABASE_ACCESS_TOKEN", "SUPABASE_PROJECT_REF"];
const ALLOWED_MIGRATIONS = Object.freeze([
  "supabase/migrations/20260526063307_profile_cabinet_mvp.sql",
  "supabase/migrations/20260526063321_profile_cabinet_rls_followup.sql",
  "supabase/migrations/20260526064404_profile_cabinet_security_lints.sql",
  "supabase/migrations/20260526121859_profile_cabinet_publication_step_fields.sql",
  "supabase/migrations/20260527070251_20260526_power_place_persistence.sql",
  "supabase/migrations/20260527070310_20260526_power_place_upgrade_5_business_dao.sql",
  "supabase/migrations/20260527070353_20260526_power_place_upgrade_6_zodiac_chat.sql",
  "supabase/migrations/20260527120000_profile_cabinet_media_storage.sql",
  "supabase/migrations/20260527143000_power_place_star_format.sql",
  "supabase/migrations/20260531090000_power_place_chess_format.sql",
  "supabase/migrations/20260602120000_power_place_chess_compact_variant.sql",
  "supabase/migrations/20260529090000_master_services_orders_mvp.sql",
  "supabase/migrations/20260605153000_service_orders_client_phase4.sql",
  "supabase/migrations/20260605184500_service_orders_result_delivery_phase5.sql",
  "supabase/migrations/20260606120000_master_chats_links_mvp.sql"
]);
const SCHEMA_CHECKS = Object.freeze({
  profile_cabinet_profiles_account_plan: false,
  profile_cabinet_client_goal_photos: false,
  profile_cabinet_tradition_assets: false,
  profile_cabinet_power_place_compositions: false,
  zodiac_visible_count: false,
  star_variant: false,
  chess_variant: false,
  profile_cabinet_chat_conversations: false,
  profile_cabinet_chat_participants: false,
  profile_cabinet_chat_messages: false,
  profile_cabinet_chat_favorites: false,
  profile_cabinet_media_bucket: false,
  profile_cabinet_client_goal_photos_image_path: false,
  profile_cabinet_tradition_assets_image_path: false,
  profile_cabinet_media_storage_policy: false,
  profile_cabinet_services: false,
  profile_cabinet_service_orders: false
});

function redact(text = "", secrets = {}) {
  let output = String(text || "");
  for (const value of Object.values(secrets)) {
    const token = String(value || "").trim();
    if (token) output = output.split(token).join("[REDACTED]");
  }
  return output
    .replace(/sbp_[A-Za-z0-9._-]+/g, "sbp_[REDACTED]")
    .replace(/(Authorization:\s*Bearer\s+)[^\s"']+/gi, "$1[REDACTED]")
    .replace(/(SUPABASE_ACCESS_TOKEN=)[^\s"']+/g, "$1[REDACTED]")
    .replace(/(SUPABASE_PROJECT_REF=)[^\s"']+/g, "$1[REDACTED]");
}

function safeError(error, secrets = {}) {
  return redact(error?.message || String(error), secrets);
}

function print(data, secrets = {}) {
  process.stdout.write(`${redact(JSON.stringify(data, null, 2), secrets)}\n`);
}

function run(command, args = [], options = {}) {
  return new Promise((resolve) => {
    const child = spawn(command, args, {
      cwd: options.cwd || process.cwd(),
      env: options.env || process.env,
      stdio: ["ignore", "pipe", "pipe"]
    });
    let stdout = "";
    let stderr = "";
    child.stdout.setEncoding("utf8");
    child.stderr.setEncoding("utf8");
    child.stdout.on("data", (chunk) => { stdout += chunk; });
    child.stderr.on("data", (chunk) => { stderr += chunk; });
    child.on("error", (error) => resolve({ ok: false, code: 127, stdout, stderr: String(error?.message || error) }));
    child.on("close", (code) => resolve({ ok: code === 0, code, stdout, stderr }));
  });
}

async function readWalletSecrets(options = {}) {
  const port = Number(options.port || process.env.SECRET_VAULT_PORT || 8790) || 8790;
  const url = `http://127.0.0.1:${port}/api/secrets/read`;
  let response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ project: PROJECT_NAME, names: SECRET_NAMES })
    });
  } catch (error) {
    return {
      ok: false,
      status: "wallet_unavailable",
      secretPresence: Object.fromEntries(SECRET_NAMES.map((name) => [name, "missing"])),
      error: safeError(error)
    };
  }
  if (!response.ok) {
    return {
      ok: false,
      status: "wallet_error",
      secretPresence: Object.fromEntries(SECRET_NAMES.map((name) => [name, "missing"])),
      error: `Secret Vault returned HTTP ${response.status}.`
    };
  }
  const data = await response.json();
  const secrets = {};
  const secretPresence = {};
  for (const name of SECRET_NAMES) {
    const entry = data?.secrets?.[name] || {};
    const value = String(entry.value || "").trim();
    secrets[name] = value;
    secretPresence[name] = entry.present && value ? "configured" : "missing";
  }
  const missing = SECRET_NAMES.filter((name) => secretPresence[name] !== "configured");
  return {
    ok: missing.length === 0,
    status: missing.length ? "missing_secrets" : "configured",
    secretPresence,
    secrets
  };
}

async function assertCommittedAllowedMigrations() {
  const details = [];
  for (const filePath of ALLOWED_MIGRATIONS) {
    const tracked = await run("git", ["ls-files", "--error-unmatch", filePath]);
    const unstaged = await run("git", ["diff", "--quiet", "--", filePath]);
    const staged = await run("git", ["diff", "--cached", "--quiet", "--", filePath]);
    details.push({
      file: filePath,
      tracked: tracked.ok,
      clean: unstaged.ok && staged.ok
    });
  }
  const failed = details.filter((item) => !item.tracked || !item.clean);
  if (failed.length) {
    return { ok: false, status: "migration_files_not_committed_or_clean", details };
  }
  return { ok: true, details };
}

function extractMigrationFiles(output = "") {
  const found = new Set();
  for (const match of String(output || "").matchAll(/supabase\/migrations\/[0-9][A-Za-z0-9_-]*\.sql|[0-9][A-Za-z0-9_-]*\.sql/g)) {
    const text = match[0].startsWith("supabase/") ? match[0] : `supabase/migrations/${match[0]}`;
    found.add(text);
  }
  return [...found].sort();
}

function classifyDryRun(output = "") {
  const text = String(output || "");
  const pending = extractMigrationFiles(text);
  const disallowed = pending.filter((filePath) => !ALLOWED_MIGRATIONS.includes(filePath));
  const noPending = /no migrations|database is up to date|nothing to push|no changes/i.test(text);
  if (disallowed.length) {
    return { ok: false, status: "unexpected_pending_migrations", pending, disallowed };
  }
  if (!pending.length && !noPending) {
    return { ok: false, status: "dry_run_pending_migrations_unclear", pending };
  }
  return { ok: true, status: pending.length ? "allowed_pending_migrations" : "no_pending_migrations", pending };
}

function supabaseEnv(secrets) {
  return {
    ...process.env,
    SUPABASE_ACCESS_TOKEN: secrets.SUPABASE_ACCESS_TOKEN,
    SUPABASE_PROJECT_REF: secrets.SUPABASE_PROJECT_REF
  };
}

async function linkSupabaseProject(secrets) {
  return run("npx", [
    "supabase",
    "link",
    "--project-ref",
    secrets.SUPABASE_PROJECT_REF,
    "--yes"
  ], { env: supabaseEnv(secrets) });
}

async function dryRunSupabasePush(secrets) {
  return run("npx", [
    "supabase",
    "db",
    "push",
    "--linked",
    "--dry-run",
    "--yes"
  ], { env: supabaseEnv(secrets) });
}

async function applySupabasePush(secrets) {
  return run("npx", [
    "supabase",
    "db",
    "push",
    "--linked",
    "--yes"
  ], { env: supabaseEnv(secrets) });
}

function schemaVerificationQuery() {
  return `
select
  exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'profile_cabinet_profiles' and column_name = 'account_plan'
  ) as profile_cabinet_profiles_account_plan,
  exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'profile_cabinet_client_goal_photos'
  ) as profile_cabinet_client_goal_photos,
  exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'profile_cabinet_tradition_assets'
  ) as profile_cabinet_tradition_assets,
  exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'profile_cabinet_power_place_compositions'
  ) as profile_cabinet_power_place_compositions,
  exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'profile_cabinet_power_place_compositions' and column_name = 'zodiac_visible_count'
  ) as zodiac_visible_count,
  exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'profile_cabinet_power_place_compositions' and column_name = 'star_variant'
  ) as star_variant,
  exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'profile_cabinet_power_place_compositions' and column_name = 'chess_variant'
  ) as chess_variant,
  exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'profile_cabinet_chat_conversations'
  ) as profile_cabinet_chat_conversations,
  exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'profile_cabinet_chat_participants'
  ) as profile_cabinet_chat_participants,
  exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'profile_cabinet_chat_messages'
  ) as profile_cabinet_chat_messages,
  exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'profile_cabinet_chat_favorites'
  ) as profile_cabinet_chat_favorites,
  exists (
    select 1 from storage.buckets
    where id = 'profile-cabinet-media' and public = false
  ) as profile_cabinet_media_bucket,
  exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'profile_cabinet_client_goal_photos' and column_name = 'image_path'
  ) as profile_cabinet_client_goal_photos_image_path,
  exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'profile_cabinet_tradition_assets' and column_name = 'image_path'
  ) as profile_cabinet_tradition_assets_image_path,
  exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'owners upload profile cabinet media'
  ) as profile_cabinet_media_storage_policy,
  exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'profile_cabinet_services'
  ) as profile_cabinet_services,
  exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'profile_cabinet_service_orders'
  ) as profile_cabinet_service_orders
`.trim();
}

function formatRelativeMigrationPaths() {
  return ALLOWED_MIGRATIONS.map((filePath) => path.basename(filePath));
}

function extractRows(data) {
  if (Array.isArray(data?.result)) return data.result;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data)) return data;
  return [];
}

async function verifySchema(secrets) {
  const response = await fetch(`https://api.supabase.com/v1/projects/${encodeURIComponent(secrets.SUPABASE_PROJECT_REF)}/database/query/read-only`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${secrets.SUPABASE_ACCESS_TOKEN}`,
      "content-type": "application/json"
    },
    body: JSON.stringify({ query: schemaVerificationQuery() })
  });
  if (response.status === 401 || response.status === 403) {
    return { status: "needs_permission", checks: SCHEMA_CHECKS };
  }
  if (!response.ok) {
    return { status: "error", error: `Management API returned HTTP ${response.status}.`, checks: SCHEMA_CHECKS };
  }
  const data = await response.json();
  const row = extractRows(data)[0] || {};
  const checks = Object.fromEntries(Object.keys(SCHEMA_CHECKS).map((key) => [key, Boolean(row[key])]));
  const missing = Object.entries(checks).filter(([, ok]) => !ok).map(([key]) => key);
  return { status: missing.length ? "missing_schema" : "verified", checks, missing };
}

async function main() {
  const wallet = await readWalletSecrets();
  if (!wallet.ok) {
    print({
      action: ACTION_NAME,
      ok: false,
      status: wallet.status,
      secretPresence: wallet.secretPresence,
      error: wallet.error
    });
    process.exitCode = 1;
    return;
  }
  const secrets = wallet.secrets;

  const migrations = await assertCommittedAllowedMigrations();
  if (!migrations.ok) {
    print({
      action: ACTION_NAME,
      ok: false,
      status: migrations.status,
      secretPresence: wallet.secretPresence,
      migrationFiles: migrations.details
    }, secrets);
    process.exitCode = 1;
    return;
  }

  const linked = await linkSupabaseProject(secrets);
  if (!linked.ok) {
    print({
      action: ACTION_NAME,
      ok: false,
      status: "supabase_link_failed",
      secretPresence: wallet.secretPresence,
      error: redact(`${linked.stdout}\n${linked.stderr}`, secrets).slice(0, 1200)
    }, secrets);
    process.exitCode = 1;
    return;
  }

  const dryRun = await dryRunSupabasePush(secrets);
  if (!dryRun.ok) {
    print({
      action: ACTION_NAME,
      ok: false,
      status: "supabase_dry_run_failed",
      secretPresence: wallet.secretPresence,
      error: redact(`${dryRun.stdout}\n${dryRun.stderr}`, secrets).slice(0, 1200)
    }, secrets);
    process.exitCode = 1;
    return;
  }

  const dryRunStatus = classifyDryRun(`${dryRun.stdout}\n${dryRun.stderr}`);
  if (!dryRunStatus.ok) {
    print({
      action: ACTION_NAME,
      ok: false,
      status: dryRunStatus.status,
      secretPresence: wallet.secretPresence,
      pendingMigrations: dryRunStatus.pending,
      disallowedMigrations: dryRunStatus.disallowed || []
    }, secrets);
    process.exitCode = 1;
    return;
  }

  const applied = await applySupabasePush(secrets);
  if (!applied.ok) {
    print({
      action: ACTION_NAME,
      ok: false,
      status: "supabase_apply_failed",
      secretPresence: wallet.secretPresence,
      pendingMigrations: dryRunStatus.pending,
      error: redact(`${applied.stdout}\n${applied.stderr}`, secrets).slice(0, 1200)
    }, secrets);
    process.exitCode = 1;
    return;
  }

  const schema = await verifySchema(secrets).catch((error) => ({
    status: "error",
    error: safeError(error, secrets),
    checks: SCHEMA_CHECKS
  }));

  print({
    action: ACTION_NAME,
    ok: schema.status === "verified",
    status: "migrations_applied",
    secretPresence: wallet.secretPresence,
    pendingMigrations: dryRunStatus.pending,
    schemaVerification: schema
  }, secrets);
}

if (import.meta.url === new URL(process.argv[1], "file:").href) {
  await main();
}

export {
  ACTION_NAME,
  ALLOWED_MIGRATIONS,
  PROJECT_NAME,
  SECRET_NAMES,
  classifyDryRun,
  extractMigrationFiles,
  formatRelativeMigrationPaths,
  readWalletSecrets,
  redact,
  schemaVerificationQuery
};
