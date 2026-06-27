import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import {
  ALLOWED_MIGRATIONS,
  schemaVerificationQuery
} from "../scripts/apply-reiki-supabase-migrations.mjs";

const adminPageSource = readFileSync("src/pages/AdminPage.jsx", "utf8");
const supabaseClientSource = readFileSync("src/lib/supabaseClient.js", "utf8");
const migrationSource = readFileSync("supabase/migrations/20260625120000_profile_master_plan_modes.sql", "utf8");

assert.ok(
  ALLOWED_MIGRATIONS.includes("supabase/migrations/20260625120000_profile_master_plan_modes.sql"),
  "Supabase migration runner should allow the Start / Pro / Practic / Master plan migration"
);

assert.match(
  schemaVerificationQuery(),
  /pg_constraint[\s\S]*profile_cabinet_profiles_account_plan_allows_practic_master/,
  "Supabase schema verification should prove the account_plan constraint allows practic and master, not only that the column exists"
);

assert.match(
  schemaVerificationQuery(),
  /profile_cabinet_admins[\s\S]*admins read own admin row[\s\S]*profile_cabinet_profiles_admin_update_policy/,
  "Supabase schema verification should report the admin self-read and profile admin update policies"
);

assert.match(
  migrationSource,
  /check\s*\(\s*account_plan\s+in\s*\('start',\s*'pro',\s*'practic',\s*'master'\)\s*\)/,
  "account_plan migration should allow exactly start, pro, practic, and master"
);

for (const exportName of [
  "getCurrentAdmin",
  "isCurrentUserAdmin",
  "listProfilesForAdmin",
  "updateProfileAccountPlan"
]) {
  assert.match(
    supabaseClientSource,
    new RegExp(`export async function ${exportName}\\b`),
    `supabaseClient should export ${exportName}`
  );
}

assert.match(
  supabaseClientSource,
  /ADMINS_TABLE[\s\S]*user_id=eq\.\$\{encodeURIComponent\(user\.id\)\}/,
  "admin helper should check profile_cabinet_admins by current auth user id"
);

assert.match(
  supabaseClientSource,
  /updateProfileAccountPlan[\s\S]*normalizeMasterPlan\(accountPlan\)/,
  "admin account-plan updates should normalize legacy/provided plan values through normalizeMasterPlan"
);

assert.match(
  adminPageSource,
  /Уровни кабинетов участников/,
  "AdminPage should render the participant cabinet-level management section"
);

assert.match(
  adminPageSource,
  /Email или имя участника/,
  "AdminPage should expose the requested participant search placeholder"
);

assert.match(
  adminPageSource,
  /listProfilesForAdmin\(session,\s*participantSearch\)/,
  "AdminPage should load searchable participant profiles through the admin helper"
);

assert.match(
  adminPageSource,
  /updateProfileAccountPlan\(profileId,\s*nextPlan,\s*session\)/,
  "AdminPage should save participant plan changes through the admin helper"
);

assert.match(
  adminPageSource,
  /isCurrentUserAdmin\(session\)/,
  "AdminPage should grant access through profile_cabinet_admins, not only VITE_ADMIN_EMAIL"
);

assert.match(
  adminPageSource,
  /Уровень кабинета обновлён\./,
  "AdminPage should show the requested success message after saving a participant plan"
);

console.log("profileAdminCabinetLevelsContract: all assertions passed.");
