"use client";

import { useState } from "react";
import { Plus, Landmark } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/Card";
import { Badge } from "@/components/Badge";
import { Button } from "@/components/Button";
import { EmptyState } from "@/components/EmptyState";
import { Modal } from "@/components/Modal";
import { Select, Textarea } from "@/components/Input";
import { FormField } from "@/components/FormField";
import { useDemo, type DemoIbanRequest } from "@/lib/demo/DemoContext";
import { useToast } from "@/components/Toast";

const CURRENCIES = ["EUR", "USD", "GBP", "ZAR"];

const STATUS_TONE: Record<DemoIbanRequest["status"], "neutral" | "success" | "warning" | "danger"> = {
  pending: "warning",
  active: "success",
  suspended: "neutral",
  closed: "danger",
};

function RequestIbanModal({ onClose }: { onClose: () => void }) {
  const { requestIban } = useDemo();
  const { push } = useToast();
  const [currency, setCurrency] = useState("EUR");
  const [notes, setNotes] = useState("");

  return (
    <Modal open onClose={onClose} title="Request IBAN">
      <form
        className="flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          requestIban(currency, notes.trim());
          push("IBAN requested");
          onClose();
        }}
      >
        <FormField label="Currency" htmlFor="currency">
          <Select id="currency" value={currency} onChange={(e) => setCurrency(e.target.value)}>
            {CURRENCIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </Select>
        </FormField>

        <FormField label="Notes" htmlFor="notes">
          <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
        </FormField>

        <p className="text-sm text-text-tertiary">
          Requests are reviewed and provisioned by QuickBiz through a banking partner - there is no instant activation.
        </p>

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit">Request IBAN</Button>
        </div>
      </form>
    </Modal>
  );
}

export default function DemoIbanPage() {
  const { ibanRequests } = useDemo();
  const [open, setOpen] = useState(false);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <PageHeader module="Finance" title="IBAN" />
        <Button onClick={() => setOpen(true)}>
          <Plus className="size-4" />
          Request IBAN
        </Button>
      </div>

      <p className="text-sm text-text-tertiary">
        QuickBiz cannot mint an IBAN directly - each request is provisioned through a banking partner and stays
        &quot;pending&quot; until QuickBiz staff confirm the real account was issued.
      </p>

      <Card>
        {ibanRequests.length === 0 ? (
          <EmptyState icon={Landmark} title="No IBAN requests yet" />
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border-subtle text-left text-xs font-medium uppercase tracking-wide text-text-tertiary">
                <th className="px-4 py-2.5">Currency</th>
                <th className="px-4 py-2.5">Notes</th>
                <th className="px-4 py-2.5">Status</th>
                <th className="px-4 py-2.5">Requested</th>
              </tr>
            </thead>
            <tbody>
              {ibanRequests.map((r) => (
                <tr key={r.id} className="border-b border-border-subtle last:border-b-0">
                  <td className="px-4 py-2.5 font-medium text-text-primary">{r.currency}</td>
                  <td className="px-4 py-2.5 text-text-secondary">{r.notes || "-"}</td>
                  <td className="px-4 py-2.5">
                    <Badge tone={STATUS_TONE[r.status]}>{r.status}</Badge>
                  </td>
                  <td className="px-4 py-2.5 text-text-secondary">{new Date(r.requestedAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      {open && <RequestIbanModal onClose={() => setOpen(false)} />}
    </div>
  );
}
