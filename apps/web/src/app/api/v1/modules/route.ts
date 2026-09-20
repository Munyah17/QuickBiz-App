import { createServiceRoleClient } from "@quickbiz/supabase/client-service-role";
import { apiHandler } from "@/lib/api/handler";

// GET /api/v1/modules — modules enabled on the target org. Lets a module
// check which sibling modules it can integrate with.
export const GET = apiHandler({ endpoint: "GET /v1/modules" }, async (_request, ctx) => {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("org_modules")
    .select("module_key, status")
    .eq("org_id", ctx.orgId)
    .eq("status", "enabled");
  if (error) throw error;
  return { modules: (data ?? []).map((m) => m.module_key) };
});
