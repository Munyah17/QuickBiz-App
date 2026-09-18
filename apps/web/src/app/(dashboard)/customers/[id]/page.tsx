import { notFound } from "next/navigation";
import Link from "next/link";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardHeader } from "@/components/Card";
import { Badge } from "@/components/Badge";
import { StatCard } from "@/components/StatCard";
import { ExportButton } from "@/components/ExportButton";
import { Button } from "@/components/Button";
import { Printer } from "lucide-react";
import { requireOrgContext } from "@/lib/session";
import { getCustomerDetail } from "@/services/customers";
import { paymentMethodLabel } from "@/config/paymentMethods";

const statusTone: Record<string, "success" | "info" | "warning" | "danger" | "neutral"> = {
  draft: "neutral",
  issued: "info",
  partially_paid: "warning",
  paid: "success",
  cancelled: "danger",
};

export default async function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, orgId, permissions } = await requireOrgContext();
  void permissions;

  const customer = await getCustomerDetail(supabase, orgId, id);
  if (!customer) notFound();

  const today = new Date().toISOString().slice(0, 10);
  const creditUsedPct =
    customer.credit_limit && customer.credit_limit > 0
      ? Math.min(100, Math.round((customer.openBalance / customer.credit_limit) * 100))
      : null;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        module="Customers"
        title={customer.name}
        action={
          <div className="flex gap-2">
            <Link href={`/customers/${customer.id}/statement`} target="_blank">
              <Button variant="secondary">
                <Printer className="size-4" />
                Statement
              </Button>
            </Link>
            <ExportButton
              filename={`statement-${customer.name.replace(/\s+/g, "-").toLowerCase()}`}
              rows={customer.invoices.map((i) => ({
                Invoice: i.invoice_number,
                Date: i.created_at.slice(0, 10),
                Status: i.status,
                Total: i.total,
                Paid: i.amount_paid,
                Balance: i.total - i.amount_paid,
                Due: i.due_date ?? "",
              }))}
            />
          </div>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total billed" value={`$${customer.totalBilled.toLocaleString()}`} tone="primary" />
        <StatCard label="Total paid" value={`$${customer.totalPaid.toLocaleString()}`} tone="success" />
        <StatCard label="Open balance" value={`$${customer.openBalance.toLocaleString()}`} tone="info" />
        <StatCard
          label="Overdue"
          value={`$${customer.overdueBalance.toLocaleString()}`}
          tone={customer.overdueBalance > 0 ? "warning" : "success"}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          <Card>
            <CardHeader title="Invoices" />
            {customer.invoices.length === 0 ? (
              <p className="p-4 text-sm text-text-secondary">No invoices for this customer yet.</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border-subtle text-left text-xs font-medium uppercase tracking-wide text-text-tertiary">
                    <th className="px-4 py-2.5">Invoice</th>
                    <th className="px-4 py-2.5">Status</th>
                    <th className="px-4 py-2.5">Due</th>
                    <th className="px-4 py-2.5">Total</th>
                    <th className="px-4 py-2.5">Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {customer.invoices.map((inv) => {
                    const balance = inv.total - inv.amount_paid;
                    const overdue =
                      (inv.status === "issued" || inv.status === "partially_paid") &&
                      inv.due_date !== null &&
                      inv.due_date < today &&
                      balance > 0;
                    return (
                      <tr key={inv.id} className="border-b border-border-subtle last:border-b-0">
                        <td className="px-4 py-2.5">
                          <Link href={`/sales/${inv.id}`} className="font-medium text-primary-600 hover:underline">
                            {inv.invoice_number}
                          </Link>
                        </td>
                        <td className="px-4 py-2.5">
                          <Badge tone={overdue ? "danger" : (statusTone[inv.status] ?? "neutral")}>
                            {overdue ? "Overdue" : inv.status.replace(/_/g, " ")}
                          </Badge>
                        </td>
                        <td className="px-4 py-2.5 text-text-secondary">
                          {inv.due_date ? new Date(inv.due_date).toLocaleDateString() : "—"}
                        </td>
                        <td className="px-4 py-2.5 text-text-secondary">${inv.total.toFixed(2)}</td>
                        <td className={`px-4 py-2.5 ${overdue ? "font-medium text-danger-600" : "text-text-secondary"}`}>
                          ${balance.toFixed(2)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </Card>

          <Card>
            <CardHeader title="Recent payments" />
            {customer.recentPayments.length === 0 ? (
              <p className="p-4 text-sm text-text-secondary">No payments recorded.</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border-subtle text-left text-xs font-medium uppercase tracking-wide text-text-tertiary">
                    <th className="px-4 py-2.5">Date</th>
                    <th className="px-4 py-2.5">Invoice</th>
                    <th className="px-4 py-2.5">Method</th>
                    <th className="px-4 py-2.5">Reference</th>
                    <th className="px-4 py-2.5">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {customer.recentPayments.map((p) => (
                    <tr key={p.id} className="border-b border-border-subtle last:border-b-0">
                      <td className="px-4 py-2.5 text-text-secondary">{new Date(p.paid_at).toLocaleDateString()}</td>
                      <td className="px-4 py-2.5 text-text-secondary">{p.invoice_number}</td>
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

        <div className="flex flex-col gap-6">
          <Card className="flex flex-col gap-3 p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-text-secondary">Status</span>
              <Badge tone={customer.is_active ? "success" : "neutral"}>
                {customer.is_active ? "Active" : "Inactive"}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-text-secondary">Type</span>
              <span className="text-sm capitalize text-text-primary">{customer.customer_type}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-text-secondary">Email</span>
              <span className="text-sm text-text-primary">{customer.email || "—"}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-text-secondary">Phone</span>
              <span className="text-sm text-text-primary">{customer.phone || "—"}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-text-secondary">Tax number</span>
              <span className="text-sm text-text-primary">{customer.tax_number || "—"}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-text-secondary">Location</span>
              <span className="text-sm text-text-primary">
                {[customer.address?.city, customer.address?.country].filter(Boolean).join(", ") || "—"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-text-secondary">Payment terms</span>
              <span className="text-sm text-text-primary">
                {customer.payment_terms_days != null ? `Net ${customer.payment_terms_days}` : "On receipt"}
              </span>
            </div>
            {customer.notes && (
              <div className="border-t border-border-subtle pt-3">
                <p className="text-sm font-medium text-text-secondary">Notes</p>
                <p className="whitespace-pre-line text-sm text-text-primary">{customer.notes}</p>
              </div>
            )}
          </Card>

          {customer.credit_limit != null && (
            <Card className="flex flex-col gap-2 p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-text-secondary">Credit limit</span>
                <span className="text-sm font-semibold text-text-primary">${customer.credit_limit.toFixed(2)}</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-border-subtle">
                <div
                  className={`h-full ${creditUsedPct !== null && creditUsedPct >= 90 ? "bg-danger-500" : "bg-primary-500"}`}
                  style={{ width: `${creditUsedPct ?? 0}%` }}
                />
              </div>
              <p className="text-xs text-text-tertiary">
                ${customer.openBalance.toFixed(2)} in use ({creditUsedPct}%)
              </p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
