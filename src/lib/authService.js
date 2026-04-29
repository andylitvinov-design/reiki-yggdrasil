import { supabase } from "./supabaseClient";

export async function signInWithGoogle() {
  return supabase.auth.signInWithOAuth({ provider: "google" });
}

export async function signInWithEmail(email, password) {
  return supabase.auth.signInWithPassword({ email, password });
}

export async function signUpWithEmail(email, password) {
  return supabase.auth.signUp({ email, password });
}

export async function signOut() {
  return supabase.auth.signOut();
}
