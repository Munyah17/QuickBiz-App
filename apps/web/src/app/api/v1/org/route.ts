import { createServiceRoleClient } from "@quickbiz/supabase/client-service-role";
import { apiHandler } from "@/lib/api/handler";

// GET /api/v1/org — the target org's profile. Cheapest endpoint; useful for
// verifying a key + x-org-id pair works.
export const GET = apiHandler({ endpoint: "GET /v1/org" }, async (_request, ctx) => {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("organizations")
    .select("id, name, legal_name, currency")
    .eq("id", ctx.orgId)
    .single();
  if (error) throw error;
  return { organization: data };
});
