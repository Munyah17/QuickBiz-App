import { PageHeader } from "@/components/PageHeader";
import { requireOrgContext, requireModuleEnabled } from "@/lib/session";
import { listCampaigns } from "@/services/marketing";
import { listBranches } from "@/services/branches";
import { NewCampaignModal } from "./NewCampaignModal";
import { CampaignsTable } from "./CampaignsTable";

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

      <CampaignsTable campaigns={campaigns} canManage={canManage} />
    </div>
  );
}
