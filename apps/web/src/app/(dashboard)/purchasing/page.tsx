import Link from "next/link";
import { ClipboardList, Plus } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/Card";
import { Badge } from "@/components/Badge";
import { Button } from "@/components/Button";
import { EmptyState } from "@/components/EmptyState";
import { requireOrgContext, requireModuleEnabled } from "@/lib/session";
import { listPurchaseOrders } from "@/services/purchasing";

const statusTone: Record<string, "success" | "info" | "warning" | "danger" | "neutral"> = {
  draft: "neutral",
  issued: "info",
  received: "success",
  cancelled: "danger",
};

export default async function PurchasingPage() {
  const { supabase, orgId, permissions } = await requireOrgContext();
  await requireModuleEnabled(supabase, orgId, "purchasing");
  const canManage = permissions.has("purchasing.manage");

  const orders = await listPurchaseOrders(supabase, orgId);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <PageHeader title="Purchasing" />
        {canManage && (
          <Link href="/purchasing/new">
            <Button>
              <Plus className="size-4" />
              New Purchase Order
            </Button>
          </Link>
        )}
      </div>

      <Card>
        {orders.length === 0 ? (
          <EmptyState icon={ClipboardList} title="No purchase orders yet" description="Create your first purchase order to get started." />
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
              {orders.map((po) => (
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
    </div>
  );
}
