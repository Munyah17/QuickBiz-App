"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";

// Everything here lives in React state only, on purpose (project decision,
// 2026-08-11, sharpened 2026-08-19): a public demo entry point where any
// username/password "logs in", state persists only for as long as the tab
// stays open in the same browser session (survives navigation/refresh
// within that session, but never localStorage, so a closed browser or
// restarted computer clears it), and every module works exactly like the
// real product would once purchased. Nothing here ever calls Supabase.

export interface DemoModule {
  key: string;
  name: string;
  description: string;
  category: string;
  monthlyPriceUsd: number;
  enabled: boolean;
}

export interface DemoBranch {
  id: string;
  name: string;
  type: "head_office" | "branch" | "warehouse";
}

export interface DemoCustomer {
  id: string;
  name: string;
  email: string;
  phone: string;
  isActive: boolean;
}

export interface DemoProduct {
  id: string;
  sku: string;
  name: string;
  costPrice: number;
  sellingPrice: number;
  stockOnHand: number;
}

export interface DemoSaleLine {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
}

export interface DemoSale {
  id: string;
  invoiceNumber: string;
  customerName: string;
  lines: DemoSaleLine[];
  total: number;
  createdAt: string;
}

export interface DemoUser {
  id: string;
  fullName: string;
  email: string;
  roleName: string;
  status: "active" | "invited";
}

export interface DemoRole {
  id: string;
  name: string;
  isSystem: boolean;
  permissions: Set<string>;
}

export interface DemoSupplier {
  id: string;
  name: string;
  email: string;
  phone: string;
}

export interface DemoPurchaseOrder {
  id: string;
  poNumber: string;
  supplierName: string;
  status: "draft" | "issued" | "received" | "cancelled";
  total: number;
  createdAt: string;
}

export interface DemoAccount {
  id: string;
  code: string;
  name: string;
  type: "asset" | "liability" | "equity" | "income" | "expense";
}

export interface DemoExpense {
  id: string;
  description: string;
  amount: number;
  accountName: string;
  expenseDate: string;
}

export interface DemoEmployee {
  id: string;
  employeeNumber: string;
  fullName: string;
  position: string;
  department: string;
  employmentStatus: "active" | "on_leave" | "terminated";
}

export interface DemoLead {
  id: string;
  name: string;
  company: string;
  status: "new" | "contacted" | "qualified" | "converted" | "lost";
}

export interface DemoOpportunity {
  id: string;
  name: string;
  customerName: string;
  stage: "prospecting" | "proposal" | "negotiation" | "won" | "lost";
  value: number;
}

export interface DemoProject {
  id: string;
  name: string;
  customerName: string;
  status: "planning" | "active" | "on_hold" | "completed" | "cancelled";
  budget: number;
}

export interface DemoAsset {
  id: string;
  assetNumber: string;
  name: string;
  category: string;
  purchaseCost: number;
  status: "in_use" | "in_maintenance" | "disposed";
}

export interface DemoTicket {
  id: string;
  ticketNumber: string;
  subject: string;
  customerName: string;
  priority: "low" | "medium" | "high" | "urgent";
  status: "open" | "in_progress" | "resolved" | "closed";
}

export interface DemoVehicle {
  id: string;
  registrationNumber: string;
  make: string;
  model: string;
  status: "active" | "in_maintenance" | "inactive";
  odometerKm: number;
  driverName: string;
}

export interface DemoDocument {
  id: string;
  title: string;
  category: string;
  fileName: string;
  uploadedAt: string;
}

export interface DemoCampaign {
  id: string;
  name: string;
  channel: "sms" | "email" | "whatsapp" | "social" | "other";
  status: "draft" | "scheduled" | "sent" | "cancelled";
  message: string;
}

export interface DemoLoyaltyTransaction {
  id: string;
  customerName: string;
  points: number;
  type: "earn" | "redeem" | "adjustment";
  reason: string;
}

export interface DemoBom {
  id: string;
  name: string;
  revision: string;
  productName: string;
  yieldQuantity: number;
  componentCount: number;
  estimatedUnitCost: number;
}

export interface DemoWorkOrder {
  id: string;
  woNumber: string;
  bomName: string;
  productName: string;
  quantityPlanned: number;
  quantityProduced: number;
  status: "planned" | "in_progress" | "completed" | "cancelled";
}

export interface DemoOnlineProduct {
  id: string;
  productName: string;
  slug: string;
  onlinePrice: number;
  isPublished: boolean;
}

export interface DemoOnlineOrder {
  id: string;
  orderNumber: string;
  buyerName: string;
  total: number;
  status: "pending" | "confirmed" | "fulfilled" | "cancelled";
  deliveryStatus: "not_shipped" | "shipped" | "delivered";
}

export interface DemoIbanRequest {
  id: string;
  currency: string;
  status: "pending" | "active" | "suspended" | "closed";
  notes: string;
  requestedAt: string;
}

export interface DemoSocialAccount {
  id: string;
  platform: string;
  handle: string;
  connected: boolean;
}

export interface DemoSocialPost {
  id: string;
  platform: string;
  message: string;
  status: "draft" | "queued";
  createdAt: string;
}

export interface DemoTaxFiling {
  id: string;
  taxType: string;
  period: string;
  dueDate: string;
  status: "draft" | "submitted" | "accepted" | "rejected" | "paid";
  notes: string;
}

export interface DemoTender {
  id: string;
  tenderNumber: string;
  title: string;
  status: "draft" | "published" | "closed" | "awarded" | "cancelled";
  closingDate: string;
  estimatedValue: number;
}

export interface DemoTenderBid {
  id: string;
  tenderId: string;
  supplierName: string;
  bidAmount: number;
  status: "submitted" | "under_review" | "shortlisted" | "rejected" | "awarded" | "withdrawn";
}

export interface DemoInsurer {
  id: string;
  name: string;
  code: string;
  contactPerson: string;
  email: string;
  phone: string;
}

export interface DemoInsurancePolicy {
  id: string;
  policyNumber: string;
  insurerName: string;
  policyType: string;
  coverageType: string;
  sumInsured: number;
  premium: number;
  endDate: string;
  status: "active" | "expired" | "cancelled" | "pending_renewal";
}

export interface DemoInsuranceClaim {
  id: string;
  policyId: string;
  claimNumber: string;
  incidentDate: string;
  incidentDescription: string;
  claimAmount: number;
  status: "draft" | "submitted" | "under_review" | "approved" | "rejected" | "paid" | "closed";
}

export interface DemoRiskAssessment {
  id: string;
  title: string;
  category: string;
  riskLevel: "low" | "medium" | "high" | "critical";
  riskScore: number;
  reviewDate: string;
  status: "open" | "mitigating" | "mitigated" | "accepted" | "closed";
}

export interface DemoWarehouse {
  id: string;
  code: string;
  name: string;
  address: string;
  managerName: string;
  status: "active" | "inactive" | "maintenance" | "closed";
}

export interface DemoWarehouseZone {
  id: string;
  warehouseId: string;
  warehouseName: string;
  code: string;
  name: string;
  zoneType: string;
  capacity: string;
}

export interface DemoStockTake {
  id: string;
  stockTakeNumber: string;
  title: string;
  branchName: string;
  countType: "full" | "partial" | "cycle" | "spot";
  status: "planned" | "in_progress" | "completed" | "cancelled" | "under_review";
  startedAt: string | null;
  completedAt: string | null;
  totalVarianceValue: number | null;
}

export interface DemoStockTakeLine {
  id: string;
  stockTakeId: string;
  productName: string;
  systemQuantity: number;
  countedQuantity: number | null;
  variance: number | null;
  countStatus: "pending" | "counted" | "verified" | "discrepancy";
}

export interface DemoSheqIncident {
  id: string;
  incidentNumber: string;
  incidentType: string;
  severity: "minor" | "moderate" | "major" | "critical";
  title: string;
  description: string;
  location: string;
  dateOccurred: string;
  status: "open" | "under_investigation" | "closed" | "archived";
  correctiveActions: string | null;
}

export interface DemoSheqInspection {
  id: string;
  inspectionNumber: string;
  inspectionType: string;
  title: string;
  scheduledDate: string;
  status: "scheduled" | "in_progress" | "completed" | "cancelled" | "overdue";
  nonConformities: number | null;
  findings: string | null;
}

export interface DemoDisciplinaryCase {
  id: string;
  caseNumber: string;
  employeeName: string;
  violationType: string;
  severity: "minor" | "moderate" | "major" | "gross";
  title: string;
  incidentDate: string;
  status: "open" | "under_investigation" | "hearing_scheduled" | "hearing_completed" | "action_taken" | "appealed" | "closed";
  hearingDate: string | null;
}

export interface DemoDisciplinaryWarning {
  id: string;
  employeeName: string;
  warningType: "verbal" | "written" | "final";
  reason: string;
  issuedDate: string;
}

export interface DemoEmailSettings {
  fromAddress: string;
  fromName: string;
  smtpHost: string;
  smtpPort: number;
  isConfigured: boolean;
}

export interface DemoEmailLogEntry {
  id: string;
  to: string;
  subject: string;
  status: "sent" | "failed";
  sentAt: string;
}

export interface DemoAuditEntry {
  id: string;
  action: string;
  actor: string;
  createdAt: string;
}

export interface DemoShipment {
  id: string;
  shipmentNumber: string;
  customerName: string | null;
  carrier: string | null;
  vehicleRegistration: string | null;
  deliveryAddress: string;
  status: "pending" | "dispatched" | "in_transit" | "delivered" | "failed" | "returned";
  dispatchedAt: string | null;
  deliveredAt: string | null;
}

export type CustomCodeType = "css" | "html";

export interface DemoCustomCodeVersion {
  version: number;
  content: string;
  createdAt: string;
}

export interface DemoCustomCodeEntry {
  content: string;
  version: number;
  history: DemoCustomCodeVersion[];
}

export interface DemoIntegrationProvider {
  key: string;
  name: string;
  category: "mobile_money" | "gateway" | "bank_rail" | "card" | "sms" | "tax";
  description: string;
}

export interface DemoIntegrationConnection {
  providerKey: string;
  accountLabel: string;
}

