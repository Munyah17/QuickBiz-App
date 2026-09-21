"use client";

import { useActionState, useEffect, useState } from "react";
import { Plus, HandCoins } from "lucide-react";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { Badge } from "@/components/Badge";
import { Modal } from "@/components/Modal";
import { Input, Select, Textarea } from "@/components/Input";
import { FormField } from "@/components/FormField";
import { EmptyState } from "@/components/EmptyState";
import { useToast } from "@/components/Toast";
import {
  createPaymentRequestAction,
  decidePaymentRequestAction,
  markPaymentRequestPaidAction,
  initialExpenseActionState,
} from "./actions";
import type { PaymentRequest } from "@/services/paymentRequests";

const statusTone: Record<string, "success" | "info" | "warning" | "danger" | "neutral"> = {
  pending: "warning",
  approved: "info",
  rejected: "danger",
  paid: "success",
  cancelled: "neutral",
};

function RequestForm({ branchId, onClose }: { branchId: string; onClose: () => void }) {
  const [state, formAction, isPending] = useActionState(createPaymentRequestAction, initialExpenseActionState);
  const { push } = useToast();

  useEffect(() => {
    if (state.success) {
      push("Payment request submitted");
      onClose();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.success]);

  return (
    <Modal open onClose={onClose} title="New payment request">
      <form action={formAction} className="flex flex-col gap-4">
        <input type="hidden" name="branchId" value={branchId} />

        <FormField label="Payee" htmlFor="payee" required hint="Who should be paid">
          <Input id="payee" name="payee" required />
        </FormField>

        <div className="grid grid-cols-2 gap-4">
          <FormField label="Amount" htmlFor="prAmount" required>
            <Input id="prAmount" name="amount" type="number" min="0.01" step="0.01" required />
          </FormField>
          <FormField label="Needed by" htmlFor="neededBy" hint="Optional">
            <Input id="neededBy" name="neededBy" type="date" />
          </FormField>
        </div>

        <FormField label="Category" htmlFor="category" hint="Optional — e.g. supplies, fuel, services">
          <Input id="category" name="category" />
        </FormField>

        <FormField label="Reason" htmlFor="reason" required>
          <Textarea id="reason" name="reason" rows={2} required />
        </FormField>

        {state.error && <p className="text-sm text-danger-600">{state.error}</p>}

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={isPending}>
            Submit request
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function DecideButtons({ id }: { id: string }) {
  const [state, formAction, isPending] = useActionState(decidePaymentRequestAction, initialExpenseActionState);
  const { push } = useToast();

  useEffect(() => {
    if (state.success) push("Decision recorded");
    if (state.error) push(state.error, "error");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.success, state.error]);

  return (
    <form action={formAction} className="flex items-center gap-1.5">
      <input type="hidden" name="requestId" value={id} />
      <Button type="submit" name="decision" value="approved" size="sm" loading={isPending}>
        Approve
      </Button>
      <Button type="submit" name="decision" value="rejected" size="sm" variant="secondary" loading={isPending}>
        Reject
      </Button>
    </form>
  );
}

function MarkPaidButton({ id }: { id: string }) {
  const [state, formAction, isPending] = useActionState(markPaymentRequestPaidAction, initialExpenseActionState);
  const { push } = useToast();

  useEffect(() => {
    if (state.success) push("Marked as paid");
    if (state.error) push(state.error, "error");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.success, state.error]);

  return (
    <form action={formAction}>
      <input type="hidden" name="requestId" value={id} />
      <Button type="submit" size="sm" variant="secondary" loading={isPending}>
        Mark paid
      </Button>
    </form>
  );
}

export function PaymentRequestsSection({
  requests,
  branchId,
  canManage,
  canApprove,
}: {
  requests: PaymentRequest[];
  branchId: string;
  canManage: boolean;
  canApprove: boolean;
}) {
  const [adding, setAdding] = useState(false);
  const pending = requests.filter((r) => r.status === "pending");

  return (
    <Card>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border-subtle px-4 py-3">
        <h3 className="text-sm font-semibold text-text-primary">
          Payment requests
          {pending.length > 0 && (
            <span className="ml-2 rounded-full bg-warning-100 px-2 py-0.5 text-xs font-medium text-warning-700">
              {pending.length} awaiting approval
            </span>
          )}
        </h3>
        {canManage && (
          <Button size="sm" variant="secondary" onClick={() => setAdding(true)}>
            <Plus className="size-4" />
            New request
          </Button>
        )}
      </div>

      {requests.length === 0 ? (
        <EmptyState icon={HandCoins} title="No payment requests" />
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border-subtle text-left text-xs font-medium uppercase tracking-wide text-text-tertiary">
              <th className="px-4 py-2.5">Request #</th>
              <th className="px-4 py-2.5">Payee</th>
              <th className="px-4 py-2.5">Reason</th>
              <th className="px-4 py-2.5">Amount</th>
              <th className="px-4 py-2.5">Needed by</th>
              <th className="px-4 py-2.5">Requested by</th>
              <th className="px-4 py-2.5">Status</th>
              <th className="px-4 py-2.5"></th>
            </tr>
          </thead>
          <tbody>
            {requests.map((r) => (
              <tr key={r.id} className="border-b border-border-subtle last:border-b-0">
                <td className="px-4 py-2.5 font-mono font-medium text-text-primary">{r.request_number}</td>
                <td className="px-4 py-2.5 text-text-secondary">{r.payee}</td>
                <td className="max-w-xs truncate px-4 py-2.5 text-text-secondary">
                  {r.reason}
                  {r.category && <span className="block text-xs text-text-tertiary">{r.category}</span>}
                </td>
                <td className="px-4 py-2.5 text-text-secondary">
                  {r.currency} {r.amount.toFixed(2)}
                </td>
                <td className="px-4 py-2.5 text-text-secondary">{r.needed_by ?? "—"}</td>
                <td className="px-4 py-2.5 text-text-secondary">{r.requestedByName ?? "—"}</td>
                <td className="px-4 py-2.5">
                  <Badge tone={statusTone[r.status] ?? "neutral"}>{r.status}</Badge>
                  {r.decision_note && <span className="block text-xs text-text-tertiary">{r.decision_note}</span>}
                </td>
                <td className="px-4 py-2.5">
                  {r.status === "pending" && canApprove && <DecideButtons id={r.id} />}
                  {r.status === "approved" && canManage && <MarkPaidButton id={r.id} />}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {adding && <RequestForm branchId={branchId} onClose={() => setAdding(false)} />}
    </Card>
  );
}
