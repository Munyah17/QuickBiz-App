"use server";

import { revalidatePath } from "next/cache";
import { requireOrgContext } from "@/lib/session";
import { createCustomer, updateCustomer, setCustomerActive, importCustomers, type CustomerInput, type CustomerImportResult } from "@/services/customers";

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
    credit_limit: formData.get("credit_limit") ? Number(formData.get("credit_limit")) : null,
    payment_terms_days: formData.get("payment_terms_days") ? Number(formData.get("payment_terms_days")) : null,
    notes: String(formData.get("notes") ?? "").trim(),
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
  revalidatePath(`/customers/${customerId}`);
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

export interface CustomerImportActionState {
  result: CustomerImportResult | null;
  error: string | null;
}

export const initialCustomerImportActionState: CustomerImportActionState = { result: null, error: null };

export async function importCustomersAction(
  _prev: CustomerImportActionState,
  formData: FormData
): Promise<CustomerImportActionState> {
  const { supabase, orgId, permissions } = await requireOrgContext();

  if (!permissions.has("customers.manage")) {
    return { result: null, error: "You don't have permission to manage customers." };
  }

  let rows: CustomerInput[];
  try {
    rows = JSON.parse(String(formData.get("rows") ?? "[]"));
  } catch {
    return { result: null, error: "Invalid import payload." };
  }
  if (rows.length === 0) return { result: null, error: "Nothing to import." };
  if (rows.length > 500) return { result: null, error: "Import at most 500 customers at a time." };

  try {
    const result = await importCustomers(supabase, orgId, rows);
    revalidatePath("/customers");
    return { result, error: null };
  } catch (err) {
    return { result: null, error: (err as Error).message };
  }
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
