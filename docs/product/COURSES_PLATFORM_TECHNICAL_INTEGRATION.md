# Courses Platform Technical Integration — Reiki Yggdrasil

Last updated: 2026-06-07  
Project: Reiki Yggdrasil / Mentalica  
Repo: `andylitvinov-design/reiki-yggdrasil`  
Related concept: `docs/product/COURSES_PLATFORM_CONCEPT.md`  
Status: technical integration blueprint for Codex  
Target implementation branch: `codex/profile-courses-individual-access-mvp`

## 1. Purpose of this document

This document adds practical implementation details for the Courses MVP so Codex can implement it quickly and safely inside the existing project infrastructure.

It answers:

- where course data should live;
- where course media/materials should live;
- how courses are created from admin;
- how master access is assigned;
- how the new feature connects to current routes/tabs/modules;
- which existing files/patterns should be reused;
- which checks are required before reporting completion.

This document is docs-only. It does not apply migrations and does not change production.

## 2. Existing infrastructure to reuse

### 2.1 App/router

Use current manual routing in:

```text
src/main.jsx
```

Do not add React Router.

Add route:

```text
/profile/courses
```

It should return `ProfileLitePage` with `initialTab="courses"`.

### 2.2 Profile Lite tab system

Use current tab architecture in:

```text
src/lib/profileLiteClient.js
src/pages/ProfileLitePage.jsx
src/pages/profile-lite/ProfileLiteShell.jsx
```

Add visible tab:

```js
{ id: "courses", label: "Курсы", href: "/profile/courses" }
```

Place it between:

```text
Гримуар → Курсы → Услуги
```

Reason: materials from Grimoire can later become course materials, and courses can later connect to services/sales.

### 2.3 Existing profile identity

The main participant identity should be the master profile row:

```text
profile_cabinet_profiles.id
```

Access rows should use:

```text
profile_id = profile_cabinet_profiles.id
user_id = auth user id, optional duplicate for convenience
```

Admin access selector should load approved master profiles from the existing profile table.

If Codex cannot safely reuse `listApprovedProfiles(session)` for admin selector, add a dedicated function:

```js
listCourseAccessProfiles(session)
```

But do not create a separate users table.

### 2.4 Existing Supabase client pattern

Use the current REST-client style from:

```text
src/lib/profileMaterialsClient.js
src/lib/profileServicesClient.js
src/lib/supabaseClient.js
```

Create:

```text
src/lib/profileCoursesClient.js
```

Use:

```js
import { getStoredSession, supabaseEnv } from "./supabaseClient.js";
```

Use local `SUPABASE_URL` and `SUPABASE_ANON_KEY` reads, matching the existing clients.

### 2.5 Existing media/storage infrastructure

The project already has:

```text
src/lib/profileMediaClient.js
```

Important existing pieces:

```text
PROFILE_MEDIA_BUCKET = "profile-cabinet-media"
PROFILE_MEDIA_MAX_BYTES = 5 MB
storage refs: storage://profile-cabinet-media/<path>
signed URLs through createSignedMediaUrl(...)
uploadProfileMedia(...)
```

MVP rule:

```text
Course lessons should store video/audio as public-safe URLs first.
Do not implement heavy private video hosting in the first PR.
```

If file upload for course audio/PDF is added later, reuse `profile-cabinet-media` bucket and add a course-specific path builder, do not create a new bucket unless there is a strong reason.

Recommended future storage paths:

```text
<profileId>/courses/<courseId>/lessons/<lessonId>/<uuid>-filename.ext
admin/courses/<courseId>/lessons/<lessonId>/<uuid>-filename.ext
```

For MVP, store lesson media fields as:

```text
video_url text
video_ref text optional later
audio_url text
audio_ref text optional later
attachment_url text optional later
attachment_ref text optional later
```

In the first implementation, prefer only:

```text
video_url
audio_url
```

The `*_ref` fields can be added later if uploaded private files become necessary.

## 3. Data architecture

### 3.1 Required tables

Create additive migration:

```text
supabase/migrations/YYYYMMDDHHMMSS_profile_courses_individual_access_mvp.sql
```

Required tables:

```text
profile_cabinet_courses
profile_cabinet_course_steps
profile_cabinet_course_lessons
profile_cabinet_course_access
```

