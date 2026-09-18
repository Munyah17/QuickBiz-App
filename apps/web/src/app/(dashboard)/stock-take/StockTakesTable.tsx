"use client";

import { useEffect, useState } from "react";
import { ClipboardCheck } from "lucide-react";
import { Card } from "@/components/Card";
import { Badge } from "@/components/Badge";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { EmptyState } from "@/components/EmptyState";
import { Modal } from "@/components/Modal";
import { useToast } from "@/components/Toast";
import {
  listStockTakeLinesAction,
  recordStockTakeCountAction,
  completeStockTakeAction,
  approveStockTakeAction,
} from "./actions";
import type { StockTakeRow, StockTakeLineRow } from "@/services/stockTake";

const STATUS_TONE: Record<string, "neutral" | "success" | "warning" | "danger" | "info"> = {
  planned: "neutral",
  in_progress: "warning",
  completed: "success",
  under_review: "info",
  cancelled: "danger",
};

const COUNT_STATUS_TONE: Record<string, "neutral" | "success" | "warning" | "danger"> = {
  pending: "neutral",
  counted: "warning",
  verified: "success",
  discrepancy: "danger",
};

function CountEntryModal({
  stockTake,
  canExecute,
  canApprove,
  onClose,
  onChanged,
}: {
  stockTake: StockTakeRow;
  canExecute: boolean;
  canApprove: boolean;
  onClose: () => void;
  onChanged: () => void;
}) {
  const [lines, setLines] = useState<StockTakeLineRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [inputs, setInputs] = useState<Record<string, string>>({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const { push } = useToast();

  function reload() {
    setLoading(true);
    listStockTakeLinesAction(stockTake.id)
      .then(setLines)
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    // Initial load: loading is already true — fetch without a
    // synchronous setState so this stays a pure external sync.
    listStockTakeLinesAction(stockTake.id)
      .then(setLines)
      .finally(() => setLoading(false));
  }, [stockTake.id]);

  async function saveCount(lineId: string) {
    const raw = inputs[lineId];
    if (raw === undefined || raw === "") return;
    const value = Number(raw);
    if (Number.isNaN(value)) return;

    setSavingId(lineId);
    try {
      await recordStockTakeCountAction(lineId, value);
      reload();
    } catch (err) {
      push((err as Error).message);
    } finally {
      setSavingId(null);
    }
  }

  async function handleComplete() {
    setBusy(true);
    try {
      await completeStockTakeAction(stockTake.id);
      push("Stock take completed");
      onChanged();
    } catch (err) {
      push((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function handleApprove() {
    setBusy(true);
    try {
      await approveStockTakeAction(stockTake.id);
      push("Stock take approved and adjustments recorded");
      onChanged();
      onClose();
    } catch (err) {
      push((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const canCount = canExecute && stockTake.status === "in_progress";

  return (
    <Modal open onClose={onClose} title={`Count Entry - ${stockTake.stockTakeNumber}`}>
      <div className="flex flex-col gap-4">
        {loading ? (
          <p className="text-sm text-text-tertiary">Loading count lines...</p>
        ) : lines.length === 0 ? (
          <p className="text-sm text-text-tertiary">No count lines on this stock take.</p>
        ) : (
          <div className="max-h-96 overflow-y-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border-subtle text-left text-xs font-medium uppercase tracking-wide text-text-tertiary">
                  <th className="px-2 py-2">Product</th>
                  <th className="px-2 py-2">System</th>
                  <th className="px-2 py-2">Counted</th>
                  <th className="px-2 py-2">Variance</th>
                  <th className="px-2 py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {lines.map((l) => (
                  <tr key={l.id} className="border-b border-border-subtle last:border-b-0">
                    <td className="px-2 py-2 font-medium text-text-primary">
                      {l.productName}
                      {l.skuCode && <span className="block text-xs font-normal text-text-tertiary">{l.skuCode}</span>}
                    </td>
                    <td className="px-2 py-2 text-text-secondary">{l.systemQuantity}</td>
                    <td className="px-2 py-2">
                      {canCount ? (
                        <div className="flex items-center gap-1">
                          <Input
                            type="number"
                            step="0.001"
                            className="h-8 w-20"
                            defaultValue={l.countedQuantity ?? ""}
                            onChange={(e) => setInputs((s) => ({ ...s, [l.id]: e.target.value }))}
                          />
                          <Button
                            variant="secondary"
                            size="sm"
                            loading={savingId === l.id}
                            onClick={() => saveCount(l.id)}
                          >
                            Save
                          </Button>
                        </div>
                      ) : (
                        (l.countedQuantity ?? "-")
                      )}
                    </td>
                    <td className="px-2 py-2 text-text-secondary">{l.variance ?? "-"}</td>
                    <td className="px-2 py-2">
                      <Badge tone={COUNT_STATUS_TONE[l.countStatus] ?? "neutral"}>{l.countStatus}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Close
          </Button>
          {canExecute && stockTake.status === "in_progress" && (
            <Button loading={busy} onClick={handleComplete}>
              Complete
            </Button>
          )}
          {canApprove && stockTake.status === "completed" && (
            <Button loading={busy} onClick={handleApprove}>
              Approve
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
}

export function StockTakesTable({
  stockTakes,
  canExecute,
  canApprove,
}: {
  stockTakes: StockTakeRow[];
  canExecute: boolean;
  canApprove: boolean;
}) {
  const [viewStockTake, setViewStockTake] = useState<StockTakeRow | null>(null);

  return (
    <Card>
      {stockTakes.length === 0 ? (
        <EmptyState icon={ClipboardCheck} title="No stock takes yet" description="Start a stock take to count and reconcile inventory." />
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border-subtle text-left text-xs font-medium uppercase tracking-wide text-text-tertiary">
              <th className="px-4 py-2.5">Reference</th>
              <th className="px-4 py-2.5">Title</th>
              <th className="px-4 py-2.5">Scheduled</th>
              <th className="px-4 py-2.5">Type</th>
              <th className="px-4 py-2.5">Status</th>
              <th className="px-4 py-2.5">Variance Value</th>
              <th className="px-4 py-2.5" />
            </tr>
          </thead>
          <tbody>
            {stockTakes.map((s) => (
              <tr key={s.id} className="border-b border-border-subtle last:border-b-0">
                <td className="px-4 py-2.5 font-medium text-text-primary">{s.stockTakeNumber}</td>
                <td className="px-4 py-2.5 text-text-secondary">{s.title}</td>
                <td className="px-4 py-2.5 text-text-secondary">{new Date(s.scheduledDate).toLocaleDateString()}</td>
                <td className="px-4 py-2.5 text-text-secondary">{s.countType}</td>
                <td className="px-4 py-2.5">
                  <Badge tone={STATUS_TONE[s.status] ?? "neutral"}>{s.status.replace("_", " ")}</Badge>
                </td>
                <td className="px-4 py-2.5 text-text-secondary">
                  {s.totalVarianceValue != null ? s.totalVarianceValue.toFixed(2) : "-"}
                </td>
                <td className="px-4 py-2.5">
                  <Button variant="secondary" size="sm" onClick={() => setViewStockTake(s)}>
                    Count Entry
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {viewStockTake && (
        <CountEntryModal
          stockTake={viewStockTake}
          canExecute={canExecute}
          canApprove={canApprove}
          onClose={() => setViewStockTake(null)}
          onChanged={() => setViewStockTake(null)}
        />
      )}
    </Card>
  );
}
