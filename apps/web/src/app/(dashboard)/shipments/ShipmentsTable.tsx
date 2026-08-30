"use client";

import { useMemo, useState, useTransition } from "react";
import { Truck } from "lucide-react";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { Badge } from "@/components/Badge";
import { EmptyState } from "@/components/EmptyState";
import { SearchInput } from "@/components/SearchInput";
import { Select } from "@/components/Input";
import { ExportButton } from "@/components/ExportButton";
import { useToast } from "@/components/Toast";
import { StatusSelect } from "./StatusSelect";
import { bulkSetShipmentStatusAction } from "./actions";
import type { ShipmentRow } from "@/services/logistics";

const statusTone: Record<string, "success" | "info" | "warning" | "danger" | "neutral"> = {
  pending: "neutral",
  dispatched: "info",
  in_transit: "info",
  delivered: "success",
  failed: "danger",
  returned: "danger",
};

export function ShipmentsTable({ shipments, canManage }: { shipments: ShipmentRow[]; canManage: boolean }) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [isBulkPending, startBulkTransition] = useTransition();
  const { push } = useToast();

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return shipments.filter((s) => {
      if (statusFilter !== "all" && s.status !== statusFilter) return false;
      if (!q) return true;
      return [
        s.shipment_number,
        s.customerName,
        s.carrier,
        s.vehicleRegistration,
        s.tracking_number,
        s.invoiceNumber,
        s.onlineOrderNumber,
        s.delivery_address,
      ].some((field) => field?.toLowerCase().includes(q));
    });
  }, [shipments, query, statusFilter]);

  const allFilteredSelected = filtered.length > 0 && filtered.every((s) => selected.has(s.id));

  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    setSelected(allFilteredSelected ? new Set() : new Set(filtered.map((s) => s.id)));
  }

  function runBulk(status: string) {
    const ids = Array.from(selected);
    startBulkTransition(async () => {
      const result = await bulkSetShipmentStatusAction(ids, status);
      if (result.success) {
        push(`${ids.length} shipment${ids.length === 1 ? "" : "s"} updated`);
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
          {filtered.length} of {shipments.length} shipments
        </h3>
        <div className="flex flex-1 items-center justify-end gap-2">
          <SearchInput value={query} onChange={setQuery} placeholder="Search shipment #, customer, tracking..." />
          <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-36">
            <option value="all">All statuses</option>
            <option value="pending">Pending</option>
            <option value="dispatched">Dispatched</option>
            <option value="in_transit">In transit</option>
            <option value="delivered">Delivered</option>
            <option value="failed">Failed</option>
            <option value="returned">Returned</option>
          </Select>
          <ExportButton
            filename="shipments"
            rows={filtered.map((s) => ({
              "Shipment #": s.shipment_number,
              Customer: s.customerName ?? "",
              Carrier: s.carrier ?? "",
              Vehicle: s.vehicleRegistration ?? "",
              Driver: s.driverName ?? "",
              Tracking: s.tracking_number ?? "",
              Reference: s.invoiceNumber ?? s.onlineOrderNumber ?? "",
              "Delivery address": s.delivery_address ?? "",
              Dispatched: s.dispatched_at ?? "",
              Delivered: s.delivered_at ?? "",
              Status: s.status,
            }))}
          />
        </div>
      </div>

      {canManage && selected.size > 0 && (
        <div className="flex items-center gap-3 border-b border-border-subtle bg-primary-50 px-4 py-2.5">
          <span className="text-sm font-medium text-text-primary">{selected.size} selected</span>
          <Button size="sm" variant="secondary" loading={isBulkPending} onClick={() => runBulk("dispatched")}>
            Mark Dispatched
          </Button>
          <Button size="sm" variant="secondary" loading={isBulkPending} onClick={() => runBulk("in_transit")}>
            Mark In Transit
          </Button>
          <Button size="sm" variant="secondary" loading={isBulkPending} onClick={() => runBulk("delivered")}>
            Mark Delivered
          </Button>
          <button type="button" onClick={() => setSelected(new Set())} className="ml-auto text-sm text-text-tertiary hover:text-text-primary">
            Clear selection
          </button>
        </div>
      )}

      {shipments.length === 0 ? (
        <EmptyState icon={Truck} title="No shipments yet" />
      ) : filtered.length === 0 ? (
        <EmptyState icon={Truck} title="No shipments match your search" />
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border-subtle text-left text-xs font-medium uppercase tracking-wide text-text-tertiary">
              {canManage && (
                <th className="w-10 px-4 py-2.5">
                  <input type="checkbox" checked={allFilteredSelected} onChange={toggleAll} className="size-4 rounded border-border" />
                </th>
              )}
              <th className="px-4 py-2.5">Shipment #</th>
              <th className="px-4 py-2.5">Customer</th>
              <th className="px-4 py-2.5">Carrier / Vehicle</th>
              <th className="px-4 py-2.5">Reference</th>
              <th className="px-4 py-2.5">Delivery address</th>
              <th className="px-4 py-2.5">Dispatched</th>
              <th className="px-4 py-2.5">Delivered</th>
              <th className="px-4 py-2.5">Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((s) => (
              <tr key={s.id} className="border-b border-border-subtle last:border-b-0">
                {canManage && (
                  <td className="px-4 py-2.5">
                    <input
                      type="checkbox"
                      checked={selected.has(s.id)}
                      onChange={() => toggleOne(s.id)}
                      className="size-4 rounded border-border"
                    />
                  </td>
                )}
                <td className="px-4 py-2.5 font-mono font-medium text-text-primary">{s.shipment_number}</td>
                <td className="px-4 py-2.5 text-text-secondary">{s.customerName ?? "Not specified"}</td>
                <td className="px-4 py-2.5 text-text-secondary">
                  {s.carrier ?? (s.vehicleRegistration ? `Own: ${s.vehicleRegistration}` : "Not assigned")}
                  {s.driverName && <span className="block text-xs text-text-tertiary">{s.driverName}</span>}
                </td>
                <td className="px-4 py-2.5 text-text-secondary">
                  {s.invoiceNumber ?? s.onlineOrderNumber ?? "Not linked"}
                  {s.tracking_number && <span className="block text-xs text-text-tertiary">Tracking: {s.tracking_number}</span>}
                </td>
                <td className="max-w-xs truncate px-4 py-2.5 text-text-secondary">{s.delivery_address ?? "Not specified"}</td>
                <td className="px-4 py-2.5 text-text-secondary">{s.dispatched_at ? new Date(s.dispatched_at).toLocaleDateString() : "Not yet"}</td>
                <td className="px-4 py-2.5 text-text-secondary">{s.delivered_at ? new Date(s.delivered_at).toLocaleDateString() : "Not yet"}</td>
                <td className="px-4 py-2.5">
                  {canManage ? (
                    <StatusSelect shipmentId={s.id} status={s.status} />
                  ) : (
                    <Badge tone={statusTone[s.status] ?? "neutral"}>{s.status.replace("_", " ")}</Badge>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Card>
  );
}
