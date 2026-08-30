"use client";

import { useMemo, useState, useTransition } from "react";
import { Plus, Pencil, Users } from "lucide-react";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { Badge } from "@/components/Badge";
import { EmptyState } from "@/components/EmptyState";
import { SearchInput } from "@/components/SearchInput";
import { Select } from "@/components/Input";
import { ExportButton } from "@/components/ExportButton";
import { useToast } from "@/components/Toast";
import { EmployeeFormModal } from "./EmployeeFormModal";
import { bulkSetEmployeeStatusAction } from "./actions";
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
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [isBulkPending, startBulkTransition] = useTransition();
  const { push } = useToast();

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return employees.filter((e) => {
      if (statusFilter !== "all" && e.employment_status !== statusFilter) return false;
      if (!q) return true;
      return [e.full_name, e.employee_number, e.position, e.email, e.phone].some((field) =>
        field?.toLowerCase().includes(q)
      );
    });
  }, [employees, query, statusFilter]);

  const allFilteredSelected = filtered.length > 0 && filtered.every((e) => selected.has(e.id));

  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    setSelected(allFilteredSelected ? new Set() : new Set(filtered.map((e) => e.id)));
  }

  function runBulk(status: Employee["employment_status"]) {
    const ids = Array.from(selected);
    const label = status === "active" ? "marked active" : status === "on_leave" ? "marked on leave" : "terminated";
    startBulkTransition(async () => {
      const result = await bulkSetEmployeeStatusAction(ids, status);
      if (result.success) {
        push(`${ids.length} employee${ids.length === 1 ? "" : "s"} ${label}`);
        setSelected(new Set());
      } else if (result.error) {
        push(result.error, "error");
      }
    });
  }

  return (
    <Card>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border-subtle px-4 py-3">
        <h3 className="text-sm font-semibold text-text-primary">
          {filtered.length} of {employees.length} employees
        </h3>
        <div className="flex flex-1 items-center justify-end gap-2">
          <SearchInput value={query} onChange={setQuery} placeholder="Search name, employee #, position..." />
          <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-36">
            <option value="all">All statuses</option>
            <option value="active">Active</option>
            <option value="on_leave">On leave</option>
            <option value="terminated">Terminated</option>
          </Select>
          <ExportButton
            filename="employees"
            rows={filtered.map((e) => ({
              "Employee #": e.employee_number,
              Name: e.full_name,
              Position: e.position ?? "",
              Email: e.email ?? "",
              Phone: e.phone ?? "",
              Branch: e.branchName ?? "",
              Department: e.departmentName ?? "",
              "Hire date": e.hire_date ?? "",
              Status: e.employment_status,
            }))}
          />
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
      </div>

      {canManage && selected.size > 0 && (
        <div className="flex items-center gap-3 border-b border-border-subtle bg-primary-50 px-4 py-2.5">
          <span className="text-sm font-medium text-text-primary">{selected.size} selected</span>
          <Button size="sm" variant="secondary" loading={isBulkPending} onClick={() => runBulk("active")}>
            Mark Active
          </Button>
          <Button size="sm" variant="secondary" loading={isBulkPending} onClick={() => runBulk("on_leave")}>
            Mark On Leave
          </Button>
          <Button size="sm" variant="secondary" loading={isBulkPending} onClick={() => runBulk("terminated")}>
            Terminate
          </Button>
          <button type="button" onClick={() => setSelected(new Set())} className="ml-auto text-sm text-text-tertiary hover:text-text-primary">
            Clear selection
          </button>
        </div>
      )}

      {employees.length === 0 ? (
        <EmptyState icon={Users} title="No employees yet" description="Add your team to start tracking employee records." />
      ) : filtered.length === 0 ? (
        <EmptyState icon={Users} title="No employees match your search" />
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border-subtle text-left text-xs font-medium uppercase tracking-wide text-text-tertiary">
              {canManage && (
                <th className="w-10 px-4 py-2.5">
                  <input type="checkbox" checked={allFilteredSelected} onChange={toggleAll} className="size-4 rounded border-border" />
                </th>
              )}
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
            {filtered.map((employee) => (
              <tr key={employee.id} className="border-b border-border-subtle last:border-b-0">
                {canManage && (
                  <td className="px-4 py-2.5">
                    <input
                      type="checkbox"
                      checked={selected.has(employee.id)}
                      onChange={() => toggleOne(employee.id)}
                      className="size-4 rounded border-border"
                    />
                  </td>
                )}
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
