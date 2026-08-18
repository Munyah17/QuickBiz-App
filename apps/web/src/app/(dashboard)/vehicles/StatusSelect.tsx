"use client";

import { useActionState, useEffect } from "react";
import { useToast } from "@/components/Toast";
import { updateVehicleStatusAction, initialVehicleActionState } from "./actions";

const STATUSES = ["active", "in_maintenance", "inactive"];

export function StatusSelect({ vehicleId, status }: { vehicleId: string; status: string }) {
  const [state, formAction, isPending] = useActionState(updateVehicleStatusAction, initialVehicleActionState);
  const { push } = useToast();

  useEffect(() => {
    if (state.error) push(state.error, "error");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.error]);

  return (
    <form action={formAction}>
      <input type="hidden" name="vehicleId" value={vehicleId} />
      <select
        name="status"
        defaultValue={status}
        disabled={isPending}
        onChange={(e) => e.target.form?.requestSubmit()}
        className="h-8 rounded-md border border-border bg-white px-2 text-xs capitalize focus:outline-none disabled:opacity-50"
      >
        {STATUSES.map((s) => (
          <option key={s} value={s}>
            {s.replace("_", " ")}
          </option>
        ))}
      </select>
    </form>
  );
}
