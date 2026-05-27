alter table public.profile_cabinet_power_place_compositions
  add column if not exists star_variant text not null default 'closed';

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
    check (constructor_type in ('client', 'altar', 'business', 'dao', 'zodiac', 'star')),
  drop constraint if exists profile_cabinet_power_place_star_variant_check,
  add constraint profile_cabinet_power_place_star_variant_check
    check (star_variant in ('closed', 'open'));
