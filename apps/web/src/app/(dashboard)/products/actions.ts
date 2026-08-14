"use server";

import { revalidatePath } from "next/cache";
import { requireOrgContext } from "@/lib/session";
import {
  createProduct,
  updateProduct,
  setProductActive,
  adjustStock,
  type ProductInput,
} from "@/services/products";

export interface ProductActionState {
  error: string | null;
  success: boolean;
}

export const initialProductActionState: ProductActionState = { error: null, success: false };

function inputFromForm(formData: FormData): ProductInput {
  return {
    sku: String(formData.get("sku") ?? "").trim(),
    name: String(formData.get("name") ?? "").trim(),
    description: String(formData.get("description") ?? "").trim(),
    categoryName: String(formData.get("categoryName") ?? "").trim(),
    unit_of_measure: String(formData.get("unit_of_measure") ?? "each").trim(),
    cost_price: Number(formData.get("cost_price") ?? 0),
    selling_price: Number(formData.get("selling_price") ?? 0),
    reorder_level: Number(formData.get("reorder_level") ?? 0),
  };
}

export async function createProductAction(
  _prev: ProductActionState,
  formData: FormData
): Promise<ProductActionState> {
  const { supabase, orgId, permissions } = await requireOrgContext();

  if (!permissions.has("inventory.manage")) {
    return { error: "You don't have permission to manage products.", success: false };
  }

  const input = inputFromForm(formData);
  if (!input.name) return { error: "Product name is required.", success: false };
  if (!input.sku) return { error: "SKU is required.", success: false };

  try {
    await createProduct(supabase, orgId, input);
  } catch (err) {
    return { error: (err as Error).message, success: false };
  }

  revalidatePath("/products");
  return { error: null, success: true };
}

export async function updateProductAction(
  _prev: ProductActionState,
  formData: FormData
): Promise<ProductActionState> {
  const { supabase, orgId, permissions } = await requireOrgContext();

  if (!permissions.has("inventory.manage")) {
    return { error: "You don't have permission to manage products.", success: false };
  }

  const productId = String(formData.get("productId") ?? "");
  const input = inputFromForm(formData);
  if (!input.name) return { error: "Product name is required.", success: false };
  if (!input.sku) return { error: "SKU is required.", success: false };

  try {
    await updateProduct(supabase, orgId, productId, input);
  } catch (err) {
    return { error: (err as Error).message, success: false };
  }

  revalidatePath("/products");
  return { error: null, success: true };
}

export async function setProductActiveAction(
  _prev: ProductActionState,
  formData: FormData
): Promise<ProductActionState> {
  const { supabase, permissions } = await requireOrgContext();

  if (!permissions.has("inventory.manage")) {
    return { error: "You don't have permission to manage products.", success: false };
  }

  const productId = String(formData.get("productId") ?? "");
  const isActive = String(formData.get("isActive") ?? "") === "true";

  try {
    await setProductActive(supabase, productId, isActive);
  } catch (err) {
    return { error: (err as Error).message, success: false };
  }

  revalidatePath("/products");
  return { error: null, success: true };
}

export async function adjustStockAction(
  _prev: ProductActionState,
  formData: FormData
): Promise<ProductActionState> {
  const { supabase, orgId, permissions } = await requireOrgContext();

  if (!permissions.has("inventory.manage")) {
    return { error: "You don't have permission to adjust stock.", success: false };
  }

  const productId = String(formData.get("productId") ?? "");
  const warehouseId = String(formData.get("warehouseId") ?? "");
  const quantityDelta = Number(formData.get("quantityDelta") ?? 0);
  const reference = String(formData.get("reference") ?? "").trim();

  if (!warehouseId) return { error: "Choose a branch.", success: false };
  if (!quantityDelta) return { error: "Enter a non-zero quantity.", success: false };

  try {
    await adjustStock(supabase, orgId, productId, warehouseId, quantityDelta, reference);
  } catch (err) {
    return { error: (err as Error).message, success: false };
  }

  revalidatePath("/products");
  return { error: null, success: true };
}
