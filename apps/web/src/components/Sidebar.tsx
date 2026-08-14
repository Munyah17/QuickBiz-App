"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Package, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/cn";
import { CORE_NAV_ITEMS } from "@/config/nav";

// `permissions` is a plain string array (not the CORE_NAV_ITEMS objects,
// which hold component references) — icon components can't cross the
// Server->Client Component boundary as props, so this Client Component
// imports the nav config itself and only takes serializable data from the
// server.
export function Sidebar({
  permissions,
  enabledModules,
  orgName,
  branchName,
}: {
  permissions: string[];
  enabledModules: string[];
  orgName: string;
  branchName: string;
}) {
  const pathname = usePathname();
  const items = CORE_NAV_ITEMS.filter(
    (item) =>
      (!item.permission || permissions.includes(item.permission)) &&
      (!item.moduleKey || enabledModules.includes(item.moduleKey))
  );

  return (
    <aside className="flex h-full w-60 shrink-0 flex-col bg-sidebar text-sidebar-text">
      <div className="flex items-center gap-2 px-4 py-4">
        <div className="flex size-8 items-center justify-center rounded-md bg-primary-600">
          <Package className="size-5 text-white" />
        </div>
        <span className="text-sm font-semibold text-sidebar-text-active">QuickBiz ERP</span>
      </div>

      <nav className="flex-1 space-y-0.5 overflow-y-auto px-2 py-2">
        {items.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-primary-600 text-white"
                  : "text-sidebar-text hover:bg-sidebar-elevated hover:text-sidebar-text-active"
              )}
            >
              <Icon className="size-4 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <button
        type="button"
        className="mx-2 mb-3 flex items-center gap-2 rounded-md bg-sidebar-elevated px-3 py-2.5 text-left hover:bg-sidebar-elevated/80"
      >
        <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary-600 text-xs font-semibold text-white">
          {orgName.charAt(0)}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-sidebar-text-active">{orgName}</p>
          <p className="truncate text-xs text-sidebar-heading">{branchName}</p>
        </div>
        <ChevronsUpDown className="size-3.5 shrink-0 text-sidebar-heading" />
      </button>
    </aside>
  );
}
