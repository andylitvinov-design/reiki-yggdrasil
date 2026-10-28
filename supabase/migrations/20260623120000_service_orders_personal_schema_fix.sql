alter table public.profile_cabinet_service_orders
  add column if not exists client_profile_id uuid null references public.profile_cabinet_profiles(id) on delete set null,
  add column if not exists template_composition_id uuid null references public.profile_cabinet_power_place_compositions(id) on delete set null,
  add column if not exists draft_result_composition_id uuid null references public.profile_cabinet_power_place_compositions(id) on delete set null,
  add column if not exists final_result_composition_id uuid null references public.profile_cabinet_power_place_compositions(id) on delete set null,
  add column if not exists order_format text not null default 'signature',
  add column if not exists client_photo_id uuid null references public.profile_cabinet_client_goal_photos(id) on delete set null,
  add column if not exists sent_at timestamptz null;

alter table public.profile_cabinet_service_orders
  drop constraint if exists profile_cabinet_service_orders_client_profile_id_fkey;

alter table public.profile_cabinet_service_orders
  add constraint profile_cabinet_service_orders_client_profile_id_fkey
  foreign key (client_profile_id)
  references public.profile_cabinet_profiles(id)
  on delete set null;

alter table public.profile_cabinet_service_orders
  drop constraint if exists profile_cabinet_service_orders_status_check;

alter table public.profile_cabinet_service_orders
  add constraint profile_cabinet_service_orders_status_check
  check (status in ('draft', 'photo_required', 'new', 'ready_for_review', 'in_progress', 'sent', 'closed'));

alter table public.profile_cabinet_service_orders
  drop constraint if exists profile_cabinet_service_orders_order_format_check;

alter table public.profile_cabinet_service_orders
  add constraint profile_cabinet_service_orders_order_format_check
  check (order_format in ('signature', 'no_signature', 'both'));

create index if not exists profile_cabinet_service_orders_client_profile_id_idx
on public.profile_cabinet_service_orders(client_profile_id);

create index if not exists profile_cabinet_service_orders_client_status_idx
on public.profile_cabinet_service_orders(client_profile_id, status);

create index if not exists profile_cabinet_service_orders_master_status_idx
on public.profile_cabinet_service_orders(master_profile_id, status);

create index if not exists profile_cabinet_service_orders_client_photo_idx
on public.profile_cabinet_service_orders(client_photo_id);

create index if not exists profile_cabinet_service_orders_draft_result_idx
on public.profile_cabinet_service_orders(draft_result_composition_id);

create index if not exists profile_cabinet_service_orders_final_result_idx
on public.profile_cabinet_service_orders(final_result_composition_id);

create index if not exists profile_cabinet_service_orders_sent_at_idx
on public.profile_cabinet_service_orders(sent_at);

drop policy if exists "public creates orders for published services" on public.profile_cabinet_service_orders;
create policy "public creates orders for published services"
on public.profile_cabinet_service_orders
for insert
to anon, authenticated
with check (
  client_profile_id is null
  and status = 'new'
  and exists (
    select 1 from public.profile_cabinet_services
    where profile_cabinet_services.id = profile_cabinet_service_orders.service_id
      and profile_cabinet_services.profile_id = profile_cabinet_service_orders.master_profile_id
      and profile_cabinet_services.status = 'published'
  )
);

drop policy if exists "client creates own service order drafts" on public.profile_cabinet_service_orders;
create policy "client creates own service order drafts"
on public.profile_cabinet_service_orders
for insert
to authenticated
with check (
  status in ('draft', 'photo_required')
  and exists (
    select 1 from public.profile_cabinet_profiles
    where profile_cabinet_profiles.id = profile_cabinet_service_orders.client_profile_id
      and profile_cabinet_profiles.user_id = auth.uid()
  )
  and exists (
    select 1 from public.profile_cabinet_services
    where profile_cabinet_services.id = profile_cabinet_service_orders.service_id
      and profile_cabinet_services.profile_id = profile_cabinet_service_orders.master_profile_id
      and profile_cabinet_services.status = 'published'
  )
);

drop policy if exists "client reads own service orders" on public.profile_cabinet_service_orders;
create policy "client reads own service orders"
on public.profile_cabinet_service_orders
for select
to authenticated
using (
  exists (
    select 1 from public.profile_cabinet_profiles
    where profile_cabinet_profiles.id = profile_cabinet_service_orders.client_profile_id
      and profile_cabinet_profiles.user_id = auth.uid()
  )
);

drop policy if exists "client submits own service orders" on public.profile_cabinet_service_orders;
drop policy if exists "client updates own service orders" on public.profile_cabinet_service_orders;
create policy "client updates own service orders"
on public.profile_cabinet_service_orders
for update
to authenticated
using (
  status in ('draft', 'photo_required')
  and exists (
    select 1 from public.profile_cabinet_profiles
    where profile_cabinet_profiles.id = profile_cabinet_service_orders.client_profile_id
      and profile_cabinet_profiles.user_id = auth.uid()
  )
)
with check (
  status in ('draft', 'photo_required', 'new')
  and exists (
    select 1 from public.profile_cabinet_profiles
    where profile_cabinet_profiles.id = profile_cabinet_service_orders.client_profile_id
      and profile_cabinet_profiles.user_id = auth.uid()
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

notify pgrst, 'reload schema';
