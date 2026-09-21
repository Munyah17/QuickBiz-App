/**
 * Maps NAV_STRUCTURE entry keys to Font Awesome 7 classes so the CoolAdmin
 * shell keeps its single-icon-font look (the template ships FA, not Lucide).
 * Fallback renders a plain dot so a missing key never shows an empty glyph.
 */
const FA_ICONS: Record<string, string> = {
  // Top-level
  dashboard: "fa-solid fa-gauge-high",
  // Sales & Purchasing
  sales: "fa-solid fa-receipt",
  customers: "fa-solid fa-address-book",
  suppliers: "fa-solid fa-truck-field",
  "purchase-orders": "fa-solid fa-clipboard-list",
  tenders: "fa-solid fa-gavel",
  // Point of Sale
  pos: "fa-solid fa-cash-register",
  // CRM & Marketing
  crm: "fa-solid fa-bullseye",
  leads: "fa-solid fa-user-plus",
  opportunities: "fa-solid fa-crosshairs",
  campaigns: "fa-solid fa-bullhorn",
  loyalty: "fa-solid fa-star",
  "social-media": "fa-solid fa-share-nodes",
  // Ecommerce
  ecommerce: "fa-solid fa-store",
  catalog: "fa-solid fa-store",
  "online-orders": "fa-solid fa-bag-shopping",
  // Inventory
  inventory: "fa-solid fa-boxes-stacked",
  products: "fa-solid fa-box",
  warehousing: "fa-solid fa-warehouse",
  "stock-take": "fa-solid fa-clipboard-check",
  // Manufacturing
  manufacturing: "fa-solid fa-industry",
  boms: "fa-solid fa-layer-group",
  "work-orders": "fa-solid fa-screwdriver-wrench",
  // Projects
  projects: "fa-solid fa-diagram-project",
  "petty-cash": "fa-solid fa-coins",
  // Assets
  assets: "fa-solid fa-box-archive",
  // HR & Payroll
  hr: "fa-solid fa-id-card",
  employees: "fa-solid fa-id-card",
  payroll: "fa-solid fa-money-check-dollar",
  disciplinary: "fa-solid fa-file-circle-exclamation",
  // Finance
  finance: "fa-solid fa-wallet",
  pnl: "fa-solid fa-chart-line",
  accounts: "fa-solid fa-book-open",
  expenses: "fa-solid fa-money-bill-wave",
  iban: "fa-solid fa-building-columns",
  "tax-compliance": "fa-solid fa-file-invoice",
  // Service Management
  service_management: "fa-solid fa-headset",
  tickets: "fa-solid fa-ticket",
  integrations: "fa-solid fa-plug",
  // Logistics & Fleet
  logistics: "fa-solid fa-truck-fast",
  shipments: "fa-solid fa-truck-fast",
  fleet: "fa-solid fa-car",
  // Risk & Compliance
  risk_insurance: "fa-solid fa-shield-halved",
  "risk-insurance": "fa-solid fa-shield-halved",
  sheq: "fa-solid fa-helmet-safety",
  // Documents & Reporting
  documents: "fa-solid fa-chart-column",
  reporting: "fa-solid fa-chart-pie",
  email: "fa-solid fa-envelope",
  // Custom Code
  custom_code: "fa-solid fa-code",
  "custom-code": "fa-solid fa-code",
  // Administration
  "admin-group": "fa-solid fa-gears",
  company: "fa-solid fa-building",
  branches: "fa-solid fa-code-branch",
  users: "fa-solid fa-users",
  roles: "fa-solid fa-user-shield",
  modules: "fa-solid fa-grip",
  printers: "fa-solid fa-print",
  "theme-options": "fa-solid fa-palette",
  "audit-logs": "fa-solid fa-scroll",
};

export function faIcon(key: string): string {
  return FA_ICONS[key] ?? "fa-solid fa-circle";
}
