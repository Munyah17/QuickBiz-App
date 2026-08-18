"use client";

import { useState } from "react";
import { Plus, Receipt, X } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { EmptyState } from "@/components/EmptyState";
import { Modal } from "@/components/Modal";
import { Input, Select } from "@/components/Input";
import { FormField } from "@/components/FormField";
import { useDemo } from "@/lib/demo/DemoContext";
import { useToast } from "@/components/Toast";

let rowId = 0;

function NewSaleModal({ onClose }: { onClose: () => void }) {
  const { customers, products, createSale } = useDemo();
  const { push } = useToast();
  const [customerName, setCustomerName] = useState(customers[0]?.name ?? "");
  const [rows, setRows] = useState(() => [{ key: rowId++, productId: "", quantity: "1" }]);

  return (
    <Modal open onClose={onClose} title="New sale">
      <form
        className="flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          if (!customerName) return;
          const lines = rows
            .filter((r) => r.productId && Number(r.quantity) > 0)
            .map((r) => ({ productId: r.productId, quantity: Number(r.quantity) }));
          if (lines.length === 0) return;
          createSale(customerName, lines);
          push("Sale recorded");
          onClose();
        }}
      >
        <FormField label="Customer" htmlFor="customerName" required>
          <Select id="customerName" value={customerName} onChange={(e) => setCustomerName(e.target.value)}>
            {customers.map((c) => (
              <option key={c.id} value={c.name}>
                {c.name}
              </option>
            ))}
          </Select>
        </FormField>

        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium text-text-secondary">Items</span>
          {rows.map((row, i) => (
            <div key={row.key} className="flex items-end gap-2">
              <div className="flex-1">
                <Select
                  value={row.productId}
                  onChange={(e) =>
                    setRows((r) => r.map((x, idx) => (idx === i ? { ...x, productId: e.target.value } : x)))
                  }
                >
                  <option value="">Product</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} (${p.sellingPrice.toFixed(2)})
                    </option>
                  ))}
                </Select>
              </div>
              <div className="w-24">
                <Input
                  type="number"
                  min="1"
                  step="1"
                  value={row.quantity}
                  onChange={(e) => setRows((r) => r.map((x, idx) => (idx === i ? { ...x, quantity: e.target.value } : x)))}
                />
              </div>
              <button
                type="button"
                onClick={() => setRows((r) => (r.length > 1 ? r.filter((_, idx) => idx !== i) : r))}
                className="mb-1.5 rounded-md p-2 text-text-tertiary hover:bg-workspace hover:text-danger-600"
                aria-label="Remove item"
              >
                <X className="size-4" />
              </button>
            </div>
          ))}
          <Button
            type="button"
            variant="secondary"
            onClick={() => setRows((r) => [...r, { key: rowId++, productId: "", quantity: "1" }])}
          >
            <Plus className="size-4" />
            Add item
          </Button>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit">Create sale</Button>
        </div>
      </form>
    </Modal>
  );
}

export default function DemoSalesPage() {
  const { sales } = useDemo();
  const [open, setOpen] = useState(false);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <PageHeader module="Sales" title="Invoices" />
        <Button onClick={() => setOpen(true)}>
          <Plus className="size-4" />
          New Sale
        </Button>
      </div>

      <p className="text-sm text-text-tertiary">
        Creating a sale here deducts real stock from the Products page and updates the Dashboard&apos;s revenue
        chart, all within this sandbox session.
      </p>

      <Card>
        {sales.length === 0 ? (
          <EmptyState icon={Receipt} title="No sales yet" />
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border-subtle text-left text-xs font-medium uppercase tracking-wide text-text-tertiary">
                <th className="px-4 py-2.5">Invoice #</th>
                <th className="px-4 py-2.5">Customer</th>
                <th className="px-4 py-2.5">Items</th>
                <th className="px-4 py-2.5">Total</th>
                <th className="px-4 py-2.5">Date</th>
              </tr>
            </thead>
            <tbody>
              {sales.map((s) => (
                <tr key={s.id} className="border-b border-border-subtle last:border-b-0">
                  <td className="px-4 py-2.5 font-mono font-medium text-text-primary">{s.invoiceNumber}</td>
                  <td className="px-4 py-2.5 text-text-secondary">{s.customerName}</td>
                  <td className="px-4 py-2.5 text-text-secondary">
                    {s.lines.map((l) => `${l.quantity}x ${l.productName}`).join(", ")}
                  </td>
                  <td className="px-4 py-2.5 font-medium text-text-primary">${s.total.toFixed(2)}</td>
                  <td className="px-4 py-2.5 text-text-secondary">{new Date(s.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      {open && <NewSaleModal onClose={() => setOpen(false)} />}
    </div>
  );
}
