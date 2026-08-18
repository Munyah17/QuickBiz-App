"use client";

import { useActionState, useEffect } from "react";
import { useToast } from "@/components/Toast";
import { Button } from "@/components/Button";
import { completeWorkOrderAction, cancelWorkOrderAction, initialWorkOrderActionState } from "./actions";

export function WorkOrderActions({ workOrderId }: { workOrderId: string }) {
  const [completeState, completeAction, completePending] = useActionState(completeWorkOrderAction, initialWorkOrderActionState);
  const [cancelState, cancelAction, cancelPending] = useActionState(cancelWorkOrderAction, initialWorkOrderActionState);
  const { push } = useToast();

  useEffect(() => {
    if (completeState.error) push(completeState.error, "error");
    if (completeState.success) push("Work order completed, stock updated");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [completeState.error, completeState.success]);

  useEffect(() => {
    if (cancelState.error) push(cancelState.error, "error");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cancelState.error]);

  return (
    <div className="flex justify-end gap-2">
      <form action={cancelAction}>
        <input type="hidden" name="workOrderId" value={workOrderId} />
        <Button type="submit" variant="secondary" loading={cancelPending} disabled={completePending}>
          Cancel
        </Button>
      </form>
      <form action={completeAction}>
        <input type="hidden" name="workOrderId" value={workOrderId} />
        <Button type="submit" loading={completePending} disabled={cancelPending}>
          Complete
        </Button>
      </form>
    </div>
  );
}
