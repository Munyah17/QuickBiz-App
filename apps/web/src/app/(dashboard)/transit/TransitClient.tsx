"use client";

import { useMemo, useState } from "react";
import { Navigation, PackageSearch, Truck, AlertTriangle } from "lucide-react";
import { Card } from "@/components/Card";
import { Badge } from "@/components/Badge";
import { EmptyState } from "@/components/EmptyState";
import { SearchInput } from "@/components/SearchInput";
import { Select } from "@/components/Input";
import { ExportButton } from "@/components/ExportButton";
import { StatusSelect } from "../shipments/StatusSelect";
import type { ShipmentRow } from "@/services/logistics";

const stageTone: Record<string, "info" | "warning" | "neutral"> = {
  pending: "neutral",
  dispatched: "info",
  in_transit: "info",
};

export function TransitClient({ shipments, canManage }: { shipments: ShipmentRow[]; canManage: boolean }) {
  const [query, setQuery] = useState("");
  const [stageFilter, setStageFilter] = useState("all");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return shipments.filter((s) => {
      if (stageFilter !== "all" && s.status !== stageFilter) return false;
      if (!q) return true;
      return [s.shipment_number, s.customerName, s.tracking_number, s.route_description, s.delivery_address].some((f) => f?.toLowerCase().includes(q));
    });
  }, [shipments, query, stageFilter]);

  const stats = useMemo(() => ({
    pending: shipments.filter((s) => s.status === "pending").length,
    dispatched: shipments.filter((s) => s.status === "dispatched").length,
    inTransit: shipments.filter((s) => s.status === "in_transit").length,
    overdue: shipments.filter((s) => s.eta && new Date(s.eta).getTime() < Date.now()).length,
  }), [shipments]);

  return (
    <>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat icon={PackageSearch} label="Pending" value={String(stats.pending)} sub="awaiting dispatch" />
        <Stat icon={Truck} label="Dispatched" value={String(stats.dispatched)} sub="on the road" />
        <Stat icon={Navigation} label="In transit" value={String(stats.inTransit)} sub="en route" />
        <Stat icon={AlertTriangle} label="Past ETA" value={String(stats.overdue)} sub="may need attention" />
      </div>

      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border-subtle px-4 py-3">
          <h3 className="text-sm font-semibold text-text-primary">{filtered.length} of {shipments.length} in transit</h3>
          <div className="flex flex-1 items-center justify-end gap-2">
            <SearchInput value={query} onChange={setQuery} placeholder="Search shipment #, route, customer..." />
            <Select value={stageFilter} onChange={(e) => setStageFilter(e.target.value)} className="w-36">
              <option value="all">All stages</option>
              <option value="pending">Pending</option>
              <option value="dispatched">Dispatched</option>
              <option value="in_transit">In transit</option>
            </Select>
            <ExportButton
              filename="transit"
              rows={filtered.map((s) => ({
                "Shipment #": s.shipment_number,
                Customer: s.customerName ?? "",
                Route: s.route_description ?? s.origin_address ?? "",
                "Deliver to": s.delivery_address ?? "",
                Priority: s.priority,
                ETA: s.eta ?? "",
                Status: s.status,
              }))}
            />
          </div>
        </div>

        {filtered.length === 0 ? (
          <EmptyState icon={Navigation} title="Nothing in transit" description="Shipments awaiting dispatch or en route appear here until delivered." />
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border-subtle text-left text-xs font-medium uppercase tracking-wide text-text-tertiary">
                <th className="px-4 py-2.5">Shipment #</th>
                <th className="px-4 py-2.5">Customer</th>
                <th className="px-4 py-2.5">Route → Destination</th>
                <th className="px-4 py-2.5">Priority</th>
                <th className="px-4 py-2.5">ETA</th>
                <th className="px-4 py-2.5">Stage</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => (
                <tr key={s.id} className="border-b border-border-subtle last:border-b-0">
                  <td className="px-4 py-2.5 font-mono font-medium text-text-primary">
                    {s.shipment_number}
                    {s.tracking_number && <span className="block text-xs font-normal text-text-tertiary">{s.tracking_number}</span>}
                  </td>
                  <td className="px-4 py-2.5 text-text-secondary">{s.customerName ?? "—"}</td>
                  <td className="max-w-xs px-4 py-2.5 text-text-secondary">
                    <span className="block truncate">{s.route_description ?? s.origin_address ?? "—"}</span>
                    <span className="block truncate text-xs text-text-tertiary">→ {s.delivery_address ?? "—"}</span>
                  </td>
                  <td className="px-4 py-2.5"><Badge tone={s.priority === "urgent" ? "danger" : s.priority === "high" ? "warning" : "neutral"}>{s.priority}</Badge></td>
                  <td className="px-4 py-2.5 text-text-secondary">
                    {s.eta ? new Date(s.eta).toLocaleDateString() : "—"}
                    {s.eta && new Date(s.eta).getTime() < Date.now() && <span className="block text-xs text-danger-600">overdue</span>}
                  </td>
                  <td className="px-4 py-2.5">
                    {canManage ? (
                      <StatusSelect shipmentId={s.id} status={s.status} />
                    ) : (
                      <Badge tone={stageTone[s.status] ?? "neutral"}>{s.status.replace("_", " ")}</Badge>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </>
  );
}

function Stat({ icon: Icon, label, value, sub }: { icon: typeof Navigation; label: string; value: string; sub: string }) {
  return (
    <Card className="px-4 py-3.5">
      <div className="flex items-center gap-2 text-text-tertiary"><Icon className="size-4" /><span className="text-xs font-medium uppercase tracking-wide">{label}</span></div>
      <p className="mt-1.5 text-xl font-semibold text-text-primary">{value}</p>
      <p className="text-xs text-text-tertiary">{sub}</p>
    </Card>
  );
}
