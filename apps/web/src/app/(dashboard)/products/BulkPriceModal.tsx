"use client";

import { useState, useTransition } from "react";
import { Modal } from "@/components/Modal";
import { Button } from "@/components/Button";
import { Input, Select } from "@/components/Input";
import { FormField } from "@/components/FormField";
import { useToast } from "@/components/Toast";
import { bulkUpdatePricesAction } from "./actions";

export function BulkPriceModal({
  productIds,
  onClose,
  onDone,
}: {
  productIds: string[];
  onClose: () => void;
  onDone: () => void;
}) {
  const [mode, setMode] = useState<"percent" | "fixed">("percent");
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const { push } = useToast();

  function submit() {
    const num = Number(value);
    if (!Number.isFinite(num) || value.trim() === "") {
      setError("Enter a number — e.g. 10 for +10% or a new price.");
      return;
    }
    startTransition(async () => {
      const result = await bulkUpdatePricesAction(productIds, mode, num);
      if (result.success) {
        push(`Updated prices on ${productIds.length} product${productIds.length === 1 ? "" : "s"}`);
        onDone();
        onClose();
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <Modal open onClose={onClose} title={`Update prices — ${productIds.length} product${productIds.length === 1 ? "" : "s"}`}>
      <div className="flex flex-col gap-4">
        <FormField label="How should prices change?" htmlFor="mode">
          <Select id="mode" value={mode} onChange={(e) => setMode(e.target.value as "percent" | "fixed")}>
            <option value="percent">Adjust by percentage</option>
            <option value="fixed">Set a fixed price</option>
          </Select>
        </FormField>
        <FormField
          label={mode === "percent" ? "Percentage change (%)" : "New selling price ($)"}
          htmlFor="value"
          hint={
            mode === "percent"
              ? "Positive or negative — e.g. 10 raises prices 10%, -5 lowers them 5%"
              : "Every selected product gets this exact price"
          }
        >
          <Input
            id="value"
            type="number"
            step="0.01"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={mode === "percent" ? "e.g. 10 or -5" : "e.g. 4.99"}
            autoFocus
          />
        </FormField>
        {error && <p className="text-sm text-danger-600">{error}</p>}
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="button" loading={isPending} onClick={submit}>
            Apply to {productIds.length} product{productIds.length === 1 ? "" : "s"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
