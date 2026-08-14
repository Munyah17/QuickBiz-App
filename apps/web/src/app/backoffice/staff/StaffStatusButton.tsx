"use client";

import { useActionState, useEffect } from "react";
import { useToast } from "@/components/Toast";
import { updateStaffStatusAction, initialStaffActionState } from "./actions";

export function StaffStatusButton({ staffId, currentStatus }: { staffId: string; currentStatus: string }) {
  const [state, formAction, isPending] = useActionState(updateStaffStatusAction, initialStaffActionState);
  const { push } = useToast();

  useEffect(() => {
    if (state.success) push("Staff status updated");
    if (state.error) push(state.error, "error");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.success, state.error]);

  const nextStatus = currentStatus === "suspended" ? "active" : "suspended";
  const label = currentStatus === "suspended" ? "Reactivate" : "Suspend";

  return (
    <form action={formAction}>
      <input type="hidden" name="staffId" value={staffId} />
      <input type="hidden" name="status" value={nextStatus} />
      <button
        type="submit"
        disabled={isPending}
        className="text-sm font-medium text-primary-600 hover:underline disabled:opacity-50"
      >
        {label}
      </button>
    </form>
  );
}
