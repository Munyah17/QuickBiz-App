"use client";

import { useActionState, useEffect } from "react";
import { Modal } from "@/components/Modal";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { FormField } from "@/components/FormField";
import { useToast } from "@/components/Toast";
import { awardTenderAction, initialTenderActionState } from "./actions";
import type { TenderBidRow } from "@/services/tenders";

export function AwardTenderModal({
  tenderId,
  bid,
  onClose,
  onAwarded,
}: {
  tenderId: string;
  bid: TenderBidRow;
  onClose: () => void;
  onAwarded: () => void;
}) {
  const [state, formAction, isPending] = useActionState(awardTenderAction, initialTenderActionState);
  const { push } = useToast();

  useEffect(() => {
    if (state.success) {
      push("Tender awarded");
      onAwarded();
      onClose();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.success]);

  return (
    <Modal open onClose={onClose} title={`Award Tender to ${bid.supplierName}`}>
      <form action={formAction} className="flex flex-col gap-4">
        <input type="hidden" name="tenderId" value={tenderId} />
        <input type="hidden" name="bidId" value={bid.id} />

        <FormField label="Award Amount" htmlFor="awardAmount">
          <Input id="awardAmount" name="awardAmount" type="number" step="0.01" min={0} defaultValue={bid.amount} required />
        </FormField>

        <p className="text-sm text-text-tertiary">
          Awarding rejects all other bids on this tender and marks it as awarded to {bid.supplierName}.
        </p>

        {state.error && <p className="text-sm text-danger-600">{state.error}</p>}

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={isPending}>
            Award Tender
          </Button>
        </div>
      </form>
    </Modal>
  );
}
