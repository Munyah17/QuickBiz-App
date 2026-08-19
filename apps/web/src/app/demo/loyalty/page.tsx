"use client";

import { useState } from "react";
import { Plus, Star } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardHeader } from "@/components/Card";
import { Badge } from "@/components/Badge";
import { Button } from "@/components/Button";
import { EmptyState } from "@/components/EmptyState";
import { Modal } from "@/components/Modal";
import { Input, Select } from "@/components/Input";
import { FormField } from "@/components/FormField";
import { useDemo, type DemoLoyaltyTransaction } from "@/lib/demo/DemoContext";
import { useToast } from "@/components/Toast";

const typeTone: Record<string, "success" | "warning" | "neutral"> = { earn: "success", redeem: "warning", adjustment: "neutral" };

function RecordTransactionModal({ onClose }: { onClose: () => void }) {
  const { customers, recordLoyaltyTransaction } = useDemo();
  const { push } = useToast();
  const [customerName, setCustomerName] = useState(customers[0]?.name ?? "");
  const [type, setType] = useState<DemoLoyaltyTransaction["type"]>("earn");
  const [points, setPoints] = useState("10");
  const [reason, setReason] = useState("");

  return (
    <Modal open onClose={onClose} title="Record loyalty transaction">
      <form
        className="flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          if (!customerName || !points) return;
          recordLoyaltyTransaction({ customerName, points: Number(points) || 0, type, reason: reason.trim() });
          push("Loyalty transaction recorded");
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
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Type" htmlFor="type">
            <Select id="type" value={type} onChange={(e) => setType(e.target.value as DemoLoyaltyTransaction["type"])}>
              <option value="earn">Earn</option>
              <option value="redeem">Redeem</option>
              <option value="adjustment">Adjustment</option>
            </Select>
          </FormField>
          <FormField label="Points" htmlFor="points" required>
            <Input id="points" type="number" min="1" step="1" required value={points} onChange={(e) => setPoints(e.target.value)} />
          </FormField>
        </div>
        <FormField label="Reason" htmlFor="reason">
          <Input id="reason" value={reason} onChange={(e) => setReason(e.target.value)} />
        </FormField>
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit">Record</Button>
        </div>
      </form>
    </Modal>
  );
}

export default function DemoLoyaltyPage() {
  const { customers, loyaltyTransactions } = useDemo();
  const [open, setOpen] = useState(false);

  const balances = customers
    .map((c) => ({ name: c.name, balance: loyaltyTransactions.filter((t) => t.customerName === c.name).reduce((sum, t) => sum + t.points, 0) }))
    .filter((b) => b.balance !== 0);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <PageHeader module="Marketing" title="Loyalty" />
        <Button onClick={() => setOpen(true)}>
          <Plus className="size-4" />
          Record Transaction
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="Customer balances" />
          {balances.length === 0 ? (
            <EmptyState icon={Star} title="No loyalty points yet" />
          ) : (
            <ul className="flex flex-col divide-y divide-border-subtle px-4">
              {balances.map((b) => (
                <li key={b.name} className="flex items-center justify-between py-2.5 text-sm">
                  <span className="text-text-primary">{b.name}</span>
                  <span className="font-semibold text-text-primary">{b.balance.toLocaleString()} pts</span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <CardHeader title="Recent transactions" />
          {loyaltyTransactions.length === 0 ? (
            <EmptyState icon={Star} title="No transactions yet" />
          ) : (
            <ul className="flex flex-col divide-y divide-border-subtle px-4">
              {loyaltyTransactions.map((t) => (
                <li key={t.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                  <div className="min-w-0">
                    <p className="truncate text-text-primary">{t.customerName}</p>
                    <p className="truncate text-xs text-text-tertiary">{t.reason || "No reason given"}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <Badge tone={typeTone[t.type] ?? "neutral"}>{t.type}</Badge>
                    <span className={`text-sm font-medium ${t.points < 0 ? "text-danger-600" : "text-success-600"}`}>
                      {t.points > 0 ? "+" : ""}
                      {t.points}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      {open && <RecordTransactionModal onClose={() => setOpen(false)} />}
    </div>
  );
}
