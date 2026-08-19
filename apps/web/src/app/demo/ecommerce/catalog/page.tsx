"use client";

import { useState } from "react";
import { Plus, Store } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/Card";
import { Badge } from "@/components/Badge";
import { Button } from "@/components/Button";
import { EmptyState } from "@/components/EmptyState";
import { Modal } from "@/components/Modal";
import { Input, Select } from "@/components/Input";
import { FormField } from "@/components/FormField";
import { useDemo } from "@/lib/demo/DemoContext";
import { useToast } from "@/components/Toast";

function PublishProductModal({ onClose }: { onClose: () => void }) {
  const { products, publishOnlineProduct } = useDemo();
  const { push } = useToast();
  const [productName, setProductName] = useState(products[0]?.name ?? "");
  const [slug, setSlug] = useState("");
  const [onlinePrice, setOnlinePrice] = useState("0");

  return (
    <Modal open onClose={onClose} title="Publish product online">
      <form
        className="flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          if (!productName || !slug.trim()) return;
          publishOnlineProduct({ productName, slug: slug.trim(), onlinePrice: Number(onlinePrice) || 0 });
          push("Product published to online catalog");
          onClose();
        }}
      >
        <FormField label="Product" htmlFor="productName" required>
          <Select id="productName" value={productName} onChange={(e) => setProductName(e.target.value)}>
            {products.map((p) => (
              <option key={p.id} value={p.name}>
                {p.name}
              </option>
            ))}
          </Select>
        </FormField>
        <div className="grid grid-cols-2 gap-4">
          <FormField label="URL slug" htmlFor="slug" required>
            <Input id="slug" required value={slug} onChange={(e) => setSlug(e.target.value)} />
          </FormField>
          <FormField label="Online price" htmlFor="onlinePrice">
            <Input id="onlinePrice" type="number" min="0" step="0.01" value={onlinePrice} onChange={(e) => setOnlinePrice(e.target.value)} />
          </FormField>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit">Publish</Button>
        </div>
      </form>
    </Modal>
  );
}

export default function DemoOnlineCatalogPage() {
  const { onlineProducts, toggleOnlineProductPublished } = useDemo();
  const [open, setOpen] = useState(false);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <PageHeader module="Ecommerce" title="Online Catalog" />
        <Button onClick={() => setOpen(true)}>
          <Plus className="size-4" />
          Publish Product
        </Button>
      </div>

      <Card>
        {onlineProducts.length === 0 ? (
          <EmptyState icon={Store} title="No products published online yet" />
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border-subtle text-left text-xs font-medium uppercase tracking-wide text-text-tertiary">
                <th className="px-4 py-2.5">Product</th>
                <th className="px-4 py-2.5">Slug</th>
                <th className="px-4 py-2.5">Online price</th>
                <th className="px-4 py-2.5">Status</th>
                <th className="px-4 py-2.5" />
              </tr>
            </thead>
            <tbody>
              {onlineProducts.map((p) => (
                <tr key={p.id} className="border-b border-border-subtle last:border-b-0">
                  <td className="px-4 py-2.5 font-medium text-text-primary">{p.productName}</td>
                  <td className="px-4 py-2.5 font-mono text-text-secondary">{p.slug}</td>
                  <td className="px-4 py-2.5 text-text-secondary">${p.onlinePrice.toFixed(2)}</td>
                  <td className="px-4 py-2.5">
                    <Badge tone={p.isPublished ? "success" : "neutral"}>{p.isPublished ? "Published" : "Hidden"}</Badge>
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <Button size="sm" variant="secondary" onClick={() => toggleOnlineProductPublished(p.id)}>
                      {p.isPublished ? "Unpublish" : "Publish"}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      {open && <PublishProductModal onClose={() => setOpen(false)} />}
    </div>
  );
}
