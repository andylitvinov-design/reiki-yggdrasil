# Courses Platform Concept — Reiki Yggdrasil

Last updated: 2026-06-07  
Project: Reiki Yggdrasil / Mentalica  
Repo: `andylitvinov-design/reiki-yggdrasil`  
Status: product concept / implementation blueprint  
Scope: private learning platform inside existing Profile Lite cabinet and admin area  
Target implementation branch: `codex/profile-courses-individual-access-mvp`

## 1. Goal

Build a simple private learning platform inside the existing Reiki Yggdrasil site.

The platform should allow an admin to:

- create a course;
- create course steps / levels;
- add lessons with video, text, and audio;
- give individual access to specific masters;
- give access either to the whole course or only to specific course steps;
- revoke access later.

Masters should be able to:

- log into the existing Profile Lite cabinet;
- open a new `Курсы` section;
- see only the courses and steps they personally have access to;
- open available lessons;
- view text, video, and audio lesson materials.

This is not a full LMS in the first MVP. It is a controlled private course library with individual access management.

## 2. Current site architecture context

The current site already has the right foundation for a courses MVP:

- Vite / React app;
- manual route handling in `src/main.jsx`;
- existing routes `/`, `/profile`, `/profile/mandalas`, `/profile/services`, `/profile/orders`, `/profile/chats`, `/profile/admin`, `/masters`, `/masters/:id`, `/feed`;
- Profile Lite cabinet with tab-based modules;
- admin page with auth gate using `VITE_ADMIN_EMAIL`;
- Supabase REST clients in `src/lib/*Client.js`;
- existing master profile model in `profile_cabinet_profiles`;
- existing private cabinet modules for Grimoire, media, mandalas, services, orders, and chats.

Important existing files to inspect before implementation:

```text
src/main.jsx
src/lib/profileLiteClient.js
src/pages/ProfileLitePage.jsx
src/pages/profile-lite/ProfileLiteShell.jsx
src/pages/profile-lite/ProfileLiteMaterialsModule.jsx
src/pages/profile-lite/ProfileLiteServicesModule.jsx
src/pages/AdminPage.jsx
src/lib/supabaseClient.js
src/lib/profileMaterialsClient.js
src/lib/profileServicesClient.js
supabase/migrations/*
test/*
```

## 3. Product principle

Courses should be integrated into the existing private master cabinet, not built as a separate site.

Correct placement:

```text
/profile/courses
```

Correct UI pattern:

```text
Profile Lite tab → Courses module → available courses → available steps → lessons
```

Correct admin placement:

```text
/profile/admin → Courses management block
```

Do not introduce a new React router for this feature. Follow the existing manual route and tab architecture.

## 4. Core product model

The learning platform has four core objects:

```text
Course
↓
Course Step / Level
↓
Lesson
↓
Individual Access
```

Example:

```text
Course: Reiki Yggdrasil
  Step 1: Основы
    Lesson 1: Введение
    Lesson 2: Практика настройки
    Lesson 3: Аудио-медитация
  Step 2: Работа с каналом
    Lesson 1: Видео
    Lesson 2: Текстовая практика
```

Access is not global and not based on `account_plan`.

Access is individual:

```text
Master A → Course Reiki Yggdrasil → full course access
Master B → Course Reiki Yggdrasil → Step 1 only
Master C → Course Reiki Yggdrasil → Step 1 + Step 2
```

## 5. Access model

### 5.1 Main rule

Each master must be explicitly granted access.

Access can be granted at two levels:

```text
1. Whole course access
2. Specific step access
```

Lessons inherit access from their parent step.

Do not implement per-lesson access in the first MVP.

### 5.2 Access examples

Full course access:

```text
profile_id = master profile id
course_id = Reiki Yggdrasil course id
step_id = null
access_scope = course
status = active
```

Specific step access:

```text
profile_id = master profile id
course_id = Reiki Yggdrasil course id
step_id = Step 1 id
access_scope = step
status = active
```

Revoked access:

```text
status = revoked
```

### 5.3 Visibility logic for masters

A normal authenticated master should see:

- only published courses;
- only courses where they have active access;
- only published steps where they have direct step access or full course access;
- only published lessons inside available steps.

A normal master should not see:

- draft courses;
- archived courses;
- draft steps;
- archived steps;
- draft lessons;
- archived lessons;
- access rows of other masters;
- admin-only controls.

### 5.4 Admin visibility

