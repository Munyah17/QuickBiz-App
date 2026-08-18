"use client";

import { useActionState, useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { Modal } from "@/components/Modal";
import { Button } from "@/components/Button";
import { Input, Select, Textarea } from "@/components/Input";
import { FormField } from "@/components/FormField";
import { useToast } from "@/components/Toast";
import { createOpportunityAction, initialOpportunityActionState } from "./actions";
import type { Customer } from "@/services/customers";

function OpportunityForm({ customers, onClose }: { customers: Customer[]; onClose: () => void }) {
  const [state, formAction, isPending] = useActionState(createOpportunityAction, initialOpportunityActionState);
  const { push } = useToast();

  useEffect(() => {
    if (state.success) {
      push("Opportunity created");
      onClose();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.success]);

  return (
    <Modal open onClose={onClose} title="New opportunity">
      <form action={formAction} className="flex flex-col gap-4">
        <FormField label="Name" htmlFor="name" required>
          <Input id="name" name="name" required placeholder="e.g. Office Supplies Contract" />
        </FormField>

        <FormField label="Customer" htmlFor="customerId">
          <Select id="customerId" name="customerId">
            <option value="">No customer linked yet</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </FormField>

        <div className="grid grid-cols-2 gap-4">
          <FormField label="Value" htmlFor="value">
            <Input id="value" name="value" type="number" min="0" step="0.01" defaultValue={0} />
          </FormField>
          <FormField label="Expected close date" htmlFor="expectedCloseDate">
            <Input id="expectedCloseDate" name="expectedCloseDate" type="date" />
          </FormField>
        </div>

        <FormField label="Stage" htmlFor="stage">
          <Select id="stage" name="stage" defaultValue="prospecting">
            <option value="prospecting">Prospecting</option>
            <option value="qualification">Qualification</option>
            <option value="proposal">Proposal</option>
            <option value="negotiation">Negotiation</option>
          </Select>
        </FormField>

        <FormField label="Notes" htmlFor="notes">
          <Textarea id="notes" name="notes" />
        </FormField>

        {state.error && <p className="text-sm text-danger-600">{state.error}</p>}

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={isPending}>
            Create opportunity
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export function NewOpportunityModal({ customers }: { customers: Customer[] }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button size="sm" onClick={() => setOpen(true)}>
        <Plus className="size-4" />
        New Opportunity
      </Button>
      {open && <OpportunityForm customers={customers} onClose={() => setOpen(false)} />}
    </>
  );
}
