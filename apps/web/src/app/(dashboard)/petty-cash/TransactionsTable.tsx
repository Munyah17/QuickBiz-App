"use client";

import { Receipt } from "lucide-react";
import { Card, CardHeader } from "@/components/Card";
import { Badge } from "@/components/Badge";
import { EmptyState } from "@/components/EmptyState";
import type { PettyCashTransactionRow } from "@/services/pettyCash";

const TYPE_TONE: Record<PettyCashTransactionRow["transactionType"], "neutral" | "success" | "warning" | "danger" | "info"> = {
  disbursement: "warning",
  replenish: "success",
  reimbursement: "success",
  adjustment: "info",
};

export function TransactionsTable({ transactions }: { transactions: PettyCashTransactionRow[] }) {
  return (
    <Card>
      <CardHeader title="Petty Cash Transactions" />
      {transactions.length === 0 ? (
        <EmptyState icon={Receipt} title="No transactions yet" description="Disbursements, replenishments, and reimbursements recorded against a float will show here." />
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border-subtle text-left text-xs font-medium uppercase tracking-wide text-text-tertiary">
              <th className="px-4 py-2.5">Date</th>
              <th className="px-4 py-2.5">Fund</th>
              <th className="px-4 py-2.5">Type</th>
              <th className="px-4 py-2.5">Amount</th>
              <th className="px-4 py-2.5">Description</th>
              <th className="px-4 py-2.5">Category</th>
              <th className="px-4 py-2.5">Recipient</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((t) => (
              <tr key={t.id} className="border-b border-border-subtle last:border-b-0">
                <td className="px-4 py-2.5 text-text-secondary">{new Date(t.transactionDate).toLocaleDateString()}</td>
                <td className="px-4 py-2.5 text-text-secondary">{t.fundName}</td>
                <td className="px-4 py-2.5">
                  <Badge tone={TYPE_TONE[t.transactionType]}>{t.transactionType}</Badge>
                </td>
                <td className="px-4 py-2.5 font-medium text-text-primary">{t.amount.toFixed(2)}</td>
                <td className="px-4 py-2.5 text-text-secondary">{t.description}</td>
                <td className="px-4 py-2.5 text-text-secondary">{t.category ?? "-"}</td>
                <td className="px-4 py-2.5 text-text-secondary">{t.recipientName ?? "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Card>
  );
}
