import { supabase } from "./supabaseClient";

export async function listUsersForAdmin() {
  const { data, error } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function adminUpdateLevel(userId, masterLevel, levelFrozen = false) {
  const { data, error } = await supabase
    .from("profiles")
    .update({ master_level: masterLevel, level_frozen: levelFrozen })
    .eq("user_id", userId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function listModerationMedia() {
  const { data, error } = await supabase.from("media_items").select("*").order("created_at", { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function moderateMedia(mediaId, status) {
  const { data, error } = await supabase.from("media_items").update({ status }).eq("id", mediaId).select().single();
  if (error) throw error;
  return data;
}
