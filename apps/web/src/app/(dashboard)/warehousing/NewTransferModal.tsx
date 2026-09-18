"use client";

import { useActionState, useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Modal } from "@/components/Modal";
import { Button } from "@/components/Button";
import { Input, Select, Textarea } from "@/components/Input";
import { FormField } from "@/components/FormField";
import { useToast } from "@/components/Toast";
import { createTransferAction, initialWarehousingActionState } from "./actions";
import type { WarehouseRow } from "@/services/warehousing";
import type { ProductWithStock } from "@/services/products";

interface Line {
  key: number;
  product_id: string;
  quantity: number;
}

let nextKey = 1;

export function NewTransferModal({
  warehouses,
  products,
  onClose,
}: {
  warehouses: WarehouseRow[];
  products: ProductWithStock[];
  onClose: () => void;
}) {
  const [state, formAction, isPending] = useActionState(createTransferAction, initialWarehousingActionState);
  const [fromWarehouseId, setFromWarehouseId] = useState("");
  const [toWarehouseId, setToWarehouseId] = useState("");
  const [lines, setLines] = useState<Line[]>([{ key: nextKey++, product_id: "", quantity: 1 }]);
  const { push } = useToast();

  useEffect(() => {
    if (state.success) {
      push("Transfer created — dispatch it when stock leaves");
      onClose();
    }
    if (state.error) push(state.error, "error");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.success, state.error]);

  const sourceProducts = products.filter((p) => p.is_active);

  function updateLine(key: number, patch: Partial<Line>) {
    setLines((prev) => prev.map((l) => (l.key === key ? { ...l, ...patch } : l)));
  }

  const serializedItems = JSON.stringify(
    lines.filter((l) => l.product_id && l.quantity > 0).map((l) => ({ product_id: l.product_id, quantity: l.quantity }))
  );

  return (
    <Modal open onClose={onClose} title="New stock transfer">
      <form action={formAction} className="flex flex-col gap-4">
        <input type="hidden" name="items" value={serializedItems} />

        <div className="grid grid-cols-2 gap-4">
          <FormField label="From warehouse" htmlFor="fromWarehouseId" required>
            <Select
              id="fromWarehouseId"
              name="fromWarehouseId"
              value={fromWarehouseId}
              onChange={(e) => setFromWarehouseId(e.target.value)}
              required
            >
              <option value="">Choose…</option>
              {warehouses.map((w) => (
                <option key={w.id} value={w.id} disabled={w.id === toWarehouseId}>
                  {w.name}
                </option>
              ))}
            </Select>
          </FormField>
          <FormField label="To warehouse" htmlFor="toWarehouseId" required>
            <Select
              id="toWarehouseId"
              name="toWarehouseId"
              value={toWarehouseId}
              onChange={(e) => setToWarehouseId(e.target.value)}
              required
            >
              <option value="">Choose…</option>
              {warehouses.map((w) => (
                <option key={w.id} value={w.id} disabled={w.id === fromWarehouseId}>
                  {w.name}
                </option>
              ))}
            </Select>
          </FormField>
        </div>

        <div className="flex flex-col gap-2">
          {lines.map((line) => (
            <div key={line.key} className="flex items-end gap-2">
              <div className="flex-1">
                <FormField label="Product" htmlFor={`tp-${line.key}`}>
                  <Select
                    id={`tp-${line.key}`}
                    value={line.product_id}
                    onChange={(e) => updateLine(line.key, { product_id: e.target.value })}
                  >
                    <option value="">Choose product…</option>
                    {sourceProducts.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.totalStock} in stock)
                      </option>
                    ))}
                  </Select>
                </FormField>
              </div>
              <div className="w-24">
                <FormField label="Qty" htmlFor={`tq-${line.key}`}>
                  <Input
                    id={`tq-${line.key}`}
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={line.quantity}
                    onChange={(e) => updateLine(line.key, { quantity: Number(e.target.value) })}
                  />
                </FormField>
              </div>
              <button
                type="button"
                onClick={() => setLines((prev) => (prev.length > 1 ? prev.filter((l) => l.key !== line.key) : prev))}
                disabled={lines.length === 1}
                className="pb-2 text-text-tertiary hover:text-danger-600 disabled:opacity-30"
              >
                <Trash2 className="size-4" />
              </button>
            </div>
          ))}
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => setLines((prev) => [...prev, { key: nextKey++, product_id: "", quantity: 1 }])}
            className="w-fit"
          >
            <Plus className="size-4" />
            Add line
          </Button>
        </div>

        <FormField label="Notes" htmlFor="notes" hint="Optional">
          <Textarea id="notes" name="notes" placeholder="e.g. Restock Bulawayo for weekend promo" />
        </FormField>

        {state.error && <p className="text-sm text-danger-600">{state.error}</p>}

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={isPending} disabled={!fromWarehouseId || !toWarehouseId}>
            Create transfer
          </Button>
        </div>
      </form>
    </Modal>
  );
}
