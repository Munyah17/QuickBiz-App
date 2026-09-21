import Script from "next/script";
import { CoolAdminShell } from "@/components/cooladmin/CoolAdminShell";
import { ToastProvider } from "@/components/Toast";
import { requireOrgContext } from "@/lib/session";
import { listNotifications } from "@/services/notifications";
import { listEnabledModuleKeys } from "@/services/modules";
import { generateThemeVars } from "@/lib/theme";
import { getActiveCustomCode } from "@/services/customCode";
import "@/styles/cooladmin/index.css";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { supabase, user, orgId, orgName, branchName, roleName, permissions, themeColor, userName } =
    await requireOrgContext();

  const [notifications, enabledModules] = await Promise.all([
    listNotifications(supabase),
    listEnabledModuleKeys(supabase, orgId),
  ]);
  // null (no tenant color set) leaves the default navy/blue theme untouched.
  const themeVars = generateThemeVars(themeColor);
  const customCss = enabledModules.includes("custom_code") ? await getActiveCustomCode(supabase, orgId, "css") : null;

  return (
    <ToastProvider>
      {/* CoolAdmin vendored assets — Font Awesome stylesheet and the
          Bootstrap bundle (data-bs components like modals/tooltips). */}
      <link
        rel="stylesheet"
        href="/cooladmin/vendor/fontawesome-7.3.1/css/all.min.css"
      />
      <Script src="/cooladmin/js/vanilla-utils.js" strategy="afterInteractive" />
      <Script src="/cooladmin/vendor/bootstrap-5.3.8.bundle.min.js" strategy="afterInteractive" />
      <Script src="/cooladmin/js/bootstrap5-init.js" strategy="afterInteractive" />
      {customCss && <style id="org-custom-css" dangerouslySetInnerHTML={{ __html: customCss }} />}
      <div style={themeVars ? (themeVars as React.CSSProperties) : undefined}>
        <CoolAdminShell
          permissions={Array.from(permissions)}
          enabledModules={enabledModules}
          orgName={orgName}
          branchName={branchName}
          userName={userName}
          roleName={roleName}
          email={user.email ?? ""}
          notifications={notifications}
        >
          {children}
        </CoolAdminShell>
      </div>
    </ToastProvider>
  );
}
