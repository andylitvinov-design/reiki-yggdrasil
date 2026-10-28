do $$
declare
  constraint_name text;
begin
  for constraint_name in
    select con.conname
    from pg_constraint con
    join pg_class rel on rel.oid = con.conrelid
    join pg_namespace nsp on nsp.oid = rel.relnamespace
    where nsp.nspname = 'public'
      and rel.relname = 'profile_cabinet_profiles'
      and con.contype = 'c'
      and pg_get_constraintdef(con.oid) like '%account_plan%'
  loop
    execute format('alter table public.profile_cabinet_profiles drop constraint if exists %I', constraint_name);
  end loop;
end $$;

alter table public.profile_cabinet_profiles
  alter column account_plan set default 'start',
  add constraint profile_cabinet_profiles_account_plan_check
    check (account_plan in ('start', 'pro', 'practic', 'master'));
