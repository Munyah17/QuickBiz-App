import { Megaphone } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/Card";
import { Badge } from "@/components/Badge";
import { EmptyState } from "@/components/EmptyState";
import { requireOrgContext, requireModuleEnabled } from "@/lib/session";
import { listCampaigns } from "@/services/marketing";
import { listBranches } from "@/services/branches";
import { NewCampaignModal } from "./NewCampaignModal";
import { CampaignStatusSelect } from "./CampaignStatusSelect";

const statusTone: Record<string, "success" | "info" | "warning" | "danger" | "neutral"> = {
  draft: "neutral",
  scheduled: "info",
  sent: "success",
  cancelled: "danger",
};

export default async function CampaignsPage() {
  const { supabase, orgId, permissions } = await requireOrgContext();
  await requireModuleEnabled(supabase, orgId, "marketing");
  const canManage = permissions.has("marketing.manage");

  const [campaigns, branches] = await Promise.all([listCampaigns(supabase, orgId), listBranches(supabase, orgId)]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <PageHeader module="Marketing" title="Campaigns" />
        {canManage && <NewCampaignModal branches={branches.map((b) => ({ id: b.id, name: b.name }))} />}
      </div>

      <p className="text-sm text-text-tertiary">
        Campaigns track outreach your team carries out through its own channels. QuickBiz does not send SMS, email,
        or WhatsApp messages on your behalf yet, so mark a campaign as sent once you have actually sent it.
      </p>

      <Card>
        {campaigns.length === 0 ? (
          <EmptyState icon={Megaphone} title="No campaigns yet" />
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border-subtle text-left text-xs font-medium uppercase tracking-wide text-text-tertiary">
                <th className="px-4 py-2.5">Name</th>
                <th className="px-4 py-2.5">Channel</th>
                <th className="px-4 py-2.5">Audience</th>
                <th className="px-4 py-2.5">Scheduled</th>
                <th className="px-4 py-2.5">Status</th>
              </tr>
            </thead>
            <tbody>
              {campaigns.map((c) => (
                <tr key={c.id} className="border-b border-border-subtle last:border-b-0">
                  <td className="px-4 py-2.5">
                    <p className="font-medium text-text-primary">{c.name}</p>
                    <p className="max-w-md truncate text-xs text-text-tertiary">{c.message}</p>
                  </td>
                  <td className="px-4 py-2.5">
                    <Badge>{c.channel}</Badge>
                  </td>
                  <td className="px-4 py-2.5 text-text-secondary">{c.target_segment ?? "Not specified"}</td>
                  <td className="px-4 py-2.5 text-text-secondary">
                    {c.scheduled_at ? new Date(c.scheduled_at).toLocaleString() : "Not scheduled"}
                  </td>
                  <td className="px-4 py-2.5">
                    {canManage ? (
                      <CampaignStatusSelect campaignId={c.id} status={c.status} />
                    ) : (
                      <Badge tone={statusTone[c.status] ?? "neutral"}>{c.status}</Badge>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
