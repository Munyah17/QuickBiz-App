"use client";

import { useActionState, useEffect, useMemo, useState, useTransition } from "react";
import { PackageX, AlertTriangle, Trash2, DollarSign } from "lucide-react";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { Badge } from "@/components/Badge";
import { EmptyState } from "@/components/EmptyState";
import { Modal } from "@/components/Modal";
import { Input, Select } from "@/components/Input";
import { FormField } from "@/components/FormField";
import { SearchInput } from "@/components/SearchInput";
import { ExportButton } from "@/components/ExportButton";
import { useToast } from "@/components/Toast";
import { recordLossAction, setLossStatusAction, initialLossActionState } from "./actions";
import type { LossControlRow } from "@/services/lossControl";

const reasonTone: Record<string, "warning" | "danger" | "info" | "neutral"> = {
  expired: "warning",
  damaged: "danger",
  discarded: "neutral",
  theft: "danger",
  other: "info",
};
const statusTone: Record<string, "warning" | "success" | "neutral"> = {
  recorded: "warning",
  approved: "success",
  written_off: "neutral",
};

const money = (n: number) => n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export function LossControlClient({
  records,
  warehouses,
  products,
  canManage,
  provisionError,
}: {
  records: LossControlRow[];
  warehouses: Array<{ id: string; name: string }>;
  products: Array<{ id: string; name: string }>;
  canManage: boolean;
  provisionError: string | null;
}) {
  const [query, setQuery] = useState("");
  const [reasonFilter, setReasonFilter] = useState("all");
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const { push } = useToast();

  const stats = useMemo(() => {
    const totalValue = records.reduce((s, r) => s + (r.total_value || 0), 0);
    const open = records.filter((r) => r.status === "recorded").length;
    const expired = records.filter((r) => r.reason === "expired").length;
    return { totalValue, open, expired, count: records.length };
  }, [records]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return records.filter((r) => {
      if (reasonFilter !== "all" && r.reason !== reasonFilter) return false;
      if (!q) return true;
      return [r.productName, r.warehouseName, r.notes].some((f) => f?.toLowerCase().includes(q));
    });
  }, [records, query, reasonFilter]);

  function setStatus(id: string, status: string) {
    startTransition(async () => {
      const r = await setLossStatusAction(id, status);
      if (r.success) push(`Marked ${status.replace("_", " ")}`);
      else if (r.error) push(r.error, "error");
    });
  }

  if (provisionError) {
    return (
      <Card>
        <EmptyState icon={PackageX} title="Loss control isn't provisioned yet" description={`Apply migration 000066_feature_depth (supabase db push). Detail: ${provisionError}`} />
      </Card>
    );
  }

  return (
    <>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat icon={DollarSign} label="Total loss value" value={money(stats.totalValue)} sub={`${stats.count} records`} />
        <Stat icon={AlertTriangle} label="Awaiting review" value={String(stats.open)} sub="recorded, not written off" />
        <Stat icon={PackageX} label="Expired items" value={String(stats.expired)} sub="by count of records" />
        <Stat icon={Trash2} label="Written off" value={String(records.filter((r) => r.status === "written_off").length)} sub="removed from stock" />
      </div>

      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border-subtle px-4 py-3">
          <h3 className="text-sm font-semibold text-text-primary">{filtered.length} of {records.length} loss records</h3>
          <div className="flex flex-1 items-center justify-end gap-2">
            <SearchInput value={query} onChange={setQuery} placeholder="Search product, warehouse..." />
            <Select value={reasonFilter} onChange={(e) => setReasonFilter(e.target.value)} className="w-36">
              <option value="all">All reasons</option>
              <option value="expired">Expired</option>
              <option value="damaged">Damaged</option>
              <option value="discarded">Discarded</option>
              <option value="theft">Theft</option>
              <option value="other">Other</option>
            </Select>
            <ExportButton
              filename="loss-control"
              rows={filtered.map((r) => ({
                Product: r.productName ?? "",
                Warehouse: r.warehouseName ?? "",
                Qty: r.quantity,
                Reason: r.reason,
                "Unit cost": r.unit_cost,
                "Total value": r.total_value,
                Status: r.status,
                Notes: r.notes ?? "",
                Recorded: r.created_at,
              }))}
            />
            {canManage && <Button size="sm" onClick={() => setOpen(true)}>Record loss</Button>}
          </div>
        </div>

        {records.length === 0 ? (
          <EmptyState icon={PackageX} title="No loss records" description="Record expired, damaged, discarded or stolen stock to track shrinkage." />
        ) : filtered.length === 0 ? (
          <EmptyState icon={PackageX} title="No records match" />
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border-subtle text-left text-xs font-medium uppercase tracking-wide text-text-tertiary">
                <th className="px-4 py-2.5">Product</th>
                <th className="px-4 py-2.5">Warehouse</th>
                <th className="px-4 py-2.5">Qty</th>
                <th className="px-4 py-2.5">Reason</th>
                <th className="px-4 py-2.5">Value</th>
                <th className="px-4 py-2.5">Status</th>
                {canManage && <th className="px-4 py-2.5"></th>}
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.id} className="border-b border-border-subtle last:border-b-0">
                  <td className="px-4 py-2.5 font-medium text-text-primary">
                    {r.productName ?? "Unlinked product"}
                    {r.notes && <span className="block text-xs font-normal text-text-tertiary">{r.notes}</span>}
                  </td>
                  <td className="px-4 py-2.5 text-text-secondary">{r.warehouseName ?? "—"}</td>
                  <td className="px-4 py-2.5 text-text-secondary">{r.quantity}</td>
                  <td className="px-4 py-2.5"><Badge tone={reasonTone[r.reason] ?? "neutral"}>{r.reason}</Badge></td>
                  <td className="px-4 py-2.5 text-text-secondary">{money(r.total_value)}</td>
                  <td className="px-4 py-2.5"><Badge tone={statusTone[r.status] ?? "neutral"}>{r.status.replace("_", " ")}</Badge></td>
                  {canManage && (
                    <td className="px-4 py-2.5 text-right">
                      {r.status === "recorded" && (
                        <button type="button" disabled={isPending} onClick={() => setStatus(r.id, "approved")} className="text-xs text-primary-600 hover:underline">Approve</button>
                      )}
                      {r.status === "approved" && (
                        <button type="button" disabled={isPending} onClick={() => setStatus(r.id, "written_off")} className="text-xs text-success-600 hover:underline">Write off</button>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      <RecordLossModal open={open} onClose={() => setOpen(false)} warehouses={warehouses} products={products} />
    </>
  );
}

function Stat({ icon: Icon, label, value, sub }: { icon: typeof PackageX; label: string; value: string; sub: string }) {
  return (
    <Card className="px-4 py-3.5">
      <div className="flex items-center gap-2 text-text-tertiary"><Icon className="size-4" /><span className="text-xs font-medium uppercase tracking-wide">{label}</span></div>
      <p className="mt-1.5 text-xl font-semibold text-text-primary">{value}</p>
      <p className="text-xs text-text-tertiary">{sub}</p>
    </Card>
  );
}

function RecordLossModal({ open, onClose, warehouses, products }: { open: boolean; onClose: () => void; warehouses: Array<{ id: string; name: string }>; products: Array<{ id: string; name: string }> }) {
  const [state, formAction, isPending] = useActionState(recordLossAction, initialLossActionState);
  const { push } = useToast();
  useEffect(() => { if (state.success) { push("Loss recorded"); onClose(); } /* eslint-disable-next-line */ }, [state.success]);
  return (
    <Modal open={open} onClose={onClose} title="Record loss">
      <form action={formAction} className="flex flex-col gap-4">
        <FormField label="Product" htmlFor="lc-product"><Select id="lc-product" name="productId"><option value="">Select product…</option>{products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</Select></FormField>
        <FormField label="Warehouse" htmlFor="lc-wh"><Select id="lc-wh" name="warehouseId"><option value="">Select warehouse…</option>{warehouses.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}</Select></FormField>
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Quantity" htmlFor="lc-qty" required><Input id="lc-qty" name="quantity" type="number" step="0.01" min="0" required /></FormField>
          <FormField label="Unit cost" htmlFor="lc-cost"><Input id="lc-cost" name="unitCost" type="number" step="0.01" min="0" defaultValue="0" /></FormField>
        </div>
        <FormField label="Reason" htmlFor="lc-reason"><Select id="lc-reason" name="reason" defaultValue="expired"><option value="expired">Expired</option><option value="damaged">Damaged</option><option value="discarded">Discarded</option><option value="theft">Theft</option><option value="other">Other</option></Select></FormField>
        <FormField label="Notes" htmlFor="lc-notes"><Input id="lc-notes" name="notes" placeholder="Optional details" /></FormField>
        {state.error && <p className="text-sm text-danger-600">{state.error}</p>}
        <div className="flex justify-end gap-2 pt-2"><Button type="button" variant="secondary" onClick={onClose}>Cancel</Button><Button type="submit" loading={isPending}>Record</Button></div>
      </form>
    </Modal>
  );
}
