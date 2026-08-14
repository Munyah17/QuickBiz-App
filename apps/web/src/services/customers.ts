import type { TypedSupabaseClient as SupabaseClient } from "@quickbiz/supabase/types";

export interface Customer {
  id: string;
  name: string;
  customer_type: "individual" | "business";
  email: string | null;
  phone: string | null;
  tax_number: string | null;
  address: { city?: string; country?: string; street?: string };
  is_active: boolean;
  created_at: string;
}

export async function listCustomers(supabase: SupabaseClient, orgId: string): Promise<Customer[]> {
  const { data, error } = await supabase
    .from("customers")
    .select("id, name, customer_type, email, phone, tax_number, address, is_active, created_at")
    .eq("org_id", orgId)
    .order("name");
  if (error) throw error;
  return data as unknown as Customer[];
}

export interface CustomerInput {
  name: string;
  customer_type: "individual" | "business";
  email: string;
  phone: string;
  tax_number: string;
  city: string;
  country: string;
}

export async function createCustomer(supabase: SupabaseClient, orgId: string, input: CustomerInput) {
  const { error } = await supabase.from("customers").insert({
    org_id: orgId,
    name: input.name,
    customer_type: input.customer_type,
    email: input.email || null,
    phone: input.phone || null,
    tax_number: input.tax_number || null,
    address: { city: input.city || undefined, country: input.country || undefined },
  });
  if (error) throw error;
}

export async function updateCustomer(supabase: SupabaseClient, customerId: string, input: CustomerInput) {
  const { error } = await supabase
    .from("customers")
    .update({
      name: input.name,
      customer_type: input.customer_type,
      email: input.email || null,
      phone: input.phone || null,
      tax_number: input.tax_number || null,
      address: { city: input.city || undefined, country: input.country || undefined },
    })
    .eq("id", customerId);
  if (error) throw error;
}

export async function setCustomerActive(supabase: SupabaseClient, customerId: string, isActive: boolean) {
  const { error } = await supabase.from("customers").update({ is_active: isActive }).eq("id", customerId);
  if (error) throw error;
}
