"use client";

import { useState } from "react";
import { Plus, UserPlus } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/Card";
import { Badge } from "@/components/Badge";
import { Button } from "@/components/Button";
import { EmptyState } from "@/components/EmptyState";
import { Modal } from "@/components/Modal";
import { Input } from "@/components/Input";
import { FormField } from "@/components/FormField";
import { useDemo } from "@/lib/demo/DemoContext";
import { useToast } from "@/components/Toast";

const statusTone: Record<string, "success" | "info" | "warning" | "danger" | "neutral"> = {
  new: "neutral",
  contacted: "info",
  qualified: "warning",
  converted: "success",
  lost: "danger",
};

function AddLeadModal({ onClose }: { onClose: () => void }) {
  const { addLead } = useDemo();
  const { push } = useToast();
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");

  return (
    <Modal open onClose={onClose} title="Add lead">
      <form
        className="flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          if (!name.trim()) return;
          addLead({ name: name.trim(), company: company.trim() });
          push("Lead added");
          onClose();
        }}
      >
        <FormField label="Name" htmlFor="name" required>
          <Input id="name" required value={name} onChange={(e) => setName(e.target.value)} />
        </FormField>
        <FormField label="Company" htmlFor="company">
          <Input id="company" value={company} onChange={(e) => setCompany(e.target.value)} />
        </FormField>
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit">Add lead</Button>
        </div>
      </form>
    </Modal>
  );
}

export default function DemoLeadsPage() {
  const { leads, convertLead } = useDemo();
  const { push } = useToast();
  const [open, setOpen] = useState(false);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <PageHeader module="CRM" title="Leads" />
        <Button onClick={() => setOpen(true)}>
          <Plus className="size-4" />
          Add Lead
        </Button>
      </div>

      <Card>
        {leads.length === 0 ? (
          <EmptyState icon={UserPlus} title="No leads yet" />
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border-subtle text-left text-xs font-medium uppercase tracking-wide text-text-tertiary">
                <th className="px-4 py-2.5">Name</th>
                <th className="px-4 py-2.5">Company</th>
                <th className="px-4 py-2.5">Status</th>
                <th className="px-4 py-2.5" />
              </tr>
            </thead>
            <tbody>
              {leads.map((l) => (
                <tr key={l.id} className="border-b border-border-subtle last:border-b-0">
                  <td className="px-4 py-2.5 font-medium text-text-primary">{l.name}</td>
                  <td className="px-4 py-2.5 text-text-secondary">{l.company || "Not specified"}</td>
                  <td className="px-4 py-2.5">
                    <Badge tone={statusTone[l.status] ?? "neutral"}>{l.status}</Badge>
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    {l.status !== "converted" && (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => {
                          convertLead(l.id);
                          push("Lead converted to a customer");
                        }}
                      >
                        Convert
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      {open && <AddLeadModal onClose={() => setOpen(false)} />}
    </div>
  );
}
