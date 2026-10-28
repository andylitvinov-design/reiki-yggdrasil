alter table public.profile_cabinet_client_goal_photos
  add column if not exists client_category text not null default 'all';

do $$
begin
  alter table public.profile_cabinet_client_goal_photos
    add constraint profile_cabinet_client_goal_photos_client_category_check
    check (client_category in ('all', 'client-1', 'client-2', 'client-3', 'pro-more-clients'));
exception
  when duplicate_object then null;
end $$;

create index if not exists profile_cabinet_client_goal_photos_profile_category_idx
  on public.profile_cabinet_client_goal_photos (profile_id, client_category, created_at desc);
