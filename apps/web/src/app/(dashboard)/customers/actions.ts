"use server";

import { revalidatePath } from "next/cache";
import { requireOrgContext } from "@/lib/session";
import { createCustomer, updateCustomer, setCustomerActive, type CustomerInput } from "@/services/customers";

export interface CustomerActionState {
  error: string | null;
  success: boolean;
}

export const initialCustomerActionState: CustomerActionState = { error: null, success: false };

function inputFromForm(formData: FormData): CustomerInput {
  return {
    name: String(formData.get("name") ?? "").trim(),
    customer_type: String(formData.get("customer_type") ?? "business") as CustomerInput["customer_type"],
    email: String(formData.get("email") ?? "").trim(),
    phone: String(formData.get("phone") ?? "").trim(),
    tax_number: String(formData.get("tax_number") ?? "").trim(),
    city: String(formData.get("city") ?? "").trim(),
    country: String(formData.get("country") ?? "").trim(),
  };
}

export async function createCustomerAction(
  _prev: CustomerActionState,
  formData: FormData
): Promise<CustomerActionState> {
  const { supabase, orgId, permissions } = await requireOrgContext();

  if (!permissions.has("customers.manage")) {
    return { error: "You don't have permission to manage customers.", success: false };
  }

  const input = inputFromForm(formData);
  if (!input.name) return { error: "Customer name is required.", success: false };

  try {
    await createCustomer(supabase, orgId, input);
  } catch (err) {
    return { error: (err as Error).message, success: false };
  }

  revalidatePath("/customers");
  return { error: null, success: true };
}

export async function updateCustomerAction(
  _prev: CustomerActionState,
  formData: FormData
): Promise<CustomerActionState> {
  const { supabase, permissions } = await requireOrgContext();

  if (!permissions.has("customers.manage")) {
    return { error: "You don't have permission to manage customers.", success: false };
  }

  const customerId = String(formData.get("customerId") ?? "");
  const input = inputFromForm(formData);
  if (!input.name) return { error: "Customer name is required.", success: false };

  try {
    await updateCustomer(supabase, customerId, input);
  } catch (err) {
    return { error: (err as Error).message, success: false };
  }

  revalidatePath("/customers");
  return { error: null, success: true };
}

export async function setCustomerActiveAction(
  _prev: CustomerActionState,
  formData: FormData
): Promise<CustomerActionState> {
  const { supabase, permissions } = await requireOrgContext();

  if (!permissions.has("customers.manage")) {
    return { error: "You don't have permission to manage customers.", success: false };
  }

  const customerId = String(formData.get("customerId") ?? "");
  const isActive = String(formData.get("isActive") ?? "") === "true";

  try {
    await setCustomerActive(supabase, customerId, isActive);
  } catch (err) {
    return { error: (err as Error).message, success: false };
  }

  revalidatePath("/customers");
  return { error: null, success: true };
}

export async function bulkSetCustomerActiveAction(customerIds: string[], isActive: boolean): Promise<CustomerActionState> {
  const { supabase, permissions } = await requireOrgContext();

  if (!permissions.has("customers.manage")) {
    return { error: "You don't have permission to manage customers.", success: false };
  }
  if (customerIds.length === 0) return { error: "No customers selected.", success: false };

  try {
    await Promise.all(customerIds.map((id) => setCustomerActive(supabase, id, isActive)));
  } catch (err) {
    return { error: (err as Error).message, success: false };
  }

  revalidatePath("/customers");
  return { error: null, success: true };
}
