"use client";

import { useActionState, useEffect, useState } from "react";
import { Plus, X } from "lucide-react";
import { Modal } from "@/components/Modal";
import { Button } from "@/components/Button";
import { Input, Select, Textarea } from "@/components/Input";
import { FormField } from "@/components/FormField";
import { useToast } from "@/components/Toast";
import { createOnlineOrderAction, initialOnlineOrderActionState } from "./actions";
import type { Customer } from "@/services/customers";
import type { ProductWithStock, BranchWarehouse } from "@/services/products";

let rowId = 0;

function OrderForm({
  customers,
  products,
  warehouses,
  branchId,
  onClose,
}: {
  customers: Customer[];
  products: ProductWithStock[];
  warehouses: BranchWarehouse[];
  branchId: string;
  onClose: () => void;
}) {
  const [state, formAction, isPending] = useActionState(createOnlineOrderAction, initialOnlineOrderActionState);
  const { push } = useToast();
  const [rows, setRows] = useState(() => [{ key: rowId++ }]);
  const [buyerMode, setBuyerMode] = useState<"customer" | "guest">("customer");

  useEffect(() => {
    if (state.success) {
      push("Online order created");
      onClose();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.success]);

  return (
    <Modal open onClose={onClose} title="New online order">
      <form action={formAction} className="flex flex-col gap-4">
        <input type="hidden" name="branchId" value={branchId} />
        <div className="flex gap-4 text-sm">
          <label className="flex items-center gap-1.5">
            <input type="radio" checked={buyerMode === "customer"} onChange={() => setBuyerMode("customer")} />
            Existing customer
          </label>
          <label className="flex items-center gap-1.5">
            <input type="radio" checked={buyerMode === "guest"} onChange={() => setBuyerMode("guest")} />
            Guest buyer
          </label>
        </div>

        {buyerMode === "customer" ? (
          <FormField label="Customer" htmlFor="customerId">
            <Select id="customerId" name="customerId" defaultValue="">
              <option value="">Choose a customer</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </FormField>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Guest name" htmlFor="guestName">
              <Input id="guestName" name="guestName" />
            </FormField>
            <FormField label="Guest phone" htmlFor="guestPhone">
              <Input id="guestPhone" name="guestPhone" />
            </FormField>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <FormField label="Fulfil from warehouse" htmlFor="warehouseId">
            <Select id="warehouseId" name="warehouseId" defaultValue="">
              <option value="">No stock deduction</option>
              {warehouses.map((w) => (
                <option key={w.warehouseId} value={w.warehouseId}>
                  {w.branchName}
                </option>
              ))}
            </Select>
          </FormField>
          <FormField label="Delivery method" htmlFor="deliveryMethod">
            <Select id="deliveryMethod" name="deliveryMethod" defaultValue="pickup">
              <option value="pickup">Pickup</option>
              <option value="delivery">Delivery</option>
            </Select>
          </FormField>
        </div>

        <FormField label="Delivery address" htmlFor="deliveryAddress">
          <Input id="deliveryAddress" name="deliveryAddress" placeholder="Only needed for delivery orders" />
        </FormField>

        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium text-text-secondary">Items</span>
          {rows.map((row, i) => (
            <div key={row.key} className="flex items-end gap-2">
              <div className="flex-1">
                <Select
                  name="productId"
                  defaultValue=""
                  onChange={(e) => {
                    const form = e.target.closest("form");
                    const product = products.find((p) => p.id === e.target.value);
                    if (form && product) {
                      const priceInput = form.querySelectorAll<HTMLInputElement>('input[name="unitPrice"]')[i];
                      if (priceInput && !priceInput.value) priceInput.value = String(product.selling_price);
                    }
                  }}
                >
                  <option value="" disabled>
                    Product
                  </option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.sku})
                    </option>
                  ))}
                </Select>
              </div>
              <div className="w-24">
                <Input name="quantity" type="number" min="0" step="1" placeholder="Qty" />
              </div>
              <div className="w-28">
                <Input name="unitPrice" type="number" min="0" step="0.01" placeholder="Price" />
              </div>
              <button
                type="button"
                onClick={() => setRows((r) => (r.length > 1 ? r.filter((_, idx) => idx !== i) : r))}
                className="mb-1.5 rounded-md p-2 text-text-tertiary hover:bg-workspace hover:text-danger-600"
                aria-label="Remove item"
              >
                <X className="size-4" />
              </button>
            </div>
          ))}
          <Button type="button" variant="secondary" onClick={() => setRows((r) => [...r, { key: rowId++ }])}>
            <Plus className="size-4" />
            Add item
          </Button>
        </div>

        <FormField label="Notes" htmlFor="notes">
          <Textarea id="notes" name="notes" />
        </FormField>

        {state.error && <p className="text-sm text-danger-600">{state.error}</p>}

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={isPending}>
            Create order
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export function NewOnlineOrderModal({
  customers,
  products,
  warehouses,
  branchId,
}: {
  customers: Customer[];
  products: ProductWithStock[];
  warehouses: BranchWarehouse[];
  branchId: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="size-4" />
        New Order
      </Button>
      {open && (
        <OrderForm customers={customers} products={products} warehouses={warehouses} branchId={branchId} onClose={() => setOpen(false)} />
      )}
    </>
  );
}
