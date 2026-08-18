"use client";

import { useActionState, useEffect } from "react";
import { useToast } from "@/components/Toast";
import { updateOpportunityStageAction, initialOpportunityActionState } from "./actions";
import type { Opportunity } from "@/services/crm";

const STAGES: Opportunity["stage"][] = ["prospecting", "qualification", "proposal", "negotiation", "won", "lost"];

export function StageSelect({ opportunityId, stage }: { opportunityId: string; stage: Opportunity["stage"] }) {
  const [state, formAction, isPending] = useActionState(updateOpportunityStageAction, initialOpportunityActionState);
  const { push } = useToast();

  useEffect(() => {
    if (state.error) push(state.error, "error");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.error]);

  return (
    <form action={formAction}>
      <input type="hidden" name="opportunityId" value={opportunityId} />
      <select
        name="stage"
        defaultValue={stage}
        disabled={isPending}
        onChange={(e) => e.target.form?.requestSubmit()}
        className="h-8 rounded-md border border-border bg-white px-2 text-xs capitalize focus:outline-none disabled:opacity-50"
      >
        {STAGES.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>
    </form>
  );
}
