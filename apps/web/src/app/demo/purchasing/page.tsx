"use client";

import { useState } from "react";
import { Plus, ClipboardList } from "lucide-react";
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
  draft: "neutral",
  issued: "info",
  received: "success",
  cancelled: "danger",
};

function NewPurchaseOrderModal({ onClose }: { onClose: () => void }) {
  const { suppliers, createPurchaseOrder } = useDemo();
  const { push } = useToast();
  const [supplierName, setSupplierName] = useState(suppliers[0]?.name ?? "");
  const [total, setTotal] = useState("0");

  return (
    <Modal open onClose={onClose} title="New purchase order">
      <form
        className="flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          if (!supplierName) return;
          createPurchaseOrder(supplierName, Number(total) || 0);
          push("Purchase order created");
          onClose();
        }}
      >
        <FormField label="Supplier" htmlFor="supplierName" required>
          <Select id="supplierName" value={supplierName} onChange={(e) => setSupplierName(e.target.value)}>
            {suppliers.map((s) => (
              <option key={s.id} value={s.name}>
                {s.name}
              </option>
            ))}
          </Select>
        </FormField>
        <FormField label="Total" htmlFor="total">
          <Input id="total" type="number" min="0" step="0.01" value={total} onChange={(e) => setTotal(e.target.value)} />
        </FormField>
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit">Create</Button>
        </div>
      </form>
    </Modal>
  );
}

export default function DemoPurchasingPage() {
  const { purchaseOrders } = useDemo();
  const [open, setOpen] = useState(false);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <PageHeader module="Purchasing" title="Purchase Orders" />
        <Button onClick={() => setOpen(true)}>
          <Plus className="size-4" />
          New Purchase Order
        </Button>
      </div>

      <Card>
        {purchaseOrders.length === 0 ? (
          <EmptyState icon={ClipboardList} title="No purchase orders yet" />
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border-subtle text-left text-xs font-medium uppercase tracking-wide text-text-tertiary">
                <th className="px-4 py-2.5">PO #</th>
                <th className="px-4 py-2.5">Supplier</th>
                <th className="px-4 py-2.5">Total</th>
                <th className="px-4 py-2.5">Status</th>
              </tr>
            </thead>
            <tbody>
              {purchaseOrders.map((po) => (
                <tr key={po.id} className="border-b border-border-subtle last:border-b-0">
                  <td className="px-4 py-2.5 font-mono font-medium text-text-primary">{po.poNumber}</td>
                  <td className="px-4 py-2.5 text-text-secondary">{po.supplierName}</td>
                  <td className="px-4 py-2.5 text-text-secondary">${po.total.toFixed(2)}</td>
                  <td className="px-4 py-2.5">
                    <Badge tone={statusTone[po.status] ?? "neutral"}>{po.status}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      {open && <NewPurchaseOrderModal onClose={() => setOpen(false)} />}
    </div>
  );
}
