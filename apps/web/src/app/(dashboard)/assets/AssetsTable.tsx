"use client";

import { useMemo, useState, useTransition } from "react";
import { Package } from "lucide-react";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { EmptyState } from "@/components/EmptyState";
import { SearchInput } from "@/components/SearchInput";
import { Select } from "@/components/Input";
import { ExportButton } from "@/components/ExportButton";
import { useToast } from "@/components/Toast";
import { MaintenanceModal } from "./MaintenanceModal";
import { StatusSelect } from "./StatusSelect";
import { bulkSetAssetStatusAction } from "./actions";
import type { AssetRow } from "@/services/assets";

export function AssetsTable({ assets, canManage }: { assets: AssetRow[]; canManage: boolean }) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [isBulkPending, startBulkTransition] = useTransition();
  const { push } = useToast();

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return assets.filter((a) => {
      if (statusFilter !== "all" && a.status !== statusFilter) return false;
      if (categoryFilter !== "all" && a.category !== categoryFilter) return false;
      if (!q) return true;
      return [a.name, a.asset_number, a.location, a.branchName].some((field) => field?.toLowerCase().includes(q));
    });
  }, [assets, query, statusFilter, categoryFilter]);

  const totalValue = filtered.reduce((sum, a) => sum + a.currentValue, 0);
  const allFilteredSelected = filtered.length > 0 && filtered.every((a) => selected.has(a.id));

  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    setSelected(allFilteredSelected ? new Set() : new Set(filtered.map((a) => a.id)));
  }

  function runBulk(status: string) {
    const ids = Array.from(selected);
    startBulkTransition(async () => {
      const result = await bulkSetAssetStatusAction(ids, status);
      if (result.success) {
        push(`${ids.length} asset${ids.length === 1 ? "" : "s"} updated`);
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
          {filtered.length} of {assets.length} assets
        </h3>
        <div className="flex flex-1 items-center justify-end gap-2">
          <SearchInput value={query} onChange={setQuery} placeholder="Search name, asset #, location..." />
          <Select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="w-36">
            <option value="all">All categories</option>
            <option value="equipment">Equipment</option>
            <option value="computer">Computer</option>
            <option value="furniture">Furniture</option>
            <option value="other">Other</option>
          </Select>
          <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-36">
            <option value="all">All statuses</option>
            <option value="in_use">In use</option>
            <option value="in_maintenance">In maintenance</option>
            <option value="disposed">Disposed</option>
          </Select>
          <ExportButton
            filename="assets"
            rows={filtered.map((a) => ({
              "Asset #": a.asset_number,
              Name: a.name,
              Category: a.category,
              Branch: a.branchName ?? "",
              Location: a.location ?? "",
              "Purchase cost": a.purchase_cost,
              "Current value": a.currentValue,
              Status: a.status,
            }))}
          />
        </div>
      </div>

      {canManage && selected.size > 0 && (
        <div className="flex items-center gap-3 border-b border-border-subtle bg-primary-50 px-4 py-2.5">
          <span className="text-sm font-medium text-text-primary">{selected.size} selected</span>
          <Button size="sm" variant="secondary" loading={isBulkPending} onClick={() => runBulk("in_use")}>
            Mark In Use
          </Button>
          <Button size="sm" variant="secondary" loading={isBulkPending} onClick={() => runBulk("in_maintenance")}>
            Mark In Maintenance
          </Button>
          <Button size="sm" variant="secondary" loading={isBulkPending} onClick={() => runBulk("disposed")}>
            Mark Disposed
          </Button>
          <button type="button" onClick={() => setSelected(new Set())} className="ml-auto text-sm text-text-tertiary hover:text-text-primary">
            Clear selection
          </button>
        </div>
      )}

      {assets.length === 0 ? (
        <EmptyState icon={Package} title="No assets yet" />
      ) : filtered.length === 0 ? (
        <EmptyState icon={Package} title="No assets match your search" />
      ) : (
        <>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border-subtle text-left text-xs font-medium uppercase tracking-wide text-text-tertiary">
                {canManage && (
                  <th className="w-10 px-4 py-2.5">
                    <input type="checkbox" checked={allFilteredSelected} onChange={toggleAll} className="size-4 rounded border-border" />
                  </th>
                )}
                <th className="px-4 py-2.5">Asset #</th>
                <th className="px-4 py-2.5">Name</th>
                <th className="px-4 py-2.5">Category</th>
                <th className="px-4 py-2.5">Branch</th>
                <th className="px-4 py-2.5">Purchase cost</th>
                <th className="px-4 py-2.5">Current value</th>
                <th className="px-4 py-2.5">Status</th>
                {canManage && <th className="px-4 py-2.5" />}
              </tr>
            </thead>
            <tbody>
              {filtered.map((asset) => (
                <tr key={asset.id} className="border-b border-border-subtle last:border-b-0">
                  {canManage && (
                    <td className="px-4 py-2.5">
                      <input
                        type="checkbox"
                        checked={selected.has(asset.id)}
                        onChange={() => toggleOne(asset.id)}
                        className="size-4 rounded border-border"
                      />
                    </td>
                  )}
                  <td className="px-4 py-2.5 font-mono text-text-secondary">{asset.asset_number}</td>
                  <td className="px-4 py-2.5 font-medium text-text-primary">{asset.name}</td>
                  <td className="px-4 py-2.5 capitalize text-text-secondary">{asset.category}</td>
                  <td className="px-4 py-2.5 text-text-secondary">{asset.branchName ?? "No branch"}</td>
                  <td className="px-4 py-2.5 text-text-secondary">${asset.purchase_cost.toFixed(2)}</td>
                  <td className="px-4 py-2.5 text-text-secondary">${asset.currentValue.toFixed(2)}</td>
                  <td className="px-4 py-2.5">
                    {canManage ? (
                      <StatusSelect assetId={asset.id} status={asset.status} />
                    ) : (
                      <span className="capitalize text-text-secondary">{asset.status.replace("_", " ")}</span>
                    )}
                  </td>
                  {canManage && (
                    <td className="px-4 py-2.5 text-right">
                      <MaintenanceModal assetId={asset.id} assetName={asset.name} />
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
          <div className="flex justify-end border-t border-border-subtle p-4 text-sm font-semibold text-text-primary">
            Total current value: ${totalValue.toFixed(2)}
          </div>
        </>
      )}
    </Card>
  );
}
