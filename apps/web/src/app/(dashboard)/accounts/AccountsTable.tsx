"use client";

import { useActionState, useEffect, useState } from "react";
import { Plus, Wallet } from "lucide-react";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { Badge } from "@/components/Badge";
import { Modal } from "@/components/Modal";
import { Input, Select } from "@/components/Input";
import { FormField } from "@/components/FormField";
import { EmptyState } from "@/components/EmptyState";
import { useToast } from "@/components/Toast";
import {
  createAccountAction,
  setAccountActiveAction,
  seedDefaultAccountsAction,
  initialAccountActionState,
} from "./actions";
import type { Account } from "@/services/finance";

const typeTone: Record<Account["type"], "success" | "warning" | "danger" | "info" | "neutral"> = {
  asset: "info",
  liability: "warning",
  equity: "neutral",
  income: "success",
  expense: "danger",
};

function NewAccountModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [state, formAction, isPending] = useActionState(createAccountAction, initialAccountActionState);
  const { push } = useToast();

  useEffect(() => {
    if (state.success) {
      push("Account created");
      onClose();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.success]);

  return (
    <Modal open={open} onClose={onClose} title="New account">
      <form action={formAction} className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Code" htmlFor="code" required>
            <Input id="code" name="code" required placeholder="5950" />
          </FormField>
          <FormField label="Type" htmlFor="type" required>
            <Select id="type" name="type" required defaultValue="expense">
              <option value="asset">Asset</option>
              <option value="liability">Liability</option>
              <option value="equity">Equity</option>
              <option value="income">Income</option>
              <option value="expense">Expense</option>
            </Select>
          </FormField>
        </div>
        <FormField label="Name" htmlFor="name" required>
          <Input id="name" name="name" required placeholder="e.g. Vehicle Maintenance" />
        </FormField>
        {state.error && <p className="text-sm text-danger-600">{state.error}</p>}
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={isPending}>
            Create account
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function ActiveToggle({ account }: { account: Account }) {
  const [state, formAction, isPending] = useActionState(setAccountActiveAction, initialAccountActionState);
  const { push } = useToast();

  useEffect(() => {
    if (state.error) push(state.error, "error");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.error]);

  return (
    <form action={formAction}>
      <input type="hidden" name="accountId" value={account.id} />
      <input type="hidden" name="isActive" value={String(!account.is_active)} />
      <button type="submit" disabled={isPending} className="text-sm font-medium text-primary-600 hover:underline disabled:opacity-50">
        {account.is_active ? "Deactivate" : "Reactivate"}
      </button>
    </form>
  );
}

function SeedButton() {
  const [state, formAction, isPending] = useActionState(seedDefaultAccountsAction, initialAccountActionState);
  const { push } = useToast();

  useEffect(() => {
    if (state.success) push("Standard chart of accounts created");
    if (state.error) push(state.error, "error");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.success, state.error]);

  return (
    <form action={formAction}>
      <Button type="submit" loading={isPending}>
        Set Up Standard Chart of Accounts
      </Button>
    </form>
  );
}

export function AccountsTable({ accounts, canManage }: { accounts: Account[]; canManage: boolean }) {
  const [modalOpen, setModalOpen] = useState(false);

  if (accounts.length === 0) {
    return (
      <Card>
        <EmptyState
          icon={Wallet}
          title="No accounts yet"
          description="Set up a standard chart of accounts to start tracking expenses, or add your own."
          action={canManage ? <SeedButton /> : undefined}
        />
      </Card>
    );
  }

  return (
    <Card>
      <div className="flex items-center justify-between border-b border-border-subtle px-4 py-3">
        <h3 className="text-sm font-semibold text-text-primary">{accounts.length} accounts</h3>
        {canManage && (
          <Button size="sm" onClick={() => setModalOpen(true)}>
            <Plus className="size-4" />
            New Account
          </Button>
        )}
      </div>

      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border-subtle text-left text-xs font-medium uppercase tracking-wide text-text-tertiary">
            <th className="px-4 py-2.5">Code</th>
            <th className="px-4 py-2.5">Name</th>
            <th className="px-4 py-2.5">Type</th>
            <th className="px-4 py-2.5">Status</th>
            {canManage && <th className="px-4 py-2.5" />}
          </tr>
        </thead>
        <tbody>
          {accounts.map((account) => (
            <tr key={account.id} className="border-b border-border-subtle last:border-b-0">
              <td className="px-4 py-2.5 font-mono text-text-secondary">{account.code}</td>
              <td className="px-4 py-2.5 font-medium text-text-primary">{account.name}</td>
              <td className="px-4 py-2.5">
                <Badge tone={typeTone[account.type]}>{account.type}</Badge>
              </td>
              <td className="px-4 py-2.5">
                <Badge tone={account.is_active ? "success" : "neutral"}>{account.is_active ? "Active" : "Inactive"}</Badge>
              </td>
              {canManage && (
                <td className="px-4 py-2.5 text-right">
                  <ActiveToggle account={account} />
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>

      {canManage && modalOpen && <NewAccountModal open={modalOpen} onClose={() => setModalOpen(false)} />}
    </Card>
  );
}
