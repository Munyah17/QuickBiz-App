"use client";

import { useActionState, useEffect, useState } from "react";
import { Modal } from "@/components/Modal";
import { Button } from "@/components/Button";
import { Input, Select } from "@/components/Input";
import { FormField } from "@/components/FormField";
import { useToast } from "@/components/Toast";
import { recordPurchasePaymentAction, initialPurchasingActionState } from "../actions";

function PaymentForm({ poId, balanceDue, onClose }: { poId: string; balanceDue: number; onClose: () => void }) {
  const [state, formAction, isPending] = useActionState(recordPurchasePaymentAction, initialPurchasingActionState);
  const { push } = useToast();

  useEffect(() => {
    if (state.success) {
      push("Payment recorded");
      onClose();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.success]);

  return (
    <Modal open onClose={onClose} title="Record payment to supplier">
      <form action={formAction} className="flex flex-col gap-4">
        <input type="hidden" name="poId" value={poId} />

        <FormField label="Amount" htmlFor="amount" required hint={`Balance due: $${balanceDue.toFixed(2)}`}>
          <Input id="amount" name="amount" type="number" min="0.01" step="0.01" required defaultValue={balanceDue} />
        </FormField>

        <FormField label="Method" htmlFor="method">
          <Select id="method" name="method" defaultValue="bank_transfer">
            <option value="bank_transfer">Bank transfer</option>
            <option value="cash">Cash</option>
            <option value="mobile_money">Mobile money</option>
            <option value="card">Card</option>
            <option value="other">Other</option>
          </Select>
        </FormField>

        <FormField label="Reference" htmlFor="reference" hint="Optional">
          <Input id="reference" name="reference" />
        </FormField>

        {state.error && <p className="text-sm text-danger-600">{state.error}</p>}

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={isPending}>
            Record payment
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export function RecordPurchasePaymentModal({ poId, balanceDue }: { poId: string; balanceDue: number }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="secondary" onClick={() => setOpen(true)}>
        Record Payment
      </Button>
      {open && <PaymentForm poId={poId} balanceDue={balanceDue} onClose={() => setOpen(false)} />}
    </>
  );
}
