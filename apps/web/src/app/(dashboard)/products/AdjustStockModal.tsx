"use client";

import { useActionState, useEffect } from "react";
import { Modal } from "@/components/Modal";
import { Button } from "@/components/Button";
import { Input, Select } from "@/components/Input";
import { FormField } from "@/components/FormField";
import { useToast } from "@/components/Toast";
import { adjustStockAction, initialProductActionState } from "./actions";
import type { ProductWithStock, BranchWarehouse } from "@/services/products";

export function AdjustStockModal({
  open,
  onClose,
  product,
  warehouses,
}: {
  open: boolean;
  onClose: () => void;
  product: ProductWithStock;
  warehouses: BranchWarehouse[];
}) {
  const [state, formAction, isPending] = useActionState(adjustStockAction, initialProductActionState);
  const { push } = useToast();

  useEffect(() => {
    if (state.success) {
      push("Stock adjusted");
      onClose();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.success]);

  return (
    <Modal open={open} onClose={onClose} title={`Adjust stock: ${product.name}`}>
      <form action={formAction} className="flex flex-col gap-4">
        <input type="hidden" name="productId" value={product.id} />

        <FormField label="Branch" htmlFor="warehouseId" required>
          <Select id="warehouseId" name="warehouseId" required defaultValue={warehouses[0]?.warehouseId}>
            {warehouses.map((w) => (
              <option key={w.warehouseId} value={w.warehouseId}>
                {w.branchName}
              </option>
            ))}
          </Select>
        </FormField>

        <FormField
          label="Quantity change"
          htmlFor="quantityDelta"
          required
          hint="Positive to add stock, negative to remove (e.g. -5 for damaged goods)."
        >
          <Input id="quantityDelta" name="quantityDelta" type="number" step="0.01" required />
        </FormField>

        <FormField label="Reason / reference" htmlFor="reference" hint="Optional">
          <Input id="reference" name="reference" placeholder="e.g. Stock count correction" />
        </FormField>

        {state.error && <p className="text-sm text-danger-600">{state.error}</p>}

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={isPending}>
            Apply adjustment
          </Button>
        </div>
      </form>
    </Modal>
  );
}
