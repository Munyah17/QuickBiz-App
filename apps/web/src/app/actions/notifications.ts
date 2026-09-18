"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@quickbiz/supabase/client-server";
import { markNotificationRead, markAllNotificationsRead } from "@/services/notifications";
import { requireUser } from "@/lib/session";

export async function markNotificationReadAction(id: string) {
  await requireUser();
  const supabase = await createClient();
  await markNotificationRead(supabase, id);
  revalidatePath("/", "layout");
}

export async function markAllNotificationsReadAction() {
  await requireUser();
  const supabase = await createClient();
  await markAllNotificationsRead(supabase);
  revalidatePath("/", "layout");
}
