import { PageHeader } from "@/components/PageHeader";
import { requireOrgContext, requireModuleEnabled, requirePermission } from "@/lib/session";
import { listSuppliers } from "@/services/purchasing";
import { listProductsWithStock } from "@/services/products";
import { getOrgSettings } from "@/services/org";
import { NewPOForm } from "./NewPOForm";

export default async function NewPurchaseOrderPage({
  searchParams,
}: {
  searchParams: Promise<{ product?: string; qty?: string; lowstock?: string }>;
}) {
  const { product: preselectedProduct, qty: preselectedQty, lowstock } = await searchParams;
  const { supabase, orgId, permissions } = await requireOrgContext();
  await requireModuleEnabled(supabase, orgId, "purchasing");
  requirePermission(permissions, "purchasing.manage");

  const { data: member } = await supabase.from("org_members").select("branch_id").eq("status", "active").limit(1).maybeSingle();

  const [suppliers, products, settings] = await Promise.all([
    listSuppliers(supabase, orgId),
    listProductsWithStock(supabase, orgId),
    getOrgSettings(supabase, orgId),
  ]);

  const taxRateRaw = String(settings["tax.default_rate"] ?? "0%");
  const taxRatePercent = parseFloat(taxRateRaw.replace("%", "")) || 0;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader module="Purchasing" title="New Purchase Order" />
      <NewPOForm
        suppliers={suppliers.filter((s) => s.is_active)}
        products={products.filter((p) => p.is_active)}
        branchId={(member?.branch_id as string) ?? ""}
        taxRatePercent={taxRatePercent}
        preselectedProductId={preselectedProduct ?? null}
        preselectedQty={preselectedQty ? Number(preselectedQty) : null}
        lowStockReorder={lowstock === "1"}
      />
    </div>
  );
}
