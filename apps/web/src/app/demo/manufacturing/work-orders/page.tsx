"use client";

import { useState } from "react";
import { Plus, Factory } from "lucide-react";
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
  planned: "neutral",
  in_progress: "info",
  completed: "success",
  cancelled: "danger",
};

function NewWorkOrderModal({ onClose }: { onClose: () => void }) {
  const { boms, createWorkOrder } = useDemo();
  const { push } = useToast();
  const [bomId, setBomId] = useState(boms[0]?.id ?? "");
  const [quantityPlanned, setQuantityPlanned] = useState("1");

  return (
    <Modal open onClose={onClose} title="New work order">
      <form
        className="flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          const bom = boms.find((b) => b.id === bomId);
          if (!bom) return;
          createWorkOrder({ bomName: bom.name, productName: bom.productName, quantityPlanned: Number(quantityPlanned) || 1 });
          push("Work order created");
          onClose();
        }}
      >
        <FormField label="Bill of materials" htmlFor="bomId" required>
          <Select id="bomId" value={bomId} onChange={(e) => setBomId(e.target.value)}>
            {boms.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name} ({b.productName})
              </option>
            ))}
          </Select>
        </FormField>
        <FormField label="Quantity to produce" htmlFor="quantityPlanned" required>
          <Input id="quantityPlanned" type="number" min="1" step="1" required value={quantityPlanned} onChange={(e) => setQuantityPlanned(e.target.value)} />
        </FormField>
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit">Create work order</Button>
        </div>
      </form>
    </Modal>
  );
}

export default function DemoWorkOrdersPage() {
  const { workOrders, completeWorkOrder } = useDemo();
  const { push } = useToast();
  const [open, setOpen] = useState(false);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <PageHeader module="Manufacturing" title="Work Orders" />
        <Button onClick={() => setOpen(true)}>
          <Plus className="size-4" />
          New Work Order
        </Button>
      </div>

      <Card>
        {workOrders.length === 0 ? (
          <EmptyState icon={Factory} title="No work orders yet" />
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border-subtle text-left text-xs font-medium uppercase tracking-wide text-text-tertiary">
                <th className="px-4 py-2.5">WO #</th>
                <th className="px-4 py-2.5">Product</th>
                <th className="px-4 py-2.5">Planned</th>
                <th className="px-4 py-2.5">Produced</th>
                <th className="px-4 py-2.5">Status</th>
                <th className="px-4 py-2.5" />
              </tr>
            </thead>
            <tbody>
              {workOrders.map((w) => (
                <tr key={w.id} className="border-b border-border-subtle last:border-b-0">
                  <td className="px-4 py-2.5 font-mono font-medium text-text-primary">{w.woNumber}</td>
                  <td className="px-4 py-2.5 text-text-secondary">{w.productName}</td>
                  <td className="px-4 py-2.5 text-text-secondary">{w.quantityPlanned}</td>
                  <td className="px-4 py-2.5 text-text-secondary">{w.quantityProduced}</td>
                  <td className="px-4 py-2.5">
                    <Badge tone={statusTone[w.status] ?? "neutral"}>{w.status.replace("_", " ")}</Badge>
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    {(w.status === "planned" || w.status === "in_progress") && (
                      <Button
                        size="sm"
                        onClick={() => {
                          completeWorkOrder(w.id);
                          push("Work order completed");
                        }}
                      >
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

      {open && <NewWorkOrderModal onClose={() => setOpen(false)} />}
    </div>
  );
}
