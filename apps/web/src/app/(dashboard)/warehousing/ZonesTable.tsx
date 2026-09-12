"use client";

import { LayoutGrid } from "lucide-react";
import { Card, CardHeader } from "@/components/Card";
import { Badge } from "@/components/Badge";
import { EmptyState } from "@/components/EmptyState";
import { NewZoneModal } from "./NewZoneModal";
import type { WarehouseRow, WarehouseZoneRow } from "@/services/warehousing";

const STATUS_TONE: Record<string, "neutral" | "success" | "warning" | "danger"> = {
  active: "success",
  inactive: "neutral",
  maintenance: "warning",
};

export function ZonesTable({
  zones,
  warehouses,
  canManage,
}: {
  zones: WarehouseZoneRow[];
  warehouses: WarehouseRow[];
  canManage: boolean;
}) {
  return (
    <Card>
      <CardHeader title="Storage Zones" action={canManage && <NewZoneModal warehouses={warehouses} />} />
      {zones.length === 0 ? (
        <EmptyState icon={LayoutGrid} title="No storage zones yet" description="Add a zone within a warehouse to start organizing storage." />
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border-subtle text-left text-xs font-medium uppercase tracking-wide text-text-tertiary">
              <th className="px-4 py-2.5">Code</th>
              <th className="px-4 py-2.5">Name</th>
              <th className="px-4 py-2.5">Warehouse</th>
              <th className="px-4 py-2.5">Type</th>
              <th className="px-4 py-2.5">Area</th>
              <th className="px-4 py-2.5">Status</th>
            </tr>
          </thead>
          <tbody>
            {zones.map((z) => (
              <tr key={z.id} className="border-b border-border-subtle last:border-b-0">
                <td className="px-4 py-2.5 text-text-secondary">{z.code}</td>
                <td className="px-4 py-2.5 font-medium text-text-primary">{z.name}</td>
                <td className="px-4 py-2.5 text-text-secondary">{z.warehouseName}</td>
                <td className="px-4 py-2.5 text-text-secondary">{z.zoneType?.replace("_", " ") ?? "-"}</td>
                <td className="px-4 py-2.5 text-text-secondary">{z.area ?? "-"}</td>
                <td className="px-4 py-2.5">
                  <Badge tone={STATUS_TONE[z.status] ?? "neutral"}>{z.status}</Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Card>
  );
}
