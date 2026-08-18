"use client";

import { useActionState, useEffect } from "react";
import { useToast } from "@/components/Toast";
import { updateTicketStatusAction, initialTicketActionState } from "../actions";

const STATUSES = ["open", "in_progress", "resolved", "closed"];

export function StatusSelect({ ticketId, status }: { ticketId: string; status: string }) {
  const [state, formAction, isPending] = useActionState(updateTicketStatusAction, initialTicketActionState);
  const { push } = useToast();

  useEffect(() => {
    if (state.success) push("Ticket status updated");
    if (state.error) push(state.error, "error");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.success, state.error]);

  return (
    <form action={formAction}>
      <input type="hidden" name="ticketId" value={ticketId} />
      <select
        name="status"
        defaultValue={status}
        disabled={isPending}
        onChange={(e) => e.target.form?.requestSubmit()}
        className="h-9 rounded-md border border-border bg-white px-3 text-sm capitalize focus:outline-none disabled:opacity-50"
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
