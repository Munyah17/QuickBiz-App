import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/Card";
import { Badge } from "@/components/Badge";
import { EmptyState } from "@/components/EmptyState";
import { Truck } from "lucide-react";
import { requireOrgContext, requireModuleEnabled } from "@/lib/session";
import { listVehicles } from "@/services/fleet";
import { listBranches } from "@/services/branches";
import { listEmployees } from "@/services/hr";
import { NewVehicleModal } from "./NewVehicleModal";
import { LogFuelModal } from "./LogFuelModal";
import { StatusSelect } from "./StatusSelect";

const statusTone: Record<string, "success" | "warning" | "neutral"> = {
  active: "success",
  in_maintenance: "warning",
  inactive: "neutral",
};

export default async function VehiclesPage() {
  const { supabase, orgId, permissions } = await requireOrgContext();
  await requireModuleEnabled(supabase, orgId, "fleet");
  const canManage = permissions.has("fleet.manage");

  const [vehicles, branches, employees] = await Promise.all([
    listVehicles(supabase, orgId),
    listBranches(supabase, orgId),
    listEmployees(supabase, orgId),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <PageHeader title="Fleet" />
        {canManage && (
          <NewVehicleModal
            branches={branches.map((b) => ({ id: b.id, name: b.name }))}
            employees={employees.map((e) => ({ id: e.id, full_name: e.full_name }))}
          />
        )}
      </div>

      <Card>
        {vehicles.length === 0 ? (
          <EmptyState icon={Truck} title="No vehicles yet" />
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border-subtle text-left text-xs font-medium uppercase tracking-wide text-text-tertiary">
                <th className="px-4 py-2.5">Registration</th>
                <th className="px-4 py-2.5">Vehicle</th>
                <th className="px-4 py-2.5">Driver</th>
                <th className="px-4 py-2.5">Branch</th>
                <th className="px-4 py-2.5">Odometer</th>
                <th className="px-4 py-2.5">Status</th>
                {canManage && <th className="px-4 py-2.5" />}
              </tr>
            </thead>
            <tbody>
              {vehicles.map((v) => (
                <tr key={v.id} className="border-b border-border-subtle last:border-b-0">
                  <td className="px-4 py-2.5 font-mono font-medium text-text-primary">{v.registration_number}</td>
                  <td className="px-4 py-2.5 text-text-secondary">
                    {[v.make, v.model, v.year].filter(Boolean).join(" ") || "Not specified"}
                  </td>
                  <td className="px-4 py-2.5 text-text-secondary">{v.driverName ?? "No driver assigned"}</td>
                  <td className="px-4 py-2.5 text-text-secondary">{v.branchName ?? "No branch"}</td>
                  <td className="px-4 py-2.5 text-text-secondary">{v.odometer_km.toLocaleString()} km</td>
                  <td className="px-4 py-2.5">
                    {canManage ? (
                      <StatusSelect vehicleId={v.id} status={v.status} />
                    ) : (
                      <Badge tone={statusTone[v.status] ?? "neutral"}>{v.status.replace("_", " ")}</Badge>
                    )}
                  </td>
                  {canManage && (
                    <td className="px-4 py-2.5 text-right">
                      <LogFuelModal vehicleId={v.id} registration={v.registration_number} currentOdometer={v.odometer_km} />
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
