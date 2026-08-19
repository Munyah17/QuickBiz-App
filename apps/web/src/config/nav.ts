import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Building2,
  GitBranch,
  Users,
  ShieldCheck,
  LayoutGrid,
  ScrollText,
  Contact,
  Package,
  Receipt,
  ShoppingCart,
  Truck,
  ClipboardList,
  Wallet,
  BadgeDollarSign,
  TrendingUp,
  IdCard,
  UserPlus,
  Target,
  FolderKanban,
  Archive,
  LifeBuoy,
  Car,
  FileText,
  BarChart3,
  Megaphone,
  Star,
  Layers,
  Factory,
  Store,
  ShoppingBag,
} from "lucide-react";

export interface NavLeaf {
  key: string;
  href: string;
  label: string;
  icon: LucideIcon;
  /** Permission key required to see this item; undefined = visible to every member. */
  permission?: string;
  /** org_modules key required to be 'enabled' for this item to show; undefined = always (Core). */
  moduleKey?: string;
}

export interface NavGroup {
  key: string;
  label: string;
  icon: LucideIcon;
  moduleKey?: string;
  children: NavLeaf[];
}

export type NavEntry = NavLeaf | NavGroup;

export function isNavGroup(entry: NavEntry): entry is NavGroup {
  return "children" in entry;
}

// `permission` only gates items whose underlying RLS policy actually
// restricts *reads* (only audit_logs does — see 000010_audit_logs.sql).
// Everything else is readable by any active member; the "manage" permissions
// only gate the write actions inside each page, not visibility of the page.
//
// `moduleKey` implements the module-aware-nav principle (spec §58):
// Customers has none (Core, like Branches/Users, per spec §6's "Contacts" as
// a platform capability, not a toggleable module); Products/Sales only show
// once their module is actually enabled for the org.
//
// A module with 2+ real pages becomes a collapsible NavGroup; a module with
// exactly one page stays a flat NavLeaf (a one-item dropdown is just an
// extra click with nothing to hide).
export const NAV_STRUCTURE: NavEntry[] = [
  { key: "dashboard", href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { key: "customers", href: "/customers", label: "Customers", icon: Contact },
  { key: "pos", href: "/pos", label: "Point of Sale", icon: ShoppingCart, moduleKey: "pos" },
  { key: "sales", href: "/sales", label: "Sales", icon: Receipt, moduleKey: "sales" },
  { key: "inventory", href: "/products", label: "Products", icon: Package, moduleKey: "inventory" },
  {
    key: "purchasing",
    label: "Purchasing",
    icon: Truck,
    moduleKey: "purchasing",
    children: [
      { key: "suppliers", href: "/suppliers", label: "Suppliers", icon: Truck },
      { key: "purchase-orders", href: "/purchasing", label: "Purchase Orders", icon: ClipboardList },
    ],
  },
  {
    key: "finance",
    label: "Finance",
    icon: Wallet,
    moduleKey: "finance",
    children: [
      { key: "pnl", href: "/finance", label: "Profit & Loss", icon: TrendingUp },
      { key: "accounts", href: "/accounts", label: "Chart of Accounts", icon: Wallet },
      { key: "expenses", href: "/expenses", label: "Expenses", icon: BadgeDollarSign },
    ],
  },
  { key: "hr", href: "/employees", label: "Employees", icon: IdCard, moduleKey: "hr" },
  {
    key: "crm",
    label: "CRM",
    icon: UserPlus,
    moduleKey: "crm",
    children: [
      { key: "leads", href: "/leads", label: "Leads", icon: UserPlus },
      { key: "opportunities", href: "/opportunities", label: "Opportunities", icon: Target },
    ],
  },
  { key: "projects", href: "/projects", label: "Projects", icon: FolderKanban, moduleKey: "projects" },
  { key: "assets", href: "/assets", label: "Fixed Assets", icon: Archive, moduleKey: "assets" },
  { key: "service", href: "/tickets", label: "Service Tickets", icon: LifeBuoy, moduleKey: "service_management" },
  { key: "fleet", href: "/vehicles", label: "Fleet", icon: Car, moduleKey: "fleet" },
  { key: "documents", href: "/documents", label: "Documents", icon: FileText, moduleKey: "documents" },
  { key: "reporting", href: "/reports", label: "Reports", icon: BarChart3, moduleKey: "reporting" },
  {
    key: "marketing",
    label: "Marketing",
    icon: Megaphone,
    moduleKey: "marketing",
    children: [
      { key: "campaigns", href: "/campaigns", label: "Campaigns", icon: Megaphone },
      { key: "loyalty", href: "/loyalty", label: "Loyalty", icon: Star },
    ],
  },
  {
    key: "manufacturing",
    label: "Manufacturing",
    icon: Factory,
    moduleKey: "manufacturing",
    children: [
      { key: "boms", href: "/manufacturing/boms", label: "Bills of Materials", icon: Layers },
      { key: "work-orders", href: "/manufacturing/work-orders", label: "Work Orders", icon: Factory },
    ],
  },
  {
    key: "ecommerce",
    label: "Ecommerce",
    icon: Store,
    moduleKey: "ecommerce",
    children: [
      { key: "catalog", href: "/ecommerce/catalog", label: "Online Catalog", icon: Store },
      { key: "orders", href: "/ecommerce/orders", label: "Online Orders", icon: ShoppingBag },
    ],
  },
  { key: "company", href: "/company", label: "Company", icon: Building2 },
  { key: "branches", href: "/branches", label: "Branches", icon: GitBranch },
  { key: "users", href: "/users", label: "Users", icon: Users },
  { key: "roles", href: "/roles", label: "Roles", icon: ShieldCheck },
  { key: "modules", href: "/modules", label: "Module Store", icon: LayoutGrid },
  { key: "audit-logs", href: "/audit-logs", label: "Audit Logs", icon: ScrollText, permission: "audit.view" },
];

export function prefixNavStructure(entries: NavEntry[], prefix: string): NavEntry[] {
  return entries.map((entry) =>
    isNavGroup(entry)
      ? { ...entry, children: entry.children.map((c) => ({ ...c, href: `${prefix}${c.href}` })) }
      : { ...entry, href: `${prefix}${entry.href}` }
  );
}
