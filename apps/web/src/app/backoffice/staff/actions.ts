"use server";

import { revalidatePath } from "next/cache";
import { createServiceRoleClient } from "@quickbiz/supabase/client-service-role";
import { requirePlatformStaff } from "@/lib/platform-session";
import { invitePlatformStaff, updatePlatformStaffStatus } from "@/services/platform";

export interface StaffActionState {
  error: string | null;
  success: boolean;
}

export const initialStaffActionState: StaffActionState = { error: null, success: false };

export async function inviteStaffAction(_prev: StaffActionState, formData: FormData): Promise<StaffActionState> {
  const { permissions } = await requirePlatformStaff();

  if (!permissions.has("staff.manage")) {
    return { error: "You don't have permission to manage staff.", success: false };
  }

  const email = String(formData.get("email") ?? "").trim();
  const roleKey = String(formData.get("roleKey") ?? "");
  if (!email) return { error: "Email is required.", success: false };

  try {
    await invitePlatformStaff(createServiceRoleClient(), email, roleKey);
  } catch (err) {
    return { error: (err as Error).message, success: false };
  }

  revalidatePath("/backoffice/staff");
  return { error: null, success: true };
}

export async function updateStaffStatusAction(
  _prev: StaffActionState,
  formData: FormData
): Promise<StaffActionState> {
  const { permissions } = await requirePlatformStaff();

  if (!permissions.has("staff.manage")) {
    return { error: "You don't have permission to manage staff.", success: false };
  }

  const staffId = String(formData.get("staffId") ?? "");
  const status = String(formData.get("status") ?? "") as "active" | "suspended";

  try {
    await updatePlatformStaffStatus(createServiceRoleClient(), staffId, status);
  } catch (err) {
    return { error: (err as Error).message, success: false };
  }

  revalidatePath("/backoffice/staff");
  return { error: null, success: true };
}
