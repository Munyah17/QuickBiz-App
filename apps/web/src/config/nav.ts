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
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Permission key required to see this item; undefined = visible to every member. */
  permission?: string;
  /** org_modules key required to be 'enabled' for this item to show; undefined = always (Core). */
  moduleKey?: string;
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
export const CORE_NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/customers", label: "Customers", icon: Contact },
  { href: "/pos", label: "Point of Sale", icon: ShoppingCart, moduleKey: "pos" },
  { href: "/sales", label: "Sales", icon: Receipt, moduleKey: "sales" },
  { href: "/products", label: "Products", icon: Package, moduleKey: "inventory" },
  { href: "/suppliers", label: "Suppliers", icon: Truck, moduleKey: "purchasing" },
  { href: "/purchasing", label: "Purchasing", icon: ClipboardList, moduleKey: "purchasing" },
  { href: "/finance", label: "Profit & Loss", icon: TrendingUp, moduleKey: "finance" },
  { href: "/accounts", label: "Chart of Accounts", icon: Wallet, moduleKey: "finance" },
  { href: "/expenses", label: "Expenses", icon: BadgeDollarSign, moduleKey: "finance" },
  { href: "/employees", label: "Employees", icon: IdCard, moduleKey: "hr" },
  { href: "/leads", label: "Leads", icon: UserPlus, moduleKey: "crm" },
  { href: "/opportunities", label: "Opportunities", icon: Target, moduleKey: "crm" },
  { href: "/projects", label: "Projects", icon: FolderKanban, moduleKey: "projects" },
  { href: "/assets", label: "Fixed Assets", icon: Archive, moduleKey: "assets" },
  { href: "/tickets", label: "Service Tickets", icon: LifeBuoy, moduleKey: "service_management" },
  { href: "/vehicles", label: "Fleet", icon: Car, moduleKey: "fleet" },
  { href: "/documents", label: "Documents", icon: FileText, moduleKey: "documents" },
  { href: "/reports", label: "Reports", icon: BarChart3, moduleKey: "reporting" },
  { href: "/campaigns", label: "Campaigns", icon: Megaphone, moduleKey: "marketing" },
  { href: "/loyalty", label: "Loyalty", icon: Star, moduleKey: "marketing" },
  { href: "/manufacturing/boms", label: "Bills of Materials", icon: Layers, moduleKey: "manufacturing" },
  { href: "/manufacturing/work-orders", label: "Work Orders", icon: Factory, moduleKey: "manufacturing" },
  { href: "/company", label: "Company", icon: Building2 },
  { href: "/branches", label: "Branches", icon: GitBranch },
  { href: "/users", label: "Users", icon: Users },
  { href: "/roles", label: "Roles", icon: ShieldCheck },
  { href: "/modules", label: "Module Store", icon: LayoutGrid },
  { href: "/audit-logs", label: "Audit Logs", icon: ScrollText, permission: "audit.view" },
];
