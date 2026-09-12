import { PageHeader } from "@/components/PageHeader";
import { StatCard } from "@/components/StatCard";
import { Card, CardHeader } from "@/components/Card";
import { BreakdownBarChart } from "@/components/BreakdownBarChart";
import { requireOrgContext, requireModuleEnabled } from "@/lib/session";
import { listVehicles } from "@/services/fleet";
import { listBranches } from "@/services/branches";
import { listEmployees } from "@/services/hr";
import { NewVehicleModal } from "./NewVehicleModal";
import { VehiclesTable } from "./VehiclesTable";

export default async function VehiclesPage() {
  const { supabase, orgId, permissions } = await requireOrgContext();
  await requireModuleEnabled(supabase, orgId, "fleet");
  const canManage = permissions.has("fleet.manage");

  const [vehicles, branches, employees] = await Promise.all([
    listVehicles(supabase, orgId),
    listBranches(supabase, orgId),
    listEmployees(supabase, orgId),
  ]);

  // Calculate statistics
  const totalVehicles = vehicles.length;
  const activeVehicles = vehicles.filter(v => v.status === 'active').length;
  const inMaintenance = vehicles.filter(v => v.status === 'in_maintenance').length;
  const totalOdometer = vehicles.reduce((sum, v) => sum + (v.odometer_km || 0), 0);

  const statusBreakdown = vehicles.reduce((acc, v) => {
    acc[v.status] = (acc[v.status] ?? 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const statusSegments = Object.entries(statusBreakdown).map(([label, value]) => ({ label, value }));

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

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total Vehicles"
          value={totalVehicles.toString()}
          tone="primary"
        />
        <StatCard
          label="Active"
          value={activeVehicles.toString()}
          tone="success"
        />
        <StatCard
          label="In Maintenance"
          value={inMaintenance.toString()}
          tone="warning"
        />
        <StatCard
          label="Total Odometer"
          value={`${(totalOdometer / 1000).toFixed(0)}k km`}
          tone="info"
        />
      </div>

      {statusSegments.length > 0 && (
        <Card>
          <CardHeader title="Vehicles by status" />
          <div className="p-4">
            <BreakdownBarChart segments={statusSegments} />
          </div>
        </Card>
      )}

      <VehiclesTable vehicles={vehicles} canManage={canManage} />
    </div>
  );
}
