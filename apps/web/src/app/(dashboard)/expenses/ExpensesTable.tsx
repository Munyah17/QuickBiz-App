"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { Receipt, Check, X, Banknote } from "lucide-react";
import { Card } from "@/components/Card";
import { Badge } from "@/components/Badge";
import { Button } from "@/components/Button";
import { Modal } from "@/components/Modal";
import { Input, Select } from "@/components/Input";
import { FormField } from "@/components/FormField";
import { EmptyState } from "@/components/EmptyState";
import { SearchInput } from "@/components/SearchInput";
import { ExportButton } from "@/components/ExportButton";
import { useToast } from "@/components/Toast";
import { paymentMethodLabel, PAYMENT_METHODS } from "@/config/paymentMethods";
import {
  approveExpenseAction,
  rejectExpenseAction,
  markExpensePaidAction,
  initialExpenseActionState,
} from "./actions";
import type { ExpenseRow, ExpenseStatus } from "@/services/finance";

const statusTone: Record<ExpenseStatus, "success" | "info" | "warning" | "neutral"> = {
  submitted: "info",
  approved: "warning",
  rejected: "neutral",
  paid: "success",
};

function useExpenseAction(
  action: typeof approveExpenseAction,
  successMessage: string,
  onDone?: () => void
) {
  const [state, formAction, isPending] = useActionState(action, initialExpenseActionState);
  const { push } = useToast();

  useEffect(() => {
    if (state.success) {
      push(successMessage);
      onDone?.();
    }
    if (state.error) push(state.error, "error");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.success, state.error]);

  return { state, formAction, isPending };
}

function ApproveButton({ expenseId }: { expenseId: string }) {
  const { formAction, isPending } = useExpenseAction(approveExpenseAction, "Expense approved");
  return (
    <form action={formAction}>
      <input type="hidden" name="expenseId" value={expenseId} />
      <button
        type="submit"
        disabled={isPending}
        title="Approve"
        className="text-text-tertiary hover:text-success-600 disabled:opacity-50"
      >
        <Check className="size-4" />
      </button>
    </form>
  );
}

