create table if not exists public.profile_life_plans (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade,
 status text not null default 'active' check (status in ('active','archived')),
 locale text not null default 'ru' check (locale in ('ru','en','es')),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(user_id)
);
create table if not exists public.profile_life_plan_sections (
 id uuid primary key default gen_random_uuid(), plan_id uuid not null references public.profile_life_plans(id) on delete cascade,
 section_key text not null, content jsonb not null default '{}'::jsonb, visibility text not null default 'private' check (visibility in ('private','shared')),
 reviewed_at timestamptz, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 unique(plan_id,section_key), check(jsonb_typeof(content)='object')
);
create table if not exists public.profile_life_plan_items (
 id uuid primary key default gen_random_uuid(), section_id uuid not null references public.profile_life_plan_sections(id) on delete cascade,
 item_type text not null default 'action' check (item_type in ('goal','action','milestone','reflection')), title text not null, details text not null default '',
 status text not null default 'open' check (status in ('open','in_progress','done','cancelled')), target_date date, source_report_id uuid,
 accepted_by_client_at timestamptz, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.profile_client_reports (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
 source_system text not null default 'holistic_house', source_record_id text,
 report_type text not null check (report_type in ('coaching','consultation','practitioner')), title text not null,
 specialist_name text not null default '', specialist_role text not null default '', report_date timestamptz not null default now(),
 summary text not null default '', file_path text, section_keys text[] not null default '{}', metadata jsonb not null default '{}'::jsonb,
 created_at timestamptz not null default now(), unique(source_system,source_record_id), check(jsonb_typeof(metadata)='object')
);
create index if not exists profile_life_plans_user_idx on public.profile_life_plans(user_id);
create index if not exists profile_life_sections_plan_idx on public.profile_life_plan_sections(plan_id);
create index if not exists profile_life_items_section_idx on public.profile_life_plan_items(section_id);
create index if not exists profile_client_reports_user_date_idx on public.profile_client_reports(user_id,report_date desc);
create or replace function public.profile_life_plan_touch_updated_at() returns trigger language plpgsql as $$ begin new.updated_at=now(); return new; end; $$;
drop trigger if exists profile_life_plans_updated_at on public.profile_life_plans;
create trigger profile_life_plans_updated_at before update on public.profile_life_plans for each row execute function public.profile_life_plan_touch_updated_at();
drop trigger if exists profile_life_sections_updated_at on public.profile_life_plan_sections;
create trigger profile_life_sections_updated_at before update on public.profile_life_plan_sections for each row execute function public.profile_life_plan_touch_updated_at();
drop trigger if exists profile_life_items_updated_at on public.profile_life_plan_items;
create trigger profile_life_items_updated_at before update on public.profile_life_plan_items for each row execute function public.profile_life_plan_touch_updated_at();
alter table public.profile_life_plans enable row level security;
alter table public.profile_life_plan_sections enable row level security;
alter table public.profile_life_plan_items enable row level security;
alter table public.profile_client_reports enable row level security;
create policy "client owns life plan" on public.profile_life_plans for all to authenticated using(auth.uid()=user_id) with check(auth.uid()=user_id);
create policy "client owns life plan sections" on public.profile_life_plan_sections for all to authenticated using(exists(select 1 from public.profile_life_plans p where p.id=plan_id and p.user_id=auth.uid())) with check(exists(select 1 from public.profile_life_plans p where p.id=plan_id and p.user_id=auth.uid()));
create policy "client owns life plan items" on public.profile_life_plan_items for all to authenticated using(exists(select 1 from public.profile_life_plan_sections s join public.profile_life_plans p on p.id=s.plan_id where s.id=section_id and p.user_id=auth.uid())) with check(exists(select 1 from public.profile_life_plan_sections s join public.profile_life_plans p on p.id=s.plan_id where s.id=section_id and p.user_id=auth.uid()));
create policy "client owns coaching reports" on public.profile_client_reports for all to authenticated using(auth.uid()=user_id) with check(auth.uid()=user_id);
comment on table public.profile_client_reports is 'Private client report index; store client-safe summary and source reference only, not source report payload.';