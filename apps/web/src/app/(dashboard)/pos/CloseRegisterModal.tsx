"use client";

import { useActionState, useState } from "react";
import { Modal } from "@/components/Modal";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { FormField } from "@/components/FormField";
import type { SessionSummary } from "@/services/pos";
import { closeSessionAction, initialPosActionState } from "./actions";

function CloseForm({ sessionId, summary, openingFloat, onClose }: { sessionId: string; summary: SessionSummary; openingFloat: number; onClose: () => void }) {
  const [state, formAction, isPending] = useActionState(closeSessionAction, initialPosActionState);
  const expectedCash = openingFloat + summary.cashSales;
  const [counted, setCounted] = useState(expectedCash);
  const variance = counted - expectedCash;

  return (
    <Modal open onClose={onClose} title="Close register">
      <form action={formAction} className="flex flex-col gap-4">
        <input type="hidden" name="sessionId" value={sessionId} />

        <div className="flex flex-col gap-1 rounded-md border border-border p-3 text-sm">
          <div className="flex justify-between text-text-secondary">
            <span>Invoices this session</span>
            <span>{summary.invoiceCount}</span>
          </div>
          <div className="flex justify-between text-text-secondary">
            <span>Total sales</span>
            <span>${summary.totalSales.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-text-secondary">
            <span>Cash sales</span>
            <span>${summary.cashSales.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-text-secondary">
            <span>Other payment methods</span>
            <span>${summary.otherSales.toFixed(2)}</span>
          </div>
          <div className="flex justify-between border-t border-border-subtle pt-1 font-semibold text-text-primary">
            <span>Expected cash in drawer</span>
            <span>${expectedCash.toFixed(2)}</span>
          </div>
        </div>

        <FormField label="Cash counted" htmlFor="closingFloat" required hint="Count the actual drawer and enter it here">
          <Input
            id="closingFloat"
            name="closingFloat"
            type="number"
            min="0"
            step="0.01"
            required
            value={counted}
            onChange={(e) => setCounted(Number(e.target.value))}
          />
        </FormField>

        {variance !== 0 && (
          <p className={`text-sm font-medium ${variance > 0 ? "text-success-600" : "text-danger-600"}`}>
            Drawer is ${Math.abs(variance).toFixed(2)} {variance > 0 ? "over" : "short"} — double-check the count before closing.
          </p>
        )}

        {state.error && <p className="text-sm text-danger-600">{state.error}</p>}

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={isPending} variant="danger">
            Close register
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export function CloseRegisterModal({ sessionId, summary, openingFloat }: { sessionId: string; summary: SessionSummary; openingFloat: number }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="secondary" onClick={() => setOpen(true)}>
        Close Register
      </Button>
      {open && <CloseForm sessionId={sessionId} summary={summary} openingFloat={openingFloat} onClose={() => setOpen(false)} />}
    </>
  );
}
