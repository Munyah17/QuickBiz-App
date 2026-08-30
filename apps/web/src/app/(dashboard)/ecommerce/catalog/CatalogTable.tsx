"use client";

import { useMemo, useState, useTransition } from "react";
import { Store } from "lucide-react";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { Badge } from "@/components/Badge";
import { EmptyState } from "@/components/EmptyState";
import { SearchInput } from "@/components/SearchInput";
import { Select } from "@/components/Input";
import { ExportButton } from "@/components/ExportButton";
import { useToast } from "@/components/Toast";
import { TogglePublishButton } from "./TogglePublishButton";
import { bulkSetOnlineProductPublishedAction } from "./actions";
import type { OnlineProductRow } from "@/services/ecommerce";

export function CatalogTable({ onlineProducts, canManage }: { onlineProducts: OnlineProductRow[]; canManage: boolean }) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [isBulkPending, startBulkTransition] = useTransition();
  const { push } = useToast();

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return onlineProducts.filter((p) => {
      if (statusFilter === "published" && !p.is_published) return false;
      if (statusFilter === "hidden" && p.is_published) return false;
      if (!q) return true;
      return [p.productName, p.productSku, p.slug].some((field) => field?.toLowerCase().includes(q));
    });
  }, [onlineProducts, query, statusFilter]);

  const allFilteredSelected = filtered.length > 0 && filtered.every((p) => selected.has(p.id));

  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    setSelected(allFilteredSelected ? new Set() : new Set(filtered.map((p) => p.id)));
  }

  function runBulk(isPublished: boolean) {
    const ids = Array.from(selected);
    startBulkTransition(async () => {
      const result = await bulkSetOnlineProductPublishedAction(ids, isPublished);
      if (result.success) {
        push(`${ids.length} product${ids.length === 1 ? "" : "s"} ${isPublished ? "published" : "hidden"}`);
        setSelected(new Set());
      } else if (result.error) {
        push(result.error, "error");
      }
    });
  }

  return (
    <Card>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border-subtle px-4 py-3">
        <h3 className="text-sm font-semibold text-text-primary">
          {filtered.length} of {onlineProducts.length} published products
        </h3>
        <div className="flex flex-1 items-center justify-end gap-2">
          <SearchInput value={query} onChange={setQuery} placeholder="Search name, SKU, slug..." />
          <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-36">
            <option value="all">All statuses</option>
            <option value="published">Published</option>
            <option value="hidden">Hidden</option>
          </Select>
          <ExportButton
            filename="online-catalog"
            rows={filtered.map((p) => ({
              Product: p.productName,
              SKU: p.productSku,
              Slug: p.slug,
              "Online price": p.online_price ?? p.basePrice,
              Status: p.is_published ? "Published" : "Hidden",
            }))}
          />
        </div>
      </div>

      {canManage && selected.size > 0 && (
        <div className="flex items-center gap-3 border-b border-border-subtle bg-primary-50 px-4 py-2.5">
          <span className="text-sm font-medium text-text-primary">{selected.size} selected</span>
          <Button size="sm" variant="secondary" loading={isBulkPending} onClick={() => runBulk(true)}>
            Publish
          </Button>
          <Button size="sm" variant="secondary" loading={isBulkPending} onClick={() => runBulk(false)}>
            Hide
          </Button>
          <button type="button" onClick={() => setSelected(new Set())} className="ml-auto text-sm text-text-tertiary hover:text-text-primary">
            Clear selection
          </button>
        </div>
      )}

      {onlineProducts.length === 0 ? (
        <EmptyState icon={Store} title="No products published online yet" />
      ) : filtered.length === 0 ? (
        <EmptyState icon={Store} title="No products match your search" />
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border-subtle text-left text-xs font-medium uppercase tracking-wide text-text-tertiary">
              {canManage && (
                <th className="w-10 px-4 py-2.5">
                  <input type="checkbox" checked={allFilteredSelected} onChange={toggleAll} className="size-4 rounded border-border" />
                </th>
              )}
              <th className="px-4 py-2.5">Product</th>
              <th className="px-4 py-2.5">Slug</th>
              <th className="px-4 py-2.5">Online price</th>
              <th className="px-4 py-2.5">Status</th>
              {canManage && <th className="px-4 py-2.5" />}
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => (
              <tr key={p.id} className="border-b border-border-subtle last:border-b-0">
                {canManage && (
                  <td className="px-4 py-2.5">
                    <input
                      type="checkbox"
                      checked={selected.has(p.id)}
                      onChange={() => toggleOne(p.id)}
                      className="size-4 rounded border-border"
                    />
                  </td>
                )}
                <td className="px-4 py-2.5">
                  <p className="font-medium text-text-primary">{p.productName}</p>
                  <p className="text-xs text-text-tertiary">{p.productSku}</p>
                </td>
                <td className="px-4 py-2.5 font-mono text-text-secondary">{p.slug}</td>
                <td className="px-4 py-2.5 text-text-secondary">${(p.online_price ?? p.basePrice).toFixed(2)}</td>
                <td className="px-4 py-2.5">
                  <Badge tone={p.is_published ? "success" : "neutral"}>{p.is_published ? "Published" : "Hidden"}</Badge>
                </td>
                {canManage && (
                  <td className="px-4 py-2.5 text-right">
                    <TogglePublishButton onlineProductId={p.id} isPublished={p.is_published} />
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Card>
  );
}
