"use client";

import { useState } from "react";
import { ShoppingCart, X } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardHeader } from "@/components/Card";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { FormField } from "@/components/FormField";
import { useDemo } from "@/lib/demo/DemoContext";
import { useToast } from "@/components/Toast";

export default function DemoPosPage() {
  const { products, customers, sales, createSale } = useDemo();
  const { push } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [openingFloat, setOpeningFloat] = useState("50");
  const [cart, setCart] = useState<Record<string, number>>({});

  const cartLines = Object.entries(cart)
    .map(([productId, quantity]) => ({ product: products.find((p) => p.id === productId), quantity }))
    .filter((l) => l.product && l.quantity > 0);
  const cartTotal = cartLines.reduce((sum, l) => sum + (l.product?.sellingPrice ?? 0) * l.quantity, 0);
  const registerSales = sales.filter((s) => s.customerName === "Walk-in Customer");
  const cashTotal = registerSales.reduce((sum, s) => sum + s.total, 0);

  if (!isOpen) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader module="Point of Sale" title="Register" />
        <Card className="max-w-sm p-6">
          <form
            className="flex flex-col gap-4"
            onSubmit={(e) => {
              e.preventDefault();
              setIsOpen(true);
              push("Register opened");
            }}
          >
            <FormField label="Opening float" htmlFor="float">
              <Input id="float" type="number" min="0" step="0.01" value={openingFloat} onChange={(e) => setOpeningFloat(e.target.value)} />
            </FormField>
            <Button type="submit">Open Register</Button>
          </form>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <PageHeader module="Point of Sale" title="Checkout" />
        <Button
          variant="secondary"
          onClick={() => {
            setIsOpen(false);
            setCart({});
            push(`Register closed. Cash sales: $${cashTotal.toFixed(2)}`);
          }}
        >
          Close Register
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Products" />
          <div className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-3">
            {products.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setCart((c) => ({ ...c, [p.id]: (c[p.id] ?? 0) + 1 }))}
                className="flex flex-col items-start rounded-md border border-border p-3 text-left hover:border-primary-400"
              >
                <span className="text-sm font-medium text-text-primary">{p.name}</span>
                <span className="text-xs text-text-tertiary">${p.sellingPrice.toFixed(2)}</span>
              </button>
            ))}
          </div>
        </Card>

        <Card>
          <CardHeader title="Cart" />
          <div className="flex flex-col gap-2 p-4">
            {cartLines.length === 0 ? (
              <p className="text-sm text-text-tertiary">Tap a product to add it.</p>
            ) : (
              cartLines.map((l) => (
                <div key={l.product?.id} className="flex items-center justify-between text-sm">
                  <span className="text-text-primary">
                    {l.quantity}x {l.product?.name}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-text-secondary">${((l.product?.sellingPrice ?? 0) * l.quantity).toFixed(2)}</span>
                    <button
                      type="button"
                      onClick={() => setCart((c) => ({ ...c, [l.product!.id]: 0 }))}
                      className="text-text-tertiary hover:text-danger-600"
                      aria-label="Remove"
                    >
                      <X className="size-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
            <div className="mt-2 flex items-center justify-between border-t border-border-subtle pt-2 text-sm font-semibold">
              <span>Total</span>
              <span>${cartTotal.toFixed(2)}</span>
            </div>
            <Button
              className="mt-2"
              disabled={cartLines.length === 0}
              onClick={() => {
                createSale("Walk-in Customer", cartLines.map((l) => ({ productId: l.product!.id, quantity: l.quantity })));
                setCart({});
                push("Sale completed");
              }}
            >
              <ShoppingCart className="size-4" />
              Charge ${cartTotal.toFixed(2)}
            </Button>
          </div>
        </Card>
      </div>

      <p className="text-xs text-text-tertiary">
        {customers.length} known customers - walk-in sales here are logged as &quot;Walk-in Customer&quot; and also appear on the Sales page.
      </p>
    </div>
  );
}
