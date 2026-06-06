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

create index if not exists profile_cabinet_chat_conversations_created_by_idx on public.profile_cabinet_chat_conversations(created_by_profile_id);
create index if not exists profile_cabinet_chat_participants_profile_id_idx on public.profile_cabinet_chat_participants(profile_id);
create index if not exists profile_cabinet_chat_messages_conversation_id_created_at_idx on public.profile_cabinet_chat_messages(conversation_id, created_at);
create index if not exists profile_cabinet_chat_messages_sender_profile_id_idx on public.profile_cabinet_chat_messages(sender_profile_id);
create index if not exists profile_cabinet_chat_favorites_owner_profile_id_idx on public.profile_cabinet_chat_favorites(owner_profile_id);

alter table public.profile_cabinet_chat_conversations enable row level security;
alter table public.profile_cabinet_chat_participants enable row level security;
alter table public.profile_cabinet_chat_messages enable row level security;
alter table public.profile_cabinet_chat_favorites enable row level security;

drop trigger if exists profile_cabinet_chat_conversations_updated_at on public.profile_cabinet_chat_conversations;
create trigger profile_cabinet_chat_conversations_updated_at
before update on public.profile_cabinet_chat_conversations
for each row execute function public.profile_cabinet_touch_updated_at();

drop policy if exists "chat participants read own conversations" on public.profile_cabinet_chat_conversations;
create policy "chat participants read own conversations"
on public.profile_cabinet_chat_conversations
for select
to authenticated
using (
  exists (
    select 1
    from public.profile_cabinet_chat_participants p
    join public.profile_cabinet_profiles me on me.id = p.profile_id
    where p.conversation_id = profile_cabinet_chat_conversations.id
      and me.user_id = auth.uid()
  )
);

drop policy if exists "owner creates chat conversations" on public.profile_cabinet_chat_conversations;
create policy "owner creates chat conversations"
on public.profile_cabinet_chat_conversations
for insert
to authenticated
with check (
  exists (
    select 1
    from public.profile_cabinet_profiles me
    where me.id = created_by_profile_id
      and me.user_id = auth.uid()
  )
);

drop policy if exists "chat participants read participants" on public.profile_cabinet_chat_participants;
create policy "chat participants read participants"
on public.profile_cabinet_chat_participants
for select
to authenticated
using (
  exists (
    select 1
    from public.profile_cabinet_chat_participants p
    join public.profile_cabinet_profiles me on me.id = p.profile_id
    where p.conversation_id = profile_cabinet_chat_participants.conversation_id
      and me.user_id = auth.uid()
  )
);

drop policy if exists "conversation owner adds participants" on public.profile_cabinet_chat_participants;
create policy "conversation owner adds participants"
on public.profile_cabinet_chat_participants
for insert
to authenticated
with check (
  exists (
    select 1
    from public.profile_cabinet_chat_conversations c
    join public.profile_cabinet_profiles owner_profile on owner_profile.id = c.created_by_profile_id
    where c.id = conversation_id
      and owner_profile.user_id = auth.uid()
  )
  and exists (
    select 1
    from public.profile_cabinet_profiles participant_profile
    where participant_profile.id = profile_id
      and (
        participant_profile.user_id = auth.uid()
        or participant_profile.status = 'approved'
      )
  )
);

drop policy if exists "chat participants read messages" on public.profile_cabinet_chat_messages;
create policy "chat participants read messages"
on public.profile_cabinet_chat_messages
for select
to authenticated
using (
  exists (
    select 1
    from public.profile_cabinet_chat_participants p
    join public.profile_cabinet_profiles me on me.id = p.profile_id
    where p.conversation_id = profile_cabinet_chat_messages.conversation_id
      and me.user_id = auth.uid()
  )
);

drop policy if exists "chat participants send messages" on public.profile_cabinet_chat_messages;
create policy "chat participants send messages"
on public.profile_cabinet_chat_messages
for insert
to authenticated
with check (
  body <> ''
  and exists (
    select 1
    from public.profile_cabinet_profiles me
    where me.id = sender_profile_id
      and me.user_id = auth.uid()
  )
  and exists (
    select 1
    from public.profile_cabinet_chat_participants p
    where p.conversation_id = profile_cabinet_chat_messages.conversation_id
      and p.profile_id = sender_profile_id
  )
);

drop policy if exists "owners manage chat favorites" on public.profile_cabinet_chat_favorites;
create policy "owners manage chat favorites"
on public.profile_cabinet_chat_favorites
for all
to authenticated
using (
  exists (
    select 1
    from public.profile_cabinet_profiles me
    where me.id = owner_profile_id
      and me.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.profile_cabinet_profiles me
    where me.id = owner_profile_id
      and me.user_id = auth.uid()
  )
  and exists (
    select 1
    from public.profile_cabinet_chat_participants p
    where p.conversation_id = profile_cabinet_chat_favorites.conversation_id
      and p.profile_id = owner_profile_id
  )
);