Admin should be able to:

- see all courses;
- see all steps;
- see all lessons;
- see all access rows;
- create / update / archive courses;
- create / update / archive steps;
- create / update / archive lessons;
- grant access;
- revoke access.

## 6. Proposed data model

### 6.1 `profile_cabinet_courses`

Purpose: top-level course entity.

Fields:

```text
id uuid primary key default gen_random_uuid()
slug text unique
title text not null
description text default ''
cover_url text default ''
status text not null default 'draft'
position integer not null default 0
created_at timestamptz default now()
updated_at timestamptz default now()
```

Allowed statuses:

```text
draft
published
archived
```

### 6.2 `profile_cabinet_course_steps`

Purpose: course levels / stages / modules.

Fields:

```text
id uuid primary key default gen_random_uuid()
course_id uuid not null references profile_cabinet_courses(id) on delete cascade
title text not null
description text default ''
position integer not null default 0
status text not null default 'draft'
created_at timestamptz default now()
updated_at timestamptz default now()
```

Allowed statuses:

```text
draft
published
archived
```

### 6.3 `profile_cabinet_course_lessons`

Purpose: concrete lesson material inside a course step.

Fields:

```text
id uuid primary key default gen_random_uuid()
course_id uuid not null references profile_cabinet_courses(id) on delete cascade
step_id uuid not null references profile_cabinet_course_steps(id) on delete cascade
position integer not null default 0
title text not null
body text default ''
video_url text default ''
audio_url text default ''
status text not null default 'draft'
created_at timestamptz default now()
updated_at timestamptz default now()
```

Allowed statuses:

```text
draft
published
archived
```

### 6.4 `profile_cabinet_course_access`

Purpose: individual access matrix.

Fields:

```text
id uuid primary key default gen_random_uuid()
profile_id uuid not null
user_id uuid
course_id uuid not null references profile_cabinet_courses(id) on delete cascade
step_id uuid references profile_cabinet_course_steps(id) on delete cascade
access_scope text not null default 'step'
status text not null default 'active'
created_at timestamptz default now()
updated_at timestamptz default now()
```

Allowed `access_scope` values:

```text
course
step
```

Allowed `status` values:

```text
active
revoked
```

Rules:

- `access_scope='course'` and `step_id is null` means full course access.
- `access_scope='step'` and `step_id is not null` means access to one step.
- A master can have multiple active step access rows for the same course.
- Lessons inherit access from the parent step.
- Do not implement lesson-level access in the first MVP.

## 7. Technical implementation map for Codex

This section is the practical code map. Codex should follow it before writing code.

### 7.1 Implementation order

Recommended order:

```text
1. Inspect repo-local docs and current migration patterns.
2. Add additive Supabase migration.
3. Add profileCoursesClient.js with pure helpers and REST functions.
4. Add tests for client helpers before wiring UI.
5. Add /profile/courses route in src/main.jsx.
6. Add Courses tab in profileLiteClient.js.
7. Add ProfileLiteCoursesModule.jsx.
8. Wire courses state/effects/handlers into ProfileLitePage.jsx.
9. Add compact Courses admin block to AdminPage.jsx.
10. Update STATE.md and LOG.md.
11. Run checks.
```

Do not start from UI. Start from data and client helpers.

### 7.2 Route wiring

File:

```text
src/main.jsx
```

Find the existing Profile Lite route block:

```text
/profile/mandalas
/profile/services
/profile/orders
/profile/chats
/profile/settings
/profile
```

Add near the other `/profile/*` routes:

```jsx
if (path === "/profile/courses") {
  return <ProfileLitePage initialTab="courses" onNavigateHome={() => navigateTo("/")} onNavigateMasters={() => navigateTo("/masters")} />;
}
```

Do not change existing route order except adding this new route before the generic `/profile` fallback.

### 7.3 Tab wiring

File:

```text
src/lib/profileLiteClient.js
```

Add public tab to `PROFILE_LITE_TABS`:

```js
{ id: "courses", label: "Курсы", href: "/profile/courses" }
```

Recommended position:

```text
after Гримуар and before Услуги
```

Reason:

```text
Гримуар → Курсы → Услуги
```

Update `getProfileLiteInitialTabFromLocation` route map:

```js
"/profile/courses": "courses"
```

Do not add `courses` only to internal tabs. It should be visible in the normal cabinet tabs.

### 7.4 New client file

Add:

