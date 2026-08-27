import { PageHeader } from "@/components/PageHeader";
import { Card, CardHeader } from "@/components/Card";
import { requireOrgContext } from "@/lib/session";
import { ThemeColorPicker } from "../company/ThemeColorPicker";

export default async function AppearancePage() {
  const { orgName, themeColor, permissions } = await requireOrgContext();

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Appearance" />

      <Card>
        <CardHeader title="Theme Options" />
        <div className="p-4">
          <p className="mb-4 text-sm text-text-secondary">
            Choose a brand color for {orgName}&apos;s workspace. It drives the sidebar and every primary button,
            link, and highlight across QuickBiz for everyone in your organization.
          </p>
          <ThemeColorPicker currentColor={themeColor} canManage={permissions.has("settings.manage")} />
        </div>
      </Card>

      <Card>
        <CardHeader title="Custom CSS & HTML" />
        <div className="p-4">
          <p className="text-sm text-text-secondary">
            For per-line CSS/HTML overrides with version history, see{" "}
            <a href="/custom-code" className="font-medium text-primary-600 hover:underline">
              Custom Code
            </a>{" "}
            (a separate module).
          </p>
        </div>
      </Card>
    </div>
  );
}
