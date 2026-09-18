"use client";

import { useActionState, useEffect } from "react";
import { useToast } from "@/components/Toast";
import { applyCreditNoteAction, initialSalesActionState } from "../actions";

export function ApplyCreditNoteButton({ creditNoteId, invoiceId }: { creditNoteId: string; invoiceId: string }) {
  const [state, formAction, isPending] = useActionState(applyCreditNoteAction, initialSalesActionState);
  const { push } = useToast();

  useEffect(() => {
    if (state.success) push("Credit note applied to invoice");
    if (state.error) push(state.error, "error");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.success, state.error]);

  return (
    <form action={formAction}>
      <input type="hidden" name="creditNoteId" value={creditNoteId} />
      <input type="hidden" name="invoiceId" value={invoiceId} />
      <button
        type="submit"
        disabled={isPending}
        className="text-sm font-medium text-primary-600 hover:underline disabled:opacity-50"
      >
        Apply to invoice
      </button>
    </form>
  );
}
