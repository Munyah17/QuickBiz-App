import { notFound } from "next/navigation";
import Link from "next/link";
import { requireOrgContext } from "@/lib/session";
import { getPurchaseOrderDetail } from "@/services/purchasing";
import { getDocumentBranding, Letterhead, DocumentFooter } from "@/components/print/DocumentBranding";
import { PrintButton } from "@/app/(print)/sales/[id]/print/PrintButton";

const statusLabel: Record<string, string> = {
  draft: "DRAFT",
  issued: "ISSUED",
  received: "RECEIVED",
  cancelled: "CANCELLED",
};

export default async function PurchaseOrderPrintPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, orgId, orgName, themeColor } = await requireOrgContext();

  const po = await getPurchaseOrderDetail(supabase, orgId, id);
  if (!po) notFound();

  const branding = await getDocumentBranding(supabase, orgId);
  const accent = themeColor || "#1e293b";

  return (
    <div className="mx-auto max-w-3xl p-8 print:p-0">
      <div className="mb-6 flex items-center justify-between print:hidden">
        <Link href={`/purchasing/${po.id}`} className="text-sm text-slate-500 hover:underline">
          Back to purchase order
        </Link>
        <PrintButton />
      </div>

      <div className="border border-slate-200 p-8 print:border-0 print:p-0">
        <div className="flex items-start justify-between pb-6" style={{ borderBottom: `3px solid ${accent}` }}>
          <div>
            <Letterhead orgName={orgName} branding={branding} accent={accent} />
            <p className="mt-2 text-sm font-medium uppercase tracking-widest text-slate-500">Purchase Order</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-semibold text-slate-900">{po.po_number}</p>
            <p
              className="mt-2 inline-block rounded px-2.5 py-1 text-xs font-bold tracking-widest text-white"
              style={{ backgroundColor: accent }}
            >
              {statusLabel[po.status] ?? po.status.toUpperCase()}
            </p>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-6 text-sm">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Supplier</p>
            <p className="mt-1 font-medium text-slate-900">{po.supplierName ?? "No supplier"}</p>
            <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-slate-400">Deliver to</p>
            <p className="mt-1 font-medium text-slate-900">{po.branchName ?? "—"}</p>
          </div>
          <div className="text-right">
            <div className="flex justify-between">
              <span className="text-slate-500">Created</span>
              <span className="font-medium">{new Date(po.created_at).toLocaleDateString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Expected</span>
              <span className="font-medium">
                {po.expected_date ? new Date(po.expected_date).toLocaleDateString() : "Not specified"}
              </span>
            </div>
            {po.received_at && (
              <div className="flex justify-between">
                <span className="text-slate-500">Received</span>
                <span className="font-medium">{new Date(po.received_at).toLocaleDateString()}</span>
              </div>
            )}
          </div>
        </div>

        <table className="mt-8 w-full text-sm">
          <thead>
            <tr
              className="text-left text-xs font-semibold uppercase tracking-wide text-white"
              style={{ backgroundColor: accent }}
            >
              <th className="px-3 py-2.5">Description</th>
              <th className="px-3 py-2.5 text-right">Qty</th>
              <th className="px-3 py-2.5 text-right">Unit cost</th>
              <th className="px-3 py-2.5 text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            {po.items.map((item) => (
              <tr key={item.id} className="border-b border-slate-100">
                <td className="px-3 py-2.5">{item.description}</td>
                <td className="px-3 py-2.5 text-right">{item.quantity}</td>
                <td className="px-3 py-2.5 text-right">${item.unit_cost.toFixed(2)}</td>
                <td className="px-3 py-2.5 text-right">${item.line_total.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-4 flex justify-end">
          <div className="w-64 text-sm">
            <div className="flex justify-between py-1 text-slate-600">
              <span>Subtotal</span>
              <span>${po.subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between py-1 text-slate-600">
              <span>Tax</span>
              <span>${po.tax_total.toFixed(2)}</span>
            </div>
            <div
              className="mt-1 flex justify-between px-3 py-2 text-base font-bold text-white"
              style={{ backgroundColor: accent }}
            >
              <span>Total</span>
              <span>${po.total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {po.notes && (
          <div className="mt-8">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Notes / terms</p>
            <p className="mt-1 whitespace-pre-line text-sm text-slate-600">{po.notes}</p>
          </div>
        )}

        <div className="mt-12 grid grid-cols-2 gap-12 text-sm">
          <div className="border-t border-slate-300 pt-2">
            <p className="text-xs text-slate-400">Authorised by ({orgName})</p>
          </div>
          <div className="border-t border-slate-300 pt-2">
            <p className="text-xs text-slate-400">Supplier signature</p>
          </div>
        </div>

        <DocumentFooter branding={branding} orgName={orgName} docRef={po.po_number} currency="USD" />
      </div>
    </div>
  );
}
