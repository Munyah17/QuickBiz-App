import { PageHeader } from "@/components/PageHeader";
import { createServiceRoleClient } from "@quickbiz/supabase/client-service-role";
import { requirePlatformStaff, requirePlatformPermission } from "@/lib/platform-session";
import { listPlatformStaff, listPlatformRoles } from "@/services/platform";
import { StaffTable } from "./StaffTable";

export default async function BackofficeStaffPage() {
  const { permissions } = await requirePlatformStaff();
  requirePlatformPermission(permissions, "staff.manage");

  const service = createServiceRoleClient();
  const [staff, roles] = await Promise.all([listPlatformStaff(service), listPlatformRoles(service)]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Platform Staff" />
      <StaffTable staff={staff} roles={roles} />
    </div>
  );
}
