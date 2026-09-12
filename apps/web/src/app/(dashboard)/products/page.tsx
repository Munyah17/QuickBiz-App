import { PageHeader } from "@/components/PageHeader";
import { StatCard } from "@/components/StatCard";
import { Card, CardHeader } from "@/components/Card";
import { CategoryDonutChart } from "@/components/CategoryDonutChart";
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

  const totalProducts = products.length;
  const totalStock = products.reduce((sum, p) => sum + p.totalStock, 0);
  const lowStockProducts = products.filter((p) => p.totalStock <= p.reorder_level).length;
  const totalValue = products.reduce((sum, p) => sum + p.totalStock * p.cost_price, 0);

  const categoryBreakdown = products.reduce((acc, p) => {
    const category = p.categoryName ?? "Uncategorized";
    acc[category] = (acc[category] ?? 0) + p.totalStock * p.cost_price;
    return acc;
  }, {} as Record<string, number>);

  const categorySegments = Object.entries(categoryBreakdown).map(([label, value]) => ({ label, value }));

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Products" />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total products" value={totalProducts.toString()} tone="primary" />
        <StatCard label="Total stock" value={totalStock.toLocaleString()} tone="info" />
        <StatCard
          label="Low stock"
          value={lowStockProducts.toString()}
          delta={lowStockProducts > 0 ? { label: "Attention needed", direction: "down" } : undefined}
          tone={lowStockProducts > 0 ? "warning" : "success"}
        />
        <StatCard label="Inventory value" value={`$${totalValue.toLocaleString()}`} tone="success" />
      </div>

      {categorySegments.length > 0 && (
        <Card>
          <CardHeader title="Inventory value by category" />
          <div className="p-4">
            <CategoryDonutChart chart={{ title: "Inventory value by category", segments: categorySegments }} />
          </div>
        </Card>
      )}

      <ProductsTable products={products} warehouses={warehouses} canManage={permissions.has("inventory.manage")} />
    </div>
  );
}
