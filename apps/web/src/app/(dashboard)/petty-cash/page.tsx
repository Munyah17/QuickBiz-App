import { PageHeader } from "@/components/PageHeader";
import { requireOrgContext, requireModuleEnabled, requirePermission } from "@/lib/session";
import { listPettyCashFloats, listPettyCashTransactions } from "@/services/pettyCash";
import { listProjects } from "@/services/projects";
import { listEmployees } from "@/services/hr";
import { FloatsTable } from "./FloatsTable";
import { TransactionsTable } from "./TransactionsTable";

export default async function PettyCashPage() {
  const { supabase, orgId, permissions } = await requireOrgContext();
  await requireModuleEnabled(supabase, orgId, "projects");
  requirePermission(permissions, "projects.petty_cash");

  const [floats, transactions, projects, employees] = await Promise.all([
    listPettyCashFloats(supabase, orgId),
    listPettyCashTransactions(supabase, orgId),
    listProjects(supabase, orgId),
    listEmployees(supabase, orgId),
  ]);

  const projectOptions = projects.map((p) => ({ id: p.id, name: p.name }));
  const employeeOptions = employees.map((e) => ({ id: e.id, fullName: e.full_name }));

  return (
    <div className="flex flex-col gap-6">
      <PageHeader module="Operations" title="Petty Cash" />

      <p className="text-sm text-text-tertiary">
        Issue project petty cash floats to a custodian and track every disbursement, replenishment, and reimbursement
        against the fund&apos;s remaining balance. These records are visible only to holders of the project petty cash
        permission.
      </p>

      <FloatsTable floats={floats} projects={projectOptions} employees={employeeOptions} />
      <TransactionsTable transactions={transactions} />
    </div>
  );
}
