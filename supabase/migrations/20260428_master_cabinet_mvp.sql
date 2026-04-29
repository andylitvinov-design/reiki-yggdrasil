-- Extensions
create extension if not exists "uuid-ossp";

-- Tables
create table if not exists public.levels (
  id smallint primary key,
  name text not null,
  sort_order smallint not null unique
);

create table if not exists public.attunements (
  id bigserial primary key,
  level_id smallint not null references public.levels(id) on delete cascade,
  name text not null,
  unique(level_id, name)
);

create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text,
  name text,
  bio text,
  training_info text,
  contacts text,
  show_contacts boolean not null default false,
  avatar_url text,
  is_profile_complete boolean not null default false,
  public_visible boolean not null default false,
  master_level smallint not null default 1 references public.levels(id),
  level_frozen boolean not null default false,
  level_freeze_reason text,
  role text not null default 'user' check (role in ('user', 'admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.video_categories (
  id bigserial primary key,
  name text not null,
  description text,
  min_level smallint not null default 1 references public.levels(id),
  created_at timestamptz not null default now()
);

create table if not exists public.media_items (
  id bigserial primary key,
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  type text not null check (type in ('photo','audio','video','link')),
  title text not null,
  description text,
  level_id smallint not null references public.levels(id),
  attunement_id bigint not null references public.attunements(id),
  category text not null check (category in ('mandala','artifact','practice','other')),
  storage_path text,
  external_url text,
  video_category_id bigint references public.video_categories(id),
  visibility text not null default 'private' check (visibility in ('private','public')),
  comments_enabled boolean not null default true,
  status text not null default 'pending' check (status in ('pending','approved','hidden','rejected')),
  approved_by_admin uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.services (
  id bigserial primary key,
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null check (kind in ('bonus','paid')),
  title text not null,
  description text,
  price numeric(12,2),
  currency text default 'RUB',
  format text not null default 'online' check (format in ('online','offline','other')),
  booking_url text,
  contact_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.likes (
  id bigserial primary key,
  media_id bigint not null references public.media_items(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(media_id, user_id)
);

create table if not exists public.comments (
  id bigserial primary key,
  media_id bigint not null references public.media_items(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  body text not null,
  status text not null default 'visible' check (status in ('visible','hidden')),
  created_at timestamptz not null default now()
);

create table if not exists public.admin_video_access (
  id bigserial primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  level_id smallint references public.levels(id),
  video_category_id bigint references public.video_categories(id),
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);

create table if not exists public.level_audit_log (
  id bigserial primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  old_level smallint,
  new_level smallint,
  action text not null,
  reason text,
  changed_by uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);

-- Helpers
create or replace function public.is_admin()
returns boolean
language sql
stable
as $$
  select coalesce((auth.jwt() ->> 'email') = coalesce(current_setting('app.admin_email', true), 'andy.litvinov@gmail.com'), false)
  or exists(
    select 1 from public.profiles p where p.user_id = auth.uid() and p.role = 'admin'
  );
$$;

create or replace function public.compute_master_level(target_user uuid)
returns smallint
language plpgsql
security definer
set search_path = public
as $$
declare
  has_profile boolean;
  has_mandala boolean;
  has_artifact boolean;
  has_bonus_service boolean;
  has_audio_video boolean;
  has_paid_service boolean;
  calculated_level smallint := 1;
  frozen boolean := false;
begin
  select is_profile_complete, level_frozen
  into has_profile, frozen
  from public.profiles
  where user_id = target_user;

  if coalesce(has_profile, false) is false then
    return 1;
  end if;

  calculated_level := 1;

  select exists(
    select 1 from public.media_items
    where owner_user_id = target_user and type = 'photo' and category = 'mandala'
  ) into has_mandala;
  if has_mandala then
    calculated_level := 2;
  end if;

  select exists(
    select 1 from public.services
    where owner_user_id = target_user and kind = 'bonus' and is_active = true
  ) into has_bonus_service;
  if has_bonus_service then
    calculated_level := greatest(calculated_level, 3);
  end if;

  select exists(
    select 1 from public.media_items
    where owner_user_id = target_user and type in ('audio','video','link')
  ) into has_audio_video;
  if has_audio_video then
    calculated_level := greatest(calculated_level, 4);
  end if;

  select exists(
    select 1 from public.services
    where owner_user_id = target_user and kind = 'paid' and is_active = true
  ) into has_paid_service;
  if has_paid_service then
    calculated_level := 5;
  end if;

  if frozen then
    return (select master_level from public.profiles where user_id = target_user limit 1);
  end if;

  update public.profiles
  set master_level = calculated_level,
      updated_at = now()
  where user_id = target_user;

  return calculated_level;
end;
$$;

create or replace function public.refresh_my_level()
returns smallint
language plpgsql
security definer
set search_path = public
as $$
begin
  return public.compute_master_level(auth.uid());
end;
$$;

-- Auto update timestamp
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_profiles_touch on public.profiles;
create trigger trg_profiles_touch before update on public.profiles for each row execute function public.touch_updated_at();

drop trigger if exists trg_media_touch on public.media_items;
create trigger trg_media_touch before update on public.media_items for each row execute function public.touch_updated_at();

drop trigger if exists trg_services_touch on public.services;
create trigger trg_services_touch before update on public.services for each row execute function public.touch_updated_at();

-- RLS
alter table public.profiles enable row level security;
alter table public.media_items enable row level security;
alter table public.services enable row level security;
alter table public.likes enable row level security;
alter table public.comments enable row level security;
alter table public.video_categories enable row level security;
alter table public.admin_video_access enable row level security;
alter table public.level_audit_log enable row level security;
alter table public.attunements enable row level security;
alter table public.levels enable row level security;

-- profiles
create policy if not exists profiles_self_select on public.profiles for select using (auth.uid() = user_id or public_visible = true or public.is_admin());
create policy if not exists profiles_self_upsert on public.profiles for insert with check (auth.uid() = user_id);
create policy if not exists profiles_self_update on public.profiles for update using (auth.uid() = user_id or public.is_admin()) with check (auth.uid() = user_id or public.is_admin());

-- taxonomy
create policy if not exists levels_read_all on public.levels for select using (true);
create policy if not exists attunements_read_all on public.attunements for select using (true);

-- media
create policy if not exists media_owner_insert on public.media_items for insert with check (auth.uid() = owner_user_id or public.is_admin());
create policy if not exists media_read_public_or_owner on public.media_items for select using (
  public.is_admin()
  or auth.uid() = owner_user_id
  or (visibility = 'public' and status = 'approved' and level_id <= coalesce((select master_level from public.profiles where user_id = auth.uid()),1))
);
create policy if not exists media_owner_update on public.media_items for update using (auth.uid() = owner_user_id or public.is_admin()) with check (auth.uid() = owner_user_id or public.is_admin());
create policy if not exists media_admin_delete on public.media_items for delete using (public.is_admin());

-- services
create policy if not exists services_owner_insert on public.services for insert with check (auth.uid() = owner_user_id or public.is_admin());
create policy if not exists services_read on public.services for select using (public.is_admin() or auth.uid() = owner_user_id);
create policy if not exists services_owner_update on public.services for update using (auth.uid() = owner_user_id or public.is_admin());

-- likes/comments
create policy if not exists likes_owner_rw on public.likes for all using (auth.uid() = user_id or public.is_admin()) with check (auth.uid() = user_id or public.is_admin());
create policy if not exists comments_rw on public.comments for all using (auth.uid() = user_id or public.is_admin()) with check (auth.uid() = user_id or public.is_admin());

-- admin-only tables
create policy if not exists admin_video_access_admin_all on public.admin_video_access for all using (public.is_admin()) with check (public.is_admin());
create policy if not exists level_audit_admin_all on public.level_audit_log for all using (public.is_admin()) with check (public.is_admin());
create policy if not exists video_categories_read_all on public.video_categories for select using (true);
create policy if not exists video_categories_admin_write on public.video_categories for all using (public.is_admin()) with check (public.is_admin());

-- Buckets (idempotent)
insert into storage.buckets (id, name, public) values ('avatars','avatars', true) on conflict (id) do nothing;
insert into storage.buckets (id, name, public) values ('works','works', true) on conflict (id) do nothing;
insert into storage.buckets (id, name, public) values ('audio','audio', false) on conflict (id) do nothing;
insert into storage.buckets (id, name, public) values ('videos','videos', false) on conflict (id) do nothing;

-- Storage policies
create policy if not exists storage_avatars_read on storage.objects for select using (bucket_id = 'avatars');
create policy if not exists storage_works_read on storage.objects for select using (bucket_id = 'works');
create policy if not exists storage_public_audio_read on storage.objects for select using (
  bucket_id = 'audio'
  and exists (
    select 1
    from public.media_items
    where media_items.storage_path = storage.objects.name
      and media_items.type = 'audio'
      and media_items.visibility = 'public'
      and media_items.status = 'approved'
  )
);
create policy if not exists storage_owner_upload on storage.objects for insert with check (
  bucket_id in ('avatars','works','audio','videos') and auth.uid()::text = (storage.foldername(name))[1]
);
create policy if not exists storage_owner_manage on storage.objects for update using (
  bucket_id in ('avatars','works','audio','videos') and (auth.uid()::text = (storage.foldername(name))[1] or public.is_admin())
);
create policy if not exists storage_owner_delete on storage.objects for delete using (
  bucket_id in ('avatars','works','audio','videos') and (auth.uid()::text = (storage.foldername(name))[1] or public.is_admin())
);
