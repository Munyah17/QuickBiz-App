import { Star } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardHeader } from "@/components/Card";
import { Badge } from "@/components/Badge";
import { EmptyState } from "@/components/EmptyState";
import { requireOrgContext, requireModuleEnabled } from "@/lib/session";
import { listLoyaltyBalances, listLoyaltyTransactions } from "@/services/marketing";
import { RecordTransactionModal } from "./RecordTransactionModal";

const typeTone: Record<string, "success" | "warning" | "neutral"> = {
  earn: "success",
  redeem: "warning",
  adjustment: "neutral",
};

export default async function LoyaltyPage() {
  const { supabase, orgId, permissions } = await requireOrgContext();
  await requireModuleEnabled(supabase, orgId, "marketing");
  const canManage = permissions.has("marketing.manage");

  const [balances, transactions] = await Promise.all([
    listLoyaltyBalances(supabase, orgId),
    listLoyaltyTransactions(supabase, orgId),
  ]);

  const customersWithBalance = balances.filter((b) => b.balance !== 0);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <PageHeader module="Marketing" title="Loyalty" />
        {canManage && <RecordTransactionModal customers={balances.map((b) => ({ customerId: b.customerId, customerName: b.customerName }))} />}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="Customer balances" />
          {customersWithBalance.length === 0 ? (
            <EmptyState icon={Star} title="No loyalty points yet" description="Record earn or redeem transactions to start building balances." />
          ) : (
            <ul className="flex flex-col divide-y divide-border-subtle px-4">
              {customersWithBalance.map((b) => (
                <li key={b.customerId} className="flex items-center justify-between py-2.5 text-sm">
                  <span className="text-text-primary">{b.customerName}</span>
                  <span className="font-semibold text-text-primary">{b.balance.toLocaleString()} pts</span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <CardHeader title="Recent transactions" />
          {transactions.length === 0 ? (
            <EmptyState icon={Star} title="No transactions yet" />
          ) : (
            <ul className="flex flex-col divide-y divide-border-subtle px-4">
              {transactions.map((t) => (
                <li key={t.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                  <div className="min-w-0">
                    <p className="truncate text-text-primary">{t.customerName}</p>
                    <p className="truncate text-xs text-text-tertiary">{t.reason ?? "No reason given"}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <Badge tone={typeTone[t.type] ?? "neutral"}>{t.type}</Badge>
                    <span className={`text-sm font-medium ${t.points < 0 ? "text-danger-600" : "text-success-600"}`}>
                      {t.points > 0 ? "+" : ""}
                      {t.points}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
