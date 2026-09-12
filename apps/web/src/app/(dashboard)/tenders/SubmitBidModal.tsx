"use client";

import { useActionState, useEffect } from "react";
import { Modal } from "@/components/Modal";
import { Button } from "@/components/Button";
import { Input, Select } from "@/components/Input";
import { FormField } from "@/components/FormField";
import { useToast } from "@/components/Toast";
import { submitTenderBidAction, initialTenderActionState } from "./actions";
import type { Supplier } from "@/services/purchasing";

export function SubmitBidModal({
  tenderId,
  suppliers,
  onClose,
  onSubmitted,
}: {
  tenderId: string;
  suppliers: Supplier[];
  onClose: () => void;
  onSubmitted: () => void;
}) {
  const [state, formAction, isPending] = useActionState(submitTenderBidAction, initialTenderActionState);
  const { push } = useToast();

  useEffect(() => {
    if (state.success) {
      push("Bid submitted");
      onSubmitted();
      onClose();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.success]);

  return (
    <Modal open onClose={onClose} title="Submit Bid">
      <form action={formAction} className="flex flex-col gap-4">
        <input type="hidden" name="tenderId" value={tenderId} />

        <FormField label="Supplier" htmlFor="supplierId">
          <Select id="supplierId" name="supplierId" defaultValue={suppliers[0]?.id ?? ""} required>
            {suppliers.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </Select>
        </FormField>

        <FormField label="Amount" htmlFor="amount">
          <Input id="amount" name="amount" type="number" step="0.01" min={0} required />
        </FormField>

        {state.error && <p className="text-sm text-danger-600">{state.error}</p>}

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={isPending}>
            Submit Bid
          </Button>
        </div>
      </form>
    </Modal>
  );
}
