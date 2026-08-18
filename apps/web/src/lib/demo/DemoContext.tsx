"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";

// Everything here lives in React state only, on purpose (project decision,
// 2026-08-11): a public demo entry point where any username/password "logs
// in", every action feels real, but nothing ever touches Supabase and
// nothing persists past a refresh — deliberately NOT localStorage.

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
  { key: "manufacturing", name: "Manufacturing", description: "Bills of materials, work orders, production planning", category: "operations", monthlyPriceUsd: 25 },
  { key: "projects", name: "Projects", description: "Projects, tasks, milestones, timesheets", category: "operations", monthlyPriceUsd: 15 },
  { key: "assets", name: "Assets", description: "Fixed assets, maintenance, depreciation", category: "operations", monthlyPriceUsd: 10 },
  { key: "service_management", name: "Service Management", description: "Tickets, service requests, SLAs, warranty", category: "operations", monthlyPriceUsd: 15 },
  { key: "fleet", name: "Fleet", description: "Vehicles, drivers, fuel, maintenance", category: "operations", monthlyPriceUsd: 12 },
  { key: "documents", name: "Document Management", description: "Documents, folders, versions, approvals", category: "platform", monthlyPriceUsd: 8 },
  { key: "marketing", name: "Marketing", description: "Campaigns, SMS, email, WhatsApp, loyalty", category: "sales", monthlyPriceUsd: 12 },
  { key: "reporting", name: "Reporting / BI", description: "Custom dashboards, KPIs, scheduled reports", category: "platform", monthlyPriceUsd: 15 },
  { key: "ecommerce", name: "Ecommerce", description: "Online products, orders, delivery sync", category: "sales", monthlyPriceUsd: 20 },
];

const DEFAULT_ENABLED = new Set(["sales", "inventory", "crm"]);

function seedModules(): DemoModule[] {
  return MODULE_CATALOG.map((m) => ({ ...m, enabled: DEFAULT_ENABLED.has(m.key) }));
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

let idCounter = 1;
function nextId(prefix: string) {
  idCounter += 1;
  return `${prefix}-demo-${idCounter}`;
}

interface DemoState {
  orgName: string;
  branches: DemoBranch[];
  customers: DemoCustomer[];
  products: DemoProduct[];
  sales: DemoSale[];
  users: DemoUser[];
  roles: DemoRole[];
  modules: DemoModule[];
}

interface DemoContextValue extends DemoState {
  addBranch: (name: string, type: DemoBranch["type"]) => void;
  addCustomer: (input: { name: string; email: string; phone: string }) => void;
  addProduct: (input: { sku: string; name: string; costPrice: number; sellingPrice: number; stockOnHand: number }) => void;
  createSale: (customerName: string, lines: Array<{ productId: string; quantity: number }>) => void;
  inviteUser: (fullName: string, email: string, roleName: string) => void;
  toggleModule: (key: string) => void;
  toggleRolePermission: (roleId: string, permissionKey: string) => void;
}

const DemoContext = createContext<DemoContextValue | null>(null);

export function DemoProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<DemoState>(() => ({
    orgName: "Demo Company (Pvt) Ltd",
    branches: seedBranches(),
    customers: seedCustomers(),
    products: seedProducts(),
    sales: seedSales(),
    users: seedUsers(),
    roles: seedRoles(),
    modules: seedModules(),
  }));

  const addBranch = useCallback((name: string, type: DemoBranch["type"]) => {
    setState((s) => ({ ...s, branches: [...s.branches, { id: nextId("br"), name, type }] }));
  }, []);

  const addCustomer = useCallback((input: { name: string; email: string; phone: string }) => {
    setState((s) => ({
      ...s,
      customers: [...s.customers, { id: nextId("cu"), ...input, isActive: true }],
    }));
  }, []);

  const addProduct = useCallback((input: { sku: string; name: string; costPrice: number; sellingPrice: number; stockOnHand: number }) => {
    setState((s) => ({ ...s, products: [...s.products, { id: nextId("pr"), ...input }] }));
  }, []);

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
      const invoiceNumber = `INV-${String(s.sales.length + 1).padStart(4, "0")}`;

      const updatedProducts = s.products.map((p) => {
        const line = saleLines.find((l) => l.productId === p.id);
        return line ? { ...p, stockOnHand: Math.max(0, p.stockOnHand - line.quantity) } : p;
      });

      const newSale: DemoSale = {
        id: nextId("sl"),
        invoiceNumber,
        customerName,
        lines: saleLines,
        total,
        createdAt: new Date().toISOString(),
      };

      return { ...s, products: updatedProducts, sales: [newSale, ...s.sales] };
    });
  }, []);

  const inviteUser = useCallback((fullName: string, email: string, roleName: string) => {
    setState((s) => ({
      ...s,
      users: [...s.users, { id: nextId("us"), fullName, email, roleName, status: "invited" }],
    }));
  }, []);

  const toggleModule = useCallback((key: string) => {
    setState((s) => ({
      ...s,
      modules: s.modules.map((m) => (m.key === key ? { ...m, enabled: !m.enabled } : m)),
    }));
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

  const value = useMemo<DemoContextValue>(
    () => ({ ...state, addBranch, addCustomer, addProduct, createSale, inviteUser, toggleModule, toggleRolePermission }),
    [state, addBranch, addCustomer, addProduct, createSale, inviteUser, toggleModule, toggleRolePermission]
  );

  return <DemoContext.Provider value={value}>{children}</DemoContext.Provider>;
}

export function useDemo(): DemoContextValue {
  const ctx = useContext(DemoContext);
  if (!ctx) throw new Error("useDemo must be used within DemoProvider");
  return ctx;
}
