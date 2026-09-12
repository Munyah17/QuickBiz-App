"use client";

import { useActionState, useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { Modal } from "@/components/Modal";
import { Button } from "@/components/Button";
import { Input, Select, Textarea } from "@/components/Input";
import { FormField } from "@/components/FormField";
import { useToast } from "@/components/Toast";
import { createInspectionAction, initialSheqActionState } from "./actions";

const INSPECTION_TYPES = ["safety", "health", "environmental", "quality", "fire", "equipment", "housekeeping"];

function NewInspectionForm({ onClose }: { onClose: () => void }) {
  const [state, formAction, isPending] = useActionState(createInspectionAction, initialSheqActionState);
  const { push } = useToast();

  useEffect(() => {
    if (state.success) {
      push("Inspection scheduled");
      onClose();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.success]);

  return (
    <Modal open onClose={onClose} title="Schedule Inspection">
      <form action={formAction} className="flex flex-col gap-4">
        <FormField label="Inspection Type" htmlFor="inspectionType">
          <Select id="inspectionType" name="inspectionType" defaultValue={INSPECTION_TYPES[0]}>
            {INSPECTION_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </Select>
        </FormField>

        <FormField label="Title" htmlFor="title">
          <Input id="title" name="title" required />
        </FormField>

        <FormField label="Scheduled Date" htmlFor="scheduledDate">
          <Input id="scheduledDate" name="scheduledDate" type="date" required />
        </FormField>

        <FormField label="Description" htmlFor="description">
          <Textarea id="description" name="description" />
        </FormField>

        {state.error && <p className="text-sm text-danger-600">{state.error}</p>}

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={isPending}>
            Schedule Inspection
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export function NewInspectionModal() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="size-4" />
        Schedule Inspection
      </Button>
      {open && <NewInspectionForm onClose={() => setOpen(false)} />}
    </>
  );
}
