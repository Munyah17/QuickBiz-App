import { createServiceRoleClient } from "@quickbiz/supabase/client-service-role";
import { apiHandler } from "@/lib/api/handler";

// GET /api/v1/customers — list the org's customers.
export const GET = apiHandler({ endpoint: "GET /v1/customers" }, async (request, ctx) => {
  const supabase = createServiceRoleClient();
  const url = new URL(request.url);
  const limit = Math.min(200, Math.max(1, Number(url.searchParams.get("limit") ?? 50)));
  const offset = Math.max(0, Number(url.searchParams.get("offset") ?? 0));
  const search = url.searchParams.get("q")?.trim();

  let query = supabase
    .from("customers")
    .select(
      "id, name, customer_type, email, phone, tax_number, address, credit_limit, payment_terms_days, is_active, created_at",
      { count: "exact" }
    )
    .eq("org_id", ctx.orgId)
    .order("name")
    .range(offset, offset + limit - 1);

  if (search) query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`);

  const { data, error, count } = await query;
  if (error) throw error;

  return { customers: data ?? [], total: count ?? 0, limit, offset };
});