```text
src/lib/profileCoursesClient.js
```

Use the same style as:

```text
src/lib/profileMaterialsClient.js
src/lib/profileServicesClient.js
```

Expected constants:

```js
const COURSES_TABLE = "profile_cabinet_courses";
const COURSE_STEPS_TABLE = "profile_cabinet_course_steps";
const COURSE_LESSONS_TABLE = "profile_cabinet_course_lessons";
const COURSE_ACCESS_TABLE = "profile_cabinet_course_access";
```

Use local env reads like other clients:

```js
const SUPABASE_URL = import.meta.env?.VITE_SUPABASE_URL?.replace(/\/$/, "") || "";
const SUPABASE_ANON_KEY = import.meta.env?.VITE_SUPABASE_ANON_KEY || "";
```

Import:

```js
import { getStoredSession, supabaseEnv } from "./supabaseClient.js";
```

Create a local request helper similar to `profileMaterialsClient.js`:

```js
async function request(path, options = {}) {
  if (!supabaseEnv.isConfigured) throw courseError("Курсы требуют настройки подключения Supabase.");
  const session = options.session || getStoredSession();
  const response = await fetch(`${SUPABASE_URL}${path}`, {
    method: options.method || "GET",
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${session?.access_token || SUPABASE_ANON_KEY}`,
      "Content-Type": "application/json",
      ...(options.prefer ? { Prefer: options.prefer } : {})
    },
    body: options.body === undefined ? undefined : JSON.stringify(options.body)
  });
  const text = await response.text();
  const data = text ? JSON.parse(text) : null;
  if (!response.ok) throw courseError(data?.msg || data?.message || "Ошибка запроса курсов.", data);
  return data;
}
```

### 7.5 Pure helper functions to add first

In `profileCoursesClient.js` implement pure helpers before network functions.

Required enums:

```js
export const COURSE_STATUSES = ["draft", "published", "archived"];
export const COURSE_ACCESS_SCOPES = ["course", "step"];
export const COURSE_ACCESS_STATUSES = ["active", "revoked"];
```

Required labels:

```js
export function courseStatusText(status) {
  return ({ draft: "Черновик", published: "Опубликован", archived: "Архив" })[status] || "Черновик";
}

export function courseAccessScopeText(scope) {
  return ({ course: "Весь курс", step: "Ступень" })[scope] || "Ступень";
}
```

Required empty forms:

```js
export function createEmptyCourseForm(overrides = {}) {
  return { id: "", slug: "", title: "", description: "", cover_url: "", position: 0, status: "draft", ...overrides };
}

export function createEmptyCourseStepForm(overrides = {}) {
  return { id: "", course_id: "", title: "", description: "", position: 0, status: "draft", ...overrides };
}

export function createEmptyCourseLessonForm(overrides = {}) {
  return { id: "", course_id: "", step_id: "", title: "", body: "", video_url: "", audio_url: "", position: 0, status: "draft", ...overrides };
}
```

Required normalization:

```js
normalizeCourseForm(form, requestedStatus)
normalizeCourseStepForm(form, requestedStatus)
normalizeCourseLessonForm(form, requestedStatus)
normalizeCourseAccessForm(form)
```

Normalize all text with trim. Normalize invalid statuses to `draft`. Normalize invalid access scope to `step`. Normalize invalid access status to `active`. Normalize empty optional URLs to empty string. Normalize position to non-negative integer.

### 7.6 Admin network functions

Add these in `profileCoursesClient.js`:

```js
export async function listAdminCourses(session = getStoredSession())
export async function createCourse(course, session = getStoredSession())
export async function updateCourse(id, patch, session = getStoredSession())

export async function listAdminCourseSteps(courseId, session = getStoredSession())
export async function createCourseStep(step, session = getStoredSession())
export async function updateCourseStep(id, patch, session = getStoredSession())

export async function listAdminCourseLessons(courseId, stepId, session = getStoredSession())
export async function createCourseLesson(lesson, session = getStoredSession())
export async function updateCourseLesson(id, patch, session = getStoredSession())

