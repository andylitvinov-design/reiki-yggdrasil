alter table public.profile_cabinet_power_place_compositions
  add column if not exists report_mode text not null default 'with_report',
  add column if not exists report_added boolean not null default false,
  add column if not exists report_situation text not null default '',
  add column if not exists report_mandala_effect text not null default '',
  add column if not exists report_extra_help text not null default '',
  add column if not exists report_master_note text not null default '';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'profile_cabinet_power_place_compositions_report_mode_check'
  ) then
    alter table public.profile_cabinet_power_place_compositions
      add constraint profile_cabinet_power_place_compositions_report_mode_check
      check (report_mode in ('with_report', 'without_report'));
  end if;
end $$;
