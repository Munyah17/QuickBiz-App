"use client";

import { useMemo, useState } from "react";
import { HandCoins, Clock, AlertTriangle, Users } from "lucide-react";
import { Card } from "@/components/Card";
import { Badge } from "@/components/Badge";
import { EmptyState } from "@/components/EmptyState";
import { Modal } from "@/components/Modal";
import { SearchInput } from "@/components/SearchInput";
import { ExportButton } from "@/components/ExportButton";
import type { ARAgingRow } from "@/services/sales";

export interface DebtorInvoice {
  id: string;
  invoice_number: string;
  customer_id: string | null;
  status: string;
  total: number;
  amount_paid: number;
  due_date: string | null;
  created_at: string;
}

const money = (n: number) =>
  n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function daysPastDue(dueDate: string | null): number | null {
  if (!dueDate) return null;
  const today = new Date().toISOString().slice(0, 10);
  return Math.floor((Date.parse(today) - Date.parse(dueDate)) / 86400000);
}

export function DebtorsClient({
  aging,
  invoices,
}: {
  aging: ARAgingRow[];
  invoices: DebtorInvoice[];
}) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<ARAgingRow | null>(null);

  const stats = useMemo(() => {
    const total = aging.reduce((s, r) => s + r.total, 0);
    const overdue = aging.reduce(
      (s, r) => s + r.days1to30 + r.days31to60 + r.days61to90 + r.over90,
      0,
    );
    const over90 = aging.reduce((s, r) => s + r.over90, 0);
    return { total, overdue, over90, count: aging.length };
  }, [aging]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return aging;
    return aging.filter((r) => r.customerName.toLowerCase().includes(q));
  }, [aging, query]);

  const selectedInvoices = useMemo(() => {
    if (!selected) return [];
    const key = selected.customerId === "walk-in" ? null : selected.customerId;
    return invoices.filter((i) => i.customer_id === key);
  }, [selected, invoices]);

  return (
    <>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat icon={HandCoins} label="Total owed" value={money(stats.total)} sub={`${stats.count} debtors`} />
        <Stat icon={AlertTriangle} label="Overdue" value={money(stats.overdue)} sub="past due date" />
        <Stat icon={Clock} label="Over 90 days" value={money(stats.over90)} sub="escalation risk" />
        <Stat icon={Users} label="Debtors" value={String(stats.count)} sub="customers with open balance" />
      </div>

      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border-subtle px-4 py-3">
          <h3 className="text-sm font-semibold text-text-primary">
            {filtered.length} of {aging.length} debtors
          </h3>
          <div className="flex flex-1 items-center justify-end gap-2">
            <SearchInput value={query} onChange={setQuery} placeholder="Search customer..." />
            <ExportButton
              filename="debtors-aging"
              rows={filtered.map((r) => ({
                Customer: r.customerName,
                Current: r.current,
                "1-30 days": r.days1to30,
                "31-60 days": r.days31to60,
                "61-90 days": r.days61to90,
                "Over 90 days": r.over90,
                "Total owed": r.total,
              }))}
            />
          </div>
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            icon={HandCoins}
            title="No debtors"
            description="No customers have outstanding invoice balances."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border-subtle text-left text-xs uppercase tracking-wide text-text-faint">
                  <th className="px-4 py-2 font-medium">Customer</th>
                  <th className="px-4 py-2 font-medium text-right">Current</th>
                  <th className="px-4 py-2 font-medium text-right">1–30</th>
                  <th className="px-4 py-2 font-medium text-right">31–60</th>
                  <th className="px-4 py-2 font-medium text-right">61–90</th>
                  <th className="px-4 py-2 font-medium text-right">90+</th>
                  <th className="px-4 py-2 font-medium text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr
                    key={r.customerId}
                    className="border-b border-border-soft last:border-0 hover:bg-surface-2 cursor-pointer"
                    onClick={() => setSelected(r)}
                  >
                    <td className="px-4 py-2.5 font-medium text-text-primary">{r.customerName}</td>
                    <td className="px-4 py-2.5 text-right">{money(r.current)}</td>
                    <td className="px-4 py-2.5 text-right">{r.days1to30 > 0 ? money(r.days1to30) : "—"}</td>
                    <td className="px-4 py-2.5 text-right">{r.days31to60 > 0 ? money(r.days31to60) : "—"}</td>
                    <td className="px-4 py-2.5 text-right">{r.days61to90 > 0 ? money(r.days61to90) : "—"}</td>
                    <td className="px-4 py-2.5 text-right text-danger">{r.over90 > 0 ? money(r.over90) : "—"}</td>
                    <td className="px-4 py-2.5 text-right font-semibold">{money(r.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal
        open={selected !== null}
        onClose={() => setSelected(null)}
        title={selected ? `Open invoices — ${selected.customerName}` : ""}
      >
        {selectedInvoices.length === 0 ? (
          <p className="text-sm text-text-muted">No open invoices found for this customer.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border-subtle text-left text-xs uppercase tracking-wide text-text-faint">
                  <th className="py-2 pr-3 font-medium">Invoice</th>
                  <th className="py-2 pr-3 font-medium">Due</th>
                  <th className="py-2 pr-3 font-medium">Status</th>
                  <th className="py-2 font-medium text-right">Balance</th>
                </tr>
              </thead>
              <tbody>
                {selectedInvoices.map((inv) => {
                  const balance = inv.total - inv.amount_paid;
                  const overdueDays = daysPastDue(inv.due_date);
                  return (
                    <tr key={inv.id} className="border-b border-border-soft last:border-0">
                      <td className="py-2 pr-3 font-medium">{inv.invoice_number}</td>
                      <td className="py-2 pr-3">
                        {inv.due_date ?? "—"}
                        {overdueDays !== null && overdueDays > 0 && (
                          <span className="ml-1.5 text-xs text-danger">{overdueDays}d overdue</span>
                        )}
                      </td>
                      <td className="py-2 pr-3">
                        <Badge tone={inv.status === "partially_paid" ? "warning" : "info"}>
                          {inv.status.replace("_", " ")}
                        </Badge>
                      </td>
                      <td className="py-2 text-right font-semibold">{money(balance)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Modal>
    </>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
  sub,
}: {
  icon: typeof HandCoins;
  label: string;
  value: string;
  sub: string;
}) {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent-soft text-accent">
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <p className="text-xs text-text-muted">{label}</p>
          <p className="truncate text-lg font-semibold text-text-primary">{value}</p>
          <p className="text-xs text-text-faint">{sub}</p>
        </div>
      </div>
    </Card>
  );
}
