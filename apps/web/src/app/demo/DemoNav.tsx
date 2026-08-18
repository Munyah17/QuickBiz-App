"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Contact,
  Package,
  Receipt,
  GitBranch,
  Users,
  ShieldCheck,
  LayoutGrid,
  ChevronsUpDown,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { useDemo } from "@/lib/demo/DemoContext";

interface DemoNavItem {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  moduleKey?: string;
}

const DEMO_NAV_ITEMS: DemoNavItem[] = [
  { href: "/demo/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/demo/customers", label: "Customers", icon: Contact },
  { href: "/demo/products", label: "Products", icon: Package, moduleKey: "inventory" },
  { href: "/demo/sales", label: "Sales", icon: Receipt, moduleKey: "sales" },
  { href: "/demo/branches", label: "Branches", icon: GitBranch },
  { href: "/demo/users", label: "Users", icon: Users },
  { href: "/demo/roles", label: "Roles", icon: ShieldCheck },
  { href: "/demo/modules", label: "Module Store", icon: LayoutGrid },
];

export function DemoSidebar() {
  const { orgName, modules } = useDemo();
  const pathname = usePathname();
  const enabledKeys = new Set(modules.filter((m) => m.enabled).map((m) => m.key));
  const items = DEMO_NAV_ITEMS.filter((item) => !item.moduleKey || enabledKeys.has(item.moduleKey));

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

      <div className="mx-2 mb-3 flex items-center gap-2 rounded-md bg-sidebar-elevated px-3 py-2.5">
        <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary-600 text-xs font-semibold text-white">
          {orgName.charAt(0)}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-sidebar-text-active">{orgName}</p>
          <p className="truncate text-xs text-sidebar-heading">Demo workspace</p>
        </div>
        <ChevronsUpDown className="size-3.5 shrink-0 text-sidebar-heading" />
      </div>
    </aside>
  );
}

export function DemoTopBar() {
  return (
    <header className="flex h-14 shrink-0 items-center gap-4 border-b border-border bg-surface px-4">
      <div className="flex items-center gap-2 rounded-full bg-warning-50 px-3 py-1 text-xs font-medium text-warning-600">
        Demo Mode - nothing here is saved
      </div>
      <div className="ml-auto flex items-center gap-2">
        <div className="flex size-8 items-center justify-center rounded-full bg-primary-100 text-sm font-semibold text-primary-700">
          D
        </div>
        <Link
          href="/login"
          className="flex items-center gap-1.5 rounded-md px-2 py-1.5 text-sm text-text-secondary hover:bg-workspace"
        >
          <LogOut className="size-4" />
          Exit Demo
        </Link>
      </div>
    </header>
  );
}
