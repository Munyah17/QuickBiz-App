"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Receipt } from "lucide-react";
import { Card } from "@/components/Card";
import { Badge } from "@/components/Badge";
import { EmptyState } from "@/components/EmptyState";
import { SearchInput } from "@/components/SearchInput";
import { Select } from "@/components/Input";
import { ExportButton } from "@/components/ExportButton";
import type { InvoiceListRow } from "@/services/sales";

const statusTone: Record<string, "success" | "info" | "warning" | "danger" | "neutral"> = {
  draft: "neutral",
  issued: "info",
  paid: "success",
  cancelled: "danger",
};

export function SalesTable({ invoices }: { invoices: InvoiceListRow[] }) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return invoices.filter((inv) => {
      if (statusFilter !== "all" && inv.status !== statusFilter) return false;
      if (!q) return true;
      return [inv.invoice_number, inv.customerName].some((field) => field?.toLowerCase().includes(q));
    });
  }, [invoices, query, statusFilter]);

  return (
    <Card>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border-subtle px-4 py-3">
        <h3 className="text-sm font-semibold text-text-primary">
          {filtered.length} of {invoices.length} invoices
        </h3>
        <div className="flex items-center gap-2">
          <SearchInput value={query} onChange={setQuery} placeholder="Search invoice #, customer..." />
          <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-32">
            <option value="all">All statuses</option>
            <option value="draft">Draft</option>
            <option value="issued">Issued</option>
            <option value="paid">Paid</option>
            <option value="cancelled">Cancelled</option>
          </Select>
          <ExportButton
            filename="sales-invoices"
            rows={filtered.map((inv) => ({
              Invoice: inv.invoice_number,
              Customer: inv.customerName ?? "Walk-in",
              Status: inv.status,
              Total: inv.total,
              Paid: inv.amount_paid,
              Date: new Date(inv.created_at).toISOString().slice(0, 10),
            }))}
          />
        </div>
      </div>

      {invoices.length === 0 ? (
        <EmptyState icon={Receipt} title="No invoices yet" description="Create your first sales invoice to get started." />
      ) : filtered.length === 0 ? (
        <EmptyState icon={Receipt} title="No invoices match your search" />
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border-subtle text-left text-xs font-medium uppercase tracking-wide text-text-tertiary">
              <th className="px-4 py-2.5">Invoice</th>
              <th className="px-4 py-2.5">Customer</th>
              <th className="px-4 py-2.5">Status</th>
              <th className="px-4 py-2.5">Total</th>
              <th className="px-4 py-2.5">Paid</th>
              <th className="px-4 py-2.5">Date</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((inv) => (
              <tr key={inv.id} className="border-b border-border-subtle last:border-b-0">
                <td className="px-4 py-2.5">
                  <Link href={`/sales/${inv.id}`} className="font-medium text-primary-600 hover:underline">
                    {inv.invoice_number}
                  </Link>
                </td>
                <td className="px-4 py-2.5 text-text-secondary">{inv.customerName ?? "Walk-in"}</td>
                <td className="px-4 py-2.5">
                  <Badge tone={statusTone[inv.status] ?? "neutral"}>{inv.status}</Badge>
                </td>
                <td className="px-4 py-2.5 text-text-secondary">${inv.total.toFixed(2)}</td>
                <td className="px-4 py-2.5 text-text-secondary">${inv.amount_paid.toFixed(2)}</td>
                <td className="px-4 py-2.5 text-text-secondary">{new Date(inv.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Card>
  );
}
