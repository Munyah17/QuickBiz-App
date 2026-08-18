"use client";

import { useActionState, useEffect } from "react";
import { useToast } from "@/components/Toast";
import { updateProjectStatusAction, initialProjectActionState } from "../actions";

const STATUSES = ["planning", "active", "on_hold", "completed", "cancelled"];

export function ProjectStatusSelect({ projectId, status }: { projectId: string; status: string }) {
  const [state, formAction, isPending] = useActionState(updateProjectStatusAction, initialProjectActionState);
  const { push } = useToast();

  useEffect(() => {
    if (state.success) push("Project status updated");
    if (state.error) push(state.error, "error");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.success, state.error]);

  return (
    <form action={formAction}>
      <input type="hidden" name="projectId" value={projectId} />
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
