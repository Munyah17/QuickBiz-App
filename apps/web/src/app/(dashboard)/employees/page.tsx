import { PageHeader } from "@/components/PageHeader";
import { requireOrgContext, requireModuleEnabled } from "@/lib/session";
import { listEmployees, listDepartments } from "@/services/hr";
import { listBranches } from "@/services/branches";
import { EmployeesTable } from "./EmployeesTable";

export default async function EmployeesPage() {
  const { supabase, orgId, permissions } = await requireOrgContext();
  await requireModuleEnabled(supabase, orgId, "hr");

  const [employees, departments, branches] = await Promise.all([
    listEmployees(supabase, orgId),
    listDepartments(supabase, orgId),
    listBranches(supabase, orgId),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader module="HR" title="Employees" />
      <EmployeesTable
        employees={employees}
        branches={branches.map((b) => ({ id: b.id, name: b.name }))}
        departments={departments}
        canManage={permissions.has("hr.manage")}
      />
    </div>
  );
}
