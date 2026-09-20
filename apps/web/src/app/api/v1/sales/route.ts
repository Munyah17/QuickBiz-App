import { createServiceRoleClient } from "@quickbiz/supabase/client-service-role";
import { apiHandler } from "@/lib/api/handler";
import { ApiError } from "@/lib/api/auth";

// GET /api/v1/sales — list invoices/quotes.
export const GET = apiHandler({ endpoint: "GET /v1/sales" }, async (request, ctx) => {
  const supabase = createServiceRoleClient();
  const url = new URL(request.url);
  const limit = Math.min(200, Math.max(1, Number(url.searchParams.get("limit") ?? 50)));
  const offset = Math.max(0, Number(url.searchParams.get("offset") ?? 0));
  const status = url.searchParams.get("status");
  const docType = url.searchParams.get("doc_type");

  let query = supabase
    .from("sales_invoices")
    .select(
      "id, invoice_number, status, doc_type, total, amount_paid, due_date, created_at, customers(name)",
      { count: "exact" }
    )
    .eq("org_id", ctx.orgId)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (status) query = query.eq("status", status);
  if (docType) query = query.eq("doc_type", docType);

  const { data, error, count } = await query;
  if (error) throw error;

  const invoices = (data ?? []).map((row) => ({
    id: row.id,
    invoice_number: row.invoice_number,
    status: row.status,
    doc_type: row.doc_type,
    total: row.total,
    amount_paid: row.amount_paid,
    due_date: row.due_date,
    created_at: row.created_at,
    customer_name: (row.customers as unknown as { name: string } | null)?.name ?? null,
  }));

  return { invoices, total: count ?? 0, limit, offset };
});

// POST /api/v1/sales — create a draft invoice.
// Body: { customer_id?, items: [{ product_id?, description, quantity, unit_price }], notes?, due_date? }
export const POST = apiHandler({ endpoint: "POST /v1/sales" }, async (request, ctx) => {
  const supabase = createServiceRoleClient();
  const body = (await request.json().catch(() => null)) as {
    customer_id?: string;
    items?: Array<{ product_id?: string; description: string; quantity: number; unit_price: number }>;
    notes?: string;
    due_date?: string;
  } | null;

  if (!body?.items || body.items.length === 0) {
    throw new ApiError(400, "items[] is required — at least one line with description, quantity, unit_price.", "bad_request");
  }

  const subtotal = body.items.reduce((s, i) => s + i.quantity * i.unit_price, 0);

  const { data: invoiceNumber, error: numError } = await supabase.rpc("next_number", {
    target_org_id: ctx.orgId,
    p_entity_type: "sales_invoice",
  });
  if (numError) throw numError;

  const { data: invoice, error } = await supabase
    .from("sales_invoices")
    .insert({
      org_id: ctx.orgId,
      customer_id: body.customer_id ?? null,
      invoice_number: invoiceNumber,
      doc_type: "invoice",
      status: "draft",
      subtotal,
      tax_total: 0,
      discount_total: 0,
      total: subtotal,
      amount_paid: 0,
      notes: body.notes ?? null,
      due_date: body.due_date ?? null,
    })
    .select("id, invoice_number")
    .single();
  if (error) throw error;

  const { error: itemsError } = await supabase.from("sales_invoice_items").insert(
    body.items.map((i) => ({
      invoice_id: invoice.id,
      product_id: i.product_id ?? null,
      description: i.description,
      quantity: i.quantity,
      unit_price: i.unit_price,
      line_total: i.quantity * i.unit_price,
    }))
  );
  if (itemsError) throw itemsError;

  return { id: invoice.id, invoice_number: invoice.invoice_number, status: "draft", total: subtotal };
});
