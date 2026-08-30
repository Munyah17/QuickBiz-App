import { PageHeader } from "@/components/PageHeader";
import { requireOrgContext, requireModuleEnabled } from "@/lib/session";
import { listShipments } from "@/services/logistics";
import { listCustomers } from "@/services/customers";
import { listVehicles } from "@/services/fleet";
import { listEmployees } from "@/services/hr";
import { listInvoices } from "@/services/sales";
import { listOnlineOrders } from "@/services/ecommerce";
import { NewShipmentModal } from "./NewShipmentModal";
import { ShipmentsTable } from "./ShipmentsTable";

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

      <ShipmentsTable shipments={shipments} canManage={canManage} />
    </div>
  );
}
