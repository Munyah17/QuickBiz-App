"use client";

import { useActionState, useMemo, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Card, CardHeader } from "@/components/Card";
import { Button } from "@/components/Button";
import { Input, Select, Textarea } from "@/components/Input";
import { FormField } from "@/components/FormField";
import { createInvoiceAction, updateDraftInvoiceAction, initialSalesActionState } from "../actions";
import type { Customer } from "@/services/customers";
import type { ProductWithStock, BranchWarehouse } from "@/services/products";
import type { SalesDocType } from "@/services/sales";

interface LineItem {
  key: number;
  product_id: string;
  description: string;
  quantity: number;
  unit_price: number;
}

export interface DraftInvoiceInitial {
  invoiceId: string;
  docType: SalesDocType;
  customerId: string | null;
  warehouseId: string | null;
  dueDate: string | null;
  discountTotal: number;
  discountReason: string | null;
  notes: string | null;
  items: Array<{ product_id: string | null; description: string; quantity: number; unit_price: number }>;
}

let nextKey = 1;

function plusDays(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export function NewInvoiceForm({
  customers,
  products,
  warehouses,
  taxRatePercent,
  initial,
}: {
  customers: Customer[];
  products: ProductWithStock[];
  warehouses: BranchWarehouse[];
  taxRatePercent: number;
  initial?: DraftInvoiceInitial;
}) {
  const [state, formAction, isPending] = useActionState(
    initial ? updateDraftInvoiceAction : createInvoiceAction,
    initialSalesActionState
  );
  const [branchWarehouseId, setBranchWarehouseId] = useState(initial?.warehouseId ?? warehouses[0]?.warehouseId ?? "");
  const [customerId, setCustomerId] = useState(initial?.customerId ?? "");
  const [dueDate, setDueDate] = useState(initial?.dueDate ?? plusDays(30));
  const [discountTotal, setDiscountTotal] = useState(initial?.discountTotal ?? 0);
  const [discountReason, setDiscountReason] = useState(initial?.discountReason ?? "");
  const [items, setItems] = useState<LineItem[]>(
    initial && initial.items.length > 0
      ? initial.items.map((i) => ({
          key: nextKey++,
          product_id: i.product_id ?? "",
          description: i.description,
          quantity: i.quantity,
          unit_price: i.unit_price,
        }))
      : [{ key: nextKey++, product_id: "", description: "", quantity: 1, unit_price: 0 }]
  );

  const selectedCustomer = customers.find((c) => c.id === customerId);

  const subtotal = useMemo(() => items.reduce((sum, i) => sum + i.quantity * i.unit_price, 0), [items]);
  const taxTotal = useMemo(() => Math.round(subtotal * (taxRatePercent / 100) * 100) / 100, [subtotal, taxRatePercent]);
  const total = subtotal + taxTotal - discountTotal;

  function onCustomerChange(id: string) {
    setCustomerId(id);
    const terms = customers.find((c) => c.id === id)?.payment_terms_days;
    if (terms != null) setDueDate(plusDays(terms));
  }

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
      {initial && <input type="hidden" name="invoiceId" value={initial.invoiceId} />}
      <input type="hidden" name="items" value={serializedItems} />
      <input type="hidden" name="taxTotal" value={taxTotal} />
      <input type="hidden" name="discountTotal" value={discountTotal} />
      <input type="hidden" name="discountReason" value={discountReason} />
      <input type="hidden" name="branchId" value={branchId} />
      <input type="hidden" name="warehouseId" value={branchWarehouseId} />

      <Card>
        <CardHeader title="Invoice details" />
        <div className="grid grid-cols-2 gap-4 p-4">
          <FormField label="Customer" htmlFor="customerId">
            <Select id="customerId" name="customerId" value={customerId} onChange={(e) => onCustomerChange(e.target.value)}>
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
          <FormField
            label="Due date"
            htmlFor="dueDate"
            hint={selectedCustomer?.payment_terms_days != null ? `Customer terms: Net ${selectedCustomer.payment_terms_days}` : "Defaults to Net 30"}
          >
            <Input id="dueDate" name="dueDate" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          </FormField>
          <FormField label="Discount" htmlFor="discountTotal" hint={discountReason ? undefined : "Reason is optional"}>
            <Input
              id="discountTotal"
              type="number"
              min="0"
              step="0.01"
              value={discountTotal}
              onChange={(e) => setDiscountTotal(Math.max(0, Number(e.target.value)))}
            />
          </FormField>
          {discountTotal > 0 && (
            <div className="col-span-2">
              <FormField label="Discount reason" htmlFor="discountReason">
                <Input
                  id="discountReason"
                  value={discountReason}
                  onChange={(e) => setDiscountReason(e.target.value)}
                  placeholder="e.g. Loyal customer, promo, negotiated"
                />
              </FormField>
            </div>
          )}
          {selectedCustomer?.credit_limit != null && (
            <div className="col-span-2 rounded-md bg-primary-50 px-3 py-2 text-xs text-primary-700">
              {selectedCustomer.name} has a credit limit of ${selectedCustomer.credit_limit.toFixed(2)} — issuing this invoice checks the open balance against it.
            </div>
          )}
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
            {discountTotal > 0 && (
              <div className="flex justify-between text-text-secondary">
                <span>Discount</span>
                <span>-${discountTotal.toFixed(2)}</span>
              </div>
            )}
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
        <Textarea id="notes" name="notes" placeholder="Optional" defaultValue={initial?.notes ?? undefined} />
      </FormField>

      {state.error && <p className="text-sm text-danger-600">{state.error}</p>}

      {initial ? (
        <div className="flex justify-end gap-2">
          <Button type="submit" loading={isPending}>
            Save changes
          </Button>
        </div>
      ) : (
        <div className="flex justify-end gap-2">
          <Button type="submit" name="saveAs" value="draft" variant="secondary" loading={isPending}>
            Save as draft
          </Button>
          <Button type="submit" name="saveAs" value="quote" variant="secondary" loading={isPending}>
            Save as quotation
          </Button>
          <Button type="submit" name="saveAs" value="issued" loading={isPending}>
            Issue invoice
          </Button>
        </div>
      )}
    </form>
  );
}
