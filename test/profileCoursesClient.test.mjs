import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import {
  MAGIC_MONEY_COURSE,
  MAGIC_MONEY_DEGREE_1,
  PENDING_COURSE_INTENT_KEY,
  buildCourseInviteLink,
  buildCourseAccessIndex,
  buildLessonAudioPatch,
  courseAccessScopeText,
  courseAccessStatusText,
  courseStatusText,
  createEmptyCourseForm,
  createEmptyCourseLessonForm,
  createEmptyCourseStepForm,
  findCourseBySlug,
  findStepBySlug,
  normalizeCourseAccessForm,
  normalizeCourseForm,
  normalizeCourseLessonForm,
  normalizeCourseStepForm,
  parseCourseIntentFromLocation
} from "../src/lib/profileCoursesClient.js";

assert.deepEqual(createEmptyCourseForm({ title: "Курс" }), {
  id: "",
  slug: "",
  title: "Курс",
  description: "",
  cover_url: "",
  status: "draft",
  position: 0
});

assert.deepEqual(normalizeCourseForm({
  slug: " reiki-yggdrasil ",
  title: "  Рейки Иггдрасиль ",
  description: " Описание ",
  cover_url: " https://example.com/cover.jpg ",
  position: "7",
  status: "unknown"
}), {
  slug: "reiki-yggdrasil",
  title: "Рейки Иггдрасиль",
  description: "Описание",
  cover_url: "https://example.com/cover.jpg",
  status: "draft",
  position: 7
});

assert.deepEqual(normalizeCourseForm({ slug: "", title: "Курс" }), {
  slug: null,
  title: "Курс",
  description: "",
  cover_url: "",
  status: "draft",
  position: 0
});

assert.deepEqual(createEmptyCourseStepForm({ course_id: "course-1" }).course_id, "course-1");
assert.deepEqual(normalizeCourseStepForm({
  course_id: " course-1 ",
  slug: " degree-1 ",
  title: " Ступень 1 ",
  description: " Доступна ",
  position: "2",
  status: "published"
}), {
  course_id: "course-1",
  slug: "degree-1",
  title: "Ступень 1",
  description: "Доступна",
  status: "published",
  position: 2
});

assert.deepEqual(createEmptyCourseLessonForm({ step_id: "step-1" }).step_id, "step-1");
assert.deepEqual(normalizeCourseLessonForm({
  course_id: " course-1 ",
  step_id: " step-1 ",
  slug: " lesson-1 ",
  title: " Урок ",
  body: " <b>plain text</b> ",
  video_url: " https://youtu.be/example ",
  audio_url: " https://cdn.example.com/audio.mp3 ",
  audio_storage_bucket: " profile-cabinet-media ",
  audio_storage_path: " courses/magic-money/degree-1/lesson-1/audio.mp3 ",
  audio_mime_type: " audio/mpeg ",
  audio_size_bytes: "12345",
  position: "3",
  status: "archived"
}), {
  course_id: "course-1",
  step_id: "step-1",
  slug: "lesson-1",
  title: "Урок",
  body: "<b>plain text</b>",
  video_url: "https://youtu.be/example",
  audio_url: "https://cdn.example.com/audio.mp3",
  audio_storage_bucket: "profile-cabinet-media",
  audio_storage_path: "courses/magic-money/degree-1/lesson-1/audio.mp3",
  audio_mime_type: "audio/mpeg",
  audio_size_bytes: 12345,
  status: "archived",
  position: 3
});

assert.deepEqual(normalizeCourseAccessForm({
  profileId: " profile-1 ",
  userId: " user-1 ",
  courseId: " course-1 ",
  stepId: " step-1 ",
  accessScope: "course"
}), {
  profile_id: "profile-1",
  user_id: "user-1",
  course_id: "course-1",
  step_id: null,
  access_scope: "course",
  status: "active"
});

assert.deepEqual(normalizeCourseAccessForm({
  profile_id: "profile-1",
  course_id: "course-1",
  step_id: "step-1",
  access_scope: "step",
  status: "revoked"
}), {
  profile_id: "profile-1",
  user_id: null,
  course_id: "course-1",
  step_id: "step-1",
  access_scope: "step",
  status: "revoked"
});

const accessIndex = buildCourseAccessIndex([
  { course_id: "course-full", step_id: null, access_scope: "course", status: "active" },
  { course_id: "course-step", step_id: "step-1", access_scope: "step", status: "active" },
  { course_id: "course-step", step_id: "step-2", access_scope: "step", status: "active" },
  { course_id: "course-revoked", step_id: null, access_scope: "course", status: "revoked" },
  { course_id: "course-empty", step_id: "", access_scope: "step", status: "active" },
  { course_id: "", step_id: "step-x", access_scope: "step", status: "active" }
]);

