"use client";

import { Warehouse } from "lucide-react";
import { Card, CardHeader } from "@/components/Card";
import { Badge } from "@/components/Badge";
import { EmptyState } from "@/components/EmptyState";
import { NewWarehouseModal } from "./NewWarehouseModal";
import type { WarehouseRow } from "@/services/warehousing";

const STATUS_TONE: Record<string, "neutral" | "success" | "warning" | "danger"> = {
  active: "success",
  inactive: "neutral",
  maintenance: "warning",
  closed: "danger",
};

export function WarehousesTable({ warehouses, canManage }: { warehouses: WarehouseRow[]; canManage: boolean }) {
  return (
    <Card>
      <CardHeader title="Warehouses" action={canManage && <NewWarehouseModal />} />
      {warehouses.length === 0 ? (
        <EmptyState icon={Warehouse} title="No warehouses yet" description="Add a warehouse to start organizing storage zones and bins." />
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border-subtle text-left text-xs font-medium uppercase tracking-wide text-text-tertiary">
              <th className="px-4 py-2.5">Code</th>
              <th className="px-4 py-2.5">Name</th>
              <th className="px-4 py-2.5">City</th>
              <th className="px-4 py-2.5">Manager</th>
              <th className="px-4 py-2.5">Status</th>
              <th className="px-4 py-2.5">Primary</th>
            </tr>
          </thead>
          <tbody>
            {warehouses.map((w) => (
              <tr key={w.id} className="border-b border-border-subtle last:border-b-0">
                <td className="px-4 py-2.5 text-text-secondary">{w.code}</td>
                <td className="px-4 py-2.5 font-medium text-text-primary">{w.name}</td>
                <td className="px-4 py-2.5 text-text-secondary">{w.city ?? "-"}</td>
                <td className="px-4 py-2.5 text-text-secondary">{w.managerName ?? "-"}</td>
                <td className="px-4 py-2.5">
                  <Badge tone={STATUS_TONE[w.status] ?? "neutral"}>{w.status}</Badge>
                </td>
                <td className="px-4 py-2.5">{w.isPrimary && <Badge tone="info">primary</Badge>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Card>
  );
}
