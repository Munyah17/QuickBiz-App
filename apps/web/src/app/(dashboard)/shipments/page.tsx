import { Truck } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/Card";
import { Badge } from "@/components/Badge";
import { EmptyState } from "@/components/EmptyState";
import { requireOrgContext, requireModuleEnabled } from "@/lib/session";
import { listShipments } from "@/services/logistics";
import { listCustomers } from "@/services/customers";
import { listVehicles } from "@/services/fleet";
import { listEmployees } from "@/services/hr";
import { listInvoices } from "@/services/sales";
import { listOnlineOrders } from "@/services/ecommerce";
import { NewShipmentModal } from "./NewShipmentModal";
import { StatusSelect } from "./StatusSelect";

const statusTone: Record<string, "success" | "info" | "warning" | "danger" | "neutral"> = {
  pending: "neutral",
  dispatched: "info",
  in_transit: "info",
  delivered: "success",
  failed: "danger",
  returned: "danger",
};

export default async function ShipmentsPage() {
  const { supabase, orgId, permissions } = await requireOrgContext();
  await requireModuleEnabled(supabase, orgId, "logistics");
  const canManage = permissions.has("logistics.manage");

  const { data: member } = await supabase.from("org_members").select("branch_id").eq("status", "active").limit(1).maybeSingle();

  const [shipments, customers, vehicles, employees, invoices, onlineOrders] = await Promise.all([
    listShipments(supabase, orgId),
    listCustomers(supabase, orgId),
    listVehicles(supabase, orgId),
    listEmployees(supabase, orgId),
    listInvoices(supabase, orgId),
    listOnlineOrders(supabase, orgId),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <PageHeader module="Logistics" title="Shipments" />
        {canManage && (
          <NewShipmentModal
            branchId={(member?.branch_id as string) ?? ""}
            customers={customers.filter((c) => c.is_active)}
            vehicles={vehicles}
            employees={employees}
            invoices={invoices}
            onlineOrders={onlineOrders}
          />
        )}
      </div>

      <p className="text-sm text-text-tertiary">
        Track deliveries against your own vehicles or a 3rd-party courier, optionally linked back to the sales
        invoice or online order they are fulfilling.
      </p>

      <Card>
        {shipments.length === 0 ? (
          <EmptyState icon={Truck} title="No shipments yet" />
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border-subtle text-left text-xs font-medium uppercase tracking-wide text-text-tertiary">
                <th className="px-4 py-2.5">Shipment #</th>
                <th className="px-4 py-2.5">Customer</th>
                <th className="px-4 py-2.5">Carrier / Vehicle</th>
                <th className="px-4 py-2.5">Reference</th>
                <th className="px-4 py-2.5">Delivery address</th>
                <th className="px-4 py-2.5">Dispatched</th>
                <th className="px-4 py-2.5">Delivered</th>
                <th className="px-4 py-2.5">Status</th>
              </tr>
            </thead>
            <tbody>
              {shipments.map((s) => (
                <tr key={s.id} className="border-b border-border-subtle last:border-b-0">
                  <td className="px-4 py-2.5 font-mono font-medium text-text-primary">{s.shipment_number}</td>
                  <td className="px-4 py-2.5 text-text-secondary">{s.customerName ?? "Not specified"}</td>
                  <td className="px-4 py-2.5 text-text-secondary">
                    {s.carrier ?? (s.vehicleRegistration ? `Own: ${s.vehicleRegistration}` : "Not assigned")}
                    {s.driverName && <span className="block text-xs text-text-tertiary">{s.driverName}</span>}
                  </td>
                  <td className="px-4 py-2.5 text-text-secondary">
                    {s.invoiceNumber ?? s.onlineOrderNumber ?? "Not linked"}
                    {s.tracking_number && <span className="block text-xs text-text-tertiary">Tracking: {s.tracking_number}</span>}
                  </td>
                  <td className="max-w-xs truncate px-4 py-2.5 text-text-secondary">{s.delivery_address ?? "Not specified"}</td>
                  <td className="px-4 py-2.5 text-text-secondary">{s.dispatched_at ? new Date(s.dispatched_at).toLocaleDateString() : "Not yet"}</td>
                  <td className="px-4 py-2.5 text-text-secondary">{s.delivered_at ? new Date(s.delivered_at).toLocaleDateString() : "Not yet"}</td>
                  <td className="px-4 py-2.5">
                    {canManage ? (
                      <StatusSelect shipmentId={s.id} status={s.status} />
                    ) : (
                      <Badge tone={statusTone[s.status] ?? "neutral"}>{s.status.replace("_", " ")}</Badge>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
