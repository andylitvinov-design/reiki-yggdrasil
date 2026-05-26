alter table public.profile_cabinet_profiles
  add column if not exists account_plan text not null default 'start'
  check (account_plan in ('start', 'pro'));

create table if not exists public.profile_cabinet_client_goal_photos (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profile_cabinet_profiles(id) on delete cascade,
  title text not null default '',
  image_url text not null default '',
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.profile_cabinet_tradition_assets (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profile_cabinet_profiles(id) on delete cascade,
  tradition_id text not null default '',
  tradition_title text not null default '',
  title text not null default '',
  image_url text not null default '',
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.profile_cabinet_power_place_compositions (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profile_cabinet_profiles(id) on delete cascade,
  title text not null default '',
  constructor_type text not null default 'client' check (constructor_type in ('client', 'altar')),
  geometry smallint check (geometry in (2, 4, 5, 6, 8, 12)),
  altar_center_ratio text not null default '1' check (altar_center_ratio in ('1', '1-5', '2', '3')),
  cover_ref jsonb,
  object_refs jsonb not null default '{}'::jsonb,
  central_photo_id uuid references public.profile_cabinet_client_goal_photos(id) on delete set null,
  tradition_id text not null default '',
  tradition_title text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists profile_cabinet_client_goal_photos_profile_idx
  on public.profile_cabinet_client_goal_photos (profile_id, created_at desc);

create index if not exists profile_cabinet_tradition_assets_profile_tradition_idx
  on public.profile_cabinet_tradition_assets (profile_id, tradition_id, created_at desc);

create index if not exists profile_cabinet_power_place_compositions_profile_idx
  on public.profile_cabinet_power_place_compositions (profile_id, updated_at desc);

drop trigger if exists profile_cabinet_client_goal_photos_updated_at on public.profile_cabinet_client_goal_photos;
create trigger profile_cabinet_client_goal_photos_updated_at
before update on public.profile_cabinet_client_goal_photos
for each row execute function public.profile_cabinet_touch_updated_at();

drop trigger if exists profile_cabinet_tradition_assets_updated_at on public.profile_cabinet_tradition_assets;
create trigger profile_cabinet_tradition_assets_updated_at
before update on public.profile_cabinet_tradition_assets
for each row execute function public.profile_cabinet_touch_updated_at();

drop trigger if exists profile_cabinet_power_place_compositions_updated_at on public.profile_cabinet_power_place_compositions;
create trigger profile_cabinet_power_place_compositions_updated_at
before update on public.profile_cabinet_power_place_compositions
for each row execute function public.profile_cabinet_touch_updated_at();

alter table public.profile_cabinet_client_goal_photos enable row level security;
alter table public.profile_cabinet_tradition_assets enable row level security;
alter table public.profile_cabinet_power_place_compositions enable row level security;

create policy "owner manages client goal photos"
on public.profile_cabinet_client_goal_photos
for all
to authenticated
using (
  exists (
    select 1 from public.profile_cabinet_profiles
    where profile_cabinet_profiles.id = profile_cabinet_client_goal_photos.profile_id
      and profile_cabinet_profiles.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.profile_cabinet_profiles
    where profile_cabinet_profiles.id = profile_cabinet_client_goal_photos.profile_id
      and profile_cabinet_profiles.user_id = auth.uid()
  )
);

create policy "admin manages client goal photos"
on public.profile_cabinet_client_goal_photos
for all
to authenticated
using (public.profile_cabinet_is_admin())
with check (public.profile_cabinet_is_admin());

create policy "owner manages tradition assets"
on public.profile_cabinet_tradition_assets
for all
to authenticated
using (
  exists (
    select 1 from public.profile_cabinet_profiles
    where profile_cabinet_profiles.id = profile_cabinet_tradition_assets.profile_id
      and profile_cabinet_profiles.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.profile_cabinet_profiles
    where profile_cabinet_profiles.id = profile_cabinet_tradition_assets.profile_id
      and profile_cabinet_profiles.user_id = auth.uid()
  )
);

create policy "admin manages tradition assets"
on public.profile_cabinet_tradition_assets
for all
to authenticated
using (public.profile_cabinet_is_admin())
with check (public.profile_cabinet_is_admin());

create policy "owner manages power place compositions"
on public.profile_cabinet_power_place_compositions
for all
to authenticated
using (
  exists (
    select 1 from public.profile_cabinet_profiles
    where profile_cabinet_profiles.id = profile_cabinet_power_place_compositions.profile_id
      and profile_cabinet_profiles.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.profile_cabinet_profiles
    where profile_cabinet_profiles.id = profile_cabinet_power_place_compositions.profile_id
      and profile_cabinet_profiles.user_id = auth.uid()
  )
);

create policy "admin manages power place compositions"
on public.profile_cabinet_power_place_compositions
for all
to authenticated
using (public.profile_cabinet_is_admin())
with check (public.profile_cabinet_is_admin());
