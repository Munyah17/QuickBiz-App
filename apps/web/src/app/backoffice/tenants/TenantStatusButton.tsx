"use client";

import { useActionState, useEffect } from "react";
import { useToast } from "@/components/Toast";
import { updateTenantStatusAction, initialTenantActionState } from "./actions";

const DEFAULT_ACTION = { status: "cancelled", label: "Suspend" };

const NEXT_ACTION: Record<string, { status: string; label: string }> = {
  pending: { status: "active", label: "Activate" },
  active: DEFAULT_ACTION,
  past_due: DEFAULT_ACTION,
  cancelled: { status: "active", label: "Reactivate" },
};

export function TenantStatusButton({
  orgId,
  currentStatus,
}: {
  orgId: string;
  currentStatus: string;
}) {
  const [state, formAction, isPending] = useActionState(updateTenantStatusAction, initialTenantActionState);
  const { push } = useToast();

  useEffect(() => {
    if (state.success) push("Tenant status updated");
    if (state.error) push(state.error, "error");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.success, state.error]);

  const action = NEXT_ACTION[currentStatus] ?? DEFAULT_ACTION;

  return (
    <form action={formAction}>
      <input type="hidden" name="orgId" value={orgId} />
      <input type="hidden" name="status" value={action.status} />
      <button
        type="submit"
        disabled={isPending}
        className="text-sm font-medium text-primary-600 hover:underline disabled:opacity-50"
      >
        {action.label}
      </button>
    </form>
  );
}
