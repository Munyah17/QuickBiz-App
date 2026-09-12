"use client";

import { useActionState, useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { Modal } from "@/components/Modal";
import { Button } from "@/components/Button";
import { Select, Textarea } from "@/components/Input";
import { FormField } from "@/components/FormField";
import { useToast } from "@/components/Toast";
import { requestIbanAction, initialIbanActionState } from "./actions";

const CURRENCIES = ["EUR", "USD", "GBP", "ZAR"];

function IbanRequestForm({ onClose }: { onClose: () => void }) {
  const [state, formAction, isPending] = useActionState(requestIbanAction, initialIbanActionState);
  const { push } = useToast();

  useEffect(() => {
    if (state.success) {
      push("IBAN requested");
      onClose();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.success]);

  return (
    <Modal open onClose={onClose} title="Request IBAN">
      <form action={formAction} className="flex flex-col gap-4">
        <FormField label="Currency" htmlFor="currency">
          <Select id="currency" name="currency" defaultValue="EUR">
            {CURRENCIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </Select>
        </FormField>

        <FormField label="Notes" htmlFor="notes" hint="Any context for QuickBiz staff reviewing this request">
          <Textarea id="notes" name="notes" />
        </FormField>

        <p className="text-sm text-text-tertiary">
          Requests are reviewed and provisioned by QuickBiz through a banking partner - there is no instant activation.
        </p>

        {state.error && <p className="text-sm text-danger-600">{state.error}</p>}

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={isPending}>
            Request IBAN
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export function NewIbanRequestModal() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="size-4" />
        Request IBAN
      </Button>
      {open && <IbanRequestForm onClose={() => setOpen(false)} />}
    </>
  );
}
