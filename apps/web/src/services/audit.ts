import type { TypedSupabaseClient as SupabaseClient } from "@quickbiz/supabase/types";

export interface AuditLogRow {
  id: string;
  actor_id: string | null;
  actorName: string | null;
  module: string;
  entity_type: string;
  entity_id: string | null;
  action: string;
  created_at: string;
}

export async function listAuditLogs(supabase: SupabaseClient, orgId: string, limit = 50): Promise<AuditLogRow[]> {
  const { data, error } = await supabase
    .from("audit_logs")
    .select("id, actor_id, module, entity_type, entity_id, action, created_at, profiles(full_name)")
    .eq("org_id", orgId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;

  return (data as unknown as Array<{
    id: string;
    actor_id: string | null;
    module: string;
    entity_type: string;
    entity_id: string | null;
    action: string;
    created_at: string;
    profiles: { full_name: string | null } | null;
  }>).map((row) => ({
    id: row.id,
    actor_id: row.actor_id,
    actorName: row.profiles?.full_name ?? null,
    module: row.module,
    entity_type: row.entity_type,
    entity_id: row.entity_id,
    action: row.action,
    created_at: row.created_at,
  }));
}
