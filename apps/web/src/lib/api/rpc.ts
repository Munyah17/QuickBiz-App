import "server-only";
import { createServiceRoleClient } from "@quickbiz/supabase/client-service-role";

// database.types.ts is generated from the live DB, so RPCs added by a new
// migration aren't in the type union until types are regenerated. This
// helper keeps call sites typed without hand-editing generated files.
interface RpcResult<T> {
  data: T | null;
  error: { message: string } | null;
}

export async function callApiRpc<T = unknown>(
  fn: string,
  args: Record<string, unknown>
): Promise<RpcResult<T>> {
  const supabase = createServiceRoleClient();
  const rpc = supabase.rpc as unknown as (
    name: string,
    params: Record<string, unknown>
  ) => Promise<RpcResult<T>>;
  return rpc(fn, args);
}
