"use client";

import { useActionState, useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { Modal } from "@/components/Modal";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { FormField } from "@/components/FormField";
import { useToast } from "@/components/Toast";
import { createTenderAction, initialTenderActionState } from "./actions";

function NewTenderForm({ onClose }: { onClose: () => void }) {
  const [state, formAction, isPending] = useActionState(createTenderAction, initialTenderActionState);
  const { push } = useToast();

  useEffect(() => {
    if (state.success) {
      push("Tender created");
      onClose();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.success]);

  return (
    <Modal open onClose={onClose} title="New Tender">
      <form action={formAction} className="flex flex-col gap-4">
        <FormField label="Tender Number" htmlFor="tenderNumber">
          <Input id="tenderNumber" name="tenderNumber" required />
        </FormField>

        <FormField label="Title" htmlFor="title">
          <Input id="title" name="title" required />
        </FormField>

        <FormField label="Description" htmlFor="description">
          <Input id="description" name="description" />
        </FormField>

        <FormField label="Category" htmlFor="category">
          <Input id="category" name="category" />
        </FormField>

        <FormField label="Budget" htmlFor="budget">
          <Input id="budget" name="budget" type="number" step="0.01" min={0} />
        </FormField>

        <FormField label="Closing Date" htmlFor="closingDate">
          <Input id="closingDate" name="closingDate" type="date" required />
        </FormField>

        {state.error && <p className="text-sm text-danger-600">{state.error}</p>}

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={isPending}>
            Create Tender
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export function NewTenderModal() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="size-4" />
        New Tender
      </Button>
      {open && <NewTenderForm onClose={() => setOpen(false)} />}
    </>
  );
}
