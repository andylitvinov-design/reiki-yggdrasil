import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import {
  buildCourseInviteLink,
  cleanupCourseClaimFromUrl,
  parseCourseIntentFromLocation
} from "../src/lib/profileCoursesClient.js";

const migrationSource = readFileSync("supabase/migrations/20260627190000_profile_course_audio_invites.sql", "utf8");
const clientSource = readFileSync("src/lib/profileCoursesClient.js", "utf8");
const profileLiteSource = readFileSync("src/pages/ProfileLitePage.jsx", "utf8");
const adminSource = readFileSync("src/pages/admin/AdminCoursesPanel.jsx", "utf8");

assert.equal(
  buildCourseInviteLink("abc123", {
    origin: "https://2mentalica.vercel.app",
    course: "magic-money",
    step: "degree-1"
  }),
  "https://2mentalica.vercel.app/profile?claim=abc123&tab=courses&course=magic-money&step=degree-1"
);

assert.equal(parseCourseIntentFromLocation("/profile", "?claim=abc123&tab=courses&course=magic-money&step=degree-1").claim, "abc123");

globalThis.window = {
  location: {
    href: "https://2mentalica.vercel.app/profile?claim=abc123&tab=courses&course=magic-money&step=degree-1",
  },
  history: {
    next: "",
    replaceState(_state, _title, next) {
      this.next = next;
    }
  }
};
globalThis.document = { title: "test" };
assert.equal(cleanupCourseClaimFromUrl(), "/profile?tab=courses&course=magic-money&step=degree-1");
assert.equal(globalThis.window.history.next.includes("claim="), false);
delete globalThis.window;
delete globalThis.document;

assert.match(migrationSource, /create table if not exists public\.profile_cabinet_course_invites/);
assert.match(migrationSource, /token_hash text not null unique/);
assert.match(migrationSource, /encode\(digest\(v_token, 'sha256'\), 'hex'\)/);
assert.match(migrationSource, /create or replace function public\.claim_course_invite/);
assert.match(migrationSource, /insert into public\.profile_cabinet_course_access/);
assert.doesNotMatch(migrationSource, /raw_token|invite_token_hash.*v_token/s, "migration must not store raw invite tokens");

assert.match(clientSource, /PENDING_COURSE_INTENT_KEY = "reiki-yggdrasil-pending-course-intent"/);
assert.match(profileLiteSource, /storePendingCourseIntent[\s\S]*claimCourseInvite[\s\S]*cleanupCourseClaimFromUrl/, "Profile Lite should persist claim intent, claim after auth, and clean the URL");
assert.match(adminSource, /Создать invite link/);
assert.match(adminSource, /buildCourseInviteLink/);

console.log("profileCourseInviteContract tests passed");
