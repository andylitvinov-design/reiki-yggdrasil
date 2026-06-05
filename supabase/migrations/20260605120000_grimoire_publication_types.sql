-- Extend profile_cabinet_publications.type to support grimoire categories.
-- Existing values: practice, mandala, artifact
-- New values added: photo, article, document, audio
-- Backward-compatible: existing rows are not changed.

alter table public.profile_cabinet_publications
  drop constraint if exists profile_cabinet_publications_type_check;

alter table public.profile_cabinet_publications
  add constraint profile_cabinet_publications_type_check
  check (type in ('practice', 'mandala', 'artifact', 'photo', 'article', 'document', 'audio'));
