"use client";

import { useState } from "react";
import { AlertTriangle, ClipboardList, Plus } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardHeader } from "@/components/Card";
import { Badge } from "@/components/Badge";
import { Button } from "@/components/Button";
import { Input, Select, Textarea } from "@/components/Input";
import { FormField } from "@/components/FormField";
import { EmptyState } from "@/components/EmptyState";
import { Modal } from "@/components/Modal";
import { useDemo, type DemoSheqIncident, type DemoSheqInspection } from "@/lib/demo/DemoContext";
import { useToast } from "@/components/Toast";

const INCIDENT_TYPES = ["injury", "illness", "near_miss", "property_damage", "environmental", "security", "fire", "other"];
const SEVERITIES: DemoSheqIncident["severity"][] = ["minor", "moderate", "major", "critical"];
const INSPECTION_TYPES = ["safety", "health", "environmental", "quality", "fire", "equipment", "housekeeping"];

const SEVERITY_TONE: Record<DemoSheqIncident["severity"], "neutral" | "success" | "warning" | "danger"> = {
  minor: "neutral",
  moderate: "warning",
  major: "danger",
  critical: "danger",
};

const INCIDENT_STATUS_TONE: Record<DemoSheqIncident["status"], "neutral" | "success" | "warning" | "danger" | "info"> = {
  open: "warning",
  under_investigation: "info",
  closed: "success",
  archived: "neutral",
};

const INSPECTION_STATUS_TONE: Record<DemoSheqInspection["status"], "neutral" | "success" | "warning" | "danger" | "info"> = {
  scheduled: "neutral",
  in_progress: "info",
  completed: "success",
  cancelled: "danger",
  overdue: "danger",
};

function ReportIncidentModal({ onClose }: { onClose: () => void }) {
  const { reportIncident } = useDemo();
  const { push } = useToast();
  const [incidentType, setIncidentType] = useState(INCIDENT_TYPES[0]);
  const [severity, setSeverity] = useState<DemoSheqIncident["severity"]>(SEVERITIES[0]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");

  return (
    <Modal open onClose={onClose} title="Report Incident">
      <form
        className="flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          reportIncident({ incidentType, severity, title: title.trim(), description: description.trim(), location: location.trim() });
          push("Incident reported");
          onClose();
        }}
      >
        <FormField label="Incident Type" htmlFor="incidentType">
          <Select id="incidentType" value={incidentType} onChange={(e) => setIncidentType(e.target.value)}>
            {INCIDENT_TYPES.map((t) => (
              <option key={t} value={t}>
                {t.replace("_", " ")}
              </option>
            ))}
          </Select>
        </FormField>

        <FormField label="Severity" htmlFor="severity">
          <Select id="severity" value={severity} onChange={(e) => setSeverity(e.target.value as DemoSheqIncident["severity"])}>
            {SEVERITIES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </Select>
        </FormField>

        <FormField label="Title" htmlFor="title">
          <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} required />
        </FormField>

        <FormField label="Description" htmlFor="description">
          <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} required />
        </FormField>

        <FormField label="Location" htmlFor="location">
          <Input id="location" value={location} onChange={(e) => setLocation(e.target.value)} />
        </FormField>

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit">Report Incident</Button>
        </div>
      </form>
    </Modal>
  );
}

function CorrectiveActionModal({ incident, onClose }: { incident: DemoSheqIncident; onClose: () => void }) {
  const { recordIncidentCorrectiveAction, closeIncident } = useDemo();
  const { push } = useToast();
  const [correctiveActions, setCorrectiveActions] = useState(incident.correctiveActions ?? "");

  return (
    <Modal open onClose={onClose} title={`Corrective Action - ${incident.incidentNumber}`}>
      <form
        className="flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          recordIncidentCorrectiveAction(incident.id, correctiveActions.trim());
          push("Corrective action recorded");
          onClose();
        }}
      >
        <FormField label="Corrective Actions" htmlFor="correctiveActions">
          <Textarea id="correctiveActions" value={correctiveActions} onChange={(e) => setCorrectiveActions(e.target.value)} required />
        </FormField>

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          {incident.status !== "closed" && (
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                closeIncident(incident.id);
                push("Incident closed");
                onClose();
              }}
            >
              Close Incident
            </Button>
          )}
          <Button type="submit">Save</Button>
        </div>
      </form>
    </Modal>
  );
}

function ScheduleInspectionModal({ onClose }: { onClose: () => void }) {
  const { scheduleInspection } = useDemo();
  const { push } = useToast();
  const [inspectionType, setInspectionType] = useState(INSPECTION_TYPES[0]);
  const [title, setTitle] = useState("");
  const [scheduledDate, setScheduledDate] = useState("");

  return (
    <Modal open onClose={onClose} title="Schedule Inspection">
      <form
        className="flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          scheduleInspection({ inspectionType, title: title.trim(), scheduledDate });
          push("Inspection scheduled");
          onClose();
        }}
      >
        <FormField label="Inspection Type" htmlFor="inspectionType">
          <Select id="inspectionType" value={inspectionType} onChange={(e) => setInspectionType(e.target.value)}>
            {INSPECTION_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </Select>
        </FormField>

        <FormField label="Title" htmlFor="title">
          <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} required />
        </FormField>

        <FormField label="Scheduled Date" htmlFor="scheduledDate">
          <Input id="scheduledDate" type="date" value={scheduledDate} onChange={(e) => setScheduledDate(e.target.value)} required />
        </FormField>

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit">Schedule Inspection</Button>
        </div>
      </form>
    </Modal>
  );
}

