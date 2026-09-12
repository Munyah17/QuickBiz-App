import { PageHeader } from "@/components/PageHeader";
import { StatCard } from "@/components/StatCard";
import { Card, CardHeader } from "@/components/Card";
import { BreakdownBarChart } from "@/components/BreakdownBarChart";
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

  const totalEmployees = employees.length;
  const activeEmployees = employees.filter((e) => e.employment_status === "active").length;
  const onLeave = employees.filter((e) => e.employment_status === "on_leave").length;
  const departmentsCount = departments.length;

  const departmentBreakdown = employees.reduce((acc, e) => {
    const dept = e.departmentName ?? "Unassigned";
    acc[dept] = (acc[dept] ?? 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const departmentSegments = Object.entries(departmentBreakdown)
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader module="HR" title="Employees" />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total employees" value={totalEmployees.toString()} tone="primary" />
        <StatCard label="Active" value={activeEmployees.toString()} tone="success" />
        <StatCard label="On leave" value={onLeave.toString()} tone="warning" />
        <StatCard label="Departments" value={departmentsCount.toString()} tone="info" />
      </div>

      {departmentSegments.length > 0 && (
        <Card>
          <CardHeader title="Headcount by department" />
          <div className="p-4">
            <BreakdownBarChart segments={departmentSegments} />
          </div>
        </Card>
      )}

      <EmployeesTable
        employees={employees}
        branches={branches.map((b) => ({ id: b.id, name: b.name }))}
        departments={departments}
        canManage={permissions.has("hr.manage")}
      />
    </div>
  );
}
