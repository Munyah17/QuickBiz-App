"use client";

import { useState } from "react";
import { Plus, GitBranch } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/Card";
import { Badge } from "@/components/Badge";
import { Button } from "@/components/Button";
import { EmptyState } from "@/components/EmptyState";
import { Modal } from "@/components/Modal";
import { Input, Select } from "@/components/Input";
import { FormField } from "@/components/FormField";
import { useDemo, type DemoBranch } from "@/lib/demo/DemoContext";
import { useToast } from "@/components/Toast";

function AddBranchModal({ onClose }: { onClose: () => void }) {
  const { addBranch } = useDemo();
  const { push } = useToast();
  const [name, setName] = useState("");
  const [type, setType] = useState<DemoBranch["type"]>("branch");

  return (
    <Modal open onClose={onClose} title="Add branch">
      <form
        className="flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          if (!name.trim()) return;
          addBranch(name.trim(), type);
          push("Branch added");
          onClose();
        }}
      >
        <FormField label="Name" htmlFor="name" required>
          <Input id="name" required value={name} onChange={(e) => setName(e.target.value)} />
        </FormField>
        <FormField label="Type" htmlFor="type">
          <Select id="type" value={type} onChange={(e) => setType(e.target.value as DemoBranch["type"])}>
            <option value="branch">Branch</option>
            <option value="warehouse">Warehouse</option>
            <option value="head_office">Head office</option>
          </Select>
        </FormField>
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit">Add branch</Button>
        </div>
      </form>
    </Modal>
  );
}

export default function DemoBranchesPage() {
  const { branches } = useDemo();
  const [open, setOpen] = useState(false);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <PageHeader title="Branches" />
        <Button onClick={() => setOpen(true)}>
          <Plus className="size-4" />
          Add Branch
        </Button>
      </div>

      <Card>
        {branches.length === 0 ? (
          <EmptyState icon={GitBranch} title="No branches yet" />
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border-subtle text-left text-xs font-medium uppercase tracking-wide text-text-tertiary">
                <th className="px-4 py-2.5">Name</th>
                <th className="px-4 py-2.5">Type</th>
              </tr>
            </thead>
            <tbody>
              {branches.map((b) => (
                <tr key={b.id} className="border-b border-border-subtle last:border-b-0">
                  <td className="px-4 py-2.5 font-medium text-text-primary">{b.name}</td>
                  <td className="px-4 py-2.5">
                    <Badge>{b.type.replace("_", " ")}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      {open && <AddBranchModal onClose={() => setOpen(false)} />}
    </div>
  );
}
