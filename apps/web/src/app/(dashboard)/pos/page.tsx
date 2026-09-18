import { PageHeader } from "@/components/PageHeader";
import { StatCard } from "@/components/StatCard";
import { requireOrgContext, requireModuleEnabled } from "@/lib/session";
import { getRegisterForBranch, getOpenSession, getSessionSummary, listHeldOrders, listSessionHistory } from "@/services/pos";
import { Card, CardHeader } from "@/components/Card";
import { Badge } from "@/components/Badge";
import { listProductsWithStock } from "@/services/products";
import { listCustomers } from "@/services/customers";
import { getOrgSettings } from "@/services/org";
import { OpenRegisterForm } from "./OpenRegisterForm";
import { POSCheckout } from "./POSCheckout";
import { CloseRegisterModal } from "./CloseRegisterModal";

export default async function PosPage() {
  const { supabase, orgId, branchName, orgName, userName } = await requireOrgContext();
  await requireModuleEnabled(supabase, orgId, "pos");

  const { data: member } = await supabase.from("org_members").select("branch_id").eq("status", "active").limit(1).maybeSingle();
  const branchId = member?.branch_id as string | undefined;

  if (!branchId) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title="Point of Sale" />
        <p className="text-sm text-text-secondary">Assign yourself to a branch to use the register.</p>
      </div>
    );
  }

  const register = await getRegisterForBranch(supabase, orgId, branchId);
  if (!register) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title="Point of Sale" />
        <p className="text-sm text-text-secondary">No register found for {branchName}.</p>
      </div>
    );
  }

  const session = await getOpenSession(supabase, orgId, register.id);

  if (!session) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title="Point of Sale" />
        <OpenRegisterForm registerId={register.id} registerName={register.name} />
      </div>
    );
  }

  const [products, customers, settings, summary, heldOrders, sessionHistory] = await Promise.all([
    listProductsWithStock(supabase, orgId),
    listCustomers(supabase, orgId),
    getOrgSettings(supabase, orgId),
    getSessionSummary(supabase, orgId, session.id),
    listHeldOrders(supabase, orgId, session.id),
    listSessionHistory(supabase, orgId, register.id),
  ]);

  const { data: warehouse } = await supabase.from("warehouses").select("id").eq("branch_id", branchId).single();
  const taxRateRaw = String(settings["tax.default_rate"] ?? "0%");
  const taxRatePercent = parseFloat(taxRateRaw.replace("%", "")) || 0;

  const totalSales = summary.totalSales;
  const totalTransactions = summary.invoiceCount;
  const averageTransaction = totalTransactions > 0 ? totalSales / totalTransactions : 0;
  const cashSales = summary.cashSales;

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Point of Sale"
        action={<CloseRegisterModal sessionId={session.id} summary={summary} openingFloat={session.opening_float} />}
      />

      {/* Session Statistics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Session sales"
          value={`$${totalSales.toLocaleString()}`}
          tone="primary"
        />
        <StatCard
          label="Transactions"
          value={totalTransactions.toString()}
          tone="info"
        />
        <StatCard
          label="Avg transaction"
          value={`$${averageTransaction.toFixed(2)}`}
          tone="success"
        />
        <StatCard
          label="Cash sales"
          value={`${Math.round((cashSales / (totalSales || 1)) * 100)}%`}
          tone="warning"
        />
      </div>

      <POSCheckout
        branchId={branchId}
        warehouseId={warehouse?.id ?? ""}
        sessionId={session.id}
        registerId={register.id}
        products={products}
        customers={customers.filter((c) => c.is_active)}
        heldOrders={heldOrders}
        taxRatePercent={taxRatePercent}
        orgName={orgName}
        cashierName={userName}
      />

      {sessionHistory.length > 0 && (
        <Card>
          <CardHeader title="Recent sessions" />
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border-subtle text-left text-xs font-medium uppercase tracking-wide text-text-tertiary">
                <th className="px-4 py-2.5">Shift</th>
                <th className="px-4 py-2.5">Cashier</th>
                <th className="px-4 py-2.5">Sales</th>
                <th className="px-4 py-2.5">Cash expected</th>
                <th className="px-4 py-2.5">Counted</th>
                <th className="px-4 py-2.5">Variance</th>
              </tr>
            </thead>
            <tbody>
              {sessionHistory.map((s) => (
                <tr key={s.id} className="border-b border-border-subtle last:border-b-0">
                  <td className="px-4 py-2.5 text-text-secondary">
                    {new Date(s.opened_at).toLocaleString()} — {s.closed_at ? new Date(s.closed_at).toLocaleTimeString() : ""}
                  </td>
                  <td className="px-4 py-2.5 text-text-secondary">{s.openedByName ?? "—"}</td>
                  <td className="px-4 py-2.5 text-text-secondary">
                    ${s.totalSales.toFixed(2)} · {s.invoiceCount} sale{s.invoiceCount === 1 ? "" : "s"}
                  </td>
                  <td className="px-4 py-2.5 text-text-secondary">${s.expectedCash.toFixed(2)}</td>
                  <td className="px-4 py-2.5 text-text-secondary">
                    {s.closing_float !== null ? `$${s.closing_float.toFixed(2)}` : "—"}
                  </td>
                  <td className="px-4 py-2.5">
                    {s.variance === null ? (
                      <span className="text-text-tertiary">—</span>
                    ) : (
                      <Badge tone={Math.abs(s.variance) < 0.01 ? "success" : s.variance > 0 ? "info" : "danger"}>
                        {s.variance >= 0 ? "+" : ""}${s.variance.toFixed(2)}
                      </Badge>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
