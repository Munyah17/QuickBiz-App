"use client";

import { useMemo, useState } from "react";
import { MapPinned, Truck, Navigation, Clock } from "lucide-react";
import { Card } from "@/components/Card";
import { Badge } from "@/components/Badge";
import { EmptyState } from "@/components/EmptyState";
import { SearchInput } from "@/components/SearchInput";
import { ExportButton } from "@/components/ExportButton";
import { TrackingTimelineModal } from "../shipments/TrackingTimelineModal";
import type { ShipmentRow, ShipmentEvent } from "@/services/logistics";

const statusTone: Record<string, "info" | "neutral"> = { dispatched: "info", in_transit: "info" };

export function TrackingClient({
  shipments,
  eventsByShipment,
  canManage,
}: {
  shipments: ShipmentRow[];
  eventsByShipment: Record<string, ShipmentEvent[]>;
  canManage: boolean;
}) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return shipments.filter((s) =>
      !q || [s.shipment_number, s.customerName, s.tracking_number, s.carrier, s.vehicleRegistration, s.delivery_address].some((f) => f?.toLowerCase().includes(q))
    );
  }, [shipments, query]);

  const stats = useMemo(() => ({
    inTransit: shipments.filter((s) => s.status === "in_transit").length,
    dispatched: shipments.filter((s) => s.status === "dispatched").length,
    withTracking: shipments.filter((s) => s.tracking_number).length,
    etaSoon: shipments.filter((s) => s.eta && new Date(s.eta).getTime() - Date.now() < 24 * 3600 * 1000).length,
  }), [shipments]);

  return (
    <>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat icon={Navigation} label="In transit" value={String(stats.inTransit)} sub="moving now" />
        <Stat icon={Truck} label="Dispatched" value={String(stats.dispatched)} sub="left origin" />
        <Stat icon={MapPinned} label="With tracking #" value={String(stats.withTracking)} sub="carrier reference" />
        <Stat icon={Clock} label="Arriving <24h" value={String(stats.etaSoon)} sub="ETA within a day" />
      </div>

      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border-subtle px-4 py-3">
          <h3 className="text-sm font-semibold text-text-primary">{filtered.length} active shipment{filtered.length === 1 ? "" : "s"}</h3>
          <div className="flex flex-1 items-center justify-end gap-2">
            <SearchInput value={query} onChange={setQuery} placeholder="Search tracking #, customer, location..." />
            <ExportButton
              filename="live-tracking"
              rows={filtered.map((s) => ({
                "Shipment #": s.shipment_number,
                Customer: s.customerName ?? "",
                "Tracking #": s.tracking_number ?? "",
                Carrier: s.carrier ?? s.vehicleRegistration ?? "",
                Destination: s.delivery_address ?? "",
                ETA: s.eta ?? "",
                Status: s.status,
              }))}
            />
          </div>
        </div>

        {filtered.length === 0 ? (
          <EmptyState icon={MapPinned} title="Nothing being tracked" description="Dispatched and in-transit shipments appear here with their live event timeline." />
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border-subtle text-left text-xs font-medium uppercase tracking-wide text-text-tertiary">
                <th className="px-4 py-2.5">Shipment #</th>
                <th className="px-4 py-2.5">Customer</th>
                <th className="px-4 py-2.5">Tracking / Carrier</th>
                <th className="px-4 py-2.5">Latest update</th>
                <th className="px-4 py-2.5">Destination → ETA</th>
                <th className="px-4 py-2.5">Status</th>
                <th className="px-4 py-2.5"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => {
                const events = eventsByShipment[s.id] ?? [];
                const latest = events[0];
                return (
                  <tr key={s.id} className="border-b border-border-subtle last:border-b-0">
                    <td className="px-4 py-2.5 font-mono font-medium text-text-primary">{s.shipment_number}</td>
                    <td className="px-4 py-2.5 text-text-secondary">{s.customerName ?? "—"}</td>
                    <td className="px-4 py-2.5 text-text-secondary">
                      {s.tracking_number ? <span className="font-mono text-xs">{s.tracking_number}</span> : "—"}
                      <span className="block text-xs text-text-tertiary">{s.carrier ?? s.vehicleRegistration ?? "Own fleet"}</span>
                    </td>
                    <td className="px-4 py-2.5 text-text-secondary">
                      {latest ? (
                        <>
                          <span className="capitalize">{latest.status.replace("_", " ")}</span>
                          <span className="block text-xs text-text-tertiary">
                            {latest.location ?? ""} · {new Date(latest.occurred_at).toLocaleTimeString()}
                          </span>
                        </>
                      ) : (
                        "No events yet"
                      )}
                    </td>
                    <td className="max-w-xs px-4 py-2.5 text-text-secondary">
                      <span className="block truncate">{s.delivery_address ?? "—"}</span>
                      {s.eta && <span className="block text-xs text-text-tertiary">ETA {new Date(s.eta).toLocaleString()}</span>}
                    </td>
                    <td className="px-4 py-2.5"><Badge tone={statusTone[s.status] ?? "neutral"}>{s.status.replace("_", " ")}</Badge></td>
                    <td className="px-4 py-2.5">
                      <TrackingTimelineModal shipmentId={s.id} shipmentNumber={s.shipment_number} events={events} canManage={canManage} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </Card>
    </>
  );
}

function Stat({ icon: Icon, label, value, sub }: { icon: typeof MapPinned; label: string; value: string; sub: string }) {
  return (
    <Card className="px-4 py-3.5">
      <div className="flex items-center gap-2 text-text-tertiary"><Icon className="size-4" /><span className="text-xs font-medium uppercase tracking-wide">{label}</span></div>
      <p className="mt-1.5 text-xl font-semibold text-text-primary">{value}</p>
      <p className="text-xs text-text-tertiary">{sub}</p>
    </Card>
  );
}
