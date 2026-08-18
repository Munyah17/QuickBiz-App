import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/Card";
import { EmptyState } from "@/components/EmptyState";
import { Receipt } from "lucide-react";
import { requireOrgContext, requireModuleEnabled } from "@/lib/session";
import { listExpenses, listAccounts } from "@/services/finance";
import { NewExpenseModal } from "./NewExpenseModal";

export default async function ExpensesPage() {
  const { supabase, orgId, permissions } = await requireOrgContext();
  await requireModuleEnabled(supabase, orgId, "finance");
  const canManage = permissions.has("finance.manage");

  const { data: member } = await supabase.from("org_members").select("branch_id").eq("status", "active").limit(1).maybeSingle();

  const [expenses, accounts] = await Promise.all([listExpenses(supabase, orgId), listAccounts(supabase, orgId)]);
  const total = expenses.reduce((sum, e) => sum + e.amount, 0);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <PageHeader title="Expenses" />
        {canManage && <NewExpenseModal accounts={accounts} branchId={(member?.branch_id as string) ?? ""} />}
      </div>

      <Card>
        {expenses.length === 0 ? (
          <EmptyState icon={Receipt} title="No expenses recorded yet" />
        ) : (
          <>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border-subtle text-left text-xs font-medium uppercase tracking-wide text-text-tertiary">
                  <th className="px-4 py-2.5">Date</th>
                  <th className="px-4 py-2.5">Description</th>
                  <th className="px-4 py-2.5">Account</th>
                  <th className="px-4 py-2.5">Method</th>
                  <th className="px-4 py-2.5">Reference</th>
                  <th className="px-4 py-2.5">Amount</th>
                </tr>
              </thead>
              <tbody>
                {expenses.map((e) => (
                  <tr key={e.id} className="border-b border-border-subtle last:border-b-0">
                    <td className="px-4 py-2.5 text-text-secondary">{new Date(e.expense_date).toLocaleDateString()}</td>
                    <td className="px-4 py-2.5 text-text-primary">{e.description}</td>
                    <td className="px-4 py-2.5 text-text-secondary">{e.accountName ?? "Uncategorized"}</td>
                    <td className="px-4 py-2.5 capitalize text-text-secondary">{e.payment_method.replace("_", " ")}</td>
                    <td className="px-4 py-2.5 text-text-secondary">{e.reference || "No reference"}</td>
                    <td className="px-4 py-2.5 text-text-secondary">${e.amount.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="flex justify-end border-t border-border-subtle p-4 text-sm font-semibold text-text-primary">
              Total: ${total.toFixed(2)}
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
