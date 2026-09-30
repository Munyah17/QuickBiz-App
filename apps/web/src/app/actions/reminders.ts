"use server";

import { requireOrgContext } from "@/lib/session";
import { runReminderSweep } from "@/services/reminders";

/**
 * Fired once per dashboard mount by <ReminderSweep />. Org membership is
 * re-verified server-side (requireOrgContext) — the client never passes an
 * org id. Dedupe keys in the DB make repeat calls harmless.
 */
export async function runReminderSweepAction(): Promise<number> {
  const { supabase, orgId } = await requireOrgContext();
  return runReminderSweep(supabase, orgId);
}
