"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { Search, Plus, Minus, Trash2, ShoppingCart } from "lucide-react";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { Select } from "@/components/Input";
import { useToast } from "@/components/Toast";
import { checkoutAction, initialPosActionState } from "./actions";
import type { ProductWithStock } from "@/services/products";
import type { Customer } from "@/services/customers";
import type { InvoiceDetail } from "@/services/sales";
import { PAYMENT_METHODS } from "@/config/paymentMethods";
import { ReceiptModal } from "./ReceiptModal";

interface CartLine {
  productId: string;
  name: string;
  unitPrice: number;
  quantity: number;
  availableStock: number;
}

// Wrapper owns a remount key instead of the inner form calling setCart([])
// from an effect — bumping the key on a successful sale resets ALL of the
// inner form's local state (cart, search, customer, payment method) via a
// fresh mount, which is also better UX than partially resetting.
export function POSCheckout(props: {
  branchId: string;
  warehouseId: string;
  sessionId: string;
  products: ProductWithStock[];
  customers: Customer[];
  taxRatePercent: number;
  orgName: string;
  cashierName: string;
}) {
  const [saleKey, setSaleKey] = useState(0);
  const [receipt, setReceipt] = useState<InvoiceDetail | null>(null);
  return (
    <>
      <POSCheckoutForm
        key={saleKey}
        {...props}
        onSaleComplete={(r) => {
          setReceipt(r);
          setSaleKey((k) => k + 1);
        }}
      />
      {receipt && <ReceiptModal receipt={receipt} orgName={props.orgName} cashierName={props.cashierName} onClose={() => setReceipt(null)} />}
    </>
  );
}

