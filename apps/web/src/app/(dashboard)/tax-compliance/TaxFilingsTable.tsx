"use client";

import { useState } from "react";
import { Receipt } from "lucide-react";
import { Card } from "@/components/Card";
import { Badge } from "@/components/Badge";
import { Button } from "@/components/Button";
import { EmptyState } from "@/components/EmptyState";
import { MarkFiledModal } from "./MarkFiledModal";
import type { TaxFilingRow } from "@/services/taxCompliance";

const STATUS_TONE: Record<TaxFilingRow["status"], "neutral" | "success" | "warning" | "danger"> = {
  draft: "neutral",
  submitted: "warning",
  accepted: "success",
  paid: "success",
  rejected: "danger",
};

function isOverdue(filing: TaxFilingRow) {
  return filing.status === "draft" && new Date(filing.dueDate) < new Date();
}

export function TaxFilingsTable({ filings, canFile }: { filings: TaxFilingRow[]; canFile: boolean }) {
  const [markFiling, setMarkFiling] = useState<TaxFilingRow | null>(null);

  return (
    <Card>
      {filings.length === 0 ? (
        <EmptyState icon={Receipt} title="No tax filings yet" description="Create a filing to start tracking a tax obligation." />
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border-subtle text-left text-xs font-medium uppercase tracking-wide text-text-tertiary">
              <th className="px-4 py-2.5">Tax Type</th>
              <th className="px-4 py-2.5">Period</th>
              <th className="px-4 py-2.5">Due Date</th>
              <th className="px-4 py-2.5">Amount</th>
              <th className="px-4 py-2.5">Status</th>
              {canFile && <th className="px-4 py-2.5" />}
            </tr>
          </thead>
          <tbody>
            {filings.map((f) => {
              const overdue = isOverdue(f);
              return (
                <tr key={f.id} className="border-b border-border-subtle last:border-b-0">
                  <td className="px-4 py-2.5 font-medium text-text-primary">{f.taxTypeName}</td>
                  <td className="px-4 py-2.5 text-text-secondary">
                    {f.year} / {f.period}
                  </td>
                  <td className={`px-4 py-2.5 ${overdue ? "font-medium text-danger-600" : "text-text-secondary"}`}>
                    {f.dueDate ? new Date(f.dueDate).toLocaleDateString() : "-"}
                  </td>
                  <td className="px-4 py-2.5 text-text-secondary">
                    {f.currency} {f.amount.toFixed(2)}
                  </td>
                  <td className="px-4 py-2.5">
                    <Badge tone={overdue ? "danger" : STATUS_TONE[f.status]}>{overdue ? "overdue" : f.status}</Badge>
                  </td>
                  {canFile && (
                    <td className="px-4 py-2.5">
                      {f.status === "draft" && (
                        <Button variant="secondary" size="sm" onClick={() => setMarkFiling(f)}>
                          Mark as Filed
                        </Button>
                      )}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      {markFiling && <MarkFiledModal filing={markFiling} onClose={() => setMarkFiling(null)} />}
    </Card>
  );
}
