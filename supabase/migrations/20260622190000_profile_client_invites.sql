create extension if not exists pgcrypto;

create table if not exists public.profile_cabinet_client_invites (
  id uuid primary key default gen_random_uuid(),
  master_profile_id uuid not null references public.profile_cabinet_profiles(id) on delete cascade,
  client_profile_id uuid null references public.profile_cabinet_profiles(id) on delete set null,
  client_name text not null default '',
  service_id uuid null references public.profile_cabinet_services(id) on delete set null,
  service_order_id uuid null references public.profile_cabinet_service_orders(id) on delete set null,
  invite_token_hash text not null unique,
  status text not null default 'pending' check (status in ('pending', 'claimed', 'expired', 'revoked')),
  expires_at timestamptz null,
  claimed_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists profile_cabinet_client_invites_master_idx
on public.profile_cabinet_client_invites(master_profile_id, status);

create index if not exists profile_cabinet_client_invites_client_idx
on public.profile_cabinet_client_invites(client_profile_id, status);

drop trigger if exists profile_cabinet_client_invites_updated_at on public.profile_cabinet_client_invites;
create trigger profile_cabinet_client_invites_updated_at
before update on public.profile_cabinet_client_invites
for each row execute function public.profile_cabinet_touch_updated_at();

alter table public.profile_cabinet_client_invites enable row level security;

drop policy if exists "master reads own client invites" on public.profile_cabinet_client_invites;
create policy "master reads own client invites"
on public.profile_cabinet_client_invites
for select
to authenticated
using (
  exists (
    select 1 from public.profile_cabinet_profiles
    where profile_cabinet_profiles.id = profile_cabinet_client_invites.master_profile_id
      and profile_cabinet_profiles.user_id = auth.uid()
  )
);

drop policy if exists "client reads claimed own invites" on public.profile_cabinet_client_invites;
create policy "client reads claimed own invites"
on public.profile_cabinet_client_invites
for select
to authenticated
using (
  status = 'claimed'
  and exists (
    select 1 from public.profile_cabinet_profiles
    where profile_cabinet_profiles.id = profile_cabinet_client_invites.client_profile_id
      and profile_cabinet_profiles.user_id = auth.uid()
  )
);

drop policy if exists "master revokes own client invites" on public.profile_cabinet_client_invites;
create policy "master revokes own client invites"
on public.profile_cabinet_client_invites
for update
to authenticated
using (
  exists (
    select 1 from public.profile_cabinet_profiles
    where profile_cabinet_profiles.id = profile_cabinet_client_invites.master_profile_id
      and profile_cabinet_profiles.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.profile_cabinet_profiles
    where profile_cabinet_profiles.id = profile_cabinet_client_invites.master_profile_id
      and profile_cabinet_profiles.user_id = auth.uid()
  )
);

create or replace function public.create_client_invite(
  p_client_name text,
  p_service_id uuid default null,
  p_service_order_id uuid default null,
  p_expires_at timestamptz default null
)
returns table (
  id uuid,
  master_profile_id uuid,
  client_profile_id uuid,
  client_name text,
  service_id uuid,
  service_order_id uuid,
  invite_token text,
  status text,
  expires_at timestamptz,
  claimed_at timestamptz,
  created_at timestamptz,
  updated_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_master_profile_id uuid;
  v_token text;
  v_inserted public.profile_cabinet_client_invites%rowtype;
begin
  if auth.uid() is null then
    raise exception 'Auth required';
  end if;

  select profile_cabinet_profiles.id into v_master_profile_id
  from public.profile_cabinet_profiles
  where profile_cabinet_profiles.user_id = auth.uid()
  limit 1;

  if v_master_profile_id is null then
    raise exception 'Master profile not found';
  end if;

  if coalesce(trim(p_client_name), '') = '' then
    raise exception 'Client name required';
  end if;

  if p_service_id is not null and not exists (
    select 1 from public.profile_cabinet_services
    where profile_cabinet_services.id = p_service_id
      and profile_cabinet_services.profile_id = v_master_profile_id
  ) then
    raise exception 'Service does not belong to current master';
  end if;

  if p_service_order_id is not null and not exists (
    select 1 from public.profile_cabinet_service_orders
    where profile_cabinet_service_orders.id = p_service_order_id
      and profile_cabinet_service_orders.master_profile_id = v_master_profile_id
  ) then
    raise exception 'Order does not belong to current master';
  end if;

  v_token := encode(gen_random_bytes(32), 'hex');

  insert into public.profile_cabinet_client_invites (
    master_profile_id,
    client_name,
    service_id,
    service_order_id,
    invite_token_hash,
    expires_at
  )
  values (
    v_master_profile_id,
    trim(p_client_name),
    p_service_id,
    p_service_order_id,
    encode(digest(v_token, 'sha256'), 'hex'),
    p_expires_at
  )
  returning * into v_inserted;

  return query select
    v_inserted.id,
    v_inserted.master_profile_id,
    v_inserted.client_profile_id,
    v_inserted.client_name,
    v_inserted.service_id,
    v_inserted.service_order_id,
    v_token,
    v_inserted.status,
    v_inserted.expires_at,
    v_inserted.claimed_at,
    v_inserted.created_at,
    v_inserted.updated_at;
end;
$$;

create or replace function public.claim_client_invite(p_invite_token text)
returns table (
  id uuid,
  master_profile_id uuid,
  client_profile_id uuid,
  client_name text,
  service_id uuid,
  service_order_id uuid,
  invite_token text,
  status text,
  expires_at timestamptz,
  claimed_at timestamptz,
  created_at timestamptz,
  updated_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_client_profile_id uuid;
  v_invite public.profile_cabinet_client_invites%rowtype;
begin
  if auth.uid() is null then
    raise exception 'Auth required';
  end if;

  if coalesce(trim(p_invite_token), '') = '' then
    raise exception 'Missing invite token';
  end if;

  select profile_cabinet_profiles.id into v_client_profile_id
  from public.profile_cabinet_profiles
  where profile_cabinet_profiles.user_id = auth.uid()
  limit 1;

  if v_client_profile_id is null then
    raise exception 'Client profile not found';
  end if;

  select * into v_invite
  from public.profile_cabinet_client_invites
  where invite_token_hash = encode(digest(trim(p_invite_token), 'sha256'), 'hex')
  for update;

  if v_invite.id is null then
    raise exception 'Ссылка недействительна или устарела';
  end if;

  if v_invite.status = 'claimed' and v_invite.client_profile_id = v_client_profile_id then
    return query select
      v_invite.id,
      v_invite.master_profile_id,
      v_invite.client_profile_id,
      v_invite.client_name,
      v_invite.service_id,
      v_invite.service_order_id,
      null::text,
      v_invite.status,
      v_invite.expires_at,
      v_invite.claimed_at,
      v_invite.created_at,
      v_invite.updated_at;
    return;
  end if;

  if v_invite.status <> 'pending' or v_invite.client_profile_id is not null then
    raise exception 'Эта ссылка уже использована';
  end if;

  if v_invite.expires_at is not null and v_invite.expires_at < now() then
    update public.profile_cabinet_client_invites
    set status = 'expired'
    where profile_cabinet_client_invites.id = v_invite.id;
    raise exception 'Ссылка недействительна или устарела';
  end if;

  update public.profile_cabinet_client_invites
  set client_profile_id = v_client_profile_id,
      status = 'claimed',
      claimed_at = now()
  where profile_cabinet_client_invites.id = v_invite.id
  returning * into v_invite;

  if v_invite.service_order_id is not null then
    update public.profile_cabinet_service_orders
    set client_profile_id = v_client_profile_id
    where profile_cabinet_service_orders.id = v_invite.service_order_id
      and profile_cabinet_service_orders.master_profile_id = v_invite.master_profile_id
      and (
        profile_cabinet_service_orders.client_profile_id is null
        or profile_cabinet_service_orders.client_profile_id = v_client_profile_id
      );
  end if;

  return query select
    v_invite.id,
    v_invite.master_profile_id,
    v_invite.client_profile_id,
    v_invite.client_name,
    v_invite.service_id,
    v_invite.service_order_id,
    null::text,
    v_invite.status,
    v_invite.expires_at,
    v_invite.claimed_at,
    v_invite.created_at,
    v_invite.updated_at;
end;
$$;

grant execute on function public.create_client_invite(text, uuid, uuid, timestamptz) to authenticated;
grant execute on function public.claim_client_invite(text) to authenticated;

notify pgrst, 'reload schema';
