import { PageHeader } from "@/components/PageHeader";
import { requireOrgContext, requireModuleEnabled } from "@/lib/session";
import { listOnlineOrders } from "@/services/ecommerce";
import { listCustomers } from "@/services/customers";
import { listProductsWithStock, listWarehouses } from "@/services/products";
import { NewOnlineOrderModal } from "./NewOnlineOrderModal";
import { OrdersTable } from "./OrdersTable";

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

      <OrdersTable orders={orders} canManage={canManage} />
    </div>
  );
}
