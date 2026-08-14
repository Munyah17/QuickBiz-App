"use server";

import { revalidatePath } from "next/cache";
import { requireOrgContext } from "@/lib/session";
import { createRole, renameRole, updateRolePermissions, deleteRole } from "@/services/roles";

export interface RoleActionState {
  error: string | null;
  success: boolean;
}

export const initialRoleActionState: RoleActionState = { error: null, success: false };

function permissionIdsFromForm(formData: FormData): string[] {
  return formData.getAll("permissionIds").map(String);
}

export async function createRoleAction(_prev: RoleActionState, formData: FormData): Promise<RoleActionState> {
  const { supabase, orgId, permissions } = await requireOrgContext();

  if (!permissions.has("roles.manage")) {
    return { error: "You don't have permission to create roles.", success: false };
  }

  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "Role name is required.", success: false };

  try {
    await createRole(supabase, orgId, name, permissionIdsFromForm(formData));
  } catch (err) {
    return { error: (err as Error).message, success: false };
  }

  revalidatePath("/roles");
  return { error: null, success: true };
}

export async function updateRoleAction(_prev: RoleActionState, formData: FormData): Promise<RoleActionState> {
  const { supabase, permissions } = await requireOrgContext();

  if (!permissions.has("roles.manage")) {
    return { error: "You don't have permission to edit roles.", success: false };
  }

  const roleId = String(formData.get("roleId") ?? "");
  const displayName = String(formData.get("displayName") ?? "").trim();
  const isSystem = formData.get("isSystem") === "true";

  try {
    await renameRole(supabase, roleId, displayName || null);
    // System role permission sets define the grade — never editable here.
    if (!isSystem) {
      await updateRolePermissions(supabase, roleId, permissionIdsFromForm(formData));
    }
  } catch (err) {
    return { error: (err as Error).message, success: false };
  }

  revalidatePath("/roles");
  return { error: null, success: true };
}

export async function deleteRoleAction(_prev: RoleActionState, formData: FormData): Promise<RoleActionState> {
  const { supabase, permissions } = await requireOrgContext();

  if (!permissions.has("roles.manage")) {
    return { error: "You don't have permission to delete roles.", success: false };
  }

  const roleId = String(formData.get("roleId") ?? "");

  try {
    await deleteRole(supabase, roleId);
  } catch (err) {
    return { error: (err as Error).message, success: false };
  }

  revalidatePath("/roles");
  return { error: null, success: true };
}
