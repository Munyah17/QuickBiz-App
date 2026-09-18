import { notFound } from "next/navigation";
import Link from "next/link";
import { requireOrgContext } from "@/lib/session";
import { getInvoiceDetail } from "@/services/sales";
import { getOrgSettings } from "@/services/org";
import { paymentMethodLabel } from "@/config/paymentMethods";
import { PrintButton } from "./PrintButton";

const statusLabel: Record<string, string> = {
  draft: "DRAFT",
  issued: "ISSUED",
  partially_paid: "PART PAID",
  paid: "PAID",
  cancelled: "CANCELLED",
};

export default async function InvoicePrintPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ doc?: string }>;
}) {
  const { id } = await params;
  const { doc } = await searchParams;
  const pickingSlip = doc === "picking";
  const { supabase, orgId, orgName } = await requireOrgContext();

  const invoice = await getInvoiceDetail(supabase, orgId, id);
  if (!invoice) notFound();

  const settings = await getOrgSettings(supabase, orgId);
  const footerNote = typeof settings["invoice.footer"] === "string" ? (settings["invoice.footer"] as string) : null;
  const balanceDue = invoice.total - invoice.amount_paid;

  return (
    <div className="mx-auto max-w-3xl p-8 print:p-0">
      <div className="mb-6 flex items-center justify-between print:hidden">
        <Link href={`/sales/${invoice.id}`} className="text-sm text-slate-500 hover:underline">
          Back to invoice
        </Link>
        <PrintButton />
      </div>

      <div className="border border-slate-200 p-8">
        <div className="flex items-start justify-between border-b-2 border-slate-800 pb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{orgName}</h1>
            <p className="mt-1 text-sm text-slate-500">
              {pickingSlip ? "Picking Slip" : invoice.doc_type === "quote" ? "Quotation" : "Tax Invoice"}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xl font-semibold text-slate-900">{invoice.invoice_number}</p>
            <p className="mt-1 inline-block rounded border border-slate-300 px-2 py-0.5 text-xs font-semibold tracking-wide text-slate-600">
              {invoice.doc_type === "quote" ? "QUOTATION" : (statusLabel[invoice.status] ?? invoice.status.toUpperCase())}
            </p>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-6 text-sm">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Bill to</p>
            <p className="mt-1 font-medium text-slate-900">{invoice.customerName ?? "Walk-in customer"}</p>
          </div>
          <div className="text-right">
            <div className="flex justify-between">
              <span className="text-slate-500">{invoice.doc_type === "quote" ? "Date" : "Issued"}</span>
              <span className="font-medium">
                {invoice.issued_at
                  ? new Date(invoice.issued_at).toLocaleDateString()
                  : new Date(invoice.created_at).toLocaleDateString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">{invoice.doc_type === "quote" ? "Valid until" : "Due"}</span>
              <span className="font-medium">
                {invoice.due_date
                  ? new Date(invoice.due_date).toLocaleDateString()
                  : invoice.doc_type === "quote"
                    ? "No expiry"
                    : "On receipt"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Branch</span>
              <span className="font-medium">{invoice.branchName ?? "—"}</span>
            </div>
          </div>
        </div>

        <table className="mt-8 w-full text-sm">
          <thead>
            <tr className="border-b border-slate-800 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              <th className="py-2">Description</th>
              <th className="py-2 text-right">Qty</th>
              {pickingSlip ? (
                <th className="py-2 text-right">Picked</th>
              ) : (
                <>
                  <th className="py-2 text-right">Unit price</th>
                  <th className="py-2 text-right">Amount</th>
                </>
              )}
            </tr>
          </thead>
          <tbody>
            {invoice.items.map((item) => (
              <tr key={item.id} className="border-b border-slate-100">
                <td className="py-2.5">{item.description}</td>
                <td className="py-2.5 text-right">{item.quantity}</td>
                {pickingSlip ? (
                  <td className="py-2.5 text-right text-slate-400">☐</td>
                ) : (
                  <>
                    <td className="py-2.5 text-right">${item.unit_price.toFixed(2)}</td>
                    <td className="py-2.5 text-right">${item.line_total.toFixed(2)}</td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>

        {pickingSlip ? (
          <div className="mt-12 grid grid-cols-2 gap-12 text-sm">
            <div className="border-t border-slate-300 pt-2">
              <p className="text-xs text-slate-400">Picked by</p>
            </div>
            <div className="border-t border-slate-300 pt-2">
              <p className="text-xs text-slate-400">Checked by</p>
            </div>
          </div>
        ) : (
          <div className="mt-4 flex justify-end">
            <div className="w-64 text-sm">
              <div className="flex justify-between py-1 text-slate-600">
                <span>Subtotal</span>
                <span>${invoice.subtotal.toFixed(2)}</span>
              </div>
              {invoice.discount_total > 0 && (
                <div className="flex justify-between py-1 text-slate-600">
                  <span>Discount</span>
                  <span>-${invoice.discount_total.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between py-1 text-slate-600">
                <span>Tax</span>
                <span>${invoice.tax_total.toFixed(2)}</span>
              </div>
              <div className="flex justify-between border-t border-slate-800 py-1.5 text-base font-semibold">
                <span>Total</span>
                <span>${invoice.total.toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-1 text-slate-600">
                <span>Paid</span>
                <span>${invoice.amount_paid.toFixed(2)}</span>
              </div>
              <div className="flex justify-between border-t border-slate-200 py-1.5 font-semibold">
                <span>Balance due</span>
                <span>${balanceDue.toFixed(2)}</span>
              </div>
            </div>
          </div>
        )}

        {invoice.payments.length > 0 && (
          <div className="mt-8">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Payments received</p>
            <table className="mt-2 w-full text-sm">
              <tbody>
                {invoice.payments.map((p) => (
                  <tr key={p.id} className="border-b border-slate-100">
                    <td className="py-2">{new Date(p.paid_at).toLocaleDateString()}</td>
                    <td className="py-2">{paymentMethodLabel(p.method)}</td>
                    <td className="py-2">{p.reference ?? ""}</td>
                    <td className="py-2 text-right">${p.amount.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {invoice.notes && (
          <div className="mt-8">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Notes</p>
            <p className="mt-1 whitespace-pre-line text-sm text-slate-600">{invoice.notes}</p>
          </div>
        )}

        {footerNote && <p className="mt-8 text-center text-xs italic text-slate-500">{footerNote}</p>}

        <p className="mt-10 border-t border-slate-200 pt-4 text-center text-xs text-slate-400">
          Generated by {orgName} · {invoice.currency}
        </p>
      </div>
    </div>
  );
}
