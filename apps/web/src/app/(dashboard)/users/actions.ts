"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@quickbiz/supabase/client-server";
import { createServiceRoleClient } from "@quickbiz/supabase/client-service-role";
import { requireOrgContext } from "@/lib/session";
import { assignRole } from "@/services/members";

export interface UsersActionState {
  error: string | null;
  success: boolean;
}

export const initialUsersActionState: UsersActionState = { error: null, success: false };

export async function inviteMemberAction(_prev: UsersActionState, formData: FormData): Promise<UsersActionState> {
  const { orgId, permissions } = await requireOrgContext();

  if (!permissions.has("users.manage")) {
    return { error: "You don't have permission to invite users.", success: false };
  }

  const email = String(formData.get("email") ?? "").trim();
  const roleKey = String(formData.get("roleKey") ?? "staff");

  if (!email) return { error: "Email is required.", success: false };

  // Admin invite requires the service-role key (Supabase Auth admin API) —
  // isolated to this one server action, never used for ordinary data access.
  const admin = createServiceRoleClient();
  const { data: invited, error: inviteError } = await admin.auth.admin.inviteUserByEmail(email);

  if (inviteError || !invited.user) {
    return { error: inviteError?.message ?? "Could not send invite.", success: false };
  }

  // Membership + role assignment run under the inviting admin's own session
  // (not the service-role client) so has_permission() is enforced in Postgres.
  const supabase = await createClient();
  const { error: rpcError } = await supabase.rpc("invite_org_member", {
    p_org_id: orgId,
    p_user_id: invited.user.id,
    p_role_key: roleKey,
  });

  if (rpcError) {
    return { error: rpcError.message, success: false };
  }

  revalidatePath("/users");
  return { error: null, success: true };
}

export async function assignRoleAction(_prev: UsersActionState, formData: FormData): Promise<UsersActionState> {
  const { supabase, permissions } = await requireOrgContext();

  if (!permissions.has("users.manage")) {
    return { error: "You don't have permission to change roles.", success: false };
  }

  const orgMemberId = String(formData.get("orgMemberId") ?? "");
  const roleId = String(formData.get("roleId") ?? "");

  try {
    await assignRole(supabase, orgMemberId, roleId);
  } catch (err) {
    return { error: (err as Error).message, success: false };
  }

  revalidatePath("/users");
  return { error: null, success: true };
}