export const DEMO_INTEGRATION_PROVIDERS: DemoIntegrationProvider[] = [
  { key: "ecocash", name: "EcoCash", category: "mobile_money", description: "Econet's mobile money wallet, the most widely used in Zimbabwe." },
  { key: "onemoney", name: "OneMoney", category: "mobile_money", description: "NetOne's mobile money wallet." },
  { key: "omari", name: "Omari", category: "mobile_money", description: "CBZ Bank's mobile wallet." },
  { key: "innbucks", name: "InnBucks", category: "mobile_money", description: "Steward Bank's digital wallet." },
  { key: "zeepay", name: "Zeepay", category: "mobile_money", description: "Pan-African mobile money aggregator operating in Zimbabwe." },
  { key: "contipay", name: "ContiPay", category: "mobile_money", description: "Zimbabwean payment aggregator covering mobile money and cards." },
  { key: "paynow", name: "Paynow", category: "gateway", description: "Zimbabwe's payment gateway aggregator (EcoCash, OneMoney, Visa, Mastercard, ZIPIT in one integration)." },
  { key: "stripe", name: "Stripe", category: "gateway", description: "International card and online payment gateway, for businesses billing customers abroad." },
  { key: "payfast", name: "PayFast", category: "gateway", description: "Southern African online payment gateway (cards, EFT) used by some Zimbabwean online businesses." },
  { key: "zipit", name: "ZIPIT", category: "bank_rail", description: "RTGS-backed instant interbank transfer, used directly or through a bank." },
  { key: "zimswitch", name: "ZimSwitch", category: "bank_rail", description: "Zimbabwe's national interbank switch (POS, ATM, and instant payments)." },
  { key: "card", name: "Visa / Mastercard", category: "card", description: "Card acquiring, typically routed through a local bank or Paynow." },
  { key: "afrosoft", name: "Afrosoft", category: "sms", description: "Zimbabwean bulk SMS gateway." },
  { key: "africas_talking", name: "Africa's Talking", category: "sms", description: "Pan-African SMS, USSD, and airtime API commonly used by Zimbabwean businesses." },
  { key: "whatsapp_business", name: "WhatsApp Business", category: "sms", description: "WhatsApp Business Cloud API for quotes, receipts, and customer messages." },
  { key: "twilio", name: "Twilio", category: "sms", description: "International SMS and messaging API." },
  { key: "zimra", name: "ZIMRA e-Services", category: "tax", description: "Zimbabwe Revenue Authority fiscalisation and e-invoicing (FDMS)." },
];

export const DEMO_PERMISSIONS = [
  { key: "branches.manage", label: "Manage branches" },
  { key: "users.manage", label: "Manage users" },
  { key: "roles.manage", label: "Manage roles" },
  { key: "modules.manage", label: "Manage modules" },
  { key: "sales.manage", label: "Manage sales" },
  { key: "inventory.manage", label: "Manage inventory" },
];

const MODULE_CATALOG: Array<Omit<DemoModule, "enabled">> = [
  { key: "sales", name: "Sales", description: "Customers, quotations, sales orders, invoices, payments", category: "sales", monthlyPriceUsd: 15 },
  { key: "pos", name: "Point of Sale", description: "Cashiers, registers, sessions, receipts, returns", category: "sales", monthlyPriceUsd: 20 },
  { key: "inventory", name: "Inventory", description: "Products, warehouses, stock, transfers, adjustments", category: "operations", monthlyPriceUsd: 15 },
  { key: "purchasing", name: "Purchasing", description: "Suppliers, purchase orders, goods received", category: "operations", monthlyPriceUsd: 12 },
  { key: "finance", name: "Finance", description: "Chart of accounts, general ledger, cashbook, reconciliation", category: "finance", monthlyPriceUsd: 25 },
  { key: "crm", name: "CRM", description: "Leads, opportunities, activities, campaigns", category: "sales", monthlyPriceUsd: 12 },
  { key: "hr", name: "HR", description: "Employees, attendance, leave, payroll", category: "people", monthlyPriceUsd: 18 },
  { key: "payroll", name: "Payroll", description: "Salary structures, payroll runs, printable payslips", category: "people", monthlyPriceUsd: 15 },
  { key: "manufacturing", name: "Manufacturing", description: "Bills of materials, work orders, production planning", category: "operations", monthlyPriceUsd: 25 },
  { key: "projects", name: "Projects", description: "Projects, tasks, milestones, timesheets", category: "operations", monthlyPriceUsd: 15 },
  { key: "assets", name: "Assets", description: "Fixed assets, maintenance, depreciation", category: "operations", monthlyPriceUsd: 10 },
  { key: "service_management", name: "Service Management", description: "Tickets, service requests, SLAs, warranty", category: "operations", monthlyPriceUsd: 15 },
  { key: "fleet", name: "Fleet", description: "Vehicles, drivers, fuel, maintenance", category: "operations", monthlyPriceUsd: 12 },
  { key: "documents", name: "Document Management", description: "Documents, folders, versions, approvals", category: "platform", monthlyPriceUsd: 8 },
  { key: "marketing", name: "Marketing", description: "Campaigns, SMS, email, WhatsApp, loyalty", category: "sales", monthlyPriceUsd: 12 },
  { key: "reporting", name: "Reporting / BI", description: "Custom dashboards, KPIs, scheduled reports", category: "platform", monthlyPriceUsd: 15 },
  { key: "ecommerce", name: "Ecommerce", description: "Online products, orders, delivery sync", category: "sales", monthlyPriceUsd: 20 },
  { key: "local_services", name: "Local Services", description: "Pre-integrated Zimbabwean and regional payment, mobile money, banking, SMS, and tax services", category: "platform", monthlyPriceUsd: 15 },
  { key: "logistics", name: "Logistics", description: "Shipments, deliveries, carriers, and dispatch tracking", category: "operations", monthlyPriceUsd: 15 },
  { key: "custom_code", name: "Custom Code", description: "Custom CSS and HTML for your workspace, versioned with rollback", category: "platform", monthlyPriceUsd: 10 },
  { key: "iban", name: "International Payments (IBAN)", description: "Request your own IBAN to receive international payments, provisioned through a banking partner", category: "finance", monthlyPriceUsd: 25 },
  { key: "social_media", name: "Social Media", description: "Connect social accounts and queue posts across platforms from one place", category: "marketing", monthlyPriceUsd: 12 },
  { key: "tax_compliance", name: "Tax Compliance & ZIMRA", description: "Track tax periods, filings, payments, and fiscal device registrations aligned to ZIMRA's tax calendar", category: "finance", monthlyPriceUsd: 15 },
  { key: "tender_bidding", name: "Tender & Bidding", description: "Create tenders when sourcing suppliers, receive and evaluate bids, and track the tender lifecycle through to award", category: "procurement", monthlyPriceUsd: 15 },
  { key: "risk_insurance", name: "Risk & Insurance", description: "Onboard insurers, manage policies, process claims, and maintain a risk register with mitigation plans", category: "operations", monthlyPriceUsd: 18 },
  { key: "warehousing", name: "Warehousing", description: "Manage warehouses, storage zones, and bins, and track exactly where stock sits inside each site", category: "operations", monthlyPriceUsd: 15 },
  { key: "stock_take", name: "Stock Take", description: "Schedule physical inventory counts, record counted quantities against system quantities, and resolve variances", category: "operations", monthlyPriceUsd: 12 },
  { key: "sheq", name: "SHEQ", description: "Track safety, health, environment, and quality incidents, conduct inspections and audits, and manage corrective actions", category: "operations", monthlyPriceUsd: 15 },
  { key: "disciplinary", name: "Disciplinary", description: "Manage employee disciplinary cases, warnings, hearings, and conduct records", category: "operations", monthlyPriceUsd: 15 },
  { key: "email", name: "Email", description: "Configure your own SMTP settings and keep a log of emails sent from the system", category: "platform", monthlyPriceUsd: 8 },
];

// The demo exists to show a prospective client everything they would get —
// so, unlike a real new org (which starts with nothing enabled), every
// module here starts on.
function seedModules(): DemoModule[] {
  return MODULE_CATALOG.map((m) => ({ ...m, enabled: true }));
}

function seedBranches(): DemoBranch[] {
  return [
    { id: "br-1", name: "Head Office - Harare", type: "head_office" },
    { id: "br-2", name: "Bulawayo Branch", type: "branch" },
  ];
}

function seedCustomers(): DemoCustomer[] {
  return [
    { id: "cu-1", name: "Tendai Moyo", email: "tendai@example.com", phone: "0771234567", isActive: true },
    { id: "cu-2", name: "Rutendo Traders (Pvt) Ltd", email: "accounts@rutendo.co.zw", phone: "0772345678", isActive: true },
  ];
}

function seedProducts(): DemoProduct[] {
  return [
    { id: "pr-1", sku: "SKU-001", name: "Bag of Cement 50kg", costPrice: 8, sellingPrice: 12, stockOnHand: 120 },
    { id: "pr-2", sku: "SKU-002", name: "Roofing Sheet 3m", costPrice: 14, sellingPrice: 22, stockOnHand: 45 },
    { id: "pr-3", sku: "SKU-003", name: "Paint 20L White", costPrice: 25, sellingPrice: 38, stockOnHand: 18 },
  ];
}

function seedSales(): DemoSale[] {
  const now = Date.now();
  const day = 86400000;
  return [
    {
      id: "sl-1",
      invoiceNumber: "INV-0001",
      customerName: "Tendai Moyo",
      lines: [{ productId: "pr-1", productName: "Bag of Cement 50kg", quantity: 10, unitPrice: 12 }],
      total: 120,
      createdAt: new Date(now - 2 * day).toISOString(),
    },
    {
      id: "sl-2",
      invoiceNumber: "INV-0002",
      customerName: "Rutendo Traders (Pvt) Ltd",
      lines: [
        { productId: "pr-2", productName: "Roofing Sheet 3m", quantity: 8, unitPrice: 22 },
        { productId: "pr-3", productName: "Paint 20L White", quantity: 2, unitPrice: 38 },
      ],
      total: 252,
      createdAt: new Date(now - day).toISOString(),
    },
  ];
}

