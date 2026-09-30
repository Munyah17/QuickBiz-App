import {
  LayoutDashboard,
  Receipt,
  ShoppingCart,
  Target,
  Store,
  Package,
  Factory,
  FolderKanban,
  Archive,
  IdCard,
  Wallet,
  LifeBuoy,
  Truck,
  ShieldAlert,
  BarChart3,
  Code,
  Settings,
  Contact,
  ClipboardList,
  Gavel,
  UserPlus,
  Megaphone,
  Star,
  Share2,
  ShoppingBag,
  Warehouse,
  ClipboardCheck,
  Layers,
  HandCoins,
  Banknote,
  FileWarning,
  TrendingUp,
  BadgeDollarSign,
  Landmark,
  ReceiptText,
  Plug,
  Car,
  HardHat,
  FileText,
  Mail,
  Building2,
  GitBranch,
  Users,
  ShieldCheck,
  LayoutGrid,
  ScrollText,
  Palette,
  Printer,
  Wrench,
  PackageX,
  Route,
  MapPinned,
  Navigation,
  Siren,
  FileCheck,
  type LucideIcon,
} from "lucide-react";

export interface NavLeaf {
  key: string;
  href: string;
  label: string;
  icon: LucideIcon;
  /** Only used for standalone (non-grouped) leaves — grouped leaves inherit
   *  their group's moduleKey. */
  moduleKey?: string;
  permission?: string;
}

export interface NavGroup {
  key: string;
  label: string;
  icon: LucideIcon;
  /** The Module Store key this group belongs to. Groups with a moduleKey are
   *  hidden entirely unless that module is enabled — one collapsible group
   *  per module, children are that module's functions. Groups without a
   *  moduleKey (Administration) are always visible. */
  moduleKey?: string;
  children: NavLeaf[];
}

export type NavEntry = NavLeaf | NavGroup;

export function isNavGroup(entry: NavEntry): entry is NavGroup {
  return "children" in entry;
}

