"use client";

import { useState } from "react";
import { Plus, Layers } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { EmptyState } from "@/components/EmptyState";
import { Modal } from "@/components/Modal";
import { Input, Select } from "@/components/Input";
import { FormField } from "@/components/FormField";
import { useDemo } from "@/lib/demo/DemoContext";
import { useToast } from "@/components/Toast";

function NewBomModal({ onClose }: { onClose: () => void }) {
  const { products, createBom } = useDemo();
  const { push } = useToast();
  const [name, setName] = useState("");
  const [productName, setProductName] = useState(products[0]?.name ?? "");
  const [componentCount, setComponentCount] = useState("1");

  return (
    <Modal open onClose={onClose} title="New bill of materials">
      <form
        className="flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          if (!name.trim() || !productName) return;
          createBom({ name: name.trim(), productName, componentCount: Number(componentCount) || 1 });
          push("Bill of materials created");
          onClose();
        }}
      >
        <FormField label="BOM name" htmlFor="name" required>
          <Input id="name" required value={name} onChange={(e) => setName(e.target.value)} />
        </FormField>
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Finished product" htmlFor="productName">
            <Select id="productName" value={productName} onChange={(e) => setProductName(e.target.value)}>
              {products.map((p) => (
                <option key={p.id} value={p.name}>
                  {p.name}
                </option>
              ))}
            </Select>
          </FormField>
          <FormField label="Component count" htmlFor="componentCount">
            <Input id="componentCount" type="number" min="1" step="1" value={componentCount} onChange={(e) => setComponentCount(e.target.value)} />
          </FormField>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit">Create BOM</Button>
        </div>
      </form>
    </Modal>
  );
}

export default function DemoBomsPage() {
  const { boms } = useDemo();
  const [open, setOpen] = useState(false);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <PageHeader module="Manufacturing" title="Bills of Materials" />
        <Button onClick={() => setOpen(true)}>
          <Plus className="size-4" />
          New BOM
        </Button>
      </div>

      <Card>
        {boms.length === 0 ? (
          <EmptyState icon={Layers} title="No bills of materials yet" />
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border-subtle text-left text-xs font-medium uppercase tracking-wide text-text-tertiary">
                <th className="px-4 py-2.5">Name</th>
                <th className="px-4 py-2.5">Finished product</th>
                <th className="px-4 py-2.5">Components</th>
              </tr>
            </thead>
            <tbody>
              {boms.map((b) => (
                <tr key={b.id} className="border-b border-border-subtle last:border-b-0">
                  <td className="px-4 py-2.5 font-medium text-text-primary">{b.name}</td>
                  <td className="px-4 py-2.5 text-text-secondary">{b.productName}</td>
                  <td className="px-4 py-2.5 text-text-secondary">{b.componentCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      {open && <NewBomModal onClose={() => setOpen(false)} />}
    </div>
  );
}
