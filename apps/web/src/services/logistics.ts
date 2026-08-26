import type { TypedSupabaseClient as SupabaseClient } from "@quickbiz/supabase/types";

export interface ShipmentRow {
  id: string;
  shipment_number: string;
  status: "pending" | "dispatched" | "in_transit" | "delivered" | "failed" | "returned";
  carrier: string | null;
  tracking_number: string | null;
  delivery_address: string | null;
  dispatched_at: string | null;
  delivered_at: string | null;
  notes: string | null;
  created_at: string;
  customerName: string | null;
  vehicleRegistration: string | null;
  driverName: string | null;
  invoiceNumber: string | null;
  onlineOrderNumber: string | null;
}

export async function listShipments(supabase: SupabaseClient, orgId: string): Promise<ShipmentRow[]> {
  const { data, error } = await supabase
    .from("shipments")
    .select(
      "id, shipment_number, status, carrier, tracking_number, delivery_address, dispatched_at, delivered_at, notes, created_at, customers(name), vehicles(registration_number), employees(full_name), sales_invoices(invoice_number), online_orders(order_number)"
    )
    .eq("org_id", orgId)
    .order("created_at", { ascending: false });
  if (error) throw error;

  return (
    data as unknown as Array<{
      id: string;
      shipment_number: string;
      status: ShipmentRow["status"];
      carrier: string | null;
      tracking_number: string | null;
      delivery_address: string | null;
      dispatched_at: string | null;
      delivered_at: string | null;
      notes: string | null;
      created_at: string;
      customers: { name: string } | null;
      vehicles: { registration_number: string } | null;
      employees: { full_name: string } | null;
      sales_invoices: { invoice_number: string } | null;
      online_orders: { order_number: string } | null;
    }>
  ).map((row) => ({
    id: row.id,
    shipment_number: row.shipment_number,
    status: row.status,
    carrier: row.carrier,
    tracking_number: row.tracking_number,
    delivery_address: row.delivery_address,
    dispatched_at: row.dispatched_at,
    delivered_at: row.delivered_at,
    notes: row.notes,
    created_at: row.created_at,
    customerName: row.customers?.name ?? null,
    vehicleRegistration: row.vehicles?.registration_number ?? null,
    driverName: row.employees?.full_name ?? null,
    invoiceNumber: row.sales_invoices?.invoice_number ?? null,
    onlineOrderNumber: row.online_orders?.order_number ?? null,
  }));
}

export interface ShipmentInput {
  branchId: string;
  customerId: string;
  salesInvoiceId: string;
  onlineOrderId: string;
  vehicleId: string;
  driverId: string;
  carrier: string;
  trackingNumber: string;
  deliveryAddress: string;
  notes: string;
}

export async function createShipment(supabase: SupabaseClient, orgId: string, input: ShipmentInput) {
  const { data: shipmentNumber, error: numError } = await supabase.rpc("next_number", {
    target_org_id: orgId,
    p_entity_type: "shipment",
  });
  if (numError) throw numError;

  const { error } = await supabase.from("shipments").insert({
    org_id: orgId,
    branch_id: input.branchId || null,
    customer_id: input.customerId || null,
    sales_invoice_id: input.salesInvoiceId || null,
    online_order_id: input.onlineOrderId || null,
    vehicle_id: input.vehicleId || null,
    driver_id: input.driverId || null,
    shipment_number: shipmentNumber,
    carrier: input.carrier || null,
    tracking_number: input.trackingNumber || null,
    delivery_address: input.deliveryAddress || null,
    notes: input.notes || null,
  });
  if (error) throw error;
}

export async function updateShipmentStatus(supabase: SupabaseClient, shipmentId: string, status: string) {
  const now = new Date().toISOString();
  const { error } = await supabase
    .from("shipments")
    .update({
      status,
      dispatched_at: status === "dispatched" ? now : undefined,
      delivered_at: status === "delivered" ? now : undefined,
    })
    .eq("id", shipmentId);
  if (error) throw error;
}
