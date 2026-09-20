import { requireUser } from "@/lib/session";
import { getDeveloperByUser } from "@/services/developers";
import { redirect } from "next/navigation";
import { OnboardingForm } from "./OnboardingForm";

export default async function DeveloperOnboarding() {
  const { supabase, user } = await requireUser();
  const existing = await getDeveloperByUser(supabase, user.id);
  if (existing) redirect("/developers");

  return (
    <div className="flex min-h-screen items-center justify-center bg-workspace p-6">
      <div className="w-full max-w-md rounded-lg border border-border bg-surface p-6">
        <h1 className="text-lg font-semibold text-text-primary">Become a developer</h1>
        <p className="mt-1 text-sm text-text-tertiary">
          Create your developer profile to build modules, get API keys, and sell on the Module Store.
        </p>
        <OnboardingForm defaultEmail={user.email ?? ""} />
      </div>
    </div>
  );
}
