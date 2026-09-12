"use client";

import { useActionState, useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { Modal } from "@/components/Modal";
import { Button } from "@/components/Button";
import { Input, Select, Textarea } from "@/components/Input";
import { FormField } from "@/components/FormField";
import { useToast } from "@/components/Toast";
import { issueWarningAction, initialDisciplinaryActionState } from "./actions";

const WARNING_TYPES = ["verbal", "written", "final"];

function NewWarningForm({ employees, onClose }: { employees: Array<{ id: string; fullName: string }>; onClose: () => void }) {
  const [state, formAction, isPending] = useActionState(issueWarningAction, initialDisciplinaryActionState);
  const { push } = useToast();

  useEffect(() => {
    if (state.success) {
      push("Warning issued");
      onClose();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.success]);

  return (
    <Modal open onClose={onClose} title="Issue Warning">
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

        <FormField label="Warning Type" htmlFor="warningType">
          <Select id="warningType" name="warningType" defaultValue={WARNING_TYPES[0]}>
            {WARNING_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </Select>
        </FormField>

        <FormField label="Reason" htmlFor="reason">
          <Textarea id="reason" name="reason" required />
        </FormField>

        <FormField label="Expires" htmlFor="expiresDate">
          <Input id="expiresDate" name="expiresDate" type="date" />
        </FormField>

        {state.error && <p className="text-sm text-danger-600">{state.error}</p>}

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={isPending}>
            Issue Warning
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export function NewWarningModal({ employees }: { employees: Array<{ id: string; fullName: string }> }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="size-4" />
        Issue Warning
      </Button>
      {open && <NewWarningForm employees={employees} onClose={() => setOpen(false)} />}
    </>
  );
}
