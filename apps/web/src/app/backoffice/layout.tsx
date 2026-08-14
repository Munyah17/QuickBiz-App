import Link from "next/link";
import { Package, LayoutDashboard, Building2, Users, ShieldAlert } from "lucide-react";
import { ToastProvider } from "@/components/Toast";
import { requirePlatformStaff } from "@/lib/platform-session";
import { signOutAction } from "@/app/actions/auth";

const NAV_ITEMS = [
  { href: "/backoffice", label: "Overview", icon: LayoutDashboard },
  { href: "/backoffice/tenants", label: "Tenants", icon: Building2 },
  { href: "/backoffice/staff", label: "Staff", icon: Users, permission: "staff.manage" },
];

export default async function BackofficeLayout({ children }: { children: React.ReactNode }) {
  const { user, roleKey, permissions } = await requirePlatformStaff();
  const userName = (user.user_metadata?.full_name as string | undefined) || user.email || "Staff";
  const items = NAV_ITEMS.filter((item) => !item.permission || permissions.has(item.permission));

  return (
    <ToastProvider>
      <div className="flex min-h-screen w-full flex-col bg-workspace">
        <header className="flex h-14 shrink-0 items-center gap-4 border-b border-danger-500/30 bg-slate-900 px-4 text-white">
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-md bg-danger-500">
              <ShieldAlert className="size-5 text-white" />
            </div>
            <span className="text-sm font-semibold">QuickBiz Internal</span>
          </div>

          <nav className="flex items-center gap-1">
            {items.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium text-slate-300 hover:bg-slate-800 hover:text-white"
                >
                  <Icon className="size-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="ml-auto flex items-center gap-3 text-sm">
            <span className="text-slate-300">
              {userName} · <span className="capitalize">{roleKey.replace("_", " ")}</span>
            </span>
            <form action={signOutAction}>
              <button type="submit" className="rounded-md border border-slate-700 px-2.5 py-1 text-slate-300 hover:bg-slate-800">
                Sign out
              </button>
            </form>
            <Link href="/dashboard" className="rounded-md border border-slate-700 px-2.5 py-1 text-slate-300 hover:bg-slate-800">
              <Package className="size-3.5" />
            </Link>
          </div>
        </header>

        <main className="flex-1 p-6">{children}</main>
      </div>
    </ToastProvider>
  );
}
