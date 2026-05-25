-- Reiki Yggdrasil profile cabinet MVP
-- Env values are not stored in repo. Admin access is granted by inserting
-- the admin email into public.admin_users inside Supabase after migration.

create extension if not exists pgcrypto;

create table if not exists public.admin_users (
  email text primary key,
  created_at timestamptz not null default now()
);

create table if not exists public.master_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  display_name text not null default '',
  bio text not null default '',
  city text,
  country text,
  telegram text,
  website text,
  avatar_url text,
  status text not null default 'draft' check (status in ('draft', 'pending', 'approved', 'rejected')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id)
);

create table if not exists public.master_publications (
  id uuid primary key default gen_random_uuid(),
  master_id uuid not null references public.master_profiles(id) on delete cascade,
  type text not null default 'practice' check (type in ('practice', 'mandala', 'artifact')),
  title text not null default '',
  description text not null default '',
  image_url text,
  status text not null default 'draft' check (status in ('draft', 'pending', 'approved', 'rejected')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists master_profiles_status_idx on public.master_profiles(status);
create index if not exists master_profiles_user_id_idx on public.master_profiles(user_id);
create index if not exists master_publications_master_id_idx on public.master_publications(master_id);
create index if not exists master_publications_status_idx on public.master_publications(status);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_master_profiles_updated_at on public.master_profiles;
create trigger set_master_profiles_updated_at
before update on public.master_profiles
for each row execute function public.set_updated_at();

drop trigger if exists set_master_publications_updated_at on public.master_publications;
create trigger set_master_publications_updated_at
before update on public.master_publications
for each row execute function public.set_updated_at();

alter table public.admin_users enable row level security;
alter table public.master_profiles enable row level security;
alter table public.master_publications enable row level security;

create policy "admin users can read own admin row"
on public.admin_users
for select
to authenticated
using (email = (auth.jwt() ->> 'email'));

create policy "profile owner can read own profile"
on public.master_profiles
for select
to authenticated
using (user_id = auth.uid());

create policy "profile owner can insert own profile"
on public.master_profiles
for insert
to authenticated
with check (user_id = auth.uid());

create policy "profile owner can update own draft or pending profile"
on public.master_profiles
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid() and status in ('draft', 'pending'));

create policy "public can read approved profiles"
on public.master_profiles
for select
to anon, authenticated
using (status = 'approved');

create policy "admins can read all profiles"
on public.master_profiles
for select
to authenticated
using (
  exists (
    select 1 from public.admin_users
    where admin_users.email = (auth.jwt() ->> 'email')
  )
);

create policy "admins can moderate profiles"
on public.master_profiles
for update
to authenticated
using (
  exists (
    select 1 from public.admin_users
    where admin_users.email = (auth.jwt() ->> 'email')
  )
)
with check (
  exists (
    select 1 from public.admin_users
    where admin_users.email = (auth.jwt() ->> 'email')
  )
);

create policy "publication owners can read own publications"
on public.master_publications
for select
to authenticated
using (
  exists (
    select 1 from public.master_profiles
    where master_profiles.id = master_publications.master_id
      and master_profiles.user_id = auth.uid()
  )
);

create policy "publication owners can insert own publications"
on public.master_publications
for insert
to authenticated
with check (
  exists (
    select 1 from public.master_profiles
    where master_profiles.id = master_publications.master_id
      and master_profiles.user_id = auth.uid()
  )
);

create policy "publication owners can update own draft or pending publications"
on public.master_publications
for update
to authenticated
using (
  exists (
    select 1 from public.master_profiles
    where master_profiles.id = master_publications.master_id
      and master_profiles.user_id = auth.uid()
  )
)
with check (status in ('draft', 'pending'));

create policy "public can read approved publications"
on public.master_publications
for select
to anon, authenticated
using (status = 'approved');

create policy "admins can read all publications"
on public.master_publications
for select
to authenticated
using (
  exists (
    select 1 from public.admin_users
    where admin_users.email = (auth.jwt() ->> 'email')
  )
);

create policy "admins can moderate publications"
on public.master_publications
for update
to authenticated
using (
  exists (
    select 1 from public.admin_users
    where admin_users.email = (auth.jwt() ->> 'email')
  )
)
with check (
  exists (
    select 1 from public.admin_users
    where admin_users.email = (auth.jwt() ->> 'email')
  )
);
