create table if not exists public.profile_cabinet_services (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profile_cabinet_profiles(id) on delete cascade,
  composition_id uuid null references public.profile_cabinet_power_place_compositions(id) on delete set null,
  title text not null default '',
  description text not null default '',
  image_url text not null default '',
  image_bucket text null,
  image_path text null,
  price_amount numeric null,
  price_currency text not null default 'EUR',
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.profile_cabinet_service_orders (
  id uuid primary key default gen_random_uuid(),
  service_id uuid not null references public.profile_cabinet_services(id) on delete cascade,
  master_profile_id uuid not null references public.profile_cabinet_profiles(id) on delete cascade,
  client_name text not null default '',
  client_photo_url text not null default '',
  client_photo_bucket text null,
  client_photo_path text null,
  request_text text not null default '',
  master_comment text not null default '',
  result_image_url text not null default '',
  result_image_bucket text null,
  result_image_path text null,
  status text not null default 'new' check (status in ('new', 'in_progress', 'sent', 'closed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists profile_cabinet_services_profile_id_idx on public.profile_cabinet_services(profile_id);
create index if not exists profile_cabinet_services_status_idx on public.profile_cabinet_services(status);
create index if not exists profile_cabinet_services_composition_id_idx on public.profile_cabinet_services(composition_id);
create index if not exists profile_cabinet_service_orders_service_id_idx on public.profile_cabinet_service_orders(service_id);
create index if not exists profile_cabinet_service_orders_master_profile_id_idx on public.profile_cabinet_service_orders(master_profile_id);
create index if not exists profile_cabinet_service_orders_status_idx on public.profile_cabinet_service_orders(status);

drop trigger if exists profile_cabinet_services_updated_at on public.profile_cabinet_services;
create trigger profile_cabinet_services_updated_at
before update on public.profile_cabinet_services
for each row execute function public.profile_cabinet_touch_updated_at();

drop trigger if exists profile_cabinet_service_orders_updated_at on public.profile_cabinet_service_orders;
create trigger profile_cabinet_service_orders_updated_at
before update on public.profile_cabinet_service_orders
for each row execute function public.profile_cabinet_touch_updated_at();

alter table public.profile_cabinet_services enable row level security;
alter table public.profile_cabinet_service_orders enable row level security;

drop policy if exists "public reads published services" on public.profile_cabinet_services;
create policy "public reads published services"
on public.profile_cabinet_services
for select
to anon, authenticated
using (
  status = 'published'
  and exists (
    select 1 from public.profile_cabinet_profiles
    where profile_cabinet_profiles.id = profile_cabinet_services.profile_id
      and profile_cabinet_profiles.status = 'approved'
  )
);

drop policy if exists "owner manages own services" on public.profile_cabinet_services;
create policy "owner manages own services"
on public.profile_cabinet_services
for all
to authenticated
using (
  exists (
    select 1 from public.profile_cabinet_profiles
    where profile_cabinet_profiles.id = profile_cabinet_services.profile_id
      and profile_cabinet_profiles.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.profile_cabinet_profiles
    where profile_cabinet_profiles.id = profile_cabinet_services.profile_id
      and profile_cabinet_profiles.user_id = auth.uid()
  )
);

drop policy if exists "public creates orders for published services" on public.profile_cabinet_service_orders;
create policy "public creates orders for published services"
on public.profile_cabinet_service_orders
for insert
to anon, authenticated
with check (
  status = 'new'
  and exists (
    select 1 from public.profile_cabinet_services
    where profile_cabinet_services.id = profile_cabinet_service_orders.service_id
      and profile_cabinet_services.profile_id = profile_cabinet_service_orders.master_profile_id
      and profile_cabinet_services.status = 'published'
  )
);

drop policy if exists "owner reads own service orders" on public.profile_cabinet_service_orders;
create policy "owner reads own service orders"
on public.profile_cabinet_service_orders
for select
to authenticated
using (
  exists (
    select 1 from public.profile_cabinet_profiles
    where profile_cabinet_profiles.id = profile_cabinet_service_orders.master_profile_id
      and profile_cabinet_profiles.user_id = auth.uid()
  )
);

drop policy if exists "owner updates own service orders" on public.profile_cabinet_service_orders;
create policy "owner updates own service orders"
on public.profile_cabinet_service_orders
for update
to authenticated
using (
  exists (
    select 1 from public.profile_cabinet_profiles
    where profile_cabinet_profiles.id = profile_cabinet_service_orders.master_profile_id
      and profile_cabinet_profiles.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.profile_cabinet_profiles
    where profile_cabinet_profiles.id = profile_cabinet_service_orders.master_profile_id
      and profile_cabinet_profiles.user_id = auth.uid()
  )
);
