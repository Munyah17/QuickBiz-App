"use client";

import { useActionState, useEffect, useState } from "react";
import { CalendarClock } from "lucide-react";
import { Card, CardHeader } from "@/components/Card";
import { Badge } from "@/components/Badge";
import { Button } from "@/components/Button";
import { Textarea } from "@/components/Input";
import { FormField } from "@/components/FormField";
import { EmptyState } from "@/components/EmptyState";
import { Modal } from "@/components/Modal";
import { useToast } from "@/components/Toast";
import { recordHearingOutcomeAction, initialDisciplinaryActionState } from "./actions";
import type { DisciplinaryHearingRow } from "@/services/disciplinary";

const STATUS_TONE: Record<DisciplinaryHearingRow["status"], "neutral" | "success" | "warning" | "danger" | "info"> = {
  scheduled: "info",
  in_progress: "warning",
  completed: "success",
  postponed: "warning",
  cancelled: "danger",
};

function RecordOutcomeModal({ hearing, onClose }: { hearing: DisciplinaryHearingRow; onClose: () => void }) {
  const [state, formAction, isPending] = useActionState(recordHearingOutcomeAction, initialDisciplinaryActionState);
  const { push } = useToast();

  useEffect(() => {
    if (state.success) {
      push("Hearing outcome recorded");
      onClose();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.success]);

  return (
    <Modal open onClose={onClose} title={`Record Outcome - ${hearing.caseNumber}`}>
      <form action={formAction} className="flex flex-col gap-4">
        <input type="hidden" name="hearingId" value={hearing.id} />

        <FormField label="Outcome" htmlFor="outcome">
          <Textarea id="outcome" name="outcome" defaultValue={hearing.outcome ?? ""} />
        </FormField>

        <FormField label="Decision" htmlFor="decision">
          <Textarea id="decision" name="decision" defaultValue={hearing.decision ?? ""} required />
        </FormField>

        {state.error && <p className="text-sm text-danger-600">{state.error}</p>}

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={isPending}>
            Save
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export function HearingsTable({ hearings, canManage }: { hearings: DisciplinaryHearingRow[]; canManage: boolean }) {
  const [viewHearing, setViewHearing] = useState<DisciplinaryHearingRow | null>(null);

  return (
    <Card>
      <CardHeader title="Hearings" />
      {hearings.length === 0 ? (
        <EmptyState icon={CalendarClock} title="No hearings scheduled" description="Hearings scheduled against a case will appear here." />
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border-subtle text-left text-xs font-medium uppercase tracking-wide text-text-tertiary">
              <th className="px-4 py-2.5">Case</th>
              <th className="px-4 py-2.5">Hearing Date</th>
              <th className="px-4 py-2.5">Location</th>
              <th className="px-4 py-2.5">Status</th>
              <th className="px-4 py-2.5">Decision</th>
              <th className="px-4 py-2.5" />
            </tr>
          </thead>
          <tbody>
            {hearings.map((h) => (
              <tr key={h.id} className="border-b border-border-subtle last:border-b-0">
                <td className="px-4 py-2.5 font-medium text-text-primary">{h.caseNumber}</td>
                <td className="px-4 py-2.5 text-text-secondary">
                  {new Date(h.hearingDate).toLocaleDateString()}
                  {h.hearingTime ? ` ${h.hearingTime}` : ""}
                </td>
                <td className="px-4 py-2.5 text-text-secondary">{h.location ?? "-"}</td>
                <td className="px-4 py-2.5">
                  <Badge tone={STATUS_TONE[h.status]}>{h.status.replace("_", " ")}</Badge>
                </td>
                <td className="px-4 py-2.5 text-text-secondary">{h.decision ?? "-"}</td>
                <td className="px-4 py-2.5">
                  {canManage && h.status !== "completed" && h.status !== "cancelled" && (
                    <Button variant="secondary" size="sm" onClick={() => setViewHearing(h)}>
                      Record Outcome
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {viewHearing && <RecordOutcomeModal hearing={viewHearing} onClose={() => setViewHearing(null)} />}
    </Card>
  );
}
