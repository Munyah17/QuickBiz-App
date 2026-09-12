"use client";

import { useActionState, useEffect, useState } from "react";
import { Gavel } from "lucide-react";
import { Card, CardHeader } from "@/components/Card";
import { Badge } from "@/components/Badge";
import { Button } from "@/components/Button";
import { Input, Select, Textarea } from "@/components/Input";
import { FormField } from "@/components/FormField";
import { EmptyState } from "@/components/EmptyState";
import { Modal } from "@/components/Modal";
import { useToast } from "@/components/Toast";
import { NewCaseModal } from "./NewCaseModal";
import { scheduleHearingAction, recordCaseActionAction, closeCaseAction, initialDisciplinaryActionState } from "./actions";
import type { DisciplinaryCaseRow } from "@/services/disciplinary";

const ACTION_TYPES = ["verbal_warning", "written_warning", "suspension", "demotion", "termination", "training", "counseling", "no_action"];

const SEVERITY_TONE: Record<DisciplinaryCaseRow["severity"], "neutral" | "success" | "warning" | "danger"> = {
  minor: "neutral",
  moderate: "warning",
  major: "danger",
  gross: "danger",
};

const STATUS_TONE: Record<DisciplinaryCaseRow["status"], "neutral" | "success" | "warning" | "danger" | "info"> = {
  open: "warning",
  under_investigation: "info",
  hearing_scheduled: "info",
  hearing_completed: "info",
  action_taken: "success",
  appealed: "warning",
  closed: "neutral",
};

function ScheduleHearingModal({ caseRow, onClose }: { caseRow: DisciplinaryCaseRow; onClose: () => void }) {
  const [state, formAction, isPending] = useActionState(scheduleHearingAction, initialDisciplinaryActionState);
  const { push } = useToast();

  useEffect(() => {
    if (state.success) {
      push("Hearing scheduled");
      onClose();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.success]);

  return (
    <Modal open onClose={onClose} title={`Schedule Hearing - ${caseRow.caseNumber}`}>
      <form action={formAction} className="flex flex-col gap-4">
        <input type="hidden" name="caseId" value={caseRow.id} />

        <FormField label="Hearing Date" htmlFor="hearingDate">
          <Input id="hearingDate" name="hearingDate" type="date" required />
        </FormField>

        <FormField label="Hearing Time" htmlFor="hearingTime">
          <Input id="hearingTime" name="hearingTime" type="time" />
        </FormField>

        <FormField label="Location" htmlFor="location">
          <Input id="location" name="location" />
        </FormField>

        {state.error && <p className="text-sm text-danger-600">{state.error}</p>}

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={isPending}>
            Schedule Hearing
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function RecordActionModal({ caseRow, onClose }: { caseRow: DisciplinaryCaseRow; onClose: () => void }) {
  const [state, formAction, isPending] = useActionState(recordCaseActionAction, initialDisciplinaryActionState);
  const { push } = useToast();
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (state.success) {
      push("Disciplinary action recorded");
      onClose();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.success]);

  async function handleClose() {
    setBusy(true);
    try {
      await closeCaseAction(caseRow.id);
      push("Case closed");
      onClose();
    } catch (err) {
      push((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal open onClose={onClose} title={`Record Action - ${caseRow.caseNumber}`}>
      <form action={formAction} className="flex flex-col gap-4">
        <input type="hidden" name="caseId" value={caseRow.id} />

        <FormField label="Action Type" htmlFor="actionType">
          <Select id="actionType" name="actionType" defaultValue={ACTION_TYPES[0]}>
            {ACTION_TYPES.map((a) => (
              <option key={a} value={a}>
                {a.replace("_", " ")}
              </option>
            ))}
          </Select>
        </FormField>

        <FormField label="Action Details" htmlFor="actionTaken">
          <Textarea id="actionTaken" name="actionTaken" required />
        </FormField>

        <FormField label="Effective Date" htmlFor="actionEffectiveDate">
          <Input id="actionEffectiveDate" name="actionEffectiveDate" type="date" />
        </FormField>

        {state.error && <p className="text-sm text-danger-600">{state.error}</p>}

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          {caseRow.status !== "closed" && (
            <Button type="button" variant="secondary" loading={busy} onClick={handleClose}>
              Close Case
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

export function CasesTable({ cases, employees, canManage }: { cases: DisciplinaryCaseRow[]; employees: Array<{ id: string; fullName: string }>; canManage: boolean }) {
  const [hearingCase, setHearingCase] = useState<DisciplinaryCaseRow | null>(null);
  const [actionCase, setActionCase] = useState<DisciplinaryCaseRow | null>(null);

  return (
    <Card>
      <CardHeader title="Disciplinary Cases" action={canManage && <NewCaseModal employees={employees} />} />
      {cases.length === 0 ? (
        <EmptyState icon={Gavel} title="No disciplinary cases" description="Open a case to start tracking a disciplinary matter through to resolution." />
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border-subtle text-left text-xs font-medium uppercase tracking-wide text-text-tertiary">
              <th className="px-4 py-2.5">Case</th>
              <th className="px-4 py-2.5">Employee</th>
              <th className="px-4 py-2.5">Title</th>
              <th className="px-4 py-2.5">Violation</th>
              <th className="px-4 py-2.5">Severity</th>
              <th className="px-4 py-2.5">Incident Date</th>
              <th className="px-4 py-2.5">Status</th>
              <th className="px-4 py-2.5" />
            </tr>
          </thead>
          <tbody>
            {cases.map((c) => (
              <tr key={c.id} className="border-b border-border-subtle last:border-b-0">
                <td className="px-4 py-2.5 font-medium text-text-primary">{c.caseNumber}</td>
                <td className="px-4 py-2.5 text-text-secondary">{c.employeeName}</td>
                <td className="px-4 py-2.5 text-text-secondary">{c.title}</td>
                <td className="px-4 py-2.5 text-text-secondary">{c.violationType.replace("_", " ")}</td>
                <td className="px-4 py-2.5">
                  <Badge tone={SEVERITY_TONE[c.severity]}>{c.severity}</Badge>
                </td>
                <td className="px-4 py-2.5 text-text-secondary">{new Date(c.incidentDate).toLocaleDateString()}</td>
                <td className="px-4 py-2.5">
                  <Badge tone={STATUS_TONE[c.status]}>{c.status.replace("_", " ")}</Badge>
                </td>
                <td className="px-4 py-2.5">
                  {canManage && c.status !== "closed" && (
                    <div className="flex justify-end gap-2">
                      <Button variant="secondary" size="sm" onClick={() => setHearingCase(c)}>
                        Schedule Hearing
                      </Button>
                      <Button variant="secondary" size="sm" onClick={() => setActionCase(c)}>
                        Record Action
                      </Button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {hearingCase && <ScheduleHearingModal caseRow={hearingCase} onClose={() => setHearingCase(null)} />}
      {actionCase && <RecordActionModal caseRow={actionCase} onClose={() => setActionCase(null)} />}
    </Card>
  );
}
