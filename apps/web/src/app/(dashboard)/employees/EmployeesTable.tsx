"use client";

import { useState } from "react";
import { Plus, Pencil, Users } from "lucide-react";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { Badge } from "@/components/Badge";
import { EmptyState } from "@/components/EmptyState";
import { EmployeeFormModal } from "./EmployeeFormModal";
import type { Employee, Department } from "@/services/hr";

const statusTone: Record<Employee["employment_status"], "success" | "warning" | "danger"> = {
  active: "success",
  on_leave: "warning",
  terminated: "danger",
};

export function EmployeesTable({
  employees,
  branches,
  departments,
  canManage,
}: {
  employees: Employee[];
  branches: Array<{ id: string; name: string }>;
  departments: Department[];
  canManage: boolean;
}) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Employee | undefined>(undefined);

  return (
    <Card>
      <div className="flex items-center justify-between border-b border-border-subtle px-4 py-3">
        <h3 className="text-sm font-semibold text-text-primary">{employees.length} employees</h3>
        {canManage && (
          <Button
            size="sm"
            onClick={() => {
              setEditing(undefined);
              setModalOpen(true);
            }}
          >
            <Plus className="size-4" />
            Add Employee
          </Button>
        )}
      </div>

      {employees.length === 0 ? (
        <EmptyState icon={Users} title="No employees yet" description="Add your team to start tracking employee records." />
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border-subtle text-left text-xs font-medium uppercase tracking-wide text-text-tertiary">
              <th className="px-4 py-2.5">Employee #</th>
              <th className="px-4 py-2.5">Name</th>
              <th className="px-4 py-2.5">Position</th>
              <th className="px-4 py-2.5">Branch</th>
              <th className="px-4 py-2.5">Department</th>
              <th className="px-4 py-2.5">Status</th>
              {canManage && <th className="px-4 py-2.5" />}
            </tr>
          </thead>
          <tbody>
            {employees.map((employee) => (
              <tr key={employee.id} className="border-b border-border-subtle last:border-b-0">
                <td className="px-4 py-2.5 font-mono text-text-secondary">{employee.employee_number}</td>
                <td className="px-4 py-2.5 font-medium text-text-primary">{employee.full_name}</td>
                <td className="px-4 py-2.5 text-text-secondary">{employee.position || "No position"}</td>
                <td className="px-4 py-2.5 text-text-secondary">{employee.branchName ?? "No branch"}</td>
                <td className="px-4 py-2.5 text-text-secondary">{employee.departmentName ?? "No department"}</td>
                <td className="px-4 py-2.5">
                  <Badge tone={statusTone[employee.employment_status]}>{employee.employment_status.replace("_", " ")}</Badge>
                </td>
                {canManage && (
                  <td className="px-4 py-2.5 text-right">
                    <button
                      onClick={() => {
                        setEditing(employee);
                        setModalOpen(true);
                      }}
                      title="Edit employee"
                      className="text-text-tertiary hover:text-primary-600"
                    >
                      <Pencil className="size-4" />
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {canManage && modalOpen && (
        <EmployeeFormModal
          key={editing?.id ?? "new"}
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          employee={editing}
          branches={branches}
          departments={departments}
        />
      )}
    </Card>
  );
}
