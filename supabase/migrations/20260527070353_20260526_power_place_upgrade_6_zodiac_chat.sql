alter table public.profile_cabinet_power_place_compositions
  add column if not exists zodiac_visible_count smallint not null default 12;

do $$
declare
  constraint_name text;
begin
  select conname
  into constraint_name
  from pg_constraint
  where conrelid = 'public.profile_cabinet_power_place_compositions'::regclass
    and contype = 'c'
    and pg_get_constraintdef(oid) like '%constructor_type%'
  limit 1;

  if constraint_name is not null then
    execute format(
      'alter table public.profile_cabinet_power_place_compositions drop constraint %I',
      constraint_name
    );
  end if;
end $$;

alter table public.profile_cabinet_power_place_compositions
  add constraint profile_cabinet_power_place_constructor_type_check
    check (constructor_type in ('client', 'altar', 'business', 'dao', 'zodiac')),
  drop constraint if exists profile_cabinet_power_place_zodiac_visible_count_check,
  add constraint profile_cabinet_power_place_zodiac_visible_count_check
    check (zodiac_visible_count in (2, 4, 6, 8, 12));

create table if not exists public.profile_cabinet_chat_conversations (
  id uuid primary key default gen_random_uuid(),
  created_by_profile_id uuid not null references public.profile_cabinet_profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.profile_cabinet_chat_participants (
  conversation_id uuid not null references public.profile_cabinet_chat_conversations(id) on delete cascade,
  profile_id uuid not null references public.profile_cabinet_profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (conversation_id, profile_id)
);

create table if not exists public.profile_cabinet_chat_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.profile_cabinet_chat_conversations(id) on delete cascade,
  sender_profile_id uuid not null references public.profile_cabinet_profiles(id) on delete cascade,
  body text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists public.profile_cabinet_chat_favorites (
  owner_profile_id uuid not null references public.profile_cabinet_profiles(id) on delete cascade,
  conversation_id uuid not null references public.profile_cabinet_chat_conversations(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (owner_profile_id, conversation_id)
);

create index if not exists profile_cabinet_chat_conversations_updated_idx
  on public.profile_cabinet_chat_conversations (updated_at desc);

create index if not exists profile_cabinet_chat_participants_profile_idx
  on public.profile_cabinet_chat_participants (profile_id, conversation_id);

create index if not exists profile_cabinet_chat_messages_conversation_idx
  on public.profile_cabinet_chat_messages (conversation_id, created_at asc);

create index if not exists profile_cabinet_chat_favorites_owner_idx
  on public.profile_cabinet_chat_favorites (owner_profile_id, created_at desc);

drop trigger if exists profile_cabinet_chat_conversations_updated_at on public.profile_cabinet_chat_conversations;
create trigger profile_cabinet_chat_conversations_updated_at
before update on public.profile_cabinet_chat_conversations
for each row execute function public.profile_cabinet_touch_updated_at();

create or replace function public.profile_cabinet_owns_profile(target_profile_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profile_cabinet_profiles
    where profile_cabinet_profiles.id = target_profile_id
      and profile_cabinet_profiles.user_id = auth.uid()
  );
$$;

create or replace function public.profile_cabinet_is_chat_participant(target_conversation_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profile_cabinet_chat_participants
    join public.profile_cabinet_profiles
      on profile_cabinet_profiles.id = profile_cabinet_chat_participants.profile_id
    where profile_cabinet_chat_participants.conversation_id = target_conversation_id
      and profile_cabinet_profiles.user_id = auth.uid()
  );
$$;

revoke all on function public.profile_cabinet_owns_profile(uuid) from public;
revoke all on function public.profile_cabinet_owns_profile(uuid) from anon;
grant execute on function public.profile_cabinet_owns_profile(uuid) to authenticated;

revoke all on function public.profile_cabinet_is_chat_participant(uuid) from public;
revoke all on function public.profile_cabinet_is_chat_participant(uuid) from anon;
grant execute on function public.profile_cabinet_is_chat_participant(uuid) to authenticated;

alter table public.profile_cabinet_chat_conversations enable row level security;
alter table public.profile_cabinet_chat_participants enable row level security;
alter table public.profile_cabinet_chat_messages enable row level security;
alter table public.profile_cabinet_chat_favorites enable row level security;

create policy "participants read conversations"
on public.profile_cabinet_chat_conversations
for select
to authenticated
using (public.profile_cabinet_is_chat_participant(id));

create policy "profile owners create conversations"
on public.profile_cabinet_chat_conversations
for insert
to authenticated
with check (public.profile_cabinet_owns_profile(created_by_profile_id));

create policy "participants read participant rows"
on public.profile_cabinet_chat_participants
for select
to authenticated
using (public.profile_cabinet_is_chat_participant(conversation_id));

create policy "owners join own conversations"
on public.profile_cabinet_chat_participants
for insert
to authenticated
with check (
  public.profile_cabinet_owns_profile(profile_id)
  or exists (
    select 1
    from public.profile_cabinet_chat_conversations
    where profile_cabinet_chat_conversations.id = conversation_id
      and public.profile_cabinet_owns_profile(profile_cabinet_chat_conversations.created_by_profile_id)
  )
);

create policy "participants read messages"
on public.profile_cabinet_chat_messages
for select
to authenticated
using (public.profile_cabinet_is_chat_participant(conversation_id));

create policy "participants send messages"
on public.profile_cabinet_chat_messages
for insert
to authenticated
with check (
  public.profile_cabinet_owns_profile(sender_profile_id)
  and public.profile_cabinet_is_chat_participant(conversation_id)
  and length(trim(body)) > 0
);

create policy "owners manage chat favorites"
on public.profile_cabinet_chat_favorites
for all
to authenticated
using (
  public.profile_cabinet_owns_profile(owner_profile_id)
  and public.profile_cabinet_is_chat_participant(conversation_id)
)
with check (
  public.profile_cabinet_owns_profile(owner_profile_id)
  and public.profile_cabinet_is_chat_participant(conversation_id)
);
