"use client";

import { useActionState, useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { Modal } from "@/components/Modal";
import { Button } from "@/components/Button";
import { Input, Select, Textarea } from "@/components/Input";
import { FormField } from "@/components/FormField";
import { useToast } from "@/components/Toast";
import { createRiskAssessmentAction, initialRiskInsuranceActionState } from "./actions";

const CATEGORIES = ["operational", "financial", "compliance", "strategic", "reputational", "health_safety", "other"];

function NewRiskAssessmentForm({ onClose }: { onClose: () => void }) {
  const [state, formAction, isPending] = useActionState(createRiskAssessmentAction, initialRiskInsuranceActionState);
  const { push } = useToast();

  useEffect(() => {
    if (state.success) {
      push("Risk assessment created");
      onClose();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.success]);

  return (
    <Modal open onClose={onClose} title="New Risk Assessment">
      <form action={formAction} className="flex flex-col gap-4">
        <FormField label="Title" htmlFor="title">
          <Input id="title" name="title" required />
        </FormField>

        <FormField label="Category" htmlFor="category">
          <Select id="category" name="category" defaultValue={CATEGORIES[0]}>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c.replace("_", " ")}
              </option>
            ))}
          </Select>
        </FormField>

        <FormField label="Likelihood (1-5)" htmlFor="likelihood">
          <Input id="likelihood" name="likelihood" type="number" step="0.5" min={1} max={5} required />
        </FormField>

        <FormField label="Impact (1-5)" htmlFor="impact">
          <Input id="impact" name="impact" type="number" step="0.5" min={1} max={5} required />
        </FormField>

        <FormField label="Description" htmlFor="description">
          <Textarea id="description" name="description" />
        </FormField>

        <FormField label="Mitigation Strategy" htmlFor="mitigationStrategy">
          <Textarea id="mitigationStrategy" name="mitigationStrategy" />
        </FormField>

        <FormField label="Review Date" htmlFor="reviewDate">
          <Input id="reviewDate" name="reviewDate" type="date" />
        </FormField>

        {state.error && <p className="text-sm text-danger-600">{state.error}</p>}

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={isPending}>
            Create Assessment
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export function NewRiskAssessmentModal() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="size-4" />
        New Risk Assessment
      </Button>
      {open && <NewRiskAssessmentForm onClose={() => setOpen(false)} />}
    </>
  );
}
