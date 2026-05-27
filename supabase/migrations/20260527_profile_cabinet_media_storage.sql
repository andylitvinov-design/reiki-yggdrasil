insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'profile-cabinet-media',
  'profile-cabinet-media',
  false,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update
set
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

alter table public.profile_cabinet_client_goal_photos
  add column if not exists image_bucket text not null default 'profile-cabinet-media',
  add column if not exists image_path text not null default '',
  add column if not exists mime_type text not null default '',
  add column if not exists file_size_bytes integer not null default 0;

alter table public.profile_cabinet_tradition_assets
  add column if not exists image_bucket text not null default 'profile-cabinet-media',
  add column if not exists image_path text not null default '',
  add column if not exists mime_type text not null default '',
  add column if not exists file_size_bytes integer not null default 0;

create or replace function public.profile_cabinet_owns_storage_profile_path(object_name text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profile_cabinet_profiles
    where profile_cabinet_profiles.id::text = split_part(object_name, '/', 1)
      and profile_cabinet_profiles.user_id = auth.uid()
  );
$$;

revoke all on function public.profile_cabinet_owns_storage_profile_path(text) from public;
revoke all on function public.profile_cabinet_owns_storage_profile_path(text) from anon;
grant execute on function public.profile_cabinet_owns_storage_profile_path(text) to authenticated;

drop policy if exists "owners read profile cabinet media" on storage.objects;
create policy "owners read profile cabinet media"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'profile-cabinet-media'
  and public.profile_cabinet_owns_storage_profile_path(name)
);

drop policy if exists "owners upload profile cabinet media" on storage.objects;
create policy "owners upload profile cabinet media"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'profile-cabinet-media'
  and public.profile_cabinet_owns_storage_profile_path(name)
);

drop policy if exists "owners update profile cabinet media" on storage.objects;
create policy "owners update profile cabinet media"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'profile-cabinet-media'
  and public.profile_cabinet_owns_storage_profile_path(name)
)
with check (
  bucket_id = 'profile-cabinet-media'
  and public.profile_cabinet_owns_storage_profile_path(name)
);

drop policy if exists "owners delete profile cabinet media" on storage.objects;
create policy "owners delete profile cabinet media"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'profile-cabinet-media'
  and public.profile_cabinet_owns_storage_profile_path(name)
);
