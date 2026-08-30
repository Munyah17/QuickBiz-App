import Link from "next/link";
import { Settings2, Users } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/Button";
import { requireOrgContext, requireModuleEnabled } from "@/lib/session";
import { listPayrollRuns, listEmployeesWithCompensation } from "@/services/payroll";
import { listBranches } from "@/services/branches";
import { NewPayrollRunModal } from "./NewPayrollRunModal";
import { PayrollRunsTable } from "./PayrollRunsTable";

export default async function PayrollPage() {
  const { supabase, orgId, permissions } = await requireOrgContext();
  await requireModuleEnabled(supabase, orgId, "payroll");
  const canManage = permissions.has("payroll.manage");

  const [runs, employees, branches] = await Promise.all([
    listPayrollRuns(supabase, orgId),
    canManage ? listEmployeesWithCompensation(supabase, orgId) : Promise.resolve([]),
    listBranches(supabase, orgId),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <PageHeader module="Payroll" title="Payroll Runs" />
        {canManage && (
          <div className="flex items-center gap-2">
            <Link href="/payroll/setup">
              <Button variant="secondary">
                <Users className="size-4" />
                Salary Setup
              </Button>
            </Link>
            <Link href="/payroll/settings">
              <Button variant="secondary">
                <Settings2 className="size-4" />
                Tax Settings
              </Button>
            </Link>
            <NewPayrollRunModal branches={branches.map((b) => ({ id: b.id, name: b.name }))} employees={employees} />
          </div>
        )}
      </div>

      <p className="text-sm text-text-tertiary">
        PAYE, NSSA, and AIDS Levy are calculated from the rates you configure in Tax Settings - QuickBiz does not ship
        with statutory rates pre-filled. Confirm current figures with ZIMRA or your tax advisor before relying on them.
      </p>

      <PayrollRunsTable runs={runs} />
    </div>
  );
}
