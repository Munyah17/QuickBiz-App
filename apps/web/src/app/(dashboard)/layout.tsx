import { Sidebar } from "@/components/Sidebar";
import { TopBar } from "@/components/TopBar";
import { ToastProvider } from "@/components/Toast";
import { requireOrgContext } from "@/lib/session";
import { listNotifications } from "@/services/notifications";
import { listEnabledModuleKeys } from "@/services/modules";
import { generateThemeVars } from "@/lib/theme";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { supabase, orgId, orgName, branchName, roleName, permissions, themeColor, userName } =
    await requireOrgContext();

  const [notifications, enabledModules] = await Promise.all([
    listNotifications(supabase),
    listEnabledModuleKeys(supabase, orgId),
  ]);
  // null (no tenant color set) leaves the default navy/blue theme untouched.
  const themeVars = generateThemeVars(themeColor);

  return (
    <ToastProvider>
      <div
        className="flex h-screen w-full overflow-hidden bg-workspace"
        style={themeVars ? (themeVars as React.CSSProperties) : undefined}
      >
        <Sidebar
          permissions={Array.from(permissions)}
          enabledModules={enabledModules}
          orgName={orgName}
          branchName={branchName}
        />
        <div className="flex min-w-0 flex-1 flex-col">
          <TopBar userName={userName} roleName={roleName} notifications={notifications} />
          <main className="flex-1 overflow-y-auto p-6">{children}</main>
        </div>
      </div>
    </ToastProvider>
  );
}
