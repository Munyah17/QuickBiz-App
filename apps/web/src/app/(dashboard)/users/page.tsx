import { PageHeader } from "@/components/PageHeader";
import { requireOrgContext } from "@/lib/session";
import { listMembers } from "@/services/members";
import { listOrgRolesForAssignment } from "@/services/roles";
import { UsersTable } from "./UsersTable";

export default async function UsersPage() {
  const { supabase, orgId, permissions } = await requireOrgContext();
  const [members, roles] = await Promise.all([
    listMembers(supabase, orgId),
    listOrgRolesForAssignment(supabase, orgId),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader module="Company" title="Users" />
      <UsersTable members={members} roles={roles} canManage={permissions.has("users.manage")} />
    </div>
  );
}
