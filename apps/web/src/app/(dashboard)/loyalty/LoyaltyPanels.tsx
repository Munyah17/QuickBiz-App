"use client";

import { useMemo, useState } from "react";
import { Star } from "lucide-react";
import { Card } from "@/components/Card";
import { Badge } from "@/components/Badge";
import { EmptyState } from "@/components/EmptyState";
import { SearchInput } from "@/components/SearchInput";
import { Select } from "@/components/Input";
import { ExportButton } from "@/components/ExportButton";
import type { LoyaltyBalance, LoyaltyTransactionRow } from "@/services/marketing";

const typeTone: Record<string, "success" | "warning" | "neutral"> = {
  earn: "success",
  redeem: "warning",
  adjustment: "neutral",
};

export function LoyaltyPanels({ balances, transactions }: { balances: LoyaltyBalance[]; transactions: LoyaltyTransactionRow[] }) {
  const [balanceQuery, setBalanceQuery] = useState("");
  const [txQuery, setTxQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");

  const customersWithBalance = useMemo(() => balances.filter((b) => b.balance !== 0), [balances]);

  const filteredBalances = useMemo(() => {
    const q = balanceQuery.trim().toLowerCase();
    if (!q) return customersWithBalance;
    return customersWithBalance.filter((b) => b.customerName.toLowerCase().includes(q));
  }, [customersWithBalance, balanceQuery]);

  const filteredTransactions = useMemo(() => {
    const q = txQuery.trim().toLowerCase();
    return transactions.filter((t) => {
      if (typeFilter !== "all" && t.type !== typeFilter) return false;
      if (!q) return true;
      return [t.customerName, t.reason].some((field) => field?.toLowerCase().includes(q));
    });
  }, [transactions, txQuery, typeFilter]);

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <Card>
        <div className="flex items-center justify-between gap-3 border-b border-border-subtle px-4 py-3">
          <h3 className="text-sm font-semibold text-text-primary">Customer balances ({filteredBalances.length})</h3>
          <SearchInput value={balanceQuery} onChange={setBalanceQuery} placeholder="Search customer..." />
        </div>
        {filteredBalances.length === 0 ? (
          <EmptyState icon={Star} title="No loyalty points yet" description="Record earn or redeem transactions to start building balances." />
        ) : (
          <ul className="flex flex-col divide-y divide-border-subtle px-4">
            {filteredBalances.map((b) => (
              <li key={b.customerId} className="flex items-center justify-between py-2.5 text-sm">
                <span className="text-text-primary">{b.customerName}</span>
                <span className="font-semibold text-text-primary">{b.balance.toLocaleString()} pts</span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border-subtle px-4 py-3">
          <h3 className="text-sm font-semibold text-text-primary">Transactions ({filteredTransactions.length})</h3>
          <div className="flex items-center gap-2">
            <SearchInput value={txQuery} onChange={setTxQuery} placeholder="Search customer, reason..." />
            <Select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="w-32">
              <option value="all">All types</option>
              <option value="earn">Earn</option>
              <option value="redeem">Redeem</option>
              <option value="adjustment">Adjustment</option>
            </Select>
            <ExportButton
              filename="loyalty-transactions"
              rows={filteredTransactions.map((t) => ({
                Customer: t.customerName,
                Type: t.type,
                Points: t.points,
                Reason: t.reason ?? "",
                Date: t.created_at,
              }))}
            />
          </div>
        </div>
        {filteredTransactions.length === 0 ? (
          <EmptyState icon={Star} title="No transactions match" />
        ) : (
          <ul className="flex flex-col divide-y divide-border-subtle px-4">
            {filteredTransactions.map((t) => (
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
  );
}
