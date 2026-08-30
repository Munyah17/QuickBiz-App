import { PageHeader } from "@/components/PageHeader";
import { requireOrgContext, requireModuleEnabled } from "@/lib/session";
import { listLoyaltyBalances, listLoyaltyTransactions } from "@/services/marketing";
import { RecordTransactionModal } from "./RecordTransactionModal";
import { LoyaltyPanels } from "./LoyaltyPanels";

export default async function LoyaltyPage() {
  const { supabase, orgId, permissions } = await requireOrgContext();
  await requireModuleEnabled(supabase, orgId, "marketing");
  const canManage = permissions.has("marketing.manage");

  const [balances, transactions] = await Promise.all([
    listLoyaltyBalances(supabase, orgId),
    listLoyaltyTransactions(supabase, orgId),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <PageHeader module="Marketing" title="Loyalty" />
        {canManage && <RecordTransactionModal customers={balances.map((b) => ({ customerId: b.customerId, customerName: b.customerName }))} />}
      </div>

      <LoyaltyPanels balances={balances} transactions={transactions} />
    </div>
  );
}