assert.equal(accessIndex.fullCourseIds.has("course-full"), true, "full course access should index the whole course");
assert.equal(accessIndex.fullCourseIds.has("course-revoked"), false, "revoked course access must be ignored");
assert.deepEqual([...accessIndex.stepIdsByCourseId.get("course-step")], ["step-1", "step-2"], "step access should group by course");
assert.equal(accessIndex.stepIdsByCourseId.has("course-empty"), false, "step access without step_id is invalid for MVP");

assert.equal(courseStatusText("published"), "Опубликован");
assert.equal(courseAccessScopeText("course"), "Весь курс");
assert.equal(courseAccessStatusText("revoked"), "Закрыт");
assert.equal(MAGIC_MONEY_COURSE.slug, "magic-money");
assert.equal(MAGIC_MONEY_DEGREE_1.slug, "degree-1");
assert.equal(PENDING_COURSE_INTENT_KEY, "reiki-yggdrasil-pending-course-intent");

assert.deepEqual(parseCourseIntentFromLocation("/profile", "?tab=courses&course=magic-money&step=degree-1&claim=token-1"), {
  tab: "courses",
  course: "magic-money",
  step: "degree-1",
  claim: "token-1",
  hasCourseIntent: true
});
assert.equal(parseCourseIntentFromLocation("/profile/courses", "").tab, "courses");
assert.equal(findCourseBySlug([{ id: "course-1", slug: "magic-money" }], "magic-money").id, "course-1");
assert.equal(findStepBySlug([{ id: "step-1", slug: "degree-1" }], "degree-1").id, "step-1");
assert.equal(
  buildCourseInviteLink("raw-token-once", { origin: "https://2mentalica.vercel.app" }),
  "https://2mentalica.vercel.app/profile?claim=raw-token-once&tab=courses&course=magic-money&step=degree-1"
);
assert.deepEqual(buildLessonAudioPatch({
  bucket: "profile-cabinet-media",
  path: "courses/magic-money/degree-1/lesson/audio.mp3",
  ref: "storage://profile-cabinet-media/courses/magic-money/degree-1/lesson/audio.mp3",
  metadata: { mimeType: "audio/mpeg", size: 4096 }
}), {
  audio_url: "storage://profile-cabinet-media/courses/magic-money/degree-1/lesson/audio.mp3",
  audio_storage_bucket: "profile-cabinet-media",
  audio_storage_path: "courses/magic-money/degree-1/lesson/audio.mp3",
  audio_mime_type: "audio/mpeg",
  audio_size_bytes: 4096
});

const clientSource = readFileSync("src/lib/profileCoursesClient.js", "utf8");
const migrationSource = readFileSync("supabase/migrations/20260607120000_profile_courses_individual_access_mvp.sql", "utf8");
const audioInviteMigrationSource = readFileSync("supabase/migrations/20260627190000_profile_course_audio_invites.sql", "utf8");

assert.match(clientSource, /const COURSES_TABLE = "profile_cabinet_courses"/);
assert.match(clientSource, /const COURSE_STEPS_TABLE = "profile_cabinet_course_steps"/);
assert.match(clientSource, /const COURSE_LESSONS_TABLE = "profile_cabinet_course_lessons"/);
assert.match(clientSource, /const COURSE_ACCESS_TABLE = "profile_cabinet_course_access"/);
assert.match(clientSource, /revokeCourseAccess[\s\S]*status: "revoked"/, "revoke should patch status instead of deleting");
assert.doesNotMatch(clientSource, /lesson_access|access_scope:\s*"lesson"|access_scope\s*=\s*'lesson'|per[-_ ]lesson/i, "Courses MVP must not implement per-lesson access");
assert.doesNotMatch(migrationSource, /profile_cabinet_course_lesson_access|lesson_access|access_scope\s*=\s*'lesson'|access_scope in \([^)]*'lesson'/i, "Migration must not add per-lesson access");
assert.match(migrationSource, /profile_course_access_unique_active_course/, "Migration should protect duplicate active full-course grants");
assert.match(migrationSource, /profile_course_access_unique_active_step/, "Migration should protect duplicate active step grants");
assert.match(migrationSource, /profile_cabinet_is_admin\(\)/, "Courses RLS should reuse existing DB-level admin helper");
assert.match(audioInviteMigrationSource, /profile_cabinet_course_invites/, "Course invite migration should create invite table");
assert.match(audioInviteMigrationSource, /token_hash text not null unique/, "Course invites must store only token hashes");
assert.doesNotMatch(audioInviteMigrationSource, /raw_token|invite_token text not null/, "Course invite table must not persist raw tokens");
assert.match(audioInviteMigrationSource, /profile_cabinet_can_access_course_audio_path/, "Course audio Storage RLS helper should be present");

console.log("profileCoursesClient tests passed");
