"use client";

import { useActionState, useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { Modal } from "@/components/Modal";
import { Button } from "@/components/Button";
import { Input, Select, Textarea } from "@/components/Input";
import { FormField } from "@/components/FormField";
import { useToast } from "@/components/Toast";
import { createAssetAction, initialAssetActionState } from "./actions";

function AssetForm({ branches, onClose }: { branches: Array<{ id: string; name: string }>; onClose: () => void }) {
  const [state, formAction, isPending] = useActionState(createAssetAction, initialAssetActionState);
  const { push } = useToast();

  useEffect(() => {
    if (state.success) {
      push("Asset added");
      onClose();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.success]);

  return (
    <Modal open onClose={onClose} title="New asset">
      <form action={formAction} className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Name" htmlFor="name" required>
            <Input id="name" name="name" required placeholder="e.g. Dell Latitude Laptop" />
          </FormField>
          <FormField label="Category" htmlFor="category">
            <Select id="category" name="category" defaultValue="equipment">
              <option value="equipment">Equipment</option>
              <option value="computer">Computer</option>
              <option value="furniture">Furniture</option>
              <option value="other">Other</option>
            </Select>
          </FormField>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField label="Purchase date" htmlFor="purchaseDate">
            <Input id="purchaseDate" name="purchaseDate" type="date" />
          </FormField>
          <FormField label="Branch" htmlFor="branchId">
            <Select id="branchId" name="branchId">
              <option value="">No branch</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </Select>
          </FormField>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField label="Purchase cost" htmlFor="purchaseCost">
            <Input id="purchaseCost" name="purchaseCost" type="number" min="0" step="0.01" defaultValue={0} />
          </FormField>
          <FormField label="Useful life (years)" htmlFor="usefulLifeYears" hint="For straight-line depreciation">
            <Input id="usefulLifeYears" name="usefulLifeYears" type="number" min="1" step="0.5" defaultValue={5} />
          </FormField>
        </div>

        <FormField label="Location" htmlFor="location">
          <Input id="location" name="location" placeholder="e.g. Head Office, 2nd floor" />
        </FormField>

        <FormField label="Notes" htmlFor="notes">
          <Textarea id="notes" name="notes" />
        </FormField>

        {state.error && <p className="text-sm text-danger-600">{state.error}</p>}

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={isPending}>
            Add asset
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export function NewAssetModal({ branches }: { branches: Array<{ id: string; name: string }> }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="size-4" />
        New Asset
      </Button>
      {open && <AssetForm branches={branches} onClose={() => setOpen(false)} />}
    </>
  );
}
