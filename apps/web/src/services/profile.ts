import type { TypedSupabaseClient as SupabaseClient } from "@quickbiz/supabase/types";

export async function updateOwnProfile(supabase: SupabaseClient, userId: string, fullName: string) {
  const { error } = await supabase.from("profiles").update({ full_name: fullName }).eq("id", userId);
  if (error) throw error;
}
