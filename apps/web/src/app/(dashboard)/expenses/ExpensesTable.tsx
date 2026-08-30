"use client";

import { useMemo, useState } from "react";
import { Receipt } from "lucide-react";
import { Card } from "@/components/Card";
import { EmptyState } from "@/components/EmptyState";
import { SearchInput } from "@/components/SearchInput";
import { Select } from "@/components/Input";
import { ExportButton } from "@/components/ExportButton";
import { paymentMethodLabel } from "@/config/paymentMethods";
import type { ExpenseRow } from "@/services/finance";

export function ExpensesTable({ expenses }: { expenses: ExpenseRow[] }) {
  const [query, setQuery] = useState("");
  const [accountFilter, setAccountFilter] = useState("all");

  const accounts = useMemo(() => {
    const names = new Set(expenses.map((e) => e.accountName).filter((n): n is string => !!n));
    return Array.from(names).sort();
  }, [expenses]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return expenses.filter((e) => {
      if (accountFilter !== "all" && e.accountName !== accountFilter) return false;
      if (!q) return true;
      return [e.description, e.reference, e.accountName].some((field) => field?.toLowerCase().includes(q));
    });
  }, [expenses, query, accountFilter]);

  const total = filtered.reduce((sum, e) => sum + e.amount, 0);

  return (
    <Card>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border-subtle px-4 py-3">
        <h3 className="text-sm font-semibold text-text-primary">
          {filtered.length} of {expenses.length} expenses
        </h3>
        <div className="flex flex-1 items-center justify-end gap-2">
          <SearchInput value={query} onChange={setQuery} placeholder="Search description, reference..." />
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
              Method: paymentMethodLabel(e.payment_method),
              Reference: e.reference ?? "",
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
                <th className="px-4 py-2.5">Method</th>
                <th className="px-4 py-2.5">Reference</th>
                <th className="px-4 py-2.5">Amount</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((e) => (
                <tr key={e.id} className="border-b border-border-subtle last:border-b-0">
                  <td className="px-4 py-2.5 text-text-secondary">{new Date(e.expense_date).toLocaleDateString()}</td>
                  <td className="px-4 py-2.5 text-text-primary">{e.description}</td>
                  <td className="px-4 py-2.5 text-text-secondary">{e.accountName ?? "Uncategorized"}</td>
                  <td className="px-4 py-2.5 text-text-secondary">{paymentMethodLabel(e.payment_method)}</td>
                  <td className="px-4 py-2.5 text-text-secondary">{e.reference || "No reference"}</td>
                  <td className="px-4 py-2.5 text-text-secondary">${e.amount.toFixed(2)}</td>
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
