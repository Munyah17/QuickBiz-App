import type { TypedSupabaseClient as SupabaseClient } from "@quickbiz/supabase/types";
import type { Json } from "@quickbiz/supabase/database.types";

export interface Supplier {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  tax_number: string | null;
  address: { city?: string; country?: string };
  is_active: boolean;
}

export async function listSuppliers(supabase: SupabaseClient, orgId: string): Promise<Supplier[]> {
  const { data, error } = await supabase
    .from("suppliers")
    .select("id, name, email, phone, tax_number, address, is_active")
    .eq("org_id", orgId)
    .order("name");
  if (error) throw error;
  return data as unknown as Supplier[];
}

export interface SupplierInput {
  name: string;
  email: string;
  phone: string;
  tax_number: string;
  city: string;
  country: string;
}

export async function createSupplier(supabase: SupabaseClient, orgId: string, input: SupplierInput) {
  const { error } = await supabase.from("suppliers").insert({
    org_id: orgId,
    name: input.name,
    email: input.email || null,
    phone: input.phone || null,
    tax_number: input.tax_number || null,
    address: { city: input.city || undefined, country: input.country || undefined },
  });
  if (error) throw error;
}

export async function updateSupplier(supabase: SupabaseClient, supplierId: string, input: SupplierInput) {
  const { error } = await supabase
    .from("suppliers")
    .update({
      name: input.name,
      email: input.email || null,
      phone: input.phone || null,
      tax_number: input.tax_number || null,
      address: { city: input.city || undefined, country: input.country || undefined },
    })
    .eq("id", supplierId);
  if (error) throw error;
}

export async function setSupplierActive(supabase: SupabaseClient, supplierId: string, isActive: boolean) {
  const { error } = await supabase.from("suppliers").update({ is_active: isActive }).eq("id", supplierId);
  if (error) throw error;
}

// Bulk import — existing names are skipped so re-runs are safe.
export interface SupplierImportResult {
  created: number;
  skipped: number;
  failed: number;
  errors: Array<{ name: string; reason: string }>;
}

export async function importSuppliers(
  supabase: SupabaseClient,
  orgId: string,
  rows: SupplierInput[]
): Promise<SupplierImportResult> {
  const { data: existing, error } = await supabase.from("suppliers").select("name").eq("org_id", orgId);
  if (error) throw error;

  const seen = new Set((existing ?? []).map((r: { name: string }) => r.name.toLowerCase()));
  const result: SupplierImportResult = { created: 0, skipped: 0, failed: 0, errors: [] };

  for (const row of rows) {
    if (seen.has(row.name.toLowerCase())) {
      result.skipped += 1;
      continue;
    }
    try {
      await createSupplier(supabase, orgId, row);
      seen.add(row.name.toLowerCase());
      result.created += 1;
    } catch (err) {
      result.failed += 1;
      result.errors.push({ name: row.name || "(no name)", reason: (err as Error).message });
    }
  }

  return result;
}

// ============================================================
// Supplier 360 — account position: total spend, what we still owe,
// full PO history, and recent payments.
// ============================================================

export interface SupplierDetail extends Supplier {
  totalSpend: number;
  totalPaid: number;
  openBalance: number;
  lateOrders: number;
  purchaseOrders: Array<{
    id: string;
    po_number: string;
    status: string;
    total: number;
    amount_paid: number;
    expected_date: string | null;
    created_at: string;
  }>;
  recentPayments: Array<{
    id: string;
    amount: number;
    method: string;
    paid_at: string;
    reference: string | null;
    po_number: string;
  }>;
}

export async function getSupplierDetail(
  supabase: SupabaseClient,
  orgId: string,
  supplierId: string
): Promise<SupplierDetail | null> {
  const { data: supplier, error } = await supabase
    .from("suppliers")
    .select("id, name, email, phone, tax_number, address, is_active")
    .eq("org_id", orgId)
    .eq("id", supplierId)
    .maybeSingle();
  if (error) throw error;
  if (!supplier) return null;

  const { data: orders, error: ordersError } = await supabase
    .from("purchase_orders")
    .select("id, po_number, status, total, amount_paid, expected_date, created_at")
    .eq("org_id", orgId)
    .eq("supplier_id", supplierId)
    .neq("status", "cancelled")
    .order("created_at", { ascending: false });
  if (ordersError) throw ordersError;

  const orderRows = (orders ?? []) as SupplierDetail["purchaseOrders"];
  const today = new Date().toISOString().slice(0, 10);

  const poIds = orderRows.map((o) => o.id);
  let recentPayments: SupplierDetail["recentPayments"] = [];
  if (poIds.length > 0) {
    const { data: payments, error: payError } = await supabase
      .from("purchase_payments")
      .select("id, amount, method, paid_at, reference, po_id")
      .in("po_id", poIds)
      .order("paid_at", { ascending: false })
      .limit(10);
    if (payError) throw payError;

    const numberById = new Map(orderRows.map((o) => [o.id, o.po_number]));
    recentPayments = ((payments ?? []) as Array<{
      id: string;
      amount: number;
      method: string;
      paid_at: string;
      reference: string | null;
      po_id: string;
    }>).map((p) => ({
      id: p.id,
      amount: p.amount,
      method: p.method,
      paid_at: p.paid_at,
      reference: p.reference,
      po_number: numberById.get(p.po_id) ?? "",
    }));
  }

  const open = orderRows.filter((o) => o.status === "issued");

  return {
    ...(supplier as unknown as Supplier),
    totalSpend: orderRows.reduce((sum, o) => sum + o.total, 0),
    totalPaid: orderRows.reduce((sum, o) => sum + o.amount_paid, 0),
    openBalance: open.reduce((sum, o) => sum + (o.total - o.amount_paid), 0),
    lateOrders: open.filter((o) => o.expected_date !== null && o.expected_date < today).length,
    purchaseOrders: orderRows,
    recentPayments,
  };
}

