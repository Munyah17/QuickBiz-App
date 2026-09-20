import { PageHeader } from "@/components/PageHeader";
import { requireDeveloper } from "@/lib/developer-session";
import { listSubmissions, MODULE_HOSTING_FEE_USD, PLATFORM_REVENUE_SHARE } from "@/services/developers";
import { ModulesManager } from "./ModulesManager";

export default async function DeveloperModulesPage() {
  const { supabase, developer } = await requireDeveloper();
  const submissions = await listSubmissions(supabase, developer.id);

  return (
    <div className="flex flex-col gap-4">
      <PageHeader title="My Modules" />
      <p className="max-w-2xl text-sm text-text-tertiary">
        Submit modules to the Module Store. Hosting is ${MODULE_HOSTING_FEE_USD}/month per published module; you
        keep {Math.round((1 - PLATFORM_REVENUE_SHARE) * 100)}% of every license fee. All submissions are reviewed —
        QuickBiz reserves the right to approve, reject, suspend, or remove any module.
      </p>
      <ModulesManager submissions={submissions} />
    </div>
  );
}
