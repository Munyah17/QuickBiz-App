import { notFound } from "next/navigation";
import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardHeader } from "@/components/Card";
import { Badge } from "@/components/Badge";
import { Button } from "@/components/Button";
import { StatCard } from "@/components/StatCard";
import { requireOrgContext, requireModuleEnabled } from "@/lib/session";
import { getProductDetail } from "@/services/products";

const reasonLabel: Record<string, string> = {
  adjustment: "Adjustment",
  sale: "Sale",
  purchase: "Purchase",
  transfer_in: "Transfer in",
  transfer_out: "Transfer out",
};

export default async function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, orgId } = await requireOrgContext();
  await requireModuleEnabled(supabase, orgId, "inventory");

  const product = await getProductDetail(supabase, orgId, id);
  if (!product) notFound();

  const lowStock = product.totalStock <= product.reorder_level;
  const margin = product.cost_price > 0 ? ((product.selling_price - product.cost_price) / product.cost_price) * 100 : null;

  const suggestedQty = Math.max(product.reorder_level * 2 - product.totalStock, 0);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        module="Products"
        title={product.name}
        action={
          lowStock ? (
            <Link href={`/purchasing/new?product=${product.id}&qty=${Math.ceil(suggestedQty)}`}>
              <Button>
                <ShoppingCart className="size-4" />
                Reorder {Math.ceil(suggestedQty)} units
              </Button>
            </Link>
          ) : undefined
        }
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Stock on hand"
          value={product.totalStock.toString()}
          delta={lowStock ? { label: `Below reorder level (${product.reorder_level})`, direction: "down" } : undefined}
          tone={lowStock ? "warning" : "primary"}
        />
        <StatCard label="Stock value" value={`$${product.stockValue.toFixed(2)}`} tone="info" />
        <StatCard label="Units sold" value={product.unitsSold.toString()} tone="success" />
        <StatCard
          label="Revenue"
          value={`$${product.revenue.toFixed(2)}`}
          delta={margin !== null ? { label: `${margin.toFixed(0)}% margin`, direction: "flat" } : undefined}
          tone="primary"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          <Card>
            <CardHeader title="Stock movement ledger" />
            {product.movements.length === 0 ? (
              <p className="p-4 text-sm text-text-secondary">No stock movements recorded yet.</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border-subtle text-left text-xs font-medium uppercase tracking-wide text-text-tertiary">
                    <th className="px-4 py-2.5">Date</th>
                    <th className="px-4 py-2.5">Warehouse</th>
                    <th className="px-4 py-2.5">Reason</th>
                    <th className="px-4 py-2.5">Reference</th>
                    <th className="px-4 py-2.5">By</th>
                    <th className="px-4 py-2.5 text-right">Qty</th>
                  </tr>
                </thead>
                <tbody>
                  {product.movements.map((m) => (
                    <tr key={m.id} className="border-b border-border-subtle last:border-b-0">
                      <td className="px-4 py-2.5 text-text-secondary">{new Date(m.created_at).toLocaleDateString()}</td>
                      <td className="px-4 py-2.5 text-text-secondary">{m.warehouseName}</td>
                      <td className="px-4 py-2.5">
                        <Badge tone="neutral">{reasonLabel[m.reason] ?? m.reason}</Badge>
                      </td>
                      <td className="px-4 py-2.5 text-text-secondary">{m.reference || "—"}</td>
                      <td className="px-4 py-2.5 text-text-secondary">{m.created_by_name || "—"}</td>
                      <td
                        className={`px-4 py-2.5 text-right font-medium ${
                          m.quantity_delta >= 0 ? "text-success-600" : "text-danger-600"
                        }`}
                      >
                        {m.quantity_delta >= 0 ? "+" : ""}
                        {m.quantity_delta}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Card>
        </div>

        <div className="flex flex-col gap-6">
          <Card className="flex flex-col gap-3 p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-text-secondary">Status</span>
              <Badge tone={product.is_active ? "success" : "neutral"}>{product.is_active ? "Active" : "Inactive"}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-text-secondary">SKU</span>
              <span className="text-sm text-text-primary">{product.sku}</span>
            </div>
            {product.barcode && (
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-text-secondary">Barcode</span>
                <span className="font-mono text-sm text-text-primary">{product.barcode}</span>
              </div>
            )}
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-text-secondary">Category</span>
              <span className="text-sm text-text-primary">{product.categoryName ?? "Uncategorized"}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-text-secondary">Unit</span>
              <span className="text-sm text-text-primary">{product.unit_of_measure}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-text-secondary">Cost</span>
              <span className="text-sm text-text-primary">${product.cost_price.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-text-secondary">Price</span>
              <span className="text-sm text-text-primary">${product.selling_price.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-text-secondary">Reorder level</span>
              <span className="text-sm text-text-primary">{product.reorder_level}</span>
            </div>
            {product.description && (
              <div className="border-t border-border-subtle pt-3">
                <p className="text-sm font-medium text-text-secondary">Description</p>
                <p className="whitespace-pre-line text-sm text-text-primary">{product.description}</p>
              </div>
            )}
          </Card>

          <Card>
            <CardHeader title="Stock by warehouse" />
            {product.stockByWarehouse.length === 0 ? (
              <p className="p-4 text-sm text-text-secondary">No stock anywhere yet.</p>
            ) : (
              <table className="w-full text-sm">
                <tbody>
                  {product.stockByWarehouse.map((s) => (
                    <tr key={s.warehouseId} className="border-b border-border-subtle last:border-b-0">
                      <td className="px-4 py-2.5">
                        <p className="font-medium text-text-primary">{s.warehouseName}</p>
                        {s.branchName && <p className="text-xs text-text-tertiary">{s.branchName}</p>}
                      </td>
                      <td className="px-4 py-2.5 text-right font-medium text-text-primary">{s.quantityOnHand}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
