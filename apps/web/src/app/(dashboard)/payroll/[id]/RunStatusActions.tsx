"use client";

import { useActionState, useEffect } from "react";
import { Printer } from "lucide-react";
import { Button } from "@/components/Button";
import { useToast } from "@/components/Toast";
import { setPayrollRunStatusAction, initialPayrollActionState } from "../actions";

export function RunStatusActions({ runId, status }: { runId: string; status: "draft" | "finalized" | "paid" }) {
  const [state, formAction, isPending] = useActionState(setPayrollRunStatusAction, initialPayrollActionState);
  const { push } = useToast();

  useEffect(() => {
    if (state.success) push("Payroll run updated");
    if (state.error) push(state.error, "error");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.success, state.error]);

  return (
    <div className="flex items-center gap-2">
      <Button variant="secondary" onClick={() => window.print()}>
        <Printer className="size-4" />
        Print payslips
      </Button>
      {status === "draft" && (
        <form action={formAction}>
          <input type="hidden" name="runId" value={runId} />
          <input type="hidden" name="status" value="finalized" />
          <Button type="submit" loading={isPending}>
            Finalize run
          </Button>
        </form>
      )}
      {status === "finalized" && (
        <form action={formAction}>
          <input type="hidden" name="runId" value={runId} />
          <input type="hidden" name="status" value="paid" />
          <Button type="submit" loading={isPending}>
            Mark as paid
          </Button>
        </form>
      )}
    </div>
  );
}
