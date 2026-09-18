"use client";

import { useState } from "react";
import { Plus, Receipt } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/Card";
import { Badge } from "@/components/Badge";
import { Button } from "@/components/Button";
import { EmptyState } from "@/components/EmptyState";
import { Modal } from "@/components/Modal";
import { Input, Select } from "@/components/Input";
import { FormField } from "@/components/FormField";
import { useDemo, type DemoTaxFiling } from "@/lib/demo/DemoContext";
import { useToast } from "@/components/Toast";

const TAX_TYPES = ["PAYE", "VAT", "Withholding Tax", "Corporate Income Tax", "Presumptive Tax", "Capital Gains Tax"];

const STATUS_TONE: Record<DemoTaxFiling["status"], "neutral" | "success" | "warning" | "danger"> = {
  draft: "neutral",
  submitted: "warning",
  accepted: "success",
  paid: "success",
  rejected: "danger",
};

function isOverdue(filing: DemoTaxFiling) {
  return filing.status === "draft" && new Date(filing.dueDate) < new Date();
}

function NewFilingModal({ onClose }: { onClose: () => void }) {
  const { createTaxFiling } = useDemo();
  const { push } = useToast();
  const [taxType, setTaxType] = useState(TAX_TYPES[0]!);
  const [period, setPeriod] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [notes, setNotes] = useState("");

  return (
    <Modal open onClose={onClose} title="New Tax Filing">
      <form
        className="flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          createTaxFiling({ taxType, period: period.trim(), dueDate: new Date(dueDate).toISOString(), notes: notes.trim() });
          push("Tax filing created");
          onClose();
        }}
      >
        <FormField label="Tax Type" htmlFor="taxType">
          <Select id="taxType" value={taxType} onChange={(e) => setTaxType(e.target.value)}>
            {TAX_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </Select>
        </FormField>

        <FormField label="Period" htmlFor="period" hint="e.g. September 2026">
          <Input id="period" value={period} onChange={(e) => setPeriod(e.target.value)} required />
        </FormField>

        <FormField label="Due Date" htmlFor="dueDate">
          <Input id="dueDate" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} required />
        </FormField>

        <FormField label="Notes" htmlFor="notes">
          <Input id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
        </FormField>

        <p className="text-sm text-text-tertiary">
          This creates a draft filing to track - it does not submit anything to ZIMRA.
        </p>

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit">Create Filing</Button>
        </div>
      </form>
    </Modal>
  );
}

export default function DemoTaxCompliancePage() {
  const { taxFilings, submitTaxFiling } = useDemo();
  const { push } = useToast();
  const [newFilingOpen, setNewFilingOpen] = useState(false);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <PageHeader module="Finance" title="Tax Compliance" />
        <Button onClick={() => setNewFilingOpen(true)}>
          <Plus className="size-4" />
          New Filing
        </Button>
      </div>

      <p className="text-sm text-text-tertiary">
        QuickBiz tracks your tax filing obligations and deadlines - it does not file with ZIMRA on your behalf.
        &quot;Mark as Filed&quot; records that you submitted the return through ZIMRA&apos;s own e-Services/FDMS, not an actual
        submission made by QuickBiz. Due days are a verified starting point - VAT due dates vary by taxpayer
        category (A/B/C), so always confirm against current ZIMRA notices.
      </p>

      <Card>
        {taxFilings.length === 0 ? (
          <EmptyState icon={Receipt} title="No tax filings yet" description="Create a filing to start tracking a tax obligation." />
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border-subtle text-left text-xs font-medium uppercase tracking-wide text-text-tertiary">
                <th className="px-4 py-2.5">Tax Type</th>
                <th className="px-4 py-2.5">Period</th>
                <th className="px-4 py-2.5">Due Date</th>
                <th className="px-4 py-2.5">Status</th>
                <th className="px-4 py-2.5" />
              </tr>
            </thead>
            <tbody>
              {taxFilings.map((f) => {
                const overdue = isOverdue(f);
                return (
                  <tr key={f.id} className="border-b border-border-subtle last:border-b-0">
                    <td className="px-4 py-2.5 font-medium text-text-primary">{f.taxType}</td>
                    <td className="px-4 py-2.5 text-text-secondary">{f.period}</td>
                    <td className={`px-4 py-2.5 ${overdue ? "font-medium text-danger-600" : "text-text-secondary"}`}>
                      {new Date(f.dueDate).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-2.5">
                      <Badge tone={overdue ? "danger" : STATUS_TONE[f.status]}>{overdue ? "overdue" : f.status}</Badge>
                    </td>
                    <td className="px-4 py-2.5">
                      {f.status === "draft" && (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => {
                            submitTaxFiling(f.id);
                            push("Recorded as submitted");
                          }}
                        >
                          Mark as Filed
                        </Button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </Card>

      {newFilingOpen && <NewFilingModal onClose={() => setNewFilingOpen(false)} />}
    </div>
  );
}
