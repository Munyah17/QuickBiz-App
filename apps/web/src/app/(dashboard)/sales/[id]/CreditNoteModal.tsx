"use client";

import { useActionState, useEffect, useState } from "react";
import { RotateCcw } from "lucide-react";
import { Modal } from "@/components/Modal";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { FormField } from "@/components/FormField";
import { useToast } from "@/components/Toast";
import { createCreditNoteAction, initialSalesActionState } from "../actions";

interface CreditableItem {
  product_id: string | null;
  description: string;
  quantity: number;
  unit_price: number;
}

function CreditNoteForm({
  invoiceId,
  items,
  onClose,
}: {
  invoiceId: string;
  items: CreditableItem[];
  onClose: () => void;
}) {
  const [state, formAction, isPending] = useActionState(createCreditNoteAction, initialSalesActionState);
  const [quantities, setQuantities] = useState<Record<number, number>>({});
  const [restock, setRestock] = useState(true);
  const { push } = useToast();

  useEffect(() => {
    if (state.success) {
      push("Credit note created");
      onClose();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.success]);

  const selectedItems = items
    .map((item, idx) => ({ item, qty: quantities[idx] ?? 0 }))
    .filter((s) => s.qty > 0)
    .map((s) => ({
      product_id: s.item.product_id ?? "",
      description: s.item.description,
      quantity: s.qty,
      unit_price: s.item.unit_price,
    }));

  const creditTotal = selectedItems.reduce((sum, i) => sum + i.quantity * i.unit_price, 0);

  return (
    <Modal open onClose={onClose} title="New credit note">
      <form action={formAction} className="flex flex-col gap-4">
        <input type="hidden" name="invoiceId" value={invoiceId} />
        <input type="hidden" name="items" value={JSON.stringify(selectedItems)} />

        <p className="text-sm text-text-secondary">
          Credit returned or corrected items. Enter the quantity to credit per line — the note can then be
          applied against the invoice balance.
        </p>

        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border-subtle text-left text-xs font-medium uppercase tracking-wide text-text-tertiary">
              <th className="py-2 pr-2">Item</th>
              <th className="py-2 pr-2">Sold</th>
              <th className="py-2 pr-2">Price</th>
              <th className="w-24 py-2">Credit qty</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, idx) => (
              <tr key={idx} className="border-b border-border-subtle last:border-b-0">
                <td className="py-2 pr-2 text-text-primary">{item.description}</td>
                <td className="py-2 pr-2 text-text-secondary">{item.quantity}</td>
                <td className="py-2 pr-2 text-text-secondary">${item.unit_price.toFixed(2)}</td>
                <td className="py-2">
                  <Input
                    type="number"
                    min="0"
                    max={item.quantity}
                    step="0.01"
                    value={quantities[idx] ?? 0}
                    onChange={(e) =>
                      setQuantities((prev) => ({
                        ...prev,
                        [idx]: Math.min(item.quantity, Math.max(0, Number(e.target.value))),
                      }))
                    }
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <FormField label="Reason" htmlFor="reason" hint="Optional">
          <Input id="reason" name="reason" placeholder="e.g. Damaged goods returned" />
        </FormField>

        <label className="flex items-center gap-2 text-sm text-text-secondary">
          <input
            type="checkbox"
            name="restock"
            checked={restock}
            onChange={(e) => setRestock(e.target.checked)}
            className="size-4 rounded border-border"
          />
          Return credited items to stock
        </label>

        <div className="flex items-center justify-between border-t border-border-subtle pt-3 text-sm">
          <span className="font-medium text-text-secondary">Credit total</span>
          <span className="font-semibold text-text-primary">${creditTotal.toFixed(2)}</span>
        </div>

        {state.error && <p className="text-sm text-danger-600">{state.error}</p>}

        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={isPending} disabled={selectedItems.length === 0}>
            Create credit note
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export function CreditNoteModal({
  invoiceId,
  items,
  disabled,
}: {
  invoiceId: string;
  items: CreditableItem[];
  disabled: boolean;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button variant="secondary" disabled={disabled} onClick={() => setOpen(true)}>
        <RotateCcw className="size-4" />
        Credit note
      </Button>
      {open && <CreditNoteForm invoiceId={invoiceId} items={items} onClose={() => setOpen(false)} />}
    </>
  );
}
