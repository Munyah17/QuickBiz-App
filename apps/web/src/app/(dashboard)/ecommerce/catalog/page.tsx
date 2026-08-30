import { PageHeader } from "@/components/PageHeader";
import { requireOrgContext, requireModuleEnabled } from "@/lib/session";
import { listOnlineProducts } from "@/services/ecommerce";
import { listProductsWithStock } from "@/services/products";
import { PublishProductModal } from "./PublishProductModal";
import { CatalogTable } from "./CatalogTable";

export default async function OnlineCatalogPage() {
  const { supabase, orgId, permissions } = await requireOrgContext();
  await requireModuleEnabled(supabase, orgId, "ecommerce");
  const canManage = permissions.has("ecommerce.manage");

  const [onlineProducts, products] = await Promise.all([
    listOnlineProducts(supabase, orgId),
    listProductsWithStock(supabase, orgId),
  ]);

  const publishedProductIds = new Set(onlineProducts.map((p) => p.productId));
  const availableProducts = products.filter((p) => p.is_active && !publishedProductIds.has(p.id));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <PageHeader module="Ecommerce" title="Online Catalog" />
        {canManage && <PublishProductModal products={availableProducts} />}
      </div>

      <p className="text-sm text-text-tertiary">
        QuickBiz does not host a public storefront yet. Use this to control which products and prices you show
        customers through your own online channels, and to keep an online price list separate from your in-store price.
      </p>

      <CatalogTable onlineProducts={onlineProducts} canManage={canManage} />
    </div>
  );
}
