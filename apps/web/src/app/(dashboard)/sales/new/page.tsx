import { PageHeader } from "@/components/PageHeader";
import { requireOrgContext, requireModuleEnabled, requirePermission } from "@/lib/session";
import { listCustomers } from "@/services/customers";
import { listProductsWithStock, listWarehouses } from "@/services/products";
import { getOrgSettings } from "@/services/org";
import { NewInvoiceForm } from "./NewInvoiceForm";

export default async function NewInvoicePage() {
  const { supabase, orgId, permissions } = await requireOrgContext();
  await requireModuleEnabled(supabase, orgId, "sales");
  requirePermission(permissions, "sales.manage");

  const [customers, products, warehouses, settings] = await Promise.all([
    listCustomers(supabase, orgId),
    listProductsWithStock(supabase, orgId),
    listWarehouses(supabase, orgId),
    getOrgSettings(supabase, orgId),
  ]);

  const taxRateRaw = String(settings["tax.default_rate"] ?? "0%");
  const taxRatePercent = parseFloat(taxRateRaw.replace("%", "")) || 0;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader module="Sales" title="New Invoice" />
      <NewInvoiceForm
        customers={customers.filter((c) => c.is_active)}
        products={products.filter((p) => p.is_active)}
        warehouses={warehouses}
        taxRatePercent={taxRatePercent}
      />
    </div>
  );
}
