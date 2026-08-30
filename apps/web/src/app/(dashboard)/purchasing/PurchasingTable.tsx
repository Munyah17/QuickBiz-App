"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ClipboardList } from "lucide-react";
import { Card } from "@/components/Card";
import { Badge } from "@/components/Badge";
import { EmptyState } from "@/components/EmptyState";
import { SearchInput } from "@/components/SearchInput";
import { Select } from "@/components/Input";
import type { PurchaseOrderListRow } from "@/services/purchasing";

const statusTone: Record<string, "success" | "info" | "warning" | "danger" | "neutral"> = {
  draft: "neutral",
  issued: "info",
  received: "success",
  cancelled: "danger",
};

export function PurchasingTable({ orders }: { orders: PurchaseOrderListRow[] }) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return orders.filter((po) => {
      if (statusFilter !== "all" && po.status !== statusFilter) return false;
      if (!q) return true;
      return [po.po_number, po.supplierName].some((field) => field?.toLowerCase().includes(q));
    });
  }, [orders, query, statusFilter]);

  return (
    <Card>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border-subtle px-4 py-3">
        <h3 className="text-sm font-semibold text-text-primary">
          {filtered.length} of {orders.length} purchase orders
        </h3>
        <div className="flex items-center gap-2">
          <SearchInput value={query} onChange={setQuery} placeholder="Search PO #, supplier..." />
          <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-32">
            <option value="all">All statuses</option>
            <option value="draft">Draft</option>
            <option value="issued">Issued</option>
            <option value="received">Received</option>
            <option value="cancelled">Cancelled</option>
          </Select>
        </div>
      </div>

      {orders.length === 0 ? (
        <EmptyState icon={ClipboardList} title="No purchase orders yet" description="Create your first purchase order to get started." />
      ) : filtered.length === 0 ? (
        <EmptyState icon={ClipboardList} title="No purchase orders match your search" />
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border-subtle text-left text-xs font-medium uppercase tracking-wide text-text-tertiary">
              <th className="px-4 py-2.5">PO</th>
              <th className="px-4 py-2.5">Supplier</th>
              <th className="px-4 py-2.5">Status</th>
              <th className="px-4 py-2.5">Total</th>
              <th className="px-4 py-2.5">Paid</th>
              <th className="px-4 py-2.5">Date</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((po) => (
              <tr key={po.id} className="border-b border-border-subtle last:border-b-0">
                <td className="px-4 py-2.5">
                  <Link href={`/purchasing/${po.id}`} className="font-medium text-primary-600 hover:underline">
                    {po.po_number}
                  </Link>
                </td>
                <td className="px-4 py-2.5 text-text-secondary">{po.supplierName ?? "No supplier"}</td>
                <td className="px-4 py-2.5">
                  <Badge tone={statusTone[po.status] ?? "neutral"}>{po.status}</Badge>
                </td>
                <td className="px-4 py-2.5 text-text-secondary">${po.total.toFixed(2)}</td>
                <td className="px-4 py-2.5 text-text-secondary">${po.amount_paid.toFixed(2)}</td>
                <td className="px-4 py-2.5 text-text-secondary">{new Date(po.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Card>
  );
}
