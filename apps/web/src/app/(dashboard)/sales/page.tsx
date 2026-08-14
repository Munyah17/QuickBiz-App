import Link from "next/link";
import { Receipt, Plus } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/Card";
import { Badge } from "@/components/Badge";
import { Button } from "@/components/Button";
import { EmptyState } from "@/components/EmptyState";
import { requireOrgContext, requireModuleEnabled } from "@/lib/session";
import { listInvoices } from "@/services/sales";

const statusTone: Record<string, "success" | "info" | "warning" | "danger" | "neutral"> = {
  draft: "neutral",
  issued: "info",
  paid: "success",
  cancelled: "danger",
};

export default async function SalesPage() {
  const { supabase, orgId, permissions } = await requireOrgContext();
  await requireModuleEnabled(supabase, orgId, "sales");
  const canManage = permissions.has("sales.manage");

  const invoices = await listInvoices(supabase, orgId);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <PageHeader title="Sales" />
        {canManage && (
          <Link href="/sales/new">
            <Button>
              <Plus className="size-4" />
              New Invoice
            </Button>
          </Link>
        )}
      </div>

      <Card>
        {invoices.length === 0 ? (
          <EmptyState icon={Receipt} title="No invoices yet" description="Create your first sales invoice to get started." />
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border-subtle text-left text-xs font-medium uppercase tracking-wide text-text-tertiary">
                <th className="px-4 py-2.5">Invoice</th>
                <th className="px-4 py-2.5">Customer</th>
                <th className="px-4 py-2.5">Status</th>
                <th className="px-4 py-2.5">Total</th>
                <th className="px-4 py-2.5">Paid</th>
                <th className="px-4 py-2.5">Date</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv) => (
                <tr key={inv.id} className="border-b border-border-subtle last:border-b-0">
                  <td className="px-4 py-2.5">
                    <Link href={`/sales/${inv.id}`} className="font-medium text-primary-600 hover:underline">
                      {inv.invoice_number}
                    </Link>
                  </td>
                  <td className="px-4 py-2.5 text-text-secondary">{inv.customerName ?? "Walk-in"}</td>
                  <td className="px-4 py-2.5">
                    <Badge tone={statusTone[inv.status] ?? "neutral"}>{inv.status}</Badge>
                  </td>
                  <td className="px-4 py-2.5 text-text-secondary">${inv.total.toFixed(2)}</td>
                  <td className="px-4 py-2.5 text-text-secondary">${inv.amount_paid.toFixed(2)}</td>
                  <td className="px-4 py-2.5 text-text-secondary">{new Date(inv.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
