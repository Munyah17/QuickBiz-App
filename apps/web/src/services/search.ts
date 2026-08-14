import type { TypedSupabaseClient as SupabaseClient } from "@quickbiz/supabase/types";

export interface SearchResult {
  type: "branch" | "user" | "customer" | "product" | "invoice";
  id: string;
  label: string;
  sublabel: string;
  href: string;
}

export async function searchWorkspace(supabase: SupabaseClient, orgId: string, query: string): Promise<SearchResult[]> {
  if (query.trim().length < 2) return [];
  const term = `%${query.trim()}%`;

  const [branches, members, customers, products, invoices] = await Promise.all([
    supabase.from("branches").select("id, name, code").eq("org_id", orgId).ilike("name", term).limit(5),
    supabase
      .from("org_members")
      .select("id, profiles!inner(full_name)")
      .eq("org_id", orgId)
      .ilike("profiles.full_name", term)
      .limit(5),
    supabase.from("customers").select("id, name, email").eq("org_id", orgId).ilike("name", term).limit(5),
    supabase.from("products").select("id, name, sku").eq("org_id", orgId).ilike("name", term).limit(5),
    supabase
      .from("sales_invoices")
      .select("id, invoice_number")
      .eq("org_id", orgId)
      .ilike("invoice_number", term)
      .limit(5),
  ]);

  const branchResults: SearchResult[] = (branches.data ?? []).map((b: { id: string; name: string; code: string | null }) => ({
    type: "branch",
    id: b.id,
    label: b.name,
    sublabel: b.code ? `Branch · ${b.code}` : "Branch",
    href: "/branches",
  }));

  const memberResults: SearchResult[] = (members.data as unknown as Array<{ id: string; profiles: { full_name: string | null } | null }> ?? [])
    .filter((m) => m.profiles?.full_name)
    .map((m) => ({
      type: "user",
      id: m.id,
      label: m.profiles!.full_name as string,
      sublabel: "User",
      href: "/users",
    }));

  const customerResults: SearchResult[] = (customers.data ?? []).map((c: { id: string; name: string; email: string | null }) => ({
    type: "customer",
    id: c.id,
    label: c.name,
    sublabel: c.email ? `Customer · ${c.email}` : "Customer",
    href: "/customers",
  }));

  const productResults: SearchResult[] = (products.data ?? []).map((p: { id: string; name: string; sku: string }) => ({
    type: "product",
    id: p.id,
    label: p.name,
    sublabel: `Product · ${p.sku}`,
    href: "/products",
  }));

  const invoiceResults: SearchResult[] = (invoices.data ?? []).map((i: { id: string; invoice_number: string }) => ({
    type: "invoice",
    id: i.id,
    label: i.invoice_number,
    sublabel: "Invoice",
    href: `/sales/${i.id}`,
  }));

  return [...branchResults, ...memberResults, ...customerResults, ...productResults, ...invoiceResults];
}
