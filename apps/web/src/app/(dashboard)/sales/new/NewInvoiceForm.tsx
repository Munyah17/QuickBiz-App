"use client";

import { useActionState, useMemo, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Card, CardHeader } from "@/components/Card";
import { Button } from "@/components/Button";
import { Input, Select, Textarea } from "@/components/Input";
import { FormField } from "@/components/FormField";
import { createInvoiceAction, updateDraftInvoiceAction, initialSalesActionState } from "../actions";
import type { Customer } from "@/services/customers";
import type { ProductWithStock, BranchWarehouse } from "@/services/products";
import type { SalesDocType } from "@/services/sales";

interface LineItem {
  key: number;
  product_id: string;
  sku: string;
  description: string;
  unit: string;
  quantity: number;
  unit_price: number;
  discount: number;
  tax_rate: number | null; // null = use org default rate
}

export interface DraftInvoiceInitial {
  invoiceId: string;
  docType: SalesDocType;
  customerId: string | null;
  warehouseId: string | null;
  invoiceDate: string | null;
  dueDate: string | null;
  reference: string | null;
  salesperson: string | null;
  paymentTerms: string | null;
  shippingTotal: number;
  billingAddress: string | null;
  deliveryAddress: string | null;
  discountTotal: number;
  discountReason: string | null;
  notes: string | null;
  items: Array<{
    product_id: string | null;
    description: string;
    sku: string | null;
    unit: string | null;
    quantity: number;
    unit_price: number;
    discount: number;
    tax_rate: number | null;
  }>;
}

