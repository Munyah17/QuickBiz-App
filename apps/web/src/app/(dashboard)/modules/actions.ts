"use server";

import { revalidatePath } from "next/cache";
import { requireOrgContext } from "@/lib/session";
import { setModuleStatus, IMPLEMENTED_MODULE_KEYS } from "@/services/modules";

export interface ModuleActionState {
  error: string | null;
  success: boolean;
}

export const initialModuleActionState: ModuleActionState = { error: null, success: false };

export async function toggleModuleAction(_prev: ModuleActionState, formData: FormData): Promise<ModuleActionState> {
  const { supabase, orgId, permissions } = await requireOrgContext();

  if (!permissions.has("modules.manage")) {
    return { error: "You don't have permission to change module activation.", success: false };
  }

  const moduleKey = String(formData.get("moduleKey") ?? "");
  const nextStatus = String(formData.get("nextStatus") ?? "") as "enabled" | "disabled";

  if (!IMPLEMENTED_MODULE_KEYS.has(moduleKey)) {
    return { error: "This module isn't built yet.", success: false };
  }

  try {
    await setModuleStatus(supabase, orgId, moduleKey, nextStatus);
  } catch (err) {
    return { error: (err as Error).message, success: false };
  }

  // Nav visibility (Sidebar, in the shared layout) depends on enabled modules.
  revalidatePath("/", "layout");
  return { error: null, success: true };
}
