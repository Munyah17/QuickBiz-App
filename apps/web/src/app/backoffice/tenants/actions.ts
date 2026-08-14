"use server";

import { revalidatePath } from "next/cache";
import { createServiceRoleClient } from "@quickbiz/supabase/client-service-role";
import { requirePlatformStaff } from "@/lib/platform-session";
import { updateTenantBillingStatus, markSetupFeePaid } from "@/services/platform";

export interface TenantActionState {
  error: string | null;
  success: boolean;
}

export const initialTenantActionState: TenantActionState = { error: null, success: false };

export async function updateTenantStatusAction(
  _prev: TenantActionState,
  formData: FormData
): Promise<TenantActionState> {
  const { permissions } = await requirePlatformStaff();

  if (!permissions.has("tenants.manage")) {
    return { error: "You don't have permission to change tenant status.", success: false };
  }

  const orgId = String(formData.get("orgId") ?? "");
  const status = String(formData.get("status") ?? "") as "active" | "pending" | "past_due" | "cancelled";

  try {
    await updateTenantBillingStatus(createServiceRoleClient(), orgId, status);
  } catch (err) {
    return { error: (err as Error).message, success: false };
  }

  revalidatePath("/backoffice/tenants");
  return { error: null, success: true };
}

export async function toggleSetupFeeAction(
  _prev: TenantActionState,
  formData: FormData
): Promise<TenantActionState> {
  const { permissions } = await requirePlatformStaff();

  if (!permissions.has("tenants.manage")) {
    return { error: "You don't have permission to change tenant status.", success: false };
  }

  const orgId = String(formData.get("orgId") ?? "");
  const paid = String(formData.get("paid") ?? "") === "true";

  try {
    await markSetupFeePaid(createServiceRoleClient(), orgId, paid);
  } catch (err) {
    return { error: (err as Error).message, success: false };
  }

  revalidatePath("/backoffice/tenants");
  return { error: null, success: true };
}
