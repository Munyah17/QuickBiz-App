"use client";

import { useActionState, useEffect, useState } from "react";
import { Plus, X } from "lucide-react";
import { Modal } from "@/components/Modal";
import { Button } from "@/components/Button";
import { Input, Select } from "@/components/Input";
import { FormField } from "@/components/FormField";
import { useToast } from "@/components/Toast";
import { createBomAction, initialBomActionState } from "./actions";
import type { ProductWithStock } from "@/services/products";

let rowId = 0;

function BomForm({ products, onClose }: { products: ProductWithStock[]; onClose: () => void }) {
  const [state, formAction, isPending] = useActionState(createBomAction, initialBomActionState);
  const { push } = useToast();
  const [rows, setRows] = useState(() => [{ key: rowId++ }]);

  useEffect(() => {
    if (state.success) {
      push("Bill of materials created");
      onClose();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.success]);

  return (
    <Modal open onClose={onClose} title="New bill of materials">
      <form action={formAction} className="flex flex-col gap-4">
        <FormField label="BOM name" htmlFor="name" required>
          <Input id="name" name="name" required placeholder="e.g. Standard build" />
        </FormField>

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

        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium text-text-secondary">Components</span>
          {rows.map((row, i) => (
            <div key={row.key} className="flex items-end gap-2">
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
              <div className="w-28">
                <Input name="quantityPerUnit" type="number" min="0" step="0.0001" placeholder="Qty" />
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
