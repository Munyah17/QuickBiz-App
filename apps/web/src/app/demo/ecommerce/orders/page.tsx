"use client";

import { useState } from "react";
import { Plus, ShoppingBag } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { EmptyState } from "@/components/EmptyState";
import { Modal } from "@/components/Modal";
import { Input } from "@/components/Input";
import { FormField } from "@/components/FormField";
import { useDemo, type DemoOnlineOrder } from "@/lib/demo/DemoContext";
import { useToast } from "@/components/Toast";

const STATUSES: DemoOnlineOrder["status"][] = ["pending", "confirmed", "fulfilled", "cancelled"];
const DELIVERY_STATUSES: DemoOnlineOrder["deliveryStatus"][] = ["not_shipped", "shipped", "delivered"];

function NewOnlineOrderModal({ onClose }: { onClose: () => void }) {
  const { createOnlineOrder } = useDemo();
  const { push } = useToast();
  const [buyerName, setBuyerName] = useState("");
  const [total, setTotal] = useState("0");

  return (
    <Modal open onClose={onClose} title="New online order">
      <form
        className="flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          if (!buyerName.trim()) return;
          createOnlineOrder({ buyerName: buyerName.trim(), total: Number(total) || 0 });
          push("Online order created");
          onClose();
        }}
      >
        <FormField label="Buyer name" htmlFor="buyerName" required>
          <Input id="buyerName" required value={buyerName} onChange={(e) => setBuyerName(e.target.value)} />
        </FormField>
        <FormField label="Total" htmlFor="total">
          <Input id="total" type="number" min="0" step="0.01" value={total} onChange={(e) => setTotal(e.target.value)} />
        </FormField>
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit">Create order</Button>
        </div>
      </form>
    </Modal>
  );
}

export default function DemoOnlineOrdersPage() {
  const { onlineOrders, setOnlineOrderStatus, setOnlineOrderDeliveryStatus } = useDemo();
  const [open, setOpen] = useState(false);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <PageHeader module="Ecommerce" title="Online Orders" />
        <Button onClick={() => setOpen(true)}>
          <Plus className="size-4" />
          New Order
        </Button>
      </div>

      <Card>
        {onlineOrders.length === 0 ? (
          <EmptyState icon={ShoppingBag} title="No online orders yet" />
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border-subtle text-left text-xs font-medium uppercase tracking-wide text-text-tertiary">
                <th className="px-4 py-2.5">Order #</th>
                <th className="px-4 py-2.5">Buyer</th>
                <th className="px-4 py-2.5">Total</th>
                <th className="px-4 py-2.5">Status</th>
                <th className="px-4 py-2.5">Delivery</th>
              </tr>
            </thead>
            <tbody>
              {onlineOrders.map((o) => (
                <tr key={o.id} className="border-b border-border-subtle last:border-b-0">
                  <td className="px-4 py-2.5 font-mono font-medium text-text-primary">{o.orderNumber}</td>
                  <td className="px-4 py-2.5 text-text-secondary">{o.buyerName}</td>
                  <td className="px-4 py-2.5 text-text-secondary">${o.total.toFixed(2)}</td>
                  <td className="px-4 py-2.5">
                    <select
                      value={o.status}
                      onChange={(e) => setOnlineOrderStatus(o.id, e.target.value as DemoOnlineOrder["status"])}
                      className="h-8 rounded-md border border-border bg-white px-2 text-xs capitalize focus:outline-none"
                    >
                      {STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-2.5">
                    <select
                      value={o.deliveryStatus}
                      onChange={(e) => setOnlineOrderDeliveryStatus(o.id, e.target.value as DemoOnlineOrder["deliveryStatus"])}
                      className="h-8 rounded-md border border-border bg-white px-2 text-xs capitalize focus:outline-none"
                    >
                      {DELIVERY_STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {s.replace("_", " ")}
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

      {open && <NewOnlineOrderModal onClose={() => setOpen(false)} />}
    </div>
  );
}
