"use client";

import { useActionState, useMemo, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Card, CardHeader } from "@/components/Card";
import { Button } from "@/components/Button";
import { Input, Select, Textarea } from "@/components/Input";
import { FormField } from "@/components/FormField";
import { createInvoiceAction, initialSalesActionState } from "../actions";
import type { Customer } from "@/services/customers";
import type { ProductWithStock, BranchWarehouse } from "@/services/products";

interface LineItem {
  key: number;
  product_id: string;
  description: string;
  quantity: number;
  unit_price: number;
}

let nextKey = 1;

export function NewInvoiceForm({
  customers,
  products,
  warehouses,
  taxRatePercent,
}: {
  customers: Customer[];
  products: ProductWithStock[];
  warehouses: BranchWarehouse[];
  taxRatePercent: number;
}) {
  const [state, formAction, isPending] = useActionState(createInvoiceAction, initialSalesActionState);
  const [branchWarehouseId, setBranchWarehouseId] = useState(warehouses[0]?.warehouseId ?? "");
  const [items, setItems] = useState<LineItem[]>([{ key: nextKey++, product_id: "", description: "", quantity: 1, unit_price: 0 }]);

  const subtotal = useMemo(() => items.reduce((sum, i) => sum + i.quantity * i.unit_price, 0), [items]);
  const taxTotal = useMemo(() => Math.round(subtotal * (taxRatePercent / 100) * 100) / 100, [subtotal, taxRatePercent]);
  const total = subtotal + taxTotal;

  function updateItem(key: number, patch: Partial<LineItem>) {
    setItems((prev) => prev.map((i) => (i.key === key ? { ...i, ...patch } : i)));
  }

  function addItem() {
    setItems((prev) => [...prev, { key: nextKey++, product_id: "", description: "", quantity: 1, unit_price: 0 }]);
  }

  function removeItem(key: number) {
    setItems((prev) => (prev.length > 1 ? prev.filter((i) => i.key !== key) : prev));
  }

  function onProductSelect(key: number, productId: string) {
    const product = products.find((p) => p.id === productId);
    updateItem(key, {
      product_id: productId,
      description: product?.name ?? "",
      unit_price: product?.selling_price ?? 0,
    });
  }

  const serializedItems = JSON.stringify(
    items.map((i) => ({
      product_id: i.product_id,
      description: i.description,
      quantity: i.quantity,
      unit_price: i.unit_price,
    }))
  );

  const branchId = warehouses.find((w) => w.warehouseId === branchWarehouseId)?.branchId ?? "";

  return (
    <form action={formAction} className="flex flex-col gap-6">
      <input type="hidden" name="items" value={serializedItems} />
      <input type="hidden" name="taxTotal" value={taxTotal} />
      <input type="hidden" name="branchId" value={branchId} />
      <input type="hidden" name="warehouseId" value={branchWarehouseId} />

      <Card>
        <CardHeader title="Invoice details" />
        <div className="grid grid-cols-2 gap-4 p-4">
          <FormField label="Customer" htmlFor="customerId">
            <Select id="customerId" name="customerId">
              <option value="">Walk-in / no customer on file</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </FormField>
          <FormField label="Branch" htmlFor="branchWarehouseId" required>
            <Select
              id="branchWarehouseId"
              value={branchWarehouseId}
              onChange={(e) => setBranchWarehouseId(e.target.value)}
              required
            >
              {warehouses.map((w) => (
                <option key={w.warehouseId} value={w.warehouseId}>
                  {w.branchName}
                </option>
              ))}
            </Select>
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
                  <Select
                    id={`product-${item.key}`}
                    value={item.product_id}
                    onChange={(e) => onProductSelect(item.key, e.target.value)}
                  >
                    <option value="">Custom line</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} (${p.selling_price.toFixed(2)})
                      </option>
                    ))}
                  </Select>
                </FormField>
              </div>
              <div className="col-span-4">
                <FormField label="Description" htmlFor={`desc-${item.key}`}>
                  <Input
                    id={`desc-${item.key}`}
                    value={item.description}
                    onChange={(e) => updateItem(item.key, { description: e.target.value })}
                  />
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
                <FormField label="Price" htmlFor={`price-${item.key}`}>
                  <Input
                    id={`price-${item.key}`}
                    type="number"
                    min="0"
                    step="0.01"
                    value={item.unit_price}
                    onChange={(e) => updateItem(item.key, { unit_price: Number(e.target.value) })}
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
          Create invoice
        </Button>
      </div>
    </form>
  );
}
