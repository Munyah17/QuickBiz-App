"use client";

import { useMemo, useState, useTransition } from "react";
import { ShoppingBag } from "lucide-react";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { Badge } from "@/components/Badge";
import { EmptyState } from "@/components/EmptyState";
import { SearchInput } from "@/components/SearchInput";
import { Select } from "@/components/Input";
import { ExportButton } from "@/components/ExportButton";
import { useToast } from "@/components/Toast";
import { OrderStatusControls } from "./OrderStatusControls";
import { bulkSetOnlineOrderStatusAction } from "./actions";
import type { OnlineOrderRow } from "@/services/ecommerce";

const statusTone: Record<string, "success" | "info" | "warning" | "danger" | "neutral"> = {
  pending: "neutral",
  confirmed: "info",
  fulfilled: "success",
  cancelled: "danger",
};

const deliveryStatusTone: Record<string, "success" | "info" | "neutral"> = {
  not_shipped: "neutral",
  shipped: "info",
  delivered: "success",
};

export function OrdersTable({ orders, canManage }: { orders: OnlineOrderRow[]; canManage: boolean }) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [deliveryFilter, setDeliveryFilter] = useState("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [isBulkPending, startBulkTransition] = useTransition();
  const { push } = useToast();

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return orders.filter((o) => {
      if (statusFilter !== "all" && o.status !== statusFilter) return false;
      if (deliveryFilter !== "all" && o.delivery_status !== deliveryFilter) return false;
      if (!q) return true;
      return [o.order_number, o.buyerName, o.buyerContact, o.delivery_address].some((field) =>
        field?.toLowerCase().includes(q)
      );
    });
  }, [orders, query, statusFilter, deliveryFilter]);

  const totalRevenue = filtered.reduce((sum, o) => sum + o.total, 0);
  const allFilteredSelected = filtered.length > 0 && filtered.every((o) => selected.has(o.id));

  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    setSelected(allFilteredSelected ? new Set() : new Set(filtered.map((o) => o.id)));
  }

  function runBulk(status: string) {
    const ids = Array.from(selected);
    startBulkTransition(async () => {
      const result = await bulkSetOnlineOrderStatusAction(ids, status);
      if (result.success) {
        push(`${ids.length} order${ids.length === 1 ? "" : "s"} updated`);
        setSelected(new Set());
      } else if (result.error) {
        push(result.error, "error");
      }
    });
  }

  return (
    <Card>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border-subtle px-4 py-3">
        <h3 className="text-sm font-semibold text-text-primary">
          {filtered.length} of {orders.length} orders
        </h3>
        <div className="flex flex-1 items-center justify-end gap-2">
          <SearchInput value={query} onChange={setQuery} placeholder="Search order #, buyer, address..." />
          <Select value={deliveryFilter} onChange={(e) => setDeliveryFilter(e.target.value)} className="w-36">
            <option value="all">All fulfillment</option>
            <option value="not_shipped">Not shipped</option>
            <option value="shipped">Shipped</option>
            <option value="delivered">Delivered</option>
          </Select>
          <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-36">
            <option value="all">All statuses</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="fulfilled">Fulfilled</option>
            <option value="cancelled">Cancelled</option>
          </Select>
          <ExportButton
            filename="online-orders"
            rows={filtered.map((o) => ({
              "Order #": o.order_number,
              Buyer: o.buyerName,
              Contact: o.buyerContact ?? "",
              "Delivery method": o.delivery_method,
              "Fulfillment status": o.delivery_status,
              "Delivery address": o.delivery_address ?? "",
              Subtotal: o.subtotal,
              "Delivery/tax": o.total - o.subtotal,
              Total: o.total,
              Status: o.status,
              Created: o.created_at,
            }))}
          />
        </div>
      </div>

      {canManage && selected.size > 0 && (
        <div className="flex items-center gap-3 border-b border-border-subtle bg-primary-50 px-4 py-2.5">
          <span className="text-sm font-medium text-text-primary">{selected.size} selected</span>
          <Button size="sm" variant="secondary" loading={isBulkPending} onClick={() => runBulk("confirmed")}>
            Mark Confirmed
          </Button>
          <Button size="sm" variant="secondary" loading={isBulkPending} onClick={() => runBulk("fulfilled")}>
            Mark Fulfilled
          </Button>
          <Button size="sm" variant="secondary" loading={isBulkPending} onClick={() => runBulk("cancelled")}>
            Cancel
          </Button>
          <button type="button" onClick={() => setSelected(new Set())} className="ml-auto text-sm text-text-tertiary hover:text-text-primary">
            Clear selection
          </button>
        </div>
      )}

      {orders.length === 0 ? (
        <EmptyState icon={ShoppingBag} title="No online orders yet" />
      ) : filtered.length === 0 ? (
        <EmptyState icon={ShoppingBag} title="No orders match your search" />
      ) : (
        <>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border-subtle text-left text-xs font-medium uppercase tracking-wide text-text-tertiary">
                {canManage && (
                  <th className="w-10 px-4 py-2.5">
                    <input type="checkbox" checked={allFilteredSelected} onChange={toggleAll} className="size-4 rounded border-border" />
                  </th>
                )}
                <th className="px-4 py-2.5">Order #</th>
                <th className="px-4 py-2.5">Buyer</th>
                <th className="px-4 py-2.5">Fulfillment</th>
                <th className="px-4 py-2.5">Subtotal</th>
                <th className="px-4 py-2.5">Delivery/tax</th>
                <th className="px-4 py-2.5">Total</th>
                <th className="px-4 py-2.5">Created</th>
                <th className="px-4 py-2.5">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((o) => (
                <tr key={o.id} className="border-b border-border-subtle last:border-b-0">
                  {canManage && (
                    <td className="px-4 py-2.5">
                      <input
                        type="checkbox"
                        checked={selected.has(o.id)}
                        onChange={() => toggleOne(o.id)}
                        className="size-4 rounded border-border"
                      />
                    </td>
                  )}
                  <td className="px-4 py-2.5 font-mono font-medium text-text-primary">{o.order_number}</td>
                  <td className="px-4 py-2.5 text-text-secondary">
                    <p className="text-text-primary">{o.buyerName}</p>
                    {o.buyerContact && <p className="text-xs text-text-tertiary">{o.buyerContact}</p>}
                  </td>
                  <td className="px-4 py-2.5">
                    <span className="capitalize text-text-secondary">{o.delivery_method}</span>
                    {!canManage && (
                      <>
                        {" "}
                        <Badge tone={deliveryStatusTone[o.delivery_status] ?? "neutral"}>
                          {o.delivery_status.replace("_", " ")}
                        </Badge>
                      </>
                    )}
                    {o.delivery_address && (
                      <p className="max-w-xs truncate text-xs text-text-tertiary">{o.delivery_address}</p>
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-text-secondary">${o.subtotal.toFixed(2)}</td>
                  <td className="px-4 py-2.5 text-text-secondary">${(o.total - o.subtotal).toFixed(2)}</td>
                  <td className="px-4 py-2.5 font-medium text-text-primary">${o.total.toFixed(2)}</td>
                  <td className="px-4 py-2.5 text-text-secondary">{new Date(o.created_at).toLocaleDateString()}</td>
                  <td className="px-4 py-2.5">
                    {canManage ? (
                      <OrderStatusControls orderId={o.id} status={o.status} deliveryStatus={o.delivery_status} />
                    ) : (
                      <Badge tone={statusTone[o.status] ?? "neutral"}>{o.status}</Badge>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="flex justify-end border-t border-border-subtle p-4 text-sm font-semibold text-text-primary">
            Total revenue: ${totalRevenue.toFixed(2)}
          </div>
        </>
      )}
    </Card>
  );
}
