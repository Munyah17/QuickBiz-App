"use client";

import { useActionState, useEffect, useState } from "react";
import Link from "next/link";
import { Plus, ClipboardList, Trash2 } from "lucide-react";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { Badge } from "@/components/Badge";
import { Modal } from "@/components/Modal";
import { Input, Textarea } from "@/components/Input";
import { FormField } from "@/components/FormField";
import { EmptyState } from "@/components/EmptyState";
import { useToast } from "@/components/Toast";
import { createRequisitionAction, decideRequisitionAction, initialPurchasingActionState } from "./actions";
import type { Requisition } from "@/services/purchasing";

const statusTone: Record<string, "success" | "info" | "warning" | "danger" | "neutral"> = {
  pending: "warning",
  approved: "info",
  rejected: "danger",
  converted: "success",
  cancelled: "neutral",
};

interface ReqLine {
  product_id: string;
  description: string;
  quantity: number;
  estimated_cost: number;
}

function RequisitionForm({ branchId, onClose }: { branchId: string; onClose: () => void }) {
  const [state, formAction, isPending] = useActionState(createRequisitionAction, initialPurchasingActionState);
  const { push } = useToast();
  const [lines, setLines] = useState<ReqLine[]>([{ product_id: "", description: "", quantity: 1, estimated_cost: 0 }]);

  useEffect(() => {
    if (state.success) {
      push("Requisition submitted");
      onClose();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.success]);

  function setLine(i: number, patch: Partial<ReqLine>) {
    setLines((prev) => prev.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));
  }

  return (
    <Modal open onClose={onClose} title="New purchase requisition">
      <form action={formAction} className="flex flex-col gap-4">
        <input type="hidden" name="branchId" value={branchId} />
        <input type="hidden" name="items" value={JSON.stringify(lines)} />

        <div className="grid grid-cols-2 gap-4">
          <FormField label="Needed by" htmlFor="neededBy" hint="Optional">
            <Input id="neededBy" name="neededBy" type="date" />
          </FormField>
          <FormField label="Justification" htmlFor="justification" hint="Why is this needed">
            <Input id="justification" name="justification" />
          </FormField>
        </div>

        <div className="flex flex-col gap-2">
          <div className="grid grid-cols-[1fr_90px_120px_36px] items-end gap-2 text-xs font-medium uppercase tracking-wide text-text-tertiary">
            <span>Item / description</span>
            <span>Qty</span>
            <span>Est. unit cost</span>
            <span />
          </div>
          {lines.map((l, i) => (
            <div key={i} className="grid grid-cols-[1fr_90px_120px_36px] items-center gap-2">
              <Input
                value={l.description}
                onChange={(e) => setLine(i, { description: e.target.value })}
                placeholder="e.g. A4 paper, cement, laptop"
                required
              />
              <Input
                type="number"
                min="0.01"
                step="0.01"
                value={l.quantity}
                onChange={(e) => setLine(i, { quantity: Number(e.target.value) })}
                required
              />
              <Input
                type="number"
                min="0"
                step="0.01"
                value={l.estimated_cost}
                onChange={(e) => setLine(i, { estimated_cost: Number(e.target.value) })}
              />
              <button
                type="button"
                onClick={() => setLines((prev) => prev.filter((_, idx) => idx !== i))}
                className="flex size-9 items-center justify-center rounded-md text-text-tertiary hover:bg-danger-50 hover:text-danger-600"
                aria-label="Remove line"
              >
                <Trash2 className="size-4" />
              </button>
            </div>
          ))}
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="self-start"
            onClick={() => setLines((prev) => [...prev, { product_id: "", description: "", quantity: 1, estimated_cost: 0 }])}
          >
            <Plus className="size-4" />
            Add line
          </Button>
        </div>

        <p className="text-sm text-text-secondary">
          Estimated total: <span className="font-semibold">${lines.reduce((s, l) => s + l.quantity * l.estimated_cost, 0).toFixed(2)}</span>
        </p>

        {state.error && <p className="text-sm text-danger-600">{state.error}</p>}

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={isPending}>
            Submit requisition
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function DecideButtons({ id }: { id: string }) {
  const [state, formAction, isPending] = useActionState(decideRequisitionAction, initialPurchasingActionState);
  const { push } = useToast();

  useEffect(() => {
    if (state.success) push("Decision recorded");
    if (state.error) push(state.error, "error");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.success, state.error]);

  return (
    <form action={formAction} className="flex items-center gap-1.5">
      <input type="hidden" name="requisitionId" value={id} />
      <Button type="submit" name="decision" value="approved" size="sm" loading={isPending}>
        Approve
      </Button>
      <Button type="submit" name="decision" value="rejected" size="sm" variant="secondary" loading={isPending}>
        Reject
      </Button>
    </form>
  );
}

export function RequisitionsSection({
  requisitions,
  branchId,
  canManage,
}: {
  requisitions: Requisition[];
  branchId: string;
  canManage: boolean;
}) {
  const [adding, setAdding] = useState(false);
  const pending = requisitions.filter((r) => r.status === "pending");

  return (
    <Card>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border-subtle px-4 py-3">
        <h3 className="text-sm font-semibold text-text-primary">
          Purchase requisitions
          {pending.length > 0 && (
            <span className="ml-2 rounded-full bg-warning-100 px-2 py-0.5 text-xs font-medium text-warning-700">
              {pending.length} awaiting approval
            </span>
          )}
        </h3>
        {canManage && (
          <Button size="sm" variant="secondary" onClick={() => setAdding(true)}>
            <Plus className="size-4" />
            New requisition
          </Button>
        )}
      </div>

      {requisitions.length === 0 ? (
        <EmptyState icon={ClipboardList} title="No requisitions yet" />
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border-subtle text-left text-xs font-medium uppercase tracking-wide text-text-tertiary">
              <th className="px-4 py-2.5">Req #</th>
              <th className="px-4 py-2.5">Items</th>
              <th className="px-4 py-2.5">Est. total</th>
              <th className="px-4 py-2.5">Needed by</th>
              <th className="px-4 py-2.5">Requested by</th>
              <th className="px-4 py-2.5">Status</th>
              <th className="px-4 py-2.5"></th>
            </tr>
          </thead>
          <tbody>
            {requisitions.map((r) => (
              <tr key={r.id} className="border-b border-border-subtle last:border-b-0">
                <td className="px-4 py-2.5 font-mono font-medium text-text-primary">{r.requisition_number}</td>
                <td className="max-w-xs px-4 py-2.5 text-text-secondary">
                  <span className="block truncate">{r.items.map((i) => i.description).join(", ")}</span>
                  {r.justification && <span className="block truncate text-xs text-text-tertiary">{r.justification}</span>}
                </td>
                <td className="px-4 py-2.5 text-text-secondary">${r.estimatedTotal.toFixed(2)}</td>
                <td className="px-4 py-2.5 text-text-secondary">{r.needed_by ?? "—"}</td>
                <td className="px-4 py-2.5 text-text-secondary">{r.requestedByName ?? "—"}</td>
                <td className="px-4 py-2.5">
                  <Badge tone={statusTone[r.status] ?? "neutral"}>{r.status}</Badge>
                </td>
                <td className="px-4 py-2.5">
                  {r.status === "pending" && canManage && <DecideButtons id={r.id} />}
                  {r.status === "approved" && canManage && (
                    <Link href={`/purchasing/new?requisition=${r.id}`}>
                      <Button size="sm" variant="secondary">
                        Convert to PO
                      </Button>
                    </Link>
                  )}
                  {r.status === "converted" && r.po_id && (
                    <Link href={`/purchasing/${r.po_id}`} className="text-sm text-primary-600 hover:underline">
                      View PO →
                    </Link>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {adding && <RequisitionForm branchId={branchId} onClose={() => setAdding(false)} />}
    </Card>
  );
}
