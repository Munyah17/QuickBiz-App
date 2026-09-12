"use client";

import { useActionState, useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { Modal } from "@/components/Modal";
import { Button } from "@/components/Button";
import { Input, Select } from "@/components/Input";
import { FormField } from "@/components/FormField";
import { useToast } from "@/components/Toast";
import { issueFloatAction, initialPettyCashActionState } from "./actions";

function NewFloatForm({
  projects,
  employees,
  onClose,
}: {
  projects: Array<{ id: string; name: string }>;
  employees: Array<{ id: string; fullName: string }>;
  onClose: () => void;
}) {
  const [state, formAction, isPending] = useActionState(issueFloatAction, initialPettyCashActionState);
  const { push } = useToast();

  useEffect(() => {
    if (state.success) {
      push("Petty cash float issued");
      onClose();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.success]);

  return (
    <Modal open onClose={onClose} title="Issue Petty Cash Float">
      <form action={formAction} className="flex flex-col gap-4">
        <FormField label="Project" htmlFor="projectId">
          <Select id="projectId" name="projectId" defaultValue="">
            <option value="" disabled>
              Select a project
            </option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </Select>
        </FormField>

        <FormField label="Fund Name" htmlFor="fundName">
          <Input id="fundName" name="fundName" required />
        </FormField>

        <FormField label="Initial Amount" htmlFor="initialAmount">
          <Input id="initialAmount" name="initialAmount" type="number" min="0" step="0.01" required />
        </FormField>

        <FormField label="Custodian" htmlFor="custodianId">
          <Select id="custodianId" name="custodianId" defaultValue="">
            <option value="">No custodian assigned</option>
            {employees.map((e) => (
              <option key={e.id} value={e.id}>
                {e.fullName}
              </option>
            ))}
          </Select>
        </FormField>

        {state.error && <p className="text-sm text-danger-600">{state.error}</p>}

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={isPending}>
            Issue Float
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export function NewFloatModal({ projects, employees }: { projects: Array<{ id: string; name: string }>; employees: Array<{ id: string; fullName: string }> }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="size-4" />
        Issue Float
      </Button>
      {open && <NewFloatForm projects={projects} employees={employees} onClose={() => setOpen(false)} />}
    </>
  );
}