function seedUsers(): DemoUser[] {
  return [
    { id: "us-1", fullName: "You (Demo Owner)", email: "you@demo.quickbiz.local", roleName: "Owner", status: "active" },
    { id: "us-2", fullName: "Chipo Ndlovu", email: "chipo@demo.quickbiz.local", roleName: "Manager", status: "active" },
  ];
}

function seedRoles(): DemoRole[] {
  return [
    { id: "rl-1", name: "Owner", isSystem: true, permissions: new Set(DEMO_PERMISSIONS.map((p) => p.key)) },
    { id: "rl-2", name: "Manager", isSystem: true, permissions: new Set(["sales.manage", "inventory.manage"]) },
    { id: "rl-3", name: "Team Leader", isSystem: true, permissions: new Set() },
    { id: "rl-4", name: "Custom: Warehouse Lead", isSystem: false, permissions: new Set(["inventory.manage"]) },
  ];
}

function seedSuppliers(): DemoSupplier[] {
  return [{ id: "sp-1", name: "Harare Building Supplies", email: "sales@hbs.co.zw", phone: "0242123456" }];
}

function seedPurchaseOrders(): DemoPurchaseOrder[] {
  return [
    {
      id: "po-1",
      poNumber: "PO-0001",
      supplierName: "Harare Building Supplies",
      status: "received",
      total: 640,
      createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
    },
  ];
}

function seedAccounts(): DemoAccount[] {
  return [
    { id: "ac-1", code: "4000", name: "Sales Revenue", type: "income" },
    { id: "ac-2", code: "5000", name: "Cost of Goods Sold", type: "expense" },
    { id: "ac-3", code: "6100", name: "Rent", type: "expense" },
    { id: "ac-4", code: "6200", name: "Utilities", type: "expense" },
  ];
}

function seedExpenses(): DemoExpense[] {
  return [
    { id: "ex-1", description: "Office rent, August", amount: 400, accountName: "Rent", expenseDate: new Date(Date.now() - 3 * 86400000).toISOString().slice(0, 10) },
    { id: "ex-2", description: "Electricity", amount: 85, accountName: "Utilities", expenseDate: new Date(Date.now() - 1 * 86400000).toISOString().slice(0, 10) },
  ];
}

function seedEmployees(): DemoEmployee[] {
  return [
    { id: "em-1", employeeNumber: "EMP-001", fullName: "Chipo Ndlovu", position: "Branch Manager", department: "Operations", employmentStatus: "active" },
    { id: "em-2", employeeNumber: "EMP-002", fullName: "Tafadzwa Chirwa", position: "Warehouse Clerk", department: "Operations", employmentStatus: "active" },
  ];
}

function seedLeads(): DemoLead[] {
  return [{ id: "ld-1", name: "Farai Gumbo", company: "Gumbo Hardware", status: "qualified" }];
}

function seedOpportunities(): DemoOpportunity[] {
  return [{ id: "op-1", name: "Bulk cement order", customerName: "Rutendo Traders (Pvt) Ltd", stage: "proposal", value: 3200 }];
}

function seedProjects(): DemoProject[] {
  return [{ id: "pj-1", name: "Warehouse extension", customerName: "Rutendo Traders (Pvt) Ltd", status: "active", budget: 15000 }];
}

function seedAssets(): DemoAsset[] {
  return [{ id: "as-1", assetNumber: "AST-001", name: "Delivery Truck", category: "equipment", purchaseCost: 18000, status: "in_use" }];
}

function seedTickets(): DemoTicket[] {
  return [{ id: "tk-1", ticketNumber: "TKT-0001", subject: "Late delivery", customerName: "Tendai Moyo", priority: "medium", status: "open" }];
}

function seedVehicles(): DemoVehicle[] {
  return [{ id: "vh-1", registrationNumber: "ADX 1234", make: "Toyota", model: "Hilux", status: "active", odometerKm: 42000, driverName: "Tafadzwa Chirwa" }];
}

function seedDocuments(): DemoDocument[] {
  return [{ id: "dc-1", title: "Business Registration Certificate", category: "compliance", fileName: "registration.pdf", uploadedAt: new Date(Date.now() - 10 * 86400000).toISOString() }];
}

function seedCampaigns(): DemoCampaign[] {
  return [{ id: "cp-1", name: "August promo", channel: "whatsapp", status: "sent", message: "20% off cement this weekend" }];
}

function seedLoyaltyTransactions(): DemoLoyaltyTransaction[] {
  return [{ id: "lt-1", customerName: "Tendai Moyo", points: 100, type: "earn", reason: "Purchase reward" }];
}

function seedBoms(): DemoBom[] {
  return [
    { id: "bm-1", name: "Standard mix", revision: "B", productName: "Ready-mix Concrete (1m3)", yieldQuantity: 4, componentCount: 3, estimatedUnitCost: 18.5 },
  ];
}

function seedWorkOrders(): DemoWorkOrder[] {
  return [{ id: "wo-1", woNumber: "WO-0001", bomName: "Standard mix", productName: "Ready-mix Concrete (1m3)", quantityPlanned: 20, quantityProduced: 20, status: "completed" }];
}

function seedOnlineProducts(): DemoOnlineProduct[] {
  return [{ id: "onp-1", productName: "Bag of Cement 50kg", slug: "cement-50kg", onlinePrice: 13, isPublished: true }];
}

function seedOnlineOrders(): DemoOnlineOrder[] {
  return [{ id: "oo-1", orderNumber: "OO-0001", buyerName: "Farai Gumbo", total: 65, status: "confirmed", deliveryStatus: "not_shipped" }];
}

let idCounter = 1;
function nextId(prefix: string) {
  idCounter += 1;
  return `${prefix}-demo-${idCounter}`;
}

function numbered(prefix: string, count: number): string {
  return `${prefix}-${String(count + 1).padStart(4, "0")}`;
}

interface DemoState {
  orgName: string;
  themeColor: string | null;
  branches: DemoBranch[];
  customers: DemoCustomer[];
  products: DemoProduct[];
  sales: DemoSale[];
  users: DemoUser[];
  roles: DemoRole[];
  modules: DemoModule[];
  suppliers: DemoSupplier[];
  purchaseOrders: DemoPurchaseOrder[];
  accounts: DemoAccount[];
  expenses: DemoExpense[];
  employees: DemoEmployee[];
  leads: DemoLead[];
  opportunities: DemoOpportunity[];
  projects: DemoProject[];
  assets: DemoAsset[];
  tickets: DemoTicket[];
  vehicles: DemoVehicle[];
  documents: DemoDocument[];
  campaigns: DemoCampaign[];
  loyaltyTransactions: DemoLoyaltyTransaction[];
  boms: DemoBom[];
  workOrders: DemoWorkOrder[];
  onlineProducts: DemoOnlineProduct[];
  onlineOrders: DemoOnlineOrder[];
  auditLog: DemoAuditEntry[];
  integrationConnections: DemoIntegrationConnection[];
  shipments: DemoShipment[];
  ibanRequests: DemoIbanRequest[];
  socialAccounts: DemoSocialAccount[];
  socialPosts: DemoSocialPost[];
  taxFilings: DemoTaxFiling[];
  tenders: DemoTender[];
  tenderBids: DemoTenderBid[];
  insurers: DemoInsurer[];
  insurancePolicies: DemoInsurancePolicy[];
  insuranceClaims: DemoInsuranceClaim[];
  riskAssessments: DemoRiskAssessment[];
  warehouses: DemoWarehouse[];
  warehouseZones: DemoWarehouseZone[];
  stockTakes: DemoStockTake[];
  stockTakeLines: DemoStockTakeLine[];
  sheqIncidents: DemoSheqIncident[];
  sheqInspections: DemoSheqInspection[];
  disciplinaryCases: DemoDisciplinaryCase[];
  disciplinaryWarnings: DemoDisciplinaryWarning[];
  emailSettings: DemoEmailSettings;
  emailLogs: DemoEmailLogEntry[];
  customCode: Record<CustomCodeType, DemoCustomCodeEntry>;
}

