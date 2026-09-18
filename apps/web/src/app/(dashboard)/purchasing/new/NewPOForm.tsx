"use client";

import { useActionState, useMemo, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Card, CardHeader } from "@/components/Card";
import { Button } from "@/components/Button";
import { Input, Select, Textarea } from "@/components/Input";
import { FormField } from "@/components/FormField";
import { createPurchaseOrderAction, initialPurchasingActionState } from "../actions";
import type { Supplier } from "@/services/purchasing";
import type { ProductWithStock } from "@/services/products";

interface LineItem {
  key: number;
  product_id: string;
  description: string;
  quantity: number;
  unit_cost: number;
}

let nextKey = 1;

export function NewPOForm({
  suppliers,
  products,
  branchId,
  taxRatePercent,
  preselectedProductId,
  preselectedQty,
  lowStockReorder,
}: {
  suppliers: Supplier[];
  products: ProductWithStock[];
  branchId: string;
  taxRatePercent: number;
  preselectedProductId?: string | null;
  preselectedQty?: number | null;
  lowStockReorder?: boolean;
}) {
  const [state, formAction, isPending] = useActionState(createPurchaseOrderAction, initialPurchasingActionState);
  const [items, setItems] = useState<LineItem[]>(() => {
    if (lowStockReorder) {
      const lows = products
        .filter((p) => p.reorder_level > 0 && p.totalStock <= p.reorder_level)
        .map((p) => ({
          key: nextKey++,
          product_id: p.id,
          description: p.name,
          quantity: Math.max(p.reorder_level * 2 - p.totalStock, 1),
          unit_cost: p.cost_price,
        }));
      if (lows.length > 0) return lows;
    }
    const preselected = preselectedProductId ? products.find((p) => p.id === preselectedProductId) : undefined;
    if (preselected) {
      return [
        {
          key: nextKey++,
          product_id: preselected.id,
          description: preselected.name,
          quantity: preselectedQty && preselectedQty > 0 ? preselectedQty : Math.max(preselected.reorder_level * 2 - preselected.totalStock, 1),
          unit_cost: preselected.cost_price,
        },
      ];
    }
    return [{ key: nextKey++, product_id: "", description: "", quantity: 1, unit_cost: 0 }];
  });

  const subtotal = useMemo(() => items.reduce((sum, i) => sum + i.quantity * i.unit_cost, 0), [items]);
  const taxTotal = useMemo(() => Math.round(subtotal * (taxRatePercent / 100) * 100) / 100, [subtotal, taxRatePercent]);
  const total = subtotal + taxTotal;

  function updateItem(key: number, patch: Partial<LineItem>) {
    setItems((prev) => prev.map((i) => (i.key === key ? { ...i, ...patch } : i)));
  }

  function addItem() {
    setItems((prev) => [...prev, { key: nextKey++, product_id: "", description: "", quantity: 1, unit_cost: 0 }]);
  }

  function removeItem(key: number) {
    setItems((prev) => (prev.length > 1 ? prev.filter((i) => i.key !== key) : prev));
  }

  function onProductSelect(key: number, productId: string) {
    const product = products.find((p) => p.id === productId);
    updateItem(key, { product_id: productId, description: product?.name ?? "", unit_cost: product?.cost_price ?? 0 });
  }

  const serializedItems = JSON.stringify(
    items.map((i) => ({ product_id: i.product_id, description: i.description, quantity: i.quantity, unit_cost: i.unit_cost }))
  );

  return (
    <form action={formAction} className="flex flex-col gap-6">
      <input type="hidden" name="items" value={serializedItems} />
      <input type="hidden" name="taxTotal" value={taxTotal} />
      <input type="hidden" name="branchId" value={branchId} />

      <Card>
        <CardHeader title="Order details" />
        <div className="grid grid-cols-2 gap-4 p-4">
          <FormField label="Supplier" htmlFor="supplierId">
            <Select id="supplierId" name="supplierId">
              <option value="">No supplier on file</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </Select>
          </FormField>
          <FormField label="Expected delivery" htmlFor="expectedDate" hint="Late POs show on the dashboard">
            <Input id="expectedDate" name="expectedDate" type="date" />
          </FormField>
        </div>
      </Card>

      <Card>
        <CardHeader title="Line items" />
        <div className="flex flex-col gap-3 p-4">
          {items.map((item) => (
            <div key={item.key} className="grid grid-cols-12 items-end gap-2">
              <div className="col-span-4">
                <FormField label="Product" htmlFor={`product-${item.key}`}>
                  <Select id={`product-${item.key}`} value={item.product_id} onChange={(e) => onProductSelect(item.key, e.target.value)}>
                    <option value="">Custom line</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} (${p.cost_price.toFixed(2)})
                      </option>
                    ))}
                  </Select>
                </FormField>
              </div>
              <div className="col-span-4">
                <FormField label="Description" htmlFor={`desc-${item.key}`}>
                  <Input id={`desc-${item.key}`} value={item.description} onChange={(e) => updateItem(item.key, { description: e.target.value })} />
                </FormField>
              </div>
              <div className="col-span-2">
                <FormField label="Qty" htmlFor={`qty-${item.key}`}>
                  <Input
                    id={`qty-${item.key}`}
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={item.quantity}
                    onChange={(e) => updateItem(item.key, { quantity: Number(e.target.value) })}
                  />
                </FormField>
              </div>
              <div className="col-span-1">
                <FormField label="Cost" htmlFor={`cost-${item.key}`}>
                  <Input
                    id={`cost-${item.key}`}
                    type="number"
                    min="0"
                    step="0.01"
                    value={item.unit_cost}
                    onChange={(e) => updateItem(item.key, { unit_cost: Number(e.target.value) })}
                  />
                </FormField>
              </div>
              <div className="col-span-1 flex justify-end pb-2">
                <button
                  type="button"
                  onClick={() => removeItem(item.key)}
                  disabled={items.length === 1}
                  className="text-text-tertiary hover:text-danger-600 disabled:opacity-30"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            </div>
          ))}

          <Button type="button" variant="secondary" size="sm" onClick={addItem} className="w-fit">
            <Plus className="size-4" />
            Add line
          </Button>

          <div className="ml-auto flex w-64 flex-col gap-1 border-t border-border-subtle pt-3 text-sm">
            <div className="flex justify-between text-text-secondary">
              <span>Subtotal</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-text-secondary">
              <span>Tax ({taxRatePercent}%)</span>
              <span>${taxTotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-semibold text-text-primary">
              <span>Total</span>
              <span>${total.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </Card>

      <FormField label="Notes" htmlFor="notes">
        <Textarea id="notes" name="notes" placeholder="Optional" />
      </FormField>

      {state.error && <p className="text-sm text-danger-600">{state.error}</p>}

      <div className="flex justify-end">
        <Button type="submit" loading={isPending}>
          Create purchase order
        </Button>
      </div>
    </form>
  );
}
