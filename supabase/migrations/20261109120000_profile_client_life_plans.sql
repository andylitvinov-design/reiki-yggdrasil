-- Personal life plans are strictly private to the signed-in owner.
create extension if not exists pgcrypto;

create table if not exists public.profile_cabinet_life_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade default auth.uid(),
  sections jsonb not null default '{}'::jsonb
    check (jsonb_typeof(sections) = 'object'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists profile_cabinet_life_plans_updated_at_idx
  on public.profile_cabinet_life_plans(updated_at desc);

drop trigger if exists profile_cabinet_life_plans_updated_at
  on public.profile_cabinet_life_plans;
create trigger profile_cabinet_life_plans_updated_at
before update on public.profile_cabinet_life_plans
for each row execute function public.profile_cabinet_touch_updated_at();

alter table public.profile_cabinet_life_plans enable row level security;

drop policy if exists "client reads own life plan" on public.profile_cabinet_life_plans;
create policy "client reads own life plan"
on public.profile_cabinet_life_plans
for select to authenticated
using (auth.uid() = user_id);

drop policy if exists "client creates own life plan" on public.profile_cabinet_life_plans;
create policy "client creates own life plan"
on public.profile_cabinet_life_plans
for insert to authenticated
with check (auth.uid() = user_id);

drop policy if exists "client updates own life plan" on public.profile_cabinet_life_plans;
create policy "client updates own life plan"
on public.profile_cabinet_life_plans
for update to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

revoke all on public.profile_cabinet_life_plans from anon;
grant select, insert, update on public.profile_cabinet_life_plans to authenticated;
