alter table public.profile_cabinet_power_place_compositions
  add column if not exists business_vertex_zone_count smallint not null default 1,
  add column if not exists resource_comparison_mode text not null default 'client_photo',
  add column if not exists resource_without_mandala_comment text not null default '',
  add column if not exists resource_with_mandala_comment text not null default '';

do $$
declare
  constraint_name text;
begin
  select conname
  into constraint_name
  from pg_constraint
  where conrelid = 'public.profile_cabinet_power_place_compositions'::regclass
    and contype = 'c'
    and pg_get_constraintdef(oid) like '%constructor_type%'
  limit 1;

  if constraint_name is not null then
    execute format(
      'alter table public.profile_cabinet_power_place_compositions drop constraint %I',
      constraint_name
    );
  end if;
end $$;

alter table public.profile_cabinet_power_place_compositions
  add constraint profile_cabinet_power_place_constructor_type_check
    check (constructor_type in ('client', 'altar', 'business', 'dao')),
  drop constraint if exists profile_cabinet_power_place_business_zone_count_check,
  add constraint profile_cabinet_power_place_business_zone_count_check
    check (business_vertex_zone_count in (1, 3)),
  drop constraint if exists profile_cabinet_power_place_resource_mode_check,
  add constraint profile_cabinet_power_place_resource_mode_check
    check (resource_comparison_mode in ('client_photo', 'photo_mandala'));
