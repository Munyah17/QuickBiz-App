import type { TypedSupabaseClient as SupabaseClient } from "@quickbiz/supabase/types";

export type CustomCodeType = "css" | "html";

export interface CustomCodeEntry {
  codeType: CustomCodeType;
  content: string;
  version: number;
  updatedAt: string;
}

export async function getCustomCode(supabase: SupabaseClient, orgId: string): Promise<CustomCodeEntry[]> {
  const { data, error } = await supabase.from("custom_code").select("code_type, content, version, updated_at").eq("org_id", orgId);
  if (error) throw error;
  return (data ?? []).map((row) => ({
    codeType: row.code_type as CustomCodeType,
    content: row.content,
    version: row.version,
    updatedAt: row.updated_at,
  }));
}

// Used by the dashboard shell to inject the org's active custom CSS —
// no auth ceremony needed beyond normal RLS (select policy allows any org
// member to read), just the raw active content for one type.
export async function getActiveCustomCode(supabase: SupabaseClient, orgId: string, codeType: CustomCodeType): Promise<string | null> {
  const { data, error } = await supabase.from("custom_code").select("content").eq("org_id", orgId).eq("code_type", codeType).maybeSingle();
  if (error) throw error;
  return data?.content ?? null;
}

export interface CustomCodeVersion {
  version: number;
  content: string;
  createdAt: string;
  createdByName: string | null;
}

export async function listCustomCodeVersions(supabase: SupabaseClient, orgId: string, codeType: CustomCodeType): Promise<CustomCodeVersion[]> {
  const { data, error } = await supabase
    .from("custom_code_versions")
    .select("version, content, created_at, profiles(full_name)")
    .eq("org_id", orgId)
    .eq("code_type", codeType)
    .order("version", { ascending: false });
  if (error) throw error;

  return (data as unknown as Array<{ version: number; content: string; created_at: string; profiles: { full_name: string | null } | null }>).map(
    (row) => ({
      version: row.version,
      content: row.content,
      createdAt: row.created_at,
      createdByName: row.profiles?.full_name ?? null,
    })
  );
}

export async function saveCustomCode(supabase: SupabaseClient, orgId: string, codeType: CustomCodeType, content: string): Promise<number> {
  const { data, error } = await supabase.rpc("save_custom_code", { p_org_id: orgId, p_code_type: codeType, p_content: content });
  if (error) throw error;
  return data as number;
}

export async function rollbackCustomCode(supabase: SupabaseClient, orgId: string, codeType: CustomCodeType, targetVersion: number): Promise<number> {
  const { data, error } = await supabase.rpc("rollback_custom_code", { p_org_id: orgId, p_code_type: codeType, p_target_version: targetVersion });
  if (error) throw error;
  return data as number;
}
