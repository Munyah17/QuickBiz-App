import { notFound } from "next/navigation";
import { PageHeader } from "@/components/PageHeader";
import { requireOrgContext, requireModuleEnabled, requirePermission } from "@/lib/session";
import { listCustomers } from "@/services/customers";
import { listProductsWithStock, listWarehouses } from "@/services/products";
import { getOrgSettings } from "@/services/org";
import { getInvoiceDetail } from "@/services/sales";
import { NewInvoiceForm } from "../../new/NewInvoiceForm";

export default async function EditDraftPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, orgId, permissions } = await requireOrgContext();
  await requireModuleEnabled(supabase, orgId, "sales");
  requirePermission(permissions, "sales.manage");

  const invoice = await getInvoiceDetail(supabase, orgId, id);
  if (!invoice || invoice.status !== "draft") notFound();

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
      <PageHeader
        module="Sales"
        title={invoice.doc_type === "quote" ? `Edit quotation ${invoice.invoice_number}` : `Edit draft ${invoice.invoice_number}`}
      />
      <NewInvoiceForm
        customers={customers.filter((c) => c.is_active)}
        products={products.filter((p) => p.is_active)}
        warehouses={warehouses}
        taxRatePercent={taxRatePercent}
        initial={{
          invoiceId: invoice.id,
          docType: invoice.doc_type,
          customerId: invoice.customerId,
          warehouseId: null,
          dueDate: invoice.due_date,
          discountTotal: invoice.discount_total,
          discountReason: invoice.discount_reason,
          notes: invoice.notes,
          items: invoice.items.map((i) => ({
            product_id: i.product_id,
            description: i.description,
            quantity: i.quantity,
            unit_price: i.unit_price,
          })),
        }}
      />
    </div>
  );
}
