"use client";

import { useState } from "react";
import { Gavel, FileWarning, Plus } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardHeader } from "@/components/Card";
import { Badge } from "@/components/Badge";
import { Button } from "@/components/Button";
import { Input, Select, Textarea } from "@/components/Input";
import { FormField } from "@/components/FormField";
import { EmptyState } from "@/components/EmptyState";
import { Modal } from "@/components/Modal";
import { useDemo, type DemoDisciplinaryCase, type DemoDisciplinaryWarning } from "@/lib/demo/DemoContext";
import { useToast } from "@/components/Toast";

const VIOLATION_TYPES = ["absenteeism", "misconduct", "insubordination", "negligence", "harassment", "theft", "policy_violation", "performance", "safety", "other"];
const SEVERITIES: DemoDisciplinaryCase["severity"][] = ["minor", "moderate", "major", "gross"];
const WARNING_TYPES: DemoDisciplinaryWarning["warningType"][] = ["verbal", "written", "final"];

const SEVERITY_TONE: Record<DemoDisciplinaryCase["severity"], "neutral" | "success" | "warning" | "danger"> = {
  minor: "neutral",
  moderate: "warning",
  major: "danger",
  gross: "danger",
};

const STATUS_TONE: Record<DemoDisciplinaryCase["status"], "neutral" | "success" | "warning" | "danger" | "info"> = {
  open: "warning",
  under_investigation: "info",
  hearing_scheduled: "info",
  hearing_completed: "info",
  action_taken: "success",
  appealed: "warning",
  closed: "neutral",
};

const WARNING_TONE: Record<DemoDisciplinaryWarning["warningType"], "neutral" | "success" | "warning" | "danger" | "info"> = {
  verbal: "neutral",
  written: "warning",
  final: "danger",
};

function OpenCaseModal({ employeeNames, onClose }: { employeeNames: string[]; onClose: () => void }) {
  const { openDisciplinaryCase } = useDemo();
  const { push } = useToast();
  const [employeeName, setEmployeeName] = useState(employeeNames[0] ?? "");
  const [violationType, setViolationType] = useState(VIOLATION_TYPES[0]!);
  const [severity, setSeverity] = useState<DemoDisciplinaryCase["severity"]>(SEVERITIES[0]!);
  const [title, setTitle] = useState("");
  const [incidentDate, setIncidentDate] = useState("");

  return (
    <Modal open onClose={onClose} title="Open Disciplinary Case">
      <form
        className="flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          openDisciplinaryCase({ employeeName, violationType, severity, title: title.trim(), incidentDate });
          push("Disciplinary case opened");
          onClose();
        }}
      >
        <FormField label="Employee" htmlFor="employeeName">
          <Select id="employeeName" value={employeeName} onChange={(e) => setEmployeeName(e.target.value)}>
            {employeeNames.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </Select>
        </FormField>

        <FormField label="Violation Type" htmlFor="violationType">
          <Select id="violationType" value={violationType} onChange={(e) => setViolationType(e.target.value)}>
            {VIOLATION_TYPES.map((t) => (
              <option key={t} value={t}>
                {t.replace("_", " ")}
              </option>
            ))}
          </Select>
        </FormField>

        <FormField label="Severity" htmlFor="severity">
          <Select id="severity" value={severity} onChange={(e) => setSeverity(e.target.value as DemoDisciplinaryCase["severity"])}>
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

        <FormField label="Incident Date" htmlFor="incidentDate">
          <Input id="incidentDate" type="date" value={incidentDate} onChange={(e) => setIncidentDate(e.target.value)} required />
        </FormField>

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit">Open Case</Button>
        </div>
      </form>
    </Modal>
  );
}

function CaseStatusModal({ caseRow, onClose }: { caseRow: DemoDisciplinaryCase; onClose: () => void }) {
  const { scheduleDisciplinaryHearing, setDisciplinaryCaseStatus } = useDemo();
  const { push } = useToast();
  const [hearingDate, setHearingDate] = useState(caseRow.hearingDate ?? "");

  return (
    <Modal open onClose={onClose} title={`Update Case - ${caseRow.caseNumber}`}>
      <form
        className="flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          scheduleDisciplinaryHearing(caseRow.id, hearingDate);
          push("Hearing scheduled");
          onClose();
        }}
      >
        <FormField label="Hearing Date" htmlFor="hearingDate">
          <Input id="hearingDate" type="date" value={hearingDate} onChange={(e) => setHearingDate(e.target.value)} required />
        </FormField>

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          {caseRow.status !== "closed" && (
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setDisciplinaryCaseStatus(caseRow.id, "closed");
                push("Case closed");
                onClose();
              }}
            >
              Close Case
            </Button>
          )}
          <Button type="submit">Schedule Hearing</Button>
        </div>
      </form>
    </Modal>
  );
}

