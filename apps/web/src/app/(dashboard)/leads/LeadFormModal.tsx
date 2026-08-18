"use client";

import { useActionState, useEffect } from "react";
import { Modal } from "@/components/Modal";
import { Button } from "@/components/Button";
import { Input, Select, Textarea } from "@/components/Input";
import { FormField } from "@/components/FormField";
import { useToast } from "@/components/Toast";
import { createLeadAction, updateLeadAction, initialLeadActionState } from "./actions";
import type { Lead } from "@/services/crm";

export function LeadFormModal({ open, onClose, lead }: { open: boolean; onClose: () => void; lead?: Lead }) {
  const isEdit = !!lead;
  const action = isEdit ? updateLeadAction : createLeadAction;
  const [state, formAction, isPending] = useActionState(action, initialLeadActionState);
  const { push } = useToast();

  useEffect(() => {
    if (state.success) {
      push(isEdit ? "Lead updated" : "Lead added");
      onClose();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.success]);

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? `Edit ${lead.name}` : "New lead"}>
      <form action={formAction} className="flex flex-col gap-4">
        {isEdit && <input type="hidden" name="leadId" value={lead.id} />}

        <div className="grid grid-cols-2 gap-4">
          <FormField label="Name" htmlFor="name" required>
            <Input id="name" name="name" required defaultValue={lead?.name} />
          </FormField>
          <FormField label="Company" htmlFor="company">
            <Input id="company" name="company" defaultValue={lead?.company ?? ""} />
          </FormField>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField label="Email" htmlFor="email">
            <Input id="email" name="email" type="email" defaultValue={lead?.email ?? ""} />
          </FormField>
          <FormField label="Phone" htmlFor="phone">
            <Input id="phone" name="phone" defaultValue={lead?.phone ?? ""} />
          </FormField>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField label="Source" htmlFor="source" hint="e.g. Referral, Website, Walk-in">
            <Input id="source" name="source" defaultValue={lead?.source ?? ""} />
          </FormField>
          <FormField label="Status" htmlFor="status">
            <Select id="status" name="status" defaultValue={lead?.status ?? "new"}>
              <option value="new">New</option>
              <option value="contacted">Contacted</option>
              <option value="qualified">Qualified</option>
              <option value="unqualified">Unqualified</option>
            </Select>
          </FormField>
        </div>

        <FormField label="Notes" htmlFor="notes">
          <Textarea id="notes" name="notes" defaultValue={lead?.notes ?? ""} />
        </FormField>

        {state.error && <p className="text-sm text-danger-600">{state.error}</p>}

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={isPending}>
            {isEdit ? "Save changes" : "Add lead"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
