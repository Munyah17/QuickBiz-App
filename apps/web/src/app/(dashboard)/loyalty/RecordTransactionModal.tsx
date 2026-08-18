"use client";

import { useActionState, useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { Modal } from "@/components/Modal";
import { Button } from "@/components/Button";
import { Input, Select } from "@/components/Input";
import { FormField } from "@/components/FormField";
import { useToast } from "@/components/Toast";
import { recordLoyaltyTransactionAction, initialLoyaltyActionState } from "./actions";

function TransactionForm({
  customers,
  onClose,
}: {
  customers: Array<{ customerId: string; customerName: string }>;
  onClose: () => void;
}) {
  const [state, formAction, isPending] = useActionState(recordLoyaltyTransactionAction, initialLoyaltyActionState);
  const { push } = useToast();

  useEffect(() => {
    if (state.success) {
      push("Loyalty transaction recorded");
      onClose();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.success]);

  return (
    <Modal open onClose={onClose} title="Record loyalty transaction">
      <form action={formAction} className="flex flex-col gap-4">
        <FormField label="Customer" htmlFor="customerId" required>
          <Select id="customerId" name="customerId" required defaultValue="">
            <option value="" disabled>
              Choose a customer
            </option>
            {customers.map((c) => (
              <option key={c.customerId} value={c.customerId}>
                {c.customerName}
              </option>
            ))}
          </Select>
        </FormField>

        <div className="grid grid-cols-2 gap-4">
          <FormField label="Type" htmlFor="type">
            <Select id="type" name="type" defaultValue="earn">
              <option value="earn">Earn</option>
              <option value="redeem">Redeem</option>
              <option value="adjustment">Adjustment</option>
            </Select>
          </FormField>
          <FormField label="Points" htmlFor="points" required>
            <Input id="points" name="points" type="number" min="1" step="1" required />
          </FormField>
        </div>

        <FormField label="Reason" htmlFor="reason">
          <Input id="reason" name="reason" placeholder="e.g. Purchase reward, birthday bonus" />
        </FormField>

        {state.error && <p className="text-sm text-danger-600">{state.error}</p>}

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={isPending}>
            Record
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export function RecordTransactionModal({ customers }: { customers: Array<{ customerId: string; customerName: string }> }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="size-4" />
        Record Transaction
      </Button>
      {open && <TransactionForm customers={customers} onClose={() => setOpen(false)} />}
    </>
  );
}
