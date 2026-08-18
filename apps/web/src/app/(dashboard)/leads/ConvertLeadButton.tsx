"use client";

import { useActionState, useEffect } from "react";
import { useToast } from "@/components/Toast";
import { convertLeadAction, initialLeadActionState } from "./actions";

export function ConvertLeadButton({ leadId }: { leadId: string }) {
  const [state, formAction, isPending] = useActionState(convertLeadAction, initialLeadActionState);
  const { push } = useToast();

  useEffect(() => {
    if (state.success) push("Lead converted to customer");
    if (state.error) push(state.error, "error");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.success, state.error]);

  return (
    <form action={formAction}>
      <input type="hidden" name="leadId" value={leadId} />
      <button type="submit" disabled={isPending} className="text-sm font-medium text-primary-600 hover:underline disabled:opacity-50">
        Convert
      </button>
    </form>
  );
}
