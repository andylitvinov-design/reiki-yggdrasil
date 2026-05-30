const REQUIRED_ENV_NAMES = [
  "VITE_SUPABASE_URL",
  "VITE_SUPABASE_ANON_KEY",
  "VITE_ADMIN_EMAIL",
];

const EXPECTED_ROUTES = ["/", "/profile", "/masters", "/profile/admin"];

const BUG_TAXONOMY = [
  "DEPLOY_MISMATCH",
  "ROUTING",
  "AUTH",
  "SUPABASE_RLS",
  "STORAGE_MEDIA",
  "UI_LAYOUT_DESKTOP",
  "UI_LAYOUT_MOBILE",
  "STATE_MANAGEMENT",
  "DATA_CONTRACT",
  "COURSE_CONTENT",
  "ADMIN_MODERATION",
  "SERVICE_ORDER_FLOW",
  "PRINT_DOWNLOAD_EXPORT",
];

const EVIDENCE_LEVELS = [
  "E0_user_report",
  "E1_visual",
  "E2_repo",
  "E3_runtime",
  "E4_verified_fix",
];

const REPAIR_LOOP_STATES = [
  "task_prepared",
  "codex_reported_done",
  "not_visible_on_live",
  "checks_failed",
  "ui_regression",
  "data_auth_regression",
];

function readEnvPresence(env = {}) {
  return Object.fromEntries(
    REQUIRED_ENV_NAMES.map((name) => [name, Boolean(env[name])])
  );
}

function resolveRuntimeEnv() {
  if (typeof process !== "undefined" && process.env) return process.env;
  return {};
}

export function buildReikiDebugSnapshot(options = {}) {
  const env = options.env || resolveRuntimeEnv();
  const envPresence = readEnvPresence(env);
  const missingEnvNames = REQUIRED_ENV_NAMES.filter((name) => !envPresence[name]);
  const warnings = [];

  if (missingEnvNames.length) {
    warnings.push(
      `Missing frontend env names or not available in this runtime: ${missingEnvNames.join(", ")}`
    );
  }

  return {
    ok: true,
    project: "reiki-yggdrasil",
    repo: "andylitvinov-design/reiki-yggdrasil",
    framework: "vite/react",
    hosting: "vercel",
    live_urls: {
      current_legacy: "https://reiki-yggdrasil.vercel.app",
      target_production: "https://mentalica.vercel.app",
    },
    expected_routes: EXPECTED_ROUTES,
    env_presence: envPresence,
    env_policy: {
      exposes_values: false,
      allowed_to_report: "presence booleans only",
      required_names: REQUIRED_ENV_NAMES,
    },
    ui_contract: {
      language_default: "ru",
      desktop_layout: "three-column",
      mobile_breakpoint_px: 980,
      public_routes: ["/", "/masters"],
      protected_routes: ["/profile", "/profile/admin"],
      preserve: [
        "public home page unless explicitly targeted",
        "RU-default interface",
        "desktop three-column structure",
        "mobile fallback below 980px",
      ],
    },
    supabase_contract: {
      client_env_names: REQUIRED_ENV_NAMES,
      auth_provider: "google",
      storage_bucket: "profile-cabinet-media",
      expected_flows: [
        "google_auth",
        "profile_media",
        "profile_materials",
        "power_place_compositions",
        "admin_moderation",
        "services_orders",
      ],
      verification_note:
        "Live auth/RLS/storage behavior requires a real configured Supabase project and session.",
    },
    media_contract: {
      private_bucket: "profile-cabinet-media",
      signed_urls_required_for_private_display: true,
      durable_private_ref_prefix: "storage://profile-cabinet-media/",
      temporary_preview_prefix: "data:image",
      public_leak_forbidden: true,
    },
    evidence_contract: {
      levels: EVIDENCE_LEVELS,
      confidence_labels: ["confirmed", "likely", "possible", "needs verification"],
      required_report_fields: [
        "evidence_level",
        "bug_class",
        "affected_route",
        "affected_viewport",
        "auth_state",
        "environment",
        "expected",
        "actual",
        "confirmed_facts",
        "unverified_assumptions",
        "files_checked",
        "minimal_safe_fix",
        "checks_required",
        "risks",
      ],
    },
    repair_loop_contract: {
      states: REPAIR_LOOP_STATES,
      acceptance_fields: [
        "branch",
        "commit_or_pr",
        "changed_files",
        "checks_run",
        "preview_url",
        "live_status",
        "routes_checked",
        "desktop_mobile_checked",
        "supabase_auth_storage_status",
        "risks",
      ],
      default_not_visible_classification: "DEPLOY_MISMATCH until disproven",
    },
    bug_taxonomy: BUG_TAXONOMY,
    audit_checks: [
      {
        name: "env_values_hidden",
        status: "ok",
        message: "Snapshot reports env presence only and does not expose values.",
      },
      {
        name: "routes_contract",
        status: EXPECTED_ROUTES.length === 4 ? "ok" : "needs verification",
        message: "Core Reiki routes are listed for debugger checks.",
      },
      {
        name: "evidence_protocol",
        status: "ok",
        message: "Snapshot includes evidence levels and required report fields.",
      },
      {
        name: "repair_loop_protocol",
        status: "ok",
        message: "Snapshot includes Codex repair-loop states and acceptance fields.",
      },
      {
        name: "live_auth_storage",
        status: "needs verification",
        message:
          "Live Supabase auth/storage behavior cannot be verified by the static contract snapshot.",
      },
    ],
    warnings,
  };
}

export const reikiDebugSnapshot = buildReikiDebugSnapshot();

export default reikiDebugSnapshot;
