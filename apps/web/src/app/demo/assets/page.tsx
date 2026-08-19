"use client";

import { useState } from "react";
import { Plus, Archive } from "lucide-react";
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

function AddAssetModal({ onClose }: { onClose: () => void }) {
  const { addAsset } = useDemo();
  const { push } = useToast();
  const [name, setName] = useState("");
  const [category, setCategory] = useState("equipment");
  const [purchaseCost, setPurchaseCost] = useState("0");

  return (
    <Modal open onClose={onClose} title="Add asset">
      <form
        className="flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          if (!name.trim()) return;
          addAsset({ name: name.trim(), category: category.trim(), purchaseCost: Number(purchaseCost) || 0 });
          push("Asset added");
          onClose();
        }}
      >
        <FormField label="Name" htmlFor="name" required>
          <Input id="name" required value={name} onChange={(e) => setName(e.target.value)} />
        </FormField>
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Category" htmlFor="category">
            <Input id="category" value={category} onChange={(e) => setCategory(e.target.value)} />
          </FormField>
          <FormField label="Purchase cost" htmlFor="purchaseCost">
            <Input id="purchaseCost" type="number" min="0" step="0.01" value={purchaseCost} onChange={(e) => setPurchaseCost(e.target.value)} />
          </FormField>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit">Add asset</Button>
        </div>
      </form>
    </Modal>
  );
}

export default function DemoAssetsPage() {
  const { assets } = useDemo();
  const [open, setOpen] = useState(false);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <PageHeader module="Assets" title="Fixed Assets" />
        <Button onClick={() => setOpen(true)}>
          <Plus className="size-4" />
          Add Asset
        </Button>
      </div>

      <Card>
        {assets.length === 0 ? (
          <EmptyState icon={Archive} title="No assets yet" />
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border-subtle text-left text-xs font-medium uppercase tracking-wide text-text-tertiary">
                <th className="px-4 py-2.5">Asset #</th>
                <th className="px-4 py-2.5">Name</th>
                <th className="px-4 py-2.5">Category</th>
                <th className="px-4 py-2.5">Purchase cost</th>
                <th className="px-4 py-2.5">Status</th>
              </tr>
            </thead>
            <tbody>
              {assets.map((a) => (
                <tr key={a.id} className="border-b border-border-subtle last:border-b-0">
                  <td className="px-4 py-2.5 font-mono text-text-secondary">{a.assetNumber}</td>
                  <td className="px-4 py-2.5 font-medium text-text-primary">{a.name}</td>
                  <td className="px-4 py-2.5 text-text-secondary">{a.category}</td>
                  <td className="px-4 py-2.5 text-text-secondary">${a.purchaseCost.toFixed(2)}</td>
                  <td className="px-4 py-2.5">
                    <Badge tone="success">{a.status.replace("_", " ")}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      {open && <AddAssetModal onClose={() => setOpen(false)} />}
    </div>
  );
}