export async function listAdminCourseAccess(session = getStoredSession())
export async function grantCourseAccess(access, session = getStoredSession())
export async function revokeCourseAccess(accessId, session = getStoredSession())
```

Implementation notes:

- all admin mutations require `session?.access_token`;
- use `Prefer: return=representation` for create/update;
- `revokeCourseAccess` should PATCH `{ status: "revoked", updated_at: new Date().toISOString() }`, not hard-delete;
- for updates, always add `updated_at`;
- use `order=position.asc,created_at.asc` for courses/steps/lessons where possible;
- do not expose env values in errors.

### 7.7 Master network functions

Add:

```js
export async function listAvailableCoursesForProfile(profileId, session = getStoredSession())
export async function listAvailableCourseSteps(profileId, courseId, session = getStoredSession())
export async function listAvailableCourseLessons(profileId, courseId, stepId, session = getStoredSession())
```

Simple REST strategy for MVP:

1. Fetch active access rows for the current `profileId`.
2. Build accessible course ids and step ids in JS.
3. Fetch published courses by ids.
4. Fetch published steps by course/step ids.
5. Fetch published lessons by course/step ids.

Prefer correctness and readability over one complex PostgREST query.

Access calculation helper:

```js
export function buildCourseAccessIndex(accessRows = []) {
  return {
    fullCourseIds: new Set(...),
    stepIdsByCourseId: new Map(...)
  };
}
```

This helper should be unit-tested.

Important:

- if a master has full course access, all published steps in that course are accessible;
- if a master has only step access, only those steps are accessible;
- do not show courses with no accessible steps unless full course access exists;
- draft/archived content must be filtered out client-side too, even if RLS should also block it.

### 7.8 New Profile Lite module

Add:

```text
src/pages/profile-lite/ProfileLiteCoursesModule.jsx
```

Component props:

```js
export default function ProfileLiteCoursesModule({
  courses,
  coursesStatus,
  coursesError,
  selectedCourseId,
  selectedStepId,
  courseSteps,
  courseLessons,
  courseLessonsStatus,
  courseLessonsError,
  onCourseSelect,
  onStepSelect,
  shellChrome
})
```

Recommended UI structure:

```jsx
<section className="profileLiteModule profileLiteCoursesModule mandalaWorkspace" aria-label="Курсы">
  <div className="mandalaHero">...</div>
  {shellChrome}
  <div className="workspaceMainColumns profileLiteLegacyColumns">
    <aside className="mandalaModeSidebar coursesSidebar">course list</aside>
    <div className="workspaceCenterColumn">selected course / steps / lessons</div>
    <div className="workspaceRightColumn">access note / help</div>
  </div>
</section>
```

Use existing classes first:

```text
profileLiteModule
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

Do not add a big custom CSS system in the first PR.

Lesson rendering rules:

- body: render as plain text in `<p>` or `<div>`;
- video URL: use safe public URL handling only;
- audio URL: render `<audio controls src={audioUrl}>` only if URL starts with `http://` or `https://`;
- if no lessons: show `Уроки для этой ступени готовятся.`.

### 7.9 Wire into `ProfileLitePage.jsx`

File:

```text
src/pages/ProfileLitePage.jsx
```

Imports to add near existing clients:

```js
import {
  listAvailableCoursesForProfile,
  listAvailableCourseSteps,
  listAvailableCourseLessons
} from "../lib/profileCoursesClient.js";
import ProfileLiteCoursesModule from "./profile-lite/ProfileLiteCoursesModule.jsx";
```

State to add near other module states:

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

Effect to load courses:

```js
useEffect(() => {
  let cancelled = false;
  async function loadCourses() {
    if (!profile?.id || !hasProfileLiteSessionCredential(session)) {
      setCourses([]);
      setCoursesStatus("idle");
      return;
    }
    setCoursesStatus("loading");
    setCoursesError("");
    try {
      const rows = await listAvailableCoursesForProfile(profile.id, session);
      if (cancelled) return;
      setCourses(rows || []);
      setSelectedCourseId((current) => current || rows?.[0]?.id || "");
      setCoursesStatus("success");
    } catch (error) {
      if (cancelled) return;
      setCourses([]);
      setCoursesStatus("needs-verification");
      setCoursesError(moduleError(error, "profile_cabinet_courses request failed or migration/RLS not applied"));
    }
  }
  void loadCourses();
  return () => { cancelled = true; };
}, [profile?.id, session]);
```

Effect to load steps:

