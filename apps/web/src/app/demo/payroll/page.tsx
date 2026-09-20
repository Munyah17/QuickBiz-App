"use client";

import { useState } from "react";
import { Plus, Banknote } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/Card";
import { Badge } from "@/components/Badge";
import { Button } from "@/components/Button";
import { EmptyState } from "@/components/EmptyState";
import { Modal } from "@/components/Modal";
import { Input } from "@/components/Input";
import { FormField } from "@/components/FormField";
import { useDemo } from "@/lib/demo/DemoContext";
import { useToast } from "@/components/Toast";

const statusTone: Record<string, "success" | "info" | "neutral"> = {
  draft: "neutral",
  finalized: "info",
  paid: "success",
};

function NewPayrollRunModal({ onClose }: { onClose: () => void }) {
  const { employees, createPayrollRun } = useDemo();
  const { push } = useToast();
  const [periodStart, setPeriodStart] = useState("");
  const [periodEnd, setPeriodEnd] = useState("");
  const [payDate, setPayDate] = useState("");
  const [grossPerEmployee, setGrossPerEmployee] = useState("800");

  const activeCount = employees.filter((e) => e.employmentStatus === "active").length;

  return (
    <Modal open onClose={onClose} title="New payroll run">
      <form
        className="flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          if (!periodStart || !periodEnd) return;
          createPayrollRun({ periodStart, periodEnd, payDate, grossPerEmployee: Number(grossPerEmployee) || 0 });
          push("Payroll run created");
          onClose();
        }}
      >
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Period start" htmlFor="periodStart" required>
            <Input id="periodStart" type="date" required value={periodStart} onChange={(e) => setPeriodStart(e.target.value)} />
          </FormField>
          <FormField label="Period end" htmlFor="periodEnd" required>
            <Input id="periodEnd" type="date" required value={periodEnd} onChange={(e) => setPeriodEnd(e.target.value)} />
          </FormField>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Pay date" htmlFor="payDate">
            <Input id="payDate" type="date" value={payDate} onChange={(e) => setPayDate(e.target.value)} />
          </FormField>
          <FormField label="Gross per employee" htmlFor="grossPerEmployee" required>
            <Input
              id="grossPerEmployee"
              type="number"
              min="0"
              step="0.01"
              required
              value={grossPerEmployee}
              onChange={(e) => setGrossPerEmployee(e.target.value)}
            />
          </FormField>
        </div>
        <p className="text-xs text-text-tertiary">
          Covers {activeCount} active employee{activeCount === 1 ? "" : "s"}. Deductions are estimated at a flat 20% for
          demo purposes.
        </p>
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit">Create run</Button>
        </div>
      </form>
    </Modal>
  );
}

export default function DemoPayrollPage() {
  const { payrollRuns } = useDemo();
  const [open, setOpen] = useState(false);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <PageHeader module="Payroll" title="Payroll Runs" />
        <Button onClick={() => setOpen(true)}>
          <Plus className="size-4" />
          New Payroll Run
        </Button>
      </div>

      <p className="text-sm text-text-tertiary">
        PAYE, NSSA, and AIDS Levy are calculated from the rates you configure in Tax Settings - QuickBiz does not ship
        with statutory rates pre-filled. Confirm current figures with ZIMRA or your tax advisor before relying on them.
      </p>

      <Card>
        {payrollRuns.length === 0 ? (
          <EmptyState icon={Banknote} title="No payroll runs yet" description="Run payroll to generate payslips for your employees." />
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
              {payrollRuns.map((r) => (
                <tr key={r.id} className="border-b border-border-subtle last:border-b-0">
                  <td className="px-4 py-2.5 font-mono font-medium text-text-primary">{r.runNumber}</td>
                  <td className="px-4 py-2.5 text-text-secondary">
                    {new Date(r.periodStart).toLocaleDateString()} to {new Date(r.periodEnd).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-2.5 text-text-secondary">
                    {r.payDate ? new Date(r.payDate).toLocaleDateString() : "Not set"}
                  </td>
                  <td className="px-4 py-2.5 text-text-secondary">{r.employeeCount}</td>
                  <td className="px-4 py-2.5 text-text-secondary">${r.totalGross.toFixed(2)}</td>
                  <td className="px-4 py-2.5 text-text-secondary">${r.totalDeductions.toFixed(2)}</td>
                  <td className="px-4 py-2.5 font-medium text-text-primary">${r.totalNet.toFixed(2)}</td>
                  <td className="px-4 py-2.5">
                    <Badge tone={statusTone[r.status] ?? "neutral"}>{r.status}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      {open && <NewPayrollRunModal onClose={() => setOpen(false)} />}
    </div>
  );
}
