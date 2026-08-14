"use client";

import { useActionState, useEffect } from "react";
import { Modal } from "@/components/Modal";
import { Button } from "@/components/Button";
import { Input, Select } from "@/components/Input";
import { FormField } from "@/components/FormField";
import { useToast } from "@/components/Toast";
import { createCustomerAction, updateCustomerAction, initialCustomerActionState } from "./actions";
import type { Customer } from "@/services/customers";

export function CustomerFormModal({
  open,
  onClose,
  customer,
}: {
  open: boolean;
  onClose: () => void;
  customer?: Customer;
}) {
  const isEdit = !!customer;
  const action = isEdit ? updateCustomerAction : createCustomerAction;
  const [state, formAction, isPending] = useActionState(action, initialCustomerActionState);
  const { push } = useToast();

  useEffect(() => {
    if (state.success) {
      push(isEdit ? "Customer updated" : "Customer created");
      onClose();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.success]);

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? `Edit ${customer.name}` : "New customer"}>
      <form action={formAction} className="flex flex-col gap-4">
        {isEdit && <input type="hidden" name="customerId" value={customer.id} />}

        <div className="grid grid-cols-2 gap-4">
          <FormField label="Name" htmlFor="name" required>
            <Input id="name" name="name" required defaultValue={customer?.name} />
          </FormField>
          <FormField label="Type" htmlFor="customer_type">
            <Select id="customer_type" name="customer_type" defaultValue={customer?.customer_type ?? "business"}>
              <option value="business">Business</option>
              <option value="individual">Individual</option>
            </Select>
          </FormField>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField label="Email" htmlFor="email">
            <Input id="email" name="email" type="email" defaultValue={customer?.email ?? ""} />
          </FormField>
          <FormField label="Phone" htmlFor="phone">
            <Input id="phone" name="phone" defaultValue={customer?.phone ?? ""} />
          </FormField>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField label="City" htmlFor="city">
            <Input id="city" name="city" defaultValue={customer?.address?.city ?? ""} />
          </FormField>
          <FormField label="Country" htmlFor="country">
            <Input id="country" name="country" defaultValue={customer?.address?.country ?? "Zimbabwe"} />
          </FormField>
        </div>

        <FormField label="Tax number" htmlFor="tax_number" hint="Optional">
          <Input id="tax_number" name="tax_number" defaultValue={customer?.tax_number ?? ""} />
        </FormField>

        {state.error && <p className="text-sm text-danger-600">{state.error}</p>}

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={isPending}>
            {isEdit ? "Save changes" : "Create customer"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
