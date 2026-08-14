import type { TypedSupabaseClient as SupabaseClient } from "@quickbiz/supabase/types";

export interface DashboardStats {
  memberCount: number;
  membersAddedLast30Days: number;
  branchCount: number;
  branchesAddedLast30Days: number;
  enabledModuleCount: number;
}

export async function getDashboardStats(supabase: SupabaseClient, orgId: string): Promise<DashboardStats> {
  const since = new Date();
  since.setDate(since.getDate() - 30);
  const sinceIso = since.toISOString();

  const [members, recentMembers, branches, recentBranches, enabledModules] = await Promise.all([
    supabase.from("org_members").select("id", { count: "exact", head: true }).eq("org_id", orgId).eq("status", "active"),
    supabase
      .from("org_members")
      .select("id", { count: "exact", head: true })
      .eq("org_id", orgId)
      .eq("status", "active")
      .gte("created_at", sinceIso),
    supabase.from("branches").select("id", { count: "exact", head: true }).eq("org_id", orgId).eq("is_active", true),
    supabase
      .from("branches")
      .select("id", { count: "exact", head: true })
      .eq("org_id", orgId)
      .eq("is_active", true)
      .gte("created_at", sinceIso),
    supabase
      .from("org_modules")
      .select("id", { count: "exact", head: true })
      .eq("org_id", orgId)
      .eq("status", "enabled"),
  ]);

  return {
    memberCount: members.count ?? 0,
    membersAddedLast30Days: recentMembers.count ?? 0,
    branchCount: branches.count ?? 0,
    branchesAddedLast30Days: recentBranches.count ?? 0,
    enabledModuleCount: enabledModules.count ?? 0,
  };
}
