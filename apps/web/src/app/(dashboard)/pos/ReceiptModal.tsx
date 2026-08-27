"use client";

import { Printer } from "lucide-react";
import { Modal } from "@/components/Modal";
import { Button } from "@/components/Button";
import { paymentMethodLabel } from "@/config/paymentMethods";
import type { InvoiceDetail } from "@/services/sales";

export function ReceiptModal({
  receipt,
  orgName,
  cashierName,
  onClose,
}: {
  receipt: InvoiceDetail;
  orgName: string;
  cashierName: string;
  onClose: () => void;
}) {
  const changeDue = receipt.amount_paid > receipt.total ? receipt.amount_paid - receipt.total : 0;
  const lastPayment = receipt.payments[receipt.payments.length - 1];

  return (
    <Modal open onClose={onClose} title="Receipt">
      <div id="pos-receipt" className="flex flex-col gap-3 font-mono text-sm">
        <div className="text-center">
          <p className="text-base font-bold">{orgName}</p>
          <p className="text-xs text-text-tertiary">Sales Receipt</p>
        </div>

        <div className="border-t border-dashed border-border-subtle pt-2 text-xs">
          <div className="flex justify-between">
            <span>Receipt #</span>
            <span>{receipt.invoice_number}</span>
          </div>
          <div className="flex justify-between">
            <span>Date</span>
            <span>{new Date(receipt.created_at).toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span>Cashier</span>
            <span>{cashierName}</span>
          </div>
          <div className="flex justify-between">
            <span>Branch</span>
            <span>{receipt.branchName ?? "Not specified"}</span>
          </div>
          <div className="flex justify-between">
            <span>Customer</span>
            <span>{receipt.customerName ?? "Walk-in"}</span>
          </div>
        </div>

        <div className="border-t border-dashed border-border-subtle pt-2">
          {receipt.items.map((item) => (
            <div key={item.id} className="flex justify-between gap-2 py-0.5">
              <span className="flex-1 truncate">
                {item.quantity} x {item.description}
              </span>
              <span>${item.line_total.toFixed(2)}</span>
            </div>
          ))}
        </div>

        <div className="border-t border-dashed border-border-subtle pt-2">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span>${receipt.subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span>Tax</span>
            <span>${receipt.tax_total.toFixed(2)}</span>
          </div>
          <div className="flex justify-between font-bold">
            <span>Total</span>
            <span>${receipt.total.toFixed(2)}</span>
          </div>
        </div>

        <div className="border-t border-dashed border-border-subtle pt-2 text-xs">
          <div className="flex justify-between">
            <span>Paid via</span>
            <span>{lastPayment ? paymentMethodLabel(lastPayment.method) : "Not recorded"}</span>
          </div>
          <div className="flex justify-between">
            <span>Amount tendered</span>
            <span>${receipt.amount_paid.toFixed(2)}</span>
          </div>
          {changeDue > 0 && (
            <div className="flex justify-between font-semibold">
              <span>Change</span>
              <span>${changeDue.toFixed(2)}</span>
            </div>
          )}
        </div>

        <p className="border-t border-dashed border-border-subtle pt-2 text-center text-xs text-text-tertiary">
          Thank you for your business
        </p>
      </div>

      <div className="mt-4 flex justify-end gap-2 print:hidden">
        <Button type="button" variant="secondary" onClick={onClose}>
          Close
        </Button>
        <Button type="button" onClick={() => window.print()}>
          <Printer className="size-4" />
          Print
        </Button>
      </div>
    </Modal>
  );
}
