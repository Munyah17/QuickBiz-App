import type { TypedSupabaseClient as SupabaseClient } from "@quickbiz/supabase/types";

export interface Permission {
  id: string;
  key: string;
  label: string;
  category: string;
}

export interface RoleWithPermissions {
  id: string;
  key: string;
  name: string;
  displayName: string | null;
  is_system: boolean;
  permissionIds: string[];
  permissionKeys: string[];
}

export async function listPermissions(supabase: SupabaseClient): Promise<Permission[]> {
  const { data, error } = await supabase.from("permissions").select("id, key, label, category").order("category");
  if (error) throw error;
  return data as Permission[];
}

export async function listRoles(supabase: SupabaseClient, orgId: string): Promise<RoleWithPermissions[]> {
  const { data, error } = await supabase
    .from("roles")
    .select("id, key, name, display_name, is_system, role_permissions(permission_id, permissions(key))")
    .eq("org_id", orgId)
    .order("is_system", { ascending: false })
    .order("name");

  if (error) throw error;

  return (data as unknown as Array<{
    id: string;
    key: string;
    name: string;
    display_name: string | null;
    is_system: boolean;
    role_permissions: Array<{ permission_id: string; permissions: { key: string } | null }>;
  }>).map((role) => ({
    id: role.id,
    key: role.key,
    name: role.name,
    displayName: role.display_name,
    is_system: role.is_system,
    permissionIds: role.role_permissions.map((rp) => rp.permission_id),
    permissionKeys: role.role_permissions.map((rp) => rp.permissions?.key).filter((k): k is string => !!k),
  }));
}

export async function listOrgRolesForAssignment(supabase: SupabaseClient, orgId: string) {
  const { data, error } = await supabase
    .from("roles")
    .select("id, key, name, display_name")
    .eq("org_id", orgId)
    .order("name");
  if (error) throw error;
  return (data as Array<{ id: string; key: string; name: string; display_name: string | null }>).map((r) => ({
    id: r.id,
    key: r.key,
    name: r.display_name || r.name,
  }));
}

function slugify(name: string) {
  return (
    name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "") || "role"
  );
}

export async function createRole(
  supabase: SupabaseClient,
  orgId: string,
  name: string,
  permissionIds: string[]
): Promise<string> {
  const { data: role, error } = await supabase
    .from("roles")
    .insert({ org_id: orgId, key: slugify(name), name, is_system: false })
    .select("id")
    .single();

  if (error) throw error;

  if (permissionIds.length > 0) {
    const { error: permError } = await supabase
      .from("role_permissions")
      .insert(permissionIds.map((permission_id) => ({ role_id: role.id, permission_id })));
    if (permError) throw permError;
  }

  return role.id as string;
}

export async function renameRole(supabase: SupabaseClient, roleId: string, displayName: string | null) {
  const { error } = await supabase.from("roles").update({ display_name: displayName }).eq("id", roleId);
  if (error) throw error;
}

// Custom (non-system) roles only — system role permission sets define the
// grade and are intentionally not editable from the UI.
export async function updateRolePermissions(supabase: SupabaseClient, roleId: string, permissionIds: string[]) {
  const { error: deleteError } = await supabase.from("role_permissions").delete().eq("role_id", roleId);
  if (deleteError) throw deleteError;

  if (permissionIds.length > 0) {
    const { error } = await supabase
      .from("role_permissions")
      .insert(permissionIds.map((permission_id) => ({ role_id: roleId, permission_id })));
    if (error) throw error;
  }
}

export async function deleteRole(supabase: SupabaseClient, roleId: string) {
  const { data: role, error: roleError } = await supabase
    .from("roles")
    .select("is_system")
    .eq("id", roleId)
    .single();
  if (roleError) throw roleError;
  if (role.is_system) throw new Error("System roles can't be deleted.");

  const { count, error: countError } = await supabase
    .from("user_roles")
    .select("role_id", { count: "exact", head: true })
    .eq("role_id", roleId);
  if (countError) throw countError;
  if (count && count > 0) {
    throw new Error(`Reassign the ${count} member(s) using this role before deleting it.`);
  }

  const { error } = await supabase.from("roles").delete().eq("id", roleId);
  if (error) throw error;
}
