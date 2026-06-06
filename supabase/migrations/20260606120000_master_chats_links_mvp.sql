-- Master chats links MVP
-- Adds missing RLS policies for chat tables if not already present.
-- Chat tables were created in 20260527070353_20260526_power_place_upgrade_6_zodiac_chat.sql.
-- This migration is additive and idempotent.

-- Ensure RLS is enabled on all chat tables.
alter table if exists public.profile_cabinet_chat_conversations enable row level security;
alter table if exists public.profile_cabinet_chat_participants enable row level security;
alter table if exists public.profile_cabinet_chat_messages enable row level security;
alter table if exists public.profile_cabinet_chat_favorites enable row level security;

-- Conversations: participants can read their own conversations.
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'profile_cabinet_chat_conversations'
      and policyname = 'chat participants read own conversations'
  ) then
    execute $policy$
      create policy "chat participants read own conversations"
        on public.profile_cabinet_chat_conversations
        for select
        using (
          exists (
            select 1 from public.profile_cabinet_chat_participants p
            where p.conversation_id = id
              and p.profile_id = auth.uid()::text
          )
        )
    $policy$;
  end if;
end $$;

-- Conversations: authenticated users can create conversations.
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'profile_cabinet_chat_conversations'
      and policyname = 'chat authenticated create conversations'
  ) then
    execute $policy$
      create policy "chat authenticated create conversations"
        on public.profile_cabinet_chat_conversations
        for insert
        with check (auth.uid() is not null)
    $policy$;
  end if;
end $$;

-- Participants: participants can read participant rows for their conversations.
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'profile_cabinet_chat_participants'
      and policyname = 'chat participants read own participant rows'
  ) then
    execute $policy$
      create policy "chat participants read own participant rows"
        on public.profile_cabinet_chat_participants
        for select
        using (
          exists (
            select 1 from public.profile_cabinet_chat_participants p2
            where p2.conversation_id = conversation_id
              and p2.profile_id = auth.uid()::text
          )
        )
    $policy$;
  end if;
end $$;

-- Participants: authenticated users can join a conversation (insert their own participant row).
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'profile_cabinet_chat_participants'
      and policyname = 'chat authenticated insert participant row'
  ) then
    execute $policy$
      create policy "chat authenticated insert participant row"
        on public.profile_cabinet_chat_participants
        for insert
        with check (auth.uid() is not null)
    $policy$;
  end if;
end $$;

-- Messages: participants can read messages in their conversations.
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'profile_cabinet_chat_messages'
      and policyname = 'chat participants read own messages'
  ) then
    execute $policy$
      create policy "chat participants read own messages"
        on public.profile_cabinet_chat_messages
        for select
        using (
          exists (
            select 1 from public.profile_cabinet_chat_participants p
            where p.conversation_id = conversation_id
              and p.profile_id = auth.uid()::text
          )
        )
    $policy$;
  end if;
end $$;

-- Messages: participants can send messages to their own conversations.
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'profile_cabinet_chat_messages'
      and policyname = 'chat participants send messages'
  ) then
    execute $policy$
      create policy "chat participants send messages"
        on public.profile_cabinet_chat_messages
        for insert
        with check (
          sender_profile_id = auth.uid()::text
          and exists (
            select 1 from public.profile_cabinet_chat_participants p
            where p.conversation_id = conversation_id
              and p.profile_id = auth.uid()::text
          )
        )
    $policy$;
  end if;
end $$;

-- Favorites: owners can manage their own favorites.
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'profile_cabinet_chat_favorites'
      and policyname = 'chat owners manage own favorites'
  ) then
    execute $policy$
      create policy "chat owners manage own favorites"
        on public.profile_cabinet_chat_favorites
        for all
        using (owner_profile_id = auth.uid()::text)
        with check (owner_profile_id = auth.uid()::text)
    $policy$;
  end if;
end $$;
