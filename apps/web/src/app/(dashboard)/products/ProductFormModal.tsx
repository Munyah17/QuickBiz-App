"use client";

import { useActionState, useEffect } from "react";
import { Modal } from "@/components/Modal";
import { Button } from "@/components/Button";
import { Input, Textarea } from "@/components/Input";
import { FormField } from "@/components/FormField";
import { useToast } from "@/components/Toast";
import { createProductAction, updateProductAction, initialProductActionState } from "./actions";
import type { ProductWithStock } from "@/services/products";

export function ProductFormModal({
  open,
  onClose,
  product,
}: {
  open: boolean;
  onClose: () => void;
  product?: ProductWithStock;
}) {
  const isEdit = !!product;
  const action = isEdit ? updateProductAction : createProductAction;
  const [state, formAction, isPending] = useActionState(action, initialProductActionState);
  const { push } = useToast();

  useEffect(() => {
    if (state.success) {
      push(isEdit ? "Product updated" : "Product created");
      onClose();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.success]);

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? `Edit ${product.name}` : "New product"}>
      <form action={formAction} className="flex flex-col gap-4">
        {isEdit && <input type="hidden" name="productId" value={product.id} />}

        <div className="grid grid-cols-2 gap-4">
          <FormField label="Product name" htmlFor="name" required>
            <Input id="name" name="name" required defaultValue={product?.name} />
          </FormField>
          <FormField label="SKU" htmlFor="sku" required>
            <Input id="sku" name="sku" required defaultValue={product?.sku} />
          </FormField>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField label="Category" htmlFor="categoryName" hint="Type a new one to create it">
            <Input id="categoryName" name="categoryName" defaultValue={product?.categoryName ?? ""} />
          </FormField>
          <FormField label="Barcode" htmlFor="barcode" hint="Scan or type it — POS looks items up by this">
            <Input id="barcode" name="barcode" defaultValue={product?.barcode ?? ""} />
          </FormField>
        </div>

        <FormField label="Description" htmlFor="description">
          <Textarea id="description" name="description" defaultValue={product?.description ?? ""} />
        </FormField>

        <div className="grid grid-cols-3 gap-4">
          <FormField label="Cost price" htmlFor="cost_price">
            <Input id="cost_price" name="cost_price" type="number" step="0.01" min="0" defaultValue={product?.cost_price ?? 0} />
          </FormField>
          <FormField label="Selling price" htmlFor="selling_price">
            <Input
              id="selling_price"
              name="selling_price"
              type="number"
              step="0.01"
              min="0"
              defaultValue={product?.selling_price ?? 0}
            />
          </FormField>
          <FormField label="Unit" htmlFor="unit_of_measure">
            <Input id="unit_of_measure" name="unit_of_measure" defaultValue={product?.unit_of_measure ?? "each"} />
          </FormField>
        </div>

        <FormField label="Reorder level" htmlFor="reorder_level" hint="Low-stock threshold">
          <Input
            id="reorder_level"
            name="reorder_level"
            type="number"
            step="0.01"
            min="0"
            defaultValue={product?.reorder_level ?? 0}
          />
        </FormField>

        {state.error && <p className="text-sm text-danger-600">{state.error}</p>}

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={isPending}>
            {isEdit ? "Save changes" : "Create product"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
