import { PageHeader } from "@/components/PageHeader";
import { StatCard } from "@/components/StatCard";
import { requireOrgContext, requireModuleEnabled } from "@/lib/session";
import { getRegisterForBranch, getOpenSession, getSessionSummary } from "@/services/pos";
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

  const [products, customers, settings, summary] = await Promise.all([
    listProductsWithStock(supabase, orgId),
    listCustomers(supabase, orgId),
    getOrgSettings(supabase, orgId),
    getSessionSummary(supabase, orgId, session.id),
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
        products={products}
        customers={customers.filter((c) => c.is_active)}
        taxRatePercent={taxRatePercent}
        orgName={orgName}
        cashierName={userName}
      />
    </div>
  );
}
