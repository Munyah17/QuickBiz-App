import { PageHeader } from "@/components/PageHeader";
import { StatCard } from "@/components/StatCard";
import { requireOrgContext } from "@/lib/session";
import { listCustomers } from "@/services/customers";
import { CustomersTable } from "./CustomersTable";

export default async function CustomersPage() {
  const { supabase, orgId, permissions } = await requireOrgContext();
  const customers = await listCustomers(supabase, orgId);

  // Open AR per customer — one aggregate query over unpaid invoices, so the
  // list shows who owes money without opening each profile.
  const { data: openInvoices } = await supabase
    .from("sales_invoices")
    .select("customer_id, total, amount_paid, due_date")
    .eq("org_id", orgId)
    .eq("doc_type", "invoice")
    .in("status", ["issued", "partially_paid"]);

  const today = new Date().toISOString().slice(0, 10);
  const balanceByCustomer = new Map<string, { open: number; overdue: number }>();
  for (const inv of (openInvoices ?? []) as Array<{ customer_id: string | null; total: number; amount_paid: number; due_date: string | null }>) {
    if (!inv.customer_id) continue;
    const bal = inv.total - inv.amount_paid;
    const entry = balanceByCustomer.get(inv.customer_id) ?? { open: 0, overdue: 0 };
    entry.open += bal;
    if (inv.due_date !== null && inv.due_date < today) entry.overdue += bal;
    balanceByCustomer.set(inv.customer_id, entry);
  }

  const totalCustomers = customers.length;
  const activeCustomers = customers.filter((c) => c.is_active).length;
  const businessCustomers = customers.filter((c) => c.customer_type === "business").length;
  const withOverdue = Array.from(balanceByCustomer.values()).filter((b) => b.overdue > 0).length;
  const totalReceivable = Array.from(balanceByCustomer.values()).reduce((s, b) => s + b.open, 0);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Customers" />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total customers" value={totalCustomers.toString()} delta={{ label: `${activeCustomers} active`, direction: "flat" }} tone="primary" />
        <StatCard label="Business accounts" value={businessCustomers.toString()} tone="info" />
        <StatCard
          label="Receivable"
          value={`$${totalReceivable.toLocaleString()}`}
          delta={totalReceivable > 0 ? { label: "open invoice balance", direction: "flat" } : undefined}
          tone="warning"
        />
        <StatCard
          label="With overdue balance"
          value={withOverdue.toString()}
          tone={withOverdue > 0 ? "warning" : "success"}
        />
      </div>

      <CustomersTable customers={customers} balances={balanceByCustomer} canManage={permissions.has("customers.manage")} />
    </div>
  );
}
