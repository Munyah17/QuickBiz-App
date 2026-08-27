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
  Boxes,
  Settings,
  Plug,
  Truck as TruckIcon,
  Code,
  Palette,
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
// `moduleKey` implements the module-aware-nav principle (spec §58) and lives
// on each LEAF, not the group — a group is visible whenever at least one of
// its children is (so e.g. Customers, which has no moduleKey and is always
// on, keeps the "Sales" group visible even with every sales module
// disabled). Grouped by business area (matches module_catalog's own
// `category` column) rather than 1:1 per module, so the sidebar reads as a
// handful of sections instead of a 24-item flat list.
export const NAV_STRUCTURE: NavEntry[] = [
  { key: "dashboard", href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { key: "local-services", href: "/integrations", label: "Local Services", icon: Plug, moduleKey: "local_services" },
  {
    key: "sales-group",
    label: "Sales",
    icon: Receipt,
    children: [
      { key: "customers", href: "/customers", label: "Customers", icon: Contact },
      { key: "pos", href: "/pos", label: "Point of Sale", icon: ShoppingCart, moduleKey: "pos" },
      { key: "sales", href: "/sales", label: "Sales", icon: Receipt, moduleKey: "sales" },
      { key: "leads", href: "/leads", label: "Leads", icon: UserPlus, moduleKey: "crm" },
      { key: "opportunities", href: "/opportunities", label: "Opportunities", icon: Target, moduleKey: "crm" },
      { key: "campaigns", href: "/campaigns", label: "Campaigns", icon: Megaphone, moduleKey: "marketing" },
      { key: "loyalty", href: "/loyalty", label: "Loyalty", icon: Star, moduleKey: "marketing" },
      { key: "catalog", href: "/ecommerce/catalog", label: "Online Catalog", icon: Store, moduleKey: "ecommerce" },
      { key: "online-orders", href: "/ecommerce/orders", label: "Online Orders", icon: ShoppingBag, moduleKey: "ecommerce" },
    ],
  },
  {
    key: "operations-group",
    label: "Operations",
    icon: Boxes,
    children: [
      { key: "inventory", href: "/products", label: "Products", icon: Package, moduleKey: "inventory" },
      { key: "suppliers", href: "/suppliers", label: "Suppliers", icon: Truck, moduleKey: "purchasing" },
      { key: "purchase-orders", href: "/purchasing", label: "Purchase Orders", icon: ClipboardList, moduleKey: "purchasing" },
      { key: "boms", href: "/manufacturing/boms", label: "Bills of Materials", icon: Layers, moduleKey: "manufacturing" },
      { key: "work-orders", href: "/manufacturing/work-orders", label: "Work Orders", icon: Factory, moduleKey: "manufacturing" },
      { key: "projects", href: "/projects", label: "Projects", icon: FolderKanban, moduleKey: "projects" },
      { key: "assets", href: "/assets", label: "Fixed Assets", icon: Archive, moduleKey: "assets" },
      { key: "service", href: "/tickets", label: "Service Tickets", icon: LifeBuoy, moduleKey: "service_management" },
      { key: "hr", href: "/employees", label: "Employees", icon: IdCard, moduleKey: "hr" },
    ],
  },
  {
    key: "logistics-group",
    label: "Logistics",
    icon: TruckIcon,
    children: [
      { key: "shipments", href: "/shipments", label: "Shipments", icon: TruckIcon, moduleKey: "logistics" },
      { key: "fleet", href: "/vehicles", label: "Fleet", icon: Car, moduleKey: "fleet" },
    ],
  },
  {
    key: "finance-group",
    label: "Finance",
    icon: Wallet,
    children: [
      { key: "pnl", href: "/finance", label: "Profit & Loss", icon: TrendingUp, moduleKey: "finance" },
      { key: "accounts", href: "/accounts", label: "Chart of Accounts", icon: Wallet, moduleKey: "finance" },
      { key: "expenses", href: "/expenses", label: "Expenses", icon: BadgeDollarSign, moduleKey: "finance" },
    ],
  },
  {
    key: "insights-group",
    label: "Reports & Documents",
    icon: BarChart3,
    children: [
      { key: "documents", href: "/documents", label: "Documents", icon: FileText, moduleKey: "documents" },
      { key: "reporting", href: "/reports", label: "Reports", icon: BarChart3, moduleKey: "reporting" },
    ],
  },
  {
    key: "appearance-group",
    label: "Appearance",
    icon: Palette,
    children: [
      { key: "theme-options", href: "/appearance", label: "Theme Options", icon: Palette },
      { key: "custom-code", href: "/custom-code", label: "Custom Code", icon: Code, moduleKey: "custom_code" },
    ],
  },
  {
    key: "admin-group",
    label: "Administration",
    icon: Settings,
    children: [
      { key: "company", href: "/company", label: "Company", icon: Building2 },
      { key: "branches", href: "/branches", label: "Branches", icon: GitBranch },
      { key: "users", href: "/users", label: "Users", icon: Users },
      { key: "roles", href: "/roles", label: "Roles", icon: ShieldCheck },
      { key: "modules", href: "/modules", label: "Module Store", icon: LayoutGrid },
      { key: "audit-logs", href: "/audit-logs", label: "Audit Logs", icon: ScrollText, permission: "audit.view" },
    ],
  },
];

export function prefixNavStructure(entries: NavEntry[], prefix: string): NavEntry[] {
  return entries.map((entry) =>
    isNavGroup(entry)
      ? { ...entry, children: entry.children.map((c) => ({ ...c, href: `${prefix}${c.href}` })) }
      : { ...entry, href: `${prefix}${entry.href}` }
  );
}
