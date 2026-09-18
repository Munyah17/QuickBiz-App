import { notFound } from "next/navigation";
import Link from "next/link";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardHeader } from "@/components/Card";
import { Badge } from "@/components/Badge";
import { requireOrgContext, requireModuleEnabled } from "@/lib/session";
import { getInvoiceDetail, isOverdue } from "@/services/sales";
import { paymentMethodLabel } from "@/config/paymentMethods";
import { RecordPaymentModal } from "./RecordPaymentModal";
import { InvoiceActions } from "./InvoiceActions";
import { CreditNoteModal } from "./CreditNoteModal";
import { ApplyCreditNoteButton } from "./ApplyCreditNoteButton";

const statusTone: Record<string, "success" | "info" | "warning" | "danger" | "neutral"> = {
  draft: "neutral",
  issued: "info",
  partially_paid: "warning",
  paid: "success",
  cancelled: "danger",
};

const statusLabel: Record<string, string> = {
  draft: "Draft",
  issued: "Issued",
  partially_paid: "Part paid",
  paid: "Paid",
  cancelled: "Cancelled",
};

const creditNoteTone: Record<string, "success" | "info" | "neutral"> = {
  issued: "info",
  applied: "success",
  cancelled: "neutral",
};

export default async function InvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, orgId, permissions } = await requireOrgContext();
  await requireModuleEnabled(supabase, orgId, "sales");

  const invoice = await getInvoiceDetail(supabase, orgId, id);
  if (!invoice) notFound();

  const balanceDue = invoice.total - invoice.amount_paid;
  const canManage = permissions.has("sales.manage");
  const overdue = isOverdue(invoice);
  const canCredit = invoice.status === "issued" || invoice.status === "partially_paid" || invoice.status === "paid";

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        module="Sales"
        title={invoice.invoice_number}
        action={
          canManage ? (
            <div className="flex flex-wrap items-center gap-2">
              {balanceDue > 0 && invoice.status !== "cancelled" && invoice.status !== "draft" && (
                <RecordPaymentModal invoiceId={invoice.id} balanceDue={balanceDue} />
              )}
              <CreditNoteModal
                invoiceId={invoice.id}
                items={invoice.items.map((i) => ({
                  product_id: i.product_id,
                  description: i.description,
                  quantity: i.quantity,
                  unit_price: i.unit_price,
                }))}
                disabled={!canCredit}
              />
              <InvoiceActions
                invoiceId={invoice.id}
                status={invoice.status}
                docType={invoice.doc_type}
                amountPaid={invoice.amount_paid}
              />
            </div>
          ) : undefined
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          <Card>
            <CardHeader title="Line items" />
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border-subtle text-left text-xs font-medium uppercase tracking-wide text-text-tertiary">
                  <th className="px-4 py-2.5">Description</th>
                  <th className="px-4 py-2.5">Qty</th>
                  <th className="px-4 py-2.5">Unit price</th>
                  <th className="px-4 py-2.5">Line total</th>
                </tr>
              </thead>
              <tbody>
                {invoice.items.map((item) => (
                  <tr key={item.id} className="border-b border-border-subtle last:border-b-0">
                    <td className="px-4 py-2.5 text-text-primary">{item.description}</td>
                    <td className="px-4 py-2.5 text-text-secondary">{item.quantity}</td>
                    <td className="px-4 py-2.5 text-text-secondary">${item.unit_price.toFixed(2)}</td>
                    <td className="px-4 py-2.5 text-text-secondary">${item.line_total.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="ml-auto flex w-64 flex-col gap-1 border-t border-border-subtle p-4 text-sm">
              <div className="flex justify-between text-text-secondary">
                <span>Subtotal</span>
                <span>${invoice.subtotal.toFixed(2)}</span>
              </div>
              {invoice.discount_total > 0 && (
                <div className="flex justify-between text-text-secondary">
                  <span>Discount{invoice.discount_reason ? ` (${invoice.discount_reason})` : ""}</span>
                  <span>-${invoice.discount_total.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-text-secondary">
                <span>Tax</span>
                <span>${invoice.tax_total.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-semibold text-text-primary">
                <span>Total</span>
                <span>${invoice.total.toFixed(2)}</span>
              </div>
            </div>
          </Card>

          <Card>
            <CardHeader title="Payments & credits" />
            {invoice.payments.length === 0 ? (
              <p className="p-4 text-sm text-text-secondary">No payments recorded yet.</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border-subtle text-left text-xs font-medium uppercase tracking-wide text-text-tertiary">
                    <th className="px-4 py-2.5">Date</th>
                    <th className="px-4 py-2.5">Method</th>
                    <th className="px-4 py-2.5">Reference</th>
                    <th className="px-4 py-2.5">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.payments.map((p) => (
                    <tr key={p.id} className="border-b border-border-subtle last:border-b-0">
                      <td className="px-4 py-2.5 text-text-secondary">{new Date(p.paid_at).toLocaleDateString()}</td>
                      <td className="px-4 py-2.5 text-text-secondary">{paymentMethodLabel(p.method)}</td>
                      <td className="px-4 py-2.5 text-text-secondary">{p.reference || "No reference"}</td>
                      <td className="px-4 py-2.5 text-text-secondary">${p.amount.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Card>

          {invoice.creditNotes.length > 0 && (
            <Card>
              <CardHeader title="Credit notes" />
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border-subtle text-left text-xs font-medium uppercase tracking-wide text-text-tertiary">
                    <th className="px-4 py-2.5">Credit note</th>
                    <th className="px-4 py-2.5">Status</th>
                    <th className="px-4 py-2.5">Reason</th>
                    <th className="px-4 py-2.5">Amount</th>
                    {canManage && <th className="px-4 py-2.5" />}
                  </tr>
                </thead>
                <tbody>
                  {invoice.creditNotes.map((cn) => (
                    <tr key={cn.id} className="border-b border-border-subtle last:border-b-0">
                      <td className="px-4 py-2.5">
                        <Link
                          href={`/sales/${invoice.id}/credit/${cn.id}`}
                          target="_blank"
                          className="font-medium text-primary-600 hover:underline"
                        >
                          {cn.credit_note_number}
                        </Link>
                      </td>
                      <td className="px-4 py-2.5">
                        <Badge tone={creditNoteTone[cn.status] ?? "neutral"}>{cn.status}</Badge>
                      </td>
                      <td className="px-4 py-2.5 text-text-secondary">{cn.reason || "—"}</td>
                      <td className="px-4 py-2.5 text-text-secondary">${cn.subtotal.toFixed(2)}</td>
                      {canManage && (
                        <td className="px-4 py-2.5 text-right">
                          {cn.status === "issued" && balanceDue > 0 && (
                            <ApplyCreditNoteButton creditNoteId={cn.id} invoiceId={invoice.id} />
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          )}
        </div>

        <Card className="flex flex-col gap-3 p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-text-secondary">Status</span>
            <div className="flex items-center gap-1.5">
              {invoice.doc_type === "quote" && <Badge tone="info">Quotation</Badge>}
              <Badge tone={overdue ? "danger" : (statusTone[invoice.status] ?? "neutral")}>
                {overdue ? "Overdue" : (statusLabel[invoice.status] ?? invoice.status)}
              </Badge>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-text-secondary">Customer</span>
            {invoice.customerId ? (
              <Link href={`/customers/${invoice.customerId}`} className="text-sm font-medium text-primary-600 hover:underline">
                {invoice.customerName}
              </Link>
            ) : (
              <span className="text-sm text-text-primary">Walk-in</span>
            )}
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-text-secondary">Branch</span>
            <span className="text-sm text-text-primary">{invoice.branchName ?? "No branch"}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-text-secondary">Issued</span>
            <span className="text-sm text-text-primary">
              {invoice.issued_at ? new Date(invoice.issued_at).toLocaleDateString() : "Not issued yet"}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-text-secondary">Due date</span>
            <span className={`text-sm ${overdue ? "font-medium text-danger-600" : "text-text-primary"}`}>
              {invoice.due_date ? new Date(invoice.due_date).toLocaleDateString() : "Not set"}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-text-secondary">Balance due</span>
            <span className="text-sm font-semibold text-text-primary">${balanceDue.toFixed(2)}</span>
          </div>
          {invoice.notes && (
            <div className="border-t border-border-subtle pt-3">
              <p className="text-sm font-medium text-text-secondary">Notes</p>
              <p className="whitespace-pre-line text-sm text-text-primary">{invoice.notes}</p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
