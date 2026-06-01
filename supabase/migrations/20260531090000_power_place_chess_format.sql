alter table public.profile_cabinet_power_place_compositions
  add column if not exists chess_variant text not null default 'classic-14';

alter table public.profile_cabinet_power_place_compositions
  drop constraint if exists profile_cabinet_power_place_constructor_type_check;

alter table public.profile_cabinet_power_place_compositions
  drop constraint if exists profile_cabinet_power_place_chess_variant_check,
  add constraint profile_cabinet_power_place_constructor_type_check
    check (constructor_type in ('client', 'altar', 'business', 'dao', 'zodiac', 'star', 'chess')),
  add constraint profile_cabinet_power_place_chess_variant_check
    check (chess_variant in ('classic-14', 'classic-8', 'plus-8'));