let nextKey = 1;

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function plusDays(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

const PAYMENT_TERMS = [
  { value: "", label: "Not set" },
  { value: "due_on_receipt", label: "Due on receipt" },
  { value: "net_7", label: "Net 7" },
  { value: "net_14", label: "Net 14" },
  { value: "net_30", label: "Net 30" },
  { value: "net_60", label: "Net 60" },
  { value: "net_90", label: "Net 90" },
];

const TERMS_DAYS: Record<string, number> = {
  due_on_receipt: 0,
  net_7: 7,
  net_14: 14,
  net_30: 30,
  net_60: 60,
  net_90: 90,
};

function customerAddress(c: Customer | undefined): string {
  if (!c) return "";
  const parts = [c.name, c.address?.street, c.address?.city, c.address?.country].filter(Boolean);
  return parts.join("\n");
}

export function NewInvoiceForm({
  customers,
  products,
  warehouses,
  taxRatePercent,
  initial,
}: {
  customers: Customer[];
  products: ProductWithStock[];
  warehouses: BranchWarehouse[];
  taxRatePercent: number;
  initial?: DraftInvoiceInitial;
}) {
  const [state, formAction, isPending] = useActionState(
    initial ? updateDraftInvoiceAction : createInvoiceAction,
    initialSalesActionState
  );
  const [branchWarehouseId, setBranchWarehouseId] = useState(initial?.warehouseId ?? warehouses[0]?.warehouseId ?? "");
  const [customerId, setCustomerId] = useState(initial?.customerId ?? "");
  const [invoiceDate, setInvoiceDate] = useState(initial?.invoiceDate ?? today());
  const [dueDate, setDueDate] = useState(initial?.dueDate ?? plusDays(30));
  const [reference, setReference] = useState(initial?.reference ?? "");
  const [salesperson, setSalesperson] = useState(initial?.salesperson ?? "");
  const [paymentTerms, setPaymentTerms] = useState(initial?.paymentTerms ?? "");
  const [shippingTotal, setShippingTotal] = useState(initial?.shippingTotal ?? 0);
  const [billingAddress, setBillingAddress] = useState(initial?.billingAddress ?? "");
  const [deliveryAddress, setDeliveryAddress] = useState(initial?.deliveryAddress ?? "");
  const [discountTotal, setDiscountTotal] = useState(initial?.discountTotal ?? 0);
  const [discountReason, setDiscountReason] = useState(initial?.discountReason ?? "");
  const [items, setItems] = useState<LineItem[]>(
    initial && initial.items.length > 0
      ? initial.items.map((i) => ({
          key: nextKey++,
          product_id: i.product_id ?? "",
          sku: i.sku ?? "",
          description: i.description,
          unit: i.unit ?? "",
          quantity: i.quantity,
          unit_price: i.unit_price,
          discount: i.discount,
          tax_rate: i.tax_rate,
        }))
      : [{ key: nextKey++, product_id: "", sku: "", description: "", unit: "", quantity: 1, unit_price: 0, discount: 0, tax_rate: null }]
  );

  const selectedCustomer = customers.find((c) => c.id === customerId);

  // Per-line math: net = qty*price - discount; tax on the net at the line's
  // rate (or the org default when the line doesn't override it).
  const lines = useMemo(
    () =>
      items.map((i) => {
        const net = i.quantity * i.unit_price - i.discount;
        const rate = i.tax_rate ?? taxRatePercent;
        const tax = Math.round(net * (rate / 100) * 100) / 100;
        return { ...i, net, tax };
      }),
    [items, taxRatePercent]
  );
  const subtotal = useMemo(() => lines.reduce((s, l) => s + l.net, 0), [lines]);
  const taxTotal = useMemo(() => lines.reduce((s, l) => s + l.tax, 0), [lines]);
  const lineDiscounts = useMemo(() => lines.reduce((s, l) => s + l.discount, 0), [lines]);
  const total = subtotal + taxTotal + shippingTotal - discountTotal;

  function onCustomerChange(id: string) {
    setCustomerId(id);
    const c = customers.find((x) => x.id === id);
    if (c?.payment_terms_days != null) {
      setDueDate(plusDays(c.payment_terms_days));
      const match = Object.entries(TERMS_DAYS).find(([, d]) => d === c.payment_terms_days);
      if (match) setPaymentTerms(match[0]);
    }
    if (!billingAddress) setBillingAddress(customerAddress(c));
  }

  function onTermsChange(value: string) {
    setPaymentTerms(value);
    const days = TERMS_DAYS[value];
    if (days != null) setDueDate(plusDays(days));
  }

  function updateItem(key: number, patch: Partial<LineItem>) {
    setItems((prev) => prev.map((i) => (i.key === key ? { ...i, ...patch } : i)));
  }

  function addItem() {
    setItems((prev) => [
      ...prev,
      { key: nextKey++, product_id: "", sku: "", description: "", unit: "", quantity: 1, unit_price: 0, discount: 0, tax_rate: null },
    ]);
  }

  function removeItem(key: number) {
    setItems((prev) => (prev.length > 1 ? prev.filter((i) => i.key !== key) : prev));
  }

  function onProductSelect(key: number, productId: string) {
    const product = products.find((p) => p.id === productId);
    updateItem(key, {
      product_id: productId,
      sku: product?.sku ?? "",
      description: product?.name ?? "",
      unit: product?.unit_of_measure ?? "",
      unit_price: product?.selling_price ?? 0,
    });
  }

  const serializedItems = JSON.stringify(
    items.map((i) => ({
      product_id: i.product_id,
      description: i.description,
      sku: i.sku || null,
      unit: i.unit || null,
      quantity: i.quantity,
      unit_price: i.unit_price,
      discount: i.discount,
      tax_rate: i.tax_rate,
    }))
  );

  const branchId = warehouses.find((w) => w.warehouseId === branchWarehouseId)?.branchId ?? "";

  return (
    <form action={formAction} className="flex flex-col gap-6">
      {initial && <input type="hidden" name="invoiceId" value={initial.invoiceId} />}
      <input type="hidden" name="items" value={serializedItems} />
      <input type="hidden" name="taxTotal" value={taxTotal} />
      <input type="hidden" name="discountTotal" value={discountTotal} />
      <input type="hidden" name="discountReason" value={discountReason} />
      <input type="hidden" name="shippingTotal" value={shippingTotal} />
      <input type="hidden" name="branchId" value={branchId} />
      <input type="hidden" name="warehouseId" value={branchWarehouseId} />

      {/* ---- Header ---- */}
      <Card>
        <CardHeader title="Invoice details" />
        <div className="grid grid-cols-2 gap-4 p-4 lg:grid-cols-4">
          <FormField label="Customer" htmlFor="customerId">
            <Select id="customerId" name="customerId" value={customerId} onChange={(e) => onCustomerChange(e.target.value)}>
              <option value="">Walk-in / no customer on file</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </FormField>
          <FormField label="Branch" htmlFor="branchWarehouseId" required>
            <Select
              id="branchWarehouseId"
              value={branchWarehouseId}
              onChange={(e) => setBranchWarehouseId(e.target.value)}
              required
            >
              {warehouses.map((w) => (
                <option key={w.warehouseId} value={w.warehouseId}>
                  {w.branchName}
                </option>
              ))}
            </Select>
          </FormField>
          <FormField label="Invoice date" htmlFor="invoiceDate">
            <Input id="invoiceDate" name="invoiceDate" type="date" value={invoiceDate} onChange={(e) => setInvoiceDate(e.target.value)} />
          </FormField>
          <FormField
            label="Due date"
            htmlFor="dueDate"
            hint={selectedCustomer?.payment_terms_days != null ? `Customer terms: Net ${selectedCustomer.payment_terms_days}` : undefined}
          >
            <Input id="dueDate" name="dueDate" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          </FormField>
          <FormField label="Payment terms" htmlFor="paymentTerms">
            <Select id="paymentTerms" name="paymentTerms" value={paymentTerms} onChange={(e) => onTermsChange(e.target.value)}>
              {PAYMENT_TERMS.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </Select>
          </FormField>
          <FormField label="PO / reference" htmlFor="reference" hint="Customer's purchase order or your reference">
            <Input id="reference" name="reference" value={reference} onChange={(e) => setReference(e.target.value)} placeholder="e.g. PO-1042" />
          </FormField>
          <FormField label="Salesperson" htmlFor="salesperson">
            <Input id="salesperson" name="salesperson" value={salesperson} onChange={(e) => setSalesperson(e.target.value)} placeholder="Optional" />
          </FormField>
          <FormField label="Shipping / delivery" htmlFor="shippingTotal">
            <Input
              id="shippingTotal"
              type="number"
              min="0"
              step="0.01"
              value={shippingTotal}
              onChange={(e) => setShippingTotal(Math.max(0, Number(e.target.value)))}
            />
          </FormField>
        </div>
      </Card>

      {/* ---- Customer & addresses ---- */}
      <Card>
        <CardHeader title="Customer & delivery" />
        <div className="grid grid-cols-1 gap-4 p-4 lg:grid-cols-2">
          <FormField label="Billing address" htmlFor="billingAddress" hint="Printed on the invoice">
            <Textarea
              id="billingAddress"
              name="billingAddress"
              rows={3}
              value={billingAddress}
              onChange={(e) => setBillingAddress(e.target.value)}
              placeholder={selectedCustomer ? "Defaults to the customer's address" : "Customer name, street, city, country"}
            />
          </FormField>
          <FormField label="Delivery address" htmlFor="deliveryAddress" hint="If different from billing">
            <Textarea
              id="deliveryAddress"
              name="deliveryAddress"
              rows={3}
              value={deliveryAddress}
              onChange={(e) => setDeliveryAddress(e.target.value)}
              placeholder="Leave blank if same as billing"
            />
          </FormField>
          {selectedCustomer && (
            <div className="col-span-full flex flex-wrap gap-x-6 gap-y-1 rounded-md bg-workspace px-3 py-2 text-xs text-text-secondary">
              {selectedCustomer.email && <span>Email: {selectedCustomer.email}</span>}
              {selectedCustomer.phone && <span>Phone: {selectedCustomer.phone}</span>}
              {selectedCustomer.tax_number && <span>VAT: {selectedCustomer.tax_number}</span>}
              {selectedCustomer.credit_limit != null && (
                <span className="text-primary-700">
                  Credit limit ${selectedCustomer.credit_limit.toFixed(2)} — issuing checks the open balance against it.
                </span>
              )}
            </div>
          )}
        </div>
      </Card>

      {/* ---- Line items ---- */}
      <Card>
        <CardHeader title="Line items" />
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead>
              <tr className="border-b border-border-subtle text-left text-xs font-medium uppercase tracking-wide text-text-tertiary">
                <th className="px-4 py-2">Item</th>
                <th className="px-2 py-2">Description</th>
                <th className="px-2 py-2 w-20">Qty</th>
                <th className="px-2 py-2 w-20">Unit</th>
                <th className="px-2 py-2 w-24">Price</th>
                <th className="px-2 py-2 w-24">Discount</th>
                <th className="px-2 py-2 w-20">Tax %</th>
                <th className="px-2 py-2 w-24 text-right">Total</th>
                <th className="px-2 py-2 w-10" />
              </tr>
            </thead>
            <tbody>
              {lines.map((item) => {
                const product = products.find((p) => p.id === item.product_id);
                const lowStock = product != null && product.totalStock < item.quantity;
                return (
                  <tr key={item.key} className="border-b border-border-subtle align-top last:border-b-0">
                    <td className="px-4 py-2">
                      <Select value={item.product_id} onChange={(e) => onProductSelect(item.key, e.target.value)}>
                        <option value="">Custom line</option>
                        {products.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.sku} — {p.name} (${p.selling_price.toFixed(2)})
                          </option>
                        ))}
                      </Select>
                      {item.sku && <p className="mt-1 font-mono text-[11px] text-text-tertiary">{item.sku}</p>}
                      {product && (
                        <p className={`mt-0.5 text-[11px] ${lowStock ? "font-medium text-warning-600" : "text-text-tertiary"}`}>
                          {product.totalStock} in stock{lowStock ? " — below quantity" : ""}
                        </p>
                      )}
                    </td>
                    <td className="px-2 py-2">
                      <Input
                        value={item.description}
                        onChange={(e) => updateItem(item.key, { description: e.target.value })}
                        placeholder="Line description"
                      />
                    </td>
                    <td className="px-2 py-2">
                      <Input
                        type="number"
                        min="0.01"
                        step="0.01"
                        value={item.quantity}
                        onChange={(e) => updateItem(item.key, { quantity: Number(e.target.value) })}
                      />
                    </td>
                    <td className="px-2 py-2">
                      <Input
                        value={item.unit}
                        onChange={(e) => updateItem(item.key, { unit: e.target.value })}
                        placeholder="each"
                      />
                    </td>
                    <td className="px-2 py-2">
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.unit_price}
                        onChange={(e) => updateItem(item.key, { unit_price: Number(e.target.value) })}
                      />
                    </td>
                    <td className="px-2 py-2">
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.discount}
                        onChange={(e) => updateItem(item.key, { discount: Math.max(0, Number(e.target.value)) })}
                      />
                    </td>
                    <td className="px-2 py-2">
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.tax_rate ?? ""}
                        placeholder={String(taxRatePercent)}
                        onChange={(e) =>
                          updateItem(item.key, { tax_rate: e.target.value === "" ? null : Number(e.target.value) })
                        }
                      />
                    </td>
                    <td className="px-2 py-2 text-right font-medium text-text-primary">
                      ${(item.net + item.tax).toFixed(2)}
                    </td>
                    <td className="px-2 py-2 text-right">
                      <button
                        type="button"
                        onClick={() => removeItem(item.key)}
                        disabled={items.length === 1}
                        className="text-text-tertiary hover:text-danger-600 disabled:opacity-30"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col gap-4 p-4">
          <Button type="button" variant="secondary" size="sm" onClick={addItem} className="w-fit">
            <Plus className="size-4" />
            Add line
          </Button>

          {/* ---- Totals ---- */}
          <div className="ml-auto flex w-72 flex-col gap-1 border-t border-border-subtle pt-3 text-sm">
            <div className="flex justify-between text-text-secondary">
              <span>Subtotal</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            {lineDiscounts > 0 && (
              <div className="flex justify-between text-xs text-text-tertiary">
                <span>Line discounts (incl. above)</span>
                <span>-${lineDiscounts.toFixed(2)}</span>
              </div>
            )}
            <div className="flex items-center justify-between text-text-secondary">
              <span>Invoice discount</span>
              <span className="flex items-center gap-1">
                -$
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={discountTotal}
                  onChange={(e) => setDiscountTotal(Math.max(0, Number(e.target.value)))}
                  className="w-20 rounded border border-border bg-transparent px-1.5 py-0.5 text-right text-sm"
                />
              </span>
            </div>
            {discountTotal > 0 && (
              <Input
                value={discountReason}
                onChange={(e) => setDiscountReason(e.target.value)}
                placeholder="Discount reason (optional)"
                className="mt-1"
              />
            )}
            {shippingTotal > 0 && (
              <div className="flex justify-between text-text-secondary">
                <span>Shipping</span>
                <span>${shippingTotal.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-text-secondary">
              <span>Tax</span>
              <span>${taxTotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between border-t border-border-subtle pt-1.5 font-semibold text-text-primary">
              <span>Total</span>
              <span>${total.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </Card>

      <FormField label="Notes" htmlFor="notes" hint="Printed on the invoice — payment instructions, terms, thanks">
        <Textarea id="notes" name="notes" placeholder="Optional" defaultValue={initial?.notes ?? undefined} />
      </FormField>

      {state.error && <p className="text-sm text-danger-600">{state.error}</p>}

      {initial ? (
        <div className="flex justify-end gap-2">
          <Button type="submit" loading={isPending}>
            Save changes
          </Button>
        </div>
      ) : (
        <div className="flex justify-end gap-2">
          <Button type="submit" name="saveAs" value="draft" variant="secondary" loading={isPending}>
            Save as draft
          </Button>
          <Button type="submit" name="saveAs" value="quote" variant="secondary" loading={isPending}>
            Save as quotation
          </Button>
          <Button type="submit" name="saveAs" value="issued" loading={isPending}>
            Issue invoice
          </Button>
        </div>
      )}
    </form>
  );
}