function POSCheckoutForm({
  branchId,
  warehouseId,
  sessionId,
  products,
  customers,
  taxRatePercent,
  onSaleComplete,
}: {
  branchId: string;
  warehouseId: string;
  sessionId: string;
  products: ProductWithStock[];
  customers: Customer[];
  taxRatePercent: number;
  onSaleComplete: (receipt: InvoiceDetail | null) => void;
}) {
  const [state, formAction, isPending] = useActionState(checkoutAction, initialPosActionState);
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<CartLine[]>([]);
  const [customerId, setCustomerId] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const { push } = useToast();

  useEffect(() => {
    if (state.success) {
      push("Sale completed");
      onSaleComplete(state.receipt ?? null);
    }
    if (state.error) push(state.error, "error");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.success, state.error]);

  const filtered = useMemo(
    () =>
      products.filter(
        (p) => p.is_active && (p.name.toLowerCase().includes(search.toLowerCase()) || p.sku.toLowerCase().includes(search.toLowerCase()))
      ),
    [products, search]
  );

  function addToCart(product: ProductWithStock) {
    setCart((prev) => {
      const existing = prev.find((l) => l.productId === product.id);
      if (existing) {
        return prev.map((l) => (l.productId === product.id ? { ...l, quantity: l.quantity + 1 } : l));
      }
      return [...prev, { productId: product.id, name: product.name, unitPrice: product.selling_price, quantity: 1, availableStock: product.totalStock }];
    });
  }

  function updateQty(productId: string, delta: number) {
    setCart((prev) =>
      prev
        .map((l) => (l.productId === productId ? { ...l, quantity: Math.max(0, l.quantity + delta) } : l))
        .filter((l) => l.quantity > 0)
    );
  }

  function removeLine(productId: string) {
    setCart((prev) => prev.filter((l) => l.productId !== productId));
  }

  const subtotal = cart.reduce((sum, l) => sum + l.unitPrice * l.quantity, 0);
  const taxTotal = Math.round(subtotal * (taxRatePercent / 100) * 100) / 100;
  const total = subtotal + taxTotal;

  const itemsPayload = JSON.stringify(
    cart.map((l) => ({ product_id: l.productId, description: l.name, quantity: l.quantity, unit_price: l.unitPrice }))
  );

  return (
    <div className="grid h-[calc(100vh-8rem)] grid-cols-1 gap-4 lg:grid-cols-3">
      <div className="flex flex-col gap-3 lg:col-span-2">
        <div className="flex h-9 items-center gap-2 rounded-md border border-border bg-white px-3">
          <Search className="size-4 shrink-0 text-text-tertiary" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products or scan barcode..."
            className="w-full bg-transparent text-sm focus:outline-none"
            autoFocus
          />
        </div>
        <div className="grid flex-1 grid-cols-2 gap-3 overflow-y-auto sm:grid-cols-3 xl:grid-cols-4">
          {filtered.map((product) => (
            <button
              key={product.id}
              onClick={() => addToCart(product)}
              disabled={product.totalStock <= 0}
              className="flex flex-col items-start gap-1 rounded-md border border-border bg-white p-3 text-left hover:border-primary-500 hover:shadow-card disabled:cursor-not-allowed disabled:opacity-40"
            >
              <span className="text-sm font-medium text-text-primary">{product.name}</span>
              <span className="text-xs text-text-tertiary">{product.sku}</span>
              <span className="mt-auto text-sm font-semibold text-primary-600">${product.selling_price.toFixed(2)}</span>
              <span className="text-xs text-text-tertiary">{product.totalStock} in stock</span>
            </button>
          ))}
          {filtered.length === 0 && (
            <p className="col-span-full py-12 text-center text-sm text-text-tertiary">No products match your search.</p>
          )}
        </div>
      </div>

      <Card className="flex flex-col">
        <div className="flex items-center gap-2 border-b border-border-subtle px-4 py-3">
          <ShoppingCart className="size-4 text-text-secondary" />
          <h3 className="text-sm font-semibold text-text-primary">Current sale</h3>
        </div>

        <div className="flex-1 overflow-y-auto p-3">
          {cart.length === 0 ? (
            <p className="py-8 text-center text-sm text-text-tertiary">Cart is empty</p>
          ) : (
            <div className="flex flex-col gap-2">
              {cart.map((line) => (
                <div key={line.productId} className="flex items-center gap-2 rounded-md border border-border-subtle p-2">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-text-primary">{line.name}</p>
                    <p className="text-xs text-text-tertiary">${line.unitPrice.toFixed(2)} each</p>
                  </div>
                  <button type="button" onClick={() => updateQty(line.productId, -1)} className="text-text-tertiary hover:text-primary-600">
                    <Minus className="size-3.5" />
                  </button>
                  <span className="w-6 text-center text-sm">{line.quantity}</span>
                  <button type="button" onClick={() => updateQty(line.productId, 1)} className="text-text-tertiary hover:text-primary-600">
                    <Plus className="size-3.5" />
                  </button>
                  <span className="w-16 text-right text-sm font-medium text-text-primary">${(line.unitPrice * line.quantity).toFixed(2)}</span>
                  <button type="button" onClick={() => removeLine(line.productId)} className="text-text-tertiary hover:text-danger-600">
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <form action={formAction} className="flex flex-col gap-3 border-t border-border-subtle p-4">
          <input type="hidden" name="branchId" value={branchId} />
          <input type="hidden" name="warehouseId" value={warehouseId} />
          <input type="hidden" name="sessionId" value={sessionId} />
          <input type="hidden" name="items" value={itemsPayload} />
          <input type="hidden" name="taxTotal" value={taxTotal} />

          <Select value={customerId} onChange={(e) => setCustomerId(e.target.value)} name="customerId">
            <option value="">Walk-in customer</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>

          <Select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} name="paymentMethod">
            {PAYMENT_METHODS.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </Select>

          <div className="flex flex-col gap-1 text-sm">
            <div className="flex justify-between text-text-secondary">
              <span>Subtotal</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-text-secondary">
              <span>Tax ({taxRatePercent}%)</span>
              <span>${taxTotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-base font-semibold text-text-primary">
              <span>Total</span>
              <span>${total.toFixed(2)}</span>
            </div>
          </div>

          <Button type="submit" size="md" loading={isPending} disabled={cart.length === 0} className="h-11 text-base">
            Charge ${total.toFixed(2)}
          </Button>
        </form>
      </Card>
    </div>
  );
}
