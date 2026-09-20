"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  KeyRound,
  Wallet,
  Activity,
  Package,
  LifeBuoy,
  BookOpen,
  Code2,
} from "lucide-react";
import { cn } from "@/lib/cn";

const LINKS = [
  { href: "/developers", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/developers/keys", label: "API Keys", icon: KeyRound },
  { href: "/developers/wallet", label: "Wallet & Billing", icon: Wallet },
  { href: "/developers/usage", label: "API Usage", icon: Activity },
  { href: "/developers/modules", label: "My Modules", icon: Package },
  { href: "/developers/support", label: "Support", icon: LifeBuoy },
  { href: "/developers/docs", label: "API Docs", icon: BookOpen },
];

export function DeveloperNav({ developerName }: { developerName: string }) {
  const pathname = usePathname();
  return (
    <aside className="flex h-full w-60 shrink-0 flex-col bg-sidebar text-sidebar-text">
      <div className="flex items-center gap-2 px-4 py-4">
        <div className="flex size-8 items-center justify-center rounded-md bg-primary-600">
          <Code2 className="size-5 text-white" />
        </div>
        <div>
          <span className="block text-sm font-semibold text-sidebar-text-active">QuickBiz</span>
          <span className="block text-[11px] text-sidebar-heading">Developer Portal</span>
        </div>
      </div>

      <nav className="flex-1 space-y-0.5 overflow-y-auto px-2 py-2">
        {LINKS.map((link) => {
          const active = link.exact ? pathname === link.href : pathname.startsWith(link.href);
          const Icon = link.icon;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-primary-600 text-white"
                  : "text-sidebar-text hover:bg-sidebar-elevated hover:text-sidebar-text-active"
              )}
            >
              <Icon className="size-4 shrink-0" />
              {link.label}
            </Link>
          );
        })}
      </nav>

      <div className="mx-2 mb-3 flex items-center gap-2 rounded-md bg-sidebar-elevated px-3 py-2.5">
        <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary-600 text-xs font-semibold text-white">
          {developerName.charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-sidebar-text-active">{developerName}</p>
          <p className="truncate text-xs text-sidebar-heading">Developer</p>
        </div>
      </div>
    </aside>
  );
}
