import { Factory } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/Card";
import { Badge } from "@/components/Badge";
import { EmptyState } from "@/components/EmptyState";
import { requireOrgContext, requireModuleEnabled } from "@/lib/session";
import { listWorkOrders, listBoms } from "@/services/manufacturing";
import { listWarehouses } from "@/services/products";
import { NewWorkOrderModal } from "./NewWorkOrderModal";
import { WorkOrderActions } from "./WorkOrderActions";

const statusTone: Record<string, "success" | "info" | "warning" | "danger" | "neutral"> = {
  planned: "neutral",
  in_progress: "info",
  completed: "success",
  cancelled: "danger",
};

export default async function WorkOrdersPage() {
  const { supabase, orgId, permissions } = await requireOrgContext();
  await requireModuleEnabled(supabase, orgId, "manufacturing");
  const canManage = permissions.has("manufacturing.manage");

  const [workOrders, boms, warehouses] = await Promise.all([
    listWorkOrders(supabase, orgId),
    listBoms(supabase, orgId),
    listWarehouses(supabase, orgId),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <PageHeader module="Manufacturing" title="Work Orders" />
        {canManage && <NewWorkOrderModal boms={boms.filter((b) => b.is_active)} warehouses={warehouses} />}
      </div>

      <p className="text-sm text-text-tertiary">
        Completing a work order consumes each component&apos;s stock and adds the finished goods to stock in the
        chosen warehouse, using the same inventory records as the Inventory module.
      </p>

      <Card>
        {workOrders.length === 0 ? (
          <EmptyState icon={Factory} title="No work orders yet" />
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border-subtle text-left text-xs font-medium uppercase tracking-wide text-text-tertiary">
                <th className="px-4 py-2.5">WO #</th>
                <th className="px-4 py-2.5">Product</th>
                <th className="px-4 py-2.5">Warehouse</th>
                <th className="px-4 py-2.5">Planned</th>
                <th className="px-4 py-2.5">Produced</th>
                <th className="px-4 py-2.5">Status</th>
                {canManage && <th className="px-4 py-2.5" />}
              </tr>
            </thead>
            <tbody>
              {workOrders.map((w) => (
                <tr key={w.id} className="border-b border-border-subtle last:border-b-0">
                  <td className="px-4 py-2.5 font-mono font-medium text-text-primary">{w.wo_number}</td>
                  <td className="px-4 py-2.5 text-text-secondary">
                    {w.productName} <span className="text-text-tertiary">({w.bomName})</span>
                  </td>
                  <td className="px-4 py-2.5 text-text-secondary">{w.warehouseBranchName ?? "Unknown"}</td>
                  <td className="px-4 py-2.5 text-text-secondary">{w.quantity_planned.toLocaleString()}</td>
                  <td className="px-4 py-2.5 text-text-secondary">{w.quantity_produced.toLocaleString()}</td>
                  <td className="px-4 py-2.5">
                    <Badge tone={statusTone[w.status] ?? "neutral"}>{w.status.replace("_", " ")}</Badge>
                  </td>
                  {canManage && (
                    <td className="px-4 py-2.5">
                      {(w.status === "planned" || w.status === "in_progress") && <WorkOrderActions workOrderId={w.id} />}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