function IssueWarningModal({ employeeNames, onClose }: { employeeNames: string[]; onClose: () => void }) {
  const { issueDisciplinaryWarning } = useDemo();
  const { push } = useToast();
  const [employeeName, setEmployeeName] = useState(employeeNames[0] ?? "");
  const [warningType, setWarningType] = useState<DemoDisciplinaryWarning["warningType"]>(WARNING_TYPES[0]!);
  const [reason, setReason] = useState("");

  return (
    <Modal open onClose={onClose} title="Issue Warning">
      <form
        className="flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          issueDisciplinaryWarning({ employeeName, warningType, reason: reason.trim() });
          push("Warning issued");
          onClose();
        }}
      >
        <FormField label="Employee" htmlFor="employeeName">
          <Select id="employeeName" value={employeeName} onChange={(e) => setEmployeeName(e.target.value)}>
            {employeeNames.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </Select>
        </FormField>

        <FormField label="Warning Type" htmlFor="warningType">
          <Select id="warningType" value={warningType} onChange={(e) => setWarningType(e.target.value as DemoDisciplinaryWarning["warningType"])}>
            {WARNING_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </Select>
        </FormField>

        <FormField label="Reason" htmlFor="reason">
          <Textarea id="reason" value={reason} onChange={(e) => setReason(e.target.value)} required />
        </FormField>

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit">Issue Warning</Button>
        </div>
      </form>
    </Modal>
  );
}

export default function DemoDisciplinaryPage() {
  const { disciplinaryCases, disciplinaryWarnings, employees } = useDemo();
  const employeeNames = employees.map((e) => e.fullName);
  const [openCaseOpen, setOpenCaseOpen] = useState(false);
  const [issueWarningOpen, setIssueWarningOpen] = useState(false);
  const [viewCase, setViewCase] = useState<DemoDisciplinaryCase | null>(null);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader module="Operations" title="Disciplinary" />

      <p className="text-sm text-text-tertiary">
        Track employee disciplinary cases from the initial violation through hearings, actions taken, and any
        warnings issued.
      </p>

      <Card>
        <CardHeader
          title="Disciplinary Cases"
          action={
            <Button onClick={() => setOpenCaseOpen(true)}>
              <Plus className="size-4" />
              Open Case
            </Button>
          }
        />
        {disciplinaryCases.length === 0 ? (
          <EmptyState icon={Gavel} title="No disciplinary cases" description="Open a case to start tracking a disciplinary matter through to resolution." />
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border-subtle text-left text-xs font-medium uppercase tracking-wide text-text-tertiary">
                <th className="px-4 py-2.5">Case</th>
                <th className="px-4 py-2.5">Employee</th>
                <th className="px-4 py-2.5">Title</th>
                <th className="px-4 py-2.5">Severity</th>
                <th className="px-4 py-2.5">Incident Date</th>
                <th className="px-4 py-2.5">Status</th>
                <th className="px-4 py-2.5" />
              </tr>
            </thead>
            <tbody>
              {disciplinaryCases.map((c) => (
                <tr key={c.id} className="border-b border-border-subtle last:border-b-0">
                  <td className="px-4 py-2.5 font-medium text-text-primary">{c.caseNumber}</td>
                  <td className="px-4 py-2.5 text-text-secondary">{c.employeeName}</td>
                  <td className="px-4 py-2.5 text-text-secondary">{c.title}</td>
                  <td className="px-4 py-2.5">
                    <Badge tone={SEVERITY_TONE[c.severity]}>{c.severity}</Badge>
                  </td>
                  <td className="px-4 py-2.5 text-text-secondary">{new Date(c.incidentDate).toLocaleDateString()}</td>
                  <td className="px-4 py-2.5">
                    <Badge tone={STATUS_TONE[c.status]}>{c.status.replace("_", " ")}</Badge>
                  </td>
                  <td className="px-4 py-2.5">
                    {c.status !== "closed" && (
                      <Button variant="secondary" size="sm" onClick={() => setViewCase(c)}>
                        Update
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      <Card>
        <CardHeader
          title="Warnings"
          action={
            <Button onClick={() => setIssueWarningOpen(true)}>
              <Plus className="size-4" />
              Issue Warning
            </Button>
          }
        />
        {disciplinaryWarnings.length === 0 ? (
          <EmptyState icon={FileWarning} title="No warnings issued" description="Warnings issued to employees will appear here." />
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border-subtle text-left text-xs font-medium uppercase tracking-wide text-text-tertiary">
                <th className="px-4 py-2.5">Employee</th>
                <th className="px-4 py-2.5">Type</th>
                <th className="px-4 py-2.5">Reason</th>
                <th className="px-4 py-2.5">Issued</th>
              </tr>
            </thead>
            <tbody>
              {disciplinaryWarnings.map((w) => (
                <tr key={w.id} className="border-b border-border-subtle last:border-b-0">
                  <td className="px-4 py-2.5 font-medium text-text-primary">{w.employeeName}</td>
                  <td className="px-4 py-2.5">
                    <Badge tone={WARNING_TONE[w.warningType]}>{w.warningType}</Badge>
                  </td>
                  <td className="px-4 py-2.5 text-text-secondary">{w.reason}</td>
                  <td className="px-4 py-2.5 text-text-secondary">{new Date(w.issuedDate).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      {openCaseOpen && <OpenCaseModal employeeNames={employeeNames} onClose={() => setOpenCaseOpen(false)} />}
      {issueWarningOpen && <IssueWarningModal employeeNames={employeeNames} onClose={() => setIssueWarningOpen(false)} />}
      {viewCase && <CaseStatusModal caseRow={viewCase} onClose={() => setViewCase(null)} />}
    </div>
  );
}
