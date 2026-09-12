"use client";

import { useState } from "react";
import { ClipboardCheck, Plus } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardHeader } from "@/components/Card";
import { Badge } from "@/components/Badge";
import { Button } from "@/components/Button";
import { Input, Select } from "@/components/Input";
import { FormField } from "@/components/FormField";
import { EmptyState } from "@/components/EmptyState";
import { Modal } from "@/components/Modal";
import { useDemo, type DemoStockTake } from "@/lib/demo/DemoContext";
import { useToast } from "@/components/Toast";

const STATUS_TONE: Record<DemoStockTake["status"], "neutral" | "success" | "warning" | "danger" | "info"> = {
  planned: "neutral",
  in_progress: "warning",
  completed: "success",
  under_review: "info",
  cancelled: "danger",
};

const COUNT_TYPES: DemoStockTake["countType"][] = ["full", "partial", "cycle", "spot"];

function NewStockTakeModal({ onClose }: { onClose: () => void }) {
  const { startStockTake } = useDemo();
  const { push } = useToast();
  const [title, setTitle] = useState("");
  const [branchName, setBranchName] = useState("");
  const [countType, setCountType] = useState<DemoStockTake["countType"]>("full");

  return (
    <Modal open onClose={onClose} title="New Stock Take">
      <form
        className="flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          startStockTake({ title: title.trim(), branchName: branchName.trim(), countType });
          push("Stock take started");
          onClose();
        }}
      >
        <FormField label="Title" htmlFor="title">
          <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} required />
        </FormField>
        <FormField label="Branch / Warehouse" htmlFor="branchName">
          <Input id="branchName" value={branchName} onChange={(e) => setBranchName(e.target.value)} required />
        </FormField>
        <FormField label="Count Type" htmlFor="countType">
          <Select id="countType" value={countType} onChange={(e) => setCountType(e.target.value as DemoStockTake["countType"])}>
            {COUNT_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </Select>
        </FormField>

        <p className="text-sm text-text-tertiary">
          Starting a stock take immediately loads a count line for every product at its current system quantity.
        </p>

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit">Start Stock Take</Button>
        </div>
      </form>
    </Modal>
  );
}

function CountEntryModal({ stockTake, onClose }: { stockTake: DemoStockTake; onClose: () => void }) {
  const { stockTakeLines, recordStockTakeCount, completeStockTake } = useDemo();
  const { push } = useToast();
  const lines = stockTakeLines.filter((l) => l.stockTakeId === stockTake.id);
  const canCount = stockTake.status === "in_progress";

  return (
    <Modal open onClose={onClose} title={`Count Entry - ${stockTake.stockTakeNumber}`}>
      <div className="flex flex-col gap-4">
        {lines.length === 0 ? (
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
                    <td className="px-2 py-2 font-medium text-text-primary">{l.productName}</td>
                    <td className="px-2 py-2 text-text-secondary">{l.systemQuantity}</td>
                    <td className="px-2 py-2">
                      {canCount ? (
                        <Input
                          type="number"
                          step="0.001"
                          className="h-8 w-20"
                          defaultValue={l.countedQuantity ?? ""}
                          onBlur={(e) => {
                            if (e.target.value === "") return;
                            recordStockTakeCount(l.id, Number(e.target.value));
                          }}
                        />
                      ) : (
                        (l.countedQuantity ?? "-")
                      )}
                    </td>
                    <td className="px-2 py-2 text-text-secondary">{l.variance ?? "-"}</td>
                    <td className="px-2 py-2">
                      <Badge tone={l.countStatus === "discrepancy" ? "danger" : l.countStatus === "verified" ? "success" : "neutral"}>
                        {l.countStatus}
                      </Badge>
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
          {canCount && (
            <Button
              onClick={() => {
                completeStockTake(stockTake.id);
                push("Stock take completed");
                onClose();
              }}
            >
              Complete
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
}

export default function DemoStockTakePage() {
  const { stockTakes } = useDemo();
  const [newOpen, setNewOpen] = useState(false);
  const [viewStockTake, setViewStockTake] = useState<DemoStockTake | null>(null);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <PageHeader module="Operations" title="Stock Take" />
        <Button onClick={() => setNewOpen(true)}>
          <Plus className="size-4" />
          New Stock Take
        </Button>
      </div>

      <p className="text-sm text-text-tertiary">
        Run periodic physical inventory counts, record counted quantities against system quantities, and resolve variances.
      </p>

      <Card>
        {stockTakes.length === 0 ? (
          <EmptyState icon={ClipboardCheck} title="No stock takes yet" description="Start a stock take to count and reconcile inventory." />
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border-subtle text-left text-xs font-medium uppercase tracking-wide text-text-tertiary">
                <th className="px-4 py-2.5">Reference</th>
                <th className="px-4 py-2.5">Title</th>
                <th className="px-4 py-2.5">Branch</th>
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
                  <td className="px-4 py-2.5 text-text-secondary">{s.branchName}</td>
                  <td className="px-4 py-2.5 text-text-secondary">{s.countType}</td>
                  <td className="px-4 py-2.5">
                    <Badge tone={STATUS_TONE[s.status]}>{s.status.replace("_", " ")}</Badge>
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
      </Card>

      {newOpen && <NewStockTakeModal onClose={() => setNewOpen(false)} />}
      {viewStockTake && <CountEntryModal stockTake={viewStockTake} onClose={() => setViewStockTake(null)} />}
    </div>
  );
}
