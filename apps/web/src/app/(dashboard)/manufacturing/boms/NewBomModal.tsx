"use client";

import { useActionState, useState } from "react";
import { Plus, X } from "lucide-react";
import { Modal } from "@/components/Modal";
import { Button } from "@/components/Button";
import { Input, Select, Textarea } from "@/components/Input";
import { FormField } from "@/components/FormField";
import { createBomAction, initialBomActionState } from "./actions";
import type { ProductWithStock } from "@/services/products";

let rowId = 0;

function BomForm({ products, onClose }: { products: ProductWithStock[]; onClose: () => void }) {
  const [state, formAction, isPending] = useActionState(createBomAction, initialBomActionState);
  const [rows, setRows] = useState(() => [{ key: rowId++ }]);

  return (
    <Modal open onClose={onClose} title="New bill of materials">
      <form action={formAction} className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-4">
          <FormField label="BOM name" htmlFor="name" required>
            <Input id="name" name="name" required placeholder="e.g. Standard build" />
          </FormField>
          <FormField label="Revision" htmlFor="revision" hint="e.g. A, B, 2026-1">
            <Input id="revision" name="revision" defaultValue="A" />
          </FormField>
        </div>

        <FormField label="Finished product" htmlFor="productId" required>
          <Select id="productId" name="productId" required defaultValue="">
            <option value="" disabled>
              Choose the product this BOM builds
            </option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.sku})
              </option>
            ))}
          </Select>
        </FormField>

        <FormField label="Description" htmlFor="description" hint="Optional, e.g. process notes or intended use">
          <Textarea id="description" name="description" rows={2} />
        </FormField>

        <div className="grid grid-cols-3 gap-4">
          <FormField label="Yield quantity" htmlFor="yieldQuantity" required hint="Finished units per batch">
            <Input id="yieldQuantity" name="yieldQuantity" type="number" min="0.0001" step="0.0001" defaultValue={1} required />
          </FormField>
          <FormField label="Labor cost" htmlFor="laborCost" hint="Per batch">
            <Input id="laborCost" name="laborCost" type="number" min="0" step="0.01" defaultValue={0} />
          </FormField>
          <FormField label="Overhead cost" htmlFor="overheadCost" hint="Per batch">
            <Input id="overheadCost" name="overheadCost" type="number" min="0" step="0.01" defaultValue={0} />
          </FormField>
        </div>

        <div className="flex flex-col gap-3">
          <span className="text-sm font-medium text-text-secondary">Components</span>
          {rows.map((row, i) => (
            <div key={row.key} className="flex flex-col gap-2 rounded-md border border-border-subtle p-3">
              <div className="flex items-end gap-2">
                <div className="flex-1">
                  <Select name="componentProductId" defaultValue="">
                    <option value="" disabled>
                      Component product
                    </option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.sku})
                      </option>
                    ))}
                  </Select>
                </div>
                <div className="w-24">
                  <Input name="quantityPerUnit" type="number" min="0" step="0.0001" placeholder="Qty" />
                </div>
                <div className="w-24">
                  <Input name="wastagePercent" type="number" min="0" max="99" step="0.1" placeholder="Waste %" defaultValue={0} />
                </div>
                <button
                  type="button"
                  onClick={() => setRows((r) => (r.length > 1 ? r.filter((_, idx) => idx !== i) : r))}
                  className="mb-1.5 rounded-md p-2 text-text-tertiary hover:bg-workspace hover:text-danger-600"
                  aria-label="Remove component"
                >
                  <X className="size-4" />
                </button>
              </div>
              <Input name="componentNotes" placeholder="Notes for this line, e.g. grade, substitute allowed" />
            </div>
          ))}
          <Button type="button" variant="secondary" onClick={() => setRows((r) => [...r, { key: rowId++ }])}>
            <Plus className="size-4" />
            Add component
          </Button>
        </div>

        {state.error && <p className="text-sm text-danger-600">{state.error}</p>}

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={isPending}>
            Create BOM
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export function NewBomModal({ products }: { products: ProductWithStock[] }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="size-4" />
        New BOM
      </Button>
      {open && <BomForm products={products} onClose={() => setOpen(false)} />}
    </>
  );
}