function CompleteInspectionModal({ inspection, onClose }: { inspection: DemoSheqInspection; onClose: () => void }) {
  const { completeInspection } = useDemo();
  const { push } = useToast();
  const [findings, setFindings] = useState(inspection.findings ?? "");
  const [nonConformities, setNonConformities] = useState(inspection.nonConformities ?? 0);

  return (
    <Modal open onClose={onClose} title={`Complete Inspection - ${inspection.inspectionNumber}`}>
      <form
        className="flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          completeInspection(inspection.id, { findings: findings.trim(), nonConformities });
          push("Inspection completed");
          onClose();
        }}
      >
        <FormField label="Findings" htmlFor="findings">
          <Textarea id="findings" value={findings} onChange={(e) => setFindings(e.target.value)} />
        </FormField>

        <FormField label="Non-Conformities" htmlFor="nonConformities">
          <Input
            id="nonConformities"
            type="number"
            min={0}
            value={nonConformities}
            onChange={(e) => setNonConformities(Number(e.target.value))}
          />
        </FormField>

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit">Complete Inspection</Button>
        </div>
      </form>
    </Modal>
  );
}

export default function DemoSheqPage() {
  const { sheqIncidents, sheqInspections } = useDemo();
  const [reportOpen, setReportOpen] = useState(false);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [viewIncident, setViewIncident] = useState<DemoSheqIncident | null>(null);
  const [viewInspection, setViewInspection] = useState<DemoSheqInspection | null>(null);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader module="Operations" title="SHEQ" />

      <p className="text-sm text-text-tertiary">
        Report safety, health, environment, and quality incidents, conduct inspections and audits, and track
        corrective and preventive actions through to closure.
      </p>

      <Card>
        <CardHeader
          title="Incidents"
          action={
            <Button onClick={() => setReportOpen(true)}>
              <Plus className="size-4" />
              Report Incident
            </Button>
          }
        />
        {sheqIncidents.length === 0 ? (
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
              {sheqIncidents.map((i) => (
                <tr key={i.id} className="border-b border-border-subtle last:border-b-0">
                  <td className="px-4 py-2.5 font-medium text-text-primary">{i.incidentNumber}</td>
                  <td className="px-4 py-2.5 text-text-secondary">{i.title}</td>
                  <td className="px-4 py-2.5 text-text-secondary">{i.incidentType.replace("_", " ")}</td>
                  <td className="px-4 py-2.5">
                    <Badge tone={SEVERITY_TONE[i.severity]}>{i.severity}</Badge>
                  </td>
                  <td className="px-4 py-2.5 text-text-secondary">{new Date(i.dateOccurred).toLocaleDateString()}</td>
                  <td className="px-4 py-2.5">
                    <Badge tone={INCIDENT_STATUS_TONE[i.status]}>{i.status.replace("_", " ")}</Badge>
                  </td>
                  <td className="px-4 py-2.5">
                    <Button variant="secondary" size="sm" onClick={() => setViewIncident(i)}>
                      Corrective Action
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      <Card>
        <CardHeader
          title="Inspections & Audits"
          action={
            <Button onClick={() => setScheduleOpen(true)}>
              <Plus className="size-4" />
              Schedule Inspection
            </Button>
          }
        />
        {sheqInspections.length === 0 ? (
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
              {sheqInspections.map((i) => (
                <tr key={i.id} className="border-b border-border-subtle last:border-b-0">
                  <td className="px-4 py-2.5 font-medium text-text-primary">{i.inspectionNumber}</td>
                  <td className="px-4 py-2.5 text-text-secondary">{i.title}</td>
                  <td className="px-4 py-2.5 text-text-secondary">{i.inspectionType}</td>
                  <td className="px-4 py-2.5 text-text-secondary">{new Date(i.scheduledDate).toLocaleDateString()}</td>
                  <td className="px-4 py-2.5">
                    <Badge tone={INSPECTION_STATUS_TONE[i.status]}>{i.status.replace("_", " ")}</Badge>
                  </td>
                  <td className="px-4 py-2.5 text-text-secondary">{i.nonConformities ?? "-"}</td>
                  <td className="px-4 py-2.5">
                    {i.status !== "completed" && i.status !== "cancelled" && (
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
      </Card>

      {reportOpen && <ReportIncidentModal onClose={() => setReportOpen(false)} />}
      {scheduleOpen && <ScheduleInspectionModal onClose={() => setScheduleOpen(false)} />}
      {viewIncident && <CorrectiveActionModal incident={viewIncident} onClose={() => setViewIncident(null)} />}
      {viewInspection && <CompleteInspectionModal inspection={viewInspection} onClose={() => setViewInspection(null)} />}
    </div>
  );
}
