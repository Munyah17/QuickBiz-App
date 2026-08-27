"use server";

import { revalidatePath } from "next/cache";
import { requireOrgContext, requireModuleEnabled } from "@/lib/session";
import { saveCustomCode, rollbackCustomCode, type CustomCodeType } from "@/services/customCode";

export interface CustomCodeActionState {
  error: string | null;
  success: boolean;
}

export const initialCustomCodeActionState: CustomCodeActionState = { error: null, success: false };

export async function saveCustomCodeAction(_prev: CustomCodeActionState, formData: FormData): Promise<CustomCodeActionState> {
  const { supabase, orgId, permissions } = await requireOrgContext();
  await requireModuleEnabled(supabase, orgId, "custom_code");

  if (!permissions.has("custom_code.manage")) {
    return { error: "You don't have permission to edit custom code.", success: false };
  }

  const codeType = String(formData.get("codeType") ?? "") as CustomCodeType;
  const content = String(formData.get("content") ?? "");

  try {
    await saveCustomCode(supabase, orgId, codeType, content);
  } catch (err) {
    return { error: (err as Error).message, success: false };
  }

  revalidatePath("/custom-code");
  revalidatePath("/", "layout");
  return { error: null, success: true };
}

export async function rollbackCustomCodeAction(_prev: CustomCodeActionState, formData: FormData): Promise<CustomCodeActionState> {
  const { supabase, orgId, permissions } = await requireOrgContext();

  if (!permissions.has("custom_code.manage")) {
    return { error: "You don't have permission to edit custom code.", success: false };
  }

  const codeType = String(formData.get("codeType") ?? "") as CustomCodeType;
  const targetVersion = Number(formData.get("targetVersion") ?? 0);

  try {
    await rollbackCustomCode(supabase, orgId, codeType, targetVersion);
  } catch (err) {
    return { error: (err as Error).message, success: false };
  }

  revalidatePath("/custom-code");
  revalidatePath("/", "layout");
  return { error: null, success: true };
}
