"use client";

import { useState } from "react";
import { Plus, Target } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { EmptyState } from "@/components/EmptyState";
import { Modal } from "@/components/Modal";
import { Input, Select } from "@/components/Input";
import { FormField } from "@/components/FormField";
import { useDemo, type DemoOpportunity } from "@/lib/demo/DemoContext";
import { useToast } from "@/components/Toast";

const STAGES: DemoOpportunity["stage"][] = ["prospecting", "proposal", "negotiation", "won", "lost"];

function AddOpportunityModal({ onClose }: { onClose: () => void }) {
  const { customers, addOpportunity } = useDemo();
  const { push } = useToast();
  const [name, setName] = useState("");
  const [customerName, setCustomerName] = useState(customers[0]?.name ?? "");
  const [value, setValue] = useState("0");

  return (
    <Modal open onClose={onClose} title="Add opportunity">
      <form
        className="flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          if (!name.trim()) return;
          addOpportunity({ name: name.trim(), customerName, value: Number(value) || 0 });
          push("Opportunity added");
          onClose();
        }}
      >
        <FormField label="Name" htmlFor="name" required>
          <Input id="name" required value={name} onChange={(e) => setName(e.target.value)} />
        </FormField>
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Customer" htmlFor="customerName">
            <Select id="customerName" value={customerName} onChange={(e) => setCustomerName(e.target.value)}>
              {customers.map((c) => (
                <option key={c.id} value={c.name}>
                  {c.name}
                </option>
              ))}
            </Select>
          </FormField>
          <FormField label="Value" htmlFor="value">
            <Input id="value" type="number" min="0" step="0.01" value={value} onChange={(e) => setValue(e.target.value)} />
          </FormField>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit">Add opportunity</Button>
        </div>
      </form>
    </Modal>
  );
}

export default function DemoOpportunitiesPage() {
  const { opportunities, setOpportunityStage } = useDemo();
  const [open, setOpen] = useState(false);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <PageHeader module="CRM" title="Opportunities" />
        <Button onClick={() => setOpen(true)}>
          <Plus className="size-4" />
          Add Opportunity
        </Button>
      </div>

      <Card>
        {opportunities.length === 0 ? (
          <EmptyState icon={Target} title="No opportunities yet" />
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border-subtle text-left text-xs font-medium uppercase tracking-wide text-text-tertiary">
                <th className="px-4 py-2.5">Name</th>
                <th className="px-4 py-2.5">Customer</th>
                <th className="px-4 py-2.5">Value</th>
                <th className="px-4 py-2.5">Stage</th>
              </tr>
            </thead>
            <tbody>
              {opportunities.map((o) => (
                <tr key={o.id} className="border-b border-border-subtle last:border-b-0">
                  <td className="px-4 py-2.5 font-medium text-text-primary">{o.name}</td>
                  <td className="px-4 py-2.5 text-text-secondary">{o.customerName}</td>
                  <td className="px-4 py-2.5 text-text-secondary">${o.value.toFixed(2)}</td>
                  <td className="px-4 py-2.5">
                    <select
                      value={o.stage}
                      onChange={(e) => setOpportunityStage(o.id, e.target.value as DemoOpportunity["stage"])}
                      className="h-8 rounded-md border border-border bg-white px-2 text-xs capitalize focus:outline-none"
                    >
                      {STAGES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      {open && <AddOpportunityModal onClose={() => setOpen(false)} />}
    </div>
  );
}
