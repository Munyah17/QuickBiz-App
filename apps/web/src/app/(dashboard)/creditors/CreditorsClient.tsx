"use client";

import { useMemo, useState } from "react";
import { Landmark, Clock, AlertTriangle, Truck } from "lucide-react";
import { Card } from "@/components/Card";
import { Badge } from "@/components/Badge";
import { EmptyState } from "@/components/EmptyState";
import { Modal } from "@/components/Modal";
import { SearchInput } from "@/components/SearchInput";
import { ExportButton } from "@/components/ExportButton";
import type { APAgingRow } from "@/services/purchasing";

export interface CreditorDoc {
  id: string;
  po_number: string;
  supplier_id: string | null;
  status: string;
  total: number;
  amount_paid: number;
  expected_date: string | null;
  created_at: string;
}

const money = (n: number) =>
  n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function daysPastDue(dueDate: string | null): number | null {
  if (!dueDate) return null;
  const today = new Date().toISOString().slice(0, 10);
  return Math.floor((Date.parse(today) - Date.parse(dueDate)) / 86400000);
}

export function CreditorsClient({
  aging,
  docs,
}: {
  aging: APAgingRow[];
  docs: CreditorDoc[];
}) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<APAgingRow | null>(null);

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
    return aging.filter((r) => r.supplierName.toLowerCase().includes(q));
  }, [aging, query]);

  const selectedDocs = useMemo(() => {
    if (!selected) return [];
    const key = selected.supplierId === "none" ? null : selected.supplierId;
    return docs.filter((d) => d.supplier_id === key);
  }, [selected, docs]);

  return (
    <>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat icon={Landmark} label="Total payable" value={money(stats.total)} sub={`${stats.count} creditors`} />
        <Stat icon={AlertTriangle} label="Overdue" value={money(stats.overdue)} sub="past expected date" />
        <Stat icon={Clock} label="Over 90 days" value={money(stats.over90)} sub="priority settlements" />
        <Stat icon={Truck} label="Creditors" value={String(stats.count)} sub="suppliers with open balance" />
      </div>

      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border-subtle px-4 py-3">
          <h3 className="text-sm font-semibold text-text-primary">
            {filtered.length} of {aging.length} creditors
          </h3>
          <div className="flex flex-1 items-center justify-end gap-2">
            <SearchInput value={query} onChange={setQuery} placeholder="Search supplier..." />
            <ExportButton
              filename="creditors-aging"
              rows={filtered.map((r) => ({
                Supplier: r.supplierName,
                Current: r.current,
                "1-30 days": r.days1to30,
                "31-60 days": r.days31to60,
                "61-90 days": r.days61to90,
                "Over 90 days": r.over90,
                "Total payable": r.total,
              }))}
            />
          </div>
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            icon={Landmark}
            title="No creditors"
            description="No suppliers have outstanding purchase order balances."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border-subtle text-left text-xs uppercase tracking-wide text-text-faint">
                  <th className="px-4 py-2 font-medium">Supplier</th>
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
                    key={r.supplierId}
                    className="border-b border-border-soft last:border-0 hover:bg-surface-2 cursor-pointer"
                    onClick={() => setSelected(r)}
                  >
                    <td className="px-4 py-2.5 font-medium text-text-primary">{r.supplierName}</td>
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
        title={selected ? `Open purchase orders — ${selected.supplierName}` : ""}
      >
        {selectedDocs.length === 0 ? (
          <p className="text-sm text-text-muted">No open purchase orders found for this supplier.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border-subtle text-left text-xs uppercase tracking-wide text-text-faint">
                  <th className="py-2 pr-3 font-medium">PO</th>
                  <th className="py-2 pr-3 font-medium">Expected</th>
                  <th className="py-2 pr-3 font-medium">Status</th>
                  <th className="py-2 font-medium text-right">Balance</th>
                </tr>
              </thead>
              <tbody>
                {selectedDocs.map((d) => {
                  const balance = d.total - d.amount_paid;
                  const overdueDays = daysPastDue(d.expected_date);
                  return (
                    <tr key={d.id} className="border-b border-border-soft last:border-0">
                      <td className="py-2 pr-3 font-medium">{d.po_number}</td>
                      <td className="py-2 pr-3">
                        {d.expected_date ?? "—"}
                        {overdueDays !== null && overdueDays > 0 && (
                          <span className="ml-1.5 text-xs text-danger">{overdueDays}d overdue</span>
                        )}
                      </td>
                      <td className="py-2 pr-3">
                        <Badge tone={d.status === "received" ? "success" : "info"}>
                          {d.status}
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
  icon: typeof Landmark;
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
