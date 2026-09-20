import { createServiceRoleClient } from "@quickbiz/supabase/client-service-role";
import { apiHandler } from "@/lib/api/handler";

// GET /api/v1/products — list the org's products with stock.
// Auth: Bearer key. Public keys must send x-org-id for a licensed org.
export const GET = apiHandler({ endpoint: "GET /v1/products" }, async (request, ctx) => {
  const supabase = createServiceRoleClient();
  const url = new URL(request.url);
  const limit = Math.min(200, Math.max(1, Number(url.searchParams.get("limit") ?? 50)));
  const offset = Math.max(0, Number(url.searchParams.get("offset") ?? 0));
  const search = url.searchParams.get("q")?.trim();

  let query = supabase
    .from("products")
    .select(
      "id, sku, name, description, unit_of_measure, cost_price, selling_price, reorder_level, barcode, is_active, product_categories(name), stock_levels(quantity_on_hand)",
      { count: "exact" }
    )
    .eq("org_id", ctx.orgId)
    .order("name")
    .range(offset, offset + limit - 1);

  if (search) query = query.or(`name.ilike.%${search}%,sku.ilike.%${search}%,barcode.eq.${search}`);

  const { data, error, count } = await query;
  if (error) throw error;

  const products = (data ?? []).map((row) => ({
    id: row.id,
    sku: row.sku,
    name: row.name,
    description: row.description,
    unit_of_measure: row.unit_of_measure,
    cost_price: row.cost_price,
    selling_price: row.selling_price,
    reorder_level: row.reorder_level,
    barcode: row.barcode,
    is_active: row.is_active,
    category: (row.product_categories as unknown as { name: string } | null)?.name ?? null,
    stock_on_hand: ((row.stock_levels as unknown as Array<{ quantity_on_hand: number }>) ?? []).reduce(
      (s, l) => s + l.quantity_on_hand,
      0
    ),
  }));

  return { products, total: count ?? 0, limit, offset };
});
