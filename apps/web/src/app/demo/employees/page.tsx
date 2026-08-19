"use client";

import { useState } from "react";
import { Plus, IdCard } from "lucide-react";
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

function AddEmployeeModal({ onClose }: { onClose: () => void }) {
  const { addEmployee } = useDemo();
  const { push } = useToast();
  const [fullName, setFullName] = useState("");
  const [position, setPosition] = useState("");
  const [department, setDepartment] = useState("");

  return (
    <Modal open onClose={onClose} title="Add employee">
      <form
        className="flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          if (!fullName.trim()) return;
          addEmployee({ fullName: fullName.trim(), position: position.trim(), department: department.trim() });
          push("Employee added");
          onClose();
        }}
      >
        <FormField label="Full name" htmlFor="fullName" required>
          <Input id="fullName" required value={fullName} onChange={(e) => setFullName(e.target.value)} />
        </FormField>
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Position" htmlFor="position">
            <Input id="position" value={position} onChange={(e) => setPosition(e.target.value)} />
          </FormField>
          <FormField label="Department" htmlFor="department">
            <Input id="department" value={department} onChange={(e) => setDepartment(e.target.value)} />
          </FormField>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit">Add employee</Button>
        </div>
      </form>
    </Modal>
  );
}

export default function DemoEmployeesPage() {
  const { employees } = useDemo();
  const [open, setOpen] = useState(false);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <PageHeader module="HR" title="Employees" />
        <Button onClick={() => setOpen(true)}>
          <Plus className="size-4" />
          Add Employee
        </Button>
      </div>

      <Card>
        {employees.length === 0 ? (
          <EmptyState icon={IdCard} title="No employees yet" />
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border-subtle text-left text-xs font-medium uppercase tracking-wide text-text-tertiary">
                <th className="px-4 py-2.5">Employee #</th>
                <th className="px-4 py-2.5">Name</th>
                <th className="px-4 py-2.5">Position</th>
                <th className="px-4 py-2.5">Department</th>
                <th className="px-4 py-2.5">Status</th>
              </tr>
            </thead>
            <tbody>
              {employees.map((e) => (
                <tr key={e.id} className="border-b border-border-subtle last:border-b-0">
                  <td className="px-4 py-2.5 font-mono text-text-secondary">{e.employeeNumber}</td>
                  <td className="px-4 py-2.5 font-medium text-text-primary">{e.fullName}</td>
                  <td className="px-4 py-2.5 text-text-secondary">{e.position || "Not specified"}</td>
                  <td className="px-4 py-2.5 text-text-secondary">{e.department || "Not specified"}</td>
                  <td className="px-4 py-2.5">
                    <Badge tone="success">{e.employmentStatus.replace("_", " ")}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      {open && <AddEmployeeModal onClose={() => setOpen(false)} />}
    </div>
  );
}
