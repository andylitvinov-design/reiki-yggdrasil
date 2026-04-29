import { supabase } from "./supabaseClient";

export async function listVisibleMedia(userLevel) {
  const { data, error } = await supabase
    .from("media_items")
    .select("*, profiles!media_items_owner_user_id_fkey(name)")
    .eq("status", "approved")
    .lte("level_id", userLevel)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function listPracticeAudio(limit = 3) {
  const { data, error } = await supabase
    .from("media_items")
    .select("id,title,description,category,storage_path,external_url,created_at")
    .eq("type", "audio")
    .eq("status", "approved")
    .eq("visibility", "public")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data || [];
}

export async function getAudioPlaybackUrl(item) {
  if (item.external_url) return item.external_url;
  if (!item.storage_path) return "";
  const { data, error } = await supabase.storage.from("audio").createSignedUrl(item.storage_path, 60 * 60);
  if (error) throw error;
  return data?.signedUrl || "";
}

export async function uploadStorageFile(bucket, file, userId) {
  const ext = file.name.split(".").pop();
  const filePath = `${userId}/${Date.now()}.${ext}`;
  const { error } = await supabase.storage.from(bucket).upload(filePath, file);
  if (error) throw error;
  return filePath;
}

export async function createMediaItem(payload) {
  const { data, error } = await supabase.from("media_items").insert(payload).select().single();
  if (error) throw error;
  return data;
}

export async function toggleLike(mediaId, userId) {
  const { data: existing } = await supabase.from("likes").select("id").eq("media_id", mediaId).eq("user_id", userId).maybeSingle();
  if (existing?.id) {
    await supabase.from("likes").delete().eq("id", existing.id);
    return false;
  }
  await supabase.from("likes").insert({ media_id: mediaId, user_id: userId });
  return true;
}
