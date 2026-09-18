import { notFound } from "next/navigation";
import Link from "next/link";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardHeader } from "@/components/Card";
import { Badge } from "@/components/Badge";
import { StatCard } from "@/components/StatCard";
import { requireOrgContext, requireModuleEnabled } from "@/lib/session";
import { getSupplierDetail } from "@/services/purchasing";
import { paymentMethodLabel } from "@/config/paymentMethods";

const statusTone: Record<string, "success" | "info" | "warning" | "danger" | "neutral"> = {
  draft: "neutral",
  issued: "info",
  received: "success",
  cancelled: "danger",
};

export default async function SupplierDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, orgId } = await requireOrgContext();
  await requireModuleEnabled(supabase, orgId, "purchasing");

  const supplier = await getSupplierDetail(supabase, orgId, id);
  if (!supplier) notFound();

  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader module="Suppliers" title={supplier.name} />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total spend" value={`$${supplier.totalSpend.toLocaleString()}`} tone="primary" />
        <StatCard label="Paid to date" value={`$${supplier.totalPaid.toLocaleString()}`} tone="success" />
        <StatCard label="Balance owed" value={`$${supplier.openBalance.toLocaleString()}`} tone="info" />
        <StatCard
          label="Late orders"
          value={supplier.lateOrders.toString()}
          tone={supplier.lateOrders > 0 ? "warning" : "success"}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          <Card>
            <CardHeader title="Purchase orders" />
            {supplier.purchaseOrders.length === 0 ? (
              <p className="p-4 text-sm text-text-secondary">No purchase orders for this supplier yet.</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border-subtle text-left text-xs font-medium uppercase tracking-wide text-text-tertiary">
                    <th className="px-4 py-2.5">PO</th>
                    <th className="px-4 py-2.5">Status</th>
                    <th className="px-4 py-2.5">Expected</th>
                    <th className="px-4 py-2.5">Total</th>
                    <th className="px-4 py-2.5">Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {supplier.purchaseOrders.map((po) => {
                    const balance = po.total - po.amount_paid;
                    const late =
                      po.status === "issued" && po.expected_date !== null && po.expected_date < today;
                    return (
                      <tr key={po.id} className="border-b border-border-subtle last:border-b-0">
                        <td className="px-4 py-2.5">
                          <Link href={`/purchasing/${po.id}`} className="font-medium text-primary-600 hover:underline">
                            {po.po_number}
                          </Link>
                        </td>
                        <td className="px-4 py-2.5">
                          <Badge tone={late ? "danger" : (statusTone[po.status] ?? "neutral")}>
                            {late ? "Late" : po.status}
                          </Badge>
                        </td>
                        <td className="px-4 py-2.5 text-text-secondary">
                          {po.expected_date ? new Date(po.expected_date).toLocaleDateString() : "—"}
                        </td>
                        <td className="px-4 py-2.5 text-text-secondary">${po.total.toFixed(2)}</td>
                        <td className="px-4 py-2.5 text-text-secondary">${balance.toFixed(2)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </Card>

          <Card>
            <CardHeader title="Recent payments" />
            {supplier.recentPayments.length === 0 ? (
              <p className="p-4 text-sm text-text-secondary">No payments recorded.</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border-subtle text-left text-xs font-medium uppercase tracking-wide text-text-tertiary">
                    <th className="px-4 py-2.5">Date</th>
                    <th className="px-4 py-2.5">PO</th>
                    <th className="px-4 py-2.5">Method</th>
                    <th className="px-4 py-2.5">Reference</th>
                    <th className="px-4 py-2.5">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {supplier.recentPayments.map((p) => (
                    <tr key={p.id} className="border-b border-border-subtle last:border-b-0">
                      <td className="px-4 py-2.5 text-text-secondary">{new Date(p.paid_at).toLocaleDateString()}</td>
                      <td className="px-4 py-2.5 text-text-secondary">{p.po_number}</td>
                      <td className="px-4 py-2.5 text-text-secondary">{paymentMethodLabel(p.method)}</td>
                      <td className="px-4 py-2.5 text-text-secondary">{p.reference || "—"}</td>
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
            <Badge tone={supplier.is_active ? "success" : "neutral"}>
              {supplier.is_active ? "Active" : "Inactive"}
            </Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-text-secondary">Email</span>
            <span className="text-sm text-text-primary">{supplier.email || "—"}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-text-secondary">Phone</span>
            <span className="text-sm text-text-primary">{supplier.phone || "—"}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-text-secondary">Tax number</span>
            <span className="text-sm text-text-primary">{supplier.tax_number || "—"}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-text-secondary">Location</span>
            <span className="text-sm text-text-primary">
              {[supplier.address?.city, supplier.address?.country].filter(Boolean).join(", ") || "—"}
            </span>
          </div>
        </Card>
      </div>
    </div>
  );
}
