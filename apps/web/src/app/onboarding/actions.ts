"use server";

import { redirect } from "next/navigation";
import { createClient } from "@quickbiz/supabase/client-server";
import { createOrganization } from "@/services/org";
import { requireUser } from "@/lib/session";
import type { ActionState } from "@/app/actions/auth";

export async function createOrganizationAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireUser();
  const companyName = String(formData.get("companyName") ?? "").trim();

  if (!companyName) {
    return { error: "Company name is required." };
  }

  const supabase = await createClient();
  await createOrganization(supabase, companyName, "Head Office");
  redirect("/dashboard");
}
