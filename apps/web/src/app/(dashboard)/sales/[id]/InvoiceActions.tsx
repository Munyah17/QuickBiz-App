"use client";

import { useActionState, useEffect, useState } from "react";
import Link from "next/link";
import { Printer, Send, Ban, Copy, Pencil } from "lucide-react";
import { Button } from "@/components/Button";
import { Modal } from "@/components/Modal";
import { Input } from "@/components/Input";
import { FormField } from "@/components/FormField";
import { useToast } from "@/components/Toast";
import { issueInvoiceAction, voidInvoiceAction, duplicateInvoiceAction, convertQuoteAction, initialSalesActionState } from "../actions";
import type { InvoiceStatus, SalesDocType } from "@/services/sales";

function ConvertQuoteButton({ invoiceId }: { invoiceId: string }) {
  const [state, formAction, isPending] = useActionState(convertQuoteAction, initialSalesActionState);
  const { push } = useToast();

  useEffect(() => {
    if (state.success) push("Quotation converted to invoice");
    if (state.error) push(state.error, "error");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.success, state.error]);

  return (
    <form action={formAction}>
      <input type="hidden" name="invoiceId" value={invoiceId} />
      <Button type="submit" loading={isPending}>
        <Send className="size-4" />
        Convert to invoice
      </Button>
    </form>
  );
}

function IssueButton({ invoiceId }: { invoiceId: string }) {
  const [state, formAction, isPending] = useActionState(issueInvoiceAction, initialSalesActionState);
  const { push } = useToast();

  useEffect(() => {
    if (state.success) push("Invoice issued");
    if (state.error) push(state.error, "error");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.success, state.error]);

  return (
    <form action={formAction}>
      <input type="hidden" name="invoiceId" value={invoiceId} />
      <Button type="submit" loading={isPending}>
        <Send className="size-4" />
        Issue invoice
      </Button>
    </form>
  );
}

function VoidInvoiceForm({ invoiceId, onClose }: { invoiceId: string; onClose: () => void }) {
  const [state, formAction, isPending] = useActionState(voidInvoiceAction, initialSalesActionState);
  const { push } = useToast();

  useEffect(() => {
    if (state.success) {
      push("Invoice voided");
      onClose();
    }
    if (state.error) push(state.error, "error");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.success, state.error]);

  return (
    <Modal open onClose={onClose} title="Void invoice">
      <form action={formAction} className="flex flex-col gap-4">
        <input type="hidden" name="invoiceId" value={invoiceId} />
        <p className="text-sm text-text-secondary">
          Voiding cancels the invoice and returns its items to stock. The record stays for the audit trail —
          it cannot be deleted.
        </p>
        <FormField label="Reason" htmlFor="reason" hint="Optional, recorded on the invoice">
          <Input id="reason" name="reason" placeholder="e.g. Duplicate entry, customer cancelled" />
        </FormField>
        {state.error && <p className="text-sm text-danger-600">{state.error}</p>}
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Keep invoice
          </Button>
          <Button type="submit" loading={isPending}>
            Void invoice
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function DuplicateButton({ invoiceId }: { invoiceId: string }) {
  const [state, formAction, isPending] = useActionState(duplicateInvoiceAction, initialSalesActionState);
  const { push } = useToast();

  useEffect(() => {
    if (state.error) push(state.error, "error");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.error]);

  return (
    <form action={formAction}>
      <input type="hidden" name="invoiceId" value={invoiceId} />
      <Button type="submit" variant="secondary" loading={isPending}>
        <Copy className="size-4" />
        Duplicate
      </Button>
    </form>
  );
}

function VoidButton({ invoiceId, disabled }: { invoiceId: string; disabled: boolean }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button variant="secondary" disabled={disabled} onClick={() => setOpen(true)}>
        <Ban className="size-4" />
        Void
      </Button>
      {open && <VoidInvoiceForm invoiceId={invoiceId} onClose={() => setOpen(false)} />}
    </>
  );
}

export function InvoiceActions({
  invoiceId,
  status,
  docType,
  amountPaid,
}: {
  invoiceId: string;
  status: InvoiceStatus;
  docType: SalesDocType;
  amountPaid: number;
}) {
  const canVoid = status === "draft" || status === "issued" || status === "partially_paid";

  return (
    <div className="flex flex-wrap items-center gap-2">
      {docType === "quote" ? (
        <ConvertQuoteButton invoiceId={invoiceId} />
      ) : (
        status === "draft" && <IssueButton invoiceId={invoiceId} />
      )}
      {status === "draft" && (
        <Link href={`/sales/${invoiceId}/edit`}>
          <Button variant="secondary">
            <Pencil className="size-4" />
            {docType === "quote" ? "Edit quotation" : "Edit draft"}
          </Button>
        </Link>
      )}
      <Link href={`/sales/${invoiceId}/print`} target="_blank">
        <Button variant="secondary">
          <Printer className="size-4" />
          Print
        </Button>
      </Link>
      {docType === "invoice" && (
        <Link href={`/sales/${invoiceId}/print?doc=picking`} target="_blank">
          <Button variant="secondary">
            <Printer className="size-4" />
            Picking slip
          </Button>
        </Link>
      )}
      <DuplicateButton invoiceId={invoiceId} />
      <VoidButton invoiceId={invoiceId} disabled={!canVoid || amountPaid > 0} />
    </div>
  );
}
