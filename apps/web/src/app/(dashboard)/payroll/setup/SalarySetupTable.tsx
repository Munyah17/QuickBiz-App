"use client";

import { useMemo, useState } from "react";
import { Users } from "lucide-react";
import { Card } from "@/components/Card";
import { EmptyState } from "@/components/EmptyState";
import { SearchInput } from "@/components/SearchInput";
import { EmployeeSalaryModal } from "./EmployeeSalaryModal";
import type { EmployeeCompensationRow, EmployeeSalaryLine, SalaryComponent } from "@/services/payroll";

export function SalarySetupTable({
  employees,
  assignmentsByEmployee,
  components,
}: {
  employees: EmployeeCompensationRow[];
  assignmentsByEmployee: Record<string, EmployeeSalaryLine[]>;
  components: SalaryComponent[];
}) {
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<EmployeeCompensationRow | undefined>(undefined);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return employees;
    return employees.filter((e) => e.employeeName.toLowerCase().includes(q) || e.employeeNumber.toLowerCase().includes(q));
  }, [employees, query]);

  return (
    <Card>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border-subtle px-4 py-3">
        <h3 className="text-sm font-semibold text-text-primary">
          {filtered.length} of {employees.length} employees
        </h3>
        <SearchInput value={query} onChange={setQuery} placeholder="Search employees..." />
      </div>

      {employees.length === 0 ? (
        <EmptyState icon={Users} title="No employees yet" description="Add employees in the HR module first." />
      ) : filtered.length === 0 ? (
        <EmptyState icon={Users} title="No employees match your search" />
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border-subtle text-left text-xs font-medium uppercase tracking-wide text-text-tertiary">
              <th className="px-4 py-2.5">Employee</th>
              <th className="px-4 py-2.5">Status</th>
              <th className="px-4 py-2.5">Basic salary</th>
              <th className="px-4 py-2.5">Components</th>
              <th className="px-4 py-2.5" />
            </tr>
          </thead>
          <tbody>
            {filtered.map((e) => {
              const assignments = assignmentsByEmployee[e.employeeId] ?? [];
              return (
                <tr key={e.employeeId} className="border-b border-border-subtle last:border-b-0">
                  <td className="px-4 py-2.5">
                    <p className="font-medium text-text-primary">{e.employeeName}</p>
                    <p className="text-xs text-text-tertiary">{e.employeeNumber}</p>
                  </td>
                  <td className="px-4 py-2.5 capitalize text-text-secondary">{e.employmentStatus.replace("_", " ")}</td>
                  <td className="px-4 py-2.5">
                    <span className={e.basicSalary === 0 ? "font-medium text-danger-600" : "text-text-secondary"}>
                      {e.basicSalary === 0 ? "Not set" : `$${e.basicSalary.toFixed(2)}`}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-text-secondary">
                    {assignments.length === 0 ? "None" : `${assignments.length} assigned`}
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <button onClick={() => setEditing(e)} className="text-sm font-medium text-primary-600 hover:underline">
                      Edit
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      {editing && (
        <EmployeeSalaryModal
          key={editing.employeeId}
          employee={editing}
          assignments={assignmentsByEmployee[editing.employeeId] ?? []}
          allComponents={components}
          onClose={() => setEditing(undefined)}
        />
      )}
    </Card>
  );
}
