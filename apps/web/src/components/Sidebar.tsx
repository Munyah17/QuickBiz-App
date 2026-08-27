"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Package, ChevronsUpDown, ChevronDown } from "lucide-react";
import { cn } from "@/lib/cn";
import { NAV_STRUCTURE, isNavGroup, type NavLeaf } from "@/config/nav";

function isLeafActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(href + "/");
}

function LeafLink({ item, active, indent }: { item: NavLeaf; active: boolean; indent?: boolean }) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      className={cn(
        "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
        indent && "py-1.5 pl-9 text-[13px]",
        active
          ? "bg-primary-600 text-white"
          : "text-sidebar-text hover:bg-sidebar-elevated hover:text-sidebar-text-active"
      )}
    >
      {!indent && <Icon className="size-4 shrink-0" />}
      {item.label}
    </Link>
  );
}

// `permissions` is a plain string array (not the NAV_STRUCTURE objects,
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
  const [openGroups, setOpenGroups] = useState<Set<string>>(new Set());

  const leafVisible = (leaf: NavLeaf) =>
    (!leaf.moduleKey || enabledModules.includes(leaf.moduleKey)) && (!leaf.permission || permissions.includes(leaf.permission));

  return (
    <aside className="flex h-full w-60 shrink-0 flex-col bg-sidebar text-sidebar-text">
      <div className="flex items-center gap-2 px-4 py-4">
        <div className="flex size-8 items-center justify-center rounded-md bg-primary-600">
          <Package className="size-5 text-white" />
        </div>
        <span className="text-sm font-semibold text-sidebar-text-active">QuickBiz ERP</span>
      </div>

      <nav className="flex-1 space-y-0.5 overflow-y-auto px-2 py-2">
        {NAV_STRUCTURE.map((entry) => {
          if (!isNavGroup(entry)) {
            if (!leafVisible(entry)) return null;
            return <LeafLink key={entry.key} item={entry} active={isLeafActive(pathname, entry.href)} />;
          }

          const visibleChildren = entry.children.filter(leafVisible);
          if (visibleChildren.length === 0) return null;

          const groupActive = visibleChildren.some((c) => isLeafActive(pathname, c.href));
          const open = openGroups.has(entry.key) || groupActive;
          const Icon = entry.icon;

          return (
            <div key={entry.key}>
              <button
                type="button"
                onClick={() =>
                  setOpenGroups((prev) => {
                    const next = new Set(prev);
                    if (next.has(entry.key)) next.delete(entry.key);
                    else next.add(entry.key);
                    return next;
                  })
                }
                className={cn(
                  "flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  groupActive
                    ? "text-sidebar-text-active"
                    : "text-sidebar-text hover:bg-sidebar-elevated hover:text-sidebar-text-active"
                )}
              >
                <Icon className="size-4 shrink-0" />
                <span className="flex-1 text-left">{entry.label}</span>
                <ChevronDown className={cn("size-3.5 shrink-0 transition-transform", open && "rotate-180")} />
              </button>
              {open && (
                <div className="mt-0.5 space-y-0.5">
                  {visibleChildren.map((child) => (
                    <LeafLink key={child.key} item={child} active={isLeafActive(pathname, child.href)} indent />
                  ))}
                </div>
              )}
            </div>
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
