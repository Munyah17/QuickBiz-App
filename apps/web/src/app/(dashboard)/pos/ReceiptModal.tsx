"use client";

import { useState } from "react";
import { Printer } from "lucide-react";
import { Modal } from "@/components/Modal";
import { Button } from "@/components/Button";
import { useToast } from "@/components/Toast";
import { paymentMethodLabel } from "@/config/paymentMethods";
import { printReceipt } from "@/lib/printing/printer";
import type { ReceiptData } from "@/lib/printing/receipt";
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
  const { push } = useToast();
  const [printing, setPrinting] = useState(false);

  // Routes through the configured print method — thermal printer (USB/BLE/
  // rawBT) when one is set up, system print dialog otherwise.
  async function handlePrint() {
    setPrinting(true);
    const data: ReceiptData = {
      orgName,
      title: "Sales Receipt",
      receiptNumber: receipt.invoice_number,
      date: new Date(receipt.created_at).toLocaleString(),
      cashier: cashierName,
      branch: receipt.branchName ?? undefined,
      customer: receipt.customerName ?? "Walk-in",
      lines: receipt.items.map((i) => ({
        description: i.description,
        quantity: i.quantity,
        lineTotal: i.line_total,
      })),
      subtotal: receipt.subtotal,
      discount:
        receipt.discount_total > 0
          ? { amount: receipt.discount_total, reason: receipt.discount_reason ?? undefined }
          : undefined,
      tax: receipt.tax_total > 0 ? { label: "Tax", amount: receipt.tax_total } : undefined,
      total: receipt.total,
      payments: receipt.payments.map((p) => ({ label: paymentMethodLabel(p.method), amount: p.amount })),
      amountTendered: receipt.amount_paid,
      changeDue: changeDue > 0 ? changeDue : undefined,
      barcode: receipt.invoice_number,
    };
    const result = await printReceipt(data);
    setPrinting(false);
    if (result.ok) {
      push(`Receipt sent via ${result.via}`);
    } else {
      push(result.error ?? "Print failed", "error");
    }
  }

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
          {receipt.discount_total > 0 && (
            <div className="flex justify-between">
              <span>Discount{receipt.discount_reason ? ` (${receipt.discount_reason})` : ""}</span>
              <span>-${receipt.discount_total.toFixed(2)}</span>
            </div>
          )}
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
          {receipt.payments.map((p) => (
            <div key={p.id} className="flex justify-between">
              <span>{paymentMethodLabel(p.method)}</span>
              <span>${p.amount.toFixed(2)}</span>
            </div>
          ))}
          {receipt.payments.length === 0 && (
            <div className="flex justify-between">
              <span>Paid via</span>
              <span>Not recorded</span>
            </div>
          )}
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
        <Button type="button" onClick={handlePrint} loading={printing}>
          <Printer className="size-4" />
          Print
        </Button>
      </div>
    </Modal>
  );
}
