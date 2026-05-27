create or replace function public.profile_cabinet_is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profile_cabinet_admins
    where profile_cabinet_admins.user_id = auth.uid()
  );
$$;

revoke all on function public.profile_cabinet_is_admin() from public;
grant execute on function public.profile_cabinet_is_admin() to authenticated;

drop policy if exists "owner updates own draft profile" on public.profile_cabinet_profiles;
create policy "owner updates own editable profile"
on public.profile_cabinet_profiles
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id and status in ('draft', 'pending', 'rejected'));

drop policy if exists "admin reads all profiles" on public.profile_cabinet_profiles;
create policy "admin reads all profiles"
on public.profile_cabinet_profiles
for select
to authenticated
using (public.profile_cabinet_is_admin());

drop policy if exists "admin moderates profiles" on public.profile_cabinet_profiles;
create policy "admin moderates profiles"
on public.profile_cabinet_profiles
for update
to authenticated
using (public.profile_cabinet_is_admin())
with check (public.profile_cabinet_is_admin());

drop policy if exists "admin manages publications" on public.profile_cabinet_publications;
create policy "admin manages publications"
on public.profile_cabinet_publications
for all
to authenticated
using (public.profile_cabinet_is_admin())
with check (public.profile_cabinet_is_admin());

drop policy if exists "admins read admins" on public.profile_cabinet_admins;
create policy "admins read own admin row"
on public.profile_cabinet_admins
for select
to authenticated
using (auth.uid() = user_id);