```js
useEffect(() => {
  let cancelled = false;
  async function loadSteps() {
    if (!profile?.id || !selectedCourseId || !hasProfileLiteSessionCredential(session)) {
      setCourseSteps([]);
      setSelectedStepId("");
      return;
    }
    try {
      const rows = await listAvailableCourseSteps(profile.id, selectedCourseId, session);
      if (cancelled) return;
      setCourseSteps(rows || []);
      setSelectedStepId((current) => current || rows?.[0]?.id || "");
    } catch (error) {
      if (cancelled) return;
      setCourseSteps([]);
      setCoursesError(moduleError(error, "profile_cabinet_course_steps request failed or migration/RLS not applied"));
    }
  }
  void loadSteps();
  return () => { cancelled = true; };
}, [profile?.id, selectedCourseId, session]);
```

Effect to load lessons:

```js
useEffect(() => {
  let cancelled = false;
  async function loadLessons() {
    if (!profile?.id || !selectedCourseId || !selectedStepId || !hasProfileLiteSessionCredential(session)) {
      setCourseLessons([]);
      setCourseLessonsStatus("idle");
      return;
    }
    setCourseLessonsStatus("loading");
    setCourseLessonsError("");
    try {
      const rows = await listAvailableCourseLessons(profile.id, selectedCourseId, selectedStepId, session);
      if (cancelled) return;
      setCourseLessons(rows || []);
      setCourseLessonsStatus("success");
    } catch (error) {
      if (cancelled) return;
      setCourseLessons([]);
      setCourseLessonsStatus("needs-verification");
      setCourseLessonsError(moduleError(error, "profile_cabinet_course_lessons request failed or migration/RLS not applied"));
    }
  }
  void loadLessons();
  return () => { cancelled = true; };
}, [profile?.id, selectedCourseId, selectedStepId, session]);
```

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

Add rendered module:

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
),
```

Do not rewrite the existing module map. Add only the `courses` entry.

### 7.10 AdminPage implementation map

File:

```text
src/pages/AdminPage.jsx
```

Imports to add:

```js
import {
  createEmptyCourseForm,
  createEmptyCourseStepForm,
  createEmptyCourseLessonForm,
  listAdminCourses,
  createCourse,
  updateCourse,
  listAdminCourseSteps,
  createCourseStep,
  updateCourseStep,
  listAdminCourseLessons,
  createCourseLesson,
  updateCourseLesson,
  listAdminCourseAccess,
  grantCourseAccess,
  revokeCourseAccess
} from "../lib/profileCoursesClient.js";
```

Also use existing `listApprovedProfiles(session)` from `supabaseClient.js` or add a dedicated admin list function if needed. For MVP access manager, approved profiles are enough as selectable masters.

Admin state to add:

```js
const [adminCourses, setAdminCourses] = useState([]);
const [adminCourseSteps, setAdminCourseSteps] = useState([]);
const [adminCourseLessons, setAdminCourseLessons] = useState([]);
const [adminCourseAccess, setAdminCourseAccess] = useState([]);
const [adminMasterProfiles, setAdminMasterProfiles] = useState([]);
const [courseForm, setCourseForm] = useState(createEmptyCourseForm());
const [courseStepForm, setCourseStepForm] = useState(createEmptyCourseStepForm());
const [courseLessonForm, setCourseLessonForm] = useState(createEmptyCourseLessonForm());
const [courseAccessForm, setCourseAccessForm] = useState({ profile_id: "", user_id: "", course_id: "", step_id: "", access_scope: "course" });
const [coursesAdminMessage, setCoursesAdminMessage] = useState("");
const [coursesAdminError, setCoursesAdminError] = useState("");
```

Admin loading logic:

- after admin user is confirmed, load:
  - existing pending profiles/events;
  - all admin courses;
  - approved master profiles for access selector;
  - access rows.

Keep the existing moderation load intact. Add course loads in the same admin-only branch or a separate `loadCoursesAdminData()` helper.

Important:

- do not make the admin page impossible to open if courses migration is not applied;
- if courses request fails, show `needs verification` inside the Courses block only;
- do not break profile moderation and activity moderation.

Admin UI placement:

- place the Courses section after the login/admin validation notices and before or after current moderation sections;
- keep it compact;
- if JSX becomes too large, Codex may extract `src/pages/admin/AdminCoursesPanel.jsx`, but MVP can keep it in `AdminPage.jsx` if still readable.

Admin handlers:

```js
handleCourseSave()
handleCourseStepSave()
handleCourseLessonSave()
handleGrantCourseAccess()
handleRevokeCourseAccess(accessId)
```

Behavior:

- if form has `id`, update;
- if no `id`, create;
- after create/update, refresh relevant list;
- access revoke must PATCH status to `revoked`, not delete;
- access grant should set `access_scope='course'` with `step_id=null` for full course;
- access grant should set `access_scope='step'` with selected `step_id` for step access.

### 7.11 Migration implementation details

Add migration:

```text
supabase/migrations/YYYYMMDDHHMMSS_profile_courses_individual_access_mvp.sql
```

Migration should be additive only.

Recommended SQL details:

- `create table if not exists ...`;
- `alter table ... enable row level security`;
- add `check` constraints for statuses and access scopes;
- add indexes:

```sql
create index if not exists profile_courses_status_idx on profile_cabinet_courses(status);
create index if not exists profile_course_steps_course_status_idx on profile_cabinet_course_steps(course_id, status);
create index if not exists profile_course_lessons_step_status_idx on profile_cabinet_course_lessons(step_id, status);
create index if not exists profile_course_access_profile_status_idx on profile_cabinet_course_access(profile_id, status);
create index if not exists profile_course_access_course_step_idx on profile_cabinet_course_access(course_id, step_id);
```

Recommended uniqueness to avoid duplicate active access:

```sql
create unique index if not exists profile_course_access_unique_active_course
on profile_cabinet_course_access(profile_id, course_id)
where status = 'active' and access_scope = 'course' and step_id is null;

