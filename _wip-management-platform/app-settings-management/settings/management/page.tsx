import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/Button";
import { Card, CardHeader, CardContent } from "@/components/Card";
import { requireOrgContext } from "@/lib/session";
import { getManagementLinkStatus, linkToManagement, unlinkFromManagement } from "@/services/module-requests";
import { useState } from "react";

export default async function ManagementSettingsPage() {
  const { supabase, orgId } = await requireOrgContext();
  const linkStatus = await getManagementLinkStatus();

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Management Platform"
        description="Manage connection to the central management platform for module subscriptions, billing, and support."
      />

      <ManagementLinkCard linkStatus={linkStatus} />
    </div>
  );
}

function ManagementLinkCard({ linkStatus }: { linkStatus: any }) {
  const [isLinked, setIsLinked] = useState(linkStatus.is_linked);
  const [isSaving, setIsSaving] = useState(false);
  const [showLinkForm, setShowLinkForm] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [apiUrl, setApiUrl] = useState("");
  const [deploymentId, setDeploymentId] = useState("");

  const handleLink = async () => {
    setIsSaving(true);
    try {
      await linkToManagement(apiKey, apiUrl, deploymentId || undefined);
      setIsLinked(true);
      setShowLinkForm(false);
      setApiKey("");
      setApiUrl("");
      setDeploymentId("");
    } catch (error) {
      console.error("Failed to link:", error);
      alert("Failed to link to management platform. Please check your credentials.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleUnlink = async () => {
    if (!confirm("Are you sure you want to unlink from the management platform? You will not be able to request new modules or receive updates.")) {
      return;
    }

    setIsSaving(true);
    try {
      await unlinkFromManagement();
      setIsLinked(false);
    } catch (error) {
      console.error("Failed to unlink:", error);
      alert("Failed to unlink from management platform.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader title="Management Platform Connection" />
      <CardContent className="space-y-4">
        {isLinked ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-green-500" />
              <span className="text-sm font-medium">Connected to Management Platform</span>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm font-medium text-muted-foreground">API URL</label>
                <p className="text-sm">{linkStatus.api_url || "Not set"}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Deployment ID</label>
                <p className="text-sm">{linkStatus.deployment_id || "Not set"}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Last Sync</label>
                <p className="text-sm">
                  {linkStatus.last_sync_at
                    ? new Date(linkStatus.last_sync_at).toLocaleString()
                    : "Never"}
                </p>
              </div>
            </div>

            <Button onClick={handleUnlink} variant="destructive" disabled={isSaving}>
              {isSaving ? "Unlinking..." : "Unlink from Management Platform"}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-gray-400" />
              <span className="text-sm font-medium">Not Connected</span>
            </div>

            <p className="text-sm text-muted-foreground">
              Connect to the central management platform to request new modules, manage
              subscriptions, and receive updates and support.
            </p>

            {!showLinkForm ? (
              <Button onClick={() => setShowLinkForm(true)}>Connect to Management Platform</Button>
            ) : (
              <div className="space-y-4 border rounded-lg p-4">
                <div>
                  <label className="text-sm font-medium">API Key</label>
                  <input
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    className="w-full mt-1 px-3 py-2 border rounded-md"
                    placeholder="Enter your API key"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">API URL</label>
                  <input
                    type="url"
                    value={apiUrl}
                    onChange={(e) => setApiUrl(e.target.value)}
                    className="w-full mt-1 px-3 py-2 border rounded-md"
                    placeholder="https://management.quickbiz.local"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Deployment ID (optional)</label>
                  <input
                    type="text"
                    value={deploymentId}
                    onChange={(e) => setDeploymentId(e.target.value)}
                    className="w-full mt-1 px-3 py-2 border rounded-md"
                    placeholder="Deployment ID from management platform"
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleLink} disabled={isSaving || !apiKey || !apiUrl}>
                    {isSaving ? "Connecting..." : "Connect"}
                  </Button>
                  <Button variant="outline" onClick={() => setShowLinkForm(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
