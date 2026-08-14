import { PageHeader } from "@/components/PageHeader";
import { StatCard } from "@/components/StatCard";
import { createServiceRoleClient } from "@quickbiz/supabase/client-service-role";
import { requirePlatformStaff, requirePlatformPermission } from "@/lib/platform-session";
import { getPlatformStats } from "@/services/platform";

export default async function BackofficeOverviewPage() {
  const { permissions } = await requirePlatformStaff();
  requirePlatformPermission(permissions, "tenants.view");

  const service = createServiceRoleClient();
  const stats = await getPlatformStats(service);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Platform Overview" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Tenants" value={String(stats.tenantCount)} />
        <StatCard label="Active subscriptions" value={String(stats.activeSubscriptions)} />
        <StatCard label="Payment pending" value={String(stats.pendingSubscriptions)} />
        <StatCard label="Platform staff" value={String(stats.staffCount)} />
      </div>
    </div>
  );
}
