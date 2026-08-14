import type { TypedSupabaseClient as SupabaseClient } from "@quickbiz/supabase/types";

export interface OrgMember {
  id: string;
  user_id: string;
  status: "active" | "invited" | "suspended";
  created_at: string;
  fullName: string | null;
  branchName: string | null;
  roleNames: string[];
  roleId: string | null;
}

export async function listMembers(supabase: SupabaseClient, orgId: string): Promise<OrgMember[]> {
  const { data, error } = await supabase
    .from("org_members")
    .select(
      "id, user_id, status, created_at, profiles(full_name), branches(name), user_roles(role_id, roles(name, display_name))"
    )
    .eq("org_id", orgId)
    .order("created_at", { ascending: true });

  if (error) throw error;

  return (data as unknown as Array<{
    id: string;
    user_id: string;
    status: OrgMember["status"];
    created_at: string;
    profiles: { full_name: string | null } | null;
    branches: { name: string } | null;
    user_roles: Array<{ role_id: string; roles: { name: string; display_name: string | null } | null }>;
  }>).map((row) => ({
    id: row.id,
    user_id: row.user_id,
    status: row.status,
    created_at: row.created_at,
    fullName: row.profiles?.full_name ?? null,
    branchName: row.branches?.name ?? null,
    roleNames: row.user_roles
      .map((ur) => ur.roles?.display_name || ur.roles?.name)
      .filter((n): n is string => !!n),
    roleId: row.user_roles[0]?.role_id ?? null,
  }));
}

export async function assignRole(supabase: SupabaseClient, orgMemberId: string, roleId: string) {
  // Foundation keeps one role per member: replace rather than accumulate.
  const { error: deleteError } = await supabase.from("user_roles").delete().eq("org_member_id", orgMemberId);
  if (deleteError) throw deleteError;

  const { error } = await supabase.from("user_roles").insert({ org_member_id: orgMemberId, role_id: roleId });
  if (error) throw error;
}
