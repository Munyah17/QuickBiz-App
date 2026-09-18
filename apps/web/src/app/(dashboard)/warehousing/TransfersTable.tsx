"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeftRight, Truck, PackageCheck, Ban, Plus } from "lucide-react";
import { Card } from "@/components/Card";
import { Badge } from "@/components/Badge";
import { Button } from "@/components/Button";
import { EmptyState } from "@/components/EmptyState";
import { SearchInput } from "@/components/SearchInput";
import { Select } from "@/components/Input";
import { ExportButton } from "@/components/ExportButton";
import { useToast } from "@/components/Toast";
import { NewTransferModal } from "./NewTransferModal";
import {
  dispatchTransferAction,
  receiveTransferAction,
  cancelTransferAction,
  initialWarehousingActionState,
} from "./actions";
import type { TransferListRow, TransferStatus } from "@/services/warehousing";
import type { WarehouseRow } from "@/services/warehousing";
import type { ProductWithStock } from "@/services/products";

const statusTone: Record<TransferStatus, "info" | "warning" | "success" | "neutral"> = {
  pending: "info",
  in_transit: "warning",
  received: "success",
  cancelled: "neutral",
};

const statusLabel: Record<TransferStatus, string> = {
  pending: "Pending",
  in_transit: "In transit",
  received: "Received",
  cancelled: "Cancelled",
};

function TransitionButton({
  transferId,
  action,
  label,
  icon: Icon,
  title,
}: {
  transferId: string;
  action: typeof dispatchTransferAction;
  label: string;
  icon: typeof Truck;
  title: string;
}) {
  const [state, formAction, isPending] = useActionState(action, initialWarehousingActionState);
  const { push } = useToast();

  useEffect(() => {
    if (state.success) push(`${label} — transfer updated`);
    if (state.error) push(state.error, "error");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.success, state.error]);

  return (
    <form action={formAction}>
      <input type="hidden" name="transferId" value={transferId} />
      <button
        type="submit"
        disabled={isPending}
        title={title}
        className="inline-flex items-center gap-1 text-sm font-medium text-primary-600 hover:underline disabled:opacity-50"
      >
        <Icon className="size-4" />
        {label}
      </button>
    </form>
  );
}

export function TransfersTable({
  transfers,
  warehouses,
  products,
  canTransfer,
}: {
  transfers: TransferListRow[];
  warehouses: WarehouseRow[];
  products: ProductWithStock[];
  canTransfer: boolean;
}) {
  const [modalOpen, setModalOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return transfers.filter((t) => {
      if (statusFilter !== "all" && t.status !== statusFilter) return false;
      if (!q) return true;
      return [t.transfer_number, t.fromName, t.toName].some((f) => f?.toLowerCase().includes(q));
    });
  }, [transfers, query, statusFilter]);

  return (
    <Card>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border-subtle px-4 py-3">
        <h3 className="text-sm font-semibold text-text-primary">
          {filtered.length} of {transfers.length} transfers
        </h3>
        <div className="flex items-center gap-2">
          <SearchInput value={query} onChange={setQuery} placeholder="Search transfers..." />
          <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-36">
            <option value="all">All statuses</option>
            <option value="pending">Pending</option>
            <option value="in_transit">In transit</option>
            <option value="received">Received</option>
            <option value="cancelled">Cancelled</option>
          </Select>
          <ExportButton
            filename="stock-transfers"
            rows={filtered.map((t) => ({
              Transfer: t.transfer_number,
              From: t.fromName,
              To: t.toName,
              Status: t.status,
              Lines: t.lineCount,
              Units: t.totalQuantity,
              Date: t.transfer_date,
            }))}
          />
          {canTransfer && (
            <Button size="sm" onClick={() => setModalOpen(true)}>
              <Plus className="size-4" />
              New Transfer
            </Button>
          )}
        </div>
      </div>

      {transfers.length === 0 ? (
        <EmptyState
          icon={ArrowLeftRight}
          title="No transfers yet"
          description="Move stock between warehouses with a dispatch/receive audit trail."
        />
      ) : filtered.length === 0 ? (
        <EmptyState icon={ArrowLeftRight} title="No transfers match your search" />
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border-subtle text-left text-xs font-medium uppercase tracking-wide text-text-tertiary">
              <th className="px-4 py-2.5">Transfer</th>
              <th className="px-4 py-2.5">From → To</th>
              <th className="px-4 py-2.5">Status</th>
              <th className="px-4 py-2.5">Units</th>
              <th className="px-4 py-2.5">Date</th>
              {canTransfer && <th className="px-4 py-2.5" />}
            </tr>
          </thead>
          <tbody>
            {filtered.map((t) => (
              <tr key={t.id} className="border-b border-border-subtle last:border-b-0">
                <td className="px-4 py-2.5">
                  <Link
                    href={`/warehousing/transfers/${t.id}`}
                    target="_blank"
                    className="font-medium text-primary-600 hover:underline"
                  >
                    {t.transfer_number}
                  </Link>
                </td>
                <td className="px-4 py-2.5 text-text-secondary">
                  {t.fromName} <span className="text-text-tertiary">→</span> {t.toName}
                </td>
                <td className="px-4 py-2.5">
                  <Badge tone={statusTone[t.status] ?? "neutral"}>{statusLabel[t.status] ?? t.status}</Badge>
                </td>
                <td className="px-4 py-2.5 text-text-secondary">
                  {t.totalQuantity} unit{t.totalQuantity === 1 ? "" : "s"} · {t.lineCount} line{t.lineCount === 1 ? "" : "s"}
                </td>
                <td className="px-4 py-2.5 text-text-secondary">{new Date(t.transfer_date).toLocaleDateString()}</td>
                {canTransfer && (
                  <td className="px-4 py-2.5">
                    <div className="flex items-center justify-end gap-3">
                      {t.status === "pending" && (
                        <>
                          <TransitionButton
                            transferId={t.id}
                            action={dispatchTransferAction}
                            label="Dispatch"
                            icon={Truck}
                            title="Stock out of source warehouse"
                          />
                          <TransitionButton
                            transferId={t.id}
                            action={cancelTransferAction}
                            label="Cancel"
                            icon={Ban}
                            title="Cancel this transfer"
                          />
                        </>
                      )}
                      {t.status === "in_transit" && (
                        <TransitionButton
                          transferId={t.id}
                          action={receiveTransferAction}
                          label="Receive"
                          icon={PackageCheck}
                          title="Stock into destination warehouse"
                        />
                      )}
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {modalOpen && (
        <NewTransferModal warehouses={warehouses} products={products} onClose={() => setModalOpen(false)} />
      )}
    </Card>
  );
}
