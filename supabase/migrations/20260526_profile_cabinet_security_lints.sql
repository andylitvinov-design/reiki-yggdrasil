create or replace function public.profile_cabinet_touch_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

revoke all on function public.profile_cabinet_touch_updated_at() from public;
revoke all on function public.profile_cabinet_touch_updated_at() from anon;
revoke all on function public.profile_cabinet_touch_updated_at() from authenticated;

revoke all on function public.profile_cabinet_is_admin() from public;
revoke all on function public.profile_cabinet_is_admin() from anon;
grant execute on function public.profile_cabinet_is_admin() to authenticated;
