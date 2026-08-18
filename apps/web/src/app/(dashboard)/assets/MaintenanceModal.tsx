"use client";

import { useActionState, useEffect, useState } from "react";
import { Wrench } from "lucide-react";
import { Modal } from "@/components/Modal";
import { Button } from "@/components/Button";
import { Input, Textarea } from "@/components/Input";
import { FormField } from "@/components/FormField";
import { useToast } from "@/components/Toast";
import { recordMaintenanceAction, initialAssetActionState } from "./actions";

function MaintenanceForm({ assetId, assetName, onClose }: { assetId: string; assetName: string; onClose: () => void }) {
  const [state, formAction, isPending] = useActionState(recordMaintenanceAction, initialAssetActionState);
  const { push } = useToast();
  const today = new Date().toISOString().slice(0, 10);

  useEffect(() => {
    if (state.success) {
      push("Maintenance logged");
      onClose();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.success]);

  return (
    <Modal open onClose={onClose} title={`Log maintenance: ${assetName}`}>
      <form action={formAction} className="flex flex-col gap-4">
        <input type="hidden" name="assetId" value={assetId} />

        <FormField label="Description" htmlFor="description" required>
          <Textarea id="description" name="description" required />
        </FormField>

        <div className="grid grid-cols-2 gap-4">
          <FormField label="Cost" htmlFor="cost">
            <Input id="cost" name="cost" type="number" min="0" step="0.01" defaultValue={0} />
          </FormField>
          <FormField label="Date" htmlFor="maintenanceDate">
            <Input id="maintenanceDate" name="maintenanceDate" type="date" defaultValue={today} />
          </FormField>
        </div>

        {state.error && <p className="text-sm text-danger-600">{state.error}</p>}

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={isPending}>
            Log maintenance
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export function MaintenanceModal({ assetId, assetName }: { assetId: string; assetName: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} title="Log maintenance" className="text-text-tertiary hover:text-primary-600">
        <Wrench className="size-4" />
      </button>
      {open && <MaintenanceForm assetId={assetId} assetName={assetName} onClose={() => setOpen(false)} />}
    </>
  );
}
