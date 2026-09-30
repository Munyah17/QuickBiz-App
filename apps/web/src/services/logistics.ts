import type { TypedSupabaseClient as SupabaseClient } from "@quickbiz/supabase/types";

export interface ShipmentRow {
  id: string;
  shipment_number: string;
  status: "pending" | "dispatched" | "in_transit" | "delivered" | "failed" | "returned";
  carrier: string | null;
  tracking_number: string | null;
  origin_address: string | null;
  delivery_address: string | null;
  route_description: string | null;
  eta: string | null;
  priority: "low" | "normal" | "high" | "urgent";
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
      "id, shipment_number, status, carrier, tracking_number, origin_address, delivery_address, route_description, eta, priority, dispatched_at, delivered_at, notes, created_at, customers(name), vehicles(registration_number), employees(full_name), sales_invoices(invoice_number), online_orders(order_number)"
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
      origin_address: string | null;
      delivery_address: string | null;
      route_description: string | null;
      eta: string | null;
      priority: ShipmentRow["priority"];
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
    origin_address: row.origin_address,
    delivery_address: row.delivery_address,
    route_description: row.route_description,
    eta: row.eta,
    priority: row.priority,
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
  originAddress: string;
  deliveryAddress: string;
  routeDescription: string;
  eta: string;
  priority: string;
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
    origin_address: input.originAddress || null,
    delivery_address: input.deliveryAddress || null,
    route_description: input.routeDescription || null,
    eta: input.eta || null,
    priority: input.priority || "normal",
    notes: input.notes || null,
  });
  if (error) throw error;
}

export async function updateShipmentStatus(
  supabase: SupabaseClient,
  shipmentId: string,
  status: string,
  event?: { location?: string; note?: string }
) {
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

  // Every status change is also a tracking event so the shipment builds a
  // timeline customers/dispatchers can follow.
  const { error: eventError } = await supabase.from("shipment_events").insert({
    shipment_id: shipmentId,
    status,
    location: event?.location || null,
    note: event?.note || null,
  });
  if (eventError) throw eventError;
}

export interface ShipmentEvent {
  id: string;
  status: string;
  location: string | null;
  note: string | null;
  occurred_at: string;
}

export async function listShipmentEvents(supabase: SupabaseClient, shipmentId: string): Promise<ShipmentEvent[]> {
  const { data, error } = await supabase
    .from("shipment_events")
    .select("id, status, location, note, occurred_at")
    .eq("shipment_id", shipmentId)
    .order("occurred_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as ShipmentEvent[];
}

export async function addShipmentEvent(
  supabase: SupabaseClient,
  shipmentId: string,
  input: { status: string; location?: string; note?: string }
) {
  const { error } = await supabase.from("shipment_events").insert({
    shipment_id: shipmentId,
    status: input.status,
    location: input.location || null,
    note: input.note || null,
  });
  if (error) throw error;
}

// ---- Distribution routes ----------------------------------------------------

export interface DistributionRouteRow {
  id: string;
  route_name: string;
  status: "planned" | "active" | "completed";
  scheduled_date: string | null;
  stops: unknown;
  notes: string | null;
  created_at: string;
  vehicleRegistration: string | null;
  driverName: string | null;
}

export async function listDistributionRoutes(supabase: SupabaseClient, orgId: string): Promise<DistributionRouteRow[]> {
  const { data, error } = await supabase
    .from("distribution_routes")
    .select("id, route_name, status, scheduled_date, stops, notes, created_at, vehicles(registration_number), employees(full_name)")
    .eq("org_id", orgId)
    .order("scheduled_date", { ascending: false });
  if (error) throw error;
  return (
    (data ?? []) as unknown as Array<
      Omit<DistributionRouteRow, "vehicleRegistration" | "driverName"> & {
        vehicles: { registration_number: string } | null;
        employees: { full_name: string } | null;
      }
    >
  ).map((r) => ({
    ...r,
    vehicleRegistration: r.vehicles?.registration_number ?? null,
    driverName: r.employees?.full_name ?? null,
  }));
}

export interface DistributionRouteInput {
  routeName: string;
  vehicleId: string;
  driverId: string;
  scheduledDate: string;
  stops: string; // newline-separated stops, stored as a jsonb array
  notes: string;
}

export async function createDistributionRoute(supabase: SupabaseClient, orgId: string, input: DistributionRouteInput) {
  const stops = input.stops
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
  const { error } = await supabase.from("distribution_routes").insert({
    org_id: orgId,
    route_name: input.routeName,
    vehicle_id: input.vehicleId || null,
    driver_id: input.driverId || null,
    scheduled_date: input.scheduledDate || null,
    stops,
    notes: input.notes || null,
    status: "planned",
  });
  if (error) throw error;
}

export async function setDistributionRouteStatus(supabase: SupabaseClient, routeId: string, status: string) {
  const { error } = await supabase.from("distribution_routes").update({ status }).eq("id", routeId);
  if (error) throw error;
}

// ---- Emergency incidents ------------------------------------------------------

export interface EmergencyIncidentRow {
  id: string;
  incident_number: string;
  type: "breakdown" | "accident" | "theft" | "delay" | "other";
  severity: "low" | "medium" | "high" | "critical";
  status: "open" | "resolved";
  location: string | null;
  description: string | null;
  reported_at: string;
  resolved_at: string | null;
  created_at: string;
  shipmentNumber: string | null;
  vehicleRegistration: string | null;
}

export async function listEmergencyIncidents(supabase: SupabaseClient, orgId: string): Promise<EmergencyIncidentRow[]> {
  const { data, error } = await supabase
    .from("emergency_incidents")
    .select("id, incident_number, type, severity, status, location, description, reported_at, resolved_at, created_at, shipments(shipment_number), vehicles(registration_number)")
    .eq("org_id", orgId)
    .order("reported_at", { ascending: false });
  if (error) throw error;
  return (
    (data ?? []) as unknown as Array<
      Omit<EmergencyIncidentRow, "shipmentNumber" | "vehicleRegistration"> & {
        shipments: { shipment_number: string } | null;
        vehicles: { registration_number: string } | null;
      }
    >
  ).map((r) => ({
    ...r,
    shipmentNumber: r.shipments?.shipment_number ?? null,
    vehicleRegistration: r.vehicles?.registration_number ?? null,
  }));
}

export interface EmergencyIncidentInput {
  shipmentId: string;
  vehicleId: string;
  type: string;
  severity: string;
  location: string;
  description: string;
}

export async function reportEmergencyIncident(supabase: SupabaseClient, orgId: string, input: EmergencyIncidentInput) {
  const { data: incidentNumber, error: numError } = await supabase.rpc("next_number", {
    target_org_id: orgId,
    p_entity_type: "emergency_incident",
  });
  if (numError) throw numError;

  const { error } = await supabase.from("emergency_incidents").insert({
    org_id: orgId,
    incident_number: incidentNumber,
    shipment_id: input.shipmentId || null,
    vehicle_id: input.vehicleId || null,
    type: input.type || "other",
    severity: input.severity || "medium",
    location: input.location || null,
    description: input.description || null,
    status: "open",
    reported_at: new Date().toISOString(),
  });
  if (error) throw error;
}

export async function setEmergencyIncidentStatus(supabase: SupabaseClient, incidentId: string, status: string) {
  const { error } = await supabase
    .from("emergency_incidents")
    .update({
      status,
      resolved_at: status === "resolved" ? new Date().toISOString() : undefined,
    })
    .eq("id", incidentId);
  if (error) throw error;
}
