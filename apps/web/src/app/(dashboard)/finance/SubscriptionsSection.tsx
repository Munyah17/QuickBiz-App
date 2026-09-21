"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { Plus, RefreshCcw } from "lucide-react";
import { Card, CardHeader } from "@/components/Card";
import { Button } from "@/components/Button";
import { Badge } from "@/components/Badge";
import { Modal } from "@/components/Modal";
import { Input, Select, Textarea } from "@/components/Input";
import { FormField } from "@/components/FormField";
import { EmptyState } from "@/components/EmptyState";
import { useToast } from "@/components/Toast";
import { createSubscriptionAction, setSubscriptionStatusAction, initialFinanceActionState } from "./actions";
import { daysUntilRenewal, type Subscription, type SubscriptionDirection } from "@/services/subscriptions";

const statusTone: Record<string, "success" | "info" | "warning" | "danger" | "neutral"> = {
  active: "success",
  paused: "warning",
  cancelled: "neutral",
  expired: "danger",
};

const cycleLabel: Record<string, string> = {
  weekly: "Weekly",
  monthly: "Monthly",
  quarterly: "Quarterly",
  yearly: "Yearly",
  once: "One-off",
};

function SubscriptionForm({ direction, onClose }: { direction: SubscriptionDirection; onClose: () => void }) {
  const [state, formAction, isPending] = useActionState(createSubscriptionAction, initialFinanceActionState);
  const { push } = useToast();
  const today = new Date().toISOString().slice(0, 10);

  useEffect(() => {
    if (state.success) {
      push("Subscription added");
      onClose();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.success]);

  return (
    <Modal open onClose={onClose} title={direction === "incoming" ? "New incoming subscription" : "New outgoing subscription"}>
      <form action={formAction} className="flex flex-col gap-4">
        <input type="hidden" name="direction" value={direction} />

        <FormField label="Name" htmlFor="subName" required hint="e.g. Office rent, Sage licence, retainer">
          <Input id="subName" name="name" required />
        </FormField>

        <FormField
          label={direction === "incoming" ? "Customer" : "Vendor / provider"}
          htmlFor="counterparty"
          required
        >
          <Input id="counterparty" name="counterparty" required />
        </FormField>

        <div className="grid grid-cols-3 gap-4">
          <FormField label="Amount" htmlFor="subAmount" required>
            <Input id="subAmount" name="amount" type="number" min="0.01" step="0.01" required />
          </FormField>
          <FormField label="Currency" htmlFor="subCurrency">
            <Input id="subCurrency" name="currency" defaultValue="USD" maxLength={3} />
          </FormField>
          <FormField label="Billing cycle" htmlFor="billingCycle">
            <Select id="billingCycle" name="billingCycle" defaultValue="monthly">
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="quarterly">Quarterly</option>
              <option value="yearly">Yearly</option>
              <option value="once">One-off</option>
            </Select>
          </FormField>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField label="Start date" htmlFor="startDate" required>
            <Input id="startDate" name="startDate" type="date" required defaultValue={today} />
          </FormField>
          <FormField label="Next renewal" htmlFor="nextRenewalDate" hint="Optional — drives reminders">
            <Input id="nextRenewalDate" name="nextRenewalDate" type="date" />
          </FormField>
        </div>

        <label className="flex items-center gap-2 text-sm text-text-primary">
          <input type="checkbox" name="autoRenew" defaultChecked className="size-4 rounded border-border" />
          Auto-renews
        </label>

        <FormField label="Notes" htmlFor="subNotes" hint="Optional">
          <Textarea id="subNotes" name="notes" rows={2} />
        </FormField>

        {state.error && <p className="text-sm text-danger-600">{state.error}</p>}

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={isPending}>
            Add subscription
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function StatusControl({ id, status }: { id: string; status: string }) {
  const [state, formAction, isPending] = useActionState(setSubscriptionStatusAction, initialFinanceActionState);
  const { push } = useToast();

  useEffect(() => {
    if (state.success) push("Subscription updated");
    if (state.error) push(state.error, "error");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.success, state.error]);

  return (
    <form action={formAction} className="flex items-center gap-1">
      <input type="hidden" name="subscriptionId" value={id} />
      <Select name="status" defaultValue={status} className="h-8 w-28 text-xs" disabled={isPending}>
        <option value="active">Active</option>
        <option value="paused">Paused</option>
        <option value="cancelled">Cancelled</option>
        <option value="expired">Expired</option>
      </Select>
      <Button type="submit" size="sm" variant="secondary" loading={isPending}>
        Set
      </Button>
    </form>
  );
}

function SubTable({ rows, canManage }: { rows: Subscription[]; canManage: boolean }) {
  if (rows.length === 0) return <EmptyState icon={RefreshCcw} title="No subscriptions yet" />;
  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b border-border-subtle text-left text-xs font-medium uppercase tracking-wide text-text-tertiary">
          <th className="px-4 py-2.5">Name</th>
          <th className="px-4 py-2.5">Counterparty</th>
          <th className="px-4 py-2.5">Amount</th>
          <th className="px-4 py-2.5">Cycle</th>
          <th className="px-4 py-2.5">Next renewal</th>
          <th className="px-4 py-2.5">Status</th>
          {canManage && <th className="px-4 py-2.5"></th>}
        </tr>
      </thead>
      <tbody>
        {rows.map((s) => {
          const days = daysUntilRenewal(s.next_renewal_date);
          const renewalTone =
            days === null ? "" : days < 0 ? "text-danger-600 font-medium" : days <= 14 ? "text-warning-600 font-medium" : "text-text-secondary";
          return (
            <tr key={s.id} className="border-b border-border-subtle last:border-b-0">
              <td className="px-4 py-2.5 font-medium text-text-primary">
                {s.name}
                {s.auto_renew && <span className="ml-1.5 text-xs text-text-tertiary">(auto)</span>}
              </td>
              <td className="px-4 py-2.5 text-text-secondary">{s.counterparty}</td>
              <td className="px-4 py-2.5 text-text-secondary">
                {s.currency} {s.amount.toFixed(2)}
              </td>
              <td className="px-4 py-2.5 text-text-secondary">{cycleLabel[s.billing_cycle] ?? s.billing_cycle}</td>
              <td className={`px-4 py-2.5 ${renewalTone}`}>
                {s.next_renewal_date ?? "—"}
                {days !== null && s.status === "active" && (
                  <span className="block text-xs">
                    {days < 0 ? `${-days}d overdue` : days === 0 ? "today" : `in ${days}d`}
                  </span>
                )}
              </td>
              <td className="px-4 py-2.5">
                <Badge tone={statusTone[s.status] ?? "neutral"}>{s.status}</Badge>
              </td>
              {canManage && (
                <td className="px-4 py-2.5">
                  <StatusControl id={s.id} status={s.status} />
                </td>
              )}
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

export function SubscriptionsSection({
  incoming,
  outgoing,
  canManage,
}: {
  incoming: Subscription[];
  outgoing: Subscription[];
  canManage: boolean;
}) {
  const [tab, setTab] = useState<SubscriptionDirection>("outgoing");
  const [adding, setAdding] = useState(false);
  const rows = useMemo(() => (tab === "incoming" ? incoming : outgoing), [tab, incoming, outgoing]);

  return (
    <Card>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border-subtle px-4 py-3">
        <div className="flex items-center gap-3">
          <h3 className="text-sm font-semibold text-text-primary">Subscriptions & renewals</h3>
          <div className="flex rounded-md border border-border text-xs">
            <button
              type="button"
              onClick={() => setTab("outgoing")}
              className={`px-3 py-1.5 ${tab === "outgoing" ? "bg-primary-50 font-medium text-primary-700" : "text-text-secondary"}`}
            >
              Outgoing ({outgoing.length})
            </button>
            <button
              type="button"
              onClick={() => setTab("incoming")}
              className={`px-3 py-1.5 ${tab === "incoming" ? "bg-primary-50 font-medium text-primary-700" : "text-text-secondary"}`}
            >
              Incoming ({incoming.length})
            </button>
          </div>
        </div>
        {canManage && (
          <Button size="sm" variant="secondary" onClick={() => setAdding(true)}>
            <Plus className="size-4" />
            Add {tab === "incoming" ? "incoming" : "outgoing"}
          </Button>
        )}
      </div>
      <SubTable rows={rows} canManage={canManage} />
      {adding && <SubscriptionForm direction={tab} onClose={() => setAdding(false)} />}
    </Card>
  );
}
