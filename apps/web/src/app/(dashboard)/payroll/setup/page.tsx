import { redirect } from "next/navigation";
import { PageHeader } from "@/components/PageHeader";
import { requireOrgContext, requireModuleEnabled } from "@/lib/session";
import { listEmployeesWithCompensation, listAllEmployeeSalaryComponents, listSalaryComponents } from "@/services/payroll";
import { SalarySetupTable } from "./SalarySetupTable";

export default async function SalarySetupPage() {
  const { supabase, orgId, permissions } = await requireOrgContext();
  await requireModuleEnabled(supabase, orgId, "hr");
  if (!permissions.has("payroll.manage")) redirect("/payroll");

  const [employees, assignmentsByEmployee, components] = await Promise.all([
    listEmployeesWithCompensation(supabase, orgId),
    listAllEmployeeSalaryComponents(supabase, orgId),
    listSalaryComponents(supabase, orgId),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader module="Payroll" title="Salary Setup" />
      <p className="text-sm text-text-tertiary">
        Set each employee&apos;s basic salary and assign recurring allowances or deductions. This feeds directly into
        the next payroll run - employees with no basic salary set will generate a $0 payslip.
      </p>
      <SalarySetupTable
        employees={employees}
        assignmentsByEmployee={Object.fromEntries(assignmentsByEmployee)}
        components={components}
      />
    </div>
  );
}
