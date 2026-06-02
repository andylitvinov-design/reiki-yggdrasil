alter table public.profile_cabinet_power_place_compositions
  drop constraint if exists profile_cabinet_power_place_chess_variant_check,
  add constraint profile_cabinet_power_place_chess_variant_check
    check (chess_variant in ('classic-14', 'classic-8', 'plus-8', 'compact-5'));