export interface PurchaseOrderListRow {
  id: string;
  po_number: string;
  supplierName: string | null;
  status: "draft" | "issued" | "received" | "cancelled";
  total: number;
  amount_paid: number;
  expected_date: string | null;
  created_at: string;
}

export async function listPurchaseOrders(supabase: SupabaseClient, orgId: string): Promise<PurchaseOrderListRow[]> {
  const { data, error } = await supabase
    .from("purchase_orders")
    .select("id, po_number, status, total, amount_paid, expected_date, created_at, suppliers(name)")
    .eq("org_id", orgId)
    .order("created_at", { ascending: false });
  if (error) throw error;

  return (
    data as unknown as Array<{
      id: string;
      po_number: string;
      status: PurchaseOrderListRow["status"];
      total: number;
      amount_paid: number;
      expected_date: string | null;
      created_at: string;
      suppliers: { name: string } | null;
    }>
  ).map((row) => ({
    id: row.id,
    po_number: row.po_number,
    supplierName: row.suppliers?.name ?? null,
    status: row.status,
    total: row.total,
    amount_paid: row.amount_paid,
    expected_date: row.expected_date,
    created_at: row.created_at,
  }));
}

export interface PurchaseOrderDetail {
  id: string;
  po_number: string;
  status: "draft" | "issued" | "received" | "cancelled";
  supplierName: string | null;
  branchName: string | null;
  subtotal: number;
  tax_total: number;
  total: number;
  amount_paid: number;
  notes: string | null;
  created_at: string;
  received_at: string | null;
  expected_date: string | null;
  items: Array<{ id: string; description: string; quantity: number; unit_cost: number; line_total: number }>;
  payments: Array<{ id: string; amount: number; method: string; paid_at: string; reference: string | null }>;
}

export async function getPurchaseOrderDetail(supabase: SupabaseClient, orgId: string, poId: string): Promise<PurchaseOrderDetail | null> {
  const { data: po, error } = await supabase
    .from("purchase_orders")
    .select(
      "id, po_number, status, subtotal, tax_total, total, amount_paid, notes, created_at, received_at, expected_date, suppliers(name), branches(name)"
    )
    .eq("org_id", orgId)
    .eq("id", poId)
    .maybeSingle();
  if (error) throw error;
  if (!po) return null;

  const [{ data: items, error: itemsError }, { data: payments, error: paymentsError }] = await Promise.all([
    supabase.from("purchase_order_items").select("id, description, quantity, unit_cost, line_total").eq("po_id", poId),
    supabase.from("purchase_payments").select("id, amount, method, paid_at, reference").eq("po_id", poId).order("paid_at"),
  ]);
  if (itemsError) throw itemsError;
  if (paymentsError) throw paymentsError;

  const row = po as unknown as {
    id: string;
    po_number: string;
    status: PurchaseOrderDetail["status"];
    subtotal: number;
    tax_total: number;
    total: number;
    amount_paid: number;
    notes: string | null;
    created_at: string;
    received_at: string | null;
    expected_date: string | null;
    suppliers: { name: string } | null;
    branches: { name: string } | null;
  };

  return {
    id: row.id,
    po_number: row.po_number,
    status: row.status,
    supplierName: row.suppliers?.name ?? null,
    branchName: row.branches?.name ?? null,
    subtotal: row.subtotal,
    tax_total: row.tax_total,
    total: row.total,
    amount_paid: row.amount_paid,
    notes: row.notes,
    created_at: row.created_at,
    received_at: row.received_at,
    expected_date: row.expected_date,
    items: (items ?? []) as PurchaseOrderDetail["items"],
    payments: (payments ?? []) as PurchaseOrderDetail["payments"],
  };
}

export interface PurchaseOrderLineInput {
  product_id: string;
  description: string;
  quantity: number;
  unit_cost: number;
}

export async function createPurchaseOrder(
  supabase: SupabaseClient,
  input: {
    orgId: string;
    branchId: string;
    supplierId: string | null;
    items: PurchaseOrderLineInput[];
    taxTotal: number;
    notes: string;
    expectedDate?: string | null;
  }
): Promise<string> {
  const { data, error } = await supabase.rpc("create_purchase_order", {
    p_org_id: input.orgId,
    p_branch_id: input.branchId,
    p_supplier_id: input.supplierId ?? undefined,
    p_items: input.items as unknown as Json,
    p_tax_total: input.taxTotal,
    p_notes: input.notes || undefined,
    p_expected_date: input.expectedDate ?? undefined,
  });
  if (error) throw error;
  return data as string;
}

export async function receivePurchaseOrder(supabase: SupabaseClient, orgId: string, poId: string, warehouseId: string) {
  const { error } = await supabase.rpc("receive_purchase_order", { p_org_id: orgId, p_po_id: poId, p_warehouse_id: warehouseId });
  if (error) throw error;
}

export async function recordPurchasePayment(
  supabase: SupabaseClient,
  input: { orgId: string; poId: string; amount: number; method: string; reference: string }
) {
  const { error } = await supabase.rpc("record_purchase_payment", {
    p_org_id: input.orgId,
    p_po_id: input.poId,
    p_amount: input.amount,
    p_method: input.method,
    p_reference: input.reference || undefined,
  });
  if (error) throw error;
}
