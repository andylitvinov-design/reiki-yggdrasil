create extension if not exists "pgcrypto";

create table if not exists public.profile_cabinet_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  display_name text not null default '',
  bio text not null default '',
  city text not null default '',
  country text not null default '',
  telegram text not null default '',
  website text not null default '',
  avatar_url text not null default '',
  status text not null default 'draft' check (status in ('draft', 'pending', 'approved', 'rejected')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id)
);

create table if not exists public.profile_cabinet_publications (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profile_cabinet_profiles(id) on delete cascade,
  type text not null default 'practice' check (type in ('practice', 'mandala', 'artifact')),
  title text not null default '',
  description text not null default '',
  image_url text not null default '',
  status text not null default 'draft' check (status in ('draft', 'pending', 'approved', 'rejected')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.profile_cabinet_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  created_at timestamptz not null default now()
);

create or replace function public.profile_cabinet_touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profile_cabinet_profiles_updated_at on public.profile_cabinet_profiles;
create trigger profile_cabinet_profiles_updated_at
before update on public.profile_cabinet_profiles
for each row execute function public.profile_cabinet_touch_updated_at();

drop trigger if exists profile_cabinet_publications_updated_at on public.profile_cabinet_publications;
create trigger profile_cabinet_publications_updated_at
before update on public.profile_cabinet_publications
for each row execute function public.profile_cabinet_touch_updated_at();

alter table public.profile_cabinet_profiles enable row level security;
alter table public.profile_cabinet_publications enable row level security;
alter table public.profile_cabinet_admins enable row level security;

create policy "public reads approved profiles"
on public.profile_cabinet_profiles
for select
to anon, authenticated
using (status = 'approved');

create policy "owner reads own profile"
on public.profile_cabinet_profiles
for select
to authenticated
using (auth.uid() = user_id);

create policy "owner inserts own profile"
on public.profile_cabinet_profiles
for insert
to authenticated
with check (auth.uid() = user_id);

create policy "owner updates own draft profile"
on public.profile_cabinet_profiles
for update
to authenticated
using (auth.uid() = user_id and status in ('draft', 'pending', 'rejected'))
with check (auth.uid() = user_id and status in ('draft', 'pending', 'rejected'));

create policy "admin reads all profiles"
on public.profile_cabinet_profiles
for select
to authenticated
using (exists (select 1 from public.profile_cabinet_admins where profile_cabinet_admins.user_id = auth.uid()));

create policy "admin moderates profiles"
on public.profile_cabinet_profiles
for update
to authenticated
using (exists (select 1 from public.profile_cabinet_admins where profile_cabinet_admins.user_id = auth.uid()))
with check (exists (select 1 from public.profile_cabinet_admins where profile_cabinet_admins.user_id = auth.uid()));

create policy "public reads approved publications"
on public.profile_cabinet_publications
for select
to anon, authenticated
using (
  status = 'approved'
  and exists (
    select 1 from public.profile_cabinet_profiles
    where profile_cabinet_profiles.id = profile_cabinet_publications.profile_id
      and profile_cabinet_profiles.status = 'approved'
  )
);

create policy "owner manages own publications"
on public.profile_cabinet_publications
for all
to authenticated
using (
  exists (
    select 1 from public.profile_cabinet_profiles
    where profile_cabinet_profiles.id = profile_cabinet_publications.profile_id
      and profile_cabinet_profiles.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.profile_cabinet_profiles
    where profile_cabinet_profiles.id = profile_cabinet_publications.profile_id
      and profile_cabinet_profiles.user_id = auth.uid()
  )
);

create policy "admin manages publications"
on public.profile_cabinet_publications
for all
to authenticated
using (exists (select 1 from public.profile_cabinet_admins where profile_cabinet_admins.user_id = auth.uid()))
with check (exists (select 1 from public.profile_cabinet_admins where profile_cabinet_admins.user_id = auth.uid()));

create policy "admins read admins"
on public.profile_cabinet_admins
for select
to authenticated
using (exists (select 1 from public.profile_cabinet_admins where profile_cabinet_admins.user_id = auth.uid()));
