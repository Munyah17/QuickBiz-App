"use client";

import { useActionState, useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { Modal } from "@/components/Modal";
import { Button } from "@/components/Button";
import { Input, Select, Textarea } from "@/components/Input";
import { FormField } from "@/components/FormField";
import { useToast } from "@/components/Toast";
import { createCaseAction, initialDisciplinaryActionState } from "./actions";

const VIOLATION_TYPES = ["absenteeism", "misconduct", "insubordination", "negligence", "harassment", "theft", "policy_violation", "performance", "safety", "other"];
const SEVERITIES = ["minor", "moderate", "major", "gross"];

function NewCaseForm({ employees, onClose }: { employees: Array<{ id: string; fullName: string }>; onClose: () => void }) {
  const [state, formAction, isPending] = useActionState(createCaseAction, initialDisciplinaryActionState);
  const { push } = useToast();

  useEffect(() => {
    if (state.success) {
      push("Disciplinary case opened");
      onClose();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.success]);

  return (
    <Modal open onClose={onClose} title="Open Disciplinary Case">
      <form action={formAction} className="flex flex-col gap-4">
        <FormField label="Employee" htmlFor="employeeId">
          <Select id="employeeId" name="employeeId" defaultValue="">
            <option value="" disabled>
              Select an employee
            </option>
            {employees.map((e) => (
              <option key={e.id} value={e.id}>
                {e.fullName}
              </option>
            ))}
          </Select>
        </FormField>

        <FormField label="Violation Type" htmlFor="violationType">
          <Select id="violationType" name="violationType" defaultValue={VIOLATION_TYPES[0]}>
            {VIOLATION_TYPES.map((t) => (
              <option key={t} value={t}>
                {t.replace("_", " ")}
              </option>
            ))}
          </Select>
        </FormField>

        <FormField label="Severity" htmlFor="severity">
          <Select id="severity" name="severity" defaultValue={SEVERITIES[0]}>
            {SEVERITIES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </Select>
        </FormField>

        <FormField label="Title" htmlFor="title">
          <Input id="title" name="title" required />
        </FormField>

        <FormField label="Description" htmlFor="description">
          <Textarea id="description" name="description" required />
        </FormField>

        <FormField label="Incident Date" htmlFor="incidentDate">
          <Input id="incidentDate" name="incidentDate" type="date" required />
        </FormField>

        {state.error && <p className="text-sm text-danger-600">{state.error}</p>}

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={isPending}>
            Open Case
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export function NewCaseModal({ employees }: { employees: Array<{ id: string; fullName: string }> }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="size-4" />
        Open Case
      </Button>
      {open && <NewCaseForm employees={employees} onClose={() => setOpen(false)} />}
    </>
  );
}
