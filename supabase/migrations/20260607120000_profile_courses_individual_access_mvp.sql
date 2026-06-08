create table if not exists public.profile_cabinet_courses (
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

create table if not exists public.profile_cabinet_course_steps (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.profile_cabinet_courses(id) on delete cascade,
  title text not null,
  description text not null default '',
  position integer not null default 0,
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.profile_cabinet_course_lessons (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.profile_cabinet_courses(id) on delete cascade,
  step_id uuid not null references public.profile_cabinet_course_steps(id) on delete cascade,
  title text not null,
  body text not null default '',
  video_url text not null default '',
  audio_url text not null default '',
  position integer not null default 0,
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.profile_cabinet_course_access (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profile_cabinet_profiles(id) on delete cascade,
  user_id uuid,
  course_id uuid not null references public.profile_cabinet_courses(id) on delete cascade,
  step_id uuid references public.profile_cabinet_course_steps(id) on delete cascade,
  access_scope text not null default 'step' check (access_scope in ('course', 'step')),
  status text not null default 'active' check (status in ('active', 'revoked')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profile_course_access_scope_shape check (
    (access_scope = 'course' and step_id is null)
    or
    (access_scope = 'step' and step_id is not null)
  )
);

create index if not exists profile_courses_status_position_idx
on public.profile_cabinet_courses(status, position, created_at);

create index if not exists profile_course_steps_course_status_position_idx
on public.profile_cabinet_course_steps(course_id, status, position, created_at);

create index if not exists profile_course_lessons_step_status_position_idx
on public.profile_cabinet_course_lessons(step_id, status, position, created_at);

create index if not exists profile_course_access_profile_status_idx
on public.profile_cabinet_course_access(profile_id, status);

create index if not exists profile_course_access_course_step_idx
on public.profile_cabinet_course_access(course_id, step_id);

create unique index if not exists profile_course_access_unique_active_course
on public.profile_cabinet_course_access(profile_id, course_id)
where status = 'active' and access_scope = 'course' and step_id is null;

create unique index if not exists profile_course_access_unique_active_step
on public.profile_cabinet_course_access(profile_id, course_id, step_id)
where status = 'active' and access_scope = 'step' and step_id is not null;

drop trigger if exists profile_cabinet_courses_updated_at on public.profile_cabinet_courses;
create trigger profile_cabinet_courses_updated_at
before update on public.profile_cabinet_courses
for each row execute function public.profile_cabinet_touch_updated_at();

drop trigger if exists profile_cabinet_course_steps_updated_at on public.profile_cabinet_course_steps;
create trigger profile_cabinet_course_steps_updated_at
before update on public.profile_cabinet_course_steps
for each row execute function public.profile_cabinet_touch_updated_at();

drop trigger if exists profile_cabinet_course_lessons_updated_at on public.profile_cabinet_course_lessons;
create trigger profile_cabinet_course_lessons_updated_at
before update on public.profile_cabinet_course_lessons
for each row execute function public.profile_cabinet_touch_updated_at();

drop trigger if exists profile_cabinet_course_access_updated_at on public.profile_cabinet_course_access;
create trigger profile_cabinet_course_access_updated_at
before update on public.profile_cabinet_course_access
for each row execute function public.profile_cabinet_touch_updated_at();

alter table public.profile_cabinet_courses enable row level security;
alter table public.profile_cabinet_course_steps enable row level security;
alter table public.profile_cabinet_course_lessons enable row level security;
alter table public.profile_cabinet_course_access enable row level security;

drop policy if exists "admin manages courses" on public.profile_cabinet_courses;
create policy "admin manages courses"
on public.profile_cabinet_courses
for all
to authenticated
using (public.profile_cabinet_is_admin())
with check (public.profile_cabinet_is_admin());

drop policy if exists "admin manages course steps" on public.profile_cabinet_course_steps;
create policy "admin manages course steps"
on public.profile_cabinet_course_steps
for all
to authenticated
using (public.profile_cabinet_is_admin())
with check (public.profile_cabinet_is_admin());

drop policy if exists "admin manages course lessons" on public.profile_cabinet_course_lessons;
create policy "admin manages course lessons"
on public.profile_cabinet_course_lessons
for all
to authenticated
using (public.profile_cabinet_is_admin())
with check (public.profile_cabinet_is_admin());

drop policy if exists "admin manages course access" on public.profile_cabinet_course_access;
create policy "admin manages course access"
on public.profile_cabinet_course_access
for all
to authenticated
using (public.profile_cabinet_is_admin())
with check (public.profile_cabinet_is_admin());

drop policy if exists "profile owner reads own course access" on public.profile_cabinet_course_access;
create policy "profile owner reads own course access"
on public.profile_cabinet_course_access
for select
to authenticated
using (
  user_id = auth.uid()
  or exists (
    select 1
    from public.profile_cabinet_profiles p
    where p.id = profile_cabinet_course_access.profile_id
      and p.user_id = auth.uid()
  )
);

drop policy if exists "profile owner reads accessible published courses" on public.profile_cabinet_courses;
create policy "profile owner reads accessible published courses"
on public.profile_cabinet_courses
for select
to authenticated
using (
  status = 'published'
  and exists (
    select 1
    from public.profile_cabinet_course_access a
    join public.profile_cabinet_profiles p on p.id = a.profile_id
    where a.course_id = profile_cabinet_courses.id
      and a.status = 'active'
      and (a.user_id = auth.uid() or p.user_id = auth.uid())
  )
);

drop policy if exists "profile owner reads accessible published course steps" on public.profile_cabinet_course_steps;
create policy "profile owner reads accessible published course steps"
on public.profile_cabinet_course_steps
for select
to authenticated
using (
  status = 'published'
  and exists (
    select 1
    from public.profile_cabinet_courses c
    where c.id = profile_cabinet_course_steps.course_id
      and c.status = 'published'
  )
  and exists (
    select 1
    from public.profile_cabinet_course_access a
    join public.profile_cabinet_profiles p on p.id = a.profile_id
    where a.course_id = profile_cabinet_course_steps.course_id
      and a.status = 'active'
      and (a.user_id = auth.uid() or p.user_id = auth.uid())
      and (
        (a.access_scope = 'course' and a.step_id is null)
        or
        (a.access_scope = 'step' and a.step_id = profile_cabinet_course_steps.id)
      )
  )
);

drop policy if exists "profile owner reads accessible published course lessons" on public.profile_cabinet_course_lessons;
create policy "profile owner reads accessible published course lessons"
on public.profile_cabinet_course_lessons
for select
to authenticated
using (
  status = 'published'
  and exists (
    select 1
    from public.profile_cabinet_course_steps s
    join public.profile_cabinet_courses c on c.id = s.course_id
    where s.id = profile_cabinet_course_lessons.step_id
      and s.status = 'published'
      and c.status = 'published'
  )
  and exists (
    select 1
    from public.profile_cabinet_course_access a
    join public.profile_cabinet_profiles p on p.id = a.profile_id
    where a.course_id = profile_cabinet_course_lessons.course_id
      and a.status = 'active'
      and (a.user_id = auth.uid() or p.user_id = auth.uid())
      and (
        (a.access_scope = 'course' and a.step_id is null)
        or
        (a.access_scope = 'step' and a.step_id = profile_cabinet_course_lessons.step_id)
      )
  )
);
