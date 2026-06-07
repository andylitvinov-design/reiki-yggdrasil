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

## 7. RLS direction

RLS must be conservative.

Recommended policies:

### 7.1 Courses

Admin:

- full select / insert / update / delete.

Authenticated master:

- can select only `published` courses that have an active access row for their profile.

### 7.2 Steps

Admin:

- full select / insert / update / delete.

Authenticated master:

- can select only `published` steps if:
  - there is active full-course access for this profile and course;
  - or there is active step access for this profile and step.

### 7.3 Lessons

Admin:

- full select / insert / update / delete.

Authenticated master:

- can select only `published` lessons if the parent step is accessible.

### 7.4 Access rows

Admin:

- full select / insert / update / delete.

Authenticated master:

- can select own active access rows only if needed for UI.
- should not see other masters' access rows.
- should not insert/update/delete access rows.

Important implementation note:

The current project uses frontend admin detection through `VITE_ADMIN_EMAIL`. Supabase RLS cannot directly read frontend env values. Codex must inspect existing migration patterns before implementing admin policies. If there is no DB-level admin table yet, either add a safe `profile_cabinet_admins` pattern or document `needs verification` and avoid weakening RLS.

## 8. Admin UX concept

Admin area:

```text
/profile/admin
```

Add a new section:

```text
Курсы
```

It should include four compact blocks.

### 8.1 Course editor

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

### 8.2 Step editor

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

### 8.3 Lesson editor

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

### 8.4 Access manager

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

## 9. Master UX concept

Master area:

```text
/profile/courses
```

Add a new Profile Lite tab:

```text
Курсы
```

### 9.1 Courses list

The master sees only accessible courses.

Card example:

```text
Reiki Yggdrasil
Доступно: 2 ступени
[Открыть курс]
```

### 9.2 Course view

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

### 9.3 Lesson view

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

## 10. Recommended file changes for implementation

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

## 11. Routing plan

Add route in `src/main.jsx`:

```text
/profile/courses → <ProfileLitePage initialTab="courses" ... />
```

Update `PROFILE_LITE_TABS`:

```text
{ id: "courses", label: "Курсы", href: "/profile/courses" }
```

Update route tab map in `getProfileLiteInitialTabFromLocation`:

```text
"/profile/courses": "courses"
```

Do not change existing route behavior.

## 12. Client API plan

Create `src/lib/profileCoursesClient.js` with functions:

```text
COURSE_STATUSES
COURSE_STEP_STATUSES
COURSE_LESSON_STATUSES
COURSE_ACCESS_SCOPES
COURSE_ACCESS_STATUSES

createEmptyCourseForm()
createEmptyCourseStepForm()
createEmptyCourseLessonForm()

normalizeCourseForm()
normalizeCourseStepForm()
normalizeCourseLessonForm()

courseStatusText()
courseAccessScopeText()
courseAccessStatusText()

listAdminCourses(session)
createCourse(course, session)
updateCourse(id, patch, session)

listAdminCourseSteps(courseId, session)
createCourseStep(step, session)
updateCourseStep(id, patch, session)

listAdminCourseLessons(courseId, stepId, session)
createCourseLesson(lesson, session)
updateCourseLesson(id, patch, session)

listAdminCourseAccess(session)
grantCourseAccess({ profileId, userId, courseId, stepId, accessScope }, session)
revokeCourseAccess(accessId, session)

listAvailableCoursesForProfile(profileId, session)
listAvailableCourseSteps(profileId, courseId, session)
listAvailableCourseLessons(profileId, courseId, stepId, session)
```

## 13. Implementation phases

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

## 14. What not to build in MVP

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

## 15. Risks

### 15.1 RLS / admin identity

The biggest risk is admin identity at DB level. Frontend `VITE_ADMIN_EMAIL` is not enough for Supabase RLS by itself. Codex must inspect existing migrations and admin patterns before implementing policies.

### 15.2 Overloading `AdminPage.jsx`

`AdminPage.jsx` already handles profile moderation and activity moderation. The courses admin UI should be compact and additive. If it becomes too large, extract course admin blocks into a separate component.

### 15.3 Profile lookup

Access rows should use `profile_id` as the main master identity. `user_id` can be duplicated for easier querying, but `profile_id` should remain the main link to the master cabinet.

### 15.4 Media URLs

Video and audio should be public-safe URLs in the MVP. Do not expose private storage refs or signed URLs in public output.

### 15.5 Live migration

The feature will not work on live until the Supabase migration is applied. Implementation report must clearly state whether live migration was applied or not.

## 16. Definition of done for MVP

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

## 17. Required checks

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

## 18. Codex implementation prompt skeleton

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
src/lib/supabaseClient.js, existing profile clients, supabase/migrations/*, test/*.

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
