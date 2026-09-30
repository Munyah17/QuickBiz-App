"use client";

import { useActionState, useEffect, useMemo, useState, useTransition } from "react";
import { Search, Plus, Minus, Trash2, ShoppingCart, PauseCircle, PlayCircle } from "lucide-react";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { Input, Select } from "@/components/Input";
import { useToast } from "@/components/Toast";
import { checkoutAction, holdOrderAction, deleteHeldOrderAction, initialPosActionState } from "./actions";
import type { ProductWithStock } from "@/services/products";
import type { Customer } from "@/services/customers";
import type { InvoiceDetail } from "@/services/sales";
import type { HeldOrder } from "@/services/pos";
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
  registerId: string;
  products: ProductWithStock[];
  customers: Customer[];
  heldOrders: HeldOrder[];
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
  registerId,
  products,
  customers,
  heldOrders,
  taxRatePercent,
  onSaleComplete,
}: {
  branchId: string;
  warehouseId: string;
  sessionId: string;
  registerId: string;
  products: ProductWithStock[];
  customers: Customer[];
  heldOrders: HeldOrder[];
  taxRatePercent: number;
  onSaleComplete: (receipt: InvoiceDetail | null) => void;
}) {
  const [state, formAction, isPending] = useActionState(checkoutAction, initialPosActionState);
  const [holdState, holdAction, isHolding] = useActionState(holdOrderAction, initialPosActionState);
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<CartLine[]>([]);
  const [customerId, setCustomerId] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [discount, setDiscount] = useState(0);
  const [discountReason, setDiscountReason] = useState("");
  const [splitTender, setSplitTender] = useState(false);
  const [paymentMethod2, setPaymentMethod2] = useState("ecocash");
  const [paymentAmount2, setPaymentAmount2] = useState(0);
  const [showHeld, setShowHeld] = useState(false);
  const [isResuming, startResumeTransition] = useTransition();
  const { push } = useToast();

  useEffect(() => {
    if (state.success) {
      push("Sale completed");
      onSaleComplete(state.receipt ?? null);
    }
    if (state.error) push(state.error, "error");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.success, state.error]);

  useEffect(() => {
    if (holdState.success) {
      push("Order held");
      // Remount the form to clear the cart — same mechanism as a completed sale.
      onSaleComplete(null);
    }
    if (holdState.error) push(holdState.error, "error");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [holdState.success, holdState.error]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return products.filter(
      (p) =>
        p.is_active &&
        (p.name.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q) ||
          (p.barcode !== null && p.barcode.toLowerCase() === q))
    );
  }, [products, search]);

  // Barcode scanners type the code then send Enter — an exact barcode or
  // SKU match on Enter adds the item and clears for the next scan.
  function onSearchKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key !== "Enter") return;
    e.preventDefault();
    const q = search.trim().toLowerCase();
    if (!q) return;
    const exact = products.find(
      (p) =>
        p.is_active &&
        ((p.barcode !== null && p.barcode.toLowerCase() === q) || p.sku.toLowerCase() === q)
    );
    if (exact) {
      addToCart(exact);
      setSearch("");
    }
  }

  function addToCart(product: ProductWithStock) {
    setCart((prev) => {
      const existing = prev.find((l) => l.productId === product.id);
      if (existing) {
        return prev.map((l) => (l.productId === product.id ? { ...l, quantity: l.quantity + 1 } : l));
      }
      return [...prev, { productId: product.id, name: product.name, unitPrice: product.selling_price, quantity: 1, availableStock: product.totalStock }];
    });
  }

  function setQty(productId: string, qty: number) {
    setCart((prev) =>
      prev
        .map((l) => (l.productId === productId ? { ...l, quantity: Math.floor(qty) } : l))
        .filter((l) => l.quantity > 0)
    );
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

  function resumeHeldOrder(held: HeldOrder) {
    startResumeTransition(async () => {
      const result = await deleteHeldOrderAction(initialPosActionState, (() => {
        const fd = new FormData();
        fd.set("heldOrderId", held.id);
        return fd;
      })());
      if (result.error) {
        push(result.error, "error");
        return;
      }
      setCart(
        held.cart.map((l) => ({
          productId: l.product_id,
          name: l.name,
          unitPrice: l.unit_price,
          quantity: l.quantity,
          availableStock: products.find((p) => p.id === l.product_id)?.totalStock ?? 0,
        }))
      );
      if (held.customer_id) setCustomerId(held.customer_id);
      setShowHeld(false);
      push("Order resumed");
    });
  }

  const subtotal = cart.reduce((sum, l) => sum + l.unitPrice * l.quantity, 0);
  const taxTotal = Math.round(subtotal * (taxRatePercent / 100) * 100) / 100;
  const total = Math.max(0, subtotal + taxTotal - discount);

  const itemsPayload = JSON.stringify(
    cart.map((l) => ({ product_id: l.productId, description: l.name, quantity: l.quantity, unit_price: l.unitPrice }))
  );
  const holdCartPayload = JSON.stringify(
    cart.map((l) => ({ product_id: l.productId, name: l.name, unit_price: l.unitPrice, quantity: l.quantity }))
  );

  return (
    <div className="grid grid-cols-1 gap-4 lg:h-[calc(100vh-8rem)] lg:grid-cols-3">
      <div className="flex min-h-0 flex-col gap-3 lg:col-span-2">
        <div className="flex items-center gap-2">
          <div className="flex h-9 flex-1 items-center gap-2 rounded-md border border-border bg-white px-3">
            <Search className="size-4 shrink-0 text-text-tertiary" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={onSearchKeyDown}
              placeholder="Search products or scan barcode..."
              className="w-full bg-transparent text-sm focus:outline-none"
              autoFocus
            />
          </div>
          <Button variant="secondary" size="sm" onClick={() => setShowHeld((v) => !v)} className="relative h-9">
            <PauseCircle className="size-4" />
            Held
            {heldOrders.length > 0 && (
              <span className="ml-1 rounded-full bg-primary-100 px-1.5 text-xs font-semibold text-primary-700">
                {heldOrders.length}
              </span>
            )}
          </Button>
        </div>

        {showHeld && heldOrders.length > 0 && (
          <Card className="flex flex-col gap-1 p-3">
            {heldOrders.map((held) => {
              const heldTotal = held.cart.reduce((s, l) => s + l.unit_price * l.quantity, 0);
              return (
                <div key={held.id} className="flex items-center gap-3 rounded-md border border-border-subtle px-3 py-2">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-text-primary">
                      {held.label || `Order #${held.id.slice(0, 6)}`}
                    </p>
                    <p className="text-xs text-text-tertiary">
                      {held.cart.length} item{held.cart.length === 1 ? "" : "s"} · ${heldTotal.toFixed(2)}
                      {held.held_by_name ? ` · ${held.held_by_name}` : ""}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => resumeHeldOrder(held)}
                    disabled={isResuming}
                    className="inline-flex items-center gap-1 text-sm font-medium text-primary-600 hover:underline disabled:opacity-50"
                  >
                    <PlayCircle className="size-4" />
                    Resume
                  </button>
                </div>
              );
            })}
          </Card>
        )}

        <div className="grid max-h-[55vh] flex-1 grid-cols-2 gap-3 overflow-y-auto sm:grid-cols-3 lg:max-h-none xl:grid-cols-4">
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
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={line.quantity}
                    onChange={(e) => setQty(line.productId, Number(e.target.value))}
                    className="w-12 rounded border border-border-subtle bg-transparent px-1 py-0.5 text-center text-sm"
                  />
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

        <div className="border-t border-border-subtle p-4">
          <div className="mb-3 flex items-end gap-2">
            <div className="flex-1">
              <label className="mb-1 block text-xs font-medium text-text-secondary">Discount ($)</label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={discount}
                onChange={(e) => setDiscount(Math.min(subtotal, Math.max(0, Number(e.target.value))))}
              />
            </div>
            {discount > 0 && (
              <div className="flex-1">
                <label className="mb-1 block text-xs font-medium text-text-secondary">Reason</label>
                <Input value={discountReason} onChange={(e) => setDiscountReason(e.target.value)} placeholder="e.g. Promo" />
              </div>
            )}
          </div>
        </div>

        <form action={formAction} className="flex flex-col gap-3 border-t border-border-subtle p-4">
          <input type="hidden" name="branchId" value={branchId} />
          <input type="hidden" name="warehouseId" value={warehouseId} />
          <input type="hidden" name="sessionId" value={sessionId} />
          <input type="hidden" name="items" value={itemsPayload} />
          <input type="hidden" name="taxTotal" value={taxTotal} />
          <input type="hidden" name="discountTotal" value={discount} />
          <input type="hidden" name="discountReason" value={discountReason} />
          {/* Hold-order fields — only read when the Hold button submits via formAction */}
          <input type="hidden" name="cart" value={holdCartPayload} />
          <input type="hidden" name="registerId" value={registerId} />

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

          <label className="flex items-center gap-2 text-xs font-medium text-text-secondary">
            <input
              type="checkbox"
              checked={splitTender}
              onChange={(e) => setSplitTender(e.target.checked)}
              className="size-4 rounded border-border"
            />
            Split payment across two tenders
          </label>

          {splitTender && (
            <div className="flex items-end gap-2">
              <div className="flex-1">
                <Select value={paymentMethod2} onChange={(e) => setPaymentMethod2(e.target.value)} name="paymentMethod2">
                  {PAYMENT_METHODS.filter((m) => m.value !== paymentMethod).map((m) => (
                    <option key={m.value} value={m.value}>
                      {m.label}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="w-28">
                <Input
                  type="number"
                  name="paymentAmount2"
                  min="0.01"
                  max={total}
                  step="0.01"
                  value={paymentAmount2}
                  onChange={(e) => setPaymentAmount2(Number(e.target.value))}
                  placeholder="Amount"
                />
              </div>
            </div>
          )}
          {!splitTender && <input type="hidden" name="paymentMethod2" value="" />}

          <div className="flex flex-col gap-1 text-sm">
            <div className="flex justify-between text-text-secondary">
              <span>Subtotal</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-text-secondary">
                <span>Discount</span>
                <span>-${discount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-text-secondary">
              <span>Tax ({taxRatePercent}%)</span>
              <span>${taxTotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-base font-semibold text-text-primary">
              <span>Total</span>
              <span>${total.toFixed(2)}</span>
            </div>
            {splitTender && paymentAmount2 > 0 && (
              <div className="flex justify-between text-xs text-text-tertiary">
                <span>First tender covers</span>
                <span>${(total - paymentAmount2).toFixed(2)}</span>
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <Button
              type="submit"
              formAction={holdAction}
              variant="secondary"
              loading={isHolding}
              disabled={cart.length === 0}
              className="flex-1"
            >
              <PauseCircle className="size-4" />
              Hold
            </Button>
            <Button type="submit" size="md" loading={isPending} disabled={cart.length === 0} className="h-11 flex-[2] text-base">
              Charge ${total.toFixed(2)}
            </Button>
          </div>
        </form>

        {/* Hidden hold form fields piggyback on the checkout form via formAction;
            hold needs its own payload names though — provided via form data above. */}
      </Card>
    </div>
  );
}
