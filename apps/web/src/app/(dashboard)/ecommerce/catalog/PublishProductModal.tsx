"use client";

import { useActionState, useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { Modal } from "@/components/Modal";
import { Button } from "@/components/Button";
import { Input, Select } from "@/components/Input";
import { FormField } from "@/components/FormField";
import { useToast } from "@/components/Toast";
import { publishOnlineProductAction, initialOnlineProductActionState } from "./actions";
import type { ProductWithStock } from "@/services/products";

function PublishForm({ products, onClose }: { products: ProductWithStock[]; onClose: () => void }) {
  const [state, formAction, isPending] = useActionState(publishOnlineProductAction, initialOnlineProductActionState);
  const { push } = useToast();
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);

  useEffect(() => {
    if (state.success) {
      push("Product published to online catalog");
      onClose();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.success]);

  return (
    <Modal open onClose={onClose} title="Publish product online">
      <form action={formAction} className="flex flex-col gap-4">
        <FormField label="Product" htmlFor="productId" required>
          <Select
            id="productId"
            name="productId"
            required
            defaultValue=""
            onChange={(e) => {
              if (!slugTouched) {
                const product = products.find((p) => p.id === e.target.value);
                if (product) setSlug(product.sku.toLowerCase());
              }
            }}
          >
            <option value="" disabled>
              Choose a product
            </option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.sku})
              </option>
            ))}
          </Select>
        </FormField>

        <FormField label="URL slug" htmlFor="slug" required>
          <Input
            id="slug"
            name="slug"
            required
            value={slug}
            onChange={(e) => {
              setSlug(e.target.value);
              setSlugTouched(true);
            }}
            placeholder="e.g. blue-hoodie"
          />
        </FormField>

        <FormField label="Online price (leave blank to use the product's selling price)" htmlFor="onlinePrice">
          <Input id="onlinePrice" name="onlinePrice" type="number" min="0" step="0.01" />
        </FormField>

        <label className="flex items-center gap-2 text-sm text-text-secondary">
          <input type="checkbox" name="isPublished" defaultChecked className="size-4 rounded border-border" />
          Published (visible in the online catalog)
        </label>

        {state.error && <p className="text-sm text-danger-600">{state.error}</p>}

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={isPending}>
            Publish
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export function PublishProductModal({ products }: { products: ProductWithStock[] }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="size-4" />
        Publish Product
      </Button>
      {open && <PublishForm products={products} onClose={() => setOpen(false)} />}
    </>
  );
}
