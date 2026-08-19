"use client";

import { useState } from "react";
import { Plus, BadgeDollarSign } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { EmptyState } from "@/components/EmptyState";
import { Modal } from "@/components/Modal";
import { Input, Select } from "@/components/Input";
import { FormField } from "@/components/FormField";
import { useDemo } from "@/lib/demo/DemoContext";
import { useToast } from "@/components/Toast";

function AddExpenseModal({ onClose }: { onClose: () => void }) {
  const { accounts, addExpense } = useDemo();
  const { push } = useToast();
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("0");
  const [accountName, setAccountName] = useState(accounts.find((a) => a.type === "expense")?.name ?? "");

  return (
    <Modal open onClose={onClose} title="Record expense">
      <form
        className="flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          if (!description.trim() || !accountName) return;
          addExpense({ description: description.trim(), amount: Number(amount) || 0, accountName });
          push("Expense recorded");
          onClose();
        }}
      >
        <FormField label="Description" htmlFor="description" required>
          <Input id="description" required value={description} onChange={(e) => setDescription(e.target.value)} />
        </FormField>
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Amount" htmlFor="amount">
            <Input id="amount" type="number" min="0" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} />
          </FormField>
          <FormField label="Account" htmlFor="accountName">
            <Select id="accountName" value={accountName} onChange={(e) => setAccountName(e.target.value)}>
              {accounts.filter((a) => a.type === "expense").map((a) => (
                <option key={a.id} value={a.name}>
                  {a.name}
                </option>
              ))}
            </Select>
          </FormField>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit">Record</Button>
        </div>
      </form>
    </Modal>
  );
}

export default function DemoExpensesPage() {
  const { expenses } = useDemo();
  const [open, setOpen] = useState(false);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <PageHeader module="Finance" title="Expenses" />
        <Button onClick={() => setOpen(true)}>
          <Plus className="size-4" />
          Record Expense
        </Button>
      </div>

      <Card>
        {expenses.length === 0 ? (
          <EmptyState icon={BadgeDollarSign} title="No expenses yet" />
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border-subtle text-left text-xs font-medium uppercase tracking-wide text-text-tertiary">
                <th className="px-4 py-2.5">Description</th>
                <th className="px-4 py-2.5">Account</th>
                <th className="px-4 py-2.5">Amount</th>
                <th className="px-4 py-2.5">Date</th>
              </tr>
            </thead>
            <tbody>
              {expenses.map((e) => (
                <tr key={e.id} className="border-b border-border-subtle last:border-b-0">
                  <td className="px-4 py-2.5 font-medium text-text-primary">{e.description}</td>
                  <td className="px-4 py-2.5 text-text-secondary">{e.accountName}</td>
                  <td className="px-4 py-2.5 text-text-secondary">${e.amount.toFixed(2)}</td>
                  <td className="px-4 py-2.5 text-text-secondary">{new Date(e.expenseDate).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      {open && <AddExpenseModal onClose={() => setOpen(false)} />}
    </div>
  );
}
