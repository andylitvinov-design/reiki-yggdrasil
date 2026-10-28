alter table if exists public.profile_cabinet_power_place_compositions
  drop constraint if exists profile_cabinet_power_place_constructor_type_check;

alter table if exists public.profile_cabinet_power_place_compositions
  add constraint profile_cabinet_power_place_constructor_type_check
    check (constructor_type in ('client', 'altar', 'business', 'dao', 'dao-layout', 'zodiac', 'star', 'chess'));
