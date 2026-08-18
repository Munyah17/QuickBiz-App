"use client";

import { useActionState, useEffect } from "react";
import { Modal } from "@/components/Modal";
import { Button } from "@/components/Button";
import { Input, Select } from "@/components/Input";
import { FormField } from "@/components/FormField";
import { useToast } from "@/components/Toast";
import { createEmployeeAction, updateEmployeeAction, initialEmployeeActionState } from "./actions";
import type { Employee, Department } from "@/services/hr";

export function EmployeeFormModal({
  open,
  onClose,
  employee,
  branches,
  departments,
}: {
  open: boolean;
  onClose: () => void;
  employee?: Employee;
  branches: Array<{ id: string; name: string }>;
  departments: Department[];
}) {
  const isEdit = !!employee;
  const action = isEdit ? updateEmployeeAction : createEmployeeAction;
  const [state, formAction, isPending] = useActionState(action, initialEmployeeActionState);
  const { push } = useToast();

  useEffect(() => {
    if (state.success) {
      push(isEdit ? "Employee updated" : "Employee added");
      onClose();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.success]);

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? `Edit ${employee.full_name}` : "Add employee"}>
      <form action={formAction} className="flex flex-col gap-4">
        {isEdit && <input type="hidden" name="employeeId" value={employee.id} />}

        <FormField label="Full name" htmlFor="fullName" required>
          <Input id="fullName" name="fullName" required defaultValue={employee?.full_name} />
        </FormField>

        <div className="grid grid-cols-2 gap-4">
          <FormField label="Email" htmlFor="email">
            <Input id="email" name="email" type="email" defaultValue={employee?.email ?? ""} />
          </FormField>
          <FormField label="Phone" htmlFor="phone">
            <Input id="phone" name="phone" defaultValue={employee?.phone ?? ""} />
          </FormField>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField label="Position" htmlFor="position">
            <Input id="position" name="position" defaultValue={employee?.position ?? ""} />
          </FormField>
          <FormField label="Hire date" htmlFor="hireDate">
            <Input id="hireDate" name="hireDate" type="date" defaultValue={employee?.hire_date ?? ""} />
          </FormField>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField label="Branch" htmlFor="branchId">
            <Select id="branchId" name="branchId" defaultValue={employee?.branchId ?? ""}>
              <option value="">No branch</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </Select>
          </FormField>
          <FormField label="Department" htmlFor="departmentId">
            <Select id="departmentId" name="departmentId" defaultValue={employee?.departmentId ?? ""}>
              <option value="">No department</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </Select>
          </FormField>
        </div>

        <FormField label="Status" htmlFor="employmentStatus">
          <Select id="employmentStatus" name="employmentStatus" defaultValue={employee?.employment_status ?? "active"}>
            <option value="active">Active</option>
            <option value="on_leave">On leave</option>
            <option value="terminated">Terminated</option>
          </Select>
        </FormField>

        {state.error && <p className="text-sm text-danger-600">{state.error}</p>}

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={isPending}>
            {isEdit ? "Save changes" : "Add employee"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
