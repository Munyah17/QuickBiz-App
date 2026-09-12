"use client";

import { useActionState, useEffect, useState } from "react";
import { AlertTriangle } from "lucide-react";
import { Card, CardHeader } from "@/components/Card";
import { Badge } from "@/components/Badge";
import { Button } from "@/components/Button";
import { Input, Textarea } from "@/components/Input";
import { FormField } from "@/components/FormField";
import { EmptyState } from "@/components/EmptyState";
import { Modal } from "@/components/Modal";
import { useToast } from "@/components/Toast";
import { NewIncidentModal } from "./NewIncidentModal";
import { recordCorrectiveActionAction, closeIncidentAction, initialSheqActionState } from "./actions";
import type { IncidentRow } from "@/services/sheq";

const SEVERITY_TONE: Record<IncidentRow["severity"], "neutral" | "success" | "warning" | "danger"> = {
  minor: "neutral",
  moderate: "warning",
  major: "danger",
  critical: "danger",
};

const STATUS_TONE: Record<IncidentRow["status"], "neutral" | "success" | "warning" | "danger" | "info"> = {
  open: "warning",
  under_investigation: "info",
  closed: "success",
  archived: "neutral",
};

function CorrectiveActionModal({
  incident,
  onClose,
}: {
  incident: IncidentRow;
  onClose: () => void;
}) {
  const [state, formAction, isPending] = useActionState(recordCorrectiveActionAction, initialSheqActionState);
  const { push } = useToast();
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (state.success) {
      push("Corrective action recorded");
      onClose();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.success]);

  async function handleClose() {
    setBusy(true);
    try {
      await closeIncidentAction(incident.id);
      push("Incident closed");
      onClose();
    } catch (err) {
      push((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal open onClose={onClose} title={`Corrective Action - ${incident.incidentNumber}`}>
      <form action={formAction} className="flex flex-col gap-4">
        <input type="hidden" name="incidentId" value={incident.id} />

        <FormField label="Root Cause" htmlFor="rootCause">
          <Textarea id="rootCause" name="rootCause" defaultValue={incident.rootCause ?? ""} />
        </FormField>

        <FormField label="Corrective Actions" htmlFor="correctiveActions">
          <Textarea id="correctiveActions" name="correctiveActions" defaultValue={incident.correctiveActions ?? ""} required />
        </FormField>

        <FormField label="Preventive Actions" htmlFor="preventiveActions">
          <Textarea id="preventiveActions" name="preventiveActions" defaultValue={incident.preventiveActions ?? ""} />
        </FormField>

        <FormField label="Target Completion Date" htmlFor="targetCompletionDate">
          <Input
            id="targetCompletionDate"
            name="targetCompletionDate"
            type="date"
            defaultValue={incident.targetCompletionDate ?? ""}
          />
        </FormField>

        {state.error && <p className="text-sm text-danger-600">{state.error}</p>}

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          {incident.status !== "closed" && (
            <Button type="button" variant="secondary" loading={busy} onClick={handleClose}>
              Close Incident
            </Button>
          )}
          <Button type="submit" loading={isPending}>
            Save
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export function IncidentsTable({ incidents, canManage }: { incidents: IncidentRow[]; canManage: boolean }) {
  const [viewIncident, setViewIncident] = useState<IncidentRow | null>(null);

  return (
    <Card>
      <CardHeader title="Incidents" action={canManage && <NewIncidentModal />} />
      {incidents.length === 0 ? (
        <EmptyState icon={AlertTriangle} title="No incidents reported" description="Report an incident to start tracking corrective actions." />
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border-subtle text-left text-xs font-medium uppercase tracking-wide text-text-tertiary">
              <th className="px-4 py-2.5">Reference</th>
              <th className="px-4 py-2.5">Title</th>
              <th className="px-4 py-2.5">Type</th>
              <th className="px-4 py-2.5">Severity</th>
              <th className="px-4 py-2.5">Date Occurred</th>
              <th className="px-4 py-2.5">Status</th>
              <th className="px-4 py-2.5" />
            </tr>
          </thead>
          <tbody>
            {incidents.map((i) => (
              <tr key={i.id} className="border-b border-border-subtle last:border-b-0">
                <td className="px-4 py-2.5 font-medium text-text-primary">{i.incidentNumber}</td>
                <td className="px-4 py-2.5 text-text-secondary">{i.title}</td>
                <td className="px-4 py-2.5 text-text-secondary">{i.incidentType.replace("_", " ")}</td>
                <td className="px-4 py-2.5">
                  <Badge tone={SEVERITY_TONE[i.severity]}>{i.severity}</Badge>
                </td>
                <td className="px-4 py-2.5 text-text-secondary">{new Date(i.dateOccurred).toLocaleDateString()}</td>
                <td className="px-4 py-2.5">
                  <Badge tone={STATUS_TONE[i.status]}>{i.status.replace("_", " ")}</Badge>
                </td>
                <td className="px-4 py-2.5">
                  {canManage && (
                    <Button variant="secondary" size="sm" onClick={() => setViewIncident(i)}>
                      Corrective Action
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {viewIncident && <CorrectiveActionModal incident={viewIncident} onClose={() => setViewIncident(null)} />}
    </Card>
  );
}