// One collapsible group per Module Store module — the group name is the
// module name and its children are the module's functions, so the sidebar
// mirrors the store 1:1. Dashboard and Administration are platform chrome,
// not modules, so they carry no moduleKey.
export const NAV_STRUCTURE: NavEntry[] = [
  { key: "dashboard", href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  {
    // Merged: Sales & Purchasing + Point of Sale. No group moduleKey — each
    // child carries its own so the group shows when *any* of its modules is on.
    key: "sales",
    label: "Sales & POS",
    icon: Receipt,
    children: [
      { key: "customers", href: "/customers", label: "Customers", icon: Contact, moduleKey: "sales" },
      { key: "sales", href: "/sales", label: "Invoices & Sales", icon: Receipt, moduleKey: "sales" },
      { key: "pos", href: "/pos", label: "Point of Sale", icon: ShoppingCart, moduleKey: "pos" },
      { key: "suppliers", href: "/suppliers", label: "Suppliers", icon: Truck, moduleKey: "sales" },
      { key: "purchase-orders", href: "/purchasing", label: "Purchase Orders", icon: ClipboardList, moduleKey: "sales" },
      { key: "tenders", href: "/tenders", label: "Tenders", icon: Gavel, moduleKey: "sales" },
    ],
  },
  {
    key: "crm",
    label: "CRM & Marketing",
    icon: Target,
    moduleKey: "crm",
    children: [
      { key: "leads", href: "/leads", label: "Leads", icon: UserPlus },
      { key: "opportunities", href: "/opportunities", label: "Opportunities", icon: Target },
      { key: "campaigns", href: "/campaigns", label: "Campaigns", icon: Megaphone },
      { key: "loyalty", href: "/loyalty", label: "Loyalty", icon: Star },
      { key: "social-media", href: "/social-media", label: "Social Media", icon: Share2 },
    ],
  },
  {
    // Merged: Inventory + Ecommerce, plus Loss Control (expired/discarded
    // goods) alongside Stock Take under warehousing.
    key: "inventory",
    label: "Inventory & Ecommerce",
    icon: Package,
    children: [
      { key: "products", href: "/products", label: "Products", icon: Package, moduleKey: "inventory" },
      { key: "warehousing", href: "/warehousing", label: "Warehouses", icon: Warehouse, moduleKey: "inventory" },
      { key: "stock-take", href: "/stock-take", label: "Stock Take", icon: ClipboardCheck, moduleKey: "inventory" },
      { key: "loss-control", href: "/loss-control", label: "Loss Control", icon: PackageX, moduleKey: "inventory" },
      { key: "catalog", href: "/ecommerce/catalog", label: "Online Catalog", icon: Store, moduleKey: "ecommerce" },
      { key: "online-orders", href: "/ecommerce/orders", label: "Online Orders", icon: ShoppingBag, moduleKey: "ecommerce" },
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
      { key: "workshop", href: "/manufacturing/workshop", label: "Workshop", icon: Wrench },
    ],
  },
  {
    key: "projects",
    label: "Projects",
    icon: FolderKanban,
    moduleKey: "projects",
    children: [
      { key: "projects", href: "/projects", label: "Projects", icon: FolderKanban },
      { key: "petty-cash", href: "/petty-cash", label: "Petty Cash", icon: HandCoins, permission: "projects.petty_cash" },
    ],
  },
  {
    key: "hr",
    label: "HR & Payroll",
    icon: IdCard,
    moduleKey: "hr",
    children: [
      { key: "employees", href: "/employees", label: "Employees", icon: IdCard },
      { key: "payroll", href: "/payroll", label: "Payroll Runs", icon: Banknote },
      { key: "disciplinary", href: "/disciplinary", label: "Disciplinary", icon: FileWarning, permission: "disciplinary.view" },
    ],
  },
  {
    // Merged: Finance + Assets. Children carry their own moduleKey so the
    // group shows when finance *or* assets is enabled.
    key: "finance",
    label: "Finance",
    icon: Wallet,
    children: [
      { key: "pnl", href: "/finance", label: "Profit & Loss", icon: TrendingUp, moduleKey: "finance" },
      { key: "accounts", href: "/accounts", label: "Chart of Accounts", icon: Wallet, moduleKey: "finance" },
      { key: "expenses", href: "/expenses", label: "Expenses", icon: BadgeDollarSign, moduleKey: "finance" },
      { key: "iban", href: "/iban", label: "IBAN", icon: Landmark, moduleKey: "finance" },
      { key: "tax-compliance", href: "/tax-compliance", label: "Tax Compliance", icon: ReceiptText, moduleKey: "finance" },
      { key: "fiscalisation", href: "/fiscalisation", label: "ZIMRA Fiscalisation", icon: FileCheck, moduleKey: "finance" },
      { key: "assets", href: "/assets", label: "Fixed Assets", icon: Archive, moduleKey: "assets" },
    ],
  },
  {
    key: "service_management",
    label: "Service Management",
    icon: LifeBuoy,
    moduleKey: "service_management",
    children: [
      { key: "tickets", href: "/tickets", label: "Service Tickets", icon: LifeBuoy },
      { key: "integrations", href: "/integrations", label: "Local Services", icon: Plug },
    ],
  },
  {
    key: "logistics",
    label: "Logistics & Fleet",
    icon: Truck,
    moduleKey: "logistics",
    children: [
      { key: "shipments", href: "/shipments", label: "Shipments", icon: Truck },
      { key: "distribution", href: "/distribution", label: "Distribution", icon: Route },
      { key: "tracking", href: "/tracking", label: "Live Tracking", icon: MapPinned },
      { key: "transit", href: "/transit", label: "Transit", icon: Navigation },
      { key: "emergency", href: "/emergency", label: "Emergency", icon: Siren },
      { key: "fleet", href: "/vehicles", label: "Fleet", icon: Car },
    ],
  },
  {
    key: "risk_insurance",
    label: "Risk & Compliance",
    icon: ShieldAlert,
    moduleKey: "risk_insurance",
    children: [
      { key: "risk-insurance", href: "/risk-insurance", label: "Risk & Insurance", icon: ShieldAlert },
      { key: "sheq", href: "/sheq", label: "SHEQ", icon: HardHat },
    ],
  },
  {
    key: "documents",
    label: "Documents & Reporting",
    icon: BarChart3,
    moduleKey: "documents",
    children: [
      { key: "documents", href: "/documents", label: "Documents", icon: FileText },
      { key: "reporting", href: "/reports", label: "Reports", icon: BarChart3 },
      { key: "email", href: "/email", label: "Email", icon: Mail },
    ],
  },
  {
    key: "custom_code",
    label: "Custom Code",
    icon: Code,
    moduleKey: "custom_code",
    children: [{ key: "custom-code", href: "/custom-code", label: "Custom Code", icon: Code }],
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
      { key: "printers", href: "/printers", label: "Printers", icon: Printer },
      { key: "theme-options", href: "/appearance", label: "Theme Options", icon: Palette },
      { key: "audit-logs", href: "/audit-logs", label: "Audit Logs", icon: ScrollText, permission: "audit.view" },
    ],
  },
];

// Demo mode reuses the same structure with /demo-prefixed hrefs so the demo
// sidebar mirrors production exactly.
export function prefixNavStructure(entries: NavEntry[], prefix: string): NavEntry[] {
  return entries.map((entry) =>
    isNavGroup(entry)
      ? { ...entry, children: entry.children.map((c) => ({ ...c, href: `${prefix}${c.href}` })) }
      : { ...entry, href: `${prefix}${entry.href}` }
  );
}
