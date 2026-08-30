"use client";

import { useActionState, useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { Modal } from "@/components/Modal";
import { Button } from "@/components/Button";
import { Input, Select, Textarea } from "@/components/Input";
import { FormField } from "@/components/FormField";
import { SearchInput } from "@/components/SearchInput";
import { createPayrollRunAction, initialPayrollActionState } from "./actions";
import type { EmployeeCompensationRow } from "@/services/payroll";

function RunForm({
  branches,
  employees,
  onClose,
}: {
  branches: Array<{ id: string; name: string }>;
  employees: EmployeeCompensationRow[];
  onClose: () => void;
}) {
  const [state, formAction, isPending] = useActionState(createPayrollRunAction, initialPayrollActionState);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Set<string>>(
    new Set(employees.filter((e) => e.employmentStatus === "active").map((e) => e.employeeId))
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return employees;
    return employees.filter((e) => e.employeeName.toLowerCase().includes(q) || e.employeeNumber.toLowerCase().includes(q));
  }, [employees, query]);

  const zeroSalaryCount = employees.filter((e) => selected.has(e.employeeId) && e.basicSalary === 0).length;

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <Modal open onClose={onClose} title="New payroll run">
      <form action={formAction} className="flex flex-col gap-4">
        <FormField label="Branch" htmlFor="branchId">
          <Select id="branchId" name="branchId">
            <option value="">All branches</option>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </Select>
        </FormField>

        <div className="grid grid-cols-2 gap-4">
          <FormField label="Period start" htmlFor="periodStart" required>
            <Input id="periodStart" name="periodStart" type="date" required />
          </FormField>
          <FormField label="Period end" htmlFor="periodEnd" required>
            <Input id="periodEnd" name="periodEnd" type="date" required />
          </FormField>
        </div>

        <FormField label="Pay date" htmlFor="payDate" hint="When employees will actually be paid">
          <Input id="payDate" name="payDate" type="date" />
        </FormField>

        <FormField label={`Employees (${selected.size} selected)`} htmlFor="employeeSearch">
          <SearchInput value={query} onChange={setQuery} placeholder="Search employees..." />
          <div className="mt-2 max-h-56 overflow-y-auto rounded-md border border-border">
            {filtered.length === 0 ? (
              <p className="p-3 text-sm text-text-tertiary">No employees match.</p>
            ) : (
              <ul className="divide-y divide-border-subtle">
                {filtered.map((e) => (
                  <li key={e.employeeId} className="flex items-center justify-between gap-2 px-3 py-2 text-sm">
                    <label className="flex flex-1 items-center gap-2">
                      <input
                        type="checkbox"
                        name="employeeId"
                        value={e.employeeId}
                        checked={selected.has(e.employeeId)}
                        onChange={() => toggle(e.employeeId)}
                        className="size-4 rounded border-border"
                      />
                      <span className="text-text-primary">{e.employeeName}</span>
                      <span className="text-xs text-text-tertiary">({e.employeeNumber})</span>
                    </label>
                    <span className={e.basicSalary === 0 ? "text-xs font-medium text-danger-600" : "text-xs text-text-tertiary"}>
                      {e.basicSalary === 0 ? "No salary set" : `$${e.basicSalary.toFixed(2)}`}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
          {zeroSalaryCount > 0 && (
            <p className="mt-1 text-xs text-danger-600">
              {zeroSalaryCount} selected employee{zeroSalaryCount === 1 ? "" : "s"} have no basic salary set - set it up in
              Payroll &rarr; Salary Setup first, or their payslip will be $0.
            </p>
          )}
        </FormField>

        <FormField label="Notes" htmlFor="notes">
          <Textarea id="notes" name="notes" />
        </FormField>

        {state.error && <p className="text-sm text-danger-600">{state.error}</p>}

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={isPending} disabled={selected.size === 0}>
            Run payroll
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export function NewPayrollRunModal({
  branches,
  employees,
}: {
  branches: Array<{ id: string; name: string }>;
  employees: EmployeeCompensationRow[];
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="size-4" />
        New Payroll Run
      </Button>
      {open && <RunForm branches={branches} employees={employees} onClose={() => setOpen(false)} />}
    </>
  );
}
