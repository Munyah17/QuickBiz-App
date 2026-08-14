import type { TypedSupabaseClient as SupabaseClient } from "@quickbiz/supabase/types";

export interface Branch {
  id: string;
  name: string;
  code: string | null;
  type: "head_office" | "branch" | "warehouse";
  address: { street?: string; city?: string; country?: string };
  is_active: boolean;
  created_at: string;
}

export async function listBranches(supabase: SupabaseClient, orgId: string): Promise<Branch[]> {
  const { data, error } = await supabase
    .from("branches")
    .select("id, name, code, type, address, is_active, created_at")
    .eq("org_id", orgId)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return data as Branch[];
}

export async function createBranch(
  supabase: SupabaseClient,
  orgId: string,
  input: { name: string; code?: string; type: Branch["type"]; city?: string; country?: string }
) {
  const { error } = await supabase.from("branches").insert({
    org_id: orgId,
    name: input.name,
    code: input.code || null,
    type: input.type,
    address: { city: input.city, country: input.country },
  });

  if (error) throw error;
}

export async function updateBranch(
  supabase: SupabaseClient,
  branchId: string,
  input: { name: string; code?: string; type: Branch["type"]; city?: string; country?: string; is_active: boolean }
) {
  const { error } = await supabase
    .from("branches")
    .update({
      name: input.name,
      code: input.code || null,
      type: input.type,
      address: { city: input.city, country: input.country },
      is_active: input.is_active,
    })
    .eq("id", branchId);

  if (error) throw error;
}
