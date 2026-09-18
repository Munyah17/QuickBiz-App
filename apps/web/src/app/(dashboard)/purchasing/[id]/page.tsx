import { notFound } from "next/navigation";
import Link from "next/link";
import { Printer } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/Button";
import { Card, CardHeader } from "@/components/Card";
import { Badge } from "@/components/Badge";
import { requireOrgContext, requireModuleEnabled } from "@/lib/session";
import { getPurchaseOrderDetail } from "@/services/purchasing";
import { ReceiveGoodsButton } from "./ReceiveGoodsButton";
import { RecordPurchasePaymentModal } from "./RecordPurchasePaymentModal";

const statusTone: Record<string, "success" | "info" | "warning" | "danger" | "neutral"> = {
  draft: "neutral",
  issued: "info",
  received: "success",
  cancelled: "danger",
};

export default async function PurchaseOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, orgId, permissions } = await requireOrgContext();
  await requireModuleEnabled(supabase, orgId, "purchasing");

  const po = await getPurchaseOrderDetail(supabase, orgId, id);
  if (!po) notFound();

  const { data: member } = await supabase.from("org_members").select("branch_id").eq("status", "active").limit(1).maybeSingle();
  const { data: warehouse } = member?.branch_id
    ? await supabase.from("warehouses").select("id").eq("branch_id", member.branch_id as string).single()
    : { data: null };

  const balanceDue = po.total - po.amount_paid;
  const canManage = permissions.has("purchasing.manage");

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        module="Purchasing"
        title={po.po_number}
        action={
          <div className="flex gap-2">
            <Link href={`/purchasing/${po.id}/print`} target="_blank">
              <Button variant="secondary">
                <Printer className="size-4" />
                Print
              </Button>
            </Link>
            {canManage && po.status === "issued" && warehouse && (
              <ReceiveGoodsButton poId={po.id} warehouseId={warehouse.id} />
            )}
            {canManage && balanceDue > 0 && po.status !== "cancelled" && (
              <RecordPurchasePaymentModal poId={po.id} balanceDue={balanceDue} />
            )}
          </div>
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
                  <th className="px-4 py-2.5">Unit cost</th>
                  <th className="px-4 py-2.5">Line total</th>
                </tr>
              </thead>
              <tbody>
                {po.items.map((item) => (
                  <tr key={item.id} className="border-b border-border-subtle last:border-b-0">
                    <td className="px-4 py-2.5 text-text-primary">{item.description}</td>
                    <td className="px-4 py-2.5 text-text-secondary">{item.quantity}</td>
                    <td className="px-4 py-2.5 text-text-secondary">${item.unit_cost.toFixed(2)}</td>
                    <td className="px-4 py-2.5 text-text-secondary">${item.line_total.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="ml-auto flex w-64 flex-col gap-1 border-t border-border-subtle p-4 text-sm">
              <div className="flex justify-between text-text-secondary">
                <span>Subtotal</span>
                <span>${po.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-text-secondary">
                <span>Tax</span>
                <span>${po.tax_total.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-semibold text-text-primary">
                <span>Total</span>
                <span>${po.total.toFixed(2)}</span>
              </div>
            </div>
          </Card>

          <Card>
            <CardHeader title="Payments" />
            {po.payments.length === 0 ? (
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
                  {po.payments.map((p) => (
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
            <Badge tone={statusTone[po.status] ?? "neutral"}>{po.status}</Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-text-secondary">Supplier</span>
            <span className="text-sm text-text-primary">{po.supplierName ?? "No supplier"}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-text-secondary">Branch</span>
            <span className="text-sm text-text-primary">{po.branchName ?? "No branch"}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-text-secondary">Expected</span>
            <span className="text-sm text-text-primary">
              {po.expected_date ? new Date(po.expected_date).toLocaleDateString() : "Not set"}
            </span>
          </div>
          {po.status === "issued" && po.expected_date && po.expected_date < new Date().toISOString().slice(0, 10) && (
            <div className="rounded-md bg-danger-50 px-3 py-2 text-xs font-medium text-danger-600">
              Expected delivery date has passed — this order is late.
            </div>
          )}
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-text-secondary">Balance due</span>
            <span className="text-sm font-semibold text-text-primary">${balanceDue.toFixed(2)}</span>
          </div>
          {po.notes && (
            <div className="border-t border-border-subtle pt-3">
              <p className="text-sm font-medium text-text-secondary">Notes</p>
              <p className="text-sm text-text-primary">{po.notes}</p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
