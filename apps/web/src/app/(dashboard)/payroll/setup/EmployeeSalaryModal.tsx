"use client";

import { useActionState, useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
import { Modal } from "@/components/Modal";
import { Button } from "@/components/Button";
import { Input, Select } from "@/components/Input";
import { FormField } from "@/components/FormField";
import { useToast } from "@/components/Toast";
import {
  setEmployeeBasicSalaryAction,
  assignSalaryComponentAction,
  removeSalaryComponentAction,
  initialSalarySetupActionState,
} from "./actions";
import type { EmployeeCompensationRow, EmployeeSalaryLine, SalaryComponent } from "@/services/payroll";

function BasicSalaryForm({ employee }: { employee: EmployeeCompensationRow }) {
  const [state, formAction, isPending] = useActionState(setEmployeeBasicSalaryAction, initialSalarySetupActionState);
  const { push } = useToast();

  useEffect(() => {
    if (state.success) push("Basic salary updated");
    if (state.error) push(state.error, "error");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.success, state.error]);

  return (
    <form action={formAction} className="flex items-end gap-2">
      <input type="hidden" name="employeeId" value={employee.employeeId} />
      <FormField label="Basic salary" htmlFor="basicSalary">
        <Input id="basicSalary" name="basicSalary" type="number" min="0" step="0.01" defaultValue={employee.basicSalary} />
      </FormField>
      <Button type="submit" variant="secondary" loading={isPending}>
        Save
      </Button>
    </form>
  );
}

function AddComponentForm({ employeeId, availableComponents }: { employeeId: string; availableComponents: SalaryComponent[] }) {
  const [state, formAction, isPending] = useActionState(assignSalaryComponentAction, initialSalarySetupActionState);
  const { push } = useToast();

  useEffect(() => {
    if (state.success) push("Component added");
    if (state.error) push(state.error, "error");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.success, state.error]);

  if (availableComponents.length === 0) return null;

  return (
    <form action={formAction} className="flex items-end gap-2">
      <input type="hidden" name="employeeId" value={employeeId} />
      <FormField label="Component" htmlFor="componentId">
        <Select id="componentId" name="componentId">
          {availableComponents.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name} ({c.component_type}, {c.calculation_method === "percent_of_basic" ? "% of basic" : "fixed"})
            </option>
          ))}
        </Select>
      </FormField>
      <FormField label="Amount" htmlFor="amount" hint="$ or %, per component">
        <Input id="amount" name="amount" type="number" min="0" step="0.01" defaultValue={0} className="w-28" />
      </FormField>
      <Button type="submit" variant="secondary" loading={isPending}>
        Add
      </Button>
    </form>
  );
}

function RemoveComponentButton({ assignmentId }: { assignmentId: string }) {
  const [state, formAction, isPending] = useActionState(removeSalaryComponentAction, initialSalarySetupActionState);
  const { push } = useToast();

  useEffect(() => {
    if (state.error) push(state.error, "error");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.error]);

  return (
    <form action={formAction}>
      <input type="hidden" name="assignmentId" value={assignmentId} />
      <button type="submit" disabled={isPending} title="Remove" className="text-text-tertiary hover:text-danger-600 disabled:opacity-50">
        <Trash2 className="size-4" />
      </button>
    </form>
  );
}

export function EmployeeSalaryModal({
  employee,
  assignments,
  allComponents,
  onClose,
}: {
  employee: EmployeeCompensationRow;
  assignments: EmployeeSalaryLine[];
  allComponents: SalaryComponent[];
  onClose: () => void;
}) {
  const [open] = useState(true);
  const assignedComponentIds = new Set(assignments.map((a) => a.componentId));
  const availableComponents = allComponents.filter((c) => c.is_active && !assignedComponentIds.has(c.id));

  return (
    <Modal open={open} onClose={onClose} title={`Salary structure - ${employee.employeeName}`}>
      <div className="flex flex-col gap-4">
        <BasicSalaryForm employee={employee} />

        <div className="border-t border-border-subtle pt-3">
          <p className="mb-2 text-sm font-semibold text-text-primary">Recurring components</p>
          {assignments.length === 0 ? (
            <p className="text-sm text-text-tertiary">No allowances or recurring deductions assigned.</p>
          ) : (
            <ul className="flex flex-col divide-y divide-border-subtle">
              {assignments.map((a) => (
                <li key={a.id} className="flex items-center justify-between gap-2 py-2 text-sm">
                  <span className="text-text-primary">
                    {a.componentName}{" "}
                    <span className="text-xs text-text-tertiary">
                      ({a.componentType}, {a.calculationMethod === "percent_of_basic" ? `${a.amount}% of basic` : `$${a.amount.toFixed(2)}`})
                    </span>
                  </span>
                  <RemoveComponentButton assignmentId={a.id} />
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="border-t border-border-subtle pt-3">
          <AddComponentForm employeeId={employee.employeeId} availableComponents={availableComponents} />
        </div>

        <div className="flex justify-end pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
}
