import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/Card";
import { Badge } from "@/components/Badge";
import { EmptyState } from "@/components/EmptyState";
import { Building2 } from "lucide-react";
import { createServiceRoleClient } from "@quickbiz/supabase/client-service-role";
import { requirePlatformStaff, requirePlatformPermission } from "@/lib/platform-session";
import { listAllTenants } from "@/services/platform";
import { TenantStatusButton } from "./TenantStatusButton";
import { SetupFeeButton } from "./SetupFeeButton";

const statusTone: Record<string, "success" | "info" | "warning" | "danger" | "neutral"> = {
  active: "success",
  pending: "warning",
  past_due: "warning",
  cancelled: "danger",
};

export default async function BackofficeTenantsPage() {
  const { permissions } = await requirePlatformStaff();
  requirePlatformPermission(permissions, "tenants.view");
  const canManage = permissions.has("tenants.manage");

  const tenants = await listAllTenants(createServiceRoleClient());

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Tenants" />

      <Card>
        {tenants.length === 0 ? (
          <EmptyState icon={Building2} title="No tenants yet" />
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border-subtle text-left text-xs font-medium uppercase tracking-wide text-text-tertiary">
                <th className="px-4 py-2.5">Organization</th>
                <th className="px-4 py-2.5">Setup fee</th>
                <th className="px-4 py-2.5">Modules</th>
                <th className="px-4 py-2.5">Monthly</th>
                <th className="px-4 py-2.5">Status</th>
                <th className="px-4 py-2.5">Seats</th>
                <th className="px-4 py-2.5">Branches</th>
                <th className="px-4 py-2.5">Created</th>
                {canManage && <th className="px-4 py-2.5" />}
              </tr>
            </thead>
            <tbody>
              {tenants.map((tenant) => (
                <tr key={tenant.id} className="border-b border-border-subtle last:border-b-0">
                  <td className="px-4 py-2.5 font-medium text-text-primary">{tenant.name}</td>
                  <td className="px-4 py-2.5">
                    <Badge tone={tenant.setupFeePaid ? "success" : "warning"}>
                      {tenant.setupFeePaid ? "Paid" : "Unpaid"}
                    </Badge>
                  </td>
                  <td className="px-4 py-2.5 text-text-secondary">{tenant.enabledModuleCount}</td>
                  <td className="px-4 py-2.5 text-text-secondary">${tenant.monthlyTotalUsd.toFixed(2)}/mo</td>
                  <td className="px-4 py-2.5">
                    <Badge tone={statusTone[tenant.billingStatus] ?? "neutral"}>{tenant.billingStatus}</Badge>
                  </td>
                  <td className="px-4 py-2.5 text-text-secondary">{tenant.memberCount}</td>
                  <td className="px-4 py-2.5 text-text-secondary">{tenant.branchCount}</td>
                  <td className="px-4 py-2.5 text-text-secondary">
                    {new Date(tenant.createdAt).toLocaleDateString()}
                  </td>
                  {canManage && (
                    <td className="px-4 py-2.5">
                      <div className="flex items-center justify-end gap-3">
                        <SetupFeeButton orgId={tenant.id} paid={tenant.setupFeePaid} />
                        <TenantStatusButton orgId={tenant.id} currentStatus={tenant.billingStatus} />
                      </div>
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
