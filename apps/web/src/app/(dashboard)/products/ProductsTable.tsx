"use client";

import { useActionState, useEffect, useState } from "react";
import { Plus, Pencil, Package, PackagePlus } from "lucide-react";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { Badge } from "@/components/Badge";
import { EmptyState } from "@/components/EmptyState";
import { useToast } from "@/components/Toast";
import { ProductFormModal } from "./ProductFormModal";
import { AdjustStockModal } from "./AdjustStockModal";
import { setProductActiveAction, initialProductActionState } from "./actions";
import type { ProductWithStock, BranchWarehouse } from "@/services/products";

function ActiveToggle({ product }: { product: ProductWithStock }) {
  const [state, formAction, isPending] = useActionState(setProductActiveAction, initialProductActionState);
  const { push } = useToast();

  useEffect(() => {
    if (state.success) push(product.is_active ? "Product deactivated" : "Product reactivated");
    if (state.error) push(state.error, "error");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.success, state.error]);

  return (
    <form action={formAction}>
      <input type="hidden" name="productId" value={product.id} />
      <input type="hidden" name="isActive" value={String(!product.is_active)} />
      <button
        type="submit"
        disabled={isPending}
        className="text-sm font-medium text-primary-600 hover:underline disabled:opacity-50"
      >
        {product.is_active ? "Deactivate" : "Reactivate"}
      </button>
    </form>
  );
}

export function ProductsTable({
  products,
  warehouses,
  canManage,
}: {
  products: ProductWithStock[];
  warehouses: BranchWarehouse[];
  canManage: boolean;
}) {
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<ProductWithStock | undefined>(undefined);
  const [adjusting, setAdjusting] = useState<ProductWithStock | undefined>(undefined);

  return (
    <Card>
      <div className="flex items-center justify-between border-b border-border-subtle px-4 py-3">
        <h3 className="text-sm font-semibold text-text-primary">{products.length} products</h3>
        {canManage && (
          <Button
            size="sm"
            onClick={() => {
              setEditing(undefined);
              setFormOpen(true);
            }}
          >
            <Plus className="size-4" />
            New Product
          </Button>
        )}
      </div>

      {products.length === 0 ? (
        <EmptyState icon={Package} title="No products yet" description="Add your first product to start tracking stock." />
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border-subtle text-left text-xs font-medium uppercase tracking-wide text-text-tertiary">
              <th className="px-4 py-2.5">Product</th>
              <th className="px-4 py-2.5">SKU</th>
              <th className="px-4 py-2.5">Category</th>
              <th className="px-4 py-2.5">Cost</th>
              <th className="px-4 py-2.5">Price</th>
              <th className="px-4 py-2.5">Stock</th>
              <th className="px-4 py-2.5">Status</th>
              {canManage && <th className="px-4 py-2.5" />}
            </tr>
          </thead>
          <tbody>
            {products.map((product) => {
              const lowStock = product.totalStock <= product.reorder_level;
              return (
                <tr key={product.id} className="border-b border-border-subtle last:border-b-0">
                  <td className="px-4 py-2.5 font-medium text-text-primary">{product.name}</td>
                  <td className="px-4 py-2.5 text-text-secondary">{product.sku}</td>
                  <td className="px-4 py-2.5 text-text-secondary">{product.categoryName || "Uncategorized"}</td>
                  <td className="px-4 py-2.5 text-text-secondary">${product.cost_price.toFixed(2)}</td>
                  <td className="px-4 py-2.5 text-text-secondary">${product.selling_price.toFixed(2)}</td>
                  <td className="px-4 py-2.5">
                    <Badge tone={lowStock ? "warning" : "neutral"}>{product.totalStock}</Badge>
                  </td>
                  <td className="px-4 py-2.5">
                    <Badge tone={product.is_active ? "success" : "neutral"}>
                      {product.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </td>
                  {canManage && (
                    <td className="px-4 py-2.5">
                      <div className="flex items-center justify-end gap-3">
                        <button
                          onClick={() => setAdjusting(product)}
                          title="Adjust stock"
                          className="text-text-tertiary hover:text-primary-600"
                        >
                          <PackagePlus className="size-4" />
                        </button>
                        <button
                          onClick={() => {
                            setEditing(product);
                            setFormOpen(true);
                          }}
                          title="Edit product"
                          className="text-text-tertiary hover:text-primary-600"
                        >
                          <Pencil className="size-4" />
                        </button>
                        <ActiveToggle product={product} />
                      </div>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      {canManage && formOpen && (
        <ProductFormModal key={editing?.id ?? "new"} open={formOpen} onClose={() => setFormOpen(false)} product={editing} />
      )}
      {canManage && adjusting && (
        <AdjustStockModal
          open={!!adjusting}
          onClose={() => setAdjusting(undefined)}
          product={adjusting}
          warehouses={warehouses}
        />
      )}
    </Card>
  );
}
