"use client";

import { useState } from "react";
import { Plus, FolderKanban } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/Card";
import { Badge } from "@/components/Badge";
import { Button } from "@/components/Button";
import { EmptyState } from "@/components/EmptyState";
import { Modal } from "@/components/Modal";
import { Input, Select } from "@/components/Input";
import { FormField } from "@/components/FormField";
import { useDemo } from "@/lib/demo/DemoContext";
import { useToast } from "@/components/Toast";

const statusTone: Record<string, "success" | "info" | "warning" | "danger" | "neutral"> = {
  planning: "neutral",
  active: "info",
  on_hold: "warning",
  completed: "success",
  cancelled: "danger",
};

function AddProjectModal({ onClose }: { onClose: () => void }) {
  const { customers, addProject } = useDemo();
  const { push } = useToast();
  const [name, setName] = useState("");
  const [customerName, setCustomerName] = useState(customers[0]?.name ?? "");
  const [budget, setBudget] = useState("0");

  return (
    <Modal open onClose={onClose} title="Add project">
      <form
        className="flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          if (!name.trim()) return;
          addProject({ name: name.trim(), customerName, budget: Number(budget) || 0 });
          push("Project added");
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
          <FormField label="Budget" htmlFor="budget">
            <Input id="budget" type="number" min="0" step="0.01" value={budget} onChange={(e) => setBudget(e.target.value)} />
          </FormField>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit">Add project</Button>
        </div>
      </form>
    </Modal>
  );
}

export default function DemoProjectsPage() {
  const { projects } = useDemo();
  const [open, setOpen] = useState(false);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <PageHeader title="Projects" />
        <Button onClick={() => setOpen(true)}>
          <Plus className="size-4" />
          Add Project
        </Button>
      </div>

      <Card>
        {projects.length === 0 ? (
          <EmptyState icon={FolderKanban} title="No projects yet" />
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border-subtle text-left text-xs font-medium uppercase tracking-wide text-text-tertiary">
                <th className="px-4 py-2.5">Name</th>
                <th className="px-4 py-2.5">Customer</th>
                <th className="px-4 py-2.5">Budget</th>
                <th className="px-4 py-2.5">Status</th>
              </tr>
            </thead>
            <tbody>
              {projects.map((p) => (
                <tr key={p.id} className="border-b border-border-subtle last:border-b-0">
                  <td className="px-4 py-2.5 font-medium text-text-primary">{p.name}</td>
                  <td className="px-4 py-2.5 text-text-secondary">{p.customerName}</td>
                  <td className="px-4 py-2.5 text-text-secondary">${p.budget.toFixed(2)}</td>
                  <td className="px-4 py-2.5">
                    <Badge tone={statusTone[p.status] ?? "neutral"}>{p.status.replace("_", " ")}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      {open && <AddProjectModal onClose={() => setOpen(false)} />}
    </div>
  );
}
