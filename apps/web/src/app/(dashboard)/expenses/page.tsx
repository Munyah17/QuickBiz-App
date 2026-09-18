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
  const canApprove = permissions.has("expenses.approve");

  const { data: member } = await supabase.from("org_members").select("branch_id").eq("status", "active").limit(1).maybeSingle();

  const [expenses, accounts] = await Promise.all([listExpenses(supabase, orgId), listAccounts(supabase, orgId)]);

  const approvedExpenses = expenses.filter((e) => e.status === "approved" || e.status === "paid");
  const pendingApproval = expenses.filter((e) => e.status === "submitted");
  const pendingApprovalTotal = pendingApproval.reduce((sum, e) => sum + e.amount, 0);
  const totalExpenses = approvedExpenses.reduce((sum, exp) => sum + exp.amount, 0);
  const now = new Date();
  const thisMonthExpenses = approvedExpenses
    .filter((exp) => {
      const expDate = new Date(exp.expense_date);
      return expDate.getMonth() === now.getMonth() && expDate.getFullYear() === now.getFullYear();
    })
    .reduce((sum, exp) => sum + exp.amount, 0);
  const averageExpense = approvedExpenses.length > 0 ? totalExpenses / approvedExpenses.length : 0;

  const accountBreakdown = approvedExpenses.reduce((acc, exp) => {
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
        <StatCard
          label="Awaiting approval"
          value={pendingApproval.length.toString()}
          delta={pendingApprovalTotal > 0 ? { label: `$${pendingApprovalTotal.toFixed(2)} pending`, direction: "flat" } : undefined}
          tone={pendingApproval.length > 0 ? "info" : "success"}
        />
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

      <ExpensesTable expenses={expenses} canApprove={canApprove} canManage={canManage} />
    </div>
  );
}
