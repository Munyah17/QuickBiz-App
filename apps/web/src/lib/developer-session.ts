import "server-only";
import { redirect } from "next/navigation";
import { requireUser } from "./session";
import { getDeveloperByUser, type DeveloperProfile } from "@/services/developers";

/**
 * Developer portal auth: a logged-in user with a developer profile.
 * Developers are a separate audience from org members — no org context here.
 * Users without a profile are sent to onboarding to create one.
 */
export async function requireDeveloper(): Promise<{
  supabase: Awaited<ReturnType<typeof requireUser>>["supabase"];
  user: Awaited<ReturnType<typeof requireUser>>["user"];
  developer: DeveloperProfile;
}> {
  const { supabase, user } = await requireUser();
  const developer = await getDeveloperByUser(supabase, user.id);
  if (!developer) redirect("/developers/onboarding");
  if (developer.status === "suspended") redirect("/developers/suspended");
  return { supabase, user, developer };
}
