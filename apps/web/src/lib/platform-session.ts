import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "@quickbiz/supabase/client-server";

// Deliberately separate from lib/session.ts's requireOrgContext(): platform
// staff are never tenant org members, and this must never be satisfiable by
// tenant-side permissions. See migration 000018 for the full rationale.
export async function requirePlatformStaff() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data } = await supabase.rpc("get_platform_staff_context");
  const context = data?.[0] as { role_key: string; permission_keys: string[] } | undefined;

  if (!context) redirect("/login");

  return {
    user,
    roleKey: context.role_key,
    permissions: new Set(context.permission_keys ?? []),
  };
}

export function requirePlatformPermission(permissions: Set<string>, key: string) {
  if (!permissions.has(key)) {
    redirect("/backoffice?denied=" + encodeURIComponent(key));
  }
}
