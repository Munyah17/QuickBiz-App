"use client";

import { useActionState, useEffect, useMemo, useState, useTransition } from "react";
import { Plus, Wallet } from "lucide-react";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { Badge } from "@/components/Badge";
import { Modal } from "@/components/Modal";
import { Input, Select } from "@/components/Input";
import { FormField } from "@/components/FormField";
import { EmptyState } from "@/components/EmptyState";
import { SearchInput } from "@/components/SearchInput";
import { ExportButton } from "@/components/ExportButton";
import { useToast } from "@/components/Toast";
import {
  createAccountAction,
  setAccountActiveAction,
  bulkSetAccountActiveAction,
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
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [isBulkPending, startBulkTransition] = useTransition();
  const { push } = useToast();

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return accounts.filter((a) => {
      if (typeFilter !== "all" && a.type !== typeFilter) return false;
      if (!q) return true;
      return [a.name, a.code].some((field) => field?.toLowerCase().includes(q));
    });
  }, [accounts, query, typeFilter]);

  const allFilteredSelected = filtered.length > 0 && filtered.every((a) => selected.has(a.id));

  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    setSelected(allFilteredSelected ? new Set() : new Set(filtered.map((a) => a.id)));
  }

  function runBulk(isActive: boolean) {
    const ids = Array.from(selected);
    startBulkTransition(async () => {
      const result = await bulkSetAccountActiveAction(ids, isActive);
      if (result.success) {
        push(`${ids.length} account${ids.length === 1 ? "" : "s"} ${isActive ? "reactivated" : "deactivated"}`);
        setSelected(new Set());
      } else if (result.error) {
        push(result.error, "error");
      }
    });
  }

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
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border-subtle px-4 py-3">
        <h3 className="text-sm font-semibold text-text-primary">
          {filtered.length} of {accounts.length} accounts
        </h3>
        <div className="flex flex-1 items-center justify-end gap-2">
          <SearchInput value={query} onChange={setQuery} placeholder="Search code, name..." />
          <Select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="w-36">
            <option value="all">All types</option>
            <option value="asset">Asset</option>
            <option value="liability">Liability</option>
            <option value="equity">Equity</option>
            <option value="income">Income</option>
            <option value="expense">Expense</option>
          </Select>
          <ExportButton
            filename="accounts"
            rows={filtered.map((a) => ({
              Code: a.code,
              Name: a.name,
              Type: a.type,
              Status: a.is_active ? "Active" : "Inactive",
            }))}
          />
          {canManage && (
            <Button size="sm" onClick={() => setModalOpen(true)}>
              <Plus className="size-4" />
              New Account
            </Button>
          )}
        </div>
      </div>

      {canManage && selected.size > 0 && (
        <div className="flex items-center gap-3 border-b border-border-subtle bg-primary-50 px-4 py-2.5">
          <span className="text-sm font-medium text-text-primary">{selected.size} selected</span>
          <Button size="sm" variant="secondary" loading={isBulkPending} onClick={() => runBulk(false)}>
            Deactivate
          </Button>
          <Button size="sm" variant="secondary" loading={isBulkPending} onClick={() => runBulk(true)}>
            Reactivate
          </Button>
          <button type="button" onClick={() => setSelected(new Set())} className="ml-auto text-sm text-text-tertiary hover:text-text-primary">
            Clear selection
          </button>
        </div>
      )}

      {filtered.length === 0 ? (
        <EmptyState icon={Wallet} title="No accounts match your search" />
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border-subtle text-left text-xs font-medium uppercase tracking-wide text-text-tertiary">
              {canManage && (
                <th className="w-10 px-4 py-2.5">
                  <input type="checkbox" checked={allFilteredSelected} onChange={toggleAll} className="size-4 rounded border-border" />
                </th>
              )}
              <th className="px-4 py-2.5">Code</th>
              <th className="px-4 py-2.5">Name</th>
              <th className="px-4 py-2.5">Type</th>
              <th className="px-4 py-2.5">Status</th>
              {canManage && <th className="px-4 py-2.5" />}
            </tr>
          </thead>
          <tbody>
            {filtered.map((account) => (
              <tr key={account.id} className="border-b border-border-subtle last:border-b-0">
                {canManage && (
                  <td className="px-4 py-2.5">
                    <input
                      type="checkbox"
                      checked={selected.has(account.id)}
                      onChange={() => toggleOne(account.id)}
                      className="size-4 rounded border-border"
                    />
                  </td>
                )}
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
      )}

      {canManage && modalOpen && <NewAccountModal open={modalOpen} onClose={() => setModalOpen(false)} />}
    </Card>
  );
}