interface DemoContextValue extends DemoState {
  addBranch: (name: string, type: DemoBranch["type"]) => void;
  addCustomer: (input: { name: string; email: string; phone: string }) => void;
  addProduct: (input: { sku: string; name: string; costPrice: number; sellingPrice: number; stockOnHand: number }) => void;
  createSale: (customerName: string, lines: Array<{ productId: string; quantity: number }>) => void;
  inviteUser: (fullName: string, email: string, roleName: string) => void;
  toggleModule: (key: string) => void;
  toggleRolePermission: (roleId: string, permissionKey: string) => void;
  addSupplier: (input: { name: string; email: string; phone: string }) => void;
  createPurchaseOrder: (supplierName: string, total: number) => void;
  addExpense: (input: { description: string; amount: number; accountName: string }) => void;
  addAccount: (input: { code: string; name: string; type: DemoAccount["type"] }) => void;
  addEmployee: (input: { fullName: string; position: string; department: string }) => void;
  addLead: (input: { name: string; company: string }) => void;
  convertLead: (leadId: string) => void;
  addOpportunity: (input: { name: string; customerName: string; value: number }) => void;
  setOpportunityStage: (id: string, stage: DemoOpportunity["stage"]) => void;
  addProject: (input: { name: string; customerName: string; budget: number }) => void;
  addAsset: (input: { name: string; category: string; purchaseCost: number }) => void;
  createTicket: (input: { subject: string; customerName: string; priority: DemoTicket["priority"] }) => void;
  setTicketStatus: (id: string, status: DemoTicket["status"]) => void;
  addVehicle: (input: { registrationNumber: string; make: string; model: string; driverName: string }) => void;
  logFuel: (vehicleId: string, kmAdded: number) => void;
  addDocument: (input: { title: string; category: string; fileName: string }) => void;
  addCampaign: (input: { name: string; channel: DemoCampaign["channel"]; message: string }) => void;
  setCampaignStatus: (id: string, status: DemoCampaign["status"]) => void;
  recordLoyaltyTransaction: (input: { customerName: string; points: number; type: DemoLoyaltyTransaction["type"]; reason: string }) => void;
  createBom: (input: { name: string; productName: string; componentCount: number; yieldQuantity: number; estimatedUnitCost: number }) => void;
  createWorkOrder: (input: { bomName: string; productName: string; quantityPlanned: number }) => void;
  completeWorkOrder: (id: string) => void;
  publishOnlineProduct: (input: { productName: string; slug: string; onlinePrice: number }) => void;
  toggleOnlineProductPublished: (id: string) => void;
  createOnlineOrder: (input: { buyerName: string; total: number }) => void;
  setOnlineOrderStatus: (id: string, status: DemoOnlineOrder["status"]) => void;
  setOnlineOrderDeliveryStatus: (id: string, deliveryStatus: DemoOnlineOrder["deliveryStatus"]) => void;
  updateOrgName: (name: string) => void;
  updateThemeColor: (color: string) => void;
  connectProviderIntegration: (providerKey: string, accountLabel: string) => void;
  disconnectProviderIntegration: (providerKey: string) => void;
  createShipment: (input: { customerName: string; carrier: string; vehicleRegistration: string; deliveryAddress: string }) => void;
  setShipmentStatus: (id: string, status: DemoShipment["status"]) => void;
  requestIban: (currency: string, notes: string) => void;
  connectSocialAccount: (platform: string, handle: string) => void;
  queueSocialPost: (platform: string, message: string) => void;
  createTaxFiling: (input: { taxType: string; period: string; dueDate: string; notes: string }) => void;
  submitTaxFiling: (id: string) => void;
  createTender: (input: { title: string; closingDate: string; estimatedValue: number }) => void;
  submitBid: (tenderId: string, supplierName: string, bidAmount: number) => void;
  awardTender: (tenderId: string, bidId: string) => void;
  addInsurer: (input: { name: string; code: string; contactPerson: string; email: string; phone: string }) => void;
  createInsurancePolicy: (input: {
    insurerName: string;
    policyNumber: string;
    policyType: string;
    coverageType: string;
    sumInsured: number;
    premium: number;
    endDate: string;
  }) => void;
  submitInsuranceClaim: (policyId: string, incidentDate: string, incidentDescription: string, claimAmount: number) => void;
  createRiskAssessment: (input: { title: string; category: string; likelihood: number; impact: number; reviewDate: string }) => void;
  addWarehouse: (input: { code: string; name: string; address: string; managerName: string }) => void;
  createWarehouseZone: (input: { warehouseId: string; code: string; name: string; zoneType: string; capacity: string }) => void;
  startStockTake: (input: { title: string; branchName: string; countType: DemoStockTake["countType"] }) => void;
  recordStockTakeCount: (lineId: string, countedQuantity: number) => void;
  completeStockTake: (id: string) => void;
  reportIncident: (input: { incidentType: string; severity: DemoSheqIncident["severity"]; title: string; description: string; location: string }) => void;
  recordIncidentCorrectiveAction: (id: string, correctiveActions: string) => void;
  closeIncident: (id: string) => void;
  scheduleInspection: (input: { inspectionType: string; title: string; scheduledDate: string }) => void;
  completeInspection: (id: string, input: { findings: string; nonConformities: number }) => void;
  openDisciplinaryCase: (input: { employeeName: string; violationType: string; severity: DemoDisciplinaryCase["severity"]; title: string; incidentDate: string }) => void;
  scheduleDisciplinaryHearing: (id: string, hearingDate: string) => void;
  setDisciplinaryCaseStatus: (id: string, status: DemoDisciplinaryCase["status"]) => void;
  issueDisciplinaryWarning: (input: { employeeName: string; warningType: DemoDisciplinaryWarning["warningType"]; reason: string }) => void;
  updateEmailSettings: (input: { fromAddress: string; fromName: string; smtpHost: string; smtpPort: number }) => void;
  sendTestEmail: (to: string) => void;
  saveCustomCode: (codeType: CustomCodeType, content: string) => void;
  rollbackCustomCode: (codeType: CustomCodeType, targetVersion: number) => void;
}

const DemoContext = createContext<DemoContextValue | null>(null);

function seedAuditLog(): DemoAuditEntry[] {
  return [{ id: "au-1", action: "Organization created", actor: "You (Demo Owner)", createdAt: new Date(Date.now() - 30 * 86400000).toISOString() }];
}

function seedIntegrationConnections(): DemoIntegrationConnection[] {
  return [{ providerKey: "ecocash", accountLabel: "0771234567" }];
}

function seedShipments(): DemoShipment[] {
  return [
    {
      id: "sh-1",
      shipmentNumber: "SHP-0001",
      customerName: "Rutendo Traders (Pvt) Ltd",
      carrier: null,
      vehicleRegistration: "ADX 1234",
      deliveryAddress: "45 Samora Machel Ave, Harare",
      status: "delivered",
      dispatchedAt: new Date(Date.now() - 3 * 86400000).toISOString(),
      deliveredAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    },
  ];
}

function seedIbanRequests(): DemoIbanRequest[] {
  return [
    { id: "ib-1", currency: "EUR", status: "active", notes: "For invoicing our German supplier", requestedAt: new Date(Date.now() - 20 * 86400000).toISOString() },
    { id: "ib-2", currency: "USD", status: "pending", notes: "", requestedAt: new Date(Date.now() - 2 * 86400000).toISOString() },
  ];
}

function seedSocialAccounts(): DemoSocialAccount[] {
  return [{ id: "sa-1", platform: "facebook", handle: "@demo-company", connected: true }];
}

function seedSocialPosts(): DemoSocialPost[] {
  return [
    {
      id: "sp-1",
      platform: "facebook",
      message: "We just launched our new product line - check it out!",
      status: "queued",
      createdAt: new Date(Date.now() - 1 * 86400000).toISOString(),
    },
  ];
}

function seedTaxFilings(): DemoTaxFiling[] {
  return [
    {
      id: "tf-1",
      taxType: "PAYE",
      period: "August 2026",
      dueDate: new Date(Date.now() - 4 * 86400000).toISOString(),
      status: "paid",
      notes: "Filed and paid through ZIMRA e-Services",
    },
    {
      id: "tf-2",
      taxType: "VAT",
      period: "August 2026",
      dueDate: new Date(Date.now() - 1 * 86400000).toISOString(),
      status: "submitted",
      notes: "",
    },
    {
      id: "tf-3",
      taxType: "Withholding Tax",
      period: "September 2026",
      dueDate: new Date(Date.now() + 5 * 86400000).toISOString(),
      status: "draft",
      notes: "",
    },
  ];
}

function seedTenders(): DemoTender[] {
  return [
    {
      id: "tn-1",
      tenderNumber: "TDR-0001",
      title: "Supply of Office Furniture",
      status: "published",
      closingDate: new Date(Date.now() + 10 * 86400000).toISOString(),
      estimatedValue: 8500,
    },
    {
      id: "tn-2",
      tenderNumber: "TDR-0002",
      title: "Annual Fleet Maintenance Contract",
      status: "awarded",
      closingDate: new Date(Date.now() - 5 * 86400000).toISOString(),
      estimatedValue: 15000,
    },
  ];
}

function seedTenderBids(): DemoTenderBid[] {
  return [
    { id: "tb-1", tenderId: "tn-1", supplierName: "Harare Building Supplies", bidAmount: 8200, status: "submitted" },
    { id: "tb-2", tenderId: "tn-1", supplierName: "Midlands Office Solutions", bidAmount: 7950, status: "submitted" },
    { id: "tb-3", tenderId: "tn-2", supplierName: "Harare Building Supplies", bidAmount: 14200, status: "awarded" },
  ];
}

function seedInsurers(): DemoInsurer[] {
  return [
    { id: "ins-1", name: "Old Mutual", code: "OM-001", contactPerson: "Tendai Moyo", email: "info@oldmutual.co.zw", phone: "+263 4 777 777" },
    { id: "ins-2", name: "CBZ Insurance", code: "CBZ-001", contactPerson: "Rutendo Chuma", email: "insurance@cbz.co.zw", phone: "+263 4 777 000" },
  ];
}

function seedInsurancePolicies(): DemoInsurancePolicy[] {
  return [
    {
      id: "pol-1",
      policyNumber: "POL-0001",
      insurerName: "Old Mutual",
      policyType: "property",
      coverageType: "Fire and perils",
      sumInsured: 120000,
      premium: 850,
      endDate: new Date(Date.now() + 200 * 86400000).toISOString(),
      status: "active",
    },
    {
      id: "pol-2",
      policyNumber: "POL-0002",
      insurerName: "CBZ Insurance",
      policyType: "vehicle",
      coverageType: "Comprehensive",
      sumInsured: 25000,
      premium: 320,
      endDate: new Date(Date.now() + 45 * 86400000).toISOString(),
      status: "pending_renewal",
    },
  ];
}

function seedInsuranceClaims(): DemoInsuranceClaim[] {
  return [
    {
      id: "clm-1",
      policyId: "pol-2",
      claimNumber: "CLM-2026-A1B2C3",
      incidentDate: new Date(Date.now() - 20 * 86400000).toISOString(),
      incidentDescription: "Minor collision damage to front bumper.",
      claimAmount: 1200,
      status: "under_review",
    },
  ];
}

function seedRiskAssessments(): DemoRiskAssessment[] {
  return [
    {
      id: "risk-1",
      title: "Warehouse fire hazard",
      category: "operational",
      riskLevel: "high",
      riskScore: 12,
      reviewDate: new Date(Date.now() + 60 * 86400000).toISOString(),
      status: "mitigating",
    },
    {
      id: "risk-2",
      title: "Currency exchange volatility",
      category: "financial",
      riskLevel: "medium",
      riskScore: 8,
      reviewDate: new Date(Date.now() + 90 * 86400000).toISOString(),
      status: "open",
    },
  ];
}

function seedWarehouses(): DemoWarehouse[] {
  return [
    { id: "wh-1", code: "WH-HRE", name: "Harare Main Warehouse", address: "12 Seke Road, Harare", managerName: "Tafadzwa Ncube", status: "active" },
    { id: "wh-2", code: "WH-BYO", name: "Bulawayo Distribution Centre", address: "45 Fife Street, Bulawayo", managerName: "Nomsa Sibanda", status: "active" },
  ];
}

