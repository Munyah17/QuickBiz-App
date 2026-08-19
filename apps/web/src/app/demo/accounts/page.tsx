"use client";

import { useState } from "react";
import { Plus, Wallet } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/Card";
import { Badge } from "@/components/Badge";
import { Button } from "@/components/Button";
import { EmptyState } from "@/components/EmptyState";
import { Modal } from "@/components/Modal";
import { Input, Select } from "@/components/Input";
import { FormField } from "@/components/FormField";
import { useDemo, type DemoAccount } from "@/lib/demo/DemoContext";
import { useToast } from "@/components/Toast";

function AddAccountModal({ onClose }: { onClose: () => void }) {
  const { addAccount } = useDemo();
  const { push } = useToast();
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [type, setType] = useState<DemoAccount["type"]>("expense");

  return (
    <Modal open onClose={onClose} title="Add account">
      <form
        className="flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          if (!code.trim() || !name.trim()) return;
          addAccount({ code: code.trim(), name: name.trim(), type });
          push("Account added");
          onClose();
        }}
      >
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Code" htmlFor="code" required>
            <Input id="code" required value={code} onChange={(e) => setCode(e.target.value)} />
          </FormField>
          <FormField label="Type" htmlFor="type">
            <Select id="type" value={type} onChange={(e) => setType(e.target.value as DemoAccount["type"])}>
              <option value="asset">Asset</option>
              <option value="liability">Liability</option>
              <option value="equity">Equity</option>
              <option value="income">Income</option>
              <option value="expense">Expense</option>
            </Select>
          </FormField>
        </div>
        <FormField label="Name" htmlFor="name" required>
          <Input id="name" required value={name} onChange={(e) => setName(e.target.value)} />
        </FormField>
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit">Add account</Button>
        </div>
      </form>
    </Modal>
  );
}

export default function DemoAccountsPage() {
  const { accounts } = useDemo();
  const [open, setOpen] = useState(false);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <PageHeader module="Finance" title="Chart of Accounts" />
        <Button onClick={() => setOpen(true)}>
          <Plus className="size-4" />
          Add Account
        </Button>
      </div>

      <Card>
        {accounts.length === 0 ? (
          <EmptyState icon={Wallet} title="No accounts yet" />
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border-subtle text-left text-xs font-medium uppercase tracking-wide text-text-tertiary">
                <th className="px-4 py-2.5">Code</th>
                <th className="px-4 py-2.5">Name</th>
                <th className="px-4 py-2.5">Type</th>
              </tr>
            </thead>
            <tbody>
              {accounts.map((a) => (
                <tr key={a.id} className="border-b border-border-subtle last:border-b-0">
                  <td className="px-4 py-2.5 font-mono text-text-secondary">{a.code}</td>
                  <td className="px-4 py-2.5 font-medium text-text-primary">{a.name}</td>
                  <td className="px-4 py-2.5">
                    <Badge>{a.type}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      {open && <AddAccountModal onClose={() => setOpen(false)} />}
    </div>
  );
}