function RejectExpenseForm({ expenseId, onClose }: { expenseId: string; onClose: () => void }) {
  const { state, formAction, isPending } = useExpenseAction(rejectExpenseAction, "Expense rejected", onClose);
  return (
    <Modal open onClose={onClose} title="Reject expense">
      <form action={formAction} className="flex flex-col gap-4">
        <input type="hidden" name="expenseId" value={expenseId} />
        <FormField label="Reason" htmlFor="reason" hint="Shown to the submitter">
          <Input id="reason" name="reason" placeholder="e.g. Missing receipt" />
        </FormField>
        {state.error && <p className="text-sm text-danger-600">{state.error}</p>}
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={isPending}>
            Reject
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function RejectButton({ expenseId }: { expenseId: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} title="Reject" className="text-text-tertiary hover:text-danger-600">
        <X className="size-4" />
      </button>
      {open && <RejectExpenseForm expenseId={expenseId} onClose={() => setOpen(false)} />}
    </>
  );
}

function MarkPaidForm({ expense, onClose }: { expense: ExpenseRow; onClose: () => void }) {
  const { state, formAction, isPending } = useExpenseAction(markExpensePaidAction, "Expense marked paid", onClose);
  return (
    <Modal open onClose={onClose} title={`Pay ${expense.description}`}>
      <form action={formAction} className="flex flex-col gap-4">
        <input type="hidden" name="expenseId" value={expense.id} />
        <FormField label="Payment method" htmlFor="paymentMethod">
          <Select id="paymentMethod" name="paymentMethod" defaultValue={expense.payment_method}>
            {PAYMENT_METHODS.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </Select>
        </FormField>
        <FormField label="Reference" htmlFor="reference" hint="Optional">
          <Input id="reference" name="reference" defaultValue={expense.reference ?? ""} />
        </FormField>
        {state.error && <p className="text-sm text-danger-600">{state.error}</p>}
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={isPending}>
            Mark paid — ${expense.amount.toFixed(2)}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function MarkPaidButton({ expense }: { expense: ExpenseRow }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} title="Mark paid" className="text-text-tertiary hover:text-primary-600">
        <Banknote className="size-4" />
      </button>
      {open && <MarkPaidForm expense={expense} onClose={() => setOpen(false)} />}
    </>
  );
}

export function ExpensesTable({
  expenses,
  canApprove,
  canManage,
}: {
  expenses: ExpenseRow[];
  canApprove: boolean;
  canManage: boolean;
}) {
  const [query, setQuery] = useState("");
  const [accountFilter, setAccountFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const accounts = useMemo(() => {
    const names = new Set(expenses.map((e) => e.accountName).filter((n): n is string => !!n));
    return Array.from(names).sort();
  }, [expenses]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return expenses.filter((e) => {
      if (accountFilter !== "all" && e.accountName !== accountFilter) return false;
      if (statusFilter !== "all" && e.status !== statusFilter) return false;
      if (!q) return true;
      return [e.description, e.reference, e.accountName, e.submitted_by_name].some((field) =>
        field?.toLowerCase().includes(q)
      );
    });
  }, [expenses, query, accountFilter, statusFilter]);

  const total = filtered.reduce((sum, e) => sum + e.amount, 0);
  const pendingCount = expenses.filter((e) => e.status === "submitted").length;
  const showActions = canApprove || canManage;

  return (
    <Card>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border-subtle px-4 py-3">
        <h3 className="text-sm font-semibold text-text-primary">
          {filtered.length} of {expenses.length} expenses
          {pendingCount > 0 && (
            <Badge tone="info" className="ml-2">
              {pendingCount} awaiting approval
            </Badge>
          )}
        </h3>
        <div className="flex flex-1 items-center justify-end gap-2">
          <SearchInput value={query} onChange={setQuery} placeholder="Search description, reference..." />
          <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-36">
            <option value="all">All statuses</option>
            <option value="submitted">Submitted</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="paid">Paid</option>
          </Select>
          <Select value={accountFilter} onChange={(e) => setAccountFilter(e.target.value)} className="w-40">
            <option value="all">All accounts</option>
            {accounts.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </Select>
          <ExportButton
            filename="expenses"
            rows={filtered.map((e) => ({
              Date: e.expense_date,
              Description: e.description,
              Account: e.accountName ?? "",
              Status: e.status,
              Method: paymentMethodLabel(e.payment_method),
              Reference: e.reference ?? "",
              "Submitted by": e.submitted_by_name ?? "",
              Amount: e.amount,
            }))}
          />
        </div>
      </div>

      {expenses.length === 0 ? (
        <EmptyState icon={Receipt} title="No expenses recorded yet" />
      ) : filtered.length === 0 ? (
        <EmptyState icon={Receipt} title="No expenses match your search" />
      ) : (
        <>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border-subtle text-left text-xs font-medium uppercase tracking-wide text-text-tertiary">
                <th className="px-4 py-2.5">Date</th>
                <th className="px-4 py-2.5">Description</th>
                <th className="px-4 py-2.5">Account</th>
                <th className="px-4 py-2.5">Submitted by</th>
                <th className="px-4 py-2.5">Status</th>
                <th className="px-4 py-2.5">Amount</th>
                {showActions && <th className="px-4 py-2.5" />}
              </tr>
            </thead>
            <tbody>
              {filtered.map((e) => (
                <tr key={e.id} className="border-b border-border-subtle last:border-b-0">
                  <td className="px-4 py-2.5 text-text-secondary">{new Date(e.expense_date).toLocaleDateString()}</td>
                  <td className="px-4 py-2.5">
                    <p className="text-text-primary">{e.description}</p>
                    {e.status === "rejected" && e.rejection_reason && (
                      <p className="text-xs text-danger-600">Rejected: {e.rejection_reason}</p>
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-text-secondary">{e.accountName ?? "Uncategorized"}</td>
                  <td className="px-4 py-2.5 text-text-secondary">{e.submitted_by_name ?? "—"}</td>
                  <td className="px-4 py-2.5">
                    <Badge tone={statusTone[e.status] ?? "neutral"}>{e.status}</Badge>
                  </td>
                  <td className="px-4 py-2.5 text-text-secondary">${e.amount.toFixed(2)}</td>
                  {showActions && (
                    <td className="px-4 py-2.5">
                      <div className="flex items-center justify-end gap-3">
                        {e.status === "submitted" && canApprove && (
                          <>
                            <ApproveButton expenseId={e.id} />
                            <RejectButton expenseId={e.id} />
                          </>
                        )}
                        {e.status === "approved" && canManage && <MarkPaidButton expense={e} />}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
          <div className="flex justify-end border-t border-border-subtle p-4 text-sm font-semibold text-text-primary">
            Total: ${total.toFixed(2)}
          </div>
        </>
      )}
    </Card>
  );
}
