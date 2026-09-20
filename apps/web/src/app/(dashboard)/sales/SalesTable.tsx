"use client";

import { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Receipt } from "lucide-react";
import { Card } from "@/components/Card";
import { Badge } from "@/components/Badge";
import { EmptyState } from "@/components/EmptyState";
import { SearchInput } from "@/components/SearchInput";
import { Select } from "@/components/Input";
import { ExportButton } from "@/components/ExportButton";
import { isOverdue, type InvoiceListRow } from "@/services/sales";

const statusTone: Record<string, "success" | "info" | "warning" | "danger" | "neutral"> = {
  draft: "neutral",
  issued: "info",
  partially_paid: "warning",
  paid: "success",
  cancelled: "danger",
};

const statusLabel: Record<string, string> = {
  draft: "Draft",
  issued: "Issued",
  partially_paid: "Part paid",
  paid: "Paid",
  cancelled: "Cancelled",
};

function formatDue(dueDate: string | null): { text: string; overdue: boolean } {
  if (!dueDate) return { text: "No due date", overdue: false };
  const today = new Date().toISOString().slice(0, 10);
  const days = Math.floor((Date.parse(today) - Date.parse(dueDate)) / 86400000);
  if (days > 0) return { text: `${days}d overdue`, overdue: true };
  if (days === 0) return { text: "Due today", overdue: false };
  return { text: `Due ${new Date(dueDate).toLocaleDateString()}`, overdue: false };
}

export function SalesTable({ invoices }: { invoices: InvoiceListRow[] }) {
  const searchParams = useSearchParams();
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Stat-card drill-down links land here as ?status=... — keep the filter in
  // sync so the table reflects whichever card was clicked.
  useEffect(() => {
    const s = searchParams.get("status");
    if (s) setStatusFilter(s);
  }, [searchParams]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return invoices.filter((inv) => {
      if (statusFilter === "overdue") {
        if (!isOverdue(inv)) return false;
      } else if (statusFilter === "quote") {
        if (inv.doc_type !== "quote") return false;
      } else if (statusFilter === "invoice") {
        if (inv.doc_type !== "invoice") return false;
      } else if (statusFilter !== "all" && inv.status !== statusFilter) {
        return false;
      }
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
          <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-36">
            <option value="all">All statuses</option>
            <option value="invoice">Invoices only</option>
            <option value="quote">Quotations only</option>
            <option value="draft">Draft</option>
            <option value="issued">Issued</option>
            <option value="partially_paid">Part paid</option>
            <option value="paid">Paid</option>
            <option value="overdue">Overdue</option>
            <option value="cancelled">Cancelled</option>
          </Select>
          <ExportButton
            filename="sales-invoices"
            rows={filtered.map((inv) => ({
              Invoice: inv.invoice_number,
              Type: inv.doc_type === "quote" ? "Quotation" : "Invoice",
              Customer: inv.customerName ?? "Walk-in",
              Status: inv.status,
              Total: inv.total,
              Paid: inv.amount_paid,
              Balance: inv.total - inv.amount_paid,
              "Due date": inv.due_date ?? "",
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
              <th className="px-4 py-2.5">Due</th>
              <th className="px-4 py-2.5">Total</th>
              <th className="px-4 py-2.5">Balance</th>
              <th className="px-4 py-2.5">Date</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((inv) => {
              const due = formatDue(inv.due_date);
              const overdue = isOverdue(inv);
              const balance = inv.total - inv.amount_paid;
              return (
                <tr key={inv.id} className="border-b border-border-subtle last:border-b-0">
                  <td className="px-4 py-2.5">
                    <Link href={`/sales/${inv.id}`} className="font-medium text-primary-600 hover:underline">
                      {inv.invoice_number}
                    </Link>
                  </td>
                  <td className="px-4 py-2.5 text-text-secondary">{inv.customerName ?? "Walk-in"}</td>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-1.5">
                      {inv.doc_type === "quote" && <Badge tone="info">Quote</Badge>}
                      <Badge tone={overdue ? "danger" : (statusTone[inv.status] ?? "neutral")}>
                        {overdue ? "Overdue" : (statusLabel[inv.status] ?? inv.status)}
                      </Badge>
                    </div>
                  </td>
                  <td className={`px-4 py-2.5 ${overdue ? "font-medium text-danger-600" : "text-text-secondary"}`}>
                    {due.text}
                  </td>
                  <td className="px-4 py-2.5 text-text-secondary">${inv.total.toFixed(2)}</td>
                  <td className="px-4 py-2.5 text-text-secondary">${balance.toFixed(2)}</td>
                  <td className="px-4 py-2.5 text-text-secondary">{new Date(inv.created_at).toLocaleDateString()}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </Card>
  );
}
