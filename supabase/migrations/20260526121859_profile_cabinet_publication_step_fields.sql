alter table public.profile_cabinet_publications
  add column if not exists step_id text not null default '',
  add column if not exists step_title text not null default '',
  add column if not exists setting_title text not null default '',
  add column if not exists setting_index integer;

create index if not exists profile_cabinet_publications_step_id_idx
  on public.profile_cabinet_publications (step_id);
