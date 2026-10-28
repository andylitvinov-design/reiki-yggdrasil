-- Persist Profile Lite material picker taxonomy for saved material images.

alter table public.profile_cabinet_publications
  add column if not exists material_group text not null default '',
  add column if not exists material_type text not null default '',
  add column if not exists category text not null default '',
  add column if not exists subcategory text not null default '';

create index if not exists profile_cabinet_publications_material_taxonomy_idx
  on public.profile_cabinet_publications (material_group, material_type, step_id);
