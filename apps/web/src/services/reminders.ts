import type { TypedSupabaseClient as SupabaseClient } from "@quickbiz/supabase/types";

/**
 * Runs the time-based reminder sweep for the calling user inside an org.
 * All logic lives in the `generate_reminders` SQL function (security definer,
 * deduped via notifications.dedupe_key) so it can also be scheduled later via
 * pg_cron without changes here. Returns how many notifications were created.
 */
export async function runReminderSweep(supabase: SupabaseClient, orgId: string): Promise<number> {
  const { data, error } = await supabase.rpc("generate_reminders", { p_org_id: orgId });
  if (error) throw error;
  return (data as number) ?? 0;
}
