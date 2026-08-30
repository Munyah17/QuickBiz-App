"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Banknote } from "lucide-react";
import { Card } from "@/components/Card";
import { Badge } from "@/components/Badge";
import { EmptyState } from "@/components/EmptyState";
import { SearchInput } from "@/components/SearchInput";
import { Select } from "@/components/Input";
import { ExportButton } from "@/components/ExportButton";
import type { PayrollRunListRow } from "@/services/payroll";

const statusTone: Record<string, "success" | "info" | "neutral"> = {
  draft: "neutral",
  finalized: "info",
  paid: "success",
};

export function PayrollRunsTable({ runs }: { runs: PayrollRunListRow[] }) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return runs.filter((r) => {
      if (statusFilter !== "all" && r.status !== statusFilter) return false;
      if (!q) return true;
      return r.run_number.toLowerCase().includes(q);
    });
  }, [runs, query, statusFilter]);

  return (
    <Card>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border-subtle px-4 py-3">
        <h3 className="text-sm font-semibold text-text-primary">
          {filtered.length} of {runs.length} payroll runs
        </h3>
        <div className="flex flex-1 items-center justify-end gap-2">
          <SearchInput value={query} onChange={setQuery} placeholder="Search run #..." />
          <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-36">
            <option value="all">All statuses</option>
            <option value="draft">Draft</option>
            <option value="finalized">Finalized</option>
            <option value="paid">Paid</option>
          </Select>
          <ExportButton
            filename="payroll-runs"
            rows={filtered.map((r) => ({
              "Run #": r.run_number,
              "Period start": r.period_start,
              "Period end": r.period_end,
              "Pay date": r.pay_date ?? "",
              Employees: r.employeeCount,
              "Total gross": r.total_gross,
              "Total deductions": r.total_deductions,
              "Total net": r.total_net,
              Status: r.status,
            }))}
          />
        </div>
      </div>

      {runs.length === 0 ? (
        <EmptyState icon={Banknote} title="No payroll runs yet" description="Run payroll to generate payslips for your employees." />
      ) : filtered.length === 0 ? (
        <EmptyState icon={Banknote} title="No payroll runs match your search" />
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border-subtle text-left text-xs font-medium uppercase tracking-wide text-text-tertiary">
              <th className="px-4 py-2.5">Run #</th>
              <th className="px-4 py-2.5">Period</th>
              <th className="px-4 py-2.5">Pay date</th>
              <th className="px-4 py-2.5">Employees</th>
              <th className="px-4 py-2.5">Gross</th>
              <th className="px-4 py-2.5">Deductions</th>
              <th className="px-4 py-2.5">Net</th>
              <th className="px-4 py-2.5">Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => (
              <tr key={r.id} className="border-b border-border-subtle last:border-b-0">
                <td className="px-4 py-2.5">
                  <Link href={`/payroll/${r.id}`} className="font-mono font-medium text-primary-600 hover:underline">
                    {r.run_number}
                  </Link>
                </td>
                <td className="px-4 py-2.5 text-text-secondary">
                  {new Date(r.period_start).toLocaleDateString()} to {new Date(r.period_end).toLocaleDateString()}
                </td>
                <td className="px-4 py-2.5 text-text-secondary">{r.pay_date ? new Date(r.pay_date).toLocaleDateString() : "Not set"}</td>
                <td className="px-4 py-2.5 text-text-secondary">{r.employeeCount}</td>
                <td className="px-4 py-2.5 text-text-secondary">${r.total_gross.toFixed(2)}</td>
                <td className="px-4 py-2.5 text-text-secondary">${r.total_deductions.toFixed(2)}</td>
                <td className="px-4 py-2.5 font-medium text-text-primary">${r.total_net.toFixed(2)}</td>
                <td className="px-4 py-2.5">
                  <Badge tone={statusTone[r.status] ?? "neutral"}>{r.status}</Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Card>
  );
}
