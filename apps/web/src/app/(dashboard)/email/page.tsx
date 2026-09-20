import { PageHeader } from "@/components/PageHeader";
import { requireOrgContext, requireModuleEnabled, requirePermission } from "@/lib/session";
import { getEmailSettings, listEmailLogs } from "@/services/email";
import { SettingsForm } from "./SettingsForm";
import { EmailLogTable } from "./EmailLogTable";

export default async function EmailPage() {
  const { supabase, orgId, permissions } = await requireOrgContext();
  await requireModuleEnabled(supabase, orgId, "documents");
  requirePermission(permissions, "email.view");

  const canManage = permissions.has("email.manage");
  const canSend = permissions.has("email.send");

  const [settings, logs] = await Promise.all([
    canManage ? getEmailSettings(supabase, orgId) : Promise.resolve(null),
    listEmailLogs(supabase, orgId),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader module="Platform" title="Email" />

      <p className="text-sm text-text-tertiary">
        Configure your own SMTP provider to send invoices, receipts, and notifications from your organization&apos;s
        own address. Your credentials are never displayed back once saved.
      </p>

      {canManage && <SettingsForm settings={settings} canSend={canSend} />}
      <EmailLogTable logs={logs} />
    </div>
  );
}
