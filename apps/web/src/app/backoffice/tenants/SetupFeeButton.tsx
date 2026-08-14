"use client";

import { useActionState, useEffect } from "react";
import { useToast } from "@/components/Toast";
import { toggleSetupFeeAction, initialTenantActionState } from "./actions";

export function SetupFeeButton({ orgId, paid }: { orgId: string; paid: boolean }) {
  const [state, formAction, isPending] = useActionState(toggleSetupFeeAction, initialTenantActionState);
  const { push } = useToast();

  useEffect(() => {
    if (state.success) push("Setup fee status updated");
    if (state.error) push(state.error, "error");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.success, state.error]);

  return (
    <form action={formAction}>
      <input type="hidden" name="orgId" value={orgId} />
      <input type="hidden" name="paid" value={String(!paid)} />
      <button
        type="submit"
        disabled={isPending}
        className="text-sm font-medium text-primary-600 hover:underline disabled:opacity-50"
      >
        {paid ? "Mark unpaid" : "Mark paid"}
      </button>
    </form>
  );
}
