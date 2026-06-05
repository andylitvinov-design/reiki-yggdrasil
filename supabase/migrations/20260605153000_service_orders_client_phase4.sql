alter table public.profile_cabinet_service_orders
  add column if not exists client_profile_id uuid null references public.profile_cabinet_profiles(id) on delete cascade,
  add column if not exists template_composition_id uuid null references public.profile_cabinet_power_place_compositions(id) on delete set null,
  add column if not exists order_format text not null default 'signature',
  add column if not exists client_photo_id uuid null references public.profile_cabinet_client_goal_photos(id) on delete set null;

alter table public.profile_cabinet_service_orders
  drop constraint if exists profile_cabinet_service_orders_status_check;

alter table public.profile_cabinet_service_orders
  add constraint profile_cabinet_service_orders_status_check
  check (status in ('draft', 'photo_required', 'new', 'in_progress', 'sent', 'closed'));

alter table public.profile_cabinet_service_orders
  drop constraint if exists profile_cabinet_service_orders_order_format_check;

alter table public.profile_cabinet_service_orders
  add constraint profile_cabinet_service_orders_order_format_check
  check (order_format in ('signature', 'no_signature', 'both'));

create index if not exists profile_cabinet_service_orders_client_status_idx
on public.profile_cabinet_service_orders(client_profile_id, status);

create index if not exists profile_cabinet_service_orders_master_status_idx
on public.profile_cabinet_service_orders(master_profile_id, status);

create index if not exists profile_cabinet_service_orders_client_photo_idx
on public.profile_cabinet_service_orders(client_photo_id);

create or replace function public.prevent_service_order_identity_change()
returns trigger
language plpgsql
as $$
begin
  if old.service_id is distinct from new.service_id
    or old.master_profile_id is distinct from new.master_profile_id
    or old.client_profile_id is distinct from new.client_profile_id
    or old.template_composition_id is distinct from new.template_composition_id
  then
    raise exception 'service order identity fields cannot be changed after draft creation';
  end if;

  return new;
end;
$$;

drop trigger if exists prevent_service_order_identity_change
on public.profile_cabinet_service_orders;

create trigger prevent_service_order_identity_change
before update on public.profile_cabinet_service_orders
for each row
execute function public.prevent_service_order_identity_change();

drop policy if exists "public creates orders for published services" on public.profile_cabinet_service_orders;

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
create policy "client submits own service orders"
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
