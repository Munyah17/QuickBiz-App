"use client";

import { useActionState, useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { Modal } from "@/components/Modal";
import { Button } from "@/components/Button";
import { Input, Select } from "@/components/Input";
import { FormField } from "@/components/FormField";
import { useToast } from "@/components/Toast";
import { createStockTakeAction, initialStockTakeActionState } from "./actions";

const COUNT_TYPES = ["full", "partial", "cycle", "spot"];

function NewStockTakeForm({ onClose }: { onClose: () => void }) {
  const [state, formAction, isPending] = useActionState(createStockTakeAction, initialStockTakeActionState);
  const { push } = useToast();

  useEffect(() => {
    if (state.success) {
      push("Stock take started");
      onClose();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.success]);

  return (
    <Modal open onClose={onClose} title="New Stock Take">
      <form action={formAction} className="flex flex-col gap-4">
        <FormField label="Title" htmlFor="title">
          <Input id="title" name="title" required />
        </FormField>

        <FormField label="Scheduled Date" htmlFor="scheduledDate">
          <Input id="scheduledDate" name="scheduledDate" type="date" required />
        </FormField>

        <FormField label="Count Type" htmlFor="countType">
          <Select id="countType" name="countType" defaultValue="full">
            {COUNT_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </Select>
        </FormField>

        <FormField label="Description" htmlFor="description">
          <Input id="description" name="description" />
        </FormField>

        <p className="text-sm text-text-tertiary">
          Starting a stock take immediately loads a count line for every active product at its current system quantity.
        </p>

        {state.error && <p className="text-sm text-danger-600">{state.error}</p>}

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={isPending}>
            Start Stock Take
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export function NewStockTakeModal() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="size-4" />
        New Stock Take
      </Button>
      {open && <NewStockTakeForm onClose={() => setOpen(false)} />}
    </>
  );
}
