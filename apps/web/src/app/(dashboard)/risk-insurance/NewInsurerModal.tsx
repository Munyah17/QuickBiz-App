"use client";

import { useActionState, useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { Modal } from "@/components/Modal";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { FormField } from "@/components/FormField";
import { useToast } from "@/components/Toast";
import { createInsurerAction, initialRiskInsuranceActionState } from "./actions";

function NewInsurerForm({ onClose }: { onClose: () => void }) {
  const [state, formAction, isPending] = useActionState(createInsurerAction, initialRiskInsuranceActionState);
  const { push } = useToast();

  useEffect(() => {
    if (state.success) {
      push("Insurer added");
      onClose();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.success]);

  return (
    <Modal open onClose={onClose} title="Add Insurer">
      <form action={formAction} className="flex flex-col gap-4">
        <FormField label="Name" htmlFor="name">
          <Input id="name" name="name" required />
        </FormField>

        <FormField label="Code" htmlFor="code">
          <Input id="code" name="code" required />
        </FormField>

        <FormField label="Contact Person" htmlFor="contactPerson">
          <Input id="contactPerson" name="contactPerson" />
        </FormField>

        <FormField label="Email" htmlFor="email">
          <Input id="email" name="email" type="email" />
        </FormField>

        <FormField label="Phone" htmlFor="phone">
          <Input id="phone" name="phone" />
        </FormField>

        <FormField label="Address" htmlFor="address">
          <Input id="address" name="address" />
        </FormField>

        {state.error && <p className="text-sm text-danger-600">{state.error}</p>}

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={isPending}>
            Add Insurer
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export function NewInsurerModal() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="secondary" onClick={() => setOpen(true)}>
        <Plus className="size-4" />
        Add Insurer
      </Button>
      {open && <NewInsurerForm onClose={() => setOpen(false)} />}
    </>
  );
}
