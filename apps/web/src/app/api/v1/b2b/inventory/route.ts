import { createServiceRoleClient } from "@quickbiz/supabase/client-service-role";
import { apiHandler } from "@/lib/api/handler";

// GET /api/v1/b2b/inventory — stock levels across warehouses.
// Private keys only (B2B): bound to the key's org, no x-org-id needed.
export const GET = apiHandler(
  { endpoint: "GET /v1/b2b/inventory", scope: "private" },
  async (request, ctx) => {
    const supabase = createServiceRoleClient();
    const url = new URL(request.url);
    const warehouseId = url.searchParams.get("warehouse_id");

    let query = supabase
      .from("stock_levels")
      .select("product_id, warehouse_id, quantity_on_hand, products(sku, name, barcode), warehouses(name, branches(name))")
      .eq("org_id", ctx.orgId);

    if (warehouseId) query = query.eq("warehouse_id", warehouseId);

    const { data, error } = await query;
    if (error) throw error;

    const levels = (data ?? []).map((row) => ({
      product_id: row.product_id,
      sku: (row.products as unknown as { sku: string } | null)?.sku ?? null,
      product_name: (row.products as unknown as { name: string } | null)?.name ?? null,
      barcode: (row.products as unknown as { barcode: string | null } | null)?.barcode ?? null,
      warehouse_id: row.warehouse_id,
      warehouse_name: (row.warehouses as unknown as { name: string } | null)?.name ?? null,
      branch_name:
        (row.warehouses as unknown as { branches: { name: string } | null } | null)?.branches?.name ?? null,
      quantity_on_hand: row.quantity_on_hand,
    }));

    return { stock_levels: levels };
  }
);
