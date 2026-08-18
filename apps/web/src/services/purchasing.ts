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

export interface PurchaseOrderListRow {
  id: string;
  po_number: string;
  supplierName: string | null;
  status: "draft" | "issued" | "received" | "cancelled";
  total: number;
  amount_paid: number;
  created_at: string;
}

export async function listPurchaseOrders(supabase: SupabaseClient, orgId: string): Promise<PurchaseOrderListRow[]> {
  const { data, error } = await supabase
    .from("purchase_orders")
    .select("id, po_number, status, total, amount_paid, created_at, suppliers(name)")
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
  items: Array<{ id: string; description: string; quantity: number; unit_cost: number; line_total: number }>;
  payments: Array<{ id: string; amount: number; method: string; paid_at: string; reference: string | null }>;
}

export async function getPurchaseOrderDetail(supabase: SupabaseClient, orgId: string, poId: string): Promise<PurchaseOrderDetail | null> {
  const { data: po, error } = await supabase
    .from("purchase_orders")
    .select(
      "id, po_number, status, subtotal, tax_total, total, amount_paid, notes, created_at, received_at, suppliers(name), branches(name)"
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
  input: { orgId: string; branchId: string; supplierId: string | null; items: PurchaseOrderLineInput[]; taxTotal: number; notes: string }
): Promise<string> {
  const { data, error } = await supabase.rpc("create_purchase_order", {
    p_org_id: input.orgId,
    p_branch_id: input.branchId,
    p_supplier_id: input.supplierId ?? undefined,
    p_items: input.items as unknown as Json,
    p_tax_total: input.taxTotal,
    p_notes: input.notes || undefined,
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
