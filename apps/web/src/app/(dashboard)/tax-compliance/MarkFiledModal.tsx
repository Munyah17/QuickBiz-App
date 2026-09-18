"use client";

import { useActionState, useEffect } from "react";
import { Modal } from "@/components/Modal";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { FormField } from "@/components/FormField";
import { useToast } from "@/components/Toast";
import { markTaxFilingSubmittedAction, initialTaxComplianceActionState } from "./actions";
import type { TaxFilingRow } from "@/services/taxCompliance";

export function MarkFiledModal({ filing, onClose }: { filing: TaxFilingRow; onClose: () => void }) {
  const [state, formAction, isPending] = useActionState(markTaxFilingSubmittedAction, initialTaxComplianceActionState);
  const { push } = useToast();

  useEffect(() => {
    if (state.success) {
      push("Recorded as submitted");
      onClose();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.success]);

  return (
    <Modal open onClose={onClose} title="Mark as Filed">
      <form action={formAction} className="flex flex-col gap-4">
        <input type="hidden" name="filingId" value={filing.id} />

        <FormField label="Amount" htmlFor="markAmount">
          <Input id="markAmount" name="amount" type="number" step="0.01" min={0} defaultValue={filing.amount} required />
        </FormField>

        <FormField label="Filing Reference" htmlFor="filingReference" hint="Reference number from ZIMRA's e-Services/FDMS, if any">
          <Input id="filingReference" name="filingReference" />
        </FormField>

        <p className="text-sm text-text-tertiary">
          This records that you submitted this return through ZIMRA&apos;s own e-Services/FDMS - it is not anactual
          submission to ZIMRA and does not file anything on your behalf.
        </p>

        {state.error && <p className="text-sm text-danger-600">{state.error}</p>}

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={isPending}>
            Mark as Filed
          </Button>
        </div>
      </form>
    </Modal>
  );
}
