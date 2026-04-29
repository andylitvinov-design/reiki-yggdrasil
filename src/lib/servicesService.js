import { supabase } from "./supabaseClient";

export async function listServices(userId) {
  const { data, error } = await supabase.from("services").select("*").eq("owner_user_id", userId).order("created_at", { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function createService(payload) {
  const { data, error } = await supabase.from("services").insert(payload).select().single();
  if (error) throw error;
  return data;
}
