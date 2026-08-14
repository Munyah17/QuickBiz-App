import { PageHeader } from "@/components/PageHeader";
import { requireOrgContext, requireModuleEnabled } from "@/lib/session";
import { listProductsWithStock, listWarehouses } from "@/services/products";
import { ProductsTable } from "./ProductsTable";

export default async function ProductsPage() {
  const { supabase, orgId, permissions } = await requireOrgContext();
  await requireModuleEnabled(supabase, orgId, "inventory");

  const [products, warehouses] = await Promise.all([
    listProductsWithStock(supabase, orgId),
    listWarehouses(supabase, orgId),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Products" />
      <ProductsTable products={products} warehouses={warehouses} canManage={permissions.has("inventory.manage")} />
    </div>
  );
}
