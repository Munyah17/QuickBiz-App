"use client";

import { useState } from "react";
import { Plus, Package } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/Card";
import { Badge } from "@/components/Badge";
import { Button } from "@/components/Button";
import { EmptyState } from "@/components/EmptyState";
import { Modal } from "@/components/Modal";
import { Input } from "@/components/Input";
import { FormField } from "@/components/FormField";
import { useDemo } from "@/lib/demo/DemoContext";
import { useToast } from "@/components/Toast";

function AddProductModal({ onClose }: { onClose: () => void }) {
  const { addProduct } = useDemo();
  const { push } = useToast();
  const [sku, setSku] = useState("");
  const [name, setName] = useState("");
  const [costPrice, setCostPrice] = useState("0");
  const [sellingPrice, setSellingPrice] = useState("0");
  const [stockOnHand, setStockOnHand] = useState("0");

  return (
    <Modal open onClose={onClose} title="Add product">
      <form
        className="flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          if (!sku.trim() || !name.trim()) return;
          addProduct({
            sku: sku.trim(),
            name: name.trim(),
            costPrice: Number(costPrice) || 0,
            sellingPrice: Number(sellingPrice) || 0,
            stockOnHand: Number(stockOnHand) || 0,
          });
          push("Product added");
          onClose();
        }}
      >
        <div className="grid grid-cols-2 gap-4">
          <FormField label="SKU" htmlFor="sku" required>
            <Input id="sku" required value={sku} onChange={(e) => setSku(e.target.value)} />
          </FormField>
          <FormField label="Name" htmlFor="name" required>
            <Input id="name" required value={name} onChange={(e) => setName(e.target.value)} />
          </FormField>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <FormField label="Cost price" htmlFor="costPrice">
            <Input id="costPrice" type="number" min="0" step="0.01" value={costPrice} onChange={(e) => setCostPrice(e.target.value)} />
          </FormField>
          <FormField label="Selling price" htmlFor="sellingPrice">
            <Input id="sellingPrice" type="number" min="0" step="0.01" value={sellingPrice} onChange={(e) => setSellingPrice(e.target.value)} />
          </FormField>
          <FormField label="Stock on hand" htmlFor="stockOnHand">
            <Input id="stockOnHand" type="number" min="0" step="1" value={stockOnHand} onChange={(e) => setStockOnHand(e.target.value)} />
          </FormField>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit">Add product</Button>
        </div>
      </form>
    </Modal>
  );
}

export default function DemoProductsPage() {
  const { products } = useDemo();
  const [open, setOpen] = useState(false);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <PageHeader module="Inventory" title="Products" />
        <Button onClick={() => setOpen(true)}>
          <Plus className="size-4" />
          Add Product
        </Button>
      </div>

      <Card>
        {products.length === 0 ? (
          <EmptyState icon={Package} title="No products yet" />
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border-subtle text-left text-xs font-medium uppercase tracking-wide text-text-tertiary">
                <th className="px-4 py-2.5">SKU</th>
                <th className="px-4 py-2.5">Name</th>
                <th className="px-4 py-2.5">Cost</th>
                <th className="px-4 py-2.5">Selling price</th>
                <th className="px-4 py-2.5">Stock</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id} className="border-b border-border-subtle last:border-b-0">
                  <td className="px-4 py-2.5 font-mono text-text-secondary">{p.sku}</td>
                  <td className="px-4 py-2.5 font-medium text-text-primary">{p.name}</td>
                  <td className="px-4 py-2.5 text-text-secondary">${p.costPrice.toFixed(2)}</td>
                  <td className="px-4 py-2.5 text-text-secondary">${p.sellingPrice.toFixed(2)}</td>
                  <td className="px-4 py-2.5">
                    <Badge tone={p.stockOnHand <= 10 ? "warning" : "neutral"}>{p.stockOnHand} on hand</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      {open && <AddProductModal onClose={() => setOpen(false)} />}
    </div>
  );
}
