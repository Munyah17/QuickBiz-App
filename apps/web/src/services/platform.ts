import type { TypedSupabaseClient as SupabaseClient } from "@quickbiz/supabase/types";

// Every function here takes the SERVICE-ROLE client on purpose — platform
// staff have no org_members row in any tenant, so the ordinary RLS-scoped
// client would see nothing. Authorization happens before these are ever
// called, via requirePlatformStaff()/requirePlatformPermission() in
// lib/platform-session.ts — never rely on RLS for this data.

export interface TenantSummary {
  id: string;
  name: string;
  currency: string;
  createdAt: string;
  memberCount: number;
  branchCount: number;
  enabledModuleCount: number;
  monthlyTotalUsd: number;
  setupFeePaid: boolean;
  billingStatus: string;
}

export async function listAllTenants(service: SupabaseClient): Promise<TenantSummary[]> {
  const { data: orgs, error } = await service
    .from("organizations")
    .select(
      "id, name, currency, created_at, billing_status, setup_fee_paid, org_members(count), branches(count), org_modules(status, module_catalog(monthly_price_usd))"
    )
    .order("created_at", { ascending: false });

  if (error) throw error;

  return (
    orgs as unknown as Array<{
      id: string;
      name: string;
      currency: string;
      created_at: string;
      billing_status: string;
      setup_fee_paid: boolean;
      org_members: Array<{ count: number }>;
      branches: Array<{ count: number }>;
      org_modules: Array<{ status: string; module_catalog: { monthly_price_usd: number } | null }>;
    }>
  ).map((org) => {
    const enabled = org.org_modules.filter((m) => m.status === "enabled");
    return {
      id: org.id,
      name: org.name,
      currency: org.currency,
      createdAt: org.created_at,
      memberCount: org.org_members[0]?.count ?? 0,
      branchCount: org.branches[0]?.count ?? 0,
      enabledModuleCount: enabled.length,
      monthlyTotalUsd: enabled.reduce((sum, m) => sum + (m.module_catalog?.monthly_price_usd ?? 0), 0),
      setupFeePaid: org.setup_fee_paid,
      billingStatus: org.billing_status,
    };
  });
}

export async function getPlatformStats(service: SupabaseClient) {
  const [{ count: tenantCount }, { count: activeCount }, { count: pendingCount }, { count: staffCount }] =
    await Promise.all([
      service.from("organizations").select("id", { count: "exact", head: true }),
      service.from("organizations").select("id", { count: "exact", head: true }).eq("billing_status", "active"),
      service.from("organizations").select("id", { count: "exact", head: true }).eq("billing_status", "pending"),
      service.from("platform_staff").select("id", { count: "exact", head: true }).eq("status", "active"),
    ]);

  return {
    tenantCount: tenantCount ?? 0,
    activeSubscriptions: activeCount ?? 0,
    pendingSubscriptions: pendingCount ?? 0,
    staffCount: staffCount ?? 0,
  };
}

export async function updateTenantBillingStatus(
  service: SupabaseClient,
  orgId: string,
  billingStatus: "active" | "pending" | "past_due" | "cancelled"
) {
  const { error } = await service.from("organizations").update({ billing_status: billingStatus }).eq("id", orgId);
  if (error) throw error;
}

export async function markSetupFeePaid(service: SupabaseClient, orgId: string, paid: boolean) {
  const { error } = await service.from("organizations").update({ setup_fee_paid: paid }).eq("id", orgId);
  if (error) throw error;
}

export interface PlatformStaffRow {
  id: string;
  userId: string;
  fullName: string | null;
  email: string | null;
  roleKey: string;
  roleName: string;
  status: "active" | "suspended";
  createdAt: string;
}

export async function listPlatformStaff(service: SupabaseClient): Promise<PlatformStaffRow[]> {
  const { data, error } = await service
    .from("platform_staff")
    .select("id, user_id, role_key, status, created_at, profiles(full_name), platform_roles(name)")
    .order("created_at", { ascending: true });

  if (error) throw error;

  const rows = data as unknown as Array<{
    id: string;
    user_id: string;
    role_key: string;
    status: PlatformStaffRow["status"];
    created_at: string;
    profiles: { full_name: string | null } | null;
    platform_roles: { name: string } | null;
  }>;

  const emailByUserId = new Map<string, string>();
  await Promise.all(
    rows.map(async (row) => {
      const { data: userResult } = await service.auth.admin.getUserById(row.user_id);
      if (userResult.user?.email) emailByUserId.set(row.user_id, userResult.user.email);
    })
  );

  return rows.map((row) => ({
    id: row.id,
    userId: row.user_id,
    fullName: row.profiles?.full_name ?? null,
    email: emailByUserId.get(row.user_id) ?? null,
    roleKey: row.role_key,
    roleName: row.platform_roles?.name ?? row.role_key,
    status: row.status,
    createdAt: row.created_at,
  }));
}

export async function listPlatformRoles(service: SupabaseClient) {
  const { data, error } = await service.from("platform_roles").select("key, name, description").order("key");
  if (error) throw error;
  return data as Array<{ key: string; name: string; description: string }>;
}

export async function invitePlatformStaff(service: SupabaseClient, email: string, roleKey: string) {
  const { data: invited, error: inviteError } = await service.auth.admin.inviteUserByEmail(email);
  if (inviteError || !invited.user) throw new Error(inviteError?.message ?? "Could not send invite.");

  const { error } = await service
    .from("platform_staff")
    .insert({ user_id: invited.user.id, role_key: roleKey, status: "active" });
  if (error) throw error;
}

export async function updatePlatformStaffStatus(
  service: SupabaseClient,
  staffId: string,
  status: "active" | "suspended"
) {
  const { error } = await service.from("platform_staff").update({ status }).eq("id", staffId);
  if (error) throw error;
}
