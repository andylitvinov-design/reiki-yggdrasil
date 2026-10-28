-- Re-apply material taxonomy columns and refresh PostgREST schema cache.
-- Safe to run after 20260617120000_profile_cabinet_publication_material_taxonomy.sql
-- or directly on an environment where that migration has not landed yet.

alter table public.profile_cabinet_publications
  add column if not exists material_group text not null default '',
  add column if not exists material_type text not null default '',
  add column if not exists category text not null default '',
  add column if not exists subcategory text not null default '';

create index if not exists profile_cabinet_publications_material_taxonomy_idx
  on public.profile_cabinet_publications (material_group, material_type, step_id);

notify pgrst, 'reload schema';
