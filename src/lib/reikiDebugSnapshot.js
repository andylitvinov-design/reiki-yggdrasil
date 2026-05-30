const REQUIRED_ENV_NAMES = [
  "VITE_SUPABASE_URL",
  "VITE_SUPABASE_ANON_KEY",
  "VITE_ADMIN_EMAIL",
];

const EXPECTED_ROUTES = ["/", "/profile", "/masters", "/profile/admin"];

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
    bug_taxonomy: [
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
    ],
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
