alter table public.profile_cabinet_service_orders
  add column if not exists draft_result_composition_id uuid null references public.profile_cabinet_power_place_compositions(id) on delete set null,
  add column if not exists final_result_composition_id uuid null references public.profile_cabinet_power_place_compositions(id) on delete set null,
  add column if not exists sent_at timestamptz null;

alter table public.profile_cabinet_service_orders
  drop constraint if exists profile_cabinet_service_orders_status_check;

alter table public.profile_cabinet_service_orders
  add constraint profile_cabinet_service_orders_status_check
  check (status in ('draft', 'photo_required', 'new', 'ready_for_review', 'in_progress', 'sent', 'closed'));

create index if not exists profile_cabinet_service_orders_draft_result_idx
on public.profile_cabinet_service_orders(draft_result_composition_id);

create index if not exists profile_cabinet_service_orders_final_result_idx
on public.profile_cabinet_service_orders(final_result_composition_id);

create index if not exists profile_cabinet_service_orders_sent_at_idx
on public.profile_cabinet_service_orders(sent_at);

-- RLS assumption: public cannot read private orders/photos/results.
-- Existing master order policies allow a service owner to read and update own orders only.
-- client reads own sent final result compositions: this policy grants the client read access
-- only to the final result composition linked from the client's own sent order.
-- It does not grant access to draft_result_composition_id.
drop policy if exists "client reads own sent final result compositions"
on public.profile_cabinet_power_place_compositions;

create policy "client reads own sent final result compositions"
on public.profile_cabinet_power_place_compositions
for select
to authenticated
using (
  exists (
    select 1
    from public.profile_cabinet_service_orders
    join public.profile_cabinet_profiles
      on profile_cabinet_profiles.id = profile_cabinet_service_orders.client_profile_id
    where profile_cabinet_profiles.user_id = auth.uid()
      and profile_cabinet_service_orders.status = 'sent'
      and profile_cabinet_service_orders.final_result_composition_id = profile_cabinet_power_place_compositions.id
  )
);
