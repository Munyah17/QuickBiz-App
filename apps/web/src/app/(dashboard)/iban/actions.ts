"use server";

import { revalidatePath } from "next/cache";
import { requireOrgContext, requireModuleEnabled } from "@/lib/session";
import { requestIban } from "@/services/iban";

export interface IbanActionState {
  error: string | null;
  success: boolean;
}

export const initialIbanActionState: IbanActionState = { error: null, success: false };

export async function requestIbanAction(_prev: IbanActionState, formData: FormData): Promise<IbanActionState> {
  const { supabase, orgId, permissions } = await requireOrgContext();
  await requireModuleEnabled(supabase, orgId, "iban");

  if (!permissions.has("iban.manage")) {
    return { error: "You don't have permission to request an IBAN.", success: false };
  }

  const currency = String(formData.get("currency") ?? "EUR");
  const notes = String(formData.get("notes") ?? "").trim();

  try {
    await requestIban(supabase, orgId, { currency, notes });
  } catch (err) {
    return { error: (err as Error).message, success: false };
  }

  revalidatePath("/iban");
  return { error: null, success: true };
}
