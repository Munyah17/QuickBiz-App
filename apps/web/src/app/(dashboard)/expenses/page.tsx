import { PageHeader } from "@/components/PageHeader";
import { StatCard } from "@/components/StatCard";
import { Card, CardHeader } from "@/components/Card";
import { BreakdownBarChart } from "@/components/BreakdownBarChart";
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

  const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);
  const now = new Date();
  const thisMonthExpenses = expenses
    .filter((exp) => {
      const expDate = new Date(exp.expense_date);
      return expDate.getMonth() === now.getMonth() && expDate.getFullYear() === now.getFullYear();
    })
    .reduce((sum, exp) => sum + exp.amount, 0);
  const transactionCount = expenses.length;
  const averageExpense = transactionCount > 0 ? totalExpenses / transactionCount : 0;

  const accountBreakdown = expenses.reduce((acc, exp) => {
    const account = exp.accountName ?? "Uncategorized";
    acc[account] = (acc[account] ?? 0) + exp.amount;
    return acc;
  }, {} as Record<string, number>);

  const accountSegments = Object.entries(accountBreakdown)
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <PageHeader title="Expenses" />
        {canManage && <NewExpenseModal accounts={accounts} branchId={(member?.branch_id as string) ?? ""} />}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total expenses" value={`$${totalExpenses.toLocaleString()}`} tone="primary" />
        <StatCard label="This month" value={`$${thisMonthExpenses.toLocaleString()}`} tone="warning" />
        <StatCard label="Transactions" value={transactionCount.toString()} tone="info" />
        <StatCard label="Average expense" value={`$${averageExpense.toFixed(2)}`} tone="success" />
      </div>

      {accountSegments.length > 0 && (
        <Card>
          <CardHeader title="Top expense accounts" />
          <div className="p-4">
            <BreakdownBarChart segments={accountSegments} formatValue={(v) => `$${v.toLocaleString()}`} />
          </div>
        </Card>
      )}

      <ExpensesTable expenses={expenses} />
    </div>
  );
}
