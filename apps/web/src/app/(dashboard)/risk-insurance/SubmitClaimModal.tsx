"use client";

import { useActionState, useEffect } from "react";
import { Modal } from "@/components/Modal";
import { Button } from "@/components/Button";
import { Input, Textarea } from "@/components/Input";
import { FormField } from "@/components/FormField";
import { useToast } from "@/components/Toast";
import { submitClaimAction, initialRiskInsuranceActionState } from "./actions";

export function SubmitClaimModal({
  policyId,
  onClose,
  onSubmitted,
}: {
  policyId: string;
  onClose: () => void;
  onSubmitted: () => void;
}) {
  const [state, formAction, isPending] = useActionState(submitClaimAction, initialRiskInsuranceActionState);
  const { push } = useToast();

  useEffect(() => {
    if (state.success) {
      push("Claim submitted");
      onSubmitted();
      onClose();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.success]);

  return (
    <Modal open onClose={onClose} title="Submit Claim">
      <form action={formAction} className="flex flex-col gap-4">
        <input type="hidden" name="policyId" value={policyId} />

        <FormField label="Incident Date" htmlFor="incidentDate">
          <Input id="incidentDate" name="incidentDate" type="date" required />
        </FormField>

        <FormField label="Incident Description" htmlFor="incidentDescription">
          <Textarea id="incidentDescription" name="incidentDescription" required />
        </FormField>

        <FormField label="Claim Amount" htmlFor="claimAmount">
          <Input id="claimAmount" name="claimAmount" type="number" step="0.01" min={0} required />
        </FormField>

        {state.error && <p className="text-sm text-danger-600">{state.error}</p>}

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={isPending}>
            Submit Claim
          </Button>
        </div>
      </form>
    </Modal>
  );
}
