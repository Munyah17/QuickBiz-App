import { PageHeader } from "@/components/PageHeader";
import { requireOrgContext } from "@/lib/session";
import { listRoles, listPermissions } from "@/services/roles";
import { RolesTable } from "./RolesTable";

export default async function RolesPage() {
  const { supabase, orgId, permissions: userPermissions } = await requireOrgContext();
  const [roles, permissions] = await Promise.all([listRoles(supabase, orgId), listPermissions(supabase)]);
  const canManage = userPermissions.has("roles.manage");

  return (
    <div className="flex flex-col gap-6">
      <PageHeader module="Company" title="Roles" />

      <RolesTable roles={roles} permissions={permissions} canManage={canManage} />

      <p className="text-sm text-text-tertiary">
        Owner through General are fixed permission grades so access stays predictable. Rename any role&apos;s
        label to match your industry (for example, Team Leader to Foreman), or create a custom role with
        exactly the permissions you want.
      </p>
    </div>
  );
}
