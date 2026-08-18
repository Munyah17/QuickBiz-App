import { ShoppingBag } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/Card";
import { Badge } from "@/components/Badge";
import { EmptyState } from "@/components/EmptyState";
import { requireOrgContext, requireModuleEnabled } from "@/lib/session";
import { listOnlineOrders } from "@/services/ecommerce";
import { listCustomers } from "@/services/customers";
import { listProductsWithStock, listWarehouses } from "@/services/products";
import { NewOnlineOrderModal } from "./NewOnlineOrderModal";
import { OrderStatusControls } from "./OrderStatusControls";

const statusTone: Record<string, "success" | "info" | "warning" | "danger" | "neutral"> = {
  pending: "neutral",
  confirmed: "info",
  fulfilled: "success",
  cancelled: "danger",
};

export default async function OnlineOrdersPage() {
  const { supabase, orgId, permissions } = await requireOrgContext();
  await requireModuleEnabled(supabase, orgId, "ecommerce");
  const canManage = permissions.has("ecommerce.manage");

  const [orders, customers, products, warehouses, { data: member }] = await Promise.all([
    listOnlineOrders(supabase, orgId),
    listCustomers(supabase, orgId),
    listProductsWithStock(supabase, orgId),
    listWarehouses(supabase, orgId),
    supabase.from("org_members").select("branch_id").eq("status", "active").limit(1).maybeSingle(),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <PageHeader module="Ecommerce" title="Online Orders" />
        {canManage && (
          <NewOnlineOrderModal
            customers={customers.filter((c) => c.is_active)}
            products={products.filter((p) => p.is_active)}
            warehouses={warehouses}
            branchId={(member?.branch_id as string) ?? ""}
          />
        )}
      </div>

      <Card>
        {orders.length === 0 ? (
          <EmptyState icon={ShoppingBag} title="No online orders yet" />
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border-subtle text-left text-xs font-medium uppercase tracking-wide text-text-tertiary">
                <th className="px-4 py-2.5">Order #</th>
                <th className="px-4 py-2.5">Buyer</th>
                <th className="px-4 py-2.5">Delivery</th>
                <th className="px-4 py-2.5">Total</th>
                <th className="px-4 py-2.5">Status</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id} className="border-b border-border-subtle last:border-b-0">
                  <td className="px-4 py-2.5 font-mono font-medium text-text-primary">{o.order_number}</td>
                  <td className="px-4 py-2.5 text-text-secondary">{o.buyerName}</td>
                  <td className="px-4 py-2.5 text-text-secondary capitalize">
                    {o.delivery_method} <span className="text-text-tertiary">({o.delivery_status.replace("_", " ")})</span>
                  </td>
                  <td className="px-4 py-2.5 text-text-secondary">${o.total.toFixed(2)}</td>
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
        )}
      </Card>
    </div>
  );
}
