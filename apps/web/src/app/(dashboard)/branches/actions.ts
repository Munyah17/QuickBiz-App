"use server";

import { revalidatePath } from "next/cache";
import { requireOrgContext } from "@/lib/session";
import { createBranch, updateBranch, type Branch } from "@/services/branches";

export interface BranchActionState {
  error: string | null;
  success: boolean;
}

const initial: BranchActionState = { error: null, success: false };
export { initial as initialBranchActionState };

export async function createBranchAction(_prev: BranchActionState, formData: FormData): Promise<BranchActionState> {
  const { supabase, orgId } = await requireOrgContext();

  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "Branch name is required.", success: false };

  try {
    await createBranch(supabase, orgId, {
      name,
      code: String(formData.get("code") ?? "").trim() || undefined,
      type: String(formData.get("type") ?? "branch") as Branch["type"],
      city: String(formData.get("city") ?? "").trim() || undefined,
      country: String(formData.get("country") ?? "Zimbabwe").trim(),
    });
  } catch (err) {
    return { error: (err as Error).message, success: false };
  }

  revalidatePath("/branches");
  return { error: null, success: true };
}

export async function updateBranchAction(_prev: BranchActionState, formData: FormData): Promise<BranchActionState> {
  const { supabase } = await requireOrgContext();

  const branchId = String(formData.get("branchId") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "Branch name is required.", success: false };

  try {
    await updateBranch(supabase, branchId, {
      name,
      code: String(formData.get("code") ?? "").trim() || undefined,
      type: String(formData.get("type") ?? "branch") as Branch["type"],
      city: String(formData.get("city") ?? "").trim() || undefined,
      country: String(formData.get("country") ?? "Zimbabwe").trim(),
      is_active: formData.get("is_active") === "on",
    });
  } catch (err) {
    return { error: (err as Error).message, success: false };
  }

  revalidatePath("/branches");
  return { error: null, success: true };
}
