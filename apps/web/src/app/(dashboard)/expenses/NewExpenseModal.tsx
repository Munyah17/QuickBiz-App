"use client";

import { useActionState, useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/Button";
import { Modal } from "@/components/Modal";
import { Input, Select } from "@/components/Input";
import { FormField } from "@/components/FormField";
import { useToast } from "@/components/Toast";
import { createExpenseAction, initialExpenseActionState } from "./actions";
import type { Account } from "@/services/finance";
import { PAYMENT_METHODS } from "@/config/paymentMethods";

function ExpenseForm({ accounts, branchId, onClose }: { accounts: Account[]; branchId: string; onClose: () => void }) {
  const [state, formAction, isPending] = useActionState(createExpenseAction, initialExpenseActionState);
  const { push } = useToast();
  const today = new Date().toISOString().slice(0, 10);

  useEffect(() => {
    if (state.success) {
      push("Expense recorded");
      onClose();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.success]);

  return (
    <Modal open onClose={onClose} title="Record expense">
      <form action={formAction} className="flex flex-col gap-4">
        <input type="hidden" name="branchId" value={branchId} />

        <FormField label="Description" htmlFor="description" required>
          <Input id="description" name="description" required />
        </FormField>

        <div className="grid grid-cols-2 gap-4">
          <FormField label="Amount" htmlFor="amount" required>
            <Input id="amount" name="amount" type="number" min="0.01" step="0.01" required />
          </FormField>
          <FormField label="Date" htmlFor="expenseDate" required>
            <Input id="expenseDate" name="expenseDate" type="date" required defaultValue={today} />
          </FormField>
        </div>

        <FormField label="Account" htmlFor="accountId">
          <Select id="accountId" name="accountId">
            <option value="">Uncategorized</option>
            {accounts
              .filter((a) => a.type === "expense" && a.is_active)
              .map((a) => (
                <option key={a.id} value={a.id}>
                  {a.code} {a.name}
                </option>
              ))}
          </Select>
        </FormField>

        <div className="grid grid-cols-2 gap-4">
          <FormField label="Payment method" htmlFor="paymentMethod">
            <Select id="paymentMethod" name="paymentMethod" defaultValue="cash">
              {PAYMENT_METHODS.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </Select>
          </FormField>
          <FormField label="Reference" htmlFor="reference" hint="Optional">
            <Input id="reference" name="reference" />
          </FormField>
        </div>

        {state.error && <p className="text-sm text-danger-600">{state.error}</p>}

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={isPending}>
            Record expense
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export function NewExpenseModal({ accounts, branchId }: { accounts: Account[]; branchId: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="size-4" />
        Record Expense
      </Button>
      {open && <ExpenseForm accounts={accounts} branchId={branchId} onClose={() => setOpen(false)} />}
    </>
  );
}
