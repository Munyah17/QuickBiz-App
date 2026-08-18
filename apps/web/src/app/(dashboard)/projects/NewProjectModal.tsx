"use client";

import { useActionState, useState } from "react";
import { Plus } from "lucide-react";
import { Modal } from "@/components/Modal";
import { Button } from "@/components/Button";
import { Input, Select, Textarea } from "@/components/Input";
import { FormField } from "@/components/FormField";
import { createProjectAction, initialProjectActionState } from "./actions";
import type { Customer } from "@/services/customers";

function ProjectForm({ customers, onClose }: { customers: Customer[]; onClose: () => void }) {
  const [state, formAction, isPending] = useActionState(createProjectAction, initialProjectActionState);

  return (
    <Modal open onClose={onClose} title="New project">
      <form action={formAction} className="flex flex-col gap-4">
        <FormField label="Name" htmlFor="name" required>
          <Input id="name" name="name" required />
        </FormField>

        <FormField label="Customer" htmlFor="customerId">
          <Select id="customerId" name="customerId">
            <option value="">Internal project</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </FormField>

        <div className="grid grid-cols-2 gap-4">
          <FormField label="Budget" htmlFor="budget">
            <Input id="budget" name="budget" type="number" min="0" step="0.01" defaultValue={0} />
          </FormField>
          <FormField label="Status" htmlFor="status">
            <Select id="status" name="status" defaultValue="planning">
              <option value="planning">Planning</option>
              <option value="active">Active</option>
              <option value="on_hold">On hold</option>
            </Select>
          </FormField>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField label="Start date" htmlFor="startDate">
            <Input id="startDate" name="startDate" type="date" />
          </FormField>
          <FormField label="End date" htmlFor="endDate">
            <Input id="endDate" name="endDate" type="date" />
          </FormField>
        </div>

        <FormField label="Description" htmlFor="description">
          <Textarea id="description" name="description" />
        </FormField>

        {state.error && <p className="text-sm text-danger-600">{state.error}</p>}

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={isPending}>
            Create project
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export function NewProjectModal({ customers }: { customers: Customer[] }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="size-4" />
        New Project
      </Button>
      {open && <ProjectForm customers={customers} onClose={() => setOpen(false)} />}
    </>
  );
}
