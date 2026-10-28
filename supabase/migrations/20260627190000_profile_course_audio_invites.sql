create extension if not exists pgcrypto;

update storage.buckets
set
  public = false,
  file_size_limit = greatest(coalesce(file_size_limit, 0), 104857600),
  allowed_mime_types = array[
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'audio/mpeg',
    'audio/mp4',
    'audio/wav',
    'audio/webm',
    'audio/ogg',
    'audio/aac',
    'audio/flac',
    'audio/x-m4a'
  ]
where id = 'profile-cabinet-media';

alter table public.profile_cabinet_course_steps
  add column if not exists slug text not null default '';

alter table public.profile_cabinet_course_lessons
  add column if not exists slug text not null default '',
  add column if not exists audio_storage_bucket text not null default 'profile-cabinet-media',
  add column if not exists audio_storage_path text not null default '',
  add column if not exists audio_mime_type text not null default '',
  add column if not exists audio_size_bytes integer not null default 0;

create unique index if not exists profile_course_steps_course_slug_unique
on public.profile_cabinet_course_steps(course_id, slug)
where slug <> '';

create unique index if not exists profile_course_lessons_step_slug_unique
on public.profile_cabinet_course_lessons(step_id, slug)
where slug <> '';

create table if not exists public.profile_cabinet_course_invites (
  id uuid primary key default gen_random_uuid(),
  token_hash text not null unique,
  created_by uuid references auth.users(id),
  target_email text not null default '',
  course_id uuid not null references public.profile_cabinet_courses(id) on delete cascade,
  step_id uuid references public.profile_cabinet_course_steps(id) on delete cascade,
  access_scope text not null default 'step' check (access_scope in ('course', 'step')),
  status text not null default 'pending' check (status in ('pending', 'claimed', 'revoked', 'expired')),
  claimed_by_user_id uuid references auth.users(id),
  claimed_profile_id uuid references public.profile_cabinet_profiles(id),
  expires_at timestamptz,
  claimed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profile_course_invites_scope_shape check (
    (access_scope = 'course' and step_id is null)
    or
    (access_scope = 'step' and step_id is not null)
  )
);

create index if not exists profile_course_invites_course_status_idx
on public.profile_cabinet_course_invites(course_id, step_id, status);

create index if not exists profile_course_invites_claimed_profile_idx
on public.profile_cabinet_course_invites(claimed_profile_id, status);

drop trigger if exists profile_cabinet_course_invites_updated_at on public.profile_cabinet_course_invites;
create trigger profile_cabinet_course_invites_updated_at
before update on public.profile_cabinet_course_invites
for each row execute function public.profile_cabinet_touch_updated_at();

alter table public.profile_cabinet_course_invites enable row level security;

drop policy if exists "admin manages course invites" on public.profile_cabinet_course_invites;
create policy "admin manages course invites"
on public.profile_cabinet_course_invites
for all
to authenticated
using (public.profile_cabinet_is_admin())
with check (public.profile_cabinet_is_admin());

drop policy if exists "claimer reads own course invites" on public.profile_cabinet_course_invites;
create policy "claimer reads own course invites"
on public.profile_cabinet_course_invites
for select
to authenticated
using (claimed_by_user_id = auth.uid());

create or replace function public.profile_cabinet_can_access_course_audio_path(object_name text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.profile_cabinet_is_admin()
    or exists (
      select 1
      from public.profile_cabinet_course_lessons l
      join public.profile_cabinet_course_steps s on s.id = l.step_id
      join public.profile_cabinet_courses c on c.id = l.course_id
      join public.profile_cabinet_course_access a on a.course_id = l.course_id
      join public.profile_cabinet_profiles p on p.id = a.profile_id
      where l.audio_storage_path = object_name
        and l.status = 'published'
        and s.status = 'published'
        and c.status = 'published'
        and a.status = 'active'
        and (a.user_id = auth.uid() or p.user_id = auth.uid())
        and (
          (a.access_scope = 'course' and a.step_id is null)
          or
          (a.access_scope = 'step' and a.step_id = l.step_id)
        )
    );
$$;

revoke all on function public.profile_cabinet_can_access_course_audio_path(text) from public;
revoke all on function public.profile_cabinet_can_access_course_audio_path(text) from anon;
grant execute on function public.profile_cabinet_can_access_course_audio_path(text) to authenticated;

drop policy if exists "course audio access reads profile cabinet media" on storage.objects;
create policy "course audio access reads profile cabinet media"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'profile-cabinet-media'
  and name like 'courses/%'
  and public.profile_cabinet_can_access_course_audio_path(name)
);

drop policy if exists "admins upload course audio" on storage.objects;
create policy "admins upload course audio"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'profile-cabinet-media'
  and name like 'courses/%'
  and public.profile_cabinet_is_admin()
);

drop policy if exists "admins update course audio" on storage.objects;
create policy "admins update course audio"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'profile-cabinet-media'
  and name like 'courses/%'
  and public.profile_cabinet_is_admin()
)
with check (
  bucket_id = 'profile-cabinet-media'
  and name like 'courses/%'
  and public.profile_cabinet_is_admin()
);

