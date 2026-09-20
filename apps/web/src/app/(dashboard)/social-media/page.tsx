import { PageHeader } from "@/components/PageHeader";
import { requireOrgContext, requireModuleEnabled } from "@/lib/session";
import { listConnectedSocialAccounts, listSocialPosts } from "@/services/socialMedia";
import { ConnectAccountModal } from "./ConnectAccountModal";
import { ComposePostModal } from "./ComposePostModal";
import { ConnectedAccountsTable } from "./ConnectedAccountsTable";
import { SocialPostsTable } from "./SocialPostsTable";

export default async function SocialMediaPage() {
  const { supabase, orgId, permissions } = await requireOrgContext();
  await requireModuleEnabled(supabase, orgId, "crm");
  const canManage = permissions.has("social_media.manage");

  const [accounts, posts] = await Promise.all([
    listConnectedSocialAccounts(supabase, orgId),
    listSocialPosts(supabase, orgId),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <PageHeader module="Marketing" title="Social Media" />
        {canManage && (
          <div className="flex gap-2">
            <ConnectAccountModal />
            <ComposePostModal />
          </div>
        )}
      </div>

      <p className="text-sm text-text-tertiary">
        QuickBiz does not publish to any social platform on your behalf yet - posts stay &quot;queued&quot; with &quot;pending&quot;
        per-platform records until a real integration exists to report a genuine send result.
      </p>

      <div className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-text-primary">Connected Accounts</h2>
        <ConnectedAccountsTable accounts={accounts} />
      </div>

      <div className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-text-primary">Posts</h2>
        <SocialPostsTable posts={posts} />
      </div>
    </div>
  );
}
