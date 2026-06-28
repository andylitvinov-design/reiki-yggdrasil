import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import {
  ALLOWED_MIGRATIONS,
  schemaVerificationQuery
} from "../scripts/apply-reiki-supabase-migrations.mjs";
import { getProfileLiteInitialTabFromLocation } from "../src/lib/profileLiteClient.js";

const adminPageSource = readFileSync("src/pages/AdminPage.jsx", "utf8");
const profileLiteClientSource = readFileSync("src/lib/profileLiteClient.js", "utf8");
const profileLitePageSource = readFileSync("src/pages/ProfileLitePage.jsx", "utf8");
const profileLiteShellSource = readFileSync("src/pages/profile-lite/ProfileLiteShell.jsx", "utf8");
const profileAdminPanelSource = readFileSync("src/pages/profile-lite/ProfileAdminPanel.jsx", "utf8");
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
  /getCurrentAdmin\(session,\s*user\)/,
  "admin helper should check profile_cabinet_admins before falling back to VITE_ADMIN_EMAIL"
);

assert.match(
  supabaseClientSource,
  /updateProfileAccountPlan[\s\S]*normalizeMasterPlan\(accountPlan\)/,
  "admin account-plan updates should normalize legacy/provided plan values through normalizeMasterPlan"
);

assert.match(
  supabaseClientSource,
  /updateProfileAdminFields[\s\S]*body\.account_plan\s*=\s*normalizeMasterPlan\(accountPlan\)[\s\S]*body\.status\s*=\s*status/,
  "admin participant save helper should update both account_plan and profile status safely"
);

assert.match(
  profileAdminPanelSource,
  /Email или имя участника/,
  "ProfileAdminPanel should expose the requested participant search placeholder"
);

assert.match(
  profileAdminPanelSource,
  /listProfilesForAdmin\(session,\s*participantSearch\)/,
  "ProfileAdminPanel should load searchable participant profiles through the admin helper"
);

assert.match(
  supabaseClientSource,
  /display_name\.ilike\.\*\$\{term\}\*,email\.ilike\.\*\$\{term\}\*/,
  "admin participant search should search profile display_name and email through profile_cabinet_profiles"
);

assert.match(
  profileAdminPanelSource,
  /updateProfileAdminFields\(profileId,\s*\{[\s\S]*accountPlan:\s*nextPlan[\s\S]*status:\s*nextStatus[\s\S]*\},\s*session\)/,
  "ProfileAdminPanel should save participant plan and status together through one admin helper"
);

assert.match(
  profileAdminPanelSource,
  /draft[\s\S]*pending[\s\S]*approved[\s\S]*rejected/,
  "ProfileAdminPanel should expose draft / pending / approved / rejected status options"
);

assert.match(
  profileAdminPanelSource,
  /Уровень и статус участника обновлены\./,
  "ProfileAdminPanel should show a success message after saving participant plan/status"
);

assert.match(
  adminPageSource,
  /import ProfileAdminPanel from "\.\/profile-lite\/ProfileAdminPanel\.jsx";/,
  "AdminPage compatibility route should reuse ProfileAdminPanel instead of duplicating participant management"
);

assert.doesNotMatch(
  adminPageSource,
  /participantPlans|participantProfiles|adminParticipantRow/,
  "AdminPage should not keep duplicated participant management state/rendering"
);

assert.match(
  profileLiteClientSource,
  /admin[\s\S]*Админ[\s\S]*\/profile\?tab=admin/,
  "Profile Lite should know the internal admin tab route"
);

assert.equal(
  getProfileLiteInitialTabFromLocation("/profile", "?tab=admin"),
  "admin",
  "Profile Lite should support /profile?tab=admin"
);

assert.match(
  profileLiteShellSource,
  /isProfileAdmin[\s\S]*Админ/,
  "ProfileLiteShell should render the admin nav item only when the current user is admin"
);

assert.match(
  profileLitePageSource,
  /isCurrentUserAdmin\((?:nextSession|session),\s*currentUser\)/,
  "ProfileLitePage should detect admin access from the authenticated cabinet session"
);

assert.match(
  profileLitePageSource,
  /isProfileAdmin[\s\S]*<ProfileAdminPanel\b/,
  "ProfileLitePage should render the shared ProfileAdminPanel inside the cabinet admin tab"
);

assert.match(
  profileLitePageSource,
  /activeTab === "admin" && !isProfileAdmin/,
  "ProfileLitePage should not keep a non-admin user on the hidden admin tab"
);

assert.match(
  adminPageSource,
  /isCurrentUserAdmin\(session,\s*currentUser\)/,
  "AdminPage compatibility route should grant access through profile_cabinet_admins first"
);

console.log("profileAdminCabinetLevelsContract: all assertions passed.");
