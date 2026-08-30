import type { TypedSupabaseClient as SupabaseClient } from "@quickbiz/supabase/types";

export interface OnlineProductRow {
  id: string;
  productId: string;
  productName: string;
  productSku: string;
  slug: string;
  online_price: number | null;
  basePrice: number;
  is_published: boolean;
}

export async function listOnlineProducts(supabase: SupabaseClient, orgId: string): Promise<OnlineProductRow[]> {
  const { data, error } = await supabase
    .from("online_products")
    .select("id, product_id, slug, online_price, is_published, products(name, sku, selling_price)")
    .eq("org_id", orgId)
    .order("created_at", { ascending: false });
  if (error) throw error;

  return (
    data as unknown as Array<{
      id: string;
      product_id: string;
      slug: string;
      online_price: number | null;
      is_published: boolean;
      products: { name: string; sku: string; selling_price: number } | null;
    }>
  ).map((row) => ({
    id: row.id,
    productId: row.product_id,
    productName: row.products?.name ?? "Unknown product",
    productSku: row.products?.sku ?? "",
    slug: row.slug,
    online_price: row.online_price,
    basePrice: row.products?.selling_price ?? 0,
    is_published: row.is_published,
  }));
}

export interface OnlineProductInput {
  productId: string;
  slug: string;
  onlinePrice: string;
  isPublished: boolean;
}

export async function publishOnlineProduct(supabase: SupabaseClient, orgId: string, input: OnlineProductInput) {
  const { error } = await supabase.from("online_products").insert({
    org_id: orgId,
    product_id: input.productId,
    slug: input.slug,
    online_price: input.onlinePrice ? Number(input.onlinePrice) : null,
    is_published: input.isPublished,
  });
  if (error) throw error;
}

export async function setOnlineProductPublished(supabase: SupabaseClient, onlineProductId: string, isPublished: boolean) {
  const { error } = await supabase.from("online_products").update({ is_published: isPublished }).eq("id", onlineProductId);
  if (error) throw error;
}

export interface OnlineOrderRow {
  id: string;
  order_number: string;
  status: "pending" | "confirmed" | "fulfilled" | "cancelled";
  delivery_method: "pickup" | "delivery";
  delivery_status: "not_shipped" | "shipped" | "delivered";
  subtotal: number;
  total: number;
  delivery_address: string | null;
  created_at: string;
  buyerName: string;
  buyerContact: string | null;
}

export async function listOnlineOrders(supabase: SupabaseClient, orgId: string): Promise<OnlineOrderRow[]> {
  const { data, error } = await supabase
    .from("online_orders")
    .select(
      "id, order_number, status, delivery_method, delivery_status, subtotal, total, delivery_address, guest_name, guest_phone, created_at, customers(name, email, phone)"
    )
    .eq("org_id", orgId)
    .order("created_at", { ascending: false });
  if (error) throw error;

  return (
    data as unknown as Array<{
      id: string;
      order_number: string;
      status: OnlineOrderRow["status"];
      delivery_method: OnlineOrderRow["delivery_method"];
      delivery_status: OnlineOrderRow["delivery_status"];
      subtotal: number;
      total: number;
      delivery_address: string | null;
      guest_name: string | null;
      guest_phone: string | null;
      created_at: string;
      customers: { name: string; email: string | null; phone: string | null } | null;
    }>
  ).map((row) => ({
    id: row.id,
    order_number: row.order_number,
    status: row.status,
    delivery_method: row.delivery_method,
    delivery_status: row.delivery_status,
    subtotal: row.subtotal,
    total: row.total,
    delivery_address: row.delivery_address,
    created_at: row.created_at,
    buyerName: row.customers?.name ?? row.guest_name ?? "Unknown buyer",
    buyerContact: row.customers?.email ?? row.customers?.phone ?? row.guest_phone ?? null,
  }));
}

export interface OnlineOrderItemInput {
  productId: string;
  quantity: number;
  unitPrice: number;
}

export async function createOnlineOrder(
  supabase: SupabaseClient,
  orgId: string,
  input: {
    branchId: string;
    customerId: string;
    guestName: string;
    guestPhone: string;
    warehouseId: string;
    deliveryMethod: string;
    deliveryAddress: string;
    notes: string;
    items: OnlineOrderItemInput[];
  }
): Promise<string> {
  const { data, error } = await supabase.rpc("create_online_order", {
    p_org_id: orgId,
    p_branch_id: input.branchId,
    p_customer_id: input.customerId || undefined,
    p_guest_name: input.customerId ? undefined : input.guestName || undefined,
    p_guest_phone: input.customerId ? undefined : input.guestPhone || undefined,
    p_warehouse_id: input.warehouseId || undefined,
    p_delivery_method: input.deliveryMethod,
    p_delivery_address: input.deliveryAddress || undefined,
    p_notes: input.notes || undefined,
    p_items: input.items.map((i) => ({ product_id: i.productId, quantity: i.quantity, unit_price: i.unitPrice })),
  });
  if (error) throw error;
  return data as string;
}

export async function updateOnlineOrderStatus(supabase: SupabaseClient, orderId: string, status: string) {
  const { error } = await supabase.from("online_orders").update({ status }).eq("id", orderId);
  if (error) throw error;
}

export async function updateOnlineOrderDeliveryStatus(supabase: SupabaseClient, orderId: string, deliveryStatus: string) {
  const { error } = await supabase.from("online_orders").update({ delivery_status: deliveryStatus }).eq("id", orderId);
  if (error) throw error;
}
