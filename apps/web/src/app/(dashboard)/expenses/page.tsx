import { PageHeader } from "@/components/PageHeader";
import { requireOrgContext, requireModuleEnabled } from "@/lib/session";
import { listExpenses, listAccounts } from "@/services/finance";
import { NewExpenseModal } from "./NewExpenseModal";
import { ExpensesTable } from "./ExpensesTable";

export default async function ExpensesPage() {
  const { supabase, orgId, permissions } = await requireOrgContext();
  await requireModuleEnabled(supabase, orgId, "finance");
  const canManage = permissions.has("finance.manage");

  const { data: member } = await supabase.from("org_members").select("branch_id").eq("status", "active").limit(1).maybeSingle();

  const [expenses, accounts] = await Promise.all([listExpenses(supabase, orgId), listAccounts(supabase, orgId)]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <PageHeader title="Expenses" />
        {canManage && <NewExpenseModal accounts={accounts} branchId={(member?.branch_id as string) ?? ""} />}
      </div>

      <ExpensesTable expenses={expenses} />
    </div>
  );
}