create unique index if not exists profile_course_access_unique_active_step
on profile_cabinet_course_access(profile_id, course_id, step_id)
where status = 'active' and access_scope = 'step' and step_id is not null;
```

RLS caution:

The repo must be inspected for existing admin DB patterns. If no DB-level admin table exists, Codex should not fake secure admin policies using frontend env. It should either:

1. add a small `profile_cabinet_admins` table and policies, if consistent with existing migrations;
2. or document that admin RLS needs verification before live application.

### 7.12 Test map

Add:

```text
test/profileCoursesClient.test.mjs
```

Test pure helpers without Supabase:

```text
normalizeCourseForm trims title/slug and normalizes status
normalizeCourseStepForm normalizes course_id/title/position/status
normalizeCourseLessonForm normalizes course_id/step_id/title/body/video/audio/status
normalizeCourseAccessForm normalizes access_scope/status and null step_id for course access
buildCourseAccessIndex separates full-course and step-level access
```

Update existing route/tab contract test if present:

```text
test/profileLiteCabinetContract.test.mjs
```

Expected assertions:

```text
PROFILE_LITE_TABS includes courses
getProfileLiteInitialTabFromLocation('/profile/courses') returns 'courses'
getProfileLiteRouteByTabId('courses') returns '/profile/courses'
```

Do not write tests that require live Supabase data.

### 7.13 Safe media helpers

In `ProfileLiteCoursesModule.jsx`, add local helpers or import existing ones if suitable:

```js
function isHttpUrl(value) {
  return typeof value === "string" && /^https?:\/\//i.test(value.trim());
}

