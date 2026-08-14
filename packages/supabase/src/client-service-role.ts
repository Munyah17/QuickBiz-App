import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

// Bypasses RLS entirely. Import this ONLY inside server actions/route handlers
// that need Supabase Auth admin APIs (e.g. inviteUserByEmail) — never for
// ordinary data access, and never anywhere that could be bundled client-side.
export function createServiceRoleClient() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
