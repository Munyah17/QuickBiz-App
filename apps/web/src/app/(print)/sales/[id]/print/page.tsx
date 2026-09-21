import { notFound } from "next/navigation";
import Link from "next/link";
import { requireOrgContext } from "@/lib/session";
import { getInvoiceDetail } from "@/services/sales";
import { paymentMethodLabel } from "@/config/paymentMethods";
import { getDocumentBranding, Letterhead, DocumentFooter } from "@/components/print/DocumentBranding";
import { PrintButton } from "./PrintButton";

const statusLabel: Record<string, string> = {
  draft: "DRAFT",
  issued: "ISSUED",
  partially_paid: "PART PAID",
  paid: "PAID",
  cancelled: "CANCELLED",
};

const termsLabel: Record<string, string> = {
  due_on_receipt: "Due on receipt",
  net_7: "Net 7",
  net_14: "Net 14",
  net_30: "Net 30",
  net_60: "Net 60",
  net_90: "Net 90",
};

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-slate-500">{label}</span>
      <span className="text-right font-medium text-slate-800">{value}</span>
    </div>
  );
}

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
  const { supabase, orgId, orgName, themeColor } = await requireOrgContext();

  const invoice = await getInvoiceDetail(supabase, orgId, id);
  if (!invoice) notFound();

  const branding = await getDocumentBranding(supabase, orgId);
  const balanceDue = invoice.total - invoice.amount_paid;
  const docTitle = pickingSlip
    ? "Picking Slip"
    : invoice.doc_type === "quote"
      ? "Quotation"
      : invoice.doc_type === "debit_note"
        ? "Debit Note"
        : invoice.doc_type === "boq"
          ? "Bill of Quantities"
          : "Tax Invoice";
  const accent = themeColor || "#1e293b";

  return (
    <div className="mx-auto max-w-[210mm] bg-white p-8 print:p-0">
      <div className="mb-6 flex items-center justify-between print:hidden">
        <Link href={`/sales/${invoice.id}`} className="text-sm text-slate-500 hover:underline">
          Back to invoice
        </Link>
        <PrintButton />
      </div>

      <div className="border border-slate-200 p-10 print:border-0 print:p-0">
        {/* ---- Letterhead ---- */}
        <div className="flex items-start justify-between pb-6" style={{ borderBottom: `3px solid ${accent}` }}>
          <div>
            <Letterhead orgName={orgName} branding={branding} accent={accent} />
            <p className="mt-2 text-sm font-medium uppercase tracking-widest text-slate-500">{docTitle}</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-semibold text-slate-900">{invoice.invoice_number}</p>
            <p
              className="mt-2 inline-block rounded px-2.5 py-1 text-xs font-bold tracking-widest text-white"
              style={{ backgroundColor: accent }}
            >
              {invoice.doc_type === "quote"
                ? "QUOTATION"
                : invoice.doc_type === "debit_note"
                  ? "DEBIT NOTE"
                  : invoice.doc_type === "boq"
                    ? "BOQ"
                    : (statusLabel[invoice.status] ?? invoice.status.toUpperCase())}
            </p>
          </div>
        </div>

        {/* ---- Parties + meta ---- */}
        <div className="mt-6 grid grid-cols-2 gap-8 text-sm">
          <div className="space-y-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Bill to</p>
              {invoice.billing_address ? (
                <p className="mt-1 whitespace-pre-line font-medium text-slate-800">{invoice.billing_address}</p>
              ) : (
                <p className="mt-1 font-medium text-slate-800">{invoice.customerName ?? "Walk-in customer"}</p>
              )}
            </div>
            {invoice.delivery_address && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Deliver to</p>
                <p className="mt-1 whitespace-pre-line text-slate-700">{invoice.delivery_address}</p>
              </div>
            )}
          </div>
          <div className="space-y-1.5">
            <MetaRow
              label={invoice.doc_type === "quote" ? "Date" : "Invoice date"}
              value={new Date(invoice.invoice_date).toLocaleDateString()}
            />
            <MetaRow
              label={invoice.doc_type === "quote" ? "Valid until" : "Due date"}
              value={
                invoice.due_date
                  ? new Date(invoice.due_date).toLocaleDateString()
                  : invoice.doc_type === "quote"
                    ? "No expiry"
                    : "On receipt"
              }
            />
            {invoice.payment_terms && (
              <MetaRow label="Payment terms" value={termsLabel[invoice.payment_terms] ?? invoice.payment_terms.replace(/_/g, " ")} />
            )}
            {invoice.reference && <MetaRow label="PO / reference" value={invoice.reference} />}
            {invoice.salesperson && <MetaRow label="Salesperson" value={invoice.salesperson} />}
            <MetaRow label="Branch" value={invoice.branchName ?? "—"} />
            <MetaRow label="Currency" value={invoice.currency} />
          </div>
        </div>

        {/* ---- Line items ---- */}
        <table className="mt-8 w-full text-sm">
          <thead>
            <tr
              className="text-left text-xs font-semibold uppercase tracking-wide text-white"
              style={{ backgroundColor: accent }}
            >
              <th className="px-3 py-2.5">Item</th>
              <th className="px-3 py-2.5 text-right">Qty</th>
              {pickingSlip ? (
                <th className="px-3 py-2.5 text-right">Picked</th>
              ) : (
                <>
                  <th className="px-3 py-2.5 text-right">Unit price</th>
                  <th className="px-3 py-2.5 text-right">Discount</th>
                  <th className="px-3 py-2.5 text-right">Tax</th>
                  <th className="px-3 py-2.5 text-right">Amount</th>
                </>
              )}
            </tr>
          </thead>
          <tbody>
            {invoice.items.map((item, idx) => (
              <tr key={item.id} className={idx % 2 === 0 ? "bg-slate-50" : "bg-white"}>
                <td className="px-3 py-2.5">
                  <p className="font-medium text-slate-800">{item.description}</p>
                  {item.sku && <p className="font-mono text-[11px] text-slate-400">{item.sku}</p>}
                </td>
                <td className="px-3 py-2.5 text-right text-slate-700">
                  {item.quantity}
                  {item.unit ? ` ${item.unit}` : ""}
                </td>
                {pickingSlip ? (
                  <td className="px-3 py-2.5 text-right text-slate-400">☐</td>
                ) : (
                  <>
                    <td className="px-3 py-2.5 text-right text-slate-700">${item.unit_price.toFixed(2)}</td>
                    <td className="px-3 py-2.5 text-right text-slate-700">
                      {item.discount > 0 ? `-$${item.discount.toFixed(2)}` : "—"}
                    </td>
                    <td className="px-3 py-2.5 text-right text-slate-700">
                      {item.tax_rate != null ? `${item.tax_rate}%` : "—"}
                    </td>
                    <td className="px-3 py-2.5 text-right font-medium text-slate-800">${item.line_total.toFixed(2)}</td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>

        {/* ---- Totals / signatures ---- */}
        {pickingSlip ? (
          <div className="mt-16 grid grid-cols-2 gap-16 text-sm">
            <div className="border-t border-slate-400 pt-2">
              <p className="text-xs text-slate-400">Picked by</p>
            </div>
            <div className="border-t border-slate-400 pt-2">
              <p className="text-xs text-slate-400">Checked by</p>
            </div>
          </div>
        ) : (
          <div className="mt-6 flex justify-end">
            <div className="w-72 text-sm">
              <div className="flex justify-between py-1 text-slate-600">
                <span>Subtotal</span>
                <span>${invoice.subtotal.toFixed(2)}</span>
              </div>
              {invoice.discount_total > 0 && (
                <div className="flex justify-between py-1 text-slate-600">
                  <span>Discount{invoice.discount_reason ? ` (${invoice.discount_reason})` : ""}</span>
                  <span>-${invoice.discount_total.toFixed(2)}</span>
                </div>
              )}
              {invoice.shipping_total > 0 && (
                <div className="flex justify-between py-1 text-slate-600">
                  <span>Shipping</span>
                  <span>${invoice.shipping_total.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between py-1 text-slate-600">
                <span>Tax</span>
                <span>${invoice.tax_total.toFixed(2)}</span>
              </div>
              <div
                className="mt-1 flex justify-between px-3 py-2 text-base font-bold text-white"
                style={{ backgroundColor: accent }}
              >
                <span>Total</span>
                <span>${invoice.total.toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-1 text-slate-600">
                <span>Paid</span>
                <span>${invoice.amount_paid.toFixed(2)}</span>
              </div>
              <div className="flex justify-between border-t-2 border-slate-800 py-1.5 font-bold text-slate-900">
                <span>Balance due</span>
                <span>${balanceDue.toFixed(2)}</span>
              </div>
            </div>
          </div>
        )}

        {/* ---- Payments received ---- */}
        {!pickingSlip && invoice.payments.length > 0 && (
          <div className="mt-8">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Payments received</p>
            <table className="mt-2 w-full text-sm">
              <tbody>
                {invoice.payments.map((p) => (
                  <tr key={p.id} className="border-b border-slate-100">
                    <td className="py-2 text-slate-600">{new Date(p.paid_at).toLocaleDateString()}</td>
                    <td className="py-2 text-slate-600">{paymentMethodLabel(p.method)}</td>
                    <td className="py-2 text-slate-600">{p.reference ?? ""}</td>
                    <td className="py-2 text-right text-slate-700">${p.amount.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ---- Notes / terms ---- */}
        {invoice.notes && (
          <div className="mt-8">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              {invoice.doc_type === "quote" ? "Terms & notes" : "Notes"}
            </p>
            <p className="mt-1 whitespace-pre-line text-sm text-slate-600">{invoice.notes}</p>
          </div>
        )}

        <DocumentFooter branding={branding} orgName={orgName} docRef={invoice.invoice_number} currency={invoice.currency} />
      </div>
    </div>
  );
}
