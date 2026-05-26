import { getStoredSession, supabaseEnv } from "./supabaseClient.js";

const SUPABASE_URL = import.meta.env?.VITE_SUPABASE_URL?.replace(/\/$/, "") || "";
const SUPABASE_ANON_KEY = import.meta.env?.VITE_SUPABASE_ANON_KEY || "";

const PROFILES_TABLE = "profile_cabinet_profiles";
const CONVERSATIONS_TABLE = "profile_cabinet_chat_conversations";
const PARTICIPANTS_TABLE = "profile_cabinet_chat_participants";
const MESSAGES_TABLE = "profile_cabinet_chat_messages";
const FAVORITES_TABLE = "profile_cabinet_chat_favorites";

function chatError(message, details = null) {
  const error = new Error(message);
  error.details = details;
  return error;
}

function cleanText(value) {
  return String(value || "").trim();
}

function requireSession(session) {
  if (!session?.access_token) throw chatError("Нужно войти в кабинет мастера.");
}

async function request(path, options = {}) {
  if (!supabaseEnv.isConfigured) {
    throw chatError("Чаты требуют настройки подключения Supabase.");
  }

  const session = options.session || getStoredSession();
  const response = await fetch(`${SUPABASE_URL}${path}`, {
    method: options.method || "GET",
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${session?.access_token || SUPABASE_ANON_KEY}`,
      "Content-Type": "application/json",
      ...(options.prefer ? { Prefer: options.prefer } : {})
    },
    body: options.body === undefined ? undefined : JSON.stringify(options.body)
  });

  const text = await response.text();
  const data = text ? JSON.parse(text) : null;

  if (!response.ok) {
    throw chatError(data?.msg || data?.message || "Ошибка загрузки чатов.", data);
  }

  return data;
}

export function formatCabinetId(profileId) {
  return profileId ? `RY-${String(profileId).slice(0, 8).toUpperCase()}` : "RY-00000000";
}

export function profileMatchesQuery(profile, query) {
  const normalized = cleanText(query).toLowerCase();
  if (!normalized) return true;

  return [
    profile?.display_name,
    profile?.id,
    formatCabinetId(profile?.id)
  ].some((value) => cleanText(value).toLowerCase().includes(normalized));
}

export async function listApprovedMasterProfiles(session = getStoredSession()) {
  requireSession(session);

  return request(`/rest/v1/${PROFILES_TABLE}?status=eq.approved&select=id,display_name,bio,city,country,avatar_url,status&order=display_name.asc`, {
    session
  });
}

export async function listOwnChatThreads(ownerProfileId, session = getStoredSession()) {
  requireSession(session);
  if (!ownerProfileId) return [];

  const [participantRows, favoriteRows] = await Promise.all([
    request(`/rest/v1/${PARTICIPANTS_TABLE}?profile_id=eq.${encodeURIComponent(ownerProfileId)}&select=conversation_id`, { session }),
    request(`/rest/v1/${FAVORITES_TABLE}?owner_profile_id=eq.${encodeURIComponent(ownerProfileId)}&select=conversation_id,created_at`, { session })
  ]);

  const favoriteIds = new Set((favoriteRows || []).map((item) => item.conversation_id));
  const conversationIds = [...new Set((participantRows || []).map((item) => item.conversation_id).filter(Boolean))];

  const threads = await Promise.all(conversationIds.map(async (conversationId) => {
    const [participants, messages] = await Promise.all([
      request(`/rest/v1/${PARTICIPANTS_TABLE}?conversation_id=eq.${encodeURIComponent(conversationId)}&select=profile_id,profile:profile_cabinet_profiles(id,display_name,avatar_url,city,country,status)&order=created_at.asc`, { session }),
      request(`/rest/v1/${MESSAGES_TABLE}?conversation_id=eq.${encodeURIComponent(conversationId)}&select=*&order=created_at.asc`, { session })
    ]);

    const otherParticipant = (participants || []).find((item) => item.profile_id !== ownerProfileId) || participants?.[0] || null;
    const lastMessage = messages?.[messages.length - 1] || null;

    return {
      conversation_id: conversationId,
      participants: participants || [],
      master: otherParticipant?.profile || null,
      messages: messages || [],
      last_message_at: lastMessage?.created_at || "",
      is_favorite: favoriteIds.has(conversationId)
    };
  }));

  return threads.sort((a, b) => {
    if (a.is_favorite !== b.is_favorite) return a.is_favorite ? -1 : 1;
    if (a.last_message_at !== b.last_message_at) return b.last_message_at.localeCompare(a.last_message_at);
    return cleanText(a.master?.display_name).localeCompare(cleanText(b.master?.display_name), "ru");
  });
}

export async function findConversationWithMaster(ownerProfileId, masterProfileId, session = getStoredSession()) {
  const threads = await listOwnChatThreads(ownerProfileId, session);
  return threads.find((thread) =>
    thread.participants.some((participant) => participant.profile_id === masterProfileId)
  ) || null;
}

export async function createConversationWithMaster(ownerProfileId, masterProfileId, session = getStoredSession()) {
  requireSession(session);
  if (!ownerProfileId || !masterProfileId) throw chatError("Выберите мастера для чата.");
  if (ownerProfileId === masterProfileId) throw chatError("Выберите другого мастера для чата.");

  const existing = await findConversationWithMaster(ownerProfileId, masterProfileId, session);
  if (existing) return existing.conversation_id;

  const conversations = await request(`/rest/v1/${CONVERSATIONS_TABLE}`, {
    method: "POST",
    session,
    prefer: "return=representation",
    body: { created_by_profile_id: ownerProfileId }
  });
  const conversationId = conversations?.[0]?.id;
  if (!conversationId) throw chatError("Не удалось создать чат.");

  await request(`/rest/v1/${PARTICIPANTS_TABLE}`, {
    method: "POST",
    session,
    body: { conversation_id: conversationId, profile_id: ownerProfileId }
  });

  await request(`/rest/v1/${PARTICIPANTS_TABLE}`, {
    method: "POST",
    session,
    body: { conversation_id: conversationId, profile_id: masterProfileId }
  });

  return conversationId;
}

export async function sendChatMessage(conversationId, senderProfileId, body, session = getStoredSession()) {
  requireSession(session);
  const messageBody = cleanText(body);
  if (!messageBody) throw chatError("Введите сообщение.");

  const rows = await request(`/rest/v1/${MESSAGES_TABLE}`, {
    method: "POST",
    session,
    prefer: "return=representation",
    body: {
      conversation_id: conversationId,
      sender_profile_id: senderProfileId,
      body: messageBody
    }
  });

  return rows?.[0] || null;
}

export async function setChatFavorite(ownerProfileId, conversationId, isFavorite, session = getStoredSession()) {
  requireSession(session);

  if (isFavorite) {
    await request(`/rest/v1/${FAVORITES_TABLE}?on_conflict=owner_profile_id,conversation_id`, {
      method: "POST",
      session,
      prefer: "resolution=merge-duplicates",
      body: { owner_profile_id: ownerProfileId, conversation_id: conversationId }
    });
    return;
  }

  await request(`/rest/v1/${FAVORITES_TABLE}?owner_profile_id=eq.${encodeURIComponent(ownerProfileId)}&conversation_id=eq.${encodeURIComponent(conversationId)}`, {
    method: "DELETE",
    session
  });
}