function seedWarehouseZones(): DemoWarehouseZone[] {
  return [
    { id: "wz-1", warehouseId: "wh-1", warehouseName: "Harare Main Warehouse", code: "A", name: "Receiving Bay", zoneType: "receiving", capacity: "200 sq m" },
    { id: "wz-2", warehouseId: "wh-1", warehouseName: "Harare Main Warehouse", code: "B", name: "Bulk Storage", zoneType: "storage", capacity: "800 sq m" },
    { id: "wz-3", warehouseId: "wh-2", warehouseName: "Bulawayo Distribution Centre", code: "A", name: "Picking Zone", zoneType: "picking", capacity: "150 sq m" },
  ];
}

function seedStockTakes(): DemoStockTake[] {
  return [
    {
      id: "stk-1",
      stockTakeNumber: "STK-20260901-A1B2C3",
      title: "September Full Count - Harare Main",
      branchName: "Harare Main Warehouse",
      countType: "full",
      status: "completed",
      startedAt: new Date(Date.now() - 10 * 86400000).toISOString(),
      completedAt: new Date(Date.now() - 9 * 86400000).toISOString(),
      totalVarianceValue: -42.5,
    },
    {
      id: "stk-2",
      stockTakeNumber: "STK-20260910-D4E5F6",
      title: "Spot Check - Fast Movers",
      branchName: "Bulawayo Distribution Centre",
      countType: "spot",
      status: "in_progress",
      startedAt: new Date(Date.now() - 1 * 86400000).toISOString(),
      completedAt: null,
      totalVarianceValue: null,
    },
  ];
}

function seedStockTakeLines(): DemoStockTakeLine[] {
  return [
    { id: "stl-1", stockTakeId: "stk-1", productName: "2kg Roller Meal", systemQuantity: 120, countedQuantity: 115, variance: -5, countStatus: "discrepancy" },
    { id: "stl-2", stockTakeId: "stk-1", productName: "500ml Cooking Oil", systemQuantity: 80, countedQuantity: 80, variance: 0, countStatus: "verified" },
    { id: "stl-3", stockTakeId: "stk-1", productName: "2L Coca-Cola", systemQuantity: 60, countedQuantity: 68, variance: 8, countStatus: "discrepancy" },
    { id: "stl-4", stockTakeId: "stk-2", productName: "Washing Powder 1kg", systemQuantity: 45, countedQuantity: null, variance: null, countStatus: "pending" },
    { id: "stl-5", stockTakeId: "stk-2", productName: "White Sugar 2kg", systemQuantity: 90, countedQuantity: null, variance: null, countStatus: "pending" },
  ];
}

function seedSheqIncidents(): DemoSheqIncident[] {
  return [
    {
      id: "shi-1",
      incidentNumber: "INC-20260905-A1B2C3",
      incidentType: "near_miss",
      severity: "moderate",
      title: "Forklift near-collision in loading bay",
      description: "A forklift operator braked sharply to avoid a pedestrian crossing the loading bay without a spotter.",
      location: "Harare Main Warehouse - Loading Bay",
      dateOccurred: new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10),
      status: "under_investigation",
      correctiveActions: "Repaint pedestrian walkway lines and require spotters during forklift operation.",
    },
    {
      id: "shi-2",
      incidentNumber: "INC-20260909-D4E5F6",
      incidentType: "injury",
      severity: "minor",
      title: "Employee cut hand on packaging strap",
      description: "Employee sustained a minor cut while cutting a packaging strap without protective gloves.",
      location: "Bulawayo Distribution Centre - Packing Area",
      dateOccurred: new Date(Date.now() - 2 * 86400000).toISOString().slice(0, 10),
      status: "open",
      correctiveActions: null,
    },
  ];
}

function seedSheqInspections(): DemoSheqInspection[] {
  return [
    {
      id: "shq-1",
      inspectionNumber: "INS-20260908-G7H8I9",
      inspectionType: "safety",
      title: "Monthly Fire Safety Walkthrough",
      scheduledDate: new Date(Date.now() - 4 * 86400000).toISOString().slice(0, 10),
      status: "completed",
      nonConformities: 2,
      findings: "Two fire extinguishers past their inspection date; replacement scheduled.",
    },
  ];
}

function seedDisciplinaryCases(): DemoDisciplinaryCase[] {
  return [
    {
      id: "dc-1",
      caseNumber: "DISC-20260830-A1B2C3",
      employeeName: "Tafadzwa Chirwa",
      violationType: "absenteeism",
      severity: "moderate",
      title: "Repeated unexplained absences",
      incidentDate: new Date(Date.now() - 10 * 86400000).toISOString().slice(0, 10),
      status: "hearing_scheduled",
      hearingDate: new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10),
    },
    {
      id: "dc-2",
      caseNumber: "DISC-20260901-D4E5F6",
      employeeName: "Chipo Ndlovu",
      violationType: "policy_violation",
      severity: "minor",
      title: "Late clock-in policy breach",
      incidentDate: new Date(Date.now() - 5 * 86400000).toISOString().slice(0, 10),
      status: "open",
      hearingDate: null,
    },
  ];
}

function seedDisciplinaryWarnings(): DemoDisciplinaryWarning[] {
  return [
    {
      id: "dw-1",
      employeeName: "Chipo Ndlovu",
      warningType: "verbal",
      reason: "Late clock-in on three occasions this month.",
      issuedDate: new Date(Date.now() - 4 * 86400000).toISOString().slice(0, 10),
    },
  ];
}

function seedEmailSettings(): DemoEmailSettings {
  return {
    fromAddress: "notifications@democompany.co.zw",
    fromName: "Demo Company (Pvt) Ltd",
    smtpHost: "smtp.office365.com",
    smtpPort: 587,
    isConfigured: true,
  };
}

function seedEmailLogs(): DemoEmailLogEntry[] {
  return [
    { id: "el-1", to: "customer1@example.com", subject: "Invoice INV-2026-0142", status: "sent", sentAt: new Date(Date.now() - 2 * 86400000).toISOString() },
    { id: "el-2", to: "customer2@example.com", subject: "Receipt for payment received", status: "sent", sentAt: new Date(Date.now() - 1 * 86400000).toISOString() },
    { id: "el-3", to: "unreachable@example.com", subject: "Purchase Order PO-0098", status: "failed", sentAt: new Date(Date.now() - 6 * 3600000).toISOString() },
  ];
}

function seedCustomCode(): Record<CustomCodeType, DemoCustomCodeEntry> {
  return {
    css: { content: "", version: 0, history: [] },
    html: { content: "", version: 0, history: [] },
  };
}