function safeYoutubeEmbedUrl(value) {
  // Either reuse existing youtube helper from src/lib/youtube.js
  // or keep a small conservative local implementation.
}
```

Rendering rules:

- YouTube/Vimeo/public video links can be embedded only if helper returns a safe embed URL.
- Unknown `video_url` should be shown as a normal external link, not embedded.
- `audio_url` must be `http/https` before rendering `<audio>`.
- Never render `body` through `dangerouslySetInnerHTML`.

### 7.14 What to reuse from existing code

Reuse from `ProfileLiteMaterialsModule.jsx`:

- three-column workspace structure;
- hero block pattern;
- empty state pattern;
- `cabinetNotice` / `cabinetError` status messaging;
- filter/list/card layout idea.

Reuse from `profileMaterialsClient.js`:

- REST request style;
- normalize helper style;
- status label functions;
- session handling pattern.

Reuse from `profileServicesClient.js`:

- published/draft/archive status pattern;
- public-safe URL caution;
- `Prefer: return=representation` mutation style.

Reuse from `ProfileLitePage.jsx`:

- `hasProfileLiteSessionCredential(session)` before loading private data;
- `moduleError(error, fallback)` for safe messages;
- `Promise.allSettled` pattern only if loading many independent blocks;
- local module status values: `idle`, `loading`, `success`, `needs-verification`.

### 7.15 What not to reuse

Do not reuse service order/payment logic.

Do not reuse public feed/activity event logic for courses in MVP. Courses are private cabinet content, not public feed content.

Do not reuse Grimoire material categories as course access levels.

Do not reuse `account_plan` as course access.

Do not create course data inside `reikiKnowledgeBase.js`; courses must be Supabase-backed in this MVP.

## 8. RLS direction

RLS must be conservative.

Recommended policies:

### 8.1 Courses

Admin:

- full select / insert / update / delete.

Authenticated master:

- can select only `published` courses that have an active access row for their profile.

### 8.2 Steps

Admin:

- full select / insert / update / delete.

Authenticated master:

- can select only `published` steps if:
  - there is active full-course access for this profile and course;
  - or there is active step access for this profile and step.

### 8.3 Lessons

Admin:

- full select / insert / update / delete.

Authenticated master:

- can select only `published` lessons if the parent step is accessible.

### 8.4 Access rows

Admin:

- full select / insert / update / delete.

Authenticated master:

- can select own active access rows only if needed for UI.
- should not see other masters' access rows.
- should not insert/update/delete access rows.

Important implementation note:

The current project uses frontend admin detection through `VITE_ADMIN_EMAIL`. Supabase RLS cannot directly read frontend env values. Codex must inspect existing migration patterns before implementing admin policies. If there is no DB-level admin table yet, either add a safe `profile_cabinet_admins` pattern or document `needs verification` and avoid weakening RLS.

## 9. Admin UX concept

Admin area:

```text
/profile/admin
```

Add a new section:

```text
Курсы
```

It should include four compact blocks.

### 9.1 Course editor

Fields:

```text
Название курса
Slug
Описание
Обложка URL
Позиция
Статус: draft / published / archived
```

Actions:

```text
Создать курс
Сохранить изменения
Архивировать
```

### 9.2 Step editor

Fields:

```text
Выбрать курс
Название ступени
Описание ступени
Позиция
Статус: draft / published / archived
```

Actions:

```text
Создать ступень
Сохранить изменения
Архивировать
```

### 9.3 Lesson editor

Fields:

```text
Выбрать курс
Выбрать ступень
Название урока
Позиция
Видео URL
Аудио URL
Текст урока
Статус: draft / published / archived
```

Actions:

```text
Создать урок
Сохранить изменения
Архивировать
```

### 9.4 Access manager

Fields:

```text
Выбрать мастера
Выбрать курс
Тип доступа:
  - весь курс
  - конкретная ступень
Если конкретная ступень: выбрать ступень
```

Actions:

```text
Выдать доступ
Закрыть доступ
```

Access list example:

```text
Андрей Ли
- Reiki Yggdrasil — весь курс — active

Мария
- Reiki Yggdrasil — Ступень 1 — active
- Reiki Yggdrasil — Ступень 2 — active
```

## 10. Master UX concept

Master area:

```text
/profile/courses
```

Add a new Profile Lite tab:

```text
Курсы
```

### 10.1 Courses list

The master sees only accessible courses.

Card example:

```text
Reiki Yggdrasil
Доступно: 2 ступени
[Открыть курс]
```

### 10.2 Course view

Inside a selected course:

```text
Reiki Yggdrasil

