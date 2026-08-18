"use client";

import { useActionState, useEffect } from "react";
import { Modal } from "@/components/Modal";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { FormField } from "@/components/FormField";
import { useToast } from "@/components/Toast";
import { createSupplierAction, updateSupplierAction, initialSupplierActionState } from "./actions";
import type { Supplier } from "@/services/purchasing";

export function SupplierFormModal({ open, onClose, supplier }: { open: boolean; onClose: () => void; supplier?: Supplier }) {
  const isEdit = !!supplier;
  const action = isEdit ? updateSupplierAction : createSupplierAction;
  const [state, formAction, isPending] = useActionState(action, initialSupplierActionState);
  const { push } = useToast();

  useEffect(() => {
    if (state.success) {
      push(isEdit ? "Supplier updated" : "Supplier created");
      onClose();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.success]);

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? `Edit ${supplier.name}` : "New supplier"}>
      <form action={formAction} className="flex flex-col gap-4">
        {isEdit && <input type="hidden" name="supplierId" value={supplier.id} />}

        <FormField label="Name" htmlFor="name" required>
          <Input id="name" name="name" required defaultValue={supplier?.name} />
        </FormField>

        <div className="grid grid-cols-2 gap-4">
          <FormField label="Email" htmlFor="email">
            <Input id="email" name="email" type="email" defaultValue={supplier?.email ?? ""} />
          </FormField>
          <FormField label="Phone" htmlFor="phone">
            <Input id="phone" name="phone" defaultValue={supplier?.phone ?? ""} />
          </FormField>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField label="City" htmlFor="city">
            <Input id="city" name="city" defaultValue={supplier?.address?.city ?? ""} />
          </FormField>
          <FormField label="Country" htmlFor="country">
            <Input id="country" name="country" defaultValue={supplier?.address?.country ?? "Zimbabwe"} />
          </FormField>
        </div>

        <FormField label="Tax number" htmlFor="tax_number" hint="Optional">
          <Input id="tax_number" name="tax_number" defaultValue={supplier?.tax_number ?? ""} />
        </FormField>

        {state.error && <p className="text-sm text-danger-600">{state.error}</p>}

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={isPending}>
            {isEdit ? "Save changes" : "Create supplier"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
