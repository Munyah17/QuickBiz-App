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
