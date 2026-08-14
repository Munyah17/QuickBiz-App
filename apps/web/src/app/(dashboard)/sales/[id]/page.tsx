import { notFound } from "next/navigation";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardHeader } from "@/components/Card";
import { Badge } from "@/components/Badge";
import { requireOrgContext, requireModuleEnabled } from "@/lib/session";
import { getInvoiceDetail } from "@/services/sales";
import { RecordPaymentModal } from "./RecordPaymentModal";

const statusTone: Record<string, "success" | "info" | "warning" | "danger" | "neutral"> = {
  draft: "neutral",
  issued: "info",
  paid: "success",
  cancelled: "danger",
};

export default async function InvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, orgId, permissions } = await requireOrgContext();
  await requireModuleEnabled(supabase, orgId, "sales");

  const invoice = await getInvoiceDetail(supabase, orgId, id);
  if (!invoice) notFound();

  const balanceDue = invoice.total - invoice.amount_paid;
  const canManage = permissions.has("sales.manage");

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        module="Sales"
        title={invoice.invoice_number}
        action={
          canManage && balanceDue > 0 && invoice.status !== "cancelled" ? (
            <RecordPaymentModal invoiceId={invoice.id} balanceDue={balanceDue} />
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
            <CardHeader title="Payments" />
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
                      <td className="px-4 py-2.5 capitalize text-text-secondary">{p.method.replace("_", " ")}</td>
                      <td className="px-4 py-2.5 text-text-secondary">{p.reference || "No reference"}</td>
                      <td className="px-4 py-2.5 text-text-secondary">${p.amount.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Card>
        </div>

        <Card className="flex flex-col gap-3 p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-text-secondary">Status</span>
            <Badge tone={statusTone[invoice.status] ?? "neutral"}>{invoice.status}</Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-text-secondary">Customer</span>
            <span className="text-sm text-text-primary">{invoice.customerName ?? "Walk-in"}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-text-secondary">Branch</span>
            <span className="text-sm text-text-primary">{invoice.branchName ?? "No branch"}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-text-secondary">Balance due</span>
            <span className="text-sm font-semibold text-text-primary">${balanceDue.toFixed(2)}</span>
          </div>
          {invoice.notes && (
            <div className="border-t border-border-subtle pt-3">
              <p className="text-sm font-medium text-text-secondary">Notes</p>
              <p className="text-sm text-text-primary">{invoice.notes}</p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