Доступные ступени:
✓ Ступень 1 — Основы
✓ Ступень 2 — Работа с каналом
```

For MVP, locked steps may be hidden. Later, locked steps can be shown as:

```text
🔒 Ступень 3 — доступ закрыт
```

Recommended MVP behavior:

```text
Show only accessible steps.
```

This is simpler and safer.

### 10.3 Lesson view

Each lesson can show:

```text
Название урока
Видео
Аудио
Текст
```

Rules:

- render lesson body as plain text, not dangerous HTML;
- embed only safe public video URLs;
- use `<audio controls>` only for safe `http/https` audio URLs;
- do not expose private storage refs or signed URLs in public pages.

## 11. Recommended file changes for implementation

Add:

```text
src/lib/profileCoursesClient.js
src/pages/profile-lite/ProfileLiteCoursesModule.jsx
supabase/migrations/YYYYMMDDHHMMSS_profile_courses_individual_access_mvp.sql
test/profileCoursesClient.test.mjs
```

Update:

```text
src/main.jsx
src/lib/profileLiteClient.js
src/pages/ProfileLitePage.jsx
src/pages/AdminPage.jsx
STATE.md
LOG.md
```

Optional CSS updates:

```text
src/index.css
src/profileCabinet.css
```

Prefer existing classes before adding new styles.

## 12. Implementation phases

### Phase 1 — Courses MVP data + client

- Add migration.
- Add `profileCoursesClient.js`.
- Add tests for normalization and access filtering helpers.

### Phase 2 — Admin course editor

- Add course / step / lesson editor blocks to `/profile/admin`.
- Add access manager block.
- Keep existing admin moderation unchanged.

### Phase 3 — Master courses tab

- Add `/profile/courses` route.
- Add Profile Lite tab `Курсы`.
- Add `ProfileLiteCoursesModule`.
- Load only available courses / steps / lessons.

### Phase 4 — Polish

- Improve visual structure.
- Add locked step display if useful.
- Add better lesson player UI.
- Add public course landing pages only if later needed.

## 13. What not to build in MVP

Do not build in first MVP:

- payments;
- public course catalog;
- progress tracking;
- certificates;
- homework;
- comments;
- quizzes;
- notifications;
- drip schedule;
- per-lesson access;
- advanced roles;
- video upload/storage system;
- public course sales funnel.

These can be later phases.

## 14. Risks

### 14.1 RLS / admin identity

The biggest risk is admin identity at DB level. Frontend `VITE_ADMIN_EMAIL` is not enough for Supabase RLS by itself. Codex must inspect existing migrations and admin patterns before implementing policies.

### 14.2 Overloading `AdminPage.jsx`

`AdminPage.jsx` already handles profile moderation and activity moderation. The courses admin UI should be compact and additive. If it becomes too large, extract course admin blocks into a separate component.

### 14.3 Profile lookup

Access rows should use `profile_id` as the main master identity. `user_id` can be duplicated for easier querying, but `profile_id` should remain the main link to the master cabinet.

### 14.4 Media URLs

Video and audio should be public-safe URLs in the MVP. Do not expose private storage refs or signed URLs in public output.

### 14.5 Live migration

The feature will not work on live until the Supabase migration is applied. Implementation report must clearly state whether live migration was applied or not.

## 15. Definition of done for MVP

MVP is done when:

- admin can create a course;
- admin can create steps inside the course;
- admin can create lessons inside steps;
- admin can grant a master access to the full course;
- admin can grant a master access to one specific step;
- admin can revoke access;
- master sees `Курсы` tab;
- master sees only accessible courses and steps;
- master can open lessons with text/video/audio;
- draft/archived content is hidden from normal masters;
- existing routes still work;
- existing Profile Lite modules still work;
- checks pass.

## 16. Required checks

Run at minimum:

```bash
npm run test:profile-lite
npm run test:profile-services
npm run test:profile-materials
npm run test:profile-feed
npm run test:public-master
npm run build
npm run check
git diff --check
```

If new tests are added:

```bash
node test/profileCoursesClient.test.mjs
```

## 17. Codex implementation prompt skeleton

```text
Repo: https://github.com/andylitvinov-design/reiki-yggdrasil
Target branch: codex/profile-courses-individual-access-mvp
Live URL: https://reiki-yggdrasil.vercel.app

Task:
Implement Courses MVP with individual master access by course and by course step.

Read first:
AGENTS.md, README.md, STATE.md, LOG.md, package.json, vercel.json,
src/main.jsx, src/lib/profileLiteClient.js, src/pages/ProfileLitePage.jsx,
src/pages/profile-lite/ProfileLiteShell.jsx, src/pages/AdminPage.jsx,
src/lib/supabaseClient.js, existing profile clients, supabase/migrations/*, test/*,
docs/product/COURSES_PLATFORM_CONCEPT.md.

Do:
- add course/step/lesson/access migration;
- add profileCoursesClient.js;
- add /profile/courses route;
- add Courses tab;
- add ProfileLiteCoursesModule;
- add admin course/step/lesson/access manager section;
- add tests;
- update STATE.md and LOG.md.

Do not:
- build payments/certificates/progress/homework/quizzes/comments;
- implement per-lesson access;
- change public home page;
- break /profile, /masters, /profile/admin, services, orders, mandalas, chats;
- expose secrets or env values;
- apply live migrations unless explicitly requested.

Access rules:
- course access row gives full course access;
- step access row gives access only to that step;
- lessons inherit access from parent step;
- normal masters see only active/published accessible content;
- admin can manage everything.

Report:
- summary;
- changed files;
- migration added;
- admin UI behavior;
- master UI behavior;
- checks run;
- not verified;
- risks;
- next PR recommendation.
```
