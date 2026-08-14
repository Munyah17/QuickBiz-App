import type { TypedSupabaseClient as SupabaseClient } from "@quickbiz/supabase/types";

export interface NotificationRow {
  id: string;
  title: string;
  body: string | null;
  type: "info" | "success" | "warning" | "error";
  read_at: string | null;
  created_at: string;
}

export async function listNotifications(supabase: SupabaseClient, limit = 10): Promise<NotificationRow[]> {
  const { data, error } = await supabase
    .from("notifications")
    .select("id, title, body, type, read_at, created_at")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data as NotificationRow[];
}

export async function markNotificationRead(supabase: SupabaseClient, id: string) {
  const { error } = await supabase.from("notifications").update({ read_at: new Date().toISOString() }).eq("id", id);
  if (error) throw error;
}
