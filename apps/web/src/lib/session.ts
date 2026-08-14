import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "@quickbiz/supabase/client-server";

export async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return { supabase, user };
}

// The active org is whichever org the user has an active membership in.
// Foundation supports one org per user; if that changes later (a user
// belonging to multiple tenants), this is the single place to add an
// org-switcher instead of every page re-deriving it.
export async function requireOrgContext() {
  const { supabase, user } = await requireUser();

  const { data: membership } = await supabase
    .from("org_members")
    .select(
      "id, org_id, branch_id, status, organizations(id, name, currency, legal_name, theme_color), branches(name), profiles(full_name), user_roles(roles(name, display_name))"
    )
    .eq("status", "active")
    .limit(1)
    .maybeSingle();

  if (!membership) {
    redirect("/onboarding");
  }

  const { data: permissions } = await supabase.rpc("get_user_permissions", {
    target_org_id: membership.org_id,
  });

  const roleNames = (
    membership.user_roles as unknown as Array<{ roles: { name: string; display_name: string | null } | null }>
  )
    .map((ur) => ur.roles?.display_name || ur.roles?.name)
    .filter((n): n is string => !!n);

  const profileFullName = (membership.profiles as unknown as { full_name: string | null } | null)?.full_name;

  return {
    supabase,
    user,
    orgId: membership.org_id as string,
    orgName: (membership.organizations as unknown as { name: string }).name,
    orgCurrency: (membership.organizations as unknown as { currency: string }).currency,
    themeColor: (membership.organizations as unknown as { theme_color: string | null }).theme_color,
    branchName: (membership.branches as unknown as { name: string } | null)?.name ?? "No branch",
    memberId: membership.id as string,
    // profiles.full_name over the JWT's cached user_metadata, since editing
    // your profile updates the DB immediately but the JWT only refreshes
    // on next token refresh/re-login.
    userName: profileFullName || user.email || "User",
    roleName: roleNames[0] ?? "Member",
    permissions: new Set((permissions ?? []) as string[]),
  };
}

export function hasPermission(permissions: Set<string>, key: string) {
  return permissions.has(key);
}

// RLS already blocks the underlying data for a user without this permission —
// this is a UX guard so a direct URL visit shows an honest "you don't have
// access" state instead of a misleadingly empty list.
export function requirePermission(permissions: Set<string>, key: string) {
  if (!permissions.has(key)) {
    redirect("/dashboard?denied=" + encodeURIComponent(key));
  }
}

// Unlike requirePermission, RLS does NOT enforce module activation (an org
// member's read/write access to e.g. products only depends on org
// membership + inventory.manage, not whether the org has actually enabled
// and is paying for the inventory module) — this is the real enforcement
// point for "you only get what you pay for", not just a UX nicety.
export async function requireModuleEnabled(
  supabase: Awaited<ReturnType<typeof createClient>>,
  orgId: string,
  moduleKey: string
) {
  const { data } = await supabase
    .from("org_modules")
    .select("status")
    .eq("org_id", orgId)
    .eq("module_key", moduleKey)
    .maybeSingle();

  if (data?.status !== "enabled") {
    redirect("/modules");
  }
}
