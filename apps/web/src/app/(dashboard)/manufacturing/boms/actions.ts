"use server";

import { revalidatePath } from "next/cache";
import { requireOrgContext, requireModuleEnabled } from "@/lib/session";
import { createBom, type BomComponentInput } from "@/services/manufacturing";

export interface BomActionState {
  error: string | null;
  success: boolean;
}

export const initialBomActionState: BomActionState = { error: null, success: false };

export async function createBomAction(_prev: BomActionState, formData: FormData): Promise<BomActionState> {
  const { supabase, orgId, permissions } = await requireOrgContext();
  await requireModuleEnabled(supabase, orgId, "manufacturing");

  if (!permissions.has("manufacturing.manage")) {
    return { error: "You don't have permission to create bills of materials.", success: false };
  }

  const productId = String(formData.get("productId") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  if (!productId) return { error: "Choose the finished product this BOM builds.", success: false };
  if (!name) return { error: "Name is required.", success: false };

  const componentIds = formData.getAll("componentProductId").map(String);
  const quantities = formData.getAll("quantityPerUnit").map(Number);
  const components: BomComponentInput[] = componentIds.map((componentProductId, i) => ({
    componentProductId,
    quantityPerUnit: quantities[i] ?? 0,
  }));

  if (components.filter((c) => c.componentProductId && c.quantityPerUnit > 0).length === 0) {
    return { error: "Add at least one component with a quantity.", success: false };
  }

  try {
    await createBom(supabase, orgId, { productId, name, components });
  } catch (err) {
    return { error: (err as Error).message, success: false };
  }

  revalidatePath("/manufacturing/boms");
  return { error: null, success: true };
}
