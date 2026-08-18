"use client";

import { useActionState, useState } from "react";
import { Plus } from "lucide-react";
import { Modal } from "@/components/Modal";
import { Button } from "@/components/Button";
import { Input, Select, Textarea } from "@/components/Input";
import { FormField } from "@/components/FormField";
import { createTicketAction, initialTicketActionState } from "./actions";
import type { Customer } from "@/services/customers";

function TicketForm({ customers, branchId, onClose }: { customers: Customer[]; branchId: string; onClose: () => void }) {
  const [state, formAction, isPending] = useActionState(createTicketAction, initialTicketActionState);

  return (
    <Modal open onClose={onClose} title="New ticket">
      <form action={formAction} className="flex flex-col gap-4">
        <input type="hidden" name="branchId" value={branchId} />

        <FormField label="Subject" htmlFor="subject" required>
          <Input id="subject" name="subject" required />
        </FormField>

        <div className="grid grid-cols-2 gap-4">
          <FormField label="Customer" htmlFor="customerId">
            <Select id="customerId" name="customerId">
              <option value="">Internal</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </FormField>
          <FormField label="Priority" htmlFor="priority">
            <Select id="priority" name="priority" defaultValue="medium">
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </Select>
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
            Create ticket
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export function NewTicketModal({ customers, branchId }: { customers: Customer[]; branchId: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="size-4" />
        New Ticket
      </Button>
      {open && <TicketForm customers={customers} branchId={branchId} onClose={() => setOpen(false)} />}
    </>
  );
}
