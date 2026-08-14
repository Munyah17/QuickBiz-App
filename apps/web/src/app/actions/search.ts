"use server";

import { createClient } from "@quickbiz/supabase/client-server";
import { searchWorkspace } from "@/services/search";
import { requireOrgContext } from "@/lib/session";

export async function searchWorkspaceAction(query: string) {
  const { orgId } = await requireOrgContext();
  const supabase = await createClient();
  return searchWorkspace(supabase, orgId, query);
}