### 3.2 Course table

```sql
create table if not exists profile_cabinet_courses (
  id uuid primary key default gen_random_uuid(),
  slug text unique,
  title text not null,
  description text not null default '',
  cover_url text not null default '',
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  position integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

Notes:

- `slug` is for stable admin-friendly course identity and future public/internal links.
- `cover_url` should only store public-safe URL or empty string in MVP.
- Do not connect courses to public feed in MVP.

### 3.3 Course steps table

```sql
create table if not exists profile_cabinet_course_steps (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references profile_cabinet_courses(id) on delete cascade,
  title text not null,
  description text not null default '',
  position integer not null default 0,
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

Product meaning:

```text
Course Step = ступень / модуль / уровень курса.
```

Access is granted either to the whole course or to one/many course steps.

### 3.4 Course lessons table

```sql
create table if not exists profile_cabinet_course_lessons (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references profile_cabinet_courses(id) on delete cascade,
  step_id uuid not null references profile_cabinet_course_steps(id) on delete cascade,
  title text not null,
  body text not null default '',
  video_url text not null default '',
  audio_url text not null default '',
  position integer not null default 0,
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

Lesson content MVP:

```text
body = lesson text / instructions / links
video_url = YouTube/Vimeo/public video URL or empty
audio_url = public audio URL or empty
```

No `dangerouslySetInnerHTML` for `body`.

### 3.5 Course access table

```sql
create table if not exists profile_cabinet_course_access (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profile_cabinet_profiles(id) on delete cascade,
  user_id uuid,
  course_id uuid not null references profile_cabinet_courses(id) on delete cascade,
  step_id uuid references profile_cabinet_course_steps(id) on delete cascade,
  access_scope text not null default 'step' check (access_scope in ('course', 'step')),
  status text not null default 'active' check (status in ('active', 'revoked')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

Meaning:

```text
access_scope='course' + step_id null = full course access
access_scope='step' + step_id not null = access to one course step
```

Avoid hard delete. Revoke access with:

```sql
status = 'revoked'
```

### 3.6 Recommended indexes

```sql
create index if not exists profile_courses_status_position_idx
on profile_cabinet_courses(status, position, created_at);

create index if not exists profile_course_steps_course_status_position_idx
on profile_cabinet_course_steps(course_id, status, position, created_at);

create index if not exists profile_course_lessons_step_status_position_idx
on profile_cabinet_course_lessons(step_id, status, position, created_at);

create index if not exists profile_course_access_profile_status_idx
on profile_cabinet_course_access(profile_id, status);

create index if not exists profile_course_access_course_step_idx
on profile_cabinet_course_access(course_id, step_id);
```

### 3.7 Recommended duplicate protection

```sql
create unique index if not exists profile_course_access_unique_active_course
on profile_cabinet_course_access(profile_id, course_id)
where status = 'active' and access_scope = 'course' and step_id is null;

create unique index if not exists profile_course_access_unique_active_step
on profile_cabinet_course_access(profile_id, course_id, step_id)
where status = 'active' and access_scope = 'step' and step_id is not null;
```

This prevents duplicate active access grants.

## 4. RLS and access resolution

### 4.1 Critical RLS issue

Frontend admin detection uses:

```text
VITE_ADMIN_EMAIL
```

Supabase RLS cannot directly trust frontend env values.

Before implementing admin RLS, Codex must inspect existing migrations for:

```text
profile_cabinet_admins
admin helper functions
policies using auth.jwt()->>'email'
```

If no DB-level admin pattern exists, Codex should either:

1. add a small DB-level admin table/policy pattern, if consistent with the repo;
2. or keep the migration conservative and mark admin RLS as `needs verification`.

Do not create insecure policies just to make the UI work.

### 4.2 Master-side access resolution in client

Use simple readable logic first.

Network flow:

```text
current user logs in
↓
ProfileLitePage loads own profile via getOwnProfile(user.id, session)
↓
Courses module uses profile.id
↓
profileCoursesClient loads active access rows for profile.id
↓
builds accessible course ids and step ids
↓
loads published courses/steps/lessons
```

Client helper:

```js
export function buildCourseAccessIndex(accessRows = []) {
  const fullCourseIds = new Set();
  const stepIdsByCourseId = new Map();

  for (const row of accessRows || []) {
    if (row?.status !== "active") continue;
    const courseId = String(row.course_id || "").trim();
    const stepId = String(row.step_id || "").trim();
    if (!courseId) continue;

    if (row.access_scope === "course" && !stepId) {
      fullCourseIds.add(courseId);
      continue;
    }

    if (row.access_scope === "step" && stepId) {
      if (!stepIdsByCourseId.has(courseId)) stepIdsByCourseId.set(courseId, new Set());
      stepIdsByCourseId.get(courseId).add(stepId);
    }
  }

  return { fullCourseIds, stepIdsByCourseId };
}
```

Use this helper in:

```text
listAvailableCoursesForProfile(profileId, session)
listAvailableCourseSteps(profileId, courseId, session)
listAvailableCourseLessons(profileId, courseId, stepId, session)
```

### 4.3 UI visibility rule

MVP should show only accessible content.

Do not show locked steps in MVP unless trivial.

Recommended MVP:

```text
Course list: only courses with active access.
Step list: only accessible published steps.
Lesson list: only published lessons inside selected accessible step.
```

Later enhancement:

```text
Show locked steps as 🔒 Закрыто.
```

## 5. Admin creation workflow

### 5.1 Admin route

Use existing route:

```text
/profile/admin
```

Do not create a separate `/admin/courses` route in MVP.

### 5.2 Admin sections to add

Inside `AdminPage.jsx`, add one new admin-only section:

```text
Курсы и доступы
```

Recommended internal layout:

```text
[Course editor]
[Step editor]
[Lesson editor]
[Access manager]
[Current access list]
```

Keep it compact. Do not redesign the whole admin page.

### 5.3 Course creation flow

Admin fills:

```text
Course title
Slug
Description
Cover URL optional
Position
Status draft/published/archived
```

On save:

```text
createCourse(normalizeCourseForm(...), session)
```

If course has `id`, use:

```text
updateCourse(id, patch, session)
```

After save:

```text
refresh listAdminCourses(session)
select saved course
```

### 5.4 Step creation flow

Admin selects course, then fills:

```text
Step title
Description
Position
Status
```

On save:

```text
createCourseStep(normalizeCourseStepForm(...), session)
```

After save:

```text
refresh listAdminCourseSteps(courseId, session)
select saved step
```

### 5.5 Lesson creation flow

Admin selects course and step, then fills:

```text
Lesson title
Position
Video URL
Audio URL
Lesson text body
Status
```

On save:

```text
createCourseLesson(normalizeCourseLessonForm(...), session)
```

After save:

```text
refresh listAdminCourseLessons(courseId, stepId, session)
```

### 5.6 Access grant flow

Admin selects:

```text
Master profile
Course
Access type: full course or specific step
Step, only if specific step
```

For full course access:

```js
grantCourseAccess({
  profileId,
  userId,
  courseId,
  stepId: "",
  accessScope: "course"
}, session)
```

For step access:

```js
grantCourseAccess({
  profileId,
  userId,
  courseId,
  stepId,
  accessScope: "step"
}, session)
```

After grant:

```text
refresh listAdminCourseAccess(session)
```

### 5.7 Access revoke flow

Do not delete access rows.

Use:

```js
revokeCourseAccess(accessId, session)
```

This should patch:

```js
{ status: "revoked", updated_at: new Date().toISOString() }
```

### 5.8 Admin convenience requirements

To make it convenient for the user from admin:

- course selector should keep current course selected after save;
- step selector should filter steps by selected course;
- lesson editor should filter lessons by selected course + selected step;
- access manager should show readable master names, not only ids;
- access list should group or at least display:

```text
Master name/email
Course title
Step title or “Весь курс”
Status
Action: Закрыть доступ
```

If the UI is too big, extract:

```text
src/pages/admin/AdminCoursesPanel.jsx
```

But do not split prematurely if simple JSX is still manageable.

## 6. Master courses workflow

### 6.1 Route and tab

Master opens:

```text
/profile/courses
```

Profile Lite active tab:

```text
courses
```

### 6.2 Data flow in `ProfileLitePage.jsx`

Existing auth/profile flow should remain unchanged:

```text
stored session
↓
getCurrentUser(session)
↓
getOwnProfile(user.id, session)
↓
profile.id available
```

Courses should load only after:

```text
profile.id exists
session has access token
```

Use existing helper:

```text
hasProfileLiteSessionCredential(session)
```

### 6.3 State to add

Add to `ProfileLitePage.jsx`:

```js
const [courses, setCourses] = useState([]);
const [coursesStatus, setCoursesStatus] = useState("idle");
const [coursesError, setCoursesError] = useState("");

const [selectedCourseId, setSelectedCourseId] = useState("");
const [courseSteps, setCourseSteps] = useState([]);
const [selectedStepId, setSelectedStepId] = useState("");

const [courseLessons, setCourseLessons] = useState([]);
const [courseLessonsStatus, setCourseLessonsStatus] = useState("idle");
const [courseLessonsError, setCourseLessonsError] = useState("");
```

Use status values already common in the project:

```text
idle
loading
success
needs-verification
```

### 6.4 Effects to add

Add three effects:

```text
load available courses when profile.id/session changes
load available steps when selectedCourseId changes
load lessons when selectedStepId changes
```

Do not include these in the existing materials/services loading effects. Keep them separate for safety.

### 6.5 Module props

Add to `moduleProps` or pass directly:

```js
courses,
coursesStatus,
coursesError,
selectedCourseId,
courseSteps,
selectedStepId,
courseLessons,
courseLessonsStatus,
courseLessonsError
```

Rendered module entry:

```jsx
courses: (
  <ProfileLiteCoursesModule
    {...moduleProps}
    onCourseSelect={(courseId) => {
      setSelectedCourseId(courseId);
      setSelectedStepId("");
      setCourseLessons([]);
    }}
    onStepSelect={setSelectedStepId}
  />
)
```

## 7. Course materials and media storage

### 7.1 MVP material storage

In the first MVP, course materials should be stored in DB fields:

```text
course.title / description / cover_url
step.title / description
lesson.title / body / video_url / audio_url
```

This is enough to create courses from admin quickly.

### 7.2 Video

Preferred MVP format:

```text
YouTube / Vimeo / external public video URL
```

DB field:

```text
profile_cabinet_course_lessons.video_url
```

Rendering:

- if safe YouTube/Vimeo/public embed can be built, show iframe;
- otherwise show `Открыть видео` external link;
- do not render unknown URL as iframe.

### 7.3 Audio

Preferred MVP format:

```text
public http/https audio URL
```

DB field:

```text
profile_cabinet_course_lessons.audio_url
```

Rendering:

```jsx
<audio controls src={audioUrl} />
```

Only if:

```text
audio_url starts with http:// or https://
```

### 7.4 Uploaded files later

If uploading course files becomes necessary, extend `profileMediaClient.js` carefully.

Suggested new context kind:

```text
course-material
```

Suggested path:

```text
<profileId>/courses/<courseId>/lessons/<lessonId>/<uuid>-filename.ext
```

For admin-owned global course files, if there is no profile id:

```text
admin/courses/<courseId>/lessons/<lessonId>/<uuid>-filename.ext
```

But MVP should not depend on this. It should work with text + external URLs first.

### 7.5 Grimoire integration later

Later, Grimoire records can become course materials:

```text
Grimoire record
↓
Add to course
↓
Course lesson draft or lesson attachment
```

Do not implement this in first MVP unless specifically requested.

For future linking, add later table if needed:

```text
profile_cabinet_course_lesson_materials
- id
- lesson_id
- publication_id nullable
- media_ref nullable
- title
- notes
- position
```

Not needed for MVP.

## 8. UI structure details

### 8.1 `ProfileLiteCoursesModule.jsx`

Recommended layout:

```text
Hero:
  Курсы Академии
  Список доступных вам обучающих программ и ступеней.

Left:
  Courses list

Center:
  Selected course
  Steps list
  Selected step lessons

Right:
  Access explanation
  Help note
  Current profile info
```

Use existing classes:

```text
profileLiteModule
profileLiteCoursesModule
mandalaWorkspace
mandalaHero
workspaceMainColumns
profileLiteLegacyColumns
mandalaModeSidebar
workspaceCenterColumn
workspaceRightColumn
cabinetCard
cabinetNotice
cabinetError
cabinetStatus
cabinetPrimary
cabinetSecondary
```

### 8.2 Empty states

No courses:

```text
Курсы пока не открыты.
Администратор выдаст вам доступ к нужному курсу или ступени.
```

No steps:

```text
Для этого курса пока нет доступных ступеней.
```

No lessons:

```text
Уроки для этой ступени готовятся.
```

### 8.3 Admin UI minimal card labels

Use RU labels:

```text
Курсы и доступы
Курс
Ступень
Урок
Доступ мастера
Весь курс
Конкретная ступень
Выдать доступ
Закрыть доступ
Черновик
Опубликован
Архив
Активен
Закрыт
```

## 9. Public/private boundaries

Courses are private cabinet content in MVP.

Do not add:

```text
/feed integration
/masters/:id course listing
public course cards
homepage courses block
service shop course purchase
```

Allowed route only:

```text
/profile/courses
```

Allowed admin route:

```text
/profile/admin
```

Do not expose:

```text
storage:// refs
Supabase signed URLs
object_refs
bearer tokens
env values
private profile fields of other masters
access rows of other masters
```

## 10. Suggested implementation split for Codex

If Codex wants to make smaller PRs, split like this.

### PR 1 — Data/client/tests

Files:

```text
supabase/migrations/YYYYMMDDHHMMSS_profile_courses_individual_access_mvp.sql
src/lib/profileCoursesClient.js
test/profileCoursesClient.test.mjs
STATE.md
LOG.md
```

No UI except maybe tests.

### PR 2 — Master courses tab

Files:

```text
src/main.jsx
src/lib/profileLiteClient.js
src/pages/ProfileLitePage.jsx
src/pages/profile-lite/ProfileLiteCoursesModule.jsx
test/profileLiteCabinetContract.test.mjs
STATE.md
LOG.md
```

### PR 3 — Admin course manager

Files:

```text
src/pages/AdminPage.jsx
optional src/pages/admin/AdminCoursesPanel.jsx
STATE.md
LOG.md
```

This split is safer than one huge PR. But one PR is acceptable if Codex keeps changes minimal and checks pass.

## 11. Required tests/checks

Run:

```bash
node test/profileCoursesClient.test.mjs
npm run test:profile-lite
npm run test:profile-services
npm run test:profile-materials
npm run test:profile-feed
npm run test:public-master
npm run build
npm run check
git diff --check
```

If `npm run check` already includes the new test, still mention exact checks run.

## 12. Required Codex report

After implementation, Codex must report:

```text
Summary
Changed files
Migration added
Whether live migration was applied: yes/no
Admin UI behavior
Master UI behavior
Access model implemented
Checks run
What was not verified
Risks
Next recommended PR
```

Must explicitly mention:

```text
No env values exposed.
No production deploy performed unless explicitly requested.
Existing routes preserved.
Courses are private-only in MVP.
```

## 13. Copy-ready Codex prompt addendum

```text
Use docs/product/COURSES_PLATFORM_CONCEPT.md and docs/product/COURSES_PLATFORM_TECHNICAL_INTEGRATION.md as the source of truth.

Implement the Courses MVP by integrating into the existing Profile Lite infrastructure:
- manual route in src/main.jsx;
- PROFILE_LITE_TABS in src/lib/profileLiteClient.js;
- module map in src/pages/ProfileLitePage.jsx;
- new ProfileLiteCoursesModule.jsx;
- new profileCoursesClient.js;
- compact admin section in /profile/admin.

Course creation must be convenient from admin:
- create/edit course;
- create/edit step;
- create/edit lesson;
- grant/revoke access to a master for full course or specific step.

Access must be individual:
- do not use account_plan for course access;
- do not use public feed access;
- do not implement per-lesson access in MVP;
- lessons inherit access from steps.

Materials storage in MVP:
- text in lesson.body;
- public video URL in lesson.video_url;
- public audio URL in lesson.audio_url;
- do not implement private course upload unless necessary;
- if adding uploads later, reuse profile-cabinet-media and storage:// refs from profileMediaClient.js.

Keep the PR minimal and additive.
Do not break existing profile/materials/services/orders/mandalas/chats/admin flows.
```