drop policy if exists "admins delete course audio" on storage.objects;
create policy "admins delete course audio"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'profile-cabinet-media'
  and name like 'courses/%'
  and public.profile_cabinet_is_admin()
);

create or replace function public.create_course_invite(
  p_course_id uuid,
  p_step_id uuid default null,
  p_access_scope text default 'step',
  p_target_email text default '',
  p_expires_at timestamptz default null
)
returns table (
  id uuid,
  token text,
  target_email text,
  course_id uuid,
  step_id uuid,
  access_scope text,
  status text,
  expires_at timestamptz,
  claimed_at timestamptz,
  created_at timestamptz,
  updated_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_scope text := coalesce(nullif(trim(p_access_scope), ''), 'step');
  v_token text;
  v_inserted public.profile_cabinet_course_invites%rowtype;
begin
  if auth.uid() is null then
    raise exception 'Auth required';
  end if;

  if not public.profile_cabinet_is_admin() then
    raise exception 'Admin required';
  end if;

  if v_scope not in ('course', 'step') then
    raise exception 'Invalid access scope';
  end if;

  if p_course_id is null then
    raise exception 'Course required';
  end if;

  if v_scope = 'step' and p_step_id is null then
    raise exception 'Step required';
  end if;

  if not exists (select 1 from public.profile_cabinet_courses where id = p_course_id) then
    raise exception 'Course not found';
  end if;

  if p_step_id is not null and not exists (
    select 1 from public.profile_cabinet_course_steps
    where id = p_step_id and course_id = p_course_id
  ) then
    raise exception 'Step not found';
  end if;

  v_token := encode(gen_random_bytes(32), 'hex');

  insert into public.profile_cabinet_course_invites (
    token_hash,
    created_by,
    target_email,
    course_id,
    step_id,
    access_scope,
    expires_at
  )
  values (
    encode(digest(v_token, 'sha256'), 'hex'),
    auth.uid(),
    lower(trim(coalesce(p_target_email, ''))),
    p_course_id,
    case when v_scope = 'course' then null else p_step_id end,
    v_scope,
    p_expires_at
  )
  returning * into v_inserted;

  return query select
    v_inserted.id,
    v_token,
    v_inserted.target_email,
    v_inserted.course_id,
    v_inserted.step_id,
    v_inserted.access_scope,
    v_inserted.status,
    v_inserted.expires_at,
    v_inserted.claimed_at,
    v_inserted.created_at,
    v_inserted.updated_at;
end;
$$;

create or replace function public.claim_course_invite(p_token text)
returns table (
  id uuid,
  target_email text,
  course_id uuid,
  step_id uuid,
  access_scope text,
  status text,
  claimed_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_profile_id uuid;
  v_invite public.profile_cabinet_course_invites%rowtype;
begin
  if auth.uid() is null then
    raise exception 'Auth required';
  end if;

  if coalesce(trim(p_token), '') = '' then
    raise exception 'Missing invite token';
  end if;

  insert into public.profile_cabinet_profiles (user_id, status)
  values (auth.uid(), 'draft')
  on conflict (user_id) do update set updated_at = now()
  returning id into v_profile_id;

  select * into v_invite
  from public.profile_cabinet_course_invites
  where token_hash = encode(digest(trim(p_token), 'sha256'), 'hex')
  for update;

  if v_invite.id is null then
    raise exception 'Ссылка недействительна или устарела';
  end if;

  if v_invite.status = 'claimed' and v_invite.claimed_by_user_id = auth.uid() then
    return query select
      v_invite.id,
      v_invite.target_email,
      v_invite.course_id,
      v_invite.step_id,
      v_invite.access_scope,
      v_invite.status,
      v_invite.claimed_at;
    return;
  end if;

  if v_invite.status <> 'pending' or v_invite.claimed_by_user_id is not null then
    raise exception 'Эта ссылка уже использована';
  end if;

  if v_invite.expires_at is not null and v_invite.expires_at < now() then
    update public.profile_cabinet_course_invites
    set status = 'expired'
    where id = v_invite.id;
    raise exception 'Ссылка недействительна или устарела';
  end if;

  insert into public.profile_cabinet_course_access (
    profile_id,
    user_id,
    course_id,
    step_id,
    access_scope,
    status
  )
  values (
    v_profile_id,
    auth.uid(),
    v_invite.course_id,
    v_invite.step_id,
    v_invite.access_scope,
    'active'
  )
  on conflict do nothing;

  update public.profile_cabinet_course_invites
  set
    status = 'claimed',
    claimed_by_user_id = auth.uid(),
    claimed_profile_id = v_profile_id,
    claimed_at = now()
  where id = v_invite.id
  returning * into v_invite;

  return query select
    v_invite.id,
    v_invite.target_email,
    v_invite.course_id,
    v_invite.step_id,
    v_invite.access_scope,
    v_invite.status,
    v_invite.claimed_at;
end;
$$;

grant execute on function public.create_course_invite(uuid, uuid, text, text, timestamptz) to authenticated;
grant execute on function public.claim_course_invite(text) to authenticated;

notify pgrst, 'reload schema';
