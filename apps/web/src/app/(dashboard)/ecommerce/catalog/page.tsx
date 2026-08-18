import { Store } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/Card";
import { Badge } from "@/components/Badge";
import { EmptyState } from "@/components/EmptyState";
import { requireOrgContext, requireModuleEnabled } from "@/lib/session";
import { listOnlineProducts } from "@/services/ecommerce";
import { listProductsWithStock } from "@/services/products";
import { PublishProductModal } from "./PublishProductModal";
import { TogglePublishButton } from "./TogglePublishButton";

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

      <Card>
        {onlineProducts.length === 0 ? (
          <EmptyState icon={Store} title="No products published online yet" />
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border-subtle text-left text-xs font-medium uppercase tracking-wide text-text-tertiary">
                <th className="px-4 py-2.5">Product</th>
                <th className="px-4 py-2.5">Slug</th>
                <th className="px-4 py-2.5">Online price</th>
                <th className="px-4 py-2.5">Status</th>
                {canManage && <th className="px-4 py-2.5" />}
              </tr>
            </thead>
            <tbody>
              {onlineProducts.map((p) => (
                <tr key={p.id} className="border-b border-border-subtle last:border-b-0">
                  <td className="px-4 py-2.5">
                    <p className="font-medium text-text-primary">{p.productName}</p>
                    <p className="text-xs text-text-tertiary">{p.productSku}</p>
                  </td>
                  <td className="px-4 py-2.5 font-mono text-text-secondary">{p.slug}</td>
                  <td className="px-4 py-2.5 text-text-secondary">${(p.online_price ?? p.basePrice).toFixed(2)}</td>
                  <td className="px-4 py-2.5">
                    <Badge tone={p.is_published ? "success" : "neutral"}>{p.is_published ? "Published" : "Hidden"}</Badge>
                  </td>
                  {canManage && (
                    <td className="px-4 py-2.5 text-right">
                      <TogglePublishButton onlineProductId={p.id} isPublished={p.is_published} />
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
