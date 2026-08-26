"use server";

import { revalidatePath } from "next/cache";
import { requireOrgContext } from "@/lib/session";
import { connectIntegration, disconnectIntegration } from "@/services/integrations";

export interface IntegrationActionState {
  error: string | null;
  success: boolean;
}

export const initialIntegrationActionState: IntegrationActionState = { error: null, success: false };

export async function connectIntegrationAction(
  _prev: IntegrationActionState,
  formData: FormData
): Promise<IntegrationActionState> {
  const { supabase, orgId, permissions } = await requireOrgContext();

  if (!permissions.has("integrations.manage")) {
    return { error: "You don't have permission to manage integrations.", success: false };
  }

  const providerKey = String(formData.get("providerKey") ?? "");
  const accountLabel = String(formData.get("accountLabel") ?? "").trim();
  if (!providerKey || !accountLabel) return { error: "Enter an account label.", success: false };

  const fieldNames = formData.getAll("fieldName").map(String);
  const fieldValues = formData.getAll("fieldValue").map(String);
  const credentials: Record<string, string> = {};
  fieldNames.forEach((name, i) => {
    if (name && fieldValues[i]) credentials[name] = fieldValues[i];
  });

  try {
    await connectIntegration(supabase, orgId, providerKey, accountLabel, credentials);
  } catch (err) {
    return { error: (err as Error).message, success: false };
  }

  revalidatePath("/integrations");
  return { error: null, success: true };
}

export async function disconnectIntegrationAction(
  _prev: IntegrationActionState,
  formData: FormData
): Promise<IntegrationActionState> {
  const { supabase, orgId, permissions } = await requireOrgContext();

  if (!permissions.has("integrations.manage")) {
    return { error: "You don't have permission to manage integrations.", success: false };
  }

  const providerKey = String(formData.get("providerKey") ?? "");

  try {
    await disconnectIntegration(supabase, orgId, providerKey);
  } catch (err) {
    return { error: (err as Error).message, success: false };
  }

  revalidatePath("/integrations");
  return { error: null, success: true };
}
