create table if not exists public.profile_cabinet_activity_events (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid null references public.profile_cabinet_profiles(id) on delete cascade,
  activity_type text not null,
  target_table text null,
  target_id uuid null,
  title text not null default '',
  body text not null default '',
  image_url text not null default '',
  image_bucket text null,
  image_path text null,
  category text not null default '',
  subcategory text not null default '',
  tags text[] not null default '{}',
  status text not null default 'draft',
  visibility text not null default 'private',
  is_featured boolean not null default false,
  event_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profile_cabinet_activity_events_activity_type_check check (activity_type in (
    'master_update',
    'mandala_published',
    'power_place_published',
    'photo_album_published',
    'service_created',
    'service_updated',
    'practice_published',
    'artifact_published',
    'admin_announcement',
    'featured_item'
  )),
  constraint profile_cabinet_activity_events_target_table_check check (
    target_table in (
      'profile_cabinet_publications',
      'profile_cabinet_services',
      'profile_cabinet_photo_albums'
    ) or target_table is null
  ),
  constraint profile_cabinet_activity_events_status_check check (status in ('draft', 'pending', 'approved', 'rejected', 'archived')),
  constraint profile_cabinet_activity_events_visibility_check check (visibility in ('private', 'profile_only', 'public_feed')),
  constraint profile_cabinet_activity_events_public_image_check check (
    visibility <> 'public_feed'
    or (
      coalesce(image_bucket, '') = ''
      and coalesce(image_path, '') = ''
      and image_url !~* '^(storage://|data:image)'
      and image_url !~* '/storage/v1/object/sign/'
      and image_url !~* 'profile-cabinet-media'
    )
  )
);

create index if not exists profile_cabinet_activity_events_feed_idx
  on public.profile_cabinet_activity_events (status, visibility, event_at desc);

create index if not exists profile_cabinet_activity_events_profile_idx
  on public.profile_cabinet_activity_events (profile_id, event_at desc);

create index if not exists profile_cabinet_activity_events_type_idx
  on public.profile_cabinet_activity_events (activity_type, event_at desc);

create index if not exists profile_cabinet_activity_events_category_idx
  on public.profile_cabinet_activity_events (category, event_at desc);

create index if not exists profile_cabinet_activity_events_target_idx
  on public.profile_cabinet_activity_events (target_table, target_id);

drop trigger if exists profile_cabinet_activity_events_updated_at on public.profile_cabinet_activity_events;
create trigger profile_cabinet_activity_events_updated_at
before update on public.profile_cabinet_activity_events
for each row execute function public.profile_cabinet_touch_updated_at();

alter table public.profile_cabinet_activity_events enable row level security;

drop policy if exists "public reads approved public activity events" on public.profile_cabinet_activity_events;
create policy "public reads approved public activity events"
on public.profile_cabinet_activity_events
for select
to anon, authenticated
using (
  status = 'approved'
  and visibility = 'public_feed'
  and (
    profile_id is null
    or exists (
      select 1 from public.profile_cabinet_profiles
      where profile_cabinet_profiles.id = profile_cabinet_activity_events.profile_id
        and profile_cabinet_profiles.status = 'approved'
    )
  )
);

drop policy if exists "owner manages own editable activity events" on public.profile_cabinet_activity_events;
create policy "owner manages own editable activity events"
on public.profile_cabinet_activity_events
for all
to authenticated
using (
  status in ('draft', 'pending', 'rejected')
  and exists (
    select 1 from public.profile_cabinet_profiles
    where profile_cabinet_profiles.id = profile_cabinet_activity_events.profile_id
      and profile_cabinet_profiles.user_id = auth.uid()
  )
)
with check (
  status in ('draft', 'pending', 'rejected')
  and visibility in ('private', 'profile_only', 'public_feed')
  and exists (
    select 1 from public.profile_cabinet_profiles
    where profile_cabinet_profiles.id = profile_cabinet_activity_events.profile_id
      and profile_cabinet_profiles.user_id = auth.uid()
  )
);

drop policy if exists "admin manages all activity events" on public.profile_cabinet_activity_events;
create policy "admin manages all activity events"
on public.profile_cabinet_activity_events
for all
to authenticated
using (public.profile_cabinet_is_admin())
with check (public.profile_cabinet_is_admin());
