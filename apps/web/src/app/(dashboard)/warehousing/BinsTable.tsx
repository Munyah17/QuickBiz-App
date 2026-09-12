"use client";

import { PackageSearch } from "lucide-react";
import { Card, CardHeader } from "@/components/Card";
import { Badge } from "@/components/Badge";
import { EmptyState } from "@/components/EmptyState";
import { NewBinModal } from "./NewBinModal";
import type { WarehouseBinRow, WarehouseZoneRow } from "@/services/warehousing";

const STATUS_TONE: Record<string, "neutral" | "success" | "warning" | "danger" | "info"> = {
  active: "success",
  inactive: "neutral",
  full: "warning",
  reserved: "info",
  damaged: "danger",
};

export function BinsTable({
  bins,
  zones,
  canManage,
}: {
  bins: WarehouseBinRow[];
  zones: WarehouseZoneRow[];
  canManage: boolean;
}) {
  return (
    <Card>
      <CardHeader title="Storage Bins" action={canManage && <NewBinModal zones={zones} />} />
      {bins.length === 0 ? (
        <EmptyState icon={PackageSearch} title="No storage bins yet" description="Add bins to a zone to track exactly where stock is placed." />
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border-subtle text-left text-xs font-medium uppercase tracking-wide text-text-tertiary">
              <th className="px-4 py-2.5">Code</th>
              <th className="px-4 py-2.5">Name</th>
              <th className="px-4 py-2.5">Zone</th>
              <th className="px-4 py-2.5">Type</th>
              <th className="px-4 py-2.5">Status</th>
            </tr>
          </thead>
          <tbody>
            {bins.map((b) => (
              <tr key={b.id} className="border-b border-border-subtle last:border-b-0">
                <td className="px-4 py-2.5 text-text-secondary">{b.code}</td>
                <td className="px-4 py-2.5 font-medium text-text-primary">{b.name ?? "-"}</td>
                <td className="px-4 py-2.5 text-text-secondary">{b.zoneName}</td>
                <td className="px-4 py-2.5 text-text-secondary">{b.binType ?? "-"}</td>
                <td className="px-4 py-2.5">
                  <Badge tone={STATUS_TONE[b.status] ?? "neutral"}>{b.status}</Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Card>
  );
}
