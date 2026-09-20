import { PageHeader } from "@/components/PageHeader";
import { requireDeveloper } from "@/lib/developer-session";
import { listApiKeys } from "@/services/developers";
import { KeysManager } from "./KeysManager";

export default async function ApiKeysPage() {
  const { supabase, developer } = await requireDeveloper();
  const keys = await listApiKeys(supabase, developer.id);

  return (
    <div className="flex flex-col gap-4">
      <PageHeader title="API Keys" />
      <p className="max-w-2xl text-sm text-text-tertiary">
        <strong className="text-text-secondary">Public keys</strong> (qb_pk_…) let your modules access orgs that
        licensed them — send the org as <code className="rounded bg-workspace px-1">x-org-id</code>.{" "}
        <strong className="text-text-secondary">Private keys</strong> (qb_sk_…) are bound to your own organization
        for B2B integrations.
      </p>
      <KeysManager keys={keys} />
    </div>
  );
}
