alter table public.profile_cabinet_power_place_compositions
  add column if not exists star_format_variant text not null default 'classic';

alter table public.profile_cabinet_power_place_compositions
  drop constraint if exists profile_cabinet_power_place_star_format_variant_check,
  add constraint profile_cabinet_power_place_star_format_variant_check
    check (star_format_variant in ('classic', 'star-2-10'));

notify pgrst, 'reload schema';
