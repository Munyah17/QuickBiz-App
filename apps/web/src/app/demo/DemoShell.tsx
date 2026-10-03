"use client";

import { useMemo } from "react";
import { useDemo } from "@/lib/demo/DemoContext";
import { generateThemeVars } from "@/lib/theme";
import { NAV_STRUCTURE, isNavGroup } from "@/config/nav";
import { CoolAdminShell } from "@/components/cooladmin/CoolAdminShell";

// Demo users own the org: every permission in the nav tree is granted so the
// sidebar shows the full product surface, filtered only by module toggles.
const DEMO_PERMISSIONS: string[] = [
  ...new Set(
    NAV_STRUCTURE.flatMap((e) => (isNavGroup(e) ? e.children : [e]))
      .map((leaf) => leaf.permission)
      .filter((p): p is string => Boolean(p)),
  ),
];

/**
 * Demo shell = the paid app's CoolAdminShell verbatim. Same sidebar, same
 * header, same drawer/accordion behavior — the only differences are the
 * /demo-prefixed nav, in-memory state, and demo-safe header actions.
 */
export function DemoShell({ children }: { children: React.ReactNode }) {
  const { orgName, themeColor, modules, branches, users } = useDemo();
  const themeVars = generateThemeVars(themeColor);
  const enabledModules = useMemo(
    () => modules.filter((m) => m.enabled).map((m) => m.key),
    [modules],
  );

  const owner = users.find((u) => u.roleName === "Owner") ?? users[0];
  const headOffice =
    branches.find((b) => b.type === "head_office") ?? branches[0];

  return (
    <div style={themeVars ? (themeVars as React.CSSProperties) : undefined}>
      <CoolAdminShell
        permissions={DEMO_PERMISSIONS}
        enabledModules={enabledModules}
        orgName={orgName}
        branchName={headOffice?.name ?? "Head Office"}
        userName={owner?.fullName ?? "Demo Owner"}
        roleName={owner?.roleName ?? "Owner"}
        email={owner?.email ?? "demo@quickbiz.app"}
        notifications={[]}
        navPrefix="/demo"
        demo
      >
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-border bg-warning-50 px-3 py-2 text-xs font-medium text-warning-600">
          <span className="inline-block size-2 rounded-full bg-warning-600" />
          Demo Mode — explore everything; nothing here is saved.
        </div>
        {children}
      </CoolAdminShell>
    </div>
  );
}
