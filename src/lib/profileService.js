import { supabase } from "./supabaseClient";

export async function getProfile(userId) {
  const { data, error } = await supabase.from("profiles").select("*").eq("user_id", userId).maybeSingle();
  if (error) throw error;
  return data;
}

export async function upsertProfile(payload) {
  const { data, error } = await supabase.from("profiles").upsert(payload, { onConflict: "user_id" }).select().single();
  if (error) throw error;
  return data;
}

export async function listPublicMasters() {
  const { data, error } = await supabase
    .from("profiles")
    .select("user_id,name,bio,training_info,contacts,show_contacts,avatar_url,master_level")
    .eq("public_visible", true)
    .order("master_level", { ascending: false });
  if (error) throw error;
  return data || [];
}
