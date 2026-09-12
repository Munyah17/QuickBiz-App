"use client";

import { useActionState, useEffect, useState } from "react";
import { ClipboardList } from "lucide-react";
import { Card, CardHeader } from "@/components/Card";
import { Badge } from "@/components/Badge";
import { Button } from "@/components/Button";
import { Input, Textarea } from "@/components/Input";
import { FormField } from "@/components/FormField";
import { EmptyState } from "@/components/EmptyState";
import { Modal } from "@/components/Modal";
import { useToast } from "@/components/Toast";
import { NewInspectionModal } from "./NewInspectionModal";
import { completeInspectionAction, initialSheqActionState } from "./actions";
import type { InspectionRow } from "@/services/sheq";

const STATUS_TONE: Record<InspectionRow["status"], "neutral" | "success" | "warning" | "danger" | "info"> = {
  scheduled: "neutral",
  in_progress: "info",
  completed: "success",
  cancelled: "danger",
  overdue: "danger",
};

function CompleteInspectionModal({
  inspection,
  onClose,
}: {
  inspection: InspectionRow;
  onClose: () => void;
}) {
  const [state, formAction, isPending] = useActionState(completeInspectionAction, initialSheqActionState);
  const { push } = useToast();

  useEffect(() => {
    if (state.success) {
      push("Inspection completed");
      onClose();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.success]);

  return (
    <Modal open onClose={onClose} title={`Complete Inspection - ${inspection.inspectionNumber}`}>
      <form action={formAction} className="flex flex-col gap-4">
        <input type="hidden" name="inspectionId" value={inspection.id} />

        <FormField label="Findings" htmlFor="findings">
          <Textarea id="findings" name="findings" defaultValue={inspection.findings ?? ""} />
        </FormField>

        <div className="grid grid-cols-2 gap-4">
          <FormField label="Non-Conformities" htmlFor="nonConformities">
            <Input id="nonConformities" name="nonConformities" type="number" min={0} defaultValue={inspection.nonConformities ?? 0} />
          </FormField>
          <FormField label="Minor Issues" htmlFor="minorIssues">
            <Input id="minorIssues" name="minorIssues" type="number" min={0} defaultValue={inspection.minorIssues ?? 0} />
          </FormField>
          <FormField label="Major Issues" htmlFor="majorIssues">
            <Input id="majorIssues" name="majorIssues" type="number" min={0} defaultValue={inspection.majorIssues ?? 0} />
          </FormField>
          <FormField label="Critical Issues" htmlFor="criticalIssues">
            <Input id="criticalIssues" name="criticalIssues" type="number" min={0} defaultValue={inspection.criticalIssues ?? 0} />
          </FormField>
        </div>

        <label className="flex items-center gap-2 text-sm text-text-secondary">
          <input type="checkbox" name="followUpRequired" defaultChecked={inspection.followUpRequired} />
          Follow-up required
        </label>

        {state.error && <p className="text-sm text-danger-600">{state.error}</p>}

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={isPending}>
            Complete Inspection
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export function InspectionsTable({ inspections, canAudit }: { inspections: InspectionRow[]; canAudit: boolean }) {
  const [viewInspection, setViewInspection] = useState<InspectionRow | null>(null);

  return (
    <Card>
      <CardHeader title="Inspections & Audits" action={canAudit && <NewInspectionModal />} />
      {inspections.length === 0 ? (
        <EmptyState icon={ClipboardList} title="No inspections scheduled" description="Schedule an inspection to start auditing safety, health, and quality standards." />
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border-subtle text-left text-xs font-medium uppercase tracking-wide text-text-tertiary">
              <th className="px-4 py-2.5">Reference</th>
              <th className="px-4 py-2.5">Title</th>
              <th className="px-4 py-2.5">Type</th>
              <th className="px-4 py-2.5">Scheduled</th>
              <th className="px-4 py-2.5">Status</th>
              <th className="px-4 py-2.5">Non-Conformities</th>
              <th className="px-4 py-2.5" />
            </tr>
          </thead>
          <tbody>
            {inspections.map((i) => (
              <tr key={i.id} className="border-b border-border-subtle last:border-b-0">
                <td className="px-4 py-2.5 font-medium text-text-primary">{i.inspectionNumber}</td>
                <td className="px-4 py-2.5 text-text-secondary">{i.title}</td>
                <td className="px-4 py-2.5 text-text-secondary">{i.inspectionType}</td>
                <td className="px-4 py-2.5 text-text-secondary">{new Date(i.scheduledDate).toLocaleDateString()}</td>
                <td className="px-4 py-2.5">
                  <Badge tone={STATUS_TONE[i.status]}>{i.status.replace("_", " ")}</Badge>
                </td>
                <td className="px-4 py-2.5 text-text-secondary">{i.nonConformities ?? "-"}</td>
                <td className="px-4 py-2.5">
                  {canAudit && i.status !== "completed" && i.status !== "cancelled" && (
                    <Button variant="secondary" size="sm" onClick={() => setViewInspection(i)}>
                      Complete
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {viewInspection && <CompleteInspectionModal inspection={viewInspection} onClose={() => setViewInspection(null)} />}
    </Card>
  );
}