export function DemoProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<DemoState>(() => ({
    orgName: "Demo Company (Pvt) Ltd",
    themeColor: null,
    branches: seedBranches(),
    customers: seedCustomers(),
    products: seedProducts(),
    sales: seedSales(),
    users: seedUsers(),
    roles: seedRoles(),
    modules: seedModules(),
    suppliers: seedSuppliers(),
    purchaseOrders: seedPurchaseOrders(),
    accounts: seedAccounts(),
    expenses: seedExpenses(),
    employees: seedEmployees(),
    leads: seedLeads(),
    opportunities: seedOpportunities(),
    projects: seedProjects(),
    assets: seedAssets(),
    tickets: seedTickets(),
    vehicles: seedVehicles(),
    documents: seedDocuments(),
    campaigns: seedCampaigns(),
    loyaltyTransactions: seedLoyaltyTransactions(),
    boms: seedBoms(),
    workOrders: seedWorkOrders(),
    onlineProducts: seedOnlineProducts(),
    onlineOrders: seedOnlineOrders(),
    auditLog: seedAuditLog(),
    integrationConnections: seedIntegrationConnections(),
    shipments: seedShipments(),
    ibanRequests: seedIbanRequests(),
    socialAccounts: seedSocialAccounts(),
    socialPosts: seedSocialPosts(),
    taxFilings: seedTaxFilings(),
    tenders: seedTenders(),
    tenderBids: seedTenderBids(),
    insurers: seedInsurers(),
    insurancePolicies: seedInsurancePolicies(),
    insuranceClaims: seedInsuranceClaims(),
    riskAssessments: seedRiskAssessments(),
    warehouses: seedWarehouses(),
    warehouseZones: seedWarehouseZones(),
    stockTakes: seedStockTakes(),
    stockTakeLines: seedStockTakeLines(),
    sheqIncidents: seedSheqIncidents(),
    sheqInspections: seedSheqInspections(),
    disciplinaryCases: seedDisciplinaryCases(),
    disciplinaryWarnings: seedDisciplinaryWarnings(),
    emailSettings: seedEmailSettings(),
    emailLogs: seedEmailLogs(),
    customCode: seedCustomCode(),
  }));

  const log = useCallback((action: string) => {
    setState((s) => ({ ...s, auditLog: [{ id: nextId("au"), action, actor: "You (Demo Owner)", createdAt: new Date().toISOString() }, ...s.auditLog] }));
  }, []);

  const addBranch = useCallback((name: string, type: DemoBranch["type"]) => {
    setState((s) => ({ ...s, branches: [...s.branches, { id: nextId("br"), name, type }] }));
    log(`Added branch "${name}"`);
  }, [log]);

  const addCustomer = useCallback((input: { name: string; email: string; phone: string }) => {
    setState((s) => ({ ...s, customers: [...s.customers, { id: nextId("cu"), ...input, isActive: true }] }));
    log(`Added customer "${input.name}"`);
  }, [log]);

  const addProduct = useCallback((input: { sku: string; name: string; costPrice: number; sellingPrice: number; stockOnHand: number }) => {
    setState((s) => ({ ...s, products: [...s.products, { id: nextId("pr"), ...input }] }));
    log(`Added product "${input.name}"`);
  }, [log]);

  const createSale = useCallback((customerName: string, lines: Array<{ productId: string; quantity: number }>) => {
    setState((s) => {
      const saleLines: DemoSaleLine[] = lines
        .map((l) => {
          const product = s.products.find((p) => p.id === l.productId);
          if (!product || l.quantity <= 0) return null;
          return { productId: product.id, productName: product.name, quantity: l.quantity, unitPrice: product.sellingPrice };
        })
        .filter((l): l is DemoSaleLine => l !== null);

      if (saleLines.length === 0) return s;

      const total = saleLines.reduce((sum, l) => sum + l.quantity * l.unitPrice, 0);
      const invoiceNumber = numbered("INV", s.sales.length);

      const updatedProducts = s.products.map((p) => {
        const line = saleLines.find((l) => l.productId === p.id);
        return line ? { ...p, stockOnHand: Math.max(0, p.stockOnHand - line.quantity) } : p;
      });

      const newSale: DemoSale = { id: nextId("sl"), invoiceNumber, customerName, lines: saleLines, total, createdAt: new Date().toISOString() };
      return { ...s, products: updatedProducts, sales: [newSale, ...s.sales] };
    });
    log(`Created sale for "${customerName}"`);
  }, [log]);

  const inviteUser = useCallback((fullName: string, email: string, roleName: string) => {
    setState((s) => ({ ...s, users: [...s.users, { id: nextId("us"), fullName, email, roleName, status: "invited" }] }));
    log(`Invited "${fullName}"`);
  }, [log]);

  const toggleModule = useCallback((key: string) => {
    setState((s) => ({ ...s, modules: s.modules.map((m) => (m.key === key ? { ...m, enabled: !m.enabled } : m)) }));
  }, []);

  const toggleRolePermission = useCallback((roleId: string, permissionKey: string) => {
    setState((s) => ({
      ...s,
      roles: s.roles.map((r) => {
        if (r.id !== roleId || r.isSystem) return r;
        const next = new Set(r.permissions);
        if (next.has(permissionKey)) next.delete(permissionKey);
        else next.add(permissionKey);
        return { ...r, permissions: next };
      }),
    }));
  }, []);

  const addSupplier = useCallback((input: { name: string; email: string; phone: string }) => {
    setState((s) => ({ ...s, suppliers: [...s.suppliers, { id: nextId("sp"), ...input }] }));
    log(`Added supplier "${input.name}"`);
  }, [log]);

  const createPurchaseOrder = useCallback((supplierName: string, total: number) => {
    setState((s) => ({
      ...s,
      purchaseOrders: [
        { id: nextId("po"), poNumber: numbered("PO", s.purchaseOrders.length), supplierName, status: "issued", total, createdAt: new Date().toISOString() },
        ...s.purchaseOrders,
      ],
    }));
    log(`Created purchase order for "${supplierName}"`);
  }, [log]);

  const addExpense = useCallback((input: { description: string; amount: number; accountName: string }) => {
    setState((s) => ({ ...s, expenses: [{ id: nextId("ex"), ...input, expenseDate: new Date().toISOString().slice(0, 10) }, ...s.expenses] }));
    log(`Recorded expense "${input.description}"`);
  }, [log]);

  const addAccount = useCallback((input: { code: string; name: string; type: DemoAccount["type"] }) => {
    setState((s) => ({ ...s, accounts: [...s.accounts, { id: nextId("ac"), ...input }] }));
    log(`Added account "${input.name}"`);
  }, [log]);

  const addEmployee = useCallback((input: { fullName: string; position: string; department: string }) => {
    setState((s) => ({
      ...s,
      employees: [...s.employees, { id: nextId("em"), employeeNumber: numbered("EMP", s.employees.length), ...input, employmentStatus: "active" }],
    }));
    log(`Added employee "${input.fullName}"`);
  }, [log]);

  const addLead = useCallback((input: { name: string; company: string }) => {
    setState((s) => ({ ...s, leads: [...s.leads, { id: nextId("ld"), ...input, status: "new" }] }));
    log(`Added lead "${input.name}"`);
  }, [log]);

  const convertLead = useCallback((leadId: string) => {
    setState((s) => {
      const lead = s.leads.find((l) => l.id === leadId);
      if (!lead) return s;
      const customer: DemoCustomer = { id: nextId("cu"), name: lead.company || lead.name, email: "", phone: "", isActive: true };
      return {
        ...s,
        leads: s.leads.map((l) => (l.id === leadId ? { ...l, status: "converted" } : l)),
        customers: [...s.customers, customer],
      };
    });
    log("Converted a lead to a customer");
  }, [log]);

  const addOpportunity = useCallback((input: { name: string; customerName: string; value: number }) => {
    setState((s) => ({ ...s, opportunities: [...s.opportunities, { id: nextId("op"), ...input, stage: "prospecting" }] }));
    log(`Added opportunity "${input.name}"`);
  }, [log]);

  const setOpportunityStage = useCallback((id: string, stage: DemoOpportunity["stage"]) => {
    setState((s) => ({ ...s, opportunities: s.opportunities.map((o) => (o.id === id ? { ...o, stage } : o)) }));
  }, []);

  const addProject = useCallback((input: { name: string; customerName: string; budget: number }) => {
    setState((s) => ({ ...s, projects: [...s.projects, { id: nextId("pj"), ...input, status: "planning" }] }));
    log(`Added project "${input.name}"`);
  }, [log]);

  const addAsset = useCallback((input: { name: string; category: string; purchaseCost: number }) => {
    setState((s) => ({
      ...s,
      assets: [...s.assets, { id: nextId("as"), assetNumber: numbered("AST", s.assets.length), ...input, status: "in_use" }],
    }));
    log(`Added asset "${input.name}"`);
  }, [log]);

  const createTicket = useCallback((input: { subject: string; customerName: string; priority: DemoTicket["priority"] }) => {
    setState((s) => ({
      ...s,
      tickets: [{ id: nextId("tk"), ticketNumber: numbered("TKT", s.tickets.length), ...input, status: "open" }, ...s.tickets],
    }));
    log(`Created ticket "${input.subject}"`);
  }, [log]);

  const setTicketStatus = useCallback((id: string, status: DemoTicket["status"]) => {
    setState((s) => ({ ...s, tickets: s.tickets.map((t) => (t.id === id ? { ...t, status } : t)) }));
  }, []);

  const addVehicle = useCallback((input: { registrationNumber: string; make: string; model: string; driverName: string }) => {
    setState((s) => ({ ...s, vehicles: [...s.vehicles, { id: nextId("vh"), ...input, status: "active", odometerKm: 0 }] }));
    log(`Added vehicle "${input.registrationNumber}"`);
  }, [log]);

  const logFuel = useCallback((vehicleId: string, kmAdded: number) => {
    setState((s) => ({ ...s, vehicles: s.vehicles.map((v) => (v.id === vehicleId ? { ...v, odometerKm: v.odometerKm + Math.max(0, kmAdded) } : v)) }));
    log("Logged fuel for a vehicle");
  }, [log]);

  const addDocument = useCallback((input: { title: string; category: string; fileName: string }) => {
    setState((s) => ({ ...s, documents: [{ id: nextId("dc"), ...input, uploadedAt: new Date().toISOString() }, ...s.documents] }));
    log(`Uploaded document "${input.title}"`);
  }, [log]);

  const addCampaign = useCallback((input: { name: string; channel: DemoCampaign["channel"]; message: string }) => {
    setState((s) => ({ ...s, campaigns: [{ id: nextId("cp"), ...input, status: "draft" }, ...s.campaigns] }));
    log(`Created campaign "${input.name}"`);
  }, [log]);

  const setCampaignStatus = useCallback((id: string, status: DemoCampaign["status"]) => {
    setState((s) => ({ ...s, campaigns: s.campaigns.map((c) => (c.id === id ? { ...c, status } : c)) }));
  }, []);

  const recordLoyaltyTransaction = useCallback(
    (input: { customerName: string; points: number; type: DemoLoyaltyTransaction["type"]; reason: string }) => {
      setState((s) => ({
        ...s,
        loyaltyTransactions: [
          { id: nextId("lt"), ...input, points: input.type === "redeem" ? -Math.abs(input.points) : Math.abs(input.points) },
          ...s.loyaltyTransactions,
        ],
      }));
      log(`Recorded loyalty transaction for "${input.customerName}"`);
    },
    [log]
  );

  const createBom = useCallback((input: { name: string; productName: string; componentCount: number; yieldQuantity: number; estimatedUnitCost: number }) => {
    setState((s) => ({ ...s, boms: [...s.boms, { id: nextId("bm"), revision: "A", ...input }] }));
    log(`Created bill of materials "${input.name}"`);
  }, [log]);

  const createWorkOrder = useCallback((input: { bomName: string; productName: string; quantityPlanned: number }) => {
    setState((s) => ({
      ...s,
      workOrders: [
        { id: nextId("wo"), woNumber: numbered("WO", s.workOrders.length), ...input, quantityProduced: 0, status: "planned" },
        ...s.workOrders,
      ],
    }));
    log(`Created work order for "${input.productName}"`);
  }, [log]);

  const completeWorkOrder = useCallback((id: string) => {
    setState((s) => ({
      ...s,
      workOrders: s.workOrders.map((w) => (w.id === id ? { ...w, status: "completed", quantityProduced: w.quantityPlanned } : w)),
    }));
    log("Completed a work order");
  }, [log]);

  const publishOnlineProduct = useCallback((input: { productName: string; slug: string; onlinePrice: number }) => {
    setState((s) => ({ ...s, onlineProducts: [...s.onlineProducts, { id: nextId("onp"), ...input, isPublished: true }] }));
    log(`Published "${input.productName}" online`);
  }, [log]);

  const toggleOnlineProductPublished = useCallback((id: string) => {
    setState((s) => ({ ...s, onlineProducts: s.onlineProducts.map((p) => (p.id === id ? { ...p, isPublished: !p.isPublished } : p)) }));
  }, []);

  const createOnlineOrder = useCallback((input: { buyerName: string; total: number }) => {
    setState((s) => ({
      ...s,
      onlineOrders: [
        { id: nextId("oo"), orderNumber: numbered("OO", s.onlineOrders.length), ...input, status: "pending", deliveryStatus: "not_shipped" },
        ...s.onlineOrders,
      ],
    }));
    log(`Created online order for "${input.buyerName}"`);
  }, [log]);

  const setOnlineOrderStatus = useCallback((id: string, status: DemoOnlineOrder["status"]) => {
    setState((s) => ({ ...s, onlineOrders: s.onlineOrders.map((o) => (o.id === id ? { ...o, status } : o)) }));
  }, []);

  const setOnlineOrderDeliveryStatus = useCallback((id: string, deliveryStatus: DemoOnlineOrder["deliveryStatus"]) => {
    setState((s) => ({ ...s, onlineOrders: s.onlineOrders.map((o) => (o.id === id ? { ...o, deliveryStatus } : o)) }));
  }, []);

  const updateOrgName = useCallback((name: string) => {
    setState((s) => ({ ...s, orgName: name }));
    log("Updated organization name");
  }, [log]);

  const updateThemeColor = useCallback((color: string) => {
    setState((s) => ({ ...s, themeColor: color }));
    log("Updated theme color");
  }, [log]);

  const connectProviderIntegration = useCallback((providerKey: string, accountLabel: string) => {
    setState((s) => ({
      ...s,
      integrationConnections: [...s.integrationConnections.filter((c) => c.providerKey !== providerKey), { providerKey, accountLabel }],
    }));
    const provider = DEMO_INTEGRATION_PROVIDERS.find((p) => p.key === providerKey);
    log(`Connected ${provider?.name ?? providerKey}`);
  }, [log]);

  const disconnectProviderIntegration = useCallback((providerKey: string) => {
    setState((s) => ({ ...s, integrationConnections: s.integrationConnections.filter((c) => c.providerKey !== providerKey) }));
    const provider = DEMO_INTEGRATION_PROVIDERS.find((p) => p.key === providerKey);
    log(`Disconnected ${provider?.name ?? providerKey}`);
  }, [log]);

  const createShipment = useCallback(
    (input: { customerName: string; carrier: string; vehicleRegistration: string; deliveryAddress: string }) => {
      setState((s) => ({
        ...s,
        shipments: [
          {
            id: nextId("sh"),
            shipmentNumber: numbered("SHP", s.shipments.length),
            customerName: input.customerName || null,
            carrier: input.carrier || null,
            vehicleRegistration: input.vehicleRegistration || null,
            deliveryAddress: input.deliveryAddress,
            status: "pending",
            dispatchedAt: null,
            deliveredAt: null,
          },
          ...s.shipments,
        ],
      }));
      log("Created a shipment");
    },
    [log]
  );

  const setShipmentStatus = useCallback((id: string, status: DemoShipment["status"]) => {
    setState((s) => ({
      ...s,
      shipments: s.shipments.map((sh) =>
        sh.id === id
          ? {
              ...sh,
              status,
              dispatchedAt: status === "dispatched" ? new Date().toISOString() : sh.dispatchedAt,
              deliveredAt: status === "delivered" ? new Date().toISOString() : sh.deliveredAt,
            }
          : sh
      ),
    }));
  }, []);

  const requestIban = useCallback((currency: string, notes: string) => {
    setState((s) => ({
      ...s,
      ibanRequests: [
        { id: nextId("ib"), currency, status: "pending", notes, requestedAt: new Date().toISOString() },
        ...s.ibanRequests,
      ],
    }));
    log(`Requested an IBAN (${currency})`);
  }, [log]);

  const connectSocialAccount = useCallback((platform: string, handle: string) => {
    setState((s) => ({
      ...s,
      socialAccounts: [...s.socialAccounts.filter((a) => a.platform !== platform), { id: nextId("sa"), platform, handle, connected: true }],
    }));
    log(`Connected ${platform} account (${handle})`);
  }, [log]);

  const queueSocialPost = useCallback((platform: string, message: string) => {
    setState((s) => ({
      ...s,
      socialPosts: [
        { id: nextId("sp"), platform, message, status: "queued", createdAt: new Date().toISOString() },
        ...s.socialPosts,
      ],
    }));
    log(`Queued a ${platform} post`);
  }, [log]);

  const createTaxFiling = useCallback((input: { taxType: string; period: string; dueDate: string; notes: string }) => {
    setState((s) => ({
      ...s,
      taxFilings: [{ id: nextId("tf"), status: "draft", ...input }, ...s.taxFilings],
    }));
    log(`Created a ${input.taxType} tax filing for ${input.period}`);
  }, [log]);

  const submitTaxFiling = useCallback((id: string) => {
    setState((s) => ({
      ...s,
      taxFilings: s.taxFilings.map((f) => (f.id === id ? { ...f, status: "submitted" } : f)),
    }));
    log("Recorded a tax filing as submitted");
  }, [log]);

  const createTender = useCallback((input: { title: string; closingDate: string; estimatedValue: number }) => {
    setState((s) => ({
      ...s,
      tenders: [
        { id: nextId("tn"), tenderNumber: numbered("TDR", s.tenders.length), status: "published", ...input },
        ...s.tenders,
      ],
    }));
    log(`Created tender "${input.title}"`);
  }, [log]);

  const submitBid = useCallback((tenderId: string, supplierName: string, bidAmount: number) => {
    setState((s) => ({
      ...s,
      tenderBids: [{ id: nextId("tb"), tenderId, supplierName, bidAmount, status: "submitted" }, ...s.tenderBids],
    }));
    log(`${supplierName} submitted a bid`);
  }, [log]);

  const awardTender = useCallback((tenderId: string, bidId: string) => {
    setState((s) => ({
      ...s,
      tenders: s.tenders.map((t) => (t.id === tenderId ? { ...t, status: "awarded" } : t)),
      tenderBids: s.tenderBids.map((b) =>
        b.tenderId !== tenderId ? b : { ...b, status: b.id === bidId ? "awarded" : "rejected" }
      ),
    }));
    log("Awarded a tender");
  }, [log]);

  const addInsurer = useCallback((input: { name: string; code: string; contactPerson: string; email: string; phone: string }) => {
    setState((s) => ({ ...s, insurers: [...s.insurers, { id: nextId("ins"), ...input }] }));
    log(`Added insurer "${input.name}"`);
  }, [log]);

  const createInsurancePolicy = useCallback((input: {
    insurerName: string;
    policyNumber: string;
    policyType: string;
    coverageType: string;
    sumInsured: number;
    premium: number;
    endDate: string;
  }) => {
    setState((s) => ({
      ...s,
      insurancePolicies: [{ id: nextId("pol"), status: "active", ...input }, ...s.insurancePolicies],
    }));
    log(`Created policy "${input.policyNumber}"`);
  }, [log]);

  const submitInsuranceClaim = useCallback((policyId: string, incidentDate: string, incidentDescription: string, claimAmount: number) => {
    setState((s) => ({
      ...s,
      insuranceClaims: [
        {
          id: nextId("clm"),
          policyId,
          claimNumber: `CLM-${new Date().getFullYear()}-${nextId("x").slice(-6).toUpperCase()}`,
          incidentDate,
          incidentDescription,
          claimAmount,
          status: "submitted",
        },
        ...s.insuranceClaims,
      ],
    }));
    log("Submitted an insurance claim");
  }, [log]);

  const createRiskAssessment = useCallback((input: { title: string; category: string; likelihood: number; impact: number; reviewDate: string }) => {
    const riskScore = input.likelihood * input.impact;
    const riskLevel: DemoRiskAssessment["riskLevel"] =
      riskScore >= 15 ? "critical" : riskScore >= 10 ? "high" : riskScore >= 5 ? "medium" : "low";
    setState((s) => ({
      ...s,
      riskAssessments: [
        {
          id: nextId("risk"),
          title: input.title,
          category: input.category,
          riskLevel,
          riskScore,
          reviewDate: input.reviewDate,
          status: "open",
        },
        ...s.riskAssessments,
      ],
    }));
    log(`Recorded risk assessment "${input.title}"`);
  }, [log]);

  const addWarehouse = useCallback((input: { code: string; name: string; address: string; managerName: string }) => {
    setState((s) => ({
      ...s,
      warehouses: [...s.warehouses, { id: nextId("wh"), status: "active", ...input }],
    }));
    log(`Added warehouse "${input.name}"`);
  }, [log]);

  const createWarehouseZone = useCallback((input: { warehouseId: string; code: string; name: string; zoneType: string; capacity: string }) => {
    setState((s) => {
      const warehouse = s.warehouses.find((w) => w.id === input.warehouseId);
      return {
        ...s,
        warehouseZones: [
          ...s.warehouseZones,
          { id: nextId("wz"), warehouseName: warehouse?.name ?? "Unknown warehouse", ...input },
        ],
      };
    });
    log(`Added storage zone "${input.name}"`);
  }, [log]);

  const startStockTake = useCallback((input: { title: string; branchName: string; countType: DemoStockTake["countType"] }) => {
    const id = nextId("stk");
    setState((s) => ({
      ...s,
      stockTakes: [
        {
          id,
          stockTakeNumber: `STK-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${String(s.stockTakes.length + 1).padStart(4, "0")}`,
          title: input.title,
          branchName: input.branchName,
          countType: input.countType,
          status: "in_progress",
          startedAt: new Date().toISOString(),
          completedAt: null,
          totalVarianceValue: null,
        },
        ...s.stockTakes,
      ],
      stockTakeLines: [
        ...s.stockTakeLines,
        ...s.products.map((p) => ({
          id: nextId("stl"),
          stockTakeId: id,
          productName: p.name,
          systemQuantity: p.stockOnHand,
          countedQuantity: null,
          variance: null,
          countStatus: "pending" as const,
        })),
      ],
    }));
    log(`Started stock take "${input.title}"`);
  }, [log]);

  const recordStockTakeCount = useCallback((lineId: string, countedQuantity: number) => {
    setState((s) => ({
      ...s,
      stockTakeLines: s.stockTakeLines.map((l) => {
        if (l.id !== lineId) return l;
        const variance = countedQuantity - l.systemQuantity;
        return { ...l, countedQuantity, variance, countStatus: variance === 0 ? "verified" : "discrepancy" };
      }),
    }));
    log("Recorded stock take count");
  }, [log]);

  const completeStockTake = useCallback((id: string) => {
    setState((s) => {
      const totalVarianceValue = s.stockTakeLines
        .filter((l) => l.stockTakeId === id)
        .reduce((sum, l) => sum + (l.variance ?? 0), 0);
      return {
        ...s,
        stockTakes: s.stockTakes.map((st) =>
          st.id === id ? { ...st, status: "completed", completedAt: new Date().toISOString(), totalVarianceValue } : st
        ),
      };
    });
    log("Completed stock take");
  }, [log]);

  const reportIncident = useCallback((input: { incidentType: string; severity: DemoSheqIncident["severity"]; title: string; description: string; location: string }) => {
    setState((s) => ({
      ...s,
      sheqIncidents: [
        {
          id: nextId("shi"),
          incidentNumber: `INC-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${String(s.sheqIncidents.length + 1).padStart(4, "0")}`,
          incidentType: input.incidentType,
          severity: input.severity,
          title: input.title,
          description: input.description,
          location: input.location,
          dateOccurred: new Date().toISOString().slice(0, 10),
          status: "open",
          correctiveActions: null,
        },
        ...s.sheqIncidents,
      ],
    }));
    log(`Reported incident "${input.title}"`);
  }, [log]);

  const recordIncidentCorrectiveAction = useCallback((id: string, correctiveActions: string) => {
    setState((s) => ({
      ...s,
      sheqIncidents: s.sheqIncidents.map((i) => (i.id === id ? { ...i, correctiveActions, status: "under_investigation" } : i)),
    }));
    log("Recorded corrective action");
  }, [log]);

  const closeIncident = useCallback((id: string) => {
    setState((s) => ({
      ...s,
      sheqIncidents: s.sheqIncidents.map((i) => (i.id === id ? { ...i, status: "closed" } : i)),
    }));
    log("Closed incident");
  }, [log]);

  const scheduleInspection = useCallback((input: { inspectionType: string; title: string; scheduledDate: string }) => {
    setState((s) => ({
      ...s,
      sheqInspections: [
        {
          id: nextId("shq"),
          inspectionNumber: `INS-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${String(s.sheqInspections.length + 1).padStart(4, "0")}`,
          inspectionType: input.inspectionType,
          title: input.title,
          scheduledDate: input.scheduledDate,
          status: "scheduled",
          nonConformities: null,
          findings: null,
        },
        ...s.sheqInspections,
      ],
    }));
    log(`Scheduled inspection "${input.title}"`);
  }, [log]);

  const completeInspection = useCallback((id: string, input: { findings: string; nonConformities: number }) => {
    setState((s) => ({
      ...s,
      sheqInspections: s.sheqInspections.map((i) =>
        i.id === id ? { ...i, status: "completed", findings: input.findings, nonConformities: input.nonConformities } : i
      ),
    }));
    log("Completed inspection");
  }, [log]);

  const openDisciplinaryCase = useCallback((input: { employeeName: string; violationType: string; severity: DemoDisciplinaryCase["severity"]; title: string; incidentDate: string }) => {
    setState((s) => ({
      ...s,
      disciplinaryCases: [
        {
          id: nextId("dc"),
          caseNumber: `DISC-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${String(s.disciplinaryCases.length + 1).padStart(4, "0")}`,
          employeeName: input.employeeName,
          violationType: input.violationType,
          severity: input.severity,
          title: input.title,
          incidentDate: input.incidentDate,
          status: "open",
          hearingDate: null,
        },
        ...s.disciplinaryCases,
      ],
    }));
    log(`Opened disciplinary case "${input.title}"`);
  }, [log]);

  const scheduleDisciplinaryHearing = useCallback((id: string, hearingDate: string) => {
    setState((s) => ({
      ...s,
      disciplinaryCases: s.disciplinaryCases.map((c) => (c.id === id ? { ...c, status: "hearing_scheduled", hearingDate } : c)),
    }));
    log("Scheduled disciplinary hearing");
  }, [log]);

  const setDisciplinaryCaseStatus = useCallback((id: string, status: DemoDisciplinaryCase["status"]) => {
    setState((s) => ({
      ...s,
      disciplinaryCases: s.disciplinaryCases.map((c) => (c.id === id ? { ...c, status } : c)),
    }));
    log(`Updated disciplinary case status to "${status.replace("_", " ")}"`);
  }, [log]);

  const issueDisciplinaryWarning = useCallback((input: { employeeName: string; warningType: DemoDisciplinaryWarning["warningType"]; reason: string }) => {
    setState((s) => ({
      ...s,
      disciplinaryWarnings: [
        {
          id: nextId("dw"),
          employeeName: input.employeeName,
          warningType: input.warningType,
          reason: input.reason,
          issuedDate: new Date().toISOString().slice(0, 10),
        },
        ...s.disciplinaryWarnings,
      ],
    }));
    log(`Issued ${input.warningType} warning to ${input.employeeName}`);
  }, [log]);

  const updateEmailSettings = useCallback((input: { fromAddress: string; fromName: string; smtpHost: string; smtpPort: number }) => {
    setState((s) => ({
      ...s,
      emailSettings: { ...input, isConfigured: true },
    }));
    log("Updated email settings");
  }, [log]);

  const sendTestEmail = useCallback((to: string) => {
    setState((s) => ({
      ...s,
      emailLogs: [
        { id: nextId("el"), to, subject: "Test email", status: "sent", sentAt: new Date().toISOString() },
        ...s.emailLogs,
      ],
    }));
    log(`Recorded test email to ${to}`);
  }, [log]);

  const saveCustomCode = useCallback((codeType: CustomCodeType, content: string) => {
    setState((s) => {
      const current = s.customCode[codeType];
      const nextVersion = current.version + 1;
      return {
        ...s,
        customCode: {
          ...s.customCode,
          [codeType]: {
            content,
            version: nextVersion,
            history: [{ version: nextVersion, content, createdAt: new Date().toISOString() }, ...current.history],
          },
        },
      };
    });
    log(`Saved custom ${codeType.toUpperCase()}`);
  }, [log]);

  const rollbackCustomCode = useCallback((codeType: CustomCodeType, targetVersion: number) => {
    setState((s) => {
      const current = s.customCode[codeType];
      const target = current.history.find((v) => v.version === targetVersion);
      if (!target) return s;
      const nextVersion = current.version + 1;
      return {
        ...s,
        customCode: {
          ...s.customCode,
          [codeType]: {
            content: target.content,
            version: nextVersion,
            history: [{ version: nextVersion, content: target.content, createdAt: new Date().toISOString() }, ...current.history],
          },
        },
      };
    });
    log(`Rolled back custom ${codeType.toUpperCase()}`);
  }, [log]);

  const value = useMemo<DemoContextValue>(
    () => ({
      ...state,
      addBranch,
      addCustomer,
      addProduct,
      createSale,
      inviteUser,
      toggleModule,
      toggleRolePermission,
      addSupplier,
      createPurchaseOrder,
      addExpense,
      addAccount,
      addEmployee,
      addLead,
      convertLead,
      addOpportunity,
      setOpportunityStage,
      addProject,
      addAsset,
      createTicket,
      setTicketStatus,
      addVehicle,
      logFuel,
      addDocument,
      addCampaign,
      setCampaignStatus,
      recordLoyaltyTransaction,
      createBom,
      createWorkOrder,
      completeWorkOrder,
      publishOnlineProduct,
      toggleOnlineProductPublished,
      createOnlineOrder,
      setOnlineOrderStatus,
      setOnlineOrderDeliveryStatus,
      updateOrgName,
      updateThemeColor,
      connectProviderIntegration,
      disconnectProviderIntegration,
      createShipment,
      setShipmentStatus,
      requestIban,
      connectSocialAccount,
      queueSocialPost,
      createTaxFiling,
      submitTaxFiling,
      createTender,
      submitBid,
      awardTender,
      addInsurer,
      createInsurancePolicy,
      submitInsuranceClaim,
      createRiskAssessment,
      addWarehouse,
      createWarehouseZone,
      startStockTake,
      recordStockTakeCount,
      completeStockTake,
      reportIncident,
      recordIncidentCorrectiveAction,
      closeIncident,
      scheduleInspection,
      completeInspection,
      openDisciplinaryCase,
      scheduleDisciplinaryHearing,
      setDisciplinaryCaseStatus,
      issueDisciplinaryWarning,
      updateEmailSettings,
      sendTestEmail,
      saveCustomCode,
      rollbackCustomCode,
    }),
    [
      state,
      addBranch,
      addCustomer,
      addProduct,
      createSale,
      inviteUser,
      toggleModule,
      toggleRolePermission,
      addSupplier,
      createPurchaseOrder,
      addExpense,
      addAccount,
      addEmployee,
      addLead,
      convertLead,
      addOpportunity,
      setOpportunityStage,
      addProject,
      addAsset,
      createTicket,
      setTicketStatus,
      addVehicle,
      logFuel,
      addDocument,
      addCampaign,
      setCampaignStatus,
      recordLoyaltyTransaction,
      createBom,
      createWorkOrder,
      completeWorkOrder,
      publishOnlineProduct,
      toggleOnlineProductPublished,
      createOnlineOrder,
      setOnlineOrderStatus,
      setOnlineOrderDeliveryStatus,
      updateOrgName,
      updateThemeColor,
      connectProviderIntegration,
      disconnectProviderIntegration,
      createShipment,
      setShipmentStatus,
      requestIban,
      connectSocialAccount,
      queueSocialPost,
      createTaxFiling,
      submitTaxFiling,
      createTender,
      submitBid,
      awardTender,
      addInsurer,
      createInsurancePolicy,
      submitInsuranceClaim,
      createRiskAssessment,
      addWarehouse,
      createWarehouseZone,
      startStockTake,
      recordStockTakeCount,
      completeStockTake,
      reportIncident,
      recordIncidentCorrectiveAction,
      closeIncident,
      scheduleInspection,
      completeInspection,
      openDisciplinaryCase,
      scheduleDisciplinaryHearing,
      setDisciplinaryCaseStatus,
      issueDisciplinaryWarning,
      updateEmailSettings,
      sendTestEmail,
      saveCustomCode,
      rollbackCustomCode,
    ]
  );

  return <DemoContext.Provider value={value}>{children}</DemoContext.Provider>;
}

export function useDemo(): DemoContextValue {
  const ctx = useContext(DemoContext);
  if (!ctx) throw new Error("useDemo must be used within DemoProvider");
  return ctx;
}
